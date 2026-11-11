# Khảo sát UI/UX VEK gốc và điểm tích hợp ContentOS

> Đồng bộ tài liệu 04/11/2026: đọc [điểm hiện hành và bản đồ build](BUILD_CURRENT.md) trước các mốc lịch sử. Mọi thay đổi UI phải theo [quy chuẩn thiết kế và quy trình UX/UI](DESIGN_UX_STANDARD.md): phân tích trải nghiệm, đối chiếu giao diện sẵn có và tham khảo ứng dụng phù hợp trước thiết kế/code. Trạng thái triển khai chỉ được xác nhận bằng bằng chứng đúng phạm vi trong BUILD_STATUS.

Ngày: 03/11/2026. Nguồn: D:/Edit tự động/video-edit-kit, AutoSocial v1.0.78, localhost:5173.
Phạm vi: khảo sát, không chỉnh code ứng dụng. Đây là phân tích giao diện và luồng, không phải chứng nhận mọi tính năng hoạt động.

## 1. Bằng chứng và giới hạn
- REA mở trang chủ VEK gốc, chụp màn hình, đọc accessibility.
- Đi qua dự án có sẵn: Edit → Thiết lập trước khi AI edit → Bỏ qua — tự chỉnh tay → editor.
- Quan sát màn hình Kho hiệu ứng, Kết nối AI, Cắt clip ngắn, cửa khóa Tích hợp/Mạng xã hội/Giọng nói.
- Mở Cảnh trám trong editor, hộp Ảnh bìa và hộp Xuất video. Không bấm xác nhận xuất, không tạo AI job, không lưu ảnh bìa hoặc đăng bài.
- Editor thực tế có bộ công cụ nằm ngang trong nửa trái, bảng thư viện bên dưới, preview nửa phải, timeline dưới cùng. Không dùng mô tả thanh icon dọc từ các đoạn CSS cũ: CSS cuối file ghi đè layout desktop.
- Chưa kiểm đầy đủ từng inspector, thao tác kéo/cắt/lưu, playback dài, lỗi AI, phục hồi sau crash, màn hình điện thoại vật lý.
- Tài khoản hiện tại Basic: không vượt khóa gói. Nội dung bên trong các module Pro/Premium được phân tích từ code, không ghi là đã thử runtime.
- Lần capture trang chủ đầu sau 1,2 giây chưa thấy catalog; lần sau thấy danh mục và nhiều mẫu. Chưa đo nguyên nhân hay thời gian tải chuẩn.
- Không có page-error trong các capture editor, cảnh trám, ảnh bìa, xuất được kiểm tra; điều này không chứng minh không có lỗi nghiệp vụ.

## 2. Mô hình trải nghiệm của VEK
VEK xoay quanh một việc: đưa video vào, AI dựng theo mẫu, người dùng sửa bằng mắt và tay.
Các lớp:
1. Trang chủ: bắt đầu việc, tìm mẫu, xem dự án.
2. Thiết lập: bổ sung ý định và tư liệu trước khi giao AI.
3. Chờ AI: tiến trình theo bước, có thể thu nhỏ, xếp hàng hoặc chạy ngầm.
4. Editor: lựa chọn thành phần → xem/sửa thuộc tính → preview và timeline.
5. Đầu ra: ảnh bìa, dựng nháp, bản sửa CapCut, xuất và đăng.
6. Cấu hình/kho dùng lại: hiệu ứng, AI, công cụ tạo media, voice, kênh.

Điểm cần giữ: AI tạo bản đầu nhưng sản phẩm vẫn là dự án chỉnh được. Người dựng không phải chuyển giữa nhiều dashboard để hoàn thành một video.

## 3. Trang chủ
Hiện có:
- Sidebar: Trang chủ, Kho hiệu ứng của tôi, Mạng xã hội, Phân tích kênh, Tích hợp, Kết nối AI, Giọng nói AI; Tạo mẫu từ video tùy quyền/trạng thái.
- Tìm video, danh sách dự án, trạng thái dung lượng, chạy nền và tài khoản.
- Vùng trung tâm: Edit video / Cắt clip ngắn; thả video; tỷ lệ tự nhận/9:16/16:9; ghi chú; đính kèm tư liệu; chọn mẫu; AI edit.
- Catalog mẫu bằng thẻ trực quan, tìm kiếm/lọc, tải ZIP mẫu.

