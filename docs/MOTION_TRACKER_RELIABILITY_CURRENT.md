# Tracking chữ/callout khi mất dấu · 05/11/2026

Khảo sát để dùng lại tracking cho vùng người/da phát hiện theo-doi.mjs legacy giữ phép biến đổi trước khi không còn đủ điểm bám, sau đó vẫn ghi follow thành công. Không dùng tracker này làm engine mask người. Đã sửa riêng lỗi tracking chữ/callout ngành xe để không nhận thành công khi mất dấu.

Mất dưới3 điểm tốt, phép biến đổi không nhất quán hoặc không hữu hạn: dừng với mốc giây và không ghi project. Kiểm nguồn đủ frame, fps1–30, đoạn tối đa15giây, vùng trong khung tối thiểu24px; chặn timeline nhiều nguồn và job đang có candidate. Trước ghi kiểm byte project không đổi. Công cụ vẫn chỉ đo một nguồn A-roll trong tọa độ khung dự án; không nhận diện danh tính, không chọn từng người, không bù che khuất hoặc tự hồi phục qua cut. Cần xem lại toàn đoạn kể cả exit0.

Kiểm thực bằng FFmpeg tạo testsrc1920×1080/6fps: đoạn liên tục tạo6mốc; đoạn cut sang đen lỗi ở0.500s, project không đổi. Test còn kiểm timeline segments/candidate/đoạn quá dài đều không ghi. Fixture tổng hợp, không phải cảnh xe/người thật hay benchmark chất lượng. Test tests/legacy-motion-tracker.test.mjs qua, suite255/255 tại workspace/logs/motion-tracker-suite.log. Không gọi model hoặc xuất video người dùng.

Skill Creative v30 bổ sung giới hạn/cách xử lý mất dấu, giữ nguyên11preset v29. Provenance ghi hash mới; catalog5180 có v30. Các bản cũ và snapshot job giữ nguyên. Đây cập nhật CLI/skill, không thay giao diện hoặc cần restart server. Phần tự chọn/theo dõi từng người và mask chuyển động còn phải triển khai, không coi thay đổi này hoàn tất nhu cầu đó.
