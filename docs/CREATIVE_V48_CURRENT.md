# Creative v48 — hợp nhất quy tắc theo tác vụ · 05/11/2026

Rà v47 thấy references/person.md có14.831byte chứa lịch sử nối thêm: dòng nói chưa chọn cá thể/tự đo tối/đo riêng mâu thuẫn với các mục SAM2/API/CLI sau đó; SKILL.md lặp lại cả workflow đo riêng ở cuối. Theo skill-creator, giữ routing ở entry và quy tắc theo tác vụ trong reference, không nạp cả lịch sử để dựng.

V48 parent47 giữ nguyên11preset/4references và tài nguyên preview. SKILL.md từ8.556 xuống7.150byte; person.md từ14.831 xuống7.104byte, cấu trúc phạm vi→quét/chọn→sửa sâu→đọc/đo→worker. Loại checkpoint/đoạn lặp/mô tả lỗi thời; giữ beautyoff/keep, src/hash/sourceclock, ngoàirange tắt/khôngfallback, giới hạn, mask/cọ/stability, report/measure/apply độc lập, claim/candidate/revision và không tựrender/đăng. Finishing từ2.642 lên3.320byte để giải thích số đo audioLoudness sauAAC, listenedfalse, cảnh báo/noaudio/silent/đo lỗi; không nhận mix đạt hoặc tự xuất lại khi số đo đạt.

Dung lượng ba file gộp giảm từ26.029 xuống17.574byte (khoảng32,5%). Đây byte UTF8, không phải token thực hay benchmark tốc độ. ZIP1.625.222byte chủ yếu preview, không dùng để suy token. Không thay snapshot các job cũ; job mới chọn v48 mới nhận quy tắc mới. Không sửa VEK/Factory/NAS/media gốc.

quick_validate, đóng ZIP và mainHTTPtemplate48/11preset/4refs qua. tests template-snapshots/template-references3/3 qua (pin/hash/tamper/read riêng), snapshot v48 thật đọc lại version48/11presets. CREATIVE_V48_CONSOLIDATION_SMOKE.json/CREATIVE_V48_HTTP_SMOKE.json/CREATIVE_V48_SNAPSHOT_SMOKE.json; package workspace/exports/chungauto-creative-v48.zip. Không chạy model do Codexsandbox vẫn lỗi trướcmodel; không nhận v48 đã dựng tự động end-to-end hoặc chất lượng final mới. Không đổi renderer nên khôngrender lại, template/static không cầnrestart.
