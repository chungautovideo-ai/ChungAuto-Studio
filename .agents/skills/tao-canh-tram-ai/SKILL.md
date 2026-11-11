---
name: tao-canh-tram-ai
description: Tạo cảnh trám (b-roll) bằng AI tạo video / ảnh (Google Flow, Seedance / Dreamina, Kling…) với tài khoản người dùng đã lưu ở màn hình Tích hợp, theo ảnh tham chiếu và số lượng Ít / Vừa / Nhiều, rồi chèn vào video đang dựng. Tính năng gói PRO+. **MUST use** khi việc AI edit có mục "CẢNH TRÁM AI (người dùng BẬT", hoặc người dùng nói "tạo cảnh trám bằng Flow", "làm b-roll AI", "tạo video trám", "tạo ảnh trám bằng Seedance".
---

# Tạo cảnh trám bằng AI (Flow / Seedance / Kling)

Người dùng lưu tài khoản ở màn hình **Tích hợp** (`workspace/tich-hop.json`: công cụ, tên, email tài khoản, link, gói — KHÔNG có mật khẩu).
Ở bước "Thiết lập trước khi AI edit" họ bật **Cảnh trám AI**, chọn tài khoản, số lượng, loại (video / ảnh / cả hai), ảnh tham chiếu, ghi chú phong cách.
Việc AI edit in mục `CẢNH TRÁM AI` với đủ thông tin đó. Làm phần này **sau khi** đã cắt + đọc lời (biết câu nào ở giây nào), **trước khi** build.

## Quy tắc bắt buộc
- Dùng công cụ trình duyệt (Claude in Chrome / trình duyệt trong app; Codex: trình duyệt nếu có) với **phiên người dùng đã đăng nhập**.
  Kiểm tra đúng tài khoản (avatar / email góc trên) khớp `tài khoản` trong việc. Sai / chưa đăng nhập → nhờ người dùng tự đăng nhập rồi làm tiếp.
  **Không bao giờ nhập mật khẩu / OTP, không giải CAPTCHA, không mua thêm gói / credit.**
- Không vượt số lượng: tạo đúng số cảnh đã định; mỗi cảnh làm lại tối đa 2 lần. Hết lượt / lỗi → bỏ cảnh đó, dựng tiếp, cuối việc báo người dùng.
- Không đưa mặt người thật không có trong ảnh tham chiếu; không logo / thương hiệu khác; không chữ trong cảnh (chữ do mẫu edit lo).
- Có ảnh tham chiếu → nhân vật / sản phẩm / bối cảnh phải GIỐNG ảnh (dùng làm ảnh tham chiếu / khung đầu của công cụ).

## 1. Chọn chỗ trám
Số cảnh theo thời lượng video SAU cắt: **Ít** ≈ 1 / 30s (tối thiểu 1) · **Vừa** ≈ 1 / 15s · **Nhiều** ≈ 1 / 8s. Không đặt trong câu hook 3 giây đầu.
Ưu tiên câu nói: ý trừu tượng cần minh hoạ, nhắc sản phẩm / địa điểm / hành động, số liệu, câu chuyện. Mỗi cảnh 2–5s trên timeline, các cảnh cách nhau ≥ 4s.
Ghi `work/canh-tram-ai.json` (người dùng xem lại được):
```json
[{ "k": 1, "at": 12.4, "dur": 3.2, "say": "câu nói ở đoạn đó", "type": "video", "ref": "inputs/anh-san-pham.jpg",
   "prompt": "Close-up of a woman applying a purple serum bottle (same bottle as reference) in a bright bathroom, soft morning light, slow push-in, 9:16 vertical, photorealistic, no text",
   "file": "inputs/ai/1.mp4", "status": "ok" }]
```
`at` = giây GỐC (khớp transcript / segments). Prompt tiếng Anh: chủ thể (giống ảnh tham chiếu) · hành động · bối cảnh · ánh sáng · chuyển động camera ·
**tỉ lệ khung đúng dự án (9:16 dọc / 16:9 ngang)** · phong cách (theo ghi chú người dùng / màu mẫu edit) · "no text, no watermark".

## 2. Tạo trên công cụ
### Google Flow (labs.google/fx/tools/flow)
- Link có `/u/<số>/` = tài khoản Google thứ mấy — dùng đúng link người dùng lưu.
- Ảnh: chọn mô hình ảnh (Nano Banana), tỉ lệ đúng khung, dán prompt, tải ảnh tham chiếu (Ingredients).
- Video từ ảnh: chế độ **Frames to Video** → gắn ảnh làm **Start frame** (mỗi cảnh phải gắn lại), chọn mô hình video nhanh (Veo Fast / Flash) để tiết kiệm credit, đúng tỉ lệ, 8s.
- Tải: menu ⋮ trên ô kết quả → Download → 720p (đủ cho cảnh trám). File vào thư mục Downloads (đôi khi đuôi `.tmp` khi đang tải — đợi xong, lấy file mới nhất),
  chép vào `<dự án>/inputs/ai/<k>.mp4`. Trang chặn đọc link file → luôn tải bằng nút Download.
### Seedance (Dreamina — dreamina.capcut.com)
- Video: mục AI Video → chọn mô hình Seedance → tải ảnh tham chiếu (Image to video) hoặc chỉ prompt → tỉ lệ đúng khung → 5s → Generate → nút tải xuống.
- Ảnh: mục AI Image → tải ảnh tham chiếu → prompt → tải ảnh.
### Kling (app.klingai.com) / công cụ khác
- Image to Video với ảnh tham chiếu, 5s, Standard; tỉ lệ đúng khung; tải xuống. Công cụ khác: làm theo giao diện, cùng nguyên tắc.

## 3. Chèn vào video
- Kiểm tra file (ffprobe: có hình, đúng tỉ lệ). Video sai tỉ lệ vẫn dùng được (cover tự cắt).
- `project.json` → `brolls[]`: `{ "id": "ai1", "src": "inputs/ai/1.mp4", "at": <giây gốc>, "dur": 2–5, "mode": "full" | "split" | "pip", "tIn": "fade", "mediaStart": 0 }`
  theo SKILL.md của mẫu (mẫu có quy tắc cảnh trám riêng → theo mẫu). Ảnh trám: `src` .png/.jpg, 2–3s, mẫu có khối ảnh → có thể đặt trong khối đồ hoạ.
- Cập nhật `status` trong `canh-tram-ai.json` (ok / bo-qua + lý do). Báo người dùng ngắn: đã tạo n cảnh trên <công cụ>, cảnh nào bỏ và vì sao.
