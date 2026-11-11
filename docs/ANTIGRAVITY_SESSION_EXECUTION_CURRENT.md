# Bổ sung phiên Antigravity trong chọn AI thực hiện · 09/11/2026

## Phân tích UX/UI trước triển khai (theo UX_CHANGE_RECORD_TEMPLATE.md)

- **Ngày / hạng mục / mục inventory:** 09/11/2026 · Chọn phiên AI thực hiện (`session:antigravity`) · Điều phối phiên AI dựng/sửa video.
- **Công việc người dùng / kết quả mong muốn / thiết bị:** Người dùng mở dự án trên Home, trong khung Nhờ AI sửa (Studio/Space) hoặc hộp thoại Giao cả lô cho AI trên máy tính/màn hình nhỏ muốn chọn trực tiếp **Phiên Antigravity đang mở** (hoặc để chế độ tự chọn phiên đang mở gồm Codex / Claude / Antigravity) và giao việc dựng/sửa cho phiên Antigravity thực thi qua `ai-inbox.mjs`.
- **Hiện trạng đã quan sát:**
  - Ảnh người dùng gửi và code trước sửa (`editor/ui/home.js` dòng 563, `editor/ui/app.js` dòng 3628, `editor/ui/contentos-batch-edit.js` dòng 8) chỉ có `session:auto` (Phiên Codex / Claude đang mở), `session:codex` (Phiên Codex đang mở), `session:claude` (Phiên Claude đang mở), `cli:codex`, `cli:claude`, `api:gateway`.
  - Backend `src/services/ai-execution.mjs` chỉ cho phép `agent` thuộc `['auto','codex','claude']`.
  - `editor/tools/ai-inbox.mjs` chưa tự nhận diện biến môi trường `ANTIGRAVITY_AGENT` / `ANTIGRAVITY_CONVERSATION_ID` khi chạy trong phiên Antigravity.
  - `src/services/activity.mjs` và `/api/ket-noi-ai` (`editor/server.mjs`, `editor/ui/ket-noi-ai.js`) chưa hiển thị tên/trạng thái `antigravity`.
- **Tham khảo:** Giữ nguyên mẫu chọn phiên AI của VEK/ContentOS (`CAPCUT_STYLE_AUTO_EDIT_CURRENT.md`, `PARALLEL_EDIT_BUILD_SPEC_2026-11-04.md`): đặt chung trong `<select>` "AI thực hiện" hiện có, không tách menu hay tạo màn hình riêng cho từng hãng AI.
- **Bản đồ tích hợp:**
  - Chọn AI thực hiện → `editor/ui/home.js` (`#setupExecution`), `editor/ui/app.js` (`executionSelect` trong Nhờ AI sửa), `editor/ui/contentos-batch-edit.js` (`execution`), `editor/ui/ket-noi-ai.js` (`#vKetNoi`).
  - Kiểm tra & nhận việc → `src/services/ai-execution.mjs`, `src/services/activity.mjs`, `editor/tools/ai-inbox.mjs`, `editor/server.mjs`.
- **Luồng đích / bố cục:**
  - Trong dropdown `AI thực hiện`, thêm tùy chọn `Phiên Antigravity đang mở` (`session:antigravity`) ngay cạnh `Phiên Codex đang mở` và `Phiên Claude đang mở`; cập nhật nhãn `session:auto` thành `Phiên Codex / Claude / Antigravity đang mở`.
  - Phiên Antigravity nhận việc qua `node editor/tools/ai-inbox.mjs --next --agent antigravity` hoặc `--wait --agent antigravity` (tự động nhận diện `ANTIGRAVITY_AGENT` và `ANTIGRAVITY_CONVERSATION_ID` khi không truyền cờ).
- **Trạng thái:**
  - Waiting/working hiển thị đúng tên `Antigravity` trong hộp chờ Home, khung chat Nhờ AI sửa và màn Hoạt động.
  - Nút `Kiểm tra kết nối AI` và màn `Kết nối AI` hiển thị thêm trạng thái cài đặt/sẵn sàng của Antigravity trên máy và tín hiệu phiên chờ việc.
  - Khi đang chờ phiên Antigravity mà người dùng bấm `Hoặc chạy ngầm`, hệ thống chuyển sang CLI nền khả dụng mà không lỗi 400.
- **Thiết kế chung:** Dùng nguyên `<select>`, `.box`, `.outline`, token và bố cục hiện hành; không thêm thành phần hay bảng màu mới.
- **Responsive / keyboard / focus:** Giữ nguyên hành vi `<select>` gốc tại 1280px và 390px, hỗ trợ đầy đủ bàn phím và `aria-label`.
- **Dữ liệu / tác động:** Giữ nguyên cơ chế claim nguyên tử, candidate project, baseRevision, Undo/Save/reopen; không gọi API trả phí.
- **Sau triển khai:**
  - File đã đổi: `src/services/ai-execution.mjs`, `src/services/activity.mjs`, `editor/tools/ai-inbox.mjs`, `editor/server.mjs`, `editor/ui/home.js`, `editor/ui/app.js`, `editor/ui/contentos-batch-edit.js`, `editor/ui/ket-noi-ai.js`, `AGENTS.md`, `tests/ai-execution.test.mjs`, `tests/activity.test.mjs`.
  - Bằng chứng thực:
    - Unit tests: `node --test tests/ai-execution.test.mjs tests/activity.test.mjs tests/session-job-claims.test.mjs tests/batch-edit-dispatch.test.mjs` đạt 20/20.
    - CLI inbox: `session:antigravity` từ chối claim từ `codex`/`claude`, nhận đúng claim khi chạy trong môi trường Antigravity (`ANTIGRAVITY_AGENT=1`, `ANTIGRAVITY_CONVERSATION_ID`), hoàn tất `--done`.
    - HTTP & Browser QA (1280×800 và 390×844): `/api/ket-noi-ai` trả về `Antigravity (coMay: true, dangNhap: true)`; màn Home `AI thực hiện` chọn `Phiên Antigravity đang mở` và bấm `Kiểm tra kết nối AI` hiển thị `Antigravity: đã đăng nhập`, 0 lỗi JS; đã xem ảnh chụp giao diện thực tế.
  - Giới hạn: Antigravity hoạt động theo chế độ phiên đang mở (`session:antigravity` / `session:auto`), chưa có chế độ chạy ngầm độc lập qua CLI (`cli:antigravity`) vì Antigravity là ứng dụng IDE desktop.
