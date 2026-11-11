# Rà soát lõi edit tự động, âm thanh và mẫu dùng lại

**Cập nhật ChungAuto Creative v4 · 04/11:** [Khảo sát dự án Q2, đánh giá edit và skill v4](CHUNGAUTO_CREATIVE_Q2_SKILL_V4_AUDIT_2026-11-04.md) chốt ước lượng lõi edit55–60%, phân tích nhiệm vụ app/skill và phương án tùy chọn màu/biển số/watermark/outro/nhạc/SFX. Mẫu v4 đã cài riêng, v3 giữ nguyên; mới nâng quy tắc, chưa thêm policy UI/backend, tracking hay engine grade. First-build inbox hiện vẫn gỡ camera.color/beauty; cần opt-in snapshot trước khi nhận tự grade hoàn chỉnh.


> Đồng bộ tài liệu 04/11/2026: đọc [điểm hiện hành và bản đồ build](BUILD_CURRENT.md) trước các mốc lịch sử. Mọi thay đổi UI phải theo [quy chuẩn thiết kế và quy trình UX/UI](DESIGN_UX_STANDARD.md): phân tích trải nghiệm, đối chiếu giao diện sẵn có và tham khảo ứng dụng phù hợp trước thiết kế/code. Trạng thái triển khai chỉ được xác nhận bằng bằng chứng đúng phạm vi trong BUILD_STATUS.


Ngày 04/11/2026. Căn cứ: sáu ảnh người dùng gửi và đọc code ContentOS. Đây là khảo sát tĩnh và đề xuất triển khai; chưa kiểm trực tiếp phát/render của dự án trong ảnh. Ưu tiên hiện tại là hoàn thiện edit tự động và chỉnh tay; các tính năng ngoài luồng này giữ trong backlog chung.

## 1. Những gì đã có nhưng khó tìm

| Hạng mục | Bằng chứng code | Vấn đề và hướng sửa |
|---|---|---|
| Nhạc nền | app.js settingsForm: audio.music, ba nhạc kit, file audio dự án, volume/loop/fade/duck | Đặt sau sfxLibrary nên bị đẩy quá xa. Đưa thành nhóm cấp một trong Âm thanh, có nhập file/NAS và nghe thử ngay |
| Hiệu ứng âm thanh | sfxLibrary, audio.sfxLevel và audio.sfx, build.mjs tự tạo sự kiện | Đã có tự động theo chữ/cảnh/zoom/cắt. Cần tách mức tự động khỏi kho duyệt tiếng; thêm kiểm mật độ và nghe theo đoạn |
| Hạ nhạc | audio.duckNarration, duckLevel/duckFade, musicSpeech và musicLoop | Hạ theo clip thuyết minh không đồng nghĩa nhận diện lời A-roll. Cần thể hiện rõ nguồn tạo vùng và bổ sung chế độ dựa trên lời nói thật |
| Nhập audio | uploadFile nhận mp3/wav/m4a/aac, mặc định gắn làm nhạc nếu chưa có | Chưa có thao tác rõ ràng trong phần nhạc. Không nên mặc nhiên coi mọi voice vừa tải là nhạc nền; cần chọn vai trò |
| Lưu preset thương hiệu | brandPanel, /api/brands | Chủ yếu font/màu; người dùng không nhận ra khác mẫu dựng. Cần nhãn phạm vi lưu và điểm truy cập nhất quán |
| Lưu mẫu dựng | Thư viện → Lưu kiểu video này thành mẫu → saveTplForm → POST /api/templates | Có ô skill nhưng khó tìm; chưa phải luồng cập nhật skill từ các sửa tay, so sánh phiên bản và rollback |

extractTemplate trong editor/lib/template.js hiện chỉ giữ audio.autoSfx/sfxLevel/sfxVolume/musicVolume; chưa lấy musicLoop, fade, duckNarration/duckLevel/duckFade hay quy tắc chọn nhạc. Không nên sao chép mốc musicSpeech của video A sang video B như một quy tắc phong cách. POST /api/templates dùng slug tên làm thư mục và ghi trực tiếp: trùng tên có thể ghi đè; cần bảo vệ trước khi quảng bá như quản lý phiên bản.

