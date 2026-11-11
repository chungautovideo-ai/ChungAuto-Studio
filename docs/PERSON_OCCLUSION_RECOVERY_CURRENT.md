# Kiểm dừng và chọn lại quanh vùng che · 05/11/2026

Mục tiêu là xác minh nhánh thất bại của guard mới bằng inference, sau đó có thể chọn lại khoảng sau vùng che. Dùng bản proxy QA6s đã có, không sửa nguồn/dự án gốc. Tạo hai bản dẫn xuất riêng: hình chữ nhật đen che giữa khung2,5–3,5s; vật che xám rộng300px di chuyển ngang2–4,5s. Đây là che khuất tổng hợp trên footage người thật, không cảnh hai người độc lập giao cắt.

Lượt che đột ngột bị shot guard từ chối tại2,500s trước inference. Lượt vật che di chuyển qua được shot guard, SAM2 CUDA chạy đến mẫu23 rồi guard diện tích dừng tại3,000s; cả hai exit1 và không ghi output. Log person-occlusion-inference.log/person-moving-occluder-inference.log. Giữ khóa person-tracking với PID tiến trình điều phối trong mỗi lần chạy, không có tác vụ tracker khác; không thay server/project.

Dùng helper lỗi UI tính rút khoảng còn2,875s. SAM2 CUDA chạy riêng 0–2,875s (23mẫu,2,016s inference) và4,5–6s (12mẫu,1,359s inference), điểm chọn lại theo khung4,5s đã xem. Hai kết quả cùng hash nguồn được merge giữ hai khoảng. Replay bằng applyPersonSelection kiểm9mốc: vùng có mask0/2,75/4,5/5,875s; ngoài khoảng2,875/3/3,5/4,499/6s không còn kênh semantic người/da. Không đo throughputproduction từ thời gian inference ngắn.

Bằng chứng: tests/person-occlusion-recovery-smoke.mjs, PERSON_OCCLUSION_RECOVERY_SMOKE.json và PERSON_OCCLUSION_RECOVERY_CONTACT.png. Ảnh5mốc đã xem: có người bị che một phần trước mốc lỗi, khoảng giữa không mask, người xuất hiện lại có mask. Đây là kiểm artifacts/hàm mask chung, chưa apply/UndoSave bằng UI hoặc xuất lại final trên fixture này. Những luồng trước có bằng chứng riêng, không gộp thành E2E mới. Không nhận có identity verification, tự phục hồi, xử lý mọi mức che hoặc tracking đa người độc lập.

Không đổi inference/renderer trong lượt này: guard và luồng chia khoảng hiện tại đã xử lý fixture đúng. Creativev47 đã hướng dẫn chia khoảng/chọn lại, giữ snapshot và ZIP hiện có; không tăng version chỉ vì thêm bằng chứng. Tiếp theo cần footage nhiều người thật, viền tóc/chuyển động nhanh và quy trình tự dựng end-to-end, không thể suy ngang CapCut từ kết quả này.
