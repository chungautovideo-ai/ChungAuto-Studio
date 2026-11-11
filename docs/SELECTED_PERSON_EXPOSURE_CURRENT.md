# Đo sáng trong vùng người được chọn

Phân tích bổ sung workerAPI: dùng cùng service local và mask đã lưu; tool đo chỉ đọc sau read_person_exposure lấy đúng src/hash. Tốiđa2phépđo mỗi lượt dựng, kết quả summary/scope/times khôngRLE/ảnh; không tăng visionframebudget vì khônggửiảnh lênmodel. Chỉnh mức vẫn tool set_person_adjustment riêng, giữ beautyoff/claim/revision. Không tựquét/chọnngười, khôngđoán hệmàu. Khôngthêm UI/adapter hoặc sửa liveproject.

Phân tích UX trước triển khai: panel Bộ lọc→Làm đẹp→Người & da toàn thân có nguồn, khoảng chọn SAM2 và nút áp gợi ý từ summary semantic toàn file. PERSON_SELECTION_AI_SCOPE_CURRENT đã nêu summary gồm tất cả người, nhưng UI không phân biệt ngay tại nút gợi ý. Người dùng chọn người tối cạnh người sáng có thể nhận mức sai. Dùng lại mẫu đo→xem→áp từ PERSON_EXPOSURE_SUGGESTIONS_CURRENT, dialog/mặt nạ SAM2 hiện có và controls VEK; không tuyên bố đã quan sát thuật toán CapCut.

Luồng đích: chọn nguồn đã quét/chọn người→lưu→Đo sáng người được chọn→đọc tối đa12frame phân bố trong phần nguồn đang dùng có mask→hiện summary và gợi ý→người dùng áp hoặc chỉnh tay. Đo không tự bật làm đẹp, không sửa project/face.json, không gọi model hoặc mạng. Tách rõ số đo semantic∩SAM2, chưa gồm cọ/stability hoặc hiệu chỉnh màu hiển thị. Chỉ đo khoảng có mặt nạ hợp lệ/hash đúng; không lấy người ngoài vùng hoặc fallback toànngười. Không đủ3mẫu/vùng quá nhỏ/ánh sáng biến đổi thì không gợi ý.

Tích hợp app.js nhóm hiện có với nút outline, help/loading/error, giữ ba thanh và Undo/Save. Đổi nguồn/project/revision/selection vô hiệu kết quả tạm. Khi có selection nhưng chưa đo riêng thì không hiện nút áp gợi ý toàn file. API report cũng từ chối gợi ý toàn file cho selection, vẫn báo measurementScope thật. Không thay renderer/schema/bảnxuất. Responsive nút wrap và aria-label theo controls chung; kiểm UI scoped/unscoped và request lỗi, service ảnh tổng hợp khác độ sáng/hash/range/source clock/cancel/read-only; ảnh/video thật chỉ chứng minh phạm vi mẫu đã đo.

## Kết quả triển khai

measureSelectedPersonExposure/POST /api/person-exposure/selected đọc mặt nạ đã lưu, source/hash/revision/workspace, giao semantic∩SAM2 bằng helper renderer; tốiđa12khung trong các khoảng nguồn đang dùng. Gộp mẫu trùng cùngframe semantic/SAM2, không nhân mẫu để đạt ngưỡng3. Một phép đo tại một thời điểm, FFmpeg từngframe tốiđa15s, abort/validate giữa cácframe, kiểm stat nguồn và face.json sauđo; read-only. Summary là RGB nguồn hiểnthị trước cọ/stability/grade, không phải hiệu ứng cuối. API report khôngtrả gợiýtoànfile cho selection; mức userchỉđịnh vẫn chỉnh được.

UI dùng nút Đo sáng người được chọn trong nhóm đangcó; loading/dirty/revision/source/selection checks, cachetạm bị vô hiệu khi trackmetadata thay. Hiện phạmvi/sốmẫu và gợiý hoặc lýdo thiếu. Áp gợiý giữ mức mịn đãchọn, không tự resetmịn; không tựbậtbeauty. Không lưu kếtquả vào schema hoặc thayrenderer.

Unit đo nguồn tổnghợp nửa trái30/nửa phải230 chỉlấytrái, loại ngoài khoảng/cancel/hash/sốmẫungắn/read-only qua. Suite287/287 selected-person-exposure-suite.log. Browser/HTTPFFmpeg thật trên QA6giây/maskSAM2 đãlưu,12frame personmedian.424/skin.525 khôngđềxuất nâng; revisionstale từchối, project/face giữbyte, UI 1280/390 nút/hỗtrợ rõ/pageErrors0. SELECTED_PERSON_EXPOSURE_SMOKE.json/log selected-person-exposure-browser.log; haiảnh đãxem. Chưa UI Applygợiý dương/UndoSave trênluồngmới, chưa multiplepeoplethật/chekhuất hoặc đo sau màu. Khôngrender vìkhôngđổi renderer.

