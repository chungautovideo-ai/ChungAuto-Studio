# Đối chiếu lời và B-roll theo clock editor · 05/11/2026

## Hợp đồng đã xác minh từ mã
editor/lib/timemap.js và resolveTimeline trong build.mjs: project at là timeline dự án trước cắt; srcToOut tự quy đổi sang output. dur là giây hiển thị output; mediaStart là thời gian riêng trong fileBroll. Với nhiều nguồn, timeline project khác clock riêng của file có src/mediaStart. Không ghi outputStart trực tiếp vào at. Hướng dẫn quy đổi at thủ công trước đây trong editorial.md sai và đã được thay ngay khi đối chiếu mã.

## Công cụ dùng lại
node editor/tools/kiem-ban-dung.mjs <việc> --claim ID --from A --to B
A/B là giây output, khoảng tối đa30s. Trả words projectStart/projectEnd gốc và outputStart/outputEnd, broll projectAt/outputStart/outputEnd/mediaStart/speed và segments projectIn/projectOut/outputStart/outputEnd/rate/src/mediaStart. Lấy cùng resolveTimeline với editor, không tự tính renderer khác. Lấy projectStart làm at; dur theo khoảng output đã tính tốc độ. Giới hạn200từ/100cảnh/100đoạn, cờ truncated báo rõ. Lời lấy caption candidate, có thể thiếu/sai. Không tự quyết định ngữ nghĩa hay sửa mốc. Bằng chứng bổ sung điểm nối cắt và độ chính xác: WORD_ANCHORS_CURRENT.md.

Giữ claim/candidate/base revision/job byte guards và read-only. Không buildHtml, quétGPU, nhận giọng, render hoặc đăng. Thời điểm ngoài timeline/khoảng âm/đảo/>30s bị từ chối. Không thêm menu hoặc inspector trùng vì đây là công cụ worker phục vụ timeline hiện có.

## Kiểm hiện tại
Unit kiểm cut+rate2+nhiều nguồn/mediaStart7, Brollat2→output.5/mediaStart9/speed.5, từ màn/phim, hidden/boundary/invalidrange, file không đổi. HTTPQA→claim→CLI --from0 --to.4 thực qua, invalid/thiếuflag bị từ chối; completionreview/noRender. Bộ310/310 ở workspace/logs/candidate-timing-suite.log. Không coi đây là model/visual/audio acceptance.

Skillv50 và inboxfirstbuild/revise ghi đúngclock và công cụ; giữ11preset/5refs, ZIP/snapshot kiểm ở CANDIDATE_TIMING_SKILL_SMOKE.json. Job đang có snapshot giữ nguyên; bản mới áp dụng job mới. RealCodex đã sửa4cảnh trênQAriêng, terminaldone/awaiting-review56s; xem REAL_CODEX_BROLL_TIMING_SMOKE.json.

## Model thật và kiểm trực quan
RealCodex revise dùng helper trước/sau, chỉ sửa at/dur4cảnh và giữ bytegiátrị các trường khác (soobject), mọi src/mediaStart/mode/preset/id giữ. Outputđèn14.83–15.58, màn15.58–16.33, ghế18.13–19.18, đổimàu20.22–21.24; khớp khoảng token captions. Không nhận đã nghe chính xác lời thật. Project workspace/content/2026-11-05/contentos-qa-broll-timing; copyQAriêng, bản workerfullBrollcũ giữ nguyên.

Editor5180 đã mởQA:16.2s màn cùngcaptionmàn;16.5s quayvềAroll/captionphim. Ảnh BROLL_TIMING_BEFORE_BOUNDARY.png và AFTER_BOUNDARY.png đã xem. Chưa kiểm liên tục hoặc render/audio. Kết quả chỉ chứng minh chỉnh mốc theo caption và hai khungpreview, không nghiệmthu toànvideo hoặc nhịp dựng hay. Workspace trảChungAuto.

Đính chính evidenceQ2trước: at là projecttime, thực startmàn15.58 (at16.06 trừcắt.48), kếtthúc17.13; sai captionphim ở16.4 vẫn đúng. Q2_FULL_BROLL_OUTPUT_CHECK.json thêm outputStart/outputEnd chuẩn để phân biệt, không sửa đầu ra gốc.
