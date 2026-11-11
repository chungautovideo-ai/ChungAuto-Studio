---
name: mkt-elearning-video
description: Tạo video bài giảng eLearning 16:9 (1920×1080) từ nội dung giảng dạy — motion graphic HyperFrames + ElevenLabs voiceover, cấu trúc sư phạm (mục tiêu → nội dung → tóm tắt → recap), progress bar, chapter markers, definition cards, example showcases, quiz slides. **MUST use** khi user nói "video bài giảng", "eLearning", "bài học", "khóa học", "video giảng dạy", "video tutorial học", "video hướng dẫn học", "làm video khóa học", "tạo video từ slide", "tạo bài giảng video", "video lesson", "course video".
---

# HyperFrame eLearning Video Pipeline

Tạo video bài giảng chuyên nghiệp từ nội dung giảng dạy bất kỳ — văn bản, outline bài học, slides, mindmap, hay nội dung thô. Output 1 MP4 16:9 (1920×1080) phong cách dark premium với voiceover ElevenLabs.

---

## WORKFLOW (bắt buộc theo đúng thứ tự)

```
BƯỚC 1 — NHẬN NỘI DUNG
  User gửi kiến thức / tài liệu / outline bất kỳ

BƯỚC 2 — TỐI ƯU & TRÌNH BÀY (DỪNG LẠI ĐÂY)
  Phân tích sư phạm → viết lời thoại VO → chia beats → mô tả cảnh
  Xuất ra cho user xem đủ 3 phần:
    A. Lời thoại (clean, không marker kỹ thuật)
    B. Bảng beats (tên beat | pattern | thời lượng)
    C. Mô tả cảnh & hiệu ứng từng beat
  → DỪNG. Chờ user confirm.

BƯỚC 3 — SẢN XUẤT (chỉ chạy sau khi user confirm "ok")
  Tạo script.md kỹ thuật → lesson-plan.md → TTS → fan-out render → MP4
```

**KHÔNG bao giờ chạy TTS hay render trước khi user confirm.**

---

## Khi nào dùng skill này

User gửi:
- Outline bài học / giáo án / chủ đề học
- Nội dung text muốn biến thành video giảng dạy
- Slide deck (dạng text description)
- File tài liệu học tập

Output: Video bài giảng có cấu trúc sư phạm, motion graphic, voiceover, phù hợp dùng trong LMS / YouTube / khóa học online.

**KHÔNG** dùng khi:
- User muốn video news/knowledge sharing ngắn → `mkt-hyperframe-knowledge-video`
- User muốn video dọc 9:16 → `mkt-hyperframe-knowledge-video-9-16`
- User muốn video có talking-head HeyGen → skill khác

---

## Đầu vào

| Input | Bắt buộc | Mô tả |
|---|---|---|
| Nội dung bài học | Có | Text dạng bất kỳ — outline, giáo án, slides text, tài liệu |
| Tên môn học / module | Không | Dùng để đặt slug + title card |
| Số bài (Bài X/Y) | Không | Nếu là series, hiển thị progress trong series |
| Ngôn ngữ | Không | Mặc định tiếng Việt. "English" nếu muốn EN |
| ElevenLabs Voice ID | Không | Mặc định voice Mai Kim Quý |
| Thời lượng mục tiêu | Không | Mặc định 5-6 phút / bài |

---

## Output file cuối

```
workspace/content/<YYYY-MM-DD>/<slug>/
├── design.md
├── script.md
├── lesson-plan.md
├── audio/{full.mp3, alignment.json}
├── beats.json
├── assets/{brand/, sfx/}
├── scenes/scene-NN-*.html
├── index.html
└── <slug>.mp4
```

---

## Cấu trúc bài giảng chuẩn (Pedagogical Flow)

Mỗi bài PHẢI có đủ 5 phần:

```
1. LESSON INTRO     (~15-20s)   Tên bài + learning outcomes (3 bullets, dùng động từ)
2. HOOK / WHY       (~25-35s)   Tình huống thực tế, câu hỏi gợi tension
3. CONTENT SECTIONS (60-75%)   Mỗi section: divider → concept/diagram → ví dụ
4. KEY TAKEAWAYS    (~30-40s)   Recap 3 điểm, đóng vòng lặp câu chuyện hook
5. QUIZ             (~25-30s)   1 câu hỏi + countdown + reveal đáp án
```