Điểm tốt:
- Một hành động chính rõ ràng, phân biệt màu lime.
- Người mới có thể dùng mặc định; mô tả yêu cầu bằng tiếng Việt.
- Mẫu có hình/preview giúp chọn phong cách dễ hơn danh sách tên skill.
- Chế độ cắt clip dùng lại bố cục thay vì thêm app con.

Điểm cần cải thiện:
- Dự án nằm trong sidebar phù hợp ít dự án; 50–100 đầu ra/ngày cần một màn danh sách/bảng dự án riêng với tìm kiếm, trạng thái, kênh, ngày và bộ lọc.
- Nút Edit trên dòng dự án đưa vào thiết lập AI lại, không trực tiếp mở editor. Nên tách Mở bản dựng và Dựng lại bằng AI; bản dựng lại cần tạo phiên bản/cho biết tác động.
- Khung thả source lớn và catalog phía dưới cần cuộn trên màn 720px. Nên có chế độ gọn cho người dùng thường xuyên.
- Catalog cần skeleton, báo lỗi và mẫu đã cài hoạt động độc lập với catalog online.
- Phân loại mẫu có các nhãn gần nhau (Làm đẹp, Làm đẹp–Spa, Spa–thẩm mỹ...). Cần chuẩn hóa taxonomy; không tự xóa dữ liệu gốc.

## 4. Thiết lập trước dựng
Runtime quan sát được:
- Thông tin video, khung.
- Tự cắt vấp/lặp/khoảng lặng.
- Chọn/đổi mẫu; mức hiệu ứng Vừa/Nhiều.
- Mức SFX Nhiều/Vừa/Tắt.
- Stock B-roll Tắt/Ít/Vừa/Nhiều.
- Tư liệu bổ sung có ghi chú từng file; chọn link Drive.
- Cảnh trám AI; ghi chú chung.
- Hai nhánh: tự chỉnh tay hoặc AI edit. Giao diện báo AI edit sẽ dựng lại từ đầu.

Đề xuất:
- Giữ màn này làm nơi cấu hình một job; không tạo thêm trang cấu hình AI edit song song.
- NAS/điện thoại/Drive là nguồn trong bộ chọn tư liệu chung.
- Thêm mục tiêu video, thương hiệu/kênh, thời lượng, chất lượng và hạn mức khi đã có engine hỗ trợ.
- Cài đặt nâng cao thu gọn; hiển thị tóm tắt đầu ra trước khi chạy.
- Ghi chú từng tư liệu và ghi chú chung có vai trò khác nhau, nên giữ.
- Khi chọn mẫu đã có mặc định, không hỏi lại mọi thông số; cho xem và ghi đè.

Luồng clip từ code:
Chọn video dài → số clip, độ dài → chọn một hoặc hai tỷ lệ → tùy chọn edit từng clip theo mẫu → tạo các dự án con.
Nên mở rộng luồng này cho phiên bản; không viết một bộ quản lý clip khác.

## 5. Editor thực tế
Desktop:
- Header: tên/trạng thái dự án, CapCut, thư viện, undo/redo, focus, ảnh bìa, nháp, xuất, menu thêm.
- Nửa trái: Văn bản / Zoom / Cảnh trám / Đồ hoạ / Âm thanh / Bộ lọc / Thương hiệu / Kho của tôi.
- Văn bản chứa Chữ / Phụ đề / Cắt.
- Bộ lọc gom màu, da, làm đẹp, điều chỉnh, hiệu ứng hình và cắt khung (theo code).
- Bảng thẻ có tìm kiếm; inspector xuất hiện theo thành phần đang chọn.
- Preview phải, safe area, kéo vị trí/cỡ, transport, Xem nhẹ.
- Timeline nhiều lane: chữ, phụ đề, cảnh trám, đồ hoạ, zoom, video, giọng nói, hiệu ứng; kéo cao/thấp, zoom/fit, tách/xóa.
- Nhờ AI sửa là nút nổi; yêu cầu có thể kèm ngữ cảnh mục đang chọn.
- HyperFrames player/build là nền composition, không cần thêm tab HyperFrames cạnh các tính năng nghiệp vụ.

Điểm tốt:
- Công cụ → lựa chọn → thuộc tính cùng nằm một vùng, giữ preview luôn hiện.
- Thẻ preset có hình và kéo vào timeline phù hợp người không biết code.
- AI và chỉnh tay dùng chung bản dựng.
- Brand và kho dùng lại có sẵn; không cần thêm Brand Studio/Effect Studio trùng trách nhiệm.
- Xem nhẹ, safe area, undo và lịch sử là các affordance nên bảo toàn.

