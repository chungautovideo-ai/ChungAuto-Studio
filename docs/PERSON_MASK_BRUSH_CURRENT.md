# Cọ sửa vùng người/da — phân tích trước triển khai

Nhu cầu: chỉnh sai sót vùng người/da để tránh sáng/mịn nhầm xe/nền, hoặc bỏ sót cổ/tay; kết quả cần vào cùng project/Undo/Save/snapshot. Điểm vào hiện có là Bộ lọc→Làm đẹp→Nâng cao. Dùng dialog theo component che biển hiện có, không thêm menu. Tham khảo khái niệm mask add/subtract ở trình dựng ảnh/video; chưa tuyên bố đã quan sát cọ CapCut hoặc khôi phục engine hãng.

Luồng: mở Sửa vùng nhận diện → chọn nguồn đã quét → chọn giây xem và khoảng áp dụng → chọn cọ da/người/xóa + cỡ → vẽ trên khung nguồn có mask → kiểm/tua trong khoảng → Áp dụng vào bản dựng → Undo/Lưu như các chỉnh khác. Hủy không ghi. Dialog dùng token, input/range/button chung; canvas co theo khung/thiết bị, pointer/touch.

Dữ liệu maskEdits nằm camera.beauty, gồm src/SHA256/from/to/mode/radius/points chuẩn hóa0–1. Chỉ áp khi nguồn và fingerprint trùng dữ liệu quét; không mang vết cọ sang nguồn mới, không xuất vào template phong cách. Runtime và dialog dùng cùng hàm xử lý pixel. Cọ cố định theo tọa độ nguồn trong khoảng, chưa tracking hoặc tách từng người. Giao diện ghi rõ giới hạn, mặc định khoảng một mẫu quét; người dùng có thể kéo dài có chủ đích.

Tiêu chí: da thêm đồng thời thuộc người; thêm người không tự thành da; xóa cả hai; không sửa ngoài nguồn/hash/khoảng; đường liên tục ở sự kiện pointer thưa; cỡ đúng theo cạnh ngắn; giới hạn dữ liệu; preview/export cùng mask; apply/Undo/save/reopen; hủy không mutation. API đọc một mẫu mask, không trả cả video hoặc kho dữ liệu. Chưa nghiệm thu chất lượng full video từ test nhỏ.

## Kết quả triển khai 05/11/2026

Đã thêm dialog Sửa vùng nhận diện bằng cọ trong Nâng cao. Shared person-mask-edits.js xử lý đường liên tục skin/person/erase, giới hạn256nét/16.384điểm; [from,to), src/SHA chính xác. API /api/face?sample=...&time=... chỉ trả một mẫu đã khớp fingerprint; đổi giây phải Lấy khung trước khi vẽ. Hủy không ghi, Áp dụng vào beauty.maskEdits chung project; Undo/Redo/Lưu. Template phong cách hiện không sao camera.beauty nên không mang nét nguồn riêng sang video khác. Nét cọ theo tọa độ nguồn cố định, chưa tracking hay chọn từng người.

Kiểm: unit250/250 ở workspace/logs/person-mask-brush-suite.log; PERSON_MASK_BRUSH_WEBGL_SMOKE.json kiểm WebGL nguồn/hash/khoảng/tua/nền, unit kiểm nội suy đường/cọ/erase/limits. Browser PERSON_MASK_BRUSH_UI_BROWSER_SMOKE.json dùng2nguồn MediaPipe thật1s30fps; thao tác cọ2điểm, hủy không mutation, Apply→Save→Undo→Save→Redo→Save/reopen và đổi giây khóa nút qua, pageErrors0. Dialog390px PERSON_MASK_BRUSH_DIALOG_390.png đã xem. FinalQA brush-2 exit0/oktrue1080×1920/30frame1s silent, ảnh PERSON_MASK_BRUSH_FINAL.png đã xem. Đây không nghiệmthu fullvideo/chuyểnđộng hoặc nhiều người. Skillv27 giữ11preset v26, quick_validate qua; server5180restart khi idle, module200/catalogv27 ở PERSON_MASK_BRUSH_DEPLOY_SMOKE.json. Goal ngành xe cònactive.
