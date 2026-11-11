# Khảo sát skill NAS so với VEK · 04/11/2026

> Đồng bộ tài liệu 04/11/2026: đọc [điểm hiện hành và bản đồ build](BUILD_CURRENT.md) trước các mốc lịch sử. Mọi thay đổi UI phải theo [quy chuẩn thiết kế và quy trình UX/UI](DESIGN_UX_STANDARD.md): phân tích trải nghiệm, đối chiếu giao diện sẵn có và tham khảo ứng dụng phù hợp trước thiết kế/code. Trạng thái triển khai chỉ được xác nhận bằng bằng chứng đúng phạm vi trong BUILD_STATUS.


## Phạm vi và bằng chứng

Đọc archive bằng ZipFile read-only tại `\\ChungAuto\Quay Dựng 2\SKILL AI`, không giải nén/chạy engine hoặc sửa nguồn. Khảo sát Factory Claude3.6.3 (SKILL chính, orchestrator, đoạn RUNBOOK), News Lite2.1.1, Ảnh bìa News, inventory dung-vid-ai-doc và thư mục360. Đối chiếu skill talking-head VEK, mẫu Talking head vàng cao cấp, template.json và luồng project/build/inbox đã có. Chưa chạy cùng footage trên hai hệ thống, chưa đo token thực, chất lượng hoặc thời gian render.

| Gói/tài liệu | Số đo UTF-8 bytes |
|---|---:|
| Factory Claude3.6.3 toàn archive giải nén417file | 37.403.618 |
| Factory17file SKILL.md | 112.332 |
| Factory toàn bộMarkdown | 550.765 |
| Factory SKILL chính | 10.845 |
| RUNBOOK | 32.033 |
| Orchestrator | 13.479 |
| Brand DNA | 14.660 |
| Creative README | 8.486 |
| Gates | 10.284 |
| Definition of done | 4.162 |
| News Lite219file, SKILL chính | 11.729 |
| News Lite toàn bộMarkdown | 105.000 |
| Ảnh bìa News SKILL | 3.657 |
| dung-vid-ai-doc SKILL | 7.565 |
| VEK talking-head SKILL | 24.570 |
| VEK HyperFrames SKILL (không khẳng định luôn nạp) | 30.613 |
| VEK mẫu vàng SKILL | 1.961 |
| VEK mẫu vàng template.json | 5.577 |

Bytes không phải token, dung lượng zip không phải context; ảnh/code/dữ liệu chỉ tốn context khi được tool trả cho model. Không quy đổi ra USD hoặc khẳng định tỷ lệ tiết kiệm khi chưa có token usage thực.

## Kết luận

VEK không có SKILL chính ngắn hơn Factory. Khác biệt lớn nằm ở hợp đồng làm việc: nguồn→transcript→AI quyết định trên project.json→builder/runtime xác định→editor duyệt→xuất. Quy tắc mẫu chỉ1.961bytes vì typography, animation, schema và render đã có code/template chịu trách nhiệm. AI không phải sáng tác lại cả app/video bằng code mỗi lượt.

Factory là một hệ thống điều phối lớn, không chỉ một mẫu dựng. SKILL yêu cầu RUNBOOK, orchestrator và4tài liệu chung nêu trên: tổng nội dung93.949bytes nếu nạp đủ7file, chưa tính module theo bước, genre, reference, creative, transcript, log và hình. Không có trace để xác nhận phiên trước đã thực sự nạp đủ hoặc lặp bao nhiêu lần.

Các điểm có thể gây chi phí:

