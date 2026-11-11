---
name: phan-tich-kenh-social
description: Phân tích kênh mạng xã hội (TikTok, Facebook, YouTube, Instagram…) của đối thủ / của chính người dùng từ link kênh → báo cáo cách làm nội dung — định vị thương hiệu, tone giọng, khách hàng mục tiêu, tuyến nội dung + hiệu quả từng tuyến, kiểu hook, cách dẫn dắt, CTA, top nội dung, quảng cáo, phễu marketing, điểm mạnh / điểm yếu, gợi ý học hỏi. Tính năng gói PRO+. **MUST use** khi việc từ phần mềm có "Loại: phân tích kênh", hoặc người dùng nói "phân tích kênh", "soi kênh đối thủ", "phân tích đối thủ", "phân tích tiktok này", "phân tích kênh đang chờ trong phần mềm".
---

# Phân tích kênh mạng xã hội

Người dùng dán link kênh trong phần mềm (màn hình **Phân tích kênh**) → việc `Loại: phân tích kênh` ở
`workspace/content/_phan-tich-kenh/<id>/work/ai-job.json` (nhận qua `node editor/tools/ai-inbox.mjs --wait` / `--next`).
Kết quả là `work/report.json` — phần mềm hiện thành trang báo cáo. Công cụ: `node editor/tools/phan-tich-kenh.mjs --buoc | --media | --check`.

## Nguyên tắc
- **Chỉ đọc trang công khai** bằng công cụ trình duyệt. Không đăng nhập hộ, không nhập mật khẩu / OTP, không thích / bình luận / theo dõi / nhắn tin. CAPTCHA → nhờ người dùng tự giải.
- **Không bịa số.** Số liệu từng bài đọc từ trang (10,4K → 10400; ẩn thì để 0 và ghi `"hidden": true`). Số liệu nhóm (lượt xem TB, tỉ lệ tương tác, so với TB kênh)
  do `--check` tính từ `posts.json` — đừng tự điền.
- **Mọi nhận định có dẫn chứng** bằng số bài `posts: [n]` — trang báo cáo hiện thành nút "Bài n ↗" mở bài gốc.
- Viết tiếng Việt, cụ thể, có thể làm theo ngay. Tránh câu chung chung ("nội dung hấp dẫn"). Trích nguyên văn hook / câu dẫn trong ngoặc kép.
- Báo bước `--buoc <dir> <1–6>` để người dùng thấy tiến độ.
- **Nghe lời thoại chỉ khi việc ghi `Nghe lời thoại: CÓ`** (người dùng tích "Nghe chi tiết" lúc dán link). Ghi KHÔNG → `--tai <dir> --khong-nghe`:
  chỉ thumbnail + tấm khung + chữ trên video + caption + số liệu; nhận định về lời nói ghi rõ là suy từ hình / caption.

## 1. Thu thập (bước 2–3)
Kênh: tên, @handle, follower, tổng thích, mô tả, link ngoài (shop, web), có gắn giỏ hàng / shop không.
`work/posts.json` — N bài gần nhất, `n` = 1 (mới nhất) … N:
```json
[{ "n": 1, "url": "https://www.tiktok.com/@x/video/…", "date": "2026-10-21", "caption": "…", "views": 10400, "likes": 320, "comments": 41,
   "shares": 12, "saves": 30, "duration": 34, "format": "nói một mình", "hook": "\"Thêm vào giỏ hàng ngay 10.10…\" + cận sản phẩm",
   "transcript": "tóm tắt lời 1–3 câu", "pillar": "Ưu đãi / sale", "ad": false,
   "cover": "link ảnh bìa (thumbnail) của bài — chỉ cần khi --tai không lấy được" }]
```
Trang báo cáo hiện **thumbnail gốc** từng bài (`--tai` tự lấy; bài không tải được → ghi `cover` là link ảnh bìa đọc trên trang, `--check` tự tải).
Không đọc được số trên lưới kênh → mở từng bài. Facebook / Instagram đôi khi ẩn lượt xem → dùng thích + bình luận + chia sẻ.

## 2. Xem nội dung (bước 4)
- **Trước tiên** chạy `node editor/tools/phan-tich-kenh.mjs --tai <dir>` (sau khi có posts.json): yt-dlp tải bản nhẹ từng bài công khai
  → tự cắt tấm 12 khung `work/posts/<n>-khung.jpg` + nghe lời `work/posts/<n>-loi.json`. Xem tấm khung (Read ảnh) + đọc lời của MỌI bài.
  Đừng mở từng bài trong trình duyệt khi đã tải được (nền tảng dễ chặn khi mở liên tục).
