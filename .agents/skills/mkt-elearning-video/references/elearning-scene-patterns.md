# eLearning Scene Patterns — 15 Canonical Patterns

Thêm vào 11 patterns của knowledge-video. Dùng khi beat là nội dung giảng dạy.

---

## Pattern selection

```
Beat content                              → Pattern
────────────────────────────────────────────────────────────────
"Tên bài + học xong biết gì"             → lesson-intro
"Bước sang phần mới / chapter"           → section-divider
"Giải thích 1 khái niệm / thuật ngữ"    → definition-card
"Sơ đồ / quy trình / flow"              → concept-diagram
"Ví dụ thực tế / case study"             → example-showcase
"Câu hỏi kiểm tra + đáp án"             → quiz-question
"Tóm tắt những điểm chính"              → key-takeaway
"Review toàn bài / all concepts"         → recap-grid
"Vị trí nào được nhớ / bị bỏ qua"       → attention-curve
"Đèn chiếu / focus vào điểm cụ thể"     → spotlight-scan
"Pipeline / agent xử lý / batch queue"  → process-agent
"So sánh 2 cách theo trục thời gian"    → timeline-compare
"Logo / tool trung tâm + các thứ quay orbit"  → orbit-hub
"N inputs gộp lại thành 1 output"       → converge-diagram
"Nhiều tính năng / config hiện dạng pills" → feature-badge-grid
```

---

## 1. `lesson-intro`

**Dùng khi**: Beat 1 của mọi bài giảng — giới thiệu tên bài + learning objectives.

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  [top bar: "Bài X — Tên Môn Học"]     [progress: ░░░░░░░░]  │
│                                                              │
│  [Eyebrow mono small]  BÀI X                                 │
│  [Hero 80px 900]  Tên Bài Học                                │
│  [Subtitle 28px]  Thời lượng: Xm | Level: Cơ bản             │
│                                                              │
│  Sau bài này, bạn sẽ:                                        │
│  ☑  [objective 1]                                            │
│  ☑  [objective 2]                                            │
│  ☑  [objective 3]                                            │
│                                                              │
│  [Particle bokeh background]                                 │
└─────────────────────────────────────────────────────────────┘
```

**Animation**: Hero text chạy từ dưới lên (0.3s), objectives fade in stagger (0.2s mỗi cái, bắt đầu t=0.8s).

**GSAP**:
```js
tl.fromTo('#lessonTitle', {y:60,opacity:0}, {y:0,opacity:1,duration:0.7,ease:'power3.out'}, 0.2);
objectives.forEach((el,i) => {
  tl.fromTo(el, {x:-30,opacity:0}, {x:0,opacity:1,duration:0.5,ease:'power2.out'}, 0.8 + i*0.22);
});
```

---

## 2. `section-divider`

**Dùng khi**: Chuyển sang section mới trong bài. Beat ngắn ~5-8s.

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  [progress bar advance to new section]                       │
│                                                              │
│              [Horizontal line draw left→right]               │
│                                                              │
│  [Mono 20px]  PHẦN 1 / 3                                     │
│  [Bold 72px]  Tên Section                                    │
│  [Subtitle 28px color=secondary]  Mô tả ngắn                 │
│                                                              │
│  [line draw right→left]                                      │
└─────────────────────────────────────────────────────────────┘
```

**Visual**: Background tối hơn (rgba dark overlay), section number lớn mờ góc phải làm decor.

**Animation**: Line vẽ qua màn hình (0.6s), number + title fade up, subtitle fade (0.3s delay).

---

## 3. `definition-card`

