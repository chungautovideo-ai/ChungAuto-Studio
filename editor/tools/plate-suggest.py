"""Read one source frame and suggest plate-like OCR regions. Never edits media/projects.

Requires the already installed RapidOCR package and local models. A missing hit does
not establish that no plate exists; text regions are proposals, not a plate detector.
"""
import json
import math
import re
import subprocess
import sys
import hashlib
from pathlib import Path


def digest(file):
    value = hashlib.sha256()
    with file.open('rb') as stream:
        for block in iter(lambda: stream.read(1024*1024), b''):
            value.update(block)
    return value.hexdigest()


def plate_like(text):
    compact = re.sub(r'[\s.·,\-]', '', str(text).upper())
    return bool(re.fullmatch(r'\d{2}[A-Z]{1,2}\d{4,6}', compact))


def proposals(rows, width, height):
    import numpy as np
    valid = []
    for box, text, score in rows or []:
        points = np.asarray(box, dtype=float)
        if points.shape != (4, 2) or not np.isfinite(points).all() or float(score) < .65:
            continue
        lo, hi = points.min(axis=0), points.max(axis=0)
        if (hi <= lo).any():
            continue
        valid.append((lo, hi, str(text), float(score)))
    candidates = []
    for lo, hi, text, score in valid:
        if plate_like(text):
            candidates.append((lo, hi, score))
    # Two-line Vietnamese plates: join only a plate prefix and a numeric line
    # directly below it with overlapping horizontal extent, never arbitrary text.
    for lo, hi, text, score in valid:
        prefix = re.sub(r'[\s.·,\-]', '', text.upper())
        if not re.fullmatch(r'\d{2}[A-Z]{1,2}\d?', prefix):
            continue
        for lower, upper, digits, second_score in valid:
            number = re.sub(r'[\s.·,\-]', '', digits)
            gap = lower[1] - hi[1]
            overlap = min(hi[0], upper[0]) - max(lo[0], lower[0])
            if (re.fullmatch(r'\d{4,5}', number) and plate_like(prefix + number)
                    and -.2 * (hi[1]-lo[1]) <= gap <= 1.5 * (hi[1]-lo[1])
                    and overlap > .4 * min(hi[0]-lo[0], upper[0]-lower[0])):
                candidates.append((np.minimum(lo, lower), np.maximum(hi, upper), min(score, second_score)))
    result = []
    for lo, hi, score in sorted(candidates, key=lambda v: -v[2]):
        # OCR boxes enclose text, so add a conservative margin for the plate rim.
        padding = (hi-lo) * [.15, .35]
        start = np.maximum(0, (lo-padding) / [width, height])
        end = np.minimum(1, (hi+padding) / [width, height])
        rect = [float(start[0]), float(start[1]), float(end[0]-start[0]), float(end[1]-start[1])]
        if min(rect[2:]) < .005:
            continue
        if any(abs(rect[0]-r['roi'][0])+abs(rect[1]-r['roi'][1]) < .02 for r in result):
            continue
        result.append({'roi': rect, 'confidence': score, 'method': 'plate-like-ocr',
                       'touchesFrame': bool((start < .01).any() or (end > .99).any())})
        if len(result) == 8:
            break
    return result


def main(config):
    import cv2
    import numpy as np
    import rapidocr_onnxruntime
    from rapidocr_onnxruntime import RapidOCR
    source, at = Path(config['source']).resolve(strict=True), float(config['at'])
    if not source.is_file() or not math.isfinite(at) or at < 0:
        raise ValueError('Invalid source/frame time')
    models = Path(rapidocr_onnxruntime.__file__).parent / 'models'
    names = ['ch_PP-OCRv4_det_infer.onnx', 'ch_PP-OCRv4_rec_infer.onnx', 'ch_ppocr_mobile_v2.0_cls_infer.onnx']
    if any(not (models/name).is_file() for name in names):
        raise ValueError('Missing local OCR models; no automatic download')
    before = source.stat()
    source_hash = digest(source)
    frame = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-ss', str(at), '-i', str(source),
                            '-frames:v', '1', '-vf', "scale=w='min(1920,iw)':h='min(1920,ih)':force_original_aspect_ratio=decrease",
                            '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True, check=True, timeout=30)
    image = cv2.imdecode(np.frombuffer(frame.stdout, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError('No frame at requested source time')
    ocr = RapidOCR(det_model_path=str(models/names[0]), rec_model_path=str(models/names[1]),
                   cls_model_path=str(models/names[2]), intra_op_num_threads=2, inter_op_num_threads=2)
    rows, _ = ocr(image)
    after = source.stat()
    if before.st_size != after.st_size or before.st_mtime_ns != after.st_mtime_ns or digest(source) != source_hash:
        raise ValueError('Source changed during inspection')
    return {'at': at, 'sourceSha256': source_hash, 'frameWidth': image.shape[1], 'frameHeight': image.shape[0],
            'proposals': proposals(rows, image.shape[1], image.shape[0]),
            'models': {name: hashlib.sha256((models/name).read_bytes()).hexdigest() for name in names},
            'requiresVisualReview': True, 'coverage': 'single-source-frame-only'}


if __name__ == '__main__':
    print(json.dumps(main(json.loads(Path(sys.argv[1]).read_text(encoding='utf-8')))))
