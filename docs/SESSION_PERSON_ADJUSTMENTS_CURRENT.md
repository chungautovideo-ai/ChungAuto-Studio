# Chỉnh người/da trong phiên Codex/Claude CLI · 05/11/2026

## Đo riêng vùng người đã chọn (hiện hành)

chinh-nguoi-da.mjs có --measure-selected cho claimed revise, cùng công cụ report/chỉnh mức. Đọc report trước lấy nguồn/hash, sau đó:

```powershell
node editor/tools/chinh-nguoi-da.mjs <thu-muc-viec-sua> --claim ID --src inputs/a.mp4 --sha256 HASH --measure-selected
```

Không kèm mức hoặc --apply khi đo. Trả measurement/readOnly/appliedToCandidate:false; giao semantic∩SAM2 tốiđa12mẫu trongnguồnđangdùng, chưa cọ/stability/grade. Dùng servicechung vớiUI/API, khôngghi candidate/live/face hoặc tựbậtbeauty. Claim/job/candidate/baseRevision kiểm trước và giữa cácframe; đổi/hủy thì từchối. API cũng cótoolđoriêng; report thôngthường vẫn làsummarytoànfile. Chưa firstbuild hoặc tựquét/chọnmask.

Unit kiểm đọcreadonly/candidatebytes, saiowner, tham số mức, candidateđổivàcancel trongdecode qua. HTTP→claim→CLIthật/FFmpeg12frame→dryrun/apply20→completionreview→browser25/Undo20/Redo25/Save/reopen qua trênQA6s/maskđãlưu. SESSION_SELECTED_PERSON_MEASUREMENT_SMOKE.json và SESSION_PERSON_INTEGRATION_SMOKE.json/log session-selected-person-measurement.log. Khôngmodelthật/NAS/render hoặc nghiệmthuqualitytoànvideo. Suite289/289 session-selected-person-suite.log. Inbox in cờmới; không cầnrestartserver vìCLI/inbox đọc từđĩa.

Creativev46parent45 hướngdẫncờCLI, giữ11preset/4refs vàjobsnapshotcũ; quick_validate/package/APIversion46/11presetqua, ZIP workspace/exports/chungauto-creative-v46.zip. Xem SELECTED_PERSON_EXPOSURE_CURRENT.md cho service/UI/API. Các đoạn bên dưới giữ bằngchứng lịch sử từv41, câu chưađoriêng làgiớihạn lúcđó.

Khoảng trống: API revise có công cụ chỉnh mức nhưng phiên CLI chỉ đọc được report của project đã lưu. Dùng service applyPersonAdjustment chung, giữ editor/renderer và ba thanh đang có; không thêm menu. Không thay skill snapshot của job cũ.

## Luồng

Hộp việc revise in hướng dẫn chinh-nguoi-da.mjs với thư mục việc và claim. Chạy không có mức để đọc report của candidate, media và face theo dự án gốc. Lấy src/SHA/phạm vi/mức; chỉ gửi mức người dùng yêu cầu. Ví dụ:

```powershell
node editor/tools/chinh-nguoi-da.mjs <thu-muc-viec-sua> --claim ID
node editor/tools/chinh-nguoi-da.mjs <thu-muc-viec-sua> --claim ID --src inputs/a.mp4 --sha256 HASH --body-white 20
node editor/tools/chinh-nguoi-da.mjs <thu-muc-viec-sua> --claim ID --src inputs/a.mp4 --sha256 HASH --body-white 20 --apply
```

Bỏ --apply chỉ kiểm, không ghi. Lệnh yêu cầu việc revise working có claim, candidate đúng work/candidate-project.json, hash project gốc đúng baseRevision. Kiểm lại job/candidate/revision trước atomic rename. Nguồn/hash/mask/off kiểm bằng service chung. Chỉ ghi candidate; không build/render/đăng hoặc hoàn tất việc. Dùng ai-inbox --done theo luồng hiện hành sau khi sửa xong. Không tự tăng mịn da khi chỉ muốn sáng; ngoài khoảng đã chọn không áp ba mức toàn thân.

## Kiểm chứng và giới hạn

tests/session-person-command.test.mjs: report candidate, dry-run giữ byte, apply giữ live project/face và các mức khác; từ chối claim sai, cancelled, candidate sai vị trí, live revision thay đổi, nguồn đổi và beauty off. Chưa chạy model Codex/Claude thật nhận việc hoặc nghiệm thu final cho lệnh mới. Chưa hỗ trợ first-build. Report không đo exposure riêng cá thể, lệnh không tự chọn/theo dõi người. Không thay bằng chứng kiểm ngắn thành chất lượng ngang CapCut.

Toàn bộ suite 277/277 qua: workspace/logs/session-person-suite.log. Kiểm cú pháp ai-inbox.mjs và chinh-nguoi-da.mjs qua. Không cần restart server: thay đổi là CLI/inbox đọc ở lần gọi tiếp theo; chưa chạy nhận việc thật để tránh nhận nhầm việc người dùng đang chờ.

## HTTP → CLI → completion → editor

tests/session-person-integration-smoke.mjs tạo workspace/dự án QA riêng, nhập video6s và mask SAM2 đã lưu thật từ fixture chuyển động. HTTP tạo revise chế độ session, claim service nhận đúng việc QA, gọi tiến trình CLI thật để đọc report/dry-run/apply bodyWhite20. Dry-run giữ candidate, apply giữ project gốc đến completion; HTTP complete dừng awaiting-review. Sau completion, camera khác/mask/face giữ nguyên và HTTP mở lại có20.

Browser Chrome thật mở Studio/Bộ lọc/Làm đẹp, chọn nguồn inputs/raw.mp4 thấy20, sửa25/Undo20/Redo25/Lưu/mở lại25. Mask và face vẫn giữ sau browser Save, không Runtime exception. Ảnh SESSION_PERSON_INTEGRATION_1280.png và _390.png đã xem: slider25 xuất hiện trong nhóm đang có; ảnh390 có thanh công cụ ngang tràn vùng nhìn nên không nhận toàn bộ shell mobile đã tối ưu. Không đổi UI trong hạng mục này.

Bằng chứng SESSION_PERSON_INTEGRATION_SMOKE.json, log workspace/logs/session-person-integration-smoke.log; QA workspace/content/2026-11-04/contentos-smoke-person-cli-2. Không gọi model/provider hoặc render/đăng. Đã khôi phục active workspace và dừng riêng process QA; server5180 không restart. Đây kiểm đường ống dữ liệu và thao tác editor, chưa chất lượng model hoặc toàn bộ mask/video final.

Creative v41 thêm quy trình CLI revise và doctor -Person trong references/person.md, giữ11preset/4refs, snapshot job cũ không đổi. quick_validate/package qua, ZIP workspace/exports/chungauto-creative-v41.zip (1.63MB; chưa bundle model/runtime/asset ngoài), endpoint5180 trảversion41 và presets đối chiếu v40 giống nhau. Không cần restart thư viện. Bằng chứng integration mới nhất sau kiểm toolbar dùng QA contentos-smoke-person-cli-4, log workspace/logs/mobile-toolbar-person-smoke.log; ảnh tương ứng cùng tên bị cập nhật theo lần chạy mới nhất.
