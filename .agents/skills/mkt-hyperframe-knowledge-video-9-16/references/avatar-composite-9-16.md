# Avatar Composite Pipeline — 9:16

ffmpeg pipeline để composite motion graphic (top) + HeyGen avatar (bottom/full) thành 1 video 1080×1920.

---

## Cơ chế "đan xen" (3 layout)

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  AVATAR full     │    │  MOTION GRAPHIC  │    │  MOTION GRAPHIC  │
│  1080 × 1920     │    │  1080 × 1152     │    │  1080 × 1920     │
│                  │    ├──────────────────┤    │  (full screen)   │
│                  │    │  AVATAR face     │    │              ┌───┤
│                  │    │  1080 × 768      │    │              │pip│
└──────────────────┘    └──────────────────┘    └──────────────┴───┘
  Layout 1: full-face     Layout 2: split         Layout 3: PiP
```

**Cách đạt được**:
- Base: `avatar.mp4` (1080×1920) full screen LUÔN LUÔN
- Layout 2: overlay `motion_top.mp4` (1080×1152) tại y=0 + face crop tại y=1152 — khi split beats active
- Layout 3: overlay `<slug>-motion.mp4` (1080×1920 full, không crop) tại x=0,y=0 + PiP face (scale xuống ~270×360) tại góc dưới phải — khi PiP beats active
- Layout 1: không overlay gì — avatar fill toàn màn hình

---

## Bước 1: Crop motion graphic thành top panel

```bash
ffmpeg -y -i <slug>-motion.mp4 \
  -vf "crop=1080:1152:0:0" \
  -c:v libx264 -crf 18 -preset fast \
  motion_top.mp4
```

- Input: 1080×1920 HyperFrames render
- Output: 1080×1152 (chỉ lấy top 60%)
- Crop từ x=0, y=0 → bắt đầu từ đỉnh canvas

---

## Bước 2: Xây dựng beat_time_ranges từ beats.json

```python
# Đọc beats.json, tạo ffmpeg enable expression
import json

beats = json.load(open('beats.json'))
ranges = []
for beat in beats:
    start = beat['start_ms'] / 1000
    end   = beat['end_ms'] / 1000
    ranges.append(f"between(t,{start:.3f},{end:.3f})")

enable_expr = '+'.join(ranges)
# Ví dụ: "between(t,0.000,14.500)+between(t,15.200,28.100)+between(t,29.000,40.318)"
```

---

## Bước 3: ffmpeg composite

```bash
ffmpeg -y \
  -i avatar.mp4 \         # input 0: HeyGen 1080×1920 full screen
  -i motion_top.mp4 \     # input 1: HyperFrames 1080×1152 top panel
  -filter_complex "
    [0:v][1:v]overlay=x=0:y=0:enable='<beat_time_ranges>'[out]
  " \
  -map "[out]" \
  -map 0:a \              # Audio từ avatar.mp4 (hoặc dùng audio riêng, xem bên dưới)
  -c:v libx264 -crf 20 -preset fast \
  -c:a copy \
  -shortest \
  <slug>-9-16.mp4
```

Thay `<beat_time_ranges>` bằng chuỗi từ bước 2.

### Audio: dùng ElevenLabs VO (khuyến nghị)

```bash
# Thay -map 0:a bằng audio gốc từ motion graphic render
-i <slug>-motion.mp4 \   # input 2: để lấy audio ElevenLabs
...
-map 2:a \
```

Hoặc dùng file audio trực tiếp:

```bash
-i audio/full.mp3 \
...
-map 2:a -c:a aac -b:a 192k \
```

---

## Bước 4: Optional — gradient fade ở split boundary

Thêm gradient đậm nhạt tại y=1152 để transition mượt giữa motion và avatar:

```bash
# Thêm vào filter_complex sau overlay:
[out]drawbox=x=0:y=1100:w=1080:h=52:color=black@0.0:t=fill,
    geq=r='r(X\,Y)':g='g(X\,Y)':b='b(X\,Y)':
    a='if(gt(Y\,1100)\,255*(Y-1100)/52\,255)'[faded]
