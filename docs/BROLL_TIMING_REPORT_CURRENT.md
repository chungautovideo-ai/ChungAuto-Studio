# AI đối chiếu thời gian nhìn cảnh trám

## Quyết định

QA Q2 cảnh màn0,75s có fade ở đầu; cần dữ liệu định lượng hỗ trợ chọn nhịp trước bàn giao. Dùng inspector/timeline hiện có, không thêm menu hay tự sửa project. Công cụ CLI kiem-ban-dung --from/--to bổ sung entrance/advisories trong mỗi B-roll; workerAPI có check_broll_timing đọc candidate hiện tại. Không chạy buildHTML/probe/render/GPU hoặc gọi trả phí để báo cáo.

entrance nêu animationDuration, thời gian vào nằm trong cảnh, settledStart/End/Duration theo output đã cắt/đổi tốc độ. Mặc định khớp runtime; explicit duration0/none tắt, override cắt cuối được clamp; legacy animation có thể dài hơn cảnh và vẫn được báo đúng. Gợi ý ENTRANCE_COVERS_SHOT, ENTRANCE_OVER_HALF_SHOT, SHORT_INSERT(<0,6s) chỉ để xem lại, không gate/chất lượng tự động hoặc yêu cầu kéo dài mọi montage. Giữ lựa chọn đã chốt và không coi settledDuration chứng minh dễ đọc.

API trả tối đa100cảnh với total/truncated, lời trùng và từ tiếp từ caption có thể thiếu/sai; CLI giữ giới hạn cửa sổ30s/claim/revision/candidate read-only. at vẫn project clock, không lấy outputStart làm at. Chưa thêm UX cảnh báo vì chưa kiểm browser native; báo cáo phục vụ worker và người dùng xem trong công cụ hiện có.

## Kết quả

373/373 unit/service qua tại workspace/logs/broll-timing-report-suite.log. Kiểm default thật từ hàm runtime cho slide/zoom/drop/wipe/fade/unknown/none, explicit0/cắtcuối/rate/wordoverlap/hidden/giới hạn100. APIgateway fixture đọc→sửa→kiểm dùng candidate mới, tham số lạ bị từ chối, liveobject giữ nguyên; chưa provider/model thật. tests/session-candidate-check giữ claim/revision/byteguards.

`tests/broll-timing-cli-smoke.mjs` gọi tiến trình CLI thật với claimQA tổng hợp: cảnh0,4s/slide0,45s báo settled0/coversshot/shortinsert, lời màn→phim và projectAt2/output0,5 đúng; claim sai bị từ chối, live/candidate/job byte giữ nguyên, không tạoHTML hoặc probe media cố ý thiếu. BROLL_TIMING_CLI_SMOKE.json. QA này không phải HTTPclaim hoặc dựngthật.

Đọc QA Q2 đã có bằng service read-only và lưu BROLL_Q2_ENTRANCE_REPORT.json, không sửa project/render/skill snapshot đang làm. Skillv50 editorial cập nhật, ZIP workspace/exports/chungauto-creative-v50-broll-timing.zip parse qua, giữ11preset/5refs. Backend5180 nạp khi dispatcher0/0/renderASRtrackingidle và đúngPID, pingOK: BROLL_TIMING_REPORT_DEPLOY_SMOKE.json.

## Worker thật và hình nguồn thật

`tests/real-codex-broll-entrance-smoke.mjs --run-local-codex`: copy Q2/media/transcript vào QAriêng, HTTP tạo revise→CodexCLI thật→done/awaiting-review khoảng50s. Soobject xác nhận chỉ thêm b-man.tInDuration0,1, giữ tIn/fade,at/dur0,75/mediaStart/src và mọi trường khác; sourceproject/workspace byte giữ nguyên. Log có lệnh kiem-ban-dung trước/sau và báo cáo entrance. REAL_CODEX_BROLL_ENTRANCE_SMOKE.json: settled0,45→0,65s, kếtthúc16,27 trước từphim không đổi. CLI báo42021total tokens, chưa đo cached/billed hoặc so sánh tốiưu; không xem/nghe bởi worker, không render/đăng. Chưa modelAPIthật dùng check_broll_timing.

Sau workerterminal, `tests/broll-entrance-product-final-smoke.mjs` xuất2QAriêng2s lấy cùng nguồn A-roll/màn thực, fade0,3 và0,1; giữ workerproject. Hash/bytesverified,8frame và BROLL_ENTRANCE_PRODUCT_CONTACT.jpg đã xem: hàng trên0,3s còn bóng người nói phủ màn ở2mốcđầu, hàng dưới0,1s hiện màn sớm hơn; cácmốc sau cùng nội dung. BROLL_ENTRANCE_PRODUCT_FINAL_SMOKE.json. Đây isolatedexcerpt không captions/graphic/music/SFX và voicevolume0, không phải fullpreview/fullvideo hoặc ngheduyệt; không kết luận thao tác hoặc chữ màn dễ hiểu từ ảnhthưa.

Không đổi appbackend/UI ở lượtmodel/visualQA nên khôngrestart và không chạylại suite chỉ để tăng testcount. Tính năng và quy tắc mới có bằng chứng dùng thật trong sửa trường đã chỉ định, chưa chứng minh tự chọn đúng mọi nguồn hoặc dựngtựđộng chấtlượng đầyđủ.
