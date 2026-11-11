# Đối chiếu lời và nhịp cảnh trám trong editor

## Phân tích UX trước code

Người duyệt video ngành xe cần biết hình sản phẩm đang nằm dưới ý lời nào và còn bao lâu sau hiệu ứng. Code inspector hiện chỉ có at/dur/mediaStart và hiệu ứng; CLI/API đã có speechOverlap/entrance nhưng người dùng phải nhờ AI đọc. Q2_CURRENT_FIRST_BUILD_AUDIT.json ghi nhận cảnh màn ở câu chung và không khớp khoảng gọi tên. Báo cáo này là dấu hiệu để xem lại, không tự kết luận montage sai.

Dùng luồng VEK editor-first hiện có: chọn Cảnh trám → thời gian/hiệu ứng → disclosure “Lời và nhịp cảnh trám”. Tham khảo chính timeline và báo cáo CLI/API đã kiểm; chưa khảo sát CapCut runtime mới. Không thêm menu, provider hoặc modal. Hiển thị giây output, lời caption giao cảnh, từ tiếp theo, thời gian sau hiệu ứng; nút xem đầu/đoạn không sửa hay xuất. Nêu rõ caption có thể sai/thiếu, chưa kiểm hình/âm. Chỉnh mốc/hiệu ứng cập nhật tại chỗ, không gọi model/API hoặc đọc media.

Giữ token details/help/outline và h() chung. Nội dung wrap theo inspector hiện có; dùng nút có nhãn, details native cho bàn phím; không đổi focus khi refresh. Trống/ẩn/hết timeline/caption tắt hiển thị lý do. Không auto snap hoặc kéo dài cho hết cảnh báo. Save/Undo/renderer không đổi; kiểm phép tính đối chiếu renderer và callback component, browser/mobile còn phải nghiệm thu.

## Kết quả triển khai

Inspector app.js dùng contentos-broll-timing.js với helper read-only contentos-broll-editor-timing.js. changed() refresh panel tại chỗ sau recalc để không mất focus hoặc trạng thái details khi gõ mốc/hiệu ứng. Undo/Redo dựng lại inspector theo luồng hiện hành. Cảnh ẩn/ngoài nội dung khóa nút xem; không có lời hoặc caption tắt có lý do. Nút xem seek tới mốc output mới nhất và phát tiếp timeline, không tự dừng hoặc thay cấu hình.

394/394 unit/service qua (workspace/logs/broll-editor-timing-suite.log); nhóm5kiểm tập trung gồm phép tính/callbackcomponent thực và báo cáo worker cũ. tests/broll-editor-timing-real-smoke.mjs --run-local đọc4cảnhQAQ2 đã lưu, đối chiếu outputStart/end/entrance/từ với rendererreport: đúng, SHAproject giữ nguyên. HTTPmain5180 trả đúng byte cả3module. BROLL_EDITOR_TIMING_SMOKE.json giữ kết quả; không phải browsernative hoặc chất lượng hình/âm. Không restart/backend/projectwrite; tải lại trang để nhậnUI.

Skillv50 editorial.md thêm điểm vào editor và giới hạn báo cáo; ZIPchungauto-creative-v50-broll-editor-timing.zip đã parse lại11preset5refs. Chưa kiểm responsive/keyboard/focus và UndoSave bằng browser; chưa xem/nghe toànQ2 hoặc chứng minh cảnh đúng sản phẩm từ báo cáo này.
