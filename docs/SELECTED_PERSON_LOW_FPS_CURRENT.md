# Đo sáng riêng người ở đuôi video FPS thấp

Lỗi đã gặp khi QA4fps: seek0,9s trên video1s không trả ảnh vì lệnh FFmpeg tìm khung kế tiếp, dù khung0,75s còn hiển thị tới cuối. Không được lấy ảnh tùy ý ở mốc sớm rồi coi là ảnh đúng mốc mặt nạ.

Giữ decode thường cho mốc có ảnh. Chỉ khi kết quả rỗng và requestedTime nằm trước duration, probe PTS vùng cuối nguồn; kiểm không còn frame sau requestedTime, quy về sourceclock với start_time trước khi lấy đúng khung cuối đang giữ. Semantic/SAM2 vẫn lookup ở requestedTime, không đổi khoảng chọn hay kéo mask. Báo tailFrames với requestedTime/decodedFrameTime để phân biệt. Nếu không xác minh được thì lỗi; giữ guard HDR,abort,revision,source/mask read-only. Không đổi UI hoặc tự Apply.

Phạm vi kiểm: nguồn4fps có khung cuối sáng khác ba khung trước, nonzero start, endoutside/abort, phép đo với mask tổng hợp; chưa cameraVFR/Bframesrotation thật hoặc đa người/chekhuất. Probe fallback giới hạn timeout15s/max4MB; không quét/tải model mới.

Kiểm toàn bộ Node suite 375/375 qua, log workspace/logs/selected-person-low-fps-suite.log. Sau cập nhật skill, 8 kiểm mục tiêu (phép đo/HDR/FPS thấp/template package/reference/snapshot) qua. HTTP server QA: HLG/PQ trả422 trước decode, SDR200 có requestedTime0,7916667/decodedFrameTime0,75; source/mask/project/workspace giữ nguyên, xem SELECTED_PERSON_LOW_FPS_HTTP_SMOKE.json. Không thay renderer hoặc UI. Skill person.md giải thích tailFrames và không dời khoảng theo decodedFrameTime.

Đóng gói workspace/exports/chungauto-creative-v50-low-fps-person.zip: 1.635.681 byte, parse lại giữ 11 preset/5 references. Main5180 nạp khi dispatcher0/0, render/asr/personTracking idle và không media worker; xác minh đúng command trước dừng PID67548, mới21284/pingOK. Bằng chứng SELECTED_PERSON_LOW_FPS_DEPLOY_SMOKE.json. Không có kiểm UI native mới.
