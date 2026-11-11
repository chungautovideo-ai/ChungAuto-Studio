# Xem chuyên đề và tải mẫu trong thư viện

Phân tích trước code: home.js dùng templateDetailsPanel tại mẫu đã cài và thư viện; panel hiện chỉ hiển thị SKILL.md/preset/hash nên v38 có4reference nhưng người dùng không mở xem được. Giữ disclosure VEK “Quy tắc và khả năng của mẫu”, không thêm sidebar/tab. Mẫu v38 có snapshot job nhưng màn này cần nói rõ là bản thư viện hiện tại. Tham khảo chính panel hiện có, chuẩn DESIGN_UX_STANDARD và ảnh thư viện/phiên bản đã có, không nhận đã khảo sát CapCut cho hạng mục này.

Luồng: mở disclosure→xem hướng dẫn chính→mở từng chuyên đề, tải riêng khi cần→Tải gói mẫu .zip. Hiển thị tên tiếng Việt khi biết color/person/plate/finishing, đường dẫn gốc ở title; nội dung textContent, không thực thi HTML. Loading/lỗi có nút thử lại, không tự làm dirty/áp mẫu. Download local không gọi mạng ngoài/khôngpost, có note không kèm runtime/font/asset ngoài. Dùng class outline/btns/help/pre đang có, wrap vàcuộn390/1280, keyboard disclosure.

Kiểm: HTTP reference chỉ cho file khai báo trong template, sai path400, downloadZIP parse đủ11preset/4refs; browser mởtopic/previewtext/mobile/nobuttonduplicate/errorretry, không đổi workspace/project. Đây bản thư viện, không thay snapshotjob cũ.


## Kết quả thực tế

Panel dùng chung tại Home/mẫu chọn và Thư viện: chuyên đề lazy-load, lỗi có Thử lại, Hướng dẫn chính và Thông tin phiên bản thu gọn; nút tảiZIP theo tokenoutline. Endpoints GET /api/v1/templates/reference chỉcho path đã khai báo, /api/v1/templates/package trả ZIPattachment. Không đổi project/snapshot hoặc thực thi nội dung Markdown.

Browser smoke realserver5199/component được mount trong overlayQA trênhome để cô lập, không sửa workspace/dự án:4topics, lazyloadcolor, lỗi giả→retrythậtqua, HTTPpathngoài400, tảiZIPparse11preset/4refs. Xem TEMPLATE_REFERENCE_BROWSER_SMOKE.json và ảnh1280/390; đãxemảnh390sau chỉnh gọn, khôngtrànngang. Đây kiểmcomponent, chưa chứngminh mọi luồngđiềuhướng thưviện. Lỗi test ban đầu doxóabody trướchomeinit đãđượcsửa thànhoverlayQA.

Suite270/270 ởworkspace/logs/template-reference-browser-suite.log. App5180restart saucheckdispatcher0/0/renderASRtrackingidle/khôngmediaworker/đúngPIDcommand. GETreference5180 trảperson.md cóguideXemvùng. Khôngđổirenderer,nênkhôngrender lại; gói khôngkèmfont/model/runtime/assetngoàinhưnoteUI.
