# Timeline và vùng xem trước · 05/11/2026

## Phân tích trước thay đổi
- Công việc: kiểm chữ, phụ đề, màu và người trong Studio sau AI dựng; desktop và màn hình nhỏ.
- Quan sát trực tiếp: Q2 fresh-ASR trong IAB 1280×720 mở với timeline đã lưu cao khoảng480px, preview video dọc chỉ khoảng105px; bấm đúp thanh chia trả mặc định thì video cao333px. Đây là lỗi hồi phục bố cục theo viewport, không lỗi nội dung dự án.
- Tham khảo: giữ thanh chia timeline VEK hiện có (app.js/app.css); mô hình panel co giãn đã khảo sát trong VEK_UI_UX_AUDIT_2026-11-03.md. Không tạo menu hoặc tuyên bố đã khảo sát mới CapCut.
- Tích hợp: thanh chia #tlResize, localStorage editor.tlHeight, relayout hiện có; không đổi project/renderer/skill hoặc media.
- Luồng đích: chiều cao người dùng kéo vẫn được lưu; khi cửa sổ nhỏ đi giới hạn chiều cao hiển thị để giữ vùng preview. Kéo, phím mũi tên/Home/End, Enter trả mặc định. Khi cửa sổ lớn lại phục hồi chiều cao mong muốn.
- Thiết kế: giữ màu/token và thanh kéo; thêm focus lime cùng hệ, aria tên/giá trị và tab stop.
- Kiểm: viewport1280×720,390×844 và thu/phóng chiều cao; keyboard; xem khung thực. Không thay timeline dữ liệu, không render hoặc đăng.

## Kiểm nội dung Q2
Đã mở fresh-ASR Q2 trong editor, tua 2.5s: chữ ChungAuto Quận2, dòng3mảng dịch vụ và caption hiện, không che mặt trong khung đã xem. Chưa nghe/toànvideo; phụ đề vẫn có câu ASR không rõ, không tự sửa tên hoặc thông số dựa đoán.

## Sau triển khai
- app.js giới hạn chiều cao hiển thị theo viewport/header, giữ chiều cao mong muốn trong biến và localStorage; không ghi project. index.html thêm tab stop/aria; app.css thêm focus lime.
- Kiểm UI thực: 1280×720 End→364px, vùng video cao225px; thu1280×600 timeline244px, vùng video vẫn225px. Mobile390×844 đóng drawer thấy preview, timeline và audio lanes; Home96→ArrowUp112→Enter338px. Desktop Enter trả256px. Đã thử reload ở cửa sổ thấp; chưa nghiệm thu mọi browser/chiều cao nhỏ hơn600px.
- Ảnh đã lưu: TIMELINE_PREVIEW_SPACE_1280.png, TIMELINE_PREVIEW_SPACE_390.png. node --check editor/ui/app.js qua. Không thay renderer/media nên không xuất lại video. Workspace cuối đã trả ChungAuto qua select và đọc selected option.
- Skillv50 đã yêu cầu kiểm preview/nghe câu tên/thông số không rõ và báo phần chưa xem/nghe; không thêm chỉ dẫn trùng hoặc nhận model đã được thử với bản skill mới. Chất lượng ASR và B-roll Q2 vẫn là phần còn cần cải thiện/kiểm.
