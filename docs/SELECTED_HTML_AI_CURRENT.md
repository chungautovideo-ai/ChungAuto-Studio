# Bàn giao chữ HTML đang chọn cho AI

## Phân tích trước thay đổi

Người dùng chọn chữ HTML trong Văn bản rồi yêu cầu sửa “mục này”. app.js aiSelection đã giữ group blocks nhưng nhãn chat gọi labelOf theo tab texts nên hiện (trống); resolveEditSelection trả supported:false không ID/version cho blocks và inbox ưu tiên object này hơn context gốc. CLI có thể không biết đối tượng dù UI đã chọn đúng. API patch blocks chưa hỗ trợ và vẫn giữ giới hạn đó.

Dùng luồng Nhờ AI sửa/selection checkbox và component VEK hiện có, không thêm menu. Nhãn dùng key gốc, backend chốt tham chiếu block thật duy nhất từ candidate, kèm ID/hash và supported:false cho API. CLI đọc đúng group/id, không suy ID toàn dự án, giữ dữ liệu còn lại. Thiếu/trùng ID cùng mảng hoặc stale version từ chối. ID trùng giữa texts/blocks hợp lệ. Kiểm unit forged/stale/duplicate và model Codex trên QA copy sửa đúng block, text cùng ID không đổi. Không dùng API trả phí/render/đăng.
`nBrowser còn phát hiện chữ null ở đầu chat Studio: native Element.append nhận null từ nhánh Space và biến thành text. Sửa thành mảng rỗng trải khi không có Space hint, giữ nguyên helper/component và bố cục.

## Kết quả ·05/11/2026

Backend giữ group/id/hash block có thật cho CLI, supported:false vẫn dành cho giới hạn API; từ chối ID thiếu/trùng trong cùng mảng hoặc version cũ. Chat dùng tên theo mảng gốc và không còn null thừa ở đầu Studio. Inbox thêm giải thích group blocks/ID và giới hạn API, không thay skill snapshot cũ.

316/316 unit trong workspace/logs/selected-html-suite.log, gồm lựa chọnHTML/IDtrùng khácmảng/forged/stale/APIblockvẫnkhóa. Syntax app/server/inbox qua; suite chạy trước sửa staticUI null và dòng hướng dẫn inbox, hai sửa đó kiểmsyntax/browser tiếp, không nhận suite đã chạy lại.

Codex CLI thật50,2giây: project contentos-qa-selected-html; selectedItem blocks/same/hash được chốt; chỉ HTML hiển thị đổi NÂNG CẤP XE→AN TÂM MỖI CHUYẾN ĐI; deepEqual toàn project với kỳ vọng cho thấy texts trùngID/CSS/name/mốc/mọi field khác giữ nguyên. done/awaiting-review, khôngrender. REAL_CODEX_SELECTED_HTML_SMOKE.json. Snapshot dùng skillv50 hiện hành có guide group/id từ lượt trước; dòng inbox mới bổ sung sau run chưa modeltest riêng.

BrowserQA5194 mở bản Codex đã lưu: Văn bản2, chọn Lợi ích ngành xe thấy đúng câu mới trong inspector, chat/header và placeholder cùng tên, khôngpageerror, tải lại giữ. SELECTED_HTML_AI_DESKTOP.png đã xem. Đây là fixture1s kiểm bàn giao và editor; chưa nghiệmthu fullvideo hoặc APIpatchHTML, mobilechat chưa kiểm lại. Main5180 restart sau dispatcher0/0/renderASRpersonidle/khôngmediaworker/đúngPID19836, pingcontentosOK. WorkspaceChungAuto20483e61-6b32-4881-8611-a9cc687402b5 đã khôi phục. QAserver dừng sau idle/đúngPID.
