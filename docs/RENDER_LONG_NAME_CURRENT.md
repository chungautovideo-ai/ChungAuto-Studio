# Tên dự án dài khi render trên Windows

QA trước tại contentos-qa-broll-entrance-015671e3-51d6-4174-864b-c58e2782e42e thất bại ENOENT ở HyperFrames mkdtemp transaction: tên dự án dài bị lặp ở thư mục snapshot và tên file nội bộ. Nguồn còn truy cập được nhưng tên transaction vượt giới hạn thực tế của công cụ trên Windows.

Chọn output nội bộ cố định renders/render.mp4 trong từng snapshot UUID riêng. CLI và HTTP đều dùng cùng hằng; finalizer nhận sourceOutput riêng để kiểm, chuẩn hóa, copy về tên xuất người dùng đã chọn, giữ chống ghi đè, hash/sidecar/snapshot/revision và đường dẫn Hoạt động. Snapshot cũ/finalizer callers không truyền sourceOutput giữ mặc định output như trước. Không rút tên dự án, đổi file nguồn hoặc làm mất tên bản xuất. Không đổi UI/skill dựng vì đây chi tiết runtime, không nên thêm lệnh kỹ thuật vào brief.

Giới hạn: chỉ loại bỏ tên lặp trong transaction renderer; đường dẫn thư mục dự án/NAS vốn quá dài vẫn có thể vượt giới hạn. Cần kiểm finalizer sync/async tên nguồn và đích khác nhau, lỗi không có nguồn, không ghi đè và render CLI/HTTP thật với tên dài từng tái hiện.

## Bằng chứng

Ba kiểm finalizer sync/worker qua: tách tên nguồn/đích, sidecar/hash, không ghi đè, lỗi nguồn thiếu và độ đáp ứng eventloop. Suite370/370 qua tại workspace/logs/render-long-name-suite.log.

`node tests/broll-entrance-final-smoke.mjs --long-name --video-only` final2s1080×1920 qua trên tên cùng dạng từng lỗi (contentos-qa-broll-entrance-UUID), giữ tên final đầy đủ.5frame màu/transition đúng, hash/bytesverified, project giữ nguyên: RENDER_LONG_NAME_CLI_SMOKE.json.

`node tests/render-long-name-http-smoke.mjs`: serverQA5194 với project tên dài riêng, HTTPfinal2s qua; có renders/render.mp4 trong snapshot và bảnfinal tên đầy đủ trong dự án; sidecar revision/snapshot/hash/bytes khớp, metadataError không có. Project và workspace byte giữ nguyên; serverQA dừng sau terminal, không lấy timeout làm lý do dừng. RENDER_LONG_NAME_HTTP_SMOKE.json. Không chạy UIbrowser; đây đườngHTTP render thực, không nghiệm thu thao tác nút.

Main5180 đã nạp sau kiểm dispatcher0/0/renderASRtrackingidle, khôngmediaworker và đúngPID/command; pingContentOSOK, RENDER_LONG_NAME_DEPLOY_SMOKE.json. Không đổi quy tắc dựng/preset/skill ở hạng mục runtime này. Không thử đường dẫn NAS bất kỳ hoặc tuyên bố bỏ mọi giới hạn path Windows.