Điểm cần chú ý:
- Trên màn 1280×720, timeline cao khiến vùng preview dọc khá nhỏ. Nên giữ resize, focus và bổ sung preset bố cục nếu cần.
- Nhãn Cắt nằm dưới Văn bản dễ khó tìm với người dựng video; có thể đổi nhóm thành Lời thoại & cắt hoặc thêm lối tắt, vẫn dùng chung engine.
- Cảnh trám và Kho của tôi/Cảnh trám là sử dụng trong dự án và quản lý preset dùng lại; cần ghi rõ vai trò, không gộp mù quáng.
- Trong phiên quan sát, tiêu đề editor là tên file kỹ thuật; tên ở danh sách là tên video dễ hiểu hơn. Cần thống nhất tên hiển thị.
- Thẻ preset có lời mẫu về học tập trong dự án ô tô. Chưa kết luận bản dựng sai: đây là preset tham khảo. Nên phân biệt rõ Mẫu tham khảo và Đã dùng trong video.
- Thanh tổng quan báo 0 nhịp chữ/0 minh hoạ dù có lane đồ hoạ: các nhóm dữ liệu có thể khác nhau. Cần thống nhất thuật ngữ/số liệu để tránh tưởng nội dung mất.

## 6. Media, ảnh và voice
Cảnh trám runtime đã có Từ máy tính / Từ kho (Drive), thẻ media và kéo xuống timeline.
Nên mở rộng cùng bộ chọn:
Máy tính | NAS | Điện thoại | Drive | Stock | Tạo AI.
Tất cả trả về asset chung có preview, nguồn, quyền dùng và thao tác chèn; không nhân bản thư viện theo nhà cung cấp.

Tạo ảnh cần hai cách truy cập tới cùng một module:
- Trong dự án: Cảnh trám → Tạo AI → Ảnh, ảnh tham chiếu, biến thể, chọn kết quả → chèn.
- Dùng độc lập: thư viện tài nguyên → Tạo ảnh; có thể đưa kết quả vào dự án sau.
Không ép người cần sản xuất bộ ảnh độc lập phải tạo video giả trước.

Voice:
VEK có màn Giọng nói AI; code có tạo audio, sao chép giọng, kết nối ElevenLabs/Vbee.
Nên dùng chung provider/config và tài nguyên audio; editor Âm thanh mở cùng công cụ với ngữ cảnh dự án.
Không tạo thêm một nơi nhập khóa Vbee/ElevenLabs riêng cho ContentOS.

## 7. Kho, mẫu, skill và kết nối
Kho hiệu ứng runtime có Văn bản / Đồ hoạ / Cảnh trám, thêm từ mẫu và tạo mẫu từ kho.
Các đối tượng cần phân biệt:
- Mẫu dựng: bộ quy tắc và phong cách cho cả video.
- Preset thành phần: chữ/overlay/chuyển cảnh tái sử dụng.
- Phong cách ảnh: chỉ dẫn tạo ảnh, không phải mẫu timeline.
- Prompt/skill: quy trình hoặc chỉ dẫn có đầu vào/đầu ra.
- Asset: file hình/video/audio.
Có thể dùng chung khung thư viện và tìm kiếm, nhưng mỗi loại phải có thao tác đúng: Áp mẫu / Chèn / Dùng phong cách / Chạy quy trình.

Tích hợp hiện lưu công cụ Flow/Seedance/Kling; Kết nối AI kiểm Claude/Codex; Voice có kết nối API riêng.
Nên gom dưới Cài đặt → Kết nối với các nhóm rõ ràng, giữ lối tắt trong thao tác cần dùng. Không gom mất khác biệt giữa đăng nhập CLI, API key và phiên web.

## 8. Đầu ra và mạng xã hội
Ảnh bìa runtime: lấy khung hiện tại, tiêu đề, cỡ/vị trí/kiểu chữ theo brand, lưu.
Đây là công cụ ảnh bìa từ khung hình, chưa phải hệ tạo ảnh AI.
Nên mở rộng nút hiện có với các lựa chọn Khung video / Ảnh tải lên / Tạo AI, biến thể và kích thước theo kênh.

