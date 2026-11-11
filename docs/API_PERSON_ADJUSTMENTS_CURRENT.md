# AI sửa mức người/da theo nguồn

Khoảng trống: read_person_exposure chỉđọc; camera khôngtrongAPIallowedFields, nên yêu cầusángriêngngườichưaápquaAPI. DùngcùngsourceAdjustments editor/render, khôngthêmUI/menu hoặc schema. Côngcụ riêng set_person_adjustment cho lượt Nhờ AI sửa, không firstbuild (keep/offđãchốt). ChỉsửapersonLight/bodyWhite/bodySmooth0–100 ởnguồnmaskhiệnhợp lệ, hashphảikhớp; fieldsđểtrốnggiữmứcđangdùng của nguồn. Giữmask/ranges/faceeffects/mọinguồnkhác, khôngtựscan/áp suggestion/xóa range.

Reporttrướcđểlấysrc/hash/mức/scope. beautyoff hoặc automotivebeautyoff từchối, cầneditorbật/chỉnhlạichínhsách; thiếumask/stale/unavailablescopetừchối. Tácđộngchỉcandidate, completionrevise/review theo luồngcũ. Tooldescriptionyêucầuchỉkhibriefmuốnchỉnhngười/da; khôngtuyênbốheuristic đọcintent thaymodel. Preview/finaldùngcùngrendererđãkiểm, hạngmụcnàycầnHTTPworker→Save/camera/Undo giữmaskvàguarantees, chưabenchmarkqualitymodelthật.

## Kiểm chứng và triển khai · 05/11/2026

Đã kiểm partial levels, hash nguồn, chính sách off và giữ các trường camera khác trong tests/person-adjustments.test.mjs. API phải đọc read_person_exposure trước set_person_adjustment; yêu cầu sớm hoặc nguồn đổi bị từ chối. Toàn bộ suite 276/276 qua, log workspace/logs/person-adjustments-suite.log.

tests/api-person-adjustments-http-smoke.mjs đã đi qua HTTP /api/ai-revise và worker bằng gateway giả lập chạy local, dùng mask SAM2 đã lưu thật trong dự án QA. Luồng read_person_exposure → set_person_adjustment(bodyWhite:20) → hoàn thành dừng chờ duyệt; các trường camera khác và dữ liệu khuôn mặt giữ nguyên. Bằng chứng: API_PERSON_ADJUSTMENTS_HTTP_SMOKE.json; log workspace/logs/api-person-adjustments-http-smoke.log. Không gọi provider trả phí, không render hoặc đăng bài. Kiểm này chưa xác nhận chất lượng quyết định của model thật hoặc Undo/Save qua browser cho lượt sửa API.

Creative v40 giữ 11 preset và 4 chuyên đề, bổ sung hướng dẫn report-first và chỉ sửa mức được yêu cầu trong references/person.md. quick_validate qua; gói workspace/exports/chungauto-creative-v40.zip. Sau restart an toàn, endpoint thư viện tại 5180 trả version40/11 preset/4 chuyên đề. Job cũ giữ snapshot cũ.

Renderer/schema không đổi trong hạng mục này; chưa xuất lại video để nghiệm thu hình ảnh. Công cụ chỉ dành cho API revise; CLI/session chưa có lệnh tương đương. Không tự quét, chọn người, hoặc bật làm đẹp ở first build. Không suy từ kiểm HTTP giả lập thành đã tự động chỉnh đẹp toàn video.

Cập nhật tiếp: đã thêm lệnh CLI/session riêng cho revise, xem SESSION_PERSON_ADJUSTMENTS_CURRENT.md; giới hạn first-build và chưa nghiệm thu model thật vẫn giữ.
