---
name: mkt-hyperframe-knowledge-video-9-16-th
description: Tạo video 9:16 (1080×1920) tiếng Thái cho TikTok/Reels — motion graphic HyperFrames + talking-head HeyGen, 3 layout đan xen (full-face / split / PiP), ElevenLabs voice Thai, crossfade dissolve giữa layout, PiP glow border cyan, SFX whoosh. **MUST use** khi user nói "video tiếng Thái", "video Thai 9:16", "video Thái dọc", "Thai reels", "Thai TikTok", "Thai shorts", hoặc muốn làm video 9:16 với nội dung tiếng Thái.
---

# HyperFrame Knowledge Video 9:16 — Thai Language Pipeline

Extends `mkt-hyperframe-knowledge-video-9-16` với cấu hình cố định cho Thai language content.

**AUTOPILOT**: Chạy thẳng tới MP4. Dừng sau script+beats để user confirm trước khi TTS/render/HeyGen.

---

## Fixed Config (Thai)

| Param | Value |
|---|---|
| ElevenLabs Voice | `2AhJ0tIW1g4BeBvK0J5Y` (Mai Kim Quý) |
| ElevenLabs Model | `eleven_v3` |
| HeyGen Avatar ID | `c55f8a66351d415f8d9c08737f1a37af` |
| HeyGen Dimension | `1080 × 1920` |
| Canvas | `1080 × 1920` |
| Language code | `th` (Thai) |

---

## Layout Sequence (đã kiểm chứng)

```
Beat 1  → Full-face   (mở đầu LUÔN full màn hình)
Beat 2  → Split       (content area top 60% + face bottom 40%)
Beat 3  → Split
Beat 4  → PiP         (motion full 1920px + face mini góc dưới phải)
Beat 5  → Split
Beat 6  → Full-face
Beat 7  → Full-face   (CTA close)
```

**Rule**: Beat đầu tiên LUÔN là full-face. Beat CTA cuối LUÔN là full-face. Giữa đan xen split + PiP ≥ 1 lần.

---

## ffmpeg Composite Template

Sau khi có: `audio/avatar.mp4` + `motion_top.mp4` (crop top 1152px) + `<slug>-motion.mp4` (full 1920px) + `audio/sfx_track.wav`

```bash
# Trim offsets: T=0.3 (transition duration), H=T/2=0.15
# SegA face  [0,             b1_end+H]
# SegB split [b1_end-H,      b3_end+H]    ← beats 2+3 combined
# SegC pip   [b3_end-H,      b4_end+H]
# SegD split [b4_end-H,      b5_end+H]
# SegE face  [b5_end-H,      total]

ffmpeg -y \
  -i "audio/avatar.mp4" \
  -i "motion_top.mp4" \
  -i "<slug>-motion.mp4" \
  -i "audio/sfx_track.wav" \
  -filter_complex "
    [0:v]split=6[s_faceA][s_faceE][s_split_base][s_pip_base][s_face_src][s_pip_src];
    [s_face_src]crop=1080:768:0:340[face_crop];
    [s_pip_src]crop=1080:1440:0:200,scale=270:360,split=2[pip_f1][pip_f2];
    [pip_f1]pad=iw+12:ih+12:6:6:color=0x4fc3f7FF,boxblur=luma_radius=5:luma_power=2:chroma_radius=5:chroma_power=2[pip_glow];
    [pip_glow][pip_f2]overlay=6:6[pip_bordered];
    [s_split_base][1:v]overlay=x=0:y=0[split_tmp];
    [split_tmp][face_crop]overlay=x=0:y=1152[mode_split];
    [mode_split]split=2[mode_split_b][mode_split_d];
    [s_pip_base][2:v]overlay=x=0:y=0[pip_tmp];
    [pip_tmp][pip_bordered]overlay=x=784:y=1514[mode_pip];
    [s_faceA]trim=start=0:end=<b1_end+0.15>,setpts=PTS-STARTPTS[segA];
    [mode_split_b]trim=start=<b1_end-0.15>:end=<b3_end+0.15>,setpts=PTS-STARTPTS[segB];
    [mode_pip]trim=start=<b3_end-0.15>:end=<b4_end+0.15>,setpts=PTS-STARTPTS[segC];
    [mode_split_d]trim=start=<b4_end-0.15>:end=<b5_end+0.15>,setpts=PTS-STARTPTS[segD];
    [s_faceE]trim=start=<b5_end-0.15>:end=<total>,setpts=PTS-STARTPTS[segE];
    [segA][segB]xfade=transition=fade:duration=0.3:offset=<b1_end-0.15>[out1];
    [out1][segC]xfade=transition=fade:duration=0.3:offset=<b1_end-0.15 + segB_dur - 0.3>[out2];
    [out2][segD]xfade=transition=fade:duration=0.3:offset=<prev+segC_dur-0.3>[out3];
    [out3][segE]xfade=transition=fade:duration=0.3:offset=<prev+segD_dur-0.3>[outv];
    [0:a][3:a]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[aout]
  " \
  -map "[outv]" -map "[aout]" \
  -t <total_duration> \
  -c:v libx264 -crf 20 -preset fast \
  -c:a aac -b:a 192k \
  "<slug>-9-16.mp4"
```

