# Chọn người và theo dõi — phân tích UX trước triển khai

Điểm hiện tại đã xem: panel Làm đẹp có nguồn và mức riêng, chỉ quản lý/bỏ chọn mask được gắn qua QA. Dialog cọ hiện có nguồn, mốc nguồn, canvas, Apply/Hủy; tái sử dụng phong cách và vòng Save/Undo. Tham khảo mô hình điểm positive/negative của SAM2 đã chạy thực, không coi đây là bản sao dialog CapCut. Người dùng cần chọn một người giữa nhiều người mà không sửa màu phần còn lại.

Luồng: lưu dự án → chọn nguồn trong Người & da toàn thân → Chọn và theo dõi người → nhập khoảng nguồn và fps → lấy khung đầu → chạm điểm giữ hoặc loại → Theo dõi → tua xem mặt nạ trong khoảng → Áp dụng → Lưu. Nút chính đổi theo trạng thái: Theo dõi khi có điểm, Áp dụng chỉ khi có kết quả hợp lệ. Thay khoảng/điểm vô hiệu kết quả. Hủy đóng hoặc hủy tác vụ abort backend; lỗi không ghi project. Không tự áp gợi ý sáng hoặc tự bật làm đẹp.

Dialog theo token/control hiện có, canvas vừa viewport, controls wrap390/1280, nhãn điểm có số/positive-negative ngoài màu, focus/Escape. Backend nhận src/hash nguồn đã quét, kiểm revision/workspace trước/sau/during; lock liên tiến trình tránh trùng GPUtracker, không xóa lock timeout. Kết quả nằm request/scratch, trả mask để người dùng Apply; không live-write. Activity hiển thị tác vụ cóPID để không restart nhầm. Python/model thiếu báo cách cấu hình local, không cài hoặc tải ngầm. Chưa đóng gói runtimeSAM2 trên máy mới.

Giới hạn rõ: tối đa120mẫu/15giây, chọn một đối tượng cho một khoảng mỗi file; giữ ba thanh toàn thân, chưa các hiệu ứng mặt. Không đảm bảo qua cut/che khuất, cần kiểm toàn khoảng; tắt ngoài khoảng thay vì chọn tất cả. Kiểm điểm/hủy/thiếu dữ liệu/revision đổi, APIthậtGPU→review→Apply→UndoSave/reopen và final dùng helper đã kiểm.


## Kết quả triển khai · 05/11/2026

Đã nối nút Chọn và theo dõi người vào nguồn đã quét trong Bộ lọc → Làm đẹp. Dialog dùng khung nguồn, điểm giữ/loại, khoảng/fps, xem mask theo mẫu, Apply/Đóng và Hủy tác vụ. Dự án phải lưu trước; đổi workspace/revision hoặc nguồn không khớp thì từ chối. Không ghi project khi chỉ tracking; Apply mới vào Undo/Save. Ba thanh toàn thân dùng renderer giao mask đã kiểm trước đó; không mở rộng hiệu ứng mặt cũ.

Backend POST /api/person-tracking dùng Python/SAM2 local, khóa liên tiến trình, abort/180s timeout, kiểm revision mỗi giây và hash nguồn/model trước khi trả. Lock lỗi báo needs-attention, không tự xóa lock cũ. GET status và resources.personTracking trong Activity API cho kiểm restart; chưa thêm progress phần trăm hoặc bảng task mới. Máy hiện tại có Python/torch/CUDA/transformers/model; chưa đóng gói cài máy sạch. Không có API trả phí.

Bằng chứng PERSON_SELECTION_DIALOG_SMOKE.json: Chrome thật, QA5199/workspace riêng, quét MediaPipe thật rồi SAM2 CUDA thật 8 mẫu/1 giây, chọn trái và loại phải. Kiểm tracking không ghi live, Apply/Undo/Redo/Save/reopen qua, hủy khi lock running về idle không đổi project, pageErrors=[]; ảnh390/1280 đã xem. Fixture là cùng một người nhân đôi, không phải nhiều người độc lập. Suite264/264 ở workspace/logs/person-tracking-suite.log. Renderer/final1s đã có bằng chứng PERSON_SELECTION_RENDER_CURRENT.md; lượt này không xuất thêm vì không đổi renderer.

