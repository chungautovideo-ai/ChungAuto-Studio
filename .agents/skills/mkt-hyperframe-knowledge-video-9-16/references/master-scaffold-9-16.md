# Master Scaffold 9:16 (1080×1920)

## index.html cơ bản

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title><slug></title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 1080px; height: 1920px; overflow: hidden; background: #050810; }
    .clip {
      position: absolute; top: 0; left: 0;
      width: 1080px; height: 1920px;
      pointer-events: none;
    }
  </style>
</head>
<body>
<div id="root" data-width="1080" data-height="1920"
     style="position:relative;width:1080px;height:1920px;overflow:hidden;background:#050810;">

  <!-- ── Audio ── -->
  <audio id="vo" class="clip"
         data-start="0" data-duration="<TOTAL>" data-track-index="0"
         src="audio/full.mp3" volume="1.0"></audio>

  <!-- ── SFX (whoosh, boom) ── -->
  <!-- <audio id="sfx-whoosh" class="clip" data-start="<t>" data-duration="2" data-track-index="70"
         src="assets/sfx/whoosh.mp3" volume="0.45"></audio> -->

  <!-- ── Scene mounts ── -->
  <div id="m1" class="clip"
       data-composition-src="scenes/scene-01-<name>.html"
       data-start="0" data-duration="<d1>" data-track-index="10">
  </div>
  <div id="m2" class="clip"
       data-composition-src="scenes/scene-02-<name>.html"
       data-start="<s2>" data-duration="<d2>" data-track-index="11">
  </div>
  <!-- thêm scenes... -->

  <!-- ── Scene transitions ── -->
  <!-- Giống 16:9, copy từ references/scene-transitions.md của skill 16:9 -->

  <!-- ── Brand stamp (top-left thay vì bottom-right vì bottom bị avatar che) ── -->
  <div id="brand-stamp" class="clip brand-stamp"
       data-start="0" data-duration="<TOTAL>" data-track-index="60">
    <span class="handle">Mai Kim Quý</span>
  </div>

</div>

<style>
/* Brand stamp — top-left, tránh bị avatar che ở bottom */
#root .brand-stamp {
  position: absolute;
  top: auto; left: auto;      /* override .clip */
  top: 44px; left: 40px;
  bottom: auto; right: auto;
  width: auto; height: auto;
  z-index: 100;
  display: flex; align-items: center;
  padding: 12px 24px;
  background: rgba(8,12,22,0.62);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 999px;
  backdrop-filter: blur(8px);
}
#root .brand-stamp .handle {
  font: 700 22px/1 'JetBrains Mono', monospace;
  color: #faf9f5; letter-spacing: 0.06em;
  white-space: nowrap;
}
</style>

<script>
// Master timeline — scene transitions
// Copy wipe/push patterns từ ../mkt-hyperframe-knowledge-video/references/scene-transitions.md
// Adjust: y-based transitions thay vì x-based (vì layout dọc)
</script>
</body>
</html>
```

## Key dimensions

| | Value |
|---|---|
| Canvas | 1080 × 1920 |
| Motion graphic area | y = 0 → 1152 (60%) |
| Avatar visible area | y = 1152 → 1920 (40%) |
| Content safe zone | y = 40 → 1100 |
| Content `.content` center | y = 576 (= 1152/2) |
| Content width | 960px |
| Content horizontal center | left: 50% |

## Scene sub-comp template header

```html
<template id="scene-NN-<name>-template">
<div data-composition-id="scene-NN-<name>" data-width="1080" data-height="1920">
<!-- CSS scoped: [data-composition-id="scene-NN-<name>"] .classname -->
<!-- Content ONLY trong y=0..1152 — bottom 768px bị avatar overlay -->
```

## Content positioning trong scene

```css
[data-composition-id="scene-NN"] .content {
  position: absolute;
  top: 576px;                        /* center của motion area (1152/2) */
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  width: 960px;
}
```

## Background gradient (chỉ cover top area cho đẹp)

```css
[data-composition-id="scene-NN"] {
  position: relative; width: 1080px; height: 1920px; overflow: hidden;
  /* Gradient tập trung ở top 60% */
  background: radial-gradient(ellipse 900px 700px at 50% 30%, #0f1626 0%, #050810 100%);
  font-family: 'Inter', sans-serif; color: #faf9f5;
}
```

## Phân biệt với 16:9 scaffold

- `data-width="1080" data-height="1920"` thay vì 1920×1080
- Brand stamp: `top: 44px; left: 40px` (không bottom-right vì bị avatar che)
- `.clip { width: 1080px; height: 1920px }`
- Content center tại y=576 (center of top 60%), KHÔNG center toàn canvas
- Không đặt element nào dưới y=1100