**Dùng khi**: Giải thích 1 khái niệm / thuật ngữ mới.

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  [Eyebrow]  KHÁI NIỆM                                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [Term: 56px 700 cyan]  Tên Thuật Ngữ               │   │
│  │  ──────────────────────────────                      │   │
│  │  [Definition: 32px 400]                              │   │
│  │  Định nghĩa đầy đủ 2-3 dòng.                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [Amber callout]  ⚡ Ví dụ: ...text ví dụ ngắn...          │
│                                                              │
│  [Optional: Analogy box]  💡 Tương tự như...               │
└─────────────────────────────────────────────────────────────┘
```

**Animation**: Card scale-in từ 0.9→1 (0.5s), definition text reveals word by word (nếu ngắn) hoặc fade (nếu dài), example callout bounces in từ phải (0.3s, t=1.2s).

**CSS**:
```css
.def-card {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-left: 4px solid #4fc3f7;
  border-radius: 16px;
  padding: 40px 48px;
}
.example-callout {
  background: rgba(251,191,36,0.08);
  border: 1px solid rgba(251,191,36,0.30);
  border-radius: 12px;
  padding: 20px 28px;
}
```

---

## 4. `concept-diagram`

**Dùng khi**: Cần giải thích quy trình, sơ đồ, flow, hierarchy, cycle.

**Sub-variants** (chọn 1 phù hợp):

**A. Linear flow** (A → B → C → D):
- 3-5 bước ngang, mỗi bước 1 icon + label
- Arrow vẽ giữa các bước sequentially
- Active step highlight cyan

**B. Cycle** (vòng tròn):
- 4-6 nodes quanh vòng tròn, connected arcs
- Line vẽ clockwise, nodes appear on reach
- Center label = tên quy trình

**C. Hierarchy / Tree**:
- Root node top, branches drop down
- Lines vẽ từ root xuống
- Nodes fade in per level

**D. Compare / Venn**:
- 2 circles overlap, items in each zone
- Fill opacity animate in per zone

**Animation rule**: Vẽ structure TRƯỚC (lines/shapes), text SECOND. Không show text trước khi có container.

---

## 5. `example-showcase`

**Dùng khi**: Ví dụ thực tế, case study, mini-scenario.

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  [Eyebrow amber]  VÍ DỤ THỰC TẾ                             │
│                                                              │
│  ┌── Scenario card ────────────────────────────────────┐    │
│  │  [Situation: italic 30px]                           │    │
│  │  "Tình huống: ABC..."                               │    │
│  └──────────────────────────────────────────────────── ┘    │
│                                                              │
│  ↓  [Arrow animate down]                                     │
│                                                              │
│  ┌── Solution card (cyan border) ────────────────────── ┐   │
│  │  [Solution bold 32px]                                │   │
│  │  "Áp dụng [concept]: XYZ..."                        │   │
│  └──────────────────────────────────────────────────── ┘   │
│                                                              │
│  [Result badge: mint bg]  ✓ Kết quả: ...                   │
└─────────────────────────────────────────────────────────────┘
```

**Animation**: Scenario appears (t=0.3s), arrow draws (t=1.5s), solution reveals (t=2.0s), result badge bounces (t=3.5s).

---

## 6. `quiz-question`

**Dùng khi**: Câu hỏi kiểm tra hiểu bài + reveal đáp án.

**Layout — Phase 1 (question)**:
```
┌─────────────────────────────────────────────────────────────┐
│  [Eyebrow]  🧠 KIỂM TRA NHANH                               │
│                                                              │
│  [Question: 44px 700]                                        │
│  "[Câu hỏi]?"                                                │
│                                                              │
│  A.  [Option A]                                              │
│  B.  [Option B]                                              │
│  C.  [Option C]                                              │
│  D.  [Option D]  (nếu multiple choice)                       │
│                                                              │
│  [Countdown bar hoặc pulse animation 3-4s]                  │
└─────────────────────────────────────────────────────────────┘
```

**Layout — Phase 2 (answer reveal, t=DURATION/2)**:
- Đáp án đúng → mint green + ✓
- Đáp án sai → dim opacity 0.3
- Explanation box fades in bên dưới
- "Vì sao?" → amber callout

**Animation**: Options stagger in (0.15s each), countdown bar runs, at mid-point wrong answers dim, correct glows mint.

**Note**: Với True/False → 2 large buttons side-by-side. Với fill-in-blank → show blank then reveal.

---

## 7. `key-takeaway`

