# Chỉ dẫn đọc trạng thái hiện hành · 05/11/2026

Phạm vi xây dựng vẫn giữ toàn bộ bên dưới; các mục ghi “hiện hành” theo version/ngày cũ là checkpoint lịch sử, không thay trạng thái hiện tại. Đọc docs/BUILD_CURRENT.md và chuyên đề tương ứng để biết bằng chứng/giới hạn mới. Creative mới nhất là v50; người/da đã có MediaPipe và chọn người SAM2, nhưng chưa nghiệm thu mọi chuyển động/nhiều người. Luồng CLI đang kiểm lại bàn giao sandbox, xem CLI_COMPLETION_HANDOFF_CURRENT.md. Không dùng ước lượng phần trăm trong checkpoint cũ làm tỷ lệ hoàn thành hiện nay.

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

Tiến độ privacy: B-roll theo vùng + staged CLI đã có bằng chứng giới hạn; xem [mốc hiện hành](BUILD_CURRENT.md). Ưu tiên tiếp A-roll/detector/privacy gate và end-card riêng.

Mốc ngành xe mới: xem [triển khai và khoảng trống](AUTOMOTIVE_EDIT_IMPLEMENTATION_2026-11-04.md). Tùy chọn theo job và màu B-roll đã triển khai giới hạn; tracking, end-card riêng và nghiệm thu nguồn thật tiếp tục ưu tiên.

# ContentOS — Kế hoạch build hiện hành

**Cập nhật ChungAuto Creative v4 · 04/11:** [Khảo sát dự án Q2, đánh giá edit và skill v4](CHUNGAUTO_CREATIVE_Q2_SKILL_V4_AUDIT_2026-11-04.md) chốt ước lượng lõi edit55–60%, phân tích nhiệm vụ app/skill và phương án tùy chọn màu/biển số/watermark/outro/nhạc/SFX. Mẫu v4 đã cài riêng, v3 giữ nguyên; mới nâng quy tắc, chưa thêm policy UI/backend, tracking hay engine grade. First-build inbox hiện vẫn gỡ camera.color/beauty; cần opt-in snapshot trước khi nhận tự grade hoàn chỉnh.


> Đồng bộ tài liệu 04/11/2026: đọc [điểm hiện hành và bản đồ build](BUILD_CURRENT.md) trước các mốc lịch sử. Mọi thay đổi UI phải theo [quy chuẩn thiết kế và quy trình UX/UI](DESIGN_UX_STANDARD.md): phân tích trải nghiệm, đối chiếu giao diện sẵn có và tham khảo ứng dụng phù hợp trước thiết kế/code. Trạng thái triển khai chỉ được xác nhận bằng bằng chứng đúng phạm vi trong BUILD_STATUS.


**Đồng bộ hiện trạng 04/11/2026:** nhiều phiên chat người dùng mở và worker CLI/API là hai nguồn thực thi độc lập, theo dõi chung trong Hoạt động. Quota CLI/API 1–8 (mặc định 2) không giới hạn số phiên chat. Đã có báo liên lạc session theo claim, model nâng cao cho lô và khôi phục payload/journal khi mở lại. Báo liên lạc không chứng minh tiến trình chat còn sống. Chạy hỗn hợp nhiều AI thật, phục hồi worker/tài nguyên sau crash và benchmark nguồn thật vẫn là các bước nghiệm thu tiếp theo. Phần ghi nhận cũ bên dưới được đọc cùng cập nhật này và BUILD_STATUS.

**Engine hiện tại:** Cảnh trám → Cảnh chữ chuyển động · Remotion đã có bảng tham số, worker cô lập, preview và thao tác Thêm vào timeline → Lưu. HyperFrames vẫn là nền editor; FFmpeg/FFprobe xử lý và kiểm đầu ra. Đây là adapter cảnh chữ giới hạn, chưa phải tích hợp toàn bộ composition AIEV. Xem đặc tả engine và bằng chứng REMOTION_API_SMOKE/REMOTION_EDITOR_BROWSER_SMOKE. Lần đồng bộ tài liệu này không sửa code hoặc khởi động lại app.

