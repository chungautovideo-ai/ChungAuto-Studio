# Hoàn tác điểm trong dialog chọn người

## Phân tích UX trước code

Hiện trạng qua code contentos-person-selection.js: canvas thêm điểm và Gợi ý bổ sung điểm; chỉ có Xóa điểm để sửa, nên một lần chạm nhầm có thể buộc chọn lại toàn bộ. Luồng điểm đã giữ thủ công mới được sửa tại PERSON_PROMPT_MERGE_CURRENT.md. Dùng nguyên tắc Undo theo thao tác của editor VEK, nhưng lịch sử này chỉ thuộc điểm tạm trong dialog, không lẫn Undo của bản dựng. Không có khảo sát CapCut runtime mới.

Thêm nút phụ “Hoàn tác điểm” cùng nhóm Gợi ý/Xóa. Một chạm canvas là một bước; một lượt Gợi ý thêm nhiều điểm là một bước; Xóa điểm có thể hoàn tác sau khi về khung đầu thành công. Gợi ý không thêm điểm/lỗi không tạo bước. Tối đa64bước, mỗi snapshot≤16điểm; đổi from/duration/fps hoặc Lấy khung đầu mới xóa lịch sử để không dùng điểm sai khung. Đóng dialog bỏ lịch sử. Không lưu lịch sử vào project/mask, không gọi GPU khi hoàn tác.

Nút disabled khi không có bước, busy, chưa tải hoặc có kết quả tracking; review vùng đã lưu ẩn nút. Sau Xóa điểm trở về khung đầu mới hoàn tác được. Validate và seek trước khi khôi phục, lỗi giữ lịch sử; đổi context/source không cho phục hồi. Dùng buttonoutline/status/canvas sẵn có, flexwrap của nhóm; thêm một tabstop theo thứ tựDOM, không thêm phímCtrlZ làm xung đột Undo bản dựng. Không đổi schema/renderer/mứcbeauty/UndoSave bản dựng. Kiểm helper và callback production/disabled/readonly, staticHTTP; nativebrowser/responsive chưa kiểm khi công cụ trình duyệt bị chặn.

## Kết quả

Đã nối lịch sử local64bước trong dialog: chạmcanvas/Gợiýcóthêm/Xóa thànhcông mới lưu snapshot; Undo validate/seek trước pop, lỗi giữđiểm vàhistory. Controls khóa khi busy/readOnly/result; đổi khoảng/tải đầu mới xóa history. Các điểm snapshot tách bản sao. Thông báo16điểm nêu Hoàn tác/Xóa để sửa. Không phát request GPU/Apply khiundo.

4testcallbackproductionVM mới,8test mục tiêu trước/sau sửa, toànsuite385/385 tại workspace/logs/person-prompt-undo-suite.log. Sau cập nhật skill kiểm Undo/reference/package/snapshot8/8 qua. StaticHTTP5180 khớp byte appfile mới; PERSON_PROMPT_UNDO_SMOKE.json. Không cần restartbackend. Skillperson.md vàZIP11preset5refs đãparse lại; job snapshot cũ giữ nguyên.

Chưa nativebrowser/thao tác chạm/keyboard/focus/responsive vì công cụ không khả dụng; không gọi VM là nghiệm thu UI thực tế. Không thay renderer hoặc inference nên không xuất/chạyGPU mới ở lượt này. Tải lại trang để nhậnnút.
