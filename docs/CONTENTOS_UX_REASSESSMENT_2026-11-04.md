# Rà soát lại trải nghiệm ContentOS trước khi build tiếp

> Đồng bộ tài liệu 04/11/2026: đọc [điểm hiện hành và bản đồ build](BUILD_CURRENT.md) trước các mốc lịch sử. Mọi thay đổi UI phải theo [quy chuẩn thiết kế và quy trình UX/UI](DESIGN_UX_STANDARD.md): phân tích trải nghiệm, đối chiếu giao diện sẵn có và tham khảo ứng dụng phù hợp trước thiết kế/code. Trạng thái triển khai chỉ được xác nhận bằng bằng chứng đúng phạm vi trong BUILD_STATUS.


Ngày 04/11/2026. Phạm vi lần này: khảo sát và đề xuất; không sửa giao diện, không tiếp tục goal tích hợp đang tạm dừng.

## 1. Kết luận sản phẩm

Giữ VEK làm nền editor và cách giao việc nhanh. ContentOS phục vụ nhiều ngành, nhiều thương hiệu, mỗi máy chạy app và dự án riêng, NAS cung cấp tư liệu chung. Không cần đưa điều phối sáu máy hoặc hệ thống tenant phức tạp vào luồng hiện tại. 50–100 đầu ra/ngày gồm video gốc và phiên bản; cần quản lý mối liên hệ giữa chúng, không chỉ đếm file xuất.

Vấn đề hiện tại là các module đã thêm chưa tạo thành hành trình thống nhất. Ưu tiên tiếp theo là sửa đường đi và trạng thái thực trước khi thêm mục menu. Không thay editor bằng dashboard mới; không thu hẹp phạm vi tính năng ba ứng dụng.

## 2. Bằng chứng và giới hạn

- Đọc code Home, navigation, Library, Connections, Settings, cấu trúc editor; đối chiếu BUILD_STATUS, BUILD_PLAN, config/features.json và các audit trước.
- Duyệt trực tiếp ContentOS port5180 trong tab khảo sát riêng: Home, Hoạt động, Thư viện, Ảnh AI, Kết nối, Cài đặt, Dự án, Mạng xã hội. Đọc màn News người dùng đang mở; giữ nguyên tab đó.
- Home có composer VEK, mẫu chọn nhanh, nhiều nhóm lọc. Sidebar có sáu tiêu đề nhóm và danh sách41dự án, gồm nhiều fixture. Workspace selector chứa rất nhiều workspace kiểm thử.
- Hoạt động chỉ hiện sidebar và vùng chính trống khi bấm. Đây là lỗi quan sát được; chưa kết luận nguyên nhân từ browser.
- Dự án lúc vừa mở chỉ có tiêu đề/tìm kiếm; sau đó danh sách có dữ liệu. Cần trạng thái tải rõ, không gọi đây là lỗi mất dữ liệu.
- Ảnh AI hiện chưa cấu hình gateway, nút tạo bị vô hiệu hóa. Mạng xã hội đang là UI preview chưa lưu/đăng thực. Codex báo đã đăng nhập nhưng chưa có phiên chờ việc. Những trạng thái này không chứng minh provider hoặc worker hoạt động.
- Root `/` trả Home vì hiện không có project đang mở. Editor lần này được rà cấu trúc code và bằng chứng đã có; chưa thao tác lại editor thực, setup, mobile/NAS vật lý hoặc toàn bộ app nguồn. Không gọi AI trả phí, render, lưu cấu hình hay sửa dự án.

## 3. Các vấn đề ưu tiên

