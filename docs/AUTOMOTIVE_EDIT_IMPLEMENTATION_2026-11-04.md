## Hiện hành · Creative v16 · 04/11/2026

Làm đẹp mặt đã bind từng nguồn A-roll/SHA256 và clockcut/rate; nguồn thay/chuẩn hóa/chống rung cần quét lại, v1 chưa bind yêu cầu quét lạiv2. Nút quét không tự bật preset. WebGL2nguồn, MediaPipe Q2crop/UI và final2s đã kiểm;230/230test qua. Chưa whole-person/cổ/tay/nhiều người hoặc detector benchmark toànvideo. Xem [bằng chứng và giới hạn hiện hành](FACE_SOURCE_CURRENT.md). Các mô tả source/clockface chưa kiểm ởv15 bên dưới được thay trong phạm vi này.

## Hiện hành · Creative v15 · 04/11/2026

Theo ảnh người dùng, ưu tiên Bộ lọc→Làm đẹp: trắng da chỉ mặt nạ face landmark, bỏ dò màu toàn khung; gỡ nhóm nâng sắc da mới trong dialog chuẩn hóa. Chưa whole-person/cổ/tay/multi-source face. Có màu/chống rung→che biểnA/B-roll, khôi phụchai tầng, hash/range/review giữ. Suite229/229, WebGL và browser thực đã kiểm. Xem [hiện trạng, bằng chứng và giới hạn](COLOR_PLATE_CHAIN_CURRENT.md). Các ghi chúv14 bên dưới là lịch sử trước điều chỉnh này.

## Cập nhật hiện hành · Creative v14 · 04/11/2026

Chuẩn hóa HDR/Log→Rec.709, kho139LUT local, chống rung, batch tối đa40đoạn, NVENC media dẫn xuất và worker API đã có. Đã thêm nâng sáng sắc da tùy chọn0–30%, mặc địnhtắt, sau chuẩn hóa/look; heuristic không phải nhận diện mặt. GPU toàn composition chưa xác minh. Đã tìm lại nguồn Q2 tại D:/Edit tự động/source (DJI tag709), thay kết luận nguồn không có ở các ghi chú lịch sử bên dưới. Xem [nâng sáng sắc da và bằng chứng](SKIN_LIFT_CURRENT.md), cùng [trạng thái chuẩn hóa, UX và giới hạn](COLOR_NORMALIZATION_CURRENT.md).

## Khảo sát bổ sung kho LUT và Quản lý file · yêu cầu người dùng

Nguồn đọc: Sources-Win/ProVideoColorGradingStudio.cs tại NAS Quan ly file. Code có normalize tầng1, look tầng2, fine-tune EV/shadows/highlights/vibrance/temperature/tint, skin lift YCbCr heuristic, vidstab2pass và deshake1pass; profile AUTO, giữ nguồn, trim. Các tên FAST_GYRO/DaVinci trong UI cũ không chứng minh dữ liệu gyro hay engine DaVinci; ContentOS sẽ dùng đúng tên thuật toán. Chưa chạy app nguồn hoặc benchmark tốc độ app đó. Theo REA skill, source repository đủ thì dùng đọc source thường, không cần giải biên dịch.

Kho NAS LUTS có154cube trực tiếp (chưa mở archives), size16/17/32/33/64/65, có Apple Log1D→linear không phù hợp Rec709. Cho nhập thư viện shared local, dedupe SHA256, ghi đường nguồn/headers/hệ màu và trạng thái; chỉ LUT kỹ thuật có chứng cứ input+output tương thích mới vào lựa chọn tự động. Các LUT cá nhân/creative chưa rõ input nằm Chưa phân loại để người dùng chọn đúng; không gọi tất cả là LUT Rec709. Không sửa/xóa NAS và không tải lên mạng. Không tự giải nén archive chưa kiểm vì chưa biết format và trùng.

Máy thực NVIDIA RTX4070Ti (khác dự kiến4070S của các máy khác), driver610.88; FFmpeg có h264/hevc_nvenc, vidstab/deshake. Cần encode test thực trước chọn GPU. zscale/lut3d/vidstab CPU; NVENC encode GPU, không tuyên bố tất cả pipeline GPU. Áp dụng toàn bộ cần batch plan theo profile từng nguồn, không ép một LUT technical lên mixed HDR/Log/SDR.

## Yêu cầu mới và phân tích trước làm: chuẩn hóa màu nguồn trước chỉnh sáng/da/look

Người dùng yêu cầu tự nhận hệ màu nguồn/thiết bị (HDR iPhone, S-Log, D-Log…) → chuyển màu chuẩn → làm tươi sáng/da sáng hoặc LUT phong cách. Không coi histogram SDR/CSS hiện có là chuẩn hóa Log/HDR. Probe thực DJI_0061_D.MP4 trên D ghi10bit bt709; camera DJI/10bit không chứng minh D-Log. Metadata có thể không ghi Log; cần override rõ thay vì suy từ tên máy.

Luồng đích: chọn Video/B-roll → Chuẩn hóa màu nguồn → đọc metadata (primaries/transfer/matrix/range/pixel format/model/Dolby side data) → auto nếu HLG/PQ đủ tags, hoặc chọn profile → LUT kỹ thuật đúng input cho Log → optional LUT phong cách Rec.709 → tạo bản SDR dẫn xuất → xem/thay → điều chỉnh brightness/da/look sau. Rec.709 là màu đích video social hiện tại; nguồn gốc giữ nguyên. Vị trí cùng inspector Màu riêng, không sidebar; disclosure nâng cao cho profile/LUT, trạng thái chạy/lỗi/xung đột rõ. Chuẩn hóa không tự làm trắng da/toàn bộ màu sơn. Skin lift cần ROI/mask/bảo toàn sắc da riêng, chưa có trong bước normalize.

HLG/PQ dùng FFmpeg zscale→linear→tone map→bt709, metadata output SDR. iPhone Dolby Vision chỉ dùng base HLG/PQ đủ tags, không khẳng định xử lý dynamic Dolby metadata đầy đủ. Log cần LUT kỹ thuật được nhập và gắn input profile; không tải LUT bất kỳ hoặc giả dựng từ filter vivid. LUT look áp sau normalize và khai báo Rec.709 input. Bake vào media dẫn xuất để preview/final cùng màu, không dùng CSS LUT. Từ chối double normalization/plate source xung đột cho đến khi có mapping; restore phải giữ source clocks/transcript.

Kiểm thực probe/header/SDR tagged vs unknown/HLG/PQ, .cube validation, pipeline order/no-op/Log missing LUT, derived audio+duration+output tags, UI desktop/mobile/apply/Undo/reopen và final render. Chưa tuyên bố support mọi profile/thiết bị hoặc da tự động nếu thiếu bằng chứng.

## Phân tích màu từng đoạn · Creative v12 · 04/11/2026

Inspector A-roll/B-roll có Phân tích màu cảnh: local FFmpeg lấy3frame10/50/90% đoạn nguồn, histogram sáng/clipping/neutral pixels, gợi ý SDR nhẹ theo source-color. Dialog dùng style chung,3nút chọn frame và cặp ảnh nguồn/gợi ý, thay màu riêng chủ động/Save/Undo/reopen, không sidebar mới. So sánh chưa cộng màu chung/màu riêng cũ; áp dụng thay color, không tự nhập LUT, không tự sửa mọi shot. Backend request kiểm workspace/revision/project và source stat trước/sau, từ chối ngoài nguồn. API analyze_shot_color chỉ trả metrics/gợi ý, không đưa bitmap vào model context; CLI phan-tich-mau.mjs chỉ đọc nguồn/project. Nguồn/engine Factory không sửa.

