# Gợi ý chỉnh màu chỉ sau chuẩn hóa HDR

## Phân tích trước sửa

Người dựng muốn app chuẩn hóa HDR/Log đúng rồi mới chỉnh sáng/cân trắng/LUT phong cách. Code color-normalization đã có chuyển HLG/PQ và yêu cầu LUT Log, nhưng analyzeShotColor vẫn trích RGB trực tiếp từ nguồn HDR và chạy histogram SDR. UI contentos-shot-color.js gọi service và hiển thị lỗi qua status hiện có. CLI/API cũng dùng cùng service. Kết quả gợi ý từ RGB chưa tone-map có thể sai dù tool chưa tự ghi project.

Giữ dialog/token/đường lỗi sẵn có, không thêm menu. Tham khảo luồng hiện hành trong COLOR_NORMALIZATION_CURRENT.md và VEK editor: Inspector → Chuẩn hóa màu nguồn → xem → thay nguồn/Lưu → gợi ý chỉnh màu. Chặn nguồn có transfer HLG/PQ ngay sau probe, trước trích ảnh. Không đoán Log từ model/10bit. Nguồn không đủ metadata vẫn phân tích nhưng phải kèm cảnh báo chọn đúng profile/chuẩn hóa trước nếu là HDR/Log; không tuyên bố nhận diện Log. Không đổi dữ liệu, render hoặc tự tạo bản chuẩn hóa khi phân tích. Hủy/revision/source guards giữ nguyên.

Nghiệm thu: file HDR tổng hợp thật bị từ chối, sau normalizeColor sang709 được phân tích; file nguồn không đổi. SDR và cảnh báo metadata chưa đủ được kiểm; unit toàn suite. Chưa nghiệm thu footage iPhone/Log thật hoặc browser mới. Backend chỉ triển khai sau xác minh server idle theo AGENTS.

## Kết quả

analyzeShotColor kiểm transfer arib-std-b67/smpte2084 ngay sau probe và báo chuẩn hóa709 trước; kể cả metadata primaries/range chưa đủ để tự chuyển cũng không chạy histogramSDR trên transferHDR đã biết. Báo cáo được phép phân tích thêm inputColor/warnings từ detectInputColor, giữ mẫu3frame và dữ liệu nguồn. UI/CLI/API dùng chung service, không tự chuyển màu hoặc sửa project.

tests/shot-color-input.test.mjs tạo hai file0.5s160×96 HLG/PQ bằng FFmpeg, yêu cầu reject trước normalize, normalizeColor CPU rồi applyColorNormalization và phân tích3frame; byte nguồn và project đầu vào giữ nguyên. Fixture cần x264-params để FFprobe thực sự đọc được transfer; phiên fixture ban đầu chỉ cờ muxer không giữ tag nên đã sửa, không dùng nó làm bằng chứng HDR. tests/shot-color.test.mjs kiểm thêm inputColorunknown/cảnh báo khi thiếu metadata; các kiểm cancellation/revision và worker API cũ vẫn qua. Suite347/347, log workspace/logs/shot-color-input-suite.log.

Main5180 đã restart đúngPID17508→1948 sau dispatcher0/0, render/ASR/personTrackingidle và không mediaworker phù hợp; pingContentOSready. SHOT_COLOR_INPUT_DEPLOY_SMOKE.json giữ bằng chứng triển khai, không phải test endpointphân tích mới. Skillv50 references/color.md và ZIP chungauto-creative-v50-hdr-analysis.zip đã cập nhật/parse11preset5refs. Không thay snapshotjob cũ, không gọi provider trả phí. Chưa browser mới, footagecameraHDR/Log thật, đánh giá màu theo màn chuẩn hoặc finalrender mới. Log gắn tag709 vẫn cần profilequay thật; phân tích thành công không chứng minh đã nhận mọi hệ màu.

## Bổ sung kiểm HTTP hai nguồn

tests/shot-color-input-http-smoke.mjs chạy serverQA riêng5192 với project tổng hợp HLG+PQ0.5giây/nguồn, cùng workspaceID hiện hành nhưng không đổi store/workspace hoặc project đang mở trên5180. Qua endpoint info→shot-colorreject→normalizeCPU→PUTproject→shot-colorRec709/3frame→stale409 cho từng nguồn. Trước Apply fileproject giữ nguyên, sau restore bằng helper và PUT/GET lấy lại nguồn cũ; SHA hai nguồn và byte workspace store giữ nguyên. ServerQA54084 đã kết thúc, port5192 không còn listener. Kết quả tại SHOT_COLOR_INPUT_HTTP_SMOKE.json, fixture thành công contentos-qa-hdr-analysis-deb03d13-f861-4c83-9e7f-e77eda83294e.

Fixture HTTP đầu thiếu mediaInfo của nguồn thứ hai nên build từ chối đúng với “Khoảng cắt vượt file nguồn”; harness đã probe từng nguồn để điền metadata trước chạy, không sửa guard production. Không dùng lần lỗi đó làm bằng chứng chuyển màu thành công. Kiểm HTTP không là browser/Undo/focus, cameraHDRLog thật hoặc render cuối; không xuất, không gọi model và không mua API.