| Mức | Vấn đề | Ảnh hưởng | Hướng xử lý |
|---|---|---|---|
| P0 | Hoạt động mở ra trống | Không biết việc có chạy hay không | Nối UI với dữ liệu thật; loading/empty/error; phân biệt worker xác minh và trạng thái chưa rõ |
| P0 | Preview module và chức năng thực nằm chung shell | Dễ hiểu nhầm đã dùng được | Nhãn ngắn rõ: Sẵn sàng/Thiếu kết nối/Xem trước/Chưa hỗ trợ; chi tiết kỹ thuật thu gọn |
| P1 | Sidebar dài, dự án lặp với trang Dự án | Khó tìm Kết nối/Cài đặt | Footer cố định; gần đây tối đa3–5mục thu gọn; quản lý đầy đủ ở Dự án |
| P1 | Test workspace/dự án lẫn dữ liệu làm việc | Khó chọn đúng thương hiệu, dự án thật | Cô lập QA cho test mới; khảo sát phân loại dữ liệu cũ, chỉ ẩn/lưu trữ khi xác định đúng, không tự xóa hoặc đoán từ tên |
| P1 | Nguồn tin đặt cạnh tiêu đề thư viện mẫu | Hai công việc không liên quan chen nhau | Đưa vào lựa chọn đầu vào/giao việc; giữ shortcut cùng một news desk |
| P1 | Home có hàng chục tag gần nghĩa | Tìm mẫu chậm, phải cuộn nhiều | Home chỉ mẫu ghim/gần đây/đã cài; bộ lọc đầy đủ ở Thư viện; chuẩn hóa alias tag |
| P1 | Công cụ dài mở dạng dialog như News/Ảnh | Che ngữ cảnh, khó so sánh nguồn/kết quả | Workspace dùng trang đầy đủ; từ editor dùng panel/dialog cùng component và giữ project context |
| P1 | Cấu hình model, kết nối và lựa chọn mỗi job còn nhiều thuật ngữ | Người dùng khó giao việc đơn giản | Cấu hình mặc định một lần; lượt mới chỉ hiện tóm tắt và nút Thay đổi |
| P2 | Title/copy/icon chưa đồng nhất | Cảm giác các app ghép lại | Chuẩn hóa nhãn, icon, spacing, CTA, trạng thái và focus; giữ nền tối/lime VEK |

## 4. Điều hướng đề xuất

Giảm nhóm sidebar nhưng giữ mọi năng lực; đây là phương án, chưa áp dụng.

| Khu vực | Điểm đến | Nội dung bên trong |
|---|---|---|
| Làm việc | Trang chủ | Giao việc nhanh, mẫu chọn nhanh, tiếp tục dự án |
| Làm việc | Dự án | Danh sách/lưới, video gốc và phiên bản, trạng thái, kênh/ngày/thể loại |
| Làm việc | Hoạt động | AI dựng, tạo media, render/batch; lỗi và đầu ra có liên kết dự án |
| Tài nguyên | Thư viện | Mẫu & Skill, Hiệu ứng, Phong cách & Prompt, Tư liệu |
| Sáng tạo | Công cụ AI | Ảnh, Video, Giọng nói & Âm thanh; tab Video nêu rõ khả dụng thực |
| Sáng tạo | Nội dung | Nguồn tin, Kịch bản, phiên bản đã duyệt và lời đọc |
| Phân phối | Kênh & Phát hành | Kênh, bộ nội dung đăng, lịch, kết quả, phân tích kênh |
| Footer | Kết nối / Cài đặt | Kết nối thực thi; workspace/brand, nguồn, mặc định, cài đặt/doctor/remote |

Tạo mẫu từ video là hành động trong Mẫu & Skill, vẫn có shortcut khi cần. Không cần một sidebar entry riêng. Cấu hình kênh và phân tích dùng cùng định danh kênh. Ảnh/voice/news có thể dùng độc lập mà không buộc tạo dự án video.

## 5. Trang chủ nên hoạt động thế nào

Thứ tự từ trên xuống: workspace → lời giao việc và nguồn → tóm tắt lựa chọn → nút Dựng bằng AI → mẫu chọn nhanh → dự án gần đây.

