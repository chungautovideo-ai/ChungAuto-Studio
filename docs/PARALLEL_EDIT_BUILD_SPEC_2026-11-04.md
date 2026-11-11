# ContentOS — Dựng nhiều video song song

> Đồng bộ tài liệu 04/11/2026: đọc [điểm hiện hành và bản đồ build](BUILD_CURRENT.md) trước các mốc lịch sử. Mọi thay đổi UI phải theo [quy chuẩn thiết kế và quy trình UX/UI](DESIGN_UX_STANDARD.md): phân tích trải nghiệm, đối chiếu giao diện sẵn có và tham khảo ứng dụng phù hợp trước thiết kế/code. Trạng thái triển khai chỉ được xác nhận bằng bằng chứng đúng phạm vi trong BUILD_STATUS.


Cập nhật 04/11/2026. Bổ sung BUILD_PLAN và đặc tả giao diện; giữ toàn bộ phạm vi tích hợp VEK/AIEV/ChungAuto Studio. Trạng thái nghiệm thu tra BUILD_STATUS.

## 1. Yêu cầu đã chốt

Mỗi máy cài ContentOS và chạy dự án riêng; NAS cung cấp nguồn dùng chung. Giai đoạn này không cần scheduler phân phối việc giữa sáu máy. Mục tiêu 50–100 video/ngày tính cả video gốc và phiên bản, chưa phải năng suất đã benchmark.

Người dùng mở nhiều phiên chat Codex/Claude, mỗi phiên nhận một video khác nhau. Worker CLI/API chạy độc lập và có thể hoạt động đồng thời với các phiên chat. Tất cả xuất hiện trong cùng Hoạt động, dùng chung editor, project và dịch vụ. Giới hạn worker nền không giới hạn số phiên chat chủ động mở.

## 2. Lựa chọn độc lập khi giao việc

| Lựa chọn | Giá trị | Quy tắc |
|---|---|---|
| Bố cục | Space / Studio | Cùng editor/project, thay cách bố trí |
| Bên thực thi | Phiên chat / CLI nền / API | Pin agent/model khi biết; model phiên chat do phiên đó quản lý |
| Hoàn tất | Chờ kiểm tra / Tự xuất | Job giữ chính sách tại thời điểm giao |
| Phát hành | Không đăng / đăng ngay / hẹn lịch | Lựa chọn riêng; tự xuất không mặc nhiên cho phép đăng |

## 3. Tích hợp giao diện

- **Home:** composer, nguồn A-roll/B-roll local/UNC và mẫu chọn nhanh ngay dưới composer. Dùng lại catalog/handler Thư viện. Cấu hình kỹ thuật thu trong phần nâng cao.
- **Chat editor:** cùng bộ chọn AI/chính sách hoàn tất với Home; giữ context của job khi người dùng chuyển editor sang video khác.
- **Hoạt động:** bốn nhóm Đang chạy / Hàng đợi / Cần kiểm tra / Lịch sử. Tên dự án, loại việc, bên thực thi, model/phiên khi biết, giai đoạn, lỗi và đầu ra; lọc trong cùng màn. Không tạo trang theo dõi riêng cho từng AI.
- **Cài đặt → Dựng song song trên máy này:** quota CLI/API 1–8, mặc định 2; ngừng nhận thêm việc mới. Không hủy job đang chạy khi pause.
- **Hoạt động → Khôi phục việc chờ:** sau restart chỉ việc chờ còn nguyên mới có nút Đưa lại vào hàng đợi. Job thay đổi/không rõ cần kiểm tra; unpause không tự replay.

Thumbnail, nhóm gốc/phiên bản, ưu tiên hàng đợi và đầy đủ mốc thời gian vẫn là thiết kế đích. Màn giao nhiều brief đã có code, còn cần nghiệm thu theo mục 8–10. Chỉ hiện phần trăm/ETA khi có dữ liệu; đăng nhập AI không chứng minh phiên đang nhận việc. Không thêm nút pause/resume từng job hoặc mở chat khi chưa có cơ chế thật.