AI inbox đã có hướng dẫn gắn nhạc dài vào audio.music và audio.clips cho âm thanh theo thời điểm. Worker API cho sửa audio nhưng hướng dẫn hiện ưu tiên giữ nhạc/SFX; chưa có hợp đồng chọn nhạc và kho nhạc thống nhất cho mọi adapter. Kiểm nguồn trong applyEditorFields đang tập trung src/file, cần validation riêng cho audio.music và thông số mix trước khi mở tự chọn nhạc API rộng hơn.

## 2. Chỗ chưa đồng bộ giao diện

1. Studio dùng thanh tab/card/inspector; Space ghép nhiều dòng cấu hình sát nhau, có checkbox và nút dạng link thiếu khối/spacing chung. Gom cấu hình vào thanh tóm tắt và disclosure nâng cao; chat và nút gửi luôn nhìn thấy, nội dung giữa cuộn độc lập.
2. Nhãn đang trộn Thư viện, Kho của tôi, mẫu, preset và skill. Thống nhất: Tư liệu (file), Thành phần (chữ/đồ họa/SFX), Mẫu dựng (phong cách + quy tắc), Preset (nhóm thông số). Dùng lại kho/service hiện có, tránh menu trùng.
3. Âm thanh là một form rất dài, kho SFX chiếm vùng đầu khiến nhạc nền khó thấy. Tổ chức nhóm Giọng nói / Nhạc nền / Hiệu ứng / Trộn âm; mỗi nhóm có tóm tắt đang dùng, thao tác chính và nâng cao thu gọn.
4. Thương hiệu có preview đẹp nhưng cách nhập logo vòng qua Cảnh trám; cần nút chọn/nhập logo tại chỗ. Thông số family/style/size/spacing ở từng chữ và vai trò thương hiệu cần cùng control, thể hiện phạm vi áp dụng.
5. Nhiều lựa chọn kỹ thuật được phơi trực tiếp trong Space. Người dùng chỉ cần thấy AI nào, mẫu nào, nguồn nào, âm thanh nào, chờ duyệt/tự xuất; model/tool/JSON để trong nâng cao.
6. Các ảnh Studio có preview đen/“Đang cập nhật” trong khi timeline có clip; Space có lúc chỉ thấy chữ. Đây là dấu hiệu cần điều tra media load/build/iframe/revision/log, chưa đủ bằng chứng kết luận nguyên nhân. Ưu tiên cao hơn trang trí: phải có trạng thái tải/lỗi/thử lại, không treo im lặng.
7. Timeline có giọng/thuyết minh/SFX nhưng ảnh không cho thấy lane nhạc riêng. Cần lane Nhạc nền tương tác được; với schema một bài nền hiện tại thể hiện một strip toàn thời lượng, chọn strip mở mix/loop/fade. Multi-track/cắt nối nhiều bài là mở rộng schema và renderer riêng, không dựng lane giả.

## 3. Luồng âm thanh cần xây dựng

Trong Home/Space chọn “Theo mẫu / AI tự chọn / Tôi chọn / Không nhạc”, kèm nguồn thư viện đã cho phép. Giữ sfxLevel độc lập và snapshot cấu hình vào từng job. “Theo mẫu” chỉ tự chọn khi mẫu có quy tắc hợp lệ; không coi trường trống là đồng ý chọn bất kỳ bài nào.

Kho nhạc dùng chung cần metadata: ID, file/hash, tên, thời lượng, mood, thể loại, BPM nếu biết, nguồn/quyền sử dụng và trạng thái khả dụng. Không bắt buộc người dùng nhập BPM. NAS được nhập/chốt tham chiếu qua storage hiện có; không để AI tự quét cả NAS. Nghe thử, tìm/lọc và chọn bài là thao tác local. Không thêm subscription hoặc tải kho ngoài khi chưa được giao.