- Giữ khả năng kéo thả, đính kèm và dán đường dẫn A-roll/B-roll. Khung thả nguồn gọn hơn để nhìn thấy mẫu tại màn720px.
- Ba loại đầu vào: Video có sẵn; Kịch bản/Tin; Video dài thành clip. Tái sử dụng setup/intake và news hiện có. Không bật đường vào chưa có luồng chạy được.
- Đường dẫn dán được biểu diễn bằng thẻ nguồn: loại A/B-roll, số file, khả dụng; khi chưa rõ cho người dùng sửa vai trò. Không tự nhận thành công nếu chưa đọc được NAS.
- Mặc định chỉ thấy mẫu, tỷ lệ và chế độ hoàn tất. Thu gọn model, mức hiệu ứng, khảo sát nguồn và thông số kỹ thuật. Tóm tắt ví dụ: “Codex · Mẫu ChungAuto · 9:16 · Kiểm tra trước khi xuất”.
- Mẫu chọn nhanh nằm ngay dưới composer theo yêu cầu mới nhất: đề xuất6–8thẻ, ghim/gần đây/đã cài; luôn có Xem tất cả. Home và Thư viện cùng catalog/selection, không có kho mẫu thứ hai. Mô tả dài và quy tắc skill mở theo nhu cầu.
- Chỉ một CTA chính; chọn nguồn hoặc mẫu không tự giao AI.

## 6. Editor và các công cụ bổ sung

Studio giữ bố cục VEK: công cụ/thư viện/thuộc tính, preview, timeline. Space ưu tiên chat và preview trên cùng dự án. Chuyển chế độ không tạo job, không đổi template, không mất sửa tay.

Thanh trên ưu tiên tên dự án/trạng thái lưu, Space/Studio, Undo/Redo, Xuất. Ảnh bìa và các hành động ít dùng đưa vào nhóm đầu ra/Thêm khi thiếu chiều ngang. Cần nghiệm thu editor thật trước khi chốt điểm ngắt1280/1920.

Trong Studio, công cụ ảnh/video AI nằm trong Cảnh trám; voice và nhạc/SFX trong Âm thanh; kiểu chữ/font/family/weight/size/spacing/fill/gradient/stroke/shadow trong thuộc tính của chữ đang chọn. Không thêm mục sidebar cho từng thuộc tính. Phụ đề, chữ nhấn và HTML graphic cần nói rõ phạm vi áp dụng; hiện không phải mọi chữ đều dùng chung bộ điều khiển mới.

Tài nguyên tạo trong editor phải cho biết “Đang thêm vào dự án X” hoặc “Chỉ lưu vào thư viện”. Xem trước → chọn → thêm timeline → Undo/Save; không tự chèn chỉ vì mở công cụ. Có chế độ toàn màn hình cho công cụ dài nhưng quay về đúng dự án và playhead.

## 7. Ba hành trình cần hoàn thiện

### A. Quảng cáo/review từ footage

Giao brief + A/B-roll local/NAS/điện thoại → xác minh nguồn → chọn mẫu/brand → setup gọn → AI dựng → mở cùng editor → duyệt/sửa → xuất → ảnh bìa/nội dung đăng → lên lịch hoặc đăng theo lựa chọn.

Thiếu NAS: giữ brief/selection, báo file lỗi, cho đổi nguồn. AI lỗi: giữ candidate và bản sửa tay, có lỗi/hành động cụ thể. Đã có bản dựng: Mở để sửa là mặc định; Dựng lại là hành động riêng, nói rõ phiên bản bị tác động.

### B. Tin/kịch bản → voice → cảnh trám

Nguồn → đọc/lưu bằng chứng → soạn nháp → duyệt phiên bản → chọn voice → nghe thử → tạo dự án → chọn/tạo cảnh trám → phụ đề → kiểm tra → xuất. Hiển thị bước tiếp theo ngay trong ngữ cảnh, không bắt nhớ chuỗi menu. Hiện các phần đã có bằng chứng riêng, chưa kết luận cả hành trình chạy production liền mạch.

### C. Một video gốc → nhiều phiên bản

Video gốc → ma trận tỷ lệ/kênh/CTA/brand → xem thay đổi → dựng phiên bản → hàng xuất → duyệt đầu ra → nội dung đăng riêng từng kênh → lịch/kết quả. Giữ liên kết nguồn và phiên bản, không suy ra số video gốc từ số output. Kiểm phiên bản không lặp render/post ngoài ý muốn.

## 8. Thực thi AI và trạng thái

Ba lựa chọn độc lập: bố cục Space/Studio; thực thi phiên Codex/Claude, CLI hoặc API; hoàn tất chờ duyệt hay tự xuất. Phát hành là lựa chọn thứ tư riêng. Mặc định workspace chỉ áp dụng job mới; job đang chạy giữ snapshot.