### xfade offset computation (Python snippet)

```python
T = 0.3
H = T / 2  # = 0.15

# Beat boundaries (seconds) from alignment.json
b1, b3, b4, b5, total = 14.880, 41.760, 65.840, 80.480, 103.200

# Segment durations
durA = b1 + H           # face
durB = (b3 + H) - (b1 - H)  # split (b2+b3)
durC = (b4 + H) - (b3 - H)  # pip
durD = (b5 + H) - (b4 - H)  # split (b5)
# durE = total - (b5-H)  # face (b6+b7)

# xfade offsets (cumulative from out-start)
off1 = durA - T                   # A→B
off2 = durA + durB - 2*T         # out1→C
off3 = durA + durB + durC - 3*T  # out2→D
off4 = durA + durB + durC + durD - 4*T  # out3→E
```

---

## SFX Generation (whoosh at beat transitions)

Beat transition timestamps (ms) = [b1_ms-200, b2_ms-200, b3_ms-200, b4_ms-200, b5_ms-200, b6_ms-200]

```bash
ffmpeg -y \
  -f lavfi -i "anoisesrc=color=pink:duration=0.5" \
  # repeat × 6 (one per beat transition)
  -filter_complex \
    "[0]volume=3,highpass=f=600,lowpass=f=7000,afade=type=in:st=0:d=0.04,afade=type=out:st=0.18:d=0.32,adelay=<t1ms>|<t1ms>[s1];
     [1]...,adelay=<t2ms>|<t2ms>[s2];
     ...
     [s1][s2][s3][s4][s5][s6]amix=inputs=6:duration=longest,volume=0.6[sfx]" \
  -map "[sfx]" -t <total> -ar 44100 -ac 2 \
  audio/sfx_track.wav
```

---

## PiP Glow Border Details

- Face crop: `crop=1080:1440:0:200,scale=270:360`
- Glow: `pad=iw+12:ih+12:6:6:color=0x4fc3f7FF` then `boxblur=luma_radius=5:luma_power=2:chroma_radius=5:chroma_power=2`
- Original face overlaid at offset `6:6` on top of blurred glow layer
- Composite PiP position: `x=784:y=1514` (face appears at x=790, y=1520 inside 6px glow margin)

Also add in scene-04 HTML: `.s4-pip-frame` div at `left:793px; top:1523px; width:270px; height:360px` with cyan border + box-shadow, fades in after all agent cards shown.

---

## Scene-04 Agent Cards (PiP beat) — Thai version

2×4 grid, card height 240px, gap 20px, top 116px → cards fill y≈230..1340 (70% of canvas).
Bao gồm 8 agent cards: Alex (cyan), Andy (amber), Lynn (mint), Kyle (sky), Phil (coral), Derek (purple), Maya (pink), Henry (amber).
Pairs enter at t=1.0, 4.4, 8.8, 13.2s. PiP frame fades in at t=14.2s. Glow pulse at t=14.4s.

---

## Captions (karaoke-pill style, mặc định cho MỌI video)

**Luôn thêm phụ đề kiểu này sau khi composite xong `<slug>-9-16.mp4`** — không chỉ khi user yêu cầu riêng. Đây là style đã chốt (xem ví dụ thực tế): pill nền tối bo góc ôm theo từng cụm từ, từ đang nói được highlight bằng box cyan, chữ trong box highlight chuyển màu navy đậm để tương phản.

| Param | Value |
|---|---|
| Pill background | `rgba(5,8,16,0.68)`, border `1px solid rgba(255,255,255,0.08)`, `border-radius: 18px`, padding `16px 32px` |
| Highlight box | `#4fc3f7` (brand cyan — đổi theo `cyan` trong design.md nếu khác), `border-radius: 10px` |
| Text màu thường | `#faf9f5` |
| Text màu khi active (trên nền cyan) | `#050810` |
| Font | Inter 800, base 46px, min 30px (auto-shrink theo `fontSizeForGroup`) |
| Vị trí — beat face (1, 6, 7) | `bottom: 130px` |
| Vị trí — beat split/pip (2–5) | `bottom: 800px` |

### Pipeline

