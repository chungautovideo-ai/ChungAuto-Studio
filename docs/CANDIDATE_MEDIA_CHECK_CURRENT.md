# Kiểm khoảng media thật trước bàn giao bản dựng

Vấn đề: kiem-ban-dung hiện kiểm timeline/đồ họa nhưng không đọc thời lượng file; worker phải tự đối chiếu nguồn, có thể dùng metadata cũ. Thêm --media tùy chọn, tái sử dụng FFprobe và resolveTimeline để kiểm A-roll/B-roll đang dùng, không build/render hoặc sửa file. Không thêm UI/menu vì đây bước kiểm cho worker.

Clock: segments tiêu thụ out-in giây nguồn, mediaStart riêng hoặc in; speed chỉ đổi thời lượng output. B-roll tiêu thụ dur output đã resolve nhân speed0,25–4, không dùng clock at làm mediaStart. Ảnh B-roll không giới hạn theo duration video. Nguồn hidden/cắt bỏ không cần probe. Tối đa40nguồn unique; chạy tuần tự dùng service có giới hạn chung. Sai đường dẫn/missing/probe/type/range trả lỗi rõ theo src/id; thay file/job/candidate/base revision trong lúc kiểm phải dừng. Không chỉ tin mediaInfo project. Giữ thời lượng gốc/query, không tự rút ngắn hoặc freeze cảnh.

Phạm vi không gồm audio/music/SFX/assetHTML/font hoặc hình-lời/chất lượng màu/quyền tư liệu. Metadata màu chỉ cung cấp chứng cứ tag, không đoán Log từ hãng. Đây read-only, không tự render/publish hoặc nhận video đạt chất lượng.

## Triển khai và bằng chứng

`node editor/tools/kiem-ban-dung.mjs <việc> --claim ID [--from A --to B] --media` gọi checkSessionCandidateMedia, tái kiểm claim/status/job bytes/base revision/candidate revision qua các bước async. Trả media.ok/sources/activeItems/errors cùng báo cáo cấu trúc; lỗi media làm exit1, dữ liệu giữ nguyên. `--from/--to` chỉ giới hạn phần báo timing, media vẫn kiểm toàn bộ A/B-roll đang dùng. Tùy chọn không chạy nếu người dùng không yêu cầu. B-roll tốc độ âm legacy theo renderer fallback1, tốc độ dương clamp0,25–4. Module đọc mới theo mỗi lần gọi CLI; không cần restart main server.

Unit kiểm speed2/multi-source/mediaStart/ảnh/ẩn/cắt bỏ/probe một lần mỗi file/overrun/missing/audio/nguồn đổi/khóa revision; từ chối hơn40nguồn và đường dẫn ngoài dự án trước probe. HTTP tạo việc→claim→CLI FFprobe thật→done/review trên clipQA0,6s qua; fixture vượt nguồn bị từ chối đúng B-roll, file đọc giữ byte, sai claim thất bại, không render. CANDIDATE_MEDIA_HTTP_SMOKE.json. Không provider hoặc model thật trong phép kiểm.

Bản Q2QA trước đó có5file/6đoạn đang dùng (2A-roll+4B-roll) kiểm FFprobe thật qua, project byte giữ nguyên: CANDIDATE_MEDIA_Q2_SMOKE.json. Không xem/nghe mới hoặc xác nhận ngữ nghĩa. Full suite328/328 ở workspace/logs/candidate-media-suite.log.

Skill v50 và inbox first-build/revise hướng dẫn dùng --media khi dựng mới hoặc đổi nguồn/cắt/mediaStart/dur/speed; không quét lại khi chỉ sửa chữ. ZIP workspace/exports/chungauto-creative-v50-media-check.zip parse11preset/5refs qua, SHA tại CANDIDATE_MEDIA_SKILL_SMOKE.json. Chưa chạy model với hướng dẫn mới, chưa đo token. Giữ snapshot job cũ, không sửa dự án gốc.

## API cùng nghiệp vụ

createEditorContext.checkRanges dùng cùng helper/resolveTimeline/FFprobe trên candidate được truyền, guard trước/sau, không viết project. API có check_video_media_ranges khi context hỗ trợ, không nhận tham số/path tùy ý. Gọi sau đổi nguồn/cắt/mediaStart/dur/speed, đọc lỗi và sửa trước hoàn tất; không đổi nhóm menu. Systemprompt bổ sung hướng dẫn, tool không đặt edited=true vì kiểm là read-only. Abort/revision/context guard sau await vẫn áp dụng.

Sửa kiểm sớm applyEditorFields cho B-roll: tính dur×playbackRate (âm/0 legacy fallback1; dương clamp0,25–4) thay vì chỉ dur; tránh lọt cảnh tăng tốc vượt file hoặc chặn nhầm cảnh slowmotion hợp lệ. Kiểm thật sau resolve vẫn là --media/tool vì duration có thể bị giới hạn cuối timeline.

tests/api-media-ranges.test.mjs chạy FFmpeg/FFprobe thật trên fixture2s, toolcheck→sửa→toolcheck4roundgateway giả lập, projectbytekhôngđổi, abortsauawait và speed2/.5 qua. HTTPworker thật với gatewaylocal fixture0,6s có check lỗi→sửa mediaStart→checkđạt→done/review, chỉ mediaStart đổi, khôngrender/paidprovider: API_MEDIA_RANGES_HTTP_SMOKE.json. Suite330/330 workspace/logs/api-media-ranges-suite.log. Chưa modelAPItrảphí, không đo chất lượng hình/âmthanh hoặc token.

Backend đã nạp trên main5180: dispatcher active/queued=0, render/ASR/personTracking idle, xác minh đúng command/PID rồi restart; ping trả app contentos. Bằng chứng API_MEDIA_RANGES_DEPLOY_SMOKE.json. Không suy việc deploy thành nghiệm thu model hoặc chất lượng video.
