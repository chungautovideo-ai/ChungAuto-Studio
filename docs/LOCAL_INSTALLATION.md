# ContentOS — mở và kiểm tra trên từng máy

> Đồng bộ tài liệu 04/11/2026: đọc [điểm hiện hành và bản đồ build](BUILD_CURRENT.md) trước các mốc lịch sử. Mọi thay đổi UI phải theo [quy chuẩn thiết kế và quy trình UX/UI](DESIGN_UX_STANDARD.md): phân tích trải nghiệm, đối chiếu giao diện sẵn có và tham khảo ứng dụng phù hợp trước thiết kế/code. Trạng thái triển khai chỉ được xác nhận bằng bằng chứng đúng phạm vi trong BUILD_STATUS.


Mỗi máy chạy dự án/cache riêng; NAS là nguồn tư liệu dùng chung. Không yêu cầu máy điều phối LAN.

Tại thư mục ContentOS, mở bằng `powershell -NoProfile -ExecutionPolicy Bypass -File installer/start.ps1`, sau đó vào http://127.0.0.1:5180/home. Lệnh ưu tiên `tools/node/node.exe`, rồi Node trong PATH; yêu cầu phiên bản 22 trở lên. Không dừng tiến trình khác đang chiếm cổng 5180.

Kiểm tra môi trường bằng `powershell -NoProfile -ExecutionPolicy Bypass -File installer/doctor.ps1`. Kết quả JSON và exit code 0 cho biết các kiểm tra bắt buộc đạt; exit code 1 cho biết còn thiếu. Doctor chỉ đọc, không tải thành phần, không bật chạy nền khi khởi động Windows và không khởi động server.

Doctor kiểm Node, khả năng chạy FFmpeg/FFprobe, thư viện SDK/QR, sự tồn tại Chrome trong cache HyperFrames và file Whisper. Trạng thái server được báo riêng, app chưa chạy không làm hỏng kiểm tra dependencies. Đây chưa phải chứng nhận render/nhận giọng/NAS/provider hoạt động.

Đồ họa preset HTML: setup nay cài thêm lxml6.0.2 vào tools/preset-fields sau Pythonvision embedded trên Windowsx64, tải wheel chính thức và kiểm SHA256/HTML trước đưa vào dùng. Doctor có graphic-preset-python bắt buộc; API/CLI ưu tiên Python local thay vì phụ thuộc lệnh python hệ thống. CONTENTOS_PRESET_PYTHON chọn môi trường riêng và không fallback khi override lỗi. Đã kiểm chèn preset với PATH rỗng; đây chưa phải cài Windows sạch. Xem PRESET_LOCAL_RUNTIME_CURRENT.md.

Để kiểm thêm chức năng **Chọn và theo dõi người**, chạy `powershell -NoProfile -ExecutionPolicy Bypass -File installer/doctor.ps1 -Person` (hoặc `node installer/doctor.mjs --person`). Chế độ này bắt buộc SAM2 ready: kiểm Python3.10+, NumPy/Pillow, Torch CUDA, Transformers SAM2, phép tính CUDA nhỏ, file cấu hình và SHA256 model local. Báo GPU/runtime cụ thể; thiếu thì exit1, không tự tải hoặc chuyển CPU. Doctor mặc định ghi mục SAM2 `checked:false/ready:null`, không coi setup cơ bản đã cài chức năng này. Kiểm có thể mất25giây mỗi Python ứng viên. `CONTENTOS_SAM2_PYTHON` chọn Python riêng và có ưu tiên tuyệt đối, không rơi sang Python khác khi override lỗi. Đây chưa phải bộ cài SAM2 trên máy sạch hoặc phép thử inference/theo dõi.

Đã chạy PowerShell doctor -Person trên máy phát triển: exit0, Python3.12.10/Torch2.6.0+cu124/CUDA12.4/RTX4070Ti và model SHA đúng; log workspace/logs/doctor-person.log. tests/doctor-person-smoke.mjs kiểm mặc định không giả ready, override Python không tồn tại làm exit1 và chỉ một attempt, tham số lạ bị từ chối; evidence DOCTOR_PERSON_SMOKE.json/log workspace/logs/doctor-person-smoke.log. Không tải/cài/restart trong phép kiểm.

Chạy `powershell -NoProfile -ExecutionPolicy Bypass -File installer/setup.ps1` để cài thành phần thiếu và mở ContentOS. Thêm `-NoStart` nếu chỉ cài và kiểm tra. Khi chưa có Node dùng được, Windows x64 tải Node24.14.1 từ nodejs.org và so SHA256 với SHASUMS256.txt chính thức trước khi giải nén. Giữ bản tools/node cũ nếu không dùng được, báo lỗi để kiểm tra thay vì ghi đè.

Bộ cài dùng npm ci khi thiếu thư viện, cài FFmpeg/Whisper qua công cụ dùng chung và chạy HyperFrames browser ensure phiên bản ghim. Không chạy setup/background/update của VEK, không thay .env, không sao chép khóa hoặc dữ liệu app gốc, không bật startup Windows. Có thể cần khoảng1GB nếu máy chưa có thành phần. Chrome và npm cache vẫn thuộc tài khoản Windows, không phải bộ portable offline đầy đủ.

Đã chạy setup -NoStart thành công trên máy phát triển có sẵn các dependency; nhánh tải/cài mới trên Windows sạch và recovery khi tải gián đoạn chưa được nghiệm thu. Shortcut, cập nhật, đóng gói offline và bật/tắt startup vẫn cần hoàn thiện. Chép thư mục app hiện tại chưa bảo đảm mang theo cache ngoài thư mục. Không dùng bộ cập nhật/khởi động VEK gốc cho ContentOS.

Remotion hiện cài riêng trong engines/remotion bằng package-lock.json và npm ci --ignore-scripts. Bộ cài tự kiểm phiên bản4.0.538/React19.3.1; doctor có mục remotion bắt buộc và báo independent. Không cần AIEV để dùng cảnh Remotion. Chrome dùng chung cache HyperFrames đã được browser ensure chuẩn bị. Cache npm Remotion nằm trong workspace/cache/npm-remotion, không cần chép runtime path của máy khác.

Đã cài dependency riêng và render worker thật, chạy lại setup -NoStart/doctor và browser tạo/sửa cảnh hai kích thước trên máy phát triển. Chưa nghiệm thu Windows sạch/download gián đoạn/offline bundle hoặc installer chạy khi còn worker. Xem REMOTION_INDEPENDENT_RUNTIME_SMOKE.json và BUILD_STATUS. Các giới hạn cache ngoài thư mục và portable phía trên vẫn áp dụng.
