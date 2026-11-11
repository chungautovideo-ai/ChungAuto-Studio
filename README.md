# ContentOS · development 0.1.0

Ứng dụng AI Video Production System nhiều lĩnh vực, phát triển từ trải nghiệm editor VEK và tích hợp AIEV/ChungAuto Studio. Toàn bộ127nhóm chức năng vẫn là phạm vi build; chưa nghiệm thu hoàn tất. App nguồn và media người dùng được giữ riêng.

Đọc [điểm hiện hành và bản đồ tài liệu](docs/BUILD_CURRENT.md), [kế hoạch build](docs/BUILD_PLAN.md) và [trạng thái/bằng chứng](docs/BUILD_STATUS.md). Trước mọi thay đổi UI, tuân thủ [quy chuẩn thiết kế và quy trình UX/UI](docs/DESIGN_UX_STANDARD.md): phân tích hành trình, khảo sát hiện trạng và tham khảo app phù hợp trước thiết kế; giữ đồng bộ token/icon/component, không nhân menu.

## Mở và cài đặt

Windows: `powershell -NoProfile -ExecutionPolicy Bypass -File installer/start.ps1`, mở http://127.0.0.1:5180/home. Doctor: `powershell -NoProfile -ExecutionPolicy Bypass -File installer/doctor.ps1`. Setup: `powershell -NoProfile -ExecutionPolicy Bypass -File installer/setup.ps1`; `-NoStart` chỉ cài/kiểm. Theo [hướng dẫn cài trên từng máy](docs/LOCAL_INSTALLATION.md) về Node22+, runtime/cache và giới hạn Windows sạch/offline.

Mỗi máy làm dự án/cache local, NAS dùng chung tư liệu; không cần scheduler phân phối sáu máy. HyperFrames, Remotion local độc lập và FFmpeg/FFprobe cùng phục vụ pipeline theo [kiến trúc engine](docs/RENDER_ENGINE_ARCHITECTURE_2026-11-04.md). Adapter hiện tại không chứng minh giữ nguyên mọi composition từ app nguồn.

## Điểm đã triển khai gần nhất

- Sidebar icon/responsive, hub Kết nối/Thư viện; Home giữ mẫu chọn nhanh.
- Studio/Space dùng cùng project; cấu hình AI nâng cao thu gọn, giữ draft.
- Âm thanh chia Nhạc nền/Giọng nói/Hiệu ứng/Trộn âm; nhập/tìm/lọc/chọn/nghe nhạc đã nhập, lane nhạc và mix/fade/duck hiện có.
- Lưu mẫu theo phiên bản không ghi đè, xem thông số/skill và tạo bản cải tiến.
- Remotion cảnh chữ có worker/preview/sửa tham số; nhiều chat và worker CLI/API được theo dõi trong Hoạt động ở phạm vi kiểm đã ghi.

Chi tiết còn thiếu, quyền thực thi/provider, migration/remote/đăng bài và bằng chứng thật so với fixture nằm trong BUILD_CURRENT/BUILD_STATUS. Không coi màn preview là chức năng thực thi đã hoàn tất. Mục tiêu50–100video/ngày chưa có benchmark xác nhận.

## Kiểm chứng

`npm test` chạy service/unit tests. Các browser/render smoke trong tests có yêu cầu riêng và có thể tạo dữ liệu QA; đọc script trước chạy, dùng temp/cache trênD và giữ media người dùng. Mốc suite208tests là kết quả đã ghi trước lượt đồng bộ tài liệu, không phải kết quả chạy lại hôm nay. Bằng chứng kiểm chứng và giới hạn luôn đi kèm từng mốc trong BUILD_STATUS.

[Nguồn gốc và phạm vi quyền](docs/SOURCE_PROVENANCE.md). Không đưa .env, credential hoặc workspace/media người dùng lên mạng.
