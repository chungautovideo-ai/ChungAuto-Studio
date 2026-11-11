# Tìm nhanh ý lời để đặt cảnh trám

## Bài toán và phạm vi

QA Q2 có màn hình dưới lời chung, bỏ lỡ đoạn gọi tên màn. Timing window đã có mốc từng từ nhưng AI phải đọc nhiều cửa sổ để tìm ý. Bổ sung tra cụm nguyên văn trong caption candidate, dùng lại claim/revision/renderer clock; không tự gán sản phẩm theo từ khóa, không thêm menu hay schema dự án.

`node editor/tools/kiem-ban-dung.mjs <việc> --claim ID --find "màn hình"`

Kết quả phraseSearch tối đa20lần xuất hiện, ngữ cảnh3từ hai bên, words giữ projectStart/projectEnd và outputStart/outputEnd, cảnh trám đang giao. Cụm1–12từ/tối đa120ký tự, normalizeNFC/không phân biệt hoa-thường/dấu câu, giữ dấu tiếng Việt; không tìm gần nghĩa. --find tìm toàn caption đang bật; --from/--to nếu kèm chỉ giới hạn timing, không giới hạn tìm. Không dùng --find cùng --media/--audio-media. Chỉ đọc, không build/render/apply hoặc đổi lựa chọn người dùng.

Nguồn lời vẫn là ASR/caption, có thể sai/thiếu; không có kết quả không chứng minh thiếu ý. Một cụm có thể qua cut; giữ từng anchor gốc, không tính ngược từ output ở điểm nối. Tìm đúng từ chưa chứng minh cảnh đúng hình hoặc đủ thời gian thấy thao tác. Cảnh liệt kê ngắn chỉ đủ nhận diện chi tiết nếu đã xem rõ; không kéo sang ý kế để đạt thời lượng.

## Thay đổi và kiểm chứng

- caption-phrase-search.mjs tìm theo token, giữ các lần lặp, giới hạn kết quả và không tạo ghi dữ liệu.
- session-candidate-check dùng chung bộ từ đãresolve cho timing và tìm; bảo toàn claim/base/candidate/jobbytesguards và phép rounding cũ.
- CLI thêm --find; không thay APIworker/UI. Skillv50 referenceeditorial hướng dẫn dùng khi cần tìm ý, không nạp lại toàntranscript.
- Unit kiểmNFC/tiếngViệt/dấu câu/lặp/giới hạn/invalid/captionoff, nguồn vắng/cut/rate2/sourceanchors/filebytesgiữ/claimkhácbịtừchối. Suite399/399 tại workspace/logs/caption-phrase-suite.log. Không đổi renderer nên không cần render để chứng minh phép tra từ.
- ZIPchungauto-creative-v50-caption-phrase.zip đãđóng/parse1mẫu11preset5refs. Backendmain5180khôngrestartlượt này; CLI nạpfilemới, jobmới nhậnreference mới, snapshotjobcũgiữ.

Codex thực tế QA85251d đãdone/awaiting-review sau73s: dùng --find, chuyển b-screen từproject9,55/output8,95–11,95 sangproject16,06/output15,46–16,21 đúng từ“màn,”, cắt thẳng để giữ0,75s nhìnhình, dừng trước“phim”. Chỉcác trườngcho phép củab-screenđổi, nguồn/workspace/mọi phần khác giữ; khôngrender/post. REAL_CODEX_SCREEN_PHRASE_SMOKE.json. Chưa first-build hoặc tựnhậnnghĩa/hình; không đo/báo giảm token từ sốbyte kết quả hoặc một lượt model.

QAexcerpt2s189112 xuất draft/hashqua,4ảnhđãxem: cảnhxe/đèn trước, màn có caption“màn” ở2mốc, trởAroll khi“phim”. Insert0,75s nhận diện được màn ở ảnh, chưa chứng minh xem đủ thao tác/chức năng hoặc nghe liên tục. SCREEN_PHRASE_PREVIEW_SMOKE.json/contact. Lượt excerpt đầu d4e6d2 sai cách cắt: cảnhtrám cũ bịclamp0 và kéo dài nên che màn, không coi là lỗi outputworker. Giữ bằng chứng INVALID_EXCERPT; harness sửa rõ tailBroll/loạigraphic trước khoảng trên bảnQA, không sửa dựánworker. Chưa xuất full mới có mànđổi; fullpreview0119f5a3 trước đó vẫn là mốc màncũ.
