# Ưu tiên thành phần đang dựng trong bảng Văn bản/Đồ họa · 05/11/2026

## Phân tích trước thay đổi
- Công việc: người dùng kiểm và sửa bản AI dựng, trên desktop và điện thoại; cần thấy chữ/đồ họa đang dùng trước khi thêm mẫu mới.
- Hiện trạng: renderList bỏ toàn bộ danh sách đang dùng nếu template có preset. Ảnh REAL_CODEX_PRESET_EDITOR.png chỉ có ba thẻ mẫu lớn ở đầu bảng; chữ mới phải tìm trên timeline. Không phải danh sách nằm dưới, mà code đã bỏ nó khỏi bảng.
- Tham khảo: dùng lại VEK rail/submenu, card preset drag/drop và inspector hiện có. Quan sát trực tiếp ContentOS kế thừa VEK, không nhận đã khảo sát thêm phiên bản CapCut mới.
- Tích hợp: Văn bản → Chữ và Đồ họa → danh sách đang dùng dạng hàng gọn, tên/mốc thời gian/chọn/tắt riêng; kho mẫu cùng tab trong disclosure một dòng trước danh sách. Không thêm menu/sidebar.
- Luồng: bấm hàng mở inspector và seek như timeline; mở Mẫu có sẵn khi muốn thêm. Kho tự mở khi chưa có thành phần, tìm kiếm mở kho để không giấu kết quả; trạng thái mở giữ trong phiên, không ghi project.
- Thiết kế: dùng token/control hiện có, hàng một cột co giãn, nút có label/keyboard, checkbox Dùng độc lập; details/summary native có focus lime. Không thay preview/render/schema.
- Dữ liệu: chọn và mở kho không dirty; bật/tắt vẫn snapshot/Undo/Save chung. Giữ thao tác kéo/chèn và cache thẻ; mở kho phải fit lại thumbnail do lúc đóng không đo được chiều rộng.
- Kiểm dự kiến: desktop1280/mobile390, chữ và đồ họa đang dùng, chọn inspector, mở/đóng/tìm preset, chèn và Undo trên QA copy, Save/reopen nếu thay dữ liệu. Không sửa dự án người dùng.

## Kết quả

Sửa editor/ui/app.js và app.css: kho thu gọn một dòng ở đầu để luôn tìm được, danh sách chữ/đồ họa đang dùng hiển thị bên dưới; không còn bỏ danh sách khi template có preset. Hàng chọn có nút/aria-pressed và checkbox riêng, card preset thêm Enter/Space/focus. Kho mở fit lại thumbnail, tìm kiếm tự mở kho, trạng thái mở chỉ trong phiên. Không đổi renderer/schema.

Browser QA5194, project contentos-qa-real-codex-preset:13chữ/2đồhọa, chọn mở inspector/seek, mở kho3thẻ127px, tìm hook còn1, chèn13→14 và Undo→13 bằng chuột/bàn phím, tắt Dùng và Undo phục hồi, Ctrl+S/reload giữ13/title/visible qua. Desktop1280×720/mobile390×844 đã xem; chọn chữ mobile mở inspector. Ảnh USED_COMPONENTS_DESKTOP.png/MOBILE.png. Drag/drop dùng code cũ, chưa kéo thử lại. Trạng thái trống chưa kiểm browser riêng.

Phát hiện TypeError lúc resize trước project load; updateSelection nay dừng khi chưa có project/timemap. Sau reload và đổi390↔desktop không có lỗi mới trong log; lỗi cũ01:25:26Z vẫn lưu. Syntaxcheck qua. Chỉ thay staticUI nên không restart main5180. Không suy từ bài UI này thành nghiệm thu toàn mobile/fullvideo.

## Phân tích bổ sung: chữ HTML trong blocks

Code hiện định tuyến blocks.group=chu vào Văn bản khi chọn trên timeline, nhưng danh sách và bộ đếm vẫn lấy riêng texts/blocks. Hậu quả: chữ HTML nằm nhầm Đồ họa, chọn hàng có thể mở sai inspector nếu ID trùng giữa hai mảng. Sửa bằng danh sách tham chiếu {item,key} phân nhóm theo cùng quy tắc timeline; Văn bản gồm texts và block chu, Đồ họa chỉ block còn lại. Chọn hàng giữ kind gốc, chọn/chèn chữ thường xóa kind cũ; bộ đếm và trạng thái kho trống dùng cùng danh sách. Không đổi project/schema/renderer, không chuyển dữ liệu giữa mảng. Giữ component và luồng VEK đang có, không thêm tab. Kiểm unit phân loại/id trùng/không mutation và browser QA chọn đúng inspector, visibility/Undo/Save/reopen trên bản sao.

## Kết quả chữ HTML chung nhóm Văn bản

Đã dùng component-list.js làm quy tắc chung cho list/count/selection và timeline routing; chữ HTML group chu ở Văn bản, Đồ họa không lặp lại. Chọn hàng giữ mảng gốc, addItem/select xóa selection kind cũ phù hợp. Status cũng tính chữ HTML. Thêm route tĩnh cho helper; QA đầu phát hiện thiếu route và count captions là object, đã sửa count chỉ dùng helper cho texts/blocks trước nghiệm thu.

Browser QA5195 trên contentos-qa-component-routing-3:1text+1HTMLtext cùng ID same và1graphic. Văn bản2/Đồ họa1, chọn từng hàng chỉ highlight đúng một, inspector thường/HTML đúng; tắt riêng HTML/Undo/Save/reload giữ cả hai. Mobile390 mở đúng inspector; screenshot mobile đã xem. Desktop screenshot và bộ đếm2 đã xem; đây là fixture1giây kiểm editor, không phải nghiệm thu chất lượng/fullvideo. 315/315 unit qua trong workspace/logs/component-routing-suite.log; syntax app/server qua. Main5180 restart sau dispatcher0/0/renderASRpersonidle/đúngPID57900 và khôngmediaworker; module HTTP200. QA5194/5195 dừng sau kiểm idle/đúng PID.

Skill v50 editorial thêm group/name và tham chiếu mảng+ID, không nhân đôi chữ. ZIP mới chungauto-creative-v50-editable-layers.zip đã parse lại11preset/5refs (COMPONENT_ROUTING_SKILL_SMOKE.json); chưa modelrun quy tắc mới, không thay snapshot job cũ. Không đổi renderer/schema.
