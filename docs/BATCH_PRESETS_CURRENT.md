# Chèn nhóm preset cho worker CLI/session · 05/11/2026

## Vấn đề và triển khai
Q2 helperfirstbuild có16lần chèn preset và output từng mục; tổngCLI284988tokens không chứng minh nguyên nhân hay tiết kiệm. Cần cho phép AI chuẩn bị một nhóm ý rồi gọi công cụ một lần, không thay trình dựng hay thêm menu.

session-presets nhận request đơn như cũ hoặc {items:[{presetId,at,dur,values,minhHoa},...]},1–20mục. Mỗi mục vẫn dùng cùng APIadapter và snapshotđãchốt; toàn lô dùng một expectedRevision, chỉ renamecandidate một lần khi mọi mục thành công. Lỗi ở mục sau/hủy/xung đột thì không ghi bất kỳ mục nào; không sửa live. Dryrun trả summaryitem, không HTML; apply trả revisionmới, replay bịtừchối. CLI vẫn giới hạn request32KB; mẫu khôngsupported không tự được hỗ trợ nhờ lô.

Skillv50 và inbox firstbuild/revise có schema lô, giữ11preset/5reference; không in cảproject sau từng lần. ZIPworkspace/exports/chungauto-creative-v50-batch-presets.zip, BATCH_PRESET_SKILL_SMOKE.json kiểmpackage/snapshotqua. Chưa nhận giảm token từ việc giảm số lệnh.

## Kiểm
Hai test session-presets/api-presets qua: lô hỗn hợptext/HTML, dryrun byteunchanged, lỗi mục2 khôngghi mục1,1–20guard, trườnglạ/null, apply giữcamera/audio/live/job, replay và hủygiữaPython. HTTPCLI firstbuild2preset→completionreview và revisecatalog→review qua, SESSION_PRESET_BATCH_HTTP_SMOKE.json, khôngrender/model.

Bài Codex đầu/nhắc lại gặp ECONNRESET sau upload/copy fullmedia, chưa có job AI giao; không dùng các bản QA đó như nghiệm thu. Harness chuyển HTTPQA sang Connection:close để không tái dùng socket idle trong lúc copy media; lần sau đã submit worker. Không thay kết nối app hoặc khởi động lại main5180. Kết quả model cập nhật khi terminal, không đoán từ claim/log đang chạy.

Codex thật hoàn tất review69,25s: request3items đúng ca-hook/ca-benefit/ca-stat, thêm2texts/1block; các text/block cũ và mọi trường khác deepEqual giữ nguyên. REAL_CODEX_PRESET_BATCH_SMOKE.json, project contentos-qa-real-codex-preset-batch-3. Khôngrender/post; chưa kiểm preview lô mới hoặc benchmarktoken. Workspace đã về ChungAuto. Không cần mainrestart vì helperCLI được đọc khi chạy, không sửa backend.
