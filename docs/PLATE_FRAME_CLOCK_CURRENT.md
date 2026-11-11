# Khung gợi ý và theo dõi biển theo timestamp nguồn

Rà soát code phát hiện OCRplate-suggest.py và plate-track.py đều inputseek trực tiếp mốcnguồn, bỏkhungđanggiữ khi mốc nằm giữa2PTS. Trackerfps30 còn dùng roundmặcđịnh; vùng khoanh trên ảnh người dùng xem có thể lệch với ảnh đầu tracker. Không coi guard opticalflow là phát hiện saiảnhđầu.

Dùng source_frame_clock.py chung với SAM2: tìm PTS trước/bằngmốc, copyts/seek từkhungđó, dịchPTS vềfrom/fpsroundup. SAM2 giữ wrapper person_tracking_frames.py và giới hạn120/15fps; chebiển giới hạn450/30fps/15s. OCR chỉlấy1ảnh cùngmốc, giữscale1920 vàPNG. KhôngthaymodelOCR/detector/quyềnreview, khôngđổiROI/from/mask đãlưu hoặc tựApply/receipt.

Track report vàOCRresult thêm sampling chẩnđoán. KhôngđổiUI/schema/project, runtimehelper nằmcùngscript/sys.path riêng choembeddedPython. Pythonđọcscriptmới mỗi lượt, khôngrestartbackend. Cần kiểmRGBmốcnguồn/unitprivacy/toneaudio/hash vàkhôngsuycoverage từsốframe; giới hạncameraVFR/rotation/keyframe/start lệch vẫn cầnkiểm riêng.

## Bằng chứng
Unit plate-frame-clock.test.mjs tạo nguồn4fps/texturechuyểnđộng: from0,74/duration0,25 có8frame30fps, frameđầu đúng0,5 rồi0,75, vùngđãbiết cheđen đủ8frame; source/project giữ nguyên. Privacytestcũ giữaudio/đa nguồn/speed/2biểnlostreject vàSAM2wrapperoffset/tailqua. Suite386/386: workspace/logs/plate-frame-clock-suite.log. Pythonplate-suggest-cases qua.

OCRthật trênQAxe, at0,74→PTS0,734067/1proposal/sourceprojectSHAgiữ; PLATE_FRAME_CLOCK_OCR_SMOKE.json. tests/plate-frame-clock-real-smoke.mjs --run-local tiếp tục cùngROI/cùngmốc→30frame1s/samplingkhớp/sourceprojectgiữ/khôngreceipt. PLATE_FRAME_CLOCK_REAL_SMOKE.json/contact4mốcđãxem: biểnchính đượccheởảnhmẫu, hộpOCRrộng checảnxe; cầnsửaROI/4góc vàxemtoànkhoảng. Khôngnghiệmthutoànclip/biểnkhác từ4ảnh.

HelperPythonmới nạp thànhcông trongunit/realOCR/realtracker, khôngcầnrestartserver hoặc chạm dựánđangmở. Skillplate.md thêm mốcnguồn/khôngdờiROI đểbùseek, khôngthayreceiptgate hoặc tựápjob. Chưa cameraVFR/rotation/keyframe thưa hoặc nativeUI.