Bằng chứng: SHOT_COLOR_BROWSER_SMOKE.json endpoint thực1280/1920/390,3frame xem được/no mutation trước apply/Save/Undo/reopen, ảnh đã xem; SHOT_COLOR_FINAL_SMOKE.json final tổng hợp1920×1080: gray48 thành57 với brightness0.18. SHOT_COLOR_REFERENCE_SMOKE.json đọc NAS reference19–22s và ảnh đã xem; đó là video đã dựng có graphic, không phải footage thô. Mọi đường footage gốc trong Q2 job.json hiện không tồn tại. Không coi kết quả reference là nghiệm thu màu nguồn hoặc aesthetic benchmark. Suite223/223 qua workspace/logs/shot-color-suite.log, gồm real FFmpeg/sample/cut/mute limits và API tool-loop gateway tổng hợp; không provider trả phí/đăng bài.

Main5180 đã restart idle, catalogV12/UI HTTP200 xác minh, xem SHOT_COLOR_DEPLOY_SMOKE.json.

Skill mới riêng chungauto-factory-quang-cao-v12 parentV11 giữ9preset/bản cũ, quick_validate qua, preview vẫn trích reference. Chưa detector shot, chuyển Log/HDR, nhận diện da/màu sơn chuẩn hoặc khớp màu reference; neutral WB là heuristic, cần xem thật. Goal ngành xe tiếp tục active; còn nhiều biển/cut recovery, benchmark cảnh trám/motion/nhạc/SFX agent thật và installer Python/OpenCV. Các ghi chú chưa có phân tích shot bên dưới chỉ được thay trong phạm vi gợi ý3frame này.

## Phân tích trước làm: gợi ý màu từ khung hình thực

Căn cứ inspector Màu riêng A/B-roll, source-color renderer, dịch vụ media metadata và audit VEK/CapCut/Premiere hiện có; không khảo sát mới app bên ngoài. Preset tu-nhien hiện cố định nên không phản ánh sáng/ám màu của cảnh. Thêm nút Phân tích màu cảnh trong inspector hiện tại, không sidebar. Dialog chung: trạng thái phân tích → so sánh ảnh nguồn/gợi ý → thông số và giới hạn → Áp dụng màu riêng hoặc đóng. Chủ động áp dụng, Save/Undo/reopen; không tự đổi mọi cảnh/màu đã chỉnh.

Dịch vụ local lấy3khung ở đầu/giữa/cuối đoạn nguồn (không đoán từ file), FFmpeg auto rotation, scale nhỏ. Đo histogram sáng/clipping/saturation và neutral pixels; gợi ý thông số bounded của source-color, chỉ WB nhẹ khi đủ neutral, không nhận diện Log/da/paint chính xác. So sánh ảnh là màu riêng, chưa cộng màu chung. Không thay source. Request kiểm project/revision/workspace; source stat trước/sau và từ chối đoạn ngoài media. Mặc định không áp preset/màu tự động. Kiểm histogram tổng hợp dark/bright/cast, video thật Q2 nếu đường nguồn còn đọc được; UI1280/1920/390 và final ảnh so sánh.

## Hạ nhạc theo lời A-roll · Creative v11 · 04/11/2026

Âm thanh → Trộn âm có Hạ nhạc theo lời A-roll (audio.duckSourceSpeech), mặc định tắt, dùng chung duckLevel/duckFade với clip voice. Build lấy transcript đúng nguồn hiện có, giao mốc từ với đoạn giữ/tốc độ, bỏ đoạn mute/không tiếng; nhạc phục hồi ngoài vùng lời và ở outro. Hoạt động repeat/crossfade, kết hợp duckNarration. Thiếu transcript hoặc sourceClock nhiều nguồn cũ thì báo lỗi, không nhận đã xử lý; không là waveform/VAD. musicSpeech thủ công giữ nguyên. UI dùng nhóm/control cũ, không sidebar mới; đã sửa binding checkbox mới sau Undo để ghi project hiện hành.

Bằng chứng: PRIMARY_SPEECH_BROWSER_SMOKE.json endpoint thực/preview iframe/Save/Undo/reopen1280/1920/390, ảnh đã xem. PRIMARY_SPEECH_FINAL_SMOKE.json: final tổng hợp5giây, nguồn có audio im lặng3giây+outro2giây, nhạc sine, lời giả lập1–2giây; PCM speechGainRatio0.199, nhạc phục hồi sau lời/ở outro. Không là nghiệm thu ASR thật/chất lượng nghe. tests/primary-speech.test.mjs cut/speed/mute/stale/API boolean/build hai loop; suite220/220 ở workspace/logs/primary-speech-suite.log. Skill riêng chungauto-factory-quang-cao-v11 parentV10 giữ9preset/bản cũ, quick_validate qua; preview mẫu vẫn trích reference.

Main5180 đã restart sau kiểm idle; catalogV11/helper HTTP200 xác minh, xem PRIMARY_SPEECH_DEPLOY_SMOKE.json.

Chưa có detector nhiều biển/cut recovery, grade phân tích shot, benchmark chọn cảnh/motion/nhạc/SFX với agent và footage thật, installer Python/OpenCV độc lập. Ước lượng55–60% lõi ngành xe chưa thay đổi; goal tiếp tục active. Những mô tả cũ chỉ duck theo clip bên dưới là lịch sử trước mốc này.

## Phân tích trước làm: hạ nhạc theo lời A-roll

Căn cứ code Trộn âm, music-duck/music-loop, sourceTranscriptClock và audit VEK/CapCut đã lưu; không khảo sát mới CapCut. Khoảng trống: duckNarration chỉ lấy audio.clips; người dùng dựng talking-head phải khai báo musicSpeech thủ công. Reuse checkbox trong Trộn âm, không thêm tab/sidebar. Wireframe: [Hạ nhạc theo clip thuyết minh] [Hạ nhạc theo lời A-roll] → mức còn lại và thời gian chuyển chung. Mặc định tắt; yêu cầu transcript đúng nguồn, lỗi thiếu/cũ hiện rõ thay vì nhận đã xử lý. AI đọc schema để bật khi được giao âm thanh.

Build lấy work/transcript.json và map giao từng từ với các đoạn giữ còn tiếng, tốc độ/timeline; gộp khoảng gần nhau, clamp tại contentTotal để outro không bị hạ theo nguồn. Không dùng caption sửa tay làm detector; chưa phân tích waveform/VAD hoặc tiếng động thực. Kết hợp vùng clip voice nếu bật cả hai, áp dụng crossfade/repeat. Giữ musicSpeech thủ công khi tắt hai chế độ tự động. Không sửa transcript/nguồn. UI Save/Undo/reopen và desktop/mobile, test cut/speed/muted/stale transcript, final audio mức giảm/tăng thực.

## Outro/CTA tùy chọn · Creative v10 · 04/11/2026

Thương hiệu → Đoạn kết / CTA dùng disclosure/control chung, mặc định tắt; thời lượng1–12giây, tiêu đề/phụ đề/liên hệ, logo local và màu. Track Video có block Outro / CTA; Xem đoạn kết, Lưu/Hoàn tác/mở lại/tắt đã kiểm qua HTTP browser1280/1920/390. Không thêm sidebar. Phân tích UX trước code nằm trong AUTOMOTIVE_EDIT_IMPLEMENTATION_2026-11-04.md.