## 4. Luồng và bảo vệ dữ liệu

1. Nhận brief/nguồn, chọn mẫu, kiểm đường dẫn và lưu source snapshot.
2. Tạo job có workspace/project/revision, execution identity và chính sách hoàn tất.
3. Phiên chat claim qua inbox; CLI/API chờ dispatcher chung theo quota và project khả dụng.
4. Mỗi project chỉ một job giữ quyền sửa; project khác có thể chạy độc lập. Candidate/log/output tách theo job.
5. Sửa candidate, build/kiểm tra, xác minh claimant và base revision trước khi áp dụng. Xung đột chuyển sang so sánh thay vì ghi đè.
6. Chờ kiểm tra hoặc xuất revision hợp lệ; kết quả về đúng project trong Hoạt động. Đăng/lịch là luồng riêng.
7. Restart không tự giao lại job có thể đang chạy; lock/owner không rõ phải được xác minh.

Giao nhiều video cần tóm tắt số dự án trước khi xác nhận và cho sửa từng brief. Nhiều footage ghép một video khác một video dài cắt nhiều clip; chọn nhiều file không mặc nhiên tạo mỗi file một job.

## 5. Kiến trúc file

| File | Trách nhiệm |
|---|---|
| editor/tools/ai-inbox.mjs | Nhận việc session/CLI, lệnh có claim, progress/done/fail |
| src/services/job-ownership.mjs | So identity submission/claimant để chặn callback worker cũ |
| src/services/staged-job-control.mjs | Hủy staged job theo phiên bản, cùng claim gate, giữ candidate |
| src/services/render-lock.mjs | Một render/máy, editor/CLI chờ cùng khóa; kiểm revision/hủy, không cướp khóa chưa rõ |
| src/services/asr-lock.mjs và editor/lib/whisper.mjs | Một lượt ASR/máy dùng chung editor/CLI/API, chờ/hủy/kiểm revision trước nhận giọng |
| src/services/render-environment.mjs | Cache tạm subprocess HyperFrames trên ổ cài ContentOS, không phụ thuộc TEMP hệ thống |
| src/services/completion-output.mjs | Tải final theo job/snapshot/revision/workspace, kiểm checksum trước stream |
| src/services/intake-tasks.mjs và editor/ui/contentos-intake-batch.js | Nhập mỗi video thành dự án độc lập, task/marker chống trùng, mở setup AI từng dự án |
| src/services/session-job-claims.mjs | Claim nguyên tử, khóa project, kiểm owner |
| src/services/background-dispatch.mjs | Quota CLI/API, FIFO bỏ qua project bận, settings/journal |
| editor/server.mjs | Tích hợp worker, identity/revision và endpoint recovery |
| src/services/activity.mjs | Projection execution/trạng thái, không lộ claim token |
| editor/ui/contentos-activity.js | Bốn nhóm, filter, đầu ra, quota/recovery |
| editor/ui/contentos.js | Form cấu hình song song trong Cài đặt |

workspace/contentos/background-dispatch.json lưu settings chung máy. background-pending.json lưu relative path/hash và pending/dispatching; callback trong bộ nhớ không sống qua restart. Recovery lọc workspace, kiểm lại file trước khi enqueue. Store tasks khác không mặc nhiên là queue thực thi này.

## 6. Trạng thái và bằng chứng

| Hạng mục | Đã kiểm | Còn thiếu |
|---|---|---|
| Claim/project guard | Sáu process tranh job/project, inbox CLI và HTTP owner | Mọi writer/cancel/replacement và real-agent lifecycle |
| Dispatcher nền | Gateway tổng hợp: 2 chạy + 1 chờ, tự nhận tiếp, đúng ba project | CLI/provider thật, throughput |
| Restart pending | Restart server thật, giữ job, explicit resume, chặn duplicate | Recovery job đang chạy, journal hỏng, lock không rõ |
| Hoạt động/Cài đặt | Browser 1280/1920; endpoint thật, recovery/cancel qua fixture | Nhiều phiên AI thật và toàn hành trình production |

