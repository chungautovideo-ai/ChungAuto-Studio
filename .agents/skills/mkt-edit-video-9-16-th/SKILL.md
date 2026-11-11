---
name: mkt-edit-video-9-16-th
description: Edit video footage của user thành 9:16 (1080×1920) — transcribe từ video, phân beats, thêm motion graphic HyperFrames overlay trực tiếp lên video. KHÔNG cần script/TTS/HeyGen — user cung cấp video sẵn làm face layer.
---

# mkt-edit-video-9-16-th — Video Edit Pipeline (Thai 9:16)

Nhận video footage → transcribe → phân beats → confirm → thêm HyperFrames motion graphics → composite 9:16 với overlay.

**KHÔNG cần**: viết kịch bản, TTS ElevenLabs, generate HeyGen avatar
**User cung cấp**: video file (talking head, screen recording, bất kỳ footage nào)
**Output**: `<slug>-9-16.mp4` (1080×1920, motion overlay trực tiếp lên face full canvas)

---

## Khi nào dùng skill này

**MUST use** khi user:
- Gửi video + nói "edit video", "thêm motion graphic vào video"
- "làm 9:16 từ video này", "thêm caption", "overlay animation"
- Muốn biến video landscape/portrait sẵn có → 9:16 Reels/TikTok/Shorts
- Không muốn tạo lại từ đầu (có footage rồi, chỉ cần thêm graphics)

---

## Fixed Config (Thai)

| Param | Value |
|---|---|
| Canvas | `1080 × 1920` |
| Language | `th` (Thai) |
| Transcribe model | `small --language th` |
| Slug | Suy ra từ tên video hoặc topic user mô tả |

---

## Layout Sequence

Tất cả beats dùng **overlay** — motion graphics nằm trên video full màn hình. Không còn split (motion top / face bottom).

```
Beat 1  → Overlay   (face full canvas + motion overlay nhẹ — hook)
Beat 2  → Overlay   (face full canvas + motion overlay — content)
Beat 3  → Overlay
Beat 4  → Overlay
Beat 5  → Overlay
Beat 6  → Overlay   (CTA)
```

Beat đầu và cuối thường có ít motion elements hơn (focus face).  
Điều chỉnh số beats theo độ dài video. Target: 5-7 beats, mỗi beat 8-25s.

---

## Composite Strategy: Screen Blend

Motion video được render với **`background: #000000`** (pure black). FFmpeg dùng `blend=all_mode=screen`:

```
screen formula: result = 1 - (1 - face) * (1 - motion)
→ Pixel đen (#000000) của motion = transparent (face hiện)
→ Text/cards sáng màu của motion = nổi lên trên face
```

**Kết quả**: Cards và text của motion graphics nằm trên face video. Face vẫn thấy toàn bộ canvas.

---

## Scene Design Safe Zones (Overlay Mode)

```
┌──────────────────────────────┐ y=0
│  TOP ZONE (y=80 → y=620)     │  ← Main cards, headlines, badges
│  Motion content chính        │
├──────────────────────────────┤ y=640
│                              │
│  FACE ZONE (y=640 → y=1540)  │  ← GIỮ TRỐNG hoặc chỉ elements nhẹ
│  Face người nói hiện ở đây   │    (bokeh, subtle icons)
│                              │
├──────────────────────────────┤ y=1560
│  CAPTION ZONE (y=1560→y=1860)│  ← Caption bar, CTA button, text phụ
└──────────────────────────────┘ y=1920
```

- **Top zone**: cards với rounded corners, glassmorphic bg, heading + subtext
- **Face zone**: để trống → face video hiện rõ → KHÔNG đặt card lớn ở đây
- **Caption zone**: text ngắn, tags, CTA button

---

## Pipeline

### Step 1 — Nhận video + probe

```bash
ffprobe -v error -show_entries stream=width,height,r_frame_rate \
  -show_entries format=duration -of json "<input_video>"
```

Tạo thư mục project:
```
workspace/content/<YYYY-MM-DD>/<slug>/
├── audio/
│   ├── full.mp3          # extracted audio
│   ├── transcript.json   # word timestamps từ Whisper
│   ├── sfx_track.wav     # generated SFX
│   └── face_full.mp4     # user video scaled 1080×1920
├── scenes/               # HyperFrames HTML
├── design.md
├── beats.json
├── index.html
├── <slug>-motion.mp4
└── <slug>-9-16.mp4
```

### Step 2 — Extract audio + transcribe

