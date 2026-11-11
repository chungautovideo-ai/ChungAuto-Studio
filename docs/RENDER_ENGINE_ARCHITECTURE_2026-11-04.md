# ContentOS — HyperFrames, Remotion và FFmpeg

> Đồng bộ tài liệu 04/11/2026: đọc [điểm hiện hành và bản đồ build](BUILD_CURRENT.md) trước các mốc lịch sử. Mọi thay đổi UI phải theo [quy chuẩn thiết kế và quy trình UX/UI](DESIGN_UX_STANDARD.md): phân tích trải nghiệm, đối chiếu giao diện sẵn có và tham khảo ứng dụng phù hợp trước thiết kế/code. Trạng thái triển khai chỉ được xác nhận bằng bằng chứng đúng phạm vi trong BUILD_STATUS.


## Quyết định kiến trúc

ContentOS dùng cả HyperFrames, Remotion và FFmpeg/FFprobe. Giữ trải nghiệm editor VEK không có nghĩa giới hạn mọi composition vào HyperFrames hoặc đổi toàn bộ Remotion thành ảnh phẳng. Các quyết định cũ chỉ nói giữ HyperFrames cần được đọc cùng tài liệu này.

| Thành phần | Trách nhiệm |
|---|---|
| HyperFrames | Editor/timeline VEK hiện tại, composition HTML, mẫu/skill và đồ họa phù hợp runtime này |
| Remotion | Composition React, template theo dữ liệu, cảnh/ảnh bìa có lớp chỉnh được và các composition từ AIEV/Studio đã xác minh tương thích |
| FFmpeg/FFprobe | Probe/validate, proxy/transcode, trích khung, xử lý/mix audio, trung gian, ghép và đóng gói đầu ra |

## Hợp đồng cần triển khai

- Một dự án và asset manifest chung, thêm khai báo engine ở composition/cảnh thay vì kho dự án riêng cho mỗi engine. Mẫu/skill khai báo engine, phiên bản runtime, schema đầu vào và khả năng chỉnh sửa.
- Một giao diện adapter: kiểm đầu vào/tài nguyên → tạo preview → render artifact → kiểm file/hash/duration → trả kết quả về cùng render queue/history. Adapter Remotion phải nạp dependency cục bộ đã được duyệt, không tự thực thi code tùy ý từ template vừa nhập.
- Engine lựa chọn theo template/khả năng thực, cho người dùng xem trong chi tiết. Chưa có Remotion adapter thì báo chưa hỗ trợ hoặc yêu cầu chuyển đổi rõ ràng; không âm thầm rasterize và báo giữ nguyên composition.
- Có thể render cảnh Remotion thành media rồi dùng trong HyperFrames và hoàn thiện bằng FFmpeg. Cảnh trung gian phải có fingerprint đầu vào, engine/runtime, kích thước/fps/duration/audio, trạng thái cache và provenance. Tránh render lại khi đầu vào không đổi.
- Cùng revision/candidate, chính sách review/auto-export, render lock, cancellation, artifact integrity và output history. Không tạo queue hoặc nút Xuất riêng biệt khiến người dùng không biết đầu ra nào là final.
- Editor VEK chỉ chỉnh trực tiếp trường đã ánh xạ. Cảnh Remotion chưa ánh xạ mở bảng tham số/schema hoặc công cụ composition riêng trong cùng project; không hứa round-trip mọi layer/effect giữa hai engine. Preview và file xuất phải đối chiếu cùng revision.

## Hiện trạng và nghiệm thu

Cập nhật 04/11: đã có adapter cảnh native React đầu tiên trong `src/services/remotion-scenes.mjs`, composition được kiểm soát tại `engines/remotion/src/index.jsx`. Cảnh chữ cho chỉnh title/subtitle/màu nền/màu chữ/accent/tỷ lệ/thời lượng bằng JSON; không nhận entrypoint/code tùy ý. Dùng cùng render lock với HyperFrames, kiểm revision trước/sau render, FFprobe kiểm kích thước/fps/thời lượng, SHA256 và fingerprint code+runtime+props cho cache. Props/provenance giữ trong sidecar; chưa ánh xạ thành lớp sửa trực tiếp trên timeline VEK.

