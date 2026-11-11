# Creative v16 · Làm đẹp mặt theo nguồn A-roll

Đã nối dữ liệu quét mặt với từng nguồn A-roll đang giữ. Nút Quét mặt trong Bộ lọc→Làm đẹp quét lần lượt nguồn local/NAS đã nhập, dùng media nguồn hiện hành sau chuẩn hóa/chống rung. work/face.json v2 chứa src/fingerprintSHA256/kích thước/fps/landmark từng nguồn. PUT/GET yêu cầu project/revision/workspace; chuyển dự án/hủy/nguồn đổi không áp kết quả vào dự án khác. Nguồn thiếu/stale bị bỏ qua, dữ liệuv1 giữ file nhưng yêu cầu quét lại. Không tự bật mịn/môi/gọt mặt hay preset sau quét. Hủy quét có nút, timeout seek và cleanup video.

Renderer chọn landmark theo data-face-source của clip đang phát. Preview dùng currentTime, ảnh final dùng mediaStart+(timeline-start)*rate; mất sample không nội suy xuyên. Canvas chuyển theo parent và kiểu khung của video để đi cùng crop/fit/transform/color wrapper; không mượn face của nguồn khác. Màu/mặt nạ toàn thân/cổ/tay/B-roll beauty/nhiều người chưa được hỗ trợ. Matte giữ định danh nguồn gốc nhưng chưa nghiệm thu lại mọi tổ hợp matte/geometry. Đây chưa parity CapCut.

Nguồn được kiểm SHA256 khi nhận dữ liệu và build: không cache hash bằng mtime. Có thể tăng thời gian build với nhiều nguồn lớn; chưa benchmark độ trễ trên40nguồn hoặc NAS6máy. Giới hạn40nguồn, mỗi nguồn≤18000sample (xấp xỉ20phút ở15fps); chưa incremental theo đoạn dùng hoặc worker scan độc lập.

Phân tích UX trước code tại AUTOMOTIVE_EDIT_IMPLEMENTATION_2026-11-04.md mục Làm đẹp nhiều nguồn. Không thêm menu/tab; dùng nút/slider/help trạng thái sẵn có. Phần trăm là mẫu có face, không coverage toàn video. Tỷ lệ nhận diện thấp cần kiểm mặt nhỏ/che/nghiêng và điều kiện quay, không tự suy hiệu ứng đã phủ đủ.

Bằng chứng:

- tests/face-tracks.test.mjs: bind nguồn/hash, stale/legacy/foreign/schema/projectguard, build chỉ embed tracks khớp. workspace/logs/face-source-suite.log:230/230PASS.
- BEAUTY_SOURCE_CLOCK_SMOKE.json: WebGL thật với landmark tổng hợp2nguồn vị trí mặt khác nhau, speed2, mất sample/unscanned giữ ảnh, canvas chuyển wrapper. Không phải detector benchmark.
- FACE_SOURCE_BROWSER_SMOKE.json: endpoint/UI thật và MediaPipe local trên đoạnQ2 12–13s đã crop720×960 rồiscale360×480 + bản lật;16/16 và15/16sample có mặt, quét không bật preset, white20/Lưu/mở lại, khôngpageerror. Lượt dùng toàn khungscale360×640 trước đó không nhận đủ mọi nguồn: không tuyên bố đã sửa detector/đạt100% footage thật. Ảnh FACE_SOURCE_UI.png đã xem; kiểm tại1280, chưa kiểm lại mobile cho sửa này (layout slider cũ giữ).
- FACE_SOURCE_FINAL_SMOKE.json: final2s1080×1920/30fps/2nguồn realMediaPipe/white20, artifact kiểm và frameA/B đã xem. Đây proxy crop thực, chưa benchmark toàn nguồn/nhận diện người toàn thân, chưa đo thẩm mỹ/giữ màu nền bằng pixel trên footage này. Kiểm mask/nền đã có WebGL tổng hợp ởv15.
- Triển khai main5180 và catalogv16 xem FACE_SOURCE_DEPLOY_SMOKE.json. Skillv16 parentv15 giữ9preset/previewreference và bản cũ; hướng dẫn quét từng nguồn, không tự bật preset và kiểm final từng cảnh.

Chưa hoàn tất mục tiêu ngành xe: detector nhiều biển/cut recovery, person segmentation, benchmark dựng đầy đủ B-roll/motion/nhạc/SFX trên nguồn Q2, năng suất và bộ cài độc lập. Các giới hạn màu→plate/engine ở COLOR_PLATE_CHAIN_CURRENT.md còn áp dụng, trừ source/clock face đã được cập nhật trong phạm vi trên.
