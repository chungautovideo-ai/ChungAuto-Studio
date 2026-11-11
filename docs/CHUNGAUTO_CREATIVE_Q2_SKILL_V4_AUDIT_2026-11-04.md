# ChungAuto Creative Q2 — đánh giá edit tự động và nâng skill v4

Ngày04/11/2026. Yêu cầu: đánh giá tiến độ lõi edit và khảo sát D:/ChungAutoVideoFactory/jobs/CREATIVE_Q2_3MANG để nâng skill ChungAuto, có tùy chọn màu/che biển số/watermark/outro-CTA, dựng cảnh trám/hoạt họa/nhạc/SFX tốt hơn. Chỉ cập nhật skill mẫu ContentOS và tài liệu phân tích trong lượt này; không sửa dự án Factory, backend/UI hoặc giao AI/render video mới.

## 1. Ước lượng tiến độ có phạm vi

Lõi edit tự động khoảng55–60% theo thang đánh giá kỹ thuật dưới đây; mốc kế hoạch xấp xỉ60%, không phải số đo năng suất/chất lượng hay phần trăm toàn bộ127nhóm. Không đánh đồng tính năng chỉnh tay đã có với AI sử dụng tốt và tự hoàn tất an toàn.

Thang0–4:0=chưa có năng lực tích hợp;1=nền tảng/đặc tả;2=một phần pipeline hoặc còn bước tay quan trọng;3=có pipeline và kiểm chứng giới hạn;4=đạt hành trình nguồn thật/đầu ra theo chuẩn yêu cầu. Trọng số là lựa chọn đánh giá cho quảng cáo/review/news, có thể đổi theo loại video. Chấm từ code hiện tại và evidence đã ghi; không chạy lại agent thật ở lượt khảo sát. Giá trị59.25/100 trong JSON là phép tổng trọng số, chỉ báo cáo khoảng để tránh hiểu là phép đo chính xác.

| Nhóm nghiệp vụ | Trọng số | Mức |
|---|---:|---:|
| Nhập A/B-roll và quản lý nguồn | 10 | 3/4 |
| Giao AI/candidate/review | 15 | 3/4 |
| Timeline/chữ/phụ đề/sửa tay | 12 | 3/4 |
| Chọn B-roll và hoạt họa theo ý | 15 | 2/4 |
| Màu tự động theo shot | 8 | 2/4 |
| Che biển số theo dõi và kiểm cuối | 7 | 0/4 |
| Watermark/outro/CTA tùy chọn theo job | 7 | 2/4 |
| Nhạc/SFX/mix theo nội dung | 10 | 2.5/4 |
| Mẫu/skill/preset dùng lại | 6 | 3/4 |
| Preview/final/revision | 5 | 3/4 |
| Nhiều việc/khôi phục | 3 | 2/4 |
| Nghiệm thu nguồn thật/năng suất | 2 | 1/4 |

Không nhóm nào được4chỉ vì smoke tổng hợp đạt. Khối yếu nhất là privacy/tracking, color theo shot xuyên pipeline, semantic B-roll/motion, âm thanh nghe thực và benchmark nguồn thật. Bản v4 mới cài không tự nâng điểm: cần thử việc thật rồi đánh giá lại. Mốc208service tests và các smoke trước không đồng nghĩa208năng lực hoặc toàn bộ hệ thống đạt60%.

## 2. Những gì quan sát trực tiếp từ dự án mẫu

Đã đọc job/state/edit-plan/style-profile/manual task/QC/export manifest và tài liệu finishing; FFprobe bản FINAL hiện tại:105.333333s,1080×1920,30fps,H264+AAC,220338545bytes. Trích9frame trực tiếp từ FINAL ở3.5/19.8/31.9/48.9/57/70.5/79/100.8/103.5s và xem montage; xem contact sheet cũ và bảng grade trước/sau có sẵn. Không phát/nghe trọn video, không chạy lại OCR/grade/QC của dự án.

