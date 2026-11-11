# Mốc cuối chính xác cho vùng người — phân tích trước sửa

Người dùng chọn khoảng theo giây nguồn trong dialog Bộ lọc → Làm đẹp. Code hiện lưu chỉ from/fps/f, mọi nơi suy cuối bằng from+f.length/fps. Khi duration không chia hết chu kỳ mẫu, ví dụ0,2s ở8fps cho2mask, thời gian suy ra là0,25s; hiệu chỉnh có thể vượt khoảng đã yêu cầu. Guard hiện kiểm số mẫu tối thiểu nhưng không chặn số mẫu vượt yêu cầu.

UX: giữ nguyên dialog, danh sách khoảng, ba thanh, Undo/Save; dùng lại luồng VEK và bằng chứng PERSON_SELECTION_RANGES_CURRENT/PERSON_TRACKING_ERROR_UX_CURRENT. Không thêm menu/control/provider. Chọn lại/xem/lấy khoảng tiếp phải dùng đúng mốc cuối đã lưu; đoạn ngoài khoảng giữ hiệu chỉnh tắt. Chưa quan sát CapCut mới, không nhận sao chép hành vi CapCut. UI tĩnh/VM kiểm số liệu, browser còn hạn chế truy cập nên không tuyên bố native UI mới đã nghiệm thu.

Dữ liệu dự kiến: optional to trong selection. Dữ liệu cũ không có to giữ suy ra từ mẫu. to hợp lệ lớn hơn from, không vượt cuối mẫu và không bỏ mẫu cuối. Kết quả tracker được chặn số mẫu tối đa theo yêu cầu; to mới=min(from+duration,from+samples/fps). Không kéo mask qua vùng chưa có mẫu. Mọi consumer preview/final/source-adjustment/scope/measurement/dialog phải dùng cùng mốc. Không migrate dự án cũ, không sửa bytes/media người dùng.

Kiểm: schema legacy/invalid/roundtrip, merge khoảng sát nhau/override, resolver/summary/worker đúng from/to; helper nhận kết quả fractional/oversized/truncated; build nhúng chung helper và dữ liệuto. Kiểm rendering cần QA mới, giữ dữ liệu cũ. Không nhận toàn bộ nhận diện đã đúng từ phép kiểm mốc.

## Kết quả triển khai

Đã thêm optionalto theo quy tắc trên; dữ liệu legacy không migrate. Tracker cap số mẫu tối đa và dùngto=min(requestedEnd,sampleEnd), không bù mask thiếu. Renderer/cache/resolver/scope/API chỉnh khoảng/phépđo/UI nhãn/chọnlại/xem/khởi tạo khoảng tiếp cùng đọcto. Shared applyPersonSelection và resolver tự chứa nên preview/final nhúng cùng logic, không import helper ngoài vào HTML.

HTTP QA phát hiện lỗi thật ở luồng lưu: commitProject ghi project trước khi build phát hiệnto không hợp lệ. Đã chuyển kiểm normalizePersonSelections vào trước mọi history/write của commitProject (áp dụng cả editor và candidate commit). Mốc cuối sai trả400, byte/revision/history giữ nguyên; các loại lỗi build khác chưa được khẳng định có rollback. tests/project-revisions.test.mjs kiểm cả lần lỗi không sinh.history/tmp và lần hợp lệ lưu được. Không dùng nhánh sửa này để sửa dữ liệu dự án người dùng.

Suite358/358: workspace/logs/person-exact-end-suite.log. Ca mới gồm0,20s/8fps không kéo0,25s, surplus/truncated/hash/model/method, adjacent/mergegiữoverride, resolver/gap/report/worker range, production beautyForm VM nhãn1,80s/firstinput, schema/commit. VM không xác nhận nativebrowser/focus/UndoSave.

Hai final QA mới1s/30fps/H2641080×1920 trên nguồn tối nhân tạo và maskđãlưu: selectionto0,96 trong8mask phủ1s, personLight0/30/bodySmooth17. Tại0/0,5/0,9333s có tác động;0,9667s mask chỉnh0pixel, chênhRGB trung bình0,539/255, khôngpixel lệchkênh>8. Kiểm snapshotHTML nhúng helper/to, savedproject giữto và sidecarSHA/bytes; nguồnQA giữchecksum. PERSON_EXACT_END_FINAL_SMOKE.json. Contactảnh hàngtrênbaseline/hàngdướilift, tráitrướcmốccuốiphảisaumốc đã xem: PERSON_EXACT_END_CONTACT.png. Không kiểm lại inference hay nhận diện danh tính.

Harness render lầnđầu sai đường dẫnindex.html vì app build trong render-snapshot; bảnxuất thànhcông, lỗi nằmởasserttest. Đãsửađọcđúngsnapshot, chạyQA mới. HTTPharness banđầu phát hiện500và invalidprojectđãghi, khônglàm yếuassert; sửastatus và precommitguard rồi chạyQA mới. PERSON_EXACT_END_HTTP_SMOKE.json: PUT0,88→GETgiữ, to1,01 bị400khôngghi, stale409, restore0,96→GET; workspace store bytegiữ, serverQA56924đãthoát. Không sửa dự án gốc.

Đã cập nhật references/person.md và ZIP workspace/exports/chungauto-creative-v50-exact-person-range.zip, parse11preset/5refs/quytắcto mới. Không sửa snapshot job cũ. Main5180nạpbackend mới sauidle/đúngPID61956→19192, dispatcher0/0/renderASRtrackingidle/khôngmediaworker/pingready; ba moduleHTTPkhớpcode đãlưu. PERSON_EXACT_END_DEPLOY_SMOKE.json. UI cần tải lại trang. Chưa browsermới, cleanmachine/6máy, đa người/chekhuất/da/viền/qualitytoànvideo. Goalnângcấprộng chưahoànthành.
