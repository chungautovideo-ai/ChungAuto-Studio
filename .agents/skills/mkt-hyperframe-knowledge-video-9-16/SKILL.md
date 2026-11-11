---
name: mkt-hyperframe-knowledge-video-9-16
description: Tạo video kiến thức / tin tức 9:16 (1080×1920) vertical cho TikTok/Reels/Shorts — motion graphic phía trên + talking-head HeyGen phía dưới, đan xen 3 layout: full-screen avatar, split-screen, và PiP (motion full + face góc dưới). Pipeline giống skill 16:9 nhưng canvas dọc + composite vstack. **MUST use** khi user nói "video dọc", "video tiktok", "video reels", "video shorts", "9:16", "video đứng", hoặc muốn layout motion graphic trên + người nói dưới như reference.
---

# HyperFrame Knowledge Video 9:16 — Vertical Pipeline

Video 9:16 vertical (1080×1920). Motion graphic overlay phía trên, HeyGen talking-head ở dưới. Đan xen **3 layout** để tránh nhàm chán: full-screen avatar, split layout, và PiP layout.

**AUTOPILOT**: Chạy thẳng tới MP4, không dừng hỏi. Thiếu info → tự chọn default. Chỉ hỏi khi không có topic/script nào.

> **[MEMORY OVERRIDE]** Sau khi viết script + chia beats, PHẢI dừng lại để user review và confirm trước khi sản xuất (TTS, render, HeyGen). Xem [[feedback_script_confirm_before_production]].

---

## Layout reference

**3 layout khả dụng — đan xen để tránh nhàm chán:**

### Layout 1 — Full-face (avatar full screen)
```
┌──────────────────┐  y=0
│                  │
│  AVATAR          │  1080 × 1920 px
│  HeyGen          │  Không có motion graphic
│  full screen     │  Người nói chiếm toàn màn hình
│                  │
└──────────────────┘  y=1920
```

### Layout 2 — Split (motion top + face bottom)
```
┌──────────────────┐  y=0
│  MOTION GRAPHIC  │  1080 × 1152 px  (60% của 1920)
│  HyperFrames     │  Hero text, stats, cards, particles
├──────────────────┤  y=1152
│  TALKING HEAD    │  1080 × 768 px   (40% của 1920)
│  HeyGen avatar   │  Crop face từ avatar, crop=1080:768:0:340
└──────────────────┘  y=1920
```

### Layout 3 — PiP (motion full + face mini window)
```
┌──────────────────┐  y=0
│                  │
│  MOTION GRAPHIC  │  1080 × 1920 px  (full screen motion)
│  HyperFrames     │  Nội dung có thể dùng TOÀN bộ canvas
│              ┌───┤  y=1400
│              │pip│  270 × 480 px  (face mini window)
└──────────────┴───┘  y=1920
                 x=790
```

**Layout 3 notes**: motion graphic fill toàn 1080×1920. Khi dùng PiP layout, scenes có thể đặt content xuống thấp hơn y=1100 (không bị avatar che). Face PiP nhỏ góc dưới phải.

**Cơ chế đan xen**:
- Base: `avatar.mp4` (1080×1920) full screen LUÔN LUÔN
- Layout 2: overlay `motion_top.mp4` (1080×1152) với `enable='between(t,...)'`
- Layout 3: overlay `<slug>-motion.mp4` (1080×1920 full) + overlay PiP face (scaled avatar) với `enable='between(t,...)'`

---

## Điểm khác biệt so với skill 16:9

| | 16:9 skill | 9:16 skill (này) |
|---|---|---|
| Canvas | 1920×1080 | 1080×1920 |
| Motion area | Full canvas | Top 60%: 1080×1152 |
| Avatar | Side-by-side (phải) | Bottom 40%: 1080×768 |
| Composite | ffmpeg overlay x=1440 | ffmpeg overlay y=0 + `enable=` |
| Content width | 1280px | 960px |
| Content left | 37% | 50% (căn giữa 1080) |
| Hero font | 118px | 80-96px |
| Brand stamp | bottom-right | top-left hoặc ẩn |