Creativev44 parentv43 thêm hướngdẫn phạmviđo, giữ11preset và4refs; quick_validate/package/catalog qua, ZIP workspace/exports/chungauto-creative-v44.zip. Jobcũ giữsnapshot. Bảnv44 chưa hướngdẫn workerAPI gọi phépđo; xem bảnv45 bên dưới. Main5180restart đúngPID12332 sau kiểmdispatcher0/0/renderASRHome/trackingidle/no mediaworker, pingok. Catalog cóv44; /templates-media/.../SKILL.md trả404 vìroute này chỉphục vụmedia, khôngcoi làskillmất.

## Worker API và Apply/Undo/Save

API revise có measure_selected_person_exposure sau read_person_exposure đúng src/hash, tốiđa2phépđo/lượt, service source/hash/mask/usedranges và signal/revision giữ. Chỉsummary/scope/times lêncontext, khôngRLE/ảnh; khôngtăng visionbudget hoặc tựapply. Unit trước-report từchối, cap2, đọc khôngsửa candidate vàtool sửa riêng qua. HTTP gatewaygiảlập4lượt report→đoFFmpeg12frame→sửa bodyWhite20→done awaiting-review; camera/mask/face giữ, khôngrender. API_SELECTED_PERSON_EXPOSURE_HTTP_SMOKE.json/log api-selected-person-exposure-http.log. Khôngmodelthật hoặc khẳngđịnh worker tựquyếtmức sángđẹp.

Browser --dark dùng cùngQA6s nhưng làm tối RGB cóchủđích, cậpnhật nguồn/hash mặt nạ, không giả footage camera mới. personmedian.125/skin.231, gợiýpersonLight30/bodyWhite0. Apply30→Undo0→Redo30→Save→reopenHTTP30 qua, bodySmooth17giữ, mask vàface khôngđổi. SELECTED_PERSON_EXPOSURE_DARK_SMOKE.json/log selected-person-exposure-dark-browser.log. Ảnh1280/390 chụp trướcApply vớigợiý, chưanghiệmthu finalvideo hoặc tôngda tựnhiên. Suite288/288 api-selected-person-exposure-suite.log.

Creativev45 parent44 hướngdẫn tool report/measure/adjust, giữ11preset/4refs vàsnapshotscũ; quick_validate/package/APIversion45/11preset qua. ZIP workspace/exports/chungauto-creative-v45.zip. Main5180restart đúngPID55556 sau kiểmdispatcher0/0/renderASRHome/trackingidle/no mediaworkers. Khôngsửa renderer nên khôngrenderlại. Goaltoànbộ cònworkflowmodelthật/NAS/multipeople/installer/throughput.

CLI đã bổ sung --measure-selected cho chinh-nguoi-da.mjs trênclaimedrevise, kiểm claim/candidate/job/revision suốtđo, readonly và khôngkèm mức/apply. HTTP→CLIthật/FFmpeg→completion→browserqua, suite289/289; skillv46parent45 giữ11preset/4refs, validate/package/endpointqua. Xem SESSION_PERSON_ADJUSTMENTS_CURRENT.md/SESSION_SELECTED_PERSON_MEASUREMENT_SMOKE.json. Khôngchạy lại modelCLI vì sharingviolation đãbiết, khôngthay renderer hoặc tựrender.


## Kiểm bản xuất chỉnh sáng người được chọn · 05/11/2026

Đã xuất hai bản H264 final từ hai dự án QA riêng trên cùng nguồn 6,006 giây: personLight 0 và 30, giữ bodySmooth 17 và mặt nạ semantic/SAM2. Cả hai lệnh xuất thành công, hash/sidecar artifact được kiểm. SELECTED_PERSON_FINAL_SMOKE.json ghi bốn khung tại 0,5 / 2 / 3,5 / 5 giây: độ sáng vùng trong người tăng trung bình 10,20–11,53 trên thang 0–255; nền tăng khoảng −0,000014 đến 0,00438. Chênh lệch RGB tuyệt đối của nền 0,43–0,47 do encode/resampling; không có pixel nền lấy mẫu nào lệch kênh trên 8. Vùng biên mask ±4 pixel được loại khỏi phép đo.

Ảnh SELECTED_PERSON_FINAL_CONTACT.png đã xem: hàng trên mức 0, hàng dưới mức 30. Bằng chứng này chỉ kiểm bốn khung của QA ngắn có nguồn làm tối nhân tạo, không nghiệm thu mọi khung, viền tóc, tông da tự nhiên, nhiều người/che khuất hoặc full production. Chưa đối chiếu pixel trực tiếp live preview với final trong lượt kiểm này. Không đổi renderer, không tăng phiên bản skill. Log: workspace/logs/selected-person-final.log; test: tests/selected-person-final-smoke.mjs.
