# Cắt và nhịp

Áp dụng sau khi đã có `work/transcript.json`. Mọi mốc là **giây gốc**; `segments[].in/out` cắt bằng `keep`, không xoá dữ liệu nguồn.

## 0. Cắt tự động trước, soát sau

Chạy `node editor/tools/segments.mjs <projectDir> --auto-cut`: chia đoạn theo khoảng lặng (0.45 s) rồi tự đặt `keep:false` cho đoạn chỉ có tiếng đệm (ờ, à, ừm…) và lần nói trước của câu được nói lại ngay 1–2 đoạn sau (giữ lần sau cùng). Bảng in ra đánh dấu `✂` kèm lý do và tổng số giây đã cắt.

- Đây là bước gợi ý theo chữ, chưa nghe âm thanh: soát từng dòng `✂`, bật lại (`keep:true`) đoạn cắt nhầm, ví dụ một câu cố ý lặp để nhấn mạnh.
- Sau đó làm tiếp mục 1 bên dưới cho lỗi tool không thấy: Whisper gộp câu nói lại, lặp *trong* một đoạn, câu bỏ dở không có bản nói lại.
- Đã có `segments` người dùng chỉnh tay thì KHÔNG chạy lại tool (ghi đè); chỉ sửa `keep` từng đoạn.

## 1. Chọn take

- Người quay thường nói một câu nhiều lần, bản trôi chảy nằm về sau: chọn bản **sau cùng, trọn câu** (mkt-edit-talking-head-9-16; ghost-editor: "later over earlier").
- Mấy câu nói liền một hơi thì giữ cả đoạn làm một take, một điểm cắt thay vì bốn (ghost-editor).
- Chọn bản đúng ý kịch bản, không nhất thiết đúng từng chữ; lời nói thật thường tự nhiên hơn (ghost-editor).
- Câu không được nói thì không xuất hiện, kể cả chữ hay thẻ. Kịch bản có ý mà người nói bỏ qua thì ghi trong tóm tắt (ghost-editor).
- Lặp *trong* một đoạn: tách đoạn tại mốc từ rồi tắt phần lặp (mkt-edit-talking-head-9-16).
- Whisper hay gộp câu nói lại thành một câu "sạch" và kéo dài mốc từ: một từ kéo dài bất thường (vài giây) là dấu hiệu có nói lại bên trong; nghe lại đoạn đó trước khi cắt (ghost-editor).

## 2. Mép cắt

| Việc | Chuẩn | Nguồn |
|---|---|---|
| Tool tách đoạn | khoảng lặng > 0.45 s, đệm 0.12 s đầu / 0.2 s cuối | mkt-edit-talking-head-9-16 |
| Đệm tối thiểu | ≥ 0.08 s, không mất phụ âm đầu/đuôi | mkt-edit-talking-head-9-16 |
| Mép đầu take | từ đầu − 0.10…0.15 s | ghost-editor |
| Mép cuối take | từ cuối + 0.20…0.30 s, không quá đầu từ kế tiếp | ghost-editor |
| Hơi giữa hai câu | để lại ~0.2 s | ghost-editor |
| Lặng trong một take | < 0.5 s giữ (nhịp của người nói); > ~1 s có thể cắt | ghost-editor |
| Người nói hay kéo đuôi chữ | đệm 0.3 s | ffmpeg-skill (`silence.py --margin`) |
| Sau một câu "đắt" cần khoảng thở (SFX/phản ứng) | kết take 0.6–1 s sau từ cuối | ghost-editor |

**Nguồn bất đồng về ngưỡng lặng:** ffmpeg-skill mặc định −35 dBFS kéo dài ≥ 0.6 s; ghost-editor rút lặng > 0.26 s xuống 0.18 s; mkt-edit-video-9-16-th lấy > 0.4 s làm ranh giới beat. **Chọn 0.45 s của skill nhà** vì tool `segments.mjs` đã dùng và editor hiển thị theo đó. Khi dùng ffmpeg đo lặng: phòng yên tĩnh −40…−45 dBFS, phòng ồn −30 dBFS (ffmpeg-skill).

Luôn báo trong tóm tắt tổng số giây đã cắt (ffmpeg-skill).

## 3. Liếc mắt, nháy mắt