AI chỉ nhận danh sách rút gọn và metadata cần thiết. Kết quả chọn gồm bài, lý do ngắn, âm lượng, loop/fade và vùng hạ nhạc. Session/CLI/API dùng cùng hợp đồng, validate file có thật và đúng workspace/project. Không có bài hợp lệ thì báo thiếu hoặc tiếp tục không nhạc theo chính sách đã chọn, không bịa đường dẫn. SFX tự động cần mức độ, nhóm tiếng cho phép và giới hạn dồn tiếng; các cue thêm tay luôn sửa/xóa được.

Trong Studio: nghe thử cả mix hoặc solo nhạc/voice/SFX, mute từng nhóm, sửa volume/fade/duck; Undo/Save rõ ràng. Trước mắt giữ schema music một bài; khi cần nhiều bài phải thêm clip role=music và kiểm tương thích preview/export/CapCut trước khi bật. Preview và final phải khớp, không chỉ nghe được ở UI.

## 4. Lưu cải tiến thành preset, template và skill

Tạo điểm vào “Lưu phong cách…” trong Thư viện/editor, có ba phạm vi: preset chữ/thương hiệu, preset âm thanh, mẫu dựng + quy tắc AI. Hiện danh sách thông số sẽ lưu; không sao chép lời thoại, nội dung riêng, đường dẫn NAS, credential, clip/timing của video nguồn vào mẫu mặc định.

“Lưu mẫu mới” và “Tạo phiên bản cải tiến” là hai thao tác rõ ràng. Mỗi phiên bản có ID, parent/version, ghi chú thay đổi, snapshot thông số, skill ngắn, tài nguyên kèm theo được kiểm và ví dụ tham chiếu tùy chọn. Không ghi đè mẫu nguồn hoặc phiên bản đang được job sử dụng. Job giữ phiên bản đã chốt; mẫu đổi sau đó không làm đổi việc đang chạy.

AI có thể đề xuất quy tắc từ các thay đổi, ví dụ “nhạc nhẹ hơn khi có lời, ít SFX, tiêu đề Panton Bold”; người dùng xem diff rồi lưu. Không biến toàn project/transcript/lịch sử chat thành skill. Tách hướng dẫn ngắn, preset JSON và media nặng; chỉ tải tài liệu tham khảo khi cần. Có xem trước áp dụng lên project khác và Undo; có rollback phiên bản.

## 5. Thứ tự triển khai và nghiệm thu

| Ưu tiên | Công việc | Điều kiện đạt |
|---|---|---|
| P0 | Điều tra preview đen/loading | Mở/chuyển/seek/phát đúng nguồn; lỗi có lý do và thử lại; không sửa video người dùng để che lỗi |
| P1 | Bố cục Âm thanh, nhập nhạc tại chỗ, lane nhạc | Người dùng tìm và thêm nhạc không cần hướng dẫn chép file; sửa/mute/Undo/Save/reopen đúng; preview/final có nhạc |
| P1 | Hợp đồng âm thanh cho AI | Cùng yêu cầu session/CLI/API chọn nguồn hợp lệ, giữ cài đặt người dùng; thiếu nguồn báo rõ; callback cũ không áp sai project |
| P2 | Preset âm thanh và mẫu có phiên bản | Lưu–mở lại–áp dự án khác; trùng tên không ghi đè; không mang media/nội dung riêng; phiên bản job không đổi |
| P2 | Đồng bộ Space/Studio/control | Một thiết kế field/button/card, cấu hình sâu thu gọn; không mất draft khi đổi mode; thao tác chính dùng được ở1280/1920 và màn nhỏ |
| P3 | Benchmark một hành trình edit đầy đủ | A/B-roll → AI → sửa tay → nhạc/SFX → lưu mẫu → video tiếp theo → final; ghi thời gian/token/chi phí và so chất lượng |

