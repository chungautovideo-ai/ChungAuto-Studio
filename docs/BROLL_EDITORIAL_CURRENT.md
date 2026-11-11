# Cảnh trám nguồn đầy đủ và skill ngành xe · 05/11/2026

## Vấn đề đã xác minh
Bài Q2 fresh-ASR trước dùng bốn cropQA0.5–1.3giây, worker bỏ toàn bộ; không đại diện nguồn dài hoặc mọi khả năng chọn cảnh. Nguồn thực tồn tại ở D:/Edit tự động/source/broll, không ở đường dẫn C:/Users/Admin/Videos cũ trong Factory job.json.

Đã probe và kiểm SHA bản copy so nguồn: đèn8.0247s/97MB, màn43.093063s/227MB, ghế5.162667s/42MB, dán thânxe15.5155s/302MB. Chi tiết Q2_FULL_BROLL_INPUTS.json. Các bản nguồn chỉ đọc; job QA mới là workspace/content/2026-11-05/contentos-qa-real-codex-q2-2.

## Thay đổi đã làm
- tests/real-worker-q2-v50-smoke.mjs thêm opt-in --full-broll; thiếu file dừng trước spawn; copy vào projectQA mới. Ghi evidence riêng REAL_WORKER_Q2_V50_FULL_BROLL.json, giữ các bài cũ.
- Creativev50 references/editorial.md thêm quyết định theo khả năng đọc/hiểu: insert chi tiết tĩnh có thể ngắn, thao tác chức năng cần đủ thời gian; không min2–3s máy móc, không freeze/loop để lấp quota.
- Bản ZIP workspace/exports/chungauto-creative-v50-broll-editorial.zip; parse/snapshot11presets5refs qua;4testpackage/reference/snapshot qua. Không nâng version hoặc tạo thêm card thư viện chỉ vì một đoạn hướng dẫn.

## Bài thực đã kết thúc
Lệnh node tests/real-worker-q2-v50-smoke.mjs --run-local-codex --full-broll --fresh-asr. Worker nhận brief độc lập, ASRWhispervi mới423từ, dùng đúng skill snapshot có đoạnBrollmới. Tác vụ dừng chờ duyệt, không xuất/đăng/paidAPI. Kết quả terminal và giới hạn ở phần dưới.

## Kết quả thực và lỗi chất lượng còn lại
Worker terminaldone/awaiting-review sau279s, ASRlocalvi423từ, output106.48s/12chữ/2graphic/4Broll/105caption. Đã dùng kiem-ban-dung.mjs, cấu trúc không lỗi. Q2_FULL_BROLL_OUTPUT_CHECK.json xác minh mốc tất cả4cảnh trongfile vàtimeline; khôngrender/đăng. Đã xem4contactsheet của khoảng nguồn: đèn,thao tác màn,ghế,dán thânxe. Đây không phải kiểm liên tục.

Editor thật tua16.4s thấy màn trong khi caption đã sang phim (captionmàn15.58–16.33 nhưng broll16.06–17.61). Ghế18.16–20.70 kéo sang caption sàn19.18–20.22; PiPđổi màu20.70–24.20 kéo sang nhận định chung. Do đó lượt này CHƯA ĐẠT khớp hình-lời; số cảnh/sourcebounds/kiểm cấu trúc không thay kiểm ngữ nghĩa. Ảnh Q2_FULL_BROLL_SCREEN_REVIEW.png. Không sửa output để che kết quả benchmark.

Đã sửa lại editorial.md theo hợp đồng mã hiện tại: at là clock dự án trước cắt, renderer tự quy đổi; KHÔNG ghi outputStart vào at. Hướng dẫn quy đổi at thủ công ở lượt trước sai và đã được thay. Kiểm đầu/cuối bằng caption resolve và kết thúc trước hạng mục dễ nhầm. ZIP đã cập nhật; đoạn quy tắc mới chưa chạy model. CLI báo242561tokens tổng, chưa breakdowncached/billed; không nhận đã tốiưutoken. Worker đã đọc mãrenderer/nhiềutoolerror, cần giảm đọc thừa. Ảnh/nhật ký ghi trung thực giới hạn này.
