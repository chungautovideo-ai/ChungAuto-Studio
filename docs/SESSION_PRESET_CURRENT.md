# Preset mẫu cho worker CLI/session · 05/11/2026

## Vấn đề và cách tích hợp
WorkerQ2 thật đã đọc template/renderer để tự điền preset, log242561tokens tổng. Không khẳng định toàn bộtoken do đọcfile. API đã có createApiPresets cùng bộ điền Python/lxml; CLI trước chưa có công cụ. Tái sử dụng adapter đó, không tạo renderer/presetcatalog/UI riêng. Không thay kiểuchữ/animation/preset đã chọn hoặc đưa thêm menu.

## Dùng
- node editor/tools/chen-preset.mjs <việc> --claim ID → danh mục/fields/supported/candidateRevision từ snapshot đã chốt.
- Ghi work/preset-request.json trong thư mục việc: {presetId,at,dur,values,minhHoa}. values dùng key của danh mục, chỉ văn bản; không HTML.
- Nhiều mục: {items:[{presetId,at,dur,values,minhHoa},...]} từ1–20, CLIrequest≤32KB. Một revision/một lần ghi; lỗi bất kỳ mục nào giữ nguyên cả lô. Bằng chứng HTTP và Codex thật3mục: BATCH_PRESETS_CURRENT.md.
- Gọi lại cùnglệnh + --request work/preset-request.json --revision HASH để kiểm; thêm --apply để chèn candidate. Dùng revision mới sau mỗi lần chèn; retryrevisioncũ bịtừchối, không chèn trùng.
- at theo timeline dự án trước cắt, dur giây output; dùng kiem-ban-dung --from/--to khi đối chiếu lời. Không dùng outputStart làm at.

Service session-presets.mjs giữ claim/working/jobbytes/base/candidaterevision/snapshot integrity trước và sau thao tácasyncPython; ghi temp+rename candidate. Không ghi project gốc/build/export/post. Chỉ đọc snapshot đúng cạnh candidate, không fallback thưviện mới. Mẫu khôngsnapshot/unsupported/thiếufields/matte bị từchối. Các preset Broll không có adapter vẫn unsupported; không giả vờ chèn thành broll. Python/lxml nay ưu tiên runtime local và có bước cài lxml chính thức/doctor; kiểm PATH rỗng qua, chưa nghiệm thu máy sạch: PRESET_LOCAL_RUNTIME_CURRENT.md.

## Kiểm
Unit dùng fixture text+HTML: danh mục không HTML, thay thư viện vẫnpin, dryrun nguyênbyte, apply giữcamera/audio, provenance/font/css/anim đúng, retryrevision/wrongclaim/manualrevision/cancel/snapshottamper và hủygiữaPython bị từchối. Fullsuite311/311 tại workspace/logs/session-presets-suite.log trước bổ sung nhánhcancelasync; testmục tiêu sau bổ sung qua.

HTTPQA thật firstbuild→claim→CLIlist/dryrun/apply→completionreview, revise→CLIlist→completionreview qua, khôngrender. SESSION_PRESET_HTTP_SMOKE.json:11preset, catalog3057byte so template14659byte; đây là sốbyte, chưa đo token/model. Fixture đầu thiếu project.template.id nên revise khôngsnapshot đã bịtừchối đúng; ownclaim được --fail, giữ lại đểđốichiếu, bài sau thiếtlập template trướcgiao việc và qua. Không sửa dự án người dùng.

Skillv50/SKILL.md và inboxfirstbuild/revise có lệnh và giới hạn; ZIP/snapshot11preset5refs qua, xem SESSION_PRESET_SKILL_SMOKE.json. Không dùng đơn vị byte hoặc bàiunit để nhận quytrình đãtốiưutoken/fullquality.

## Codex thật và preview

`tests/real-codex-preset-smoke.mjs --run-local-codex` chạy trên bản sao QA có nguồn Q2 và mẫu v50. Job hoàn tất review trong56,2giây: dùng chen-preset để thêm đúng một ca-hook, title NÂNG CẤP XE/sub Chọn đúng nhu cầu tại projectAt3/dur2; toàn bộ text cũ và mọi trường khác so deepEqual giữ nguyên. Không xuất/đăng. Bằng chứng REAL_CODEX_PRESET_SMOKE.json; log CLI báo29271tokens tổng, chưa có phép so sánh cùng việc trước/sau hoặc cached/billedbreakdown nên không nhận tiết kiệm token.

Mở editor thật5180, preview tại output3,6s đã thấy chữ vàng và dòng phụ trắng đúng nội dung; ảnh REAL_CODEX_PRESET_EDITOR.png. Mốc projectAt3 hiển thị output2,5s do đoạn cắt trước đó, đúng hợp đồng clock. Kiểm hình này chỉ cho một khung, chưa nghe hoặc nghiệm thu toàn bộ animation/video/render. Hai test mục tiêu session-presets/api-presets qua sau nhánh cancelasync. Workspace khôi phục ChungAuto sau kiểm. Không cần restart main vì không sửa backend trong lượt này.
