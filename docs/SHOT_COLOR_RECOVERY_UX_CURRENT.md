# Từ gợi ý màu HDR sang chuẩn hóa nguồn

## Phân tích UX trước triển khai

Người dựng chọn cảnh → Phân tích màu; với HDR, service đã báo cần709 nhưng dialog chỉ có Đóng và Áp dụng bị khóa. Cần đóng rồi tìm lại Chuẩn hóa màu ở inspector, dễ nhầm tăng sáng toàn hình với chuyển hệ màu. Bằng chứng: code contentos-shot-color.js/editShotColor/editColorNormalization và SHOT_COLOR_INPUT_HTTP_SMOKE.json; khảo sát VEK hiện hành VEK_UI_UX_AUDIT_2026-11-03.md. CUA lượt này đọc được inventory nhưng getTab14 báo browser.user unavailable; chưa xem UI mới hoặc khảo sát CapCut mới.

Giữ dialog/action/token VEK. Lỗi có code COLOR_NORMALIZATION_REQUIRED/status422 mới hiện nút Chuẩn hóa màu nguồn…, dẫn vào editColorNormalization cùng đoạn/nhóm. Không đoán loại lỗi từ chuỗi tiếng Việt, không chuyển nguồn/quét/render tự động, không tạo sidebar/tab mới. Validation project/revision/dirty/target vẫn phải qua trước chuyển; lỗi revision/khác không hiện nút sai. Nút Đóng vẫn dùng được, Áp dụng màu vẫn khóa khi không có gợi ý. Không thêm hình hoặc asset.

Responsive: giữ flexwrap của hàng nút, nhãn chuẩn hóa cho phép xuống dòng; dialog maxheight/overflow cũ. Focus/native dialog/390px cần kiểm thật khi browser khả dụng. Không coi DOM giả là nghiệm thu focus hoặc tương phản. Dữ liệu/Undo/Save dùng đường normalization hiện hữu, không đổi schema. Kiểm service code/status bằng HTTP; test dialog nhận code/ẩn action khác/validate trước đóng, cú pháp và suite; worker phải nhận lỗi có thể xử lý theo lời hướng dẫn mà không retry cùng phép đo HDR.

## Kết quả

Service trả code COLOR_NORMALIZATION_REQUIRED/status422. Dialog chỉ hiện action khi nhận đúng code và có callback, giữ Applydisabled; validate thất bại giữ dialog và không mở xử lý. editShotColor nối callback vào editColorNormalization cho đúng target/group, lỗi sau chuyển được báo qua toast. Không tự tạo/xuất/áp màu. Tooldescription API hướng normalize theo brief thay vì retry phân tíchHDR; skillv50color nêu giới hạn quyền và gợi ý.

Test dialog production qua VM/DOMgiả3ca: chỉ hiện đúng lỗi, chưa bấm không chạy, bấm mở1lần, stale không mở/không đóng, khôngcallback/kháclỗi ẩn action. Chưa nativefocus/responsive. Worker với gateway tổng hợp4lượt và FFmpeg thật: analysisHDRlỗi→normalizeCPU→analysis709/3mẫu→stop; không đưa bytesảnh vào prompt, projectđầu vào/filegốc/chữ giữ nguyên, chưa ápgrade. Không là modeltrảphí hoặc tự động suy luận đã nghiệm thu.

Suite351/351, log workspace/logs/shot-color-recovery-suite.log. HTTPQA riêng5192 kiểm code422, pipelineHLG/PQ/stale409/restore/readback và workspace/nguồn giữ nguyên; server41996 đã kết thúc. SHOT_COLOR_INPUT_HTTP_SMOKE.json hiện trỏ fixture da20fe9d-2f37-4803-949b-1bcfe01de12d; bằng chứng HTTP trước đó có fixture riêng trong tài liệu nguồn. Main5180restartidle/đúngPID1948→63880/pingready: SHOT_COLOR_RECOVERY_DEPLOY_SMOKE.json. StaticHTTP hai module khớpdisk, ZIPv50hdr-recovery parse11preset5refs: SHOT_COLOR_RECOVERY_SMOKE.json. Không sửa snapshotjob cũ. Chưa browser mới do getTab báo browser.user unavailable, cameraHDRLogthật hoặc finalrender mới.
