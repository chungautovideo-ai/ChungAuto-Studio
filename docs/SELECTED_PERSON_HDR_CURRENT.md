# Đo sáng riêng người — kiểm hệ màu nguồn

Khoảng trống đã xác minh: analyzeShotColor từ chối HLG/PQ chưa chuẩn hóa nhưng measureSelectedPersonExposure vẫn đọc RGBA trực tiếp và dùng ngưỡng luma SDR. Bổ sung probeMediaMetadata trước decode/gợi ý; metadata transfer arib-std-b67/smpte2084 trả422/COLOR_NORMALIZATION_REQUIRED, hướng dẫn chọn đoạn→Chuẩn hóa màu nguồn→xem/thay→quét/chọn lại người. Không tự đổi source/mask hoặc bỏ metadata. Dùng chung service cho editor, API worker và CLI/session; không đổi renderer/schema/UI mới.

Kết quả SDR bổ sung inputColor từ detectInputColor. Metadata unknown hoặc tag709 không loại trừ Log thực tế; không suy Log từ hãng/10bit. Đây guard trước đo, chưa chặn mọi thanh làm đẹp hoặc mọi số đo semantic đã lưu trước đó. Tên trường limits mô tả rõ không xác nhận tông da/danh tính/chuẩn hóa.

Kiểm12/12 liên quan qua: selected exposure, exposure summary, source scopes, shot color HDR, snapshot/references. selected-person-hdr.test.mjs tạo media tổng hợp và dùng FFprobe/FFmpeg thật: HLG/PQ từ chối, SDR đo4mẫu, project/mask/media giữ nguyên. Fixture đầu chỉ dùng color_trc/color_primaries không ghi đủ tag trên libx264 đang cài; đã chuyển sang x264-params và30fps để đủ frame cuối. Không sửa product để vượt fixture, không dùng media tổng hợp chứng minh chất lượng camera.

selected-person-hdr-http-smoke.mjs tạo QA riêng, port5192 preflight, workspace không đổi, serverQA dừng sau các request terminal. SELECTED_PERSON_HDR_HTTP_SMOKE.json: hai HDR422/code đúng và SDR200/profile709; bytes project/mask/source giữ. Không browser/paidAPI/render hoặc mask người thật.

Skill Creativev50 person.md thêm cách xử lý lỗi và quét/chọn lại theo hash; ZIP person-hdr parse11preset/5refs, snapshot/job/ZIP cũ giữ nguyên. SELECTED_PERSON_HDR_SKILL_SMOKE.json. Main5180 nạp lại sau xác minh dispatcher0/0, render/ASR/trackingidle, khôngmediaworker và PID62048 đúngcommand; ping/dispatcher sau nạp qua. Chưa kiểm native dialog/focus hoặc footage iPhone/Log thực. Không nhận hoàn tất chuẩn hóa da toànworkflow từ guard này.
