# Nguồn thư mục trong brief cho worker API · 05/11/2026

Khoảng trống đã xác minh: server từ chối API first-build/revise khi brief có đường dẫn file/thư mục, dù CLI/session dùng inspectChatSources và storage.attachSelected. Dùng lại snapshot sources của job và service nhập checksum/provenance; không tạo kho/side bar mới.

Worker API nhận hai tool khi job có sources: list_job_sources (offset/limit≤20) và attach_job_source(index). Danh sách trả tên/role/sourceIndex/truncated/recursive, không trả path tuyệt đối; model không gửi path tùy ý. Tên và brief là dữ liệu chưa chứng minh nội dung. Sau nhập, editor-context adoptSource kiểm SHA bằng stream, giữ lịch sử cũ và chỉ cho thêm đúng asset, cập nhật media catalog/provenance. Phải inspect_media/sample trước dùng; nhập không tự sửa timeline hoặc đánh dấu edited. API có nguồn brief giới hạn16lượt model, công việc khác6lượt; tối đa6frame hình, chưa tối ưu lô nhiều file.

Nguồn nhập qua storage giữ kiểm declared path/containment/symlink/source-stat/checksum/dedup/diskspace/workspace/job/revision; lỗi hoặc hủy không áp candidate. File đã nhập có thể còn trong kho nếu lượt dựng lỗi, không tự xóa tư liệu để rollback. Model hỗ trợ vision mới sample được ảnh; không có vision không nhận đã xem nội dung. Không tự quét toàn NAS, cài tool, tạo media trả phí hoặc đăng.

Kiểm: tests/editor-job-sources.test.mjs FFmpeg thật/mapping index/không path tuyệt đối/catalog adoption/provenance/dedup/invalid index/workspace/cancel qua. tests/api-job-sources-http-smoke.mjs HTTP revise thật với gateway giả lập5lượt list→attach→inspect→setbroll→done, nguồn thư mục local tổng hợp, checksum/role giữ, completion awaiting-review. Evidence API_JOB_SOURCES_HTTP_SMOKE.json, log workspace/logs/api-job-sources-http-smoke.log. Suite282/282 qua, workspace/logs/api-job-sources-suite.log. Syntax server/API qua.

Chưa model tự chọn cảnh, NAS thực/mất mạng/file lớn hoặc đầy đủ A-roll/B-roll nhiều file. Kiểm này thay đổi khả năng nhập API, không chứng minh worker tự dựng Q2. Codex CLI hiện login true, Claude false; chưa chạy model CLI trong lượt này. Inbox CLI hiện có giữ nguyên.

Đã triển khai main5180: xác minh dispatcher0/0, Home không có render/ASR project, tracking idle, không ContentOS mediaworker; restart đúngPID48004 và installer/start.ps1 báo ready. Không dừng app khác hoặc nhận việc người dùng.

## Dựng mới và skill Creative v43

Chạy tests/api-job-sources-http-smoke.mjs --first-build: HTTP /api/ai-job với v42 pin từ lúc tạo, source khôngaudio nên preparation silent/0words; gateway giả lập5lượt list→attach→inspect→set→done. Completion awaiting-review, role/hash file local giữ, không render. Evidence API_JOB_SOURCES_FIRST_BUILD_SMOKE.json, log workspace/logs/api-job-sources-first-build.log. Không giả đây là ASR, NAS hoặc worker modelthật.

Creativev43 bổ sung hướng dẫn list/attach/inspect/sample, role/truncated/recursive và khôngsuy hình từ tên, CLI dùng công cụ inbox riêng. Giữ11preset/4refs và snapshots job cũ; quick_validate/package/endpoint43 qua, presets đốichiếu v42 giữ nguyên. ZIP workspace/exports/chungauto-creative-v43.zip. Không bundle NAS/media/runtime/model, không restart cho template.

## Lọc danh sách nguồn đã chốt

list_job_sources nhận query (tên file, tối đa200ký tự, chuẩn Unicode NFC/không phân biệt hoa thường), role all/aroll/broll/source và sourceIndex. offset/limit áp dụng trên kết quả lọc; total là số khớp, catalogTotal là tổng file đã chốt. Index nhập giữ theo catalog gốc, không đánh lại từ0 khi lọc. Không quét lại NAS hoặc tìm theo nội dung hình. API schema và handler dùng chung giới hạn service.

Suite283/283 qua trong workspace/logs/api-job-sources-filter-suite.log. HTTP revise kiểm file khớp có index gốc1 nhưng nằm đầu trang lọc: list→attach1→inspect→set→done, hash/role đúng; workspace/logs/api-job-sources-filter-http.log và API_JOB_SOURCES_HTTP_SMOKE.json. Gateway là fixture local, không model thật. Main5180 đã restart đúngPID8560 sau xác minh dispatcher0/0, render/ASR Home, tracking idle và không mediaworker; installer báo ready. Không đổi skillv43 hoặc snapshot dự án đang có.

HTTP first-build chạy lại cùng kiểm index1 qua: API_JOB_SOURCES_FIRST_BUILD_SMOKE.json, workspace/logs/api-job-sources-filter-first-build.log, QA contentos-smoke-api-jobsources-6; nguồn silent/0words, completion awaiting-review. Cả revise và dựng mới nhập đúng B-roll sau lọc. Đây workerHTTP với phản hồi model giả lập, chưa chọn cảnh bằng thị giác hoặc NAS thật. Ping main5180 sau kiểm vẫn ContentOS0.1.0.

## Ngân sách lượt cho công việc có nguồn

Khoảng trống: chuỗi liệt kê→nhập→inspect→sample→đọc preset→chèn→sửa→kết thúc có thể vượt6lượt ngay với một cảnh. Khi có jobSourceContext, cho tối đa16lượt; mặc định khác vẫn6. Không tăng giới hạn6frame hoặc kích thước context, mỗiresponse8tool; dailyCalls và hủy/revision guard giữ nguyên. System nêu giới hạn và nhắc khi còn2lượt hoàn thiện candidate; onStep có maxSteps/remainingSteps, không giả phần trăm hoàn thành. Hết lượt vẫn lỗi, không trả candidate thành kết quả xong. Tăng trần có thể tăng chi phí; không có retry tự động.

Unit kiểm hoàn tất9lượt, giới hạn16lượt, hủy sau1response và mặc định6 qua; suite284/284 workspace/logs/api-source-workflow-budget-suite.log. HTTP first-build --extended với gateway giả lập10lượt, indexgốc1, nhập đúng checksum/role và awaiting-review qua: API_JOB_SOURCES_EXTENDED_SMOKE.json, workspace/logs/api-job-sources-extended-http.log. Các lượt đọc thêm trong fixture chỉ kiểm vòng điều phối, không đại diện chất lượng khảo sát nhiều cảnh. Main5180 restart đúngPID19592 sau dispatcher0/0/renderASRHome/trackingidle/no mediaworker, ready. Giữ skillv43/snapshot; không tuyên bố modelthật tự dựng/NAS hoặc tối ưu token đã đo.
