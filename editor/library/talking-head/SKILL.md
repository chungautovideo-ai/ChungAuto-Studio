# Mẫu: Chữ vàng & widget động — chữ khoá vàng + widget giao diện theo lời nói

Talking head nền ấm, chữ ở giữa ngang ngực. Mỗi câu = 1 **nhịp** (`.th-beat`): dòng chữ nhỏ trắng sáng dần từng từ theo lời →
**1 từ khoá rất to Be Vietnam Pro 900 vàng #E3C06F** bật ra (back.out) → dòng nói tiếp → **1 widget tối** minh hoạ đúng ý câu, chạy theo lời.
Xen 1–2 **thẻ toàn màn hình** (vàng #E3BE6E / xám #ADADAD) ở câu chốt.

Mọi thứ là `blocks[]` (HTML + anim khai báo), lớp thiết kế `th-*` có sẵn trong `brand.css` của mẫu. Phụ đề thường: TẮT (nhịp chữ thay phụ đề).
Ví dụ đầy đủ (20s, 11 khối, người thật): `vi-du.mjs` trong thư mục mẫu — `T(i)` = mốc của từ thứ i trong transcript (căn lại theo cụm nói `PHRASES` vì whisper hay lệch sớm), hàm `beat()` + đủ các widget/thẻ. Chép vào thư mục dự án, sửa lời + chỉ số từ rồi chạy, sau đó `node editor/lib/build.mjs <dự án>`.
Font từ khoá phải có dấu tiếng Việt (mặc định Be Vietnam Pro 900; Poppins KHÔNG có dấu Việt).

## Nhịp chữ (mỗi câu 1 khối, nối tiếp nhau không chồng)
```html
<div class="th-beat">
  <div class="th-line l0pre"><span class="w">You</span> <span class="w">could</span> …</div>
  <div class="th-key">best</div>            <!-- .th-key.sm khi từ khoá ≥ 2 chữ / dài -->
  <div class="th-line l1post"><span class="w">…</span></div>
  <div class="th-panel">…widget…</div>
</div>
```
- `cues` = giây gốc của từng từ (transcript). Mỗi `.w` sáng lên đúng lúc nói: `{ sel, to:{opacity:1}, cue:i, dur:0.12, ease:"none" }` (mặc định mờ .32).
- Từ khoá: `{ sel:".th-key", from:{opacity:0, scale:0.55, y:30}, to:{opacity:1, scale:1, y:0}, cue, dur:0.32, ease:"back.out(2.2)" }`.
- Chọn từ khoá = từ mang ý nhất của câu (danh từ / tính từ / con số), 1–2 chữ, viết thường, giữ dấu tiếng Việt. Dòng nhỏ ≤ 6 từ.
- Khối: `fx:"fade"`, `out:"fade"`, `sfx:"none"`; vị trí mặc định ngang ngực (top 915) — mặt người ở thấp/cao thì đặt `--th-y` riêng.

## Widget (chọn theo nghĩa câu, chạy theo lời)
| câu nói về | widget | chuyển động |
|---|---|---|
| chất lượng, đánh giá, uy tín | `.th-panel` + `.th-stars` (5 `<i>`) + `.th-num` | tô sao `stagger`, đếm `count:[2.4,5], dec:1` |
| lời nói, âm thanh, kêu gọi | `.th-panel` + `.th-wave` (11 `<i>`) | `scaleY` nhấp nhô |
| liệt kê lựa chọn / dịch vụ / nghề | `.th-chips` > `.th-chip` (`.ck` + tên + `<small>`) | từng thẻ bật đúng lúc nói tên |
| khu vực, tiến độ, mức độ | `.th-panel.wide` + `.th-track` (`<b>` + `<i>`) | ghim + thanh chạy `left/width` |
| người biết / tiếp cận / khách | `.th-panel.wide` + `.th-people` (`<i><b></b></i>` ×5) + `.th-lab` | `b` opacity→1 stagger, đếm `count:[0,1284], sep:","` |
| so sánh 2 bên | `.th-cmp` > 2 div (`small` tên, `em` nhãn, `b` số; bên kém `.bad`) | 2 bộ đếm cùng lúc |
Số liệu: chỉ dùng số người nói hoặc số minh hoạ rõ ràng (như mẫu); không bịa số liệu "thật". Nhãn widget tiếng Việt in hoa ngắn.
Đếm số: bước anim `{ sel, count:[từ, đến], dec, sep, at|cue, dur }` (bộ dựng có sẵn).

## Thẻ toàn màn hình (1–2 lần / video, ở câu chốt hoặc câu hỏi tu từ)
- **Vàng**: `.th-card.gold` + `.th-bubble` (3 `<i>`) + `.big` + `.sub` — phóng ra từ chỗ widget: `clipPath inset(66% 14% 22% 14% round 40px) → inset(0)` 0,38s; ra: trượt xuống + nhoè 0,17s.
- **Xám**: `.th-card.gray` + `.th-grid` (18 `<i>`, vài `.on` vàng) + `.th-pill` + `.note` — vào bằng vòng tròn `clipPath circle(0%)→circle(75%)` 0,4s; ra: `yPercent:-100` 0,2s.
- `fx:"none"`, `out:"none"`, sfx: whoosh (vàng) / swish (xám).

## Âm thanh, màu
- Nhạc nền rất nhỏ (~17 dB dưới giọng, `musicVolume` 0,04), SFX nhẹ: whoosh/swish ở thẻ, tick khi tích nút. Xuất −14 LUFS.
- Không đổi màu video. Không cắt cảnh nhanh — 1 góc máy liền, nhịp do chữ + widget tạo.

## Kiểm tra
Snapshot mỗi nhịp sau khi từ khoá vào: chữ không che miệng, widget không tràn mép (≤ 960px ngang), từ khoá dài thì `.sm`.
