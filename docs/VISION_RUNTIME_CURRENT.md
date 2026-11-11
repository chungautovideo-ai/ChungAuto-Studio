# Python nhúng độc lập cho Windows x64 · 05/11/2026

installer/vision-embedded.mjs tải Python3.12.10 embed từ python.org và2wheel NumPy2.2.6/OpenCVheadless4.11.0.86 từ files.pythonhosted.org. URL vàSHA256 chốt tại vision-embedded-lock.json; hash Python tính từ bản tải HTTPS chính thức, hashwheel lấy metadataPyPI. Cài vào staging, kiểm import+CV, rồi rename thành tools/vision-embedded; giữ thư mục lỗi có sẵn để kiểm, không ghi đè venv. Không cần pip hoặc Python hệ thống cho luồng Windowsx64 mới. Cache gói được kiểm lại hash trước giải nén.

Resolver ưu tiên embedded→venv→system. Doctor ghi standalone/source/phiên bản thực; override rõ vẫn có quyền ưu tiên. Existing venv được giữ để khôi phục, setupWindows sẽ dùng embedded khi cần. Không thay Python hệ thống, không registry/admin/startup mới. POSIX vẫn venv, chưa bootstrap runtime standalone.

Bằng chứng: VISION_EMBEDDED_RELOCATION_SMOKE.json sao runtime sang workspace/cache/vision-relocation-smoke/python, PATH chỉ System32, sys.prefix=base_prefix=thư mục mới, OpenCV import từ thư mục mới, goodFeaturesToTrack+calcOpticalFlowPyrLK4điểm qua. Đây không phải máy Windows sạch; có thể còn phụ thuộc OS DLL/VisualC runtime, chưa chứng minh toàn bộ6máy. Thư mục QA giữ làm bằng chứng. Tracker thực/CLI/API A/Broll dùng resolverembedded qua; suite241/241 ở workspace/logs/vision-embedded-suite.log. Doctor report workspace/logs/vision-embedded-doctor.json. Chạy lại install trả ready không tải lại.

Main5180 restart sau idle/exactPID, không sửa dự án người dùng. Tiếp tục cần máy sạch/offline/license packaging và benchmark fullworkflow. Mốc cũ bên dưới chỉ còn là lịch sử về venv.

---

# Runtime xử lý biển số local · 05/11/2026

plate-privacy.mjs trước gọi python trực tiếp, phụ thuộc cv2/NumPy toàn máy. Nay vision-python.mjs ưu tiên tools/vision-python/Scripts/python.exe (Windows), bin/python trên POSIX, rồi system py -3/python/python3. CONTENTOS_VISION_PYTHON là override rõ, sai thì báo lỗi, không âm thầm chạy runtime khác. Probe có import và gọi goodFeaturesToTrack thực, timeout10s; lỗi hướng dẫn setup.

installer/setup.mjs thêm bước venv riêng và pip wheels pin numpy2.2.6/opencv-python-headless4.11.0.86 từ installer/vision-requirements.txt. Máy hiện tại đã cài 12.6+39.4MB wheel, verified CPython3.12.10/OpenCV4.11/NumPy2.2.6. Chạy lại không tải/cài khi đúng phiên bản. Không sửa Python/pip hệ thống. Doctor thêm plate-vision-python required, báo ready/runtime/modules thực; workspace/logs/vision-doctor.json giữ báo cáo.

Đây là môi trường package riêng, KHÔNG phải Python standalone: venv phụ thuộc Python nền, không sao chép nguyên venv sang máy khác. Máy sạch thiếu CPython3.10+ chưa được bootstrap, setup báo lỗi rõ thay vì nhận thành công; còn phải hoàn thiện tải/kiểm hash/phân phối runtime trước nghiệm thu bộ cài6máy. Chưa kiểm máy Windows sạch/offline. FFmpeg/FFprobe vẫn do prepareTools chuẩn bị như trước. Thuật toán vẫn một ROI opticalflow0.2–15s, không thêm detector/nhiều biển/cut recovery.

Kiểm: tests/vision-python.test.mjs thứ tự local/override, probe thao tác CV/phiên bản/lỗi; tests/plate-privacy.test.mjs tracker thực, giữ nguồn/audio, A/Broll, CLI và API tool-loop với runtime local. Suite240/240 tại workspace/logs/vision-python-suite.log. Main5180 restart sau dispatcher0/0, render/ASRnull, không Remotion worker, PID đúng đường ContentOS. Không sửa dự án người dùng/NAS/Factory. Tài liệu này không chứng minh nghiệm thu toàn mục tiêu ngành xe.
