# Mốc gốc từng từ cho worker dựng video · 05/11/2026

## Vấn đề và cách dùng
Báo cáo timing trước chỉ có mốc output của từ; AI vẫn phải quy ngược để ghi broll.at. Tại điểm nối sau cắt, một mốc output có thể ứng với cuối đoạn trước hoặc đầu đoạn sau. Không nên dùng outToSrc để đoán từ nào được nói.

`kiem-ban-dung.mjs <job> --claim ID --from A --to B` nay trả thêm projectStart/projectEnd của mỗi từ, lấy nguyên số từ caption candidate. outputStart/outputEnd giữ nguyên phép resolve và rounding của renderer. Đặt at theo projectStart; duration là giây output đã tính tốc độ. Mốc của từ trên timeline project khác mediaStart riêng của file B-roll hoặc nguồn phụ. Caption chưa được xác minh vẫn có thể sai lời; công cụ không nhận diện nghĩa/hình.

Service chỉ đọc, giữ claim/base/candidate/jobbytesguards. Ghép theo captionId/text/mốc đãresolve và hàng đợi để xử lý id/từ trùng; không sửa schema dự án, renderer, UI hoặc tạo menu mới. Phép roundingrelative của caption được giữ để ghép chính xác khi nguồn có phần lẻ dưới mili giây.

## Bằng chứng
- Test session-candidate-check: cut/rate2, BrollmediaStart9, từ gốc2–2.5→output.5–.75; đoạn nguồn thứ2mediaStart7 độc lập; điểm nối output1 giữ từcuối .8–1 và từđầu5–5.4; id/từtrùng, từbịcắt, captionsoff,100từ mốc lẻ giữ nguyên. Candidate không đổi byte.
- HTTPQA thật claim→CLI window với fixture từđèn project.3–.5/output.05–.15 tại speed2→review qua. SESSION_CANDIDATE_CHECK_HTTP_SMOKE.json; không model/render.
- Fullsuite311/311 tại workspace/logs/word-anchor-suite.log trước bổ sung nhánh roundingrelative; testmục tiêu sau nhánh100từ qua. Không nhận suiteđãchạylạisau nhánh cuối.
- Skillv50/SKILL.md/editorial và inboxfirstbuild/revise hướng dẫn projectStart/giâyoutput. WORD_ANCHOR_SKILL_SMOKE.json: ZIP/snapshot11preset5refs qua, artifact workspace/exports/chungauto-creative-v50-word-anchors.zip.

Chưa chạy model mới dùng trường wordanchor, chưa preview/final mới vì không đổi renderer. Main5180 không cần restart; helperCLI đọc từđĩa, job mới nhận skill mới, snapshot job cũ giữ nguyên. Đây là cải tiến hợp đồng thời gian, không chứng minh hình-lời hay nhịp dựng đạt toàn video hoặc giảm token.
