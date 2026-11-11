# Xuất CLI độc lập trong Hoạt động · 05/11/2026

UX trước thay đổi: Hoạt động đã có nhóm Đang chạy/Hàng đợi/Cần kiểm tra/Lịch sử, thanh progress và Mở dự án; CLI registry đã tồn tại nhưng projection luôn trả progress:null. Người dựng nhiều video không biết tiến độ lượt CLI đang giữ khóa. Dùng lại thanh tiến độ hiện có, không thêm menu/control. Tham khảo luồng VEK/Hoạt động trong ACTIVITY_MULTI_EDIT_UX_2026-11-04.md và component contentos-activity.js; không khảo sát app ngoài mới.

Ghi tiến độ của chính lượt CLI vào registry trong save đã throttle; không lấy work/render.json cũ của dự án để suy ra lượt đang chờ. Chỉ hiển thị progress hữu hạn 0–99 khi PID còn sống và khớp chủ render lock; chờ/mất PID/terminal không có progress giả. Registry không thay render.json trước khi nhận khóa. Không thêm hủy/thử lại khi chưa có điều khiển đúng từng lượt. Dữ liệu không đổi timeline, Undo, mask hoặc chất lượng render.

Tiêu chí: hai CLI thật queued→active→terminal qua HTTP; chờ không ghi đè trạng thái cũ, output/snapshot riêng/hash đúng. Unit kiểm stale PID/khác owner/NaN không hiện progress. Browser component ở1280/390 dùng thanh hiện có, mở đúng dự án; fixture phải ghi rõ.

Kết quả: hai lượt CLI QA thật PID46824/9204 (nguồn tổng hợp0,6s) qua HTTP queued/active/progress/terminal; cả hai exit0, snapshot/output riêng và integrity/audio measured đúng. CLI_RENDER_ACTIVITY_HTTP_SMOKE.json. Không ghi render.json khi chờ. Browser component fixture1280/390 qua lọc hàng đợi, activeprogress42, mở đúng dự án, không nút hủy/thửlại giả, không pageerror; ảnh CLI_RENDER_ACTIVITY_RUNNING_390.png và CLI_RENDER_ACTIVITY_390.png đã xem. Suite308/308, workspace/logs/cli-render-activity-suite.log. Chưa fairness/crashrecovery, không xác nhận năng suất hoặc nhiều AI dựng thật từ hai export này.
