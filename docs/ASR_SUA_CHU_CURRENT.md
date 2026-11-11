# Sửa chữ sau nhận giọng (chống "ngọng" phụ đề/chữ nhấn) — hiện hành 2026-11-06

## Gốc lỗi

Phụ đề và chữ nhấn lấy từ `work/transcript.json` do Whisper local (ggml-large-v3-turbo-q5_0) tạo. Không có gợi từ vựng nên Whisper viết sai tên riêng/từ ngành xe và bịa câu khi im lặng. TTS (ElevenLabs/Vbee) là API trả phí, không nằm trong luồng dựng tự động nên không phải nguồn lỗi.

Bằng chứng (chỉ đọc transcript có sẵn, không sửa dự án):
- `2026-11-04/nas-95875b99…`: "liên hệ ở Trung Auto", "Thảo là trống thơn", "màu hơ mẹ".
- `2026-11-04/nas-327b46c5…`: toàn bộ transcript là câu bịa "Hãy subscribe cho kênh Ghiền Mì Gõ…".

## Sửa

- `config/tu-dien-asr.json`: `goiY` (câu gợi cho `whisper --prompt`), `sua` ([regex, thay bằng], khớp trọn từ, không phân biệt hoa thường), `boCau` (câu bịa cần xoá). Người dùng sửa được; JSON/regex hỏng báo lỗi trước khi chạy Whisper.
- `editor/lib/sua-chu-asr.mjs`: `docTuDien`, `promptArgs`, `suaChu`. Giữ mốc từng từ; gộp/tách từ thì chia thời gian trong khoảng gốc. Chỗ sửa ghi vào `transcript.json.textFixes`.
- `editor/lib/whisper.mjs`: áp dụng cho mọi lần nhận giọng tiếng Việt; `vocabulary:false` cho `phan-tich-kenh.mjs` (kênh người khác).
- Skill `contentos-edit-standards` → `references/chuan-cong-khai-va-chinh-ta.md` mục 4: worker soát từ vô nghĩa, không đưa từ nghi ngờ lên chữ nhấn, ghi trong tóm tắt.

## Kiểm

- `tests/sua-chu-asr.test.mjs` (5 test): sửa + giữ mốc + dấu câu, gộp từ, không sửa "trong ô tô"/"dùng chung ô tô", xoá câu bịa, regex hỏng.
- Whisper thật trên **bản sao âm thanh** trong thư mục tạm (không ghi vào dự án): 60 s đầu `contentos-qa-real-codex-q2/inputs/raw.mp4` và tiếng của `nas-95875b99`.
  - QA: bản cũ 7 lần "Trung Auto"; bản mới 0 (6 chỗ sửa trong `textFixes`), có dấu câu, "ba mảng". Gợi từ một mình không sửa được "Trung Auto". "size shot" (đúng: sai sót) vẫn do Whisper ra → đã thêm quy tắc.
  - NAS: "Trung Auto" → "Chung Auto"; gợi từ sửa "chân em à" → "trần anh em" nhưng tạo lỗi mới "đổi hit", "trong auto" (đã thêm quy tắc "trong Auto"). "trống thơn", "hơ mẹ", "bọc độ rán" vẫn sai: từ điển không sửa an toàn được, worker soát theo skill.
- Giới hạn: chỉ 2 clip ~60 s; chưa đo tỉ lệ lỗi từ trên bộ lớn; chưa thử model không lượng tử (large-v3) hay VAD của whisper.cpp (cần tải thêm model). Transcript cũ không tự sửa — nhận giọng lại để áp dụng.
