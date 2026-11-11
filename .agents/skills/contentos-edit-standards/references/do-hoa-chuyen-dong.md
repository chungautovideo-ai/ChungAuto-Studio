# Đồ hoạ và chuyển động

Nguyên tắc gốc: đồ hoạ chỉ khi giúp hiểu; mỗi khối nói đúng điều người nói đang nói (mkt-edit-talking-head-9-16). Mật độ của mẫu không phải lý do giữ đồ hoạ lạc đề.

## 1. Nội dung

- Trước khi chèn: người nói đang nói gì đúng lúc này, hình có minh hoạ đúng điều đó không (mkt-edit-talking-head-9-16).
- Thứ tự chọn: logo thật khi người dùng có file → icon SVG tự vẽ trong khung của thẻ → ảnh/video của người dùng → bỏ thẻ (mkt-edit-talking-head-9-16).
- Mỗi khối có `minhHoa` = từ khoá đúng như trong lời; khối trang trí ghi `"trang trí"` (mkt-edit-talking-head-9-16).
- Số liệu, tên, giá chỉ lấy từ lời hoặc tư liệu; không bịa (mkt-edit-talking-head-9-16, mrtkeyword).
- Số phần tử theo lời: thẻ 3 icon mà lời nhắc 2 thứ thì còn 2 (mkt-edit-talking-head-9-16).
- Một ý mỗi nhân vật/hình; danh sách được nói thành chữ, không thành chuỗi clip ngắn (ghost-editor).
- Mỗi video thay vài thành phần (thẻ, chuyển cảnh, hook) để các video cùng mẫu không giống hệt (ghost-editor) — nhưng phong cách mẫu (font, màu, khung) giữ nguyên.

## 2. Thời lượng khối

| Loại | Chuẩn | Nguồn |
|---|---|---|
| Cảnh motion graphic nền đen (`scenes[]`) | 3.5–7 s, một ý mỗi cảnh | mkt-edit-talking-head-9-16 |
| Thẻ toàn màn trong talking-head kiểu Face RESULT | ≤ 2.5 s | ghost-editor |
| Thẻ tĩnh | "chết" sau ~8 s; > ~15 s cần lộ dần | hyperframes `overlays.md` |
| Mật độ thẻ trên talking-head | 1 thẻ mỗi 6–8 s (video < 1 phút) | hyperframes `overlays.md` |
| Infographic | 1 ý chính, 3–5 điểm dữ liệu | animated-infographic |

- `cues` của cảnh đặt theo giây gốc của từng từ trong transcript (mkt-edit-talking-head-9-16).
- Hai cảnh nối liền: `at` cảnh sau = cuối cảnh trước để không lóe mặt (mkt-edit-talking-head-9-16).
- Kết thúc thẻ không vượt độ dài media thật (đo bằng ffprobe), nếu không bản xuất kết thúc bằng khung đen (hyperframes `overlays.md`).

## 3. Chuyển động

| Việc | Chuẩn | Nguồn |
|---|---|---|
| Di chuyển nhanh | 0.3–0.6 s | hyperframes `motion.md` |
| Thoát | ngắn hơn lúc vào 40–50% | hyperframes `motion.md` |
| Chồng nhịp | phần tử sau bắt đầu khi phần trước xong 30–50% | hyperframes `motion.md` |
| Stagger | chữ cái lệch 1 khung, từ 60–120 ms, mục danh sách 40–80 ms | hyperframes `motion.md` |
| Stagger infographic | 6–10 khung; > ~15 khung là lê thê | animated-infographic |
| Spring | hệ số tắt 0.7–0.85 cho cảm giác cao cấp; opacity và màu không nảy | hyperframes `motion.md` |
| Thẻ trên talking-head | hiện 0.4 s, ẩn 0.35 s | hyperframes `overlays.md` |
| Dời khung người | 0.5–0.7 s, chỉ trong khoảng trống giữa hai thẻ | hyperframes `overlays.md` |

- Easing theo vai: xuất hiện có đuôi dài (`expo.out`, `power4.out`), di chuyển camera hai chiều (`power2.inOut`), thoát/zoom xuyên tăng tốc (`power3.in`); cùng một `power2.out` 0.5 s cho mọi thứ là dấu hiệu "máy làm" (hyperframes `motion.md`).
- Mọi giá trị chuyển động tính theo khung (frame) của timeline, không theo đồng hồ thật hay timer (short-form-video, chart-animation).
- Tween lặp lại nhiều lần dùng `fromTo` với giá trị rõ ràng (ghost-editor, HyperFrames).