Công cụ local: `node editor/tools/tao-canh-remotion.mjs <project-relative-dir> <scene-json-relative-to-project>`. JSON ví dụ: `{"title":"Tin mới","subtitle":"Nội dung chính","format":"9:16","duration":3,"background":"#101014","color":"#ffffff","accent":"#d3f53c"}`. Công cụ trả file `inputs/remotion/<fingerprint>/scene.mp4`, không sửa project hoặc xuất final. AI có thể đưa src này vào brolls của candidate, giữ sidecar và tham số để render lại. Chưa có nút/parameter panel Remotion trong UI.

Runtime đồng bộ4.0.538 khai báo ở engines/remotion/package.json. Thử npm offline không có gói đúng phiên bản trong cache; máy phát triển hiện cấu hình workspace/contentos/remotion-runtime.json để tái sử dụng node_modules đã cài của AIEV cùng Chrome local, không sửa app gốc. Installer ContentOS độc lập/lockfile/download chưa hoàn tất; không coi cấu hình local này là triển khai portable. Adapter dùng static server127.0.0.1 rõ ràng và đóng browser bằng CDP; cần cô lập worker trước khi gọi từ server nhiều request vì thư viện runtime có listener process. Hiện chỉ công cụ local và smoke sử dụng.

REMOTION_SCENE_SMOKE.json kiểm render React thật0,6giây1080×1920/30fps, cache lặp, revision cũ bị chặn, snapshot HyperFrames chứa cảnh Remotion và xuất final qua xuat-video.mjs thật/FFprobe; mã thoát cuối0. Fixture giữ tại đường dẫn trong evidence để xem, chưa dọn tự động. Ảnh REMOTION_NATIVE_TITLE.jpg đã xem chữ Việt.199service tests đạt. Chưa nghiệm thu audio Remotion, hủy giữa render, runtime lỗi toàn diện, cảnh nhiều engine có audio, migration Assemble/Poster/Thumbnail AIEV, giao diện tham số hoặc mọi template Remotion. Các mô tả “chưa có adapter native” cũ được cập nhật thành “adapter cảnh chữ có giới hạn; tích hợp native đầy đủ còn thiếu”.

HyperFrames/FFmpeg đã có pipeline và bằng chứng fixture; Remotion native chưa tích hợp đầy đủ. Nhập composition cùng schema VEK, chuyển timeline AIEV hoặc nhập background/final PNG không chứng minh Remotion adapter hoạt động.

Các bước tiếp: kiểm kê composition/runtime thật của AIEV/Studio, chọn schema/adapter native, nối preview và render chung, kiểm project có cảnh cả hai engine và audio xuyên cảnh, sau đó kiểm template migration. Cần bằng chứng editable parameters → preview → MP4, hash/revision, duration/fps/audio, lỗi runtime/asset, hủy và render lại. Không đánh dấu toàn bộ tính năng engine hoàn tất dựa trên test importer hoặc ảnh phẳng.

## Giao diện các module hiện đang thiếu quyền

Theo yêu cầu người dùng, năm điểm vào social/analysis/integrations/voice/template có giao diện xem trước khi chưa có quyền VEK tương ứng. Module chung contentos-feature-preview.js chỉ dựng DOM và tương tác local; không gọi API, không lưu dữ liệu/khóa, không bật thực thi hoặc thay entitlement. Người có quyền tiếp tục luồng module hiện có. Chế độ xem trước ghi rõ dữ liệu chỉ trên màn hình; đổi tab hoặc mở lại có thể mất nội dung. Đây là preview để xem xét UX, chưa phải giao diện đầy đủ hoặc engine tích hợp hoàn chỉnh.


## Cập nhật worker và giao diện · 04/11/2026

Các đoạn “CLI only/chưa UI/cần cô lập worker” ở hiện trạng trước được thay bởi mốc này: server dùng remotion-jobs.mjs khởi chạy remotion-worker.mjs qua IPC, không nạp renderer trực tiếp vào request. POST/GET/DELETE /api/remotion-scenes giới hạn theo workspace/project/revision. Dialog contentos-remotion.js nằm tại Cảnh trám, cho tham số → preview → chủ động thêm broll → Lưu/Undo. Build HyperFrames nhận media scene cùng provenance Remotion. Chưa ánh xạ mọi layer React thành layer VEK hoặc sửa lại tham số broll đã thêm.

