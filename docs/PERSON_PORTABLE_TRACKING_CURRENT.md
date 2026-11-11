# Theo dõi toàn thân bằng runtime riêng — kiểm thực tế

Mục tiêu: xác minh bộ cài SAM2 mới chạy đủ đường inference và chặn kết quả lỗi, không chỉ import/CUDA. Dùng nguồn QA đã copy, không dự án/media gốc, không API trả phí; mỗi lượt tạo thư mục request/result riêng để không đọc nhầm kết quả cũ. Không đổi UI/renderer hoặc ngưỡng guard để đạt kiểm thử.

Lệnh: `node tests/person-portable-tracking-smoke.mjs --run-local-gpu`. Runtime phải trả source local và đúng tools/sam2-python/python.exe. Kiểm hash nguồn trước/sau; inference48mẫu, các lỗi không được có output; log giữ trong thư mục scratch để tra lại. `tests/person-portable-contact.py` tạo8khung overlay từ kết quả mới bằng NumPy/Pillow trong runtime riêng.

## Kết quả

PERSON_PORTABLE_TRACKING_SMOKE.json: Pythonembedded3.12.10/Torch2.6CUDA12.4/4070Ti. Cảnh một người chuyển động6giây có48mask144×256,4,906s phần inference, đỉnhGPU612740096byte. Thời gian này không gồm khởi động/import và không dùng tính năng suất sản xuất.

Nguồn6giây có vật che tổng hợp di chuyển bị mask guard từ chối area-change tại3,000s; nguồn đổi cảnh bị shot guard từ chối0,500s. Không file result cho hai lượt lỗi, hash nguồn giữ nguyên. Đây kiểm lại cơ chế chặn đã có với runtime mới, không triển khai khôi phục danh tính hoặc tự nối qua vùng che.

Đã xem PERSON_PORTABLE_TRACKING_CONTACT.png:8mốc0/0,75/1,5/2,25/3/3,75/4,5/5,875s, vùng xanh theo mũ/thân/quần/chân của một người. Viền/ngón tay còn giới hạn độ phân giải; ảnh lấy mẫu không chứng minh mọi frame hoặc da được phân loại đúng. Mask này là foreground SAM2, phải giao với semantic người/da MediaPipe khi chỉnh; không dùng toàn foreground thay skin mask.

Chưa nghiệm thu người độc lập giao nhau/che khuất thật, identity recovery, chuỗi dài nhiều shot, UI apply/UndoSave hoặc bản xuất mới trong lượt này. Runtime/lắp đặt có bằng chứng riêng ở PERSON_INSTALLER_CURRENT.md. Mục tiêu nâng cấp ngành xe/UX/skill rộng vẫn còn mở.
