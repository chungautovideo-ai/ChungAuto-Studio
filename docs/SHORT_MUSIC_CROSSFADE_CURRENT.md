# Nhạc ngắn nối mượt xuyên suốt video

## Phân tích trước thay đổi

Công việc: dựng quảng cáo/review xe có lời nói, dùng bài nhạc local ngắn và giữ nhạc đến hết outro. Nhóm Âm thanh → Nhạc nền đã có lựa chọn Nối mượt VEK/Lặp liền mạch; không thêm tab hoặc thông số bắt buộc. Đối chiếu code build.mjs, music-loop.js, app.js và goi-capcut.mjs: build crossfade chỉ lặp khi file dài hơn6s, còn file ngắn dùng một thẻ kéo dài hơn nguồn. Gói CapCut lấy thẻ audio từ cùng buildHtml. Đây bằng chứng source, chưa nghe UI app khác trong lượt này.

Giữ thiết kế/luồng VEK và các lựa chọn người dùng. Quy tắc đích: crossfade tự rút phần chồng tối đa2s xuống1/3 file với nhạc ngắn, không kéo đứng/đọc quá file, phủ đến total gồm outro. Repeat giữ phase và các fade đã khai báo. Dùng planner chung cho build và kiểm media để không để checker báo quy tắc cũ. CapCut tiếp tục dùng cùng thẻ audio. Giới hạn số vòng lặp để tránh HTML quá lớn; báo lỗi rõ khi file quá ngắn hoặc metadata không hợp lệ.

Không đổi UI trong hạng mục sửa engine này; nhóm/nhãn/điều khiển giữ nguyên, Undo/Save/reopen giữ schema. Kiểm planner nguồn/range/phủ thời gian, build thẻ thực, âm thanh xuất từ thẻ và artifact render QA; không coi tone test là chất lượng nhạc thực hoặc nghe duyệt mix.

## Triển khai

crossfadeMusicParts tính vòng có overlap min(2s,1/3file), không đọc quá file và tối đa2000vòng. crossfadeMusicMixParts ghép gain của vòng với fade đầu1,2s/cuối2s theo toàn video (rút khi video quá ngắn), cùng duck theo vùng lời. Tách thành lớp gain cố định + ramp tuyến tính với sai số nội bộ0,0005, tối đa10000đoạn. Fade không reset tại điểm chia duck. Vẫn giữ phase/source offset của mỗi vòng, không chèn silence/freeze để lấp nguồn; repeat giữ nguyên planner cũ.

buildHtml dùng các phần đã tính cho preview/render; goi-capcut lấy cùng thẻ audio qua capcutAudioMix. candidate audio checker bỏ lỗi MUSIC_COVERAGE_GAP của quy tắc cũ, dùng planner mới hoặc repeat để báo INVALID_MUSIC_LOOP khi thời lượng/cấu hình vượt giới hạn. Không tự đổi bài/chế độ/mix hoặc sửa project khi kiểm.

## Bằng chứng

Unit/service kiểm phủ toàn timeline và nguồn0,1/0,6/1/2/6/8/10s, số track tối đa2vòng chồng, biên fade, cap vòng, gain qua overlap/duck/fade toàn cục (kể cả vùng lời giao nhau). Build/CapCut FFmpeg mix thật với nhạc2s + voice và outro8s còn tín hiệu sau vòng đầu/trong outro, giảm ở vùng lời và cuối. Kiểm audio-clips cũ đổi từ tên/id thẻ cứng sang tổng gain đúng0,1 khi duck và0,4 khi clip ẩn; giữ kiểm waveform thực. Toàn suite338/338: workspace/logs/short-music-suite.log.

SHORT_MUSIC_FINAL_SMOKE.json: HTTP final render thật từ nguồn tổng hợp3s + outro2s, nhạc1s, outputH2641080×1920/30fps/AAC5s. Đọc đúng index.html từ render snapshot,203thẻ âm thanh đều nằm trong nguồn; RMS tại1,7–1,8s=0,26969,3,6–3,7s=0,16375,4,9–4,97s=0,00901. SHA/sidecar khớp, audio đo-14,8LUFS/-10,28dBTP, listened:false. Các phép đọc đầu tiên của harness nhầm work/render.json hoặc index gốc, đã sửa verifier đọc sidecar snapshot; kiểm lại artifact có sẵn, không chỉnh renderer để vượt kiểm. Script short-music-render-smoke.mjs dùng verifier đó cho lượt sau.

203thẻ là fixture nhạc rất ngắn có fade giao overlap; không dùng phép kiểm này để chứng minh preview nhẹ hoặc năng suất. Chưa nghe nhạc thực, chưa thao tác mở stem trong CapCut thật, chưa đo mọi frame/âm sample hoặc toàn mixQ2. Không claim parityCapCut/fullquality.

Skillv50 và finishing cập nhật, ZIP workspace/exports/chungauto-creative-v50-short-music.zip parse11preset/5refs qua, SHA tại SHORT_MUSIC_SKILL_SMOKE.json. Không thay snapshot job cũ, chưa worker model thật/tokenbenchmark với hướng dẫn mới. Backendmain5180 đã restart sau xác minh dispatcher0/0, render/ASR/personidle, không mediaworker/đúngcommandPID; pingContentOSOK. SHORT_MUSIC_DEPLOY_SMOKE.json.
