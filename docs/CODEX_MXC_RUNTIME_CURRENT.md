# Phục hồi worker Codex bằng MXC

Triển khai main5180: sau session28515 terminal và QAserver thoát, dispatcher0/0, render/ASR/personTrackingidle, không thấy workerContentOS phù hợp còn chạy; xác minh PID26808 có command đúng serverContentOS5180 rồi chỉ dừng PID đó. installer/start.ps1 mở lại, ping contentos và catalogv50 qua; CLI_COMPLETION_DEPLOY_SMOKE.json lưu trạng thái. Model thật kiểm ở QA5193 trước triển khai, chưa chạy lại trên main.

Cập nhật: lượt session54114 đã terminal lỗi EACCES khi bàn giao localhost, candidate được giữ; không áp project. Đã bổ sung kênh bàn giao file và cổng server đúng, xem CLI_COMPLETION_HANDOFF_CURRENT.md. Lượt model tiếp theo session28515 đã terminal mã0, server áp candidate và done/awaiting-review; không dùng checkpoint đang-chạy cũ bên dưới làm trạng thái hiện hành. Chưa nghiệm thu fullvideo/mix.

Nguồn chính thức đã đọc: https://learn.chatgpt.com/docs/windows/windows-sandbox (redirect từ https://developers.openai.com/codex/windows/), mục MXC compatibility và Configure Windows sandbox. Trang nêu CLI0.162+ có thể thử một lệnh với windows.sandbox=mxc, --include-managed-config --permission-profile :workspace; explicitMXC lỗi khi thiếu khả năng native/policy chặn. Không dùng fallbackunelevated vì yếu hơn isolationnetwork và chưa được yêu cầu.

Máy: WindowsDisplayVersion25H2/build26200.9711. CLIquaPATH npm0.161.0 vẫn lỗiACLlegacy32. CLIđãcài trongdesktop0.166.0-alpha.5.1 chạyMXC_OK/nodeversion thành công với tùychọn chỉ tiếntrình; không update/install hoặc sửa config.toml, ACL, credential hoặc dừng node_repl. Versiondesktopalpha được ghi rõ, không nhận làbảnstablechungmọimáy.

Đã thêm prepareCodexWorkerRuntime: thửruntimeđangchọn trước; nếu sẵn sàng/unsupported giữnhưcũ. Chỉ lỗiCLI_EXEC_UNAVAILABLE mới thửexplicitMXC trênCLIđãcài hỗtrợ>=0.162 (runtimegốc hoặcdesktop). Probe phảiqua rồi mớilaunchcùngconfigArgs. Không tựdowngradefullaccess/unelevated. DesktopCLI phảiđăngnhậpđược. Logghi sandbox/runtimeđãchọn; usermodel vàworkspace-writegiữ. Chưađưa lựa chọnruntime raUIriêng hoặc sửa cấu hìnhngườidùng.

CODEX_MXC_RUNTIME_SMOKE.json: service thực từnpmlỗi→desktopMXCready. Probequyền: ghi workspace/cache/mxc-permission-qa/inside.txt được, ghiD:\contentos-mxc-write-denial-PID.txt bịtừchối. Lượtđầu thửTempcho phépghi làhànhviphùhợp quyềnTEMP, đãxóafilethử và khôngdùngnóđểnhậnfullaccess. Probe cóthể chạythiếtlậpsandboxthôngthườngcủaCLI, khôngsửamáy thủcông.

Nodeunit5/5 gồm giữruntimeđanghoạtđộng,capversion,configargsMXC/managed,khôngdowngrade,lỗigốcvàcontext; suite300/300ởworkspace/logs/codex-mxc-suite.log. Main5180chưarestart vìworkerQAđangchạy; QAserver5193đọccode mới. Chỉtriểnkhaimain sauworkerterminal/resourceidle/đúngPID.

Lượt thực Q2v50 ở workspace/content/2026-11-04/contentos-qa-real-codex-q2-3: workerđãnhậnclaim/đọctranscript/skillv50 vàchạylệnh quaMXC; chưa terminal tại checkpoint này. Theo dõi session54114vàprocessCodex71988, khôngtựdừng/restartvìhếttgianquan sát. Khôngnhậnđãdựngđạt,đãxemmọihìnhhoặcfullmixchođếnkiểmđầura. Harness tests/real-worker-q2-v50-smoke.mjs vẫnrestoreworkspacechỉkhiterminal. KhôngAPItrảphí/NAS/render/publish.