Luồng chính: Nháp → Kiểm tra nguồn → Chờ AI/Đang dựng → Cần duyệt → Đang xuất → Đã xuất. Phát hành có trạng thái riêng: Chưa chuẩn bị/Đã hẹn/Đang đăng/Đã đăng/Lỗi. Có lỗi/hủy và mốc cập nhật rõ; mất heartbeat là “Chưa xác minh còn chạy”, không tự kết luận đang chạy hoặc tự chạy lại.

Chỉ hiển thị phần trăm khi có dữ liệu thực. Kết nối phân biệt: đã lưu khóa, đã đăng nhập, kiểm tra kết nối, model hỗ trợ, worker đang nhận việc. Không gom thành một chấm xanh “AI sẵn sàng”.

## 9. Vị trí các nhóm tính năng và phần còn thiếu

| Nhóm | Vị trí chính | Hiện trạng cần giữ trung thực |
|---|---|---|
| Timeline/text/audio/effects | Studio | Có nền VEK và nhiều mở rộng; cần kiểm toàn hành trình trên footage thật |
| Mẫu/skill/HyperFrames | Home/Thư viện | Có catalog/chọn mẫu/snapshot; mẫu remote khác mẫu đã cài |
| Remotion/FFmpeg | Pipeline dùng chung, nâng cao | FFmpeg hỗ trợ xử lý; native Remotion chưa hoàn chỉnh, không bắt người mới chọn engine |
| Ảnh AI/phong cách/ảnh tham chiếu | Công cụ AI và Cảnh trám/Ảnh bìa | Có UI/service; gateway trên màn khảo sát chưa cấu hình |
| Video AI | Công cụ AI/Cảnh trám | Không coi danh bạ Flow/Kling/Seedance là adapter tạo video hoàn chỉnh |
| Voice/nhạc/SFX | Công cụ AI/Âm thanh | Có phần tích hợp và test riêng; quyền/provider/đồng bộ lời cần nghiệm thu |
| Tin/kịch bản | Nội dung | Có nguồn/nháp/duyệt; tự quét và kiểm chứng hoàn chỉnh chưa được chứng minh |
| NAS/phone/remote | Bộ chọn nguồn, Cài đặt | Có thành phần intake; remote thật, đồng bộ và NAS thực cần kiểm riêng |
| Batch/biến thể | Dự án/Hoạt động/Xuất | Có phần pipeline; UI và phục hồi chưa nghiệm thu đầy đủ |
| Thumb/title/caption/hashtag/tag | Bộ chuẩn bị phát hành | Không để thành dữ liệu rời khỏi phiên bản/kênh; chưa kết luận tự động đầy đủ |
| Kênh/lịch/thống kê | Kênh & Phát hành | Màn runtime hiện preview, chưa chứng minh đăng/thống kê thực |
| Nhập dữ liệu ba app | Cài đặt | Có adapter một phần; không đồng nghĩa đã nhập hết dữ liệu/tính năng |

Tái sử dụng video cần lưu nguồn/quyền sử dụng và tạo nội dung phù hợp; biến đổi hình/tiếng không bảo đảm tránh bản quyền. Bình luận và thao tác công khai cần lựa chọn rõ, không tự kích hoạt như phụ phẩm của xuất video.

## 10. Thứ tự thực hiện sau khi rà soát

1. P0: Hoạt động trống; trạng thái tải/rỗng/lỗi, khả dụng module, cách vào lại dự án; ngăn rời form mất bản nháp.
2. Shell/Home: footer, danh sách gần đây, quick templates gọn, nguồn/brief dễ giao. Cô lập dữ liệu QA mới.
3. Một luồng quảng cáo/review hoàn chỉnh bằng nguồn thật được chọn: intake → AI → sửa → xuất; đo thời gian từng bước trước khi đặt mục tiêu10phút.
4. Công cụ ảnh/voice/news giữ context, hoàn thiện luồng tin; provider thật chỉ khi đã cấu hình và được giao việc phù hợp.
5. Biến thể/batch/phát hành và các adapter còn thiếu theo inventory ba app; nghiệm thu riêng từng phần.

