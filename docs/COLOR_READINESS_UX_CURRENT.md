# Sẵn sàng chuẩn hóa màu — phân tích trước triển khai · 05/11/2026

Công việc: người dựng chọn đúng hệ màu và LUT kỹ thuật trước chỉnh sáng người hoặc LUT phong cách. Code dialog hiện có mô tả thứ tự và báo lỗi backend sau khi bấm Tạo, nhưng chưa nêu ngay nguồn Log thiếu LUT; refresh profile xóa cả look người dùng đã chọn. Tham khảo luồng VEK/ảnh chuẩn hóa1280/1920/390 đã kiểm ở COLOR_NORMALIZATION_CURRENT; dùng lại form/disclosure cùng dialog, không thêm sidebar. Không xem thêm CapCut trong lượt này.

Luồng đích: metadata → chọn/nhận profile → thông báo sẵn sàng hoặc việc còn thiếu → tạo dẫn xuất → xem → thay nguồn/Undo/Save. Nút Tạo chỉ mở khi yêu cầu đơn có thể chuyển; batch auto vẫn cho chạy vì từng nguồn nhận riêng và có báo bỏ qua. Không tự suy Log từ hãng/10bit. Profile thay đổi giữ LUT phong cách Rec.709 còn hợp lệ, bỏ LUT kỹ thuật không khớp. Giữ server làm xác minh cuối, không dùng UI thay kiểm provenance/hash.

Trạng thái/thành phần: p.help role=status cạnh select; cập nhật khi đổi profile/LUT/chống rung/batch, nhập hoặc nhận LUT. Không thay status kết quả/API. Khi xử lý vẫn khóa control. Màu nhóm cũ; details chứa import/kho. Dialog cuộn390/1280, không thêm layout.

Dữ liệu: không đổi schema/renderer hay tự bật làm đẹp; sửa lời hướng dẫn thành người/da toàn thân và quét lại trên nguồn mới. Kiểm helper và component với payload metadata/LUT giả lập, endpoint/browser thực đã có kiểm; không tự nhận HDR/Log camera thật hoặc finalquality mới.


## Đã triển khai và kiểm

colorReadiness trong color-management.js hiện có tính trạng thái từ metadata/profile/LUT/chống rung. Dialog hiện thông báo cạnh LUT; khóa tạo đơn nếu thiếu profile/LUT hoặc Rec.709 identity. Batch auto vẫn cho backend xét từng nguồn/báo skip; profile tay phải đáp ứng điều kiện nguồn đã chọn. Giữ LUT phong cách khi đổi profile, bỏ kỹ thuật không còn khớp. Sau import/attach/đổi input/tạo xong cập nhật lại readiness. Tạo lượt mới xóa result cũ; hướng dẫn yêu cầu quét người/da trên bản nguồn mới, không dùng mask cũ cho file đã đổi. Chỉ đổi static UI/helper; không backend/renderer/schema/skill snapshot.

COLOR_READINESS_BROWSER_SMOKE.json: Chrome component với CSS/UI thật và metadata/LUT fixture; unknown/Log thiếu LUT khóa, LUT đúng mở, đổi HLG giữ look/bỏ technical, Rec.709 identity khóa, chống rung mở, batchauto mở; chỉ gọi info, không conversion/apply. Ảnh1280/390 đã xem, dialog không tràn ngang. Không coi fixture là hệ màu camera thật hoặc E2E Save. Node5/5 qua gồm readiness và FFmpeg HLG/PQ/skinlift với nguồn tổng hợp, giữ audio/nguồn/Undo. Không dùng skin-chroma fixture thay bằng chứng semantic người thật.

Không tăng phiên bản skill chỉ vì trạng thái form; Creativev47 cùng quy tắc profile/LUT/nguồn và lựa chọn beauty vẫn hiện hành. Không restart main vì static; người dùng tải lại trang để nhận. HDR/Log camera thật, chất lượng tông da/fulltimeline và máy sạch vẫn cần nghiệm thu.

Main chỉ phục vụ allowlist lib hiện có: helper đã đặt cùng color-management.js để dùng module chung, không tạo route mới hoặc cần restart server.
