# Vùng che biển 4 góc — Creative v22, 05/11/2026

Đã có code geometry dùng chung editor/lib/plate-regions.js, service nhận quads và lưu provenance, tracker lấy chính4điểm đầu thay vì boundingrectangle; opticalflowaffine vẫn giữ. UI details8tọađộ/vùng, canvaspolygon+điểmsố; sửa rectangle resetpolygon, thaygóc invalidatespreview. Không cho mở trùng dialog. CLI --quads-json/API quads cùng candidate/review/sourceframe gate. Server whitelist module mới để browser import được.

tests/plate-regions.test.mjs kiểm convex/cross/concave/duplicate/tiny/outside/mutualexclusive/clone/legacy dimensions. tests/multi-plate-privacy.test.mjs kiểm trackerpolygon thực và tâmche đủ30frame, quadhìnhđầu giữ đúng; plate-privacy.test.mjs kiểm CLI/API quads candidate/hash/audio/restore. Suite246/246 tại workspace/logs/plate-quad-suite.log; relatedCLI/API rerun sau đổi harness quads qua. Browser PLATE_QUAD_BROWSER_SMOKE.json ở1280/1920/390: chỉnhgóc/LưuUndo/reopen/restore/review qua, ảnh390 đã xem, không lỗi trang. Đã sửa harness bấm lặp gây nhiều dialog, product cũng chặn mở trùng.

Footage thật PLATE_REAL_QUAD_SMOKE.json: broll_den8s1728×3072,240frame/audio, seed4góc bằng tay từ contactảnhnguồn; tracker13.544s, ảnh PLATE_REAL_QUAD_CONTACT.png đã xem8mẫu. Chưa fullplayback/mọiframe/độkínmọibiển. Final và triển khai đang kiểm; không tuyên bố đã triển khai cho tới khi có bằng chứng. Skillv22 parentv21 giữ11preset/quick_validate qua. Không sửa nguồn gốc/dự án người dùng.

## Phân tích UX trước code

Kiểm final thật: hai lượt HyperFrames6workers đã log artifactvalidated/complete nhưng child exit3221226505 trên Windows; xuat-video giữ ok=false, không finalize/copy bản đó. Không thay bằng kiểm file tồn tại. Lượt thứ3 PRODUCER_LOW_MEMORY_MODE=true xác minh1worker vẫn exit3221226505; không đổi mặc định app hoặc khẳng định do GPU/worker. Các snapshot fbdd8b3e-f314-4fb8-8021-c340e2eb3103, eb499eb2-223b-427d-b57f-df5c4b103445, f508376e-510f-45ed-9379-0cd1093982a7 giữ chẩn đoán; bản final chữnhật đã nghiệm thu trước vẫn nguyên. Finalpolygon chưa nghiệm thu, lỗi render đang cần xử lý.

Main5180 đã restartidle sau cả3lượt terminal, dispatcher0/0/renderASRnull/khôngRemotionworker/PIDđúng. /lib/plate-regions.jsHTTP200, /api/templates?id=chungauto-factory-quang-cao-v22 trảversion22. Suite246/246rerun sau duplicate-dialogguard; browser1280/1920/390rerun guard qua. Không gọi việc triển khai này là finalrender đã qua.

Kiểm footage broll_den cho thấy hình chữ nhật che thừa cản xe khi biển nghiêng. Giữ hộp Che biển số, chọn vùng1–8 và thao tác kéo chữ nhật nhanh. Thêm disclosure Chỉnh 4 góc cho vùng đang chọn; mỗi góc có X/Y0–1 theo khung nguồn, thứ tự trên trái→trên phải→dưới phải→dưới trái, vẽ polygon/điểm số trên canvas. Không thêm sidebar. Mỗi vùng có polygon riêng, chuyển vùng giữ dữ liệu; sửa rectangle/kéo lại sẽ đặt lại4góc của vùng đó về rectangle mới, cần ghi rõ. Chỉ khi người dùng sửa4góc mới dùng quads trong request; luồng rectangle cũ giữ roi/rois.

Validation dùng chung service/UI:1–8polygon,4điểm hữu hạn trong0–1, convex có thứ tự, không tự cắt/điểm trùng/diện tích quá nhỏ; không âm thầm sửa thứ tự. Backend từ chối cả roi/rois/quads cùng lúc. Giữ tracker optical-flow affine và padding18%; không tuyên bố perspective/homography hay detector/cut recovery. Khi lỗi/mất dấu không công bố bản che. Candidate/revision/hash/review gate giữ nguyên.

Kiểm cần: geometry malformed/concave/bowtie/outside/mutualexclusive; moving tilted region ảnh đầu ra/nguồn/audio; rectangle regression; CLI/API; browser chỉnh4góc/chuyển vùng/invalidates/LưuUndo/reopen/responsive và final thật. Chưa hoàn tất tại thời điểm ghi UX.

## Cập nhật launcher
Finalpolygon đã exit0 qua Node trực tiếp, xem HF_RENDER_LAUNCH_CURRENT.md; ba lỗi trước giữ làm lịch sử. Không đổi reviewedfalse hoặc tuyên bố detector.
