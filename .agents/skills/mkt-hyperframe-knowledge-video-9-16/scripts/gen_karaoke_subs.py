#!/usr/bin/env python3
"""
Karaoke subtitle renderer v2
- Dark rounded pill bg
- Per-segment cyan highlight (segment = space-word or 10-char chunk)
- Single-line pills, font 36px
"""
import json, os, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from PIL import Image, ImageDraw, ImageFont

# ── Config ────────────────────────────────────────────────────────────────────
CANVAS_W, CANVAS_H = 1080, 1920
FONT_PATH   = r"C:\Windows\Fonts\LeelaUIb.ttf"
FONT_SIZE   = 36

PILL_BG     = (0, 0, 0, 204)    # dark 80% opaque
PILL_PAD_X  = 30
PILL_PAD_Y  = 16
PILL_R      = 26
MAX_PILL_W  = 1000               # cap so it never overflows 1080px canvas

HL_BG       = (79, 195, 247, 255)
HL_R        = 8
HL_PAD_X    = 8
HL_PAD_Y    = 4
TEXT_COL    = (255, 255, 255, 255)
HL_TEXT_COL = (15, 15, 15, 255)   # dark on cyan
WORD_GAP    = 14                   # px gap between segments in pill

SUB_Y_CENTER = CANVAS_H - 840     # subtitle vertical center (y=1080 from top)

MAX_SEG_CHARS  = 10   # split words longer than this into chunks
MAX_LINE_SEGS  = 4    # max segments per display line
MAX_LINE_CHARS = 22   # max total chars per display line

# ── Paths ─────────────────────────────────────────────────────────────────────
base    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out_dir = os.path.join(base, 'audio', 'karaoke_pngs')
os.makedirs(out_dir, exist_ok=True)

# ── Load alignment ────────────────────────────────────────────────────────────
with open(os.path.join(base, 'audio', 'alignment.json'), encoding='utf-8') as f:
    alignment = json.load(f)
chars = alignment['characters']
DURATION_MS = alignment.get('duration_ms', 110320)

# ── Build segments ────────────────────────────────────────────────────────────
# Step 1: split by spaces → raw words
raw_words = []
cur = {'text': '', 'start_ms': None, 'end_ms': None}
for c in chars:
    if c['char'] == ' ':
        if cur['text']:
            raw_words.append(dict(cur))
        cur = {'text': '', 'start_ms': None, 'end_ms': None}
    else:
        if cur['start_ms'] is None:
            cur['start_ms'] = c['start_ms']
        cur['text'] += c['char']
        cur['end_ms'] = c['end_ms']
if cur['text']:
    raw_words.append(dict(cur))

# Step 2: split long words into 10-char chunks (with proportional timing)
segs = []
for w in raw_words:
    t = w['text']
    if len(t) <= MAX_SEG_CHARS:
        segs.append({'text': t, 'start_ms': w['start_ms'], 'end_ms': w['end_ms']})
    else:
        dur = w['end_ms'] - w['start_ms']
        total = len(t)
        pos = 0
        while pos < total:
            chunk = t[pos:pos + MAX_SEG_CHARS]
            s = w['start_ms'] + int(pos / total * dur)
            e = w['start_ms'] + int((pos + len(chunk)) / total * dur)
            segs.append({'text': chunk, 'start_ms': s, 'end_ms': e})
            pos += MAX_SEG_CHARS

print(f"Segments: {len(segs)}")

# ── Group segments into display lines ─────────────────────────────────────────
# Each display line = what's shown in the pill (multiple segments visible at once)
lines = []
cur_line = []
for s in segs:
    if cur_line:
        total_chars = sum(len(x['text']) for x in cur_line) + len(cur_line) + len(s['text'])
        if len(cur_line) >= MAX_LINE_SEGS or total_chars > MAX_LINE_CHARS:
            lines.append(cur_line)
            cur_line = [s]
        else:
            cur_line.append(s)
    else:
        cur_line.append(s)
if cur_line:
    lines.append(cur_line)

print(f"Display lines: {len(lines)}")

# ── PIL helpers ────────────────────────────────────────────────────────────────
font = ImageFont.truetype(FONT_PATH, FONT_SIZE)

def measure(text):
    # getlength() = advance width (more reliable for Thai combining marks)
    # getbbox() for height only
    w = int(font.getlength(text)) + 4   # +4 safety for Thai diacritics
    bb = font.getbbox(text)
    h = bb[3] - bb[1]
    return w, h

def layout_segs(seg_list):
    """Returns [(x_offset, width), ...] and row_height for a list of segments."""
    positions = []
    x = 0
    row_h = 0
    for s in seg_list:
        w, h = measure(s['text'])
        positions.append((x, w))
        row_h = max(row_h, h)
        x += w + WORD_GAP
    total_w = x - WORD_GAP if positions else 0
    return positions, total_w, row_h

