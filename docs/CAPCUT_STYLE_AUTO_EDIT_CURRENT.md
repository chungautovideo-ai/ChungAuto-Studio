# Tự động edit khi đã kết nối AI + học phong cách từ CapCut · 06/11/2026

## Tự động edit
- Trước: việc mới mặc định `execution {mode:'session', agent:'auto'}`, chỉ chạy khi một phiên chat nhận qua `ai-inbox`; worker nền CLI chỉ chạy khi chọn "Chạy ngầm".
- Nay (`editor/server.mjs` `autoExecution`): việc "Tự chọn AI" mà không có phiên chat đang chờ / đang làm và máy có Claude/Codex CLI → `mode:'cli'` chạy ngầm ngay (dựng đầu + Nhờ AI sửa). Việc đang chờ quá 20s cũng tự chuyển khi editor hỏi trạng thái. Chọn đích danh một phiên thì vẫn chờ phiên.
- `aiListener()` chỉ coi phiên là bận khi còn liên lạc (session-contact / ai-progress) trong 5 phút — phiên im lặng không giữ hàng đợi 3 giờ nữa.
- Kiểm chứng: việc `2026_10_21_10_22_48_img_0209-2` (session:auto, chờ) → GET `/api/ai-job` → `cli:claude`, background, dispatcher active=1, tiến trình `claude -p --permission-mode acceptEdits` chạy. Giới hạn: dùng hạn mức Claude/Codex của người dùng; `maxWorkers=2`; chưa đo kết quả cuối của lượt chạy ngầm này.

## Kết nối → CapCut · Học phong cách
- `src/services/capcut-style.mjs`: đọc `%LOCALAPPDATA%/CapCut/User Data/Projects/com.lveditor.draft/root_meta_info.json` và `draft_content.json` (chỉ đọc, không đọc video; 767/772 dự án đọc được, dự án mã hoá bị bỏ qua). Đo vào cả clip ghép lồng nhau: nhịp cắt, cảnh trám, chữ nhấn vs phụ đề (phụ đề = `recognize_task_id`), font/màu, hoạt ảnh chữ, mẫu phụ đề, chuyển cảnh, hiệu ứng, sticker, tiếng hiệu ứng, âm lượng nhạc, tốc độ, keyframe.
- Ghi skill `phong-cach-chu-so-huu` (SKILL.md + profile.json) vào `.agents/skills` và `.claude/skills`; `ai-inbox` nhắc đọc skill này khi có.
- API `GET /api/v1/capcut/projects`, `POST /api/v1/capcut/style {names}`; UI tab "CapCut · Học phong cách" trong Kết nối (chỉ mở khi Claude đã đăng nhập).
- Kiểm chứng: `tests/capcut-style.test.mjs` 3/3; học từ dự án `1026` (28 phút) qua UI: phụ đề iCiel Panton #f4c70f mẫu 逐词高亮-黄, cảnh trung vị 10.7s, cảnh trám 4.4/phút, SFX 5.9/phút (Ding, Swoosh).
- Giới hạn: chưa ánh xạ tên hiệu ứng/chuyển cảnh CapCut sang hiệu ứng ContentOS tương đương từng cái; chưa chạy model thật với skill này.
