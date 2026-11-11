# Cảnh trám có mốc trong đoạn A-roll bị bỏ

## Phân tích UX và quyết định

Người dựng ngành xe cần giữ cảnh sản phẩm khớp lời sau khi bỏ đoạn nói. `timemap.srcToOut` có quy tắc rõ: mốc trong đoạn bị bỏ dời tới đầu đoạn giữ kế tiếp. `resolveTimeline` giữ duration output, không tự cắt mediaStart của B-roll. Đây là hành vi có sẵn theo thiết kế timemap, không đủ căn cứ thay ngầm trên mọi dự án từ lỗi excerptQA.

Theo disclosure hiện có ở BROLL_EDITOR_TIMING_CURRENT.md và BROLL_PHRASE_UI_CURRENT.md, thêm câu giải thích ngay cạnh thời gian sau cắt, không thêm form/menu/modal. Hiển thị mốc gốc và lý do dời; tìm lời/Xem giúp kiểm trước sửa at/dur bằng control có sẵn. CLI/API timing cùng cờ để AI không gọi mốc đó là bằng chứng đã khớp lời.

Giữ token/help/textwrap và keyboard/focus hiện có, không thêm thao tác hay autosave/Undo. Không thay project, renderer hoặc duration; không tự bỏ cảnh vì có thể người dựng chủ ý giữ montage. Backend cần nạp mới nếu muốn APIreport có cờ; UIstatic/CLI nạpfilemới. NativeUI/responsive chưa được kiểm, không tuyên bố parityCapCut hay sửa mọi overlay.

## Hợp đồng

`projectAt` vẫn là mốc gốc. `anchorMoved` cho biết at không nằm trong đoạn giữ và đượcsrcToOut dời tới nội dung kế; `anchorOutsideContent` báo không còn phần nội dung sau mốc. CLI/APIreport thêm advisory ANCHOR_IN_REMOVED_FOOTAGE/ANCHOR_OUTSIDE_CONTENT. Cờ chỉ lời nhắc xem lại, không chặn hoàn tất hoặc tự sửa nguồn. Exact boundary theo isKept hiện hành (bao gồm out), không tự thay quy tắc điểm nối.

## Kết quả kiểm

Suite403/403 tại workspace/logs/broll-removed-anchor-suite.log: báo cáo/UI cùngcờ, đầu/gap/đoạngiữ/cuối, durationgiữ, khôngmutation; callbackpanelhiện/xóacâu giải thích và CLIcandidatewindowclaim cócờ. Phép này không đổi hình render nên không xuấtvideo mới.

Backendmain5180 đã nạp khi dispatcher0/0/renderASRpersonidle/noactivequeuedentry/nomediaworkers; PID40256→20260, pingOK, BROLL_REMOVED_ANCHOR_DEPLOY_SMOKE.json. HTTPmoduleanchor/UIimports đúngbyte, QAphrasehelper nguồn16,06/output15,46–16,21/hashgiữ vẫnqua. Skillv50editorial và ZIPremoved-anchor parse1mẫu qua. Chưa nativeUI/focus/responsive, chưa APIproviderthật dùngcờ mới hoặc fullvideoacceptance.
