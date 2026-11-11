# Kiểm file nhạc và clip âm thanh trước bàn giao

## Nghiệp vụ và tích hợp

Luồng dựng ngành xe đã có nhóm Âm thanh, nhạc nền/duck và SFX. Vấn đề nằm ở bước bàn giao: audioClips trong build bỏ file thiếu hoặc timing không phát được, rút thời lượng tại cuối file/video; worker trước đây chỉ kiểm A-roll/B-roll thật. Thêm kiểm read-only ở service/CLI/API để trả lỗi theo file/clip, không thêm tab hoặc menu. Đây thay đổi backend/hướng dẫn worker, không đổi giao diện và không tuyên bố đã khảo sát UI mới của CapCut. Giữ trải nghiệm VEK và audioClipTiming chung; không tự phát nhạc, render hoặc áp sửa.

`candidate-audio-check.mjs` đọc candidate hiện hành: nhạc nền local hoặc ba mã kit hợp lệ, các audio.clips không hidden, tối đa40nguồn unique. Dùng FFprobe xác nhận stream/thời lượng, source stat trước/sau và cuối lượt, validate ở bước async. Kit chỉ đọc assets sẵn có, không chạy bộ tổng hợp/tải file. Path ngoài dự án bị từ chối; kit được giới hạn trong editor/assets/music. Không tin metadata cũ trong project.

Clip at theo source clock project; from/dur theo giây audio, không nhân tốc độ A-roll. Tái dùng audioClipTiming và contentTotal như build. Trả outputStart/outputEnd/sourceStart/sourceEnd; vượt file là AUDIO_RANGE_TRUNCATED, timing không phát được là INVALID_AUDIO_RANGE. Cắt cuối nội dung và vol0 có warnings riêng, không tự sửa. Nhạc crossfade hiện chỉ lặp khi bài dài hơn6s; bài ngắn hơn video/outro báo MUSIC_COVERAGE_GAP, có thể chọn repeat hoặc nguồn phù hợp. Không mặc định đổi ý định dựng.

Cập nhật sau sửa engine: quy tắc crossfade6s ở trên là trạng thái trước sửa. Hiện hỗ trợ nhạc ngắn với overlap co lại, phủ cả outro; checker dùng planner và báo INVALID_MUSIC_LOOP cho metadata/cấu hình/vòng lặp không hợp lệ. Xem SHORT_MUSIC_CROSSFADE_CURRENT.md; không còn yêu cầu đổi repeat chỉ vì file ngắn.

## Lệnh và tool

`node editor/tools/kiem-ban-dung.mjs <việc> --claim ID --audio-media`, có thể kèm --media và --from A --to B. Window chỉ giới hạn phần báo cấu trúc; audioMedia kiểm toàn bộ âm thanh trong candidate. Claim/job/base/candidate revision giữ nguyên cơ chế hiện có. Lỗi audio làm exit1, không sửa file hoặc build/render.

Worker API có check_audio_media_ranges khi editor context hỗ trợ, không nhận tham số/path. Truyền bản sao candidate hiện hành, validate/context/abort trước và sau await; kiểm read-only không đánh dấu edited. System prompt/inbox/skill chỉ gọi khi dựng mới hoặc sửa âm thanh, không quét lại cho lượt chỉ sửa chữ.

## Bằng chứng và giới hạn

Tests kiểm clock qua cắt/tốc độ, hidden, probe unique, thiếu file/stream, overrun, mute/cắt cuối, nhạc repeat/crossfade, path ngoài/kit sai, file đổi, claim/revision/abort và API sửa file nhạc giữ live project. FFmpeg/FFprobe thật với sine2s; model gateway tổng hợp, chưa nhà cung cấp thật. Fixture từng dùng fs.cpSync gặp Node Windows exit3221226505 khi TEMP chứa tiếng Việt; thay bằng ghi file fixture trực tiếp, không đổi runtime app hay hạ kiểm.

AUDIO_MEDIA_HTTP_SMOKE.json: server5193 riêng, session claim→CLI kiểm đạt, clip from1.9/dur0.3 vượt nguồn2s bị báo đúngid và giữ byte. Job test kết thúc fail rõ ràng để không áp fixture lỗi. Worker API HTTP tiếp theo5lượt gateway: thiếu nhạc→inspect file→đổi music→kiểm đạt→done/awaiting-review, chỉ audio.music thay, không render/trả phí. Khôi phục workspace và dừng server/gateway sau terminal. Lần đầu gateway keep-alive lỗi fetch, đã sửa harness Connection:close và lượt mới qua; không tự gửi lại job người dùng.

Skillv50/finishing/inbox cập nhật; ZIP `workspace/exports/chungauto-creative-v50-audio-media-check.zip` parse11preset/5refs qua, SHA tại AUDIO_MEDIA_SKILL_SMOKE.json. Không thay snapshot job cũ, chưa chạy model thật với hướng dẫn mới hoặc đo token.

Chưa nghe toàn mix/đo loudness trong kiểm này, chưa kiểm SFX tự sinh/tiếng nguồn A-roll/B-roll/giọng đã xử lý, chất lượng nhạc/cue hoặc quyền sử dụng. Không dùng kết quả để nhận video đạt chất lượng hoặc đủ năng suất.

Kiểm đúng nguồn kit: nếu dự án đã có assets/music/<name>.wav, build giữ bản đó nên checker ưu tiên probe bản dự án; chỉ fallback asset kit nếu chưa copy. Có kiểm riêng file thực được probe và cap40nguồn trước I/O. Nhóm hồi quy liên quan14/14 qua sau thay đổi cuối.

Trạng thái cuối: suite tổng335/335 đạt sau thay đổi kit cuối (workspace/logs/audio-media-suite.log). Lượt chạy trước đã chờ đúng khóa render người dùng rồi terminal334/334, không xóa khóa hoặc ngắt render. Sau khi dispatcher active/queued=0, render/ASR/personTracking idle và không media worker, xác minh đúng command/PID ContentOS5180 rồi restart qua installer/start.ps1; ping app contentos OK. Bằng chứng AUDIO_MEDIA_DEPLOY_SMOKE.json. Backend mới đã nạp; không thay UI hoặc dự án người dùng.
