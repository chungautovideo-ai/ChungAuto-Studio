# Creative v26 — Ổn định vùng người và da

## Phân tích UX và lựa chọn

Nhu cầu dựng review xe: nâng sáng người/da mà hạn chế tác động lên xe, nội thất và nền; người dùng phải kiểm vùng nhận diện và tắt hiệu ứng riêng. Bộ lọc→Làm đẹp đã có quét, xem mask, thu viền; dùng lại Nâng cao và slider/component hiện có, không thêm điều hướng. Đối chiếu ảnh CapCut do người dùng cung cấp và bằng chứng REA cũ; không tuyên bố đã khảo sát engine hoặc chất lượng CapCut. Thiết kế bổ sung một thanh 0–100, mặc định0 và mô tả giới hạn ngay cạnh.

## Hành vi đã triển khai

camera.beauty.maskStability lưu0–100; build và live chuẩn hóa0–1. Tại đúng nguồn và source clock, mỗi pixel foreground/skin hiện tại được giảm tác động theo độ bất đồng của hai mẫu liền kề. Mức100 giảm tối đa50% tác động nếu cả hai không nhận diện; vùng nền hiện tại không được mở rộng. Biên đầu/cuối dùng mẫu hiện tại cho phía không tồn tại. Mẫu hiện tại thiếu vẫn bỏ qua chỉnh. Không state tích lũy: tua/cắt/đổi nguồn không kéo mask nguồn cũ sang. Đây là consensus attenuation, chưa opticalflow/bù chuyển động; có thể chỉnh thiếu tay/tóc nhanh. Mặc định0 giữ kết quả cũ.

Cùng renderer beauty.js cho preview và HTML snapshot xuất, cache tính cả giá trị và tham chiếu mask. UI có snapshot/Undo, Save/mở lại. Thu viền độc lập, maskview chỉ preview, beauty off thắng mọi lựa chọn. Không tự thay dự án người dùng. Mẫu Creative v26 kế thừa đủ11preset v25, thêm hướng dẫn dùng ổn định tùy chọn; v25 giữ nguyên.

## Kiểm và triển khai

- PERSON_MASK_STABILITY_WEBGL_SMOKE.json: WebGL thật với mask tổng hợp, bất đồng giảm tác động, interior ổn định giữ nguyên, nền không lan, tua xác định, tắt khôi phục. Harness còn kiểm nguồn/clock/rate/B-roll/thu viền cũ.
- PERSON_MASK_STABILITY_UI_BROWSER_SMOKE.json: quét MediaPipe thật2nguồn crop Q2 một giây ở30fps; chỉnh60 lưu/mở lại60, HTML có0.6; Undo thu viền và maskview không mutation qua. Ảnh1280/390 từ trình duyệt. Chưa benchmark chuyển động dài hoặc nhiều người.
- Final QA contentos-smoke-stability: 1s/30frame1080×1920, silent, exit0/oktrue, launcher installed-cli, snapshot ac69731f-ad5a-4e71-b20e-86560cfa5d15; ảnh PERSON_MASK_STABILITY_FINAL.png đã xem. Không suy thành nghiệm thu toàn video/audio.
- Unit248/248 tại workspace/logs/person-mask-stability-suite.log. Skill quick_validate qua,11preset giữ nguyên. Server5180 khởi động lại sau dispatcher0/0, render/ASRidle và PID/command đúng; thư viện cóv26. Cần tải lại trang đang mở.

Còn tiếp: bù chuyển động/chất lượng temporal trên cảnh dài, cọ sửa, từng người, phát hiện biển/cut recovery và nghiệm thu workflow tự động trọn video. Goal ngành xe chưa hoàn tất.