project.endCard có schema kiểm kiểu và asset; API set_edit_fields dùng object, ảnh mới cần inspect_media. Timemap.contentTotal giữ mốc nội dung, total cộng outro; nguồn/voice/overlay dừng tại nội dung, nhạc đã chọn tiếp tục tới hết đoạn kết. cta off tắt endCard. Không có video outro/HTML tùy ý trong schema này. Sửa dự án làm hết hạn receipt duyệt bản che như các chỉnh sửa khác.

Bằng chứng: END_CARD_BROWSER_SMOKE.json (preview iframe thực, Save/Undo/reopen/off), END_CARD_FINAL_SMOKE.json và ảnh END_CARD_FINAL_FRAME.jpg/END_CARD_FINAL_WIDE.jpg đã xem: final tổng hợp dọc1080×1920 và ngang1920×1080,3giây nội dung+2giây outro=5giây; đuôi nhạc dọc có tín hiệu PCM, chưa là nghiệm thu chất lượng phối nhạc. tests/end-card.test.mjs kiểm source clock/CTA off/asset/schema/API tool-loop tổng hợp; suite218/218 qua workspace/logs/end-card-suite.log. Không gọi model trả phí/đăng bài.

Main5180 đã khởi động lại sau kiểm dispatcher0/0, render/ASR lock null và không Remotion worker; catalogV10 và helper/UI HTTP200 xác minh (END_CARD_DEPLOY_SMOKE.json).

Mẫu riêng chungauto-factory-quang-cao-v10 parentV9 giữ9preset và bản cũ; quick_validate qua. Preview/poster vẫn trích reference, không phải sản phẩm mới của skill. Ước lượng55–60% lõi dựng tự động ngành xe là đánh giá kỹ thuật, không tỷ lệ nghiệm thu127nhóm. Chưa có detector nhiều biển/cut recovery, grade phân tích shot, benchmark motion/B-roll/music/SFX trên footage thật và bộ cài Python/OpenCV độc lập. Goal nâng cấp ngành xe tiếp tục active. Ghi chú dưới về chưa có end-card là lịch sử trước mốc này.

## Phân tích trước làm: outro/CTA là đoạn kết riêng

Căn cứ: code brandForm/logo, timemap/build/runtime và timeline Video hiện có; các audit VEK/CapCut đã lưu. Không khảo sát mới app bên ngoài trong mốc này. Công việc: bật đoạn kết sau nội dung, chỉnh thời lượng/tiêu đề/lời nhắc/liên hệ/logo/màu; nhiều video không cần nên mặc định tắt. Vị trí: disclosure Đoạn kết / CTA trong Thương hiệu, không thêm sidebar. Timeline Video hiển thị khối Outro sau đoạn cuối, bấm mở đúng nhóm và seek vào đoạn kết. Wireframe: [Bật đoạn kết] → [thời lượng] [tiêu đề] [lời nhắc] [liên hệ] → nâng cao [logo/nền/màu nhấn]; nút xem đoạn kết.

Timeline tách contentTotal (A/B-roll) và total (nội dung+outro). Cảnh/voice/caption giữ mốc nguồn và kết thúc trong contentTotal; không kéo frame cuối video hoặc phụ đề/overlay sang outro. Nhạc nền đã chọn kéo đến total và fade cuối; không tự thêm nhạc khi lane tắt. Outro dùng HTML/GSAP đáng tin cậy với layout16:9/9:16, đọc được chữ Việt, logo nhập local, không mã từ người dùng. Bật/tắt/sửa dùng Save/Undo/reopen; cta off của job phải tắt cả đoạn kết này. API có schema endCard và CLI sửa cùng project. Preview/final phải cùng độ dài, không chỉ overlay lên giây cuối.

Kiểm units mapping/toggle/off/API asset guard, browser1280/1920/390 field+Undo/Save/reopen và overflow; final thực có đoạn nguồn rồi đoạn kết, audio nếu đã bật, không kéo tiếng nói/footage. Mốc này không gọi thư viện outro từ app khác hoặc cho phép video outro tùy ý chưa hỗ trợ.

## Duyệt bản che trước tự xuất · 04/11/2026

Có nút Kiểm tra bản che trước tự xuất trong inspector đoạn A/B-roll đã che, dialog dùng token chung với video từng media và xác nhận chủ động. POST/GET /api/plate-review gắn revision/workspace; work/plate-review.json lưu khai báo người dựng theo revision+hash media, không sửa project/timeline. Thay project hoặc media hết hạn; API worker không có tool duyệt. Lưu xác nhận không tự xuất/đăng.

launchCompletionExport dùng gate chung: thiếu receipt hợp lệ thì done+awaiting-review+completionReviewReason, không spawn render. Activity/chat hiện lý do. Child --auto-export kiểm lại sau render lock, trước và sau snapshot; asset hash trong snapshot phải trùng media đã duyệt. Manual export vẫn chủ động như trước. Nhận diện những đoạn enabled có platePrivacy hoặc src trong inputs/privacy; thiếu proof bị giữ để kiểm. Chưa có detector/policy bắt buộc toàn video che và không bắt mọi trường hợp đổi tên/copy/xóa provenance. Không coi xác nhận là bằng chứng mọi biển kín hay theo dõi người thật đã xem.

Bằng chứng: tests/plate-review.test.mjs receipt/revision/hash/path-without-proof/snapshot mismatch và child tự xuất bị chặn trước render; tests/activity.test.mjs lý do chờ kiểm. PRIMARY_PLATE_PRIVACY_BROWSER_SMOKE.json mở rộng review1280/1920/390, PLATE_REVIEW_*.png đã xem. PLATE_REVIEW_COMPLETION_SMOKE.json endpoint/session claim thực: candidate tổng hợp có tracker thật, thiếu review không spawn; duyệt HTTP, lượt cùng revision auto-export MP4 thành công (test chạy lại sau snapshot check). Không model/provider trả phí/đăng bài. Suite215/215 qua workspace/logs/plate-review-suite.log, related tests sau bổ sung snapshot check qua; V9 quick_validate qua. Main5180 restart idle, helper200 và catalogV9 xác minh.

Skill mới Creative v9 parentV8 giữ9preset/các bản cũ; quy tắc duyệt/gate cập nhật. Goal tiếp tục active. Còn detector/nhiều vùng/cut recovery, end-card kéo dài, grade phân tích shot, benchmark motion/B-roll/music/SFX nguồn thật và installer Python/OpenCV. Những câu dưới về chưa có gate là lịch sử trước mốc này.

## Phân tích trước làm: duyệt bản che trước tự xuất

Bằng chứng hiện có: dialog che A/B-roll và browser1280/1920/390, source timing/final thử tổng hợp. Khoảng trống: launchCompletionExport tự chạy sau AI done dù provenance yêu cầu xem lại. Dùng inspector hiện có cạnh nút che/khôi phục, không thêm sidebar. Nút Kiểm tra bản che trước tự xuất mở dialog chung liệt kê các đoạn đã che đang dùng, video xem thử từng media, xác nhận do người dựng thực hiện. Không gọi phát video là bằng chứng đã kiểm; ghi rõ cần xem đủ đoạn và kiểm bố cục trên preview timeline. Nút Lưu xác nhận không sửa timeline/Undo vì đây là biên bản theo revision, lưu riêng work/plate-review.json; sửa project/media làm hết hạn.