1. **Tách từ tiếng Thái thật** bằng `pythainlp` (`word_tokenize(text, engine='newmm')`) trên `audio/alignment.json` — KHÔNG dùng khoảng trắng trong kịch bản TTS (đó chỉ là ranh giới cụm câu, không phải ranh giới từ). Cài nếu chưa có: `python -m pip install pythainlp`.
2. `python scripts/build_karaoke_words.py <project_dir>` → đọc `audio/alignment.json` + `beats.json`, gom từ thành nhóm phụ đề (≤4 từ, ≤22 ký tự, ngắt theo gap ≥150ms hoặc đổi layout face/split/pip), ghi `karaoke_groups.json`.
3. `python scripts/gen_caption_comp.py <project_dir>` → sinh composition HyperFrames transparent 1080×1920 tại `captions-overlay/index.html`, mỗi từ có span riêng để animate highlight box theo timing thật.
4. **KHÔNG dùng `npx hyperframes render --format webm`** để xuất composition này — pipeline VP9-alpha của HyperFrames CLI bị lỗi (alpha luôn ra 255, nền đen che hết video, dù raw PNG frame có alpha đúng). Thay vào đó:
   ```bash
   cd captions-overlay
   npx hyperframes render --format png-sequence --output frames_test
   ```
5. **Overlay PNG sequence trực tiếp** lên video gốc (KHÔNG qua webm trung gian):
   ```bash
   ffmpeg -y -i "<slug>-9-16-nosubs.mp4" \
     -framerate 30 -i "captions-overlay/frames_test/frame_%06d.png" \
     -filter_complex "[1:v]format=rgba[ov];[0:v][ov]overlay=0:0:format=auto:shortest=1" \
     -c:v libx264 -crf 18 -preset fast -c:a copy \
     "<slug>-9-16.mp4"
   ```
6. Dọn dẹp: xóa `captions-overlay/frames_test/` (rất nặng, ~3000 PNG cho video 100s) sau khi composite xong. Giữ lại `captions-overlay/index.html`, `karaoke_groups.json` để có thể render lại nếu cần sửa.

### Lý do từng quyết định

- **`pythainlp` thay vì split theo dấu cách**: tiếng Thái không có khoảng trắng giữa từ trong văn viết thật; khoảng trắng trong kịch bản TTS chỉ là ranh giới cụm/breath-pause do người viết chèn, dùng nó để chia từ sẽ ra các "từ" dài cả cụm (không tự nhiên khi highlight).
- **PNG sequence thay vì webm**: đã verify trực tiếp — frame PNG do `hyperframes render` chụp ra có alpha channel đúng (kiểm tra bằng PIL: nền có alpha=0, chữ có alpha=255/173 ở viền AA), nhưng bước encode VP9-alpha nội bộ của HyperFrames CLI làm hỏng alpha (encode ra toàn 255). Bypass bằng cách overlay PNG sequence thẳng vào ffmpeg, không qua webm.
- **Vị trí 130px/800px từ đáy**: tương đương tọa độ ASS cũ y=1750/y=1080 (PlayResY=1920) đã kiểm chứng không che mặt/PiP, giữ nguyên logic.

---

## Pipeline Steps

1. **Script + beats** (7 beats × 8–15s) → confirm với user
2. **TTS**: `python scripts/tts.py --voice 2AhJ0tIW1g4BeBvK0J5Y --model eleven_v3 --input tts-input.md --out audio/`
3. **Alignment**: extract beat boundaries from `alignment.json`
4. **Scenes**: fan out parallel sub-agents, 1 per scene, 9:16 safe zone (content top 1152px)
5. **Master index.html**: `data-width="1080" data-height="1920"`, brand stamp top-left
6. **Render**: `npx hyperframes render . --output <slug>-motion.mp4`
7. **motion_top.mp4**: `ffmpeg -i <slug>-motion.mp4 -vf crop=1080:1152:0:0 motion_top.mp4`
8. **HeyGen**: upload audio → generate 1080×1920 → poll → download `audio/avatar.mp4`
9. **SFX**: generate `audio/sfx_track.wav` (6 whoosh bursts)
10. **Composite**: ffmpeg xfade template above → `<slug>-9-16-nosubs.mp4`
11. **Captions**: chạy pipeline karaoke-pill ở mục trên → `<slug>-9-16.mp4` (deliverable cuối cùng, có phụ đề)

---

## Reference Example

- `workspace/content/2026-06-16/topexpert-ai-agent-pro-th/` — working example với đầy đủ SFX, PiP border, xfade dissolve, opening full-face, và karaoke-pill captions (xem `karaoke_groups.json`, `captions-overlay/index.html`)
- Beat map: b1=14.880s, b2=28.960s, b3=41.760s, b4=65.840s, b5=80.480s, b6=94.240s, total=103.200s