Activity gom job scene với công việc khác, chờ render chung và không phần trăm giả. Một lượt cảnh hoạt động/project, tối đa 8 lượt cảnh trong server, độc lập quota AI CLI/API; render lock vẫn chỉ một render/máy. Cancel gửi abort, xác nhận khi child close và bỏ late result. Timeout 5 phút chỉ yêu cầu hủy; chưa cưỡng chế worker mất liên lạc. Đóng dialog không hủy, mở lại nối job đang chạy trong cùng vòng đời server. State job chỉ ở bộ nhớ, chưa durable history/restart recovery.

200 service tests đã ghi nhận. REMOTION_API_SMOKE.json chứng minh render worker thật, chờ khóa/hủy lúc chờ, revision, preview bytes và không tự sửa project. REMOTION_EDITOR_BROWSER_SMOKE.json chứng minh entry→preview(cache từ render thật)→thêm→lưu ở 1280/1920, không lỗi JS. Chưa nghiệm thu cancel giữa render, audio hoặc nhiều composition AIEV. Runtime vẫn cấu hình local dùng thư viện AIEV và Chrome sẵn có; clean installer/lockfile/portable chưa hoàn tất. Lần đồng bộ tài liệu không chạy lại test hoặc restart app.


## Sửa lại cảnh Remotion từ timeline · 04/11/2026

Cảnh trám chọn cảnh có metadata ContentOSTitleCard → Sửa nội dung cảnh · Remotion. Dialog điền lại chữ, màu, thời lượng từ props đã lưu; preview mới không đổi project. Thay cảnh trên timeline cập nhật đúng item, giữ ID/vị trí/bố cục, dùng thời lượng mới và bắt đầu media từ đầu; không nhân đôi cảnh. Lưu/Undo dùng cùng history editor. Project/revision/dirty/source và item identity được kiểm trước áp dụng. Khi sửa không nối preview đang chạy của cảnh khác; POST báo project đang bận nếu cần.

REMOTION_EDITOR_BROWSER_SMOKE.json mới kiểm hai kích thước 1280/1920: điền props cũ, đổi chữ/màu/thời lượng, preview không sửa file, thay không tăng số cảnh/đổi vị trí, lưu và Undo khôi phục item cũ. Không JS exception; lần cuối exit0. Một lần harness đọc toast Lưu cũ dẫn tới ghi fixture khi save còn chạy (EBUSY); đã xóa toast trước gửi save và chờ phản hồi mới. Profile Chrome QA giữ trên D vì cleanup đệ quy trước đó thoát lỗi; không thay cleanup dữ liệu sản phẩm. Test remotion-jobs và syntax app/dialog đạt. Không chạy lại toàn bộ suite trong mốc này. Main5180 trả static UI mới HTTP200, không cần restart backend. Đây là chỉnh tham số cảnh chữ native đã ánh xạ, chưa phải mọi composition AIEV/audio/installer hoặc full127nhóm.


## Lịch sử Remotion lưu trên đĩa · 04/11/2026

remotion-history.mjs lưu từng job vào workspace/contentos/remotion-jobs/<uuid>.json bằng temp+rename, chỉ trường dữ liệu không chứa child/IPC/credential. Giới hạn bản ghi128KiB, tối đa10000 file, kiểm schema/path/status; lỗi đọc hoặc ghi chặn nhận job mới thay vì bỏ lịch sử không rõ. Trạng thái/giai đoạn thay đổi được ghi; không ghi mỗi frame khi cùng phase. Scope workspace/project giữ nguyên.

Khi mở service lại, job terminal giữ kết quả/lỗi/lịch sử. Job running/cancelling không có child do service này sở hữu được chiếu interrupted trong Hoạt động/API với thông báo chưa xác minh; không báo đang chạy, không giả xác nhận hủy, không tự replay/nhả quyền hoặc xóa render lock. Job chưa xác minh vẫn chặn tạo cảnh mới cùng project và tính vào giới hạn cảnh để tránh nhân đôi. Chưa có thao tác đối soát/giải phóng các bản ghi này trong UI. Worker mất IPC yêu cầu abort; chưa nghiệm thu crash giữa bundle/render hoặc bảo đảm mọi process con thoát sau crash.