Backend lấy project/revision/workspace thật, kiểm hash media và lưu receipt nguyên tử. AI API không có tool duyệt. Gate chung trước spawn auto-export ghi done+awaiting-review và lý do để Activity/chat hiện rõ; không báo job dựng lỗi hoặc auto đăng. Child auto-export kiểm lại sau đợi render lock, tránh dùng receipt cũ. Manual export vẫn chủ động như trước. Chỉ kiểm những media che được nhận diện theo provenance hoặc đường dẫn inputs/privacy; không phải detector/gate đảm bảo mọi biển trong nguồn đã tìm thấy.

Test receipt/revision/hash/hide/forged fields, endpoint thật, Activity reason, browser desktop/mobile review/save/edit-invalidates; không gọi provider hay đăng bài.

## Che biển A-roll theo đoạn · 04/11/2026

Đã mở rộng tracker dùng chung cho Video/A-roll: chọn đoạn trên track Video hoặc Văn bản→Cắt, Che biển số · tracking local. Dialog preview→chủ động thay, Lưu/Hoàn tác/mở lại/khôi phục giữ nguồn gốc. selected source from=in cho legacy hoặc mediaStart cho multi-source; duration=out-in không nhân speed. Thay riêng src/mediaStart/mediaInfo, giữ in/out, hiệu ứng và audio. Khôi phục sau trim/split giữ offset. Source transcript clock nhiều nguồn giữ mapping nguồn gốc; không ép ASR lại vì chỉ thay hình che cùng lời.

API vision có mask_primary_plate, yêu cầu nhận frame ở lượt trước giống B-roll. CLI che-bien-so nhận --segment thay --broll, chỉ sửa candidate. Build kiểm hash media A-roll đã che và chặn nới ngoài khoảng xử lý; chặn matte/clean/freeze/dissolve cùng nguồn che để tránh ảnh/tiếng gốc lộ lại. Chưa chặn toàn bộ phương pháp tự sửa/xóa provenance và chưa có policy bắt buộc/privacy gate auto-export. API completion build candidate dùng media root của dự án sống khi xác minh media; không fallback đường dẫn tùy ý.

Mẫu mới riêng Creative v8 parentV7, giữ9preset/preview reference và các bản cũ. Không thêm menu/sidebar; inspector đã bỏ text null do append giá trị rỗng. Browser HTTP thực ở1280/1920/390 (PRIMARY_PLATE_PRIVACY_BROWSER_SMOKE.json) xác minh preview không sửa project, replace/Save/Undo/reopen/restore; ảnh đã xem. PRIMARY_PLATE_PRIVACY_FINAL_SMOKE.json: MP4 tổng hợp0.5s1920x1080/audio/2x, tâm mask đủ15frame; final frame đã xem. tests/plate-privacy.test.mjs chạy media/tracker/build thật, source clock/trim/restore, hash/range rejects, API tool-loop gateway tổng hợp và CLI claim/candidate. Suite214/214 qua ở workspace/logs/primary-privacy-suite.log; skill quick_validate qua. Main5180 restart sau dispatch0/0/render idle/ASR null/no Remotion; templateV8 và static helper200. Không gọi provider trả phí hoặc đăng bài.

Còn thiếu cho mục tiêu đầy đủ: detector/nhiều vùng/cut recovery, privacy gate auto-export, end-card kéo dài, grade phân tích shot, benchmark motion/B-roll/music/SFX trên footage thật, bộ cài độc lập Python/OpenCV. Phạm vi che một vùng/đoạn0.2–15giây, opaque mask; cần xem toàn đoạn/final, không tự chứng nhận mọi biển đã kín. Goal tiếp tục active; các câu dưới đây về A-roll chưa hỗ trợ là lịch sử trước mốc này.

## Phân tích trước làm: che A-roll theo đoạn

Căn cứ UI thực đã kiểm ở PLATE_PRIVACY_BROWSER_SMOKE (preview→thay→Save/Undo), code inspector segments và build/timemap/primary-clips. Tái dùng dialog ROI hiện có như workflow mask theo clip của editor; không thêm sidebar, không nhận đã khảo sát CapCut mới. Điểm vào: Video → chọn đoạn → Che biển số. Giữ timeline in/out, crop/transform/color/zoom/audio/speed; nguồn dẫn xuất riêng, chỉ đổi src/mediaStart/mediaInfo của đoạn. Không chuyển cả dự án sang nguồn khác. Không hỗ trợ matte/clean/freeze/dissolve khi thay nguồn để tránh ảnh/tiếng lệch. Đoạn dài cần chia trước. Giữ preview→chủ động thay; dirty/revision/workspace đổi phải dừng, khôi phục nguồn và Undo/Save cùng editor.

Dialog chung dùng nhãn theo Video/Cảnh trám, ROI trên khung nguồn đúng source offset. Thời gian A-roll=out-in giây nguồn, không nhân tốc độ; thời lượng đầu ra giữ (out-in)/speed. Nguồn đơn dùng in, nhiều nguồn dùng mediaStart. Khôi phục phải tính trim/split sau che, không đặt lại in/out hoặc cắt nhạc/chữ. Transcript logic giữ mapping về nguồn gốc chỉ khi provenance privacy cung cấp nguồn/from; không nhận là QC toàn bộ biển. Kiểm service/HTTP/browser1280/1920/390, Save/Undo/reopen và final giữ tiếng/nhịp/che pixel.

## Worker API che biển theo vùng · 04/11/2026

Đã nối createApiPlatePrivacy vào worker API first-build/revise. Tool mask_broll_plate chỉ hiện khi model supportsVision và có media context. Phải nhận sample_media_frames đúng src tại mediaStart ở lượt model trước; cùng batch sample+mask bị từ chối. Tracker local dùng chung editor/CLI, giữ nguồn và chỉ thay candidate, provenance ghi requiresVisualReview. Kiểm ownership/job/base revision/media và hash bản che trong suốt lượt API; lỗi tracking không áp candidate. Chấp nhận speed số hoặc chuỗi số như inspector/build. Mẫu mới riêng Creative v7 parentV6, giữ9preset và các phiên bản cũ. Không thay UI/menu ở mốc này.

Bằng chứng: tests/plate-privacy.test.mjs mở rộng với mediaContext lấy JPEG thật, gateway tổng hợp có tool loop, tracker thật trên nguồn chuyển động, từ chối mask cùng lượt lấy frame, giữ nguồn/candidate tách biệt và phát hiện bản che bị sửa. Suite214/214 qua (workspace/logs/automotive-api-suite.log), syntax server và skill quick_validate qua. Main5180 khởi động lại sau kiểm dispatcher0/0, render idle, ASR job null, không Remotion worker; endpoint templates trả v7/parentV6. Không gọi model/provider trả phí, chưa nghiệm thu HTTP worker với model thật hoặc năng suất.

Còn thiếu: che A-roll, detector/nhiều vùng, gate privacy trước auto-export, end-card kéo dài, grade phân tích shot và benchmark semantic motion/audio nguồn thật. Chọn review khi cần kiểm biển; chưa có gate tự động bảo đảm che hết. Ước lượng55–60% lõi edit giữ nguyên, không suy tỷ lệ từ test. Goal nâng cấp ngành xe tiếp tục active. Các ghi chú API chưa có tracker dưới đây là lịch sử trước mốc này.

