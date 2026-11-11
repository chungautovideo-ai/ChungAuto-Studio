"""Track a user-marked ROI on a continuous source range; fail on lost flow.

No detector and no OCR claim. Coordinates and output remain source-relative.
Raw frames come from ffmpeg (autorotation); OpenCV only computes flow/masks.
"""
import json
import sys
import subprocess
import os
import cv2
import numpy as np

# Embedded Python with a ._pth file does not add the script folder to sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from source_frame_clock import presentation_decode_command  # noqa: E402


def move_quad(previous, current, quad):
    mask = np.zeros(previous.shape, np.uint8)
    cv2.fillConvexPoly(mask, np.round(quad).astype(np.int32), 255)
    points = cv2.goodFeaturesToTrack(previous, 120, .005, 3, mask=mask)
    if points is None or len(points) < 8:
        raise ValueError("Vùng biển thiếu chi tiết để tracking; chọn lại vùng hoặc chia cảnh.")
    following, status, _ = cv2.calcOpticalFlowPyrLK(previous, current, points, None, winSize=(31, 31), maxLevel=3)
    if following is None:
        raise ValueError("Tracker mất dấu; chưa tạo bản che.")
    back, back_status, _ = cv2.calcOpticalFlowPyrLK(current, previous, following, None, winSize=(31, 31), maxLevel=3)
    if back is None:
        raise ValueError("Tracker mất dấu; chưa tạo bản che.")
    good = (status.ravel() == 1) & (back_status.ravel() == 1) & (np.linalg.norm((back-points).reshape(-1, 2), axis=1) < 1.5)
    if good.sum() < 8:
        raise ValueError("Không đủ điểm bám tin cậy; chia cảnh hoặc đánh dấu lại biển.")
    transform, inliers = cv2.estimateAffinePartial2D(points[good], following[good], method=cv2.RANSAC, ransacReprojThreshold=2)
    count = int(inliers.sum()) if inliers is not None else 0
    if transform is None or count < 8 or count / int(good.sum()) < .6:
        raise ValueError("Tracker không nhất quán; chưa tạo bản che.")
    scale = float(np.hypot(transform[0, 0], transform[1, 0]))
    if not .88 <= scale <= 1.14:
        raise ValueError("Biển thay đổi quá nhanh hoặc có chuyển cảnh; cần chia đoạn.")
    moved = np.hstack([quad, np.ones((4, 1))]) @ transform.T
    if not np.isfinite(moved).all():
        raise ValueError("Tracking không hợp lệ.")
    return moved.astype(np.float32), count


def read_exact(stream, size):
    data = bytearray()
    while len(data) < size:
        chunk = stream.read(size-len(data))
        if not chunk:
            break
        data.extend(chunk)
    if data and len(data) != size:
        raise ValueError("Frame nguồn bị cắt cụt.")
    return data


def main(config):
    width, height = config['width'], config['height']
    start, duration = config['from'], config['duration']
    rois = config.get('rois') or [config['roi']]
    down = min(1., 960/max(width, height))
    sw, sh = max(1, round(width*down)), max(1, round(height*down))
    rx, ry = sw/width, sh/height
    quads = []
    if config.get('quads'):
        quads = [np.array(q, np.float32)*np.array([sw, sh], np.float32) for q in config['quads']]
    else:
        for x, y, w, h in rois:
            quads.append(np.array([[x*sw, y*sh], [(x+w)*sw, y*sh], [(x+w)*sw, (y+h)*sh], [x*sw, (y+h)*sh]], np.float32))
    # Hold the source frame presented at each 30fps tick, starting at the frame the user marked.
    command, sampling = presentation_decode_command(config['source'], start, duration, 30, max_samples=450, max_fps=30, output=['-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'])
    source = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    color_args = ['-vf', 'scale=out_color_matrix=bt709:out_range=tv', '-x264-params', 'colorprim=bt709:transfer=bt709:colormatrix=bt709', '-color_range', 'tv'] if config.get('colorProfile') == 'rec709' else []
    encode = subprocess.Popen(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{width}x{height}', '-r', '30', '-i', '-', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p'] + color_args + [config['output']], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    previous = None
    tracks = []
    try:
        while True:
            data = read_exact(source.stdout, width*height*3)
            if not data:
                break
            if len(tracks) >= 451:
                raise ValueError("Khoảng tracking vượt15giây.")
            frame = np.frombuffer(data, np.uint8).reshape(height, width, 3).copy()
            gray = cv2.cvtColor(cv2.resize(frame, (sw, sh)), cv2.COLOR_BGR2GRAY)
            regions = []
            for index, quad in enumerate(quads):
                count = None
                if previous is not None:
                    try:
                        quad, count = move_quad(previous, gray, quad)
                    except ValueError as error:
                        raise ValueError(f"Vùng {index+1}: {error}") from error
                quads[index] = quad
                if quad[:, 0].min() < 0 or quad[:, 1].min() < 0 or quad[:, 0].max() > sw or quad[:, 1].max() > sh:
                    raise ValueError(f"Vùng {index+1} đi khỏi khung; chia đoạn hoặc chọn lại vùng.")
                full = quad / np.array([rx, ry])
                center = full.mean(axis=0)
                padded = (full-center)*1.18+center
                cv2.fillConvexPoly(frame, np.round(padded).astype(np.int32), (12, 12, 12))
                regions.append({'quad': full.round(2).tolist(), 'inliers': count})
            previous = gray
            encode.stdin.write(frame.tobytes())
            tracks.append({'t': round(len(tracks)/30, 6), **regions[0], 'regions': regions})
        if len(tracks) < max(2, round(duration*30)-2):
            raise ValueError("Nguồn không đủ frame cho khoảng đã chọn.")
        encode.stdin.close()
        if source.wait(timeout=20) or encode.wait(timeout=60):
            raise ValueError("Không mã hóa được bản che.")
        with open(config['tracks'], 'w', encoding='utf-8') as out:
            json.dump({'method': 'user-roi-optical-flow', 'fps': 30, 'sampling': sampling, 'frames': tracks, 'requiresVisualReview': True}, out)
    finally:
        for process in (source, encode):
            if process.poll() is None:
                process.kill()
            process.wait()


if __name__ == '__main__':
    try:
        with open(sys.argv[1], encoding='utf-8') as handle:
            main(json.load(handle))
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
