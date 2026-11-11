# Lỗi theo dõi người — phân tích UX trước triển khai · 05/11/2026

- Công việc: người dựng chọn người trong Bộ lọc → Làm đẹp, gặp mất dấu/cắt cảnh thì hiểu lỗi và thử khoảng ngắn hơn; desktop/mobile.
- Hiện trạng code contentos-person-selection.js: catch ghi nguyên stderr Python vào status, không có hành động rút khoảng. Có thể lộ traceback dài và lời tiếng Anh. Không có kết quả thì Apply đã khóa. Nguồn tham khảo là dialog/ảnh thật390/1280 trong PERSON_SELECTION_DIALOG_CURRENT và PERSON_SELECTION_REVIEW_CURRENT; dùng mẫu error→retry VEK hiện có. Chưa quan sát luồng lỗi tương ứng của CapCut, không tuyên bố sao chép.
- Tích hợp: giữ dialog, status, input khoảng và nút Lấy khung đầu. Thêm thông báo tiếng Việt cho lỗi tracker đã biết, chi tiết kỹ thuật thu gọn và nút phụ kết thúc trước mốc lỗi khi còn ≥0,2s. Không thêm sidebar hoặc chạy tracker tự động.
- Luồng: lỗi → nêu mốc nguồn/lý do → người dùng chủ động rút khoảng → vô hiệu kết quả/điểm → Lấy khung đầu/chọn lại/theo dõi. Ngoài khoảng mới giữ ảnh gốc; nút không tạo mask hay sửa project. Các khoảng đã lưu giữ nguyên.
- Trạng thái: hủy không hiện lỗi kỹ thuật; lỗi chưa phân loại giữ nội dung thật. Thay khoảng/retry/load xóa đề nghị cũ. Nếu lỗi quá gần đầu hoặc mốc ngoài khoảng không cho rút. Không dùng parse stderr để tự apply.
- Thiết kế: outline/help/details có nhãn, dùng token hiện tại. Nút wrap, dialog cuộn390/1280, focus tới duration sau thao tác, Escape đóng.
- Kiểm dự kiến: browser component với video QA thật và response tracker giả lập: cut/masklost/unknown/cancel, rút khoảng/rerun/read-only/Apply khóa, screenshots390/1280, không ghi dữ liệu hoặc chạy model. Pure helper kiểm giới hạn và số thập phân. Không thay renderer hoặc inference.


## Kết quả

Đã thêm helper personTrackingError trong editor/lib/person-selection.js và nối dialog hiện có. Ba mẫu lỗi cắt cảnh, mất đối tượng và mask đổi đột ngột được trình bày tiếng Việt; raw error chỉ trong Chi tiết kỹ thuật, mặc định đóng. Chỉ đưa đề nghị khi lỗi nằm trong khoảng hiện tại và còn ít nhất0,2s; kết thúc trước mẫu lỗi một bước1/fps. Người dùng bấm mới đổi duration, xóa canvas/điểm/kết quả tạm, chuyển focus vào duration. Không tự chạy tracker, tạo mask, ghi project hoặc bỏ các khoảng đã lưu. Lỗi không nhận biết giữ thông báo thật. Abort giữ nhánh cũ.

Unit helper/range và tests person-tracking/person-selection tổng6/6 qua. Browser component Chrome dùng UI/module/CSS thật và proxyQA6s thật, response runtime/tracker giả lập, không GPU/mạng/provider: lỗi ở3s→rút2,875s→khóa Apply/Theo dõi→canvas trống→load/chọn/retry qua. Lỗi unknown giữ nguyên; không gọi onApply; Escape đóng; pageErrors0. Ảnh1280/390 đã xem, nút trong viewport và dialog không tràn ngang. PERSON_TRACKING_ERROR_BROWSER_SMOKE.json, PERSON_TRACKING_ERROR_1280.png và _390.png. Chưa kiểm hủy đang chạy, read-only hay nhiều loại lỗi khác trong harness mới; các đường này không được nhận đã nghiệm thu lại. Bằng chứng backend CUDA thật và guard xem PERSON_MASK_CONTINUITY_CURRENT.md.

Main5180 trảHTTP200 cho UI mới; static thay đổi không cần restart. Không đổi renderer/schema/API/skill snapshot nên không render lại hoặc tăng phiên bản skill. Creativev47 đã có hướng dẫn chia khoảng/chọn lại; không chỉnh bản đã đóng gói chỉ vì bổ sung UI.

Kiểm route main phát hiện allowlist module; helper đã gộp vào person-selection.js đang phục vụ, không thêm route. Browser component chạy lại sau sửa và route main kiểm có export.
