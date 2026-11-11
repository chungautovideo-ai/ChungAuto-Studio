# ContentOS — Rà soát điều hướng theo 7 ảnh giao diện ngày 04/11/2026

> Đồng bộ tài liệu 04/11/2026: đọc [điểm hiện hành và bản đồ build](BUILD_CURRENT.md) trước các mốc lịch sử. Mọi thay đổi UI phải theo [quy chuẩn thiết kế và quy trình UX/UI](DESIGN_UX_STANDARD.md): phân tích trải nghiệm, đối chiếu giao diện sẵn có và tham khảo ứng dụng phù hợp trước thiết kế/code. Trạng thái triển khai chỉ được xác nhận bằng bằng chứng đúng phạm vi trong BUILD_STATUS.


## Kết luận và phạm vi lần rà soát

Đã đọc cả 7 ảnh người dùng gửi và đối chiếu home.html, home.js, contentos.js, contentos-library.js, ket-noi-ai.js, giong.js và tich-hop.js. Giao diện hiện hành còn là shell VEK đổi thương hiệu, thêm một số nút/module ContentOS; chưa bàn giao trải nghiệm điều hướng hợp nhất ba app. Các bài kiểm tra dịch vụ/render không chứng minh người dùng tìm và dùng được toàn bộ chức năng.

Đây là điều chỉnh thiết kế điều hướng, không xác nhận đã triển khai sidebar mới. Công việc tích hợp tổng thể đang tạm dừng theo yêu cầu trước đó; lần rà soát chỉ sửa tài liệu, không thay quyền tài khoản hoặc tự chạy dịch vụ AI.

## Những gì ảnh chụp và code chứng minh

| Ảnh | Hiện trạng | Khoảng trống cần xử lý |
|---|---|---|
| 1 — Kho hiệu ứng | Chỉ có Văn bản/Đồ họa/Cảnh trám, số lượng0 | Đây là preset editor, không đại diện kho tư liệu, ảnh AI, mẫu/skill hoặc prompt của toàn hệ thống |
| 2 — Mạng xã hội | Màn khóa Pro và nút nâng cấp | Chưa chứng minh quản lý kênh/lịch/phát hành dùng được với tài khoản hiện tại |
| 3 — Tích hợp | Màn khóa Pro, mô tả tài khoản công cụ tạo cảnh trám | Khác cấu hình API/model; tên chung chung dễ nhầm với Kết nối AI |
| 4 — Trang chủ | Luồng video quay thô, nút NAS/Điện thoại, tin/kịch bản và phong cách/prompt bên dưới | Chưa có điều hướng dễ thấy cho ảnh, tư liệu, hoạt động và các đầu vào sản xuất khác; mẫu và tác vụ mới chen cùng một vùng |
| 5 — Kết nối AI | Codex đã đăng nhập, Claude chưa đăng nhập, có nút API/model | Lời giới thiệu chỉ nói hai CLI, chưa giải thích session/worker/API; đăng nhập không chứng minh có phiên chờ hoặc provider đã sẵn sàng |
| 6 — Giọng nói AI | Màn khóa Premium | Có module/service không đồng nghĩa luồng tạo giọng hiện dùng được |
| 7 — Tạo mẫu từ video | Form đăng nhập có nhãn email admin | Chưa rõ tài khoản app nguồn, quyền tạo mẫu cá nhân và quyền quản trị thư viện; không được nhập tài khoản ContentOS vào form gây hiểu nhầm |

## Điều chỉnh nguyên tắc

Giữ editor, preview, timeline, inspector và HyperFrames của VEK. Sidebar toàn ứng dụng được phép tổ chức lại theo công việc người dùng. “Không trùng” nghĩa là cùng dữ liệu, component và service được dùng lại từ các điểm vào; không có nghĩa giữ nguyên menu VEK hoặc cấm thêm điểm vào cho chức năng độc lập.

Mỗi mục chỉ một điểm đến chính; lối tắt ở Home/editor mở cùng công cụ trong ngữ cảnh dự án. Đổi nhãn hoặc chuyển vị trí không được tính là đã tích hợp chức năng. Chức năng chưa có adapter hiển thị trạng thái rõ trong phạm vi/chi tiết, không tạo nút chạy giả.

## Sidebar đích

