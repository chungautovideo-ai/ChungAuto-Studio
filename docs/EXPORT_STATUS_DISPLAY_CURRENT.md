# Hiển thị tiến trình và lỗi xuất video — 07/11/2026

## Phân tích UX (theo UX_CHANGE_RECORD_TEMPLATE)

- **Hạng mục:** Xuất video trong editor (nút Xuất video / Dựng nháp). Người dùng báo: xuất hiện "lỗi", không xuất được và không thấy thanh tiến trình.
- **Công việc / kết quả / thiết bị:** giao việc xuất rồi theo dõi % và biết kết quả (xong, lỗi vì sao, thử lại), desktop và mobile.
- **Hiện trạng đã quan sát (code + trình duyệt thật, 07/11):**
  1. `GET /api/render` trả job; job lỗi/huỷ có `ok:false`. `api()` ở editor/ui/app.js coi `ok:false` là lỗi gọi API và ném ra; vòng `pollRender` bắt rồi `return` âm thầm. Hệ quả đã tái hiện: thanh xuất kẹt ở % cuối, nút vẫn "Đang xuất", không bao giờ hiện lỗi hoặc huỷ; mở lại trang cũng không thấy kết quả cũ.
  2. Hộp tiến trình chỉ nằm trong cột Chỉnh bên phải, thường nằm dưới màn hình khi đang ở tab khác.
  3. Lỗi in cả 6000 ký tự log thanh tiến độ, không nói nguyên nhân.
  4. Chưa có % (chờ AI, chụp tư liệu) vẫn hiện "0%" như đang chạy.
  5. Lỗi thật của lần xuất ngày 07/11: `hyperframes` render xong, báo "Render complete", artifact validated, rồi thoát bằng mã Ctrl+C `0xC000013A`; `xuat-video.mjs` và server chỉ nhận `code === 0` nên đánh dấu lỗi dù file 135MB hợp lệ (1080×1920, 66,87s, h264+aac).
- **Tham khảo:** không khảo sát app mới; theo mẫu thanh tiến trình xuất của CapCut (hộp trạng thái luôn thấy, % + thao tác chính). Chưa xem trực tiếp CapCut trong lượt này.
- **Bản đồ tích hợp:** dùng lại `render.json`, `/api/render`, `renderRenderBox`, `.bar`, `.render-box`, `--pink/--lime`. Thêm `editor/ui/render-status.js` (logic thuần, có test) và thanh `#exportStrip` cố định phía trên editor; không thêm menu.
- **Luồng đích / bố cục:** thanh trạng thái nổi dưới header, thấy ở mọi tab: tên + trạng thái + % + thời gian chạy; thanh tiến độ; dòng bước ("Chụp khung hình 473/2006"); Huỷ khi đang chạy; khi xong: đường dẫn + Mở thư mục + Xem video; khi lỗi: lý do bằng lời, "Chi tiết" (log đã lọc), "Xuất lại"; có nút đóng, nhớ theo phiên.
- **Trạng thái:** chờ AI / chờ lượt render / chuẩn bị (thanh không xác định, không giả %) / đang xuất % thật / đang hoàn tất (99%) / xong / huỷ / lỗi. Kết quả xong, lỗi hoặc huỷ chỉ hiện lại sau khi tải trang nếu trong 30 phút.
- **Thiết kế chung:** token và component sẵn có; lỗi dùng chữ + viền `--pink`, không chỉ màu; `role=progressbar`, `aria-live`, `prefers-reduced-motion`.
- **Responsive:** thanh rộng tối đa 520px, `calc(100vw - 24px)` trên mobile; đã xem ở 1280 và 390.
- **Dữ liệu / tác động:** không đổi project, Undo/Save; không tự xuất hay đăng.

## Thay đổi mã

- `editor/ui/app.js`: `readRenderJob()` thay `api("/api/render")` cho GET trạng thái; `describeRender`; `paintExportStrip`; `exportErrorParts`; nút Xuất hiện "Đang chuẩn bị…" khi chưa có %; toast lỗi nêu lý do.
- `editor/ui/render-status.js` (mới), `editor/ui/app.css`.
- `editor/tools/xuat-video.mjs`, `editor/server.mjs` (`startRender`): nhận kết quả khi file có mặt và hyperframes đã in "Render complete" dù mã thoát khác 0; `finalizeRenderArtifact` vẫn kiểm kích thước/thời lượng/âm thanh; ghi `exitNote`. `xuat-video` báo `finalizing` trong lúc kiểm file để UI không đứng ở 99%.
- `tests/render-status.test.mjs` (11 test).

## Kiểm đã làm / giới hạn

- Unit: render-status 11/11; cli-render-revision-failure + plate-review qua (13 test tổng).
- Browser (Chrome pane, phần mềm thật 5180): xem thanh ở trạng thái đang xuất 36%, lỗi mã Ctrl+C, xong, và chuyển live đang xuất → lỗi khi trang đang mở; 390px. Ảnh trạng thái giả lập ghi bằng `render.json` tạm rồi khôi phục bản thật.
- **Chưa kiểm:** `editor/server.mjs` cần khởi động lại mới có hiệu lực cho đường xuất trong server (Dựng nháp); chưa có lần xuất Final mới đi hết đường `xuat-video` sau sửa; chưa kiểm trạng thái "chờ AI nhận việc" và "chờ lượt render" trên UI thật; chưa tìm ra vì sao `hyperframes` thoát bằng Ctrl+C sau khi xong.
- Bản Final của `img_2549-2` đã lưu bằng `finalizeRenderArtifact` từ file render hợp lệ (`renders/img_2549-2-final.mp4`).