Creative v34 giữ11preset và thêm hướng dẫn sử dụng/giới hạn. Chưa nghiệm thu chuyển động dài, giao cắt, che khuất, cut recovery, nhiều người độc lập hoặc CPU fallback; không nhận ngang CapCut. SAM2 là vùng đối tượng, MediaPipe mới phân biệt da/quần áo. Người dùng cần kiểm toàn khoảng trước áp dụng.


## Phân tích bổ sung trước sửa luồng chọn lại

Code hiện tại: sau khi tua kết quả sang khung cuối, Xóa điểm giữ canvas ở khung cuối trong khi backend luôn nhận điểm cho khung đầu. Người dùng có thể đánh điểm sai mốc. Luồng đích: Xóa điểm phải trở về khung đầu trước khi mở lại tương tác; trong lúc seek khóa các nút, lỗi thì không cho chọn. Dùng cùng dialog/control, không thêm menu. Kiểm browser thật: tua cuối→xóa→thời gian nguồn về đầu→chọn lại→theo dõi. Bổ sung kiểm cắt cảnh trước inference để dừng khoảng không liên tục; đây guard, không phải bảo đảm nhận mọi cut/danh tính.


### Kết quả chuyển động và chọn lại

Q2 proxy đoạn gốc8–14s,480px,6giây/48mẫu8fps: một điểm ở áo tạo mask chủ yếu chiếc áo (PERSON_SAM2_MOTION6_CONTACT.png); đây phát hiện thiếu vùng, không nhận toàn thân đạt. Thêm điểm positive đầu/thân/hai chân và negative nền tạo48mask; PERSON_SAM2_MOTION6_BODY_CONTACT.png đã xem8mốc: gồm đầu/mũ/tay/chân/giày khi người đi và ra hiệu. Còn viền răng cưa/blur, không nhận chính xác toànframe. PERSON_SAM2_MOTION6_BODY_SMOKE.json ghi thông số. Lượt thử7điểm đầu tiên bị từ chối do điểm không khớp mask, không output. UI đã nêu rõ một điểm áo có thể chỉ chọn áo, cần nhiều điểm cho toàn thân.

Xóa điểm sau tua nay seek về from trước cho phép vẽ. Browser test so toàn bộ canvas sau xóa với khung đầu, retrack/Apply/UndoRedoSave/hủy/reopen qua trong PERSON_SELECTION_DIALOG_SMOKE.json. Guard RGB thô64px dùng hai chỉ số delta>.22 và histogram>.42, từ chối cut đen ở.500s trước inference và không output; Q2 liên tục không bị chặn. PERSON_SHOT_GUARD_SMOKE.json. Guard không nhận mọi cut/danh tính, flash hoặc chuyển động mạnh có thể bị từ chối nhầm. Chia shot/chọn lại, không fallback giữ mask.


Lượt browser6s hoàn tất: PERSON_SELECTION_MOTION_DIALOG_SMOKE.json, quét MediaPipe2nguồn/181mẫu30fps rồi SAM2thật48mẫu8fps;4positive+1negative. Track khônglivewrite, tua→Xóađiểm so canvas khungđầu khớp, retrack, Apply/Undo/Redo/Save/reopen vàhủy đangchạy khôngghi đều qua, pageErrors=[]. Ảnh390đãxem; panelcuộn giữcontroltrongviewport. Skillv35 endpoint5180 trảversion35/11preset; trackeridle, staticUI mớiHTTP200. Runtime/modelscript đọc từđĩa khi chạy, lượt này khôngđổi server nên khôngrestart. Unitselection/tracker4/4 vàPythonshotguardqua; suite264trướcđókhôngchạylạivìkhôngđổi schema/renderer/service. Chưaxuấtthêmfinal6s; finalrenderer cóbằngchứng1s trướcđó, khôngnhận6sfinalđạt.


Nângcấpv36: nhiều khoảng mỗi nguồn, khôngchồng, danh sách Chọnlại/Xóariêng. Giới hạn một khoảng mỗi file ở checkpoint cũ đã thay bằng40nguồn/120khoảng; xem PERSON_SELECTION_RANGES_CURRENT.md. Từng lượt tracking vẫn120mẫu/15giây.