Mọi quy tắc GSAP / mulberry32 / sub-comp / TTS pipeline: giữ nguyên từ `../mkt-hyperframe-knowledge-video/SKILL.md`.

---

## Pipeline overview

```
1.  Lấy topic / script                       (Codex, KHÔNG hỏi)
2.  Viết script                              (Codex)
3.  Chia beats                               (3-6 beats, mỗi beat 8-15s)
4.  TTS + alignment                          (scripts/tts.py từ skill 16:9)
5.  Map beats → time ranges                  (beats.json)
6.  Tạo design.md                            (palette 9:16)
7.  Tạo master index.html (1080×1920)        (references/master-scaffold-9-16.md)
8.  Fan out parallel sub-agents (1/scene)    (Agent tool)
9.  Validate + render                        (npx hyperframes render)
10. HeyGen: upload audio → generate → download avatar.mp4
11. ffmpeg composite → <slug>-9-16.mp4
12. Report
```

Bước 4 (TTS) kick background, song song làm 6+7.

---

## Step 7 — master index.html (1080×1920)

Canvas khác từ 16:9:

```html
<div id="root" data-width="1080" data-height="1920"
     style="position:relative;width:1080px;height:1920px;overflow:hidden;
            background:#050810;">
```

Sub-comp scenes cũng `data-width="1080" data-height="1920"`.

Chi tiết scaffold: `references/master-scaffold-9-16.md`.

---

## Step 8 — Sub-agent prompt (scene 9:16)

Dùng template giống `../mkt-hyperframe-knowledge-video/SKILL.md` Step 8, nhưng thêm:

```
# 9:16 CONSTRAINTS
- Canvas: 1080 × 1920
- Content area: ONLY top 1152px (y=0 to y=1152). Bottom 768px sẽ bị avatar che.
- Content .content { top: 576px; left: 50%; transform: translate(-50%,-50%); width: 960px; }
  → center of content area at y=576 (= 1152/2)
- Hero font: max 96px (không vượt quá 960px wide)
- Max 2 columns cards (không 4-column)
- Không đặt bất kỳ element nào dưới y=1100 (safety margin 52px trước split)
- Brand stamp: đặt top-left (top:52px; left:40px) HOẶC bỏ — không đặt bottom
```

---

## Step 9 — Render

```bash
cd workspace/content/<date>/<slug>
npx hyperframes render . --output <slug>-motion.mp4
# Canvas 1080×1920, chỉ cần phần trên — sẽ crop ở bước composite
```

---

## Step 10 — HeyGen avatar (1080×1920)

Giống pipeline trong `../mkt-hyperframe-knowledge-video/references/heygen-avatar-composite.md` nhưng:
- `"dimension": { "width": 1080, "height": 1920 }` thay vì 720×1280
- Output: avatar đã là 9:16, không cần scale

```bash
# Upload audio → generate với dimension 1080×1920 → poll → download
curl -X POST https://api.heygen.com/v2/video/generate \
  -H "X-Api-Key: $HEYGEN_API_KEY" \
  -d '{
    "video_inputs": [{
      "character": { "type": "avatar", "avatar_id": "<avatar_id>", "avatar_style": "normal" },
      "voice": { "type": "audio", "audio_asset_id": "<audio_asset_id>" }
    }],
    "dimension": { "width": 1080, "height": 1920 }
  }'
```

Avatar ID của user: `c55f8a66351d415f8d9c08737f1a37af`

---

## Step 11 — ffmpeg composite (9:16)

Chi tiết đầy đủ: `references/avatar-composite-9-16.md`.