Plan có34event,9event layerBROLL,34creative layer thuộc17loại (STACK/KEYWORD/CUTOUT/FLASH/LIGHT_LEAK/CHAPTER/PROGRESS/STAT/GRID/STICKER/SPLIT/TITLE2/INSET/MAPPIN/CALLOUT/DATECARD/CTA),72cueSFX và grade22clip. graphics[] rỗng không có nghĩa không có graphic: phần chính ở creative.layers. Thư mục08_broll/09_graphics/10_sound rỗng không chứng minh thiếu đầu ra; phải đọc plan và artifact.

Mẫu tốt ở khả năng kể chuyện theo chương, nhấn số, grid dịch vụ, split/inset, progress, map và CTA đúng nội dung. Frame FINAL cho thấy số3sau người, grid6ô, biển số mờ trên xe, cảnh inset/chương, map và ending screenshot kênh. Đây là quan sát ở các frame mẫu, không chứng minh tracking mọi frame hoặc chuyển động đạt xuyên video.

State lưu nhiều lần sửa sau DONE: caption chồng split/inset; từ chưa nói hiện mờ; chương quá tối; graphic số vào trễ hoặc count-up khiến đọc sai; ô grid chạy từ mốc chung dẫn đến hết clip/freeze/lộ biển; SFX đổi pitch lệch sync; màu và depth cần sửa. Đây là các failure mode cần đưa vào công cụ/skill, không phải sao lại một timeline105giây.

Một mâu thuẫn đáng chú ý: job.plate_policy=NONE nhưng plan có MT-PLATE required và final đã qua finishing5cửa sổ. File hướng dẫn finishing vẫn ghi AWAITING_CAPCUT_EXPORT trong khi state mới DONE. manual-tasks ghi engine optical-flow render mask, không xuất từ CapCut GUI; tên thư mục/file CapCut không chứng minh workflow GUI. QC lịch sử ghi583frame OCR/0kết quả ở bản che và loudness-14.3LUFS; lần này chỉ đọc hồ sơ, không xác nhận lại các phép đo đó. Nhạc nguồn ghi license UNKNOWN nên không sao nhạc sang mẫu mới.

## 3. Cái gì phải tích hợp app, cái gì do skill

| Nhu cầu | App chịu trách nhiệm | Skill chịu trách nhiệm | Hiện trạng / bước cần làm |
|---|---|---|---|
| Màu | Tùy chọn giữ/không sửa, tự cân tự nhiên, preset; thông số từng A/B-roll, preview/so trước-sau, Save/Undo; xử lý color space và đồng nhất final | Đọc loại nguồn, chọn shot trung tính/da/sản phẩm, quyết định chỉnh bao nhiêu, match shot, giữ màu xe/ghế | Có global filter và segments[].color. Chưa có grade từng B-roll/Log/skin như Factory; first-build inbox đang gỡ camera.color/beauty. Cần policy opt-in+snapshot+adapter, không chỉ đổi skill |
| Biển số | Chính sách theo job, vùng mask/keyframe/tracking đa biển, sửa thủ công, schema/provenance, renderer preview/final, gate khi chưa kiểm | Xác định shot nào cần che, rà grid/inset/split và vùng chuyển cảnh, đề nghị mask khít, kiểm lỗi/handoff | Mẫu compatibility automaticPlateTracking=false; chưa có privacy renderer tích hợp. Không thêm checkbox giả hoặc dùng mask tĩnh làm tracking |
| Watermark | Chọn ảnh/vị trí/cỡ/opacity/bật/tắt; workspace default→project/job override; explicit off không bị brand/template bật lại | Chỉ chọn logo đúng, tránh mặt/chi tiết và tôn trọng tắt | Đã có watermark.js, brandForm, hidden và API inspect; cần nối lựa chọn từ giao việc và tất cả adapter |
| Outro/CTA | Tắt/giữ/on-overlay/end-card; nội dung/contact/duration, chỉnh trên timeline, snapshot; không âm thầm kéo dài nguồn | Chọn lời mời và điểm kết hợp lý, không bịa số điện thoại/địa chỉ, tắt thì kết tự nhiên | ca-cta và chỉnh block có sẵn; chưa có chính sách outro chung từ setup đến tất cả worker |
| B-roll | Intake/NAS/phone, thumbnail/proxy/search, source-in/duration/fit/crop và provenance; semantic index chỉ đọc phần được chọn | Xem clip, gắn bằng chứng với câu, chọn đoạn có chuyển động/hành động, bố cục đúng và không thay hình sản phẩm bằng ảnh AI giả | Có tool/media/timeline; cần nghiệm thu chọn shot tự động theo nguồn thật và kiểm clip con trong grid |
| Hoạt họa | Preset có schema, engine adapter/capability, edit tham số, mute/ẩn/layer/safe-area; thêm chapter/progress/grid/map đã test | Ý đồ kể chuyện, nhịp vào/ra/hold, ưu tiên thông tin và phối caption, chọn preset phù hợp | Mẫu hiện có9preset, không phải17loại Factory. Native Remotion mới adapter giới hạn. Cần chuyển chọn lọc thành component chuẩn, không nhét code engine vào skill |
| Nhạc | Kho có quyền/metadata/nghe thử, lựa chọn không/theo mẫu/tự chọn/tôi chọn, source validation, loop/fade/duck/mix, snapshot | Chọn mood/nhịp từ thư viện hợp lệ, điểm nhấn, không lấn lời, nghe để quyết định | Audio4nhóm và mix đã có. Job policy/kho chung/duck lời A-roll/kiểm tai-preview-final còn thiếu |
| SFX | Danh mục, cue/mật độ/volume, onset, dedup tự động/tay, timeline/sync khi pitch/speed | Chọn tiếng theo chuyển động/ý nghĩa, ít ở trọng điểm, không dồn từng từ | Auto+manual đã có; không sao72cue; cần kiểm sync/density theo nguồn thật |
| Kiểm cuối | Revision/fingerprint, media availability, freeze/black/audio clipping và gate tùy cấu hình | Kiểm nghĩa, hình sản phẩm, bố cục, nhịp, thông tin và liệt kê phần chưa xác minh | Có các kiểm kỹ thuật ở nhiều mốc; chưa là auto-QC toàn diện trên mọi video |

