# Timeline theo CapCut · vòng 1 · 06/11/2026

## Phân tích UX (theo UX_CHANGE_RECORD_TEMPLATE)

- Hành trình: người dựng quen CapCut (Windows) muốn tách / cắt nhanh bằng phím, khoá / ẩn / tắt tiếng cả track, kéo clip bám đúng điểm cắt mà không phải học lại.
- Tham khảo: timeline CapCut 9.7 trên máy người dùng (ảnh màn hình người dùng gửi + bộ phím mặc định CapCut Windows). Bộ phím tuỳ chỉnh của CapCut nằm trong file chạy, không đọc được; dùng bộ mặc định.
- Hiện trạng trước khi sửa (khảo sát app.js): đã có tách video tại playhead (S), xoá, undo/redo, zoom thanh trượt / +− / vừa khung / Ctrl+cuộn, tua thước, kéo mép clip, filmstrip, tự khép khoảng khi cắt (tương đương nam châm track chính). Thiếu: Q/W, Ctrl+B, tách mục phủ, hít, khoá/ẩn/tắt tiếng track, menu chuột phải, chép/dán.
- Thiết kế: thêm vào thanh công cụ timeline đang có và vào cột tên track; không thêm menu mới ngoài menu chuột phải. Token màu/icon nét 16px hiện có; nút bật dùng `--lime`, focus-visible, aria-pressed/aria-label; màn ≤760px ẩn nút mới, giữ bố cục di động cũ.

## Đã làm

| CapCut | ContentOS |
|---|---|
| Chọn (A) / Tách (B) | Nút + phím; chế độ Tách: bấm lên clip là tách tại điểm bấm |
| Tách Ctrl+B | Tách mục đang chọn (chữ, đồ hoạ, zoom, cảnh trám, minh hoạ) tại playhead; không chọn mục phủ thì tách video chính. Giữ phím S cũ |
| Xoá bên trái Q / bên phải W | Mục phủ: thu mép; video: cắt đoạn qua `trimSeg`, Q đưa playhead về điểm nối |
| Hít (N) | Kéo / kéo mép bám playhead, mép video, điểm cắt, mép mục phủ khác; vạch xanh khi bám; nhớ trong localStorage |
| Khoá / ẩn / tắt tiếng track | `project.tracks[lane] = {locked, hidden, muted}`; khoá chặn chọn/kéo/xoá/tách/dán; ẩn và tắt tiếng áp lúc dựng (`normalizeProject`), không sửa cờ riêng từng mục |
| Ctrl+C / Ctrl+V | Chép mục phủ, dán tại playhead |
| Ctrl+= / Ctrl+- / Shift+Z | Phóng to / thu nhỏ / vừa khung |
| ↑ / ↓ | Nhảy tới điểm cắt / mép mục trước, sau |
| Menu chuột phải | Tách, Xoá trái, Xoá phải, Sao chép, Dán, Xoá (bàn phím ↑↓/Esc) |

Mọi thao tác đi qua `snapshot()` → `changed()`, nên Ctrl+Z / Lưu như cũ. Logic thuần ở `editor/lib/timeline-ops.js`.

## Kiểm chứng

- `tests/timeline-ops.test.mjs` 4/4 (hít, tách, Q/W, cờ track lúc dựng không đổi dữ liệu lưu).
- Browser trên dự án QA `contentos-qa-real-codex-q2-4` (không lưu): Ctrl+B 10→11 chữ, Undo về 10; W/Q thu đúng mép; Q video 1:39.7→1:24.3 và playhead về 32.6s, Undo khôi phục; chép/dán 10→11; menu chuột phải đủ mục, Esc đóng; khoá track chặn Delete, Undo mở khoá; N/A/B đổi trạng thái.

## Vòng 2 · 06/11/2026

| CapCut | ContentOS |
|---|---|
| Chọn nhiều Shift/Ctrl+bấm, kéo khung, Ctrl+A | `S.multi` (`key:id`); Delete xoá cả nhóm (video = cắt `keep:false`), Ctrl+C/V giữ nhịp nhóm, kéo một mục dời cả nhóm; Esc bỏ chọn; track khoá bị loại khỏi chọn |
| Kéo clip video đổi thứ tự trên track chính | Kéo thân clip; dùng `reorderPrimaryClips` có sẵn (neo chữ/phụ đề/clip âm thanh theo đoạn). Chỉ dự án ghép nhiều video nguồn (`source.timeline="segments"`); video một nguồn báo rõ không hỗ trợ |
| Kéo mục lên / xuống track khác, tạo track mới | Trong mỗi làn: kéo dọc đổi hàng; kéo trên hàng cao nhất = track mới; track rỗng tự gộp. Lưu `item.row`; `packRows` (editor/lib/timeline-ops.js) dùng chung cho timeline và bản dựng; hàng cao vẽ đè hàng thấp (`z-index` chữ 40+hàng, khối 47+hàng) |
| Waveform nhạc nền / thuyết minh | `/api/wave-file?src=` (file trong dự án hoặc `kit:`), lặp lại khi nhạc ngắn hơn video |