Thời lượng typical:
- Bài ngắn (1-2 concepts): 4-6 phút
- Bài trung bình (3 sections): 8-12 phút

---

## BƯỚC 2 — Format trình bày cho user

Khi đã phân tích xong, xuất ra **đúng 3 phần** theo format dưới đây rồi DỪNG chờ confirm.

### Phần A — Lời thoại

Trình bày lời thoại dạng **text thuần, chia theo section**. KHÔNG có [BEAT N], KHÔNG có [VISUAL:] markers. Dễ đọc như đọc bài viết.

```
---
## Mở bài

Xin chào. Hôm nay chúng ta học bài: [tên bài]...

## [Tên Section 1]

[VO content của section 1]...

## [Tên Section 2]

...

## Tóm tắt

...

## Quiz

Câu hỏi kiểm tra nhanh...
---
```

Nguyên tắc viết VO:
- Câu ngắn 10-15 từ. KHÔNG dùng dấu gạch ngang dài (em dash).
- Dùng "bạn" và "chúng ta"
- Lead mỗi section bằng insight/promise, không phải định nghĩa
- 3E per concept: Explain → Example → Practice
- Đóng vòng lặp câu chuyện hook ở key takeaways

### Phần B — Bảng beats

| # | Tên beat | Pattern | Thời lượng |
|---|---|---|---|
| 1 | Lesson Intro | lesson-intro | 15s |
| 2 | Hook | hero | 30s |
| 3 | Divider Phần 1 | section-divider | 5s |
| ... | ... | ... | ... |
| N | Quiz | quiz-question | 30s |
| **Tổng** | | | **~X phút** |

### Phần C — Mô tả cảnh & hiệu ứng

Với mỗi beat, mô tả rõ:
- **Visual chính**: layout, text lớn, màu sắc
- **Animation**: loại hiệu ứng, thứ tự xuất hiện, timing gợi ý
- **Điểm nhấn engagement**: nhấn mạnh effect làm người xem tập trung

**Vì đây là video giảng dạy, hiệu ứng phải phong phú để tránh nhàm chán:**
- Text xuất hiện từng từ hoặc từng dòng (không fade cả block cùng lúc)
- Số liệu / data nên có counter animation hoặc fill animation
- Sơ đồ / diagram vẽ dần từng bước theo VO
- Mỗi concept card scale-in + glow khi active
- Quiz có countdown bar chạy + reveal animation mint/coral
- Section divider có line draw animation ngang màn hình
- Particle bokeh background chuyển động nhẹ suốt video
- Highlight text quan trọng bằng underline draw hoặc color pop

Format mô tả mỗi beat:

```
**Beat N — [Tên] (~Xs)**
Visual: [mô tả layout]
Animation: [chi tiết hiệu ứng theo thứ tự, timing]
Engagement note: [điều gì giữ sự chú ý ở beat này]
```

---

## BƯỚC 3 — Sau khi user confirm "ok"

Lúc này mới chạy pipeline kỹ thuật:

### Step A — Viết script.md kỹ thuật

Convert lời thoại + beat plan + scene descriptions thành format đầy đủ:

```
[BEAT N — TÊN BEAT — ~Xs]
Nội dung VO...
[VISUAL: mô tả kỹ thuật cho sub-agent]
[ANIMATION: GSAP specifics]
```

### Step B — lesson-plan.md + design.md

lesson-plan.md: slug, metadata, learning objectives, section structure, progress bar mapping.

design.md — Edu palette:
```
Background: #070c18, warm panel: #0d1428
Cyan #4fc3f7 — definitions, titles, progress bar
Amber #fbbf24 — highlights, examples, callouts
Mint #34d399 — quiz correct, checkmarks
Coral #f87171 — warnings, wrong answers
Card bg: rgba(255,255,255,0.06), border: rgba(255,255,255,0.10)
Typography: Inter 400-900, JetBrains Mono (code/formulas)
```

