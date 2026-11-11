# Nguồn video không có track âm thanh

## Vấn đề và quyết định · 05/11/2026

QA B-roll trước phát hiện nguồn A-roll tổng hợp không tiếng nhưng thiếu metadata hasAudio tạo audio element trỏ vào video-only; HyperFrames dừng ASSET_MEDIA_TYPE_MISMATCH. Cảnh trám AI cũng có thể không tiếng dù người dùng tăng audioVol. Ngoài ra source.hasAudio=false đang tắt tiếng mọi segment, kể cả clip đa nguồn khác có tiếng.

Build dùng metadata boolean đã biết theo từng nguồn/segment, còn thiếu metadata thì đọc stream audio bằng FFprobe local, cache trong một build. Chỉ bỏ audio element khi xác nhận không có track; không thêm track im lặng giả, không sửa nguồn/project hoặc tự đổi volume. Giữ tiếng nguồn khác, nhạc, SFX và voice riêng. Không đoán từ tên file. Thiếu file giữ reference để kiểm asset báo lỗi; probe lỗi thì dừng build có lý do thay vì âm thầm bỏ tiếng. Metadata boolean đã lưu vẫn được tin, chưa tự xác minh lại metadata cũ.

Không đổi UI, luồng điều khiển hay schema; preview/build và render snapshot cùng dùng buildHtml. Cần kiểm video-only có metadata thiếu, A-roll/B-roll có tiếng, đa nguồn false không tắt clip khác, cache mỗi build, lỗi probe và bản final thật. Chưa giải quyết Windows path dài của HyperFrames ở hạng mục này.

## Kết quả

`tests/source-audio-presence.test.mjs`: FFmpeg tạo video-only và nguồn tone thật; build không sinh audio cho video-only, giữ A-roll/B-roll tone và giữ tiếng clip đa nguồn sau nguồn đầu hasAudio=false. Kiểm cache, metadata rõ, đường dẫn ngoài và lỗi probe. Hai face-track unit dùng byte giả được ghi rõ hasAudio=false, không nới lỗi probe sản phẩm để vượt test. Suite370/370 tại workspace/logs/source-audio-presence-suite.log.

`node tests/broll-entrance-final-smoke.mjs --video-only`: final2s qua, cả hai nguồn không metadata hasAudio, B-roll audioVol1; output H264 không audio đúng dự kiến, SHA256/bytes verified,5khung kiểm màu/transition đúng và project không đổi. SOURCE_AUDIO_PRESENCE_FINAL_SMOKE.json lưu đường dẫn,hash và số đo. Không xác nhận chất lượng voice/music hoặc thao tác thực trong video ngành xe.

Skillv50 finishing bổ sung xử lý video-only, giữ11preset/5refs và không sửa snapshot việc cũ. Không đổi UI trong lượt này. Việc kiểm stream thiếu metadata là synchronous FFprobe có timeout20s/file trong build hiện hành; chưa benchmark hàng trăm nguồn/độ đáp ứng HTTP. Metadata boolean cũ chưa tự đối chiếu lại; thiếu file vẫn do asset validator báo.

## Final nhiều nguồn có tiếng

`tests/multisource-audio-final-smoke.mjs` đã xuất final4s với nguồn đầu video-only/hasAudio=false, clip440Hz, khoảng video-only và clip660Hz; B-roll880Hz bật audioVol0,5 từ1,6–2,6s. Metadata audio của các segment/B-roll không khai báo để dùng probe thật. Decode AAC cuối đo6cửa sổ: đầu và sau B-roll imlặng;440/660/880Hz có đúng khoảng, không rò tone ngoài đoạn; tỉ lệ880/440 khi chồng0,5054 phù hợp mức0,5. Dự án và4nguồn giữ hash/byte, artifact SHA256/bytesverified. Xem MULTISOURCE_AUDIO_FINAL_SMOKE.json. Đây đo số trên tone, chưa nghe giọng/nhạc thật hoặc xác nhận mix dễ nghe.

Final tone4s đo-11,36LUFS/-1,5dBTP với cảnh báo loudness ngoài-16đến-12; harness giữ cảnh báo, không gọi đạt chuẩn âm lượng vì render thành công. Không sửa target hoặc chạy loudnorm lặp để làm phép kiểm qua. Không thay app/backend nên không restart trong lượt QA này.

Backend5180 đã nạp sau khi xác minh dispatcher0/0, render/ASR/personTrackingidle và đúng PID/command, không mediaworker; pingContentOSOK, xem SOURCE_AUDIO_PRESENCE_DEPLOY_SMOKE.json. ZIP workspace/exports/chungauto-creative-v50-video-only.zip parse qua,3kiểm template/reference/snapshot qua.
