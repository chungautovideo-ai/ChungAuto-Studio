# Creative v18 · Chỉ chi tiết sản phẩm

Hai preset mới trong Đồ hoạ: Chỉ chi tiết · nhãn trái/phải. Giữ 9 preset cũ, tổng 11; bản v17 và các dự án người dùng không đổi. Mẫu v18 cần được chọn cho dự án muốn dùng preset mới.

Inspector khối có nhóm thu gọn Bố cục chỉ chi tiết: điểm ngang/dọc, nhãn ngang/dọc theo % khung hình, màu nhấn. Tên chi tiết và thông tin vẫn dùng field chữ hiện có. Save/Undo/reopen giữ HTML và hình học; worker API insert_template_preset dùng cùng HTML/CSS/animation và field. Không thêm sidebar. UX trước code: AUTOMOTIVE_EDIT_IMPLEMENTATION_2026-11-04.md.

Chuyển động: chấm xuất hiện, đường vẽ, nhãn hiện sau. Kiểm ảnh phát hiện vector-effect non-scaling-stroke làm nét SVG chuẩn hóa thành nét đứt; đã bỏ và dùng stroke .35 đơn vị viewBox, runtime đặt pathLength chuẩn. Đây là chỉ điểm cố định trong khung, chưa tự bám vật, chưa điều khiển điểm bằng kéo trực tiếp. Cảnh chuyển động cần kiểm lại vị trí trong toàn đoạn.

Bằng chứng: FEATURE_POINTER_BROWSER_SMOKE.json tạo dự án riêng, chèn thẻ, sửa tọa độ/màu/chữ, từ chối vượt khung, Undo, Save/reopen, player SVG thực; ảnh FEATURE_POINTER_UI_1280.png và FEATURE_POINTER_UI_390.png đã xem. Mobile dùng drawer cuộn sẵn có, chưa nghiệm thu toàn bộ mobile app. FEATURE_POINTER_FINAL_SMOKE.json: render exit0, video 3s 1080×1920/30fps từ nguồn ghế thật cắt 1–4s/proxy540×960, không âm thanh; ảnh final và ba pha chuyển động đã xem. Không benchmark fullvideo/AI provider.

Skill v18 cập nhật cách dùng 11preset, chọn vị trí đúng chi tiết và giới hạn tracking; quick_validate qua. Suite 236/236. Main5180 catalog trả v18/11preset, endpoint template và control HTTP200; không cần restart vì các tài nguyên đọc từ đĩa. Không tự thay mẫu hoặc video đang mở của người dùng. Các phần còn thiếu trong PERSON_SKIN_CURRENT.md và lộ trình ngành xe vẫn giữ nguyên.