## Mốc che biển theo vùng · 04/11/2026

Đã thêm **Cảnh trám → chọn cảnh → Che biển số · tracking local**. Chọn ROI trên frame nguồn đầu khoảng mediaStart bằng kéo hoặc tọa độ0–1, tạo media dẫn xuất riêng, xem trước và chủ động thay; có Save/Undo/khôi phục nguồn trước khi che. Giữ timing/layout/màu/speed/audioVol; mediaStart mới0. Hiện mask đặc có đệm18%, optical-flow affine/RANSAC; không phải detector, blur hay mosaic. Một vùng B-roll liên tục0.2–15giây, tối đa4K/kích thước chẵn, máy này đã có Python/OpenCV. Kiểm claim/revision/source hash, không đổi source; mất điểm bám/ra khung/timeout fail không trả bản dùng được. Đóng dialog hủy request/process tree. Không xem inliers/OCR0 là privacy QC tuyệt đối.

Service `src/services/plate-privacy.mjs`, tracker `editor/tools/plate-track.py`, dialog `editor/ui/contentos-plate-privacy.js`, endpoint POST `/api/plate-privacy`. CLI first-build `editor/tools/che-bien-so.mjs <dự án> --claim ID --broll ID --roi x,y,w,h --apply` xác minh job/candidate/claim/revision và chỉ sửa candidate, không project sống/export. Mẫu mới riêng **chungauto-factory-quang-cao-v6**, parentV5,9preset; quy tắc chỉ dẫn đúng tool/phạm vi. Các bản cũ và dữ liệu Factory/NAS giữ nguyên.

Bằng chứng: `tests/plate-privacy.test.mjs` track biển tổng hợp chuyển động, mask pixel tại3vị trí trên đủ30frame, audio giữ, input nguyên vẹn, từ chối ROI lỗi/vùng trơn, abort sẵn, failed output không phát hành, CLI thực áp candidate không sửa live. `PLATE_PRIVACY_BROWSER_SMOKE.json` HTTP+dialog thật1280/1920/390: frame nguồn/result preview/explicit replace/Save/Undo, không gọi provider. `PLATE_PRIVACY_FINAL_SMOKE.json`: HyperFrames final3s1920x1080,5frame kiểm tâm mask ở đoạn che; ảnh final đã xem. `PLATE_REAL_Q2_SMOKE.json` thử1giây từ master Q2 tại19.2s,30frame đã xem trong `PLATE_REAL_Q2_ALL_FRAMES.jpg` (chỉ vùng/đoạn được đánh dấu).

Còn thiếu cho mục tiêu đầy đủ: A-roll privacy, detector tìm biển, nhiều vùng/cut/occlusion recovery, API-agent tool, policy yêu cầu che gắn gate auto-export, kiểm biến đổi plate xuyên trim/speed/multi-shot thực; request-bound chưa có queue/recovery lâu dài. Chưa kiểm cancel giữa chừng bằng browser/HTTP riêng. End-card kéo dài, grade phân tích shot và semantic motion/audio nguồn thật vẫn còn. Không nâng tỷ lệ edit chỉ từ mốc này. Các câu lịch sử nói chưa có bất kỳ tracker nào được thay thế trong đúng phạm vi B-roll theo vùng nêu trên.

# Nâng cấp dựng ngành xe — phân tích trước triển khai

Yêu cầu mới04/11/2026 cho phép triển khai tính năng và UI ngành xe, cập nhật skill. Giữ mục tiêu đầy đủ màu A/B-roll, biển số/tracking, watermark, outro/CTA, semantic B-roll/motion và audio. Không coi một milestone policy là hoàn tất mục tiêu.

## Phân tích UX và vị trí tích hợp

Căn cứ: ảnh Home người dùng, audit VEK/CapCut và khảo sát CREATIVE_Q2_3MANG đã ghi trong CHUNGAUTO_CREATIVE_Q2_SKILL_V4_AUDIT_2026-11-04.md. Người dùng muốn giao việc nhanh và chỉ mở điều khiển khi cần. Không thêm sidebar ngành xe hoặc editor riêng. Disclosure Tùy chọn dựng ngành xe nằm cạnh mẫu trong setup, cùng field/button/dark/lime của VEK. Không bày toàn bộ JSON/engine vào luồng thường dùng. Chọn keep/inherit không tự thay màu/nhạc/logo; explicit off phải thắng mẫu/AI/completion. Các ngành khác vẫn dựng bình thường, lựa chọn này chỉ gửi khi người dùng chủ động bật.

Bước đầu triển khai policy đã hỗ trợ: giữ màu hoặc preset tự nhiên nhẹ cho các đoạn và cảnh trám; giữ/tắt watermark; giữ/tắt CTA preset; giữ/tắt nhạc và SFX level. Label preset tự nhiên phải nói rõ đây là preset, không phải đo WB/Log/AI grade từng shot. Chưa có privacy renderer thì chưa đưa nút tự che hoạt động giả; privacy/tracking cùng CTA end-card riêng tiếp tục milestone sau.

Snapshot do server validate, gắn job/candidate và enforce ở completion chung cho API/CLI/session; không phụ thuộc AI nhớ prompt. Revise/mọi policy tương lai phải đối chiếu snapshot và cho override có chủ ý. Không tự ép lại setting cũ trên mọi Save tay. Chỉ remove CTA có provenance/role rõ; không xóa lời nói hoặc chữ bất kỳ theo regex nội dung. Grade B-roll cần schema/build/inspector/API cùng kiểm, không UI-only.

## Nghiệm thu

Unit policy: malformed rejected, explicit off wins, preserve existing choices, natural A/B clips valid and no global beauty, candidate separate. API/session completion snapshot và project revision; synthetic build/final verifies B-roll color. UI setup1280/1920/820/600/390, disclosure/keyboard/state/payload; nguồn người dùng không đổi. Chưa chạy trả phí, không đăng bài. Cập nhật evidence và giới hạn sau mỗi bước.

## Mốc triển khai ngành xe · 04/11/2026

Đã thêm disclosure **Tùy chọn dựng ngành xe** trong setup cạnh mẫu, opt-in theo lượt: màu keep/preset tự nhiên/off; watermark keep/off; CTA keep/off; nhạc keep/off; SFX keep/tat/vua/nhieu. Không thêm sidebar. Snapshot được kiểm hash trước khi áp ở completion API hoặc phiên/CLI; lựa chọn explicit thắng candidate/template. Dữ liệu lựa chọn lưu `project.automotiveOptions`, không thay metadata contentos được bảo vệ; sửa tay/revise sau không bị tự ép policy cũ.

B-roll có schema, build filter và inspector màu riêng (preset/sáng/tương phản/bão hòa/nhiệt độ/tint/hue/blur); vignette riêng chưa hỗ trợ. Natural là preset nhẹ, không AI đo WB/Log/da. Keep giữ màu nguồn trước job, logo brand đã chốt và nhạc đã chọn hoặc nhạc mẫu khi chưa chọn. CTA off chỉ lọc lớp có role/provenance CTA rõ; không nhận dạng mọi CTA bằng hình ảnh/nội dung. Music off quản lý lane nhạc nền audio.music, không xóa lời đọc hoặc nhạc đã dính vào source. SFX tat đặt gain0 cho cue thủ công lẫn tự động.

