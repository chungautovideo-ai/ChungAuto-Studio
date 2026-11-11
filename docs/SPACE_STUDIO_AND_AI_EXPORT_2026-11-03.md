# Space/Studio và chế độ hoàn tất AI của ContentOS

> Đồng bộ tài liệu 04/11/2026: đọc [điểm hiện hành và bản đồ build](BUILD_CURRENT.md) trước các mốc lịch sử. Mọi thay đổi UI phải theo [quy chuẩn thiết kế và quy trình UX/UI](DESIGN_UX_STANDARD.md): phân tích trải nghiệm, đối chiếu giao diện sẵn có và tham khảo ứng dụng phù hợp trước thiết kế/code. Trạng thái triển khai chỉ được xác nhận bằng bằng chứng đúng phạm vi trong BUILD_STATUS.

Ngày 03/11/2026. Bổ sung khảo sát UI/UX VEK. Phạm vi lượt này: khảo sát và đặc tả, chưa sửa ứng dụng.

## Kết quả khảo sát app cũ
Đã dùng REA mở localhost:8765, đóng màn danh sách dự án, chuyển Studio → Space, mở ⚙ Cài đặt Video. Không gửi prompt, không chạy job, không bấm Xác nhận.
- Studio: media trái, preview giữa, thuộc tính và trợ lý AI phải, timeline dưới, nhật ký tác vụ.
- Space: ẩn media/thuộc tính/timeline/tasklog, giữ chat và preview. Đây là hai bố cục trên cùng job, không phải hai engine dựng.
- Space có hành động Khảo sát footage, Dựng tự động từ đầu, Duyệt & sửa lỗi.
- Hộp cấu hình có Chuẩn kênh/Tự do/So cả hai, mood, cấp độ, thời gian, tỷ lệ, độ phân giải, kênh, model, Tự xuất khi xong.
- Checkbox Tự xuất khi xong được quan sát đang bật. Source panels/space.js đặt autoexport:true.
- studio/space.py ánh xạ autoexport=true → until FINAL; false → until DRAFT và export_in_budget theo lựa chọn.
- studio/space.py lưu cấu hình lượt vào 05_plan/studio/space.json. JS Space khởi tạo cấu hình trong RAM; chưa thấy khôi phục cấu hình mặc định bền vững trong đường code đã đọc. Không được coi là đã có cài đặt toàn cục đầy đủ.
- Space/Studio preference được lưu localStorage studio.space_mode.
- Luồng false vẫn có thể render bản xem 1080p. DRAFT không nhất thiết là không tạo MP4; ý nghĩa là chưa hoàn tất bước giao final.
- Chưa kiểm chứng AI thực sự chạy/render thành công. Các thao tác khảo sát chỉ xác nhận giao diện và wiring source.
Nguồn: studio/web/js/panels/space.js, studio/web/js/ui.js, studio/web/css/panels/space.css, studio/space.py, studio/autopilot.py.
VEK/ContentOS hiện tại: ai-inbox --done kết thúc việc và mở editor; chưa thấy nối auto-export sau AI edit trong đường hoàn tất đã đọc.

## Điều chỉnh kết luận trước
Space cũ thực chất là chế độ AI dựng qua chat và xem preview, rộng hơn chuẩn bị nội dung. ContentOS nên giữ vai trò đó.
Studio dùng editor VEK thực tế. Không chuyển nguyên editor cũ sang và tạo hai timeline/engine.

## Hai trục cấu hình độc lập
1. Bố cục: Space (AI dựng) / Studio (chỉnh tay).
2. Sau khi AI dựng xong: Tự xuất / Chờ kiểm tra.
Mọi tổ hợp đều hợp lệ. Chuyển bố cục không đổi chế độ xuất hoặc kích hoạt job.
Space và Studio dùng chung project ID, revision, asset, job và lịch sử. Cùng một AI service; chat Space và Nhờ AI sửa của editor là hai lối vào cùng hệ thống.

## Trải nghiệm đề xuất
- Trong dự án: nút Space | Studio ở header, giữ tên dự án và trạng thái xuyên suốt.
- Space: chat bên trái + preview bên phải; vùng tóm tắt tư liệu/mẫu/skill, tiến trình job, lựa chọn sau hoàn tất; Mở timeline chuyển sang Studio.
- Studio: giữ layout VEK và Nhờ AI sửa; chọn Làm việc với AI có thể mở Space mà không mất vị trí playhead/lựa chọn.
- Trang chủ VEK vẫn là lối bắt đầu nhanh; không buộc người dùng qua Space.
- Không dùng mode Space để bật/tắt những khu vực ảnh/voice/news toàn ứng dụng. Bố cục dự án và khu chức năng là hai khái niệm khác nhau.

