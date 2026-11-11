# AI sửa người và da theo khoảng đã lưu

UI/renderer đã hỗ trợ mức riêng khoảng, nhưng CLI/API chỉ đổi mức file. Hạng mục này dùng lại service applyPersonAdjustment, candidate/revision/claim và báo cáo selectionScope; không đổi UI/mask/render hoặc chạy inference. Mục đích: người dùng yêu cầu sửa một cảnh thì worker có thể giới hạn đúng khoảng, không sửa toàn file.

set_person_adjustment nhận range optional {from,to} theo giây nguồn từ selectionScope.ranges. Chỉ chấp nhận chính xác đầu/cuối một khoảng SAM2 cùngsrc/hash đã lưu; không suy mốc timeline, nới khoảng hoặc tạo mask mới. Chỉ gửi levels cần sửa; mức còn lại lấy từ override khoảng hoặc mức file/chung. Bỏ range giữ hành vi đổi mức file, override khoảng vẫn giữ. Báo cáo bắt buộc trước API mutation như cũ; off/stale/claim/revision vẫn chặn.

CLI chinh-nguoi-da.mjs <job> --claim ID --src FILE --sha256 HASH --from A --to B --body-white 20 [--apply]. Không --apply chỉ kiểm; cả hai mốc bắt buộc, không kết hợp --measure-selected. Chỉ ghi revise candidate; completion dùng endpoint cũ và review/auto-export đã chốt. Không tự xuất/đăng.

Unit thêm range partial/explicitzero/giữmask/mứcfile/khoảngkhác, saiđầu/cuối/type và APItool schema/report-before. HTTP worker với gatewaylocalgiảlập qua3lượt read→rangechange→complete/awaiting-review trên copyQA6s/priorSAM2, face bytes giữ. API_PERSON_RANGE_ADJUSTMENTS_HTTP_SMOKE.json; chưa provider/modelthật hoặc newinference.

Session CLI thật qua report/dry-run/apply/completion và HTTP reopen, không inference mới: SESSION_PERSON_RANGE_SMOKE.json. Suite 308/308 (workspace/logs/ai-person-range-suite.log).

Thử Codex model thật lần đầu (contentos-smoke-person-cli-2): server hoàn tất awaiting-review, giữ phạm vi nhưng model chọn sai personLight20 thay vì bodyWhite20. Harness bắt lỗi, không nghiệm thu thành công. Giữ job/candidate/log để đối chiếu; bổ sung ánh xạ sáng da/bodyWhite, sáng người/personLight và ví dụ cụ thể vào inbox/skill; thử lại bằng job mới, không sửa kết quả cũ.

Lần thử lại contentos-smoke-person-cli-3 qua model Codex thật: chỉ bodyWhite0–2=20, giữ personLight40/bodySmooth0, khoảng3–5 và mọi camera khác, face bytes không đổi, completion awaiting-review, HTTP reopen đúng, không render. REAL_CODEX_PERSON_RANGE_SMOKE.json. Ánh xạ tiếng Việt cập nhật cả inbox/APItool/skill. Gói mới chungauto-creative-v50-ai-person-ranges-v2.zip qua parse roundtrip; giữ11preset/5refs. Main5180 restart sau dispatcher0/0, render/ASR/person idle và xác minh PID4760/command đúng. Không coi đây là kiểm inference mới hoặc chất lượng toàn video.
