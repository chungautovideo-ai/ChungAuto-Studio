# Đầu vào SAM2 theo đúng mốc nguồn

Lỗi đã tái hiện: seek0,74s trên nguồn4fps rồi fps8 đưa ảnh0,75s làm khung đầu; người dùng đang đánh điểm trên ảnh0,50s đang hiển thị ở0,74s. Ảnh đầu lệch có thể làm prompt chạm sai đối tượng. Cách lấy mẫu cũ còn dùng round mặc định chọn ảnh gần nhất cho các tick tiếp theo.

Helper Python stdlib person_tracking_frames.py probe PTS khung trước/bằng mốc đầu, seek từ đó và giữ timestamp gốc. Filter dịch PTS về mốc yêu cầu rồi fps:start_time=0:round=up để tick giữ khung trình chiếu trước/bằng tick, không lấy khung tương lai. Chọn stream0:v:0, số mẫuceil(duration×fps), không vượt120. Sourceclock/from/fps/selection schema giữ nguyên; báo sampling trong kết quả chẩn đoán, không tự sửa mask đã lưu hoặc project.

Probe giới hạn15s/4MB, không xác minh được PTS thì lỗi. Input decoding60s, guardshot/mask và SHA vẫn giữ. Helper nằm cùng thư mục person-track.py, theo sys.path embedded hiện có; không cài dependency mới. Không đổi UI/renderer hoặc dời điểm để bù sai ảnh. MediaPipe semantic cũ vẫn có tần suất riêng; sửa này không bảo đảm viền/mask/skin đúng mọi frame.

Kiểm: tests/person-tracking-frame-clock.test.mjs dùng FFmpeg thật/stdlibPython app, nguồn4fps seekkhôngkhớp0,74→frame0,5 và ticktiếp→0,75, soRGBbyte; nguồnstart_time5, đuôinguồn vàkhoảng0,2squa. Toànsuite381/381: workspace/logs/person-tracking-frame-clock-suite.log. Chưa cameraVFR/rotation/nhiềucodec/NASkeyframe thưa hoặc browsernative.

SAM2 GPU thật trên proxyngười6s có from0,74/duration1/fps8:8mask, firstSourceFrameTime0,734067, elapsed10,375s gồm probe/decode/load/inference sau import; không so thời gian này với inferenceonly. PeakGPU477386752byte. NguồnSHAgiữ, không Apply/Save/render hoặc sửa dự án. PERSON_TRACKING_FRAME_CLOCK_GPU_SMOKE.json. Đã xem8mốc trong PERSON_TRACKING_FRAME_CLOCK_CONTACT.png: mask bám đầu/thân/tay/chân ở đoạn này, viền tay/ngón và một phần mũ còn chưa kín. Đây foreground, chưa semantic skin; không chứng minh danh tính/che khuất/fullvideo.

Không cần restart backend: person-track.py và helper được Python nạp mới ở mỗi lượt tracking; lượt GPU thật xác minh import embedded thành công. Mask đã lưu không tự chạy lại. Skillperson.md bổ sung sourceclock/lấy frame giữ, không dời điểm để bù lỗi seek.
