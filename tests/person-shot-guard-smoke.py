"""Run with the existing local vision Python; uses QA proxies only, no paid APIs."""
import json
import subprocess
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'editor/tools'))
from person_shot_guard import shot_discontinuity


def decode(src):
    raw = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(src), '-vf', 'fps=8,scale=64:64', '-frames:v', '8', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
    return [Image.frombytes('RGB', (64, 64), raw[i:i+12288]) for i in range(0, len(raw), 12288)]


flat = [Image.new('RGB', (64, 64), (100+i, 120+i, 130+i)) for i in range(8)]
assert shot_discontinuity(flat)['cutFrame'] is None
assert shot_discontinuity(flat[:4] + [Image.new('RGB', (64, 64), (250, 15, 15))]*4)['cutFrame'] == 4
continuous = shot_discontinuity(decode(ROOT / 'workspace/cache/person-sam2-two.mp4'))
black = shot_discontinuity(decode(ROOT / 'workspace/cache/person-sam2-cut.mp4'))
assert continuous['cutFrame'] is None
assert black['cutFrame'] == 4
print(json.dumps({'continuous': continuous, 'cut': black}))