Mỗi bước phải có ma trận: tính năng → điểm vào → component/service dùng chung → trạng thái → bằng chứng → giới hạn. Kiểm1280×720 và1920×1080, refresh/back/deep-link, dữ liệu chưa lưu, thiếu quyền/provider, mất NAS và lỗi worker. Không tạo thêm màn cho chức năng đã có mà chưa chỉ ra điểm thiếu. Không tính số test hoặc số nhóm inventory là số tính năng production.

## 11. Quyết định thiết kế đề nghị chốt

Giữ editor VEK; Home giao việc gọn với mẫu chọn nhanh; công cụ dùng chung theo ngữ cảnh; một dự án và một kho trạng thái; sidebar ít điểm đến hơn; cấu hình kỹ thuật thu gọn; mọi chức năng thể hiện đúng độ sẵn sàng. Bản này thay phần đề xuất bố trí ở audit điều hướng cũ khi hai bản khác nhau, nhưng chưa triển khai phương án hoặc thay đổi cam kết chức năng.

## 12. Yêu cầu mới: hàng đợi và dựng nhiều video song song

**Cập nhật hiện hành:** bên dưới giữ yêu cầu thiết kế và ghi nhận ở thời điểm khảo sát. Hoạt động trống đã được sửa; claim/project guard, dispatcher và recovery pending có xác nhận đã có bằng chứng tổng hợp. Tra [đặc tả mới](PARALLEL_EDIT_BUILD_SPEC_2026-11-04.md) và BUILD_STATUS để biết phần đã làm và phần còn thiếu.

Người dùng xác nhận cần xem hàng đợi và nhiều video đang edit đồng thời tại Hoạt động. Đây là yêu cầu sản phẩm chính thức. Các đoạn dưới mô tả đích UX; dispatcher, claim/khóa project và một phần giao lô đã có code/bằng chứng tổng hợp, chưa nghiệm thu chạy hỗn hợp bằng AI thật. Trạng thái hiện hành theo BUILD_STATUS và đặc tả dựng song song, mục 8–10.

Hoạt động có bốn tab: Đang chạy / Hàng đợi / Cần kiểm tra / Lịch sử. Mỗi hàng hiển thị thumbnail, tên dự án, mẫu, loại việc, AI/model (khi biết), giai đoạn thực, thời gian chờ/chạy, cập nhật cuối và đầu ra. Nhóm video gốc/phiên bản; tìm/lọc theo loại việc, dự án, AI và trạng thái. Hiển thị máy hiện tại; không hàm ý theo dõi cả LAN.

Có giao nhiều video cùng mẫu và tùy chỉnh từng video trước khi xác nhận. Một nguồn dài thành nhiều clip và nhiều nguồn thành một bản dựng vẫn là hai nghiệp vụ riêng. Chọn nguồn không đồng nghĩa tự tạo mỗi file thành một video; phải có tóm tắt số dự án sẽ tạo.

Hai nguồn thực thi được hỗ trợ trong thiết kế: (1) người dùng mở nhiều phiên chat Codex/Claude, mỗi phiên nhận một job/dự án riêng và dựng đồng thời; (2) các worker CLI/API độc lập do app điều phối. Hai nguồn có thể hoạt động cùng lúc; Hoạt động phải hiển thị chung, không buộc mọi job chuyển sang CLI/API.

Scheduler cần giới hạn độc lập AI nền, ASR, tạo media và render theo máy/provider. Đề xuất bắt đầu 2 việc AI nền độc lập và 1 render/máy, chỉ tăng sau đo RAM/VRAM/CPU/NAS/giới hạn provider; chưa phải benchmark của i9/64GB/4070S. Giới hạn worker tự chạy không phải giới hạn số phiên chat người dùng chủ động mở. Một phiên chat không tự tương đương nhiều worker; nhiều phiên chat độc lập có thể xử lý nhiều job khác nhau. Cả hai nguồn cùng tuân thủ khóa dự án, điều tiết tài nguyên nặng và giới hạn provider; nếu chờ tài nguyên phải hiện lý do. Tải model/provider có thể là nút thắt thay vì GPU.