```bash
ffmpeg -y -i "<input_video>" -vn -ar 44100 -ac 2 audio/full.mp3
```

Transcribe bằng Python Whisper (npx hyperframes transcribe hay bị lỗi whisper-cpp not found):
```python
import whisper, json, sys
sys.stdout.reconfigure(encoding='utf-8')
model = whisper.load_model('small')
result = model.transcribe('audio/full.mp3', language='th', word_timestamps=True)
words = []
for seg in result['segments']:
    for w in seg.get('words', []):
        words.append({'word': w['word'].strip(), 'start': round(w['start'],3), 'end': round(w['end'],3)})
out = {'words': words, 'duration': round(result['segments'][-1]['end'],3)}
json.dump(out, open('audio/transcript.json','w',encoding='utf-8'), ensure_ascii=False, indent=2)
print('Done:', len(words), 'words')
```

### Step 3 — Phân beats + xác định beat boundaries

Đọc `transcript.json`, tìm boundary points:
1. **Silence gaps** — khoảng cách giữa `words[i].end` và `words[i+1].start` > 0.4s
2. **Sentence endings** — từ kết thúc câu Thai (ครับ, ค่ะ, นะ, ไป, etc.)
3. **Topic shifts** — từ chuyển tiếp (แต่, และ, สรุป, นอกจาก, etc.)
4. **Target**: 5-7 beats, mỗi beat 8-25s

Tạo `beats.json`:
```json
[
  { "index": 1, "label": "hook",    "start_s": 0,     "end_s": 14.88,  "layout": "overlay", "text_th": "..." },
  { "index": 2, "label": "problem", "start_s": 14.88, "end_s": 28.96,  "layout": "overlay", "text_th": "..." },
  ...
]
```

**DỪNG và trình bày beats plan cho user confirm** trước khi tiếp tục.

### Step 4 — Design.md

Tạo `design.md` từ nội dung video — tóm tắt topic + chọn palette.

**Scene background PHẢI là `#000000` (pure black)** — để screen blend hoạt động đúng.

Default palette:
- Background: `#000000`
- Accent chính: emerald `#10b981` / cyan `#4fc3f7`
- Accent phụ: amber `#f59e0b`, coral `#ef4444`
- Fonts: Inter + Sarabun (Thai)

### Step 5 — Fan out parallel sub-agents (scenes)

Spawn 1 sub-agent / beat trong 1 message. Sub-agents viết `scenes/scene-NN-*.html`.

**Bắt buộc cho mỗi scene**:
- Canvas: `data-width="1080" data-height="1920"`
- `html, body { background: #000000; }` — pure black, KHÔNG phải `#050810`
- Content nằm trong **Top Zone (y=80→620)** và **Caption Zone (y=1560→1860)**
- **Face Zone (y=640→1540) phải để trống** — KHÔNG đặt card/block lớn ở đây
- Bokeh particles: subtle, color-tinted, opacity thấp (0.04-0.08)
- Pattern: bokeh + GSAP + mulberry32 PRNG (giống skill 9:16-th)
- **Không có brand stamp trong scene** — master index.html thêm

**Card design cho overlay mode**:
```css
/* Cards trong top zone */
.card {
  background: rgba(15, 20, 35, 0.92);  /* đủ tối để nổi trên face */
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 20px;
  backdrop-filter: blur(8px);
}
/* Text luôn dùng màu sáng */
.heading { color: #ffffff; text-shadow: 0 2px 20px rgba(0,0,0,0.8); }
```

### Step 6 — Master index.html

`data-width="1080" data-height="1920"`, dùng `audio/full.mp3` làm voiceover.
`background: #000000`, Brand stamp, SFX layer.

Pattern IIFE isolation cho scripts:
```js
s.textContent = `;(function(){\n${old.textContent}\n})();`;
```

Pattern inject scene timelines vào masterTl:
```js
BEATS.forEach(beat => {
  const tl = window.__timelines && window.__timelines[beat.scene];
  if (tl) masterTl.add(tl.play(0).pause(), beat.start);
});
masterTl.to({}, { duration: 0.001 }, TOTAL); // extend to full duration
```

### Step 7 — Render motion graphics

```bash
npx hyperframes render -q standard -o <slug>-motion.mp4
```

### Step 8 — Preprocess user video

```bash
# Scale/crop để fit 1080×1920
ffmpeg -y -i "<input_video>" \
  -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \
  audio/face_full.mp4
```

