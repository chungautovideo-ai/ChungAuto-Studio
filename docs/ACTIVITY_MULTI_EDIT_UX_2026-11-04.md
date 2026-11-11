# Hoạt động và dựng nhiều video · đặc tả hiện hành

> Đồng bộ tài liệu 04/11/2026: đọc [điểm hiện hành và bản đồ build](BUILD_CURRENT.md) trước các mốc lịch sử. Mọi thay đổi UI phải theo [quy chuẩn thiết kế và quy trình UX/UI](DESIGN_UX_STANDARD.md): phân tích trải nghiệm, đối chiếu giao diện sẵn có và tham khảo ứng dụng phù hợp trước thiết kế/code. Trạng thái triển khai chỉ được xác nhận bằng bằng chứng đúng phạm vi trong BUILD_STATUS.


Cập nhật 04/11/2026 theo yêu cầu người dùng. Tài liệu này chốt nghiệp vụ và giao diện; trạng thái nghiệm thu dùng BUILD_STATUS.md. Không coi thiết kế dưới đây là chức năng đã triển khai đầy đủ.

## 1. Cách làm việc

Người dùng mở nhiều phiên chat Codex/Claude để dựng các video khác nhau, đồng thời có thể chạy worker CLI/API độc lập. Mỗi việc giữ workspace, project, candidate/revision, nguồn A-roll/B-roll, mẫu/skill, brief, cách thực thi và chính sách hoàn tất riêng. Mỗi phiên nhận một việc tại thời điểm claim; chuyển dự án đang xem không chuyển việc của phiên hoặc worker.

Mỗi máy cài và chạy độc lập, dùng NAS làm nguồn chung. Chưa cần điều phối worker giữa sáu máy. Quota CLI/API chung từ 1–8, mặc định 2; không giới hạn số chat người dùng mở. ASR và render là hai tài nguyên riêng, mỗi loại một lượt/máy hiện tại. Nhiều video đang được AI dựng không đồng nghĩa nhiều video đang render.

## 2. Tích hợp vào giao diện VEK

Giữ composer và mẫu chọn nhanh tại Home; giữ một editor với preview/timeline/inspector. Space/Studio đổi bố cục trên cùng project. Hoạt động là điểm xem tập trung và mở lại video, không tạo editor hoặc sidebar riêng theo worker, provider hay engine.

Luồng giao lô: Home → thêm nguồn → Mỗi video một dự án → kiểm tên/tỷ lệ → nhập → Giao cả lô cho AI → chọn mẫu, cách thực thi, chính sách hoàn tất và brief riêng → Hoạt động. Nhập nguồn không tự giao AI. Các video đã có project vẫn dùng luồng giao việc hiện có.

Model nâng cao thu gọn: API dùng danh sách từ kết nối đã cấu hình; CLI nhận model ID hoặc mặc định; phiên chat dùng model của phiên. Cấu hình worker và kết nối đặt tại Cài đặt/Kết nối; Hoạt động chỉ tóm tắt và dẫn tới đúng nơi.

## 3. Danh sách Hoạt động

| Nhóm | Nội dung | Thông tin chính |
|---|---|---|
| Hàng đợi | Chờ phiên, quota, project, ASR/render, tạm ngừng nhận việc hoặc phục hồi | Tên video, mẫu, nguồn thực thi, lý do chờ |
| Đang chạy | Worker được server xác minh hoặc phiên vừa báo liên lạc | Giai đoạn, thời gian, bên thực thi; phân biệt rõ hai mức xác minh |
| Cần kiểm tra | Bản dựng chờ duyệt, lỗi, mất liên lạc, công việc sau restart chưa xác minh | Kết quả có thể mở, lỗi cụ thể và bước xử lý |
| Lịch sử | Việc đã hoàn tất/hủy với kết quả ghi nhận | Thời điểm, trạng thái xuất, phiên bản và đầu ra hợp lệ |

Một hàng đại diện một việc; nhóm theo project khi có nhiều lượt hoặc phiên bản. Tìm kiếm tên video, lọc trạng thái/cách thực thi/workspace và thu gọn chi tiết là yêu cầu UX tiếp theo, cần đối chiếu backend trước khi bật. Không hiện phần trăm giả; chỉ hiện tiến độ định lượng nếu có số liệu thật. Lý do chờ khác với lỗi.

