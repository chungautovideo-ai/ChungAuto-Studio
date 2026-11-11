"""Synthetic failure cases plus saved real SAM2 motion, no model/network calls."""
import json
from pathlib import Path
import sys
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'editor/tools'))
from person_mask_guard import mask_transition


def box(x, y, w=15, h=40):
    mask = np.zeros((100, 100), dtype=bool)
    mask[y:y+h, x:x+w] = True
    return mask


assert mask_transition(box(10, 20), box(12, 21))['reason'] is None
assert mask_transition(box(10, 20), box(65, 20))['reason'] == 'relocation'
assert mask_transition(box(10, 20), box(10, 20, 3, 5))['reason'] == 'area-change'
assert mask_transition(box(10, 20, 3, 5), box(10, 20))['reason'] == 'area-change'
# Fast motion where the object overlaps is not a disjoint relocation.
assert mask_transition(box(10, 20, 50, 40), box(35, 20, 50, 40))['reason'] is None
for a, b in [(box(10, 20), np.zeros((100, 100))), (box(10, 20), box(10, 20)[:90])]:
    try:
        mask_transition(a, b)
        raise AssertionError('Invalid mask accepted')
    except ValueError:
        pass

report = json.loads((ROOT / 'workspace/cache/person-sam2-motion6-body.json').read_text())
masks = []
for runs in report['f']:
    mask = np.repeat(np.array(runs[1::2], dtype=bool), runs[::2]).reshape(report['h'], report['w'])
    masks.append(mask)
transitions = [mask_transition(a, b) for a, b in zip(masks, masks[1:])]
assert len(transitions) == 47
assert all(item['reason'] is None for item in transitions), transitions
print(json.dumps({'syntheticCases': 7, 'savedRealMotionTransitions': len(transitions),
                  'maximumAreaRatio': max(x['areaRatio'] for x in transitions),
                  'maximumCentroidDistance': max(x['centroidDistance'] for x in transitions),
                  'scope': 'Saved six-second one-person masks and synthetic failures; not identity or occlusion acceptance.'}))
