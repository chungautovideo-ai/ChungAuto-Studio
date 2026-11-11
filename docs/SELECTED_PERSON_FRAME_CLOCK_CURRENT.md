# Đồng bộ ảnh đo sáng với mốc mặt nạ

## Lỗi và cách sửa

Input seek FFmpeg tại một giây bất kỳ lấy khung đầu tiên có PTS bằng hoặc sau mốc đó. Mặt nạ lại lookup tại mốc yêu cầu, nên ảnh đo có thể thuộc khung kế tiếp. Đã tái hiện nguồn 4 FPS: yêu cầu 0,74s lấy ảnh sáng ở0,75s thay ảnh đang hiển thị từ0,50s. Sửa trước đây chỉ xử lý đuôi nguồn rỗng chưa giải quyết trường hợp giữa nguồn.

Decoder mới probe timestamp, chọn PTS lớn nhất không vượt requestedTime và xác minh khoảng trình chiếu bằng PTS kế tiếp hoặc giới hạn cuối nguồn. Decode đúng PTS đó, chọn stream0:v:0 nhất quán. Giữ requestedTime để tra mask, không dời selection/at/mediaStart. Kiểm thời lượng/kích thước trước subprocess. Origin format và cửa sổ PTS được cache trong một lần đo, không cache lâu qua nguồn/revision; validate/abort vẫn kiểm quanh subprocess. Probe giới hạn4MB/15s, lỗi không lấy ảnh tùy ý.

Báo cáo thêm frameTimes cho từng phép đo thật; tailFrames vẫn chỉ phần khung cuối được giữ. Decode giả lập trong unit không bịa PTS. Đo vẫn read-only và HDRHLG/PQ vẫn chặn trước decode. Không đổi renderer, UI hoặc tự áp mức.

## Bằng chứng

- Unit mới kiểm ảnh trước ranh giới0,75, VFR0/0,125/0,625/1,25, ranh giới chính xác, query lùi, offset nguồn, abort và bounds. Toàn suite376/376: workspace/logs/selected-person-frame-clock-suite.log.
- tests/selected-person-frame-clock-smoke.mjs: nguồn QA người thật6s/180frame,8mốc gồm query lùi và cuối nguồn. Mỗi ảnh72×128 khớp byte RGBA của frame tương ứng khi giải mã tuần tự toàn nguồn. Cách seek cũ khác ở8/8mốc; SHAnguồn giữ nguyên. SELECTED_PERSON_FRAME_CLOCK_SMOKE.json.
- HTTPQA HLG/PQ422, SDR200/đuôi0,75; nguồn/mask/project/workspace không thay đổi. SELECTED_PERSON_LOW_FPS_HTTP_SMOKE.json.

Không suy chất lượng mặt nạ/da/danh tính từ kiểm PTS. Chưa cameraVFR/HDR thật, rotate/Bframes nhiều codec, stream start lệch format hoặc nguồn dài/keyframe thưa. Probe giới hạn có thể trả lỗi cho nguồn phức tạp thay vì đo sai. Chưa benchmark chi phí probe12mốc trên NAS. Không có kiểm UI native hoặc render mới vì không thay đường render.

Main5180 nạp khi dispatcher0/0/render-ASR-personTracking idle và không media worker, đúng command PID21284→12560/pingOK. Gọi phép đo QA qua main trả409/PROJECT_CONTEXT_CONFLICT vì khác dự án đang mở; giữ context người dùng, không chuyển dự án để ép kiểm. Phép đo200/frameTimes được kiểm trên serverQA5192, chưa đo trên main sau restart. SELECTED_PERSON_FRAME_CLOCK_DEPLOY_SMOKE.json. Skill person.md và ZIP workspace/exports/chungauto-creative-v50-person-frame-clock.zip giữ11preset/5refs/1.635.653byte; 4 kiểm reference/package/snapshot sau cập nhật qua. Job đã snapshot vẫn giữ bản cũ.
