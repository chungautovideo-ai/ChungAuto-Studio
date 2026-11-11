# Người được chọn ∩ da semantic — triển khai renderer

Mục tiêu: SAM2 chọn một đối tượng qua nguồn/time, MediaPipe chỉ định vùng người/da. Hai mask giao nhau, không dùng foreground SAM2 như skin. Điểm vào UI vẫn Bộ lọc → Làm đẹp → Người & da toàn thân → nguồn. Khi nguồn có vùng chọn, hiển thị khoảng/số mẫu và nút Bỏ chọn để trở về toàn bộ người. Đã bổ sung dialog tạo vùng chọn và service hủy tác vụ: xem PERSON_SELECTION_DIALOG_CURRENT.md. Không tạo menu mới hoặc quảng bá công cụ hoàn chỉnh.

Dữ liệu camera.beauty.personSelections giới hạn40nguồn/120khoảng khôngchồng, mỗi khoảng1–15fps/≤120mẫu/cạnh≤256/RLE nhị phân, src/SHA256; tổng≤2triệu số. Shared helper applyPersonSelection giao kênh người/da sau ổn định+cọ, không mở nền. Ngoài khoảng hoặc sai hash nguồn đã có selection thì mask bằng0, không fallback toàn bộ người. Nguồn khác không có selection vẫn theo cấu hình toàn thân. Các hiệu ứng Da/Môi/Mắt/Khuôn mặt cũ dùng landmarks riêng, chưa giới hạn theo selection; UI cần ghi rõ selection chỉ cho ba thanh toàn thân.

Preview live và HTML final nhúng cùng hàm, cache tính theo sourceclock/selectionframe và reference; khi source đổi/cut/seek không dùng lại khung mask sai. Chỉ gỡ selection rõ ràng mới quay lại toàn người. Không đưa mask riêng sang template phong cách. Cần kiểm nguồn/hash/rate/ngoài khoảng/zero/không lớn nền và bản xuất thật. Phần theo dõi qua cut/che khuất vẫn chưa được đảm bảo.

## Kết quả kiểm

Unit2test schema/giới hạn/source/hash/range/rate và giao mask qua; suite262/262 ở workspace/logs/person-selection-suite.log. ActualWebGL synthetic trong PERSON_SELECTION_WEBGL_SMOKE.json: trái lifted176/126/100, phải original157/104/80; khi sourceclock rate2 sang mẫu2 đổi bên đúng, ngoài khoảng/saihash bỏ hiệu chỉnh, bỏ selection trả cảhai theo masksemantic. Cọ vẫn chạy trước selection nên không mở ra người không chọn.

MediaPipe thật quét fixture cùng người Q2 nhân đôi1giây/30fps, kết hợp SAM2 thật8fps/samehash; PERSON_SELECTION_REAL_SCAN_SMOKE.json. UI mở project đã có selection, hiển thị giới hạn3thanh, bỏ chọn→Save→Undo→Save phục hồi1selection, không pageerror. Ảnh390đãxem tại PERSON_SELECTION_UI_390.png; không tuyên bố toànmobileđạt.

QA workspace/content/2026-11-04/contentos-smoke-selected-person final-2.mp4 xuất1920×1080/30fps/1giây/exit0 với bodyWhite45 chỉngườitrái; final-3 là baselinebodyWhite0, sau đó phục hồi project cóselection45. Ảnh PERSON_SELECTION_FINAL.png đãxem. So cùngkhung.4s, pixelmeanRGBdiff trái2.411/phải1.046; ngưỡngthửbanđầu ratio3khôngđạt do codecnoise. Pixel đổi>8 tập trungtrái86735/phải280, chứngminh hiệuứng tập trung bênchọn nhưng khôngnềnlossless/toànvideo. Bằngchứng PERSON_SELECTION_FINAL_COMPARE.json ghi cảcheckđầu khôngđạt. Không sửa ngưỡng thành tuyênbố bảo toàn tuyệtđối.

Main5180restart khi dispatcher0/0/renderASRidle/đúngPID, moduleperson-selectionHTTP200. Chưa có tác vụ service/cancel/API hoặc UI tạo selection bằngđiểm; mask QA được gắn bằngharness, chỉ UI quảnlý/bỏchọn đã chạy. Không tăng skillversion hoặc thôngbáo người dùng đãdùng được end-to-end. Bướctiếp là servicejob và dialog chọnđiểm/review/apply/Undo/Save.


Nhiều khoảng vàclockfinalđãtriểnkhai/kiểm: PERSON_SELECTION_RANGES_CURRENT.md. KhắcphụctimelineGSAP0s khikhônggraphic; kiểmfinal6s4frame haikhoảng/gap trong PERSON_SELECTION_RANGES_FINAL_SMOKE.json. Bằngchứngfinal1s trướcđó khôngđủpháthiện lỗi clocknày; khôngdùngnóthaykiểm khoảngdài.
