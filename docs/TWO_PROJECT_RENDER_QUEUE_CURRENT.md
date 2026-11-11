# Hai dự án chờ xuất qua CLI thật · 05/11/2026

Đã chạy tests/two-project-render-queue-smoke.mjs: tạo hai dự án QA riêng từ nguồn tone0,6s tổng hợp, khởi chạy hai xuat-video.mjs draft gần đồng thời. Chỉ bắt đầu khi renderLock không có chủ và không có exportDir người dùng, không thay workspace active hoặc dự án gốc.

PID61736 giữ khóa trước, PID5012 in chờ rồi nhận khóa sau. B chưa tạo work/render.json trong lúc chờ A, đúng thiết kế không đè trạng thái cũ trước nhận khóa. Hai tiến trình exit0, snapshot khác nhau, output nằm đúng renders từng dự án, SHA/bytes/sidecar verify đúng, audioLoudness có listenedfalse, FFmpeg decode được khung. Khóa được giải phóng sau cùng; pingmain5180 vẫn phản hồi. TWO_PROJECT_RENDER_QUEUE_SMOKE.json chứa đường dự án/output, log riêng work/queue-qa.log.

Đây là hai yêu cầu export cùng tồn tại nhưng render tuần tự theo khóa máy; chưa chứng minh hai AI tự dựng đồng thời, công bằng thứ tự nhiều worker, phục hồi crash hoặc năng suất50–100ngày. Không tự chuyển thiết kế thành renderGPU nhiều job cùng lúc.

Đã đối soát code mới và kiểm HTTP hai CLI độc lập: Hoạt động có row queued/active/terminal riêng và progress đúng lượt giữ khóa. Không ghi render.json khi chờ; xem CLI_RENDER_ACTIVITY_CURRENT.md/CLI_RENDER_ACTIVITY_HTTP_SMOKE.json. Mất PID giữ unverified; chưa thao tác hủy/thử lại riêng, fairness hoặc crash recovery.