Bằng chứng: BACKGROUND_DISPATCH_API_SMOKE.json, BACKGROUND_RECOVERY_API_SMOKE.json, SESSION_INBOX_CLAIMS_SMOKE.json, ACTIVITY_BROWSER_SMOKE.json. Bộ service tests tại mốc này: 179 đạt. Activity đã hiển thị lý do chờ quota/pause/project bận/recovery/session; endpoint capacity được kiểm bằng gateway tổng hợp và sáu nhãn UI bằng fixture. Không coi gateway giả là provider thật hoặc số tests là số tính năng hoàn tất.

## 7. Thứ tự tiếp tục và nghiệm thu

1. Hoàn thiện ownership/cancel/replacement và heartbeat phiên trước khi tự retry.
2. Hoàn thiện điều tiết ASR/render/tạo media chung cho session và worker, hiển thị lý do chờ tài nguyên; bổ sung giới hạn provider. Editor/CLI đã chờ cùng khóa một render/máy, kiểm thực bằng MP4 tổng hợp. Lớp Whisper chung đã khóa một ASR/máy, kiểm thực bằng lời tổng hợp; chưa FIFO/durable queue hoặc điều tiết tạo media/provider.
3. Kiểm hỗn hợp hai phiên chat và CLI/API: khác project độc lập, cùng project không ghi đè, đổi editor không đổi output.
4. Nghiệm thu giao nhiều brief và thao tác hàng đợi, dùng lại Home/Hoạt động. Nhập từng video, đặt tên và giao mẫu/execution chung đã có code; cần kiểm dialog browser, retry từng phần/crash journal và hồi quy first-build sau tách hàm dùng chung trước khi triển khai/khẳng định hoàn tất.
5. Đo footage thật: thời gian AI/ASR/build/render, token/chi phí, CPU/RAM/VRAM/NAS trước khi tăng quota.

Nghiệm thu gồm restart khi chờ/đang chạy, kết quả muộn sau hủy, revision conflict, mất NAS/provider, refresh/back và hai kích thước màn hình. Không tự gọi AI trả phí hoặc đăng bài làm smoke test. Remotion native và adapter còn thiếu tiếp tục theo kế hoạch toàn bộ ba app.

## 8. Giao nhiều video, giữ trải nghiệm VEK

Home giữ một composer, nguồn và mẫu chọn nhanh. Trong phần thêm video, chọn “Mỗi video một dự án…”; dialog tóm tắt tối đa 20 video, tên riêng và tỷ lệ chung trước khi nhập. Ghép nhiều A-roll thành một video và cắt một video dài thành nhiều clip là hai luồng khác. Nhập xong không tự gọi AI.

“Giao cả lô cho AI…” mở tại kết quả nhập hoặc lô thành công trong Hoạt động. Dialog gồm mẫu đã cài, cách thực thi, chờ kiểm tra/tự xuất, ngôn ngữ lời nói và brief riêng từng video. Chỉ nút giao việc mới tạo các job độc lập. Cấu hình sâu thu gọn; không thêm sidebar hoặc editor cho batch.

Phiên chat chọn tự động/Codex/Claude; mỗi phiên chủ động nhận một job qua inbox, app không tự mở chat. CLI nền chạy tiến trình riêng; API dùng kết nối đã cấu hình. Dialog lô đã có Model nâng cao cho CLI/API; phiên chat dùng model của phiên, xem bằng chứng cập nhật mục 10. Quota worker nền không giới hạn số phiên chat; ASR/render vẫn dùng khóa tài nguyên chung. Mỗi project có candidate, brief, execution và completion policy riêng. Đổi editor/Space/Studio không đổi job. Mặc định chờ kiểm tra; tự xuất không bao gồm đăng/lên lịch.

## 9. Hợp đồng giao lô và tiếp tục

