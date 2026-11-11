Hiện hành: [v15 ưu tiên Làm đẹp theo mask và gỡ control sắc da khỏi chuẩn hóa](COLOR_PLATE_CHAIN_CURRENT.md). Nội dung dưới là lịch sửv14, service/API giữ tương thích.

# Nâng sáng sắc da · Creative v14 · 04/11/2026

Tiếp nối [chuẩn hóa màu/LUT/chống rung](COLOR_NORMALIZATION_CURRENT.md), đã thêm nâng sáng sắc da tùy chọn vào dialog **Chuẩn hóa màu nguồn** trong inspector A-roll/B-roll. Không thêm sidebar/tab. Nhóm gập, số0–30%, mặc định0tắt. CPU tạo LUT33 mềm theo YCbCr sau chuẩn hóa→LUTlook; ưu tiên shadow/midtone, giữ vùng gần trắng và tỷ lệ RGB. NVENC mã hóa media dẫn xuất nếu có. Hành động Tạo/Xem/Thay/Lưu, Undo/khôi phục nguồn dùng chung. Nút hành động sticky tiếp cận được trên mobile. Đổi control hoặc nhập LUT làm hết hiệu lực bản chờ áp cũ.

Đây là chọn sắc màu gần da, không face/person segmentation, không làm mịn hoặc thay sắc da; ghế/nội thất/sơn gần màu da có thể bị ảnh hưởng. Bắt đầu8–15%, xem toàn đoạn; không tự bật theo yêu cầu làm màu chung. Thiếu profile Log vẫn phải chọn đúng profile/LUT trước, không dùng skinLift để giả chuẩn hóa. SDR đã709 có thể xử lý khi chỉ bật skinLift. Các giới hạn phối hợp plate/matte/clean/freeze/dissolve của v13 giữ nguyên.

App đã có Bộ lọc→Làm đẹp dùng work/face.json/WebGL cho các thao tác mặt; không thay thế hoặc tuyên bố đã xác minh lại toàn module đó. Tùy chọn mới xử lý màu nguồn cho A/B-roll, provenance lưu amount/algorithm/hashLUT và bản gốc. API normalize_source_color nhận skinLift0–0.30; chỉ thay candidate. Skillv14 parentv13 giữ9preset và mẫu cũ; hướng dẫn mức nhẹ, cảnh báo màu nội thất và không tự bật. Preview/poster vẫn excerpt reference, không phải video mới dựng bằng skillv14.

Phân tích UX trước code tại AUTOMOTIVE_EDIT_IMPLEMENTATION_2026-11-04.md, mục Nâng sáng sắc da. Tham khảo source ComputeSkinWeight của app Quan ly file, chưa chạy giao diện app đó. Điều khiển dùng token và disclosure hiện hành.

Bằng chứng:

- tests/skin-lift.test.mjs: RGB hue/neutral/blue/highlight/strength, actualFFmpeg với3ô màu, audio/source/restore; ô gần da tăng≥15mức RGB, đối chứng lệch≤3mức.
- tests/color-normalization.test.mjs: API tool-loop gateway tổng hợp truyền skinLift. Không model trả phí/đăng bài.
- workspace/logs/skin-lift-suite.log:228/228PASS. Sau bổ sung assertion tool-loop,4test liên quan và2test render qua.
- SKIN_LIFT_BROWSER_SMOKE.json: endpoint thực1280/1920/390, mặc địnhtắt/giới hạn31bị từ chối/đổi mức vô hiệu bản cũ/preview/Save/Undo/reopen/NVENC; ảnh SKIN_LIFT_UI_*.png đã xem.
- SKIN_LIFT_Q2_SMOKE.json: đoạn12–14s từ DJI_0061_D.MP4 thực, proxy540×960, mức15%, source size/mtime giữ nguyên. Ảnh SKIN_LIFT_Q2_COMPARE.png trái trước/phải sau đã xem; mặt/tay sáng nhẹ, áo trắng và nền xanh thay đổi ít. Heuristic có thể đổi vật gần sắc da; chưa nghiệm thu thẩm mỹ bởi người dùng, chưa benchmark toàn video10bit gốc.
- SKIN_LIFT_FINAL_SMOKE.json: HyperFrames final1080×1920/30fps/2s/audioAAC, artifact hash và kích thước/thời lượng đã kiểm, ảnh final đã xem. Lượt đầu engine ghi artifact nhưng process chưa báo thành công; đã thêm exitCode/exitSignal vào render status và lượt retry exit0/finalize qua. Không coi file lượt đầu là bản xuất đã đạt.
- Triển khai main5180 và catalogv14: xem SKIN_LIFT_DEPLOY_SMOKE.json.

Chưa hoàn tất goal ngành xe: phối hợp plate với màu, detector nhiều biển/cut recovery, benchmark dựng đủ B-roll/motion/nhạc/SFX từ nguồn Q2 thực và bộ cài độc lập. Chưa chứng minh năng suất50–100video/ngày hay toàn composition mã hóa GPU. Ước lượng55–60% lõi ngành xe vẫn là đánh giá kỹ thuật, không suy từ test.