| Nhóm | Điểm đến | Phân trang/tab bên trong và tái sử dụng |
|---|---|---|
| Sản xuất | Trang chủ | Giao việc nhanh; chọn đầu vào footage, kịch bản/tin hoặc dự án có sẵn; dựng mới và cắt clip giữ luồng VEK |
| Sản xuất | Dự án | Tìm/lọc dự án, trạng thái chờ duyệt/đã xuất/lỗi, phiên bản; danh sách video hiện có chuyển thành danh sách gần đây hoặc vùng thu gọn |
| Sản xuất | Hoạt động | Job AI/render/batch, tiến trình, lỗi và đầu ra; cần nối queue thực trước khi công bố chạy nền/phục hồi đầy đủ |
| Tài nguyên | Thư viện | Tư liệu local/NAS; Mẫu & Skill; Kho hiệu ứng; Phong cách & Prompt. Phân biệt mẫu thực thi, preset và tham khảo; cùng picker ở editor |
| Công cụ AI | Ảnh AI | Prompt, tham chiếu, model, kết quả và biến thể; dùng contentos-images.js hiện có, cùng kho ảnh và kết nối; mở từ Cảnh trám/Ảnh bìa vẫn giữ project |
| Công cụ AI | Video AI | Tạo/theo dõi/nhận kết quả từ provider được hỗ trợ; hiện adapter còn thiếu, không coi danh bạ tài khoản là engine tạo video |
| Công cụ AI | Giọng nói & Âm thanh | Dùng giong.js và kho audio hiện có; phân biệt tạo giọng, nhập file, chèn timeline; quyền provider và quyền module hiển thị riêng |
| Nội dung | Nguồn tin & Kịch bản | Đưa công cụ news hiện có thành điểm vào chính; giữ nguồn, duyệt phiên bản, liên kết voice/dự án |
| Phân phối | Kênh & Phát hành | Tab Kênh/Lịch/Nội dung đăng/Phân tích; dùng lại social và phân tích, không tạo kho kênh thứ hai |
| Hệ thống | Kết nối | Tab AI dựng (session/CLI/API), Ảnh/Video/Voice, Công cụ qua trình duyệt; một nguồn cấu hình, phân biệt tài khoản ghi chú và kết nối thực thi |
| Hệ thống | Cài đặt | Workspace/brand, lưu trữ, mặc định dựng/xuất, thiết bị/remote, nhập dữ liệu, cài đặt/chẩn đoán; dùng contentos.js và service hiện có |

Nhóm công cụ có thể thu gọn; không dùng 127nhóm tính năng làm127mục sidebar. Workspace selector hiển thị riêng ở đầu shell. Sidebar có scroll độc lập để công cụ không bị đẩy khỏi màn hình khi nhiều dự án. Giữ ngôn ngữ/màu sắc và mật độ VEK, không thay bằng dashboard làm mất ưu tiên edit.

## Trong dự án

Space/Studio là bộ đổi bố cục trên cùng dự án. Space giữ chat + preview; Studio giữ công cụ VEK + preview + timeline/inspector. Thư viện/Ảnh/Voice/News từ sidebar phải nhận context dự án rõ, hoặc mở chế độ workspace khi không có dự án. Không tự chèn tài nguyên khi chỉ mở công cụ.

Ba lựa chọn độc lập luôn nhìn thấy trong ngữ cảnh giao việc: bố cục Space/Studio; thực thi session Codex/Claude hoặc worker API/CLI; hoàn tất tự xuất/chờ kiểm tra. Tự đăng/lên lịch là cấu hình phát hành riêng. Nguồn A/B-roll từ chat dùng chung intake/NAS/điện thoại và không phải nhập lại.

## Quyền và các màn khóa hiện tại

Ảnh cho thấy quyền của VEK nguồn đang chặn social/tích hợp/voice/tạo mẫu. Đây là hạng mục còn tồn đọng, không phải lỗi trình duyệt hoặc chỉ cần F5. Không bỏ kiểm tra gói, giả account/admin hoặc sửa token để mở khóa. Cần kiểm quyền sử dụng mã/module và lựa chọn sản phẩm: dùng tính năng nguồn với quyền hợp lệ, hoặc triển khai module ContentOS độc lập theo API/công cụ được phép. Chưa có bằng chứng quyền để kết luận mọi module nguồn được tái phân phối/mở miễn phí.

Thiết kế phải hiển thị rõ module nào do ContentOS cung cấp, module nào cần tài khoản VEK/AutoSocial có quyền, module nào cần API key/subscription hãng. Nút mở cấu hình kết nối ContentOS không bị giấu trong màn upsell không liên quan; quyền tạo nội dung và chi phí provider vẫn được kiểm ở service. Không hiển thị toàn bộ gói VEK như gói ContentOS khi chưa có quyết định sản phẩm và quyền tương ứng.

## Thứ tự build và điều kiện nghiệm thu

1. Shell/điều hướng: tạo route/view map duy nhất, nhóm sidebar, workspace selector; đưa module đã có ra điểm vào chính, giữ các ID hoặc sửa đồng bộ handler/test. Chưa cần viết lại editor hoặc migration.
2. Hợp nhất Thư viện và Kết nối bằng container/tab quanh module/service hiện có; chuyển lối tắt Home/editor sang cùng route, bảo toàn context. Sửa lời giới thiệu CLI/API và nguồn quyền ở các màn khóa.
3. Nối Dự án/Hoạt động/phát hành với state thật và hoàn thiện adapter còn thiếu; không dựng bảng thống kê tiến trình từ file status cũ mà chưa xác minh worker.
4. Kiểm hành trình thực: mở sidebar → tạo/nhập nguồn → mẫu/skill → giao AI → chuyển Space/Studio → sửa/lưu → xuất → chuẩn bị phát hành. Các công cụ ảnh/voice/news phải dùng được độc lập rồi quay lại đúng dự án.
5. Kiểm1280×720 và1920×1080, refresh/back/deep-link, trạng thái rỗng/thiếu quyền/thiếu kết nối/lỗi/mất NAS, sidebar dài và unsaved edits. Chỉ dùng fixture/local khi chưa cho phép provider trả phí hoặc đăng công khai.

Mỗi hạng mục ghi riêng: đã có service, đã có UI, có đường vào sidebar, quyền khả dụng, đã kiểm đầu-cuối. Số test hoặc số mục đặc tả không thay các cột này. Việc rà soát này chưa kiểm đủ mọi màn của ba app nguồn lần nữa hoặc chứng minh đủ127nhóm; cần đối chiếu inventory từng tính năng khi thực hiện, giữ toàn bộ phạm vi blueprint.
