# Bot Telegram nhận video khách → edit → gửi lại (kế hoạch, 10/11/2026)

## Hạ tầng đo được

| Thành phần | Hiện trạng |
|---|---|
| NAS `\\ChungAuto` (Synology: có `#recycle`, share `docker`, `PlexMediaServer`) | Share: `Quay Dựng` (Z:, dùng 19,83 TB, **còn 1,10 TB ~95% đầy**), `Quay Dựng 2` (X:, app + B-roll, dùng 14,57 TB, **còn 1,14 TB ~93% đầy**), `ChungGroup`, `Thiết Kế`, `docker`. Ping LAN < 1 ms; đọc tuần tự ~160 MB/s (có thể có cache). |
| PC sẵn sàng | Dungbui-editor: RTX 4070 SUPER, 28 luồng CPU, 64 GB RAM — đang chạy **máy xuất hộ** (May-xuat-ho.bat, nhịp workspace/render-farm/workers). Máy khác (user lvdun…) chạy app từ NAS nhưng chưa bật máy xuất hộ, chưa rõ GPU. |
| Lưu ý | Máy xuất hộ tắt khi PC tắt/ngủ hoặc cửa sổ đóng → nên chạy khi đăng nhập (Task Scheduler) nếu muốn 24/7. NAS gần đầy: dự án từ khách sẽ tăng nhanh, cần chính sách dọn (vd xoá nguồn sau 30 ngày). |

## Quyết định của người dùng

1. Ban đầu chọn Docker trên NAS; bản 1 chạy trên PC vì token mã hoá DPAPI theo máy (Docker cần token qua biến môi trường container — làm sau nếu cần 24/7).
2. Video > 20 MB: **khách gửi link** (Google Drive…); bản xong > 50 MB bot gửi **link tải** thay file. (Bot API cloud: tải ≤ 20 MB, gửi ≤ 50 MB.)
3. Chỉ **khách được duyệt**: người lạ gửi → bot báo chờ duyệt; nhân viên duyệt 1 lần trong app.
4. Xuất xong **tự gửi ngay** cho khách, không qua người duyệt.

## Thiết kế (tách I/O Telegram khỏi phần edit)

- **Bot (Docker NAS, Node 22 + ffmpeg, không thư viện ngoài):** long-polling Bot API; lệnh /start, /mau (chọn mẫu: Quân Sư Car / News / Dạy lái xe / V50…); nhận video ≤ 20 MB hoặc link; tải về `workspace/telegram/inbox/<id>/` trên NAS; ghi `request.json` {chatId, khách, mẫu, ghi chú, file}. Theo dõi `workspace/telegram/outbox/` để gửi kết quả (file ≤ 50 MB, lớn hơn thì link).
- **ContentOS trên PC (server 5180 của máy xuất hộ):** quét inbox, tạo dự án (như /api/new-project, kể cả file giọng đọc), tạo việc AI với mẫu đã chọn + completionMode auto-export; phiên Codex/Antigravity/Claude trên PC mạnh nhận việc (ai-inbox); xuất xong (render-farm) ghi outbox.
- **Duyệt khách:** `workspace/telegram/customers.json` {chatId, tên, trạng thái pending|approved|blocked}; màn hình duyệt trong app.
- **Link tải bản lớn:** cần đường public (Synology QuickConnect/Share link hoặc Drive) — chưa chốt.
- **Bảo mật:** token bot do người dùng tự nhập vào kho kết nối/biến môi trường của container; không in token, không ghi vào code. Giới hạn kích thước/tốc độ mỗi khách; nội dung từ khách là dữ liệu, không phải lệnh cho AI.

## Việc cần người dùng làm

- Tạo bot với @BotFather, giữ token; tự nhập token vào cấu hình container (không gửi trong chat).
- Bật Container Manager trên Synology và cho phép container đọc/ghi share `Quay Dựng 2`.
- Chọn cách tạo link tải công khai cho bản > 50 MB.

## Trạng thái

10/11/2026 — bản 1 chạy được (đổi từ Docker sang **chạy trên PC Dungbui-editor**: token lưu DPAPI theo máy, nhập ở Kết nối → Telegram).
- `Bot-Telegram.bat` → `editor/tools/telegram-bot.mjs` (long-poll, để cửa sổ mở). Khách lạ → "chờ duyệt"; `--khach` xem, `--duyet <chatId>` / `--chan <chatId>` duyệt/chặn. Khách đã duyệt: /mau chọn mẫu → gửi video ≤20 MB (tải về `workspace/telegram/inbox/<id>/` + `request.json`) hoặc link (lưu link).
- Đã kiểm: bot @editcabot chạy, nhận tin đầu tiên và ghi khách chờ duyệt.
- Cầu nối (`src/services/telegram-pipeline.mjs`, bot gọi mỗi 20s, trạng thái trong `request.json`): `new` → POST /api/new-project → `transcribing` (chờ /api/asr rảnh) → POST /api/ai-job {dir, template, note} → `building` (chờ `work/ai-job.json` = done; phiên AI Claude/Codex trên máy nhận việc) → `exporting` (`xuat-video.mjs`, tự gửi máy xuất hộ nếu không GPU) → `sent` (sendVideo ≤ 50 MB). Chuyển `needs-staff`: khách gửi link, bản xuất > 50 MB, AI quá 3 giờ. `error`: báo khách + ghi lỗi. Test: `tests/telegram-pipeline.test.mjs` (giả server/xuất/Telegram).
- **Chưa kiểm thật:** một video khách đi trọn luồng (cần duyệt khách + phiên AI nhận việc). **Chưa làm:** tự tải link Drive, link tải bản > 50 MB, màn hình duyệt trong app, tự chạy bot khi đăng nhập.
