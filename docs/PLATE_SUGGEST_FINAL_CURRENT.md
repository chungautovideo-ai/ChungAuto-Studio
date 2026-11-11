# Bản final của lượt OCR → che biển → editor

Tiếp nối fullshellQA contentos-ocr-flow-qa-HW2tZQ, không tạo receipt hoặc sửa nội dung. Render CLI final đã được thực hiện như tác vụ xác minh kỹ thuật trên dự ánQA riêng; không xuất/đăng job người dùng. Trước chạy dispatcher0/0, render/ASR/personidle và chưa có exportDir cá nhân.

HyperFrames exit0, snapshot và finalize tạo MP4H2641080×1920/30fps/2s/AAC,6.057.494byte, SHA256cce6706a15040672afe55df2517f15ad0fd4ae3e49570e64901ce647e784238a. Sidecar/fingerprint được verifyArtifact xác minh; kết quả PLATE_SUGGEST_FINAL_ARTIFACT_SMOKE.json. Nguồn đã được khoanhquad thủcông sauOCR, không nhậnOCR tựchọn đúngquad.

Giải mã toàn60frame bảnfinal xuống540×960 và giao vớiquad tracker đã lưu theo mốc frame, erode5px tránh viền:100%pixel bên trong cómaxRGB<24 ởmọiframe, meanRGBcao nhất8.667/255. PLATE_SUGGEST_FINAL_PIXEL_SMOKE.json lưu60sốđo; contact0/.5/1/1.9s đãxem ở PLATE_SUGGEST_FINAL_CONTACT.png. Kiểm này chứng minh vùngmask đãbiết đượcgiữ sauencode, không chứngminhquadtựđúngbiển/mọi biểnhaymọicảnh, khôngđo kínvùngbiểnngoàimask.

AACfinal đo-14.01LUFS/-4.45dBTP/LRA0, warnings=[],listened:false. Cótrack/đủduration khôngnghĩa lờiđãrõ/syncchuẩn/nhạcSFXđãduyệt. Khôngnghefullmix hoặc tạođánhgiángườidùng. Work/plate-review.json vẫn khôngcó; đây manualQAexport, khôngbypass gateauto-export. Khôngrender lại hoặc tựduyệt khi sốđođạt.

Khôngđổi source/project/renderer nên không cần chạylạiunitsuite chỉđểlấytestcount. Suitegầnnhất296/296 ởapi-plate-suggestion-suite.log. Giữgoal mở: chưaclipdài/đa biển/detector tựđộng/worker modelthật/6máy vàthroughput.