Nguyên tắc: app thực thi và cho sửa; skill chọn cách dựng. Không dùng skill thay renderer, không dùng UI thay validation; lựa chọn người dùng thắng mặc định mẫu và phải giữ đến lúc hoàn tất.

## 4. Phân tích UX trước khi làm màn tùy chọn

Theo DESIGN_UX_STANDARD: người dùng đã chọn mẫu ở Home và muốn giao một câu ngắn. Ảnh hiện tại cho thấy composer + Nguồn & tùy chọn + chip mẫu + quick shelf; không cần sidebar mới cho ChungAuto/Factory.

Tham khảo dựa trên ảnh CapCut/audio và audit VEK đã có: menu theo công cụ, control sâu trong inspector, có xem trước/chọn rõ ràng; dùng lại đường đi Home→setup→editor. Dự án Factory tham khảo dữ liệu/ảnh đầu ra, chưa khảo sát GUI Factory hoặc Premiere trong lượt này.

Đề xuất trước code: thêm disclosure 'Tùy chọn dựng' trong setup/chip mẫu, mở khi người dùng cần; sáu nhóm màu/biển số/logo/CTA/nhạc/SFX có tóm tắt lựa chọn. Phần thường dùng chỉ bật/tắt/mode, chi tiết trong nâng cao; không tự mở sáu dialog. Giữ note/chat đơn giản, có thể nhập yêu cầu bằng câu thường. Mặc định theo cấu hình đã chốt, explicit off được giữ; tránh một nút 'tự động hết'.

Vị trí sửa sâu: Bộ lọc/đoạn video cho màu; Thương hiệu cho watermark; Đồ họa và timeline cho CTA; Âm thanh4nhóm cho nhạc/SFX. Privacy cần panel trong công cụ Video/Cảnh trám tương ứng, không menu trang chủ riêng. Chỉ thêm điểm chọn che khi backend thật hỗ trợ; trước đó có thể trình bày trạng thái cần finishing nhưng không nhận tự che.

