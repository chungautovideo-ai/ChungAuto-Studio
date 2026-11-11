"""Build word-level timing (real Thai word segmentation) + line groups for karaoke captions.

Usage: python build_karaoke_words.py [project_dir]
Reads:  <project_dir>/audio/alignment.json, <project_dir>/beats.json
Writes: <project_dir>/karaoke_groups.json

Requires the standard 7-beat structure of this skill (Layout Sequence:
face, split, split, pip, split, face, face) to derive caption Y-position
per beat without needing manual boundary numbers per video.
"""
import json, os, sys
from pythainlp.tokenize import word_tokenize

BASE = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.getcwd()

d = json.load(open(os.path.join(BASE, 'audio', 'alignment.json'), encoding='utf-8'))
beats_raw = json.load(open(os.path.join(BASE, 'beats.json'), encoding='utf-8'))
beats = beats_raw['beats'] if isinstance(beats_raw, dict) else beats_raw
chars = d['characters']
text = d['text']

assert len(beats) == 7, f"expected 7 beats, got {len(beats)} — adjust BOUNDARIES logic below for non-standard beat counts"

tokens = word_tokenize(text, engine='newmm')
assert ''.join(tokens) == text

words = []
ptr = 0
for tok in tokens:
    n = len(tok)
    tok_chars = chars[ptr:ptr+n]
    ptr += n
    if tok.strip() == '':
        continue
    words.append({
        'text': tok,
        'start_ms': tok_chars[0]['start_ms'],
        'end_ms': tok_chars[-1]['end_ms'],
    })

print(f"{len(tokens)} tokens -> {len(words)} words")

# Layout sequence is fixed for this skill: beat1=face, beats2-5=split/pip (mid), beats6-7=face.
# Derive boundaries from beats.json so this works for any video without manual tuning.
BOUNDARIES = [
    (0,                    beats[0]['end_ms'],   'face'),
    (beats[0]['end_ms'],   beats[5]['start_ms'], 'mid'),
    (beats[5]['start_ms'], beats[6]['end_ms'],   'face'),
]
def layout_for(ms):
    for s, e, layout in BOUNDARIES:
        if s <= ms < e:
            return layout
    return BOUNDARIES[-1][2]

BREAK_BOUNDARIES = sorted(set(b for b, _, _ in BOUNDARIES[1:]))

MAX_WORDS = 4
MAX_CHARS = 22
MAX_DUR = 3200
GAP_BREAK = 150

groups = []
cur = []
def flush():
    global cur
    if cur:
        groups.append({
            'words': cur[:],
            'start_ms': cur[0]['start_ms'],
            'end_ms': cur[-1]['end_ms'],
            'layout': layout_for(cur[0]['start_ms']),
        })
        cur = []

for w in words:
    force_break = False
    if cur:
        gap = w['start_ms'] - cur[-1]['end_ms']
        dur_if_added = w['end_ms'] - cur[0]['start_ms']
        chars_if_added = sum(len(c['text']) for c in cur) + len(w['text'])
        crosses_layout = any(cur[0]['start_ms'] < bb <= w['start_ms'] for bb in BREAK_BOUNDARIES)
        if gap >= GAP_BREAK or dur_if_added > MAX_DUR or len(cur) >= MAX_WORDS or chars_if_added > MAX_CHARS or crosses_layout:
            force_break = True
    if force_break:
        flush()
    cur.append(w)
    if w['text'].endswith(('?', '!')):
        flush()
flush()

print(f"-> {len(groups)} caption groups")
for g in groups:
    txt = ''.join(w['text'] for w in g['words'])
    print(f"  [{g['start_ms']:7d}-{g['end_ms']:7d}] {g['layout']:4s} {txt}")

out = os.path.join(BASE, 'karaoke_groups.json')
json.dump(groups, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print(f"\nWritten {out}")
