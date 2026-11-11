# ContentOS — điểm hiện hành · 05/11/2026

Mục tiêu đang tiếp tục: nâng cấp dựng video ngành xe, giao diện và skill. ContentOS dùng VEK làm nền, phục vụ nhiều ngành; mỗi máy có dự án/cache riêng, NAS dùng chung nguồn. Chưa nghiệm thu toàn bộ phạm vi tích hợp ba app hoặc50–100video/ngày. Không tính phần trăm từ số test hay số menu.

## Quy trình phát triển

Trước đổi UI đọc DESIGN_UX_STANDARD.md, ghi phân tích theo UX_CHANGE_RECORD_TEMPLATE.md trong tài liệu hạng mục rồi code. Dùng lại editor/component/token, điều khiển sâu trong nhóm đã có, Space/Studio chung project/Undo/Save. Bằng chứng code/runtime hiện tại quyết định; checkpoint cũ chỉ là lịch sử. Không nối mọi checkpoint vào AGENTS hoặc file này.

Mở: powershell -NoProfile -ExecutionPolicy Bypass -File installer/start.ps1 → http://127.0.0.1:5180/home. Setup/doctor xem LOCAL_INSTALLATION.md. Khi restart phải kiểm dispatcher0/0, render/ASRidle và đúng PID/command. Không tự xóa lock hoặc dừng worker vì quan sát timeout.

## Khả năng ngành xe mới nhất

Phiên Antigravity trong AI thực hiện 09/11: thêm `session:antigravity` (Phiên Antigravity đang mở) và cập nhật `session:auto` tại Home, Nhờ AI sửa (Studio/Space), Giao cả lô; `ai-inbox.mjs` tự nhận `ANTIGRAVITY_AGENT`/`ANTIGRAVITY_CONVERSATION_ID`; `/api/ket-noi-ai` và Hoạt động hiển thị trạng thái Antigravity. Unit 20/20, CLI claim và Chrome 1280/390 qua; chưa có `cli:antigravity` chạy ngầm độc lập. ANTIGRAVITY_SESSION_EXECUTION_CURRENT.md.

Hiệu ứng chữ kiểu CapCut 06/11: texts[].style (6 kiểu) + anim Vào 12/Ra 9/Lặp 5, inspector tab Vào/Ra/Lặp, chạy trên GSAP timeline cho preview và bản xuất. Unit 5/5; chưa xem trực quan. TIMELINE_CAPCUT_PARITY_CURRENT.md (Vòng 3).

Tự edit khi có AI + học phong cách CapCut 06/11: việc "Tự chọn AI" không phiên chờ → chạy ngầm Claude/Codex CLI; phiên im >5 phút không giữ hàng đợi; tab Kết nối → CapCut tạo skill phong-cach-chu-so-huu từ dự án CapCut (thử 1026). Unit 3/3, lượt img_0209-2 đã tự chạy ngầm. CAPCUT_STYLE_AUTO_EDIT_CURRENT.md.

Timeline kiểu CapCut vòng1 06/11: Chọn/Tách(A/B), Ctrl+B tách cả mục phủ, Q/W, hít(N), khoá/ẩn/tắt tiếng track (project.tracks, áp lúc dựng), chép/dán, menu chuột phải, ↑↓ điểm cắt. Unit4/4, browser dự án QA qua; chưa chọn nhiều/kéo đổi track/điện thoại. TIMELINE_CAPCUT_PARITY_CURRENT.md.

Skill AI 06/11: màn #skills đọc131 skill (Remotion/HyperFrames/OpenMontage/GhostEditor/MRTKeyword/TikTok/DataAnimation/FFmpeg/Ponytail) + quy chuẩn nhà contentos-edit-standards được ai-inbox nhắc khi dựng/sửa; ContentOS.exe mở app bằng Chrome. Unit3/3, browser lọc/dùng skill qua; chưa model run với chuẩn mới. SKILL_LIBRARY_CURRENT.md.

Chữ HTML đang chọn bàn giao đủ group/id/version cho CLI, chat đúng tên. Codex thật50,2s chỉ sửa câuHTML/giữ texttrùngID vàmọifieldkhác/review; browserheader/reload qua, suite316/316 trước staticnull/inbox bổsung. APIpatchblocksvẫnchưahỗtrợ. SELECTED_HTML_AI_CURRENT.md.

