## Hiện hành · Creative v16 · 04/11/2026

Làm đẹp mặt đã bind từng nguồn A-roll/SHA256 và clockcut/rate; nguồn thay/chuẩn hóa/chống rung cần quét lại, v1 chưa bind yêu cầu quét lạiv2. Nút quét không tự bật preset. WebGL2nguồn, MediaPipe Q2crop/UI và final2s đã kiểm;230/230test qua. Chưa whole-person/cổ/tay/nhiều người hoặc detector benchmark toànvideo. Xem [bằng chứng và giới hạn hiện hành](FACE_SOURCE_CURRENT.md). Các mô tả source/clockface chưa kiểm ởv15 bên dưới được thay trong phạm vi này.

## Hiện hành · Creative v15 · 04/11/2026

Theo ảnh người dùng, ưu tiên Bộ lọc→Làm đẹp: trắng da chỉ mặt nạ face landmark, bỏ dò màu toàn khung; gỡ nhóm nâng sắc da mới trong dialog chuẩn hóa. Chưa whole-person/cổ/tay/multi-source face. Có màu/chống rung→che biểnA/B-roll, khôi phụchai tầng, hash/range/review giữ. Suite229/229, WebGL và browser thực đã kiểm. Xem [hiện trạng, bằng chứng và giới hạn](COLOR_PLATE_CHAIN_CURRENT.md). Các ghi chúv14 bên dưới là lịch sử trước điều chỉnh này.

## Cập nhật hiện hành · Creative v14 · 04/11/2026

Chuẩn hóa HDR/Log→Rec.709, kho139LUT local, chống rung, batch tối đa40đoạn, NVENC media dẫn xuất và worker API đã có. Đã thêm nâng sáng sắc da tùy chọn0–30%, mặc địnhtắt, sau chuẩn hóa/look; heuristic không phải nhận diện mặt. GPU toàn composition chưa xác minh. Đã tìm lại nguồn Q2 tại D:/Edit tự động/source (DJI tag709), thay kết luận nguồn không có ở các ghi chú lịch sử bên dưới. Xem [nâng sáng sắc da và bằng chứng](SKIN_LIFT_CURRENT.md), cùng [trạng thái chuẩn hóa, UX và giới hạn](COLOR_NORMALIZATION_CURRENT.md).

## Phân tích màu từng đoạn · Creative v12 · 04/11/2026

Inspector A-roll/B-roll có Phân tích màu cảnh: local FFmpeg lấy3frame10/50/90% đoạn nguồn, histogram sáng/clipping/neutral pixels, gợi ý SDR nhẹ theo source-color. Dialog dùng style chung,3nút chọn frame và cặp ảnh nguồn/gợi ý, thay màu riêng chủ động/Save/Undo/reopen, không sidebar mới. So sánh chưa cộng màu chung/màu riêng cũ; áp dụng thay color, không tự nhập LUT, không tự sửa mọi shot. Backend request kiểm workspace/revision/project và source stat trước/sau, từ chối ngoài nguồn. API analyze_shot_color chỉ trả metrics/gợi ý, không đưa bitmap vào model context; CLI phan-tich-mau.mjs chỉ đọc nguồn/project. Nguồn/engine Factory không sửa.

Bằng chứng: SHOT_COLOR_BROWSER_SMOKE.json endpoint thực1280/1920/390,3frame xem được/no mutation trước apply/Save/Undo/reopen, ảnh đã xem; SHOT_COLOR_FINAL_SMOKE.json final tổng hợp1920×1080: gray48 thành57 với brightness0.18. SHOT_COLOR_REFERENCE_SMOKE.json đọc NAS reference19–22s và ảnh đã xem; đó là video đã dựng có graphic, không phải footage thô. Mọi đường footage gốc trong Q2 job.json hiện không tồn tại. Không coi kết quả reference là nghiệm thu màu nguồn hoặc aesthetic benchmark. Suite223/223 qua workspace/logs/shot-color-suite.log, gồm real FFmpeg/sample/cut/mute limits và API tool-loop gateway tổng hợp; không provider trả phí/đăng bài.

Main5180 đã restart idle, catalogV12/UI HTTP200 xác minh, xem SHOT_COLOR_DEPLOY_SMOKE.json.

Skill mới riêng chungauto-factory-quang-cao-v12 parentV11 giữ9preset/bản cũ, quick_validate qua, preview vẫn trích reference. Chưa detector shot, chuyển Log/HDR, nhận diện da/màu sơn chuẩn hoặc khớp màu reference; neutral WB là heuristic, cần xem thật. Goal ngành xe tiếp tục active; còn nhiều biển/cut recovery, benchmark cảnh trám/motion/nhạc/SFX agent thật và installer Python/OpenCV. Các ghi chú chưa có phân tích shot bên dưới chỉ được thay trong phạm vi gợi ý3frame này.

## Hạ nhạc theo lời A-roll · Creative v11 · 04/11/2026

Âm thanh → Trộn âm có Hạ nhạc theo lời A-roll (audio.duckSourceSpeech), mặc định tắt, dùng chung duckLevel/duckFade với clip voice. Build lấy transcript đúng nguồn hiện có, giao mốc từ với đoạn giữ/tốc độ, bỏ đoạn mute/không tiếng; nhạc phục hồi ngoài vùng lời và ở outro. Hoạt động repeat/crossfade, kết hợp duckNarration. Thiếu transcript hoặc sourceClock nhiều nguồn cũ thì báo lỗi, không nhận đã xử lý; không là waveform/VAD. musicSpeech thủ công giữ nguyên. UI dùng nhóm/control cũ, không sidebar mới; đã sửa binding checkbox mới sau Undo để ghi project hiện hành.

Bằng chứng: PRIMARY_SPEECH_BROWSER_SMOKE.json endpoint thực/preview iframe/Save/Undo/reopen1280/1920/390, ảnh đã xem. PRIMARY_SPEECH_FINAL_SMOKE.json: final tổng hợp5giây, nguồn có audio im lặng3giây+outro2giây, nhạc sine, lời giả lập1–2giây; PCM speechGainRatio0.199, nhạc phục hồi sau lời/ở outro. Không là nghiệm thu ASR thật/chất lượng nghe. tests/primary-speech.test.mjs cut/speed/mute/stale/API boolean/build hai loop; suite220/220 ở workspace/logs/primary-speech-suite.log. Skill riêng chungauto-factory-quang-cao-v11 parentV10 giữ9preset/bản cũ, quick_validate qua; preview mẫu vẫn trích reference.

Main5180 đã restart sau kiểm idle; catalogV11/helper HTTP200 xác minh, xem PRIMARY_SPEECH_DEPLOY_SMOKE.json.

Chưa có detector nhiều biển/cut recovery, grade phân tích shot, benchmark chọn cảnh/motion/nhạc/SFX với agent và footage thật, installer Python/OpenCV độc lập. Ước lượng55–60% lõi ngành xe chưa thay đổi; goal tiếp tục active. Những mô tả cũ chỉ duck theo clip bên dưới là lịch sử trước mốc này.

## Outro/CTA tùy chọn · Creative v10 · 04/11/2026

Thương hiệu → Đoạn kết / CTA dùng disclosure/control chung, mặc định tắt; thời lượng1–12giây, tiêu đề/phụ đề/liên hệ, logo local và màu. Track Video có block Outro / CTA; Xem đoạn kết, Lưu/Hoàn tác/mở lại/tắt đã kiểm qua HTTP browser1280/1920/390. Không thêm sidebar. Phân tích UX trước code nằm trong AUTOMOTIVE_EDIT_IMPLEMENTATION_2026-11-04.md.

project.endCard có schema kiểm kiểu và asset; API set_edit_fields dùng object, ảnh mới cần inspect_media. Timemap.contentTotal giữ mốc nội dung, total cộng outro; nguồn/voice/overlay dừng tại nội dung, nhạc đã chọn tiếp tục tới hết đoạn kết. cta off tắt endCard. Không có video outro/HTML tùy ý trong schema này. Sửa dự án làm hết hạn receipt duyệt bản che như các chỉnh sửa khác.

Bằng chứng: END_CARD_BROWSER_SMOKE.json (preview iframe thực, Save/Undo/reopen/off), END_CARD_FINAL_SMOKE.json và ảnh END_CARD_FINAL_FRAME.jpg/END_CARD_FINAL_WIDE.jpg đã xem: final tổng hợp dọc1080×1920 và ngang1920×1080,3giây nội dung+2giây outro=5giây; đuôi nhạc dọc có tín hiệu PCM, chưa là nghiệm thu chất lượng phối nhạc. tests/end-card.test.mjs kiểm source clock/CTA off/asset/schema/API tool-loop tổng hợp; suite218/218 qua workspace/logs/end-card-suite.log. Không gọi model trả phí/đăng bài.

Main5180 đã khởi động lại sau kiểm dispatcher0/0, render/ASR lock null và không Remotion worker; catalogV10 và helper/UI HTTP200 xác minh (END_CARD_DEPLOY_SMOKE.json).

Mẫu riêng chungauto-factory-quang-cao-v10 parentV9 giữ9preset và bản cũ; quick_validate qua. Preview/poster vẫn trích reference, không phải sản phẩm mới của skill. Ước lượng55–60% lõi dựng tự động ngành xe là đánh giá kỹ thuật, không tỷ lệ nghiệm thu127nhóm. Chưa có detector nhiều biển/cut recovery, grade phân tích shot, benchmark motion/B-roll/music/SFX trên footage thật và bộ cài Python/OpenCV độc lập. Goal nâng cấp ngành xe tiếp tục active. Ghi chú dưới về chưa có end-card là lịch sử trước mốc này.

## Duyệt bản che trước tự xuất · 04/11/2026

Có nút Kiểm tra bản che trước tự xuất trong inspector đoạn A/B-roll đã che, dialog dùng token chung với video từng media và xác nhận chủ động. POST/GET /api/plate-review gắn revision/workspace; work/plate-review.json lưu khai báo người dựng theo revision+hash media, không sửa project/timeline. Thay project hoặc media hết hạn; API worker không có tool duyệt. Lưu xác nhận không tự xuất/đăng.

launchCompletionExport dùng gate chung: thiếu receipt hợp lệ thì done+awaiting-review+completionReviewReason, không spawn render. Activity/chat hiện lý do. Child --auto-export kiểm lại sau render lock, trước và sau snapshot; asset hash trong snapshot phải trùng media đã duyệt. Manual export vẫn chủ động như trước. Nhận diện những đoạn enabled có platePrivacy hoặc src trong inputs/privacy; thiếu proof bị giữ để kiểm. Chưa có detector/policy bắt buộc toàn video che và không bắt mọi trường hợp đổi tên/copy/xóa provenance. Không coi xác nhận là bằng chứng mọi biển kín hay theo dõi người thật đã xem.

Bằng chứng: tests/plate-review.test.mjs receipt/revision/hash/path-without-proof/snapshot mismatch và child tự xuất bị chặn trước render; tests/activity.test.mjs lý do chờ kiểm. PRIMARY_PLATE_PRIVACY_BROWSER_SMOKE.json mở rộng review1280/1920/390, PLATE_REVIEW_*.png đã xem. PLATE_REVIEW_COMPLETION_SMOKE.json endpoint/session claim thực: candidate tổng hợp có tracker thật, thiếu review không spawn; duyệt HTTP, lượt cùng revision auto-export MP4 thành công (test chạy lại sau snapshot check). Không model/provider trả phí/đăng bài. Suite215/215 qua workspace/logs/plate-review-suite.log, related tests sau bổ sung snapshot check qua; V9 quick_validate qua. Main5180 restart idle, helper200 và catalogV9 xác minh.

Skill mới Creative v9 parentV8 giữ9preset/các bản cũ; quy tắc duyệt/gate cập nhật. Goal tiếp tục active. Còn detector/nhiều vùng/cut recovery, end-card kéo dài, grade phân tích shot, benchmark motion/B-roll/music/SFX nguồn thật và installer Python/OpenCV. Những câu dưới về chưa có gate là lịch sử trước mốc này.

## Che biển A-roll theo đoạn · 04/11/2026

Đã mở rộng tracker dùng chung cho Video/A-roll: chọn đoạn trên track Video hoặc Văn bản→Cắt, Che biển số · tracking local. Dialog preview→chủ động thay, Lưu/Hoàn tác/mở lại/khôi phục giữ nguồn gốc. selected source from=in cho legacy hoặc mediaStart cho multi-source; duration=out-in không nhân speed. Thay riêng src/mediaStart/mediaInfo, giữ in/out, hiệu ứng và audio. Khôi phục sau trim/split giữ offset. Source transcript clock nhiều nguồn giữ mapping nguồn gốc; không ép ASR lại vì chỉ thay hình che cùng lời.

API vision có mask_primary_plate, yêu cầu nhận frame ở lượt trước giống B-roll. CLI che-bien-so nhận --segment thay --broll, chỉ sửa candidate. Build kiểm hash media A-roll đã che và chặn nới ngoài khoảng xử lý; chặn matte/clean/freeze/dissolve cùng nguồn che để tránh ảnh/tiếng gốc lộ lại. Chưa chặn toàn bộ phương pháp tự sửa/xóa provenance và chưa có policy bắt buộc/privacy gate auto-export. API completion build candidate dùng media root của dự án sống khi xác minh media; không fallback đường dẫn tùy ý.

Mẫu mới riêng Creative v8 parentV7, giữ9preset/preview reference và các bản cũ. Không thêm menu/sidebar; inspector đã bỏ text null do append giá trị rỗng. Browser HTTP thực ở1280/1920/390 (PRIMARY_PLATE_PRIVACY_BROWSER_SMOKE.json) xác minh preview không sửa project, replace/Save/Undo/reopen/restore; ảnh đã xem. PRIMARY_PLATE_PRIVACY_FINAL_SMOKE.json: MP4 tổng hợp0.5s1920x1080/audio/2x, tâm mask đủ15frame; final frame đã xem. tests/plate-privacy.test.mjs chạy media/tracker/build thật, source clock/trim/restore, hash/range rejects, API tool-loop gateway tổng hợp và CLI claim/candidate. Suite214/214 qua ở workspace/logs/primary-privacy-suite.log; skill quick_validate qua. Main5180 restart sau dispatch0/0/render idle/ASR null/no Remotion; templateV8 và static helper200. Không gọi provider trả phí hoặc đăng bài.

Còn thiếu cho mục tiêu đầy đủ: detector/nhiều vùng/cut recovery, privacy gate auto-export, end-card kéo dài, grade phân tích shot, benchmark motion/B-roll/music/SFX trên footage thật, bộ cài độc lập Python/OpenCV. Phạm vi che một vùng/đoạn0.2–15giây, opaque mask; cần xem toàn đoạn/final, không tự chứng nhận mọi biển đã kín. Goal tiếp tục active; các câu dưới đây về A-roll chưa hỗ trợ là lịch sử trước mốc này.

## Worker API che biển theo vùng · 04/11/2026

Đã nối createApiPlatePrivacy vào worker API first-build/revise. Tool mask_broll_plate chỉ hiện khi model supportsVision và có media context. Phải nhận sample_media_frames đúng src tại mediaStart ở lượt model trước; cùng batch sample+mask bị từ chối. Tracker local dùng chung editor/CLI, giữ nguồn và chỉ thay candidate, provenance ghi requiresVisualReview. Kiểm ownership/job/base revision/media và hash bản che trong suốt lượt API; lỗi tracking không áp candidate. Chấp nhận speed số hoặc chuỗi số như inspector/build. Mẫu mới riêng Creative v7 parentV6, giữ9preset và các phiên bản cũ. Không thay UI/menu ở mốc này.

Bằng chứng: tests/plate-privacy.test.mjs mở rộng với mediaContext lấy JPEG thật, gateway tổng hợp có tool loop, tracker thật trên nguồn chuyển động, từ chối mask cùng lượt lấy frame, giữ nguồn/candidate tách biệt và phát hiện bản che bị sửa. Suite214/214 qua (workspace/logs/automotive-api-suite.log), syntax server và skill quick_validate qua. Main5180 khởi động lại sau kiểm dispatcher0/0, render idle, ASR job null, không Remotion worker; endpoint templates trả v7/parentV6. Không gọi model/provider trả phí, chưa nghiệm thu HTTP worker với model thật hoặc năng suất.

Còn thiếu: che A-roll, detector/nhiều vùng, gate privacy trước auto-export, end-card kéo dài, grade phân tích shot và benchmark semantic motion/audio nguồn thật. Chọn review khi cần kiểm biển; chưa có gate tự động bảo đảm che hết. Ước lượng55–60% lõi edit giữ nguyên, không suy tỷ lệ từ test. Goal nâng cấp ngành xe tiếp tục active. Các ghi chú API chưa có tracker dưới đây là lịch sử trước mốc này.

Mốc mới: Cảnh trám inspector → Che biển số mở dialog theo vùng, media dẫn xuất/preview/explicit replace/Save/Undo. Không sidebar mới. Chi tiết UX trước làm, kiểm chứng và giới hạn trong [hạng mục ngành xe](AUTOMOTIVE_EDIT_IMPLEMENTATION_2026-11-04.md).

Cập nhật ngành xe: setup cạnh mẫu dùng disclosure chung; không thêm sidebar. Chi tiết policy/schema/kiểm chứng và giới hạn ở [bản ghi ngành xe](AUTOMOTIVE_EDIT_IMPLEMENTATION_2026-11-04.md).

# ContentOS — Đặc tả tích hợp giao diện để build

**Cập nhật ChungAuto Creative v4 · 04/11:** [Khảo sát dự án Q2, đánh giá edit và skill v4](CHUNGAUTO_CREATIVE_Q2_SKILL_V4_AUDIT_2026-11-04.md) chốt ước lượng lõi edit55–60%, phân tích nhiệm vụ app/skill và phương án tùy chọn màu/biển số/watermark/outro/nhạc/SFX. Mẫu v4 đã cài riêng, v3 giữ nguyên; mới nâng quy tắc, chưa thêm policy UI/backend, tracking hay engine grade. First-build inbox hiện vẫn gỡ camera.color/beauty; cần opt-in snapshot trước khi nhận tự grade hoàn chỉnh.


> Đồng bộ tài liệu 04/11/2026: đọc [điểm hiện hành và bản đồ build](BUILD_CURRENT.md) trước các mốc lịch sử. Mọi thay đổi UI phải theo [quy chuẩn thiết kế và quy trình UX/UI](DESIGN_UX_STANDARD.md): phân tích trải nghiệm, đối chiếu giao diện sẵn có và tham khảo ứng dụng phù hợp trước thiết kế/code. Trạng thái triển khai chỉ được xác nhận bằng bằng chứng đúng phạm vi trong BUILD_STATUS.


**Đặc tả bổ sung hiện hành:** [Dựng nhiều video song song](PARALLEL_EDIT_BUILD_SPEC_2026-11-04.md) quy định vị trí Home/chat/Hoạt động/Cài đặt, lựa chọn layout/execution/hoàn tất độc lập, recovery, file chịu trách nhiệm và nghiệm thu. Hoạt động, claim, dispatcher và recovery đã triển khai một phần; xem BUILD_STATUS để phân biệt với yêu cầu thiết kế còn thiếu.

