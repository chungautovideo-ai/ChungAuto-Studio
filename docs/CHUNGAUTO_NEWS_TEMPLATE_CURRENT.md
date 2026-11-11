# ChungAuto News · mẫu dựng riêng

## Phân tích trước tích hợp

Người dùng chọn mẫu ngay trong kho/mẫu chọn nhanh hiện có rồi giao voice, tin và tư liệu; chỉnh thẻ mở đầu tại Đồ họa. Không thêm sidebar hoặc quy trình mới. Dùng component preset, timeline, Undo/Save hiện có. Chưa kiểm giao diện native/mobile trong lượt này.

Bằng chứng: skill nguồn `D:/Edit tự động/chungauto-news-video`, workflow03/04, style-tokens và video người dùng 98,22s/1080×1920/30fps. Contact/opening/ending ở `news-reference-20261105/`. Đã xem khung hình; chưa nghe và xem liên tục toàn video. Video có thẻ tin nền vàng/xám, chữ đen–đỏ, body không caption giữa màn, header nguồn/brand, kết ảnh cơ sở. Mẫu có popup nhiều lần nhưng rule chủ kênh mới yêu cầu hạn chế: mặc định không thêm popup, chỉ thêm khi được giao.

Học từ VEK: giữ giao việc nhanh, mẫu chỉnh trực tiếp; từ nguồn News: không mang chữ nhấn/motion quảng cáo sang bản tin. Font Montserrat Black là lựa chọn gần kiểu nguồn mới, chưa xác nhận chính xác font video. Không sao cả bộ nghiên cứu 13 video vào prompt. Skill ngắn và tham chiếu có điều kiện.

Mẫu mới dùng 2 preset: thẻ mở đầu 3 phần chữ đen/đỏ/đen và header nguồn có thanh brand. Ảnh nhận diện nhúng trong JSON để snapshot/gói ZIP độc lập NAS. Chọn mẫu chỉ áp phong cách, không tự chèn khối hoặc xóa chữ cũ; AI dựng mới phải chèn preset và giữ thân sạch. Chuyển dự án cũ cần kiểm lớp chữ cũ. Branding tuân lựa chọn watermark off; outro/CTA tuân cta off.

Kiểm đồ họa cần phân biệt ảnh khung/logo cố định với ảnh minh họa tin: chỉ ảnh nhúng có SHA256 được khai báo ở đúng preset mới được dùng lại; vẫn kiểm chữ mẫu và từ khóa lời nói. Không miễn toàn bộ preset hay đồ họa nội dung.

## Giới hạn

Không kèm nhạc NAS/popup MOV hoặc credential; skill hướng dẫn nhập đúng tài nguyên khi được chọn. Không tạo giọng, xuất tin đầy đủ hay đăng bài trong tác vụ cài mẫu. Mức nhạc là điểm khởi đầu chỉnh tay, không tuyên bố đạt LUFS mẫu. Chưa nghiệm thu end-to-end AI dựng một bản tin mới.

## Đã tích hợp và kiểm

QA bố cục tổng hợp3s đã xuất thành công bằng pipeline thật; đã xem ảnh0,5s thẻ/chữ đen đỏ vừa khung và2s chỉ còn header, thẻ đã cắt hết. Nền đơn sắc là dữ liệu kiểm, không phải bản tin dựng mới. Bằng chứng NEWS_TEMPLATE_LAYOUT_SMOKE.json và news-reference-20261105/layout-opening.jpg, layout-body.jpg. Chưa kiểm tiêu đề dài tối đa hoặc nghe mix.

`editor/templates/chungauto-news-v1`: template JSON396735byte, SKILL2815byte,2tham chiếu,2preset, poster và preview10s không âm thanh trích video mẫu. `exports/chungauto-news-v1.zip`606289byte, parse lại thành công; ảnh brand/frame nhúng trong JSON. Montserrat dùng cơ chế Google Fonts hiện có, cần tải font/cache; chưa đóng font offline.

406/406 unit qua, trong đó kiểm điền trường thật qua Python/lxml, build HTML, giữ caption lines/lựa chọn off/nội dung cũ, QC ảnh cố định vẫn bắt chữ mẫu và minhHoa sai, snapshot/ZIP giữ ảnh và tham chiếu. Log: NEWS_TEMPLATE_TEST_RESULTS.txt. HTTP5180 trả mẫu trong installed-templates, poster/preview200. Backend được nạp lại lúc dispatcher0/0 và3resource idle, chỉ đúngPID5180; NEWS_TEMPLATE_DEPLOY_SMOKE.json. Chưa kiểm thao tác nativeUI/Undo/Save bằng tay, chất lượng mix hoặc AI dựng trọn tin.
