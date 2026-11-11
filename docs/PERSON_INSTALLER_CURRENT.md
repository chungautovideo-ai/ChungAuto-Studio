# Bộ cài người/da SAM2 trên từng máy

Khoảng trống: setup cơ bản chưa cài SAM2; readiness hiện dựa vào Python hệ thống trên máy phát triển. Chọn Python3.12.10 embedded riêng,37wheel đã resolve và ghim URL/SHA256 từ metadata PyPI/PyTorch, CUDA12.4/Torch2.6 và Transformers5.18.0 giống runtime đã chạy. Không dùng pip để thay Python hệ thống. Model/config tải theo commit HuggingFace đã ghim và SHA256 hiện có.

Luồng: setup.ps1 -Person (hoặc node installer/setup-person.mjs chỉ cài người) → streaming download/cache băm SHA → staging runtime → giải nén wheel/purelib/platlib vào site-packages → kiểm CUDA/model thật → rename vào tools/sam2-python. Thiếu GPU/driver hoặc lỗi import giữ đích cũ, dọn staging và báo lỗi; cache hợp lệ tái sử dụng. Không tự chuyển CPU. Khóa cài độc lập, không tự xóa khóa từ lượt khác. Model có sẵn sai hash giữ nguyên/báo lỗi; file model thiếu mới được thêm. Không thay dự án/media/backend khi cài.

Không cài lại qua nút theo dõi hoặc tải nền ngầm. Đây tùy chọn riêng vì PyTorchCUDA hơn2,5GB. Kiểm ready không thay nghiệm thu inference, mask nhiều người/che khuất hay Windows sạch.

## Kết quả kiểm thực tế 05/11/2026

Runtime mới tải/giải nén riêng đã qua CUDA thật, Python3.12.10/Torch2.6.0+cu124/4070Ti. Lần đầu readiness25s chưa đủ; bước kiểm sau cài dùng120s và in lỗi thật trước promote. Không giảm kiểm hash/CUDA. Thử inference đầu phát hiện embedded _pth không chứa thư mục script; person-track.py đã thêm thư mục helper của chính nó. Sau sửa1giây/8mẫu144×256 hoàn tất2,406s, đỉnhGPU477386752byte. PERSON_INSTALLER_ACTUAL_SMOKE.json và log person-installer-inference.log; chưa xem mask mới/final hoặc đa người.

325/325 suite qua (workspace/logs/person-installer-suite.log): cache/hash/partialfail/lock/override/existingmodel/promote/runtimecandidate và Python extractor relocation/traversal. Skill v50 person.md bổ sung cách doctor/cài trên máy mới, giữ ảnh/selection khi thiếu runtime; ZIP11preset5refs parse qua, PERSON_INSTALLER_SKILL_SMOKE.json. Cài lại trả ready, không tải lại. Không sửa project/media gốc; chưa cài Windows sạch hoặc sáumáy.

Main5180 đã nạp backend mới sau dispatcher0/0/renderASRtrackingidle/khôngmediaworker/đúngPID; ping và runtimeendpointready qua, PERSON_INSTALLER_DEPLOY_SMOKE.json. Không thay giao diện hoặc renderer trong hạng mục này.
