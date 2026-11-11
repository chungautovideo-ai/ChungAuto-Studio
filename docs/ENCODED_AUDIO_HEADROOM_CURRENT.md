# Giảm đỉnh AAC dựa trên file mã hóa cuối

QA worker Codex Q2v50 thật đã xuất draft99,7giây,1080×1920/30fps. Đo file AAC cuối: -14.77LUFS/-1.29dBTP/LRA4.8, vượt tham khảo -1.5dBTP dù loudnorm thành công. Không coi số đo này là nghiệm thu phối âm hoặc đã nghe.

Đã thêm ensureEncodedAudioHeadroom sau loudnorm/đo cuối trong finalizer chung CLI/HTTP. Chỉ khi loudnorm thành công và truePeak đo lớn hơn-1.5 mới giảm gain bằng chênh lệch cộng0.2dB; copy video, mã hóa AAC và đo file tạm. Chỉ thay file khi đỉnh giảm hữu hạn, không silent. Tối đa2lượt; lỗi giữ file tốt gần nhất và cảnh báo, sau đó đo lại. Không chuẩn hóa LUFS lại gây vòng lặp. audioHeadroom lưu các lượt/target/margin, audioLoudness/warnings phản ánh file cuối, hash được tính sau sửa.

Không có thay đổi UI/menu; người dùng tiếp tục đọc kết quả/warnings trong nhóm xuất hiện có. Skillv50 bổ sung finishing, giữ preset và snapshot job cũ; không tăng version cho sửa transport/hoàn thiện. ZIP bổ sung chungauto-creative-v50-finishing.zip giữ11preset/5refs, roundtrip đã kiểm; ZIP cũ không ghi đè.

Final QA đã terminal mã0/ok,99.700giây/H2641080×1920/30fps/AAC,329034511byte. Một lượt gain-0.41dB đưa peak-1.29→-1.80dBTP, đo cuối-15.2LUFS/LRA4.8/warnings[],listened:false. verifyArtifact khớp sidecar SHA25602da37b1a21fb0e9656afd43acb6529c322ac66c7613bb24b1eda66d571f1217. REAL_WORKER_V50_FINAL_SMOKE.json lưu probe/hash/số đo/giới hạn. Không nhận mix đã nghe hoặc privacy/cảnh đúng liên tục từ các số này. Suite305/305 trong workspace/logs/encoded-audio-headroom-suite.log.

Unit kiểm chỉ-khi-vượt, gain, noop/silent, giữ byte khi đo lỗi và giới hạn2lượt; targeted5/5 gồm finalizer thật và workerthread. Contact REAL_WORKER_V50_RENDER_CONTACT.png đã xem12khung: có chữ/graphic/caption/B-roll, biển xe còn thấy vì QA không bật che, không đủ nghiệm thu chuyển động liên tục/fullprivacy. Không công bố video này là bản sẵn đăng.

Đã triển khai main5180 sau dispatcher0/0/renderASRpersonidle/không workerContentOS phù hợp và xác minh PID12364/command chính xác; chỉ dừng PID đó. start.ps1/ping/ref finishing HTTP đều qua; ENCODED_AUDIO_HEADROOM_DEPLOY_SMOKE.json. Không đổi nguồn hoặc dự án người dùng để QA.
