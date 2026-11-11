# Nhận giọng đúng ngôn ngữ khi dựng ngành xe · 05/11/2026

Rà code thấy API first-build đã kiểm transcript.language khi reuse, nhưng CLI --check-transcript chỉ kiểm source clock. Bổ sung --lang vi|en|auto vào kiểm read-only; khác hoặc thiếu language với vi/en trả mã3 cần nhận lại. Không --lang giữ tương thích; auto chấp nhận ngôn ngữ đã lưu. Ngôn ngữ không hợp lệ trả mã2 trước nhận giọng. Không sửa transcript khi kiểm.

Inbox truyền ngôn ngữ đã chốt vào lệnh check. Skill v50 nhắc đúng ngôn ngữ và kiểm tên xe/mã sản phẩm/thông số chưa rõ, không lấy lời dự án khác. Không thêm bước biểu mẫu hay màn hình; dùng lại lựa chọn ngôn ngữ đang có. Gói chungauto-creative-v50-transcript-language.zip giữ11preset/5refs.

Kiểm6/6 theo phạm vi CLI/first-build/transcription và suite309/309 (workspace/logs/transcript-language-suite.log). Case vi/en/auto/thiếu language/invalid dùng nguồn không tồn tại để xác minh check không gọi nhận giọng; transcript bytes giữ nguyên.

Lượt model thật mới: workspace/content/2026-11-05/contentos-qa-real-codex-q2, không transcript nhập trước, nguồn QA local111.545s. Whisper thật đã tạo423từ tiếng Việt; Q2_FRESH_VI_ASR_OBSERVATION.json. Có lỗi tên riêng Trung Auto/ChungAuto và vài cụm cần nghe/đối chiếu; chưa đo WER, chưa có ground truth. Worker done/awaiting-review sau khoảng455giây; REAL_WORKER_Q2_V50_FRESH_ASR.json. Bản dựng106.23s,13chữ/4khối/105dòng phụ đề, nhạc ambient-pad và duck/SFX. Broll0:4fileQA chỉ0.517–1.335s nên worker bỏ; không nghiệm thu chọn cảnh trám từ lần này. Chrome sandbox chưa chạy được, chưa xem/nghe toàn preview, không render/đăng. Job dùng snapshot trước bản bổ sung kiểm ngôn ngữ/helper, nên không coi nó là kiểm model dùng hai thay đổi mới.