```

Hoặc đơn giản hơn: overlay một gradient PNG 1080×52px tại y=1100.

---

## Full command example

```bash
cd workspace/content/2026-XX-XX/<slug>

# Crop motion graphic
ffmpeg -y -i <slug>-motion.mp4 -vf "crop=1080:1152:0:0" -c:v libx264 -crf 18 motion_top.mp4

# Composite với đan xen full-screen
ffmpeg -y \
  -i avatar.mp4 \
  -i motion_top.mp4 \
  -i audio/full.mp3 \
  -filter_complex "[0:v][1:v]overlay=x=0:y=0:enable='between(t,0,14.5)+between(t,15.2,28.1)+between(t,29.0,40.3)'[out]" \
  -map "[out]" -map 2:a \
  -c:v libx264 -crf 20 -preset fast \
  -c:a aac -b:a 192k \
  -shortest \
  <slug>-9-16.mp4
```

---

---

## Layout 3: PiP composite (motion full + face mini window)

### Cơ chế PiP

Motion graphic fill TOÀN BỘ 1080×1920 canvas. Avatar được crop lấy phần mặt/thân, scale xuống nhỏ (~270×360px), đặt góc dưới phải.

**Khi nào dùng PiP**: beats có nội dung visual cần nhiều không gian (full canvas motion graphic quan trọng hơn việc thấy mặt to), hoặc xen kẽ sau split để thay đổi nhịp.

### PiP face crop + scale

```bash
# Crop phần head+shoulders từ avatar, scale xuống PiP size
# Crop: 1080 wide × 1440 tall, bắt đầu y=200 (lấy phần đầu+thân)
# Scale: 270×360 (25% width, 3:4 aspect ratio)
[av_pip_src]crop=1080:1440:0:200,scale=270:360[pip_face]
```

| | Value |
|---|---|
| PiP size | 270 × 360 px |
| Position | x=790, y=1520 (padding 20px từ cạnh phải, 40px từ đáy) |
| Source crop | 1080×1440 tại y=200 (head+shoulders) |

### PiP với rounded corners (optional)

Thêm bo góc cho face PiP bằng `geq` filter (radius r=20):

```bash
[av_pip_src]crop=1080:1440:0:200,scale=270:360,format=rgba,geq=r='r(X\,Y)':g='g(X\,Y)':b='b(X\,Y)':a='if(lt(X\,20)*lt(Y\,20)*gt(hypot(20-X\,20-Y)\,20)\,0\,if(gt(X\,250)*lt(Y\,20)*gt(hypot(X-250\,20-Y)\,20)\,0\,if(lt(X\,20)*gt(Y\,340)*gt(hypot(20-X\,Y-340)\,20)\,0\,if(gt(X\,250)*gt(Y\,340)*gt(hypot(X-250\,Y-340)\,20)\,0\,255))))'[pip_face]
```

(W=270, H=360, r=20 → W-r=250, H-r=340)

### Full composite command — 3 layouts đan xen

```bash
cd workspace/content/<date>/<slug>

# Bước 1: Crop motion thành top panel (cho layout split)
ffmpeg -y -i <slug>-motion.mp4 -vf "crop=1080:1152:0:0" -c:v libx264 -crf 18 motion_top.mp4

# Bước 2: Composite với cả 3 layout types
ffmpeg -y \
  -i avatar.mp4 \              # [0]: HeyGen 1080×1920 base
  -i motion_top.mp4 \          # [1]: 1080×1152 (split beats)
  -i <slug>-motion.mp4 \       # [2]: 1080×1920 full (PiP beats)
  -i audio/full.mp3 \          # [3]: ElevenLabs VO
  -filter_complex "
    [0:v]split=3[av_full][av_face_src][av_pip_src];
    [av_face_src]crop=1080:768:0:340[face_crop];
    [av_pip_src]crop=1080:1440:0:200,scale=270:360[pip_face];
    [av_full][1:v]overlay=x=0:y=0:enable='<split_beats>'[with_split];
    [with_split][face_crop]overlay=x=0:y=1152:enable='<split_beats>'[after_split];
    [after_split][2:v]overlay=x=0:y=0:enable='<pip_beats>'[with_pip_motion];
    [with_pip_motion][pip_face]overlay=x=790:y=1520:enable='<pip_beats>'[out]
  " \
  -map "[out]" -map 3:a \
  -c:v libx264 -crf 20 -preset fast \
  -c:a aac -b:a 192k \
  -shortest \
  <slug>-9-16.mp4
