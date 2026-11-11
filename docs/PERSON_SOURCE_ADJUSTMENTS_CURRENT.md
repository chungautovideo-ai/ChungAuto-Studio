# Sáng người/da theo từng nguồn — phân tích trước triển khai

Nhu cầu: một cảnh tối cần nâng sáng nhưng cảnh đủ sáng và B-roll sản phẩm không cần cùng mức. Hiện UI có ba thanh người/da chung camera.beauty; renderer có canvas và clock từng nguồn nhưng vẫn lấy ba mức chung. Đây là khoảng trống so với yêu cầu chỉ sửa file tối.

Giữ Bộ lọc → Làm đẹp và nhóm Người & da toàn thân. Thêm chọn phạm vi “Mức chung” hoặc tên nguồn đã có mask, giữ đúng ba thanh đang có; không nhân tab. Chọn nguồn chỉ đổi phạm vi UI, không đổi preview/timeline hoặc tạo hiệu chỉnh. Lần kéo thanh mới lưu đủ ba mức riêng; nút Dùng mức chung bỏ override nguồn. Nhãn giải thích mức chung là mặc định, nguồn riêng thắng mức chung. Da/Môi/Mắt và viền/cọ vẫn chung. Tham khảo mô hình chỉnh theo clip trong trình dựng; không tuyên bố đã quan sát thêm CapCut.

Dữ liệu sourceAdjustments là danh sách src/SHA256/ba mức0–100; nguồn đã đổi hash không áp bản cũ. Các đoạn cùng file dùng chung mức, chưa chỉnh theo đoạn hoặc theo từng người. Không tự đo tối hay tự bật làm đẹp. Preview và snapshot xuất dùng cùng resolver, A/B-roll có clock riêng; UI dùng token/field/range/Undo/Save đang có. Dropdown dài đầy chiều rộng panel, không đặt ba thanh thành nhiều cột trên mobile. Cần kiểm renderer đổi nguồn/nguồn hash sai/override0/khôi phục chung, Save/Undo/reopen và responsive thực trước nghiệm thu UI.

## Đã triển khai và kiểm

camera.beauty.sourceAdjustments được chuẩn hóa giới hạn40nguồn, cấm trùng src, đủ3mức hữu hạn0–100 và SHA256 hợp lệ. Resolver dùng src/hash nguồn đang render; mức riêng0 thắng mức chung. Không khớp hash dùng mức chung. Live preview và HTML snapshot chứa cùng resolver. Các hiệu ứng mặt và mức viền/ổn định/cọ vẫn theo cấu hình chung. Tắt làm đẹp xóa override; Dùng mức chung bỏ riêng nguồn đang chọn. API /api/face chỉ bổ sung metadata src/hash các nguồn có mask, không gửi toàn bộ tracks lên panel.

Unit resolver/validation qua; WebGL thực với mask tổng hợp kiểm override0, mức30 trên thang100, hash cũ fallback và bỏ override. PERSON_SOURCE_ADJUSTMENTS_WEBGL_SMOKE.json ghi pixel trước157/104/80, mức riêng30 cho171/119/94, chung50 cho176/126/100. Harness cũng chạy lại clock A/B-roll, cọ/viền/ổn định có sẵn; không phải chất lượng người thật toàn video.

Browser thật MediaPipe trên hai crop Q2/flip1giây30fps: chung15/riêng35→45, đổi chọn không mutation, Undo/Redo, Save/mở lại và bỏ override giữ chung15 đều qua; pageErrors0. PERSON_SOURCE_ADJUSTMENTS_UI_SMOKE.json và ảnh1280/390 đã xem. Panel dùng scroll hiện có; ảnh không chứng nhận toàn shell mobile hoàn chỉnh.

QA contentos-smoke-source-adjustments-3 đổi riêng B-roll45/chung0 rồi build và xuất final bằng installed CLI: exit0,1080×1920/30fps,1giây im lặng. work/render.json và workspace/logs/person-source-adjustments-final.log là bằng chứng; PERSON_SOURCE_ADJUSTMENTS_FINAL.png đã xem. Chưa so sánh pixel hai bản xuất hoặc nghe/fullvideo; không coi ảnh này chứng minh nền tuyệt đối không đổi ở mask nhận sai.

Suite256/256 ở workspace/logs/person-source-adjustments-suite.log. Server5180 đã restart sau kiểm dispatcher0/0, render/ASRidle và đúngPID; moduleHTTP200. Skill Creativev31 giữ11preset v30, quick_validate qua/catalog5180 có. Không sửa dự án gốc hoặc cài model mới; chưa tự nhận diện file tối/từng người/tracking mask.
