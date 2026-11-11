# Phụ đề và chữ

Khung chuẩn 1080×1920 (9:16); 16:9 xem mục 5. Toạ độ tính theo px khung xuất.

## 1. Vùng an toàn 9:16

| Vùng | Chuẩn | Nguồn |
|---|---|---|
| Hai bên | không lấn 12% (~130 px mỗi bên) | mkt-edit-talking-head-9-16 |
| Dưới | không lấn 20% (~384 px) | mkt-edit-talking-head-9-16 |
| Trên | chừa ~120 px | short-form-video |
| Hộp an toàn chung mọi nền tảng | giữa khung 900×1400 | short-form-video |
| TikTok Ads (dưới rộng nhất) | chừa ~370 px dưới | short-form-video |

**Nguồn bất đồng:** short-form-video chừa dưới ~320 px, phải ~120 px; ffmpeg-skill ước TikTok che 22% dưới / 14% phải / 10% trên; caption-animation chừa dưới ~280 px. **Chọn chuẩn nhà 12% hai bên / 20% dưới**, cộng 120 px trên. Khi chắc chắn đăng TikTok, nới phải tới 14% (~151 px) và trên 10% (~192 px) (ffmpeg-skill).

Mẫu Thái `mkt-edit-video-9-16-th` đặt phụ đề ở y 1560–1860: vùng này nằm trong 20% dưới. Chỉ theo khi đúng mẫu đó; còn lại theo vị trí của skill nhà.

## 2. Phụ đề

- Tạo từ mốc từ thật trong transcript; không chia đều một câu theo thời lượng (caption-animation). Từ trong đoạn đã cắt tự bị bỏ (mkt-edit-talking-head-9-16).
- Nhóm **2–4 từ** (`captions.maxWords: 4` của skill nhà; mrtkeyword "phụ đề 2–4 chữ"; caption-animation 1–4 từ mỗi trang).
- Ngắt nhóm ở cuối câu, ở chỗ dừng ≥ 150 ms, hoặc khi đủ số từ (hyperframes `captions.md`).
- Mỗi lúc chỉ một nhóm; nhóm mở tại hoặc trước từ đầu, đóng tại hoặc sau từ cuối (hyperframes).
- Vị trí mặc định: `captions.y` 1450 (mkt-edit-talking-head-9-16); vùng y 1440–1560 dành riêng cho phụ đề, thẻ khác không đè (mrtkeyword).
- Cỡ chữ ≥ 48 px, tương phản ≥ 3:1 (ghost-editor QA); thường 56–80 px, viền 2–6 px + bóng (caption-animation).
- Một màu nhấn cho từ đang đọc; không đổi màu mọi từ cùng lúc (caption-animation).
- Một từ khoá mỗi nhóm cho video tin tức đọc khi tắt tiếng (ghost-editor, Caption News).
- Không dùng gạch ngang dài (—) trong chữ trên màn (ghost-editor).
- Whisper viết sai tên riêng: sửa chữ phụ đề, giữ nguyên mốc thời gian (mrtkeyword).

**Nguồn bất đồng về số từ:** short-form-video gợi ý 4–7 từ/dòng; hyperframes 2–3 (năng lượng cao) / 3–5 (trò chuyện). **Chọn 2–4** theo skill nhà và mrtkeyword vì tiếng Việt nhiều âm tiết ngắn và kiểu karaoke của editor.

## 3. Chữ nhấn (`texts[]`)

| Thuộc tính | Chuẩn | Nguồn |
|---|---|---|
| `title` | 2–6 từ quan trọng, ≤ 2 dòng | mkt-edit-talking-head-9-16 |
| `at` | giây gốc của từ được nhấn | mkt-edit-talking-head-9-16 |
| `dur` | ≥ 1.8 s | mkt-edit-talking-head-9-16 |
| Thời gian giữ để đọc | ~0.5 s + 0.3 s mỗi từ; dòng cuối video ≥ 2 s | hyperframes `motion.md` |
| Mật độ | ~1 nhịp mỗi 4–8 s; không phủ chữ liên tục | mkt-edit-talking-head-9-16 |
| Vị trí | x 540, tâm y 1180; chỉ dời `y` trong 760–1500 khi đè mặt | mkt-edit-talking-head-9-16 |
| Cỡ tiêu đề | 4–9% chiều cao khung (~77–173 px ở 1920) | hyperframes `motion.md` |
| Từ nhấn màu | một từ mỗi dòng, màu nhấn mang nghĩa | hyperframes `motion.md` |

- `fx` xen kẽ theo nội dung (words, slide, mask, marker, type), không một hiệu ứng xuyên suốt (mkt-edit-talking-head-9-16).
- Chữ chỉ nói điều người nói đã nói (ghost-editor). Chữ trong thẻ của mẫu viết lại từ lời (mkt-edit-talking-head-9-16).
- Màu nhấn sáng (vàng, chanh) cần chữ tối trên nhãn/viên thuốc (ghost-editor).
- Chữ nằm sau người (`layer: "behind"`) cần `camera.matte`; chữ sau đầu đọc tốt khi bị che 30–55% (hyperframes `captions.md`).

## 4. Lower-third (tên, chức danh, địa điểm)

| Giai đoạn | Chuẩn | Nguồn |
|---|---|---|
| Vào | 0.4–0.6 s (12–18 khung @30fps), lần lượt nền → tên → chức danh, lệch 3–6 khung | lower-thirds |
| Giữ | 3–5 s, đủ đọc hai lần | lower-thirds |
| Ra | 0.27–0.4 s, nhanh hơn lúc vào | lower-thirds |

- Hai dòng: tên to, đậm; chức danh ~45–60% cỡ tên, chênh ≥ 1.6× (lower-thirds).
- Không bật/tắt cứng; chuyển động chỉ ở hai đầu (lower-thirds).
- Neo trái, chữ dài ra bên phải (lower-thirds).
- 9:16: nâng dải lên, tránh 18% dưới và 12% trên (lower-thirds) — vẫn nằm trong vùng an toàn chuẩn nhà ở mục 1.
- Nền thanh đặc hoặc mờ 70–85% để đọc trên mọi cảnh (lower-thirds).
- Tên người/địa điểm chỉ khi có trong lời hoặc brief; không đoán.

## 5. Khung ngang 16:9 (1920×1080)

- Chữ nhấn không che mặt: đặt hai bên hoặc phía dưới; chia màn hình = minh hoạ trái, người nói phải (mkt-edit-talking-head-9-16).
- Vùng an toàn chữ: lề 5% (title-safe), lề hành động 10% (lower-thirds).
- Lower-third: lề trái ~5%, đường chân chữ ở 80–85% chiều cao (lower-thirds).
- Phụ đề ngang: cách đáy 80–120 px, rộng tối đa ~1600 px (hyperframes `captions.md`).
- Chữ dọc to hơn ngang: tiêu đề dọc = ngang × 1.35 (hyperframes `overlays.md`).