```

**Thay thế**:
- `<split_beats>` = `between(t,start1,end1)+between(t,start2,end2)` — beats dùng Layout 2
- `<pip_beats>` = `between(t,start3,end3)+between(t,start4,end4)` — beats dùng Layout 3
- Beats không xuất hiện trong bất kỳ `enable=` nào → Layout 1 (full-face, avatar làm base)

### Lưu ý khi dùng PiP

- `<slug>-motion.mp4` (full 1920) làm input riêng biệt vì nó KHÁC `motion_top.mp4` (đã crop 1152px)
- Không re-crop `<slug>-motion.mp4` — dùng nguyên 1080×1920 để phủ toàn canvas
- Khi scenes dùng PiP layout, content HTML có thể đặt elements đến y=1900 (không bị avatar cover phần trên)
- PiP face slide-in animation: thêm `y='if(between(t,T,T+0.3),(T+0.3-t)/0.3*480+1520,1520)'` cho smooth entrance

---

## Biến thể: Always-split (không đan xen)

Nếu không cần full-screen avatar, dùng vstack đơn giản hơn:

```bash
# Crop avatar: lấy phần có khuôn mặt (top 768px của avatar 1080×1920)
ffmpeg -y -i avatar.mp4 -vf "crop=1080:768:0:0" avatar_face.mp4

# Stack dọc
ffmpeg -y \
  -i motion_top.mp4 \   # 1080×1152 (top)
  -i avatar_face.mp4 \  # 1080×768  (bottom)
  -i audio/full.mp3 \
  -filter_complex "[0:v][1:v]vstack[out]" \
  -map "[out]" -map 2:a \
  -c:v libx264 -crf 20 -preset fast \
  -c:a aac -b:a 192k \
  -shortest \
  <slug>-9-16-split.mp4
```

Total: 1152 + 768 = 1920 ✓

---

## HeyGen cho 9:16

```bash
# Dimension 1080×1920 thay vì 720×1280
curl -X POST https://api.heygen.com/v2/video/generate \
  -H "X-Api-Key: $HEYGEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "video_inputs": [{
      "character": {
        "type": "avatar",
        "avatar_id": "c55f8a66351d415f8d9c08737f1a37af",
        "avatar_style": "normal"
      },
      "voice": {
        "type": "audio",
        "audio_asset_id": "<audio_asset_id>"
      }
    }],
    "dimension": { "width": 1080, "height": 1920 },
    "aspect_ratio": null
  }'
```

Output avatar.mp4 đã là 1080×1920 — không cần scale.

---

## Thông số tổng hợp

| | Value |
|---|---|
| Canvas output | 1080 × 1920 |
| Motion graphic rendered | 1080 × 1920 (HyperFrames) |
| Motion crop | 1080 × 1152 (crop top 60%) |
| Avatar (HeyGen) | 1080 × 1920 |
| Overlay position | x=0, y=0 |
| Split boundary | y = 1152 |
| Avatar visible bottom | y = 1152 → 1920 (768px) |
| Enable expression | between(t, start, end) per beat |

---

## ⚠️ QUAN TRỌNG: Không được overlap enable expressions

Split và PiP `enable=` phải NON-OVERLAPPING. Nếu overlap, cả 2 overlay cùng active → visual artifact (double overlay, content clipped).

```bash
# ĐÚNG — không overlap
SPLIT="between(t,10.3,55.6)+between(t,81.5,110.4)"
PIP="between(t,55.6,81.5)"

