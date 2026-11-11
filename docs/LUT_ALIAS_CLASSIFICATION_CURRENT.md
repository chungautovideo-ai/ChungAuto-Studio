# Phân loại LUT trùng nội dung · 05/11/2026

Lỗi: importLutDirectory dùng hash để gộp .cube nhưng mỗi tên trùng lại ghi đè kind/inputProfile. Alias chưa phân loại xuất hiện sau có thể xóa khai báo AppleLog; hai alias khai báo input khác nhau có thể chọn theo thứ tự duyệt.

Sửa trong src/services/lut-library.mjs: gộp classificationCandidates theo input, loại trùng và sắp ổn định. Alias chưa biết không xóa khai báo đã biết; nhiều input khác nhau trả unclassified/conflicting-input-profiles, cần chọn rõ trong luồng nhập LUT hiện có. readLutLibrary khôi phục các khai báo từ relative/name và basename các source đã lưu, chỉ trên catalog local, không đọc NAS hoặc ghi lại catalog khi xem. Không suy hệ màu từ camera/10bit; filename/header chỉ khai báo LUT, không phải xác minh transform thực tế.

Kiểm tests/lut-library.test.mjs: known+unknown, import lặp, legacy catalog mất phân loại/read-only recovery, AppleLog+DLogM conflict, từ chối attach thiếu khai báo, explicit selection, conflict giữ sau import lặp. Toàn suite278/278, workspace/logs/lut-aliases-suite.log. Catalog thật139/7technical/132unclassified/0conflict, evidence LUT_ALIAS_CLASSIFICATION_SMOKE.json. Không import lại NAS hoặc sửa media/project.

Triển khai: dispatcher0/0, Home không có render/ASR project, personTracking idle, không media worker; xác minh PID64984 đúng ContentOS5180 rồi restart riêng server bằng installer/start.ps1. Không dừng Python/app khác. Chưa benchmark footage HDR/Log camera thật, không thay bằng chứng phân loại thành chất lượng grade.
