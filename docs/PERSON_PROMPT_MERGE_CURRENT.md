# Giữ điểm người dùng khi gợi ý toàn thân

## Phân tích UX trước code

Công việc: người dựng đã chọn người, bổ sung đầu/tay/chân và điểm loại nền, muốn AI gợi ý thêm mà không mất can thiệp thủ công. Code contentos-person-selection.js hiện lấy positive đầu làm anchor, giữ negative nhưng thay mọi positive bằng4gợiý. Vì vậy điểm tay/chân được thêm để sửa thiếu vùng có thể bị mất. Tham khảo quy trình pointprompt SAM2 đã khảo sát trong PERSON_POINT_SUGGESTIONS_CURRENT.md, không có khảo sát CapCut runtime mới.

Luồng đích: giữ mọi điểm đang có theo thứ tự, thêm positive gợi ý còn xa điểm hiện có; không thêm gợi ý sát điểm loại để tránh prompt mâu thuẫn. Giới hạn16điểm của tracker giữ nguyên. Khi hết chỗ, giữ điểm tay và báo số gợi ý không thêm, không xóa bớt ngầm. Kết quả chỉ là points tạm; không gọi GPU/Apply/Save tự động. Anchor đầu vẫn chọn component; đây chưa phải xác minh danh tính/tách người chạm nhau.

Giữ nút/select/canvas/status trong dialog hiện có, không thêm menu/icon hoặc control. Trạng thái busy/error/readOnly như cũ; lỗi không đổi points. Thông báo sau gợi ý nói rõ số giữ/thêm/trùng/giới hạn. Không đổi thứ tựfocus/breakpoint/schema/render/UndoSave. Kiểm purehelper input/giới hạn/negative/khôngmutation và callback production bằngVM; browsernative vẫn cần kiểm riêng khi truy cập được.

## Kết quả

Helper contentos-person-prompt-points.js và callback dialog giữ nguyên điểm đầu/tay/chân/negative đã có theo thứ tự; thêm positive gợi ý cách mọi điểm hiện tại ít nhất0,012tọa độ chuẩn hóa. Đây bán kính chống trùng/mâu thuẫn prompt, không phải biên đối tượng hoặc landmark. Không thêm positive sát negative; không xóa negative tự động. Nếu16điểm đã đầy, giữ toàn bộ và báo số gợi ý không thêm. Response không hợp lệ giữ points cũ.

4test mới gồm helper và callback productionVM, toàn suite380/380 qua tại workspace/logs/person-prompt-merge-suite.log. Sau cập nhật skill4test reference/package/snapshot qua. Hai fileUI được HTTP5180 trả200/khớp byte; không cần restart. PERSON_PROMPT_MERGE_SMOKE.json. SkillZIP11preset5refs/1.635.769byte; job đãsnapshot giữ bản cũ. Tải lại trang nhận luồng mới.

Không chạy inference/render mới do không đổi engine/mask/renderer; chưa kiểm nativebrowser/focus/responsive hoặc chứng minh những điểm thêm sẽ giữ đủ ngón tay/chân qua chuyển động. Không thêm landmark cơ thể; các gợi ý4điểm silhouette hiện tại vẫn cần kiểm/sửa.