**Bổ sung dựng song song 04/11/2026:** [Rà soát UX mục 12](CONTENTOS_UX_REASSESSMENT_2026-11-04.md#12-yêu-cầu-mới-hàng-đợi-và-dựng-nhiều-video-song-song) là yêu cầu hiện hành cho Hoạt động/hàng đợi: gom nhiều phiên chat Codex/Claude và worker CLI/API độc lập, hiển thị bên nhận việc và trạng thái thực. Bốn tab Đang chạy/Hàng đợi/Cần kiểm tra/Lịch sử; lọc theo nguồn thực thi và dự án. Không tạo hàng đợi hoặc màn theo dõi riêng cho từng AI. Giới hạn worker tự chạy không chặn số phiên chat chủ động; mọi nguồn tuân thủ claim/khóa project và điều tiết tài nguyên. Chưa triển khai hoặc nghiệm thu đầy đủ.

**Engine và preview04/11:** dùng cả HyperFrames/Remotion/FFmpeg theo [kiến trúc engine](RENDER_ENGINE_ARCHITECTURE_2026-11-04.md). Editor VEK giữ vai trò nền; composition Remotion có adapter/khả năng chỉnh riêng, cùng project và render pipeline. Năm màn thiếu quyền VEK hiện có preview local thay màn chặn, nút thực thi vô hiệu hóa; đây chưa phải mở tính năng đầy đủ hoặc thay entitlement.

**Bổ sung sau rà soát 7 ảnh ngày04/11:** [CONTENTOS_NAVIGATION_REVIEW_2026-11-04.md](CONTENTOS_NAVIGATION_REVIEW_2026-11-04.md) điều chỉnh sidebar/điểm vào chính và xử lý trạng thái quyền. Nếu mâu thuẫn với vị trí nút phụ trong các mục cũ, dùng bản rà soát mới cho điều hướng; vẫn giữ component/service/editor dùng chung. Đây là thiết kế cập nhật, sidebar có icon/responsive cùng hub Kết nối/Thư viện đã được build; xem BUILD_CURRENT và BUILD_STATUS cho bằng chứng/giới hạn.

Cập nhật 04/11/2026. Tài liệu triển khai kèm BUILD_PLAN.md; dựa trên khảo sát VEK thực tế. Các vị trí dưới đây là thiết kế đích, không phải tuyên bố đã hoạt động. Trạng thái kiểm chứng nằm trong BUILD_STATUS.md.

Đọc mục 2 để tra vị trí tính năng, mục 9 để tra thành phần/file và mục 11 để tra luồng thao tác. Mục 38 tổng hợp tích hợp; các mục 39–132 bổ sung mẫu, batch, đầu ra, điện thoại, model API, nhận diện, ảnh, âm thanh, thư viện nguồn, sửa thành phần qua chat/timeline nhập dự án ba app, chuyển phụ đề/voice/SFX/nhạc AIEV, điều khiển vùng lời nói, âm lượng từng đoạn và logo góc trong Thương hiệu/chat AI. Các mục bổ sung phía sau cập nhật trạng thái của các mục cũ; không dùng bảng trạng thái ban đầu để kết luận một adapter hiện vẫn chưa tồn tại. Checklist tránh trùng nằm tại BUILD_PLAN.md mục 15; mã đang phát triển chưa có bằng chứng không phải chức năng đã nghiệm thu.

## 1. Nền giao diện và nguyên tắc tích hợp

Tra cứu yêu cầu giao diện đã chốt:

| Yêu cầu người dùng | Phần đặc tả phải áp dụng khi build |
|---|---|
| Lấy trải nghiệm edit VEK làm nền, tránh mục trùng | Mục 2: vị trí tính năng; mục 9: component/service dùng chung; mục 10: checklist bàn giao |
| Space và Studio trong cùng dự án | Mục 3: bố cục và giữ trạng thái; mục 11: chuyển từ giao việc sang chỉnh tay |
| Dán thư mục A-roll/B-roll NAS vào chat để giao dựng | Mục 2 và 11; BUILD_PLAN mục 4: kiểm nguồn, chọn tư liệu và snapshot cho job |
| Chọn Codex/Claude đang mở hoặc worker API/CLI và model | Mục 4; BUILD_PLAN mục 5: kết nối và năng lực thực thi, độc lập với bố cục |
| Mặc định tự xuất hoặc người dùng kiểm tra rồi xuất | Mục 4; BUILD_PLAN mục 3 và 6: mặc định workspace, lựa chọn theo lượt và chính sách chốt trong job |
| Gộp ảnh/voice/video AI, mẫu, remote, tin tức và phát hành từ ba app | Mục 2: điểm vào đích; mục 9: trách nhiệm dùng chung; các mục cập nhật phía sau và BUILD_STATUS: bằng chứng thực tế |

Bảng này chỉ dẫn cách tích hợp, không xác nhận mọi tính năng đã hoàn tất. Mỗi hạng mục cần ghi điểm vào thật → thao tác → thay đổi project/asset/job → trạng thái lỗi và phục hồi → bằng chứng kiểm tra. Giữ editor, kho kết nối và luồng render dùng chung khi mở rộng.

Giữ Home, bước thiết lập, editor, preview, timeline, inspector và HyperFrames của VEK. Mở rộng công cụ có sẵn trước khi thêm màn mới. Space và Studio dùng chung project, revision, tài nguyên, hội thoại và công việc; không chuyển đổi dữ liệu qua hai định dạng editor riêng.

ChungAuto là một workspace/brand mẫu. Không gắn ngành ô tô, logo, kênh hoặc prompt ChungAuto cố định vào shell ContentOS. Các ngành khác cấu hình nhận diện, thư viện, quy trình và kênh riêng.

## 2. Bản đồ chức năng → vị trí giao diện

| Nhóm chức năng từ ba app | Điểm vào chính | Tái sử dụng và cách tích hợp |
|---|---|---|
| Tạo/mở/tìm dự án, dựng nhanh | Home VEK và Dự án | Giữ cách chọn footage → mẫu → giao AI; thêm ý tưởng, tin tức và dữ liệu hàng loạt như loại đầu vào |
| File máy, NAS, Drive, điện thoại | Thêm tư liệu tại Home/thiết lập; Cảnh trám trong editor | Cùng bộ chọn nguồn, project đích và asset ID; không có sidebar NAS/Điện thoại riêng |
| Đường dẫn A-roll/B-roll trong chat | Ô giao việc và Space | Hiện thẻ nguồn có vai trò, đường dẫn, khả năng truy cập, số file, sửa/bỏ; dùng lại intake, không bắt nhập lại |
| Mẫu dựng, skill và quy trình | Bộ chọn mẫu VEK, Thư viện | Giữ poster/preview; phân loại Mẫu dựng, Skill/quy trình, Preset, Phong cách ảnh, Prompt; thao tác theo từng loại |
| Dựng theo chat và chỉnh tay | Space / Studio trong cùng dự án | Space: chat + preview; Studio: bố cục editor VEK, thanh công cụ, inspector, timeline; chuyển qua lại không tạo job mới |
| Chữ, phụ đề, cắt lời, zoom, hiệu ứng | Các nhóm công cụ editor VEK hiện có | Bổ sung preset/khả năng AIEV và Studio vào đúng nhóm; không nhân đôi editor hoặc engine |
| HyperFrames | Preview, đồ họa, mẫu/skill và xuất | Giữ composition/build/render; hiển thị thông tin engine trong chi tiết khi cần, không thêm màn HyperFrames độc lập |
| Tạo ảnh, sửa ảnh, ảnh tham chiếu, biến thể, phong cách AIEV | Cảnh trám → Tạo AI → Ảnh; Thư viện → Tạo ảnh | Một module dùng độc lập hoặc theo dự án; prompt/model/tỷ lệ/số lượng/chi phí, chọn kết quả, lưu kho hoặc chèn |
| Tạo video AI, stock và cảnh trám | Cảnh trám → nguồn hoặc Tạo AI → Video | Kết nối Flow/Kling/Seedance và provider được hỗ trợ, tiến trình và lỗi thật, kết quả về asset chung |
| Voice AI, sao chép giọng, audio | Âm thanh trong editor; công cụ Giọng nói AI | Một module/config Vbee/ElevenLabs và nhà cung cấp hỗ trợ; xem trước, chỉnh văn bản/giọng, chèn và quản lý audio |
| Kho file, metadata, tìm kiếm, quyền dùng, provenance | Thư viện → Tư liệu | Dùng cùng catalog với picker; phân biệt file NAS gốc, cache local, proxy và đầu ra; không di chuyển source khi chỉ chọn dùng |
| News, nghiên cứu, kịch bản | Home → Nguồn tin & Kịch bản; chọn bản đã duyệt tại setup | Điểm vào hiện hành là dialog cạnh thư viện; mở rộng đọc nguồn/nghiên cứu tại đây trước khi thêm màn riêng. Lưu dẫn chiếu và trạng thái kiểm chứng, chuyển bản kịch bản vào cùng pipeline dựng |
| Phân tích/thống kê kênh | Mạng xã hội → Phân tích | Dùng chung danh sách kênh với lịch đăng; phân biệt số liệu lấy được và số liệu chưa truy cập |
| Brand, ngành, khách hàng | Bộ chọn workspace; Thương hiệu trong editor | Mặc định theo workspace, snapshot theo dự án; không có Brand Studio trùng công cụ Thương hiệu |
| Thumbnail và bộ nội dung phát hành | Nút Ảnh bìa và bước Xuất/Phát hành | Mở rộng Khung video / Ảnh tải lên / Tạo AI; tiêu đề, caption, hashtag/tag theo kênh, xem trước và chỉnh tay |
| Đăng ngay/hẹn giờ, theo dõi đầu ra | Xuất → Phát hành; Mạng xã hội → Lịch | Một dữ liệu kênh/lịch/job, trạng thái và chống đăng lặp; tự xuất và tự đăng là hai lựa chọn độc lập |
| Clip ngắn, đa tỷ lệ, phiên bản, batch | Luồng Cắt clip ngắn VEK; Dự án → Hàng loạt | Dùng cùng dự án gốc/biến thể, queue và render pipeline; xem số bản, chi phí, nơi lưu trước khi chạy |
| Codex/Claude, API/CLI, chọn model | Bộ chọn AI khi giao việc; Cài đặt → Kết nối | Một nơi lưu cấu hình; lối tắt từ công cụ mở đúng nhóm; không nhân bản nơi nhập key |
| Remote điện thoại | Thêm tư liệu → Điện thoại; Cài đặt → Thiết bị | Upload nguồn và điều khiển chủ máy có quyền riêng; không coi upload-only hiện tại là remote đầy đủ |
| Cài đặt, lưu trữ, sao lưu, cập nhật | Cài đặt | Cấu hình độc lập mỗi máy; dự án/cache local và nguồn NAS; không mặc định cần máy chủ điều phối LAN |
| Import dữ liệu từ ba app | Cài đặt → Nhập dữ liệu | Preview danh mục/số lượng/xung đột, chọn đích workspace, giữ nguồn và lịch sử, báo kết quả từng nhóm |

Phạm vi chi tiết vẫn theo 127 nhóm trong config/features.json và các inventory nguồn; bảng này gom vị trí giao diện, không thay thế danh mục chức năng. Thích ứng nội dung/reup cần lưu nguồn và quyền sử dụng; thay đổi hình/âm thanh không được trình bày như bảo đảm tránh bản quyền. Nội dung bình luận hỗ trợ soạn nháp theo kênh; hành động đăng có quy tắc và lựa chọn riêng.

## 3. Bố cục và thao tác trong một dự án

Thanh đầu dự án có tên, trạng thái lưu/công việc, Space/Studio, undo/redo và Xuất. Không gộp bộ chọn bố cục với bộ chọn AI hoặc chính sách hoàn tất.

- Space: chat giao việc và lịch sử bên trái, preview bên phải; thẻ nguồn/mẫu/AI hiển thị ngắn gọn trong ngữ cảnh. Có nút mở Studio đúng dự án.
- Studio: giữ bố cục VEK đã khảo sát — nhóm công cụ và thư viện bên trái, preview bên phải, timeline phía dưới, inspector theo lựa chọn. Nhờ AI sửa gửi cả ngữ cảnh thành phần đang chọn tới cùng hội thoại.
- Khi chuyển bố cục, giữ revision, lựa chọn/playhead phù hợp và nội dung chat chưa gửi; không chạy lại AI hoặc render. Thay đổi bố cục là tùy chọn người dùng, không sao chép project.
- Màn hình nhỏ: cho thu gọn thư viện/chat, resize timeline và focus preview; không ép thêm bảng cố định khiến preview không dùng được.

## 4. Giao việc và hoàn tất

Luồng chuẩn: chọn/nhập nguồn hoặc dán đường dẫn → chọn mẫu/skill và mục tiêu → chọn AI → chọn cách hoàn tất → giao việc → xem tiến trình → Space/Studio → đầu ra/phát hành.

Bộ chọn AI có hai nhánh: phiên Codex/Claude đang mở, hoặc worker API/CLI. Nhánh phiên mở hiển thị những gì biết thật về kết nối; model do phiên quản lý. Nhánh worker cho chọn kết nối/model cụ thể hoặc Tự động, khả năng và hạn mức. Không hiển thị model tùy ý nếu adapter không thực thi được.

Chính sách hoàn tất: Tự xuất (mặc định yêu cầu) hoặc Tôi kiểm tra rồi xuất. Đặt mặc định tại Cài đặt → Dựng bằng AI, ghi đè ở dự án/lượt giao. Luôn giữ bản dựng sửa được. Đăng ngay/lịch đăng được cấu hình riêng, không suy ra từ Tự xuất.

Trạng thái nhìn thấy: Đang kiểm tra nguồn → Đang phân tích → Đang dựng → Đang kiểm tra bản dựng → Chờ kiểm tra hoặc Đang xuất → Đã xuất. Tác vụ phải có hủy/thử lại, lý do lỗi, đầu ra hiện hữu và checkpoint. Bước chưa thực thi không được báo hoàn thành.

## 5. Quy tắc dữ liệu và trạng thái UX

- Các điểm vào picker/công cụ dùng chung project/workspace context. Hiện tên đích khi người dùng nhận tư liệu; không âm thầm chuyển dự án đang mở.
- Asset tạo từ ảnh/voice/video có thể lưu độc lập, dùng lại và chèn vào dự án. Provider khác nhau không tạo thư viện kết quả riêng không tìm được.
- Catalog chỉ có văn bản tham khảo phải ghi đúng; chỉ hiện Áp mẫu/Chạy skill khi có adapter thực thi và kiểm tra đầu vào.
- Loading, không có dữ liệu, mất NAS, thiếu CLI/key/model, hết hạn mức, tác vụ bị hủy và lỗi render cần hành động khôi phục cụ thể; giữ yêu cầu chưa gửi và chỉnh sửa chưa lưu.
- Khi revision thay đổi ngoài editor, chặn lưu đè, cho tải bản chỉnh chưa lưu và nạp lại. AI job cần snapshot/revision riêng trước khi cho phép tự áp kết quả.
- Khi bản AI xung đột với bản đã lưu mới hơn: dùng chung hộp Đối chiếu bản AI từ lỗi Home hoặc lịch sử việc AI của editor. So sánh nhóm dữ liệu và tải candidate; giữ bản hiện tại hoặc chủ động thay toàn bộ bằng bản AI có lưu lịch sử. Kiểm cả revision hiện tại và candidate lúc xác nhận; sau xử lý chờ kiểm tra, không tự xuất/đăng. Merge từng clip và preview hai bản là phần chưa triển khai.
- Không đưa bí mật kết nối vào project, bản xuất, log hoặc dữ liệu chia sẻ NAS. Lối vào bị giới hạn gói phải giữ kiểm tra quyền hiện có.

## 6. Quy tắc build và nghiệm thu giao diện

Trước mỗi nhóm triển khai, ghi vào BUILD_STATUS: thành phần VEK tái sử dụng, phần thêm, service/API dùng chung, trạng thái hiện tại và bằng chứng. Đổi lối vào không đồng nghĩa hoàn tất engine.

Nghiệm thu tối thiểu:

1. Bắt đầu từ Home, setup và editor đều nhận tư liệu vào đúng dự án qua cùng picker; không phát sinh mục NAS/Phone trùng sidebar.
2. Dán nhiều UNC có dấu/khoảng trắng tạo thẻ A/B-roll đúng; mất quyền truy cập báo thật và cho sửa tại chỗ.
3. Space↔Studio giữ bản dựng, revision, chat và ngữ cảnh; không tạo thêm job hoặc đè chỉnh tay.
4. Ảnh/voice chạy độc lập và trong dự án dùng cùng kết nối/catalog, có xem trước, lưu và chèn thật.
5. Chọn AI/model có hiệu lực, thiếu kết nối báo rõ; Tự động không âm thầm chuyển sang API tính phí.
6. Tự xuất có file final đã probe; manual dừng để kiểm tra; không tự đăng ngoài cấu hình phát hành.
7. Thumbnail/content/lịch từ editor xuất hiện đúng trong Mạng xã hội; retry không tạo hai bài.
8. Kiểm tra desktop 1920×1080 và 1280×720, trạng thái rỗng/lỗi/loading, thao tác bàn phím và phục hồi chỉnh sửa. Các kiểm tra chưa thực hiện ghi chưa kiểm chứng.

## 7. Trạng thái tại thời điểm cập nhật

| Điểm tích hợp | Trạng thái có bằng chứng | Phần còn thiếu |
|---|---|---|
| Home / thiết lập / Cảnh trám | Dùng chung intake NAS/điện thoại; Home tạo dự án từ video chính trong nasRoot hoặc danh sách đường dẫn dán rồi mở setup, có browser smoke local; catalog cạnh thư viện mẫu | Tạo từ điện thoại; thử UNC/NAS và điện thoại thật |
| Space / Studio | Cùng editor/player/chat; chuyển bố cục và phục hồi nháp đã kiểm tra trình duyệt | Hội thoại phía server, đầy đủ ngữ cảnh lựa chọn và hồi quy sản xuất |
| Nguồn trong Home/chat/setup | Đường dẫn A/B-roll, chọn video chính có metadata và 6 ảnh lấy mẫu thật, khôi phục yêu cầu khi mở lại setup, tạo dự án, snapshot và nhập file có provenance; UI Home kiểm tra hai kích thước desktop | Gắn ảnh cho job sửa/dự án cũ, tự phân tích/chọn cảnh, ghép nhiều A-roll, thư mục lớn và mất mạng NAS thật |
| AI thực hiện | Chat và Home setup chọn phiên Codex/Claude hoặc CLI riêng; pin agent, model CLI tùy chọn; kiểm tra payload UI không gọi agent | Kiểm chứng CLI thật; API worker, catalog/model tự động và ngân sách |
| Ảnh trong thư viện / Cảnh trám / Ảnh bìa | Dùng chung công cụ ảnh/kết nối/gallery; sinh ảnh và xuất đúng kích thước qua fixture/API smoke | Provider thật, sửa ảnh/tham chiếu, job bền vững; chọn ảnh→lưu ảnh bìa chưa kiểm tra trọn luồng |
| Kết nối ảnh | Cấu hình theo workspace, khóa Windows DPAPI ngoài dự án; không trả khóa về UI | Hợp nhất kết nối LLM/voice/social; xác thực khả năng provider thật |
| Tự xuất / kiểm tra rồi xuất | Chat/setup Home có bộ chọn độc lập; Không gian làm việc → Dựng bằng AI và chat lưu cùng mặc định workspace; callback sửa và dựng mới qua inbox CLI đã tạo MP4 final thật từ fixture, manual không render; first-build mới dùng project candidate và revision guard; Home có hộp đối chiếu xung đột đã kiểm tra trình duyệt | Cô lập asset/helper-tool, kiểm tra trọn đường mở đối chiếu từ lịch sử editor, queue/restart/retry bền vững và control ghi đè riêng dự án chưa hoàn tất |
| Voice / thuyết minh | Dùng lại giong.js từ Home và Âm thanh; kết nối/kết quả theo workspace, nhập audio và track audio.clips chỉnh được; tone tổng hợp đã render đúng thời gian | Provider thật, nghe giọng thật, waveform/ducking và toàn bộ luồng trình duyệt có quyền sử dụng chưa nghiệm thu |
| News / DAM / batch / phát hành / migration | Đã xác định điểm vào ở mục 2, giữ toàn bộ inventory | Hợp nhất dịch vụ/dữ liệu và nghiệm thu từng nhóm; không suy ra hoạt động từ mục menu |

Một số đường lưu có bảo vệ revision; chưa cô lập đầy đủ mọi tác vụ/tab. Catalog AIEV chủ yếu là tham khảo, riêng art/palette/avoid đã được dùng cho prompt ảnh. Chi tiết bằng chứng và giới hạn theo BUILD_STATUS; bảng này không phải báo cáo hoàn tất tích hợp ba app.

## 8. Hợp đồng tích hợp khi phát triển giao diện

Mỗi tính năng phải ghi rõ trước khi triển khai: điểm vào VEK hiện có → thành phần mở rộng → service/API dùng chung → dữ liệu đọc/ghi → trạng thái lỗi/phục hồi → bằng chứng nghiệm thu. Chỉ thêm điểm đến mới nếu không có vị trí phù hợp trong bản đồ mục 2, đồng thời cập nhật tài liệu này.

- Home, thiết lập và editor mở cùng bộ chọn tư liệu; giữ workspace/project đích xuyên suốt. Nguồn NAS, điện thoại và Drive là lựa chọn nguồn trong picker.
- Space và Studio gọi cùng chat/task/project service. Bố cục, AI thực hiện và chính sách hoàn tất là ba lựa chọn độc lập, không dùng một công tắc để thay cả ba.
- Thư viện mẫu giữ thẻ preview của VEK; phân biệt mẫu dựng có thể áp dụng với skill, preset, phong cách ảnh và prompt tham khảo. Không thêm nút chạy khi chưa có adapter thực thi.
- Ảnh/voice/video AI mở công cụ dùng chung từ thư viện hoặc editor; kết quả về asset catalog, người dùng chọn lưu/chèn/dùng cho ảnh bìa. Đường vào khác nhau không sinh kho hay cấu hình khóa riêng.
- Ảnh bìa mở rộng canvas VEK; Xuất/Phát hành mở rộng luồng hiện có. Kênh/lịch dùng chung với Mạng xã hội; không tạo thêm màn đăng độc lập chỉ vì bổ sung provider.
- Cài đặt là nơi quản lý kết nối và mặc định; lối tắt từ chat/công cụ mở đúng nhóm. Chỉ hiện model và thao tác adapter thực sự hỗ trợ.

Thứ tự nghiệm thu một luồng: vào từ Home → chọn nguồn/mẫu → giao AI → xem Space → chỉnh trong Studio → kiểm tra hoặc tự xuất theo lựa chọn → chuẩn bị ảnh bìa/nội dung → đăng hoặc lên lịch khi được chọn. Mỗi bước cần thử dữ liệu thật phù hợp trước khi công bố hoàn tất; kiểm tra fixture không thay thế nghiệm thu sản xuất.

## 9. Bản đồ thành phần và trách nhiệm triển khai

Các đường dẫn bên dưới tính từ thư mục ContentOS. Đây là vị trí mở rộng dựa trên mã hiện có; các năng lực đích vẫn phải đối chiếu trạng thái ở mục 7.

| Điểm giao diện | Thành phần hiện có cần mở rộng | Service/dữ liệu dùng chung | Điều kiện tránh trùng chức năng |
|---|---|---|---|
| Home, thiết lập dựng mới | editor/ui/home.js | workspace, source intake, template catalog, AI job và completion-policy | Giữ luồng chọn nguồn → mẫu → yêu cầu; không tạo wizard dựng riêng cho từng provider |
| Space / Studio, Nhờ AI sửa | editor/ui/app.js, contentos-layout.css | project/revision, revise-jobs, revision-results, completion-policy | Một project/player/timeline; dùng cùng chat và trạng thái việc |
| NAS / điện thoại / file dùng chung | editor/ui/contentos-intake.js, contentos-sources.js | storage, chat-sources, mobile-intake, manifest nguồn | Cùng picker tại Home/setup/Cảnh trám; không nhân đôi kho nguồn |
| Mẫu, skill, phong cách, prompt | editor/ui/contentos-library.js, bộ chọn mẫu VEK | catalogs và template/skill metadata | Có nhãn loại và khả năng thực thi; mẫu tham khảo không có nút chạy giả |
| Ảnh AI và ảnh bìa | editor/ui/contentos-images.js; canvas Ảnh bìa trong app.js | images, image-output, covers, connections | Dùng chung kết quả và kết nối; ảnh bìa là đầu ra có bố cục, không tạo thêm app ảnh |
| Voice và audio | editor/ui/giong.js; Âm thanh/timeline trong app.js | giong-api, connections, storage, audio.clips | Một công cụ tạo giọng; phân biệt nhận file vào kho với chèn vào timeline |
| AI/model và kết nối | bộ chọn AI trong app.js; contentos-connections.js, ket-noi-ai.js, tich-hop.js | adapter thực thi, capability, secret store | Hợp nhất cấu hình dần; không tạo store key riêng theo mỗi lối vào; API LLM còn planned |
| Xuất và hoàn tất | Xuất VEK, bộ chọn hoàn tất ở chat/setup | completion-policy, render-snapshots, render-lock, render-artifacts | Một pipeline render; tự xuất, chờ kiểm tra và phát hành là các lựa chọn riêng |
| Kênh, thống kê, lịch đăng | Mạng xã hội / Phân tích VEK | danh sách kênh, lịch và publish job chung theo workspace | Không tạo màn đăng khác chỉ vì thêm kênh/provider; hợp nhất scope còn cần triển khai |
| Workspace, lưu trữ, nhập dữ liệu | editor/ui/contentos.js và Cài đặt | workspaces, storage, manifest migration | Mỗi máy chạy độc lập; nhập có preview/xung đột và giữ nguyên dữ liệu nguồn |

News, batch, remote đầy đủ và migration cần đặc tả chi tiết service trước khi triển khai; vị trí giao diện đích đã có ở mục 2, không coi bảng trên là các module đã chạy đầy đủ.

## 10. Checklist bàn giao tích hợp giao diện

Mỗi nhóm tính năng ghi lại:

1. Điểm vào VEK đang có và lý do mở rộng tại đó; nếu thêm mục mới, nêu vì sao vị trí cũ không đáp ứng.
2. Các thao tác cụ thể và kết quả: xem trước, áp dụng, lưu, chèn, xuất hoặc lên lịch; không dùng cùng nhãn cho các hành động khác nhau.
3. Workspace/project/revision đích; trạng thái chưa lưu, AI đang chạy và xung đột được giữ khi đổi bố cục hoặc tải lại.
4. Một nguồn cấu hình/kết quả dùng chung cho mọi lối vào; scope và cách lưu bí mật phải rõ.
5. Empty/loading/success/error/cancel/retry; nếu chưa có phục hồi thì ghi giới hạn, không hiển thị nút không hoạt động.
6. Bằng chứng trình duyệt ở 1920×1080 và 1280×720, API/file đầu ra và các lỗi tiêu biểu; phân biệt fixture với provider/NAS/điện thoại thật.
7. Cập nhật BUILD_STATUS và feature register đúng mức đã kiểm chứng; thiết kế đích không được tính là hoàn thành tính năng.

## 11. Luồng thao tác làm chuẩn khi tích hợp

| Vị trí | Thao tác người dùng | Hành vi cần giữ khi mở rộng |
|---|---|---|
| Home VEK | Chọn file hoặc dán thư mục A-roll/B-roll vào ô giao việc | Kiểm tra nguồn tại chỗ, chọn video chính, xem metadata/ảnh khảo sát rồi vào setup hiện có; không mở một ứng dụng NAS riêng |
| Setup dự án | Chọn mẫu/skill, yêu cầu, AI thực hiện và cách hoàn tất | Ba nhóm lựa chọn có nhãn rõ; giữ yêu cầu nguồn từ Home; thiếu adapter/model phải báo khả năng thực tế |
| Space | Giao việc bằng chat, xem preview và tiến trình | Dùng cùng dự án và hội thoại của Studio; nguồn/mẫu/AI là thẻ hoặc điều khiển trong ngữ cảnh, không thêm menu tương đương |
| Studio | Chỉnh tay hoặc nhờ AI sửa một phần | Giữ editor VEK và HyperFrames; ảnh/cảnh trám/voice/phụ đề đi vào nhóm công cụ hiện có; bảo vệ chỉnh tay khi kết quả AI về |
| Hoàn tất | Tự xuất hoặc kiểm tra rồi xuất | Hiện chế độ đã chốt của lượt; manual dừng ở preview, auto theo dõi render/file thật; lỗi có lý do và hướng xử lý |
| Xuất / Phát hành | Chọn ảnh bìa, sửa tiêu đề/caption/tag, chọn kênh và lịch | Tái sử dụng công cụ ảnh, kênh và lịch; chỉ đăng theo cấu hình phát hành, không suy từ chế độ tự xuất |

Bảng này là hợp đồng UX để build. Những bước còn planned ở mục 7, như API/model tự động hoặc phát hành hợp nhất, vẫn cần triển khai và nghiệm thu; bảng không xác nhận các bước đó đã chạy. Sáu ảnh khảo sát từ Home được giữ trong dự án và chép vào từng job dựng mới; inbox chỉ dẫn mở ảnh và đọc mốc thời gian. Chưa kiểm chứng AI thật phân tích, chưa nối job sửa/dự án cũ. Nguồn được đối chiếu size/mtime, chưa phải hash toàn bộ video; đổi nguồn cần tạo lại khảo sát, setup đã có chọn video, tạo lại 6 ảnh cho lượt dựng và bỏ đính kèm theo lựa chọn rõ ràng; ảnh mới chưa lưu làm mặc định dự án khi reload.



## 12. Phong cách và prompt trong bước chọn mẫu

Bước mẫu dựng VEK có phần mở rộng Phong cách / prompt bổ sung từ thư viện workspace. Chọn tối đa một phong cách và một prompt, xem nội dung rồi giao cùng yêu cầu; server chốt dữ liệu/nguồn/hash theo lượt. Đây là định hướng cho AI, không phải skill thực thi hoặc thao tác tự áp timeline. Không chọn thì giữ luồng VEK cũ. Đã có bằng chứng API/inbox và payload trình duyệt cho setup và chat sửa; chất lượng dựng thật và mặc định lưu phía server còn chưa nghiệm thu.


Phần Nhờ AI sửa của Space/Studio cũng có bộ chọn phong cách/prompt và xem nội dung, dùng chung catalog/service chốt phiên bản với setup. Lựa chọn lưu theo dự án trên trình duyệt, giữ qua đổi bố cục và reload; không đổi AI thực hiện hoặc chính sách hoàn tất. Đã kiểm API/inbox và payload UI; chưa nghiệm thu chất lượng dựng thật hoặc mặc định lưu phía server.


## 13. Tạo phong cách và prompt riêng

Trong Phong cách & Prompt, dùng form tạo mới hoặc Tạo phiên bản chỉnh sửa tại thẻ đang có. Loại Prompt có nội dung văn bản; Phong cách có mỹ thuật, màu, chuyển động và điều cần tránh. Lưu theo workspace, giữ bản cũ và từ chối sửa từ bản đã có phiên bản mới hơn. Các bộ chọn setup/chat dùng chung catalog; phiên bản tự tạo đã được kiểm tra chốt vào job. Chưa có xóa/lưu trữ, đồng bộ catalog giữa máy hoặc adapter thực thi skill.


## 14. Nguồn tin và kịch bản trong Home / setup

Home có Nguồn tin & Kịch bản bên cạnh thư viện mẫu, mở dialog biên tập URL/trích đoạn/kịch bản theo workspace. Lưu nháp hoặc xác nhận duyệt thành phiên bản mới; sửa nội dung bỏ dấu duyệt. Bước thiết lập VEK chỉ liệt kê bản đã duyệt, cho xem nội dung và chốt bản đó vào job dựng mới. Giữ nguyên luồng chọn tư liệu/mẫu/AI/hoàn tất, chưa tạo dự án chỉ từ văn bản. Bằng chứng NEWS_BRIEF_BROWSER_SMOKE.json; quét tin, kiểm dữ kiện và lắp voice/B-roll tự động còn cần triển khai.


Nguồn tin: mỗi thẻ nguồn có Đọc URL nguồn và Nhập HTML đã lưu, dùng lại bộ trích xuất Studio qua adapter local. Hiện tiêu đề/trích đoạn/câu dẫn chiếu và cảnh báo; sửa URL hoặc trích đoạn bỏ liên kết khảo sát cũ. Dẫn chiếu được lưu cùng bản tin/job, không coi là kiểm chứng sự thật. Đã kiểm HTML giả lập qua trình duyệt, chưa xác nhận báo công khai cụ thể đọc thành công. Không tự viết lời đọc hoặc tải ảnh bài báo.


Kịch bản theo dự án: tại setup, chọn bản tin rồi bấm Lưu lựa chọn kịch bản cho dự án để mở lại vẫn dùng đúng bản. Thay lựa chọn mà chưa lưu chỉ dành cho lượt dựng hiện tại. Chọn Không chọn bản tin và lưu sẽ bỏ mặc định. Space/Studio hiển thị bản gắn để tham khảo; job sửa giữ bản sao nguồn/kịch bản riêng. Có kiểm revision và ID bản gắn khi lưu để chặn cửa sổ cũ. Chưa đồng bộ lời đọc/timeline hay cho đổi bản gắn ngay trong chat.


Giọng tin tức: bản đã lưu/duyệt trong dialog tin và thẻ kịch bản Space/Studio mở cùng Giọng nói AI với lời đọc điền sẵn. Người dùng kiểm tra rồi bấm Tạo audio; giữ điều kiện Premium/kết nối và thư viện kết quả chung. Lời sửa tay không được gắn nhãn khớp bản duyệt. Nội dung >5.000 ký tự báo cần chia, không cắt ngầm; chưa tự chia/ghép, đồng bộ lời đọc/phụ đề hoặc chèn timeline tự động. NEWS_VOICE_BROWSER_SMOKE.json là bằng chứng fixture UI, chưa là nghiệm thu provider thật.


Nhận voice trong Space/Studio: nút mở giọng từ kịch bản dự án dùng cùng công cụ voice nhưng chỉ cho nhận kết quả khớp bản tin đang gắn. Giữ project/revision khi nhập và ghi liên kết lời đọc vào work/voice-assets.json; nhập xong làm mới kho media. Audio vào tư liệu trước, người dùng chọn tại Âm thanh để chèn timeline. Đã kiểm service bằng tone và UI bằng fixture; chưa nghiệm thu giao dịch provider thật hoặc tự canh lời đọc.


## 15. Voice trên timeline Âm thanh — tích hợp vào editor VEK

Luồng hiện hành: bản kịch bản đã duyệt → Giọng nói AI dùng chung → nhận kết quả vào tư liệu dự án → Studio → Âm thanh → chọn audio → Thêm audio tại playhead → Lưu. Mở công cụ hoặc nhập tư liệu không tự chèn clip, tắt tiếng A-roll hay kéo dài bản dựng.

Bộ chọn audio hiển thị thời lượng, phiên bản kịch bản và trạng thái khớp/khác bản/không có bản gắn/không liên kết. API kiểm checksum audio có liên kết và đối chiếu bản tin dự án. Khi chèn, đọc lại thông tin, giữ ngữ cảnh dự án và chặn voice thuộc bản kịch bản khác. Audio tổng quát không có liên kết vẫn dùng được; không gắn nhãn là lời đọc đã duyệt.

Clip dùng audio.clips sẵn có, lưu voiceSource, sourceDuration cùng vị trí/âm lượng và thao tác lưu VEK. Khi audio dài hơn phần video còn lại, cảnh báo phần dư không xuất; không tự thay thời lượng project. Clip hiện phiên bản lời đọc để người dùng đối chiếu.

Bằng chứng: VOICE_TIMELINE_BROWSER_SMOKE.json kiểm 1280 và 1920, hiển thị khớp/kéo dài, thêm/lưu liên kết và từ chối chèn bản khác, không có lỗi trang. Audio là tone tổng hợp; không gọi provider. Chưa render lại luồng news-voice này, chưa nghe giọng thật hoặc tự căn lời/ducking. Clip đã chèn kiểm lại liên kết khi mở tab Âm thanh, bấm Kiểm tra lại liên kết lời đọc hoặc reload; cảnh báo bản cũ/khác và lỗi kiểm tra, giữ nguyên clip. Chưa có thông báo liên tab tự động. NARRATION_RENDER_SMOKE.json chỉ chứng minh timing audio tổng hợp của luồng trước.


## 16. Tạo dự án từ bản tin và lời đọc

Home → Nguồn tin & Kịch bản → chọn bản đã duyệt → Giọng nói AI → chọn kết quả khớp → chọn 9:16/16:9 → Tạo dự án từ voice này → Mở dự án trong Studio. Dùng lại công cụ voice, thư viện audio, news binding và editor VEK; không thêm mục điều hướng hoặc engine dựng riêng.

Dự án bắt đầu bằng nền đen tạm đúng thời lượng audio đọc thực và track lời đọc chỉnh được. Người dùng thêm cảnh trám/hình ảnh trong Studio hoặc giao AI sửa. Không tự gọi AI, xuất hoặc đăng khi tạo. Tại Âm thanh có chỉ dẫn nền trống; chưa tự căn lời/phụ đề hoặc lựa cảnh. Kịch bản/voice khác bản hoặc file đổi bị chặn phía service; lỗi dọn staging, không mở dự án dở.

Đã kiểm service bằng tone thực ở hai tỷ lệ và UI bằng fixture tại 1280/1920; chưa nghiệm thu provider/HTTP có quyền thật hoặc render trọn luồng này. Những ghi chú trước nói cần video chính được thay thế cho đường vào này; luồng setup từ footage vẫn giữ nguyên. Thời lượng tối đa hiện 30 phút, chưa chia voice dài và chưa chống tạo lặp sau mất phản hồi.


## 17. Ráp cảnh trám theo thời lượng trong editor

Studio → Cảnh trám → Ráp cảnh trám theo thời lượng. Chọn các ảnh/video đã nhập, dùng ↑/↓ đổi thứ tự, nhập độ dài cảnh, bật lặp danh sách nếu muốn. Xem cách ráp trước: hiện từng mốc, độ dài phủ/thiếu và lượt lặp. Chỉ Áp dụng mới thêm brolls vào timeline; Lưu/Hoàn tác dùng VEK. Nếu đã có cảnh trám hiện hoặc bản dựng đổi khi dialog mở, giữ bản cũ và báo cần kiểm lại.

Cảnh toàn màn hình, tiếng tắt, video dùng từ đầu và giới hạn bởi thời lượng đọc thực. Đây là ráp theo thứ tự người chọn; chưa phải AI hiểu nguồn hay đối chiếu lời đọc. Preview cho biết phần chưa phủ khi không lặp hoặc có đuôi quá ngắn. Không tự đổi source/voice, không tự xuất. Kiểm ở1280/1920 với MP4/PNG tổng hợp và service timemap/probe; chưa render nghiệm thu toàn luồng hoặc đo chất lượng tư liệu thực.


Bổ sung kiểm chứng mục16–17: NEWS_ASSEMBLY_RENDER_SMOKE.json ghi nhận render HyperFrames draft thật từ bản tin/voice tổng hợp và ảnh/video màu. MP4 dọc1080×1920,3giây; màu cảnh đúng mốc, tone voice440Hz giữ và tone B-roll880Hz bị tắt, contact sheet đã xem. Không thay thế nghiệm thu lời nói/ngữ nghĩa cảnh, giao dịch provider có quyền, bản ngang/final hoặc benchmark sản xuất.


## 18. Phụ đề từ voice trên timeline

Studio → Văn bản → Phụ đề giữ bảng VEK, bổ sung bộ chọn clip voice đang dùng. Lưu bản dựng → Nhận giọng từ voice → xem chữ nhận được → Thay phụ đề bằng lời voice → kiểm tra/Lưu hoặc Hoàn tác. Quy đổi mốc theo phần audio đã cắt, vị trí clip và timemap; không chia đều kịch bản để giả làm nhận dạng, không tự cắt lại video hoặc ghi đè transcript chính.

Thao tác báo thiếu Whisper, sai bản tin, audio thay đổi hoặc bản dựng đổi trong lúc chờ. Kết quả chỉ áp khi đúng ngữ cảnh ban đầu. Bản đầu chưa có hủy/tiến độ nhận giọng hay khôi phục sau restart. NARRATION_CAPTIONS_BROWSER_SMOKE.json kiểm giao diện bằng phản hồi nhận dạng giả lập; chưa xác nhận nhận giọng thực, độ chính xác tiếng Việt hay render phụ đề trong luồng mới. ContentOS chưa cấu hình binary/model local trong lần kiểm tra này.


Cập nhật mục18: ContentOS trên máy này đã có Whisper local độc lập qua importer checksum17file, trạng thái ready. Bộ chọn ngôn ngữ voice có Tiếng Việt/English/Tự nhận, mặc định vi. NARRATION_ASR_RUNTIME_SMOKE.json xác nhận API thật +Whisper native nhận17từ tiếng Anh tổng hợp, không đổi project; kiểm giao diện vẫn dùng fixture riêng. Chưa xác nhận chính xác tiếng Việt, render phụ đề hoặc cài portable trọn bộ trên máy khác. Ghi chú thiếu công cụ ở mục18 mô tả trạng thái trước lần nhập này.


Cập nhật mục18 — tiến độ/hủy: Nhận giọng từ voice hiện pha và phần trăm Whisper qua stream; Hủy nhận giọng giữ nguyên phụ đề và ngắt tiến trình server. Đã kiểm API/native hủy→chạy lại và nút UI ở1280/1920. Stream mất kết quả/lỗi không được áp phụ đề. Chưa lưu job bền vững hoặc nối lại sau reload; đổi tab chưa tự hủy. Những ghi chú chưa có hủy/tiến độ trước đây được thay thế cho đường voice này, không áp dụng mặc nhiên cho mọi ASR/job cũ.


## 19. Ảnh tham chiếu trong công cụ ảnh dùng chung

Cảnh trám/Thư viện/Ảnh bìa → Tạo ảnh AI giữ một dialog và gallery. Chọn tối đa4ảnh đã có trong workspace, mô tả, phong cách và tỷ lệ → Tạo1ảnh → xem/lưu/nhận tư liệu như luồng cũ. Hiện rõ bytes ảnh sẽ gửi gateway khi tạo. Kết nối có cờ tự khai báo hỗ trợ /images/edits; không bật thì khóa bộ chọn. Giữ loading/lỗi/thành công trong dialog, không thêm sidebar hoặc kho API riêng. Server kiểm hash/nguồn/kích thước/dung lượng và chốt liên kết ảnh gốc vào metadata kết quả. Kiểm UI1280/1920 và gateway multipart giả lập đạt; provider thật, ảnh nhập từ máy/dự án, mask và nhiều biến thể chưa nghiệm thu.


Bổ sung mục19: Nhập ảnh PNG/JPEG từ máy ở ngay nhóm ảnh tham chiếu, max20MiB. Kiểm local rồi đưa cùng gallery/kho ID; có thể nhập khi chưa cấu hình gateway. Ảnh nhập được chọn sẵn nếu capability/giới hạn4ảnh cho phép. Nhập không gửi provider, giữ metadata gốc và hiện nhắc rõ. Sai file/workspace hoặc decode lỗi báo tại dialog, không để file dở. API thực/fixtures UI1280/1920 đạt; chưa dự án-media picker/mask/variant hay nghiệm thu provider thật.


Bổ sung mục19 — ảnh có sẵn trong dự án: mở công cụ ảnh từ Cảnh trám/Ảnh bìa sẽ có bộ chọn PNG/JPEG trong media hiện tại, bấm Nhập ảnh dự án vào thư viện tham chiếu. Giữ bản gốc, lưu dấu nguồn/hash, không gửi gateway. Revision/workspace cũ bị chặn; ảnh đã vào local từ NAS/điện thoại dùng cùng luồng. Thư viện ảnh tại Home không đoán dự án đang mở. Kiểm API/source và fixture UI1280/1920 đạt; chưa raw NAS browse/WebP/frame extraction/dedup hoặc provider thật.

## 20. Nhiều phương án ảnh trong cùng công cụ

Cảnh trám, thư viện và Ảnh bìa dùng cùng lựa chọn Số phương án (1–4), mặc định1. Nút Tạo N ảnh gửi đúng một yêu cầu; số lượng có thể tăng phí và gateway phải hỗ trợ. Không tự gọi lại nếu lỗi hoặc trả thiếu. Tất cả kết quả về catalog workspace, giữ mã nhóm và số phương án; dùng các thao tác tải/chèn/ảnh bìa hiện có, không thêm màn biến thể riêng.

Service kiểm số lượng và toàn bộ chữ ký ảnh trước khi lưu; lỗi lưu hoàn tác file của lượt. Chưa có đánh giá ảnh khác nhau về nội dung, chỉnh vùng/mask, chạy bền sau restart hoặc nghiệm thu provider thật. Bằng chứng: images.test.mjs, IMAGE_API_SMOKE.json và IMAGE_REFERENCE_BROWSER_SMOKE.json (fixture1280/1920).

## 21. Kết nối LLM API và danh sách model

Màn Kết nối AI VEK giữ trạng thái phiên/CLI và thêm nút Kết nối API / danh sách model, mở biến thể cùng dialog kết nối. Không thêm menu/API store trong project. LLM config dùng kho DPAPI chung theo workspace, nhóm llm riêng; kết nối ảnh không đổi. Model ID nhập tay hoặc chọn từ danh sách gateway đã lưu, rồi Lưu để áp dụng.

Chỉ bấm Lấy danh sách mới gọi /models; không chạy chat/generate để thử. Loading/lỗi HTTP/danh sách quá lớn/workspace hoặc kết nối đổi phải hiện thật. Danh sách không xác minh tool/vision/dựng. UI và API ghi rõ worker dựng API chưa sẵn sàng; chưa thêm tùy chọn thực thi API vào giao việc trước khi có worker thật.

Kiểm chứng: model-catalog.test.mjs, IMAGE_API_SMOKE.json (local gateway) và MODEL_CONNECTION_BROWSER_SMOKE.json (fixture1280/1920). Cần tiếp tục worker/tool loop, chi phí/capability và nghiệm thu provider thật theo mục5 BUILD_PLAN.

## 22. AI soạn kịch bản từ nguồn đã lưu

Trong dialog Nguồn tin & Kịch bản hiện có: lưu bản có URL/trích đoạn trước, nhập yêu cầu rồi bấm Soạn bằng API đã cấu hình. Dùng lối tắt Kết nối API chung; không thêm màn viết kịch bản khác. Có thay đổi chưa lưu thì yêu cầu lưu; trong lúc chạy khóa trường chỉnh, Đóng hủy yêu cầu phía client.

Kết quả tự lưu thành phiên bản nháp mới với cùng nguồn, hiển thị model/token nếu provider trả; ô duyệt luôn bỏ chọn. Người dùng sửa/lưu/duyệt qua luồng hiện có trước khi voice hoặc giao dựng. Không tự xuất/đăng. Lỗi HTTP, output bị cắt, workspace/kết nối đổi hoặc nguồn có phiên bản mới phải báo thật, không tự retry. Yêu cầu gửi trích đoạn tới gateway có nhãn chi phí trước nút chạy.

Kiểm chứng: news-drafting.test.mjs, IMAGE_API_SMOKE.json (gateway tổng hợp) và NEWS_DRAFT_BROWSER_SMOKE.json (fixture1280/1920). Chưa kiểm provider thật, chất lượng biên tập/dẫn chiếu/sự thật hoặc phục hồi sau reload.

## 23. Theo dõi việc soạn qua hàng đợi chung

Luồng hiện hành thay request-bound ở mục22: Soạn bằng API tạo task lưu đĩa và khóa chỉnh nguồn trong dialog khi chạy. Đóng/tải lại vẫn chạy; mở lại xem tối đa5 việc mới nhất, trạng thái, Mở bản nháp và Hủy việc soạn. Không mở dialog tạo lại yêu cầu. Hủy riêng có thể không ngăn phí provider đã nhận.

Khởi động server lại: đối chiếu bản nháp có taskId và hash hợp lệ; đã lưu thì khôi phục kết quả, còn lại báo gián đoạn. Không tự resume/retry yêu cầu có thể tính phí. Người dùng kiểm tra bản nháp rồi mới tạo lượt mới. Workspace khác không hiển thị việc; lỗi kết nối khi polling không coi task đã dừng. Dùng chung taskStore/API, không thêm hàng đợi news độc lập.

Bằng chứng: news-tasks.test.mjs, IMAGE_API_SMOKE.json, NEWS_DRAFT_BROWSER_SMOKE.json. Khôi phục đã kiểm ở service, chưa thử crash thực tế. VEK edit queue và các tác vụ khác chưa được chuyển toàn bộ.

## 24. API sửa bản dựng trong chat Space/Studio

Bộ chọn AI thực hiện hiện có thêm API · sửa bản dựng hiện có, dùng model LLM đã lưu tại Kết nối AI. Nhãn nêu giới hạn6lượt/có phí, tư liệu đã có, chưa tự chạy skill hoặc tạo asset. Chính sách hoàn tất vẫn chọn riêng. Home dựng mới chưa mở API khi chưa có adapter tương ứng.

Giữ nguyên yêu cầu chat, bản candidate, tiến trình/hủy/lịch sử và hộp xung đột của VEK. API dùng công cụ đọc project và thay trường dựng có giới hạn; không thêm editor hoặc dữ liệu timeline khác. Kết quả kiểm build rồi áp theo base revision; sửa tay mới hơn thì giữ candidate để đối chiếu. Hủy chặn áp muộn. Startup báo gián đoạn, không tự gọi API lại. Giữ nguyên entitlement.

Bằng chứng: api-editor.test.mjs, API_EDITOR_API_SMOKE.json (tool call/preview/conflict/cancel local gateway) và API_EDITOR_BROWSER_SMOKE.json (selector/payload1280/1920). Chưa chứng minh chất lượng provider thật, render thành phẩm, auto-export của worker này hoặc dựng đủ mọi loại video.

## 25. Công cụ tư liệu và lời thoại cho API sửa dựng

Không thêm màn riêng: chế độ API trong chat Space/Studio đọc thư viện inputs/assets của dự án được giao, công cụ FFprobe thời lượng/kích thước và transcript lưu sẵn qua tool loop. Model chọn B-roll mới phải kiểm metadata trước; giữ nguồn local, thêm vào cùng project.brolls và preview/timeline VEK. Lời thoại phân trang, theo giờ video gốc; không coi transcript có sẵn là đã nhận giọng đúng.

Nguồn hoặc transcript đổi giữa chừng phải lỗi thay vì áp bản dựa trên dữ liệu cũ. Tư liệu ngoài dự án cần nhập trước. Chưa có xem frame/hiểu cảnh hoặc tìm footage theo ý nghĩa; metadata/tên file không phải bằng chứng model đã xem video. Giới hạn và bằng chứng ở BUILD_STATUS/API_EDITOR_API_SMOKE.json.

## 26. Khảo sát frame qua model nhìn ảnh

Kết nối LLM chung thêm công tắc cho phép gửi frame tới model hỗ trợ nhìn ảnh; mặc định tắt, tự khai báo. Nhãn tại AI thực hiện nêu tối đa6frame/lượt. Không thêm menu khảo sát riêng, không gửi khi mở/lưu kết nối. Trong lượt được giao, model có thể yêu cầu mốc frame trong tư liệu dự án, nhận ảnh480px kèm tên/mốc/checksum; bản khảo sát giữ trong thư mục việc.

Chỉ đánh giá phần frame đã xem; không coi vài ảnh là hiểu toàn video. Provider không hỗ trợ phải báo lỗi, không chuyển model hoặc gọi lại tự động. Phần chọn cảnh theo ý nghĩa cần nghiệm thu provider thật; fixture chỉ chứng minh đường dữ liệu hoạt động. Quy tắc nguồn/candidate/hủy ở mục24–25 giữ nguyên.

## 27. Dựng mới qua API trong Home VEK

Trong bước AI thực hiện có API · dựng cơ bản từ tư liệu dự án; vẫn chọn mẫu và chính sách hoàn tất ở chỗ hiện có. Nhãn chỉ rõ tối đa6lượt/có phí, mẫu mới áp màu/font/cấu hình cơ bản và quy tắc tham khảo, chưa đủ HTML/skill. Phiên Codex/Claude tiếp tục đáp ứng những tác vụ chưa có adapter API. Không tự đổi sang CLI khi model lỗi.

Nguồn phải nhập dự án trước. AI B-roll/stock/Drive hoặc đường dẫn NAS chưa nhập báo thiếu hỗ trợ, không im lặng bỏ. Candidate first-build giữ template snapshot, cùng kiểm đồ họa, base revision, preview/hủy/xung đột và completion export chung. Chế độ review dừng preview; auto-export đã thử MP4 final thật với fixture3s. Không suy ra full template fidelity hoặc nghiệm thu provider thật.

Bằng chứng: API_EDITOR_API_SMOKE.json, FIRST_BUILD_API_BROWSER_SMOKE.json và API_FIRST_BUILD_FINAL_FRAME.jpg. Mục này thay giới hạn Home API chưa có ở24, không đánh dấu toàn bộ mẫu/skill đã chuyển đổi.

## 28. API chọn preset mẫu và điền chữ

Không thêm màn mới. Worker API Home/Space/Studio có công cụ liệt kê preset mẫu đã cài với supported/fields/requiresMatte, rồi chèn theo presetId. Model chỉ đưa nội dung mới/timing/minhHoa; server sao chép HTML/CSS/animation từ snapshot cài đặt và điền trường văn bản. Kết quả là blocks/texts VEK chỉnh tay được, có template hash/provenance.

Selector chưa hỗ trợ, thiếu trường hoặc cần matte phải báo lỗi thật; không tự vẽ thay mẫu. Đồ họa được kiểm cùng kiemDoHoa trước commit; vẫn cần duyệt chất lượng. Mẫu đã có code HTML có thể được dùng qua adapter này, còn sinh mã HTML tùy ý và thay ảnh/icon chưa hỗ trợ.

Bằng chứng: api-presets.test.mjs, API_EDITOR_API_SMOKE.json và API_PRESET_FINAL_FRAME.jpg. Final fixture đã xem đúng Xin/chào với animation mẫu; chưa suy ra toàn bộ mẫu/skill hoặc provider thật đã đạt.

## 29. Mức dùng và giới hạn lượt LLM trong kết nối chung

Kết nối API hiện có thêm nhóm Mức dùng LLM API trên máy này: ngày giờ Việt Nam, số lượt, token provider trả và lượt thiếu dữ liệu; Xem mức dùng và Lưu giới hạn ngày.0là không giới hạn. Không trình bày token thiếu thành0 hoặc gọi đây là hạn mức tiền USD.

Một bộ đếm chung theo workspace cho soạn kịch bản/dựng mới/sửa API. Đếm trước gửi; lỗi/hủy vẫn tính, chạm giới hạn chặn lượt tiếp theo. Không tự fallback provider hoặc CLI. Chưa gồm ảnh/voice/CLI/máy khác; dữ liệu này chưa thay hóa đơn provider hoặc ngân sách tháng.

Bằng chứng: api-usage.test.mjs, IMAGE_API_SMOKE.json và MODEL_CONNECTION_BROWSER_SMOKE.json. Giới hạn hiện một server sở hữu store; chưa có điều phối hạn mức6máy.

## 30. Phiên bản dự án tại Home · 04/11/2026

Danh sách dự án VEK có Bản mới → tên và khung9:16/16:9 → tạo bản riêng → Mở bản mới. Tái sử dụng project.json/build/editor VEK; không thêm màn dựng hoặc sidebar phiên bản riêng. Bản mới chỉ lấy dữ liệu đã lưu và sao chép tư liệu độc lập. Bản gốc giữ nguyên. Thông báo đang sao chép/lỗi/hoàn tất hiện tại dialog, chặn đóng trong lúc chạy; chưa có hủy tiến trình. Mất response phải kiểm tra danh sách trước khi tạo lại, chưa có idempotency.

Điểm này đã được kiểm UI/API bằng video tổng hợp ở1280×720 và1920×1080, 47service tests đạt; xem PROJECT_VARIANTS_BROWSER_SMOKE.json và BUILD_STATUS. Đổi tỷ lệ hiện dùng cơ chế format VEK, bắt buộc kiểm lại bố cục; chưa tự căn chủ thể, tái bố trí đồ họa hoặc xuất hàng loạt. Batch/queue/multi-output vẫn là yêu cầu tiếp theo, không coi tạo một phiên bản là hoàn tất sản xuất50–100đầu ra/ngày.
## 31. Lô phiên bản và lịch sử · 04/11/2026

Bản mới → Tạo nhiều bản / Lịch sử lô mở dialog chung tại Home: thêm/bỏ tối đa20tên+tỷ lệ, Tạo lô, số bản hoàn thành/tổng, mở từng bản, Hủy lô, Tiếp tục bản còn thiếu. Dữ liệu từ cùng tasks store và project-variants service; tải lại trang hoặc đóng hộp không hủy worker. Chỉ dùng bản nguồn đã lưu; đổi revision nguồn chặn tiếp tục. Sau restart cần chủ động Tiếp tục; những đầu ra đã gắn task/item được giữ, không tự tạo lại.

Đã kiểm actual browser/API bằng nguồn tổng hợp2bản, chống gửi trùng, lịch sử sau reload;48service tests đạt. Dừng/hủy/phục hồi từng phần đã kiểm dịch vụ, chưa thử kill tiến trình giữa file NAS lớn. Chưa có xuất hàng loạt, CSV/data-driven generation, tự tái bố trí hay benchmark50–100video/ngày. Hướng phát triển tiếp: kế hoạch đầu ra theo kênh và data, hàng đợi render snapshot, bộ nội dung phát hành dùng chung; không tạo engine khác.
## 32. Xuất final lô phiên bản · 04/11/2026

Trong lịch sử lô đã tạo xong: Xuất final cả lô → xác nhận số bản/bố cục → tiến độ từng bản → Mở dự án / Tải MP4. Render có cùng Hủy/Tiếp tục và lịch sử persisted. Không tự đăng. Lượt xuất snapshot revision hiện tại của từng bản; thay đổi bản chưa xuất chặn resume. Dùng cùng CLI/render snapshot/lock/finalizer VEK, không engine mới. Mỗi máy xuất tuần tự.

49service tests đạt; kiểm chức năng tạo2MP4final/thời lượng/kích thước/download đã thành công bằng nguồn tổng hợp. Các harness render dài hiện thoát bất thường sau khi ghi kết quả, chưa được ghi nhận là E2E pass; xem BUILD_STATUS và RENDER_BATCH_*_SMOKE.json. Kiểm UI không render và endpoint download fixture exits0. Chưa benchmark dữ liệu thật, xử lý orphan render sau kill hoặc tự căn bố cục. Đây là tiến độ tích hợp, chưa hoàn tất hệ thống sản xuất.
## 33. Bộ nội dung phát hành theo kênh · 04/11/2026

Xuất video → Nội dung phát hành theo kênh dùng dialog chung: nền tảng/kênh đã kết nối hoặc nháp chung → Chọn bộ nội dung → tiêu đề, caption, hashtag, tag, bình luận nháp → Lưu/Sao chép. Nháp gắn revision dự án và version riêng chống lưu đè. Thay video cảnh báo nháp cũ. Giữ chỉnh sửa chưa lưu qua xác nhận đóng/chọn bộ khác; không tự tạo nội dung hoặc đăng bình luận. Dữ liệu job render/post snapshot đúng kênh; AI nhận dạng dữ liệu, không thực thi chỉ dẫn trong nháp.

50service tests và dialog browser/API1280/1920 đạt; chưa kiểm lối bấm từ editor thật/gói kênh thật/đăng bài. Render batch API/UI đã hết lỗi teardown sau sửa bounded retry cleanup fixture, exit0 ghi tại RENDER_BATCH_PROCESS_EXIT.json và RENDER_BATCH_BROWSER_EXIT.json. Hướng tiếp: tạo nội dung qua AI, gắn thumbnail/output revision, đóng gói bất biến cho lịch đăng, platform validation; không thêm màn xuất/kênh trùng VEK.
## 34. AI soạn bộ nội dung theo kênh · 04/11/2026

Trong dialog Nội dung phát hành: chọn nền tảng/kênh → yêu cầu tùy chọn → AI soạn bộ nội dung → xem/sửa tiêu đề, caption, hashtag/tag, bình luận nháp → Lưu bộ nháp. Dùng cùng LLM đã cấu hình và hạn mức chung; không thêm điểm nhập key. Hủy/đóng ngắt request, không tự thử lại; lỗi giữ văn bản trước đó. Chỉ gửi nguồn văn bản đã lưu, không tuyên bố AI đã xem toàn bộ video. Thiếu nguồn phải nhập mô tả.

Kiểm52service tests +browser1280/1920 fixture, explicit Save, quota local HTTP đạt. Chưa thử provider trả phí, tác vụ durable, CLI-generation, phản hồi chất lượng hay đăng. Bình luận chỉ nháp chủ kênh, không lời chứng thực giả hoặc tự đăng. Dữ liệu phát hành và permission đăng tiếp tục tách riêng.
## 35. Kiểm tra riêng từng kênh và nội dung lịch đăng · 04/11/2026

Nút Lưu bộ nháp chỉ xác nhận bộ nội dung đang chọn theo revision video hiện tại; các kênh chưa kiểm tra giữ cảnh báo riêng. Khi đổi video, bộ cũ cần kiểm lại. Nội dung riêng kênh ưu tiên bản chung nền tảng. Lịch mới lưu snapshot nội dung tại lúc hẹn, không lấy caption mới sửa khi tới giờ. Đây mới là cố định văn bản, chưa ghép bất biến video/thumbnail; lịch vẫn lấy render mới nhất và cần tiếp tục hoàn thiện.

53service tests và PUBLISH_REVIEW_API_SMOKE.json xác nhận kênhA được kiểm tra không làm kênhB hết stale. Browser1280/1920 soạn/lưu đạt. Chưa chạy timer/đăng kênh thật; không coi code wiring là nghiệm thu xuất bản đầy đủ.
## 36. Gắn video vào lịch đăng · 04/11/2026

Popup lịch VEK hiện file đã gắn mã kiểm tra hoặc Chờ đúng bản xuất đã hẹn+revision. Lịch mới chọn file giữ SHA256; file đổi/mất báo lỗi, không tự đổi sang render mới nhất. Hẹn trước khi xuất gắn mã việc/revision, chỉ nhận final tương ứng. Lịch cũ vẫn giữ cơ chế cũ và được ghi nhãn. Chưa chọn/gắn thumbnail vào lịch.

54service tests và CLI fixture kiểm hợp lệ/thay file đạt. Có actual FFmpeg MP4 qua finalizer→pin. Chưa thực thi lịch timer/đăng thật; cần tiếp tục dispatch idempotency, scoped schedule store, file retention và kiểm lại trước upload. Inbox đã yêu cầu kiểm file qua kiem-video-lich.mjs; đó là chỉ dẫn cho agent, chưa phải cưỡng chế ở platform connector.
## 37. Ảnh bìa theo kênh trong bộ phát hành · 04/11/2026

Xuất → Nội dung phát hành → chọn bộ kênh → Ảnh bìa đã lưu hoặc Không chọn → xem trước → Lưu. Dùng ảnh VEK tạo tại Ảnh bìa, không thêm tool tạo ảnh trùng. AI soạn text không bỏ ảnh đã chọn. Lịch giữ ảnh+hash theo snapshot; sửa/xóa ảnh khiến kiểm tra lỗi thay vì tự lấy ảnh mới nhất. Hộp lịch tiếp tục báo lỗi chuẩn bị bộ phát hành. Các nền tảng không hỗ trợ ảnh bìa riêng phải báo rõ, không giả đã áp.

55service tests và browser1280/1920 với JPEG thật fixture đạt; ảnh bìa copy độc lập sang variant và bản nháp cần kiểm lại revision. Chưa chạy upload ảnh bìa lên nền tảng thật/resize theo kênh hoặc immutable package. Inbox/CLI kiểm tra trước upload vẫn là agent gate, không platform enforcement.

## 38. Chốt phạm vi tích hợp UI trong build · 04/11/2026

BUILD_PLAN mục 14 là bảng tổng hợp điểm thao tác, phần tái sử dụng và phần còn thiếu. Mục 2 và 9 ở đây tiếp tục quy định vị trí/thành phần; không tạo thêm menu chỉ vì lấy một tính năng từ AIEV hoặc Studio. Giao diện đích là editor VEK thực tế, không phải thay editor bằng bản UX preview.

Luồng chính: Home → nguồn/mẫu/yêu cầu → AI thực hiện và hoàn tất → cùng dự án ở Space/Studio → chỉnh tay → xuất → ảnh bìa/nội dung riêng kênh → đăng hoặc hẹn giờ nếu được chọn. Luồng phụ tạo ảnh/voice/news quay về asset hoặc project chung, giữ ngữ cảnh workspace và không tự chạy bước trả phí/xuất/đăng khi chỉ mở công cụ.

Trạng thái mới hơn thay các giới hạn lịch sử: API LLM cơ bản đã có adapter (mục 21–29); news/voice đã có từng đoạn pipeline (14–18); phiên bản/lô/render đã có kiểm thử giới hạn (30–32); nội dung, review từng kênh, video và ảnh bìa của lịch đã có cơ chế gắn dữ liệu (33–37). Không suy ra skill đầy đủ, provider thật, đăng thật, remote hoàn chỉnh hay năng suất 50–100 video/ngày từ các kiểm thử này. Dispatch lịch có kiểm thử helper ở mục39, chưa chứng minh chống đăng lặp hoàn chỉnh trên nền tảng.

Trước bàn giao mỗi đợt, ghi rõ: ID feature → nút vào thật → file UI mở rộng → service/store → dữ liệu/revision → trạng thái rỗng/loading/lỗi/hủy/reload → bằng chứng. Kiểm đường vào thật và chuyển Space/Studio ở hai kích thước desktop; giữ bản chỉnh tay khi AI xung đột. Không đánh dấu toàn bộ nhóm hoàn tất từ việc menu xuất hiện hoặc test mở module trực tiếp.

## 39. Khôi phục việc lịch và thông báo thao tác

Lịch Mạng xã hội dùng cùng popup VEK. Mỗi lịch có một định danh việc cố định; timer tìm thấy việc cũ thì giữ trạng thái thay vì giao lại. Đổi giờ/Đăng ngay bị từ chối khi lịch đã giao việc; lỗi phải kiểm kết quả từng kênh trước khi tạo lịch mới. Việc mất hoặc bị hủy báo lỗi, không tự chạy lại. UI chỉ thông báo thành công khi API trả ok; lỗi mạng giữ popup và hiện lỗi.

57service tests đạt, gồm4process tranh tạo cùng việc và đọc lại sau giả lập mất bước lưu lịch. Browser1280/1920 kiểm hồi quy variant/batch/bộ nháp/ảnh bìa đạt. Chưa thử đường lịch có entitlement→timer→runner→nền tảng thật, chưa thử popup lịch với tài khoản có quyền trong milestone này. Việc waiting sau crash không chứng minh worker đang chạy; không tự replay. Calendar store vẫn cần scope/locking và đối soát nền tảng.

## 40. Phiên bản mẫu theo việc dựng

Giữ bộ chọn mẫu Home và chat hiện hành. Khi giao việc mới, chốt template.json/SKILL.md vào candidate/job có hash; inbox và API dùng bản này thay vì tự lấy quy tắc thư viện vừa thay đổi. Không thêm màn mẫu hoặc engine riêng. Việc cũ chưa có snapshot vẫn giữ cơ chế tương thích, không tự viết lại lịch sử.

58service tests và HTTP dựng mới→inbox kiểm bản chốt đạt; selector browser1280/1920 hồi quy đạt. Chưa có hiển thị so sánh phiên bản mẫu trên UI, snapshot toàn bộ asset/phụ thuộc hoặc skill engine đầy đủ. Đây là nền cho thư viện skill có phiên bản; catalog phong cách/prompt AIEV vẫn là dữ liệu tham khảo.

## 41. Xem mẫu đã chốt trong công việc AI

Home hộp chờ/lỗi và editor → Nhờ AI sửa → Xem công việc AI của dự án dùng cùng chi tiết Mẫu đã chốt. Mở để thấy tên, ID, thời điểm; mở tiếp Thông tin kiểm tra phiên bản để thấy hash JSON/quy tắc. Đây là thông tin của việc, không tự chuyển mẫu hay chạy lại. Không thêm sidebar; việc cũ không có snapshot không gắn nhãn chốt giả.

Đã kiểm nút lịch sử thật ở Space/Studio tại1280/1920 với snapshot từ HTTP sửa video và inbox thật, zero page errors. Component Home chưa kiểm browser đường vào hộp chờ. Không coi thông tin hash là chứng minh chất lượng dựng hoặc snapshot toàn bộ font/media/skill ngoài.

## 42. Dựng phiên bản theo dữ liệu CSV

Home → Bản mới → Tạo nhiều bản → Nhập bảng CSV để thay chữ theo từng bản. Chuẩn bị chữ trong dự án gốc như {{product}}, {{cta}} tại trường title/label/sub; Lưu trước khi mở lô. Dán CSV có title,format,product,cta → Đọc bảng CSV → xem số bản/biến, kiểm tên/tỷ lệ → Tạo lô. Mỗi đầu ra là dự án VEK riêng, mở kiểm chữ/bố cục rồi xuất lô theo luồng sẵn có. Không tự đăng.

Thiếu biến, cột trùng/sai, sai tỷ lệ hoặc biến không dùng phải báo trước khi enqueue. Sửa bảng phải Đọc lại. Không áp thay thế vào HTML, phụ đề, voice hoặc nguồn; tránh làm người dùng tưởng lời đọc đã đổi theo chữ. Cần kiểm overflow/giá/nội dung từng bản. Lịch sử giữ dữ liệu từng dòng trong task; đóng/reload dùng cơ chế lô hiện có.

Service60tests đạt; actual UI1920 tạo2bản chữ khác nhau/source giữ nguyên/dedup/reload đạt; dialog baseline1280 cũng đạt, CSV flow1280 chưa kiểm riêng. Chưa có upload file CSV, nhiều dự án nguồn, media/voice theo dòng, tự tái bố trí hoặc benchmark sản xuất.

## 43. Nhập file CSV và xem trước dữ liệu lô

Trong cùng phần CSV của hộp phiên bản, Chọn file CSV UTF-8 đọc file local, kiểm kích thước/mã hóa/cột rồi điền bảng. Người dùng cũng có thể dán như trước. Bảng xem trước hiện tên/tỷ lệ và giá trị từng biến theo dòng, cuộn khi dài; đổi nội dung bỏ preview cũ. File gốc không đưa lên server; task giữ các giá trị đã đọc.

Đã kiểm actual browser1920 chọn file qua File API, bảng giá trị, tạo2dự án và click xuất final lô: MP4 thật1080×1920/1920×1080,1giây, tải về và sidecar đạt, harness exit0. Không suy ra chữ render đúng mọi font/bố cục từ FFprobe; chưa kiểm overflow/OCR, footage thật hoặc50–100video/ngày.60service tests đạt. Các giới hạn khác ở mục42 giữ nguyên; mục này bổ sung khả năng nhập file thay giới hạn cũ chỉ dán.

## 44. Kiểm nội dung bản xuất khi khôi phục và tải

Giữ nút tải/lịch sử lô hiện có. Bản xuất mới có SHA256 và số byte sau bước kiểm video; khôi phục chỉ nhận kết quả khớp nội dung. File bị thay hoặc thiếu fingerprint thì endpoint tải báo409; file gốc không xóa. Lô gián đoạn không được tự coi file đó đã hoàn tất; Tiếp tục vẫn là hành động rõ ràng của người dùng. Lô đã thành công chưa tự đổi nhãn khi file về sau hỏng, nhưng tải sẽ bị chặn.

61service tests, HTTP same-size replacement và actual2MP4 final batch/download regression đạt. Bản cũ không có fingerprint cần kiểm/xuất lại, không tự gắn mã mới để tuyên bố tin cậy. Chưa có kiểm sửa sidecar độc lập, fresh probe/decode lúc phục hồi, storage bất biến hay xác minh async cho file lớn; không coi đây là bảo đảm chống mọi can thiệp file.

## 45. Tải bản xuất lớn và thay đổi ngữ cảnh

Nút tải vẫn ở lịch sử xuất lô. Server kiểm file bất đồng bộ trước khi trả; tối đa2lượt kiểm cùng lúc, lượt tiếp báo429 cần thử lại. Đóng kết nối yêu cầu dừng kiểm. Nếu workspace/công việc/sidecar đổi trong lúc chờ, báo lỗi thay vì trả file từ ngữ cảnh cũ. Chưa có thanh tiến trình kiểm file riêng; không hứa tải ngay khi file lớn.

62service tests và HTTP32MiB fixture/concurrent ping đạt, dữ liệu thay cùng dung lượng bị409. Chỉ bước kiểm trước tải chuyển async; khôi phục batch vẫn cần chuyển tiếp. Chưa thử thực tế đổi workspace giữa HTTP download hoặc NAS lớn, chưa đóng khoảng trống giữa verify và sendFile.

## 46. Lịch sử source điện thoại theo dự án

Thêm tư liệu → Điện thoại giữ QR/phiên hiện có, thêm Tư liệu điện thoại đã nhận và Làm mới lịch sử nhận. Mở lại vẫn thấy file từ manifest dự án, thời điểm/dung lượng và trạng thái có file/không tìm thấy/đổi dung lượng. Nhãn nói rõ chưa xác minh toàn bộ nội dung. Đổi dự án thu hồi QR cũ; đóng hộp thu hồi phiên nhưng giữ file và lịch sử. Điểm vào Home/setup/Cảnh trám dùng chung module.

Nhận file mới hoặc gửi lại file trùng ở phiên mới làm mới kho dự án; không tự chèn timeline hoặc dựng video. Status/nhận file kiểm workspace, không dùng QR cũ khi workspace dự án đã đổi. Chưa có đồng bộ NAS hoặc điều khiển editor qua điện thoại.

62service tests và PHONE_HISTORY_BROWSER_SMOKE.json1280/1920 actual HTTP/manifest+shared dialog đạt. Browser mở module intake trực tiếp, chưa nghiệm thu toàn bộ nút vào ở từng màn. Chưa thử điện thoại vật lý/WiFi/tường lửa/Internet, resume upload hoặc hash-check file lịch sử; không suy ra remote hoàn chỉnh.

## 47. Kiểm nội dung source điện thoại

Mỗi file còn tồn tại trong lịch sử có Kiểm tra nội dung. Bấm để đọc source local và đối chiếu SHA256 lúc nhận; báo đang kiểm, khớp hoặc lỗi rõ ràng. Không tự chèn file/tạo việc AI; làm mới/mở lại chỉ hiện kiểm tồn tại/dung lượng, không gắn nhãn verified giả. File đổi dù cùng dung lượng sẽ không được coi là duplicate của lần gửi lại; nhận bản mới riêng và giữ file cũ.

62service tests bao gồm actual local upload/tamper/reupload và manual verification; actual browser1280/1920 nút kiểm→HTTP→khớp trênMP4fixture đạt. Chưa thử vật lý LAN, lưu lịch sử kiểm bền vững, timeout disk/immutable storage hoặc đầy đủ remote. Mục này thay giới hạn hash-check ở mục46, không thay các giới hạn remote khác.

## 48. Model API riêng theo lượt dựng/sửa

Home thiết lập → AI thực hiện → API và chat Space/Studio → API có Model API cho lượt này. Để trống dùng mặc định kết nối; điền ID dùng cho việc mới đó, không gọi lưu kết nối hay đổi khóa. CLI và phiên vẫn có quy tắc riêng: CLI được nhập model, phiên đang mở do Codex/Claude quyết định. Home giữ giá trị CLI/API riêng khi đổi chế độ; chat lưu lựa chọn API khi reload.

Model riêng được pin trong execution của job và truyền gateway. Tự chọn model/fallback vẫn chưa có; người dùng cần biết model có hỗ trợ tool/vision đang bật. Lỗi provider không âm thầm đổi model. Nhãn kết nối sửa nội dung cũ nói worker chưa sẵn sàng, mô tả đúng khả năng giới hạn hiện có.

63service tests và gateway HTTP mô phỏng nhận override→dựng/sửa→finalMP4 đạt; browser1280/1920 cả Home/chat payload đúng, không gọi provider. Chưa kiểm provider thương mại hoặc ngân sách theo model, chưa có bằng chứng model override hỗ trợ đủ mọi skill.

## 49. Chọn model từ danh sách ngay khi giao việc

Bên cạnh Model API cho lượt này tại Home và chat có Lấy model từ gateway. Người dùng bấm mới gọi endpoint danh sách của kết nối đã lưu; không tự chạy AI/tính lượt dựng. Danh sách có Dùng mặc định kết nối và ID gateway trả về. Lấy danh sách giữ nguyên model đang nhập; chỉ chọn option mới thay giá trị của lượt đó. Vẫn nhập ID tay được.

Dùng chung component/endpoint, không thêm store key. Trạng thái đang tải/lỗi rõ ràng; đổi mode/đóng UI không nhận kết quả cũ, workspace đổi trong request bị từ chối. Danh sách không chứng minh tool/vision hay khả năng dựng của model, chưa tự chọn theo giá/chất lượng.

63service tests; browser1280/1920 Home và Space/chat với fixture model endpoint, chọn và payload đạt, zero page errors. Chưa nghiệm thu gateway thương mại hoặc tự động model routing. Không đổi quyền model của phiên Codex/Claude đang mở.

## 50. Bộ nhận diện workspace trong Thương hiệu VEK

Studio → Thương hiệu có Nhận diện của workspace. Lưu bộ đang chỉnh làm mặc định lưu font/màu/phụ đề riêng workspace; không ghi lại dự án khác hoặc preset toàn ứng dụng. Áp mặc định vào dự án là thao tác riêng, dùng hoàn tác/chỉnh/lưu của editor VEK, giữ CSS riêng của mẫu. Dự án hiện tại phải Lưu để giữ bản áp. Không thêm màn Brand Studio.

Server kiểm version khi lưu, lỗi stale yêu cầu mở lại công cụ; client kiểm workspace/dự án sau đọc trước áp dụng. Chỉ nhận font/màu/kiểu phụ đề được hỗ trợ, không sao chép CSS/lệnh/provider key vào mặc định. Logo/assets/font riêng và tự kế thừa khi tạo dự án chưa triển khai.

64service tests và WORKSPACE_BRAND_BROWSER_SMOKE.json1280/1920 actual Studio button/save API/apply path đạt. Chưa kiểm Save/undo/pixel brand thành phẩm end-to-end; không coi mặc định workspace đã tự áp vào mọi mẫu hay việc AI.


## 51. Nhận diện workspace theo lượt AI

Setup dựng mới mở rộng ngay bước Áp dụng mẫu edit, trước phần phong cách/prompt; chat chung Space/Studio có cùng checkbox Dùng nhận diện workspace cho lượt AI. Module contentos-job-brand.js dùng chung, không thêm sidebar hoặc bộ cấu hình mới. Nguồn mặc định vẫn là Studio → Thương hiệu; lựa chọn độc lập với bố cục, execution/model và chính sách hoàn tất. Setup mặc định bỏ chọn; chat lưu lựa chọn theo dự án trên trình duyệt.

Khi được chọn, server lấy bản nhận diện theo workspace hiện hành, chuẩn hóa và chốt brandSnapshot có version trong job. Thiếu mặc định trả lỗi trước khi giao việc. Candidate nhận font/màu/kiểu phụ đề đã chọn, giữ CSS và bố cục mẫu; API first-build áp sau mặc định của mẫu, API revise bắt đầu từ candidate. Base revision/project gốc giữ nguyên đến khi kết quả được áp hợp lệ. Inbox phiên/CLI nêu dữ liệu đã chốt và ưu tiên nhận diện này khi dùng mẫu. Đổi mặc định sau đó không đổi job đang chờ/chạy; bỏ chọn giữ luồng cũ.

Kiểm chứng: 65 service tests; CREATIVE_BRIEF_API_SMOKE kiểm HTTP dựng mới/revise, candidate, phiên bản sau khi đổi mặc định và nội dung inbox, không dispatch agent. API_EDITOR_BROWSER_SMOKE kiểm checkbox/payload chat tại 1280/1920; FIRST_BUILD_API_BROWSER_SMOKE kiểm setup/payload. Không dùng provider thật. Chưa nghiệm thu Codex/Claude thật tuân thủ nhận diện, pixel/font trong render, logo/font tùy chỉnh hay migration nhận diện ba app.

API_EDITOR_API_SMOKE cũng đã chạy lại đạt với gateway tổng hợp: xác nhận brandSnapshot trong mọi request, nhận diện được giữ trong project sau dựng mới/revise, và tạo MP4 final thật qua pipeline chung. Đây là bằng chứng truyền dữ liệu và render hoàn tất, chưa phải đánh giá màu/font bằng mắt hay chất lượng AI thật.


## 52. Kiểm giải mã toàn bộ lô ảnh trước khi lưu

A26 (Gateway ảnh) tiếp tục dùng contentos-images.js tại Cảnh trám/Thư viện/Ảnh bìa; không thêm màn/kho/kết nối mới. images.mjs dùng cùng bước decodeImage cho ảnh nhập và ảnh gateway. Mỗi phương án được staging local, probe giới hạn 64 megapixel rồi giải mã FFmpeg có timeout; chỉ sau khi toàn bộ phương án hợp lệ mới ghi ảnh và metadata công khai trong catalog. Metadata kết quả có dimensions thật để thẻ ảnh hiện kích thước. Kiểm chỗ trống trước staging, revalidate workspace sau từng giải mã, xóa staging khi lỗi. Lỗi ảnh gateway giải thích chưa lưu lô và không tự gửi lại.

66 service tests đạt, gồm lô ảnh hợp lệ + PNG chỉ còn header, không có kết quả/staging sót và workspace đổi giữa kiểm. IMAGE_API_SMOKE xác nhận HTTP từ chối lô hỏng, giữ số ảnh cũ và lưu dimensions ảnh hợp lệ, kèm hồi quy reference/intake/attach/cover. IMAGE_REFERENCE_BROWSER_SMOKE kiểm UI tham chiếu tại1280/1920 bằng fixture, không lỗi trang. Runtime5180 đã cập nhật. Chưa nghiệm thu provider thật, chất lượng ảnh hay benchmark lô lớn; metadata/file commit chưa phải giao dịch chống mất điện và timeout giải mã áp từng ảnh. Phạm vi đầy đủ vẫn tiếp tục.


## 53. Hủy tạo ảnh trong công cụ dùng chung

A26: contentos-images.js bổ sung Hủy tạo ảnh ngay cạnh nút tạo; chỉ hiện khi có lượt tạo. AbortController gửi signal qua request; đóng dialog cũng abort. Refresh có phiên bản và kiểm dialog còn gắn vào trang để bỏ phản hồi cũ sau đóng/refresh mới. Trạng thái hủy nêu gateway có thể đã xử lý/tính phí, yêu cầu kiểm kho trước khi tự tạo lại. Không tự retry hoặc tự khẳng định hoàn tiền/xóa ảnh đã commit.

Route POST images hủy khi response đóng trước hoàn tất; images.generate kết hợp signal với timeout gateway180s, kiểm trước/sau context và khi đọc stream, truyền signal vào probe/decode. Giữ cleanup staging và khóa workspace đến khi thao tác service kết thúc. Không có queue hủy bền vững hay API hủy job bên provider; kết quả đã commit trước abort có thể vẫn tồn tại. Đổi workspace được kiểm server theo các mốc validate, chưa tự abort tức thì từ sự kiện workspace UI.

67 service tests đạt, gồm abort trước network, trong gateway wait và trước publish, giải phóng khóa và lượt tạo mới chủ động. IMAGE_CANCEL_API_SMOKE kiểm HTTP thật với gateway local: client abort → gateway connection đóng → không có ảnh/staging. IMAGE_REFERENCE_BROWSER_SMOKE1280/1920 kiểm nút hủy, đóng dialog, signal và dùng lại nút tạo qua fixture; hồi quy IMAGE_API_SMOKE đạt. Lần browser đầu thất bại do default fetch giữ tham chiếu cũ trước interception; wrapper động sửa và chạy lại đạt. Không gọi provider thật, không nghiệm thu hủy tính phí phía provider hoặc giữa native decode dài.


## 54. Hạ nhạc nền theo clip thuyết minh

Trong Âm thanh VEK, ngay sau âm lượng nhạc có checkbox Hạ nhạc khi có thuyết minh và slider Mức nhạc còn lại (0–1, mặc định0.25). Dùng audio.duckNarration/duckLevel trong project.json; chỉnh dùng snapshot/changed và Save như VEK, không thêm màn/mixer riêng. Mặc định tắt, áp dụng cho mọi audio.clips đang bật, volume>0 và thời lượng hợp lệ; không tự coi nguồn A-roll/SFX/B-roll là lời đọc.

music-duck.js gộp khoảng clip theo output timemap rồi chia mỗi lượt nhạc thành phần thường/hạ, giữ media offset và âm lượng nền nhân hệ số. build.mjs dùng chung dữ liệu cho preview và render HyperFrames. Giữ fade đầu/cuối ở phần ngoài của mỗi lượt nhạc. Đây là hạ theo vùng clip, không có nhận diện lời nói/khoảng im lặng, không sidechain, chưa có attack/release mượt tại mép vùng. Giới hạn này cần tiếp tục xử lý trước nghiệm thu chất lượng âm thanh sản xuất, nhất là nhiều clip hoặc loop nhạc chồng fade.

68 service tests đạt: overlap/clamp/loop offsets/off/hidden clip và HTML thực tế theo cắt ghép nguồn. MUSIC_DUCK_RENDER_SMOKE kiểm MP4 draft8s thật, bandpass nhạc880Hz: RMS trước0.04997, trong0.01302, sau0.04998; tỷ lệ0.2606 với setting0.25, có tone thuyết minh440Hz. VOICE_TIMELINE_BROWSER_SMOKE1280/1920 kiểm nút bật/lưu qua HTTP, không lỗi trang. Lượt kiểm đầu lỗi do import đứng trước shebang build.mjs, đã sửa và toàn bộ suite chạy lại đạt. Chưa nghe/đánh giá speech thật, preview playback, undo/reload hoặc render loop/tiếng Việt dài. Runtime5180 đã cập nhật; phạm vi đầy đủ tiếp tục.


## 55. Chuyển mức nhạc mượt quanh clip thuyết minh

Mục Âm thanh mở rộng cạnh checkbox hạ nhạc với Thời gian hạ/nâng nhạc (audio.duckFade,0–2giây; mặc định0 giữ hành vi cũ). Khi >0, music-duck.js tạo lớp nền nhỏ liên tục và lớp nhạc bù cùng offset nguồn; lớp bù fade-out trước vùng lời và fade-in sau vùng lời. Khe ngắn kẹp fade để hai đầu không vượt thời lượng. build.mjs phân bổ4track nhạc cho lượt lặp và lớp bù, giữ fade ngoài của lượt. Tất cả là audio element/fade được HyperFrames hỗ trợ, cùng HTML cho preview và render, không bake nhạc hoặc thay source.

69service tests đạt, gồm lớp nền/lớp bù, offset/fade khe ngắn, toàn vùng có lời và không có lời. MUSIC_DUCK_SMOOTH_RENDER_SMOKE: MP4 draft8s, fade0.4s; nhạc trong lời/tĩnh0.2606, giữa attack0.6373 và release0.6141, chứng minh mức trung gian qua audio đã encode. VOICE_TIMELINE_BROWSER_SMOKE1280/1920 kiểm slider nhập/lưu0.4 qua HTTP, không lỗi trang. Runtime5180 đã cập nhật.

Giới hạn: vẫn theo clip, không speech detection; chưa render-test vùng lời cắt ngang điểm loop/crossfade, khe ngắn, nhiều clip dài, preview phát/seek và nghe thật; CapCut package chưa kiểm tương đương fade hai lớp. Bộ đo tổng hợp không phải đánh giá chất lượng hoặc tốc độ sản xuất. Tiếp tục các phần này trong phạm vi tích hợp đầy đủ.


## 56. Giữ fade âm thanh khi đóng gói CapCut

Nút Bản sửa CapCut vẫn dùng goi-capcut.mjs và các lựa chọn chữ hiện có. Phân tích audio tags và xây filter được chuyển vào editor/lib/capcut-audio.mjs dùng lại trong kiểm thử. Giữ start/duration/source offset/volume, bổ sung fade-in/out và playback-rate, giải mã tên file HTML có dấu/khoảng trắng/&; clamp tổng fade vào thời lượng như HyperFrames. Bộ trộn dùng cùng lớp nhạc từ buildHtml nên giữ hạ/nâng nhạc mượt. Nhạc và audio riêng vẫn trộn chung vào nhac-nen.m4a theo cấu trúc gói VEK cũ, chưa tách track chỉnh độc lập trong CapCut.

FFmpeg9 trên máy đã bỏ -filter_complex_script; đổi sang -/filter_complex đọc cùng file filter, giữ tránh giới hạn độ dài command Windows. Lượt kiểm thật đầu phát hiện lỗi này; sửa rồi 71service tests đạt, gồm file AAC thực tế đo mức nhạc và test fade/rate/offset/tên file. Chạy goi-capcut.mjs trên dự án synthetic8s → exit0, có video/hướng dẫn/audio. CAPCUT_AUDIO_SMOKE đo trực tiếp audio gói: trong lời0.26057, giữa attack0.63732/release0.61415; phù hợp MP4 HyperFrames đã kiểm.

Chưa nhập vào ứng dụng CapCut thật, chưa chạy luồng nút export ở browser, overlay/chữ/SRT/loop package, hủy/xung đột hoặc playback-rate trên media thật. Chưa nghiệm thu tương thích FFmpeg portable khác. Gói vẫn chịu những giới hạn snapshot/concurrency của tool hiện hành; không coi bằng chứng này là hoàn tất gói CapCut hoặc toàn bộ phạm vi.


## 57. Track âm thanh riêng trong gói CapCut

Nút/hộp Bản sửa CapCut giữ nguyên vị trí và hai lựa chọn chữ, bổ sung mô tả tách track. capcutAudioGroups phân nhóm từ HTML đã build: music → nhac-nen.m4a, aclip → thuyet-minh.m4a, sfx → tieng-hieu-ung.m4a, tiếng B-roll → tieng-canh-tram.m4a. Chỉ xuất nhóm có tư liệu; từng file dài bằng video, mốc đặt0. Tiếng nguồn A-roll đã ở video nền nên không xuất trùng. Nhạc giữ duck/fade; file thuyết minh vẫn gộp các clip audio riêng, chưa xuất từng clip chỉnh timing riêng.

Gói có audio-tracks.json (nhóm/file/nhãn/duration/clip timing) và huong-dan.txt nêu từng track. Không tạo editor/kho media mới.72service tests đạt, gồm nhóm/tên riêng/loại nguồn A-roll. CAPCUT_STEMS_SMOKE chạy tool thật trên bản sao synthetic8s: exit0, nhạc/thuyết minh riêng đủ8s; kiểm tần số880/440Hz cho thấy độ lẫn<5%, nhạc duck0.2494. SFX/B-roll mới kiểm grouping, chưa xuất gói thực cho hai nhóm đó. Chưa import CapCut app, kiểm browser modal hoặc chỉnh tay từng track trong app thật; không coi toàn bộ CapCut đã nghiệm thu. Thay đổi mục56: nhạc/voice nay tách file, chứng cứ cũ giữ làm lịch sử.


## 58. Xem quy tắc và khả năng mẫu ngay tại setup

Bước Áp dụng mẫu edit mở rộng dưới thẻ mẫu bằng details Quy tắc và khả năng của mẫu (contentos-template-details.js). Chỉ tải khi mở; hiển thị SKILL.md bằng textContent, SHA256 template/rules, số preset có adapter API, từng preset và yêu cầu matte. Đổi mẫu thay panel cùng tplBox; phản hồi panel đã tháo bỏ không cập nhật trang. Không thêm sidebar/thư viện trùng, không thực thi Markdown hoặc script từ quy tắc.

template-details.mjs đọc file thật trong thư viện với giới hạn2MiB JSON/256KiB rules và containment; danh sách khả năng dùng chung createApiPresets, không tự đoán mọi skill chạy qua API. Đây là trạng thái thư viện hiện tại, job vẫn snapshot lại lúc enqueue; hash giúp nhận biết, không khóa phiên bản xem trước thành phiên bản giao việc. Session/CLI chỉ có hướng dẫn agent đọc, chưa kiểm chất lượng dựng thật.

73service tests đạt: count hỗ trợ/matte/hash thay đổi/no skill/invalid ID/JSON. FIRST_BUILD_API_BROWSER_SMOKE xác nhận mở details từ setup qua endpoint thật ở lần kiểm cuối1920, không lỗi trang; suite cũ vẫn kiểm setup1280/1920 nhưng chưa mở details riêng ở1280. Initial endpoint404 do route đặt sau dispatcher v1 đã sửa vào nhóm v1, rerun đạt. Runtime5180 cập nhật. Chưa xem toàn bộ rule/preset bằng mắt hoặc kiểm accessibility/keyboard/search; không phải thư viện skill thực thi đầy đủ.


## 59. Đọc lời thoại theo vùng trong worker API

Không thêm màn hoặc bộ cấu hình AI. Worker hiện có của Home/Space/Studio mở rộng read_transcript với start/end theo giây nguồn và query tìm chuỗi trong từng mục từ (NFC, không phân biệt hoa thường); lọc giao nhau [start,end), sau đó offset/limit phân trang. Kết quả trả total (đã lọc), totalWords, nextOffset, selection và SHA256 nguồn. Không gộp query xuyên nhiều mục từ, không tìm ngữ nghĩa hoặc kiểm lại ASR/audio.

System/tool description hướng dẫn dùng vùng khi sửa đoạn để giảm dữ liệu lời gửi model. Không tự phân tích thời gian từ yêu cầu hoặc cam kết model luôn chọn đúng vùng; vẫn có đọc không lọc khi cần dựng toàn video. Guards nguồn/workspace/transcript giữ nguyên. Chỉ giảm payload của công cụ đọc transcript; chưa giảm read_project, lịch sử tool cũ hay ảnh gửi lặp. Không công bố mức tiết kiệm token/USD chưa đo thực.

75service tests đạt:2000từ→vùng2giây, offset tập lọc, biên thời gian, NFC tiếng Việt, input lỗi, transcript bị đổi; worker giả lập gọi đúng schema và chỉ nhận từ trong vùng, áp edit thành công. Chưa provider thật hoặc benchmark token/chi phí. Trạng thái HTTP/render theo BUILD_STATUS.

Bổ sung nghiệm thu mục59: API_EDITOR_API_SMOKE actual HTTP/gateway tổng hợp xác nhận selection/end/nextOffset và chỉ1từ gửi model, cùng hồi quy dựng mới/revise/xuất MP4 final đạt. Runtime5180 đã cập nhật sau khi process kiểm kết thúc.


## 60. Đọc riêng nhóm dữ liệu dự án cho worker API

Không thêm điều khiển/adapter mới. read_project có fields chọn nhóm title/format/source/template/brand/camera/transitions/segments/texts/zooms/scenes/brolls/blocks/captions/audio. Bỏ fields giữ đọc toàn bộ như cũ. project-context.mjs trả clone chỉ nhóm được yêu cầu, partial/selectedFields/omittedFields và nhắc set_edit_fields thay toàn bộ nhóm. Mỗi nhóm vẫn đầy đủ, không cắt mảng hoặc nội dung đồ họa được chọn; nhóm không gửi trong thao tác ghi giữ nguyên. Schema/tool/system hướng dẫn đọc nhóm cần sửa trước khi ghi.

Đây là giảm dữ liệu theo nhóm chủ động của model, chưa tự nhận dạng phạm vi yêu cầu, chưa patch từng item, chưa nén lịch sử tool/ảnh hoặc nâng giới hạn project100k. Không gọi đó là đo tiết kiệm token/USD.77service tests đạt, gồm project lớn có CSS50k, đọc title/audio ít dữ liệu hơn, mảng500item không bị cắt, invalid/duplicate fields, clone độc lập, vòng model giả lập chỉ nhận title rồi sửa giữ blocks/text/audio. Trạng thái actual HTTP/render theo BUILD_STATUS.

Bổ sung nghiệm thu mục60: API_EDITOR_API_SMOKE actual HTTP với gateway local xác nhận scopedProjectDelivered, hồi quy transcript/mẫu/brand/revise và MP4 final đạt; bản chạy5180 cập nhật sau khi process hoàn tất.


## 61. Sửa thành phần theo ID trong worker API

Dùng chung worker của Home/Space/Studio, không thêm chat/editor. read_edit_item nhận group (texts/segments/zooms/scenes/brolls) +id, trả item và version SHA256. patch_edit_item nhận cùng group/id/version và changes; merge thuộc tính, giữ ID/thuộc tính khác/sibling, validate qua applyEditorFields hiện có trước khi thay candidate. Không thêm/xóa item, không sửa blocks/HTML/CSS trực tiếp hoặc audio nested; những trường hợp đó dùng adapter hiện có. Version là hash của item trong candidate, không thay bảo vệ revision của project khi apply.

ID thiếu/trùng, version cũ, changes rỗng hoặc thay ID bị từ chối; candidate không đổi khi lỗi. Chỉ giảm nội dung truyền lúc sửa nhỏ; việc validate vẫn xem nhóm đầy đủ. Chưa patch batch hoặc tìm ID theo ngữ nghĩa, chưa kiểm real model tự lựa công cụ, chưa đo token/USD.80service tests đạt gồm bảo toàn sibling/property/audio, dữ liệu lỗi, ID/version, model giả lập và gatewayHTTP local thật read→version→patch. Test cũ đếm tools được cập nhật2tool mới sau lần fail đầu; nội dung kiểm vision/preset giữ nguyên. HTTP route/render regression theo BUILD_STATUS.

Bổ sung mục61: API_EDITOR_API_SMOKE đã hồi quy HTTP dựng mới/revise/MP4 final đạt bằng set_edit_fields cũ. ITEM_PATCH_API_SMOKE.json bổ sung full endpoint /api/ai-revise qua gateway tổng hợp: read_edit_item → version → patch_edit_item, giữ sibling/source/audio, rebuild preview và tự xuất MP4 final 1080×1920 dài 3 giây. Chưa kiểm model thật, gửi từ trình duyệt hoặc nội dung chữ bằng pixel/OCR; bằng chứng này không chứng minh truyền selection từ Studio vào worker.

## 62. Ngữ cảnh thành phần trong chat Studio

Giữ ô Nhờ AI sửa hiện có. Khi người dùng chọn một thành phần rồi giao sửa, hiển thị ngắn gọn đối tượng đang gửi cùng yêu cầu, cho bỏ ngữ cảnh chọn; không mở chat/editor mới. Space và Studio dùng chung hội thoại, lựa chọn AI và chính sách hoàn tất.

UI gửi selection group/id theo selKind hoặc tab, có checkbox gửi/bỏ mục đang chọn. Server dùng resolveEditSelection để phân giải trên candidate, chốt version và chuyển selectedItem vào context worker API. Client item properties không được chuyển tới model. Dạng tab/item cũ vẫn nhận để tương thích phiên/CLI.

Khi triển khai: gửi định danh tối thiểu group/id, server phân giải trên candidate đã chuẩn bị và chốt version; không tin dữ liệu thuộc tính item từ trình duyệt. ID thiếu/trùng, lựa chọn cũ hoặc nhóm chưa hỗ trợ phải được báo rõ. Chỉ công bố patch riêng cho texts/segments/zooms/scenes/brolls; blocks/audio và nhóm khác không suy diễn thành đối tượng được hỗ trợ.

Nghiệm thu từ Studio thật: chọn câu chữ → nhập yêu cầu → kiểm model nhận đúng định danh/phiên bản → sửa riêng câu đó → preview/lưu/xuất. Kiểm sibling, source, audio và revision được giữ; kiểm lỗi selection cũ, chuyển Space/Studio và bố cục 1280×720/1920×1080. Đã triển khai đường UI/server/worker; 81 service tests đạt. ITEM_PATCH_API_SMOKE xác nhận selectedItem đúng ID/version đi qua endpoint tới gateway tổng hợp, sửa và render MP4 final thật. Chưa kiểm gửi từ Studio bằng trình duyệt, bố cục checkbox hai độ phân giải hoặc model thật; các tiêu chí này còn phải nghiệm thu.

Bổ sung nghiệm thu mục62: SELECTED_ITEM_BROWSER_SMOKE.json kiểm đường chọn card Văn bản trong Studio → chat, checkbox gửi/bỏ, payload group/id, chuyển Space và header ở1280×720/1920×1080; không có page exception. Request được chặn trước dispatch, không phải browser→provider→render E2E. ITEM_PATCH_API_SMOKE riêng kiểm invalid/stale selection trước save và endpoint→gateway→MP4 final. Inbox nhận selectedItem từ server; agent thật, pixel chất lượng chữ và các nhóm thành phần khác vẫn cần nghiệm thu.

## 63. Tìm và lọc media trong bộ chọn nguồn dùng chung

Home/thiết lập/editor tiếp tục dùng Thêm tư liệu → NAS / Thư mục chung. Thêm ô tìm tên, loại Tất cả/Video/Ảnh/Âm thanh và nút Tìm trong cùng picker. Tìm NFC không phân biệt hoa thường trong thư mục hiện tại; thư mục con luôn hiện để mở tiếp, phân trang sau lọc. Không trình bày như tìm toàn bộ NAS hoặc nhận dạng nội dung. Phản hồi cũ/host đã đóng không được ghi đè lượt mới.

Nhập file vẫn dùng shared storage/checksum/provenance. Trước khi tái dùng file trùng phải hash bản local hiện có; nếu nội dung bị đổi, giữ file đó và nhập bản đúng mới. NAS attach kiểm workspace qua các bước async.82tests và SOURCE_FILTER_BROWSER_SMOKE kiểm Home→lọc ảnh/audio/video→tạo dự án→setup ở1280/1920 với nguồn local tổng hợp. Chưa kiểm NAS thật, lập chỉ mục đệ quy, tìm metadata/ngữ nghĩa hoặc quyền dùng tư liệu.

## 64. Thông tin nguồn trước khi nhập

Bộ chọn nguồn dùng chung thêm nút Thông tin cạnh từng file; hiển thị tên, loại, thời lượng khi có, kích thước hiển thị sau rotation, codec, sample rate, âm thanh và dung lượng. Không sao chép file khi chỉ xem thông tin. Dùng shared media-metadata.mjs cùng luồng dán nguồn; timeout15s,2probe đồng thời, kiểm workspace/path/stat trước và sau. Phản hồi sau đổi thư mục/đóng picker bị bỏ. Lỗi hiện tại vùng trạng thái và cho thử lại.

84tests kiểm video/PNG/WAV thực tổng hợp, nguồn lỗi/hết hiệu lực và workspace; SOURCE_METADATA_BROWSER_SMOKE kiểm nút từ Home rồi tạo dự án/setup ở1280/1920. Chưa xem trước media, thumbnail/index toàn kho, đọc nội dung hay đo NAS thật.

## 65. Xem trước tư liệu trong picker NAS

Xem trước cạnh Thông tin mở video/ảnh/audio native trong cùng picker, có controls và đóng; không autoplay hoặc sao chép. Đổi thư mục/nguồn và đóng intake phải pause, xóa src/load rồi dọn phần tử. Định dạng browser không hỗ trợ có thông báo dùng Thông tin hoặc nhập dự án. Endpoint chỉ đọc file media thuộc root/workspace cấu hình, no-store/nosniff, HEAD và range để tua; range lỗi trả416. Không dùng general sendFile cũ cho endpoint này.

85tests và SOURCE_PREVIEW_BROWSER_SMOKE kiểm video metadata thực/byte-range/đóng/tiếp tục setup ở1280/1920 bằng nguồn local tổng hợp. Chưa kiểm phát trọn/nghe thật, UI ảnh/audio, seek bằng thao tác người, NAS thật hoặc hủy stream đang mở khi workspace đổi. Không tuyên bố proxy/chuyển mã/index.

## 66. Chọn và nhập nhiều tư liệu vào dự án

Giữ picker NAS dùng chung. Checkbox từng file, số đã chọn và nút Nhập các file đã chọn; tối đa50, giữ lựa chọn khi đổi thư mục/filter/trang. Chỉ nhập lô vào dự án đã có; tạo mới vẫn chọn một video chính rồi thêm tư liệu tại setup. Kết quả hiện theo từng file nhập/trùng/lỗi/chưa rõ; thành công bỏ chọn, phần chưa nhập giữ lại. Chưa tự đưa cảnh lên timeline.

Nhập tuần tự qua endpoint hiện có, pin workspace/dự án cho lượt. Nút Dừng sau file hiện tại không giả hủy copy đang chạy. Đóng intake dừng gửi file tiếp, file đang chạy có thể hoàn tất trong manifest. Mất phản hồi không tự phát lại hoặc tiếp tục các file còn lại. Chưa phải durable batch/reload recovery.86tests và SOURCE_BATCH_BROWSER_SMOKE kiểm chọn xuyên thư mục→nhập thật2file→manifest→clear ở1280/1920 bằng local tổng hợp; lỗi/stop/uncertain được kiểm orchestration riêng, chưa browser/large NAS.

## 67. Tìm media trong thư mục con

Thêm checkbox Tìm cả thư mục con trong form tìm nguồn đã có. Từ khóa tối thiểu2ký tự, tìm tên file NFC không phân biệt hoa thường và lọc loại. Kết quả hiện đường dẫn tương đối đầy đủ, dùng cùng nút xem trước/thông tin/chọn/nhập. Giữ lựa chọn khi thay tìm kiếm. Báo số kết quả, số mục/thư mục đã xem, mục không đọc được và CHƯA QUÉT HẾT nếu chạm giới hạn; không gọi số này là tổng toàn kho.

Quét async tối đa2lượt,5000mục/200thư mục/100kết quả/sâu8; deadline15s giữa các thao tác FS, không bảo đảm ngắt được lời gọi OS bị treo. Endpoint pin workspace/root, abort khi ngắt HTTP; picker hủy recursive request cũ/đóng. Không index bền vững hoặc tìm nội dung.87tests và SOURCE_SEARCH_BROWSER_SMOKE kiểm nested hit→chọn→đổi search→nhập2file thật ở1280/1920 với local fixture; chưa NAS thật hoặc UI partial/cancel.

## 68. Nhãn và quyền dùng tư liệu

Trong picker nguồn hiện có, Nhãn / Quyền dùng mở form inline, không sidebar mới. Nhập tối đa30nhãn/60ký tự, ghi chú4000, căn cứ2000; quyền Chưa xác minh/Tự sở hữu/Được cấp phép/Hạn chế. Lưu theo workspace trên máy, kiểm version chống ghi đè, cảnh báo size/mtime nguồn đổi. Không ghi file NAS, không tự xác minh quyền hoặc chặn xuất/đăng.

File nhập mới giữ snapshot trong source-assets; duplicate giữ snapshot ban đầu, thay catalog không tự sửa lịch sử dự án. Snapshot chỉ là dữ liệu khai báo có phiên bản, chưa chứng minh quyền pháp lý hoặc theo hash nội dung.88tests và SOURCE_ANNOTATIONS_BROWSER_SMOKE kiểm lưu từ setup/picker→nhập2file→tag/rights manifest ở1280/1920. Chưa đồng bộ nhiều máy, tìm theo nhãn, expiry/channel policy hoặc export gate.

## 69. Tìm nguồn theo nhãn và quyền khai báo

Form tìm hiện có bổ sung Nhãn và Quyền dùng; kết hợp tên/loại và phạm vi thư mục con. Nhãn so khớp chuỗi NFC không phân biệt hoa thường. Có nhãn hoặc quyền cụ thể thì tìm đệ quy không bắt nhập tên file. Quyền Chưa xác minh bao gồm chưa khai báo và nguồn đã đổi theo size/mtime; các claim đã cũ không lọt vào Tự sở hữu/Được cấp phép/Hạn chế cho tới khi lưu lại sau kiểm tra. Không coi kết quả lọc là bằng chứng pháp lý hay quyền xuất.

Dùng chung source-annotations, giới hạn recursive scan mục67.88tests cùng SOURCE_ANNOTATION_FILTER_BROWSER_SMOKE kiểm save→lọc current/recursive→clear→multi-import thật ở1280/1920 bằng local fixtures. Chưa index/sync/NAS scale hoặc export enforcement.

## 70. Xem nguồn đã nhập của dự án

Trong picker dùng chung, nút Xem nguồn đã nhập của dự án mở danh sách inline theo đích đã chọn. Không thêm kho/sidebar khác. Đọc source-assets local, không yêu cầu truy cập NAS gốc. Hiện tên/path local, nguồn, SHA256 khi nhập, nhãn/ghi chú/căn cứ/quyền khai báo/version lưu lúc nhập; bản metadata mới của nguồn không tự thay lịch sử. Local state chỉ kiểm tồn tại và dung lượng, ghi rõ chưa hash lại.

Endpoint chặn workspace/project ngoài phạm vi, manifest tối đa4MiB và100entry/trang.88tests kiểm snapshot/missing/changed-size và PROJECT_SOURCES_BROWSER_SMOKE kiểm Home→setup→save→import→history1280/1920. Chưa hợp nhất phone/AI-image/voice manifests, hash check/rights refresh, offline browser hoặc stress pagination.

## 71. Hợp nhất lịch sử tư liệu đã nhập

Cùng mục lịch sử dự án đọc source-assets/phone-assets/voice-assets; gộp theo path, giữ các bản voice/kịch bản trên cùng hàng. Hiện loại nguồn NAS/Chat, Điện thoại, Voice, Ảnh AI/nhập ảnh khi có provenance. New image attach ghi ID/origin/operation; không suy diễn ảnh cũ là generated. Record legacy thiếu bytes báo Có file, thiếu dung lượng đối chiếu. Variant giữ phone-assets như source/voice metadata; không copy session/capability.

89tests và UNIFIED_SOURCES_BROWSER_SMOKE kiểm aggregation/hiển thị1280/1920. Phone/voice trong browser là manifest fixture seed, không phải E2E tạo/upload; image attach provenance chưa HTTP verified ở đợt này. Chưa DB thống nhất/hash recheck/rights enforcement.

## 72. Kiểm tra nội dung tư liệu đã nhập

Trong history hợp nhất, nút Kiểm tra SHA256 chỉ bật khi có hash/dung lượng hợp lệ. Đọc bản local và đối chiếu mã lúc nhập bằng verifier async dùng chung, không tự thay mã khi khác. Kiểm workspace/project/manifest/path trước và sau; HTTP ngắt thì abort. Kết quả khớp kèm thời điểm, lỗi file thay đổi hiển thị tại thẻ; không coi hash là quyền sử dụng hoặc chất lượng. Snapshot manifest giữ nguyên.

90tests và SOURCE_VERIFY_BROWSER_SMOKE kiểm match→thay file cùng dung lượng→mismatch từ nút thật ở1280/1920. Fixture local, chưa NAS/tải lớn; thiếu metadata hoặc file<32bytes không kiểm. Đóng UI chặn kết quả cũ nhưng không chủ động abort fetch nếu mạng còn kết nối. Không phải kiểm trước render/post hoặc DB bất biến.

## 73. Ngữ cảnh nguồn tư liệu cho worker API

Dùng worker Home/Space/Studio đã có; read_media_provenance nhận1–20src khác nhau, đọc snapshot source/phone/voice history. Trả tags/quyền khai báo/version/loại nguồn/voice-kịch bản; notes/evidence chỉ khi includeNotes, mỗi trường tối đa1000ký tự. Không gửi NAS root tuyệt đối hoặc coi metadata là lệnh/quyền đã xác minh. Chặn semantic history thay đổi trong lượt qua guards; không tự reload bản khác.

91tests và EDITOR_PROVENANCE_API_SMOKE kiểm tool delivery qua actual endpoint/gateway tổng hợp→patch→finalMP4. Chưa real-model choice/tiết kiệm token/rights enforcement. Audio recorded có metadata nhưng list_media vẫn chỉ ảnh/video, không công bố thêm audio-edit tool. Guards đọc manifest sync, chưa benchmark history lớn.

## 74. Worker API chèn audio vào timeline VEK

Dùng list_media/inspect_media và audio.clips hiện có; mở rộng danh sách nguồn WAV/MP3/M4A/AAC, không thêm engine/timeline. Worker đọc thời lượng trước sửa clip; id khác nhau, src audio đã inspect, at theo nguồn project, from/dur theo audio, vol0–2, không vượt nguồn. Clip cũ giữ nguyên không bắt đọc lại; model phải giữ nhạc/SFX khi thay nhóm audio. Xem/chỉnh tay trong Âm thanh VEK.

92tests và API_AUDIO_EDITOR_SMOKE kiểm actual endpoint/gateway tổng hợp→insert→finalMP4.880Hz đo trong cửa sổ mong đợi, không phải voice thật hoặc kiểm nghe. Chưa tự chọn voice, lip-sync, clip patch riêng hay chuẩn hóa schema toàn bộ audio. frame sampling vẫn ảnh/video.

## 75. Giao AI sửa riêng clip audio

Âm thanh VEK thêm nút Nhờ AI sửa clip audio này cho từng clip. Mở cùng chat, hiển thị đường dẫn clip, group audio.clips/id; checkbox bỏ ngữ cảnh vẫn áp dụng. Giữ selection khi Space/Studio cùng tab audio, khi đổi công cụ khác dùng selection công cụ đó. Không tạo chat hay editor mới. read_edit_item/patch_edit_item hỗ trợ audio.clips nested, giữ sibling/settings; sửa mới vẫn phải inspect nguồn và kiểm timing/volume/version.

92tests + SELECTED_AUDIO_BROWSER_SMOKE1280/1920 kiểm nút thật→payload/omit/Space; browser request intercepted. Audio patch chỉ kiểm service, chưa full endpoint/render bằng patch; MP4 trước dùng set_edit_fields. Chưa agent/provider thật hoặc chọn clip bằng timeline gesture.

## 76. Chọn audio trên timeline và nghiệm thu patch đến render

Click clip ở lane Thuyết minh chọn audioClipId, mở tab Âm thanh và seek, cập nhật highlight/chat nếu đang mở. Phần tử có role/button/tabindex/aria-pressed và xử lý Enter/Space. Cùng selection với nút AI ở form; không tạo job khi chỉ chọn clip.

API_AUDIO_PATCH_SMOKE kiểm actual endpoint/gateway inspect→read/version→patch at/vol→finalMP4, giữ sibling và nhạc/source; đo tone880Hz đúng cửa sổ.92tests và TIMELINE_AUDIO_BROWSER_SMOKE/KEYBOARD_SMOKE kiểm payload/omit/Space ở1280/1920; Enter là event giả lập trong browser, chưa OS keyboard navigation. Chưa drag/playback/voice/model thật; không coi browser intercepted payload là provider E2E.


## 77. Nhập catalog chọn lọc tại Thư viện hiện có

Home → Phong cách & Prompt → Xem trước dữ liệu nguồn hiển thị từng mục AIEV, loại và trạng thái đã có. Mặc định chọn mục mới; có chọn mục chưa có/bỏ chọn tất cả. Nút nhập chỉ gửi những ID đã chọn, workspace và fingerprint nội dung chuẩn hóa. Server đọc lại nguồn, từ chối nguồn đổi hoặc workspace đổi, nhập cộng thêm và giữ các phiên bản cũ. Sau nhập phải xem trước lại để nhập tiếp. Không tạo sidebar hoặc kho dữ liệu thứ hai.

94tests và CATALOG_IMPORT_BROWSER_SMOKE.json kiểm đường vào thật1280/1920, chỉ nhập một mục, bỏ chọn trùng mặc định,409sai workspace/fingerprint cũ và nguồn chuẩn hóa không đổi. Đây chỉ là migration catalog phong cách/prompt; toàn bộ project/template/media/kênh/lịch sử/settings ba app vẫn cần thực hiện và nghiệm thu.


## 78. Khảo sát dự án trước migration

Không gian làm việc → Nhập dữ liệu từ ứng dụng cũ → Khảo sát dự án nguồn dùng GET migration/preview. Hiện từng nguồn VEK/AIEV/Studio, số dự án, tiêu đề, đường dẫn tương đối, schema, cảnh báo và trạng thái chưa chuyển. Không có nút nhập giả khi adapter còn thiếu. Service chỉ trả trường metadata được chọn, không chạy HTML/skill nguồn.

Cấu hình sources.local.json: vekRoot là thư mục VEK, aievRoot là thư mục AIEV, studioJobsRoot là thư mục chứa job Studio. Studio mặc định là ChungAutoVideoFactory/jobs trong home; không tự tải cấu hình YAML/env app cũ. Scan bị giới hạn và phải hiển thị khi không đầy đủ.

95tests và MIGRATION_PREVIEW_BROWSER_SMOKE.json kiểm Home→Cài đặt→khảo sát1280/1920, nhận2dự án thực VEK/AIEV, Studio thiếu đường dẫn báo riêng, không lỗi trang. Chưa kiểm media phụ thuộc/chuyển schema/sao chép dự án; đó là bước phát triển tiếp theo.


## 79. Sao chép dự án VEK sang workspace ContentOS

Cài đặt → Nhập dữ liệu → Khảo sát: dự án có schema VEK hiện nút Sao chép dự án VEK vào workspace. Khi bấm hiển thị đang nhập, lỗi hoặc link mở bản nhập; không chạy AI, không tự render/đăng. Preview tự nó vẫn chỉ đọc nguồn. Adapter pin metadataHash/workspace/config, sao chép media qua service biến thể chung, giữ format/timeline, đặt workspace mới, ghi migration-origin với checksum từng file. Loại job/log/secrets và dữ liệu phát hành có liên kết workspace cũ.

96tests và MIGRATION_IMPORT_BROWSER_SMOKE.json kiểm thao tác tại1280/1920 với nguồn tổng hợp, build project chỉnh được và render final1080x1920 dài3s. Source không đổi; config nguồn/workspace thử được phục hồi. Chưa có dedup/resume/rollback hoặc benchmark fidelity dự án thật; AIEV/Studio chưa chuyển sang timeline.


## 80. Chuyển các đoạn footage AIEV sang editor chung

Cài đặt → Khảo sát dự án nguồn: adapter kiểm meta.json theo schema AIEV. Dự án cắt cùng một video, khung1080x1920/1920x1080 và không có track/effect chưa ánh xạ mới hiện nút Chuyển timeline AIEV vào workspace. Không thực thi index.html. Nguồn/meta/config/workspace được chốt, video probe trước khi chép, segment giữ mốc giây nguồn và bản nhập có provenance. Track còn thiếu phải báo lý do và chặn, không tự bỏ.

98tests và AIEV_MIGRATION_BROWSER_SMOKE.json kiểm UI1280/1920, hai đoạn .2–1 và1.5–2.5, finalMP4 đúng1.8s, nguồn không đổi. Folder nhập ngắn tránh lỗi ENAMETOOLONG đã gặp khi render Windows. Composition/audio/layer/multi-source/animation và adapter Studio chưa hoàn tất; chưa nghiệm thu fidelity dự án sản xuất.


## 81. Nhập composition native Studio

Cài đặt → Nhập dữ liệu → Khảo sát: job Studio có05_plan/studio/composition/project.json hợp lệ hiện nút Sao chép composition Studio. Nút gửi cả metadataHash job và projectHash; server kiểm lại trong quá trình nhập. Bản mới dùng workspace đích, provenance studio và cùng bộ copy/build/editor VEK. Không sao chép state/worker/publish/tài khoản. Composition UTF8BOM được đọc đúng.

99tests và STUDIO_MIGRATION_BROWSER_SMOKE.json chứng minh import từ giao diện1280/1920, giữ segment/chữ trong project tổng hợp, build và finalMP4 dài3s, nguồn không đổi. Job edit-plan cũ vẫn báo adapter thiếu. Chưa nghiệm thu fidelity mọi hiệu ứng, media nằm ngoài composition root hoặc migration dự án sản xuất.


## 82. Quy tắc model dựng/sửa trong kết nối dùng chung

Trong dialog Kết nối AI qua API có fieldset Chọn model theo tác vụ dựng: bật/tắt, model dựng mới, model sửa video và đọc/lưu quy tắc. Không thêm nơi nhập key. Để trống quy tắc dùng model kết nối; nhập model riêng trong setup/chat ưu tiên hơn quy tắc. Server chốt model/routing source trong job lúc giao; lịch sử sửa và trạng thái chat hiện model đã chọn. Chính sách hoàn tất/Space–Studio độc lập.

100tests và MODEL_ROUTING_API_SMOKE.json kiểm API revise→gateway nhận đúng model→finalMP4 tổng hợp. MODEL_ROUTING_BROWSER_SMOKE.json mở trực tiếp dialog hiện có1280/1920 và lưu/đọc qua API thật, chưa kiểm đường điều hướng tới dialog. Chưa tự kiểm capability, fallback, USD budget, model giá rẻ/tốt nhất, nhiều gateway, news/ảnh/voice/publish hoặc model CLI/session.


## 83. Quy tắc model cho kịch bản tin và nội dung phát hành

Dialog Kết nối LLM dùng chung bổ sung Model soạn kịch bản tin và Model nội dung phát hành. Để trống dùng model kết nối; dùng cùng công tắc quy tắc workspace. News task pin model/routing tại enqueue, giữ nguyên khi policy đổi. Publish request pin khi bắt đầu, trả model/routing trong generation; vẫn là nháp và không tự đăng. Không thêm key hoặc dialog provider riêng.

101tests gồm gateway loopback HTTP xác nhận đúng2model, news giữ model cũ sau đổi policy và không ghi/đăng draft tự động. DRAFT_ROUTING_BROWSER_SMOKE.json kiểm dialog trực tiếp1280/1920 lưu/đọc4trường qua API thật. Chưa kiểm generation browser/provider thật hoặc đường điều hướng vào dialog. Model/reason presentation tại UI tác vụ cần tiếp tục; không capability/chi phí/fallback/voice/image routing.


## 84. Phụ đề AIEV thành lớp chữ chỉnh được

Trong cùng preview nhập AIEV, dự án có phụ đề thường được thông báo sẽ chuyển thành lớp chữ theo typography ContentOS. Thời gian cue AIEV là frame output; adapter đổi thành mốc source của các đoạn footage tăng dần, giữ dur output để cue đi qua điểm cắt không hụt. Tắt captions mặc định trống để tránh nhân đôi chữ. Không đổi định dạng theo cách ngầm bỏ style: style/transform chưa ánh xạ phải chặn.

102tests kiểm resolveTimeline chính xác3cue trước/qua/sau điểm cắt. AIEV_SUBTITLE_MIGRATION_BROWSER_SMOKE.json kiểm nhập Settings1280/1920 và final1.8s; ảnh0.85s đã nhìn thấy cue QUA ĐIỂM CẮT. Không chứng minh fidelity mọi frame/font. Karaoke, source lặp/đảo, cue chồng/dưới0.2s, custom typography và transform còn thiếu.

## 85. Voice-over AIEV vào Âm thanh VEK

- Khi nhập timeline footage AIEV, audio.voice chuyển thành một audio.clips chỉnh được trong công cụ Âm thanh hiện có; neo vào thời gian nguồn của cảnh đầu để phát từ đầu timeline đầu ra. Giữ mức tiếng nguồn đồng nhất (volume hoặc muted), không tự tắt footage chỉ vì có voice.
- Import kiểm đường dẫn nằm trong dự án nguồn, probe loại audio/thời lượng, giới hạn clip bằng thời lượng voice và timeline, rồi dùng chung copy/build/provenance. Preview Cài đặt thông báo voice chuyển thành clip audio; không thêm module voice/import riêng.
-104 kiểm thử đạt. AIEV_VOICE_MIGRATION_BROWSER_SMOKE.json: nhập qua Home → Cài đặt tại1280/1920, sao chép độc lập; final1080×1920 MP41.8s. PCM bandpass880Hz xác nhận âm ở đầu và trước0.5s, hết sau file voice0.6s. Nguồn không đổi, không lỗi trang. Đây là âm tổng hợp, không phải nghiệm thu provider/giọng thật.
- Chưa chuyển music/SFX, mức tiếng khác nhau giữa cảnh, fade hoặc toàn bộ composition AIEV. Bản dựng vẫn dùng engine và dữ liệu VEK chung. Phạm vi127nhóm chưa hoàn tất.

## 86. SFX AIEV theo frame trong Âm thanh VEK

- Cùng luồng Cài đặt → Nhập dữ liệu: mỗi audio.sfx thành một audio.clips chỉnh được, giữ atFrame/fps qua điểm cắt, volume mặc định0.3 hoặc khai báo, mediaStart làm tròn frame như AIEV. Preview nói rõ voice/SFX nhập vào clip audio; không thêm công cụ hay kho riêng.
- Import probe file audio thật, giới hạn duration bởi timeline và phần file còn lại sau mediaStart; thiếu file/sai loại/offset vượt file bị từ chối. Giữ nguyên nguồn. Timeline nguồn lặp/đảo thứ tự, fade và thuộc tính chưa ánh xạ bị từ chối rõ ràng.
-105tests đạt. AIEV_SFX_MIGRATION_BROWSER_SMOKE.json kiểm nhập từ Home/Cài đặt tại1280/1920, voice+SFX+phụ đề chỉnh được, final1080×1920 MP41.8s. Đo PCM880Hz có voice đầu timeline, khoảng im lặng, SFX đúng1.2–1.7s, im lặng sau kết thúc. Chỉ dữ liệu tổng hợp; không chứng nhận âm thanh sản xuất thật.
- Nhạc/loop/ducking theo AIEV, fadeSFX và các track composition chưa ánh xạ vẫn cần tích hợp. Phạm vi127nhóm giữ nguyên và chưa hoàn tất.

## 87. Fade clip audio dùng chung và nhập SFX AIEV

- Âm thanh VEK có Fade vào/Fade ra (giây) cho từng audio.clips; lưu theo project như các chỉnh sửa audio khác. Shared timing kiểm số hữu hạn/không âm và co fade khi tổng dài hơn clip cho thao tác dựng mới. Builder phát data-fade-in/out cho HyperFrames; CapCut mixer đọc cùng tags. API patch clip chấp nhận fade hợp lệ, từ chối giá trị âm/sai kiểu.
- SFX AIEV fade0–10giây chuyển vào cùng trường. Import dùng probe file thật; từ chối fade chồng nhau hoặc fade ra nằm ngoài timeline để tránh đổi envelope AIEV. Không coi giới hạn này là hỗ trợ toàn bộ SFX; các trường hợp đó vẫn cần adapter chính xác hơn.
-106tests đạt, gồm build/timing, API patch và encode stem CapCut đo fade thật. AUDIO_FADE_CONTROLS_BROWSER_SMOKE.json kiểm nhập fade và Save qua UI1280/1920. AIEV_SFX_FADE_MIGRATION_BROWSER_SMOKE.json nhập Settings1280/1920 và finalMP41.8s có PCM chứng minh attack/release ở SFX1.2–1.7s; nguồn không đổi. Chưa nghe/đo preview playback trực tiếp hoặc mở CapCut thật; không khẳng định parity preview từ test render.
- Giữ editor/tool/store chung; không thêm menu. Nhạc AIEV/loop/ducking, fade phức tạp và toàn bộ127nhóm vẫn chưa hoàn tất.

## 88. Nhạc lặp liền mạch và nhập nhạc nền AIEV

- Âm thanh VEK thêm Cách lặp nhạc: Nối mượt VEK hoặc Lặp liền mạch. Kiểu lặp mới có fade đầu/cuối theo timeline, giữ phase nguồn qua từng vòng; dùng cùng music field, builder và HyperFrames/CapCut audio tags. Không tạo kho/công cụ nhạc khác.
- music-loop.js phân đoạn tại biên vòng và điểm đổi envelope, dùng lớp âm cùng phase để giữ min(fade-in,fade-out), kể cả fade chồng nhau. Giới hạn2000vòng. Cấu hình không hợp lệ hoặc bật đồng thời hạ nhạc theo clip hiện báo lỗi; chưa có tích hợp hai chế độ.
- Nhập AIEV music object có file/volume/fade, speech rỗng, giữ mốc kết thúc fade tại frame cuối như nguồn. Probe audio thật/containment và copy độc lập qua importer chung. Có speech hoặc trường chưa ánh xạ thì từ chối rõ, không bỏ mất ducking.
-108tests đạt, gồm envelope/phase nhiều vòng và overlapping fade, actual copy/probe/rejection. MUSIC_LOOP_CONTROLS_BROWSER_SMOKE.json kiểm chọn mode/nhập fade/Save1280/1920. AIEV_MUSIC_MIGRATION_BROWSER_SMOKE.json Settings import1280/1920→finalMP41080×1920/1.8s: nhạc tổng hợp0.6s nghe được đủ3vòng qua đo PCM, fade attack/release đúng, nguồn không đổi/no page errors. Chưa đo continuity waveform chính xác tại mọi điểm nối hoặc playback preview trực tiếp/CapCut UI.
- Chưa chuyển speech ducking AIEV, chưa kết hợp repeat với duckNarration. Tích hợp đầy đủ127nhóm vẫn tiếp tục.

## 89. Nhạc theo vùng lời nói AIEV trong công cụ Âm thanh chung

- Nhập music.speech thành musicSpeech (giây trên đầu ra), mức duckVolume/volume thành musicSpeechLevel; giữ data chỉnh được cùng project. Âm thanh ở kiểu Lặp liền mạch có ô mức nhạc/vùng lời nói và nút Áp dụng; Save vẫn là thao tác riêng. Vùng hiện nhập dạng mảng thời gian, chưa có kéo vùng trực quan trên timeline.
- musicLoopParts áp max của min(ramp-in,ramp-out) qua các vùng, chuyển mượt0.4s quanh biên theo AIEV; kết hợp fade timeline và lặp giữ phase. Khi tích hai envelope là đường cong, phân đoạn tuyến tính thích nghi với ngưỡng sai số gain0.0005, đoạn tối thiểu0.004s và giới hạn10000parts. Không khẳng định sample-identical; tags làm tròn mili giây/âm lượng còn có sai số.
-110tests đạt: vùng chồng/ngắn kết hợp fade, probe/import và actual encode CapCut stem đo mức20% rồi hồi phục; MUSIC_SPEECH_CONTROLS_BROWSER_SMOKE.json kiểm UI Save1280/1920. AIEV_MUSIC_DUCK_MIGRATION_BROWSER_SMOKE.json Settings import1280/1920→finalMP41.8s đo mức20.02% trong vùng lời nói ở vòng nhạc thứ2, hồi phục sau vùng, fade đúng; nguồn không đổi.
- Chưa có repeat+duckNarration theo clip tự động, nền0/duck>0, tỷ lệduck trên10, dạng dữ liệu invalid/region đảo chiều. Các trường hợp chưa hỗ trợ không được bỏ mất âm thầm. Preview playback trực tiếp, mọi seam/sample và CapCut UI/production benchmark còn thiếu. Toàn bộ127nhóm vẫn tiếp tục.

## 90. Lặp nhạc kết hợp hạ nhạc theo clip audio

- Checkbox Hạ nhạc khi có thuyết minh hiện áp dụng được với Lặp liền mạch. Dùng cùng duckWindows đã probe/giới hạn theo timeline; chỉ clip bật/có âm lượng mới tạo vùng. Không phân tích giọng hay khoảng im lặng; SFX nhập vào audio.clips cũng thuộc phạm vi checkbox hiện hành.
- Khi bật, ưu tiên các vùng clip và duckLevel/duckFade; khi tắt, quay lại musicSpeech/musicSpeechLevel đã lưu. Không xóa vùng thủ công hoặc cấu hình AIEV. Repeat dùng ramp đối xứng quanh biên, thời lượng theo duckFade;0 là chuyển tức thời, khác hình dạng ramp một phía của kiểu nối VEK cũ.
-112tests đạt: lựa chọn vùng/mức, cạnh tức thời, source anchor qua cut, loại clip hidden/vol0, actual encode CapCut music stem đo mức20%/hồi phục. REPEAT_CLIP_DUCK_RENDER_SMOKE.json: Settings nhập fixture rồi cấu hình auto trên project copy, final1080×1920 MP41.8s đo20.003%/hồi phục, vùng thủ công khác không ghi đè lựa chọn auto. Đây là kiểm tra render với cấu hình file, không phải render từ checkbox UI.
- REPEAT_AUTO_DUCK_CONTROLS_BROWSER_SMOKE.json: checkbox+repeat+Save tại1280/1920 giữ lại vùng thủ công. Chưa có bài test duy nhất đi từ checkbox qua export; playback preview, nhận biết speech/silence/SFX, timeline kéo vùng và benchmark sản xuất chưa hoàn tất. Giữ phạm vi127nhóm.

## 91. Chỉnh vùng lời nói bằng dòng thời gian trong Âm thanh

- Công cụ Âm thanh kiểu repeat dùng contentos-music-regions.js, cùng musicSpeech/project/undo/Save. Mỗi vùng có ô bắt đầu/kết thúc, Áp dụng vùng, Xem vị trí và Xóa vùng; nút Thêm vùng tại playhead tạo khoảng tối đa1giây trong timeline. JSON nằm trong Nhập vùng nâng cao thay vì là thao tác chính.
- Kiểm số hữu hạn/không âm, kết thúc sau bắt đầu và tối đa1000vùng; input trống bị từ chối. So bản ranges lúc mở trước commit, bỏ sự kiện control đã tháo khỏi DOM. Lưu dự án vẫn riêng; không tạo model vùng thứ hai.
-112service tests vẫn đạt; MUSIC_REGION_ROWS_BROWSER_SMOKE.json kiểm thực tế thêm→sửa→Save, từ chối vùng đảo chiều, xóa→Save→reload tại1280/1920, không lỗi trang. Lần đầu harness đọc toast sau Save nên thấy thông báo lưu; sửa thứ tự kiểm và chạy lại đạt. Rerun sau khi đưa JSON vào details cũng đạt.
- Đây là form chỉnh từng vùng có nhảy preview, chưa phải kéo cạnh vùng trên timeline. Chưa kiểm undo/redo riêng, mất draft ô chưa áp dụng khi đổi công cụ, kéo vùng hoặc playback âm thanh trực tiếp. Giữ phạm vi127nhóm đang tiếp tục.

## 92. Âm lượng từng đoạn video và nhập mức tiếng cảnh AIEV

- Inspector Đoạn lời nói của editor VEK có Âm lượng đoạn video0–2, nhân với Âm lượng giọng toàn dự án. Giá trị0 tắt riêng đoạn. Segment.audioVolume đi qua timemap; mergeContiguous chỉ gộp các đoạn có cùng gain để không mất biên mức tiếng. Builder/API patch kiểm gain hữu hạn0–2; tags xuất giữ tích gain tổng×gain đoạn.
- AIEV các cảnh cùng gain tiếp tục giữ gain tổng như cũ. Gain khác nhau dùng audio.voice=1 và audioVolume riêng từng segment, kể cả muted→0. Không tạo voice track hoặc editor thứ hai.
-113tests đạt: map/merge/tags, mute và API invalid gain. AIEV_SEGMENT_AUDIO_BROWSER_SMOKE.json nhập Settings1280/1920→final1080×1920 MP41.8s, âm tổng hợp gain25%/75% đo tỷ lệ xấp xỉ3; nguồn giữ nguyên. SEGMENT_AUDIO_CONTROLS_BROWSER_SMOKE.json chọn clip timeline→inspector chỉnh35%→Save→reload tại1280/1920 đạt, không lỗi trang.
- Test mới lúc đầu gọi builder thiếu projectDir, sửa fixture temp folder rồi full suite đạt. Chưa kiểm preview playback âm thanh trực tiếp, mọi thao tác split/regroup/speed/CapCut UI hoặc dự án sản xuất. Fade20ms mặc định ở điểm cắt vẫn áp dụng; không khẳng định sample-identical AIEV. Toàn bộ127nhóm vẫn chưa hoàn tất.

## 93. Không nhập sai thứ tự cảnh hoặc bỏ mất logo AIEV

- Khảo sát đối chiếu Assemble.tsx: AIEV phát scenes theo thứ tự mảng; VEK keptSegments sắp theo source.in. Adapter trước đây có thể nhận timeline không có subtitles/SFX rồi build sai thứ tự. Giờ từ chối khoảng nguồn lặp/overlap/đảo thứ tự tại cảnh cụ thể trước copy/build, áp dụng cho mọi timeline kể cả footage thuần.
- Watermark AIEV chưa có adapter, giờ từ chối rõ thay vì bỏ mất logo. Dự án được hỗ trợ vẫn đi cùng luồng Settings hiện có; không có nút nhập cho entry chưa chuyển đúng.
- AIEV_MIGRATION_REJECTION_BROWSER_SMOKE.json: Home→Cài đặt→Khảo sát tại1280/1920 hiện cảnh2/đảo thứ tự, không nút import, nguồn nguyên vẹn/no page errors. Tests kiểm cả inventory/import cho reversed/repeated/overlap/watermark, không tạo thư mục đầu ra.
- Đây là sửa lỗi bảo toàn dữ liệu, không phải hỗ trợ timeline đảo/lặp hoặc logo. Các adapter này vẫn thuộc phạm vi tích hợp cần hoàn thiện; không giảm127nhóm hoặc gọi migration đầy đủ.

## 94. Logo góc trong Thương hiệu và nhập watermark AIEV

- Thương hiệu VEK có chọn ảnh logo trong media dự án, bốn góc, chiều cao%khung, lề%chiều rộng, opacity và tạm ẩn. Dùng project.watermark, cùng undo/Save/media; ảnh thêm qua intake hiện có, không tạo Brand Studio mới. Cấu hình logo theo dự án, chưa tự đưa vào preset/mặc định workspace.
- watermark.js dùng chung validation/style theo AIEV: height%khung, margin%width cho cả hai trục, width:auto giữ tỷ lệ, top layer. Builder thêm img có start/duration toàn timeline. Nhập AIEV giữ các trường/default, probe ảnh PNG/JPEG/WebP và copy độc lập bằng importer chung. Thuộc tính lạ/ảnh khác loại/path không an toàn bị từ chối; SVG/GIF chưa hỗ trợ.
-115tests đạt. AIEV_WATERMARK_MIGRATION_BROWSER_SMOKE.json Settings import1280/1920→final1080×1920 MP41.8s kiểm pixel logo đỏ đúng vùng ở0.8s, ảnh copy và metadata nguồn nguyên vẹn. WATERMARK_CONTROLS_BROWSER_SMOKE.json chọn ảnh/đổi góc/cỡ/lề/opacity/Save/reload1280/1920 đạt, không lỗi trang.
- Pixel mẫu chứng minh logo có trong frame được kiểm, không phải toàn bộ thời gian/mọi layer/aspect ratio. CapCut package, preset brand/workspace, AI patch watermark và mọi khung hình chưa nghiệm thu. Timeline đảo/lặp và toàn bộ127nhóm vẫn còn phạm vi tiếp tục. Spec94 thay blanket watermark rejection chỉ cho các trường hỗ trợ.

## 95. AI API sửa logo góc trong cùng chat dựng

- read_project hỗ trợ nhóm watermark; set_edit_fields cho phép cấu hình logo đã chuẩn hóa hoặc null để bỏ logo. Dùng chung watermark validator với UI/build/import, giữ các nhóm không gửi. Worker prompt hướng dẫn đọc logo trước và giữ các thuộc tính không cần đổi.
- Đổi ảnh logo yêu cầu inspect_media xác nhận ảnh trong dự án; sửa vị trí/cỡ/opacity ảnh đang dùng không cần đọc lại toàn bộ tư liệu. Không thêm URL/file ngoài dự án. Chưa có patch theo ID riêng cho watermark; đây là trường cấu hình dùng chung.
-116tests đạt: đọc/chỉnh/xóa, bắt inspect cho ảnh mới, từ chối path/fields/gain sai và bảo toàn sibling. API_WATERMARK_RENDER_SMOKE.json dùng endpoint /api/ai-revise thật/gateway local tổng hợp: đọc riêng watermark, sửa top-left→bottom-right, candidate→auto-export final3s. Pixel0.8s góc mới[252,0,0], góc cũ không còn màu logo; source/sibling giữ nguyên.
- Lần chạy đầu helper FFmpeg dùng mốc .8 bị từ chối; sửa0.8 và chạy lại toàn bộ smoke đạt. Không dùng provider trả phí hoặc đăng bài. Chưa kiểm gửi yêu cầu từ chat trình duyệt/model thật, toàn bộ frame hoặc trường hợp đổi file logo mới qua endpoint; phạm vi127nhóm chưa hoàn tất.


## 96. Logo chỉnh được trong gói CapCut

- Giữ nút Bản sửa CapCut VEK hiện có. Khi project có watermark hiển thị, gói gồm ảnh gốc tại 6-logo/logo.<ext>, vi-tri-logo.json và hướng dẫn chèn ảnh trên cùng, toàn thời lượng; không thêm màn hoặc cấu hình logo riêng.
- Video nền và composition đồ họa đều bỏ watermark trước build, tránh logo bị đóng cứng/lặp. Manifest giữ khung, kích thước ảnh gốc, tọa độ góc trái trên, kích thước hiển thị theo tỷ lệ, opacity và thời lượng. Logo ẩn không được đóng gói; đường dẫn/probe/containment kiểm trước sao chép.
-118tests đạt. CAPCUT_WATERMARK_RENDER_SMOKE.json ghi gói thật từ fixture1s, MP4 nền không có màu logo ở điểm kiểm, ảnh logo sao chép nguyên byte, tọa độ đúng và project nguồn không đổi. Kiểm thử geometry có cả9:16/16:9. Lần đầu smoke phát hiện chèn nhầm xử lý vào captionLines; đã chuyển vào main rồi chạy lại đạt.
- Fixture xuất thực chưa có lớp đồ họa; nhánh bỏ watermark ở overlay đã nối nhưng chưa có bằng chứng render alpha. Chưa kiểm nhập trong ứng dụng CapCut, mọi frame/format hoặc dự án thật. Gói là tài nguyên kèm hướng dẫn, chưa phải timeline CapCut tự nhập. CapCut chưa có render snapshot/lock như pipeline final; không chạy đồng thời với render khác. Toàn bộ127nhóm vẫn chưa hoàn tất.


## 97. Logo trong nhận diện workspace dùng chung

- Mở rộng hai nút Lưu bộ đang chỉnh làm mặc định / Áp mặc định vào dự án tại Thương hiệu VEK. Logo góc và bố trí được lưu cùng phiên bản font/màu/phụ đề. Ảnh PNG/JPEG/WebP tối đa2MB, probe thật và kiểm đường dẫn trước lưu; dữ liệu ảnh theo SHA256 ngoài dự án, không dùng đường dẫn dự án nguồn như thư viện dùng chung.
- Áp mặc định sao chép ảnh độc lập vào inputs/brand-<sha>.<ext>, trả watermark để UI đưa vào cùng undo/Save; chưa tự ghi project. Kiểm workspace/version/project/revision. Nếu mặc định không có logo thì giữ logo hiện tại. Lưu lại mặc định không chọn logo loại bỏ logo của mặc định mới; các phiên bản job cũ vẫn tham chiếu ảnh cũ.
- Job opt-in nhận diện pin cả metadata logo và bản phiên bản; applyJobBrand materialize ảnh tại dự án thực trước candidate first-build/revise. Giữ CSS mẫu, các nhóm khác và source; inbox hướng dẫn giữ candidate.watermark. Không tự áp brand khi chưa opt-in, không mở rộng preset VEK toàn cục hoặc tự đồng bộ NAS.
-120tests đạt gồm copy nguyên byte sau khi source bị xóa, snapshot cũ không đổi khi mặc định đổi, reuse/tamper/ảnh lỗi/kích thước quá lớn/escape. BRAND_LOGO_API_SMOKE.json dùng server5196/API thật, hai dự án synthetic: lưu→xóa ảnh nguồn→áp sang dự án khác, chưa ghi project; version/revision cũ bị409.
- Chưa kiểm nút trình duyệt→Save/reload, job endpoint/render logo nhận diện, đổi/hủy workspace trong tác vụ hoặc cấu hình6máy. Chưa dọn ảnh không còn dùng hay index asset/provenance chung; ảnh mới theo hash có thể nằm trong inputs dù người dùng chưa Save. Full127nhóm vẫn chưa hoàn tất.


Bổ sung nghiệm thu mục97: BRAND_LOGO_BROWSER_SMOKE.json bấm công cụ Thương hiệu thực tại1280×720/1920×1080, lưu mặc định→xóa ảnh nguồn→áp dự án khác→Save→reload giữ đúng ảnh, không lỗi trang. Harness lần đầu bấm tab trước khi editor khởi tạo; đã đổi sang chờ tab thật rồi chạy lại đạt. BRAND_LOGO_JOB_RENDER_SMOKE.json qua endpoint revise thật/gateway tổng hợp: pin brand logo sau khi xóa ảnh nguồn, worker đọc logo→đổi góc→candidate→auto-export MP43s, pixel0.8s vùng mới[252,0,0], vùng cũ không còn logo; các nhóm khác nguyên vẹn. Bằng chứng job này là revise, chưa kiểm first-build qua endpoint, model thật hay toàn bộ frame. Không mở rộng kết luận thành nghiệm thu toàn bộ127nhóm.


## 98. Fade tiếng gốc từng cảnh và chuyển từ AIEV

- Chọn clip video tại timeline VEK → inspector có Fade vào tiếng đoạn / Fade ra tiếng đoạn, giây theo bản dựng, cùng undo/Save. Segment lưu audioFadeIn/audioFadeOut; thiếu trường giữ chống click20ms cũ, giá trị0 tắt fade. Không thêm audio editor hoặc track mới.
- Timemap giữ fade riêng, không merge contiguous khi segment có fade khai báo để không mất ranh giới envelope. Builder xuất data-fade-in/out qua cùng HyperFrames. API set_edit_fields kiểm số0–10, tổng fade không vượt độ dài đã tính speed; builder kiểm cùng giới hạn. AIEV fadeInSec/fadeOutSec chuyển trực tiếp khi không chồng nhau; từ chối giá trị sai/chồng thay vì âm thầm bỏ. AIEV có fade ở một phía thì phía còn lại0 theo semantics nguồn. Không khai fade vẫn giữ mặc định VEK20ms.
-121tests đạt. AIEV_SEGMENT_FADE_BROWSER_SMOKE.json nhập từ Settings1280/1920→finalMP41.8s: đo tone880Hz attack khoảng15.70% và release25.12% so với vùng đủ mức; source không đổi, không lỗi trang. SEGMENT_FADE_CONTROLS_BROWSER_SMOKE.json chọn clip inspector chỉnh0.3/0.4s→Save→reload1280/1920 đạt.
- Chưa hỗ trợ envelope chồng nhau kiểu min của AIEV, playback nghe trực tiếp, mọi thao tác split/speed, API endpoint fade→render hoặc nhập CapCut thực. Không khẳng định sample-identical do fade/timing/codec/loudness pipeline khác;127nhóm vẫn chưa hoàn tất.


## 99. Tốc độ từng cảnh AIEV vào timeline VEK

- Tái sử dụng segment.speed và timemap VEK, không thêm engine/editor. Nhập Settings thông báo giữ tốc độ cảnh khi dự án có speed khác1. Converter nhận số0.25–4, tính thời lượng nguồn/to suy từ durationInFrames theo speed; mốc phụ đề và SFX tuyệt đối đổi qua từng cửa sổ output→source có nhân rate. Voice liên tục giữ duration theo output; fade cảnh kiểm theo độ dài sau speed.
- Đối chiếu AIEV duration.ts: nguồn được làm tròn hai đầu frame, output làm tròn sau chia tốc độ; VEK dùng giây liên tục. Hiện chỉ nhận cảnh speed khác1 có đầu/cuối/thời lượng output đúng frame và durationInFrames khớp chính xác; trường hợp làm tròn khác bị từ chối rõ, chưa hỗ trợ đầy đủ timeline fractional-frame. Cảnh speed1 giữ tương thích converter cũ. Không hỗ trợ lặp/đảo nguồn, nhiều video hoặc transition overlap.
-123tests đạt; unit xác minh speed2/.5, phụ đề/SFX tại0.5/1.5s, voice3s, suyto và invalid/rounding/fade. Regression cũ từ chối mọi speed2 được đổi thành speed0 không hợp lệ, các phần từ chối khác giữ nguyên. AIEV_SPEED_BROWSER_SMOKE.json nhập Settings1280/1920→MP43s thực có2cảnh speed2/.5; timing phụ đề0.2/0.7/1.5s, fade PCM thấp đúng vùng, nguồn giữ nguyên/no page errors.
- Chưa có bằng chứng nội dung hình đổi tốc độ theo từng frame/preview nghe, SFX/voice trong MP4 speed vì fixture chỉ có tiếng gốc; unit timing không thay chứng minh audio render. Các trường hợp fractional-frame/full migration và toàn127nhóm tiếp tục phát triển.


## 100. Cách đặt footage vào khung theo từng clip

- Inspector clip video VEK thêm Đặt video vào khung: Lấp đầy/cắt mép (cover) hoặc Hiện toàn bộ/có viền (contain). Giữ tỷ lệ source. Segment chưa khai fit tiếp tục CSS bố cục VEK cũ; chọn cover/contain rõ ràng dùng object-position giữa khung và nền#101113 theo AIEV. Không thêm tab/editor riêng.
- AIEV scene.fit chuyển sang segment.fit, validator từ chối kiểu ngoài cover/contain. Timemap giữ fit và chỉ merge contiguous khi fit giống hệt, tránh mất điểm đổi bố cục hoặc nhập nhằng default với explicit center. Builder đặt fit trên từng video chính, API cùng validator; undo/Save theo VEK.
-124tests đạt. AIEV_FIT_BROWSER_SMOKE.json Settings import1280/1920→MP42s từ source ngang: cảnh contain pixel góc tối/cảnh giữa xanh, cảnh cover pixel góc xanh, source không đổi/no page errors. SEGMENT_FIT_CONTROLS_BROWSER_SMOKE.json chọn clip→contain→Save/reload1280/1920 đạt.
- Chưa kiểm giữ đủ chi tiết mép ảnh bằng fixture có marker, dạng đích16:9, matte/làm đẹp/freeze/dissolve hoặc camera zoom/offset; các lớp hiệu ứng đó vẫn dùng geometry cũ. Không tuyên bố mọi composition AIEV giữ pixel. API endpoint/preview playback/full127nhóm tiếp tục nghiệm thu.


## 101. Cắt vùng nguồn theo từng clip và nhập crop AIEV

- Inspector clip hiện có thêm bốn cạnh Trên/Phải/Dưới/Trái theo%nguồn0–45, giữ cùng undo/Save. Dữ liệu segment.crop dùng fraction0–.45; shared validator áp dụng converter AIEV, API và builder. Timemap giữ crop, không merge clip có crop khác. Không tạo màn editor mới.
- Đối chiếu AIEV layerGeometry/SceneClip: crop phải áp trước fit. Thử object-view-box trong HyperFrames đã thất bại thực tế (dải đỏ vẫn hiện); đã thay bằng geometry từ kích thước nguồn và vùng giữ lại: scale contain/cover, dịch vị trí ảnh gốc, clip-path bỏ mép và wrapper nền#101113. Không phụ thuộc object-view-box khi render; helper CSS tham chiếu vẫn có nhưng builder dùng croppedMediaStyle.
-126tests đạt. AIEV_CROP_BROWSER_SMOKE.json Settings import1280/1920→MP42s nguồn ngang có dải đỏ40%trái: pixel trước đỏ, sau crop trái.4 xanh; nguồn nguyên vẹn, không lỗi trang. SEGMENT_CROP_CONTROLS_BROWSER_SMOKE.json nhập20%trái trên inspector→Save/reload1280/1920 đạt.
- Chưa kiểm đầy đủ mọi cạnh/cover/16:9đích, camera/zoom/matte/beauty/freeze/dissolve hoặc render CapCut. Những hiệu ứng này còn geometry kế thừa; chưa khẳng định mọi layer giữ crop. Chưa có kéo khung crop trực quan, chỉ input số trong inspector. Full127nhóm vẫn tiếp tục.


## 102. Biến đổi khung nguồn từng clip

- Inspector clip VEK bổ sung dịch ngang/dọc(-1..1theo cạnh khung), scale.1–5, xoay±180độ và lật ngang/dọc. Lưu segment.transform cùng undo/Save, dùng shared source-transform.js cho importer AIEV, API và builder; unknown/invalid fields từ chối. Không thêm editor/menu mới.
- Đối chiếu AIEV sceneTransformCss: translate%→rotate→signed scale, transform-origin tâm, outer clip giữ trong frame. Timemap không merge khác transform. Builder có timed source-frame wrapper cho crop/transform, crop-fit nằm phía trong trước biến đổi toàn khung; clip chưa có transform giữ cách vẽ cũ.
-127tests đạt (số test, không đồng nghĩa127nhóm tính năng đã xong). AIEV_TRANSFORM_BROWSER_SMOKE.json Settings import1280/1920→MP42s có flipH: pixel dải đỏ trái trước lật chuyển xanh sau lật; nguồn nguyên vẹn/no page errors. SEGMENT_TRANSFORM_CONTROLS_BROWSER_SMOKE.json nút Lật ngang→Save/reload1280/1920 đạt. Chạy lại crop regression vì đổi wrapper dùng chung.
- Chưa render đầy đủ translate/scale/rotate/flipV/crop+transform/mọi aspect hoặc tương thích matte/beauty/freeze/dissolve/camera effects. Chưa kéo khung trực quan/animation keyframe riêng cảnh; các phần này vẫn trong phạm vi phát triển. Full127nhóm chưa hoàn tất.


## 103. Màu riêng từng cảnh và chuyển AIEV

- Inspector clip VEK thêm màu riêng đoạn: brightness/contrast/saturation/temperature/tint/hue/blur/vignette và14preset cùng ID AIEV. Dữ liệu segment.color, cùng undo/Save; không tạo màn màu khác. Dùng shared source-color.js cho UI catalog, importer, API validator và builder. Unknown/preset lạ/giá trị sai từ chối; không âm thầm bỏ.
- Đối chiếu AIEV color.ts/ColorBox: preset CSS xấp xỉ trước chỉnh tay, SVG matrix sRGB cho temperature/tint, vignette riêng sau filter; wrapper đặt bên trong transform. Màu chung camera VEK vẫn áp ở ngoài. Timemap không merge màu khác; không khai màu giữ legacy path. Preset xấp xỉ CSS theo timeline AIEV, không phải grade FFmpeg gốc1:1.
-128tests đạt. AIEV_COLOR_BROWSER_SMOKE.json Settings import1280/1920→MP42s: pixel dải đỏ chuyển thành xám khi saturation=-1, nguồn giữ nguyên/no page errors. SEGMENT_COLOR_CONTROLS_BROWSER_SMOKE.json chỉnh bão hòa-1→Save/reload1280/1920 đạt. Lần đầu UI thiếu static route /lib/source-color.js khiến module404; đã thêm vào allowlist server và chạy lại đạt.
- Render evidence mới là saturation, chưa đủ mọi thông số/preset/SVG matrix/vignette/crop+transform hoặc matte/beauty/freeze/dissolve. UI chỉ input số/preset, chưa grade scopes/keyframe. Full127nhóm chưa hoàn tất.


## 104. Zoom keyframe riêng từng cảnh và chuyển AIEV

- Inspector clip hiện có thêm Zoom chuyển động: thêm/bỏ chuyển động,2–200mốc, sửa giây/scale/ease linear-out-inOut, thêm/xóa mốc và tâm zoom hai%0–100. Mốc lưu segment.motionZoom theo giây output từ đầu cảnh; không nhân speed. Scale>0đến10, thời gian không trùng/không âm; cùng undo/Save.
- Import AIEV scene.zoom chuyển frame/fps sang time, mặc định origin50%38%. Timemap giữ motionZoom và không merge clip có keyframe. Builder bọc media bằng div scale bên trong màu/transform, GSAP paused timeline áp đúng thứ tự key và cubic easing (power2), giữ đầu/cuối ngoài khoảng mốc. Không animate width/height video, không thay luồng zoom toàn video của VEK.
-129tests đạt. AIEV_ZOOM_BROWSER_SMOKE.json Settings1280/1920→MP42s: pixel marker trước đỏ, sau zoom2x xanh xác nhận zoom xuất thật; nguồn không đổi. SEGMENT_ZOOM_CONTROLS_BROWSER_SMOKE.json thêm chuyển động→đổi mốc2 thành1.5→Save/reload1280/1920 đạt/no page errors. Lần đầu UI chưa rebuild inspector sau thêm; đã changed({inspector:true}) và rerun đạt.
- Chưa kiểm nội suy từng easing/frame bằng MP4, origin tùy ý/speed-render/clip boundaries/crop-color-transform tổng hợp hoặc matte/beauty/freeze/dissolve/CapCut. Chỉ điều khiển mốc dạng form, chưa timeline keyframe kéo thả; origin hiện được ghi cùng nút Áp mốc. Không khẳng định mọi composition AIEV đã chuyển đầy đủ;127nhóm còn phạm vi tiếp tục.


## 105. Nhiều video nguồn trong dự án AIEV

- AIEV scenes khác srcVideo chuyển sang source.timeline=segments. Segment giữ src/mediaStart/mediaInfo; in/out là timeline nguồn ảo nối các khoảng gốc theo thứ tự mảng, speed vẫn quy đổi output. Phụ đề/SFX/voice dùng cùng timemap ảo. Một nguồn tiếp tục định dạng cũ và hạn chế đảo/lặp cũ.
- Importer probe từng nguồn độc lập/cached, kiểm khoảng cắt, giữ kích thước/thời lượng/hasAudio từng clip; shared copier giữ file/provenance. Builder video/audio đọc src và mediaStart riêng, crop dùng mediaInfo; clip không audio bỏ tiếng. Timemap giữ các trường, không merge nguồn riêng. API bảo toàn nguồn/metadata đã probe và kiểm thời lượng; không hỗ trợ đổi nguồn bằng key tùy ý.
- Inspector hiện nguồn/điểm bắt đầu và input Bắt đầu trong file nguồn; tách clip cộng offset mediaStart cho phần sau, không merge nguồn riêng. Những mốc in/out là timeline chung, không giây file. Save/build từ chối khoảng vượt file. Chưa nghiệm thu split trong browser.
-130tests đạt. AIEV_MULTISOURCE_BROWSER_SMOKE.json Settings import1280/1920→MP42s xanh→đỏ xác nhận source riêng. Đo tone880/440Hz để phân biệt tiếng từng đoạn. Source nguyên vẹn/no page errors. Unit kiểm virtual anchors phụ đề/SFX/speed/metadata/API bounds.
- Chưa hoàn thiện transcript nhận giọng/thumbnail/waveform/khảo sát/clean voice đang giả định video chính; không gọi chúng là đa nguồn. Renderer chặn matte/lọc giọng/freeze/dissolve với timeline đa nguồn để tránh dựng sai; các adapter còn thuộc phạm vi tiếp tục. Chưa nhập video bằng tay vào track mới, chưa nhiều nguồn với transitions overlap hoặc mọi tỷ lệ/format/ảnh. Full127nhóm chưa hoàn tất.

## 106. Cắt mép clip nhiều nguồn trong editor VEK · 04/11/2026

Tích hợp ngay track Video và inspector Đoạn cắt đang có, không thêm editor/menu. `editor/lib/segment-trim.js` giữ mediaStart riêng khi cắt đầu, giữ nguồn/metadata độc lập cho đoạn bỏ, chặn kéo qua nguồn kế cận và chặn vượt thời lượng file. Kéo mép đổi từ giây đầu ra sang giây nguồn theo rate. Hai ô Vào/Ra của clip nhiều nguồn dùng cùng helper và nhãn timeline nguồn chung. Hai thao tác tách dùng bản sao sâu và không lặp transition đầu vào. Filmstrip/waveform toàn cục không được hiển thị trên clip nguồn riêng vì chưa có cache theo nguồn; clip một nguồn lấy mẫu đúng tốc độ phát.

Bằng chứng: `tests/segment-trim.test.mjs` kiểm cắt đầu/cuối, clip cuối không có hàng xóm, metadata độc lập, giới hạn nguồn, thời lượng timemap và mediaStart trong HTML video/audio. `npm test`:133/133. Chưa có kiểm chứng kéo chuột/inspector trên trình duyệt hoặc render sau trim. Retiming đường zoom/fade sau cắt/tách, transcript/thumbnail/waveform từng nguồn, API cho clip tách mới và thao tác mở rộng qua vùng đã bỏ vẫn cần hoàn thiện; không coi editor nhiều nguồn đã nghiệm thu.


## 107. Kiểm chứng cắt đầu nhiều nguồn và hợp đồng AI · 04/11/2026

`tests/multisource-trim-browser-smoke.mjs` đi từ Home → Cài đặt → nhập dự án AIEV tổng hợp → mở editor → chọn clip thứ hai → đổi Vào ở inspector → Lưu → tải lại. Hai viewport1280/1920 giữ clip nguồn và phần bỏ đúng; không hiển thị filmstrip của nguồn đầu. Xuất final bằng HyperFrames tạo MP41080×1920 dài1.5s; mẫu pixel xanh/đỏ và năng lượng880/440Hz chứng minh từng nguồn giữ đúng hình/tiếng. Bằng chứng tại MULTISOURCE_TRIM_BROWSER_SMOKE.json; source metadata không đổi, không có page exception. Lần chạy đầu harness mở nhầm URL setup thay editor, đã sửa qua API mở dự án hiện có và chạy lại đạt; không phải lỗi editor.

`applyEditorFields` cho clip ID mới dùng nguồn/metadata đã có trong bản dựng, để AI trả phần tách/cắt; vẫn chặn thay nguồn của ID cũ, metadata giả, vượt file, ID trùng và timeline nhiều nguồn chồng nhau.134tests đạt. Chưa kiểm thao tác kéo chuột, tách bằng phím, phục hồi đoạn bỏ hoặc render tốc độ khác1 trong bài browser mới; kiểm offset không chứng minh mọi thời điểm trong file, zoom/fade sau cắt vẫn cần retiming. Phạm vi127nhóm còn tiếp tục.

## 108. Filmstrip và waveform đúng từng nguồn · 04/11/2026

Track Video/giọng VEK dùng lại bộ vẽ hiện có; không thêm lane hoặc màn hình. Với segments.src, client tải tuần tự từng nguồn riêng qua /api/timeline-source có project/revision header. Service timeline-source-cache chỉ nhận file thuộc timeline, containment bằng realpath, probe duration/audio thật, kiểm file/context trước và sau xử lý. Cache ảnh theo project/file/size/mtime/inode; không dùng mtime đơn lẻ. Trả ảnh data URL để ảnh không bị trỏ sang dự án khác khi server đổi project. Tối đa2nguồn xử lý đồng thời, FFmpeg timeout120s, waveform PCM48MiB, duration≤6giờ, tối đa khoảng400ảnh. Waveform tính lại mỗi lần tải, ảnh JPEG cache đĩa; chưa có retention/cleanup hay resume. Phân biệt nguồn không tiếng bằng hasAudio/peaks rỗng. UI lấy vị trí mediaStart+outputOffset×rate cho cả ảnh và waveform. Lỗi hiện toast có tên nguồn, không thay bằng dữ liệu nguồn đầu.

135tests đạt; timeline-source-cache.test.mjs tạo hai file có cùng mtime và kiểm kết quả riêng, âm thanh, nguồn không tiếng, nguồn ngoài timeline và stale context. MULTISOURCE_TIMELINE_CACHE_BROWSER_SMOKE.json: nhập Settings → mở editor → trim/save/reload1280/1920; giải mã sprite thật qua canvas cho pixel xanh/đỏ đúng từng lane video,2canvas waveform và không page exception. Lần đầu harness sai ngoặc expression, đã sửa và chạy lại đạt. Browser dùng video tổng hợp, không chứng minh độ đúng waveform mọi mẫu, mọi tốc độ, đứt mạng,6giờ hoặc mọi frame. Chưa thêm ASR nguồn riêng, invalidation khi file thay trong phiên đang mở, hủy request từ UI hoặc retiming zoom/fade khi tách. Mục108 cập nhật việc tạm bỏ filmstrip của mục106–107; không coi toàn bộ editor nhiều nguồn hoàn tất.

## 109. Giữ nhịp zoom khi cắt/tách clip · 04/11/2026

Mở rộng motionZoom bằng timeOffset tùy chọn (giây đầu ra, hữu hạn ±86400). Cùng dữ liệu đi qua normalize/build/timemap/API. shiftSegmentZoom giữ các key nguyên bản và tăng offset theo delta nguồn/rate khi tách bằng playhead/transcript hoặc trim đầu; phần bỏ phía cuối mang offset riêng, không chia sẻ object. Trim nhiều nguồn dùng helper cũ, inspector giải thích mốc thuộc chuyển động gốc và hiển thị offset. Legacy trim đầu cũng điều chỉnh offset. Đổi tốc độ sau khi cắt vẫn giữ đơn vị thời gian chuyển động là giây đầu ra; không tự retime mọi key.

Runtime giữ đoạn easing nguyên bản sau mốc cắt: tính scale tại offset rồi giới hạn đường cong của tween trên khoảng còn lại. Không đặt tween âm vào GSAP timeline, không tuyến tính hóa/restart easing giữa chừng. Trước/sau dãy key giữ scale đầu/cuối. source-zoom-retime.test.mjs chạy khối runtime thực trong VM với timeline recorder, đối chiếu nhiều thời điểm cho linear/out/inOut, offset trong và sau key, tốc độ2 và bản sao độc lập.137tests đạt.

MULTISOURCE_ZOOM_TRIM_BROWSER_SMOKE.json: Settings nhập video tổng hợp hai nguồn → inspector trim đầu nguồn có zoom0.5s → Save/reload1280/1920 giữ timeOffset0.5. HyperFrames finalMP41.5s1080×1920: pixel marker phân biệt zoom đã tiếp tục với zoom khởi động lại; âm nguồn880/440Hz đúng và nguồn gốc không đổi. Chưa có render đối chiếu toàn frame cho easing cong, thao tác phím tách, zoom+crop/transform hoặc thay tốc độ sau cắt. Fade audio sau cắt/tách còn cần envelope riêng; không coi tất cả hiệu ứng đã hoàn tất.

## 110. Giữ đường âm lượng khi cắt/tách nguồn · 04/11/2026

Clip có audioEnvelope {duration,offset,fadeIn,fadeOut} lưu đường gain của đoạn gốc theo giây đầu ra. Helper source-audio.js pin envelope trước khi cắt/tách; đầu clip con dời offset theo delta/rate, đoạn bỏ giữ đường gain độc lập. Tách bằng playhead/transcript và trim nhiều nguồn cùng dùng hợp đồng; không merge mất envelope. Inspector hiển thị offset, đổi fade qua slider hoặc input xóa envelope để áp fade mới cho clip hiện tại. Volume chung/đoạn vẫn nhân ngoài envelope.

Builder chia đường gain thành các khoảng tuyến tính; khoảng tăng/giảm từ mức khác0được biểu diễn bằng bed hằng + lớp ramp chênh lệch dùng cùng file/điểm đọc/rate. Không làm tròn đường gain thành các bậc theo frame hoặc reset fade ở điểm tách. API validate envelope; fade không bị so với độ dài clip con khi envelope giữ duration gốc. Layer ramp ở track10+k; khả năng tương tác với các layer khác cần kiểm thêm.

139tests đạt: đối chiếu tổng gain nhiều mốc trong attack/plateau/release, tốc độ2, offset đoạn bỏ, compiled mediaStart và hồi quy. MULTISOURCE_AUDIO_TRIM_BROWSER_SMOKE.json: Settings nhập hai nguồn → inspector cắt0.5s trong fade-in0.8s → Save/reload1280/1920 → HyperFrames MP41.5s; RMS đầu đoạn giữ lại/plateau≈0.696, chứng minh không khởi động fade từ0. Pixel và tone880/440Hz giữ đúng nguồn, metadata gốc không đổi, không page exception. Chưa có nghe đánh giá con người, all-sample continuity tại điểm tách, test tách phím/render release/speed khác1, envelope khi đổi tốc độ, CapCut hay dự án nhiều lớp âm thanh. Legacy trim một nguồn chỉ mới tích hợp offset zoom; pin/envelope khi trim một nguồn còn cần mở rộng. Full127nhóm vẫn chưa hoàn tất.

## 111. Nhận giọng theo từng nguồn vào transcript VEK · 04/11/2026

Nút nhận giọng và tools/transcribe.mjs dùng chung transcribeProject. Dự án source.timeline=segments nhận từng file duy nhất, probe tiếng/thời lượng/bounds thực, bỏ file không tiếng, rồi quy word timestamps từ mediaStart sang timeline nguồn chung. Không chia theo speed ở transcript: timemap VEK đổi sang thời gian đầu ra, tránh nhân tốc độ hai lần. Nguồn lặp/đoạn keep:false vẫn có từ trong transcript để giữ thao tác khôi phục/cắt theo chữ. Mỗi từ giữ source.src/start/end provenance. Không thêm editor/engine phụ đề.

Giới hạn64file/2giờ mỗi file, timeout15phút mỗi lượt nhận nguồn, dùng Whisper hiện có; không tự cài/tải model mới. Kết quả nguồn staging tạm; kiểm snapshot project và identity file trước/sau async và trước publish, rename transcript sau khi tất cả thành công, giữ transcript cũ khi lỗi. Hủy qua AbortSignal ở service; nút hủy và checkpoint/cache bền còn thiếu. autoPrepare không chạy segments.mjs một nguồn trên dự án nhiều nguồn; người dùng dùng nút tạo phụ đề từ lời nói hiện có, không tự ghi đè caption nhập.

141tests đạt; project-transcription.test.mjs kiểm nguồn lặp/silent/speed/word clipping, nhận unique source1lần, nguồn ngoài root, xung đột project và giữ file cũ. PROJECT_TRANSCRIPTION_REAL_SMOKE.json chạy Whisper thật với2file giọng tổng hợp System.Speech tiếng Anh: nhận đúng2câu khác nhau,33từ gồm nguồn lặp đã bỏ, nguồn đầu tốc độ2× và ánh xạ đầu nguồn2đúng. Lần chạy đầu script synth bị execution policy máy chặn; chạy với bypass chỉ cho tiến trình test và đạt. Không thay policy hệ thống. Chưa kiểm nút nhận giọng trong trình duyệt→tạo caption→render, độ chính xác tiếng Việt trên footage người dùng, diarization/cắt từ ở ranh giới, chuẩn hóa timestamp sau đổi mediaStart của dự án có transcript cũ hay hiệu năng batch. Chưa hoàn tất toàn bộ127nhóm.

## 112. Transcript theo mốc nguồn và nghiệm thu nút ASR → caption → MP4 · 04/11/2026

source-transcript.js ghi sourceClock từ các cửa sổ src/in/out/mediaStart, gộp cửa sổ liên tiếp cùng ánh xạ. Thay tốc độ/keep hoặc tách đúng nguồn không làm transcript hết hạn; thay file/điểm đọc/vùng thời gian thì editor không dùng transcript để cắt theo chữ/tạo lại phụ đề, hiện cảnh báo và nút nhận giọng lại. Phụ đề đã lưu giữ nguyên để kiểm tra, không tự xóa. Đây là guard ánh xạ timeline, không phải checksum nội dung nguồn hoặc tự retime caption đã lưu.

Ô ASR hiện có thêm chọn vi/en/auto, POST /api/asr kiểm project/revision và language hợp lệ, UI yêu cầu lưu bản dựng trước khi chạy. Default vẫn vi.142tests đạt, test clock chứng minh split/hidden/speed giữ hợp lệ và mediaStart đổi bị chặn. MULTISOURCE_ASR_CAPTION_BROWSER_SMOKE.json dùng hai câu giọng tổng hợp, nút thật trên editor chạy Whisper22từ, tạo8dòng, Save/reload1280/1920 rồi HyperFrames final16:9≈7.983s. Không thay provider hoặc thêm màn riêng.

Kiểm khung hình0.8s phát hiện lỗi mặc định y1450 của video dọc nằm ngoài video ngang dù render thành công. Đã sửa ensureCaptions/autoPrepare dùng y1450×1080/1920 khi16:9, giữ vị trí người dùng đã lưu; chạy lại toàn bộ browser/render đạt và xem MULTISOURCE_ASR_CAPTION_FRAME.png thấy chữ studio trong khung. Harness ban đầu sai escape, chọn nhầm tab cấp1 và chưa xử lý confirm tạo lại; đã sửa và chạy lại. Bằng chứng frame chỉ chứng minh phụ đề có hiển thị ở mốc đó, không chứng minh chính xác mọi từ/diarization, tiếng Việt, mọi tỷ lệ hay chất lượng footage thật. Phần caption đã lưu sau slip nguồn vẫn cần người dùng kiểm tra, chưa chặn export hoặc đề xuất retime tự động. Full127nhóm chưa hoàn tất.

## 113. Thêm A-roll vào cuối bản dựng VEK · 04/11/2026

Dùng ngay Văn bản → Cắt (nút trong nội dung vì board-head của Cắt bị ẩn) và Cảnh trám → Thêm video vào cuối bản dựng. Không tạo màn nguồn/editor khác. Dialog liệt kê video đã nhận trong tư liệu dự án, chọn theo thứ tự thao tác, Kiểm tra nguồn gọi primary-media-info rồi xem số clip/thời lượng; chỉ Thêm vào bản dựng mới áp vào bộ nhớ, undo được và Lưu vẫn riêng. Chưa có upload/picker lặp trong dialog: dùng intake NAS/Phone/local sẵn có ở Cảnh trám. Nguồn trùng được dùng lại theo lựa chọn.

primary-media.mjs kiểm selected thuộc media, realpath containment và probe thật cho mọi nguồn liên quan (≤64nguồn,≤20lựa chọn). API kiểm project/revision/workspace qua async. primary-clips.js chuyển clip legacy sang src/mediaStart=in trong cùng timeline gốc, giữ nguyên chữ/caption/audio và cửa sổ bỏ; thêm các clip mới sau source.duration/điểm out lớn nhất, speed1, metadata và tiếng riêng. Source timeline=segments, duration cập nhật. Tạm từ chối matte/audio.clean/freeze/dissolve chưa có adapter nhiều nguồn. Không chuyển crop/brand/editor sang định dạng khác. Thêm nguồn làm transcript cũ hết hạn theo sourceClock; không tự xóa caption cũ.

143tests đạt. PRIMARY_CLIPS_BROWSER_SMOKE.json đi từ dự án VEK mới → refresh tư liệu đã có video thêm → Cắt/dialog probe/apply/Save/reload1280/1920 → finalMP46s,2clip so với nguồn3s, không page exception. Bài thử dùng copy cùng fixture, không phải distinct-source pixel/audio proof; chưa xác nhận NAS/Phone thật→append, nhiều lựa chọn/sắp xếp lại/xóa/chèn giữa hoặc model API tự append. Nút Cắt ban đầu đặt ở board-head ẩn, đã chuyển vào nội dung Cắt và chạy lại đạt. Thumbnail nguồn mới chỉ tải sau Save để API nhận nguồn đã lưu, không báo lỗi giả trước Save. Phần đủ tính năng127nhóm vẫn chưa hoàn tất.

## 114. Chat API nối A-roll bằng công cụ chung · 04/11/2026

runApiEditor cung cấp append_primary_clips khi có mediaContext. sources1–20 theo thứ tự, chỉ lấy file có trong catalog local của lượt, probe unique nguồn hiện có và mới theo nhóm≤20/tổng≤64, rồi gọi cùng appendPrimaryClips của UI. Không cho model gửi source/metadata tùy ý qua set_edit_fields, không tự ghi file live, xuất hoặc đăng. Candidate đi qua completion/revision guard sẵn có. System prompt chỉ rõ dùng công cụ khi người dùng yêu cầu nối A-roll; không thêm menu hoặc pipeline chat thứ hai. inspectBrollMedia trả hasAudio thật để video có/không tiếng giữ đúng metadata.

Sau khi công cụ đổi tập nguồn, read_transcript trong cùng lượt báo transcript cũ không thuộc candidate; giữ các chữ/caption/nhạc đã có và yêu cầu nhận lại khi cần.144tests đạt gồm API fixture dùng probe thực hai nguồn, metadata âm thanh, giữ sibling/audio, candidate tách biệt và transcript guard. Hai test cũ đếm số tool đã cập nhật với assertion tên công cụ mới, không bỏ test.

API_PRIMARY_CLIPS_SMOKE.json: endpoint ai-revise thật, synthetic gateway tool-call → append candidate → completion auto-export → HyperFrames final2s. Pixel0.5s xanh/1.5sđỏ, tone880Hz trước/440Hzsau vượt nguồn kia>5×; cấu hình audio cũ giữ nguyên. Không dùng provider tính phí/model thật, không submit qua browser chat trong bài này. Còn thiếu ASR sau append trong cùng lượt, tự chọn cảnh/in-out, chèn giữa/reorder, giao việc NAS thật và ghép nhiều A-roll ở Home. Full127nhóm vẫn tiếp tục.

## 115. Chọn in/out/tốc độ A-roll trước khi nối · 04/11/2026

Cùng dialog thêm video hiển thị từng nguồn đã chọn theo thứ tự, nhập Vào file, Ra file (trống dùng hết), tốc độ0.25–4. Thay lựa chọn/range làm kết quả probe/apply hết hạn bằng generation token; không áp kết quả cũ nếu đổi giữa async. Chỉ Check → Apply → Save mới có hiệu lực, Undo giữ nguyên. Không đổi dialog thành một editor khác.

appendPrimaryClips nhận mục string tương thích cũ hoặc {src,from,to,speed}. Validate số hữu hạn, bounds thực và đoạn≥0.05s ở cả nguồn/đầu ra; unknown fields bị từ chối. MediaStart=from, virtual length=to-from; timemap chia speed. Không thay timing các overlay cũ. append_primary_clips API dùng cùng cấu trúc và probe thực trước khi tạo candidate. Full-file legacy vẫn hoạt động.

145tests đạt. PRIMARY_CLIP_RANGES_BROWSER_SMOKE.json: dialog chọn0.5–1.5s ở2×, Save/reload1280/1920 giữ mediaStart/speed, final3.5s từ3s nền+0.5sđoạn thêm. API_PRIMARY_CLIP_RANGES_SMOKE.json: real revise endpoint/synthetic gateway chọn0.2–0.8s2×, auto-final1.3s, pixel xanh trước/đỏ sau,880Hz/440Hzđúng. Clip màu và tone tĩnh chỉ chứng minh thời lượng/nguồn/rate đi qua renderer, chưa chứng minh điểm nội dung chính xác trong footage thay đổi theo thời gian. Chưa có range preview/scrub tại dialog, reorder giữa timeline hoặc tự chọn cảnh theo ý nghĩa. Full127nhóm chưa hoàn tất.


## 116. Xem trước và lấy mốc A-roll trong dialog hiện có · 04/11/2026

Cắt/Cảnh trám → Thêm video vào cuối bản dựng dùng cùng dialog mục113–115. Mỗi nguồn chọn có Mở xem trước, video với nút tua/phát của trình duyệt, Lấy mốc này làm Vào/Ra và Phát đoạn đã chọn theo tốc độ cấu hình. Phát đoạn tự dừng gần điểm Ra; lấy mốc cập nhật ô range và làm kết quả kiểm tra trước đó hết hạn. Vẫn Kiểm tra nguồn → Thêm vào bản dựng → Lưu; chưa lưu có Undo. Không thêm mục sidebar hoặc editor thứ hai.

editor/ui/contentos-source-range-preview.js quản lý player tải khi yêu cầu, timeout metadata15giây, lỗi hiển thị, giải phóng media khi chọn lại/đóng dialog; app.js dùng component trong dialog đang có. GET/HEAD /api/primary-media-preview tái sử dụng streamMedia/byte range, kiểm project/revision/workspace, membership và containment trước khi phục vụ. URL mang context vì video native không gửi custom header. Chuyển dự án hoặc revision cũ bị từ chối; không phục vụ đường dẫn tùy ý.

145tests đạt trước cập nhật tài liệu; PRIMARY_RANGE_PREVIEW_BROWSER_SMOKE.json và harness tương ứng đã kết thúc mã0. Browser1280/1920 tua/lấy mốc0.5–1.5giây, phát đoạn tự dừng, revision sai nhận409, chọn2×, Apply/Save/reload giữ mốc. HyperFrames final3.5giây; pixel3.1s xanh và3.4s đỏ của nguồn đổi màu theo thời gian xác nhận đoạn đi qua ranh giới nội dung thật. Không page exception. Đây là fixture tổng hợp local; chưa nghiệm thu codec đa dạng, NAS/điện thoại thật, file dài, nhiều player chạy đồng thời, hủy metadata đang tải hoặc thông lượng sản xuất. Tự chọn cảnh theo ngữ nghĩa, chèn giữa/reorder/xóa và đủ127nhóm vẫn chưa hoàn tất.


## 117. Nhiều A-roll tại Home từ đường dẫn local/NAS · 04/11/2026

Ngay dưới bộ chọn Video chính của luồng Kiểm tra đường dẫn A-roll/B-roll, thêm checkbox A-roll tiếp theo và thứ tự chọn hiển thị. Tối đa20video gồm nguồn chính, có thể bỏ/chọn lại để đổi thứ tự. Đổi nguồn chính bỏ nguồn đó khỏi danh sách bổ sung và cập nhật checkbox. Dùng cùng Home/setup VEK, không thêm màn hoặc thư viện NAS. Chế độ Cắt clip ngắn hiện vẫn dùng một video dài; khi chọn nhiều nguồn hướng người dùng chuyển sang Edit video, không âm thầm bỏ nguồn.

createNasProject nhận additionalVideos theo thứ tự, kiểm membership/containment/loại file và trùng lựa chọn trước khi sao chép. Mỗi nguồn đi qua storage.attachSelected (checksum/provenance), probe metadata thực bằng inspectPrimaryMedia và nối bằng appendPrimaryClips dùng chung với editor/API. Nguồn gốc giữ nguyên; chỉ file chọn được copy. Tạo tất cả trong staging, lỗi dọn staging, chỉ publish dự án sau build/kiểm workspace. work/source-request.json lưu lựa chọn và yêu cầu để khôi phục setup. Khảo sát6ảnh hiện chỉ dành video chính.

146tests đạt, gồm nguồn thiếu/ngoài danh sách/trùng/hỏng và dọn staging. HOME_MULTI_AROLL_BROWSER_SMOKE.json:1280/1920 chọn video chính + xanh lá + đỏ, metadata/6ảnh, tạo project3clip, khôi phục note/survey; render HyperFrames4.2s có pixel xanh lá rồi đỏ đúng thứ tự, không page exception. Fixture local tổng hợp; chưa nghiệm thu UNC/NAS vật lý, điện thoại, ngắt mạng/hủy, tự chọn cảnh ngữ nghĩa, nhiều A-roll với Cắt clip ngắn hoặc benchmark50–100video. Full127nhóm chưa hoàn tất.


## 118. Lời thoại nhiều nguồn nhất quán giữa editor, API và phiên AI · 04/11/2026

createEditorContext nhận snapshot project candidate khi server mở worker API. read_transcript kiểm sourceTranscriptMatches dùng chung với editor trước khi trả từ; nguồn hoặc mediaStart đổi so với transcript đã lưu thì trả lỗi nhận giọng lại, không cung cấp lời cũ như hợp lệ. Công cụ media/list và sửa phần không phụ thuộc transcript vẫn dùng được. Kết quả hợp lệ giữ words[].source {src,start,end}, giải thích start/end chính là giây timeline nguồn ảo; tốc độ đầu ra qua timemap. Không thêm nơi cấu hình AI hoặc màn transcript khác.

transcribe CLI có --check-transcript: JSON ready=true/mã0 khi words và clock khớp; thiếu/hỏng/hết hạn ready=false/mã3. Kiểm tra này không nhận giọng hay tải công cụ. Hướng dẫn ai-inbox yêu cầu kiểm trước khi dùng lời và nhận lại qua transcribeProject nếu cần; không lấy riêng source.video cho dự án nhiều nguồn hoặc ghi đè timeline bằng segments một nguồn. Đây là chỉ dẫn cho phiên AI; chưa phải sandbox cưỡng chế mọi thao tác CLI/candidate.

148tests đạt. API_TRANSCRIPT_CLOCK_SMOKE.json: endpoint ai-revise thật và gateway tổng hợp đọc lời đúng kèm provenance, sửa title candidate rồi chờ duyệt; lượt sau thay mediaStart bị từ chối transcript cũ, vẫn sửa title không liên quan và chờ duyệt, không render. Unit kiểm snapshot candidate khác live, hide/speed giữ clock, mất transcript và mãCLI. Chưa đối chiếu lại checksum/nội dung âm thanh, không chứng minh ASR/model thật/chất lượng tiếng Việt hoặc tự nhận giọng lại trong API job. Full127nhóm tiếp tục.


## 119. Đổi thứ tự A-roll trong inspector và chat API · 04/11/2026

Inspector đoạn Video hiện có hai nút Đưa đoạn lên trước / Đưa đoạn ra sau, bao gồm cả đoạn đang bỏ để giữ khả năng phục hồi. Cùng undo/save/build VEK; không thêm timeline/editor. primary-sequence.js dùng chung với API reorder_primary_clips: nhận đủ IDs mỗi đoạn đúng một lần, đóng gói lại timeline nguồn ảo theo thứ tự, giữ src/mediaStart/mediaInfo/rate và hiệu ứng riêng. Không thay file gốc.

Chữ/zoom/cảnh trám/scene/block/VFX và audio.clips/SFX chuyển theo đoạn chứa mốc bắt đầu; cues/follow chuyển cùng nội dung. Caption tách theo đoạn nguồn, clip phần từ giao biên, chuyển/sort và cấp ID tránh trùng. Nhạc nền/vùng musicSpeech giữ mốc đầu ra, UI báo rõ; nội dung dài qua điểm nối giữ duration đầu ra và cần kiểm tra biên tập. Nội dung neo ngoài các đoạn bị từ chối rõ ràng; matte/clean/freeze/dissolve nhiều nguồn vẫn chưa có adapter. Transcript cũ hết hạn theo sourceClock. API thao tác candidate, completion/revision giữ nguyên; read_transcript sau reorder bị chặn cho tới khi có lời phù hợp.

151tests đạt, gồm metadata/effects/rates/anchors/caption/audio và worker API dùng helper chung. PRIMARY_SEQUENCE_BROWSER_SMOKE.json: inspector ở1280/1920→move→Undo/Save kiểm thứ tự cũ→move/Save/reload kiểm thứ tự mới và neo chữ/phụ đề, HyperFrames final2s có pixel cảnh đỏ ở đầu. Chưa physical NAS/CapCut/long composition, mọi overlay băng điểm nối, hoặc reorder qua model thật/HTTP endpoint trong bài này. Chèn giữa/xóa ripple/drag reorder và full127nhóm vẫn tiếp tục.

Browser test phát hiện phản hồi timeline-source đang xử lý revision cũ đến sau Save gây conflict giả. editorFetch giờ pin dir/revision lúc gửi: chỉ áp revision header và mở conflict khi context vẫn tương ứng request. Xung đột thật của context hiện hành vẫn giữ guard. Lần đầu harness đợi toast Đã lưu bị toast cache che mất; chẩn đoán xác nhận conflict cũ, sửa logic phản hồi và chạy lại luồng đạt. Chưa test toàn bộ tổ hợp nhiều tab/ngoại ghi.


## 120. Chèn A-roll trước một đoạn trong hộp nguồn dùng chung · 04/11/2026

Nút tại Cắt/Cảnh trám đổi nhãn thành Thêm A-roll vào bản dựng. Giữ dialog nguồn/range/speed/preview hiện có, thêm Vị trí chèn: Cuối bản dựng hoặc Trước đoạn theo ID, kể cả đoạn đang bỏ. Đổi vị trí làm kết quả Kiểm tra nguồn hết hạn; Check→Apply→Save và Undo giữ nguyên. Không tạo picker/engine khác.

appendPrimaryClips nhận tùy chọn beforeId. Probe/promote legacy và tạo clip như trước, sau đó gọi reorderPrimaryClips dùng chung để đặt clip mới trước đích, chuyển neo nội dung cũ. Trả addedIds độc lập vị trí để API không lấy nhầm các đoạn cuối. append_primary_clips mở rộng cùng beforeId; không có trường này giữ tương thích nối cuối. ID đích sai bị từ chối. MediaStart/rate giữ mốc file; overlay/audio theo đoạn neo; nhạc nền/musicSpeech giữ mốc đầu ra, UI nêu rõ cần kiểm nội dung qua điểm nối. Transcript cũ hết hạn khi tập nguồn đổi.

152tests đạt. PRIMARY_INSERT_BROWSER_SMOKE.json1280/1920: legacy hai đoạn→chèn video đỏ trước đoạn2→Save/reload ba đoạn và chữ từ1.7→2.7s; final4s pixel xanh/đỏ/xanh đúng. API_PRIMARY_INSERT_SMOKE.json real revise endpoint/synthetic gateway beforeId tail→candidate→auto-final2s, pixel xanh/đỏ/xanh và tone880Hz/440Hz đúng, audio settings giữ nguyên. Không paid model/user media. Harness ban đầu dùng fixture không thuần xanh nên assertion màu không đúng; thay fixture xanh tổng hợp. Reload ban đầu đụng DOM trước điều hướng xong, đã sửa đợi DOM và chạy lại đạt. Chưa kiểm NAS/phone vật lý, chọn chèn tại playhead rồi tự split, overlay băng điểm nối, CapCut hay thông lượng sản xuất. Full127nhóm tiếp tục.


## 121. Chèn A-roll tại playhead và tự tách clip · 04/11/2026

Vị trí chèn trong cùng dialog thêm nguồn có Tại playhead lúc mở hộp, hiển thị giây đầu ra đã chốt. App quy đổi qua timemap sang giây nguồn ảo và snapshot mốc; tua preview trong dialog không thay mốc đích. API append_primary_clips nhận atSource theo giây timeline nguồn ảo, không kết hợp beforeId. Cuối/Trước đoạn giữ tương thích.

appendPrimaryClips tự promote legacy, tìm segment, tách khi nằm giữa phần giữ, cấp ID riêng cho phần sau. Giữ src/mediaInfo/mediaStart và hiệu ứng, pin đường audio gốc rồi dời envelope/zoom theo delta/rate; phần sau bỏ chuyển cảnh đầu bị lặp. Sau đó dùng reorder chung để chèn, chuyển neo chữ/caption/audio như mục120. Ranh đầu/cuối không tạo đoạn0giây. Điểm sát mép dưới0.05giây đầu ra, ngoài khoảng hoặc giữa đoạn đang bỏ bị từ chối. Không tự ASR lại; transcript cũ hết hạn khi nguồn đổi.

153tests đạt gồm clip2×, điểm file, envelope/zoom và invalid/boundary cases. PRIMARY_PLAYHEAD_BROWSER_SMOKE.json1280/1920 dùng thao tác thước timeline, clip3s2×→playhead0.75s (nguồn1.5s)→chèn đỏ1s, Save/reload và phần sau giữ mediaStart1.5/envelope.offset0.75, chữ nguồn1.7→2.7; final2.5s xanh/đỏ/xanh. API_PRIMARY_PLAYHEAD_SMOKE.json real revise/synthetic gateway atSource0.5→auto-final2s xanh/đỏ/xanh và nguồn tone880/440Hz đúng. Fixture tổng hợp local; không model trả phí/NAS vật lý, full-frame/sample-exact continuity hoặc mọi overlay qua điểm nối. Nhạc/musicSpeech giữ mốc đầu ra như UI đã giải thích. Full127nhóm chưa hoàn tất.


## 122. Chuẩn bị lời thoại trước lượt dựng mới qua API · 04/11/2026

Thiết lập AI tại Home dùng select Ngôn ngữ lời thoại (vi/en/auto), gửi transcriptLanguage và pin vào job; mặc định vi. Phiên Codex/Claude được nhắc ngôn ngữ này trong inbox. Worker API first-build chuẩn bị transcript trước khi tạo mediaContext/gọi model: dùng lại khi words/clock/ngôn ngữ phù hợp, thiếu/hết hạn thì gọi transcribeProject local, không tải công cụ hoặc gọi provider trả phí. Nguồn im lặng được khai báo đầy đủ có thể bỏ qua. Thiếu runtime, hủy, đổi revision/job/kết nối thì báo lỗi, không dựng giả thành công. Job lưu transcriptPreparation; Home hiển thị apiProgress.phase/pct tại hộp tiến độ hiện có.

Nhận giọng legacy một nguồn cũng được staging→kiểm project/file identity→atomic publish, dọn tạm và giữ transcript cũ nếu lỗi, giống nhiều nguồn. Không chạy autoPrepare thay segment live trong bước chuẩn bị API này. Candidate vẫn áp qua revision guard và completion policy; nhận giọng không đồng nghĩa tự xuất hay đăng. Chưa durable ASR restart/checkpoint hoặc hash xác minh nội dung audio.

155tests đạt. FIRST_BUILD_ASR_API_SMOKE.json: endpoint dựng mới thật, giọng tổng hợp System.Speech, Whisper local thực, en→11từ chứa video studio tới synthetic gateway, candidate sửa tiêu đề rồi awaiting-review, không tự render. FIRST_BUILD_API_BROWSER_SMOKE kiểm select ngôn ngữ en đi cùng payload và UI1280/1920. Bài thử đầu mặc định vi cho tiếng Anh cho ra lời sai; thêm chọn ngôn ngữ và assertion câu thực trước khi kết luận đạt. FIRST_BUILD_MULTISOURCE_ASR_API_SMOKE kiểm hai nguồn/clock/provenance bằng cùng luồng. Fixture tiếng Anh tổng hợp không chứng minh độ chính xác footage tiếng Việt, đủ mọi skill/API/model hoặc throughput50–100video. Full127nhóm vẫn tiếp tục.

## 123. Chèn kết quả ảnh vào cảnh trám VEK · 04/11/2026

Cảnh trám → Tạo ảnh AI dùng cùng thư viện ảnh workspace; thẻ kết quả có Chèn vào bản dựng tại playhead. Thao tác nhập qua image attach/storage rồi gọi insertBroll hiện có, giữ kiểu cảnh trám đang chọn, Hoàn tác/Làm lại và Lưu của VEK. Vị trí được chốt lúc mở dialog; kiểm còn thời lượng tối thiểu và project/nội dung/workspace trước khi nhập và chèn. Nhập vào tư liệu chỉ lưu file; Chọn làm ảnh bìa vẫn là thao tác riêng. Không thêm màn tạo ảnh hoặc kho kết nối mới. Hoàn tác giữ file tư liệu để tái dùng.

155 tests đạt. IMAGE_INSERT_BROWSER_SMOKE.json: gateway local trả PNG tổng hợp, nút thật ở Cảnh trám tại1280/1920 → tạo → chèn → Save → Undo/Redo + Save → reload. HyperFrames xuất MP4 thật1080×1920/3s; pixel đỏ tại1s,x540,y500 xác nhận ảnh hiện trong khung PiP; không lỗi JavaScript. Hai lần kiểm pixel trước chọn ngoài khung; đã xem frame rồi sửa tọa độ kiểm. Chưa chứng minh provider trả phí, chất lượng ảnh sản phẩm, mọi preset/tỷ lệ, điểm chèn khác0 hoặc thao tác đổi dự án trong khi chờ. Full127nhóm chưa hoàn tất.

## 124. Model ảnh riêng cho lượt tạo trong công cụ dùng chung · 04/11/2026

Tạo ảnh AI từ Cảnh trám/Thư viện/Ảnh bìa có Model cho lượt tạo; để trống dùng cấu hình Kết nối ảnh. ID được kiểm cú pháp trước gọi gateway; không sửa mặc định, endpoint, khóa hoặc khai báo hỗ trợ tham chiếu. JSON generations và multipart edits dùng cùng giá trị hiệu lực; kết quả lưu và hiện model đã yêu cầu trên thẻ ảnh. Không coi tên model là bằng chứng gateway thực sự dùng đúng model hoặc hỗ trợ mọi tính năng.

155tests đạt; bộ images bổ sung model riêng/default/invalid và multipart tham chiếu. IMAGE_INSERT_BROWSER_SMOKE.json thực hiện nút thật tại1280/1920, gateway tổng hợp nhận fixture-run-image cả2lượt, kết nối vẫn fixture-red; chèn/Undo/Redo/Save/reload và MP4 thật chứa ảnh đỏ đạt. Chưa model discovery, auto-model/capability theo từng model, budget tiền hoặc nhà cung cấp thật. Không thu hẹp phạm vi ảnh/ba app; full127nhóm chưa hoàn tất.

## 125. Danh sách model ảnh và khung PiP ổn định · 04/11/2026

Ô model ảnh theo lượt dùng runModelPicker chung với dựng API, kind=image. Bấm Lấy model từ gateway mới GET /models qua kết nối ảnh đã lưu; không tạo ảnh, không đổi ID đang gõ. Chọn một mục mới điền vào ô, để trống dùng mặc định. Endpoint kiểm workspace và fingerprint kết nối trước/sau chờ; danh sách không chứng minh model hỗ trợ tạo/sửa ảnh. Không tạo catalog/key store khác. Gateway không hỗ trợ danh sách thì báo lỗi, người dùng vẫn nhập tay.

Browser nghiệm thu phát hiện PiP ảnh có lúc bị render vào khung cao dọc mặc dù ảnh nguồn ngang. Build nay probe kích thước ảnh local (cache theo file trong lần build), ghi chiều cao rõ cho PiP thường/glow/plain/tilt/polaroid, gồm border/padding; phone/strip giữ khung riêng. Cần build lại dự án cũ để sinh HTML mới. Thử đầu sau sửa vẫn dùng server giữ module build cũ; khởi động lại ContentOS rồi chạy lại đạt. Không thay đổi file nguồn.

156tests đạt, thêm image-pip-layout.test.mjs kiểm portrait/wide/tilt/polaroid/phone/strip và đường dẫn ra ngoài dự án. IMAGE_INSERT_BROWSER_SMOKE.json: UI thật1280/1920,2lượt đọc danh sách, giữ typed ID trước khi chọn, gateway nhận model đã chọn, mặc định kết nối giữ nguyên; Undo/Redo/Save/reload và final3s1080×1920 chứa ảnh đỏ tại1s,x540,y500. MODEL_CONNECTION_BROWSER_SMOKE hồi quy đạt. Chưa live provider/auto-model, mọi khung ảnh hoặc wide MP4; còn probe đồng bộ và cần tiếp tục nghiệm thu hiệu năng nhiều ảnh. Full127nhóm chưa hoàn tất.

## 126. Nhập ảnh nền/hoàn thiện AIEV vào thư viện chung · 04/11/2026

Không gian làm việc → Nhập dữ liệu từ ứng dụng cũ → Khảo sát dự án nguồn có nhóm AIEV · Ảnh. Đọc image-projects/<id>/meta.json từ aievRoot đã cấu hình, liệt kê background/final riêng, chọn Nhập ảnh AIEV vào workspace rồi Mở thư viện ảnh dùng cùng contentos-images. Giữ bytes PNG/JPEG, prompt và nguồn/hash/model/style/kind/overlay đã chọn lọc; không đọc config bí mật hoặc copy toàn bộ metadata. Ảnh hoàn thiện là raster phẳng, các trường overlay được lưu để tham khảo, chưa thành composition/lớp chữ chỉnh được. Ảnh nhập dùng lại được làm tham chiếu/ảnh bìa hoặc chèn ở Cảnh trám theo luồng hiện có.

Import kiểm workspace/config/metadata và hash file trước/sau decode. Nhập lặp chỉ tái dùng khi file đích vẫn khớp hash; file đích đổi thì giữ bản đó và tạo bản mới. Không gọi gateway, không chuyển/xóa nguồn. Scan giới hạn200ảnh/2000thư mục và dừng sau ngưỡng64MiB bytes đã hash (ảnh cuối tối đa20MiB thêm), báo truncated; chưa phân trang để nhập hết kho lớn. Hash đọc đồng bộ; cần chuyển scan lớn sang background trước nghiệm thu sản xuất.

157tests đạt. image-migration.test kiểm hai vai trò, prompt/overlay allowlist, không copy secret, dedup/tamper, source đổi, path traversal, abort và workspace đổi trong import không publish. IMAGE_MIGRATION_BROWSER_SMOKE.json dùng fixture local với metadata/PNG tổng hợp, nút Cài đặt thật1280/1920 → khảo sát → nhập → mở thư viện chung, lần2tái dùng, bytes/metadata nguồn giữ nguyên, không lỗi JS. Chưa nhập dữ liệu thật của người dùng hoặc render ảnh migration qua timeline trong harness này; test ảnh tạo/chèn ở mục125 là luồng khác. Full127nhóm vẫn chưa hoàn tất.

## 127. Chữ ảnh AIEV trong công cụ ảnh bìa VEK · 04/11/2026

Ảnh bìa VEK mở rộng cùng canvas với Phụ đề/CTA tùy chọn; giữ tiêu đề/cỡ chữ/vị trí/phong cách thương hiệu. Thẻ ảnh nền AIEV đã nhập có Dùng nền và chữ AIEV cho ảnh bìa: lấy title/subtitle/cta và ánh xạ vị trí dọc top/middle/bottom, điền form để sửa tay. Nút Dùng cho ảnh bìa vẫn chỉ chọn nền. Ảnh hoàn thiện không có nút lấy chữ để tránh cộng thêm chữ lên raster đã compose. Chưa chuyển stats/logo/căn trái-phải/thiết kế Remotion chính xác.

Canvas đo các dòng, dành vùng riêng cho phụ đề/CTA và báo chữ vượt vùng; Lưu từ chối nếu overflow. Hộp ảnh bìa cuộn trên màn720p. Server chuẩn hóa hợp đồng cover-composition, giữ subtitle/cta trong sidecar và provenance ảnh. Lưu vẫn tạo JPEG mới, không sửa ảnh nguồn/timeline; chưa mở lại form từ sidecar đã lưu. Guard project/workspace khi chọn nền và trước lưu; chưa nghiệm thu stale context UI riêng.

158tests đạt, thêm kiểm mapping/giới hạn/allowlist và sidecar. IMAGE_MIGRATION_COVER_BROWSER_SMOKE.json actual Cài đặt nhập PNG/metadata tổng hợp→thư viện→editor→Ảnh bìa→chọn nền+chữ→sửa phụ đề→lưuJPEG1080×1920 và sidecar title/subtitle/CTA/pos/source ID đúng tại1280/1920; chữ dài báo lỗi/không tạo file mới, không lỗi JS, nguồn giữ nguyên. Đã xem JPEG xác nhận ba lớp chữ. Browser phát hiện thiếu route phục vụ module mới và resize/relayout trước S.tm gây lỗi; đã thêm route và guard renderTimeline rồi chạy lại đạt. Chưa nghiệm thu ảnh16:9/nội dung dài thực/provider/thiết kế poster hoàn chỉnh. Số mục127 này là số ghi chú đặc tả, không phải hoàn tất127nhóm tính năng.

## 128. Mở ảnh bìa đã lưu để sửa trong VEK · 04/11/2026

Trong cùng hộp Ảnh bìa, chọn Ảnh bìa đã lưu → Mở bản đã lưu để sửa. Danh sách dùng chung publish-covers, ảnh lỗi hash bị vô hiệu hóa. Endpoint edit trả composition đã chuẩn hóa và nguồn sau kiểm JPEG/workspace/tỷ lệ dự án/ảnh nền. UI decode nền xong mới thay form; giữ bản nháp nếu lỗi. Nạp title/subtitle/CTA/cỡ chữ/vị trí/kiểu; font/màu dùng thương hiệu hiện tại, thông báo rõ. Lưu tiếp tạo JPEG/sidecar số mới, không ghi đè bản cũ. Bản nháp ảnh bìa scope theo dự án để không mang nền/chữ sang dự án khác.

Ảnh nền workspace được kiểm hash lúc mở lại, trước/sau xử lý JPEG khi lưu; tamper/mất file báo lỗi. Khung video cũ được kiểm đường dẫn tồn tại và khớp source hiện tại, chưa fingerprint nội dung video nên không bảo đảm file cùng tên chưa đổi. Form cũ thiếu composition/provenance hợp lệ không mở giả; cần chọn nền và tạo mới. Danh sách/hash hiện đồng bộ, chưa phân trang/async cho dự án nhiều ảnh bìa.

158tests đạt; covers.test kiểm reopen image/video, tampered background, sai workspace/format và save hash guard. COVER_REOPEN_BROWSER_SMOKE.json actual UI1280/1920 từ nhập AIEV→lưucover→reload→mởbản1→sửaCTA→lưubản2, metadata và bytes bản1 giữ nguyên; overflow từ chối bản3, không lỗi JS. Fixture PNG/local only. Chưa kiểm khôi phục16:9 bằng browser, font offline/brand snapshot, stale project/missing background qua UI hoặc full Remotion poster. Full127nhóm vẫn chưa hoàn tất; mục128 là số ghi chú triển khai.

## 129. Worker API dùng ảnh workspace trong cùng chat dựng · 04/11/2026

Chat Space/Studio và dựng mới qua API dùng list_workspace_images(query/offset/limit) để tìm ảnh đã có, attach_workspace_image(id) để nhập rồi inspect_media trước khi sửa brolls. Công cụ chỉ xuất hiện khi server cung cấp imageContext; không thêm màn chat/kho/key riêng. Metadata/prompt là dữ liệu, không phải lệnh hoặc bằng chứng AI đã xem ảnh. Không gọi tạo ảnh trả phí hoặc tự lấy file ngoài thư viện. Session/CLI chưa có bridge công cụ này.

ID phải được tìm trước; pin metadata/hash rồi kiểm workspace/job/base revision và bytes khi nhập. Dùng attachSelected/provenance hiện có. mediaContext chỉ nhận đúng asset đã nhập, kiểm lịch sử cũ không đổi và không có nguồn mới ngoài asset đó, xác minh hash rồi thêm vào list/inspect. Không bỏ guard nguồn/transcript cũ. Candidate vẫn áp theo revision/completion policy; file nhập vào dự án có thể còn nếu job/candidate về sau lỗi, chưa có transaction/rollback asset trọn lượt. Không tuyên bố asset isolation hoàn chỉnh.

159tests đạt: editor-images.test kiểm model tool loop thật qua fake fetcher với library/storage thực, project live chưa đổi, dedup/source tamper/workspace và metadata inspection. API_WORKSPACE_IMAGES_SMOKE.json actual reviseHTTP + gateway tổng hợp thực hiện4tool list→attach→inspect→set, auto-export MP4 có pixelđỏ252/0/0 ở0.5s; file nhập giữ bytes, segments nguồn giữ nguyên. Không dùng provider trả phí hoặc ảnh người dùng. Chưa browser chat submission cho luồng mới, model thật chọn ảnh phù hợp, vision tự động ảnh workspace, generation/budget hoặc durable asset rollback. Full127nhóm chưa hoàn tất.

## 130. Phiên Codex/Claude và CLI dùng cùng thư viện ảnh workspace · 04/11/2026

Luồng inbox dựng mới và Nhờ AI sửa hướng dẫn công cụ editor/tools/anh-workspace.mjs <jobDir> list [query] [offset], sau đó attach <id>. Cùng createEditorImages/storage với worker API; không thêm chat, kho ảnh hoặc nơi nhập key. Phiên phải mở ảnh bằng công cụ của mình trước khi nhận xét nội dung; prompt là metadata tham khảo. Chỉ nhập ảnh đã có, không tự tạo ảnh tính phí.

Service job-images kiểm thư mục job/project, candidate đúng vị trí và completion token cho dựng mới, baseRevision, workspace và trạng thái waiting/working; từ chối job API và loại việc khác. Hash metadata/bytes được chốt trong work/workspace-image-selection.json giữa các lần chạy CLI. Dữ liệu chọn thuộc phiên bản job cũ bị từ chối; cần nhận lại việc. Attach dùng chung provenance/importer, giữ project.json gốc; chỉ sửa candidate rồi hoàn tất theo bridge hiện có. Asset nhập có thể còn khi candidate lỗi/hủy, chưa rollback hoặc cô lập giao dịch đầy đủ.

161 bài test đạt, gồm revise/session và first-build/CLI với pin candidate token, revision, lifecycle, workspace, dedup và project gốc không đổi. SESSION_WORKSPACE_IMAGES_SMOKE.json kiểm endpoint revise thật, helper CLI thật, list/attach/dedup/bytes và từ chối job terminal trên server riêng5196. Dữ liệu tổng hợp; không chạy agent Codex/Claude thật, không kiểm hoàn tất candidate/render qua helper mới, NAS vật lý hoặc provider trả phí. Server5180 đã khởi động lại sau khi kiểm không có job working/exporting và không có render lock. Toàn bộ127nhóm vẫn chưa hoàn tất.

## 131. Nghiệm thu ảnh workspace qua inbox đến MP4 · 04/11/2026

SESSION_WORKSPACE_IMAGES_SMOKE.json đã mở rộng: tạo job sửa qua HTTP thật với execution=session, tìm/nhập ảnh qua anh-workspace CLI, sửa candidate tổng hợp, gọi ai-inbox --done thật. Project gốc giữ hash trước completion; server áp candidate theo revision, segments nguồn không đổi. completionState=awaiting-review và chưa tạo render.json chứng minh chế độ kiểm tra không tự xuất. Sau đó chạy xuat-video CLI final với appliedRevision; render trả đúng revision và MP4 có pixel đỏ252/0/0 tại0.5giây. Job đã done từ chối nhập ảnh mới.

Đây là bằng chứng hoàn tất/render bổ sung cho mục130, không phải thêm nhóm tính năng hoặc tuyên bố đủ127nhóm. Candidate được viết bởi harness bằng ảnh tổng hợp, chưa chạy phiên Codex/Claude thật, chưa browser chat submission, provider trả phí hoặc NAS vật lý. Các giới hạn rollback asset/cô lập thực thi ở mục130 vẫn giữ nguyên.161 unit/service tests của bản130 không đổi; lượt này chỉ mở rộng smoke end-to-end và tài liệu.


## 132. Phân trang ảnh AIEV trong màn Nhập dữ liệu · 04/11/2026

Khảo sát ảnh có nextCursor theo danh sách thư mục đã sắp xếp và hash danh mục/nguồn; mỗi trang tối đa200ảnh,4000lượt vai trò và ngưỡng64MiB hash cộng tối đa một ảnh20MiB. Cursor lưu vị trí cả background/final nên không bỏ vai trò khi ngắt giữa dự án. Thêm/bớt/đổi tên thư mục làm cursor cũ lỗi, yêu cầu khảo sát lại; metadata/bytes vẫn pin riêng lúc nhập. Danh sách tên thư mục vẫn đọc/sắp xếp đồng bộ toàn bộ, chưa background scan hoặc benchmark kho lớn.

Màn Cài đặt → Nhập dữ liệu giữ các hàng/nút/kết quả nhập hiện có, thêm Xem thêm ảnh AIEV và nối kết quả vào cùng danh sách. Import xác minh trực tiếp ID/hash/containment thay vì tìm lại chỉ200kết quả đầu; ảnh ở trang sau nhập được. Không tự nhập dữ liệu người dùng hoặc gọi provider.

162tests đạt, gồm206ảnh/2trang không trùng/mất, ngắt giữa hai vai trò, nhập ảnh trang sau và cursor stale. IMAGE_MIGRATION_BROWSER_SMOKE.json actual settings1280/1920→200ảnh→Xem thêm→206ảnh→nhập ảnh cuối vào thư viện chung, giữ kết quả hàng cũ, source fixture không đổi và không JS error. Chỉ fixture local; chưa NAS thật, kho rất lớn, hủy/scan nền hoặc toàn bộ127nhóm. Server5180 đã nạp thay đổi; trước restart xác minh exportPid57276 của một smoke cũ không còn tiến trình, không coi trạng thái export-started cũ là worker còn sống. Không sửa job cũ.



## 133. Kiểu màu chữ trong inspector hiện có · 04/11/2026

Văn bản → Chữ → Sửa chữ: sau font/cỡ/giãn cách là disclosure Màu & kiểu tiêu đề; nhãn và chữ phụ nằm trong disclosure hiện có. Không thêm sidebar hay màn riêng.10mẫu CSS, màu đơn/picker/HEX, gradient tuyến tính2–8điểm với góc và vị trí, viền và bóng nâng cao thu gọn; Theo mẫu bỏ override. Shared serializer/validation trong brand.js, component UI riêng, project text state + history và live patch class/CSS variables; build/snapshot dùng cùng serializer.170tests, browser1280/1920 Save/Undo/reload giữ iframe; actual draft3sMP4/frame xem trực tiếp. Chi tiết/giới hạn ở BUILD_STATUS. Chưa có gradient liên tục qua toàn dòng, nhiều viền, texture/3D hoặc phụ đề/block tùy ý; không coi tương đương trọn CapCut.


## 134. Shell và điểm vào workspace · 04/11/2026

Theo yêu cầu tiếp tục toàn bộ: route map contentos-navigation.js + CSS riêng; sidebar6nhóm, selector workspace, Dự án dùng danh sách/handler cũ; images/news mở công cụ sẵn có ở workspace. Hash/back/refresh và read-only browser hai widths đã kiểm (NAVIGATION_SHELL_BROWSER_SMOKE.json),170service tests đạt. BUILD_STATUS ghi giới hạn; chưa toàn bộ sidebar đích hoặc127nhóm.


## 135. Container Kết nối · 04/11/2026

Một sidebar Kết nối mở4tab và tái sử dụng section/form/service cũ. Hash connections/<tab> và alias cũ dùng chung route. Voice initialTab=noi không gọi list voices khi chỉ xem cấu hình. CONNECTION_HUB_BROWSER_SMOKE hai widths/GET-only/voice-form fixture và170service tests; BUILD_STATUS ghi giới hạn. Không có adapter video mới hoặc bypass quyền nguồn.


## 136. Thư viện dùng chung · 04/11/2026

Container4tab tái sử dụng template shelf/selection/details + kho hiệu ứng + AIEV catalog + intake. Home mở cùng route, không hai tgrid hay state chọn mẫu mới. LIBRARY_HUB_BROWSER_SMOKE hai widths installed selection/rules/back/intake/legacy đạt, cùng shell/connections regression và170service tests. Chi tiết giới hạn ở BUILD_STATUS; chưa full job/render hoặc toàn bộ catalog NAS.


## 137. Nhiều phiên AI và cảnh Remotion trong giao diện dùng chung · 04/11/2026

Home giữ composer, nguồn và mẫu chọn nhanh; giao nhiều video đi qua dialog nhập dự án và dialog giao lô hiện có. Editor giữ Space/Studio, chat, timeline, inspector của cùng project. Bộ chọn phiên chat/CLI/API độc lập với chính sách chờ kiểm tra/tự xuất; chi tiết model chỉ điều khiển khi adapter hỗ trợ. Kết nối là nơi quản lý cấu hình; không thêm menu AI/queue theo từng provider.

Hoạt động gom session và worker CLI/API vào Đang chạy/Hàng đợi/Cần kiểm tra/Lịch sử. Quota nền không giới hạn số chat người dùng mở. Phải phân biệt worker xác minh đang chạy với phiên vừa báo liên lạc; không tự suy ra liveness hoặc phần trăm. Mỗi hàng mở đúng project/job/output. Thumbnail, ưu tiên, grouping gốc/phiên bản và toàn bộ thao tác queue vẫn phải nghiệm thu trước khi tính hoàn tất; chi tiết ở đặc tả dựng song song mục 11–12.

Cảnh trám → Cảnh chữ chuyển động · Remotion mở dialog title/subtitle/thời lượng/màu. Luồng: lưu project → tạo preview bằng worker riêng → xem → Thêm vào timeline → Lưu; Undo dùng history hiện có. Tạo preview không tự thêm broll hoặc xuất final. Đóng dialog vẫn chạy; mở lại trong cùng server nối lượt đang chạy. Form đổi tham số làm preview cũ không còn dùng để thêm. Project đổi/revision đổi hoặc chưa lưu phải tạo lại preview hợp lệ. Editor chưa chuẩn bị xong thì chưa cho tạo cảnh.

Triển khai dùng contentos-remotion.js, remotion-jobs.mjs, remotion-worker.mjs và API scoped project/workspace. Activity hiển thị chờ render chung; không có thanh tiến độ giả hoặc nút xuất final riêng. Bằng chứng API thật và browser 1280/1920 có trong REMOTION_API_SMOKE.json và REMOTION_EDITOR_BROWSER_SMOKE.json (browser dùng cache MP4 thật). Chưa sửa lại tham số broll Remotion đã thêm, chưa recovery qua restart hoặc audio/full AIEV composition. Runtime độc lập còn thiếu. Không tính dialog này là đã tích hợp đầy đủ Remotion hoặc 127 nhóm.


## Sửa lại cảnh Remotion từ timeline · 04/11/2026

Cảnh trám chọn cảnh có metadata ContentOSTitleCard → Sửa nội dung cảnh · Remotion. Dialog điền lại chữ, màu, thời lượng từ props đã lưu; preview mới không đổi project. Thay cảnh trên timeline cập nhật đúng item, giữ ID/vị trí/bố cục, dùng thời lượng mới và bắt đầu media từ đầu; không nhân đôi cảnh. Lưu/Undo dùng cùng history editor. Project/revision/dirty/source và item identity được kiểm trước áp dụng. Khi sửa không nối preview đang chạy của cảnh khác; POST báo project đang bận nếu cần.

REMOTION_EDITOR_BROWSER_SMOKE.json mới kiểm hai kích thước 1280/1920: điền props cũ, đổi chữ/màu/thời lượng, preview không sửa file, thay không tăng số cảnh/đổi vị trí, lưu và Undo khôi phục item cũ. Không JS exception; lần cuối exit0. Một lần harness đọc toast Lưu cũ dẫn tới ghi fixture khi save còn chạy (EBUSY); đã xóa toast trước gửi save và chờ phản hồi mới. Profile Chrome QA giữ trên D vì cleanup đệ quy trước đó thoát lỗi; không thay cleanup dữ liệu sản phẩm. Test remotion-jobs và syntax app/dialog đạt. Không chạy lại toàn bộ suite trong mốc này. Main5180 trả static UI mới HTTP200, không cần restart backend. Đây là chỉnh tham số cảnh chữ native đã ánh xạ, chưa phải mọi composition AIEV/audio/installer hoặc full127nhóm.


## Chỉ số sản phẩm và căn chữ ảnh bìa từ AIEV · 04/11/2026

Đối chiếu trực tiếp source AIEV imageMeta/posterManifest/Thumbnail: poster overlay có stats và position lưới3×3; thumbnail native có frame card + design riêng. ContentOS mở rộng công cụ Ảnh bìa VEK đang có, không thêm sidebar hoặc gọi canvas này là migration native Remotion.

coverFromAievImage ánh xạ vị trí top/middle/bottom × left/center/right; giữ nhãn/giá trị stats. Shared normalizeCoverComposition chấp nhận align và tối đa12stats, mỗi nhãn/giá trị100ký tự, từ chối cấu hình sai; project ảnh bìa cũ thiếu trường vẫn dùng center/không stats. Metadata nhập vượt12chỉ số bị báo lỗi, không âm thầm bỏ các hàng thừa. Mapping auto AIEV và layout/design/logo/effects nguyên bản chưa tương đương native poster.

Trong Ảnh bìa, Chỉ số / thông tin sản phẩm thu gọn mặc định có thêm/xóa/sửa hàng; Căn chữ dùng trái/giữa/phải cùng ba vị trí dọc hiện có. Canvas tính phần stats vào chiều cao/chặn tràn khung, preview và JPEG dùng cùng dữ liệu. Lưu sidecar giữ stats/align, mở lại điền form; lưu bản mới giữ ảnh cũ và nguồn/provenance như cũ. Chưa có card thumbnail/background/frame riêng, poster stats dạng chip nguyên bản, round-trip mọi design AIEV hoặc resize độc lập bốn tỷ lệ.

202service tests đạt(temp D); covers.test kiểm lưu/mở lại align+stats và integrity/revision. COVER_STATS_BROWSER_SMOKE.json server riêng5197 kiểm nhập fixture AIEV background với bottom-right và24tháng→preview→JPEG→reload→đổi36tháng/căn trái→lưu mới, giữ JPEG cũ, chặn overflow, nguồn fixture không đổi và không JS errors ở1280/1920. Đã xem JPEG đầu ra thực chữ Việt/căn phải/chỉ số. Profile QA giữ ởD; test khôi phục sources.local.json và active workspace sau chạy. Không nhập dữ liệu gốc hoặc dùng provider trả phí.

Main5180 restart đúng PID sau dispatcher active/queued0, render/ASR idle/không scene worker; ping ready và shared contract static200. Browser hồi quy chạy lại sau thay đổi input co giãn. Phạm vi native Poster/Thumbnail và toàn bộ127nhóm chưa hoàn tất.


## Gói phát hành từ final và nội dung từng kênh · 04/11/2026

Tích hợp A38 Publish pack vào dialog Nội dung phát hành hiện có (điểm vào trong luồng Xuất final). Disclosure Gói phát hành tải danh sách final đúng revision và bộ nháp đã lưu, cho chọn kênh, tạo ZIP rồi tải. Chặn form đang sửa chưa lưu. Danh sách gói đã lưu cho tải lại, nhãn revision cũ; không tự đăng/bình luận, không thêm sidebar riêng.

publish-pack.mjs kiểm workspace/project, revision, expectedVersion của bộ nháp và trạng thái duyệt riêng từng kênh. Final phải có sidecar ok/final/revision/snapshotId khớp result của render snapshot, kiểm SHA256 khi đọc file vào ZIP. Ảnh bìa khớp hash đã chọn và revision. ZIP gồm video.mp4, channels/<số>-<platform>/content.json cùng title/caption/hashtags/tags/comment.txt và cover.jpg nếu chọn; manifest.json giữ hash/bytes/revision/draftVersion/snapshotId. Không ghi credential, prompt hoặc host path. Channel ID chỉ là dữ liệu JSON, không làm tên đường dẫn.

stored-zip.mjs ghi ZIP store/data-descriptor theo luồng1MiB, CRC32 và SHA256, tối đa3GiB/1000file; không đọc toàn video vào RAM hoặc nén lại MP4. Kiểm disk reserve128MiB; một pack đang tạo/project trong server. validate workspace/revision/version và signal trong lúc ghi; lỗi xóa temp, chỉ publish ZIP hoàn chỉnh. Sidecar checksum riêng; GET download kiểm integrity async và project/workspace. Các endpoint GET/POST /api/v1/publish-packs dùng project tường minh, GET có id tải ZIP; GET không id liệt kê final/gói cũ. Chưa cross-process build ownership, queue/Activity/progress byte cho pack, ZIP64/>3GiB, benchmark video lớn hoặc recovery orphan temp do kill giữa ghi. Đóng dialog abort request đóng gói đang theo dõi; mất phản hồi sát lúc commit có thể đã tạo gói, tải lại từ danh sách thay vì khẳng định rollback.

203service tests đạt ở mốc triển khai; test publish-pack kiểm nội dung ZIP qua unzip/CRC, subset kênh, metadata, path-like channel ID an toàn, foreign workspace, version/revision cũ, corruption input và abort. Sau thêm disk guard/history, related tests đạt. PUBLISH_PACK_API_SMOKE.json dùng fixture3giây render final CLI thật, JPEG thật, per-channel draft→ZIP→download; kiểm MP4 bytes đúng, cover có, chỉ kênh chọn, archive tamper/stale revision bị chặn, project giữ nguyên. Không dùng provider trả phí hoặc đăng bài.

PUBLISH_PACK_BROWSER_SMOKE.json kiểm component dialog thật qua API thật tại server riêng ở1280/1920, chọn một trong hai kênh, tải ZIP và guard sửa chưa lưu, no JS errors. Harness mở component trực tiếp trên Home để giữ fixture render/revision, chưa kiểm click toàn bộ hành trình editor→Export→dialog; điểm vào editor cũ giữ nguyên. Đã xem ảnh PUBLISH_PACK_1280.png phần pack. Main5180 restart đúng PID sau workers0/render-ASR idle/no Remotion worker; ready, endpoint đọc1final/5pack fixture. A38 inventory chuyển partial, không đánh dấu hoàn tất: đăng nền tảng, full AIEV parity, automation sau render và toàn bộ127nhóm còn thiếu.
## Chốt UI Hoạt động nhiều video · 04/11/2026

Áp dụng [Hoạt động và dựng nhiều video](ACTIVITY_MULTI_EDIT_UX_2026-11-04.md): một danh sách tập trung cho nhiều chat Codex/Claude và worker CLI/API, bốn nhóm trạng thái, lý do chờ tài nguyên, mở đúng project và các thao tác có điều kiện backend. Giữ Home/mẫu chọn nhanh và editor VEK, thu gọn cấu hình nâng cao; không thêm menu theo nguồn thực thi. Grouping/tìm kiếm/lọc/ưu tiên cần đối chiếu hiện trạng trước khi bật. Đây là đặc tả UI, không ghi nhận đã triển khai các điều khiển còn thiếu.



## Âm thanh chia nhóm theo menu Bộ lọc · 04/11/2026

Theo ảnh CapCut của người dùng, tab Âm thanh dùng lại #submenu/.sub-btn/.has-sub của Bộ lọc, không thêm rail hoặc sidebar mới. Bốn nhóm Nhạc nền / Giọng nói / Hiệu ứng / Trộn âm; chỉ một panel hiển thị. Menu dọc trên desktop, hàng ngang cuộn ở <=760px. Chuyển nhóm không sửa dữ liệu project. Lane nhạc mở đúng Nhạc nền; clip thuyết minh mở đúng Giọng nói.

Nhạc nền có danh sách bài, tìm kiếm, lọc Tất cả/Đã nhập, chọn/đang dùng, bỏ nhạc và nghe thử/dừng nhạc đã nhập. Nghe thử dùng audio riêng, âm lượng50%, không thay mix. Chuyển nhóm/tab hoặc vẽ lại dừng audition; kho SFX cũng dừng audition trước đó. Nhạc kit phải chọn và chờ build đưa file vào project trước khi nghe; nút chưa chọn bị vô hiệu hóa với tooltip, lỗi tải có thông báo tại bài. Chưa có endpoint nghe mọi bài kit độc lập. Giữ nhập từ máy/NAS/điện thoại, AI brief và lưu mẫu hiện có.

Giọng nói giữ AI voice, thuyết minh, provenance và điều khiển clip/fade/làm rõ giọng. Hiệu ứng giữ mức tự động, danh sách thủ công, kho có nhóm/tìm kiếm/kéo thả; nút thêm thủ công nay vẽ ngay dòng mới. Trộn âm gom volume giọng/nhạc/SFX cùng duck/fade/level hiện có. Không đổi schema hoặc render engine. Chưa thêm thư viện CapCut/TikTok, yêu thích, kiểm bản quyền tự động, pitch/EQ hoặc beat sync.

AUDIO_SPACE_INTEGRATION_BROWSER_SMOKE.json bản mới exit0 trên main5180:1280/1920 kiểm một panel/menu active/search, file picker thật, imported synthetic-tone audition play/stop và hồi quy fade/duck/loop/Save/voice provenance/lưu mẫu v2/Space. Kiểm menu dọc/ngang tại1280/820/600/390, screenshot AUDIO_GROUP_*.png và AUDIO_RESPONSIVE_*.png; đã xem bốn nhóm desktop và390. Không JS exception, không gọi AI/đăng bài. Browser QA dùng userGesture cho hành động nghe thử. Các lần harness lỗi const trùng/thiếu user gesture không tính đạt. Không chạy lại full service suite vì lượt này chỉ đổi UI; mốc208 trước vẫn là baseline. Không restart backend. Chưa nghe đánh giá chất lượng hoặc render final mới; editor mobile toàn bộ vẫn cần tối ưu riêng.
