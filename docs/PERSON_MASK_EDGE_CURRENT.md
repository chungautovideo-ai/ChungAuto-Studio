# Thu viền mặt nạ người/da — Creative v21, 05/11/2026

Đã triển khai camera.beauty.maskShrink0–100, chuẩn hóa0–1 trong build/livepreview; shader lấy min8hướng quanh pixel mask bán kính0–3pixel. Giữ0 không đổi bản cũ, không thêm vào danh sách kích hoạt beauty. Cùng vùng sau thu dùng cả maskview và ba hiệu chỉnh toàn thân. Đây spatial shrink, chưa temporal/cọ/chọn người. Bộ lọc→Làm đẹp có details nâng cao, không thêm sidebar.

Kiểm actualWebGL tổng hợp tại PERSON_MASK_EDGE_WEBGL_SMOKE.json: pixel mép trở về gốc, tâm giữ sáng, nền không đổi, reset0 phục hồi. Regression sourceclock/A-roll/B-roll giữ qua. BrowserUI endpoints thực trên QA5199 quét MediaPipe2nguồn Q2crop1s, lưu35/mở lại35, bodyWhite25, maskpreview không sửa project; ảnh1280/390 và PERSON_MASK_EDGE_BROWSER_SMOKE.json. Harness có assertion reopen35, evidenceJSON chưa có trường riêng nên đối chiếu tests/person-mask-edge-ui-browser-smoke.mjs. Suite244/244 tại workspace/logs/person-mask-edge-suite.log.

Final QA riêng workspace/content/2026-11-04/contentos-smoke-maskedge/renders/contentos-smoke-maskedge-final.mp4: exit0,1s1080×1920/30fps, im lặng; PERSON_MASK_EDGE_FINAL.png đã xem, A-roll và B-rollpip giữ bố cục. Không có đối chiếu aesthetic trước/sau mọi frame hoặc benchmark rung toànvideo. Skillv21 parentv20 giữ11preset, quick_validate qua; main5180restart sau idle0/0/locksnull/khôngRemotionworker/PIDđúng, endpointtemplatev21 trả200. Không thay dự án thật.

## Phân tích UX trước code

Nhu cầu: giảm viền sáng lem từ mặt nạ semantic sang nội thất/sơn/nền. Hiện Bộ lọc→Làm đẹp đã có xem vùng và ba thanh người/da, nhưng không chỉnh được vùng. Giữ vị trí này, thêm details nâng cao Thu viền vùng người/da, mặc định0 giữ bản dựng cũ. Thanh0–100 tương ứng thu0–3pixel tại độ phân giải mask, áp dụng cùng lên người và da; không phóng vùng, không sửa face-landmark/biến dạng mặt. Xem mask phải phản ánh vùng sau thu. Không tự quét hay tự bật làm đẹp khi chỉnh thanh. Undo/Save/reopen theo camera.beauty đang có.

Tham khảo nguyên lý mask choke/erode trong compositing; không tuyên bố đã quan sát control tương đương trên CapCut. Không thêm sidebar/cọ giả hay tuyên bố temporal smoothing. Thu viền có thể mất ngón tay/vùng nhỏ; giữ0 nếu không cần, kiểm mặt/cổ/tay/chuyển động trước xuất. Cần WebGL thực kiểm edge/interior/background và reset0, cùng browser save/reopen và final. Chưa nghiệm thu ở thời điểm ghi bản UX này.
