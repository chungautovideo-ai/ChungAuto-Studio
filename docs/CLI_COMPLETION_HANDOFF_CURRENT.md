# Bàn giao bản dựng từ worker CLI trong sandbox

Đã triển khai main5180 sau kiểm idle/đúngPID và kiểm ping/catalogv50 sau restart; bằng chứng CLI_COMPLETION_DEPLOY_SMOKE.json. Không có thay đổi giao diện cần thêm menu.

Lượt Codex Q2 v50 trước đã sửa candidate nhưng kết thúc lỗi khi --done gọi localhost: cổng mặc định5180 không phải QA5193 và MXC từ chối kết nối EACCES. Bằng chứng cũ giữ ở REAL_WORKER_Q2_V50_EXECUTION_BEFORE_HANDOFF.json. Không coi candidate đó là đã áp dụng hoặc nghiệm thu chất lượng.

Worker do server mở nay nhận EDITOR_PORT đúng cổng và kênh bàn giao chỉ cho thư mục việc đó. ai-inbox --done với first-build/revise candidate ghi yêu cầu cục bộ, không tự sửa trạng thái thành done hoặc áp project. Khi tiến trình kết thúc, server kiểm nonce của lượt chạy, claim, trạng thái working, loại việc và SHA256 candidate rồi gọi chính endpoint hoàn tất hiện có. Endpoint vẫn kiểm token/revision/đồ họa/chính sách trước áp dụng; không thực thi URL hoặc lệnh do request cung cấp. Lỗi giữ candidate/request để đối chiếu. Phiên chat thông thường giữ đường HTTP cũ.

Không mở mạng trong sandbox, không dùng full-access hoặc giảm isolation. Không thay UX, engine dựng hay tăng version skill cho thay đổi vận chuyển này. completionMode do việc gốc quyết định; QA dùng review và không render/đăng.

CLI_COMPLETION_SANDBOX_SMOKE.json: fixture độc lập qua MXC thật, ai-inbox child thật ghi yêu cầu; project/status giữ nguyên trước server; normal completion áp title và done/awaiting-review, không render. Đây không phải worker model hoặc nghiệm thu video. Unit kiểm build/revise, một lần tiêu thụ, sai claim/nonce, cancelled, candidate đổi và server từ chối; suite303/303 trong workspace/logs/cli-completion-suite.log.

Worker model thật tại workspace/content/2026-11-04/contentos-qa-real-codex-q2-4 đã terminal done/awaiting-review sau khoảng294giây, session28515 kết thúc mã0. Server tiêu thụ request và áp candidate bằng endpoint chuẩn; log xác nhận. REAL_WORKER_Q2_V50_EXECUTION.json:9segments/10texts/6blocks/4Broll, nhạc ambient-pad/autoSfx/duckSourceSpeech; khoảng99,7giây theo candidate. Không render/đăng. Transcript nhập từ QA trước, nguồn copy local; không phải ASR/NAS tự động hoặc nghiệm thu fullmix/chất lượng chuyển động.

Đã xem graphic-check.png trong candidate: các thẻ vàng/đen và chữ hiển thị; ảnh tĩnh này chỉ kiểm đồ họa độc lập, không chứng minh bố cục trên footage, timing hay âm thanh. Main5180 chỉ triển khai sau kiểm idle/PID đúng; xem ghi chú triển khai trong CODEX_MXC_RUNTIME_CURRENT.md.
