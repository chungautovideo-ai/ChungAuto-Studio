"""Head box per A-roll clip, so stickers never cover the face.
Usage: python face_boxes.py <clips dir (1080x1920 mp4)> --out <faces.json> [--samples 12]
Samples frames across each clip, detects the largest frontal face (OpenCV Haar), and writes the union box
widened to the whole head (hair above, chin below) in 1080x1920 pixels: {"01": {"x0","y0","x1","y1"}, ...}."""
import argparse
import json
import sys
from pathlib import Path

import cv2

for _s in (sys.stdout, sys.stderr):
    _s.reconfigure(encoding="utf-8")

ap = argparse.ArgumentParser()
ap.add_argument("clips")
ap.add_argument("--out", required=True)
ap.add_argument("--samples", type=int, default=12)
a = ap.parse_args()

cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
out = {}
for f in sorted(Path(a.clips).glob("*.mp4")):
    cap = cv2.VideoCapture(str(f))
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    W, H = cap.get(cv2.CAP_PROP_FRAME_WIDTH), cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    sx, sy = 1080 / W, 1920 / H
    boxes = []
    for k in range(a.samples):
        cap.set(cv2.CAP_PROP_POS_FRAMES, int((k + 0.5) * n / a.samples))
        ok, img = cap.read()
        if not ok:
            continue
        gray = cv2.cvtColor(cv2.resize(img, None, fx=0.5, fy=0.5), cv2.COLOR_BGR2GRAY)
        faces = cascade.detectMultiScale(gray, 1.1, 6, minSize=(60, 60))
        if len(faces):
            x, y, w, h = max(faces, key=lambda b: b[2] * b[3]) * 2
            boxes.append((x - 0.15 * w, y - 0.55 * h, x + 1.15 * w, y + 1.12 * h))  # whole head: hair + chin
    cap.release()
    if not boxes:
        print(f"{f.stem}: no face found")
        continue
    x0, y0 = min(b[0] for b in boxes), min(b[1] for b in boxes)
    x1, y1 = max(b[2] for b in boxes), max(b[3] for b in boxes)
    out[f.stem] = {"x0": round(x0 * sx), "y0": round(y0 * sy), "x1": round(x1 * sx), "y1": round(y1 * sy)}
    print(f.stem, out[f.stem], f"({len(boxes)}/{a.samples} frames)")
Path(a.out).write_text(json.dumps(out, indent=1), encoding="utf-8")
