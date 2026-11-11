# HeyGen Avatar Composite Pipeline

Post-render pipeline: thêm talking-head avatar HeyGen lên video motion graphic, đặt bên phải, bo góc + viền + glow.

---

## 1. Chuẩn bị content layout (BẮT BUỘC trước khi render)

Khi dùng avatar composite, content HTML phải dịch sang trái để không bị avatar đè lên.

### Thay đổi trong mỗi scene (scene-01, 02, 03...):

```css
/* TRƯỚC (mặc định) */
.content {
  left: 50%;
  transform: translate(-50%, -50%);
  width: 1600px; /* hoặc 1720px scene-02 */
}

/* SAU (avatar mode) */
.content {
  left: 37%;
  transform: translate(-50%, -50%);
  width: 1280px;
}
```

Kết quả: content spans x=80 → x=1360. Avatar bắt đầu x=1440 → **80px gap** rõ ràng.

### Scene-02 (4 capability cards):

```css
/* TRƯỚC */
.cap-card { width: 380px; padding: 32px 30px 28px; }

/* SAU */
.cap-card { width: 280px; padding: 24px 20px 20px; }
```

4 cards × 280px + 3 gaps × 28px = 1204px — fits trong 1280px ✓

---

## 2. HeyGen avatar generation

### 2a. Upload audio

```bash
curl -X POST https://upload.heygen.com/v1/asset \
  -H "X-Api-Key: $HEYGEN_API_KEY" \
  -H "Content-Type: audio/mpeg" \
  --data-binary @audio/full.mp3
# → { "data": { "id": "<audio_asset_id>" } }
```

### 2b. Generate avatar video

```bash
curl -X POST https://api.heygen.com/v2/video/generate \
  -H "X-Api-Key: $HEYGEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "video_inputs": [{
      "character": {
        "type": "avatar",
        "avatar_id": "<avatar_id>",
        "avatar_style": "normal"
      },
      "voice": {
        "type": "audio",
        "audio_asset_id": "<audio_asset_id>"
      }
    }],
    "dimension": { "width": 720, "height": 1280 },
    "aspect_ratio": null
  }'
# → { "data": { "video_id": "<video_id>" } }
```

Avatar ID của user: `c55f8a66351d415f8d9c08737f1a37af`

### 2c. Poll status + download

```bash
# Poll mỗi 5s đến khi status = "completed"
curl "https://api.heygen.com/v1/video_status.get?video_id=<video_id>" \
  -H "X-Api-Key: $HEYGEN_API_KEY"
# → { "data": { "status": "completed", "video_url": "https://..." } }

# Download
curl -L "<video_url>" -o avatar.mp4
```

Output: `avatar.mp4` — 720×1280 (9:16 portrait), lip-synced với audio.

---

## 3. ffmpeg filter script (filter_avatar.txt)

Tạo file `filter_avatar.txt` trong thư mục project:

```
[1:v]scale=420:747:flags=lanczos,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lt(X,28)*lt(Y,28)*gt(hypot(28-X,28-Y),28),0,if(gt(X,392)*lt(Y,28)*gt(hypot(X-392,28-Y),28),0,if(lt(X,28)*gt(Y,719)*gt(hypot(28-X,Y-719),28),0,if(gt(X,392)*gt(Y,719)*gt(hypot(X-392,Y-719),28),0,255))))'[av_rounded];
color=c=#d97757:s=432x759,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lt(X,34)*lt(Y,34)*gt(hypot(34-X,34-Y),34),0,if(gt(X,398)*lt(Y,34)*gt(hypot(X-398,34-Y),34),0,if(lt(X,34)*gt(Y,725)*gt(hypot(34-X,Y-725),34),0,if(gt(X,398)*gt(Y,725)*gt(hypot(X-398,Y-725),34),0,255))))',split=2[border_a][border_b];
[border_b][av_rounded]overlay=x=6:y=6[av_with_border];
[border_a]pad=w=472:h=799:x=20:y=20:color=0x00000000,format=rgba,gblur=sigma=15[border_glow];
[0:v][border_glow]overlay=x=1420:y=141[bg_glow];
[bg_glow][av_with_border]overlay=x=1440:y=161[out]
```

### Thông số (1920×1080 base):

| | Value | Note |
|---|---|---|
| Avatar scaled | 420×747 | 9:16, từ 720×1280 |
| Inner corner radius | r=28 | áp dụng cho av_rounded |
| Border width | 6px | màu coral #d97757 |
| Outer corner radius | r=34 | r_inner + border = 28+6 |
| Border layer | 432×759 | av+12px border each side |
| Glow pad | 472×799 | +20px each side cho blur spread |
| Glow blur | sigma=15 | ~45px soft halo |
| Avatar x position | 1440 | 48px từ right edge |
| Avatar y position | 161 | căn giữa: (1080-759)/2 |
| Glow x position | 1420 | = 1440-20 |
| Glow y position | 141 | = 161-20 |