Chữ HTML group chu đã chung Văn bản với chữ thường, ID trùng khác mảng chọn đúng inspector; list/count/status nhất quán. BrowserQA UndoSave/reopen/mobile390, suite315/315, skillv50/ZIP11preset5refs qua; chưa modelrun mới. USED_COMPONENTS_UX_CURRENT.md.

PresetHTML độc lập Pythonhệthống: setup lxml6.0.2 SHA256 ghim, ưu tiên embeddedPython/app và doctorgraphic-preset; chèn ca-stat với PATHrỗng qua, suite313/313 và doctor exit0. Main5180 restart khi idle/đúngPID. Chưa Windows sạch/SAM2installer. PRESET_LOCAL_RUNTIME_CURRENT.md.

Mốc từng từ: kiem-ban-dung timing thêm projectStart/projectEnd gốc cùng outputStart/outputEnd, tránh tính ngược tại điểm nối cắt. Unitcut/rate2/đa nguồn/idtrùng/100mốclẻ và HTTPCLI qua; suite311 trước nhánhrounding cuối, targeted sauqua. Skill/inbox/ZIP11preset5refs cậpnhật; chưa model/visual/final mới. WORD_ANCHORS_CURRENT.md.

PresetCLI theo lô1–20: chung revision, ghi candidate một lần hoặc giữ nguyên khi lỗi/hủy/xung đột. Unitmixedtext/HTML/HTTP2mục qua; Codex thật3mục69,25s/review, text/blockcũ vàmọitrườngkhác giữ nguyên. Skillv50/inbox/ZIP11preset5refs đã cậpnhật; chưa đo token/preview/final của lô. BATCH_PRESETS_CURRENT.md.

Editor ưu tiên sửa: Văn bản/Đồ họa có danh sách đang dùng + kho mẫu thu gọn cùng tab, chọn/visibility/Undo/Save/reopen và chèn chuột/bàn phím qua QA1280/390. Sửa resize trước projectload; không đổi renderer. USED_COMPONENTS_UX_CURRENT.md.

Q2 firstbuild với helper mới: Codex thật261s, transcriptQA nhập sẵn/fullBroll,105,15s/4cảnh/12chữ/3khối, nhạcduck/SFX; preset/timing helper đã dùng nhưng CLI báo284988tokens tổng, chưa chứng minh giảmtoken. Cảnhđèn/màn ở lời chung, cần duyệt ý; chưa browser/audio/final. Skill thêm ưu tiên cảnh tại đoạn gọi tên, không dùng từrộng để láchkiểm; ZIP11preset5refs qua, quy tắcmới chưa modeltest. REAL_WORKER_Q2_V50_HELPERS.json, EDITORIAL_PRESETS_SKILL_SMOKE.json.

Preset CLI/session: chen-preset.mjs dùng chung APIadapter/snapshot/revision; HTTPCLI firstbuild/revise/311suite trước nhánhcancelasync và2test mục tiêu sau nhánh qua. Codex thật thêm đúng1ca-hook trong56,2s, mọi dữ liệu cũ giữ nguyên; previeweditor3,6s thấy chữ/dòng phụ. SkillZIP11presets5refs; catalog3057byte/template14659byte chưa benchmarktoken/fullvideo/final. SESSION_PRESET_CURRENT.md.

Mốc lời/cảnh: kiem-ban-dung --from/--to output≤30s trả cảprojectAt/outputStart vàlờiđãresolve. Đã sửa hướng dẫn: at là projecttime, không ghi output vàoat. Codex thật sửa4cảnh56s chỉat/dur/review, khớpcaption; editor16.2màn→16.5Aroll/phim qua2khung. HTTPCLI/suite310,skillZIP11preset5refs; chưanghe/final/fullvideo. CANDIDATE_TIMING_CURRENT.md.

Q2 fullBroll mới: Codex thật+Whispervi done279s/106.48s/4cảnh, sourceboundsđúng nhưng editor thấy màn kéo sang lời phim/ghế sangsàn, chưađạt hình-lời. Skill thêm quy đổi source→output và giới hạn cuối ý, chưa chạy model bản quy tắc này; CLI báo242561tokens chưa tốiưu. BROLL_EDITORIAL_CURRENT.md.