- Bài nào `--tai` báo không tải được → mới xem trong trình duyệt: khung 0–3s (hook), giữa, cuối (CTA) + phụ đề / chữ trên video.
  Vẫn không xem được → ghi rõ "chưa xem được", không đoán nội dung.
- Ghi cho từng bài: hook (lời + hình 3 giây đầu), cách dẫn dắt, CTA, định dạng, người xuất hiện, bối cảnh, chữ trên màn hình, nhạc / âm thanh trend, có phải quảng cáo / booking KOL không.

## 3. report.json (bước 5)
```json
{
  "channel": { "name": "L'Oréal Paris Việt Nam", "handle": "@lorealparis_vn", "platform": "tiktok", "url": "…", "followers": 1200000, "likes": 15000000,
               "bio": "…", "shop": true },
  "summary": "3–5 câu: kênh đang làm gì, điều gì hiệu quả nhất, điều đáng học nhất.",
  "sections": {
    "brand": {
      "positioning": "Định vị thương hiệu — hứa hẹn gì, khác biệt gì, ở phân khúc nào. posts dẫn chứng.",
      "voice": "Tone giọng — xưng hô, cảm xúc, từ hay dùng, độ trang trọng; trích câu mẫu.",
      "style": "Phong cách quay dựng — khung hình, ánh sáng, người xuất hiện, nhịp cắt, chữ trên màn hình, nhạc.",
      "audience": "Khách hàng mục tiêu — tuổi, giới, nỗi đau, mong muốn, dấu hiệu từ bình luận.",
      "posts": [1, 3]
    },
    "activity": { "frequency": "x bài / tuần, giờ đăng hay dùng", "formats": "tỉ lệ định dạng", "trend": "đang tăng / giảm, chiến dịch đang chạy" },
    "pillars": [ { "name": "Ưu đãi / sale", "desc": "Mục tiêu tuyến, cách làm, ví dụ.", "posts": [1, 4, 7], "verdict": "Hiệu quả vì…" } ],
    "structure": {
      "hooks": [ { "type": "Kêu gọi hành động / ưu đãi trực tiếp", "desc": "Cách làm", "examples": ["\"Thêm vào giỏ hàng ngay 10.10\""], "posts": [1, 5], "effect": "Nhận xét hiệu quả" } ],
      "flows": [ { "type": "Vấn đề → giải pháp → chứng minh", "desc": "…", "posts": [2, 9], "effect": "…" } ],
      "ctas":  [ { "type": "Mua tại giỏ hàng", "desc": "…", "posts": [1], "effect": "…" } ]
    },
    "top": [ { "post": 4, "why": "Vì sao bài này vượt TB kênh" } ],
    "ads": { "has": true, "desc": "Dấu hiệu quảng cáo / KOL / livestream, sản phẩm đẩy", "posts": [3] },
    "funnel": [ { "stage": "Nhận biết", "desc": "Nội dung kéo người mới", "posts": [2] }, { "stage": "Cân nhắc", "desc": "…", "posts": [] },
                { "stage": "Chuyển đổi", "desc": "…", "posts": [] }, { "stage": "Giữ chân", "desc": "…", "posts": [] } ],
    "strengths":  [ { "title": "Điểm mạnh", "desc": "Cụ thể + vì sao — để HỌC HỎI", "posts": [4] } ],
    "weaknesses": [ { "title": "Điểm yếu", "desc": "Cụ thể — cơ hội để KHAI THÁC", "posts": [8] } ],
    "ideas": [ { "title": "Gợi ý cho bạn", "desc": "Ý tưởng video / cách làm áp dụng ngay cho kênh người dùng (dựa ghi chú)." } ]
  }
}
```
- 3–6 tuyến nội dung, mỗi bài thuộc 1 tuyến (ghi `pillar` trong posts.json khớp `pillars[].name`). 3–6 kiểu hook; 2–4 cách dẫn dắt; 2–4 CTA.
- `top`: 3–5 bài lượt xem / tương tác cao nhất (xem posts.json). Điểm mạnh / điểm yếu: 3–5 mỗi bên. Gợi ý: 3–5.
- Không có quảng cáo → `"ads": { "has": false, "desc": "Không thấy dấu hiệu…" }`.

## 4. Kiểm & xong (bước 6)
`--check <dir>` → thêm `count / avgViews / er / vsChannel` cho từng tuyến, hook, dẫn dắt, CTA + `stats` kênh, báo bài không có trong posts.json. Sửa tới khi ✓.
Sau khi có số, đọc lại nhận định `verdict` / `effect` cho khớp số (tuyến có `vsChannel` < 1 thì đừng khen "hiệu quả nhất").
Báo người dùng 3–5 ý nổi bật → `node editor/tools/ai-inbox.mjs --done <dir>` (công cụ chặn nếu chưa --check).
