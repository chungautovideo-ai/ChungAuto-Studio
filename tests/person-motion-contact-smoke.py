"""Create a sampled mask contact sheet; this does not assert segmentation quality."""
import io
import json
import subprocess
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
report = json.loads((root / 'workspace/cache/person-sam2-motion6-body.json').read_text())
raw = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(root / 'workspace/cache/person-sam2-motion6.mp4'), '-vf', 'fps=8,scale=240:-2', '-frames:v', '48', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-'], capture_output=True, check=True).stdout
frames, at = [], 0
while True:
    a = raw.find(b'\xff\xd8', at)
    if a < 0:
        break
    b = raw.find(b'\xff\xd9', a+2)
    frames.append(Image.open(io.BytesIO(raw[a:b+2])).convert('RGB'))
    at = b+2
assert len(frames) == len(report['f']) == 48
sheet = Image.new('RGB', (960, frames[0].height*2+48), '#111')
draw = ImageDraw.Draw(sheet)
for j, index in enumerate([0, 6, 12, 18, 24, 30, 36, 47]):
    runs, mask = report['f'][index], []
    for k in range(0, len(runs), 2):
        mask.extend([runs[k+1]]*runs[k])
    mask = Image.fromarray(np.array(mask, dtype=np.uint8).reshape(report['h'], report['w'])*95).resize(frames[index].size)
    frame = Image.composite(Image.new('RGB', frames[index].size, (20, 255, 60)), frames[index], mask)
    x, y = (j % 4)*240, (j//4)*(frame.height+24)
    sheet.paste(frame, (x, y))
    draw.text((x+6, y+frame.height+4), f'{index/8:.3f}s', fill='white')
sheet.save(root / 'docs/PERSON_SAM2_MOTION6_BODY_CONTACT.png')
compact = {k: v for k, v in report.items() if k not in ['f', 'quality', 'shotGuard']}
compact.update({'frames': 48, 'positivePoints': 4, 'negativePoints': 1, 'limits': 'Sample inspection only; one speaker, not multiple people or final render.'})
(root / 'docs/PERSON_SAM2_MOTION6_BODY_SMOKE.json').write_text(json.dumps(compact, indent=2), encoding='utf-8')
