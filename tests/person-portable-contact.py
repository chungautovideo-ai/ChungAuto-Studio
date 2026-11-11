"""Visual samples from the opt-in portable CUDA smoke, not an identity benchmark."""
import io, json, subprocess
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
evidence = json.loads((root/'docs/PERSON_PORTABLE_TRACKING_SMOKE.json').read_text(encoding='utf-8'))
result = Path(evidence['cases'][0]['result'])
report = json.loads(result.read_text(encoding='utf-8'))
request = json.loads((result.parent/'continuous-request.json').read_text(encoding='utf-8'))
raw = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', request['source'], '-vf', 'fps=8,scale=240:-2', '-frames:v', '48', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-'], capture_output=True, check=True).stdout
frames, offset = [], 0
while True:
    start = raw.find(b'\xff\xd8', offset)
    if start < 0: break
    end = raw.find(b'\xff\xd9', start+2)
    if end < 0: raise ValueError('Truncated frame')
    frames.append(Image.open(io.BytesIO(raw[start:end+2])).convert('RGB'))
    offset = end+2
assert len(frames) == len(report['f']) == 48
sheet = Image.new('RGB', (960, (frames[0].height+24)*2), '#111')
draw = ImageDraw.Draw(sheet)
for j, index in enumerate([0, 6, 12, 18, 24, 30, 36, 47]):
    runs = report['f'][index]
    mask = np.repeat(np.array(runs[1::2], dtype=np.uint8), runs[::2]).reshape(report['h'], report['w'])
    overlay = Image.fromarray(mask*95).resize(frames[index].size)
    frame = Image.composite(Image.new('RGB', frames[index].size, (20, 255, 60)), frames[index], overlay)
    x, y = (j%4)*240, (j//4)*(frame.height+24)
    sheet.paste(frame, (x,y));draw.text((x+6,y+frame.height+4), f'{index/8:.3f}s', fill='white')
sheet.save(root/'docs/PERSON_PORTABLE_TRACKING_CONTACT.png')
