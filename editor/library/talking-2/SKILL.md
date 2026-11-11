# Mẫu: Neon cam & kính sang trọng — chữ cam neon gõ dần + đồ hoạ kính & ánh sáng quanh người

Quảng cáo dịch vụ / thương hiệu cá nhân, tông studio tối ấm. Mỗi **ý** (2,5–5,5s) = 1 khung máy + 1 cụm chữ + 1 đồ hoạ minh hoạ.
Mọi thứ là `blocks[]` (HTML + anim khai báo), lớp thiết kế `t2-*` có sẵn trong `brand.css` của mẫu. Phụ đề chạy: TẮT.
Ví dụ đầy đủ tiếng Việt (25s, 4 đoạn gần/xa + zoom cắt): `vi-du.mjs` trong thư mục mẫu — `T(i)` = mốc từ thứ i (căn theo cụm nói `PHRASES`), hàm `txt()` / `blk()` + đủ mọi đồ hoạ. Chép vào thư mục dự án, sửa lời + chỉ số từ, chạy, rồi `node editor/lib/build.mjs <dự án>`.

## Nhịp & khung máy
- Video 2 máy (gần / xa): cắt xen kẽ theo ý. Video 1 máy: giả 2 khung bằng **zoom cắt** — `zooms: [{ at, dur, amount: 1.3, mode: "cut" }]`
  ở các ý lẻ (khung gần), ý chẵn để nguyên (khung xa). Không zoom mượt, không chuyển cảnh.
  Người ngồi lệch tâm → đặt `camera.faceX` (0–1) để zoom vào đúng mặt. Cắt bỏ khoảng lặng bằng `segments`, chỗ cắt trùng chỗ đổi khung.
- Đổi khung đúng đầu câu (giây bắt đầu từ đầu tiên của ý, lùi 0,05s). Mọi đồ hoạ của ý kết thúc cùng lúc đổi khung.

## Cụm chữ (mỗi ý 1 cụm)
```html
<div class="t2-txt" style="--t2-y:1080px">
  <div class="t2-sub t2-type r0">dòng phụ ≤ 6 từ</div>
  <div class="t2-ttl t2-type r1">từ khoá</div>       <!-- 1–3 từ, cam phát sáng -->
</div>
```
- Tiêu đề Alexandria 700 cam gradient #FE9545→#FDC787 + quầng sáng; ≤ 10 ký tự cỡ 118px, dài hơn đặt `--t2-size:100px`/`88px` (không vượt 1000px).
- Hiện dần **như đang gõ**, quét theo chiều đọc: `{ sel, from:{clipPath:"inset(-30% 100% -30% 0%)"}, to:{clipPath:"inset(-30% 0% -30% 0%)"}, cue, dur:0.4–0.6, ease:"steps(n)" }`
  (n ≈ số ký tự / 1,4). Chữ Ả Rập/RTL: `inset(-30% 0% -30% 100%)`. Giữ `-30%` trên/dưới để không cắt dấu tiếng Việt.
- Dòng phụ gõ đúng lúc nói; tiêu đề gõ đúng lúc nói từ khoá. Ra: mờ khi đổi khung (`out:"fade"`).
- Vị trí: chữ nằm trên **ngực** (y 1000–1150) khi mặt ở 1/3 trên; nếu khung xa còn ≥ 350px khoảng trống trên đầu thì đặt trên đầu (y ≈ 340).

## Đồ hoạ theo nghĩa câu (mỗi ý tối đa 1 đồ hoạ lớn)
| câu nói về | đồ hoạ | ghi chú |
|---|---|---|
| mở đầu, nhóm người / khách / chuyên gia | `.t2-hex` (lục giác cam sau đầu, nét vẽ dần + vệt sáng chạy) + `.t2-icon` (icon cam pop dưới ngực) | `layer:"behind"` |
| con số nhỏ (3 năm, 3 bước) | `.t2-corner.tr` + `.t2-corner.bl` vòng kính 2 góc, số đếm `count` | trượt từ góc 0,32s |
| con số lớn / so sánh | `.t2-3d` số khối cam 3D trượt từ mép phải | chỉ số người nói |
| câu hỏi | `.t2-ask` bong bóng trắng có "?" cam + `.t2-ring` vòng tia sáng sau đầu xoay chậm | 2 dòng: thường + **đậm** |
| phủ định "không phải vì…" | `.t2-arch` thẻ vòm kính trồi từ dưới, 3 dòng (s / k cam / s) + `.x` ✕ cam | ra: trượt xuống |
| "mà là / có thể vì…" | `.t2-arch.down` vòm ngược rơi từ trên (chỉ khi trên đầu còn chỗ) | ra: bay lên |
| giá trị / từ khoá cốt lõi | `.t2-pill` viên kính viền vàng dưới tiêu đề | phóng 0,8→1 |
| thương hiệu | `.t2-brand` vòm cam đáy màn hình, tên thương hiệu (Josefin Sans) | lấy từ ghi chú khách, không có thì bỏ |
| kêu gọi liên hệ | `.t2-social` nhãn cam có đuôi (icon + tài khoản) + `.t2-metal` chữ tiếng Anh ánh kim + `.t2-frame` khung góc | tài khoản lấy từ ghi chú |
| câu chốt / con số đời người | `.t2-big` số/chữ viền kính khổng lồ **sau đầu** + `.t2-hand` chữ viết tay cam (Great Vibes) viết dần | `layer:"behind"` cho .t2-big |
Lớp sau người cần tách nền: `npx hyperframes remove-background inputs/raw.mp4 -o inputs/matte.webm` rồi `camera.matte`.
Số liệu chỉ dùng số người nói. Không bịa tên thương hiệu / tài khoản: thiếu thì bỏ đồ hoạ đó.

## Âm thanh
- Nhạc nền rất nhỏ (~21 dB dưới giọng: `musicVolume` 0,05), xuất −14 LUFS.
- Mỗi đồ hoạ lớn 1 tiếng, lệch hình ≤ 60ms: pop (icon, bong bóng), whoosh (vòng góc, nhãn, vòm thương hiệu), boom nhẹ (thẻ vòm, số 3D), shimmer (vòng sáng, chữ kính).
  Cụm chữ không có tiếng. `sfxVol` 0,3–0,5.

## Kiểm tra
Snapshot mỗi ý sau khi đồ hoạ hiện đủ: chữ không che miệng, không tràn mép, dấu tiếng Việt không bị cắt, đồ hoạ sau người đúng lớp.