### geq rounded corner formula (giải thích):

```
# Pixel (X,Y) bị cut (alpha=0) nếu nằm trong corner area VÀ ngoài quarter-circle
# TL corner: X<r AND Y<r AND distance_to_(r,r) > r
# TR corner: X>(W-r) AND Y<r AND distance_to_(W-r,r) > r
# BL corner: X<r AND Y>(H-r) AND distance_to_(r,H-r) > r
# BR corner: X>(W-r) AND Y>(H-r) AND distance_to_(W-r,H-r) > r

# For av_rounded (W=420, H=747, r=28):
# W-r = 392, H-r = 719
a='if(lt(X,28)*lt(Y,28)*gt(hypot(28-X,28-Y),28),0,
   if(gt(X,392)*lt(Y,28)*gt(hypot(X-392,28-Y),28),0,
   if(lt(X,28)*gt(Y,719)*gt(hypot(28-X,Y-719),28),0,
   if(gt(X,392)*gt(Y,719)*gt(hypot(X-392,Y-719),28),0,
   255))))'
```

---

## 4. Composite command

```bash
ffmpeg -y \
  -i <slug>.mp4 \
  -i avatar.mp4 \
  -filter_complex_script filter_avatar.txt \
  -map "[out]" -map 0:a \
  -c:v libx264 -crf 20 -preset fast \
  -c:a copy \
  -shortest \
  <slug>-with-avatar.mp4
```

- Audio: lấy từ input 0 (`<slug>.mp4` — ElevenLabs audio)
- Avatar audio bị bỏ qua (không map 1:a)
- `-shortest`: kết thúc khi video ngắn hơn trong 2 inputs hết

---

## 5. Workflow tổng thể

```
1. Chỉnh content CSS (left: 37%, width: 1280px, cap-card 280px)
2. npx hyperframes render → <slug>.mp4
3. Upload audio/full.mp3 lên HeyGen → audio_asset_id
4. POST /v2/video/generate với avatar_id + audio_asset_id → video_id
5. Poll cho đến completed → download avatar.mp4
6. Tạo filter_avatar.txt
7. ffmpeg composite → <slug>-with-avatar.mp4
```

---

## 6. Lưu ý

