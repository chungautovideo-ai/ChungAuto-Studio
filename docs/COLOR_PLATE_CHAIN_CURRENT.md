Bổ sung hiện hành: [v16 bind mặt theo từng nguồn và clock](FACE_SOURCE_CURRENT.md).

# Creative v15 · Màu/che biển và làm đẹp theo mặt nạ

## Chỉnh riêng nhân vật theo yêu cầu người dùng

Ảnh người dùng chỉ đúng mục Bộ lọc→Làm đẹp đã có. Kiểm source beauty.js phát hiện white dùng max(faceMask,chromaGlobal*.75), có thể làm sáng vật cùng màu ngoài mặt. Đã bỏ fallback toàn khung, chỉ dùng mask landmark khuôn mặt; mất mặt shader giữ ảnh gốc. Các slider đang có giữ nguyên. Help không còn hứa bám suốt video: phần trăm là mẫu scan tìm thấy mặt, không whole-person segmentation. Ảnh báo16% không chứng minh chất lượng nhận diện mọi khung.

Đã gỡ nhóm Nâng sáng sắc da mới thêm khỏi dialog chuẩn hóa để dùng Bộ lọc→Làm đẹp làm nơi chính. skinLift API/service giữ tương thích dữ liệuv14 nhưng skillv15 không khuyên dùng cho yêu cầu cô lập nhân vật. Chưa có mask cổ/tay/nhiều người, cache face/source clock của nhiều nguồn và source sau chống rung chưa được kiểm toàn diện; không nhận parity CapCut hoặc chắc chắn nền không đổi trên mọi video. Cần nghiệm thu detector và map theo nguồn trước bật AI hàng loạt.

BEAUTY_MASK_ISOLATION_SMOKE.json: Chrome WebGL thật, landmark ellipse tổng hợp và cùng màu da phủ khung; pixel vùng mặt157/104/80→174/126/102,2vùng ngoài mặt giữ157/104/80, mất mặt giữ ảnh gốc. Ảnh BEAUTY_MASK_ISOLATION.png đã xem. Đây kiểm renderer, không model detector thật hoặc final làm đẹp trên footage người thật.

## Chuẩn hóa rồi che biển

Đã cho A/B-roll chuẩn hóa/chống rung trước, chọn ROI trên chính bản màu rồi che biển. Helper UI/CLI/API dùng chung, provenance plate giữ originalColorNormalization; khôi phục che giữ bản màu và offsettrim, khôi phục màu mới về gốc. Clock transcript qua cả2tầng; tốc độ/timeline/audio giữ. Build kiểm hash/range cả media màu và che; mở rộng kiểm B-roll như A-roll. Gate duyệt vẫn gắn revision/hash bản che cuối. Đổi màu sau che phải khôi phục che và đánh dấu lại, không dùng ROI cũ sau biến đổi geometry. Matte/clean/freeze/dissolve A-roll vẫn chặn.

Bằng chứng: tests/color-plate-chain.test.mjs thựcFFmpeg/opticalflowA/B-roll/trim/speed/restore/clock/review/hash/range. COLOR_PLATE_CHAIN_BROWSER_SMOKE.json endpoint thực1280/1920/390 xác minh source/result/Lưu/Undo/reopen/restore về bản màu/duyệt; ảnh đã xem. COLOR_PLATE_CHAIN_FINAL_SMOKE.json: MP4final1080×1920/30fps/audio/0.5s từ test tổng hợp biển di chuyển, speed2, chuẩn hóa→che; không detector tự động hoặc benchmark biển Q2 thật. Suite229/229PASS workspace/logs/color-plate-chain-suite.log. Không provider trả phí/đăng bài.

Skillchungauto-factory-quang-cao-v15 parentv14 giữ9preset/bản cũ, quick_validate qua; hướng dẫn ưu tiên mask mặt, đúng thứ tự màu/che và không dùng LUT sắc da cho yêu cầu cô lập người. Preview/poster giữ excerpt reference, chưa chứng minh video tự dựng bằng skillv15.

Triển khai main5180 xem COLOR_PLATE_CHAIN_DEPLOY_SMOKE.json. Phân tích UX trong AUTOMOTIVE_EDIT_IMPLEMENTATION_2026-11-04.md. Còn detector/nhiều biển/cut recovery, benchmark đủ cảnh trám/motion/audio từ footage thật, nguồn/clock face nhiều clip và bộ cài độc lập; goal ngành xe vẫn active.