CLI/session có kiem-ban-dung.mjs kiểm candidate theo claim/revision, trả timeline/graphic lỗi gọn và giữ file; không buildHTML/media/visual/audio. HTTPQA/firstbuild-revise/unit310/310, skillv50 giữ11preset/5refs; model đã dùng helper ởQ2 vàrevise4Broll; chưa benchmarktoken so sánh: CANDIDATE_CHECK_CURRENT.md và CANDIDATE_TIMING_CURRENT.md.

Codex Q2 ASR mới đã done/awaiting-review (~455s),WhisperVi423từ,bản106.23s/13chữ/4khối/105phụđề/nhạc-duck-SFX. Broll0 vì nguồnQA quá ngắn; Chrome sandbox chưa xem/nghe, khôngrender. CLIcheckngônngữ/skill mới có suite309 và ZIP/snapshot; xem TRANSCRIPT_LANGUAGE_CURRENT.md.


Chỉnh người/da riêng khoảng: editor chọn khoảng SAM2 rồi dùng3thanh, mức khoảng→file→chung, có reset/UndoSave/reopen và giữ khi chọn lại đúng khoảng. WebGLspeed2/tua, UI1280/390 và finalQA6s4mốc qua, suite307/307; chưa đa người/chekhuất, CLI/API đã sửa được đúng khoảng nguồn đã lưu; Codex thật sửa sáng da0–2 lên20, giữ mức/mask/khoảng khác và chờ duyệt. Skillv50 cập nhật; xem PERSON_RANGE_ADJUSTMENTS_CURRENT.md và AI_PERSON_RANGE_CURRENT.md.

Hoàn thiện âm thanh: final QA workerv50 thật99,7giây qua hash/sidecar; giảm AAC overshoot theo số đo-1.29→-1.80dBTP trong1lượt, cuối-15.2LUFS/warnings[],chưa ngheduyệt. Finalizer CLI/HTTP chung và skillfinishing cập nhật, suite305/305. Xem ENCODED_AUDIO_HEADROOM_CURRENT.md/REAL_WORKER_V50_FINAL_SMOKE.json.

Cập nhật worker CLI: bàn giao candidate qua tệp cho sandbox chặn localhost đã qua MXC thật với fixture, suite303/303 và model Codex Q2v50 thật done/awaiting-review (~294giây,9đoạn/4Broll/10chữ/6khối/nhạc-duck-SFX). Xem CLI_COMPLETION_HANDOFF_CURRENT.md. Transcript nhập sẵn/nguồn QA copy local; không tính đây là nghiệm thu fullvideo/ASR/NAS/mix.

