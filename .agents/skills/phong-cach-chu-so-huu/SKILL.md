---
name: phong-cach-chu-so-huu
description: "Phong cách edit thật của chủ sở hữu ContentOS, đo từ 1 dự án CapCut (1.6 phút): nhịp cắt, mật độ chữ, font/màu, hoạt ảnh chữ, phụ đề, chuyển cảnh, hiệu ứng, âm thanh. Dùng khi dựng/sửa video cho chủ sở hữu để ra đúng chất của họ; quy tắc mẫu snapshot và yêu cầu người dùng vẫn thắng."
---

# Phong cách edit của chủ sở hữu (học từ CapCut)

Nguồn: `1029 (1)` · khung 1080x1920. Con số đo trực tiếp từ dự án CapCut (draft_content.json), không suy đoán. Áp bằng công cụ có sẵn của ContentOS; không tải hiệu ứng / âm thanh / sticker của CapCut.

## Nhịp cắt
- Độ dài cảnh trung bình 48.3s, trung vị 46.7s; 0% cảnh ngắn hơn 2s; ~2.5 cảnh/phút.
- Đổi tốc độ 2.5 lần/phút · keyframe (zoom / di chuyển) 0/phút → `zooms[]` mật độ tương đương.
- Lớp video chồng (cảnh trám / PiP) 3.7/phút → `brolls[]` mode pip / full.

## Chữ
- Chữ nhấn 1.9 chữ/phút. Font: iCielPanton-BlackItalic (1), Gontserrat-Black (1). Màu: #ff0000 (1), #000000 (1), #ffffffff (1).
- Hoạt ảnh chữ hay dùng: Manifest (in) (2), Mini Zoom (in) (1), Slide Right (in) (1), Camera Flash (in) (1), Fade Out (out) (1) → chọn `fx` gần nhất (bật / lắc → words, slide; gõ → type; quét → mask, marker).
- Phụ đề: luôn bật (~25.5 dòng/phút); mẫu 逐词显色黄色 (41), SIMPLE VLOG EN - SIMPLE STORY (1); font iCielPanton-Black (41); màu #ffdc00 (41) → `captions.enabled: true`, `brand.caption` cùng font/màu, tô từ đang nói.

## Chuyển cảnh, hiệu ứng, sticker
- Chuyển cảnh 0/phút, trung bình 0s. Hay dùng: không dùng → `segments[].tIn` / `transitions.cut` (flash, slide, zoom, blur gần nghĩa nhất).
- Hiệu ứng video: không dùng. Chỉnh màu: không (chỉ áp khi người dùng yêu cầu chỉnh màu).
- Sticker: không dùng (~0/phút) → khối đồ hoạ / icon hợp lời nói, không chèn trang trí lạc đề.

## Âm thanh
- Tiếng hiệu ứng 3.7/phút. Hay dùng: Swish (2), I'm surprised, den sounds when I emphasize it! sound of(863204) (1), click (camera shutter sound single shot)(1111055) (1), Shutter Sound of the Camera (1), UI Prompt (1) → `audio.sfx` loại gần nghĩa (ding, pop, whoosh…).
- Nhạc nền khoảng -20 dB so với gốc.

## Cách dùng
1. Đọc cùng SKILL.md của mẫu đã snapshot và `contentos-edit-standards`.
2. Khi mẫu không quy định, lấy nhịp cắt, mật độ chữ, chuyển cảnh, âm thanh theo các con số trên.
3. Ghi trong tóm tắt bàn giao điểm đã theo phong cách chủ sở hữu và điểm chưa có tương đương trong ContentOS.