**Yêu cầu dựng song song đã chốt 04/11/2026:** đọc [Rà soát UX, mục 12](CONTENTOS_UX_REASSESSMENT_2026-11-04.md#12-yêu-cầu-mới-hàng-đợi-và-dựng-nhiều-video-song-song) và [đặc tả dựng song song](PARALLEL_EDIT_BUILD_SPEC_2026-11-04.md). Nhiều phiên chat Codex/Claude nhận job riêng, chạy cùng worker CLI/API độc lập; Hoạt động theo dõi chung. Quota worker nền không giới hạn số phiên chat người dùng mở. Đã có claim nguyên tử, khóa project, dispatcher và khôi phục việc chờ có xác nhận; ASR/render dùng khóa chung từng tài nguyên. Báo liên lạc phiên đã có; xác minh liveness, phục hồi tài nguyên bền vững và nghiệm thu chạy hỗn hợp bằng AI thật còn thiếu. Luồng nhập nhiều video và giao cùng mẫu đã có code/bằng chứng tổng hợp, chưa nghiệm thu trọn hành trình UI và AI thật; xem BUILD_STATUS. Lần cập nhật này chỉ sửa tài liệu, không triển khai hoặc khởi động lại ứng dụng.

**Luồng nhiều video:** Home → chọn video → “Mỗi video một dự án…” → xem số dự án/tên/tỷ lệ → nhập nguồn → “Giao cả lô cho AI…” → mẫu và cách thực thi chung, brief riêng từng video → Hoạt động. Mặc định chờ kiểm tra; tự xuất là lựa chọn riêng, không tự đăng. Có thể mở lại lô nhập thành công từ Hoạt động. Không tạo thêm sidebar hoặc editor cho dựng song song. Phân biệt ba nghiệp vụ: nhiều A-roll ghép một video, mỗi video thành một dự án, và một video dài cắt nhiều clip. Chi tiết trạng thái/khôi phục ở đặc tả dựng song song, mục 8–10.

**Cập nhật engine và giao diện xem trước:** [RENDER_ENGINE_ARCHITECTURE_2026-11-04.md](RENDER_ENGINE_ARCHITECTURE_2026-11-04.md) chốt dùng HyperFrames + Remotion + FFmpeg/FFprobe qua cùng project/asset/render pipeline. Remotion native đã có adapter cảnh chữ, worker và UI giới hạn; tích hợp đầy đủ còn thiếu, không được tính hoàn tất từ ảnh phẳng hoặc timeline chuyển đổi. Năm màn thiếu quyền VEK hiện mở preview local, không thay quyền thực thi.

**Điều chỉnh điều hướng 04/11/2026:** đọc [Rà soát sidebar theo 7 ảnh giao diện](CONTENTOS_NAVIGATION_REVIEW_2026-11-04.md) trước khi tiếp tục build shell. Giữ editor VEK; được tổ chức lại sidebar theo công việc. Tái sử dụng service/component không đồng nghĩa giữ nguyên menu. Tài liệu này cập nhật các vị trí điều hướng cũ mâu thuẫn; sidebar có icon/responsive và các hub đã triển khai ở phạm vi ghi trong BUILD_STATUS; chưa nghiệm thu toàn bộ chức năng. Các màn khóa Pro/Premium là khoảng trống quyền/khả dụng phải giải quyết, không được tính đã nghiệm thu.
Cập nhật 04/11/2026 theo yêu cầu người dùng. Đây là đặc tả phát triển, không phải danh sách chức năng đã hoàn thành.
Bản này bổ sung, không thay thế hoặc thu hẹp toàn bộ phạm vi 127 nhóm VEK/AIEV/ChungAuto Studio.

## Điểm chốt build sau cập nhật UX/UI · 04/11/2026

Bắt buộc thực hiện [quy trình thiết kế](DESIGN_UX_STANDARD.md) trước mỗi hạng mục UI: phân tích công việc/hành trình → khảo sát màn hiện tại và ứng dụng phù hợp → bản đồ dùng lại component/service → luồng/bố cục/trạng thái/responsive → triển khai → kiểm giao diện thật và dữ liệu → cập nhật bằng chứng. Dùng [mẫu ghi phân tích](UX_CHANGE_RECORD_TEMPLATE.md), gọn theo mức thay đổi; không tự tạo thêm vòng xin duyệt cho việc đã giao.

Các mô tả thiết kế cũ về sidebar, audio và runtime được đọc theo [BUILD_CURRENT](BUILD_CURRENT.md): sidebar icon/responsive và hub đã có; Home giữ quick templates; Audio dùng4nhóm như submenu Bộ lọc, có tìm/lọc/chọn/nghe nhạc đã nhập; mẫu có parent/version và form cải tiến; Space gom cấu hình nâng cao; Remotion runtime local độc lập. Chúng đã có kiểm chứng giới hạn, không phải toàn bộ127nhóm đã hoàn thành. Tồn tại khoảng trống audio snapshot cho mọi adapter, preview/final/NAS thật, rollback mẫu đầy đủ, migration engine, recovery/throughput và máy sạch; ưu tiên theo BUILD_CURRENT mục5.

README và AGENTS đã đồng bộ điểm đọc. config/features.json giữ nguyên trạng thái inventory gốc vì chưa có đối soát từng nhóm; không tính tiến độ từ25baseline/99planned/3partial. Lượt tài liệu này không tiếp tục code hoặc chạy job AI.

## Tra cứu quyết định tích hợp giao diện

Phần tích hợp giao diện đã nằm trong phạm vi build bắt buộc. Dùng giao diện VEK thực tế làm nền ContentOS; các tính năng AIEV và Studio được đưa vào công cụ tương ứng trong cùng ứng dụng.

Các tài liệu để triển khai và kiểm tra phần này:

- [Khảo sát giao diện và trải nghiệm VEK](VEK_UI_UX_AUDIT_2026-11-03.md): nền giao diện cần giữ khi phát triển ContentOS.
- [Đặc tả tích hợp giao diện](UI_INTEGRATION_BUILD_SPEC_2026-11-03.md): bản đồ tính năng → màn hình, thành phần dùng chung, luồng thao tác và tiêu chí nghiệm thu.
- [Space/Studio và chính sách xuất](SPACE_STUDIO_AND_AI_EXPORT_2026-11-03.md): bố cục, cách giao AI và tự xuất/chờ kiểm tra là ba lựa chọn độc lập.
- [Trạng thái triển khai và bằng chứng](BUILD_STATUS.md): phần đã kiểm chứng, phần đang làm và giới hạn còn lại; không suy ra đã triển khai chỉ từ đặc tả.

Xác nhận theo yêu cầu cập nhật tài liệu: phạm vi này bao gồm cả vị trí nút/menu, bố cục, luồng thao tác và trạng thái lỗi/đang xử lý/chưa lưu. Trước mỗi hạng mục, đối chiếu code VEK và bản đồ UI để chọn công cụ đang có; chỉ thêm điểm điều hướng nếu ghi rõ khoảng trống mà giao diện hiện tại chưa đáp ứng. Cập nhật tài liệu không đồng nghĩa phần giao diện đó đã được triển khai hoặc nghiệm thu.

| Nhu cầu đã chốt | Vị trí tích hợp | Quy tắc thực hiện |
|---|---|---|
| Ưu tiên edit như VEK, giữ HyperFrames | Home → setup → editor/preview/timeline/inspector hiện có | Mở rộng component và dịch vụ đang có trước khi thêm màn hình |
| Space và Studio | Bộ đổi bố cục trong cùng dự án | Chung project, revision, chat và job; đổi bố cục không giao việc lại |
| Gửi thư mục A-roll/B-roll NAS vào chat | Chat/setup → thẻ nguồn → picker/khảo sát dùng chung | Giữ đường dẫn, vai trò và lựa chọn; dùng cùng intake, không tạo màn NAS riêng |
| Phiên Codex/Claude hoặc worker API/CLI | Bộ chọn AI khi giao việc; cấu hình tại Kết nối | Một nơi quản lý kết nối; model theo khả năng adapter, độc lập bố cục |
| Tự xuất hoặc kiểm tra rồi xuất | Mặc định workspace → lựa chọn dự án/lượt giao | Snapshot chính sách vào job; xuất và đăng là hai lựa chọn riêng |
| Ảnh/video AI, voice, tư liệu và logo | Cảnh trám, Âm thanh, Thương hiệu, Thư viện hiện có | Chung kho tư liệu và cấu hình; logo sửa trong Thương hiệu/cùng chat |
| Mẫu/skill, tin tức, batch, phát hành, nhập dữ liệu | Theo bản đồ mục 2 của đặc tả UI | Phân loại đúng khả năng; không thêm menu trùng theo app nguồn/provider |

Chi tiết vị trí: đặc tả UI mục 2; component/file: mục 9; luồng: mục 11; tổng hợp: mục 38; cập nhật triển khai: mục 39–132. Checklist chống trùng: mục 15 của kế hoạch này. Trạng thái và bằng chứng dùng BUILD_STATUS.md; tài liệu thiết kế không chứng minh toàn bộ 127 nhóm đã hoạt động.

## 1. Tài liệu và phạm vi
Điểm đọc nhanh cho phần giao diện: mục 14–15 bên dưới và mục 38 của đặc tả UI. Các mục này tổng hợp các quyết định đã chốt; các mục 39–132 của đặc tả UI cập nhật chi tiết triển khai tiếp theo, gồm mẫu theo phiên bản, CSV/batch, kiểm đầu ra, điện thoại, model API, nhận diện workspace, thư viện nguồn, sửa clip audio, nhập dự án ba app phụ đề/voice/SFX/nhạc AIEV, vùng hạ nhạc, âm lượng từng đoạn và logo góc trong Thương hiệu/chat AI. Khi mô tả trạng thái cũ mâu thuẫn, dùng mục cập nhật mới nhất cùng bằng chứng trong BUILD_STATUS.md. Phần code đang làm nhưng chưa nghiệm thu không được tính là hoàn thành.
- Trạng thái thực tế: [BUILD_STATUS.md](BUILD_STATUS.md).
- Khảo sát giao diện gốc: [VEK_UI_UX_AUDIT_2026-11-03.md](VEK_UI_UX_AUDIT_2026-11-03.md).
- Đặc tả tích hợp giao diện để build: [UI_INTEGRATION_BUILD_SPEC_2026-11-03.md](UI_INTEGRATION_BUILD_SPEC_2026-11-03.md): vị trí từng nhóm chức năng, thành phần VEK dùng lại, bố cục, trạng thái và tiêu chí nghiệm thu; đọc trước khi thêm màn hoặc mục điều hướng.
- Space/Studio và xuất: [SPACE_STUDIO_AND_AI_EXPORT_2026-11-03.md](SPACE_STUDIO_AND_AI_EXPORT_2026-11-03.md).
- Danh mục nguồn: ../config/features.json (127 nhóm; không phải 127 nhóm đã hoạt động).
- Blueprint và migration gốc: D:/Edit tự động/chungauto-studio/docs/CONTENTOS_PRODUCT_BLUEPRINT_2026-11-03.md và các inventory liên kết.
- Mọi yêu cầu mới dưới đây đang ở trạng thái đặc tả/planned trừ khi BUILD_STATUS ghi bằng chứng kiểm chứng.

## 2. Các quyết định sản phẩm giữ nguyên
ContentOS phục vụ nhiều ngành/workspace/brand/kênh, dùng giao diện và lõi editor VEK thực tế, giữ HyperFrames composition/preview/render.
Sáu máy cài độc lập, dự án và cache local; NAS dùng chung tư liệu/đầu ra. Chưa cần đồng dựng hoặc chia render giữa các máy.
Mục tiêu 50–100 video/ngày tính cả bản gốc và các phiên bản. Ưu tiên quảng cáo + B-roll, tin tức, review YouTube.
Không tự thêm mục sidebar cho mỗi engine/provider hoặc mỗi nguồn media. Tìm điểm mở rộng trong VEK trước.
Giữ đầy đủ phạm vi ảnh/voice/video AI, mẫu/skill, thư viện, news, analytics, batch, migration, remote, publish và installer trong blueprint.

## 3. Ba lựa chọn độc lập trong một dự án
| Trục | Lựa chọn | Ý nghĩa |
|---|---|---|
| Giao diện | Space / Studio | Chat chỉ đạo AI + preview hoặc editor VEK + timeline |
| Cách thực thi AI | Phiên đang mở / API hoặc CLI | Dùng phiên Codex/Claude hiện tại hoặc worker qua kết nối đã cấu hình |
| Sau khi dựng xong | Tự xuất / Tôi kiểm tra rồi xuất | Tự tạo file final hoặc chờ người dùng kiểm tra và xuất |

Đổi giao diện không chạy lại việc, không đổi provider hoặc chính sách xuất. Không xây hai editor hoặc hai bản dữ liệu riêng.

## 4. Giao việc bằng đường dẫn NAS trong chat
### Trải nghiệm yêu cầu
Người dùng gửi yêu cầu tự nhiên kèm một hoặc nhiều đường dẫn thư mục/file A-roll và B-roll, ví dụ:
- A-roll: \\ChungAuto\Quay Dựng 2\DuAn\Aroll
- B-roll: \\ChungAuto\Quay Dựng 2\KhoCanhTram
- Dựng quảng cáo 45 giây, theo mẫu đã chọn, dùng cảnh sản phẩm phù hợp.

Ứng dụng nhận và giữ nguyên đường dẫn UNC có dấu/khoảng trắng; hỗ trợ đường dẫn local và ổ mạng ánh xạ khi máy chạy worker truy cập được.
Thẻ nguồn hiện vai trò A-roll/B-roll, đường dẫn, trạng thái kết nối và số media sau kiểm kê. Có thể sửa vai trò, thêm/bỏ nguồn ngay trong chat.
Không yêu cầu người dùng nhập đường dẫn lần nữa ở một màn khác. Chỉ hỏi rõ khi vai trò/đường dẫn không xác định được hoặc không truy cập.
B-roll dùng lại được theo workspace; nguồn riêng của lượt có ưu tiên và vẫn hiển thị rõ.

### Luồng
Chat → phân tích đường dẫn/ý định → xác minh truy cập trên máy thực thi → kiểm kê metadata có giới hạn → khảo sát footage → chọn media → lấy file cần dùng vào cache/proxy local → dựng cùng project → hoàn tất theo chính sách xuất.
Không tải toàn bộ NAS về và không ghi/sửa source gốc. Giữ provenance/checksum và liên kết nguồn, tái dùng intake service hiện có.
Thư mục lớn cần tiến trình/hủy/lọc/phân trang, không quét sâu vô hạn mỗi tin nhắn. Mất mạng phải báo file nào thiếu và thử lại.
Đường dẫn NAS là đường dẫn tài nguyên, không ghép vào shell như câu lệnh. Không tự xuất kho media sang dịch vụ ngoài; adapter AI chỉ nhận dữ liệu theo tác vụ/cấu hình đã chọn.
Danh sách nguồn gửi vào job cần snapshot để worker và người dùng cùng nhìn một tập nguồn.

### Giới hạn hiện tại

Video chính được chọn có nút đọc metadata thực (thời lượng, kích thước, codec, âm thanh) và xem 6 ảnh lấy mẫu có mốc thời gian trước khi sao chép. Khi mở lại setup, yêu cầu nguồn đã lưu được khôi phục nếu người dùng chưa nhập mới. Ảnh khảo sát đã được giữ trong dự án tạo từ Home và chép riêng vào job dựng mới có kiểm nguồn/checksum; inbox yêu cầu mở ảnh nhưng chưa kiểm chứng AI thật; chưa có shot log hoặc phân tích nội dung footage tự động, không dùng metadata/ảnh lấy mẫu để tuyên bố đã phân tích toàn bộ video.
Đã có browse/copy từ nasRoot cấu hình, nhận đường dẫn tuyệt đối A/B-roll trong Home/chat/setup, kiểm kê nông và snapshot nguồn theo việc sửa/dựng mới. Home tạo dự án từ một video chính trong nasRoot hoặc từ danh sách đường dẫn được dán: kiểm tra → chọn video → copy/probe/build → setup; đã thử đường dẫn local có dấu, chưa thử UNC trên NAS thật. Công cụ nhap-nguon-chat.mjs nhập file đã chọn từ snapshot qua storage service, có checksum/provenance, kiểm tra revision/generation/workspace. Chưa có khảo sát/chọn cảnh tự động hoặc ghép nhiều A-roll ngay lúc tạo. Không bỏ kiểm tra containment khi mở rộng nguồn.

## 5. Kết nối và lựa chọn AI
### A. Phiên Codex / Claude đang mở

Trạng thái triển khai: Home setup và chat đã dùng cùng hợp đồng lựa chọn phiên/CLI, pin agent theo việc. Home không còn dùng hộp hỏi chạy song song để tự đổi chế độ; chọn CLI trực tiếp tại AI thực hiện. Model CLI nhập tay có kiểm tra cú pháp và capability ở lúc chạy; API/model tự động còn trong lộ trình.
Dùng luồng inbox/giao việc của VEK; công việc hiện trong phiên người dùng đang dùng.
Hiển thị trạng thái đã cài/đăng nhập/đang chờ việc/không có phiên sẵn sàng.
Không giả định “đã đăng nhập CLI” đồng nghĩa “đang có phiên chờ”.
Model và quyền công cụ phụ thuộc phiên; app chỉ hiển thị/chỉ dẫn những gì thực sự biết, không đặt dropdown model không điều khiển được.
Nếu cần chuyển sang chạy ngầm, phải là lựa chọn rõ ràng của người dùng, không âm thầm thay cách thực thi.

### B. Worker qua API key hoặc CLI
Trong cùng bộ chọn AI thực hiện: loại kết nối → nhà cung cấp/tài khoản → model cụ thể hoặc Tự động.
CLI và phiên CLI đang mở là hai cơ chế khác nhau: worker CLI khởi chạy tiến trình riêng có nhật ký/hủy/trạng thái; không giả làm phiên chat hiện tại.
Danh sách model lấy từ adapter/provider đã cấu hình hoặc catalog được xác minh, đánh dấu khả năng/công cụ. Không hứa mọi model đều dựng trực tiếp được.
LLM chỉ lập kế hoạch/gọi công cụ; render vẫn chạy engine xác định trên máy. Model ngôn ngữ khác model tạo ảnh/video/voice.
API worker cần công cụ đọc metadata, tìm asset, tạo/sửa project, build, kiểm tra và enqueue render qua cùng dịch vụ; không chỉ gửi prompt rồi nhận text.
Kết nối lưu tập trung, scope workspace khi phù hợp; bí mật ở secret store, không nằm trong project, prompt, log hay tệp chia sẻ NAS.

### Tự chọn model
Dựa trên loại việc, khả năng gọi tool, context, chất lượng, tốc độ, ngân sách và kết nối đang có.
Có thể chọn model khác cho kịch bản/khảo sát/chỉnh sửa/kiểm tra khi các adapter hỗ trợ; không bắt buộc tách mọi bước thành nhiều lượt tốn token.
Hiện provider/model thực tế mỗi lượt và lý do chuyển. Fallback chỉ trong danh sách/cost policy cho phép; không chuyển từ phiên sẵn có sang API tính phí âm thầm.
Khóa lựa chọn hoặc giới hạn model theo workspace/run. Có trần chi phí/lượt gọi/thời gian/thử lại.
Chi phí API ước tính và thực tế tách rõ; CLI subscription không giả số USD/token nếu không có dữ liệu.

### Tối ưu token
Truyền project revision + phần thay đổi và asset manifest gọn, không lặp toàn bộ lịch sử/source.
Cache transcript, probe, shot log theo fingerprint; chỉ phân tích lại khi input/cấu hình liên quan đổi.
Lưu artifact trung gian và checkpoint có phiên bản; lỗi render không buộc chạy lại toàn bộ AI.
Theo dõi token khi provider trả số thật; số ước tính có nhãn riêng.

## 6. Chính sách hoàn tất và xuất
Mặc định yêu cầu cho lượt dựng mới: Tự xuất. Cho đổi thành Tôi kiểm tra rồi xuất trong Cài đặt → Dựng bằng AI, dự án và ngay trước giao việc.
Ưu tiên lựa chọn lượt > dự án > workspace; snapshot khi enqueue, thay cài đặt không đổi job đang chạy.
Tự xuất: dựng → kiểm kỹ thuật → enqueue render snapshot → probe file → Đã xuất.
Chờ kiểm tra: dựng → preview → Chờ kiểm tra → người dùng sửa → bấm Xuất.
Giữ bản dựng chỉnh được trong cả hai chế độ.
Tự xuất không đồng nghĩa tự đăng. Kênh/lịch/chính sách đăng là cấu hình riêng.
Chi tiết idempotency, revision, hủy/phục hồi và kiểm file theo tài liệu Space/Studio đã liên kết.

## 7. Luồng giao diện thống nhất
- Trang chủ VEK: thêm nguồn từ máy/NAS/điện thoại/Drive, chọn mẫu/skill, ghi yêu cầu, AI thực hiện, chính sách hoàn tất.
- Space: chat + preview, thẻ nguồn, mẫu/skill, cấu hình AI/model, tiến trình; Mở Studio.
- Studio: editor VEK, cùng project/revision/job; Nhờ AI sửa dùng cùng conversation/task service với Space.
- NAS/điện thoại chỉ là các nguồn trong media picker; không cần giữ màn chính độc lập cho mỗi nguồn.
- Mẫu dựng/preset/phong cách ảnh/prompt/skill là các đối tượng khác nhau, dùng chung thư viện nhưng có thao tác đúng.
- Tích hợp và Kết nối AI mở về một nơi cấu hình chính theo nhóm kết nối; không tạo store khóa/API riêng cho từng lối vào.
- Ảnh/voice dùng độc lập hoặc trong dự án đều gọi cùng module và lưu cùng asset catalog.

## 8. Ranh giới kiến trúc đề xuất
Tên module cụ thể sẽ chốt theo code hiện có; đây là trách nhiệm cần có, không phải file đã được tạo:
- Project/revision service: định danh dự án, optimistic concurrency, snapshot, lịch sử và context editor.
- Intake/source resolver: parser đường dẫn, nhiều nguồn A/B-roll, kiểm kê/probe/cache/provenance; mở rộng storage/mobile.
- Task orchestrator: persisted queue/checkpoint, cancel/retry, trạng thái, idempotency.
- AI adapters: active-session inbox, CLI workers, API tools; capability/model discovery, routing và usage.
- Composition/render: project.json → build/HyperFrames → output verification, không nhân đôi engine.
- Completion/publish policy: export artifact và tùy chọn đăng/lịch riêng.
- UI dùng cùng API/project context giữa Home, Space, Studio và công cụ ảnh/voice.

## 9. Lộ trình tích hợp
| Giai đoạn | Kết quả cần đạt |
|---|---|
| 0. Chuẩn hóa UI | Ánh xạ tính năng vào màn VEK; gộp lối vào NAS/điện thoại/catalog/cài đặt, không bỏ service đã có |
| 1. Nền dự án và job | Revision/context bảo vệ mọi đường ghi, queue/checkpoint, trạng thái/hủy/thử lại, render snapshot |
| 2. Chat + NAS + Space | Nhận UNC A/B-roll trong chat, kiểm kê/chọn nguồn thật, Space/Studio cùng dự án, giữ đường vào dựng nhanh VEK |
| 3. AI adapters | Phiên Codex/Claude và API/CLI, model/capability thật, tự chọn/fallback có ngân sách, tối ưu token |
| 4. Hoàn tất và xuất | Cài đặt mặc định/ghi đè; auto-export thật; manual-review thật; chống render lặp |
| 5. Công cụ sản xuất | Ảnh/voice/news/stock/skill/template ứng dụng vào bản dựng, batch/variant, thumbnail và phát hành |
| 6. Hoàn thiện toàn phạm vi | Migration dữ liệu, DAM/analytics/remote, installer/backup/update, hồi quy và benchmark nhiều máy |

Các giai đoạn 5–6 giữ toàn bộ tính năng trong blueprint, không coi bảng này thay thế feature register. Không đánh dấu full integration khi chỉ vài smoke test đạt.

## 10. Tiêu chí nghiệm thu bổ sung
- Dán UNC có dấu/khoảng trắng, nhiều thư mục A/B-roll: nhận đúng và worker truy cập được, lỗi đường dẫn rõ ràng.
- Khảo sát/chọn media thật, không bịa số file; source NAS không đổi; mở lại job vẫn có nguồn.
- Một job chạy được qua từng adapter được công bố hỗ trợ; model chọn tay có hiệu lực, auto có lý do/usage.
- Thiếu phiên/CLI/key/model/tool hoặc quá ngân sách: báo trạng thái thật, không giả thành công.
- Space↔Studio giữ nội dung/playhead/ngữ cảnh; chỉnh tay không bị AI đè revision mới.
- Tự xuất tạo file final thật; chờ kiểm tra không tự xuất final; cả hai không tự đăng ngoài lựa chọn.
- Restart/reconnect/callback lặp không tạo nhiều export hay nhiều bài đăng.
- Benchmark bằng tác vụ đại diện quảng cáo/news/review và biến thể; synthetic 3 giây chỉ là smoke.
- Test không dùng paid generator hoặc đăng công khai nếu chưa có tác vụ thực tế được giao.

## 11. Trạng thái phiên cập nhật
Đã gộp lối vào NAS/điện thoại tại Home, thiết lập và Cảnh trám; Space/Studio dùng chung editor và chat đã có kiểm tra trình duyệt. Chat có bộ chọn phiên Codex/Claude hoặc CLI riêng, pin agent theo việc và model CLI tùy chọn; chưa kiểm chứng agent thật chạy hoàn tất. Ảnh AI có module dùng chung trong Cảnh trám/thư viện/Ảnh bìa; voice mở lại công cụ VEK từ Âm thanh, có track thuyết minh chỉnh được. Kết nối ảnh/voice theo workspace dùng DPAPI; provider thật chưa được kiểm chứng.

Chính sách hoàn tất đã nối cho việc sửa qua chat và dựng mới từ Home: chờ kiểm tra hoặc tự xuất final, có smoke MP4 thật từ dữ liệu tổng hợp qua callback và inbox CLI. Bộ chọn Home đã kiểm tra trình duyệt ở 1280×720 và 1920×1080. Đã sửa lỗi thoát CLI trên Windows và chạy lại đạt. First-build mới có project candidate và kiểm base revision trước khi áp; media mới/helper-tool vẫn dùng thư mục dự án gốc, chưa cô lập toàn bộ thực thi. Worker LLM qua API, tự chọn model và phục hồi queue/render sau restart còn thiếu. Xem BUILD_STATUS cho bằng chứng và giới hạn; không coi các bước này là hoàn tất tích hợp ba app.

## 12. Phần tích hợp giao diện bắt buộc trong từng đợt build

Xung đột bản AI được xử lý tại thông báo lỗi của Home và lịch sử công việc AI trong editor, dùng chung hộp Đối chiếu bản AI. Có đối chiếu dữ liệu, tải JSON, giữ hiện tại hoặc áp toàn bộ bản AI kèm lịch sử; không tự xuất sau quyết định xung đột. Chưa có merge từng thành phần hoặc preview hai video cạnh nhau.

Cài đặt mặc định hoàn tất hiện được tích hợp tại Không gian làm việc → Dựng bằng AI trong Home VEK, dùng cùng store với chat/setup. Đây là điểm vào hiện hành, không thêm một màn Cài đặt dựng AI khác chỉ để lưu cùng giá trị. Chức năng chỉnh preset/thư mục xuất và ghi đè riêng dự án vẫn cần mở rộng theo đặc tả.

Áp dụng [đặc tả giao diện](UI_INTEGRATION_BUILD_SPEC_2026-11-03.md), đặc biệt mục 9 về file/thành phần và mục 10 về checklist nghiệm thu. Trước khi thêm mục điều hướng, đối chiếu bản đồ ở mục 2 của đặc tả; ưu tiên mở rộng điểm vào VEK đã có. Mỗi đợt bàn giao phải chỉ ra phần dùng lại, phần thêm, dữ liệu/service dùng chung và bằng chứng chạy thật. Các nhóm chức năng chưa có adapter chỉ ghi kế hoạch, không biến thành nút chạy giả.

Mục 11 của đặc tả chốt luồng thao tác Home → setup → Space/Studio → hoàn tất → phát hành làm chuẩn tích hợp. Đây là phần bắt buộc của kế hoạch build, cùng với vị trí chức năng ở mục 2, không phải bản mockup thay thế editor VEK.



Cập nhật news/voice 04/11: Home có dialog nguồn/kịch bản; đọc HTML qua adapter Studio, lưu dẫn chiếu, duyệt có phiên bản, gắn vào dự án và snapshot cho first-build/revise. Giọng nói AI dùng chung từ thẻ kịch bản và Âm thanh; nhận audio vào kho rồi chủ động thêm vào timeline VEK, giữ liên kết phiên bản và cảnh báo quá thời lượng. Đã kiểm bằng dữ liệu tổng hợp/fixture; chưa nghiệm thu provider thật, đọc báo công khai thành công, feed/AI draft/verify, tự ráp voice/B-roll hoặc tạo dự án chỉ từ tin. Xem mục 14–15 đặc tả UI và BUILD_STATUS.

## 13. Chốt tích hợp giao diện trong tài liệu build · 04/11/2026

Đặc tả UI là đầu vào bắt buộc của mỗi đợt build, không chỉ là bản tham khảo. Mục 2 ánh xạ chức năng vào vị trí VEK; mục 9 chỉ thành phần/file; mục 11 chốt hành trình người dùng; mục 15 bổ sung thao tác voice trên timeline. Không xây thêm editor, kho kết quả hoặc màn cài key riêng cho cùng chức năng.

Mỗi hạng mục cần ghi: nhóm feature từ inventory → điểm vào hiện có → thành phần mở rộng → service/store dùng chung → loading/rỗng/lỗi/phục hồi → tiêu chí và bằng chứng kiểm tra. Nếu thay vị trí đã chốt, cập nhật bản đồ UI trước khi thêm điều hướng.

Ba lựa chọn Space/Studio, AI thực hiện và chính sách hoàn tất luôn độc lập. Phiên Codex/Claude không có dropdown model mà ứng dụng không điều khiển được; API/model tự động chỉ công bố chạy khi adapter thật được kiểm chứng. Auto-export không bật đăng bài.

Tài liệu đã bao gồm vị trí cho toàn bộ nhóm nghiệp vụ ở mức bản đồ: media/NAS/phone/Drive, template/skill, ảnh/video/voice AI, news, DAM, brand, batch/variants, thumbnail/nội dung, đăng/lịch/analytics, migration và cài đặt. Chưa phải nghiệm thu toàn bộ 127 nhóm. Những adapter hoặc luồng chưa có vẫn phải được triển khai theo phạm vi đầy đủ, không thay bằng nút minh họa.

## 14. Tổng hợp tích hợp giao diện hiện hành · 04/11/2026

Phần tích hợp giao diện là yêu cầu bắt buộc của build, không chỉ là trang preview. Giữ bố cục editor VEK đã khảo sát: công cụ và bảng nội dung bên trái, preview bên phải, timeline phía dưới. Áp dụng bản đồ chức năng ở mục 2, bản đồ thành phần ở mục 9 và hợp đồng luồng ở mục 11 của đặc tả UI.

| Điểm thao tác | Tích hợp đã chốt | Phần phải tiếp tục nghiệm thu/phát triển |
|---|---|---|
| Home → thiết lập | Nguồn local/NAS/điện thoại, mẫu/skill, yêu cầu, AI thực hiện, chính sách hoàn tất trong luồng VEK | NAS thật, Drive, nhiều nguồn và lựa cảnh tự động; không làm wizard riêng theo provider |
| Space ↔ Studio | Cùng project/revision, chat, preview và việc AI; Studio giữ chỉnh tay/timeline VEK | Tính liên tục playhead/selection/unsaved edits và phục hồi sau ngắt; không tạo editor thứ hai |
| Chat giao việc | Đường dẫn A-roll/B-roll thành thẻ nguồn; chọn phiên Codex/Claude, CLI hoặc API có adapter | Phân tích footage/ngữ nghĩa, skill đầy đủ, auto-model có ngân sách và nghiệm thu agent thật |
| Cảnh trám / Âm thanh / Văn bản | Dùng chung module ảnh, voice, tư liệu; nhận kết quả rồi chèn vào track VEK | Video AI/mask, căn lời tiếng Việt và chất lượng provider thật; không tạo kho/key trùng |
| Thư viện / Nguồn tin & Kịch bản | Catalog tham khảo, phiên bản phong cách/prompt, nguồn và kịch bản duyệt; gắn vào dự án | Skill thực thi, DAM/search/quyền dùng, feed và kiểm chứng nội dung |
| Dự án → Bản mới | Biến thể chỉnh được, lô phiên bản và lịch sử; xuất final lô dùng pipeline HyperFrames chung | Smart reframe, CSV/nhiều dự án, phục hồi tiến trình và benchmark sản xuất |
| Xuất / Ảnh bìa / Mạng xã hội | Bộ nội dung riêng kênh, AI soạn nháp rồi lưu, ảnh bìa đã lưu, lịch gắn video và ảnh theo hash | Upload nền tảng thật, giới hạn từng kênh, chống giao/đăng lặp và lưu gói bất biến |
| Không gian làm việc / Kết nối | Mặc định hoàn tất và kết nối dùng chung; lối tắt mở cùng cấu hình | Hợp nhất scope kênh/lịch, auto-routing, ngân sách tiền và installer độc lập đầy đủ |

Các phần đã có mã/kiểm thử ở bảng này chỉ là từng lát tích hợp; không đồng nghĩa đã nghiệm thu toàn bộ luồng. API LLM dựng/sửa cơ bản, batch phiên bản/render, news/voice và bộ phát hành đã có triển khai giới hạn; các câu cũ ghi chúng hoàn toàn planned được thay bằng trạng thái chi tiết trong BUILD_STATUS và mục 14–37 đặc tả UI.

Ba lựa chọn vẫn độc lập: Space/Studio là bố cục; phiên/API/CLI là thực thi; Tự xuất/Chờ kiểm tra là chính sách hoàn tất. Mặc định đích là Tự xuất, nhưng bộ cài/cấu hình hiện hành phải được kiểm tra trước khi công bố đã đáp ứng mặc định. Tự xuất không cấp quyền đăng; bình luận là bản nháp, không tự gửi.

Nghiệm thu giao diện phải đi từ nút thật ở Home/editor, qua thiết lập → giao AI → chuyển Space/Studio → sửa/lưu → xuất → chuẩn bị phát hành; kiểm cả 1280×720 và 1920×1080, trạng thái rỗng/loading/lỗi/hủy/reload/xung đột. Test mở trực tiếp module chỉ chứng minh module đó, không thay thế kiểm đường vào thật. Mỗi tính năng cần ánh xạ tới ID trong config/features.json trước khi đánh dấu hoàn tất; bản đồ nhóm không chứng minh đủ từng tính năng của ba app.



Nhận diện theo lượt AI: xem mục 51 đặc tả UI. Dùng cùng checkbox tại setup/chat và mặc định từ Thương hiệu; job chốt phiên bản riêng, candidate giữ CSS mẫu. Đã kiểm service/HTTP/inbox và payload UI; chất lượng thị giác và agent thật còn phải nghiệm thu.

Ảnh AI: mục 52 đặc tả UI yêu cầu kiểm probe/giải mã toàn bộ lô trước khi lưu catalog; phản hồi lỗi phải giữ kết quả cũ và không tự gửi lại gateway.

Hủy tạo ảnh: mục 53 đặc tả UI chốt nút hủy/đóng dialog trong cùng công cụ, AbortSignal xuyên HTTP/gateway/kiểm ảnh và thông báo chi phí chưa chắc chắn. Chưa có hủy bền vững/provider-side job cancel.

Âm thanh: mục 54 đặc tả UI bổ sung hạ nhạc theo vùng clip thuyết minh trong Audio VEK; đã đo MP4 tổng hợp, cần tiếp tục envelope mượt/preview/nghe thật và loop trước nghiệm thu âm thanh sản xuất.

Mục55 bổ sung duckFade0–2s qua lớp nhạc đồng vị trí nguồn/fade HyperFrames. Đã render đo chuyển mức trung gian, chưa nghiệm thu loop/phát preview/giọng thật.

CapCut: mục56 chốt giữ timing/fade/rate từ HTML qua bộ trộn dùng chung và sửa lệnh FFmpeg9; gói synthetic đã xuất/đo audio, chưa nghiệm thu nhập CapCut thật hoặc mọi loại gói.

Mục57: gói CapCut tách nhạc/thuyết minh/SFX/tiếng cảnh trám theo nhóm, giữ cùng mốc0 và manifest/hướng dẫn. Đã đo gói nhạc/voice thực tổng hợp; SFX/B-roll và import CapCut thật tiếp tục nghiệm thu.

Mục58: setup xem SKILL.md/hash/preset capability tại thẻ mẫu hiện có; thông tin thực tế dùng chung API preset adapter. Chưa thay thế thư viện skill thực thi hay kiểm chất lượng agent.

Mục59: worker API đọc transcript theo start/end/query với nextOffset trong tập lọc, giảm dữ liệu khi sửa đoạn. Chưa có đo token/USD hoặc tối ưu toàn lịch sử/read_project.

Mục60: read_project fields chọn nhóm cần sửa, không cắt mảng; giữ dữ liệu nhóm không ghi. Chưa nén lịch sử hoặc đo token thực/provider.

Mục61: API read_edit_item/patch_edit_item sửa thuộc tính theo ID và version, giữ sibling; vẫn dùng shared validation/revision. Full endpoint/render bằng gateway tổng hợp đã có bằng chứng ITEM_PATCH_API_SMOKE.json. Chưa patch blocks/audio nested/batch hoặc đo token thật.

Mục62: đã nối lựa chọn thành phần trong Studio vào context worker API, phân giải group/id/version từ candidate tại server; gateway tổng hợp nhận đúng selection và xuất final thật. Dùng cùng chat VEK; nghiệm thu đường vào thật, lỗi lựa chọn cũ và hai kích thước màn hình trước khi đánh dấu hoàn tất.

Mục63: bộ chọn NAS dùng chung có tìm tên/loại trong thư mục, phân trang sau lọc và chống phản hồi cũ. Duplicate reuse phải kiểm hash local. Đã kiểm service và Home→setup tổng hợp1280/1920; index NAS toàn kho/DAM/quyền dùng vẫn trong phạm vi tiếp tục.

Mục64: Thông tin file trước nhập tại source picker dùng shared probe với nguồn dán chat. Đã kiểm service video/ảnh/audio và browser Home→metadata→setup; preview/index/NAS thật tiếp tục phát triển.

Mục65: source picker có native preview và endpoint media range scoped theo workspace/root; kiểm video và byte-range1280/1920. Playback đầy đủ/ảnh/audio UI/NAS thật và stream revocation còn cần nghiệm thu.

Mục66: nhập nhiều tư liệu ở picker hiện có, tuần tự/max50/giữ lựa chọn/hiện kết quả từng file, dừng sau file hiện tại.86tests và browser nhập2file xuyên thư mục đạt; chưa durable batch/resume/NAS tải lớn.

Mục67: tìm tên xuyên thư mục con trong picker dùng chung, bounded async scan và báo thiếu kết quả khi chạm cap. Đã kiểm nested search→multi-import ở1280/1920; persistent index/tìm metadata/quyền dùng/benchmark NAS vẫn cần triển khai.

Mục68: nhãn/ghi chú/quyền khai báo ở picker nguồn, versioned local workspace và snapshot khi nhập mới.88tests/browser1280/1920 đạt; search tags/sync/quyền theo kênh/hạn dùng và enforcement tiếp tục.

Mục69: tìm theo nhãn/quyền khai báo trong current-folder/recursive source picker, nguồn đổi chuyển effective-rights thành unknown. Kiểm browser save→filter→import1280/1920; index/sync/rights enforcement còn trong phạm vi tiếp tục.

Mục70: xem imported-source history trong picker, dùng source-assets local đã có; hiển thị snapshot quyền/nhãn và presence-size.88tests/browser1280/1920 đạt; hợp nhất mọi manifest/hash check/quyền mới nhất còn phải phát triển.

Mục71: hợp nhất source/phone/voice manifests theo path trong history, ghi provenance cho image attach mới và giữ phone metadata khi tạo variant.89tests, browser aggregation fixture1280/1920; E2E đa nguồn/provider và asset DB tiếp tục.

Mục72: kiểm SHA256 tư liệu từ history chung, shared async verifier và post-await context guard, không restamp file thay đổi.90tests/browser1280/1920 match+same-size tamper đạt; auto-QC/export gate/largeNAS còn cần phát triển.

Mục73: worker API đọc provenance từ cùng history dự án bằng công cụ scoped, bỏ NAS root, guard semantic snapshot;91tests+actual endpoint/gateway/finalMP4 tổng hợp đạt. Chưa tự chọn cảnh/ngữ nghĩa/rights enforcement hoặc benchmark token.

Mục74: API list/inspect audio local rồi chèn clips vào timeline chung, validate thời lượng/âm lượng/ID;92tests và actual finalMP4 đo tone đúng cửa sổ đạt. Voice/model thật và audio schema toàn diện tiếp tục.

Mục75: nút AI sửa từng clip tại Âm thanh, shared chat selection và versioned audio.clips patch; service/browser1280/1920 đạt. Full HTTP/render patch audio và agent thật còn cần nghiệm thu.

Mục76: chọn audio timeline→chat chung, click/Enter handler/browser1280/1920; actual audio item patch→MP4 đo tone đạt qua gateway tổng hợp. Real voice/model/drag/playback tiếp tục.

Mục77: nhập catalog AIEV chọn từng mục tại Thư viện hiện có, phân biệt bản đã có và pin fingerprint/workspace sau xem trước;94tests và browser Home→nhập một mục1280/1920 đạt. Đây chưa phải migration toàn bộ dự án/media/kênh/lịch sử của ba app.

Mục78: Cài đặt workspace có khảo sát metadata dự án VEK/AIEV/Studio qua cùng màn Nhập dữ liệu, phân biệt schema và báo adapter còn thiếu.95tests/browser1280/1920 đạt; chưa sao chép dự án hoặc chuyển composition/job sang timeline. Đường dẫn jobs Studio tùy chỉnh cần studioJobsRoot trong sources.local.json.

Mục79 thay trạng thái VEK ở mục78: nút sao chép VEK dùng chung bộ copy/build biến thể, pin workspace/config/revision, tạo project riêng và provenance;96tests/browser1280/1920 và finalMP4 tổng hợp3s đạt. AIEV/Studio vẫn cần adapter, migration bền vững/dedup/rollback và nghiệm thu dự án sản xuất còn thiếu.

Mục80: chuyển timeline AIEV loại footage cắt cùng nguồn sang segments VEK, probe/bounds/provenance và UI Cài đặt chung;98tests/browser1280/1920+finalMP4 tổng hợp1.8s đạt. Từ chối các track/effect chưa ánh xạ thay vì bỏ mất. Chuyển đầy đủ composition/audio/layer và Studio còn trong phạm vi tiếp tục.

Mục81: composition native Studio cùng schema VEK được nhập từ05_plan/studio/composition/project.json, pin hai hash job/project, dùng chung nút Cài đặt/service copy/build;99tests/browser1280/1920+MP4 tổng hợp3s đạt. Job Studio edit-plan cũ, effect compatibility, media ngoài composition và migration production vẫn chưa nghiệm thu.

Mục82: model API cho dựng mới/sửa theo quy tắc workspace trong Kết nối LLM dùng chung, ưu tiên lựa chọn mỗi lượt và chốt model khi giao việc;100tests, revise gateway/render tổng hợp và dialog save/reload1280/1920 đạt. Chưa tự xác minh capability/tối ưu USD/fallback hoặc routing các tác vụ khác; không ảnh hưởng session/CLI.

Mục83: nối thêm news-draft/publish-draft vào cùng quy tắc model; news pin tại enqueue và giữ sau khi đổi policy, publish trả metadata model/routing trong nháp.101tests/gateway HTTP tổng hợp và dialog save/reload1280/1920 đạt. Chưa generation từ browser/provider thật, capability/chi phí/fallback hay routing ảnh/voice.

Mục84: phụ đề thường AIEV ánh xạ frame output→mốc nguồn thành text chỉnh được;102tests, nhập UI1280/1920 và render1.8s/ảnh cue qua điểm cắt đạt tổng hợp. Kiểu chữ đổi sang ContentOS được báo trong preview; karaoke/style/transform/source lặp và mọi fidelity sản xuất còn cần tích hợp.

Cài đặt độc lập: installer/setup.ps1 hiện có bootstrap Node Windows x64 có SHA256, cài dependency còn thiếu qua service dùng chung, kiểm môi trường rồi mở ContentOS5180; không gọi installer VEK gốc. Đã thử đường chạy lại trên máy phát triển,93tests đạt. Nghiệm thu máy Windows sạch, tải gián đoạn, gói offline, cập nhật/shortcut/startup còn trong phạm vi tiếp tục; xem LOCAL_INSTALLATION.md và BUILD_STATUS.md.

## 15. Kiểm tra tích hợp trước mỗi đợt build giao diện · 04/11/2026

Phần tích hợp UI/UX đã thuộc phạm vi build chính thức. Dùng editor VEK thật làm nền; bản preview chỉ tham khảo thiết kế. Các quyết định dưới đây áp dụng cho tính năng từ cả ba app và mọi ngành/workspace.

| Quyết định cần kiểm tra | Yêu cầu khi triển khai |
|---|---|
| Có sẵn công cụ tương đương? | Tra bản đồ UI mục 2 và code hiện hành; mở rộng điểm vào đó trước. Muốn thêm menu phải ghi rõ nhu cầu chưa được đáp ứng. |
| Dữ liệu và cấu hình có trùng? | Setup, chat, editor và công cụ độc lập dùng cùng service/store phù hợp; không tạo thêm nơi nhập key, kho kết quả hoặc timeline cho cùng chức năng. |
| Bố cục hay cơ chế chạy? | Space/Studio chỉ đổi bố cục trên cùng dự án. Phiên Codex/Claude, CLI, API/model là lựa chọn thực thi riêng; tự xuất/chờ duyệt và đăng/lên lịch cũng riêng. |
| Kết quả đi vào đâu? | Ảnh/video AI về tư liệu/Cảnh trám; voice về Âm thanh; phụ đề về công cụ chữ; mẫu/skill về thư viện và setup; lịch/kênh về Mạng xã hội. Giữ thao tác xem trước, chèn, lưu, xuất có ý nghĩa riêng. |
| Chỉnh tay có được giữ? | Ghi rõ project/workspace/revision, bản chưa lưu, lựa chọn và job đang chạy; lỗi/xung đột phải có cách xử lý, không tự ghi đè. |
| Đã nghiệm thu hay mới thiết kế? | Ghi feature ID trong config/features.json, điểm vào, file/component, service/store, trạng thái rỗng/loading/lỗi/hủy/thử lại và bằng chứng tương ứng trong BUILD_STATUS. Chưa kiểm phải ghi rõ. |

Hành trình nghiệm thu: Home → nhập/chọn nguồn hoặc dán A-roll/B-roll → setup mẫu và yêu cầu → chọn AI và cách hoàn tất → Space/Studio → xem/sửa → xuất → chuẩn bị nội dung và phát hành nếu đã chọn. Kiểm tra cả 1920×1080 và 1280×720; phân biệt fixture local với NAS, điện thoại, provider và nền tảng đăng thật.

Các nhóm nhập dữ liệu và model routing mới nhất tiếp tục dùng Cài đặt/Kết nối hiện có theo đặc tả UI mục 77–84. Voice-over AIEV đang phát triển chưa được tính là đã nghiệm thu trong lần cập nhật tài liệu này. Toàn bộ 127 nhóm vẫn giữ nguyên phạm vi; mục này không xác nhận đã hoàn tất tích hợp ba app.

Cập nhật UI mục85: voice-over AIEV nhập thành audio.clips trong Âm thanh VEK, giữ tiếng nguồn đồng nhất và giới hạn theo file voice/timeline.104tests cùng nhập trình duyệt1280/1920 và MP4 final tổng hợp có đo âm đúng thời gian đã đạt; nhạc/SFX và mức tiếng từng cảnh chưa chuyển. Không cần thêm menu hoặc kho voice riêng.

Cập nhật UI mục86: SFX AIEV nhập vào audio.clips dùng chung Âm thanh, giữ mốc frame, gain và mediaStart; probe/cap theo audio thật.105tests và browser1280/1920→finalMP4 có đo tiếng động đúng cửa sổ đạt. Fade/nhạc/loop/ducking AIEV chưa chuyển; không thêm menu.

Cập nhật UI mục87: Fade vào/ra audio trong Âm thanh VEK, builder và CapCut dùng chung tags; API patch có validation. SFX AIEV fade đơn giản đã nhập được, các fade chồng nhau/ra ngoài timeline từ chối rõ.106tests, UI1280/1920 lưu thật và MP4 tổng hợp đo envelope đạt; preview playback trực tiếp/CapCut UI chưa nghiệm thu.

Cập nhật UI mục88: Nhạc nền có lựa chọn Nối mượt VEK/Lặp liền mạch và fade timeline, dùng chung dữ liệu/engine. AIEV music không có speech ducking đã nhập được với loop/gain/fade.108tests, UI1280/1920 Save và finalMP4 tổng hợp3vòng đạt. Speech ducking và repeat+duckNarration còn thiếu; không coi là hoàn tất âm thanh AIEV.

Cập nhật UI mục89: Nhạc AIEV có music.speech đã chuyển vào cùng Âm thanh, giữ vùng đầu ra/mức hạ có thể sửa và Save. Ramp0.4giây theo AIEV, envelope thích nghi tuyến tính có giới hạn sai số (không sample-identical).110tests, UI1280/1920 và finalMP4 tổng hợp đo mức20.02%/hồi phục đạt; CapCut stem encode đo mức20% đạt. Kéo vùng timeline và tự lấy vùng từ voice chưa hoàn tất.

Cập nhật UI mục90: Lặp liền mạch đã dùng được Hạ nhạc theo clip qua cùng cửa sổ audio được probe. Bật ưu tiên clip/duckLevel/duckFade, tắt phục hồi vùng khai báo giữ nguyên.112tests; UI1280/1920 Save và render fixture riêng đo20.003% đạt; chưa có một test UI-checkbox→export liền mạch. Chưa phân loại speech/SFX hoặc phát hiện im lặng.

Cập nhật UI mục91: Âm thanh có dòng sửa từng vùng lời nói, thêm ở playhead/xem vị trí/xóa/Áp dụng và dùng Save chung; JSON chuyển vào Nhập vùng nâng cao. Browser1280/1920 kiểm thêm/sửa/từ chối/xóa/reload đạt;112service tests vẫn đạt. Kéo vùng trên timeline và giữ draft chưa áp dụng khi đổi tab vẫn chưa hoàn tất.

Cập nhật UI mục92: Inspector đoạn cắt VEK có gain riêng0–2, nhân gain tổng; timemap/build giữ biên khác gain. AIEV cảnh khác mức/muted đã nhập được thành segment.audioVolume.113tests, Settings import1280/1920→MP4 tổng hợp đo tỷ lệ3× cho25%/75%, inspector35%Save/reload ở hai kích thước đạt. Preview audio/split/speed và sản xuất vẫn cần nghiệm thu.

Cập nhật UI mục93: sửa lỗi adapter AIEV có thể đổi thứ tự cảnh nguồn do VEK sort source.in. Khảo sát/import giờ báo cảnh lỗi và từ chối timeline đảo/lặp/overlap, watermark chưa ánh xạ; browser1280/1920 đã kiểm. Đây là chặn bản nhập sai; adapter giữ đúng thứ tự/scene identity và watermark vẫn phải phát triển trong phạm vi đầy đủ.

Cập nhật UI mục94: Logo góc nhập AIEV vào project.watermark, chỉnh tại Thương hiệu VEK (media/góc/cỡ/lề/opacity/ẩn), cùng Save/intake.115tests, Settings import1280/1920→MP4 tổng hợp có pixel logo và UI Save/reload đạt. SVG/GIF, preset workspace/CapCut/AI patch và tất cả khung hình chưa nghiệm thu.

Cập nhật UI mục95: Chat API đọc/sửa trường watermark bằng validator chung, yêu cầu inspect_media khi chọn ảnh logo mới.116tests và endpoint sửa thật→candidate→finalMP4 tổng hợp có pixel xác nhận logo chuyển góc đạt; chưa kiểm browser chat/model thật hoặc đổi ảnh mới qua endpoint.


Mục96 đặc tả UI: logo trong gói Bản sửa CapCut dùng ảnh riêng và manifest vị trí, bỏ logo khỏi video nền/lớp đồ họa để chỉnh tiếp. Gói fixture thực và118tests đạt; chưa nhập CapCut thật hoặc kiểm lớp alpha. Không thêm màn giao diện, không coi đây là hoàn tất migration hay toàn bộ tích hợp.


Mục97: logo vào mặc định workspace tại Thương hiệu, ảnh copy theo hash và pin theo lượt AI;120tests + HTTP lưu/áp hai dự án đạt. Không thêm màn mới. Tiếp tục nghiệm thu UI Save/reload và job/render; chưa phải hoàn tất nhận diện, migration hoặc127nhóm.


Nghiệm thu bổ sung mục97 đã có: nút Thương hiệu→Save/reload tại1280/1920 và revise opt-in brand→gateway tổng hợp→finalMP43s. Xem BRAND_LOGO_BROWSER_SMOKE.json và BRAND_LOGO_JOB_RENDER_SMOKE.json. First-build logo endpoint/model thật/toàn frame vẫn cần kiểm; không suy ra hoàn thành toàn phạm vi.


Mục98: fade vào/ra tiếng gốc từng đoạn tại inspector VEK; cùng timemap/build/API và nhập fade cảnh AIEV.121tests, actual Settings import→MP4/đo PCM và inspector Save/reload1280/1920 đạt; fade overlap, mọi split/speed và preview nghe thật tiếp tục nghiệm thu.


Mục99: nhập speed cảnh AIEV vào segment/timemap VEK, quy đổi mốc phụ đề/SFX và duration voice.123tests + Settings1280/1920→MP43s speed2/.5 đạt. Fractional-frame rounding, đa nguồn/đảo lặp và full frame/audio fidelity chưa hoàn tất; giữ phạm vi đầy đủ.


Mục100: cover/contain theo clip trong inspector VEK, chuyển fit AIEV qua timemap/build/API.124tests và Settings→MP4 pixel/inspector Save/reload1280/1920 đạt; matte/beauty/freeze/dissolve/camera geometry vẫn cần tích hợp/kiểm, không thu hẹp phạm vi127nhóm.


Mục101: crop nguồn bốn cạnh tại inspector VEK, chuyển AIEV qua timemap/build/API.126tests + Settings1280/1920→MP4 marker đỏ loại bỏ đúng và crop control Save/reload đạt. Crop trực quan/mọi geometry hiệu ứng tiếp tục thực hiện; không coi đã tích hợp toàn bộ.


Mục102: transform từng clip tại inspector, chuyển AIEV và API/build dùng chung.127tests; Settings→render flipH và nút Save/reload1280/1920 đạt. Số test không phải số nhóm đã hoàn thành; mọi numeric transform/geometry hiệu ứng/127nhóm vẫn cần tiếp tục nghiệm thu.


Mục103: màu riêng từng clip và14preset AIEV trong inspector; shared importer/timemap/API/build.128tests + Settings→MP4 saturation và UI Save/reload1280/1920 đạt; SVG matrix/mọi preset/effect combination tiếp tục nghiệm thu. Full127nhóm vẫn trong phạm vi.


Mục104: zoom keyframe theo clip tại inspector và import AIEV; shared validator/API/build/GSAP.129tests, Settings→MP4 marker zoom2x và inspector thêm/sửa/Save/reload1280/1920 đạt; interpolation/effects/CapCut/keyframe kéo thả chưa nghiệm thu. Full127nhóm không thay đổi.


Mục105: importer/builder/timemap hỗ trợ nguồn riêng từng clip AIEV, mốc timeline ảo + mediaStart.130tests + Settings1280/1920→MP4 hai nguồn đạt; transcript/thumbnails/waveform/clean/matte/freeze/dissolve đa nguồn chưa hoàn thiện. Giữ tất cả trong phạm vi tiếp tục, không kết luận multi-source editor đầy đủ.


Mục116: xem trước nguồn ngay trong dialog thêm A-roll của Cắt/Cảnh trám: phát, tua và lấy mốc Vào/Ra, phát đoạn chọn theo tốc độ. Dùng chung append helper, Apply/Save/Undo; không thêm editor/menu. PRIMARY_RANGE_PREVIEW_BROWSER_SMOKE.json kiểm hai kích thước, guard revision và final3.5s với nguồn đổi màu theo thời gian.145tests đạt; codec/NAS thực/file dài và hiệu năng vẫn chưa nghiệm thu.


Mục117: Home nhận tối đa20 A-roll từ đường dẫn đã kiểm kê, checkbox theo thứ tự, chung intake/storage/probe/append helper.146tests và HOME_MULTI_AROLL_BROWSER_SMOKE1280/1920→3clip→final4.2s có pixel xanh lá/đỏ đạt. Cắt clip ngắn vẫn một nguồn; NAS vật lý/tự chọn cảnh/hủy/throughput chưa nghiệm thu.


Mục118: API read_transcript dùng clock candidate đã chốt, giữ provenance file và chặn lời cũ; phiên AI có CLI --check-transcript và hướng dẫn nhiều nguồn.148tests + API_TRANSCRIPT_CLOCK_SMOKE real HTTP/synthetic gateway xác nhận đúng/hết hạn/chờ duyệt không render. Source-byte checksum/tự ASR trong API/model thật chưa nghiệm thu.


Mục119: inspector Video đổi thứ tự lên/trước/sau qua shared primary-sequence.js và API reorder_primary_clips, chuyển anchor/caption/audio; Undo/Save hiện có.151tests + PRIMARY_SEQUENCE_BROWSER_SMOKE1280/1920→final2s pixel cảnh đỏ đầu đạt. Sửa conflict giả do phản hồi timeline cache cũ. Nhạc/vùng hạ nhạc giữ mốc đầu ra, nội dung băng điểm nối cần review; ripple insert/delete/drag và đầy đủ127nhóm tiếp tục.


Mục120: Thêm A-roll vào bản dựng dùng cùng dialog có vị trí Cuối/Trước đoạn; helper/API append hỗ trợ beforeId, dùng reorder chung và trả addedIds.152tests + PRIMARY_INSERT_BROWSER_SMOKE1280/1920 final4s xanh/đỏ/xanh; API_PRIMARY_INSERT_SMOKE real revise/synthetic gateway auto2s pixel/tone đạt. Chèn playhead/split, NAS vật lý và full127nhóm tiếp tục.


Mục121: cùng dialog chọn playhead snapshot, quy đổi timemap và tự split phần nguồn giữ; API atSource dùng helper chung với beforeId loại trừ.153tests, PRIMARY_PLAYHEAD_BROWSER_SMOKE1280/1920 clip2×→final2.5s và API_PRIMARY_PLAYHEAD_SMOKE endpoint/gateway tổng hợp→2s xanh/đỏ/xanh/audio. Full-frame/audio continuity/NAS/model thật/full127nhóm vẫn tiếp tục.


Mục122: Home chọn ngôn ngữ và first-build API tự chuẩn bị lời thoại local trước model, dùng lại clock/language phù hợp; progress chung, revision/cancel guard. Legacy ASR atomic staging giữ kết quả cũ.155tests, FIRST_BUILD_ASR_API_SMOKE real Whisper/en→model giả11từ, browser payload ngôn ngữ và multi-source endpoint proof; quality tiếng Việt/ASR restart/full127nhóm vẫn tiếp tục.


Mục130: thư viện ảnh workspace dùng chung qua inbox phiên/CLI dựng mới và sửa: anh-workspace.mjs list/attach, pin metadata/hash theo job, kiểm candidate/revision/workspace/lifecycle, giữ project gốc.161tests và SESSION_WORKSPACE_IMAGES_SMOKE endpoint/CLI thật đạt với ảnh tổng hợp; chưa agent thật/candidate completion/render/rollback asset/NAS. Không thêm màn/kho/kết nối riêng.


Mục131: mở rộng smoke phiên/CLI ảnh đến ai-inbox --done thật, awaiting-review không tự render, rồi xuất final có revision/pixel kiểm chứng. Chỉ dữ liệu tổng hợp và candidate do harness viết; không nghiệm thu agent thật hoặc toàn bộ127nhóm. Xem SESSION_WORKSPACE_IMAGES_SMOKE.json.


Mục132: Nhập dữ liệu có Xem thêm ảnh AIEV, cursor theo danh mục và vai trò, nhập trực tiếp ID/hash cho cả trang sau; giữ kết quả nhập cũ.162tests + browser1280/1920 kho tổng hợp206ảnh đạt. Đọc danh sách thư mục/hashing còn đồng bộ; chưa NAS lớn/background scan. Full127nhóm tiếp tục.
## Cập nhật hiện hành: nhiều phiên dựng và Hoạt động · 04/11/2026

Đọc [Hoạt động và dựng nhiều video](ACTIVITY_MULTI_EDIT_UX_2026-11-04.md) trước khi triển khai tiếp giao diện. Tài liệu chốt bốn nhóm hàng đợi/đang chạy/cần kiểm tra/lịch sử, thông tin mỗi việc, thao tác theo khả năng backend, phân biệt chat vừa liên lạc với worker được xác minh và chính sách xuất riêng với đăng. Người dùng mở nhiều chat Codex/Claude cùng worker CLI/API độc lập; quota nền không giới hạn số chat. Mỗi máy chạy riêng, NAS chia sẻ tư liệu. Bản cập nhật này chỉ sửa tài liệu, không triển khai giao diện hay xác nhận toàn bộ tích hợp hoàn tất.

## Ưu tiên lõi edit theo rà soát 04/11/2026

Đọc [Rà soát edit tự động, âm thanh và preset](AUTO_EDIT_UX_AUDIO_PRESETS_AUDIT_2026-11-04.md) trước khi thêm tính năng ngoài editor. Ưu tiên điều tra preview đen, bố trí lại Âm thanh/nhập nhạc/lane nhạc, hợp đồng chọn nhạc cho AI, lưu preset và phiên bản mẫu/skill; đồng bộ Space/Studio. Nhạc nền và lưu mẫu cơ bản đã có code nhưng khó tìm và chưa đầy đủ nghiệp vụ. Đây là yêu cầu và khảo sát tĩnh, không phải nghiệm thu tính năng mới.