| Thành phần | Trách nhiệm |
|---|---|
| POST /api/v1/storage/intake-batches | Nhập nguồn thành project, task/marker giúp tiếp tục phần thiếu |
| POST /api/v1/projects/edit-batches | Giao mẫu/execution/chính sách chung và brief riêng từ lô nhập thành công |
| src/services/batch-edit-dispatch.mjs | Kiểm workspace/origin, journal/idempotency, giữ các job đã giao khi lỗi |
| editor/ui/contentos-batch-edit.js | Dialog dùng chung từ Home và Hoạt động |
| stageFirstBuild trong editor/server.mjs | Luồng first-build dùng chung với /api/ai-job, không sao chép pipeline |

Journal ở workspace/contentos/edit-batches/<id>.json. Retry cùng khóa/cùng thiết lập bỏ qua phần đã ghi; đổi thiết lập với khóa cũ bị từ chối. Marker trên job hỗ trợ tìm lại lượt đã stage khi journal thiếu checkpoint. Lỗi giữa lô giữ job đã giao và trả số đã giao/tổng số; giao tiếp nhắm phần chưa ghi nhận, không tự retry job AI đã chạy lỗi hoặc rollback cả lô.

Journal không thay hàng đợi thực thi hoặc chứng minh worker còn sống. Mở dialog mới tạo khóa mới; UX chống giao lại ngoài ý muốn và phục hồi crash còn cần kiểm. Guard workspace/project/revision và khả dụng mẫu của first-build chung vẫn áp dụng. Mở UI không chứng minh provider/quyền thực thi đã sẵn sàng.

## 10. Bằng chứng hiện hành và nghiệm thu bổ sung

Cập nhật mở lại lô:198tests, dialog lưu frozen payload trước gửi và khôi phục cùng khóa; GET scoped latest journal cho fallback server. Mở lại không tự giao, record đã đủ khóa submit. Browser fixture1280/1920 kiểm local reopen và server completed fallback; endpoint thật kiểm metadata phục hồi. Giới hạn cũ “mở dialog mới luôn tạo khóa mới” được thay cho journal/payload mới; journal legacy thiếu input chưa tự khôi phục, chưa có lịch sử nhiều lượt/corrupt journal/crash process toàn diện. Xem BUILD_STATUS.

Cập nhật liên lạc phiên: inbox có --claim ID --heartbeat DIR, tự báo ở take và --buoc cho session. Runtime reported nghĩa là phiên báo trong5phút, UI phân biệt worker active; stale trở lại Cần kiểm tra, không tự nhả claim hoặc giao lại.197tests và inbox CLI/Activity thực trên fixture cùng browser1280/1920 đạt. Đây là báo liên lạc có kiểm owner, chưa phải heartbeat tự động chứng minh process chat còn sống; mixed real-agent và lifecycle/recovery đầy đủ vẫn cần nghiệm thu. Xem BUILD_STATUS.

Cập nhật model lô: 195 tests đạt, Model nâng cao đã có trong dialog CLI/API, dùng shared runModelPicker cho API; session không ghi đè model. Browser fixture1280/1920 kiểm discovery/mode switching/payload retry. Giới hạn “chưa có model picker lô” ở các mốc cũ được thay bằng kết quả này; khả năng model/provider thật vẫn phải kiểm riêng. Không thay đổi yêu cầu mixed real chat/CLI/API, heartbeat, crash recovery và benchmark.

Cập nhật sau nghiệm thu thêm: 194 service tests đạt; partial retry, journal marker restart, concurrent key và foreign origin có test. Dialog fixture1280/1920 qua mất mạng→partial→success với cùng payload, không JS exception. Hồi quy first-build qua Whisper thật/gateway giả và review/auto final MP4 đạt; đã triển khai main5180 sau kiểm idle. Các thiếu sót tương ứng trong đoạn cũ dưới đây được thay bằng kết quả này. Vẫn cần hành trình người dùng thật từ chọn nguồn đến dựng, crash process tại các checkpoint, model picker lô, mixed real chat/CLI/API, heartbeat và benchmark. Xem BUILD_STATUS để phân biệt fixture/gateway giả với provider thật.