# SAI — overlap ở 55.6-56.1s và 81.1-81.5s
# SPLIT="between(t,10.3,56.1)+between(t,81.1,110.4)"
# PIP="between(t,55.6,81.5)"
```

Quy tắc: `split_end == pip_start` và `pip_end == split_restart`. Hard cut tại boundary.

---

## Subtitle pipeline — Karaoke-style (pill bo góc + per-word highlight)

**Cách đúng**: dùng Pillow Python renderer. ASS `BorderStyle=3` chỉ tạo box vuông — không bo góc, không per-word karaoke.

### Script: `scripts/gen_karaoke_subs.py`

Copy từ: `.claude/skills/mkt-hyperframe-knowledge-video-9-16/scripts/gen_karaoke_subs.py`

**Cần**: `pip install Pillow` + font `C:\Windows\Fonts\LeelaUIb.ttf` (Windows có sẵn)

### Pipeline

```bash
# Bước 1: Generate PNG frames + concat.txt
python scripts/gen_karaoke_subs.py
# Output: audio/karaoke_pngs/ (92+ PNG files + concat.txt)

# Bước 2: Overlay trực tiếp lên composite (không cần intermediate file)
CONCAT="audio/karaoke_pngs/concat.txt"
ffmpeg -y \
  -i <slug>-9-16.mp4 \
  -f concat -safe 0 -i "$CONCAT" \
  -filter_complex "[0:v][1:v]overlay=0:0:format=auto[out]" \
  -map "[out]" -map 0:a \
  -c:v libx264 -crf 20 -preset fast \
  -c:a copy \
  <slug>-9-16-sub.mp4
```

### Config trong script (tuning)

| Param | Default | Ý nghĩa |
|---|---|---|
| `FONT_SIZE` | 36 | Kích thước chữ |
| `PILL_BG` | `(0,0,0,204)` | Nền pill đen 80% opacity |
| `PILL_PAD_X/Y` | 30 / 16 | Padding trong pill |
| `PILL_R` | 26 | Bo góc pill |
| `HL_BG` | `(79,195,247,255)` | Màu cyan highlight box |
| `HL_PAD_X/Y` | 8 / 4 | Extra padding quanh highlight box |
| `SUB_Y_CENTER` | `CANVAS_H - 840` | Vị trí dọc subtitle (y=1080 từ trên) |
| `MAX_SEG_CHARS` | 10 | Split từ dài hơn N chars thành chunks |
| `MAX_LINE_SEGS` | 4 | Tối đa số segment/dòng hiển thị |
| `MAX_LINE_CHARS` | 22 | Tối đa ký tự/dòng hiển thị |
| `HL_TEXT_COL` | `(15,15,15,255)` | Màu chữ trên cyan box (đen) |
| `MAX_PILL_W` | 1000 | Giới hạn pill width (không vượt canvas) |

### Cách hoạt động

1. Đọc `alignment.json` (fields: `char`, `start_ms`, `end_ms`)
2. Group chars → space-separated words
3. Split từ dài (>10 chars) thành 10-char chunks với timing tỷ lệ
4. Group chunks → display lines (max 4 chunks, 22 chars mỗi dòng)
5. Mỗi event = 1 display line + 1 chunk được highlight
6. Render PNG 1080×1920 RGBA mỗi event:
   - **Width**: dùng `font.getlength()` + 4px buffer (không dùng `getbbox()[2]` — Thai diacritics bị undercount)
   - **Highlight box top/bottom**: dùng `text_y + bb[1]` và `text_y + bb[3]` từ `getbbox()` — Thai tone marks (่ ้ ็) extend lên trên `text_y`, nếu dùng `text_y - HL_PAD_Y` cố định sẽ bị cắt
   - **text_y**: `pill_y + PILL_PAD_Y - min_top` để glyph top đúng nằm trong pill
7. `concat.txt` với duration chính xác → ffmpeg concat → overlay alpha

### Audio source rule

```bash
# Luôn dùng -map 0:a từ composite đã có SFX
# Không re-map lại audio/full.mp3 (mất SFX)
-map 0:a   # ✅ audio từ <slug>-9-16.mp4 (đã có TTS + SFX)
```
