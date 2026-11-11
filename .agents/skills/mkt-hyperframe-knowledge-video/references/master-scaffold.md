# Master `index.html` Scaffold

Master `index.html` orchestrate toàn bộ composition. Scenes chỉ là `<template>` sub-comp loaded via `data-composition-src`.

## Layer stack (z-index + track-index)

| Element | track-index | z-index | Purpose |
|---|---|---|---|
| `<audio id="vo">` voiceover | 0 | — | ElevenLabs narration, volume 1.0 |
| Title card | 5 | 5 | 5-6s mở đầu (xem `title-card-slider.md`) |
| Scene mounts (#m1..#mN) | 10..10+N | — | Sub-comp loaded via `data-composition-src` |
| Scene wipe overlay | 55 | 50 | Color bar sweep ở scene boundary |
| Scene flash overlay | 56 | 51 | Brief brightness flash ở major boundary |
| Brand stamp | 60 | 100 | Text pill `Mai Kim Quý` cố định bottom-right |
| SFX layer | 70..70+M | — | Sound effects (xem `sfx-layer.md`) |

## Scene-mount overlap rule

Mỗi scene `data-duration` = beat duration + 0.4s. Scene kế tiếp `data-start` = beat end nguyên gốc. Overlap 0.4s cho phép transition smooth. Track-index khác nhau cho mỗi scene để có thể overlap.

## Brand stamp

Text-only pill — no avatar.

```html
<div id="brand-stamp" class="clip brand-stamp"
     data-start="0" data-duration="<total>" data-track-index="60">
  <span class="handle">Mai Kim Quý</span>
</div>
```

```css
#root .brand-stamp {
  position: absolute;
  top: auto; left: auto;   /* override .clip top:0 left:0 */
  bottom: 48px; right: 48px; z-index: 100;
  width: auto; height: auto;
  display: flex; align-items: center;
  padding: 16px 32px;
  background: rgba(8,12,22,0.62);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 999px;
  backdrop-filter: blur(8px);
}
#root .brand-stamp .handle {
  font: 700 28px/1 'JetBrains Mono', monospace;
  color: #faf9f5; letter-spacing: 0.06em;
  white-space: nowrap;
}
```

## Brand asset copy

Chỉ cần copy SFX vào `<project>/assets/sfx/` (không có avatar nào cần copy).
