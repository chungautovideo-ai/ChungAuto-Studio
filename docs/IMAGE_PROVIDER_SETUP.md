# Cấu hình tạo ảnh ContentOS (bản phát triển)

> Đồng bộ tài liệu 04/11/2026: đọc [điểm hiện hành và bản đồ build](BUILD_CURRENT.md) trước các mốc lịch sử. Mọi thay đổi UI phải theo [quy chuẩn thiết kế và quy trình UX/UI](DESIGN_UX_STANDARD.md): phân tích trải nghiệm, đối chiếu giao diện sẵn có và tham khảo ứng dụng phù hợp trước thiết kế/code. Trạng thái triển khai chỉ được xác nhận bằng bằng chứng đúng phạm vi trong BUILD_STATUS.


Module hiện dùng giao thức `POST <base>/images/generations`, đầu ra `data[0].b64_json`. Không sao chép key hoặc token từ ba app gốc.

Trên Windows, mở Tạo ảnh AI → Kết nối ảnh, nhập Base URL/model và khóa nếu cần. Cấu hình thuộc workspace; khóa mã hóa bằng DPAPI của tài khoản Windows hiện tại, lưu ngoài dự án tại LOCALAPPDATA/ContentOS/connections/<mã thư mục app>/<workspace>.json. API không trả khóa về trình duyệt. Để trống giữ khóa đã lưu nếu gateway không đổi; đổi gateway sẽ bỏ khóa cũ. Xóa cấu hình workspace khôi phục fallback từ biến môi trường. Lưu cấu hình không kiểm chứng tài khoản/model và không tạo ảnh.

Hoặc đặt các biến môi trường trước khi khởi động ContentOS (fallback khi chưa lưu cấu hình workspace):

- `CONTENTOS_IMAGE_BASE_URL`: base URL của gateway tương thích, thường kết thúc `/v1`. HTTPS hoặc HTTP loopback; không nhúng thông tin đăng nhập/query vào URL.
- `CONTENTOS_IMAGE_MODEL`: model ảnh mà gateway/tài khoản thực sự hỗ trợ.
- `CONTENTOS_IMAGE_API_KEY`: tùy chọn, gửi Bearer nếu gateway yêu cầu. Không đặt vào project hoặc NAS.

Không có fallback tự động. Người dùng bấm Tạo 1 ảnh mới gửi yêu cầu; lượt gọi có thể tiêu hao hạn mức của gateway đã cấu hình. GET danh sách và mở công cụ không tạo ảnh.

Mở từ Cảnh trám → Tạo ảnh AI hoặc Phong cách & Prompt → Tạo ảnh AI. Chọn prompt, phong cách AIEV đã nhập và khung ảnh. Hiện yêu cầu kích thước 1024×1024 / 1024×1536 / 1536×1024; hai kích thước sau là gần dọc/ngang, chưa phải xuất đúng 9:16/16:9. Bản tạo gốc chưa tự crop; bước xuất đúng tỷ lệ được mô tả bên dưới. Chưa tích hợp đầy đủ composite logo/poster.

Kết quả lưu theo workspace ở workspace/contentos/images; có tải file và nhập vào tư liệu dự án qua importer chung. Khi mở từ Cảnh trám, nút Chèn vào bản dựng tại playhead nhập file rồi chèn bằng công cụ cảnh trám VEK, dùng vị trí lúc mở dialog và kiểu cảnh trám đang chọn. Hoàn tác bỏ clip nhưng giữ file đã nhập; bấm Lưu để giữ bản dựng. Dự án/nội dung đổi trong lúc chờ sẽ từ chối chèn và yêu cầu mở lại công cụ. Model/size là giá trị yêu cầu; provider có thể từ chối hoặc trả khác, cần kiểm tra trước khi dùng sản xuất.

Sau tạo, dùng Xuất đúng tỷ lệ trong thẻ ảnh để tạo bản 1080×1080, 1080×1920 hoặc 1920×1080. Chọn giữ toàn ảnh + viền đen hoặc cắt giữa lấp đầy. Công cụ dùng FFmpeg/FFprobe đã cài, giữ file gốc và kiểm kích thước đầu ra. Ảnh bìa VEK có Chọn / Tạo ảnh AI để dùng cùng thư viện làm nền, sau đó chỉnh chữ theo thương hiệu. Luồng chọn ảnh và lưu thumbnail đầy đủ còn cần kiểm chứng.

Chưa tích hợp: ảnh tham chiếu/inpainting, sửa ảnh, nhiều biến thể, Compose poster Remotion của AIEV, provider Gemini native/web gateway lifecycle, model discovery, ngân sách/usage, queue bền vững và hủy request từ UI. Không gọi đây là hoàn tất tích hợp ảnh của cả ba app.


Ảnh tham chiếu: tại Kết nối ảnh, chỉ bật “Gateway/model hỗ trợ ảnh tham chiếu qua multipart /images/edits” nếu gateway thực sự có hợp đồng đó; đây là tự khai báo, không phải kết quả kiểm chứng. Env fallback CONTENTOS_IMAGE_REFERENCES=1. Trong công cụ ảnh chọn tối đa4kết quả đã có trong workspace; giới hạn tổng20MiB, kiểm hash/kích thước. Bấm tạo mới gửi bytes qua multipart, một file image hoặc nhiều image[]. Có thể tính phí tại gateway. Không gửi đường dẫn NAS hoặc khóa trong prompt. Kết quả giữ references{id,sha256,dimensions}, không sửa ảnh gốc. Đã kiểm gateway local giả lập, chưa provider thật. Ảnh tải lên/tham chiếu từ tư liệu dự án, mask/inpainting và các mục còn lại phía trên vẫn cần triển khai.


