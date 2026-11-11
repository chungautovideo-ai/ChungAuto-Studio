"""Generate the karaoke-pill caption overlay composition (transparent, 1080x1920).

Usage: python gen_caption_comp.py [project_dir]
Reads:  <project_dir>/karaoke_groups.json, <project_dir>/beats.json (for total duration)
Writes: <project_dir>/captions-overlay/index.html
"""
import json, os, sys

BASE = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.getcwd()
groups = json.load(open(os.path.join(BASE, 'karaoke_groups.json'), encoding='utf-8'))
beats_raw = json.load(open(os.path.join(BASE, 'beats.json'), encoding='utf-8'))
beats = beats_raw['beats'] if isinstance(beats_raw, dict) else beats_raw
TOTAL_DURATION = beats[-1]['end_ms'] / 1000

# Keywords that get amber highlight + floating badge in face beats (exact token match)
FACE_KW_BADGE = {
    'ผู้เชี่ยวชาญ': 'ผู้เชี่ยวชาญ 8 คน',
    '8': 'AI Expert ทั้ง 8',
    '24': '24 ชม. ทุกวัน',
    'ค่าใช้จ่าย': 'ต้นทุนต่ำมาก',
    'AI': 'AI Agent',
    'Agent': 'AI Agent Pro',
    'TopExpert': 'TopExpert™',
    'Pro': 'AI Agent Pro',
    'Scale': 'Scale ธุรกิจ',
}

js_groups = []
for g in groups:
    words_list = []
    for w in g['words']:
        is_kw = g['layout'] == 'face' and w['text'] in FACE_KW_BADGE
        words_list.append({
            'text': w['text'],
            'start': round(w['start_ms'] / 1000, 3),
            'end': round(w['end_ms'] / 1000, 3),
            'isKw': is_kw,
            'kwLabel': FACE_KW_BADGE.get(w['text'], '') if is_kw else '',
        })
    js_groups.append({
        'layout': g['layout'],
        'start': round(g['start_ms'] / 1000, 3),
        'end': round(g['end_ms'] / 1000, 3),
        'words': words_list,
    })

groups_json = json.dumps(js_groups, ensure_ascii=False)

