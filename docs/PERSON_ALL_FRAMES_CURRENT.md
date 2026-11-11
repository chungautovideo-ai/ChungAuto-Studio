# Kiểm tác động toàn thân qua mọi khung QA — 05/11/2026

Mục đích: thay việc suy từ bốn ảnh sang kết luận cả đoạn bằng phép đo từng khung của hai bản final QA đã có. Không chạy browser/CDP, không render hoặc sửa dự án, không gọi model/API. Script: tests/selected-person-all-frames-smoke.mjs. Kết quả: SELECTED_PERSON_ALL_FRAMES_SMOKE.json.

Script kiểm SHA/bytes của cả hai bản xuất với sidecar, xác minh hai project chỉ khác title/personLight 0→30, cùng semantic mask và các đoạn không cắt. Giữ bodySmooth17. Dùng timestamp thật của từng frame từ ffprobe, giải mã tất cả frame theo thứ tự, không lấy mẫu cách quãng hoặc đổi fps. So sánh ở độ phân giải mask; loại vùng biên ±4pixel bằng integral image để đo nội vùng người/nền. Đây phép đo tác động sáng toàn thân, không phải phép đánh giá riêng màu da.

Đã kiểm 181/181 khung của QA 6,006giây: 180 khung trong khoảng SAM2 có độ sáng người tăng tối thiểu9,572/255; chênh RGB trung bình nền cao nhất0,476/255, không pixel nội vùng nền nào lệch kênh trên8. Khung181 tại6,000s nằm ngoài selection[0,6), mask chỉnh rỗng; chênh RGB toàn khung0,474/255, không pixel lệch kênh trên8, phù hợp hiệu chỉnh đã tắt và sai số mã hóa. Các ngưỡng nội vùng và khoảng trống được ghi trong script/report, không dùng như tiêu chuẩn chất lượng tổng quát.

Lần chạy đầu dừng vì thiếu nội vùng người ở khung cuối; bằng chứng giữ trong SELECTED_PERSON_ALL_FRAMES_INITIAL_SMOKE.json. Kiểm lại selection chứng minh khung đó ngoài khoảng, nên script bổ sung nhánh kiểm hiệu chỉnh phải tắt thay vì bỏ qua hoặc giả có người. Không sửa app/renderer để làm test đạt. Lần chạy sau exit0, không bỏ khung nào.

Giới hạn: đây hai bản xuất QA đã tồn tại và có checksum, không xuất mới từ code hiện tại. Nguồn làm tối nhân tạo, một người,6giây. Chưa chứng minh màu da tự nhiên, viền tóc/ngón tay, nhiều người giao nhau, che khuất thật, preview/final parity, video dài hoặc tốc độ 4070S. Bước tiếp cần footage thật nhiều người/che khuất và nghiệm thu vùng biên, không cần chạy lại cùng QA để tăng số kiểm.

Đã bổ sung quy tắc kiểm đầu/cuối/gap trong references/person.md của thư viện Creativev50; không chép dữ liệu QA vào skill hoặc đổi snapshot việc đang chạy. Gói workspace/exports/chungauto-creative-v50-person-boundaries.zip được parse lại:11preset/5refs và có quy tắc mới,1.633.780byte; preset asset ngoài chưa đóng kèm như manifest. Không đổi UI/backend/renderer, không cần restart server. Kiểm offline exit0; không chạy suite rộng vì không sửa logic app.