| Hạng mục | Hiện trạng có bằng chứng | Tài liệu |
|---|---|---|
| Hai CLI xuất/chờ thật | Hai QA draftkhởi chạy đồngthời, khóa tuần tự, snapshot/output/hash riêng, pingOK. RegistryCLI có rowchờ/chạy/terminal vàprogress đã kiểmHTTP/UI1280/390; chưa AIedit/crash/throughput | CLI_RENDER_ACTIVITY_CURRENT.md |
| Hoàn tất render async | Workerthread giữ FFmpeg/hash/copy khỏi HTTPloop, giữlock/running tới commit; pingtrongfinalizing/DELETE409/sidecarhash qua, suite292/292. Mainrestart antoàn, chưa multijob/crashthật | RENDER_FINALIZATION_ASYNC_CURRENT.md |
| Creative v48 | Giữ11preset/4refs, hợpnhất người/da bỏ lịch sử/mâu thuẫn và thêm sốđoAAC cuối; 3file26.029→17.574byte. Validate/ZIP/HTTP/snapshot qua, chưa model/tokenthật | CREATIVE_V48_CURRENT.md |
| Đo audio cuối bản xuất | Đo AAC cuối lưu LUFS/peak/LRA và warnings/sidecar; HTTPtone0,6s/hash qua, Chromecomponent1280/390 đã xem, mainrestart antoàn. Chưa mix thật/ngheduyệt hoặc measurementfailure | RENDER_AUDIO_STATUS_CURRENT.md |
| Vùng che/chọn lại | CUDA trên proxyngườithật+vậtchegiảlập: guard dừng2,5/3s khôngoutput; chia0–2,875/4,5–6s qua, maskgap9mốc đúng/ảnhđãxem. Chưa chekhuất thật/đa người/UI-finalfixture | PERSON_OCCLUSION_RECOVERY_CURRENT.md |
| UX profile/LUT | Báo thiếu profile/LUT trước tạo, giữ look hợp lệ khi đổi profile; Chrome component1280/390 fixture qua, ảnh đã xem; Node5/5 gồm FFmpeg tổng hợp. Chưa cameraHDRLogthật | COLOR_READINESS_UX_CURRENT.md |
| UX lỗi tracking | Tiếng Việt/mốc nguồn, raw thu gọn, rút khoảng trước lỗi rồi chọn lại; Chrome component1280/390 với video thật/response giả lập qua, ảnh đã xem, không ghi project | PERSON_TRACKING_ERROR_UX_CURRENT.md |
| Liên tục mask/v47 | Chặn nhảy vùng/co-phình đột ngột; SAM2CUDA thật6s/48mẫu giữ mask, 7syntheticcases và5Nodechecks qua. V47 giữ11preset, ZIPqua; chưa danh tính/đa người/che khuất | PERSON_MASK_CONTINUITY_CURRENT.md |
| Final chỉnh sáng người | Hai bản QA6s mức0/30, giữmịn17; 4khung vùngngười tăng10,20–11,53/255, nền gần0; hash/sidecar qua, ảnhđãxem. Chưa livepreview-parity/nhiềungười/chekhuất/fullquality | SELECTED_PERSON_EXPOSURE_CURRENT.md, SELECTED_PERSON_FINAL_SMOKE.json |
| CLI đo sáng riêng/v46 | --measure-selected cùngchinh-nguoi-da trênclaimedrevise, readonly/claim-candidate-revisionguard; HTTP→CLI/FFmpeg→completion/browser qua. V46 giữ11preset, chưa modelthật/finalquality | SESSION_PERSON_ADJUSTMENTS_CURRENT.md |
| Đo sáng người được chọn/v45 | Semantic∩SAM2 tốiđa12frame, APItool read-before-measure/cap2; HTTPgatewaygiảlập4lượt+FFmpeg qua. BrowserQA làm tối Apply30/Undo0/Redo/Save/reopen giữmịn17 qua, v45 giữ11preset. Chưa modelthật/nhiềungười/finalquality | SELECTED_PERSON_EXPOSURE_CURRENT.md |
| Worker Codex thật v43 | Exec lỗi32 do ACL node_repl đangdùng, chưa dựng. Windows sandbox probe trướcmodel dừng HTTPQA1.3s/errorCodeđúng/khôngmodel; giữsandbox, chưa sửa sharingviolation | CLI_WORKER_FAILURE_CURRENT.md, CLI_SANDBOX_PREFLIGHT_HTTP_SMOKE.json |
| API nhập nguồn brief | Lọc tên Unicode/role/sourceIndex, giữ index gốc khi attach; checksum/provenance. Có nguồn tối đa16lượt, khác6; HTTP first-build10lượt gateway giả lập qua. Chưa NASthật/model/ASR/lô lớn | API_JOB_SOURCES_CURRENT.md |
| Kết quả render/âm thanh | Finalizer/server giữ SHA256/bytes/loudnorm/warnings; HTTP QA0.6s noaudio/sidecar verify qua, audio tone unit qua. UI thêm warning, chưa browser/ép normalizeerror với audio | RENDER_AUDIO_STATUS_CURRENT.md |
| Hiển thị xuất video | Thanh trạng thái cố định + lỗi có lý do; sửa gốc: GET /api/render ok:false bị api() ném nên UI kẹt %. Xuất nhận kết quả khi hyperframes báo xong dù thoát Ctrl+C. Test11 + browser1280/390 qua; server cần restart cho Dựng nháp, chưa xuất Final mới end-to-end | EXPORT_STATUS_DISPLAY_CURRENT.md |
| Phân loại LUT trùng | Alias chưa biết không xóa input đã biết; input mâu thuẫn cần xác nhận. Legacy catalog đọc hồi phục metadata local, không quét NAS; fixture/reimport qua, thật139/7/132/0conflict | LUT_ALIAS_CLASSIFICATION_CURRENT.md |
| Toolbar editor mobile | Header hai hàng, đủ Space/Studio/UndoRedo/Xuất/Thêm; thư viện/ảnh bìa qua menu, AI tránh rail. Chrome1280/760/600/390/320 bounds/scroll/menu/Escape qua, ảnh đã xem; chưa toàn Space/dialog/transport320 | EDITOR_MOBILE_TOOLBAR_CURRENT.md |
| Skill Creative v43 | Giữ11preset/4chuyênđề, thêm API list/attach/inspect/sample nguồnbrief và giới hạn khảo sát; giữ đoâm/người/da. validate/package/endpoint43 qua, presets khôngđổi | API_JOB_SOURCES_CURRENT.md |
| Đo âm lượng bản xuất | CLI read-only FFmpeg input measurements, tone/silence/noaudio qua. Q2 -14.75LUFS/-1.27dBTP/LRA5 cảnh báo peak, chưa nghefullmix/auto sửa | AUDIO_LOUDNESS_CURRENT.md |
| Doctor theo dõi người | doctor.ps1 -Person kiểm SAM2/Python/CUDA/hash; máy thật ready4070Ti, nhánh override thiếu exit1/không fallback qua. Mặc định checked:false; chưa bộ cài SAM2 máy sạch | LOCAL_INSTALLATION.md, DOCTOR_PERSON_SMOKE.json |
| API sửa mức người/da | read_person_exposure → set_person_adjustment trên revise candidate; kiểm hash/mask/off, giữ các mức khác. HTTP worker với gateway giả lập và mask SAM2 thật qua, dừng chờ duyệt; chưa model thật. CLI xem hàng dưới | API_PERSON_ADJUSTMENTS_CURRENT.md |
| CLI sửa mức người/da | HTTP QA → claim → tiến trình CLI report/dry-run/apply20 → completion review → browser sửa25/Undo20/Redo25/Save/reopen qua; mask/face giữ. Ảnh1280/390 đã xem, chưa toàn shell mobile/model thật/final | SESSION_PERSON_ADJUSTMENTS_CURRENT.md |
| Xem/tải skill trong UI | Panelquytắc có4chuyênđề lazyload/retry,hash/hướngdẫn thu gọn,nútZIP; component1280/390 vàHTTP qua. Chưa mọiđườngđi thưviện | TEMPLATE_REFERENCE_BROWSER_CURRENT.md |
| Chuyển mẫu qua ZIP | CLI/HTTP/library giữ refs vàpreview; roundtrip11preset/4refs, HTTPQAqua, artifact1.62MB. Chưa máy sạch/asset ngoài | TEMPLATE_PORTABLE_REFERENCES_CURRENT.md |
| API sửa dự án có mask lớn | BỏRLEkhỏi context,giữcandidate/camera; 48mẫuSAM2saved134KB qua mocktool vàHTTPworkerreview. Chưa providerthật | API_PERSON_MASK_CONTEXT_CURRENT.md |
| Người/da cho AI | CLI/API đọcsummary/mức/hash/selectionScope/usedranges/gap. ĐãkiểmserviceCLI/mockAPIvớidữliệuQAthật, khônggửimask. Chưa tựquét/áp/modelworkerthật | PERSON_SELECTION_AI_SCOPE_CURRENT.md |
| Gợi ý điểm người | 4điểm từmask cùngmốc; chạm1điểm chọncomponent/giữnegative, khônganchorrejectđa vùng. RealSAM2fixture1snhânđôi và2range6squa; chưa ngườiđộc lập/chạm/identity | PERSON_POINT_SUGGESTIONS_CURRENT.md |
| SAM2 kiểm môi trường | Dialog/runtimeAPI kiểmPython/CUDA/model trướcTheodõi; máy thậtready,2rangesGPU vàlỗiretryfixturequa. Chưa installerSAM2máysạch | PERSON_RUNTIME_READINESS_CURRENT.md |
| SAM2 tạo mặt nạ | PrototypeCUDA local, modelTiny155.9MB hash đúng. Q2/fixture nhân đôi8frame và cutđen đã thử; córenderer giao mask ở hàng dưới, đã có dialog/API tạo và hủy tác vụ, xem PERSON_SELECTION_DIALOG_CURRENT.md | PERSON_SAM2_PROTOTYPE_CURRENT.md |
| Renderer người được chọn | GiaoSAM2 với mask người/da, source/hash/clock, ngoài khoảng bỏhiệuchỉnh. WebGL/MediaPipe+SAM2thật/Q Afinal1s qua; UI bỏchọn/Undo/Save. Có dialog/API chọn/theo dõi/hủy/Apply/UndoSave; QA1s nhân đôi người; thêm6s người đi/rahiệu48mẫu, xem8ảnh mask toànthân; chưa nhiều người độc lập | PERSON_SELECTION_RENDER_CURRENT.md |
| Xem vùng người đã lưu | Dialog chỉ xem/tua/ẩn hiện, không chạy GPU; QA hai khoảng, project/face giữ byte, 1280/390 đã xem. SHA kiểm lúc mở/tải lại | PERSON_SELECTION_REVIEW_CURRENT.md |
| Nhiều khoảng chọn người | UI/API2khoảng0–2/3–5 trênQA6s thật; UndoSave/xóariêng/reopen qua. Final4framegap đúng; sửa clockGSAP0s và logshadernearzero. Chưa đa người/chekhuất | PERSON_SELECTION_RANGES_CURRENT.md |
| Gợi ý sáng người/da | Quét mới đo tối đa120mẫu nguồn; đề xuất nhẹ và Apply rõ ràng, Undo/Save. MediaPipe thử Q2/bản tối nhân tạo qua; chưa tự xác định tông da/HDR/Log hoặc nghiệm thu mọi nguồn | PERSON_EXPOSURE_SUGGESTIONS_CURRENT.md |
| Chỉnh người/da theo file | Chọn mức chung hoặc nguồn có mask; override0–100 theo src/hash, Undo/Redo/Save/reopen. WebGL và MediaPipe UI qua; QA final1s xuất qua. Có sốđo/gợiý và nhiều khoảng SAM2 cùngfile; chưa mức riêng mỗi khoảng/mỗi người độc lập | PERSON_SOURCE_ADJUSTMENTS_CURRENT.md |
| Tracking chữ/callout | Legacy một nguồn A-roll dừng khi mất dấu/flow không nhất quán, không ghi dự án lỗi; fixture liên tục/cut đã kiểm. Chưa tracking mask da hoặc danh tính người | MOTION_TRACKER_RELIABILITY_CURRENT.md |
| Đăng nhập worker CLI | Worker và Kết nối đọc chung stdout/stderr; sửa lỗi Codex đã đăng nhập nhưng worker từ chối. Probe thật và endpoint5180 thống nhất; chưa chạy lại dựng Q2 | AGENT_LOGIN_STATUS_CURRENT.md |
| Màu/chống rung trong chat | chuan-hoa-mau.mjs trênclaimedcandidate dùng serviceeditor/API; profile/LUT/CPU/GPU/stabilize/listLUT; khônglive/export. CLIHLG→709/audioCPU vàHTTPstage→claim→CLI→completionQ2crop1s qua; khôngmodel thật | SESSION_COLOR_COMMAND_CURRENT.md |
| Cọ sửa người/da | skin/person/erase theo src/SHA/[from,to), cỡ/đườngcọ, Apply/Undo/Redo/Save/reopen. Cọ cốđịnh, chưabámchuyểnđộng/chọntừngngười | PERSON_MASK_BRUSH_CURRENT.md |
| Ổn định mask | maskStability0–100,mặcđịnh0; giảm tácđộng khi mẫu liềnkề bấtđồng, không mởra nền. Chưa bùchuyểnđộng | PERSON_MASK_STABILITY_CURRENT.md |
| Quét người/da | MediaPipelocal15/30fps, A-roll+B-roll nguồn/hash/clock riêng, sángngười/sángda/mịnda/thuviền vàxemmask. REACapCut chỉresourceevidence, khôngengine | PERSON_BODY_INTEGRATION_CURRENT.md, PERSON_SCAN_QUALITY_CURRENT.md |
| Màu nguồn/LUT | HLG/PQ→709, LogcầnLUTkỹthuậtđúng; khoNAS139LUT(7technical/132chưa phânloại), CPUfilters/NVENCencode. KhôngđoánLogtừhãng/10bit | COLOR_NORMALIZATION_CURRENT.md, SESSION_COLOR_COMMAND_CURRENT.md, LUT_LIBRARY_IMPORT_SMOKE.json |
| Che biển |1–8vùng/4góc affineopticalflow, đánhdấuthủcông, nguồn/hash/provenance vàreviewgate. Chưa detector/homography/cutrecovery | PLATE_QUAD_CURRENT.md, PLATE_REAL_CURRENT.md, MULTI_PLATE_CURRENT.md |
| Logo/CTA/outro | lựa chọn độc lập, mặcđịnh khôngép thêm; completiongiữoff/keep choAPI/session. Beautyoffbỏ cảngười/da | AUTOMOTIVE_BEAUTY_POLICY_CURRENT.md |
| Nhạc/SFX |4nhómÂmthanh, thưviện/nghe/chọn/nhập, mix/ducktheolời, cue. ChỉnhsauUndo/Redođãsửa; chưangheduyệtfullmixQ2 | AUDIO_UNDO_CURRENT.md, AUTO_EDIT_UX_AUDIO_PRESETS_AUDIT_2026-11-04.md |
| Lưu mẫu cải tiến | bảncongiữ11preset/quytắc, mixportable, khôngchéptimeline/mediariêng. Chưađónggóitựchứamọiassetngoài | TEMPLATE_REVISION_PRESETS_CURRENT.md |
| QAQ2toàntimeline |103.64s/4B-roll/graphic/nhạc/SFX, final1080×1920/AACexit0hash; ảnhđãxem, chưanghefull. ASR/plan nhập sẵn, khôngworker tựdựng. Cảnhbroll_vinfast3–6s thấyFord, khôngdùngclaimVinFast | Q2_FULL_WORKFLOW_CURRENT.md |
| HyperFramesWindows | launcherNodeCLIđúngpin/shellfalse, CLI/APIrenderexit0; coldcachefallbacknpxchưa máy sạch | HF_RENDER_LAUNCH_CURRENT.md |