Chi tiết hàng gồm job/project, agent/model khi biết, mẫu, chính sách kiểm tra/tự xuất, giai đoạn, thời gian cập nhật và log đã lọc dữ liệu nhạy cảm. Nguồn chat chỉ được ghi “vừa báo liên lạc” khi có báo cáo hợp lệ trong 5 phút; báo cáo quá hạn chuyển sang cần xác minh, không tự kết luận chat đã chết hoặc nhả claim.

## 4. Thao tác và an toàn dữ liệu

| Thao tác | Điều kiện/hành vi |
|---|---|
| Mở dự án | Mở đúng project/candidate; các việc khác tiếp tục độc lập |
| Xem chi tiết/log | Đúng workspace/job; không lộ khóa API hoặc claim token |
| Hủy | Ghi yêu cầu hủy và chặn áp dụng kết quả muộn; chỉ báo worker đã dừng khi có xác nhận. Không thể cưỡng chế đóng phiên chat ngoài app |
| Thử lại | Kiểm revision/quyền sở hữu/đầu ra và tạo lượt có thể đối soát; không tự lặp việc trả phí hoặc đăng bài |
| Phục hồi việc chờ | Kiểm journal và nguồn trước khi người dùng tiếp tục; mở màn hình hoặc bỏ pause không tự chạy lại |
| Kiểm tra rồi xuất | Mở bản dựng để sửa/duyệt, sau đó xuất theo thao tác người dùng |
| Tải kết quả | Chỉ đầu ra đã xác minh đúng job/snapshot; không lấy file mới nhất thay thế |

Tạm dừng nhận việc mới là điều khiển dispatcher, không phải tạm dừng giữa chừng một job. Chỉ thêm nút dừng/tiếp tục từng job khi engine có checkpoint thật. Ưu tiên/đổi thứ tự hàng đợi còn là yêu cầu chưa nghiệm thu, chưa hứa FIFO.

Chặn hai bên cùng áp dụng thay đổi vào một project; mỗi job giữ revision và candidate riêng. Mất NAS/provider báo lỗi đúng việc, không chuyển sang nguồn khác âm thầm. Refresh/restart giữ lịch sử, việc chưa rõ worker còn sống phải đối soát, không tự giao lại hoặc xóa khóa.

## 5. Hoàn tất và xuất bản

Mặc định kiểm tra rồi xuất; có thể chọn AI tự xuất cho từng lượt hoặc theo mặc định đã cấu hình. Lựa chọn được chụp vào job. Xuất thành công không đồng nghĩa đã đăng. Đăng ngay/hẹn lịch và nội dung từng kênh là bước riêng, chỉ chạy theo yêu cầu đã giao.

## 6. Hiện trạng và việc tiếp theo

Đã có nền claim/project/revision, quota nền, contact reporting, giao lô có model nâng cao/khôi phục payload, khóa ASR-render, Activity và kiểm đầu ra. Bằng chứng hiện hành nằm trong BUILD_STATUS và đặc tả dựng song song; không suy ra hoàn tất trải nghiệm nhiều AI thật từ smoke tổng hợp.

Cần nghiệm thu hai chat AI thật cùng CLI/API, chuyển editor trong lúc chạy, tranh cùng project, hủy với callback muộn, refresh/restart, mất NAS/provider và tiếp tục không trùng đầu ra. Kiểm UI ở 1280×720 và 1920×1080, gồm danh sách dài và trạng thái rỗng/lỗi. Đo thời gian AI/ASR/build/render, token/chi phí và RAM/VRAM/NAS trước khi tăng quota. Mục tiêu 50–100 video/ngày gồm bản gốc và phiên bản chưa phải năng suất đã đo.

HyperFrames, Remotion và FFmpeg dùng pipeline chung. Remotion scene đã có worker/UI/lịch sử giới hạn; Native Poster/Thumbnail đang phát triển, có smoke API nhưng chưa hoàn tất UI và nghiệm thu tích hợp. Không tính phần này hoặc toàn bộ 127 nhóm tính năng là hoàn thành.
