# Chuẩn từ nguồn công khai + chữ đúng chính tả tiếng Việt

Rút từ tài liệu miễn phí của nền tảng và chuẩn phụ đề (tra ngày 2026-11-06), viết lại bằng lời của ContentOS, không chép nguyên văn. Nguồn ghi trong ngoặc, link ở cuối. Mức tin: **[gốc]** = trang chính thức của nền tảng/tổ chức; **[phụ]** = blog/công cụ bên thứ ba, chỉ tham khảo. Chuẩn nhà trong SKILL.md vẫn thắng khi phần này không nói rõ khác.

## 1. Hook và mở đầu

- Nói rõ **cái gì / của ai** trong 3 s đầu; cả cú hook nằm trọn trong 6 s đầu (TikTok Creative Best Practices [gốc]). Với ChungAuto: 3 s đầu có xe + việc đã làm (vd "đổi màu nội thất 4 xe một lúc") bằng cả lời lẫn chữ.
- Hook ở đầu, CTA ở cuối (Meta Reels ads [gốc]); CTA rõ, một việc (TikTok [gốc]). CTA dùng đúng lời người nói, không bịa địa chỉ/số điện thoại.
- Con số "giữ chân 3 s ≥ 75–80%" chỉ có ở blog [phụ], không có nghiên cứu độc lập: không dùng làm tiêu chí nghiệm thu.

## 2. Chữ trên màn và phụ đề

| Quy tắc | Số | Nguồn |
|---|---|---|
| Tốc độ đọc phụ đề tiếng Việt | ≤ 17 ký tự/giây (người lớn) | Netflix Vietnamese TTSG [gốc] |
| Độ dài dòng | ≤ 42 ký tự, ≤ 2 dòng, ưu tiên 1 dòng | Netflix Vietnamese TTSG [gốc] |
| Hình dạng 2 dòng | dòng dưới dài hơn; không để 1–2 từ lẻ ở dòng trên | Netflix TTSG [gốc] |
| Chữ phủ (text overlay) | trần 5–10 từ/giây đang hiện | TikTok Creative Best Practices [gốc] |

Áp dụng cho nhóm phụ đề 2–4 từ của chuẩn nhà:

- Nhóm có `số ký tự / (end − start)` > 17 thì gộp với nhóm kề hoặc kéo tới đầu nhóm sau. Nhóm 2–4 từ tiếng Việt (~8–16 ký tự) cần hiện ≥ ~0.5–0.95 s.
- Ngắt nhóm sau dấu câu, trước liên từ/giới từ ("và", "nhưng", "để", "cho", "ở"); không tách danh từ khỏi định ngữ, không tách họ khỏi tên (Netflix TTSG [gốc]).
- **Không tách từ ghép tiếng Việt** sang hai nhóm: "ô tô", "nội thất", "phim cách nhiệt", "bọc ghế da", "Chung Auto", "camera 360" nằm trọn một nhóm (áp quy tắc trên cho tiếng Việt đa âm tiết).

## 3. Viết số, đơn vị, tên hãng

- Phụ đề: giữ cách người nói, nhưng số > 10, tiền, đơn vị, năm dùng chữ số (Netflix Vietnamese TTSG [gốc]). Chữ nhấn/đồ hoạ luôn dùng chữ số ("10 năm", "400 m²", "8 năm").
- Hàng nghìn tách bằng dấu chấm, thập phân bằng dấu phẩy: `1.000 đồng`, `2,5 triệu` (Netflix Vietnamese TTSG [gốc]).
- Viết tắt không chấm giữa chữ: PPF, LED (Netflix Vietnamese TTSG [gốc]).
- Tên hãng giữ dạng người xem quen: VinFast, Lexus, Mercedes; không đổi tên hãng/người (Netflix Vietnamese TTSG [gốc]).
- Giữ đủ dấu trong tên riêng; chữ trên màn ở Unicode NFC, font hiện đủ dấu chồng (ể, ữ, ặ) — snapshot một khung có dấu chồng khi đổi font.

## 4. Chống "ngọng" chữ (nhận giọng sai)

Gốc lỗi đã xác minh 2026-11-06: Whisper large-v3-turbo-q5 viết "Chung Auto" thành "Trung Auto" (6/6 lần trong 60 s đầu video QA, kể cả khi có gợi từ vựng), ra cụm vô nghĩa ("tỷ lệ size shot" thay "sai sót"), và bịa câu khi im lặng ("Hãy subscribe cho kênh Ghiền Mì Gõ…"). TTS (ElevenLabs/Vbee) là API trả phí, không tham gia dựng tự động.

Đã sửa tại gốc trong `editor/lib/whisper.mjs`:

- Câu `goiY` của `config/tu-dien-asr.json` đi vào `--prompt` của Whisper (tiếng Việt; tắt khi phân tích kênh người khác). Tác dụng chính: có dấu câu, viết đúng một số từ ("ba mảng", "trần"); không đủ để sửa tên riêng.
- Sau khi nhận giọng, `editor/lib/sua-chu-asr.mjs` sửa theo `sua`, xoá câu bịa theo `boCau`, **giữ mốc từng từ**; mỗi chỗ sửa ghi vào `transcript.json` → `textFixes`.

Việc của worker AI khi đặt phụ đề/chữ nhấn:

1. Đọc `textFixes` nếu có để biết chỗ đã sửa.
2. Đọc lướt toàn bộ lời; từ **vô nghĩa trong ngữ cảnh** (vd "trống thơn", "hơ mẹ", "đổi hit") là dấu hiệu nhận sai. Chỉ sửa chữ khi chắc từ ngữ cảnh/brief/tên hãng; giữ `start/end`. Không chắc thì không đưa từ đó lên chữ nhấn và ghi trong tóm tắt `--done` ("nghi nhận sai: … ở 12.3 s").
3. Không "sửa" thành từ khác nghĩa cho hay hơn; không thêm điều người nói không nói.
4. Lỗi lặp lại ở ≥ 2 video: đề xuất thêm vào `config/tu-dien-asr.json` trong tóm tắt (không tự sửa từ điển trong việc dựng). Quy tắc phải chắc chắn: cụm có nghĩa khác ("trong ô tô", "dùng chung ô tô") không được thành quy tắc.

## 5. Âm thanh

- Có tiếng/nhạc; Reels chạy có tiếng trừ khi người xem tắt (Meta [gốc], TikTok [gốc]). Nhạc + lời được phản hồi tốt hơn chỉ nhạc (Meta, số tự báo cáo [gốc]).
- Vẫn phải hiểu khi tắt tiếng: phụ đề + chữ nhấn mang ý chính (Meta Help Center [gốc]).
- Bản giao giữ −14 LUFS (chuẩn nhà). AES TD1008/AES77 gợi ý mức thấp hơn cho lời nói (~−18 LUFS) — chỉ cân nhắc với video dài nghe tai nghe [phụ: qua bài tóm tắt, chưa đọc bản gốc AES].

## 6. Vùng an toàn: khi nào dùng chuẩn chặt hơn

Nguồn không thống nhất; số của nền tảng chủ yếu dành cho **quảng cáo**:

| Dạng | Trên | Dưới | Hai bên | Nguồn |
|---|---|---|---|---|
| TikTok quảng cáo in-feed | 240 px | 660 px | 120 px | Socialync dẫn số TikTok [phụ] |
| Reels/Stories quảng cáo | 14% (~269 px) | 35% (~672 px) | 6% | hướng dẫn quảng cáo Meta, bản bên thứ ba [phụ] |
| Video thường (chuẩn nhà) | ≥ 120 px | 20% (~384 px) | 12% | SKILL.md |

Chọn: video thường giữ chuẩn nhà. Brief là **quảng cáo** (chạy tiền) thì dùng 14% trên / 35% dưới và đưa phụ đề lên y ≈ 1100–1240.

## 7. Định dạng và độ dài

- 9:16, xuất 1080×1920 (TikTok [gốc]: tối thiểu 720p). YouTube Shorts tối đa 3 phút (YouTube Help [gốc]).
- Nhịp: TikTok khuyên dùng chuyển cảnh, sticker, đồ hoạ để giữ người xem nhưng không cho con số [gốc]; giữ chuẩn nhà "thay đổi hình mỗi 2–4 s". Số "5–7 s/beat" của blog [phụ] không dùng.

## Nguồn

- TikTok Ads Help — Creative Best Practices: https://ads.tiktok.com/help/article/creative-best-practices
- Meta for Business — Reels ads: https://www.facebook.com/business/ads/facebook-instagram-reels-ads
- Meta Business Help — Add captions to your video ad: https://www.facebook.com/business/help/1675722002698686
- YouTube Help — Create Shorts: https://support.google.com/youtube/answer/10059070
- Netflix — Vietnamese Timed Text Style Guide: https://partnerhelp.netflixstudios.com/hc/en-us/articles/220447048-Vietnamese-Timed-Text-Style-Guide
- Netflix — English (USA) Timed Text Style Guide: https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977-English-USA-Timed-Text-Style-Guide
- Vùng an toàn [phụ]: https://www.socialync.io/tools/safe-zones/tiktok , https://reap.video/blog/short-form-video-safe-zones
- Độ to [phụ]: https://en.wikipedia.org/wiki/Audio_normalization , https://productionadvice.co.uk/td1008/