Lượt xuất CLI độc lập đã hiện trong Hoạt động: hai tiến trình QA thực qua HTTP queued/active/terminal, component1280/390 với hàng fixture; sửa revision conflict thành failed và giữ bản xuất trước bằng test CLI thật. Xem CLI_RENDER_ACTIVITY_CURRENT.md; chưa crash recovery hoặc worker tự dựng đồng thời.

Mốc suite gần nhất 296/296: workspace/logs/api-plate-suggestion-suite.log. Đây unit/service và FFmpeg fixture đúng phạm vi, không nghiệm thu toàn workflow. Mẫu/quét/final ngắn chỉ chứng minh các thao tác đã kiểm. Dự án gốc người dùng giữ nguyên.

## Phạm vi còn phải nghiệm thu

FinalOCRflowQA2s exit0 H2641080×1920/30fps/AAC/SHAverified;60frame trongquadđãbiết giữmaskđen, contact4mốcđãxem. Audio-14.01LUFS/-4.45dBTP/chưanghe,noreceipt. Khôngchứngminh mọi biển/toànprivacy. Xem PLATE_SUGGEST_FINAL_CURRENT.md/ARTIFACT_SMOKE.json.

Fullshell OCR→tracking2s/60frame→Apply/Save/UndoRedo/reload trêncảnhxethật qua sauchỉnh4góc bằngtay; gợiýthôchạmméptrackerđãtừchối, UIthêmcảnhbáo. Khôngreceipt/final/privacyacceptance. Xem PLATE_SUGGEST_FULL_FLOW_CURRENT.md/SMOKE.json.