# ── Render frame ───────────────────────────────────────────────────────────────
def render_frame(line_segs, hi_idx):
    # Collect per-segment advance width + actual glyph bounds
    seg_adv = []   # advance width per segment
    seg_bb  = []   # (left, top, right, bottom) from getbbox per segment
    for s in line_segs:
        adv = int(font.getlength(s['text'])) + 4  # +4 for Thai diacritics
        bb  = font.getbbox(s['text'])
        seg_adv.append(adv)
        seg_bb.append(bb)

    # Build x positions
    positions = []
    x = 0
    for adv in seg_adv:
        positions.append(x)
        x += adv + WORD_GAP
    total_w = x - WORD_GAP if positions else 0
    total_w = min(total_w, MAX_PILL_W - PILL_PAD_X * 2)

    # True glyph extents relative to draw origin (bb[1] can be negative = above origin)
    min_top    = min(bb[1] for bb in seg_bb)   # most negative → highest mark
    max_bottom = max(bb[3] for bb in seg_bb)
    glyph_h    = max_bottom - min_top

    pill_w = total_w + PILL_PAD_X * 2
    pill_h = glyph_h  + PILL_PAD_Y * 2

    pill_x = (CANVAS_W - pill_w) // 2
    pill_y = SUB_Y_CENTER - pill_h // 2

    # text_y: draw.text origin so glyph top lands at pill_y + PILL_PAD_Y
    # glyph top = text_y + min_top  →  text_y = pill_y + PILL_PAD_Y - min_top
    text_y = pill_y + PILL_PAD_Y - min_top

    img = Image.new('RGBA', (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Dark pill background
    draw.rounded_rectangle(
        [pill_x, pill_y, pill_x + pill_w, pill_y + pill_h],
        radius=PILL_R, fill=PILL_BG
    )

    text_x = pill_x + PILL_PAD_X

    for i, (s, sx, adv, bb) in enumerate(zip(line_segs, positions, seg_adv, seg_bb)):
        ax = text_x + sx
        if ax + adv > pill_x + pill_w - 5:
            break

        if i == hi_idx:
            # Highlight box using THIS segment's actual glyph bounds
            hl_top    = text_y + bb[1] - HL_PAD_Y
            hl_bottom = text_y + bb[3] + HL_PAD_Y
            draw.rounded_rectangle(
                [ax - HL_PAD_X, hl_top, ax + adv + HL_PAD_X, hl_bottom],
                radius=HL_R, fill=HL_BG
            )
            draw.text((ax, text_y), s['text'], font=font, fill=HL_TEXT_COL)
        else:
            draw.text((ax, text_y), s['text'], font=font, fill=TEXT_COL)

    return img

# ── Generate events ────────────────────────────────────────────────────────────
events = []

for li, line in enumerate(lines):
    for si, seg in enumerate(line):
        start_ms = seg['start_ms']

        # End = next seg start in same line, or next line's first seg start
        if si + 1 < len(line):
            end_ms = line[si + 1]['start_ms']
        elif li + 1 < len(lines):
            next_start = lines[li + 1][0]['start_ms']
            end_ms = min(seg['end_ms'] + 250, next_start)
        else:
            end_ms = seg['end_ms'] + 400

        if end_ms <= start_ms:
            end_ms = start_ms + 150

        png_path = os.path.join(out_dir, f'sub_{li:04d}_{si:02d}.png')
        img = render_frame(line, si)
        img.save(png_path)
        events.append((start_ms, end_ms, png_path))

        row_text = ' '.join(s['text'] for s in line)
        print(f"  {start_ms:6d}-{end_ms:6d}ms  [{row_text}]  ^{seg['text']}")

print(f"\nTotal events: {len(events)}")

# ── Blank frame ────────────────────────────────────────────────────────────────
BLANK = os.path.join(out_dir, 'blank.png')
Image.new('RGBA', (CANVAS_W, CANVAS_H), (0, 0, 0, 0)).save(BLANK)

# ── concat.txt ─────────────────────────────────────────────────────────────────
events.sort(key=lambda x: x[0])
lines_out = []
cur_ms = 0

for s_ms, e_ms, png in events:
    if s_ms > cur_ms + 40:
        lines_out += [f"file '{BLANK}'", f"duration {(s_ms-cur_ms)/1000:.3f}"]
    lines_out += [f"file '{png}'", f"duration {(e_ms-s_ms)/1000:.3f}"]
    cur_ms = e_ms

if cur_ms < DURATION_MS:
    lines_out += [f"file '{BLANK}'", f"duration {(DURATION_MS-cur_ms)/1000:.3f}"]
lines_out.append(f"file '{BLANK}'")

concat_path = os.path.join(out_dir, 'concat.txt')
with open(concat_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines_out) + '\n')
print(f"Wrote {concat_path}")