Mẫu riêng **chungauto-factory-quang-cao-v5** đã cài, parent v4; v3/v4 giữ nguyên. Có9preset, nâng quy tắc semantic B-roll/motion/audio và hợp đồng tùy chọn; không nhận17composition Factory đã chuyển. Preview vẫn là trích video tham chiếu, không video mới dựng bằng v5. Skill khoảng12KB; không sao nhạc có license UNKNOWN từ Factory.

Bằng chứng: AUTOMOTIVE_API_SMOKE.json (gateway tổng hợp local, HTTP/worker/MP4 final3s1080x1920@30fps); AUTOMOTIVE_SESSION_SMOKE.json (candidate tổng hợp, claim/completion thật, explicit off và nhận lượt thứ hai); AUTOMOTIVE_SETUP_BROWSER_SMOKE.json + ảnh1280/1920/820/600/390. Không gọi provider trả phí hoặc đăng bài, chưa chạy agent thật trên footage ChungAuto. Bộ service suite213tests qua sau cập nhật (xem log lượt thực thi); skill quick_validate UTF8 qua. QA phát hiện sửa lỗi guard terminal khi ghi job dựng tiếp cùng đường dẫn và lỗi grid rail Home bị style mobile editor ảnh hưởng. MP4 tổng hợp kiểm cấu trúc đầu ra; không dùng để kết luận chất lượng dựng/mix nguồn thật.

**Chưa hoàn tất mục tiêu nâng cấp ngành xe:** tracking/che biển số với QC mọi frame; phát hiện biển tự động; end-card riêng/kéo dài; grade phân tích từng shot/Log→709; semantic B-roll và motion được benchmark nguồn thật; nghe duyệt mix nhạc/SFX; test worker CLI thật; inspector màu B-roll Save/Undo/reopen/final chưa nghiệm thu riêng. Batch service nhận policy nhưng dialog giao lô chưa có control. Giữ ước lượng lõi edit55–60%, chưa nâng tỷ lệ từ kiểm thử tổng hợp. Các checkpoint cũ nói chưa có policy UI/backend chỉ là lịch sử trước mốc này.


## Phân tích trước làm: che biển số theo vùng trên cảnh trám

Công việc: người dựng chọn biển trên frame đầu của khoảng nguồn cần dùng, tracker chạy local rồi xem bản che trước khi thay. Tham khảo bằng chứng optical-flow Factory Q2 và pattern preview→explicit replace của Remotion hiện có; không sao thông số/đường dẫn hardcode Factory, không nhận detector tự tìm biển. Vị trí: inspector cảnh trám, nút Che biển số; không thêm sidebar. Bản che là media dẫn xuất, nguồn giữ nguyên; layout/timing/audioVol/màu giữ khi thay, mediaStart về0. Phạm vi một cảnh liên tục tối đa15s; tracker mất tín hiệu dừng và không trả bản dùng được. Người dùng phải xem toàn đoạn, có thể chia nhỏ/reseed, không coi inliers là privacy QC tuyệt đối.

UI dialog dùng token, label/control chung; video nguồn và vùng kéo, input tọa độ chuẩn hóa để keyboard chỉnh chính xác; create/abort/status/retry, bản kết quả riêng và nút thay rõ ràng. Đóng/hủy abort xử lý; không render/post AI hoặc thay timeline ngầm. Dirty project phải lưu; revision/workspace/source identity kiểm trước và sau. Thay dùng Save/Undo chung; media mới giữ provenance/source hash/range/ROI + per-frame track. Responsive dialog94vw, vùngpreview giới hạn vh. Dự kiến test tracker translation/failure, source containment/revision/cancel, API/browser preview→replace→Undo/Save/reopen và final render qua snapshot.

## Phân tích trước UI: nâng sáng sắc da sau chuẩn hóa · 04/11/2026

Công việc: footage nhân vật tối, người dựng muốn tăng sáng vừa phải trên sắc da, giữ giọng/source và khôi phục được. App nguồn ProVideoColorGradingStudio.cs có ComputeSkinWeight dùng cửa sổ YCbCr và lift nhân RGB; đây là heuristic sắc màu, không detector mặt. Cùng màu có thể nằm trên ghế da/nội thất/sơn. Không dùng nhãn nhận diện da AI hoặc tự bật trên mọi video.

Áp vào dialog Chuẩn hóa màu nguồn hiện có, sau LUT look: nhóm Nâng sáng sắc da với mức0–30% (0tắt), cảnh báo vật màu gần da có thể đổi. Chọn mức chủ động; batch dùng cùng mức nhưng preview chỉ đoạn đầu nên phải mở/kiểm các đoạn còn lại. Không thêm sidebar. Các tham số kỹ thuật/chống rung vẫn cùng workflow. Hành động chính Tạo bản Rec709 rồi xem/thay; nút hành động sticky để không phải cuộn hết form trên mobile. Mức nhập chính xác bằng số, mặc định0; đổi mức hủy trạng thái sẵn áp cũ.

Xử lý: sau HDR/Log→709 và LUT look, tạo3D LUT33 sắc da local với mask mềm YCbCr, ưu tiên shadow/mid và bảo vệ near-white, tăng RGB cùng hệ số để giữ hue. Không làm mịn/thay sắc da/face segmentation, không gọi tăng sáng là tẩy trắng. SDR không LUT vẫn xử lý được khi strength>0. Provenance lưu strength/algorithm và hashLUT, nguồn giữ nguyên. API dùng cùng schema/dịch vụ; không tự bật theo template. Kiểm pixel skin/neutral/blue/bright, actualFFmpeg/audio/source, UI Save/Undo/reopen/invalidation và footage Q2 trước/sau. Chưa đo chất lượng người dùng thì không nhận nghiệm thu thẩm mỹ.

## Phân tích trước tích hợp màu và che biển · Creative v15 · 04/11/2026

Công việc thực: cùng A-roll/B-roll cần chuyển HDR/Log, LUT/skinLift/chống rung rồi che biển. Luồng đích theo đúng thứ tự hình ảnh: chuẩn hóa/chống rung → xem/thay/Lưu → chọn ROI trên chính khung đã xử lý → tracking/che → kiểm toàn đoạn/Lưu → duyệt trước auto-export. Không tái dùng ROI từ hình gốc sau chống rung. Tham khảo workflow nguồn và chính dialog màu/plate đã kiểm ở1280/1920/390; không thêm sidebar, dùng control/nút hiện hành. Khôi phục bản che trở về bản màu, tiếp tục khôi phục bản màu mới trở về footage gốc. Người dựng cần hiểu hai bước, nên help dialog che nêu rõ đang dùng bản màu và giữ nó khi khôi phục.

Dữ liệu: platePrivacy.originalColorNormalization giữ provenance của bước trước, top colorNormalization được chuyển vào đó. src hiện hành là bản che, source của proof plate là bản màu. Clock transcript đi qua cả hai bước, cộng offset đúng thứ tự; trim/split/restore không thay lời. Hash/range của cả media màu và che phải khớp; B-roll cũng phải kiểm giống A-roll. Candidate CLI/API/UI dùng helper dùng chung để tránh khôi phục khác nhau. Gate plate-review vẫn gắn revision+hash bản che cuối, không thừa hưởng duyệt từ bản trước. Render snapshot kiểm chuỗi ở dự án trước khi sao chép media đang dùng.

