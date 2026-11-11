# Chuẩn hóa màu và chống rung trong phiên chat — phân tích

Khoảng trống: API worker có normalize_source_color; skill phiên chat chỉ có phân tích màu read-only và che biển. Cần cùng service normalizeColor để Codex/Claude session tạo bản dẫn xuất, không sửa project đang duyệt. Không thêm màn hình: dùng lựa chọn và công cụ chuẩn hóa đã có của editor.

Lệnh dự kiến: chuan-hoa-mau.mjs <project> --claim ID (--segment ID|--broll ID) [--profile auto|...] [--technical-lut path] [--look-lut path] [--encoder auto|cpu|gpu] [--stabilize off|smooth|lock|fast] [--apply]. --list-luts chỉ đọc LUT của candidate. Giữ profile/LUT/màuđích709 và CPUfilters/NVENCencode của service hiệncó; không đoánLog hoặc dùng nâng sáng theo sắc màu thay tách người.

Giới hạn: first-build có candidate và claim đúng, statusworking/baseRevision không đổi, candidatebytes khôngđổi trong xửlý; lock riêng command để tránh hai lượt đồng thời ghi cùng candidate. Dừng/hủy job hoặc đổi revision thì không apply. Chỉ ghi candidate atomically với --apply, liveproject/source giữ nguyên; không export/post/receipt. Skill cậpnhật hướngdẫn lệnh, kiểmchain normalize→plate→beautyscan.

Kiểm: unit dịchvụ bằng adapter giả lập để kiểm claim/cancel/concurrency/atomic/no-livewrite; smokeFFmpegthật CPU đoạnQA và listLUT, wrongclaim khôngmutation, provenance/output709; không suy thành agent tự dựng toànvideo.

## Kết quả 05/11/2026

Đã triển khai editor/tools/chuan-hoa-mau.mjs và src/services/session-color-command.mjs. Cùng createApiColorNormalization như worker API, chỉ candidate first-build đã có claim. Các tham số không biết/trùng/thiếu giá trị bị từ chối; --list-luts không kèm tham số xử lý. --apply mới ghi candidate, các lượt khác chỉ tạo nguồn dẫn xuất và trả thông tin. Lock theo candidate, validate job/claim/live revision/candidatebytes trước và sau xử lý. SIGINT/SIGTERM truyền AbortSignal tới FFmpeg. Không xóa lock cũ tự động. Nguồn dự án gốc và liveproject không sửa; không xuất/đăng. Không có skinLift heuristic trong CLI này.

- tests/session-color-command.test.mjs: quyền claim, list/dry/apply, canceled/aborted/candidatechanged/livechanged, concurrency, không mất file hoặc đểlock sau lỗi. Bộ suite253/253 tại workspace/logs/session-color-suite.log.
- SESSION_COLOR_CLI_SMOKE.json: CLI/FFmpeg thật trên nguồn tổng hợp0.5s HLG→709, A-roll vàB-roll + deshake, libx264/audio giữ, sai claim/LogthiếuLUT/xửlýlạibịtừchối, nguồn/livegiữ. Khôngbenchmark màu nhìn hoặc chốngrung chấtlượng.
- SESSION_COLOR_INTEGRATION_SMOKE.json: HTTPstaging→claim→CLI→completion trênQ2crop1s, Rec709/deshakeCPU, candidate→livechỉsaucompletion, beautyoffgiữ. Khônggọi model, không xuất; không gọi benchmarkagent tựdựng.
- Inbox firstbuild inlệnh vớiclaim. Creativev28 chỉcậpnhậtrule,11presetv27giữnguyên/quickvalidatequa, bảncũgiữ; sửa dònggiới hạn cọ cũ. Main5180catalogv28/ping qua trong SESSION_COLOR_DEPLOY_SMOKE.json; CLI/inbox đọc trực tiếp nên khôngrestartbackend.

Một script cache tạo mẫu gặp Nodeexit -1073740791 không xuất stack; đã dừng lặp và dùng PowerShell để tạo mẫu rồi kiểm hash/preset/skill. Không coi đó là lỗi pipelineFFmpeg; nguyênnhân native chưaxácđịnh.

Goal ngànhxe chưahoàntất: nghiệmthu tựdựng từbrief+NAS bằngmodelthật/fullaudio/fulltimeline/throughput, detectorbiển/cutrecovery và trackingmask cònthiếu. Các kiểm ngắn là bằngchứng luồng lệnh, không thay nghiệmthu chấtlượng.