201service tests đạt(temp D), gồm reopen terminal, in-flight→interrupted/no relaunch, workspace scope, cancel chưa xác minh bị chặn và corrupt history chặn start. REMOTION_API_SMOKE.json mới chạy server thật: render/wait cancellation và restart sau terminal giữ succeeded+cancelled/Activity/hash, không sửa project. Lần đầu test gửi context header project cũ vào open sau restart bị guard chặn; sửa harness mở project trước rồi gắn lại header, giữ guard sản phẩm. Browser1280/1920 reedit/Save/Undo hồi quy đạt, exit0/no JS exceptions.

Main5180 restart sau khi dispatcher active/queued0, ASR/render idle và không có remotion-worker. Lần kiểm đầu trùng browser QA đang render nên hoãn, đợi QA kết thúc rồi kiểm lại mới restart đúng PID. Ping ready, Activity đọc8record scene của workspace hiện tại, tài nguyên idle. Không thử AI trả phí hoặc đăng bài, không sửa app nguồn. Các ghi chú memory-only/no-history cũ được thay ở phạm vi job Remotion; không suy ra toàn bộ scheduler/worker đã có phục hồi bền vững. Không tự xác nhận output integrity khi file bị thay sau restart; param preview restoration, installer, full AIEV composition/audio và mixed real-agent throughput còn thiếu.


## Remotion cài độc lập trong ContentOS · 04/11/2026

Đã tạo engines/remotion/package-lock.json (lockfile3/integrity), npm ci --ignore-scripts cài181package vào engines/remotion/node_modules bằng cache workspace/cache/npm-remotion trênD. Không chép node_modules hoặc sửa AIEV. Runtime mặc định chỉ lấy engine local; legacy saved.modules không còn được dùng ngầm. CONTENTOS_REMOTION_RUNTIME là override tường minh cho phát triển; doctor yêu cầu independent để coi bộ cài đạt. Kiểm realpath từng package thuộc thư mục đã chọn, Remotion4.0.538 và React/ReactDOM19.3.1; đọc version trên đĩa thay require JSON cache để phát hiện thay đổi sau cài.

Bản cấu hình remotion-runtime.json cũ được sao lưu dưới workspace/cache/remotion-runtime.before-independent-<uuid>.json, cấu hình hiện tại {}. Chrome lấy từ cache HyperFrames qua render-browser.mjs, không cần Chrome Program Files cố định. browserExecutable còn hỗ trợ override đã lưu khi file tồn tại, CONTENTOS_REMOTION_BROWSER hỗ trợ override tường minh; render không tự tải browser. Cache Chrome vẫn ngoài folder app, installer browser ensure chuẩn bị trên máy mới; chưa phải portable offline đầy đủ.

installer/setup.mjs bổ sung Independent Remotion runtime: dùng npm ci từ lockfile khi chưa sẵn sàng, cache nằm trong app, kiểm lại trước hoàn tất. Doctor có check remotion required/version/modules/browser/independent, không cài hoặc render khi chẩn đoán. setup.ps1 -NoStart đã chạy đạt problems[], không restart/bật Windows startup. Local source packages pinned đã được tải/cài thật, sau đó API smoke render worker React thật bằng dependency riêng + Chrome headless cache, cache/revision/cancel-wait/history restart đạt. Browser1280/1920 create/reedit/Save/Undo hồi quy đạt/no JS errors.

204service tests đạt; thêm remotion-runtime test local pin, bỏ config external cũ, browser lookup và version mismatch. Sau thêm realpath guard test liên quan đạt. REMOTION_INDEPENDENT_RUNTIME_SMOKE.json giữ lock hash, runtime path, browser và evidence API/browser; INSTALLER_DOCTOR_SMOKE.json cập nhật. Main5180 restart sau dispatcher active/queued0/render-ASR idle/no scene worker; ready.

Các ghi chú runtime còn dùng AIEV/chưa lockfile cũ được thay ở phạm vi này. Chưa nghiệm thu Windows sạch, download gián đoạn, offline bundle, macOS, recovery giữa npm ci hoặc khóa installer khi đang render. Npm ci sử dụng ignore-scripts; render thật đã kiểm binary cần thiết trên máy này, không suy ra mọi nền tảng. Native Poster/Thumbnail/Assemble/audio, nhiều phiên AI thật và toàn bộ127nhóm còn thiếu.