OCR gợi ý qua workerCLI/API đã nối cùngservice: claim/candidatereadonly, APIvisioncap2/khôngthayảnhtrướcmask. CLIthật+OCRthật/APIgatewayfixture qua, suite296/296. Creativev50 giữ11preset/5ref, ZIP/snapshot/HTTP50 qua. Xem PLATE_SUGGEST_WORKERS_CURRENT.md; chưa modelthật hoặcfullclipprivacy.

Gợi ý vùng biển trên khung đầu: RapidOCRlocal đãcó, UIexplicitUse/giữmanual; realframe/servicecopy/HTTPQA200+stale409 vàbrowsercomponentfixture1280/390 qua. Mainrestartidle, suite294/294. Chưa detector/quéttoànclip/bộcàimáysạch hoặc fullprivacy; worker tool xem mục phía trên. Xem PLATE_SUGGESTIONS_CURRENT.md.

Skill Creative v49 bổ sung chuyên đề quảng cáo/review/before-after, cảnh chứng minh và nhịp motion/âm thanh; giữ11preset, snapshot/ZIP5refs/HTTP49 qua, chưa hành vi model thật/chất lượng dựng mới. Xem CREATIVE_V49_CURRENT.md.

UX duyệt biển: dialog thêm khoảng nguồn/nút xem lại/dừng cuối/pause player khác, Chrome component1280/390 với videoQA thật + responsefixture qua, lỗi media khóa xác nhận; chưa nghiệm thu che kín mọi frame. Xem PLATE_REVIEW_UX_CURRENT.md.

