# ContentOS — Quy chuẩn thiết kế và quy trình UX/UI

Yêu cầu hiện hành của người dùng ngày04/11/2026: giao diện phải đồng bộ ngôn ngữ thiết kế; phân tích trải nghiệm người dùng và tham khảo ứng dụng phù hợp trước khi thiết kế. Áp dụng cho Home, sidebar, editor, Space, dialog, Cài đặt và mọi tính năng nhập từ ba app. Đây là yêu cầu phát triển, không phải tuyên bố toàn bộ UI hiện đã đạt.

## 1. Bắt buộc phân tích trước khi sửa giao diện

Với mỗi hạng mục, ghi bản phân tích ngắn theo [mẫu](UX_CHANGE_RECORD_TEMPLATE.md) trong tài liệu chuyên đề hoặc bản ghi thay đổi. Hoàn thành phân tích rồi mới chỉnh UI; không cần xin duyệt lại cho các quyết định thường lệ đã được người dùng giao.

1. Xác định công việc người dùng, đầu vào, kết quả, tần suất, vai trò và thiết bị. Phân biệt AI tự làm, người dùng can thiệp và các thao tác cần giữ quyền chủ động.
2. Khảo sát luồng hiện tại bằng giao diện thực/ảnh người dùng và code: điểm vào, trạng thái, số lần chuyển màn, khó tìm, trùng chức năng, dữ liệu đang giữ. Ghi rõ nguồn/bằng chứng và điều chưa quan sát được. Không nói đã xem app chỉ vì đọc code.
3. Đối chiếu VEK làm nền và app phù hợp với nghiệp vụ: CapCut cho audio/text/media, Premiere cho điều khiển chuyên sâu, AIEV/Studio cho workflow AI/remote, ứng dụng khác khi có lý do. Dùng bằng chứng đã khảo sát còn phù hợp hoặc khảo sát mới khi thiếu; không bắt buộc khảo sát lại mọi app cho một sửa nhỏ. Ghi học được điều gì, áp vào đâu và vì sao. Không sao chép asset/catalog hoặc quảng bá parity chỉ từ ảnh.
4. Lập bản đồ chức năng → màn/tab/component/service đang có. Ưu tiên dùng lại; thêm menu/tab chỉ khi chứng minh nhóm hiện tại không đáp ứng và giải thích đường đi. Không tổ chức điều hướng theo tên app nguồn, provider hoặc engine.
5. Chốt luồng đích, bố cục, hành động chính, điều khiển sâu, trạng thái tải/trống/lỗi/chưa lưu/xung đột/không khả dụng; xác định responsive và tiêu chí kiểm. Với thay đổi lớn, có wireframe/prototype trước code; không biến yêu cầu này thành vòng xin phép ngoài phạm vi.

Nếu chưa truy cập được app tham khảo, dùng ảnh/bằng chứng có thật và ghi giới hạn, tiếp tục phần có cơ sở. Không bịa khảo sát hoặc tự cài công cụ ngoài phạm vi được giao.

## 2. Ngôn ngữ thiết kế chung

Nguồn hiện hành: editor/ui/app.css, editor/ui/contentos-navigation.js/.css, editor/ui/contentos-layout.css và component tương ứng. home.html cũng dùng app.css. Mở rộng chúng trước khi tạo style/component mới.

| Thành phần | Quy tắc |
|---|---|
| Màu | Dùng token --bg/--surface/--surface2/--surface3, --ink/--ink2/--muted, --line/--line2; lime --lime/#d8ff3e cho primary/selected/focus; --pink cho destructive/error theo ngữ cảnh. Không thêm palette tùy hứng từng module |
| Chữ | UI dùng --sans/--head hiện có (Inter/Inter Tight và fallback). Panton/Montserrat/Bebas là font nội dung video/brand, không đổi toàn UI theo mẫu video |
| Icon | SVG outline cùng bộ/kích thước; sidebar20px, nét và baseline nhất quán; có nhãn/aria-label. Không dùng emoji để thay icon điều hướng ở module mới |
| Nút | Tái sử dụng primary/outline/ghost/link/icon; một hành động chính trong vùng tác vụ, hành động phụ ít nhấn hơn; destructive rõ ràng. Chọn/đang dùng khác trạng thái tải/disabled |
| Form | Chung label/input/select/range/help/error, đơn vị/default/phạm vi rõ; slider có số để chỉnh chính xác. Dùng chung picker/model/source/voice/brand hiện có |
| Bố cục | Khoảng cách dựa trên4/8/12/16/24px; radius theo component hiện hành, thường10px control và12–16px panel/dialog; không biến mỗi field thành card lớn |
| Điều hướng | Sidebar theo công việc; editor rail theo công cụ; submenu theo nhóm như Bộ lọc/Âm thanh. Trạng thái chọn chỉ rõ và có ngữ nghĩa truy cập |
| Danh sách/kho | Search/filter/empty/loading/error; tên/nguồn/đang dùng rõ, thao tác nghe/xem thử và chọn tách biệt. Tên file dài wrap/ellipsis có cách xem đủ |
| Trạng thái | Có tải/thành công/lỗi/thử lại, lý do không khả dụng; không spinner vô hạn, empty giả hoặc progress phần trăm bịa. Có UI preview không đồng nghĩa backend chạy được |