Mốc service tests gần nhất: 190 đạt với temp trên D; thay mốc 179 ở mục 6. INTAKE_BATCH_API_SMOKE.json kiểm endpoint thật với hai video fixture: hai project/brief/candidate riêng, retry cùng khóa không đổi job, hai inbox session nhận hai job khác nhau, review không render và không gọi model. Đây chưa phải hai phiên chat AI thật dựng hoàn chỉnh.

Cần kiểm tiếp: dialog 1280×720/1920×1080; mất mạng submit/retry; lỗi video thứ hai giữ video thứ nhất; khoảng trống job/journal; đổi workspace; quota CLI/API khi giao lô; hồi quy first-build một video sau refactor; hai phiên chat cùng CLI/API thật. Khóa ASR/render đã có kiểm riêng nhưng chưa FIFO/durable recovery. Heartbeat phiên, ưu tiên hàng đợi và benchmark footage/NAS/provider vẫn còn thiếu. Không dùng mục tiêu 50–100 video/ngày làm kết quả đo.


## 11. Hợp đồng nhiều phiên chat và worker đã chốt

Người dùng chủ động mở nhiều chat Codex/Claude để dựng nhiều video, đồng thời dùng worker CLI/API độc lập. Không yêu cầu mọi video chuyển sang chạy nền; app không tự tạo chat hoặc đọc lịch sử chat ngoài dự án. Một session nhận một job tại thời điểm claim; project khác nhận việc độc lập. Các phiên và worker cùng tuân thủ claim/project/revision, không áp quota nền thành quota chat.

| Nguồn thực thi | Cách nhận việc | Điều tiết | Trạng thái cần thể hiện |
|---|---|---|---|
| Chat Codex/Claude | Phiên chủ động nhận qua inbox, claim nguyên tử | Không tính vào quota CLI/API; dùng khóa project và tài nguyên chung | Chờ phiên / vừa báo liên lạc / chưa xác minh; agent/model chỉ khi biết |
| CLI nền | Dispatcher khởi chạy process riêng | Quota CLI/API chung 1–8, mặc định 2 | Chờ quota/project/pause, chạy được xác minh, log/kết quả/lỗi |
| API | Dispatcher gọi kết nối đã cấu hình | Cùng quota CLI; giới hạn provider cần bổ sung | Model đã chọn, giai đoạn có dữ liệu, lỗi/kết quả đúng job |
| ASR/render | Bước con của công việc | Một ASR và một render trên mỗi máy, khóa độc lập | Lý do chờ; không đồng nhất số video đang edit với số render đồng thời |

Hoạt động là điểm theo dõi chung bốn nhóm hiện có. Mở video A để kiểm tra không chuyển context công việc B. Không tự nhả claim khi mất liên lạc hoặc tự retry việc có thể còn chạy. Chờ kiểm tra/tự xuất giữ trong từng job; đăng ngay/hẹn lịch là quyết định riêng. Cấu hình sâu thu gọn, không thêm sidebar theo session/provider/engine.

Đã có contact sidecar theo claim: báo ở take/progress và lệnh heartbeat thủ công cho phiên thực thi; báo trong 5 phút là reported, khác active worker. Stale cần kiểm tra, không chứng minh thất bại. Model nâng cao CLI/API và khôi phục payload/journal lô mới đã có kiểm browser/endpoint tổng hợp; các câu “chưa model picker/chưa heartbeat” ở mốc cũ không còn mô tả đầy đủ hiện trạng.

## 12. Nghiệm thu tiếp theo và phạm vi còn thiếu

1. Hai phiên AI thật dựng hai project đồng thời với worker CLI/API; đổi editor không làm lẫn candidate/log/output. Kiểm cùng project bị chặn và callback muộn không áp dụng sau hủy/thay revision.
2. Kiểm refresh/back, mất liên lạc, restart khi chờ/đang chạy, lỗi NAS/provider và tiếp tục có kiểm tra. Không tự replay job chưa xác định còn sống.
3. Đo nguồn thật: AI, ASR, build, render, token/chi phí, RAM/VRAM và NAS; chỉ tăng quota sau đo. Mục tiêu 50–100 video/ngày gồm phiên bản chưa được xác nhận bằng benchmark.
4. Bổ sung lịch sử/khôi phục bền vững, ưu tiên queue, grouping video gốc/phiên bản và các trường UI chưa có dữ liệu. Chỉ hiện nút khi thao tác có backend thực.