Chưa cho đổi màu nguồn đã che: phải khôi phục che, sửa màu/tạo bản màu mới rồi đánh dấu lại. Cách này giữ ROI đúng hình sau chống rung và không giả chứng minh bản che còn đúng khi geometry đổi. Các hiệu ứng matte/clean/freeze/dissolve A-roll vẫn chặn cho đến khi có mapping đúng. Không coi khả năng ghép hai bước là detector nhiều biển hoặc bảo đảm che toàn video.

Tiêu chí: thựcFFmpeg+optical flow trên hình test có màu; A/B-roll, tốc độ/trim/clock/restorehai tầng, hash/range tampering, Save/Undo/reopen/UI/duyệt và MP4 final. Ghi rõ test tổng hợp khác benchmark Q2 thực.

## Điều chỉnh theo ảnh người dùng: ưu tiên Làm đẹp theo mặt nạ · 04/11/2026

Ảnh người dùng cho thấy Bộ lọc→Làm đẹp đã có slider và tỷ lệ tìm mặt16%. Cần dùng chính vùng này cho chỉnh nhân vật, không thêm nhóm sắc da vào dialog chuẩn hóa. Đọc beauty.js xác minh shader trắng da đang max(maskFace,chromaGlobal*.75), nên nhận định không ảnh hưởng nền chưa đúng. Quyết định: bỏ fallbackchroma toàn khung, chỉ dùng mặt nạ face landmark; sửa help để nói rõ face-only, thiếu mặt bỏ qua, chưa whole-person/neck/hands. Gỡ nhóm nâng sáng sắc da mới thêm khỏi dialog chuẩn hóa, giữ service/API tùy chọn để tương thích dữ liệu đã lưu, không khuyến nghị dùng cho yêu cầu cô lập người. Không tự bật preset mịn/môi/gọt mặt khi chỉ yêu cầu sáng da.

Kiểm renderer WebGL thật với ảnh cùng sắc da phủ toàn khung và landmark tổng hợp: mặt tăng, vùng cùng màu ngoài mặt không đổi, mất mặt không thay ảnh; kiểm source clock/multisource còn giới hạn chưa coi16% là coverage toàn video. Chưa đổi các điều khiển slider có sẵn, dùng test đồ họa và ảnh bằng chứng. Hướng đi tiếp theo nếu cần cổ/tay là person segmentation rồi giao mask da, không đơn thuần chọn theo màu.

## Phân tích trước sửa Làm đẹp nhiều nguồn · 04/11/2026

Lỗi hiện trạng: scan chỉ P.source.video, face.json không kiểm hash/nguồn; renderer pts theo cùng một mảng cho tất cả talk, time fallback thiếu speed và canvas đặt ngoài các wrapper crop/màu/transform. Khi A-roll ghép nhiều clip hoặc chuyển media dẫn xuất, face của clip đầu có thể áp lên clip khác. Giao diện chỉ16% không báo nguồn nào chưa có face. Không thêm panel hay bước cấu hình; nút Quét mặt hiện có quét từng nguồn A-roll đang dùng, lưu bằng API revision-bound, hiển thị số nguồn đã khớp/thiếu. Scan không tự bật mịn/môi/gọt mặt; người dùng chọn slider đang có.

Đích: manifestv2 tracks theo exactsrc+sha256 của source A-roll; nguồn dẫn xuất khác cần scan lại, không mượn landmarks sau chống rung. build chỉ đưa tracks khớp hash+dimensions vào renderer; stale/legacy chưa bind phải quét lại. Giữ legacyfile không xóa, báo trạng thái; không tự sửa dự án khác khi scan xong hoặc chuyển workspace. Renderer chọn track theo video data-face-source, clock mediaStart+(timeline-start)*rate cho final, currentTime cho preview. Canvas đi cùng wrapper/kiểu hình của video được chọn; không cover B-roll hoặc clip khác. Mất mặt giữa2sample thì bỏ, không nội suy xuyên sample thiếu. Chưa wholeperson/multiplefaces/B-roll beauty.

Tiêu chí: stale/source/hash/request guards;2nguồn khác vị trí mặt và speed; WebGL renderer cùng màu nền không đổi; build/snapshot copy runtime dùng đúng nguồn; realMediaPipe đoạnQ2; UI quét/Save/Undo/reopen/nguồn thiếu/không tự bật preset. Tài liệu và skill phản ánh đúng phạm vi, không nhận parityCapCut.

## Khôi phục nhận diện mặt nhỏ · 04/11/2026

Ảnh người dùng báo16% mẫu có mặt; bộ quét hiện chỉ detect toàn khung. UX giữ nguyên Bộ lọc→Làm đẹp và nút Quét mặt, không thêm tab hoặc bắt người dùng khoanh vùng. Tham khảo mục tiêu làm đẹp cô lập mặt từ ảnh CapCut/người dùng; chưa khảo sát mới UI CapCut. Bổ sung fallback vùng phóng gần khi toàn khung thất bại, quy tọa độ về nguồn gốc trước lưu; không chỉnh pixel nguồn. Thiếu nhận diện vẫn bỏ qua, không dò màu da toàn hình. Giới hạn một khuôn mặt, chưa tách người/cổ/tay. Kiểm mapping và hủy bằng unit test, so detector cũ/mới trên cùng đoạn Q2 toàn khung; tỷ lệ mẫu chỉ là bằng chứng đoạn thử, không suy toàn video. Không thay slider/style/layout.

## Tách người và da toàn thân · 04/11/2026

Người dùng yêu cầu mở rộng chỉnh da từ mặt sang cổ/tay/toàn thân và chỉnh riêng người. REA inspect_pe_resources xác minh CapCut9.3.0.3950 binarySHA256, bằng chứng CAPCUT_REA_RESOURCE_EVIDENCE.json; resource mattingBlend/figure beauty có thật nhưng không chứng minh đã lấy thuật toán. Không sao DLL/model CapCut. Đối chiếu repo MediaPipe Apache2, RVM GPL3, BiRefNet MIT: MediaPipe SelfieMulticlass có semantic body-skin/face-skin/clothes/hair/background, dùng runtime có sẵn, lựa chọn đầu tiên cho preview/nhẹ. RVM chỉ foreground, BiRefNet chưa tự có nhãn da; chưa benchmark chất lượng hai repo này.

Giữ Bộ lọc→Làm đẹp; nút quét bổ sung người/da cùng nguồn/revision/hash. Không tự bật mức chỉnh. Nhóm Toàn thân gồm sáng người, sáng da toàn thân, mịn da toàn thân; các thanh mặt cũ giữ phạm vi mặt. Lưu mask theo nguồn và thời gian để xuất không gọi AI lại. Phân biệt semantic skin và toàn foreground; không dùng chromaGlobal. Thiếu mask không áp, nguồn đổi cần quét lại. Xem mask kiểm lỗi da/quần áo/nền trước dùng. Chưa chọn từng người/cọ sửa/temporal opticalflow; phải ghi giới hạn thay vì nhận parityCapCut. Kiểm mask thật cổ/tay/nền trên Q2, build/Save/Undo/reopen, nguồn/tốc độ/cut và final; kiểm lỗi/cancel và kích thước dữ liệu.

## Benchmark nội dung Q2 và lưu mix tái dùng · 04/11/2026

