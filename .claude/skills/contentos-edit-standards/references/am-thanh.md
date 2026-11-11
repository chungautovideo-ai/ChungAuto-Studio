# Âm thanh

Giọng người nói là "đồng hồ" của video: chữ, cảnh, SFX bám mốc lời (hyperframes `sound.md`). Thứ tự: giọng → SFX → nhạc → kiểm độ to.

## 1. Giọng

- Chuẩn hoá giọng về −16 LUFS trước khi trộn bất cứ gì (ghost-editor).
- Không đổi tốc độ, không thay giọng khi không được yêu cầu (mkt-edit-talking-head-9-16).
- Lọc ồn: dùng `audio.clean` ("nhe" | "vua" | "manh") của editor (mkt-edit-talking-head-9-16). Lọc quá mạnh làm giọng mỏng, "đục nước": giới hạn ~20 dB (ghost-editor, DeepFilterNet3).
- Đoạn chỉ có tiếng nền (≤ −40 LUFS) không được kéo lên mức lời nói (ffmpeg-skill).
- Mối nối giữa các đoạn cắt cần fade ngắn để không "tách": ffmpeg-skill fade 20 ms mỗi bên.

## 2. SFX

**Mức so với giọng** (đỉnh p95 của giọng) (ghost-editor):

| Vai | Mức |
|---|---|
| ui (pop, click, tick) | −14 dB |
| whoosh | −12 dB |
| impact | −8 dB |

Không SFX nào to hơn giọng. Trong editor ContentOS dùng `audio.sfxVolume` (mặc định 0.5) và `sfxLevel`, không chỉnh tay âm lượng từng tiếng (mkt-edit-talking-head-9-16; ghost-editor: "never hand-tune data-volume").

**Mật độ:**

- 6–12 tiếng nhẹ mỗi phút (pop, whoosh trên thẻ) (ghost-editor).
- Video tốt nhất đo được: 0.4–0.9 SFX nghe rõ mỗi 10 s, đặt trên đồ hoạ (ghost-editor).
- Build của editor tự bỏ SFX trong 0.6 s đầu và SFX sát nhau < 0.25 s (mkt-edit-talking-head-9-16).
- Xoay vòng 2–3 bản của cùng một tiếng; cùng một whoosh ở mọi điểm cắt là dấu hiệu "làm theo khuôn" (hyperframes `sound.md`).

**Đặt tiếng:**

- Mỗi tiếng có nguyên nhân trên hình: click khi có cú bấm thật, whoosh khi chuyển cảnh/thẻ lớn di chuyển nhanh, tick khi chữ hiện từng ký tự, pop khi nhãn/số đáp xuống, riser → impact chỉ một lần cho cao trào (hyperframes `sound.md`).
- Đỉnh tiếng rơi sau hình 1 khung; tiếng sớm bị thấy sai nhanh hơn tiếng muộn (hyperframes `sound.md`).
- Tiếng phản ứng/meme không đè lên từ: đặt vào khoảng lặng sau câu đắt; 1–3 lần/phút, không lặp lại (ghost-editor). Meme từ internet là media của người khác: không dùng cho YouTube (ghost-editor).

**Tự động hoá SFX trong ContentOS (làm theo thứ tự, dừng ở bước đủ):**

1. Để build tự đặt: chọn `audio.sfxLevel` — `"nhieu"` (mặc định: chữ, khối, chữ phụ, cảnh trám vào/ra, zoom, chuyển đoạn, từ khoá phụ đề), `"vua"` (chữ, khối, cảnh trám, cảnh, chuyển đoạn), `"tat"`. Build tự bỏ tiếng trong 0.6 s đầu và tiếng sát nhau.
2. Đổi tiếng của một mục: đặt `sfx` (tên tiếng hoặc `"none"`) và `sfxVol` ngay trên mục đó (`texts`, `scenes`, `brolls`, `zooms`, khối đồ hoạ). Tiếng chọn riêng luôn phát, thắng tiếng tự động.
3. Chỉ khi không có mục nào ở đúng lúc đó mới thêm `audio.sfx[{at, kind, vol}]`; `at` là **giây video gốc** (như `segments.in`).
4. Video nhịp mạnh / quảng cáo: `audio.cutSfx: true` (riser + boom ở chuyển đoạn có hiệu ứng). Explainer gõ chữ: `audio.wordSfx: true`. Mặc định để tắt.

`kind` phải nằm trong `SFX_KINDS` (`editor/lib/build.mjs`); tên khác bị bỏ im lặng khi dựng. Bảng chọn nhanh:

| Hình xảy ra | `kind` |
|---|---|
| Chuyển cảnh, thẻ lớn bay vào | `whoosh`, `whoosh-2`, `soft-whoosh`, `silk-swish` (xoay vòng, không dùng một tiếng cho mọi chỗ) |
| Cắt nhảy khung, zoom nhanh | `swish`, `swish-2` |
| Chữ / nhãn / số bật ra | `pop`, `pop-soft`, `glass-pop`, `blip` |
| Chữ gõ từng ký tự, danh sách | `keys`, `tick`, `mau-tick`, `typewriter` |
| Giấy, tài liệu, lật trang | `paper`, `page-flip`, `card-slide` |
| Đúng / kết quả / số đẹp | `chime`, `mau-ding`, `crystal-ting`, `lux-chime`, `ding-deep`, `confirm`, `level-up` |
| Sai / cảnh báo | `error`, `negative`, `question` |
| Tiền, giá | `coin`, `coins` |
| Cao trào (1–2 lần/video) | `riser` → `impact-boom` / `boom` / `deep-hit`, `reveal-swell` |
| Glitch, công nghệ | `glitch`, `glitch-2`, `zap`, `scan` |

Tên đầy đủ: `SFX_KINDS` trong `editor/lib/build.mjs`; file nằm ở `editor/assets/sfx/<kind>.wav`.

**Kho "Hay dùng" của ChungAuto (`nas-*`, 226 tiếng)** — bộ tiếng editor của xưởng dùng thật hằng ngày, nhập từ NAS `02. HIỆU ỨNG ÂM THANH/01. HAY DÙNG`. Danh sách + nhóm: `editor/assets/sfx/library.json` (hoặc `GET /api/kit-sfx`). Đã cắt khoảng lặng đầu/cuối (đỉnh tiếng rơi đúng `at`) và chuẩn đỉnh −1 dB, nên để `vol` 0.4–0.7 khi có giọng.

| Nhóm | Dùng khi | Chọn trước |
|---|---|---|
| Va chạm | nhấn câu chốt, số liệu sốc, cú cắt mạnh (≤ 2 lần/video) | `nas-vine-boom`, `nas-impact-sound`, `nas-sd-low-hi-07`, `nas-audioblocks-sub-drop-impact2` |
| Chuyển cảnh | đổi cảnh, thẻ bay, split màn hình | `nas-swoosh-transition-28`, `nas-split-object-sfx-01`…`07` (xoay vòng), `nas-glitch-transition-7` |
| Đúng sai | đúng/sai, trước–sau, kết quả | `nas-correct`, `nas-ding-capcut`, `nas-incorrect`, `nas-fail` |
| Tiền | giá, khuyến mãi, chi phí | `nas-cash-register-sound-fx`, `nas-tien`, `nas-super-mario-coin-sound` |
| Xe | phanh, va quẹt (khớp hình xe thật) | `nas-car-brakes-screeching`, `nas-carcrashsmallmetal-pe112101` |
| Hồi hộp | trước khi lộ kết quả, câu hỏi mở | `nas-suspense-4`, `nas-dun-dun-dunnn`, `nas-doubt` |
| Lấp lánh | lộ sản phẩm sau khi làm xong (xe bóng, nội thất sạch) | `nas-prel-logo-sparkle`, `nas-fairy-glitter`, `nas-bien-hinh` |
| Bấm & vật thể | UI, giấy, chụp ảnh | `nas-mouse-click`, `nas-lat-giay`, `nas-rapid-shutter`, `nas-pop` |
| Phản ứng · Cười · Lò xo · Hoạt hình | **meme** — chỉ video hài/đời thường | `nas-wow`, `nas-huh`, `nas-what`, `nas-hmm`, `nas-o-au-funny`, `nas-cuoi-sitcom-laughing-sound-fx`, `nas-lo-xo-tun`, `nas-cartoon-slide-whistle` |

Luật cho tiếng meme (Phản ứng, Cười, Lò xo, Hoạt hình):
- Chỉ khi video có giọng hài / đời thường / hậu trường; **không** dùng cho quảng cáo chạy tiền, tin tức, video kỹ thuật nghiêm túc.
- Đặt trong khoảng lặng **ngay sau** câu đắt (sau từ cuối 0.1–0.3 s), không đè lên lời; nếu không có khoảng lặng thì kéo dài take theo [cat-va-nhip.md](cat-va-nhip.md) (kết take 0.6–1 s sau từ cuối).
- 1–3 lần/phút, mỗi tiếng dùng một lần trong một video; tiếng cười đám đông (`nas-crowd-laugh*`) tối đa 1 lần.
- Nguồn tải từ internet (meme, y2mate…): bản quyền không rõ — video đăng YouTube nên tránh nhóm meme, ghi trong tóm tắt nếu đã dùng.

Ưu tiên kho `nas-*` hơn tiếng tổng hợp khi cần tiếng "đúng chất ChungAuto"; tiếng tự động của build (`sfxLevel`) vẫn dùng bộ gốc, chỉ đổi khi cần bằng `sfx` trên mục.