Mỗi job có định danh execution riêng: loại session/CLI/API, agent, model khi xác định được, định danh phiên hoặc worker, project/job ID, revision/candidate, thời điểm nhận việc và cập nhật cuối. Đăng nhập CLI không chứng minh phiên chat đang nhận việc. Hộp việc phải claim nguyên tử để hai phiên không nhận trùng; không dùng duy nhất cờ listener “AI đang mở” để suy ra nhiều phiên. Khi mất liên lạc, hiển thị chưa xác minh; không tự giao lại job có thể còn chạy. Định danh phiên phục vụ theo dõi, không yêu cầu đọc lịch sử chat riêng hoặc hứa có nút mở chat khi chưa có API hỗ trợ.

Mỗi project chỉ một việc sửa được quyền áp dụng tại một thời điểm. Các project khác nhau có thể chạy song song khi worker không phụ thuộc project đang mở. Candidate, source snapshot, revision, output, log và checkpoint phải tách theo job. Tác vụ xuất chờ đúng revision đã duyệt hoặc chính sách auto-export của job. Người dùng mở/sửa video A khi AI làm B không được đổi context của worker B.

Hành động: thêm việc, ưu tiên/lên đầu cho việc chưa chạy, bỏ việc chờ; ngừng nhận thêm việc mới; yêu cầu hủy việc đang chạy nếu worker hỗ trợ, xác nhận dừng bằng worker; thử lại có kiểm tra đầu ra và không lặp tác vụ trả phí/đăng bài. Chỉ hiện Tạm dừng/Tiếp tục một job nếu engine hỗ trợ checkpoint thực, không gắn nhãn cho thao tác giết process rồi chạy lại.

Ở thời điểm khảo sát ban đầu, Hoạt động bị trống và task store chưa nối với điều phối worker. Lỗi trống đã sửa; dispatcher CLI/API, inbox claims, bảo vệ callback cũ và khóa ASR/render chung đã có kiểm tổng hợp. Server vẫn giữ PROJECT/PJ ở các luồng kế thừa; cần rà mọi writer và async callback trước khi nghiệm thu đa dự án đầy đủ. Heartbeat phiên và phục hồi worker/tài nguyên còn thiếu. Không chỉ thêm bảng hoặc Promise.all để tuyên bố hỗ trợ song song.

Nghiệm thu bắt buộc: ba project tổng hợp do worker nền xử lý, giới hạn2AI tạo đúng2running+1queued; job hoàn tất tự nhận việc kế. Hai phiên chat độc lập claim đồng thời hai job khác nhau; hai phiên tranh một job chỉ một phiên nhận được. Kiểm chạy hỗn hợp phiên chat và CLI/API, hiển thị đúng bên thực thi, không nhận trùng hoặc áp giới hạn worker nền thành giới hạn phiên chat. Không trùng quyền áp dụng cùng project; mở/chuyển editor không đổi worker/output; hủy không nhận kết quả muộn; retry không lặp đầu ra; restart chuyển việc mất worker sang cần kiểm tra; render được điều tiết cho cả hai nguồn; không tự đăng. Sau test tổng hợp mới thử footage, nhiều phiên chat và CLI/API thật trong phạm vi được giao.


## 13. Đồng bộ sau xác nhận nhiều phiên chat độc lập · 04/11/2026

Giữ một Hoạt động theo dõi nhiều phiên chat Codex/Claude cùng worker CLI/API. Mỗi phiên nhận job riêng, quota CLI/API không giới hạn chat. Đã có contact reporting theo claim nhưng chưa xác minh process chat sống liên tục. Model lô và khôi phục payload/journal đã có bằng chứng tổng hợp. Những đoạn khảo sát cũ ghi thiếu heartbeat hoặc toàn bộ batch UX cần được đọc cùng BUILD_STATUS và đặc tả dựng song song mục 11–12.

Tạo cảnh chữ Remotion nằm trong Cảnh trám cùng editor VEK: tham số → preview → thêm → lưu, không thêm sidebar engine. Worker riêng dùng render lock chung và hiện trong Hoạt động; chưa có lịch sử/recovery bền vững hoặc sửa lại props cảnh đã thêm. Lần này đồng bộ tài liệu, không sửa giao diện. Ưu tiên tiếp theo là nghiệm thu luồng hỗn hợp bằng AI thật và nguồn thật trước khi tăng tải hoặc thêm điều khiển chưa có backend.
