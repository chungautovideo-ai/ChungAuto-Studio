# Kiểm bản final Q2 sau sửa cảnh trám

Xuất bằng pipeline hiện hành trên QA contentos-qa-broll-overlap-2 đã sửa, không thay project/source của người dùng. Lệnh xuat-video --quality final hoàn tất exit0; log workspace/logs/q2-broll-revised-final.log. Render snapshot780e2eb1-341b-4b6a-afca-8c34f3fb44b2,3189frame,1080×1920/30fps/H264/AAC,106,30s. Snapshot revision khớp project. Q2_REVISED_FINAL_AUDIT.json đối chiếu sidecar/bytes/SHA256 bản cuối351592604byte,897630f0bb191e9c16967f7a2f6654d7baac6a1ac9701f5a0bb1879a7e334edb.

Âm thanh sau AAC cuối -15,18LUFS/-1,73dBTP/LRA4,8,warnings[]. Bước giảm gain-0,38dB sau đo peak-1,32 đưa peak về-1,73. Đây số đo kỹ thuật, listened:false; chưa nghe toàn voice/music/SFX hoặc sync. Không nhận bản sẵn đăng chỉ vì không có cảnh báo.

Đã xem contact19khung output (Q2_REVISED_FINAL_CONTACT.jpg) quanh biên4Broll và đầu/giữa/cuối video, thêm ảnh nguồn mau4,5s. Màn xuất hiện tại15,6/15,95/16,2; frame đầu fade còn lẫn người, nên0,75s chưa đủ xác nhận đọc giao diện/thao tác. Đèn cho thấy đầu xe Ford với đèn, không chứng minh hiệu quả beam ban đêm. Ghế cho thấy vật liệu/headrest, không chức năng điện. Cảnh đổi màu cho thấy kéo phim nhưng chưa đủ bối cảnh khẳng định đúng dán thân xe thay vì phim kính. Có caption/title tại các mẫu, chưa xác nhận ASR/chữ/motion liên tục toànvideo.

Skillv50 references/editorial.md bổ sung kiểm ngữ cảnh phim kính/thân xe và thời lượng nhìn rõ sau transition; không biến riêng timing hoặc filename thành chứng cứ sản phẩm. Không tự đổi tIn của job cũ chỉ yêu cầu sửa mốc. ZIP proof-inserts giữ11preset/5refs,3test reference/snapshot qua. Chưa model thật dùng quy tắc bổ sung. Không thay preview mẫu bằng QA này để giả quality đã đạt, không restart server hoặc xuất lại chỉ để tăng kiểm.

Giới hạn: đây full final render + sparse visual QA, không continuouswatch/listening,không color/person/plate/fullprivacy/throughput. Bản final có biển nhìn thấy vì QA này chưa làm tác vụ che biển; không dùng để xác nhận tính năng che biển. Mục tiêu nâng cấp app/UX/skill vẫn còn mở.