Kiểm chứng vòng 2: unit `timeline-ops` 5/5; 35 file test có dùng build: 12 lỗi đều đã lỗi trong baseline trước khi sửa timeline (không lỗi mới). Browser (không lưu): Ctrl+bấm 3 mục, xoá nhóm 10→7, Undo 10; kéo khung chọn 4; Ctrl+A 30; Esc bỏ chọn; kéo chữ lên tạo track 1→2, Undo 1; dự án nhiều nguồn `contentos-smoke-api-append-3` kéo clip cuối lên đầu, Undo về thứ tự cũ; nhạc nền có waveform.

Giới hạn: chuyển mục giữa hai loại track khác nhau (chữ ↔ đồ hoạ) không làm vì là hai loại dữ liệu khác; z-index theo hàng chưa xem trên bản xuất final; đổi thứ tự video một nguồn cần đổi mô hình dữ liệu.

## Vòng 3 · Hiệu ứng chữ · 06/11/2026

UX: CapCut đặt "Kiểu chữ" (ô mẫu xem trước) và "Hoạt ảnh" (tab Vào/Ra/Lặp, lưới nút + thanh thời lượng) ngay trong bảng chữ. Giữ trong inspector chữ hiện có (mục "Hiệu ứng chữ (kiểu CapCut)"), không thêm menu; nút có aria-pressed/aria-label, đích ≥36px, focus-visible lime, token --surface2/--line2/--lime.

Đã làm: texts[] thêm `style` (outline · shadow · neon · box · gradient · long-shadow; none = bỏ) và `anim:{in:{type,dur},out:{type,dur},loop:{type,speed}}`. Vào 12 loại (Mờ dần, Phóng to, Thu nhỏ, Trượt lên/xuống/trái/phải, Bật nảy, Đánh máy, Xoay vào, Lắc, Mờ nét); Ra 9 loại (Mờ dần, Phóng to ra, Thu nhỏ, Trượt lên/xuống/trái/phải, Rơi xuống, Mờ nét); Lặp 5 loại (Nhịp tim, Lắc lư, Nhấp nháy, Lơ lửng, Rung). Danh mục + toán mốc: editor/lib/text-effects.js; kiểu: .tx-st-* trong kit.css (màu brand); chuyển động: runtime.js trên GSAP timeline (seek/xuất tất định). Ưu tiên: anim.in thay toàn bộ hiệu ứng vào theo fx; anim.out thay mờ ra mặc định và kết thúc đúng lúc chữ hết; Lặp chạy từ lúc vào xong (hoặc 0,95s khi dùng fx) tới lúc ra; vào+ra dài hơn 90% clip thì co tỉ lệ. Không có style/anim → markup + payload y như cũ; mẫu fxCycle vẫn chạy.

Kiểm chứng: tests/text-effects.test.mjs 5/5 (danh mục, dọn dữ liệu, mốc thời gian, build có/không có hiệu ứng, chạy thật đoạn runtime với timeline giả).

Giới hạn: chưa xem trực quan trong editor đang chạy/bản xuất MP4; màu/viền/bóng tự chỉnh (appearance) thắng preset kiểu chữ; Lặp áp lên nhãn/tiêu đề/chữ phụ (không gồm nền mờ); Lắc lư/Rung bắt đầu bằng một bước nhảy nhỏ; chưa có hiệu ứng theo từng chữ (CapCut "Văn bản" nâng cao) và chưa có âm kèm theo loại hoạt ảnh (trừ Đánh máy → tiếng phím).

## Chưa làm (vòng sau)

Ctrl+X, Ctrl+D, đóng băng khung, trục xem trước (S của CapCut, đang dùng cho Tách), bật/tắt nam châm track chính, đổi thứ tự clip cho video một nguồn. Chưa nghiệm thu trên điện thoại.