Chỉ sau nghiệm thu lõi này mới tăng tải nhiều video và ưu tiên tiếp các nhóm ngoài edit. Quy mô 50–100 video/ngày gồm phiên bản vẫn là mục tiêu, chưa có benchmark xác nhận. Không tự gọi AI trả phí hoặc đăng bài để kiểm khảo sát.
## Cập nhật sau khảo sát: phần đã triển khai

Đã đưa Nhạc nền lên đầu Âm thanh, thêm nhập nhạc/lane riêng/điểm lưu mẫu; extractTemplate giữ mix portable. Lưu mẫu UUID mới và parent/version tránh ghi đè. UI Thư viện có Phiên bản & skill, so thông số với cha và nạp skill vào form cải tiến. Space/chat Studio gom cấu hình vào disclosure; kiểm draft khi đổi mode/provider. Xem BUILD_STATUS và AUDIO_SPACE_INTEGRATION_BROWSER_SMOKE/TEMPLATE_HISTORY_BROWSER_SMOKE để biết phạm vi bằng chứng. Bảng khảo sát bên dưới mô tả mốc ban đầu, không coi mọi khoảng trống đã được giải quyết từ cập nhật này.



## Âm thanh chia nhóm theo menu Bộ lọc · 04/11/2026

Theo ảnh CapCut của người dùng, tab Âm thanh dùng lại #submenu/.sub-btn/.has-sub của Bộ lọc, không thêm rail hoặc sidebar mới. Bốn nhóm Nhạc nền / Giọng nói / Hiệu ứng / Trộn âm; chỉ một panel hiển thị. Menu dọc trên desktop, hàng ngang cuộn ở <=760px. Chuyển nhóm không sửa dữ liệu project. Lane nhạc mở đúng Nhạc nền; clip thuyết minh mở đúng Giọng nói.

Nhạc nền có danh sách bài, tìm kiếm, lọc Tất cả/Đã nhập, chọn/đang dùng, bỏ nhạc và nghe thử/dừng nhạc đã nhập. Nghe thử dùng audio riêng, âm lượng50%, không thay mix. Chuyển nhóm/tab hoặc vẽ lại dừng audition; kho SFX cũng dừng audition trước đó. Nhạc kit phải chọn và chờ build đưa file vào project trước khi nghe; nút chưa chọn bị vô hiệu hóa với tooltip, lỗi tải có thông báo tại bài. Chưa có endpoint nghe mọi bài kit độc lập. Giữ nhập từ máy/NAS/điện thoại, AI brief và lưu mẫu hiện có.

Giọng nói giữ AI voice, thuyết minh, provenance và điều khiển clip/fade/làm rõ giọng. Hiệu ứng giữ mức tự động, danh sách thủ công, kho có nhóm/tìm kiếm/kéo thả; nút thêm thủ công nay vẽ ngay dòng mới. Trộn âm gom volume giọng/nhạc/SFX cùng duck/fade/level hiện có. Không đổi schema hoặc render engine. Chưa thêm thư viện CapCut/TikTok, yêu thích, kiểm bản quyền tự động, pitch/EQ hoặc beat sync.

AUDIO_SPACE_INTEGRATION_BROWSER_SMOKE.json bản mới exit0 trên main5180:1280/1920 kiểm một panel/menu active/search, file picker thật, imported synthetic-tone audition play/stop và hồi quy fade/duck/loop/Save/voice provenance/lưu mẫu v2/Space. Kiểm menu dọc/ngang tại1280/820/600/390, screenshot AUDIO_GROUP_*.png và AUDIO_RESPONSIVE_*.png; đã xem bốn nhóm desktop và390. Không JS exception, không gọi AI/đăng bài. Browser QA dùng userGesture cho hành động nghe thử. Các lần harness lỗi const trùng/thiếu user gesture không tính đạt. Không chạy lại full service suite vì lượt này chỉ đổi UI; mốc208 trước vẫn là baseline. Không restart backend. Chưa nghe đánh giá chất lượng hoặc render final mới; editor mobile toàn bộ vẫn cần tối ưu riêng.
