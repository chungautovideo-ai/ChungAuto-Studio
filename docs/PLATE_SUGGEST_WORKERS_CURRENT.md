# Gợi ý biển cho CLI/API và Creative v50

Vấn đề: OCRproposal đã có trong dialog nhưng worker vẫn phải tự đặt ROI. Đã mở lại cùng service qua createApiPlatePrivacy.suggest và che-bien-so.mjs --suggest, không sao chép pipelineOCR. API chỉ quảng bá suggest_plate_regions khi có vision/media/suggestcontext, chỉ nhận đúng segmentId hoặc brollId, tối đa2lượt. Kết quả chỉ đọc, không thêm visualEvidence; mask vẫn đòi ảnh sample_media_frames đã giao ở lượt trước. Tool không tạo receipt, không tự render/đăng.

CLI dùng cùng job/candidate/claim/baseRevision và kiểm candidate không đổi. --suggest không kết hợp vùngROI hoặc --apply; nguồn lấy từ candidate theo segment/broll, không nhậnpath bất kỳ. Không đổi schema/Undo/Save/UI và không thay các tác động mask hiện có. Giới hạn first-build có candidate theo CLI hiện hành giữ nguyên, chưa mở revise CLI cho công cụ này.

tests/api-plate-suggestions.test.mjs2/2: suggestionreadOnly/cap2/no vision/no tùyýpath/không dùng OCR như ảnh để mask. PLATE_SUGGEST_WORKER_SMOKE.json: tiếntrìnhCLI thật trênjobQAclaimed vớiOCRthật trả1proposal, sai claim/suggest+apply bịtừchối, candidate/livebytegiữ; APItool thựcOCR bằng gatewayfixture3rounds qua. Đây không phải model thật, HTTPdispatcher hoặc fullworkflowtracking/render. Không gọi provider trảphí/NAS/đăng.

Creative v50 parent49 giữ11preset/5references, thêm hướng dẫn tool ở plate.md và routeentry. Không nâng quyền hoặc quảngbá detector toànclip. Package1628482byte; quick_validateUTF8 qua, snapshot/ZIProundtrip/HTTP5180version50 qua trong CREATIVE_V50_SMOKE.json. Giữ snapshotjobcũ; preview vẫn tríchvideothamkhảo, khôngkếtquảv50.

Suite296/296: workspace/logs/api-plate-suggestion-suite.log. Mainrestart từPID62260 sau dispatch0/0,render/ASR/personidle và khôngmediaworker, exactcommand đãkiểm; launcherready. Chưa6PC/OCRinstaller/modellicensephânphối/thậtmodelhoặcquétmọibiển. OCR confidence không là đảm bảo privacy.
