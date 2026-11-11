# Gợi ý vùng biển — khảo sát và UX

Phân tích điểm vào trước mở rộng: dialog Che biển hiện đã có canvas khung đầu, chọn1–8vùng/4góc, tạo bản che và áp dụng qua Undo/Save. App quản lý file NAS có cờ needs_license_plate_blur; chưa tìm thấy detector sẵn trong phần đã đọc. Factory có OCR QC/seed và tracker theo vùng, không lấy hardcoded biển/thời gian dự án làm quy tắc chung. RapidOCR/model có sẵn trên Python hệ thống, không cài/tải mới.

Luồng chọn: nút phụ Gợi ý vùng biển trên khung đầu trong dialog đang có → OCR khung nguồn tại mediaStart → báo số vùng → người dùng bấm Dùng các vùng gợi ý → chỉnh vùng trên canvas → tạo/tracking → xem bản che → áp dụng/lưu. Gợi ý không tự thay vùng, không tạo bản che, không xác nhận receipt. Cùng token outline/help, không sidebar hoặc dashboard mới. Giữ khoanh thủ công khi runtime thiếu/lỗi/không thấy. Thao tác nhận gợi ý vô hiệu bản che cũ nếu người dùng áp vùng mới.

Prototype plate-suggest.py dùng RapidOCR local, giới hạn khung1920,2threads/model local xác minh tồn tại, FFmpeg autorotate; pattern giống biểnVN một hoặc hai dòng có điều kiện vị trí. Trả tối đa8hộp chuẩn hóa có padding, không trả ký tự biển. Hash nguồn trước/sau và model được ghi để đối chiếu. Một khung không phát hiện mọi biển hoặc mọi thời điểm; OCR không thay detector, có thể bỏ sót/nhầm/biển nhỏ/mờ/xiên. Hai dòng heuristic không chứng minh cùng biển.

Service dùng nguồn dự án/đúng khoảng bằng plateRequest, containment, validate/revision và AbortSignal/timeout; không chỉnh project hoặc media. Môi trường tự dò trong các Python đã có và báo thiếu, không tự download. Chưa đóng gói OCR/model/điều khoản phân phối trên máy sạch. Main server cần restart có kiểm idle trước dùng endpoint mới.

## Đã tích hợp và kiểm
Đã nối service/POST /api/plate-privacy/suggest và nút trong dialog. OCR tìm1vùng trên khung0 nguồnQA broll_den/xeFord; ảnh PLATE_SUGGEST_REAL_FRAME.png đã xem, vùng bao biển nhưng còn dư mép. Không coi confidenceOCR là độ đúng detector hoặc coverage. SourceSHA/modelSHA lưu trong kết quả, không trả văn bản biển.

Service thật trên bản sao nguồn trong thư mục tạm qua, validate được gọi/không ghi project/scratch đã dọn: PLATE_SUGGEST_SERVICE_SMOKE.json. HTTPserverQA5193/dự ánriêng actualOCR200/1proposal, staleRevision409/project nguyên: PLATE_SUGGEST_HTTP_SMOKE.json. Không thayworkspaceactive. Python plate-suggest-cases kiểm số1dòng/2dòng/lowconfidence/khácvịtrí/trùng/khôngnhận hotline, qua.

Chrome component thật + APIresponsefixture: nhấn gợi ý chưa đổi vùng, Dùng gợi ý mới điền vùng, không gọi mask/onReplace, lỗi vẫn khoanh tay,1280/390/pageErrors=[]; PLATE_SUGGEST_BROWSER_SMOKE.json, ảnh390đãxem. Đây không phải một lượt UI→HTTP→OCR→tracking→final liên tục. Đã sửa lỗi gắn nút trước khi regionBar có parent qua browsertest. Unit toànsuite294/294 ở workspace/logs/plate-suggestion-suite.log, không đếm Python/browser vào294.

Main5180restart từPID21192 sau dispatcher0/0,render/ASR/personidle/khôngworker media; xác minh exactcommand trước dừng, launcher báoready. Không chạmapp khác hoặc thayjob/skill snapshot. App thưviệnv49 vẫn đúngphạmvi no automaticdetector; OCRproposal là hỗtrợ thủcông mộtframe, chưaworker APItool/CLIclaim riêng. Chưa thử mọi dạng biểnVN/xe máy/biểnngoại/quétvideodài/GPU/6máy. ModelRapidOCR đã có ởPythonhệthống; chưa đưa vào bộcài hay xácminh đầyđủ quyềnphânphối trọngsố. Giữ hìnhthức thửnghiệm, không tựáp hoặcduyệt che.