- SKILL/RUNBOOK/orchestrator cùng diễn đạt trình tự và hard rules; tài liệu vừa có bảng module cũ vừa có17bước mới. Model phải đọc phần giải thích thứ tự và phân giải ngoại lệ.
- RUNBOOK yêu cầu `vef next` đầu/cuối mỗi bước:17bước có thể phát sinh khoảng34lượt quan sát trạng thái nếu làm máy móc, ngoài lệnh thực thi. Đây là suy ra từ chỉ dẫn, chưa phải số tool call đã đo. Engine đã có `rebuild`/`make`; nên dùng chúng để gộp bước xác định khi tương thích, không tự bỏ gate.
- Factory có brief/genre/approach, hook, beat map, asset resolution, caption, graphics, sound, creative, plan, grade và QC. Nhiều dữ liệu thể hiện cùng quyết định ở dạng khác nhau, có rủi ro AI phải viết/đọc lại và đồng bộ thủ công.
- Một số chuẩn mật độ (chữ động/phút, số loại template, SFX/màu) đòi hỏi sáng tạo và sửa đến đạt số; phải áp theo thể loại, tránh ép tin tức không SFX/không chữ động vào bộ luật quảng cáo. News Lite đã ghi ngoại lệ rõ.
- QC thị giác, che biển, đúng sản phẩm, nguồn tin và nghe giọng là chi phí cần giữ, nhưng chỉ nạp bằng chứng đúng cảnh bị ảnh hưởng; không bỏ để đạt token thấp.
- Bộ Factory tự ghi trường hợp12lần make/job mất168phút máy và đề xuất hạn chế render. Đây là ghi nhận trong tài liệu nguồn, chưa đo lại độc lập; chậm máy và tốn token là hai biến khác nhau.
- News Lite đã là gói tham chiếu tương đối gọn, nhưng chứa đường phụ thuộc Studio cũ và script vá. Cần adapter ổn định trước, không chỉ cắt ngắn prompt.

## Kiến trúc skill đề xuất cho ContentOS

1. Một router ngắn: nhận job, kiểm context/revision, hỏi state machine bước tiếp theo. Mục tiêu entry khoảng1–2nghìn token là ngân sách thiết kế, chưa phải số đo đạt được.
2. Job context có giới hạn: brief, genre, template/skill/version, brand snapshot, policy AI/xuất, input manifest và trạng thái. Không nạp toàn bộ danh mục NAS, lịch sử chat hoặc mọi skill.
3. Skill mẫu chỉ diễn tả quyết định dựng: hook, nhịp, khi nào dùng chữ/cảnh/âm thanh, điều kiện tránh. Font/layout/animation/default nằm trong template/preset có schema. Brand ChungAuto là cấu hình workspace; skill ngành khác dùng chung engine.
4. Module có điều kiện và nạp theo nhu cầu: news, footage talking-head, music-led highlight, multi-source review, reference analysis, plate blur, thumbnail, publish. Không ép mọi job qua cùng17bước bằng hội thoại.
5. AI ghi candidate/patch với baseRevision, code validate/apply/build và tái tính dữ liệu dẫn xuất. Với composition native Remotion giữ schema tham số riêng có adapter; HyperFrames và Remotion dùng FFmpeg/shared artifacts, không rasterize mọi lớp để tiết kiệm token.
6. Tool output có ngân sách: summary/errors + file path, phân trang/search, diff theo vùng; full logs/evidence chỉ mở khi cần. Cache probe/transcript/shot log/reference theo fingerprint; đổi input liên quan mới phân tích lại. Không gọi cache dữ liệu chưa kiểm hash là đã xác minh.
7. Tách deterministic checks khỏi review sáng tạo: code tự gate cấu trúc/media/render, AI tập trung chọn câu/cảnh và những QC cần hiểu nội dung. Gate thực vẫn chạy và không đánh dấu xong bằng lời.
8. Reference/style analyzer chạy như tác vụ riêng có cache; sau duyệt chỉ đưa style profile đã chốt vào job sản xuất. Không phân tích lại video mẫu từ đầu mỗi video.

Giữ phần tốt của Factory (genre/brief, asset provenance, plate handling, style DNA, QC) và News Lite (facts, ngoại lệ tin nhạy cảm, nhận diện kênh); đóng thành adapter/quy tắc có điều kiện trên hợp đồng editor VEK. Không sao chép nguyên nhiều bộ quy trình vào một mega-skill.

## Benchmark cần làm trước khi chốt mức tối ưu

Cùng3ca: quảng cáo talking-head+B-roll, tin voice-over, review nhiều nguồn; cùng input/model/template/output và tiêu chí chất lượng. Phân biệt cache lạnh/ấm, session/API/CLI, số vòng sửa và giá trị cache provider. Thu input/output/cached tokens nếu nhà cung cấp trả; thời gian AI/probe/render; số call/file đọc/ảnh xem; lỗi/retry; số thao tác người dùng; độ đúng nội dung/asset; file render kiểm chứng. Không so ChatGPT/Claude UI với VEK khác model/tool/runtime rồi quy hết chênh lệch cho skill.

Chưa sửa skill NAS, chưa chạy benchmark, chưa tích hợp tối ưu mới. Báo cáo là bằng chứng khảo sát phục vụ quyết định tiếp theo.
