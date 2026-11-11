# Kiểm worker hiện hành từ nhận giọng mới

Mục tiêu: xác minh một lượt mới bằng Codex CLI thật, templatev50 snapshot hiện hành, ASR tiếng Việt local tự tạo từ đầu, nguồn QA copy và completion review. Không gọi API trả phí/tự xuất/đăng hoặc sửa dự án người dùng. NguồnA-roll111,545s và4fileB-roll từ bảnQAQ2-5, không phải nhập NAS mới. Dùng serverQA5193 riêng, giữmain5180.

Lượt đầu HTTP ECONNRESET sau tạoQAQ2-6, chưa có ai-job/worker. Đã xác minh serverQA không còn process, giữ artifact. Harness thêm Connection:close cho request và ghi stdout/stderrserver riêng; không retryPOST tự động, không xóa claim. Lượt mới QAQ2-7 đã submit, bắt đầu07:16:37UTC05/11. Session31459 đã kết thúc exit0; kết quả ở phần dưới.

Khi terminal: đọc transcriptengine/language/createdAt, dựán đã lưu, hashnguồn, snapshotpolicy, helper đã dùng và clockB-roll. q2-current-worker-audit.mjs chỉ đọc và từ chối job đang chạy; không sửa đầu ra để đạt kiểm. Báo cáo lời/timing không thay kiểm hình và nghe liên tục. Goalngànhxe/UX/skill rộng vẫn tiếp tục.

## Kết quả thực tế

REAL_WORKER_Q2_CURRENT_FRESH_ASR_SMOKE.json: QAQ2-7 submit07:16:37→terminal07:21:13UTC, khoảng276s. Whisper.cpp tiếngViệt tự tạo07:18:04,423từ, không nhập transcript cũ. Codex kết thúc done/awaiting-review,104,24s,8segment lưu (renderer gộp3đoạn liên tục),10texts/5blocks/3B-roll/4zoom, ambient-pad0,1/SFXvừa/duckSourceSpeechtrue. Khôngrender/post. QAserver5193 đãthoát sauterminal, main5180 giữ nguyên.

Q2_CURRENT_FRESH_ASR_AUDIT.json đối chiếu SHA5fileQA copy/gốc, pinpolicyhash và áp policy lại không thay đầu ra; beauty không có, watermarkkhônghiện, endCardkhôngbật. Đọc dựán giữSHA. Worker dùng samplerảnh/preset/timing/audio-mediahelper thật. Policyunit6/6 và syntaxharness/audit qua; đây khônglà vòngtestbộcodeappmới, không cần chạy lại394suite.

Q2_CURRENT_FRESH_ASR_EDITORIAL_AUDIT.json: đèn13,96–15,46s gối đúng từđèn14,71–15,46; ghế17,56–19,06 gối đúng bọcghếda18,01–19,06. Màn8,95–11,95s nằm lời sảnphẩmtrướclắpđặt, không gối tênmàn15,46–16,21. Têncảnh ghi minh họasảnphẩm chung, không nhận đó là lỗi chỉ từ phép so từ, nhưng còn thiếu cảnh chứng minh ở ýgọitên nên cần duyệt. Worker đã bỏ mau vì ảnh cho thấy thao tác kính khôngchứngminh đổi màu thân xe: đúng cách khôngsuytừtênfile, chưa xemliêntục để nghiệmthu.

Worker tự ghi chưa xem/nghe preview liên tục và cần duyệt ASR/mix. CLI báo208.755tokens tổng, khôngtáchbilled/cached, không chứngminhtốiưutoken hoặc 50–100video/ngày. KhôngsửađầuraQA để làmđẹpkếtquả. Skillv50 đãsnapshotphiênbảnmới có hướngdẫnB-roll/chebiển; lượt này khôngthayskill chỉvì mộttínhiệumontage.

## Xem bản dựng mới và sửa chỉ dẫn tọa độ

q2-current-preview-smoke.mjs --render-local tạoQA0528814f riêng, sao đúng transcript để hạ nhạc, không sửa QAworker. Bản nháp đầy đủ104,24s xuất thành công1080x1920/AAC, hashsidecarverified; Q2_CURRENT_PREVIEW_SMOKE.json đo-15,16LUFS/-1,74dBTP/LRA5,1, warnings[],chưa nghe. Đã xem20ảnhQ2_CURRENT_PREVIEW_CONTACT.jpg: hook bị cắt mép phải, màn ở câu chung, đèn/ghế ở ý tương ứng, biển xe còn hiện vì không yêu cầu che. Không suyảnhthưa thành nghiệmthu toànframe/fullmix.

Lỗi hook có nguyên nhân cụ thể: texts[].x=540 do worker hiểu nhầm tọa độ tâm; renderer textBox dùng translate ngang, x=0 mới ở giữa. session-presets.mjs trảtextCoordinates tại bước đọc danh mục; skillv50editorial.md thêm quy tắc và giữ vịtrípreset nếu chưa xem. Sessionpresettest1/1/syntaxqua; ZIPchungauto-creative-v50-text-coordinate.zip parse11preset5refs. Không tự đổi schema hoặc sửa bảnworker đãbàn giao; lượtCodexmới tuânhướngdẫn chưa kiểm.

ĐoạnQA4,5s993f22d0 riêng chỉ sửa x0 cho hook trong vùng giữ. HyperFrames ghi fileMP4 nhưng sau đó thoátWindows3221226505; CLI/app đúng là ok:false, khôngfinalize sidecar. Khôngchạy lại cùnglệnh hoặc coi filetrunggian là xuấtthànhcông. Filetrunggian decodeđược; Q2_HOOK_CENTER_PARTIAL_SMOKE.json/contact đãxem4mốc: hook ở giữa, khôngcắtmépphải. Đây chỉ kiểmhìnhhọc, chưa xử lýnguyênnhâncrash hoặc nghiệmthu pipelineđoạnngắn.

Logbảnnhápfull có cảnhbáo SFXslot dài hơnfile: build đangcốý giữslotmin0,8s cho preview nhưng WAV chỉđệmđầu0,25s, chưađệmđuôi. Cần sửaassetpad/thờilượng vàkiểm cue/mixởhạngmục tiếp; chưa sửa bộrenderer trong lượt này.