AIworkerthật từbrief+NAS chọn/cắt/cảnhtrám/graphic/nhạc/SFX; fulltimelinevàâmthanh, trackingmask/chọntừngngười, detectorbiển/cutrecovery, crashrecovery/multijobthật, bộcàimáysạch/sáumáy/điệnthoại/remote vàthroughput. Khôngtựnhận đủ50–100/ngày hoặc ngangCapCut. Cácproviderảnh/voice/video/socialcóadapter khôngđồngnghĩa đãgọi/thửthật/đăngđủmọinền tảng.

## Bản đồ tài liệu theo việc

- UI_INTEGRATION_BUILD_SPEC_2026-11-03.md, CONTENTOS_NAVIGATION_REVIEW_2026-11-04.md, CONTENTOS_UX_REASSESSMENT_2026-11-04.md: tíchhợpvàUX.
- VEK_UI_UX_AUDIT_2026-11-03.md: khảo sát nềnVEK, khôngđạidiện UIContentOShiệntại.
- SPACE_STUDIO_AND_AI_EXPORT_2026-11-03.md: layout/execution/completionđộclập.
- PARALLEL_EDIT_BUILD_SPEC_2026-11-04.md, ACTIVITY_MULTI_EDIT_UX_2026-11-04.md: nhiềuchat/CLI/API/hàngđợi/nhậtxétliveness.
- RENDER_ENGINE_ARCHITECTURE_2026-11-04.md: HyperFrames/Remotion/FFmpeg, runtime/snapshot/artifact.
- LOCAL_INSTALLATION.md: setup/start/doctor vàgiớihạn máy sạch.
- SKILL_TOKEN_WORKFLOW_AUDIT_2026-11-04.md: skill/token/media; sốbytekhônglàtokenthực.
- BUILD_PLAN.md, config/features.json vàblueprintappnguồn: phạmvi gốcrộng, chưađốisoátđủ; khôngthaytrạngtháihàngloạt.
- BUILD_STATUS.md: nhậtkýbằngchứng lớn, tìmtheohạngmụcthayvìđọchết.
- history/BUILD_CURRENT_BEFORE_CONTEXT_CLEANUP_2026-11-05.md vàhistory/AGENTS_BEFORE_CONTEXT_CLEANUP_2026-11-05.md: lưu nguyêncheckpointtrướckhirútgọn, khôngphảilệnh dừng/chạyhiệnhành.

Chống "ngọng" phụ đề/chữ nhấn: Whisper tiếng Việt có gợi từ vựng + từ điển sửa sau nhận giọng `config/tu-dien-asr.json` (giữ mốc từ, ghi `textFixes`); skill contentos-edit-standards thêm chuẩn nguồn công khai. Kiểm trên bản sao âm thanh QA/NAS 60 s, chưa đo bộ lớn. Xem ASR_SUA_CHU_CURRENT.md.

Timeline/preview: đã sửa chiều cao timeline đã lưu theo viewport và thêm keyboard/aria, kiểm UI1280×720/1280×600/390×844. Xem TIMELINE_PREVIEW_SPACE_CURRENT.md; không thay nội dung dự án hoặc nghiệm thu fullvideo.

## Quy tắc cập nhật

Giữ file này là bảnđồhiệnhành ngắn; thêm kếtquả chi tiết vào chuyênđề/BUILD_STATUS. Chỉ chứngnhận hoànthành khi đối soát đúng yêu cầu và bằng chứng hiện tại. Phần nào chưa kiểm hoặc bằng chứng hẹp phải ghi rõ, không dùng ýđịnh/testcount thay nghiệmthu.


