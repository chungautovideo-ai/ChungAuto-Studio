# Tìm lời trong inspector cảnh trám — phân tích trước thiết kế

- Ngày/hạng mục:05/11/2026, nâng cấp điều khiển cảnh trám thủ công cùng workflowAI.
- Công việc: người dùng cần tìm lời gọi tên sản phẩm và xem vị trí tương ứng khi sửa dựng; desktop/tablet/mobile dùng chung inspector.
- Hiện trạng: contentos-broll-timing.js có Lời và nhịp cảnh trám, từgiao/từtiếp/nútXem; chưa tìm theo lời. Codeapp.js gắn ngay dưới hiệuứngvào; bảnQA màn đặt ở lời chung cho thấy cần tra ý. Chưa quan sát nativeUI mới.
- Tham khảo: giữ editor-first VEK và disclosure đang có, theo BROLL_EDITOR_TIMING_CURRENT.md/DESIGN_UX_STANDARD.md; tìm lời như thao tác tra transcript, không tạo kho/menumới hoặc nhận đã khảo sát tính năng CapCut mới.
- Tích hợp: ôTìmtronglời và kếtquả vào disclosurehiệncó; dùng chung thuậttoán literal với helperCLI, clock theo caption/segment hiện hành. Khônggọimodel hoặcAPI.
- Luồng: nhập cụm→Tìm/Enter→tốiđa20kếtquả ngữcảnh/mốc→Xem từ đây. Tìmkhôngphát; chỉ bấmXem mớiseek/play. Không tựdờicảnh hoặcápAI.
- Trạngthái: chưa tìm/captiontắt/khôngmatch/cụmlỗi/matchbịgiớihạn rõ; khôngspinner hoặcprogressgiả. Refresh sauđổi projectgiữ input và không tựphát.
- Thiếtkế: dùng label/input/help/outline small/setup-options chung; kếtquảwrap/núttrongvùng inspector, khôngmàu/iconmới. Giữ giới hạnđộdàivàtextContent để lời là dữliệu.
- Responsive/keyboard: input fullwidth, nút/kếtquảwrap tronginspector; Entertìm, buttonbànphím; inputcólabel và kếtquảaria-livepolite, khôngcướpfocus. CầnnativeUIbreakpoint/keyboardthật saucode; hiệnchưa xácminh.
- Dữliệu: chỉđọc/seektimeline; khôngsửaproject nênkhôngtạobướcUndo hoặcSavegiả. Reopen khôngcầnlưuquery tạm. LờiASRcóthểsai, khôngmatchkhôngchứngminh thiếuý; tìmkhôngnhậndiệnảnh.
- Kiểm: helperparity vớiworker(cut/rate/lặp/NFC), callbackproductionTìm/Enter/Xem/refresh/error, noMutation; HTTPstaticmodulesexact. Chưa browser/native/mobile vàchưanghetoànvideo.

## Kết quả

Đã ghép ô tìm, kết quả ngữ cảnh và nút Xem từ mốc vào contentos-broll-timing.js, giữ input khi refresh. Matcher chuyển sang modulepureui/contentos-caption-phrase-search.js, servicebackendre-export để không nhân thuậttoán; UIhelper giữ anchor nguồn và roundingrelative nhưrenderer. BấmXem đọc lại thời gian hiện hành, kếtquảkhôngcòn thìrefresh thay vìseeknhầm. Khôngtựdờicảnh, khônggọiAI, khôngsửaproject.

Suite401/401 tại workspace/logs/broll-phrase-ui-suite.log. Tests productioncallbacks/Enter/input/error/captionoff/staletime/nomutation và phéprounding/cut/rate qua. QA thật85251d tra“màn” trảsource16,06/output15,46–16,21; SHAprojectgiữ. HTTPmain5180 trảđúngbyte5module vàimport, BROLL_PHRASE_UI_SMOKE.json. Chỉxácminhstatic/logic, chưa browsernative/renderUI/mobile/focuskeyboardthật; khôngkhẳngđịnhresponsiveđãđạt.

Skillv50 thêmđiểmvào, ZIPchungauto-creative-v50-broll-phrase-ui.zip parsequa. Khôngđổi renderer hoặc restartbackend; tải lại trang để nhận moduleUI. Snapshotjobđangcó giữphiênbản; querytạmkhônglưuvàoproject/template.