Nhập ảnh từ máy: trong cùng Tạo ảnh AI chọn file PNG/JPEG tối đa20MiB. Nhập chỉ lưu local vào thư viện workspace, kiểm decode/kích thước/checksum, không cần gateway và không tạo ảnh. Ảnh nhập có thể làm tham chiếu khi gateway được khai báo hỗ trợ; chỉ bấm tạo mới gửi ảnh. Giữ bytes gốc, bao gồm metadata có sẵn; không tự gỡ EXIF. Chưa chọn trực tiếp từ tư liệu dự án hoặc NAS trong bộ tham chiếu; có thể chọn file từ máy qua hộp chọn hệ điều hành. Đã kiểm ảnh tổng hợp/API/gateway giả lập; chưa provider thật hoặc fidelity sản phẩm.


Dùng ảnh dự án: từ Cảnh trám hoặc Ảnh bìa → Tạo ảnh AI → chọn Ảnh trong tư liệu dự án (PNG/JPEG) → Nhập ảnh dự án vào thư viện tham chiếu. Không chọn lại file trên máy, không sửa file nguồn, không gọi gateway khi nhập. Lưu project/source-relative path/checksum vào metadata ảnh local. NAS/phone phải nhập vào dự án trước; chưa đọc raw NAS trực tiếp. Revision/workspace đổi sẽ báo lỗi. Lối mở độc lập từ thư viện chỉ dùng catalog workspace.

### Nhiều phương án
Chọn 1–4 ảnh trong cùng công cụ. Adapter gửi n qua JSON hoặc multipart và yêu cầu gateway trả đúng số b64_json. Không tự retry hoặc tách thành nhiều lượt. Provider không hỗ trợ n sẽ báo lỗi; chưa xác minh provider thật. Phản hồi tổng tối đa40MiB.

Model cho lượt tạo: nhập ID model ảnh được gateway hỗ trợ, hoặc để trống dùng mặc định trong Kết nối ảnh. Không đổi cấu hình đã lưu. JSON generations và multipart edits đều nhận model hiệu lực; thẻ kết quả lưu model đã yêu cầu. Chưa tự tải danh sách model/xác minh năng lực từng model hoặc tự chọn model. Kiểm gateway tổng hợp và UI1280/1920 đạt; chưa provider thật. Xem UI spec124.

Lấy model từ gateway: nút bên ô model theo lượt dùng GET /models của kết nối ảnh đã lưu. Chỉ đọc khi bấm; giữ nội dung đang gõ tới khi chọn model. Gateway không có endpoint này có thể nhập tay. Danh sách không xác minh khả năng tạo/sửa ảnh hoặc giá. Đây là model discovery giao thức chung, chưa vendor-native/auto-model; cập nhật ghi chú chưa discovery phía trên. Khung PiP ảnh thông thường nay có chiều cao theo tỷ lệ file thật khi build; cần Lưu/build lại dự án cũ. Xem UI spec125.

Ảnh từ AIEV: tại Không gian làm việc → Nhập dữ liệu từ ứng dụng cũ → Khảo sát dự án nguồn, nhóm AIEV · Ảnh cho nhập riêng ảnh nền/hoàn thiện vào thư viện workspace. Giữ prompt và nguồn, không cần gateway. Ảnh hoàn thiện là file phẳng; lớp chữ Remotion chưa chuyển thành lớp sửa được. Giới hạn scan và bằng chứng fixture xem UI spec126.

Chữ ảnh AIEV: khi chọn từ Ảnh bìa VEK, ảnh nền đã nhập có nút Dùng nền và chữ AIEV cho ảnh bìa. Tiêu đề/phụ đề/CTA có thể sửa trước lưuJPEG; bố cục theo ContentOS, chưa clone chính xác poster Remotion/stats/logo. Ảnh hoàn thiện chỉ chọn làm nền. Nguồn không sửa; chữ vượt vùng sẽ yêu cầu rút ngắn/giảm cỡ. Xem UI spec127 và IMAGE_MIGRATION_COVER_BROWSER_SMOKE.

Mở ảnh bìa đã lưu: tại Ảnh bìa, chọn bản trong danh sách rồi Mở bản đã lưu để sửa; chỉnh nội dung và Lưu tạo bản mới. Khôi phục nền/chữ/cỡ/vị trí/kiểu, dùng font/màu thương hiệu hiện tại. Ảnh nền mất/đổi hash hoặc tỷ lệ dự án đổi sẽ báo lỗi. JPEG cũ giữ nguyên. Xem UI spec128/COVER_REOPEN_BROWSER_SMOKE.

Dùng ảnh qua AI dựng API: có thể giao tìm ảnh đã có trong workspace để làm cảnh trám. Worker có công cụ tìm metadata → nhập ID → kiểm media → sửa candidate; dùng cùng thư viện/storage. Không tạo ảnh mới hoặc gọi gateway ảnh. Prompt không chứng minh nội dung ảnh; cần xem kết quả dựng. Session Codex/Claude và CLI chưa dùng bridge tool này. File nhập có thể còn trong tư liệu nếu lượt dựng lỗi; xem UI spec129/API_WORKSPACE_IMAGES_SMOKE.
