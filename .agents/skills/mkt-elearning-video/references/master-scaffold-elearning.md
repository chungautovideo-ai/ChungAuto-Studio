# Master index.html Scaffold — eLearning Variant

Extends `mkt-hyperframe-knowledge-video/references/master-scaffold.md`.
Thêm: progress bar, lesson badge, chapter transition style.

---

## Extra elements trong `<head>`

```html
<style>
  /* ── eLearning Global UI ── */

  /* Progress bar — fixed top */
  #lesson-progress-bar {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 6px;
    background: rgba(255,255,255,0.08);
    z-index: 9999;
    pointer-events: none;
  }
  #lesson-progress-fill {
    height: 100%;
    background: #4fc3f7;
    width: 0%;
    transition: width 0.6s ease;
    box-shadow: 0 0 8px rgba(79,195,247,0.6);
  }
  #progress-dot {
    position: absolute;
    right: 0; top: -3px;
    width: 12px; height: 12px;
    border-radius: 50%;
    background: #4fc3f7;
    box-shadow: 0 0 12px #4fc3f7;
    transform: translateX(50%);
  }

  /* Lesson badge — top-left */
  #lesson-badge {
    position: fixed;
    top: 20px; left: 40px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 18px;
    font-weight: 500;
    color: rgba(255,255,255,0.45);
    letter-spacing: 0.06em;
    z-index: 9998;
    pointer-events: none;
  }

  /* Course name — bottom fixed */
  #course-footer {
    position: fixed;
    bottom: 24px; left: 0; right: 0;
    text-align: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    color: rgba(255,255,255,0.20);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    z-index: 9997;
    pointer-events: none;
  }
</style>
```

---

## HTML elements (thêm vào `<body>` trước `#stage`)

```html
<!-- Progress bar -->
<div id="lesson-progress-bar">
  <div id="lesson-progress-fill">
    <div id="progress-dot"></div>
  </div>
</div>

<!-- Lesson badge -->
<div id="lesson-badge">BÀI 1</div>  <!-- update per lesson -->

<!-- Course footer -->
<div id="course-footer">Tên Khóa Học</div>
```

---

## Master timeline — progress bar advancement

```js
// Trong master GSAP timeline, advance progress bar at each section start:
// section_count = total number of sections (excluding intro/hook/outro)

const SECTIONS = 3;  // update per lesson

function setProgress(pct) {
  gsap.to('#lesson-progress-fill', {
    width: pct + '%',
    duration: 0.6,
    ease: 'power2.out'
  });
}

// Tại beat bắt đầu section 1:
masterTl.call(setProgress, [33], section1_start_s);
// Tại beat bắt đầu section 2:
masterTl.call(setProgress, [66], section2_start_s);
// Tại beat bắt đầu section 3:
masterTl.call(setProgress, [100], section3_start_s);
```

---

## Chapter transition (thay wipe của knowledge-video)

Giữa sections, dùng **slide-up** thay vì horizontal wipe:

```js
// Trong master timeline, tại section-divider beat:
const SLIDE_DUR = 0.45;

// Outgoing scene slides up + fades:
masterTl.to('#scene-wipe', {
  yPercent: -100, opacity: 0,
  duration: SLIDE_DUR, ease: 'power2.in'
}, section_divider_start);

// Incoming section-divider scene slides up into place:
masterTl.fromTo('#scene-wipe', {
  yPercent: 100, opacity: 0
}, {
  yPercent: 0, opacity: 1,
  duration: SLIDE_DUR, ease: 'power2.out'
}, section_divider_start + SLIDE_DUR * 0.7);
```

**Giữa beats trong cùng 1 section** → dùng crossfade (opacity 0→1) thay vì slide, để không bị "choppy" khi nhiều beats liền nhau.

---

## Section label bên cạnh progress dot

Optional: hiển thị tên section nhỏ khi progress advance.

```js
const sectionLabels = ['Phần 1: ...', 'Phần 2: ...', 'Phần 3: ...'];

function setProgress(pct, labelText) {
  gsap.to('#lesson-progress-fill', {width: pct + '%', duration: 0.6, ease: 'power2.out'});
  if (labelText) {
    const dot = document.getElementById('progress-dot');
    dot.setAttribute('title', labelText);
    // Optional floating tooltip above dot, animate in/out
  }
}
```

---

## Brand stamp (eLearning version)

Không dùng avatar hình tròn như knowledge-video.
Thay bằng text logo góc phải:

```html
<div id="brand-stamp" style="
  position: fixed;
  top: 20px; right: 40px;
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: rgba(255,255,255,0.35);
  letter-spacing: 0.04em;
  z-index: 9998;
  pointer-events: none;
">Mai Kim Quý</div>
```

Nếu user có logo image: `<img src="assets/brand/logo.png" style="height:32px;opacity:0.5">`.

---

## Checklist trước khi render

- [ ] Progress bar wired lên all section starts
- [ ] `#lesson-badge` text đúng ("BÀI X" hoặc "BÀI X / Y")
- [ ] `#course-footer` text đúng tên khóa học
- [ ] Chapter transitions đúng loại (slide-up giữa sections, crossfade trong section)
- [ ] Brand stamp visible nhưng không lấn át content
- [ ] Scene durations khớp beats.json