**Dùng khi**: Cuối bài — tóm tắt 3-5 điểm cần nhớ.

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  [Eyebrow]  TÓM TẮT BÀI HỌC                                 │
│  [Title 56px]  Nhớ 3 điều này:                               │
│                                                              │
│  [1] [Icon ✓ cyan]  [Point 1: 34px 600]                     │
│      [Sub-detail: 24px 400 secondary]                        │
│                                                              │
│  [2] [Icon ✓ cyan]  [Point 2]                               │
│      [Sub-detail]                                            │
│                                                              │
│  [3] [Icon ✓ cyan]  [Point 3]                               │
│      [Sub-detail]                                            │
│                                                              │
│  [Horizontal rule]                                           │
│  [Next lesson teaser: "Bài tiếp: ..."]                      │
└─────────────────────────────────────────────────────────────┘
```

**Animation**: Title in (t=0.3s), each point slides from left stagger 0.4s, check icons animate in with spring bounce.

---

## 8. `recap-grid`

**Dùng khi**: Review toàn bộ khái niệm đã học trong bài — dạng grid nhỏ.

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  [Title]  Hôm nay bạn đã học:                                │
│                                                              │
│  ┌───────┐  ┌───────┐  ┌───────┐                            │
│  │ C 1   │  │ C 2   │  │ C 3   │  3-col grid                │
│  │ Term  │  │ Term  │  │ Term  │                             │
│  │ Def   │  │ Def   │  │ Def   │                             │
│  └───────┘  └───────┘  └───────┘                            │
│                                                              │
│  ┌───────┐  ┌───────┐  ┌───────┐                            │
│  │ C 4   │  │ C 5   │  │ C 6   │                            │
│  └───────┘  └───────┘  └───────┘                            │
└─────────────────────────────────────────────────────────────┘
```

Mỗi ô: Term (cyan 28px bold) + Definition (20px secondary). Max 6 ô (3×2). Nếu > 6 khái niệm → dùng 2 cột hoặc tách 2 slides.

**Animation**: Grid fades in column by column, each card flips từ 0 (rotateY 90→0).

---

---

## 9. `attention-curve`

**Dùng khi**: Giải thích hiệu ứng serial-position / attention bias — vị trí nào trong chuỗi được nhớ/bỏ qua. Ví dụ: "Đọc giữa = đọc sót", "phần đầu và cuối được nhớ hơn".

**Visual cốt lõi**:
```
         ●  (điểm nguồn — đèn / tiêu điểm)
        /|\
       / | \
      /  |  \
●────────────────────────● (U-curve — đường chú ý)
         ●  (đáy curve)
        ★  (sparkle icon)
 ┌──┬──┬──┬──┬──┬──┬──┬──┬──┐
 │▓▓│▓▓│░░│░░│◑◑│░░│░░│▓▓│▓▓│  ← tile row
 └──┴──┴──┴──┴──┴──┴──┴──┴──┘
  ↑ nhớ tốt        ↑ nhớ tốt
           ↑ bị bỏ qua
```

**Layout** (1920×1080):
- Title "GIỮA = ĐỌC SÓT" top center, Inter 900, bold
- Curve: SVG path quadratic U-shape, width ~1200px, centered y≈400
  - Endpoint dots left/right on curve
  - Bottom vertex dot
