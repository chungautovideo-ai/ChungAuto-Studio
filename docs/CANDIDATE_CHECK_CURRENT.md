# Kiểm candidate gọn cho phiên CLI/session · 05/11/2026

Bằng chứng lượt Codex Q2 ASR mới: worker đọc renderer và tự viết bộ đếm/preview, lỗi hardlink EPERM và Chrome không khởi động trong sandbox. Không đổi sandbox hoặc coi thiếu preview là đã xem. Bổ sung helper kiểm cấu trúc để AI không tự viết lại phần kiểm timeline/đồ họa; đây chưa phải công cụ preview thay browser.

node editor/tools/kiem-ban-dung.mjs <việc> --claim ID dùng candidateReview, claim/revision và resolveTimeline/kiemDoHoa hiện có. Hỗ trợ first-build và revise. Không ghi project/candidate/job/assets, không build HTML, không copy media, không mở browser/render/đăng. Kết quả gọn gồm revision, thời lượng, số đoạn/chữ/khối/Broll/caption, lỗi/cảnh báo, visualReviewed:false/audioListened:false. Job/claim/candidatepath sai hoặc revision đổi bị từ chối; lỗi đồ họa mã1. Missing media không được xác minh bởi lệnh này.

Inbox cả hai loại việc và skill v50 chỉ tới helper, giữ việc xem/nghe và khai báo phạm vi chưa kiểm. Không có UI mới; editor preview/duyệt giữ nguyên. CLI đọc code mới lúc chạy; job cũ giữ snapshot mẫu, không sửa mẫu đã chốt. Gói mới chungauto-creative-v50-candidate-check.zip giữ11preset/5refs, snapshot/ZIP qua CANDIDATE_CHECK_SKILL_SMOKE.json.

Unit giữ bytes, sai claim/revision/candidate/cancel, first-build và revise. HTTP QA synthetic0.6s thực tạo việc/claim→childCLI→completion review, lỗi minhHoa/wrongclaim/terminal đều chặn: SESSION_CANDIDATE_CHECK_HTTP_SMOKE.json. Suite310/310 workspace/logs/session-candidate-check-suite.log. Chưa model thật dùng helper mới hoặc benchmark token/thời gian; không nhận kiểm cấu trúc là chứng minh chất lượng dựng.