Không tự thay toàn bộ token hiện tại trong một tính năng riêng. Nếu cần đổi thiết kế chung, ghi phạm vi ảnh hưởng và sửa component chung có kiểm hồi quy.

## 3. Luồng sử dụng và điều khiển sâu

- Giữ trải nghiệm dựng nhanh VEK: giao việc đơn giản, preview và thao tác sửa trực tiếp. Home giữ mẫu chọn nhanh; không bắt người dùng đi qua dashboard/cấu hình kỹ thuật để edit.
- Đưa tác vụ thường dùng ra trước; kỹ thuật/model/JSON và cấu hình ít dùng vào disclosure. Ẩn bớt phải vẫn tìm được và không mất khả năng tùy chỉnh sâu.
- Chung project/revision/timeline/Undo/Save; Space/Studio đổi bố cục không nhân bản dữ liệu hay giao job lại. Chat draft/input giữ ổn định khi đổi chế độ hoặc vẽ lại.
- Dùng cùng intake cho máy/NAS/điện thoại và cùng kết nối/model picker; không yêu cầu nhập credential lại tại mỗi công cụ. Không đưa token/host path nhạy cảm vào nội dung AI công khai hoặc gói phát hành.
- Chọn/nghe thử/xem trước không tự bắt đầu generation/export/posting. Thực thi theo hành động và chính sách người dùng đã giao; tự xuất độc lập tự đăng.
- Điều khiển phải có hiệu lực thật, lưu/mở lại đúng, Undo khi thuộc chỉnh dự án. Không thêm nút giả; chưa hỗ trợ thì nêu lý do/cách tiếp tục rõ.
- Nhiều video theo dõi trong Hoạt động chung, mở đúng project; không nhân menu theo chat/worker. Không đánh đồng báo liên lạc với xác minh tiến trình.

## 4. Responsive và truy cập

Thiết kế trước hành vi tại1920,1280,820,600,390px; thêm320px khi sửa shell/mobile. Desktop ưu tiên preview và không gian edit, tablet gom vùng phụ, mobile drawer/submenu ngang theo component có sẵn. Không chỉ thu nhỏ desktop. Xác định scroll container; dialog nằm trong viewport, nội dung/input/nút chính tiếp cận được, chat và timeline không chồng che nhau. Không tuyên bố mobile hoàn chỉnh chỉ vì một submenu đổi hướng.

Kiểm keyboard Tab/Enter/Space/Escape, focus có thể thấy, label/aria, trạng thái selected/expanded/disabled; backdrop đóng drawer và trả focus phù hợp. Không truyền trạng thái chỉ bằng màu hoặc tooltip không dùng được trên chạm. Thao tác chạm cần vùng bấm đủ rộng theo bố cục, mục tiêu khoảng44px cho nút chính mobile.

## 5. Quy trình kiểm và cập nhật tài liệu

Trước bàn giao UI:

- Xem giao diện render thật ở các kích thước liên quan và giữ ảnh/bằng chứng; kiểm luồng chính, điều khiển sâu, empty/error/loading, tên dài/dữ liệu nhiều và khả năng quay lại.
- Với sửa project: kiểm thay đổi → preview → Undo/Save/reopen đúng phạm vi; kiểm final khi thay schema/build/audio/layout ảnh hưởng đầu ra. Một ảnh đẹp hoặc DOM node có mặt không chứng minh chức năng hoạt động.
- Với chỉ sửa bố cục: dùng browser smoke phù hợp; không tạo test bắt chước CSS đơn thuần hoặc chạy trả phí để kiểm hình thức. Dữ liệu tổng hợp phải ghi rõ, không suy ra NAS/AI/provider thật đã đạt.
- Phân biệt kiểm component bằng callback/fixture với endpoint thật và end-to-end. Ghi file bằng chứng, trường hợp chưa kiểm, lỗi còn lại và giới hạn. Chỉ chạy lại suite rộng khi phạm vi/failure cần.
- Cập nhật BUILD_STATUS, đặc tả liên quan và điểm đọc hiện hành khi có thay đổi quyết định. Không chỉ nối thêm ghi chú ở cuối rồi để mở đầu nói ngược hiện trạng.

Tiêu chí hoàn tất một hạng mục UI: có phân tích trước làm, vị trí không trùng, đúng token/component, luồng dùng được, chỉnh sâu tìm thấy, responsive đã xem, dữ liệu/trạng thái đúng và bằng chứng khớp tuyên bố. Đây không phải nghiệm thu toàn bộ tích hợp127nhóm.
