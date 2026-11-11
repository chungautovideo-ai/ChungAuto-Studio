# Runtime local để điền mẫu đồ họa · 05/11/2026

## Vấn đề
api-presets trước gọi `python` trên PATH để chạy preset-fields.py và import lxml; bộ cài vision local chỉ có OpenCV/NumPy. Máy phát triển dựng được không chứng minh máy khác có Python/lxml. Lỗi này ảnh hưởng preset HTML dùng cho worker API và CLI/session, kể cả lô.

## Thay đổi
- preset-python.mjs chọn CONTENTOS_PRESET_PYTHON nếu được cấu hình (không fallback khi override lỗi), tiếp theo Python embedded của app, rồi Python hệ thống khi chưa có local. Kiểm phân tích HTML thật, trả runtime cụ thể; lỗi nêu setup.ps1.
- Bộ cài chạy sau vision: tải wheel lxml6.0.2 CPython3.12 Windowsx64 từ PyPI/pythonhosted, SHA256 ghim72c87e5ee4e58a8354fb9c7c84cbf95a1c8236c127a5d1b7683f04bed8361e1f, giải nén staging và kiểm HTML trước rename tools/preset-fields. Không ghi đè thư mục hỏng, giữ override, cleanup chỉ trong staging đã kiểm. Không cài pip hoặc thay Python hệ thống. Hệ khác dùng Python/lxml đã cấu hình, chưa bootstrap tự động.
- preset-fields.py thêm đường thư viện local; api-presets dùng executable đã kiểm. Preset chữ thuần không cần chạy Python. Doctor có graphic-preset-python bắt buộc và nêu source/localEnvironment.

## Kiểm thực tế
Máy phát triển đã có embeddedCPython3.12.10; tải/cài lxml6.0.2 lần đầu thành công. Chèn ca-stat với PATH rỗng và không override, giữ input, tạo HTML chứa dấuViệt/m² đúng. PRESET_LOCAL_RUNTIME_SMOKE.json; chưa phải cài Windows sạch toàn bộ.

Unit2case runtime local preference/phép HTML/override lỗi/no fallback/malformed và API/session preset qua. Fullsuite313/313 tại workspace/logs/preset-local-suite.log, sau thay đổi cuối. Doctor exit0: graphic-preset-python ready/sourceembedded/localEnvironmenttrue; workspace/logs/doctor-preset-python.json. Các test liên quan có Python thật, không chỉ mock.

Main5180 restart sau dispatcheractive0/queued0, render/ASR/personidle, không mediaworker và đúng PID/command; start.ps1 trả ready. Không đổi UI/schema/renderer, không sửa project người dùng. Chưa kiểm mới APIprovider/model/final, bộ cài sáu máy hoặc SAM2 trên Windows sạch. SAM2 vẫn là hạng mục cài đặt riêng chưa được giải quyết bởi lxml.