**Layout 2 (Split) — tóm tắt**:
```bash
# Crop motion graphic: chỉ lấy top 1152px
ffmpeg -y -i <slug>-motion.mp4 -vf "crop=1080:1152:0:0" motion_top.mp4

# Composite: avatar full-screen base + motion overlay theo timing + face slide-in
ffmpeg -y \
  -i avatar.mp4 \       # 1080×1920 base
  -i motion_top.mp4 \   # 1080×1152 overlay
  -filter_complex "
    [0:v]split=2[av_full][av_face_src];
    [av_face_src]crop=1080:768:0:340[face_crop];
    [av_full][1:v]overlay=x=0:y=0:enable='<split_beats>'[with_motion];
    [with_motion][face_crop]overlay=x=0:y=1152:enable='<split_beats>'[out]
  " \
  -map "[out]" -map 0:a \
  -c:v libx264 -crf 20 -preset fast -c:a copy -shortest \
  <slug>-9-16.mp4
```

**Layout 3 (PiP) — tóm tắt**:
```bash
# PiP sử dụng motion graphic FULL (không crop), face scaled nhỏ góc dưới phải
ffmpeg -y \
  -i avatar.mp4 \              # 1080×1920 base (full-face beats)
  -i motion_top.mp4 \          # 1080×1152 (split beats)
  -i <slug>-motion.mp4 \       # 1080×1920 full motion (PiP beats)
  -filter_complex "
    [0:v]split=3[av_full][av_face_src][av_pip_src];
    [av_face_src]crop=1080:768:0:340[face_crop];
    [av_pip_src]crop=1080:1440:0:200,scale=270:360[pip_face];
    [av_full][1:v]overlay=x=0:y=0:enable='<split_beats>'[with_split_motion];
    [with_split_motion][face_crop]overlay=x=0:y=1152:enable='<split_beats>'[after_split];
    [after_split][2:v]overlay=x=0:y=0:enable='<pip_beats>'[with_pip_motion];
    [with_pip_motion][pip_face]overlay=x=790:y=1520:enable='<pip_beats>'[out]
  " \
  -map "[out]" -map 0:a \
  -c:v libx264 -crf 20 -preset fast -c:a copy -shortest \
  <slug>-9-16.mp4
```

Chi tiết đầy đủ + rounded corners + SFX: `references/avatar-composite-9-16.md`.

---

## Typography 9:16

| Element | Size | Note |
|---|---|---|
| Hero | 80-96px Inter 900 | Max 1 dòng trong 960px |
| Subtitle / stat | 60-72px Inter 900 | |
| Eyebrow | 18px JetBrains Mono 500 | letter-spacing 0.28em |
| Body | 24-28px Inter 400 | |
| Card title | 32px Inter 700 | |
| Card desc | 20px Inter 400 | |

**Safe zone** (không đặt content): y < 40px (top), y > 1100px (bottom — avatar overlap area).

---

## Design differences (9:16)

Palette: giống 16:9 (`#050810`, cyan `#4fc3f7`, coral `#d97757`, amber `#ffcb6b`).

Layout changes:
- **Focal glow**: nhỏ hơn — `600px × 500px` tại `top: 50%; left: 50%` của content area
- **Particles**: 60-80 dots (ít hơn 16:9)
- **Cards**: max 2 columns (2×2 hoặc list vertical)
- **Stat row**: max 2 stat cards (không 3)

---

## References

- `references/master-scaffold-9-16.md` — index.html scaffold 1080×1920
- `references/avatar-composite-9-16.md` — ffmpeg crop + overlay pipeline đầy đủ, subtitle pipeline (CapCut-style dark box), enable-expression overlap rule
- `../mkt-hyperframe-knowledge-video/SKILL.md` — pipeline gốc, GSAP rules, TTS, sub-agent patterns
- `../mkt-hyperframe-knowledge-video/references/heygen-avatar-composite.md` — HeyGen API
- `../mkt-hyperframe-knowledge-video/references/anti-patterns.md` — 24 lỗi thường gặp

---

**Spec version 1.2** — 9:16 vertical, 3 layout: full-face / split / PiP. PiP: motion full 1080×1920 + face 270×360px góc dưới phải. Script confirm trước sản xuất. Subtitle: CapCut-style dark box (BorderStyle=3, BackColour &H40000000, Outline=16). Enable expressions must be non-overlapping.
