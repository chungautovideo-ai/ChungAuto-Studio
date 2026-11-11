# Quét người/da chi tiết — phân tích trước triển khai

Công việc: người dựng cần giữ vùng da cổ/tay ổn hơn khi chủ thể hoặc camera chuyển động; vẫn dùng Bộ lọc → Làm đẹp, không thêm sidebar. Bằng chứng giao diện hiện hành: PERSON_SKIN_MASK_PREVIEW.png và PERSON_MASK_EDGE_UI_1280/390.png; code scanFace cố định15fps, service đã nhận1–30fps và renderer dùng track.fps theo sourceclock. Đây phân tích code cùng ảnh QA hiện có, không khảo sát mới CapCut.

Chọn thêm selector Chất lượng quét: Nhanh15fps (mặc định) / Chi tiết30fps trước nút quét, khi đã có scan vẫn chỉnh được để quét lại. Lựa chọn thuộc tác vụ quét, không tự đổi project hoặc chạy lại khi chọn. Trong lúc quét khóa điều khiển bằng luồng busy hiện có, cho hủy; báo lỗi/ràng buộc rõ. Chế độ30 lấy mẫu thật gấp đôi, không nội suy hoặc temporal filter. Giữ18.000mẫu tối đa và4triệu số RLE/nguồn: khoảng20phút ở15 hoặc10phút ở30; có thể chạm giới hạn mask sớm hơn. Không suy ra chất lượng ngang CapCut hoặc luôn giảm rung. Hiển thị tần số các track đã lưu để người dựng phân biệt lựa chọn sắp quét và dữ liệu đang dùng.

Dùng field/select/help có sẵn, responsive theo panel. Kiểm endpoint+MediaPipe thật30fps, A-roll/B-roll, Save/Undo/reopen và final; ảnh1280/390. Skillv23 riêng giữv22 và11preset. Mặc định không bật beauty; không sửa dự án người dùng. Chưa cọ/chọnngười/motion-compensated smoothing.

## Kiểm chứng

PERSON_SCAN_QUALITY_BROWSER_SMOKE.json: MediaPipe thật hai nguồn Q2crop1s+flippedcopy,31mẫu/nguồn30fps, mặt31/31, bodymask tươngứng; không tự bật preset. ChỉnhbodyWhite25/maskShrink35 Save/reopen qua; xemmaskkhông mutation. API chỉ trả scanRates tổng hợp, không trả thêm mọi tọa độ/mask về UI. Ảnh1280/390 đã xem, selector trong panel/chungstyle. Tần số bảnquét đang dùng30fps được assertion sau reopen. Lựa chọn lần quét tiếp theo là trạng thái phiênUI, reset15sau reload; không hứa lưu preference.

PERSON_SCAN_QUALITY_CLOCK_SMOKE.json: WebGL thật, masks tổng hợp30fps tại1/40/70ms dùng3mẫu riêng, background/nguồn/rate2/B-roll regressionqua. Harness ban đầu giữrate2 nên40ms nhảy mẫu2; đã đặt rate1 đúng phần kiểm30fps, không sửa renderer để làm vừa test.

PERSON_SCAN_QUALITY_FINAL_SMOKE.json: finalQA1s1080×1920/30fpssilentexit0, ảnh PERSON_SCAN_QUALITY_FINAL.pngđãxem A+Bpip. Không đo cải thiện độrung thực/khôngngheâmthanh. Suite247/247 ở workspace/logs/person-scan-quality-suite.log; skillv23riêng parentv22giữ11preset/hash/quick_validatequaUTF8. Không sửa dự án người dùng hoặc bộskillgốc/NAS.

Main5180 đã restart sau idle0/0/locksnull/khôngRemotionworker/PIDđúng; templatev23/scanner/UI đã kiểm quaHTTP. Xem PERSON_SCAN_QUALITY_DEPLOY_SMOKE.json.
