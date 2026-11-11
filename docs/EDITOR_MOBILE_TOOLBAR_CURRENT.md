# Thanh công cụ editor trên điện thoại · 05/11/2026

Phân tích trước code: người dùng cần chuyển Space/Studio, Undo/Redo, xuất, mở thư viện/ảnh bìa và các công cụ dựng trên320–760px. Ảnh SESSION_PERSON_INTEGRATION_390.png đã xem: header tràn làm khuất Xuất/Thêm; nút AI nổi che rail. Code app.css chỉ thu kích thước, chưa tính các nút ContentOS thêm vào. Rail có overflow ngang nhưng thiếu đảm bảo nhóm tab không co và vùng AI tránh rail.

Tham khảo nền VEK hiện tại (app.css/index.html) và VEK_UI_UX_AUDIT_2026-11-03.md: giữ preview trên, drawer dưới và rail vuốt ngang. Không khảo sát CapCut mới hay nhận tương đương. Dùng menu Thêm hiện có cho Thư viện/Ảnh bìa ở mobile; tái dùng handler hiện có, không thêm điều hướng hay thay data.

Thiết kế: header mobile hai hàng, tên dự án trên, chế độ/Undo/Redo/Xuất/Thêm dưới. Ở≤480px Xuất dùng icon có aria-label, nhãn đầy đủ giữ trên màn rộng. Thư viện/Ảnh bìa chuyển vào menu; rail nhóm tab không co, vẫn cuộn ngang, nút AI nằm trên rail. Dùng token/control cũ; nút chính chạm44px. Desktop giữ nguyên. Space vẫn layout riêng.

Trạng thái/dữ liệu: giữ disabled/dirty/Undo/Save hiện có, nút proxy gọi đúng handler, không tự xuất hoặc tạo ảnh. Không đổi project/revision/model. Menu còn cần kiểm keyboard/click/đóng. Nghiệm thu: browser thật320/390/600/760/1280, header không tràn/nút chính trong viewport, cuộn tới công cụ cuối, menu mở đúng thư viện/ảnh bìa, Space/Studio và chỉnh người/da không hồi quy; ảnh kiểm trực tiếp. Không suy từ shell thành mọi dialog hoặc mobile hoàn chỉnh.

## Sau triển khai

Đã sửa index.html/app.js/contentos-layout.css: header hai hàng mobile, tên trên; nút Xuất có aria-label và icon-only≤480, proxy Thư viện/Ảnh bìa trong menu; rail không co, AI nâng trên rail. Menu cập nhật aria-expanded khi chọn và Escape đóng/trả focus. Không đổi renderer/project/schema.

tests/session-person-integration-smoke.mjs đã mở Chrome thật, kiểm bounds header/nút tại1280/760/600/390/320, nút mobile≥42px, cuộn tới tool cuối trong viewport, Escape/focus, proxy mở library và cover. Luồng CLI completion và sửa25/Undo20/Redo25/Save/reopen vẫn qua, không Runtime exception. Evidence EDITOR_MOBILE_TOOLBAR_SMOKE.json, log workspace/logs/mobile-toolbar-person-smoke.log; ảnh SESSION_PERSON_INTEGRATION_*.png. Đã xem ảnh1280/760/390/320: header đủ nút và AI không che rail; desktop giữ bố cục cũ. Ở320 timecode xuống dòng, chưa tối ưu toàn transport. Ảnh320 drawer đóng do Escape theo hành vi editor hiện có. Chưa nghiệm thu Space và tất cả dialog/responsiveflows, không nhận toàn bộ mobile hoàn chỉnh.

Static UI có hiệu lực khi tải lại trang5180; không restart server đang chạy. node --check editor/ui/app.js qua. Không gọi model/provider hoặc xuất video.