State loading/error/unavailable/dirty/conflict rõ; đổi màu không giao AI lại; chọn preview không phát sinh generation. Giữ token dark/lime, outline icon, form/buttons chung. Desktop dùng disclosure/inspector, <=760px cùng vùng cuộn và drawer; dialog/control dài không chồng preview/input. Khi triển khai phải xem1280/1920/820/600/390 và kiểm keyboard/focus/Undo/Save/reopen. Đây là phương án UX đã phân tích, chưa có control mới ở app.

Hợp đồng đề xuất (chưa là schema hiện hành): nguồn lựa chọn gồmworkspace→template→project/job→override tường minh; mode màu keep/natural/preset, privacy off/review/track, watermark inherit/off/on, CTA inherit/off/overlay/end-card, music inherit/off/auto/selected và sfx inherit/off/vua/nhieu. Snapshot riêng cho từng job, validate capability; completion không xóa opt-in đã chốt và không bật lại explicit off. API/CLI/session dùng chung resolver, không tự đặt field chưa có vào project.json.

## 5. Skill v4 đã cài và giới hạn

Mẫu mới: editor/templates/chungauto-factory-quang-cao-v4; tên 'ChungAuto · Creative v4 — Quảng cáo & Review', version4/parentchungauto-factory-quang-cao. Không sửa v3 hoặc dự án Factory. SKILL.md11,487bytes trên đĩa CRLF (~11KB),9preset giữ nguyên; poster/preview nhỏ lấy từ bản cũ với provenance nói rõ là excerpt reference, không phải video do v4 dựng. Không chép nhạc license UNKNOWN, engine/dependency hoặc220MBfinal vào skill.

V4 bổ sung: lựa chọn độc lập theo brief; beat theo ý và cảnh chứng minh; source clock/mediaStart cho clip con; motion có chức năng, số liệu không đếm sai; caption/graphic coordination; matte/depth chỉ khi hỗ trợ; màu tự nhiên theo shot và giới hạn schema; biển số/handoff trung thực; logo/CTA tùy nhu cầu; nhạc/SFX có quyền, cue/onset/pitch/dedup; kiểm trên file giao và báo phần chưa kiểm. Không tự bật tất cả tính năng hoặc nhận có tracking/grade Factory.

Đã kiểm parent file hashes không đổi,9preset giữ nguyên và GET /api/library?local=1 trả mẫu v4 installed; GET /api/templates?id=... trả version4+skill. quick_validate chạy PythonUTF8 đạt; lần đầu công cụ đọc bằng cp1252 lỗi encoding, không tính đạt. Kiểm này chỉ cấu trúc và catalog, chưa chứng minh AI dựng tốt hơn; chưa giao agent/render video thử.

## 6. Lộ trình tiếp theo cho đúng nhu cầu này

1. Bộ policy tùy chọn chung và snapshot mọi adapter; màu/watermark/CTA/music/SFX opt-in/off giữ xuyên first-build/revise/completion. Loại bỏ xung đột gỡ màu cứng theo policy, không bật beauty tự ý.
2. Grade cả A/B-roll, màu nguồn đúng, before/after và kiểm preview/final; không gọi CSS preset là chuyển Log/Rec709 chuẩn.
3. Privacy schema/preview/manual keyframe/tracking+review+render gate; reuse thuật toán Factory chỉ sau kiểm dependency/license/timing và port vào pipeline chung. File plate_track.py trong job không chứng minh đóng gói sản phẩm dùng mọi video.
4. Preset động chapter/progress/stat/grid/callout/map chọn lọc, schema tham số, duration mỗi clip, caption collision; dùng HyperFrames/Remotion theo capability thật.
5. Chạy3video nguồn thật với lựa chọn bật/tắt khác nhau, kiểm người dùng, mix và file final. Ghi thời gian/token/số lần sửa/nguồn asset; so bảnv3/v4 cùng footage và brief. Chỉ nâng đánh giá khi có kết quả.

Bằng chứng: CHUNGAUTO_CREATIVE_Q2_AUDIT.json, CHUNGAUTO_CREATIVE_Q2_FINAL_SAMPLES.jpg; code source-color.js/watermark.js, app.js brandForm, ai-inbox.mjs first-build/--done; các smoke hiện có trong BUILD_STATUS. Không suy rộng QC lịch sử của Factory thành nghiệm thu ContentOS.
