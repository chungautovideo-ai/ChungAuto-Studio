"""Local SAM2 point-prompt video mask prototype. Does not edit projects or render video.

Output is object foreground, not semantic skin or verified human identity.
"""
import hashlib
import json
import math
import os
import subprocess
import sys
import time

os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['TRANSFORMERS_OFFLINE'] = '1'


def digest(file):
    h = hashlib.sha256()
    with open(file, 'rb') as stream:
        for block in iter(lambda: stream.read(1024*1024), b''):
            h.update(block)
    return h.hexdigest()


def encode(values):
    flat = values.reshape(-1).astype('uint8')
    runs = []
    start = 0
    for i in range(1, len(flat)+1):
        if i == len(flat) or flat[i] != flat[start]:
            runs.extend([i-start, int(flat[start])])
            start = i
    return runs


def main(config):
    import numpy as np
    from PIL import Image
    import torch
    from transformers import Sam2VideoModel, Sam2VideoProcessor

    source = config['source']
    start, duration, fps = config['from'], config['duration'], config.get('fps', 8)
    points = config['points']
    if not all(isinstance(v, (int, float)) and math.isfinite(v) for v in [start, duration, fps]) or start < 0 or not .2 <= duration <= 15 or not 1 <= fps <= 15 or duration*fps > 120:
        raise ValueError('Tracking supports 0.2–15s,1–15fps, maximum120frames.')
    if not isinstance(points, list) or not 1 <= len(points) <= 16 or any(not isinstance(p, list) or len(p) != 3 or any(not isinstance(n, (int, float)) or not math.isfinite(n) for n in p) or not 0 <= p[0] <= 1 or not 0 <= p[1] <= 1 or p[2] not in (0, 1) for p in points) or not any(p[2] == 1 for p in points):
        raise ValueError('Need1–16 normalized points [x,y,positive0or1], including a positive point.')
    if not torch.cuda.is_available():
        raise ValueError('This prototype requires a working CUDA runtime; no implicit CPU fallback.')
    model_dir = config['modelDir']
    model_hash = digest(os.path.join(model_dir, 'model.safetensors'))
    if model_hash != '48c14467e5cf9e51870511feb72c89688e82dd74523142c0538b663e193ac2a7':
        raise ValueError('SAM2 model hash mismatch.')
    source_hash = digest(source)
    started = time.monotonic()
    command = ['ffmpeg', '-nostdin', '-v', 'error', '-ss', str(start), '-i', source, '-t', str(duration), '-vf', f'fps={fps},scale=640:640:force_original_aspect_ratio=decrease', '-frames:v', '121', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-']
    decoded = subprocess.run(command, capture_output=True, timeout=60, check=True).stdout
    # JPEG frames are bounded by frame count and scaled to <=640 for CPU storage.
    frames = []
    import io
    offset = 0
    while True:
        a = decoded.find(b'\xff\xd8', offset)
        if a < 0:
            break
        b = decoded.find(b'\xff\xd9', a+2)
        if b < 0:
            raise ValueError('Truncated decoded frame.')
        frames.append(Image.open(io.BytesIO(decoded[a:b+2])).convert('RGB'))
        offset = b+2
        if len(frames) > 120:
            raise ValueError('Decoded frame limit exceeded.')
    if len(frames) < max(2, math.floor(duration*fps)-1):
        raise ValueError('Source does not cover the requested tracking range.')
    from person_shot_guard import shot_discontinuity
    from person_mask_guard import mask_transition
    shot = shot_discontinuity(frames)
    if shot['cutFrame'] is not None:
        raise ValueError(f'Possible scene cut at source time {start+shot["cutFrame"]/fps:.3f}; split the shot and select again. No mask committed.')
    processor = Sam2VideoProcessor.from_pretrained(model_dir, local_files_only=True)
    model = Sam2VideoModel.from_pretrained(model_dir, local_files_only=True).to('cuda', dtype=torch.bfloat16).eval()
    width, height = frames[0].size
    ratio = min(1, 256/max(width, height))
    mw, mh = max(2, round(width*ratio)), max(2, round(height*ratio))
    torch.cuda.reset_peak_memory_stats()
    with torch.inference_mode(), torch.autocast('cuda', dtype=torch.bfloat16):
        session = processor.init_video_session(video=frames, inference_device='cuda', processing_device='cpu', video_storage_device='cpu', dtype=torch.bfloat16)
        processor.add_inputs_to_inference_session(session, frame_idx=0, obj_ids=1, input_points=[[[[p[0]*width, p[1]*height] for p in points]]], input_labels=[[[p[2] for p in points]]])
        output = []
        quality = []
        previous_mask = None
        for result in model.propagate_in_video_iterator(session, start_frame_idx=0):
            mask = processor.post_process_masks([result.pred_masks], original_sizes=[[mh, mw]], binarize=True)[0].squeeze().cpu().numpy()
            fraction = float(mask.mean())
            score = float(result.object_score_logits.flatten()[0]) if result.object_score_logits is not None else None
            if result.frame_idx == 0:
                for x, y, label in points:
                    if bool(mask[min(mh-1, int(y*mh)), min(mw-1, int(x*mw))]) != bool(label):
                        raise ValueError('Initial mask does not match selected positive/negative points; select again.')
            if not .002 <= fraction <= .95 or score is not None and score <= 0:
                raise ValueError(f'Object lost or ambiguous at source time{start+result.frame_idx/fps:.3f}; no mask committed.')
            transition = None if previous_mask is None else mask_transition(previous_mask, mask)
            if transition is not None and transition['reason'] is not None:
                raise ValueError(f'Mask changed abruptly ({transition["reason"]}) at source time {start+result.frame_idx/fps:.3f}; split the range and select again. No mask committed.')
            output.append(encode(mask))
            quality.append({'frame': result.frame_idx, 'area': round(fraction, 6), 'objectLogit': score, 'transition': transition})
            previous_mask = mask.copy()
            print(json.dumps({'frame': result.frame_idx, 'total': len(frames)}), file=sys.stderr, flush=True)
    if len(output) != len(frames) or digest(source) != source_hash:
        raise ValueError('Incomplete tracking or source changed; no mask committed.')
    report = {'version': 1, 'method': 'sam2.1-tiny-point-prompt', 'sourceSha256': source_hash, 'modelSha256': model_hash, 'from': start, 'fps': fps, 'w': mw, 'h': mh, 'f': output, 'quality': quality, 'shotGuard': shot, 'maskGuard': {'method': 'adjacent-overlap-area-centroid-v1', 'identityVerified': False}, 'elapsedSeconds': round(time.monotonic()-started, 3), 'gpuPeakBytes': torch.cuda.max_memory_allocated(), 'requiresVisualReview': True, 'limits': 'Object foreground only, not skin or human identity; short continuous shot, no cut/occlusion recovery guarantee.'}
    target = config['output']
    temporary = target+'.tmp-'+str(os.getpid())
    try:
        with open(temporary, 'x', encoding='utf-8') as stream:
            json.dump(report, stream)
        os.replace(temporary, target)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    print(json.dumps({k: v for k, v in report.items() if k not in ('f', 'quality')}))


if __name__ == '__main__':
    try:
        with open(sys.argv[1], encoding='utf-8-sig') as stream:
            main(json.load(stream))
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