- **HeyGen API key**: `sk_V2_hgu_kAaoq7KrUXv_g6phyoll51nu8hjDzwRm0PcN9eclbqlw`
- **Avatar ID của user**: `c55f8a66351d415f8d9c08737f1a37af`
- HeyGen generation time: ~10-30s cho video 40s (rất nhanh)
- Avatar output là 720×1280 (9:16 portrait) — scale xuống 420×747 khi composite
- Nếu thay đổi vị trí avatar: cập nhật x=1440 trong filter + đảm bảo content width ≤ (x_avatar - 80)
- `border-glow` dùng coral (#d97757) để match palette cinematic của motion graphic

---

## 7. Layout PiP (Picture-in-Picture) — đan xen để tránh nhàm chán

**Khi nào dùng PiP**: beats có visual content quan trọng cần full 1920×1080 canvas (không bị chia đôi bởi avatar cạnh phải). Avatar nhỏ xuống thành mini window ~200×356px ở góc dưới phải, xen kẽ với main avatar layout.

### So sánh 2 layout 16:9

```
┌──────────────────────────────────┬────┐    ┌──────────────────────────────────┐
│                                  │    │    │                                  │
│   MOTION GRAPHIC                 │ AV │    │   MOTION GRAPHIC                 │
│   1920×1080 (1280px content)     │ AT │    │   1920×1080 (FULL canvas)        │
│                                  │ AR │    │                            ┌─────┤
│                                  │    │    │                            │ PiP │
└──────────────────────────────────┴────┘    └────────────────────────────┴─────┘
  Layout 1: Side avatar (x=1440)               Layout 2: PiP (bottom-right)
  → content left:37%, width:1280px             → content left:50%, width:1600px (full)
```

### Content CSS cho PiP layout (KHÔNG cần dịch trái)

Khi PiP active, content dùng lại full canvas width (layout mặc định):

```css
/* PiP beats — content giữ default, không cần dịch trái */
.content {
  left: 50%;
  transform: translate(-50%, -50%);
  width: 1600px;  /* hoặc 1720px */
}
```

**Nếu video mix cả 2 layout**: dùng JS để toggle class dựa vào thời gian — hoặc đơn giản hơn, dùng `left:37%; width:1280px` cho toàn video và PiP chỉ chiếm 1-2 beats ngắn.

### PiP filter script (filter_pip.txt)

```
[1:v]scale=200:356:flags=lanczos,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lt(X,16)*lt(Y,16)*gt(hypot(16-X,16-Y),16),0,if(gt(X,184)*lt(Y,16)*gt(hypot(X-184,16-Y),16),0,if(lt(X,16)*gt(Y,340)*gt(hypot(16-X,Y-340),16),0,if(gt(X,184)*gt(Y,340)*gt(hypot(X-184,Y-340),16),0,255))))'[pip_rounded];
color=c=#d97757:s=212x368,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lt(X,22)*lt(Y,22)*gt(hypot(22-X,22-Y),22),0,if(gt(X,190)*lt(Y,22)*gt(hypot(X-190,22-Y),22),0,if(lt(X,22)*gt(Y,346)*gt(hypot(22-X,Y-346),22),0,if(gt(X,190)*gt(Y,346)*gt(hypot(X-190,Y-346),22),0,255))))',split=2[pip_border_a][pip_border_b];
[pip_border_b][pip_rounded]overlay=x=6:y=6[pip_with_border];
[pip_border_a]pad=w=252:h=408:x=20:y=20:color=0x00000000,format=rgba,gblur=sigma=12[pip_glow];
[0:v][pip_glow]overlay=x=1628:y=632[bg_pip_glow];
[bg_pip_glow][pip_with_border]overlay=x=1648:y=652[out]
```

| | Value | Note |
|---|---|---|
| PiP avatar scaled | 200×356 | 9:16, từ 720×1280 |
| Corner radius | r=16 | nhỏ hơn main avatar (r=28) |
| Border width | 6px | coral #d97757 |
| Border layer | 212×368 | |
| Glow pad | 252×408 | +20px each side |
| Glow blur | sigma=12 | nhẹ hơn main |
| PiP x position | 1648 | 1920-200-72 = 1648 |
| PiP y position | 652 | 1080-356-72 = 652 |

### Composite command với PiP (đan xen theo beats)

```bash
ffmpeg -y \
  -i <slug>.mp4 \       # [0]: motion graphic video (có audio ElevenLabs)
  -i avatar.mp4 \       # [1]: HeyGen 720×1280 avatar
  -filter_complex "
    [1:v]scale=420:747:flags=lanczos,format=rgba,
    geq=r='r(X\,Y)':g='g(X\,Y)':b='b(X\,Y)':a='if(lt(X\,28)*lt(Y\,28)*gt(hypot(28-X\,28-Y)\,28)\,0\,if(gt(X\,392)*lt(Y\,28)*gt(hypot(X-392\,28-Y)\,28)\,0\,if(lt(X\,28)*gt(Y\,719)*gt(hypot(28-X\,Y-719)\,28)\,0\,if(gt(X\,392)*gt(Y\,719)*gt(hypot(X-392\,Y-719)\,28)\,0\,255))))'[av_main];
    [1:v]scale=200:356:flags=lanczos,format=rgba,
    geq=r='r(X\,Y)':g='g(X\,Y)':b='b(X\,Y)':a='if(lt(X\,16)*lt(Y\,16)*gt(hypot(16-X\,16-Y)\,16)\,0\,if(gt(X\,184)*lt(Y\,16)*gt(hypot(X-184\,16-Y)\,16)\,0\,if(lt(X\,16)*gt(Y\,340)*gt(hypot(16-X\,Y-340)\,16)\,0\,if(gt(X\,184)*gt(Y\,340)*gt(hypot(X-184\,Y-340)\,16)\,0\,255))))'[av_pip];
    color=c=#d97757:s=432x759,format=rgba[main_border_src];
    color=c=#d97757:s=212x368,format=rgba[pip_border_src];
    [main_border_src][av_main]overlay=x=6:y=6[av_main_bordered];
    [pip_border_src][av_pip]overlay=x=6:y=6[av_pip_bordered];
    [0:v][av_main_bordered]overlay=x=1440:y=161:enable='<main_beats>'[with_main];
    [with_main][av_pip_bordered]overlay=x=1648:y=652:enable='<pip_beats>'[out]
  " \
  -map "[out]" -map 0:a \
  -c:v libx264 -crf 20 -preset fast \
  -c:a copy \
  -shortest \
  <slug>-with-avatar.mp4
```

**`<main_beats>`** = `between(t,start,end)+...` cho beats dùng side avatar
**`<pip_beats>`** = `between(t,start,end)+...` cho beats dùng PiP

**Lưu ý**: filter trên có cả `av_main` và `av_pip` đọc từ `[1:v]` — hai lần. ffmpeg xử lý OK vì mỗi `[1:v]` là một independent stream read. Nếu gặp lỗi, tách thành 2 input riêng (copy avatar.mp4 → avatar2.mp4).