Mốc bằng chứng hiện hành: 200 service tests và các smoke đã lưu trong BUILD_STATUS; không chạy lại trong lần sửa tài liệu này. Remotion có worker riêng và Activity chờ render, nhưng state memory-only, tối đa 8 lượt cảnh hoạt động riêng với quota AI; chưa coi là queue bền vững. Không dùng số tests để suy ra số tính năng hoàn tất. Toàn bộ tích hợp ba app tiếp tục theo inventory chung.


## Lịch sử Remotion lưu trên đĩa · 04/11/2026

remotion-history.mjs lưu từng job vào workspace/contentos/remotion-jobs/<uuid>.json bằng temp+rename, chỉ trường dữ liệu không chứa child/IPC/credential. Giới hạn bản ghi128KiB, tối đa10000 file, kiểm schema/path/status; lỗi đọc hoặc ghi chặn nhận job mới thay vì bỏ lịch sử không rõ. Trạng thái/giai đoạn thay đổi được ghi; không ghi mỗi frame khi cùng phase. Scope workspace/project giữ nguyên.

Khi mở service lại, job terminal giữ kết quả/lỗi/lịch sử. Job running/cancelling không có child do service này sở hữu được chiếu interrupted trong Hoạt động/API với thông báo chưa xác minh; không báo đang chạy, không giả xác nhận hủy, không tự replay/nhả quyền hoặc xóa render lock. Job chưa xác minh vẫn chặn tạo cảnh mới cùng project và tính vào giới hạn cảnh để tránh nhân đôi. Chưa có thao tác đối soát/giải phóng các bản ghi này trong UI. Worker mất IPC yêu cầu abort; chưa nghiệm thu crash giữa bundle/render hoặc bảo đảm mọi process con thoát sau crash.

201service tests đạt(temp D), gồm reopen terminal, in-flight→interrupted/no relaunch, workspace scope, cancel chưa xác minh bị chặn và corrupt history chặn start. REMOTION_API_SMOKE.json mới chạy server thật: render/wait cancellation và restart sau terminal giữ succeeded+cancelled/Activity/hash, không sửa project. Lần đầu test gửi context header project cũ vào open sau restart bị guard chặn; sửa harness mở project trước rồi gắn lại header, giữ guard sản phẩm. Browser1280/1920 reedit/Save/Undo hồi quy đạt, exit0/no JS exceptions.

Main5180 restart sau khi dispatcher active/queued0, ASR/render idle và không có remotion-worker. Lần kiểm đầu trùng browser QA đang render nên hoãn, đợi QA kết thúc rồi kiểm lại mới restart đúng PID. Ping ready, Activity đọc8record scene của workspace hiện tại, tài nguyên idle. Không thử AI trả phí hoặc đăng bài, không sửa app nguồn. Các ghi chú memory-only/no-history cũ được thay ở phạm vi job Remotion; không suy ra toàn bộ scheduler/worker đã có phục hồi bền vững. Không tự xác nhận output integrity khi file bị thay sau restart; param preview restoration, installer, full AIEV composition/audio và mixed real-agent throughput còn thiếu.
## Điểm đọc hiện hành · 04/11/2026

[Hoạt động và dựng nhiều video](ACTIVITY_MULTI_EDIT_UX_2026-11-04.md) tổng hợp nghiệp vụ và bố trí UI từ yêu cầu nhiều phiên chat cùng CLI/API. Dùng mục 10–12 và BUILD_STATUS để đọc bằng chứng mới hơn các mốc lịch sử. Model nâng cao, contact reporting và phục hồi payload lô đã có; contact không chứng minh process chat còn sống. Lịch sử Remotion đã lưu đĩa nhưng việc bị gián đoạn chưa có UI đối soát; không tự replay hoặc nhả khóa. Những giới hạn còn lại vẫn phải nghiệm thu riêng.