### Step C — TTS + alignment

```bash
python "<skill_dir>/../mkt-hyperframe-knowledge-video/scripts/tts.py" \
  --script $OUT/script.md \
  --out-audio $OUT/audio/full.mp3 \
  --out-alignment $OUT/audio/alignment.json
```

Voice mặc định: Mai Kim Quý (ID: 2AhJ0tIW1g4BeBvK0J5Y). Bài > 5 phút: `run_in_background: true`.

### Step D — beats.json

```json
{
  "index": 3,
  "section": "content",
  "section_title": "1. Khái niệm cơ bản",
  "pattern": "definition-card",
  "approach": "reuse",
  "start_ms": 32000,
  "end_ms": 65000,
  "duration_ms": 33000,
  "text": "...",
  "concept": "...",
  "definition": "...",
  "example": "..."
}
```

### Step E — Master index.html (eLearning scaffold)

Xem `references/master-scaffold-elearning.md`. Bắt buộc có:
1. Progress bar fixed top (6px, cyan, advances per section)
2. Lesson badge top-left "Bài X"
3. Chapter transition: slide-up giữa sections, crossfade trong section
4. Course footer fixed bottom

Brand stamp (text, không phải avatar): "Mai Kim Quý" góc phải.

### Step F — Fan-out parallel sub-agents (1 agent / beat)

Xem `references/elearning-scene-patterns.md` cho 8 patterns.

Sub-agent prompt phải có:
```
eLearning composition rules:
- Progress fill % = <section_progress>%
- Inter 400-900 + JetBrains Mono
- Definition cards: term cyan 48px, definition white 32px
- Example blocks: amber left-border 4px
- Quiz: countdown → reveal mint checkmark
- Rich animations: text word-by-word, counters, draw-on diagrams
- Particle bokeh background (seeded, subtle)
- NO Math.random() — use mulberry32 seeded PRNG
- NO anime.js — GSAP only
- NO gsap.from() — use gsap.fromTo() only
```

### Step G — Validate + Render

```bash
cd $OUT && npx hyperframes lint
cd $OUT && npx hyperframes inspect --samples 24
cd $OUT && npx hyperframes render -q standard -o <slug>.mp4
```

---

## HARD RULES

1. **`<template>` only** — NO `<html>/<head>/<body>` trong scenes.
2. **GSAP only** — no anime.js, no infinite CSS keyframes.
3. **Seeded mulberry32** — no `Math.random()`.
4. **`gsap.fromTo()`** — NOT `gsap.from()`.
5. **No exit animations** (except final scene).
6. **No `<script src=gsap>`** trong scene — master loads GSAP.
7. **Brand stamp / progress bar** — chỉ ở master index.html.
8. **CONFIRM TRƯỚC KHI SẢN XUẤT** — Bước 2 phải hoàn thành và user nói "ok" trước khi chạy bất kỳ gì ở Bước 3.
9. **3E per concept** — Explain → Example → Practice.
10. **Rich animation bắt buộc** — text word-by-word, counters, draw-on, không dùng simple fade-in cho toàn block.
11. **Close the hook loop** — key takeaways phải giải quyết tình huống mở đầu ở hook.

---

## References

- `references/elearning-scene-patterns.md` — 8 patterns: lesson-intro, section-divider, definition-card, concept-diagram, example-showcase, quiz-question, key-takeaway, recap-grid
- `references/master-scaffold-elearning.md` — progress bar + lesson badge + chapter transition
- `references/lesson-structure.md` — pedagogical guidelines, 3E framework, script templates
- `../mkt-hyperframe-knowledge-video/references/anti-patterns.md` — 24 lỗi chung cần tránh
- `../mkt-hyperframe-knowledge-video/references/scene-patterns.md` — 11 patterns cũ vẫn dùng được
- `../mkt-hyperframe-knowledge-video/references/elevenlabs-v3.md` — ElevenLabs API
- `../mkt-hyperframe-knowledge-video/scripts/tts.py` — TTS script dùng chung

**Live reference**: `workspace/content/` — xem bài đã render làm example.
