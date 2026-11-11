# Báo cáo người/da cho AI · 05/11/2026

CLI: node editor/tools/kiem-tra-nguoi.mjs <dự án>. API worker: tool read_person_exposure khi server truyền personContext. Cùng service personExposureReport đọc tracks khớp fingerprint cho các nguồn project; CLI theo project.json đã lưu, API theo candidate tại lượt gọi. Chỉ trả summary/gợi ý/mức hiện có/src/hash/missing và policy, không trả f/idx/skin mask. Báo cáo không ghi hoặc gọi model, không tự quét hoặc áp gợi ý. Nguồn thiếu/stale cần quét editor, số đo sai báo không khả dụng.

Inbox thêm hướng dẫn đọc khi cần; không nạp toàn face.json. API tool cũng cấm thay skinLift heuristic toàn khung cho mask người. First-build beauty keep giữ mức đã snapshot, off bỏ beauty; báo cáo không mở đường vượt policy. Người dùng áp/chốt mức trước giao dựng. Đây chưa phải tự quét/áp mức trong job hoặc đầy đủ workflow AI chỉnh da tự động.

Kiểm service: file/hash stale, mức riêng0, không trả mask/landmarks, báo cáo giữ nguyên media/face.json. Mock API kiểm tool đăng ký, trả báo cáo từ candidate và chỉ sửa title theo lệnh giả lập, camera.beauty giữ nguyên; không gọi provider. CLI thật đọc2nguồn MediaPipe Q2 crop đã lưu:2472byte so với face.json376463byte; hash project không đổi, nguồn tối gợi ý25 nhưUI. Đây UTF8byte, không phải token/latency model. PERSON_EXPOSURE_REPORT_SMOKE.json ghi bằng chứng. Suite260/260 tại workspace/logs/person-exposure-report-suite.log.

Server5180restart sau xác minh dispatcher0/0, render/ASRidle và đúngPID. Creativev33giữ11preset v32, quick_validate qua/catalog có. Chưa gọi worker model thực, chưa nghiệm thu fullvideo/audio/năng suất hoặc chọn từng người/tracking. Giao diện v32 không đổi.


Bổsungv37 selectionScope/measurementScope trong PERSON_SELECTION_AI_SCOPE_CURRENT.md; reportgiờ cócáckhoảng hiệu lực/gapnguồnđangdùng vàbáothiếuskin/stalehash. Đọc chỉmetadata, khôngtựscan/apply. Checkpoint260test/v33 ởtrên làlịchsử; hiện267suite/v37.
