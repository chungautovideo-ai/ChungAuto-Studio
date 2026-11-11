# Giữ bốn góc gợi ý OCR

## Phân tích UX trước thay đổi

Người dựng cần khoanh biển nghiêng mà không che cả cản xe. Code hiện tại bỏ bốn góc OCR, chuyển sang hộp thẳng; nút Dùng các vùng gợi ý cũng xóa quadMap. Luồng VEK đã có chỉnh bốn góc ngay trong dialog Che biển, vì vậy giữ component, nút xác nhận và điều khiển sâu hiện có; không thêm menu. Đối chiếu bằng code và bằng chứng contact PLATE_FRAME_CLOCK_REAL_CONTACT.jpg đã ghi nhận che thừa; không có khảo sát CapCut mới.

Luồng đích: Gợi ý chỉ đọc → Dùng mới thay vùng → chỉnh góc/kiểm hình → theo dõi → duyệt như cũ. OCR một dòng giữ polygon lồi và thêm padding theo cạnh. Hai dòng vẫn hộp thẳng vì hai hộp chữ không chứng minh cùng mặt phẳng biển. Polygon ngoài khung/không hợp lệ dùng hộp dự phòng và cảnh báo mép như cũ. Đây là vùng chữ có padding, không phải phát hiện viền vật lý biển. Kiểm toàn bộ response trước thay vùng để lỗi không xóa khoanh tay.

Không đổi bố cục, focus, breakpoint, project schema, renderer hoặc review gate. Kiểm Python hình học và callback UI thực qua VM; kiểm native browser/responsive chưa thực hiện trong lượt này.

## Kết quả

Python giữ quad một dòng lồi theo thứ tự ảnh; mở rộng song tuyến tính dọc cạnh với biên15% ngang/35% dọc. Không sắp xếp lại góc OCR sai hoặc cắt ép polygon ngoài khung. Hai dòng vẫn hộp. Helper chung plateSuggestionGeometry kiểm toàn bộ mảng trước khi UI thay vùng, service cũng dùng cùng kiểm; quad hợp lệ quyết định bounds để không hiển thị hộp lệch polygon. UI giữ quadMap sau Dùng; lỗi ở vùng thứ hai giữ toàn bộ khoanh tay.

Python cases qua: nghiêng/padding/góc đảo-tự cắt/mép/hai dòng/confidence NaN-inf. Sáu kiểm liên quan qua, toàn suite388/388 (workspace/logs/plate-ocr-quad-suite.log). Callback production chạy qua VM, không phải browser.

tests/plate-ocr-quad-smoke.mjs --run-local gọi service/RapidOCR thật trên bản sao xe tại0,74s. PLATE_OCR_QUAD_SMOKE.json:1quad, nguồn/dựán giữ nguyên, firstPTS0,734067 như trước. Quad vẫn rộng và sát mép; không nhận đã sửa hết che thừa hoặc kín biển, chưa tạo bản tracking/final hay receipt mới. Backend đã nạp sau kiểm idle theo bằng chứng triển khai bên dưới; static UI cần tải lại trang.

## Kiểm tracking và triển khai

PLATE_OCR_QUAD_TRACKING_SMOKE.json: tests/plate-ocr-quad-tracking-smoke.mjs --run-local chạy optical flow thực trên hai bản sao riêng. Quad OCR tại0,74s tạo30frame/1s và giữ đúng bốn góc trong provenance; quad chỉnh tay lấy từ QA cũ tại0s tạo60frame/2s. Clock nguồn đúng, có âm thanh, nguồn/project gốc giữ SHA, không tạo receipt. Không tự sửa polygon OCR để đạt kiểm.

Đã xem PLATE_QUAD_TRACK_RAW_OCR.jpg và PLATE_QUAD_TRACK_PREVIOUSLY_REVIEWED_MANUAL.jpg: bốn mốc mỗi bản có vùng đen bám cản trước, bản OCR che rộng hơn. Hai ảnh lấy mẫu không chứng minh kín mọi frame, vùng tối trùng nền cản cũng chưa đủ đánh giá viền. Vẫn cần cải thiện khoanh vùng và kiểm liên tục; không nghiệm thu toànprivacy hay thẩm mỹ.

PLATE_OCR_QUAD_DEPLOY_SMOKE.json: main5180 PID12560→36212 sau xác minh dispatcher0/0, render/ASR/personTracking idle, khôngmediaworker, đúnglistener/command. PingContentOS OK và HTTPstatic có helper mới. Không đổi project context hoặc dựng thử trên dựán đang mở. Nativebrowser/UndoSave/fullUI chưa kiểm mới.
