"""Dò khung mặt người nói theo thời gian nguồn để kiểm chữ không đè mặt.

    python do-mat.py <video> <out.json> [--fps 3] [--ffmpeg <path>] [--model <yunet.onnx>]

ffmpeg tách khung (tự áp xoay của clip điện thoại), YuNet (OpenCV) tìm mặt lớn nhất, khung nới lên tóc và xuống cằm.
Ghi toạ độ chuẩn hoá 0..1 theo khung đã xoay: {"fps","w","h","samples":[[t,x0,y0,x1,y1] | [t,null]]}.
"""
import argparse, json, os, subprocess, sys
import numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
p = argparse.ArgumentParser()
p.add_argument('video'); p.add_argument('out')
p.add_argument('--fps', type=float, default=3)
p.add_argument('--ffmpeg', default=os.path.join(ROOT, 'tools', 'ffmpeg', 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg'))
p.add_argument('--model', default=os.path.join(ROOT, 'tools', 'models', 'face_detection_yunet_2023mar.onnx'))
a = p.parse_args()
if not os.path.exists(a.ffmpeg): a.ffmpeg = 'ffmpeg'

W = 360  # khung nhỏ là đủ cho vị trí mặt, nhanh với clip 4K
probe = subprocess.run([a.ffmpeg, '-v', 'error', '-i', a.video, '-frames:v', '1', '-vf', f'scale={W}:-2', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True)
if not probe.stdout: sys.exit('Không đọc được video: ' + probe.stderr.decode('utf8', 'ignore')[-300:])
H = len(probe.stdout) // (W * 3)
det = cv2.FaceDetectorYN.create(a.model, '', (W, H), 0.6, 0.3, 5000)
proc = subprocess.Popen([a.ffmpeg, '-v', 'error', '-i', a.video, '-vf', f'fps={a.fps},scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], stdout=subprocess.PIPE)
size, samples, i = W * H * 3, [], 0
while True:
    buf = proc.stdout.read(size)
    if len(buf) < size: break
    frame = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    _, faces = det.detect(frame)
    t = round(i / a.fps, 3); i += 1
    if faces is None or not len(faces): samples.append([t, None]); continue
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])[:4]
    # khung YuNet dừng ở trán và cằm: nới lên tóc 35%, xuống cằm/cổ 20%, hai bên 15%
    x0, x1 = max(0, x - 0.15 * w), min(W, x + 1.15 * w)
    y0, y1 = max(0, y - 0.35 * h), min(H, y + 1.20 * h)
    samples.append([t, round(float(x0) / W, 4), round(float(y0) / H, 4), round(float(x1) / W, 4), round(float(y1) / H, 4)])
proc.wait()
json.dump({'fps': a.fps, 'w': W, 'h': H, 'samples': samples}, open(a.out, 'w'))
print(json.dumps({'ok': True, 'samples': len(samples), 'faces': sum(1 for s in samples if s[1] is not None)}))