- Nháy mắt, liếc nhanh, gật đầu là một phần của nói chuyện: giữ trên màn (ghost-editor).
- Chỉ xử lý "nhìn đi chỗ khác" thật: mắt rời ống kính hoặc nhắm > 0.5 s, hoặc đầu quay/cúi > 12° (ghost-editor).
- Cách xử lý, rẻ trước: cắt bỏ → punch-in khung gần → giữ đồ hoạ đang có → khung chèn nhỏ → cảnh trám toàn màn sau cùng (ghost-editor).
- Không che mọi khoảnh khắc: một video bị che hết 31 chỗ liếc khiến người nói chỉ còn trên màn 33% (ghost-editor).

## 4. Hook 3 giây đầu

- Khung đầu là khung mạnh nhất; không fade từ đen, không chào hỏi dạo đầu (short-form-video).
- Câu hook hiện thành chữ trên màn từ khung 1, vì phần lớn người xem tắt tiếng (short-form-video).
- Mở một "vòng tò mò" trong ~3 s đầu và chỉ đóng ở phần kết; không trả lời sớm (short-form-video).
- Dạng hook: vòng mở ("Lý do X cứ…"), hứa trực tiếp ("3 cách … trong 30 giây"), phủ định ("Đừng …"), đổi nhịp hình (short-form-video). Hook phải là câu người nói thật sự nói; không viết thêm lời.
- Hook kiểu sticker + punch-in cho đoạn đầu (mrtkeyword); hiệu ứng chữ hook dài 1.5–3 s (ghost-editor `textfx hook`).
- Chữ nhấn của skill nhà: không có SFX trong 0.6 s đầu (build tự bỏ) (mkt-edit-talking-head-9-16).

## 5. Nhịp và pattern interrupt

- Một thay đổi hình (cắt, zoom, chèn, chữ bật, đổi khung) mỗi ~2–4 s; khoảng cách **không đều**, đều như máy đếm nhịp sẽ thành nhàm (short-form-video).
- Kiềm chế là mặc định: đo trên 6 video tốt nhất, 113/119 chuyển cảnh là cắt thẳng, độ dài shot trung vị ~3 s, cảnh trám 20–35% thời lượng (ghost-editor).
- Giấu jump cut bằng dissolve ngắn 0.2 s hoặc đổi cỡ khung, không zoom ở mọi điểm cắt; tối đa 3 cú punch-in "hài" mỗi video (ghost-editor).
- Zoom nhấn 1.06–1.10, chỉ ở câu quan trọng, không liên tiếp (mkt-edit-talking-head-9-16).
- Chuyển cảnh "mạnh" (flash, whip…) tối đa 2 lần mỗi video; còn lại cắt thẳng (ghost-editor).
- Giữa video không được "phẳng": đoạn thân thiếu năng lượng là chỗ người xem lướt đi (short-form-video).
- Một ý mỗi video; ý thứ hai làm video khác (short-form-video).

**Nguồn bất đồng về mật độ:** short-form-video muốn thay đổi mỗi 2–4 s; ghost-editor đề cao kiềm chế; mrtkeyword đặt 6–10 keyword/phút. **Chọn:** tính mọi loại thay đổi (kể cả cắt và zoom) vào nhịp 2–4 s, còn chữ nhấn giữ ~1 nhịp mỗi 4–8 s theo skill nhà (`fx: "nhieu"` thì dày 1.5–2 lần).

## 6. Bố cục và cảnh trám (talking-head)

- Mặt người nói trên màn ≥ 65% thời lượng; cảnh trám toàn màn ≤ 25%; ≤ 3 lần chèn mỗi phút (ghost-editor).
- Mỗi cảnh trám phải minh hoạ đúng câu đang nói; danh sách được nói thành chữ, không thành ba clip 0.5 s (ghost-editor).
- Thứ tự nguồn: footage của người dùng → ảnh tĩnh đóng khung → stock video (trong khung, không toàn màn) sau cùng (ghost-editor). Trong ContentOS: chỉ dùng cảnh trám miễn phí/AI khi việc giao bật (mkt-edit-talking-head-9-16).
- Không đổi màu mặt người nói; cảnh chèn được chỉnh theo màu cảnh nói, không ngược lại (ghost-editor).
- Video dùng keyword theo đoạn: ≥ 3 kiểu bố cục, một kiểu không quá 2 đoạn liền; hiệu ứng nặng xen nhẹ (mrtkeyword).