Không cần face_crop.mp4 hay motion_top.mp4 nữa.

### Step 9 — Generate SFX

Whoosh bursts tại mỗi beat transition (beat_end_ms - 200ms):

```bash
ffmpeg -y \
  -f lavfi -i "anoisesrc=color=pink:duration=0.5" \
  -f lavfi -i "anoisesrc=color=pink:duration=0.5" \
  ... (1 input / beat transition) \
  -filter_complex "
    [0]volume=3,highpass=f=600,lowpass=f=7000,afade=type=in:st=0:d=0.04,afade=type=out:st=0.18:d=0.32,adelay=<b1_end_ms-200>|<b1_end_ms-200>[s1];
    [1]...,adelay=<b2_end_ms-200>|<b2_end_ms-200>[s2];
    ...
    [s1][s2]...amix=inputs=N:duration=longest,volume=0.6[sfx]
  " \
  -map "[sfx]" -t <total> -ar 44100 -ac 2 \
  audio/sfx_track.wav
```

### Step 10 — Composite (Colorkey Overlay)

Motion video có `background: #000000`. Dùng `colorkey` để xóa nền đen → reveal face video bên dưới. Cards/text tối màu (rgba(14,20,48,0.96)) không bị key vì đủ sáng hơn pure black.

```bash
ffmpeg -y \
  -i "audio/face_full.mp4" \
  -i "<slug>-motion.mp4" \
  -i "audio/sfx_track.wav" \
  -filter_complex "
    [1:v]colorkey=color=black:similarity=0.06:blend=0.03[mkey];
    [0:v][mkey]overlay=x=0:y=0:shortest=1[outv];
    [0:a][2:a]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[aout]
  " \
  -map "[outv]" -map "[aout]" \
  -t <total> \
  -c:v libx264 -crf 20 -preset fast \
  -c:a aac -b:a 192k \
  "<slug>-9-16.mp4"
```

**Colorkey threshold logic:**
- `similarity=0.06`: pixel có max(r,g,b) < 0.06 × 255 ≈ 15 → bị key (transparent)
- Pure black `#000000` → transparent → face hiện ✓
- Card bg `rgba(14,20,48,0.96)` = pixel (14,19,46) → max=46/255=0.18 > 0.06 → KEPT (card blocks face) ✓
- `rgba(255,255,255,0.05)` = pixel (13,13,13) → max=0.05 < 0.06 → transparent ✗ (không dùng bg này)

Không cần: xfade offset computation, face_crop, motion_top, PiP pipeline.

---

## Xử lý video dimensions đặc biệt

| Input format | ffmpeg preprocess |
|---|---|
| 16:9 (1920×1080) | `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920` |
| 9:16 (1080×1920) | Dùng trực tiếp, không cần scale |
| 1:1 (1080×1080) | `scale=1080:1080,pad=1080:1920:0:420:black` |
| Portrait khác | `scale=1080:-2` rồi pad lên 1920 |

---

## Captions (tuỳ chọn)

Nếu user muốn subtitles burn-in, tạo từ `transcript.json`:

```bash
python -c "
import json, sys
data = json.load(open('audio/transcript.json'))
words = data['words']
# Group thành chunks 5-8 words
...
" > audio/captions.srt

ffmpeg -i <slug>-motion.mp4 \
  -vf \"subtitles=audio/captions.srt:force_style='FontName=Sarabun,FontSize=28,PrimaryColour=&Hffffff,Outline=2,Shadow=1,MarginV=80'\" \
  <slug>-motion-sub.mp4
```

---

## So sánh với skill 9:16-th

| | `mkt-hyperframe-knowledge-video-9-16-th` | `mkt-edit-video-9-16-th` |
|---|---|---|
| Input | Script text | Video file |
| Audio source | ElevenLabs TTS | Extracted từ video |
| Face layer | HeyGen generated | User video (preprocessed) |
| Beat detection | Từ script structure | Từ transcript pauses |
| Script writing | Bắt buộc | Bỏ qua |
| Layout | full-face / split / pip | **overlay only** (screen blend) |
| Composite | Complex xfade 5-segment | **Simple screen blend** |
| Thời gian pipeline | ~30-45 phút | ~15-25 phút |

---

## Reference

- Skill gốc: `.Codex/skills/mkt-hyperframe-knowledge-video-9-16-th/SKILL.md`
- Transcribe command: `.Codex/skills/hyperframes-media/SKILL.md` → section "Transcription"
