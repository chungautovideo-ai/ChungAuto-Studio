# Gợi ý sáng người/da — phân tích UX trước triển khai

Điểm hiện tại: người dùng chọn file và kéo ba thanh riêng, chưa có số đo giúp nhận biết nguồn tối. Dùng lại lượt quét mask local và panel Làm đẹp. Mô hình tham khảo là đo trước, xem gợi ý rồi áp dụng như điều chỉnh tự động trong trình dựng; không tuyên bố đã quan sát engine CapCut. Không thêm menu, không tự áp hoặc bật làm đẹp sau quét.

Trong lượt quét lấy tối đa120 mẫu phân bố toàn nguồn, đo histogram luma hiển thị trong người và da bằng mask semantic. Lưu thống kê gọn theo nguồn/hash cùng face.json. Chỉ đề xuất nâng nhẹ khi ít nhất3mẫu có vùng đủ lớn và độ sáng nhất quán; không suy tông da gốc hoặc HDR/Log từ thống kê. Đây heuristic độ sáng, không chuẩn hóa màu hay nhận diện da tối tự nhiên. Khung có ánh sáng thay đổi mạnh cần chia đoạn/chỉnh tay.

Chọn một nguồn trong nhóm Người & da toàn thân → thấy số mẫu và gợi ý → Áp dụng gợi ý cho nguồn này → cùng override/Undo/Save. Không đủ dữ liệu ghi rõ quét lại; đủ sáng không thêm tác động; mọi gợi ý giữ mịn da0. Mức hiển thị giới hạn nhẹ, người dùng vẫn sửa ba thanh. Dùng token/helper/button chung, một hành động phụ cạnh nội dung, không tự gọi model/API. Cần kiểm pixel sáng/tối/nền cùng màu, mask thiếu/vùng nhỏ/phơi sáng biến đổi, lưu/mở lại và Apply/Undo.

## Đã triển khai và kiểm · 05/11/2026

person-exposure.js đo luma RGB hiển thị theo mask semantic, median/p95; tổng hợp tối đa120mẫu phân bố nguồn bằng bước ceil(n/120), chỉ vẽ canvas tối đa256chiều ở những mẫu cần đo. Số đo lưu exposure trong track nguồn đã gắn fingerprint; server kiểm version/method/range/samplecount trước lưu. API face chỉ trả summary kèm src/hash trong metadata. Quét cũ không bị lỗi; panel hướng dẫn quét lại để có số đo.

Gợi ý cần3mẫu có vùng đủ lớn, median/spread/highlight hợp lệ; spread lớn từ chối mức chung toàn nguồn. Chỉ một trong personLight≤30 hoặc bodyWhite25, bodySmooth0; không cộng dồn hai kiểu nâng. Nút Apply ghi vào sourceAdjustments có sẵn, không tạo renderer/engine thứ hai. Cảnh đủ sáng trả0; nguồn ít/không người không đề xuất. Có giải thích đây không phải tông da tự nhiên hoặc HDR/Log; chuẩn hóa nguồn vẫn độc lập. Chưa đánh giá khoa học ngưỡng trên nhiều tông da, nguồn ngược sáng hoặc màu camera khác nhau.

Unit kiểm nền sáng/tối không ảnh hưởng số đo semantic, thiếu/tiny mask, đủ sáng/tối/ít mẫu/biến đổi lớn, từ chối summary sai. Suite258/258 ở workspace/logs/person-exposure-suite.log. Browser MediaPipe thật trên Q2 crop1s và bản flip làm tối nhân tạo eq brightness=-0.25: mỗi nguồn31mẫu; gốc skinmedian.502 không đề xuất, bản tối.212 đề xuất bodyWhite25/personLight0/bodySmooth0. Quét/chọn không áp, Apply→Save→Undo→Save→Redo→Save qua, pageErrors0. PERSON_EXPOSURE_UI_SMOKE.json ghi số đo, ảnh1280/390 đã xem. Đây thử nguồn làm tối có chủ đích, không chứng minh tự chỉnh đẹp mọi video. Lưu override dùng cùng schema/resolver v31 đã kiểm bản xuất; lượt này chưa xuất thêm hoặc kiểm fullvideo.

Server5180 restart khi dispatcher0/0/renderASRidle, đúngPID; /lib/person-exposure.js HTTP200. Creativev32 giữ11preset v31, quick_validate qua/catalog có; các bản cũ/job snapshot không đổi. Không cài model mới hoặc gọi API/model trả phí. Chọn từng người và mask tracking chưa hoàn thành.