Đã xem contact sheet ba thời điểm của5file B-roll nguồnD:/Edit tự động/source/broll. File danphim là dán đổi màu thân xe, không phải phim kính; filevinfast là sân khấu VinFastVF8, không phù hợp làm minh họa mọi model. Đèn có biển số hiện, không tự che nếu brief tắt; benchmark local không đăng. Gheda tĩnh không chứng minh thao tác ghế điện. Dự án benchmark riêng sẽ lấy đoạn14.22–24.02 và transcript Factory tương ứng, ghép cảnh đúng từ, không copy nhạc UNKNOWN. Xem skill chungauto-car-video editing-and-motion/sound-design; chưa nghe duyệt nên không nhận phối âm đạt.

Phát hiện extractTemplate bỏ duckSourceSpeech trong danh sách audioportable, làm preset cải tiến mất thiết lập hạ nhạc A-roll đã chọn. Bổ sung trong danh sách chung, không thêm UI hoặc sidebar; giữ audio source/clip/timing riêng từng project, transcript của dự án đích vẫn được xác minh khi build. Kiểm save→extract→apply cùng invariant không mang media/cue riêng. Không tự bật duck cho mọi mẫu.

## Mẫu chỉ chi tiết sản phẩm · 05/11/2026

UX khảo sát: Đồ họa đã có preset, field chữ, kéo cả khối, Save/Undo và advancedHTML/CSS/animation; tracker theo-doi chỉ nguồn A-roll và transform theo camera, không bảo đảm B-roll/multi-source. Không thêm sidebar/tracker giả. Bổ sung2preset chấm→đường→nhãn trái/phải trong cùng thư viện, vùng điều khiển Bố cục chỉ chi tiết collapsed ở inspector khối. Sửa điểm đầu/điểmnhãn bằng số%khung và màunhấn, dùng nativeinput/field tokens; không bắt sửa mã. Chỉ xuất hiện khi HTML có marker đúng mẫu, giữ fieldtitle/sub và genericdrag. Cảnh máy di chuyển dùng callout cố định khung cần nhìn lại; chưa tuyên bố trackingvật.

Tham khảo recipe featurepointer trong chungauto-car-video: đường160–250ms, nhãn trễ100ms, giữ đọc; quan sát cropQ2 và tính năng SVGdraw của runtime thật. Geometrygiữ trongHTML styleCSSvars, lưu cùng dữ liệu khối hiện có; không tạo project/schema/menu song song. APIpresets vẫn dùng field chữ; API có thể thay HTML theo tool hiện hữu, chưa toolgeometry riêng. Tiêu chí: chèn preset/chỉnh nhãn/geometry/màu/Undo/Save/reopen tại1280/390; source/buildSVGdraw và final đúng vị trí, không reset chữ. Mẫu mới v18 giữ v17.

## Phân tích trước sửa: quyền giữ/tắt làm đẹp theo lượt dựng · 05/11/2026

Luồng Home giao việc đã có disclosure ngành xe; code giữ beauty từ snapshot nhưng chưa có công tắc tắt riêng. UI còn hint end-card chưa có, sai với trạng thái v10+. Dùng lại nhóm select hiện có: thêm Làm đẹp → Giữ thiết lập đang có / Không dùng làm đẹp. Mặc định keep, không thêm chế độ tự bật/quét/preset. Vùng người/da vẫn chỉnh sâu trong Bộ lọc→Làm đẹp; liên kết mô tả đến đúng nơi. Tham khảo bằng chứng Beauty UI và setup responsive đã có, không tuyên bố khảo sát CapCut mới.

Off xóa camera.beauty do candidate sinh; keep khôi phục snapshot, độc lập màu. API/session/CLI cùng enforceAutomotiveJob; snapshot/job cũ thiếu trường phải normalize về keep để không vô hiệu job đã chốt. Không thay ảnh/nguồn/mặt nạ hoặc dự án người dùng. Kiểm policy cả bodyWhite/personLight, snapshot cũ, browser payload ở5kích thước, gateway HTTP và session completion trên dự án riêng. Không tự xuất/đăng video người dùng.

## UX trước sửa: mức SFX đang áp dụng · 05/11/2026

Ảnh AUTOMOTIVE_SETUP_1280.png đã xem cho thấy ngành xe Tắt toàn bộ SFX nhưng nhóm radio chung vẫn Nhiều. Backend đúng ưu tiên policy nhưng UI trái kết quả. Tái dùng cùng radio/title/help: khi override tat/vua/nhieu, hiển thị mức hiệu lực, disable radio và ghi nơi chỉnh; giữ st.sfx nền để khi keep hoặc bỏ ngành xe phục hồi. Không sửa lựa chọn người dùng, không thêm sidebar, không đổi nghĩa tat chung (chỉ tắt tiếng tự động, vẫn tiếng gắn riêng) thành tat ngành xe (tắt tất cả). Kiểm payload và bật/tắt/keep,5kích thước với browser thật; không cần render lại âm thanh vì không thay engine/policy.

## UX trước làm: người/da trên cảnh trám · 05/11/2026

Làm đẹp hiện dùng camera.beauty toàn dự án nhưng chỉ faceSources A-roll, renderer2lớp cam/matte. Cảnh trám Video full/split/pip cần quét cùng nguồn/hash và render canvas riêng, giữ geometry/clock/rate/filter/transition/layer. Dùng nút quét hiện có cho A/B-roll đang hiện; không sidebar/slider nhân đôi. Ảnh cảnh trám không quét; nguồn trùng dùng một track, hidden bỏ qua, nguồn đổi cần quét lại. Nhãn UI ghi A-roll/B-roll và cảnh chưa quét rõ. Mặc định không bật beauty; scanner vẫn quét toàn file15fps, giới hạn40nguồn/20phút/4triệuruns mỗi nguồn giữ nguyên.

Kiểm source manifest/dedupe/stale, realbrowserMediaPipe có B-roll, syntheticWebGL đồng thời A/B clock/rate/geometry/end/thiếu mask, preview và final3s có B-roll; không tuyên bố temporal smoothing/cọ/chọn riêng người. Chuyển cảnh cần cùng opacity với video và che ảnh gốc khi canvas dùng để tránh nhân đôi alpha.

## UX trước làm: nhiều vùng biển trong một đoạn · 05/11/2026

Dialog che hiện mộtROI, không dùng được cảnh nhiều xe cùngkhung. Dùng lại canvas/fields/preview/replace/Undo/review; thêm select Vùng biển đang chọn và2nút Thêm/Xóa trong dialog hiện có. 1–8vùng cùng khoảngnguồn0.2–15s; mỗi vùng hiện số/thứtự, vùng active lime. Sửa/thêm/xóa làm hết hạn kếtquảpreview; khôngthay project trước Apply. Khóa chỉnh khi tracking, giữ nút Đónghủy. Khôngtự dò biển/cutrecovery.

Backend chuẩn hóa roi legacy hoặc rois mới, khôngnhận cảhai; kiểm từngbbox. Python giữquadsđộclập, vẽmọivùngtrongmộtdecode/encode, bấtkỳvùngmấtdấuthìcảlượtlỗi. Provenancegiữroivùngđầuchotươngthích vàroisđầyđủ; frameghi regionscùngquadlegacy. Kiểm synthetic2vùngchuyểnđộng, mọi30frame/audio/hash/restore, UIthêm/xóa/sửa/invalidates/responsive/SaveUndo, API dùng tool tương ứng sau xemframe.