## 3b. Hiệu ứng vào/ra cho chữ lớn (`texts[]`)

Mỗi chữ nhấn có hiệu ứng vào theo `fx` (words/slide/mask/marker/type) và có thể thêm `anim` kiểu CapCut: `{in:{type,dur}, out:{type,dur}, loop:{type,speed}}`. `anim.in` **thay** hiệu ứng vào của `fx`; `anim.out` thay mờ ra mặc định. Danh sách tên hợp lệ: `TEXT_ANIMS` trong `editor/lib/text-effects.js`.

**Làm tự động, rồi soát:** sau khi đặt xong chữ nhấn, chạy

```text
node editor/tools/hieu-ung-chu.mjs <dự án> --dry   # xem bảng trước
node editor/tools/hieu-ung-chu.mjs <dự án>         # ghi vào project.json
```

Tool chỉ đặt cho chữ **chưa có** `anim` và không ẩn; chữ người dùng/mẫu đã chọn giữ nguyên. Chạy lại không đổi gì. Soát bảng: hiệu ứng có hợp nội dung câu không, có chữ nào nên tắt `out` vì cảnh cắt ngay sau đó không.

| Loại chữ | Vào → Ra |
|---|---|
| Hook (chữ đầu, < 3 s) | `zoom-out` → `fade` (to rồi thu về, mạnh ngay khung đầu) |
| Số liệu, giá, % | `bounce` → `zoom-out` |
| Cảnh báo (đừng, sai, lỗi, không nên) | `shake` → `drop` |
| Câu hỏi | `blur` → `fade` |
| Còn lại (xoay vòng) | `slide-up`/`fade`, `zoom-in`/`zoom-out`, `slide-left`/`slide-left`, `blur`/`blur`, `bounce`/`shrink`, `slide-right`/`drop`, `slide-down`/`slide-up` |
| `fx` marker / mask / type | giữ hiệu ứng vào riêng, chỉ thêm Ra: `fade`, `slide-up`, `blur`, `shrink` |

- Hai chữ liền nhau không dùng cùng hiệu ứng vào; cùng một cặp cho mọi chữ là dấu hiệu "máy làm" (hyperframes `motion.md`).
- Thời lượng: vào 0.45 s / ra 0.35 s; chữ hiện < 1.5 s dùng 0.3 / 0.25 s (ra ngắn hơn vào, mục 3).
- `loop` (pulse, float…) chỉ cho 1–2 chữ quan trọng nhất video, không cho mọi chữ.
- `type` (đánh máy) chỉ cho câu ngắn đọc kịp; số liệu không dùng `spin`/`shake` vì khó đọc.

## 4. Số và biểu đồ

| Giai đoạn | Chuẩn | Nguồn |
|---|---|---|
| Giữ khung đầu biểu đồ | 1–1.5 s để đọc trục/đơn vị | chart-animation |
| Mỗi dòng dữ liệu (race) | 0.3–0.6 s | chart-animation |
| Khoảnh khắc nhấn | chậm thêm 0.5–1 s | chart-animation |
| Giữ khung cuối | 2–3 s | chart-animation, animated-infographic |
| Tiêu đề infographic | 0.8–1.2 s | animated-infographic |
| Mỗi mục (icon → số → nhãn) | 1.2–2.0 s | animated-infographic |
| Đường nối | 0.4–0.6 s, chồng sang mục sau | animated-infographic |
| Giữ mỗi con số | ~0.5 s trước mục kế | animated-infographic |

- Làm tròn trước khi định dạng số; cố định ô chữ số để bố cục không nhảy (chart-animation).
- Số đếm dùng ease-out, không tuyến tính (animated-infographic).
- Trong talking-head, cảnh `stat` của skill nhà vẫn giữ `dur` 3.5–7 s; các mốc trên dùng để chia thời gian bên trong cảnh.

## 5. Chuyển cảnh

- Mặc định cắt thẳng (ghost-editor). Dùng 3–5 loại chuyển cảnh trong một video, mỗi loại có nguyên nhân trên hình (hyperframes `motion.md`).
- Chuyển cảnh mạnh tối đa 2 lần mỗi video (ghost-editor).
- Whip 0.13–0.3 s; dip cut làm tối ~40% trong 3 khung trước cắt (hyperframes `motion.md`).
- Chuyển cảnh trong editor: `transitions.cut` / `segments[].tIn` / `tIn` của cảnh (mkt-edit-talking-head-9-16).
- Vòng lặp (khung cuối khớp khung đầu) chỉ khi mẫu/người dùng muốn; độ dài lặp tốt ~7–15 s (short-form-video).