**Nguồn bất đồng về SFX ở điểm cắt:** ghost-editor để điểm cắt trơn ("none on bare cuts"); skill nhà `sfxLevel: "nhieu"` (mặc định) có whoosh ở chuyển cảnh và zoom. **Chọn skill nhà** (thắng theo thứ tự ưu tiên); khi người dùng chọn `"vua"` hoặc mẫu tối giản, theo ghost-editor.

## 3. Nhạc nền

- Chỉ dùng file người dùng cung cấp hoặc nhạc kit `kit:<tên>`; không có thì để trống và ghi trong tóm tắt (mkt-edit-talking-head-9-16).
- Nhạc kit = 3 bài tổng hợp (`kit:upbeat-light`, `kit:ambient-pad`, `kit:beat-bass`) + thư viện nhạc CapCut nhập từ NAS (`editor/assets/music/library.json`, mỗi bài có `mood`, `duration`, `short`). Danh sách đang có: `GET /api/kit-music`, hoặc đọc `library.json`.
- Chọn bài theo nội dung, không theo thói quen:

| Loại video | `mood` nên tìm | Ví dụ |
|---|---|---|
| Review xe, tốc độ, ra mắt | `review-xe`, `hao-hung`, `nhip-manh` | `kit:capcut-golden-hour-rush`, `kit:capcut-drum-base` |
| Drift, độ xe, ngầu | `phonk`, `drift` | `kit:capcut-nhac-nen-capcut-dj-phonk` |
| Quảng cáo / khuyến mãi | `soi-dong`, `upbeat`, `hype` | `kit:capcut-energertic-upbeat` |
| Doanh nghiệp, giới thiệu xưởng | `tu-tin`, `doanh-nghiep` | `kit:capcut-confident` |
| Chia sẻ kiến thức, talking-head | `tich-cuc`, `nhe-nhang`, `acoustic` | `kit:capcut-positive-vibes`, `kit:capcut-free-acoustic-positive` |
| Lifestyle, nội thất sang | `sang-trong`, `thoi-trang`, `chill` | `kit:capcut-house-glamor-fashion`, `kit:capcut-whispers-in-the-heat` |

- Video < 60 s: ưu tiên bài `short: true` (bản rút gọn có điểm kết); video dài hơn bài thì build tự nối lặp (`musicLoop`).
- Nhạc CapCut lưu nội bộ chưa xác nhận quyền cho quảng cáo trả phí: việc giao là quảng cáo chạy tiền thì dùng 3 bài tổng hợp hoặc nhạc người dùng đưa, và ghi trong tóm tắt.
- Ghi trong tóm tắt bài đã chọn và lý do (mood ↔ nội dung).
- Không tạo nhạc/SFX bằng ElevenLabs (`music`, `sound-effects`) vì là API trả phí, trừ khi việc giao bật rõ (AGENTS.md).
- Âm lượng nhạc dưới giọng: `audio.musicVolume` 0.1 (mkt-edit-talking-head-9-16).
- Duck nhạc dưới mọi câu nói (ghost-editor). Thông số tham chiếu khi tự trộn bằng ffmpeg: giảm 12 dB, ngưỡng −26 dBFS, attack 20 ms, release 400 ms (ffmpeg-skill `audio.py --duck`).
- Vào nhạc ở ô nhịp mạnh, không ở đoạn intro im; kết ở cuối ô nhịp với fade ngắn (hyperframes `sound.md`).
- Nhạc có năng lượng chủ yếu < 150 Hz nghe như không có trên loa điện thoại (hyperframes `sound.md`).

**Nguồn bất đồng về mức nhạc:** hyperframes để nhạc ~0.14 dưới giọng; ffmpeg-skill mặc định −14 dB. **Chọn 0.1 của skill nhà** (editor đã dùng, người dùng chỉnh được).

## 4. Độ to tổng

| Đích | Mức | Nguồn |
|---|---|---|
| TikTok / Reels / Shorts / YouTube / Facebook | −14 LUFS, true peak ≤ −1 dBTP | ffmpeg-skill, mrtkeyword |
| Dung sai | ±2 LU (TikTok/Reels/Shorts/YouTube), ±3 LU (Facebook) | ffmpeg-skill |
| Podcast | −16 LUFS | ffmpeg-skill |

- Mix trong lúc dựng nằm khoảng −16…−14 LUFS (hyperframes `sound.md`; ghost-editor QA −16 ±1.5 LUFS).
- Không kéo gain toàn bài sau khi trộn để "to hơn" (ghost-editor). Đỉnh vượt thì dùng limiter, không tăng gain (mrtkeyword).
- "Đã chuẩn hoá" vẫn có thể clip: kiểm cả true peak, không chỉ LUFS (ffmpeg-skill).
- ContentOS không tự xuất: các mức này là chuẩn cho bản xuất do server/người dùng thực hiện; worker chỉ đặt `audio` đúng và ghi cảnh báo nếu nguồn quá nhỏ/quá to.
- Ghi trong tóm tắt rằng âm thanh được **đo**, không phải nghe (hyperframes `sound.md`).