- Tile row: 10–12 tiles, 90px × 110px, rounded 12px, y≈680
  - Active/highlight: accent color (orange #e8490a hoặc cyan #4fc3f7)
  - Dim/normal: gray rgba(0,0,0,0.25)
  - Target tile (selected): lighter shade, slightly scaled up 1.05
- Sparkle star icon (✦) above target tile, cyan/amber

**Colors** (áp dụng được cả dark và light theme):
- Dark: bg #070c18, curve stroke cyan, tiles cyan/gray
- Light: bg #f5eedf, curve stroke #e8490a (orange), tiles orange/darkgray

**Animation (gsap.fromTo)**:
```
t=0.3  title word-by-word
t=0.8  curve SVG stroke-dashoffset draws left endpoint → right endpoint (1.2s, power3.out)
t=1.0  endpoint dots scale 0→1 (back.out(2))
t=1.5  tiles stagger in từ trái sang phải (0.08s each, y:15→0, opacity 0→1)
t=2.5  target tile scales 1→1.06, dims adjacent tiles opacity 1→0.4 (0.4s)
t=2.8  sparkle icon scales 0→1 (back.out(2.5))
t=3.2  label annotation fade in
```

**Engagement note**: Curve vẽ trước khi tiles xuất hiện — mắt theo đường cong trước, sau đó tiles "rơi vào" vị trí, tạo surprise moment khi tile giữa mờ đi.

---

## 10. `spotlight-scan`

**Dùng khi**: Chỉ ra chính xác ĐÂU là vị trí quan trọng — đèn pha chiếu trúng. Thường dùng sau `attention-curve` như một "solution beat". Ví dụ: "Đèn bắt trúng ngay", "highlight vị trí cần chú ý".

**Visual cốt lõi**:
```
                    ● (nguồn sáng — trên curve)
                   /│\
                  / │ \
                 /  │  \
            "vùng sáng"
         ●────────●───────● (curve)
★         ★
 ┌──┬──┬──┬──┬──┬──┬──┬──┬──┐
 │▓▓│▓▓│▓▓│░░│░░│░░│░░│▓▓│▓▓│
 └──┴──┴──┴──┴──┴──┴──┴──┴──┘
        ↑──────── lit zone ──┘
```

**Spotlight element**:
- Hình tam giác SVG: `<polygon>` hoặc CSS `clip-path: polygon(50% 0%, 0% 100%, 100% 100%)`
- Màu: `rgba(255,200,120,0.15)` (warm glow), stroke none
- Width tại base ≈ 280px, height ≈ 250px
- Thêm vùng glow: box-shadow hoặc radial-gradient overlay trên tiles trong beam

**Animation (gsap.fromTo)**:
```
t=0    reuse curve + tiles từ beat trước (nếu cùng scene) hoặc vẽ lại nhanh (0.5s)
t=0.5  spotlight bắt đầu ở CENTER tile, opacity 0→0.15 (0.3s)
t=1.0  spotlight DI CHUYỂN sang vị trí target (x animate, 0.8s power2.inOut)
t=1.2  tiles trong lit zone: opacity 0.4→1 (0.5s), tiles ngoài: 1→0.4 (0.5s)
t=1.5  sparkle icons bounce in trên lit tiles (scale 0→1, back.out(2.5), stagger 0.15s)
t=2.0  "vùng sáng" label fades in (y:10→0, 0.4s)
t=2.5+ hold, spotlight pulses nhẹ (opacity 0.12→0.18→0.12, repeat:-1, 2s, yoyo:true)
```

**GSAP spotlight move**:
```js
// spotlight là absolute-positioned div, left position = tile center x
gsap.fromTo('#spotlight', 
  {left: centerTileX, opacity: 0},
  {left: targetTileX, opacity: 0.15, duration: 0.8, ease: 'power2.inOut'}
);
```

**Engagement note**: Spotlight di chuyển từ sai sang đúng — movement kéo mắt. Đừng để spotlight ngay target từ đầu.

---

## 11. `process-agent`

**Dùng khi**: Giải thích pipeline / quy trình xử lý — agent/processor nhận input từ queue, tạo ra output. Phổ biến cho AI/API/system architecture.

**Visual cốt lõi**:
```
  ●         ║▓║          ┌──────────┐
  ★     →   ║▓║     →    │          │
 (agent)    ║▓║          │  output  │
  circle    ║░║          │  card    │
            ║░║          └──────────┘
           (queue)
           [▪][▪]
          (items)
```

**Layout** (3-zone horizontal, 1920px):
- Agent circle: x=260, y=540, radius 90px, filled accent color, sparkle icon center
- Queue bar: x=700, y=280–820, width=60px, height=540px, rounded caps
  - Segments: 8–10 equal-height segments, alternating filled/empty
  - "Items" màu accent: 2–3 small rounded rects (40×32px) near base của queue, scattered
- Output card: x=1100–1720, y=280–820, rounded 24px, border 2px, 5–6 placeholder text lines

**CSS queue**:
```css
.queue-bar {
  background: #1a1a1a; /* dark fill */
  border-radius: 30px;
  display: flex; flex-direction: column; gap: 6px;
  padding: 8px;
}
.queue-segment { height: 46px; border-radius: 6px; background: rgba(255,255,255,0.08); }
.queue-segment.filled { background: rgba(79,195,247,0.6); }
```

**Animation (gsap.fromTo)**:
```
t=0.3  title word-by-word
t=0.8  agent circle scales 0→1 (back.out(1.7), 0.5s)
t=1.2  agent sparkle rotates 0→360 (1s, linear) — "đang xử lý"
t=1.5  queue bar slides down from y:-100 (0.6s, power3.out)
t=1.8  queue segments fill top→bottom stagger (0.06s each)
t=2.2  "items" (small rects) scatter in near queue base (x:±20, scale 0→1, stagger 0.15s)
t=2.8  arrow from queue → card draws (SVG line stroke-dashoffset, 0.5s)
t=3.2  output card fades in + scale 0.93→1 (0.5s, power2.out)
t=3.5  text placeholder lines fill stagger (scaleX 0→1, 0.1s each)
```

**Variants**:
- `process-agent--batch`: items xếp hàng nhiều, chờ đến lượt, queue full trước khi process
- `process-agent--stream`: items trickle in real-time, queue ngắn, output card updates liên tục

---

## 12. `timeline-compare`

**Dùng khi**: So sánh 2 cách tiếp cận theo TRỤC THỜI GIAN — ví dụ batch vs stream, serial vs parallel, wait vs progressive. Chứng minh rằng total time có thể bằng nhau nhưng perceived speed khác.

**Visual cốt lõi**:
```
  [Label A]  ████████████████████████████████████░░░  ●
             "annotation A"           dashed │ line
  [Label B]  ██████████████████████████████████████░  ●
  "TTFT ≈ 0" ↑ token đầu gần như ngay lập tức
  
  [Footer note]  "cùng tổng thời gian — không nhanh hơn giây nào · chỉ thấy nhanh hơn"
```

**Layout** (1920×1080):
- Each bar: height 72px, rounded-full, y-gap between bars = 120px
- Bar track bg: rgba(255,255,255,0.08)
- Bar A (batch): fills slowly — dark/muted fill — dot endpoint — dashed vertical line at end
- Bar B (stream): fills fast (TTFT annotation at left) — accent color fill
- Dashed vertical line: x = bar max width, spans both bars
- Label left: JBM 28px, offset x=-160
- Annotations: Inter 22px italic, color per bar
- Footer: Inter 24px, centered, muted white, bottom area

**Colors**:
- Batch bar: #2a2a2a (dark charcoal)
- Stream bar: #4fc3f7 (cyan) hoặc #e8490a (orange) tùy theme
- Annotation batch: rgba(255,255,255,0.5)
- Annotation stream: cyan/orange accent

**Animation (gsap.fromTo)**:
```
t=0.3  title / eyebrow in
t=0.8  label A fades in
t=1.0  bar A fills: scaleX 0→0.92 (2.0s, power1.inOut) — deliberate slow fill
t=1.2  annotation A fades in mid-fill (opacity 0→1, 0.4s)
t=3.2  endpoint dot for A pops (scale 0→1, back.out(2))
t=3.5  dashed vertical line draws top→bottom (scaleY 0→1, 0.3s)
t=3.8  label B fades in + "TTFT ≈ 0" annotation bounces in (scale 0→1, back.out(2))
t=4.0  bar B fills: scaleX 0→0.97 (1.8s, power2.out) — same total width, slightly faster feel
t=4.1  TTFT pin appears at bar B left edge (scale 0→1, 0.2s) — appears almost immediately
t=5.8  endpoint dot for B pops
t=6.2  footer text word-by-word (0.08s/word)
t=7+   hold; bar B pulses glow subtly (opacity 0.9→1.0, repeat:-1, yoyo:true, 2s)
```

**Key GSAP trick — bar fill**:
```js
// Bar fills from left — set transformOrigin
gsap.set('.bar-fill', {transformOrigin: 'left center', scaleX: 0});
gsap.fromTo('.bar-a-fill', {scaleX:0}, {scaleX:0.92, duration:2.0, ease:'power1.inOut'});
gsap.fromTo('.bar-b-fill', {scaleX:0}, {scaleX:0.97, duration:1.8, ease:'power2.out'});
```

**TTFT pin** (vertical tick mark at start of stream bar):
```css
.ttft-pin {
  position: absolute; left: 0; top: -20px;
  width: 2px; height: 110px;
  background: currentColor;
}
```

**Engagement note**: Bar A và B kết thúc cùng vị trí x (dashed line) — visual proof "same total time". Nhưng bar B bắt đầu hiện content gần như ngay lập tức. Đây là "aha moment" của pattern.

---

---

## 13. `orbit-hub`

**Dùng khi**: Một tool/product/concept trung tâm tích hợp với / kết nối nhiều thứ xung quanh. Ví dụ: "Palmier Pro tích hợp Claude, Cursor, Codex, Timeline", "React kết nối với Redux, Router, Query, Testing".

**Visual cốt lõi**:
```
         ● Claude (pill tag)
        /
  ● ──────────────────── ●   ← orbit ring 1 (cyan, radius 240px)
 /     ┌──────────┐       \
●      │  ██████  │        ● Codex (pill tag)
       │  █ P  █  │
Cursor │  ██████  │
(pill) └──────────┘
  \    ← center icon      /
   ●──────────────────── ●   ← orbit ring 2 (coral, radius 340px)
        \
         ● Timeline (pill tag)

[Large title gradient] Tên sản phẩm
[Subtitle white]       Tagline / mô tả ngắn
```

**Layout** (1920×1080 hoặc 1080×1920 9:16):
- Center icon: 200×200px rounded-square (radius 44px), dark bg, logo image hoặc SVG
- Orbit ring 1: SVG `<circle>` stroke only, radius 240px, color cyan rgba(79,195,247,0.4), stroke-width 1.5px
- Orbit ring 2: SVG `<circle>` stroke only, radius 340px, color coral rgba(248,113,113,0.3)
- Satellite labels: 4–6 pill tags `border-radius: 50px`, bg rgba(255,255,255,0.12), backdrop-filter blur(8px), border rgba(255,255,255,0.2)
  - Each pill: icon (emoji/SVG 20px) + label Inter 700 24px white
  - Positioned via `transform: translate(x, y)` relative to center
  - Small dot connector (3px circle) on the orbit ring at the pill's radial position
- Title gradient: css `background: linear-gradient(90deg, #f87171, #34d399)`, `-webkit-background-clip: text`
- Particle bokeh: 60–80 particles, dark reddish or standard cyan

**Orbit ring draw technique**:
```js
// Draw orbit ring with stroke-dashoffset
const circumference = 2 * Math.PI * radius; // e.g. 2*π*240 = 1508
gsap.set('#ring1', { strokeDasharray: circumference, strokeDashoffset: circumference });
gsap.fromTo('#ring1',
  { strokeDashoffset: circumference },
  { strokeDashoffset: 0, duration: 1.5, ease: 'power2.out' }
);
```

**Animation (gsap.fromTo)**:
```
t=0    particles start
t=0.3  center icon scales 0→1 (back.out(1.5), 0.6s)
t=0.8  orbit ring 1 draws (stroke-dashoffset circumference→0, 1.5s, power2.out)
t=1.2  orbit ring 2 draws (1.8s, power2.out) — starts slightly after ring 1
t=1.5  satellite dots appear on rings stagger (scale 0→1, 0.15s each, back.out(2))
t=1.8  pill tags slide in từ their respective directions (x or y ±30→0, opacity 0→1, 0.4s, stagger 0.2s)
t=3.0  title slides up (y:40→0, opacity 0→1, 0.6s, power3.out)
t=3.5  subtitle fades in (opacity 0→1, 0.5s)
t=4.5+ orbit rings rotate slowly: gsap.to('#ring1', {rotation: 360, duration: 40, ease:'none', repeat:-1})
       orbit rings rotate in opposite directions (ring2: rotation: -360)
```

**Pill tag positioning** (4 pills around center, radius R):
```js
const positions = [
  { angle: -60, ring: 1 },   // top-left  → Claude
  { angle:  30, ring: 2 },   // right     → Codex
  { angle: 160, ring: 1 },   // bottom-left → Cursor
  { angle: 110, ring: 2 },   // bottom-right → Timeline
];
positions.forEach(({angle, ring}) => {
  const r = ring === 1 ? 240 : 340;
  const x = Math.cos(angle * Math.PI/180) * r;
  const y = Math.sin(angle * Math.PI/180) * r;
  // position pill at (centerX + x, centerY + y)
});
```

**Engagement note**: Orbit rings tiếp tục xoay chậm trong suốt beat — gives a "living system" feel. Satellite pills appear như chúng đang bay vào quỹ đạo.

---

## 14. `converge-diagram`

**Dùng khi**: N inputs/parameters kết hợp lại tạo thành 1 output — config, API params, merge operation, synthesis. Ví dụ: "base_url + API key + model → custom provider", "3 inputs → 1 result".

**Visual cốt lõi** (N=3, phổ biến nhất):
```
  ┌──────┐    ┌──────┐    ┌──────┐   ← input row (3 cards)
  │ icon │    │ icon │    │ icon │
  │label1│    │label2│    │label3│
  └──────┘    └──────┘    └──────┘
      │            │           │
      └────────────┼───────────┘
                   │    ← connector lines converge
           ┌───────────────┐
           │  ☁  output   │   ← output card (wider, gradient)
           └───────────────┘
```

**Layout** (1920×1080):
- Eyebrow: step badge + icon + title (e.g., "06  ⬆ Provider online")
  - Step badge: 56px rounded-8, gradient blue/purple, JBM 700 28px
  - Title: Inter 700 52px white
- Input cards (3): each ~380×180px, bg rgba(255,255,255,0.07), border rgba(255,255,255,0.12), rounded 20px
  - Icon: 52px colored SVG (cyan preferred)
  - Label: Inter 500 28px, JBM for code labels (base_url, API key)
  - Position: y=240, evenly spaced x
- Connector lines: SVG `<path>` from each card bottom-center → single point → output card top
  - Color: rgba(79,195,247,0.4)
  - Line style: stroke-width 2, no fill
  - Shape: straight lines meeting at a merge point, or curved bezier
- Output card: ~640×140px, gradient bg (`linear-gradient(135deg, #34d399, #4fc3f7)`), rounded 70px (pill shape)
  - Icon: 52px dark, center
  - Label: Inter 700 36px dark (#0d1428)
  - Position: y=560, centered x

**Connector SVG path** (simple Y-shape):
```svg
<!-- From card 1 bottom-center (360, 420) to merge point (960, 510) to output top (960, 530) -->
<path d="M 360 420 L 360 480 L 960 510" stroke="#4fc3f7" stroke-width="2" fill="none"/>
<path d="M 960 420 L 960 510" stroke="#4fc3f7" stroke-width="2" fill="none"/>
<path d="M 1560 420 L 1560 480 L 960 510" stroke="#4fc3f7" stroke-width="2" fill="none"/>
<path d="M 960 510 L 960 560" stroke="#4fc3f7" stroke-width="2" fill="none"/>
```

**Animation (gsap.fromTo)**:
```
t=0.3  step badge + title slide in from left (x:-40→0, opacity 0→1, 0.5s)
t=0.8  input card 1 scales up (scale 0.9→1, opacity 0→1, 0.4s, power2.out)
t=1.0  input card 2 — same
t=1.2  input card 3 — same
t=1.6  connector lines draw (stroke-dashoffset: length→0, stagger 0.1s, 0.6s each)
t=2.4  output card scales 0.92→1 + fades in (0.5s, back.out(1.4))
t=2.8  output card gradient animates (background-position shift, creates shimmer)
t=3.5+ hold; connector lines pulse opacity 0.4→0.7→0.4 (repeat:-1, 2s, yoyo:true)
```

**Gradient shimmer on output card**:
```css
.output-card {
  background: linear-gradient(135deg, #34d399 0%, #4fc3f7 50%, #34d399 100%);
  background-size: 200% 200%;
}
/* GSAP animate background-position */
gsap.fromTo('.output-card', 
  { backgroundPosition: '0% 50%' },
  { backgroundPosition: '100% 50%', duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut' }
);
```

**Variants**:
- `converge-diagram--2`: 2 inputs (L/R) → 1 output, wider cards
- `converge-diagram--4`: 4 inputs (2×2 grid) → 1 output, lines from each
- `diverge-diagram`: reverse flow — 1 input fanning OUT to N outputs

**Engagement note**: Output card xuất hiện SAU khi tất cả lines đã vẽ xong — tạo "kết quả được tạo ra" moment. Không show output trước connector.

---

## 15. `feature-badge-grid`

**Dùng khi**: Showcase nhiều tính năng / config options / parameters cùng lúc — không theo thứ tự tuyến tính. Dùng số lớn ở giữa làm focal point. Ví dụ: "24 tính năng", "Voice + Avatar + Emotion + ngôn ngữ + logo + ...", feature matrix release.

**Visual cốt lõi**:
```
  [Voice ●]    [Avatar ●]   [Emotion ●]   ← row 1: large pills, 3 cols, equal width
    blue         amber         green

  [ngôn ngữ]     [  24  ]    [VI] [bg]    ← row 2: small pill + BIG NUMBER + small circles
   dark blue      gradient    red  gold
  [logo]↗

  [⊡ sales ──────]  [━━━]  [🎓 training] ← row 3: wide pills, bar, wide pill
     blue                       green
```

**Layout** (1920×1080):

**Row 1 — Feature pills (large)**:
- 3 pills, height 88px, width ~380px each, evenly spaced x=160/760/1360
- Pill: rounded-full, gradient bg per pill, Inter 700 32px white, icon left 28px
- Colors: blue `linear-gradient(135deg, #1a56d6, #2563eb)`, amber `linear-gradient(135deg, #b45309, #f59e0b)`, green `linear-gradient(135deg, #065f46, #10b981)`

**Row 2 — Mixed sizes**:
- Small pill left: "ngôn ngữ" (dark blue, 180px × 60px)
- Small pill below-left: "logo" (green, 140px × 56px, slightly offset)
- Center number: "24" in giant Inter 900 180px, gradient gold-to-green (`linear-gradient(180deg, #f59e0b, #10b981)`)
- Small circle right-top: "VI" (red bg, 80px diameter)
- Small circle right-bottom: "bg" (amber/olive bg, 80px diameter)

**Row 3 — Action pills**:
- Left pill: "⊡ sales" (wide ~420px, dark blue gradient, icon)
- Center: progress bar / connector bar (~120px, gradient)
- Right pill: "🎓 training" (wide ~380px, green gradient)

**CSS pill base**:
```css
.badge-pill {
  border-radius: 9999px;
  display: inline-flex; align-items: center; gap: 12px;
  padding: 0 32px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.15);
}
.badge-circle {
  border-radius: 50%;
  width: 80px; height: 80px;
  display: flex; align-items: center; justify-content: center;
  font: 700 24px/1 Inter, sans-serif;
}
```

**Animation (gsap.fromTo) — staggered organic reveal**:
```
t=0    particles
t=0.3  row-1 pill 1 (Voice): scale 0→1, y:-20→0 (back.out(1.7), 0.45s)
t=0.5  row-1 pill 2 (Avatar): same
t=0.7  row-1 pill 3 (Emotion): same
t=1.0  center number "24" scales 0→1 (back.out(1.3), 0.6s) — AFTER pills, before small badges
t=1.4  small pill "ngôn ngữ": x:-30→0, opacity 0→1 (0.35s)
t=1.55 small pill "logo": x:-20→0, opacity 0→1 (0.35s)  [offset y, lower]
t=1.5  circle "VI": scale 0→1 (back.out(2.5), 0.3s)
t=1.65 circle "bg": scale 0→1 (back.out(2.5), 0.3s)
t=2.0  row-3 pill "sales": x:-40→0, opacity 0→1 (0.4s)
t=2.15 bar slides in (scaleX 0→1, transformOrigin left, 0.3s)
t=2.3  row-3 pill "training": x:40→0, opacity 0→1 (0.4s)
t=3.0+ center number pulses glow (textShadow, opacity 0.7→1→0.7, repeat:-1, 2.5s yoyo:true)
```

**"24" counter variant** — nếu muốn number count up:
```js
const counter = { val: 0 };
gsap.fromTo(counter, { val: 0 }, {
  val: 24, duration: 0.8, ease: 'power2.out',
  onUpdate: () => { document.querySelector('.big-number').textContent = Math.round(counter.val); }
});
```

**Scatter positioning** — badges KHÔNG align perfect grid, offset nhẹ để organic:
```js
// Slight random-ish offsets via seeded PRNG
const rng = mulberry32(0xBADGE1);
badges.forEach(el => {
  const offsetY = (rng() - 0.5) * 16; // ±8px
  gsap.set(el, { y: `+=${offsetY}` });
});
```

**Engagement note**: Center number xuất hiện GIỮA sequence — không đầu, không cuối. Khi "24" bật lên giữa các pills đang xuất hiện, nó trở thành anchor khiến mắt tự quay về center trước khi tiếp tục xem các badge còn lại.

---

## Invention guardrails (eLearning)

Khi không fit pattern nào:
- Chọn 1 **dominant visual** (diagram, analogy, process)
- Màu primary cho active/important elements = **cyan**
- Màu example/highlight = **amber**
- Màu correct/done = **mint**
- Màu warning/wrong = **coral**
- KHÔNG dùng quá 3 màu accent trong 1 scene
- Text phải readable: min 28px body, min 40px headings eLearning

## Light-theme variant (tùy chủ đề)

Các pattern 9–12 phổ biến trong light-theme edu content (warm cream bg). Áp dụng khi content cần cảm giác "giấy / notebook":

```
bg:          #f5eedf  (warm cream)
accent:      #e8490a  (deep orange)
text primary: #1a1a1a
text secondary: rgba(26,26,26,0.55)
card bg:     rgba(26,26,26,0.05)
card border: rgba(26,26,26,0.12)
```

Thay thế `#4fc3f7` → `#e8490a`, `#070c18` → `#f5eedf`. Tất cả GSAP rules giữ nguyên.