html = """<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>captions-overlay</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 1080px; height: 1920px; overflow: hidden; background: transparent; }
    .clip { position: absolute; top: 0; left: 0; width: 1080px; height: 1920px; pointer-events: none; }

    /* Caption pill group */
    .cap-group {
      position: absolute;
      left: 0; right: 0; width: 100%;
      display: flex;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
    }
    .cap-group.layout-face { bottom: 320px; }
    .cap-group.layout-mid  { bottom: 800px; }

    .cap-pill {
      display: inline-flex;
      align-items: center;
      flex-wrap: nowrap;
      background: rgba(5,8,16,0.68);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 18px;
      padding: 16px 32px;
      max-width: 940px;
    }

    .cap-word {
      position: relative;
      display: inline-block;
      font-family: 'Inter', sans-serif;
      font-weight: 800;
      white-space: pre;
    }
    .cap-word-bg {
      position: absolute;
      inset: -6px -7px;
      background: #4fc3f7;
      border-radius: 10px;
      opacity: 0;
      transform: scale(0.85);
      transform-origin: 50% 50%;
      z-index: 0;
    }
    /* Keyword words → amber highlight instead of cyan */
    .cap-word.is-kw .cap-word-bg { background: #ffcb6b; }

    .cap-word-text {
      position: relative;
      z-index: 1;
      color: #faf9f5;
    }

    /* Keyword badge — floats above caption pill */
    .kw-badge {
      position: absolute;
      left: 0; right: 0;
      display: flex;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
    .kw-badge.layout-face { bottom: 500px; }

    .kw-badge-inner {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(255,203,107,0.14);
      border: 2px solid rgba(255,203,107,0.75);
      border-radius: 999px;
      padding: 12px 38px;
    }
    .kw-badge-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      background: #ffcb6b;
      flex-shrink: 0;
    }
    .kw-badge-text {
      font-family: 'Inter', sans-serif;
      font-weight: 900;
      font-size: 34px;
      color: #ffcb6b;
      letter-spacing: 0.03em;
    }
  </style>
</head>
<body>
<div id="root" data-composition-id="captions-overlay" data-start="0" data-duration="__TOTAL_DURATION__" data-width="1080" data-height="1920"
     style="position:relative;width:1080px;height:1920px;overflow:hidden;background:transparent;">

  <div id="badge-stage" style="position:absolute;top:0;left:0;width:1080px;height:1920px;pointer-events:none;"></div>
  <div id="cap-stage" class="clip"></div>

</div>

<script>
  var DURATION = __TOTAL_DURATION__;
  var GROUPS = __GROUPS_JSON__;

  var COLOR_INACTIVE = "#faf9f5";
  var COLOR_ACTIVE = "#050810";
  var BASE_FONT_SIZE = 46;
  var MIN_FONT_SIZE = 30;
  var MAX_PILL_WIDTH = 940;
  var PAD_X = 32;

  var measureCanvas = document.createElement("canvas");
  var measureCtx = measureCanvas.getContext("2d");
  function measureText(text, fontSize) {
    measureCtx.font = "800 " + fontSize + "px Inter, sans-serif";
    return measureCtx.measureText(text).width;
  }
  function fontSizeForGroup(words) {
    var text = words.map(function (w) { return w.text; }).join(" ");
    var size = BASE_FONT_SIZE;
    var maxTextWidth = MAX_PILL_WIDTH - PAD_X * 2;
    while (size > MIN_FONT_SIZE && measureText(text, size) > maxTextWidth) {
      size -= 2;
    }
    return size;
  }

  var stage = document.getElementById("cap-stage");
  var badgeStage = document.getElementById("badge-stage");
  window.__timelines = window.__timelines || {};
  var tl = gsap.timeline({ paused: true });

  GROUPS.forEach(function (group, gi) {
    var groupEl = document.createElement("div");
    groupEl.className = "cap-group layout-" + group.layout;
    groupEl.id = "cap-group-" + gi;

    var pillEl = document.createElement("div");
    pillEl.className = "cap-pill";

    var fontSize = fontSizeForGroup(group.words);

    group.words.forEach(function (word, wi) {
      var wordEl = document.createElement("span");
      wordEl.className = "cap-word" + (word.isKw ? " is-kw" : "");
      wordEl.id = "cap-word-" + gi + "-" + wi;
      wordEl.style.fontSize = fontSize + "px";

      var bgEl = document.createElement("span");
      bgEl.className = "cap-word-bg";
      bgEl.id = "cap-word-bg-" + gi + "-" + wi;

      var textEl = document.createElement("span");
      textEl.className = "cap-word-text";
      textEl.id = "cap-word-text-" + gi + "-" + wi;
      textEl.textContent = word.text + (wi < group.words.length - 1 ? " " : "");

      wordEl.appendChild(bgEl);
      wordEl.appendChild(textEl);
      pillEl.appendChild(wordEl);
    });

    groupEl.appendChild(pillEl);
    stage.appendChild(groupEl);

    var visibleStart = Math.max(0, group.start);
    var nextGroup = GROUPS[gi + 1];
    var isLast = gi === GROUPS.length - 1;
    var effectiveEnd = isLast ? DURATION : Math.min(nextGroup.start, group.end + 0.25);
    var visibleEnd = Math.max(visibleStart + 0.05, effectiveEnd);

    tl.set(groupEl, { visibility: "visible" }, visibleStart);
    tl.fromTo(groupEl, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: "power2.out" }, visibleStart);

    group.words.forEach(function (word, wi) {
      var bgEl = document.getElementById("cap-word-bg-" + gi + "-" + wi);
      var textEl = document.getElementById("cap-word-text-" + gi + "-" + wi);
      var wordEl = document.getElementById("cap-word-" + gi + "-" + wi);

      var wStart = Math.max(visibleStart, word.start);
      var wEnd = Math.max(wStart + 0.05, word.end);

      tl.set(textEl, { color: COLOR_INACTIVE }, visibleStart);
      tl.to(bgEl, { opacity: 1, scale: 1, duration: 0.1, ease: "power2.out" }, wStart);
      tl.to(textEl, { color: COLOR_ACTIVE, duration: 0.08, ease: "none" }, wStart);
      tl.to(wordEl, { scale: 1.04, duration: 0.1, ease: "power2.out" }, wStart);
      tl.to(wordEl, { scale: 1, duration: 0.12, ease: "power2.in" }, wStart + 0.1);
      tl.to(bgEl, { opacity: 0, scale: 0.85, duration: 0.1, ease: "power2.in" }, wEnd);
      tl.to(textEl, { color: COLOR_INACTIVE, duration: 0.12, ease: "none" }, wEnd);
    });

    tl.to(groupEl, { opacity: 0, duration: 0.1, ease: "power2.in" }, visibleEnd - 0.1);
    tl.set(groupEl, { opacity: 0, visibility: "hidden" }, visibleEnd);

    // Keyword badge: show floating badge above pill for first keyword in face groups
    if (group.layout === "face") {
      var kwWord = null;
      for (var wi = 0; wi < group.words.length; wi++) {
        if (group.words[wi].isKw && group.words[wi].kwLabel) {
          kwWord = group.words[wi];
          break;
        }
      }
      if (kwWord) {
        var badgeEl = document.createElement("div");
        badgeEl.className = "kw-badge layout-face";
        badgeEl.id = "kw-badge-" + gi;

        var innerEl = document.createElement("div");
        innerEl.className = "kw-badge-inner";

        var dotEl = document.createElement("div");
        dotEl.className = "kw-badge-dot";

        var labelEl = document.createElement("span");
        labelEl.className = "kw-badge-text";
        labelEl.textContent = kwWord.kwLabel;

        innerEl.appendChild(dotEl);
        innerEl.appendChild(labelEl);
        badgeEl.appendChild(innerEl);
        badgeStage.appendChild(badgeEl);

        var bStart = Math.max(visibleStart, kwWord.start);
        var bEnd = Math.max(bStart + 0.15, kwWord.end);

        tl.set(badgeEl, { visibility: "visible" }, bStart - 0.05);
        tl.fromTo(badgeEl,
          { opacity: 0, scale: 0.8, y: 12 },
          { opacity: 1, scale: 1, y: 0, duration: 0.22, ease: "back.out(1.8)" },
          bStart
        );
        tl.to(badgeEl, { opacity: 0, scale: 0.88, y: -8, duration: 0.18, ease: "power2.in" }, bEnd + 0.05);
        tl.set(badgeEl, { visibility: "hidden" }, bEnd + 0.28);
      }
    }
  });

  // self-lint: every group must be hidden right after its end
  GROUPS.forEach(function (group, gi) {
    var el = document.getElementById("cap-group-" + gi);
    if (!el) return;
    var nextGroup = GROUPS[gi + 1];
    var isLast = gi === GROUPS.length - 1;
    var effectiveEnd = isLast ? DURATION : Math.min(nextGroup.start, group.end + 0.25);
    tl.seek(effectiveEnd + 0.01);
    var computed = window.getComputedStyle(el);
    if (computed.opacity !== "0" && computed.visibility !== "hidden") {
      console.warn("[caption-lint] group " + gi + " still visible at t=" + (effectiveEnd + 0.01).toFixed(2) + "s");
    }
  });
  tl.seek(0);

  window.__timelines["captions-overlay"] = tl;
</script>
</body>
</html>
"""

html = html.replace("__TOTAL_DURATION__", str(TOTAL_DURATION))
html = html.replace("__GROUPS_JSON__", groups_json)

out_dir = os.path.join(BASE, 'captions-overlay')
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, 'index.html')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"Written {out_path}")