## Cài đặt mặc định và ghi đè
Cài đặt → Dựng bằng AI → Sau khi dựng xong:
(A) Tự xuất video: hoàn tất bản dựng → kiểm tra kỹ thuật → render preset đầu ra → xác minh file → thông báo/cho mở file.
(B) Tôi kiểm tra rồi xuất: hoàn tất bản dựng → preview → trạng thái Chờ kiểm tra → người dùng chỉnh và bấm Xuất.
Theo mong muốn người dùng: thiết kế hỗ trợ A làm mặc định; đây chưa phải thay đổi cài đặt thật.
- Mặc định lưu theo workspace trên máy, áp cho dự án/lượt mới.
- Thiết lập trước AI edit và Space đều hiển thị lựa chọn thực tế, cho đổi riêng lượt.
- Ưu tiên: lựa chọn riêng lượt > lựa chọn dự án > mặc định workspace.
- Chốt snapshot khi enqueue; đổi cài đặt sau không tự đổi lượt đang chạy.
- Hiển thị trước chạy: Sau khi xong: Tự xuất MP4 · preset · thư mục hoặc Chờ bạn kiểm tra.
- Cài đặt cùng nơi có preset tỷ lệ/resolution/fps/chất lượng, thư mục đầu ra local/NAS, quy tắc tên phiên bản. Không ép chung độ phân giải cho mọi template.
- Tự xuất file và tự đăng là hai tùy chọn độc lập. Chỉ đăng/hẹn giờ khi lượt có lựa chọn kênh/lịch riêng.

## Quy tắc xử lý để tránh lỗi
- Job dựng phải kết thúc và project đúng revision trước khi tạo export job.
- Render nhận snapshot bất biến của revision, preset và assets. Sửa trong lúc render không thay đổi file đang render; UI báo file thuộc bản nào.
- Chỉ enqueue một lần cho tổ hợp run/revision/preset/variant; reload/reconnect/callback done lặp không gây render lặp.
- Sau chỉnh AI ở dự án đã có export: giữ file cũ, xuất thành phiên bản mới khi lượt đó chọn tự xuất; không ghi đè âm thầm.
- Lượt AI render/post/install/update không tự kích hoạt lại auto-export. Tránh vòng lặp complete → render → complete → render.
- Thiếu media/lỗi build/không đủ dung lượng/render lỗi/file không hợp lệ: báo đúng trạng thái và cho thử lại, không báo Đã xuất chỉ vì CLI thoát.
- Kiểm đầu ra gồm tồn tại, kích thước hợp lệ, probe đọc được, thời lượng/kích thước/track theo preset. Kiểm kỹ thuật không gắn nhãn Người đã duyệt nội dung.
- Khi người dùng sửa tay trong lúc AI làm, không ghi đè revision mới; giữ kết quả AI thành phiên bản riêng hoặc yêu cầu xử lý xung đột.
- Hủy/khởi động lại có trạng thái bền vững, không mất file đã hoàn thành.
- Một hàng đợi render nặng mỗi máy với giới hạn cấu hình; sáu máy hoạt động độc lập như yêu cầu.
- Giữ tính năng dừng ở preview hiện có cho chế độ B, không bắt render final chỉ để người dùng vào editor.

## Trạng thái và tiêu chí nghiệm thu
Trạng thái: Đang dựng → Kiểm tra kỹ thuật → [Chờ kiểm tra] hoặc [Chờ xuất → Đang xuất → Đã xuất]; kèm lỗi/hủy riêng.
Các kiểm tra bắt buộc khi triển khai:
1. A tự tạo file thật, không cần bấm Xuất.
2. B dừng cho kiểm tra; không tự tạo final hoặc đăng.
3. Mặc định tồn tại sau restart, ghi đè lượt không làm đổi workspace.
4. Space↔Studio giữ project/revision/nội dung.
5. Callback lặp và restart không tạo export trùng.
6. Render đúng revision dù người dùng tiếp tục sửa.
7. Chỉnh tay và AI không ghi đè lẫn nhau.
8. Tự xuất không tự đăng; lịch đăng dùng đúng artifact đã chọn.
9. Lỗi/thiếu dung lượng/hủy có kết quả và thao tác phục hồi rõ.
10. Template/skill/ảnh/voice dùng chung engine và thư viện giữa hai bố cục.

## Bước tiếp theo khi tiếp tục build
Gộp bản đồ UI vào thiết kế hiện tại, sau đó làm revision guards và job orchestration trước auto-export; không chỉ thêm checkbox hoặc prompt AI “nhớ xuất”.
Không triển khai module hai chế độ bằng cách sao chép CSS/DOM cũ: cơ chế ẩn/hiện Space cũ gắn chặt tên panel và MutationObserver; cần component/layout dùng chung phù hợp VEK.