Hộp xuất runtime: thời lượng, kích thước, fps, MP4, thư mục lưu, khu tự đăng theo gói.
Code có chọn kênh, ghi chú, đăng ngay/hẹn giờ và content theo kênh.
Nên giữ bước xuất và nối gói phát hành: thumbnail, tiêu đề, caption, hashtag/tag, lịch và trạng thái.
Mạng xã hội là nơi quản lý kênh/lịch; editor là nơi chuẩn bị và giao phát hành một video. Hai lối vào dùng chung dữ liệu.

## 9. Bản đồ tích hợp tránh trùng
| Nhu cầu | Vị trí chính đề xuất | Dùng lại |
|---|---|---|
| NAS, điện thoại, Drive, file máy | Thêm nguồn / Cảnh trám | Media picker, project assets |
| Stock, tạo ảnh/video AI | Cảnh trám → nguồn/tạo AI | Kết nối nhà cung cấp, job queue |
| Voice AI | Giọng nói AI; lối tắt Âm thanh | Voice engine/config và audio assets |
| Phong cách AIEV | Bộ chọn phong cách khi tạo ảnh; thư viện quản lý | Catalog AIEV đã nhập |
| Skill dựng | Chọn mẫu/quy trình trước dựng | Template + SKILL, inbox |
| HyperFrames | Composition/preview/render trong editor | Runtime/build hiện có |
| Thumbnail AI | Mở rộng Ảnh bìa | Brand, ảnh AI, gói phát hành |
| Đăng/lịch/caption | Xuất → Phát hành; quản lý tại Mạng xã hội | Channel/content/schedule store |
| Brand/ngành/khách hàng | Workspace selector + Thương hiệu | Brand mặc định và snapshot dự án |
| Kho file lớn, tìm kiếm đa dự án | Thư viện tài nguyên | Cùng asset ID với media picker |
| News/research/kịch bản | Quy trình tạo dự án từ ý tưởng/tin | Trả về cùng editor và job |
| Batch/biến thể | Danh sách dự án + hàng đợi | Cùng project/render/publish pipeline |
| Remote chủ máy | Cài đặt thiết bị + trạng thái job | Khác quyền với upload-only điện thoại |

## 10. Cấu trúc điều hướng ContentOS đề xuất
Giữ trang bắt đầu dựng là mặc định, workspace selector ở đầu sidebar.
Các điểm đến chính: Bắt đầu dựng; Dự án; Thư viện; Mạng xã hội; Nghiên cứu nội dung; Cài đặt.
- Thư viện có mẫu/skill, hiệu ứng, media, phong cách/prompt; không biến tất cả thành cùng một loại.
- Giọng nói và tạo ảnh có trang công cụ độc lập qua Thư viện, đồng thời mở trực tiếp trong editor.
- Hàng đợi là bảng trạng thái truy cập xuyên ứng dụng; có màn quản lý khi nhiều job.
- Cài đặt gom workspace, lưu trữ, kết nối và thiết bị; tránh tên Workspace & Tích hợp cạnh Tích hợp.
Đây là đề xuất để chốt trải nghiệm; chưa thay đổi menu đang chạy.

## 11. Quy tắc trước mỗi tính năng mới
1. Ghi nhu cầu người dùng và đầu vào/đầu ra.
2. Tìm màn hình, engine, API, store VEK đã có.
3. Quyết định mở rộng tại chỗ, mở công cụ dùng chung, hay thực sự cần màn mới.
4. Chỉ một nguồn dữ liệu chính; lối tắt giữ workspace/project/ngữ cảnh đang chọn.
5. Vẽ luồng thành công, chờ, lỗi, thử lại, hủy và quay lại editor.
6. Kiểm bản đang chạy; không ghi chức năng hoàn tất chỉ vì có nút.
7. Kiểm không mất tùy chỉnh tay, không sửa nhầm dự án khi mở nhiều tab.

## 12. Thứ tự xử lý sau khảo sát
- Chốt bản đồ màn hình/đối tượng dùng chung trước khi tích hợp tiếp.
- Gộp các lối vào NAS/điện thoại vào intake hiện có; giữ service đã làm.
- Đổi Workspace & Tích hợp thành cấu hình không gian làm việc; tránh hai trang quản lý kết nối.
- Tích hợp catalog đúng loại và thao tác; không để nhập dữ liệu xong chỉ đọc text.
- Chuẩn hóa mở dự án / dựng lại, tên dự án, trạng thái và bảo vệ phiên bản.
- Sau đó mở rộng ảnh/voice/news/batch/publish theo bản đồ trên.

