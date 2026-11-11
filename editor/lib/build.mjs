#!/usr/bin/env node
import {primarySpeechWindows} from './primary-speech.js';
import {normalizePersonSourceAdjustments,resolvePersonSourceAdjustment} from './person-source-adjustments.js';
import {normalizePersonSelections,applyPersonSelection} from './person-selection.js';
import {normalizePersonMaskEdits,applyPersonMaskEdits} from './person-mask-edits.js';
import {readFaceTracks} from '../../src/services/face-tracks.mjs';
import {endCardHtml} from './end-card.js';
import {sourceAudioParts} from './source-audio.js';
import {normalizeSourceZoom} from './source-zoom.js';
import {sourceColorEffects} from './source-color.js';
import {sourceTransformStyle} from './source-transform.js';
import {croppedMediaStyle} from './source-crop.js';
import {musicDuckParts,smoothMusicDuckParts} from './music-duck.js';
import {musicLoopParts,repeatMusicOptions,crossfadeMusicMixParts} from './music-loop.js';
import {brollEntranceDuration} from './broll-transition.js';
import {readSfxWav,paddedSfxWav} from './sfx-wav.mjs';
import {sourceAudioPresence} from './source-audio-presence.mjs';
import {kitMusicFile,kitSfxLibrary} from './kit-music.mjs';
// project.json → index.html (HyperFrames composition).
// index.html luôn được sinh lại từ project.json — không sửa tay index.html.
//
//   node editor/lib/build.mjs <projectDir>

import fs from "node:fs";
import crypto from 'node:crypto';
import {resolveContained} from '../../src/services/storage.mjs';
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { makeTimemap, mergeContiguous, round3 } from "./timemap.js";
import { brandOf, brandVars, fontLinks, colorOf, CAPTION_DEFAULT, FONTS, LOCAL_FONT_FACES, textAppearanceStyle, textTypographyStyle } from "./brand.js";
import { chipTimes } from "./runtime-times.js";
import { voiceReady, voiceFile } from "./voice-clean.mjs";
import {audioClipTiming} from './audio-clips.js';
import {normalizeWatermark,watermarkStyle} from './watermark.js';
import { packRows } from "./timeline-ops.js";
import { textStyleOf, cleanTextAnim, textAnimTiming } from "./text-effects.js";

const LIB = path.dirname(fileURLToPath(import.meta.url));
const KIT = path.resolve(LIB, "..");

export const W = 1080;
export const H = 1920;
// Khung video: "9:16" dọc 1080×1920 (mặc định) · "16:9" ngang 1920×1080 — project.format
export const frameOf = (p) => (p?.format === "16:9" ? { wide: true, W: 1920, H: 1080 } : { wide: false, W, H });
const FADE = 0.02; // fade 20ms ở mỗi điểm cắt để không nghe tiếng "tách"

export const DEFAULTS = {
  camera: { scale: 1, x: 0, y: 0, faceY: 0.36 },
  textY: 1180,
  audio: { voice: 1, music: "", musicVolume: 0.1, sfx: [], sfxVolume: 0.5, autoSfx: true },
};

// Tiếng hiệu ứng = bản thu CC0 (Kenney, OpenGameArt) trong editor/assets/sfx — nguồn từng tiếng: assets/sfx/LICENSE-kenney.txt
export const SFX_KINDS = ["pop", "tap", "click", "whoosh", "paper", "keys", "chime", "tick", "swish", "riser", "boom", "shimmer", "blip", "glitch", "downlift", "ping", "sparkle",
  "glass-pop", "silk-swish", "soft-whoosh", "crystal-ting", "lux-chime", "airy-sparkle", "deep-hit", "reveal-swell",
  "mau-tick", "mau-tick-2", "mau-ding", "mau-knock", "mau-hit", "mau-swell",
  "whoosh-2", "swish-2", "card-slide", "page-flip", "book-close", "coin", "dice", "bell", "thud", "metal", "wood", "glass-hit", "knife",
  "error", "confirm", "question", "toggle", "switch", "scroll", "open", "close", "drop", "select", "bong", "level-up", "power-up", "zap", "laser",
  "explosion", "impact-boom",
  "shutter", "page-turn", "bubble", "pop-2", "pop-soft", "plop", "magic", "magic-2", "magic-3", "gem", "coins", "spell", "bell-ding", "ding-deep",
  "chimes", "kalimba", "soft-bell", "gong", "negative", "mystery", "spring", "slam", "glass-break", "blade", "keystroke", "typing",
  // CC0 thêm 27/10 (thay các loại tiếng Mixkit trong repo video-shotcraft)
  "zoom-in", "zoom-out", "shutter-2", "beep", "countdown", "clock-spin", "applause", "heartbeat", "scan", "compute", "glitch-2", "static", "power-down", "data-blip", "vinyl", "rewind", "water-drop", "splash", "bubble-2", "glass-clink", "metal-hit", "stomp", "rock-hit", "lock", "unlock", "latch", "machine", "door-scifi", "chain", "crumple", "scissors", "snip", "paper-slide", "staple", "typewriter", "typewriter-2", "pencil", "chalk", "erase", "hum", "force-field", "laser-2", "rollover", "maximize", "minimize", "back",
  // kho "hay dùng" nhập từ NAS (nas-*), danh sách ở assets/sfx/library.json
  ...Object.keys(kitSfxLibrary(KIT))];
// Độ dài thật của file SFX (đọc header WAV) để cấp đủ thời lượng cho tiếng có vang dài
const wavLen = new Map();
function sfxLen(kind) {
  if (!wavLen.has(kind)) {
    let d = 1.2;
    try { d = readSfxWav(fs.readFileSync(path.join(KIT, "assets", "sfx", `${kind}.wav`))).duration; } catch {}
    wavLen.set(kind, Math.round(d * 1000) / 1000);
  }
  return wavLen.get(kind);
}

const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const nfc = (s) => String(s ?? "").normalize("NFC");
const seg = new Intl.Segmenter("vi", { granularity: "grapheme" });
const graphemes = (s) => Array.from(seg.segment(s), (g) => g.segment);

// "AI *edit* video | lần đầu" → các dòng, mỗi dòng là danh sách từ {t, em}
// Nội dung do mẫu / AI viết: bỏ script, thuộc tính on*, javascript: — chỉ còn HTML + CSS tĩnh
function cleanHtml(h) {
  return String(h || "")
    .replace(/<\s*(script|iframe|object|embed|link|meta|base)\b[\s\S]*?(<\s*\/\s*\1\s*>|$)/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src|xlink:href)\s*=\s*(["']?)\s*javascript:[^"'>\s]*\2/gi, "");
}
function cleanCss(c) {
  return String(c || "").replace(/<\/?\s*style/gi, "").replace(/@import[^;]*;?/gi, "").replace(/expression\s*\(|javascript:/gi, "");
}
// Chuyển động khai báo: [{ sel, from, to, at | cue, dur, ease, stagger, set }] — chỉ số / chuỗi ngắn, không chạy JS
const pair = (v) => (Array.isArray(v) && v.length === 2 ? v.map(Number) : null);
const color = (c) => (/^[#\w(),.% -]{1,40}$/.test(String(c ?? "")) ? String(c) : "");
function cleanTextStyle(t) {
  if (!t || typeof t !== "object") return null;
  const n = (v, d = 0) => Number(v) || d;
  return {
    strokes: (Array.isArray(t.strokes) ? t.strokes : []).slice(0, 4).map((x) => [Math.max(0, n(x?.[0], 1)), color(x?.[1]) || "#000"]),
    inner: t.inner ? { x: n(t.inner.x), y: n(t.inner.y), blur: n(t.inner.blur, 4), color: color(t.inner.color) || "#000" } : null,
    bevel: t.bevel ? { size: n(t.bevel.size, 3), depth: n(t.bevel.depth, 5), light: n(t.bevel.light, 0.8), angle: t.bevel.angle == null ? null : n(t.bevel.angle) } : null,
  };
}
function cleanAnim(a) {
  if (!Array.isArray(a)) return [];
  // thuộc tính GSAP (chữ cái) hoặc biến CSS (--ten); giá trị số, chuỗi an toàn, đúng/sai (yoyo)
  const val = (o) => Object.fromEntries(Object.entries(o || {}).filter(([k, v]) => /^([a-zA-Z]+|--[a-z][a-z0-9-]*)$/.test(k) &&
    (typeof v === "number" || typeof v === "boolean" || (typeof v === "string" && v.length < 200 && !/javascript:|url\s*\(|expression\s*\(/i.test(v)))));
  return a.slice(0, 120).map((s) => ({ sel: String(s.sel || "").slice(0, 120), from: s.from ? val(s.from) : null, to: val(s.to),
    at: Number(s.at) || 0, cue: s.cue == null ? null : Number(s.cue), dur: s.dur == null ? 0.4 : Number(s.dur), end: !!s.end, span: !!s.span, stop: Number(s.stop) || 0,
    ease: /^[\w.()]+$/.test(s.ease || "") ? s.ease : "power2.out", stagger: Number(s.stagger) || 0, set: !!s.set,
    loop: !!s.loop, // lặp liên tục tới hết khối (nền chuyển động) — mỗi vòng dài dur giây
    // đếm số: { sel, count: [0, 1284], dec: 0, sep: "," } — chữ trong phần tử chạy từ số đầu tới số cuối
    hblur: Array.isArray(s.hblur) && s.hblur.length === 2 ? s.hblur.map(Number) : null,
    bend: Array.isArray(s.bend) && s.bend.length === 2 ? s.bend.map(Number) : null,
    warp: Array.isArray(s.warp) && s.warp.length === 2 ? s.warp.map(Number) : null,
    // tách chữ + thứ tự trễ
    split: ["chars", "words", "lines"].includes(s.split) ? s.split : "",
    order: ["start", "end", "center", "edges", "random"].includes(s.order) ? s.order : "",
    // nhoè một hướng: dblur [đầu, cuối] px + angle độ · nhoè theo tốc độ: mblur màn trập 0–1
    dblur: pair(s.dblur), angle: Number(s.angle) || 0, mblur: Math.min(1, Math.max(0, Number(s.mblur) || 0)),
    // rung nét, nhúc nhích, lệch ngẫu nhiên
    boil: Number(s.boil) || 0, freq: Number(s.freq) || 0, rate: Number(s.rate) || 0, hold: !!s.hold,
    wiggle: Array.isArray(s.wiggle) ? s.wiggle.slice(0, 2).map(Number) : null,
    scatter: s.scatter && typeof s.scatter === "object" ? { x: Number(s.scatter.x) || 0, y: Number(s.scatter.y) || 0, rot: Number(s.scatter.rot) || 0, scale: Number(s.scatter.scale) || 0 } : null,
    // vẽ nét, chữ theo đường, tia hạt, kiểu chữ nhiều lớp
    draw: pair(s.draw), len: Number(s.len) || 0, pathOffset: pair(s.pathOffset),
    burst: s.burst && typeof s.burst === "object" ? { n: Number(s.burst.n) || 12, dist: Number(s.burst.dist) || 160, size: Number(s.burst.size) || 10, color: color(s.burst.color) } : null,
    textStyle: cleanTextStyle(s.textStyle),
    count: Array.isArray(s.count) && s.count.length === 2 ? s.count.map(Number) : null, dec: Math.min(3, Math.max(0, Number(s.dec) || 0)),
    sep: typeof s.sep === "string" ? s.sep.slice(0, 2) : "" }));
}

export function parseTitle(raw) {
  let em = false;
  return nfc(raw)
    .split(/\s*\|\s*|\n/)
    .filter((l) => l.trim())
    .map((line) =>
      line
        .trim()
        .split(/\s+/)
        .map((tok) => {
          let t = tok;
          const open = t.startsWith("*");
          if (open) { em = true; t = t.slice(1); }
          const close = t.endsWith("*");
          if (close) t = t.slice(0, -1);
          const w = { t, em };
          if (close) em = false;
          return w;
        })
        .filter((w) => w.t),
    );
}

function titleHtml(raw, fx) {
  const lines = parseTitle(raw);
  return lines
    .map((words) =>
      words
        .map((w) => {
          const inner =
            fx === "type"
              ? graphemes(w.t).map((c) => `<span class="ch gold">${esc(c)}</span>`).join("")
              : `<span class="w gold">${esc(w.t)}</span>`;
          return w.em ? `<span class="em"><span class="em-bar"></span>${inner}</span>` : inner;
        })
        .join(fx === "type" ? `<span class="ch"> </span>` : " "),
    )
    .join("<br>");
}

// Phân track: các clip cùng nhóm chồng thời gian thì đẩy sang track khác.
// Hàng người dùng kéo tới trên timeline (`row`, kiểu track CapCut) được giữ; layerRow cho z-index trong nhóm.
function allocTracks(items, base) {
  const { rowOf, count } = packRows(items.map((it, i) => ({ id: i, start: it.start, end: it.start + it.dur, row: it.row })));
  items.forEach((it, i) => { it.layerRow = rowOf.get(i); it.track = base + it.layerRow; });
  return base + count;
}

// Vị trí/tỷ lệ chỉnh tay trên khung xem trước (CSS translate/scale — không đụng transform của GSAP).
// Cảnh trám chia màn hình nằm sát nhau (cách ≤ 1s) gộp thành 1 khoảng cho chuyển động người nói:
// mỗi khoảng kéo người xuống rồi trả lên (~0,45s mỗi chiều), tách riêng thì người bị giật lên xuống giữa hai cảnh trám
const SPLIT_JOIN_GAP = 1;
export function mergeSplitSpans(brolls, gap = SPLIT_JOIN_GAP) {
  const out = [];
  for (const b of brolls.filter((x) => x.mode === "split").sort((a, c) => a.start - c.start)) {
    const last = out[out.length - 1];
    if (last && b.start - (last.start + last.dur) <= gap) out[out.length - 1] = { start: last.start, dur: round3(Math.max(last.start + last.dur, b.start + b.dur) - last.start) };
    else out.push({ start: b.start, dur: b.dur });
  }
  return out;
}

export const xform = (l) => `translate:${Number(l?.x) || 0}px ${Number(l?.y) || 0}px;scale:${Number(l?.s ?? l?.scale) || 1}`;

// Cảnh đè trong suốt lên video (không chuyển sang nền đen)
export const OVERLAY = new Set(["chips"]);

function sceneInner(sc, final = false) {
  const d = sc.data || {};
  const head =
    (d.kicker ? `<div class="sc-kicker">${esc(nfc(d.kicker))}</div>` : "") +
    (d.title ? `<div class="sc-title gold">${esc(nfc(d.title))}</div>` : "");
  let body = "";
  switch (sc.type) {
    case "process": {
      const steps = (d.steps || []).map((s, i) =>
        (i ? `<div class="link"></div>` : "") +
        `<div class="step card"><div class="num">${i + 1}</div><div class="txt">${esc(nfc(s))}</div></div>`);
      body = `<div class="steps">${steps.join("")}</div>`;
      break;
    }
    case "stat": {
      const max = Number(d.max) || 0;
      body =
        `<div class="stat-val gold"><span class="pre">${esc(d.prefix || "")}</span><span class="num" data-to="${Number(d.value) || 0}" data-dec="${Number(d.decimals) || 0}">${final ? (Number(d.value) || 0).toLocaleString("vi-VN", { minimumFractionDigits: Number(d.decimals) || 0, maximumFractionDigits: Number(d.decimals) || 0 }) : 0}</span><span class="suf">${esc(d.suffix || "")}</span></div>` +
        (max ? `<div class="bar-track"><div class="bar-fill" data-ratio="${Math.min(1, (Number(d.value) || 0) / max)}"${final ? ` style="transform:scaleX(${Math.min(1, (Number(d.value) || 0) / max)})"` : ""}></div></div>` : "") +
        (d.label ? `<div class="stat-label">${esc(nfc(d.label))}</div>` : "");
      break;
    }
    case "compare": {
      const list = (pts) => (pts || []).map((p) => `<li>${esc(nfc(p))}</li>`).join("");
      body =
        `<div class="cmp"><div class="card before"><h4>${esc(nfc(d.beforeLabel || "Trước"))}</h4><ul>${list(d.before)}</ul></div>` +
        `<div class="arrow">↓</div>` +
        `<div class="card after on"><h4>${esc(nfc(d.afterLabel || "Sau"))}</h4><ul>${list(d.after)}</ul></div></div>`;
      break;
    }
    case "timeline": {
      const items = (d.items || []).map((it) =>
        `<div class="tl-item"><div class="tl-dot"></div><div class="tl-time gold">${esc(nfc(it.time))}</div><div class="tl-label">${esc(nfc(it.label))}</div></div>`);
      body = `<div class="tl"><div class="tl-line"></div><div class="tl-prog"></div>${items.join("")}</div>`;
      break;
    }
    case "doc": {
      const hl = new Set([].concat(d.highlight ?? []).map(Number));
      const lines = (d.lines || []).map((l, i) =>
        `<div class="ln${hl.has(i) ? " hl" : ""}">${hl.has(i) ? `<span class="mk"></span>` : ""}${esc(nfc(l))}</div>`);
      body =
        `<div class="doc card">${d.docTitle ? `<h3>${esc(nfc(d.docTitle))}</h3>` : ""}${lines.join("")}</div>` +
        (d.result ? `<div class="result">✓ ${esc(nfc(d.result))}</div>` : "");
      break;
    }
    case "chips": {
      const icon = d.icon === "check" ? "✓" : d.icon === "dot" ? "•" : "⌕";
      body = `<div class="chips">${(d.items || []).map((x) => `<div class="chip"><span class="ci">${icon}</span><span>${esc(nfc(x))}</span></div>`).join("")}</div>` +
        `<div class="chip-cursor"></div>`;
      break;
    }
    default:
      body = d.body ? `<div class="stat-label">${esc(nfc(d.body))}</div>` : "";
  }
  if (OVERLAY.has(sc.type)) return `<div class="sc-wrap">` + (head ? `<div class="sc-head" style="${xform(sc.layout?.head)}">${head}</div>` : "") +
    `<div class="sc-body" style="${xform(sc.layout?.body)}">${body}</div></div>`;
  return `<div class="grid"></div><div class="glow"></div><div class="sc-wrap">` +
    (head ? `<div class="sc-head" style="${xform(sc.layout?.head)}">${head}</div>` : "") +
    `<div class="sc-body" style="${xform(sc.layout?.body)}">${body}</div></div>`;
}

function projectBrand(p){return {...brandOf(p),extraFontNames:(p.texts||[]).flatMap(t=>[t.fontTitle,t.fontSub,t.fontLabel]).filter(f=>FONTS[f])};}
function textBox(t, final = false, defaults = {}) {
  const anim = cleanTextAnim(t.anim), style = textStyleOf(t);
  // anim.in thay hiệu ứng vào của fx; "type" cần tách từng ký tự như fx "type"
  const fx = anim?.in ? (anim.in.type === "type" ? "type" : "words") : t.fx || "words";
  const font=(key)=>textTypographyStyle(t,key,defaults);
  const paint=(key)=>textAppearanceStyle(t[key]);
  const y = Number(t.y ?? DEFAULTS.textY), x = Number(t.x || 0), sc = Number(t.scale || 1), fs = Number(t.size || 118);
  const animAttr = anim ? ` data-anim="${esc(["in", "out", "loop"].map((g) => anim[g]?.type || "-").join(" "))}"` : "";
  return (
    `<div class="tx-box${style ? " tx-st-" + style : ""}"${animAttr} style="top:${y}px;translate:${x}px -50%;scale:${sc}">` +
    `<div class="tx-shade"></div>` +
    (t.label ? `<div class="tx-label ${paint("labelAppearance")?"tx-painted":""}" style="${font("fontLabel")}${paint("labelAppearance")}">${esc(nfc(t.label))}</div>` : "") +
    (t.title ? `<div class="tx-title ${paint("appearance")?"tx-painted":""}" style="--fs:${fs}px;${font("fontTitle")}${paint("appearance")}">${titleHtml(t.title, fx)}${fx === "type" && !anim?.in && !final ? '<span class="caret"></span>' : ""}</div>` : "") +
    (t.sub ? `<div class="tx-sub ${paint("subAppearance")?"tx-painted":""}" style="${font("fontSub")}${paint("subAppearance")}">${esc(nfc(t.sub))}</div>` : "") +
    `</div>`
  );
}

// Ảnh thẻ trong editor: dựng 1 mục ở trạng thái cuối bằng đúng markup + CSS của video,
// để thẻ luôn giống hệt cảnh xuất ra.
// Bản tách phần cho editor (Shadow DOM trong thẻ): {style, body, fonts}.
export function previewParts(project, kind, id, bgUrl) {
  const html = previewHtml(project, kind, id, bgUrl);
  if (!html) return null;
  const brand = projectBrand(normalizeProject(structuredClone(project)));
  const css = fs.readFileSync(path.join(LIB, "kit.css"), "utf8");
  return {
    style: brandVars(brand).replace(":root", ":host") + css,
    body: html.slice(html.indexOf('<div id="root">'), html.lastIndexOf("</body>")),
    fonts: [...fontLinks(brand).matchAll(/href="([^"]+)"/g)].map((m) => m[1]),
  };
}

// Thành phần có sẵn của mẫu (template.json → presets): ảnh xem trước dựng bằng đúng CSS của mẫu, mọi chữ hiện đủ.
// preset: { id, group: "chu" | "dohoa", name, desc, dur, bg: "board" | "face", html, css, anim, fields }
export function presetParts(project, presets, faceUrl) {
  const p = normalizeProject(structuredClone(project));
  const brand = projectBrand(p);
  const kit = fs.readFileSync(path.join(LIB, "kit.css"), "utf8");
  // mẫu khung ngang 16:9: thẻ xem trước vẽ trong khung 1920×1080 (#root.wide nhận các luật .wide của kit.css)
  const { wide, W, H } = frameOf(p), ROOT = `<div id="root"${wide ? ' class="wide"' : ""}>`;
  return {
    style: brandVars(brand).replace(":root", ":host") + kit + cleanCss(brand.css) + "\n.w{opacity:1!important}" + (wide ? `\n:host{--W:${W}px;--H:${H}px}` : ""),
    fonts: [...fontLinks(brand).matchAll(/href="([^"]+)"/g)].map((m) => m[1]),
    frame: { W, H },
    items: (presets || []).map((pr) => {
      const bg = pr.bg === "face" && faceUrl
        ? `<img src="${esc(faceUrl)}" style="position:absolute;inset:0;width:${W}px;height:${H}px;object-fit:cover">`
        : `<div style="position:absolute;inset:0;background:${esc(brand.board || "#1A1A1A")}"></div>`;
      if (pr.kind === "brolls") return { ...pr, body: "" };
      if (pr.kind === "texts") return { ...pr, body: `${ROOT}${bg}<div class="tx">${textBox({ id: pr.id, ...(pr.text || {}) }, true, brand)}</div></div>` };
      const css = cleanCss(pr.css).replace(/:scope(?![a-zA-Z0-9_-])/g, ".blk");
      return { ...pr, body: `${ROOT}${bg}<div class="blk">${css ? `<style>${css}</style>` : ""}<div class="blk-in">${cleanHtml(pr.preview || pr.html)}</div></div></div>` }; // preview: trạng thái riêng cho ảnh xem trước (chuyển cảnh giữa chừng, nét vẽ đã vẽ…)
    }),
  };
}

export function previewHtml(project, kind, id, bgUrl) {
  const p = normalizeProject(structuredClone(project));
  const brand = projectBrand(p);
  let inner = "";
  if (kind === "scenes") {
    const sc = p.scenes.find((x) => x.id === id);
    if (!sc) return null;
    inner = `<div class="scene sc-${esc(sc.type)}">${sceneInner(sc, true)}</div>`;
  } else if (kind === "texts") {
    const t = p.texts.find((x) => x.id === id);
    if (!t) return null;
    inner = (bgUrl ? `<img src="${esc(bgUrl)}" style="position:absolute;inset:0;width:1080px;height:1920px;object-fit:cover">` : "") +
      `<div class="tx">${textBox(t, true, brand)}</div>`;
  } else return null;
  const css = fs.readFileSync(path.join(LIB, "kit.css"), "utf8");
  return `<!doctype html><html lang="vi"><head><meta charset="UTF-8">${fontLinks(brand)}<style>${brandVars(brand)}${css}${cleanCss(brand.css)}
html,body{background:#000}</style></head><body><div id="root">${inner}</div></body></html>`;
}

export function normalizeProject(p) {
  p.camera = { ...DEFAULTS.camera, ...(p.camera || {}) };
  p.audio = { ...DEFAULTS.audio, ...(p.audio || {}) };
  for (const k of ["segments", "texts", "zooms", "scenes", "brolls", "blocks", "vfx"]) p[k] = p[k] || [];
  p.captions = { ...CAPTION_DEFAULT, ...(p.captions || {}) };
  p.transitions = { cut: "none", ...(p.transitions || {}) };
  // Cờ track kiểu CapCut (ẩn / tắt tiếng cả track): áp lên bản sao lúc dựng, giữ nguyên cờ riêng của từng mục.
  const tr = p.tracks || {};
  for (const k of ["texts", "zooms", "scenes", "brolls", "blocks"]) if (tr[k]?.hidden) p[k] = p[k].map((x) => ({ ...x, hidden: true }));
  if (tr.texts?.hidden) p.blocks = p.blocks.map((b) => (b.group === "chu" ? { ...b, hidden: true } : b));
  if (tr.captions?.hidden) p.captions.enabled = false;
  if (tr.voice?.muted) p.audio.voice = 0;
  if (tr.music?.muted) p.audio.musicVolume = 0;
  if (tr.sfx?.muted) p.audio.sfxVolume = 0;
  if (tr["audio-clips"]?.muted) p.audio.clips = (p.audio.clips || []).map((c) => ({ ...c, hidden: true }));
  return p;
}

// Trả về dữ liệu đã quy đổi sang giờ output — dùng cho build và cho editor.
export function resolveTimeline(project) {
  const p = normalizeProject(structuredClone(project));
  const tm = makeTimemap(p);
  tm.segs = mergeContiguous(tm.segs, p); // đoạn nối liền → phát 1 lượt
  const clampDur = (start, dur) => Math.max(0.2, Math.min(dur, tm.contentTotal - start));
  const mk = (it, extra = {}) => {
    const start = round3(tm.srcToOut(it.at || 0));
    return { ...it, start, dur: round3(clampDur(start, Number(it.dur) || 2)), ...extra };
  };
  const texts = p.texts.filter((t) => !t.hidden).map((t) => mk(t));
  const zooms = p.zooms.filter((z) => !z.hidden).map((z) => mk(z));
  const scenes = p.scenes.filter((s) => !s.hidden).map((s) =>
    mk(s, { cues: (s.cues || []).map((c) => round3(Math.max(0, tm.srcToOut(c) - tm.srcToOut(s.at || 0)))) }));
  const brolls = p.brolls.filter((b) => !b.hidden).map((b) => mk(b));
  const blocks = p.blocks.filter((b) => !b.hidden).map((b) => mk(b, { cues: (b.cues || []).map((c) => round3(Math.max(0, tm.srcToOut(c) - tm.srcToOut(b.at || 0)))) }));
  const vfx = p.vfx.filter((v) => !v.hidden && ["shake", "rgb", "grain", "warp", "freeze", "lia", "pixel"].includes(v.type)).map((v) => mk(v, { amount: Math.max(0, Math.min(1, Number(v.amount ?? 0.5))) }));
  const caps = [];
  if (p.captions.enabled) {
    for (const line of p.captions.lines || []) {
      const words = (line.words || []).filter((w) => tm.isKept((w.s + w.e) / 2));
      if (!words.length) continue;
      const start = round3(tm.srcToOut(words[0].s));
      caps.push({
        id: line.id, start, y: line.y, x: line.x, slot: line.slot, single: !!line.single, clear: !!line.clear, behind: line.behind ?? p.captions.behind,
        end: round3(tm.srcToOut(words[words.length - 1].e) + 0.15),
        words: words.map((w) => ({ w: w.w, fx: w.fx, sz: w.sz, c: w.c, c2: w.c2, br: w.br, dx: w.dx, s: round3(tm.srcToOut(w.s) - start), e: round3(tm.srcToOut(w.e) - start) })),
      });
    }
    caps.sort((a, b) => a.start - b.start);
    const hold = p.captions.hold && brandOf(p).caption.style === "stack";
    if (hold) {
      const ky = frameOf(p).H / 1920, baseY = Number(p.captions.y) || 760 * ky, gap = Number(p.captions.slotGap) || 560 * ky;
      const segOf = (t) => tm.segs.find((s) => t >= s.outStart - 1e-6 && t < s.outEnd - 1e-6) || tm.segs[tm.segs.length - 1];
      let lastSeg = null, k = 0;
      for (const c of caps) {
        const sg = segOf(c.start);
        if (sg !== lastSeg) { lastSeg = sg; k = 0; }
        c.seg = sg;
        if (c.single) { c.slot = 2; if (c.y == null) c.y = baseY + gap / 2; continue; }
        // tầng 0 neo mép dưới tại y, tầng 1 neo mép trên tại y + gap
        if (c.slot == null) c.slot = c.y != null ? (c.y > baseY + gap / 2 ? 1 : 0) : k % 2;
        if (c.y == null) c.y = baseY + c.slot * gap;
        k++;
      }
      caps.forEach((c, i) => {
        const next = caps.slice(i + 1).find((o) => o.seg === c.seg && o.slot === c.slot);
        c.first = !caps.slice(0, i).some((o) => o.seg === c.seg);
        c.atCut = !next;
        c.end = round3(next ? next.start : c.seg.outEnd);
        // khối "xoá màn hình" (clear): các khối trước trong cảnh rút đi khi nó bắt đầu
        const wipe = caps.slice(i + 1).find((o) => o.seg === c.seg && o.clear);
        if (wipe && wipe.start < c.end) { c.end = wipe.start; c.atCut = false; }
        if (c.single) c.end = Math.min(c.end, round3(c.start + c.words[c.words.length - 1].e + 0.35));
        // khối tầng dưới nhường chỗ cho cảnh thẻ đè lên video
        const ov = c.slot === 1 && scenes.find((s) => OVERLAY.has(s.type) && s.start > c.start && s.start < c.end);
        if (ov) c.end = ov.start;
      });
    } else {
      caps.forEach((c, i) => {
        const next = caps[i + 1];
        if (next && c.end > next.start) c.end = next.start;
      });
    }
    caps.forEach((c) => { if (c.seg) { c.segStart = round3(c.seg.outStart); c.segIdx = tm.segs.indexOf(c.seg); } delete c.seg; c.dur = round3(Math.max(0.2, c.end - c.start)); });
  }
  return { p, tm, texts, zooms, scenes, brolls, blocks, caps, vfx };
}

function sfxEvents(r) {
  const { p, tm, texts, scenes, brolls } = r;
  const ev = [];
  // Mức âm tự động (audio.sfxLevel): "tat" · "vua" (chữ, khối, cảnh trám, cảnh minh hoạ, chuyển cảnh)
  // · "nhieu" (mặc định — thêm zoom, ra cảnh trám, từ khoá phụ đề). Mẫu cũ autoSfx:false vẫn theo mức mặc định.
  const level = ["tat", "vua", "nhieu"].includes(p.audio.sfxLevel) ? p.audio.sfxLevel : "nhieu";
  const auto = level !== "tat", rich = level === "nhieu";
  // Mỗi mục: sfx = "" (tự động) | tên âm thanh (luôn phát, kể cả khi tắt tự động) | "none"; sfxVol = âm lượng riêng (mặc định 1)
  const push = (it, start, autoKind, vol = 1) => {
    if (it.sfx === "none") return;
    const kind = it.sfx || (auto ? autoKind : null);
    if (kind) ev.push({ start: Math.max(0, start), kind, vol: (it.sfx ? 1 : vol) * (it.sfxVol ?? 1), own: !!it.sfx });
  };
  for (const t of texts) push(t, t.start, (cleanTextAnim(t.anim)?.in?.type || t.fx) === "type" ? "keys" : "pop");
  for (const s of scenes) {
    push(s, s.start - 0.15, "whoosh");
    if (!auto || s.sfx) continue; // âm phụ theo kiểu cảnh chỉ khi để tự động
    if (s.type === "doc") ev.push({ start: s.start + 0.2, kind: "paper", vol: s.sfxVol ?? 1 });
    if (s.type === "stat" || (s.type === "doc" && s.data?.result)) ev.push({ start: s.start + s.dur * 0.62, kind: "chime", vol: s.sfxVol ?? 1 });
  }
  for (const b of brolls) {
    push(b, b.start - 0.15, "whoosh");
    if (rich && !b.sfx && b.dur > 1.2) ev.push({ start: b.start + b.dur - 0.2, kind: "soft-whoosh", vol: 0.5 * (b.sfxVol ?? 1) }); // ra cảnh trám
  }
  // zoom: cắt nhảy khung → swish · bảng / khung giữa → whoosh · zoom mượt → whoosh nhẹ (chỉ mức Nhiều)
  for (const z of r.zooms || []) push(z, z.start, !rich ? null : z.mode === "cut" ? "swish" : z.mode === "board" || z.mode === "frame" ? "whoosh" : "soft-whoosh", 0.6);
  // chuyển cảnh giữa các đoạn (có hiệu ứng chuyển) → whoosh nhẹ; cutSfx bật thì dùng bộ riser + boom bên dưới
  if (auto && !p.audio.cutSfx) for (const sg of tm.segs.slice(1)) {
    const type = p.segments.find((x) => x.id === sg.id)?.tIn || p.transitions?.cut;
    if (type && type !== "none") ev.push({ start: sg.outStart - 0.12, kind: "soft-whoosh", vol: 0.6 });
  }
  // từ khoá có hiệu ứng trong phụ đề (khi chưa bật tiếng theo từ)
  if (rich && !p.audio.wordSfx) for (const c of r.caps || []) for (const w of c.words) {
    if (!w.fx) continue;
    const kind = w.fx === "glow" ? "sparkle" : w.fx === "glitch" ? "glitch-2" : w.fx === "flash" ? "impact-boom" : "tick";
    ev.push({ start: c.start + w.s, kind, vol: kind === "tick" ? 0.35 : 0.45 });
  }
  for (const b of r.blocks || []) {
    push(b, b.start, b.fx === "none" && !rich ? null : "pop"); // khối đồ hoạ: pop khi bật ra
    // mức Nhiều: chữ phụ / thành phần trong khối hiện sau (anim từ mờ → rõ, trễ ≥ 0,2s) → pop nhẹ
    if (rich && b.sfx !== "none" && !b.wordSfx) {
      const steps = [...new Set((b.anim || []).filter((a) => !/\.w:nth-child/.test(a.sel || "") && (a.from?.opacity === 0 || a.to?.opacity === 1) && a.to?.opacity !== 0)
        .map((a) => (a.cue != null ? b.cues?.[a.cue] : Number(a.at)) || 0).filter((t) => t >= 0.2 && t < b.dur - 0.1).map((t) => round3(t)))];
      for (const t of steps) ev.push({ start: b.start + t, kind: "pop-soft", vol: 0.45 * (b.sfxVol ?? 1) });
    }
    // wordSfx: tiếng nhỏ mỗi khi 1 chữ (.w) trong khối sáng lên — kiểu chuỗi "tích" của video mẫu Bảng cam explainer
    if (b.wordSfx && b.wordSfx !== "none") for (const a of b.anim || []) {
      if (!/\.w:nth-child/.test(a.sel || "") || a.to?.opacity !== 1) continue;
      ev.push({ start: b.start + (a.cue != null ? b.cues[a.cue] || 0 : Number(a.at) || 0), kind: b.wordSfx, vol: b.wordSfxVol ?? 0.5, word: true });
    }
  }
  if (p.audio.wordSfx) {
    // Video mẫu không gõ tiếng theo từng từ: chỉ "ping" ở khối đầu cảnh, gió nhẹ ở khối sau, và tiếng riêng cho từ khoá có hiệu ứng
    for (const c of r.caps) c.words.forEach((w, i) => {
      const t = c.start + w.s;
      if (i === 0) ev.push(c.first ? { start: t, kind: "ping", vol: 0.45 } : { start: t, kind: "swish", vol: 0.3 });
      if (w.fx === "glow") ev.push({ start: t, kind: "sparkle", vol: 0.45 });
      if (w.fx === "glitch") ev.push({ start: t, kind: "glitch", vol: 0.6 });
      if (w.fx === "flash") { ev.push({ start: t - 0.9, kind: "riser", vol: 0.5 }); ev.push({ start: t, kind: "boom", vol: 0.9 }); }
    });
    for (const s of scenes) if (s.type === "chips") chipTimes(s.dur, (s.data?.items || []).length, s.cues).forEach((t) => ev.push({ start: s.start + t, kind: "blip", vol: 0.6 }));
  }
  if (p.audio.cutSfx) {
    for (const sg of tm.segs.slice(1)) {
      const type = p.segments.find((x) => x.id === sg.id)?.tIn || p.transitions.cut;
      if (!type || type === "none") continue;
      ev.push({ start: sg.outStart - 0.9, kind: "riser", vol: 0.5 });
      ev.push({ start: sg.outStart, kind: "boom", vol: 0.85 });
      ev.push({ start: sg.outStart + 0.02, kind: "downlift", vol: 0.4 });
    }
  }
  for (const s of p.audio.sfx || []) ev.push({ start: tm.srcToOut(s.at || 0), kind: s.kind, vol: s.vol, manual: true });
  // Không gây giật mình ngay đầu video, không chồng 2 SFX quá sát nhau.
  // Xét theo ưu tiên: thêm tay > chọn riêng ở mục > tự động — tiếng tự động không lấn tiếng người dùng / mẫu đã chọn
  const out = [];
  const rank = (e) => (e.manual ? 0 : e.own ? 1 : 2);
  for (const e of ev.filter((e) => (e.manual || e.start >= (p.audio.wordSfx || e.word ? 0.15 : 0.6)) && SFX_KINDS.includes(e.kind)).sort((a, b) => rank(a) - rank(b) || a.start - b.start)) {
    if (!e.manual) {
      const minGap = e.word ? 0.06 : e.kind === "tick" ? 0.1 : 0.25;
      // cùng loại quá sát · 2 tiếng khác loại dính nhau (< 0,12s) → nghe rối, bỏ tiếng ưu tiên thấp hơn
      if (out.some((o) => (o.kind === e.kind && Math.abs(o.start - e.start) < minGap) || (!e.word && !o.word && Math.abs(o.start - e.start) < 0.12))) continue;
    }
    out.push({ ...e, start: round3(e.start) });
  }
  out.sort((a, b) => a.start - b.start);
  return out;
}

// File âm thanh người dùng thêm (ghi âm, nhạc riêng, tiếng động): audio.clips = [{ id, src, at (giây gốc), vol, from (giây trong file), dur }]
const durCache = new Map();
function mediaDur(file) {
  if (!durCache.has(file)) {
    let d = 0;
    try { d = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" })) || 0; } catch {}
    durCache.set(file, d);
  }
  return durCache.get(file);
}
function audioClips(p, tm, projectDir, total, track) {
  return (p.audio.clips || []).filter((c) => c.src && !c.hidden).map((c, i) => {
    const file=path.resolve(projectDir,c.src),relative=path.relative(projectDir,file);
    if(relative.startsWith('..')||path.isAbsolute(relative)||!fs.existsSync(file))return '';
    const timing=audioClipTiming(c,{...tm,total:tm.contentTotal},mediaDur(file));if(!timing)return '';
    return `\n    <audio id="aclip${i}" data-start="${round3(timing.start)}" data-duration="${round3(timing.duration)}" data-media-start="${round3(timing.from)}" data-track-index="${track + i}" data-volume="${round3(timing.volume)}"${timing.fadeIn||timing.fadeOut?` data-fade-in="${round3(timing.fadeIn)}" data-fade-out="${round3(timing.fadeOut)}"`:''} src="${esc(c.src)}"></audio>`;
  }).join("");
}

// WAV PCM + sec giây im lặng ở đầu (đệm cho tiếng hiệu ứng ngắn — xem sfxItems)
const SFX_PAD = 0.25; // đệm + đuôi im lặng: paddedSfxWav (sfx-wav.mjs)

export function buildHtml(project, projectDir) {
  const r = resolveTimeline(project);
  const { p, tm, texts, zooms, scenes, brolls, blocks, caps, vfx } = r;
  const total = round3(tm.total);
  const brand = projectBrand(p);
  for(const family of new Set([brand.fontTitle,brand.fontSub,brand.fontLabel,brand.caption?.font,...(brand.extraFontNames||[])])){
    if(!FONTS[family]?.startsWith('local:'))continue;
    for(const name of LOCAL_FONT_FACES[family].map(f=>f.file)){
      const from=path.join(KIT,'ui/fonts',name),to=path.join(projectDir,'assets/fonts',name);
      if(!fs.existsSync(from))throw new Error('Thiếu font local: '+family);
      fs.mkdirSync(path.dirname(to),{recursive:true});if(!fs.existsSync(to)||!fs.readFileSync(to).equals(fs.readFileSync(from)))fs.copyFileSync(from,to);
    }
  }
  const color = colorOf(p.camera);
  const src = p.source?.video;
  const cam = p.camera;
  const matte = cam.matte || "";
  for(const [kind,items] of [['segments',p.segments],['brolls',p.brolls||[]]])for(const item of items.filter(x=>x.keep!==false&&!x.hidden&&x.colorNormalization)){
    const proof=item.colorNormalization,from=item.mediaStart??0,length=kind==='segments'?item.out-item.in:item.dur*(Number(item.speed)||1);
    if(proof.kind!=='color-normalization'||!/^inputs\/color\/[a-f0-9-]+\/normalized\.mp4$/.test(item.src||'')||from<0||from+length>proof.duration+.05)throw new Error('Đoạn vượt bản màu đã xử lý; khôi phục nguồn hoặc chuẩn hóa lại.');
    const file=resolveContained(projectDir,item.src).file;if(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==proof.sha256)throw new Error('Bản màu đã bị thay đổi; chuẩn hóa lại.');
  }
  for(const [kind,items] of [['segments',p.segments],['brolls',p.brolls||[]]])for(const s of items.filter(s=>s.keep!==false&&!s.hidden&&s.platePrivacy)){
    const proof=s.platePrivacy;
    const length=kind==='segments'?s.out-s.in:s.dur*(Number(s.speed)||1);
    if(proof.kind!=='plate-privacy'||!/^inputs\/privacy\/[a-f0-9-]+\/masked\.mp4$/.test(s.src??'')||!Number.isFinite(proof.duration)||!Number.isFinite(s.mediaStart)||s.mediaStart<0||s.mediaStart+length>proof.duration+.01)throw new Error('Đoạn che biển vượt khoảng đã xử lý; khôi phục nguồn hoặc tạo lại bản che.');
    const file=resolveContained(projectDir,s.src).file;
    if(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==proof.sha256)throw new Error('Bản che biển đã đổi; tạo lại trước khi dựng.');
    const normalized=proof.originalColorNormalization;
    if(normalized){
      if(s.colorNormalization||normalized.kind!=='color-normalization'||!/^inputs\/color\/[a-f0-9-]+\/normalized\.mp4$/.test(proof.source||'')||!Number.isFinite(normalized.duration)||!Number.isFinite(proof.from)||proof.from<0||proof.from+proof.duration>normalized.duration+.01||proof.sourceSha256!==normalized.sha256)throw new Error('Chuỗi màu/che biển không khớp nguồn hoặc khoảng xử lý.');
      const source=resolveContained(projectDir,proof.source).file;
      if(crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex')!==normalized.sha256)throw new Error('Bản màu trước che biển đã bị thay đổi; tạo lại bản che.');
    }
  }
  if((p.source?.timeline==='segments'||p.segments.some(s=>s.platePrivacy||s.colorNormalization))&&(matte||p.audio.clean||p.vfx.some(v=>v.type==='freeze')||p.transitions.cut==='dissolve'||p.segments.some(s=>s.tIn==='dissolve')))throw new Error('Dự án nhiều nguồn chưa hỗ trợ matte/lọc giọng/freeze/dissolve; tắt các hiệu ứng này trước khi dựng.');
  // khung ngang 16:9: toạ độ y mặc định (viết cho khung cao 1920) thu theo chiều cao
  const { wide, W, H } = frameOf(p), ky = H / 1920;
  if (wide) for (const t of texts) if (t.y == null) t.y = Math.round(DEFAULTS.textY * ky);

  // Cảnh đồ hoạ nối tiếp nhau thì không fade về mặt người nói ở giữa.
  for (const s of scenes) {
    s.fadeIn = !scenes.some((o) => o !== s && Math.abs(o.start + o.dur - s.start) < 0.05);
    s.fadeOut = !scenes.some((o) => o !== s && Math.abs(s.start + s.dur - o.start) < 0.05);
  }

  const sfx = sfxEvents(r);
  // Nền thay sau người (mẫu đặt brand.backdrop, cần lớp tách nền): tấm nền đồ hoạ phủ suốt video giữa video gốc và người,
  // cảnh trám / cảnh nằm trên nền (dưới người) · place = tâm mặt (tỉ lệ khung) + cỡ người
  const bd = brand.backdrop && !brand.backdrop.off && matte ? brand.backdrop : null;
  if (bd) blocks.unshift({ id: "backdrop", start: 0, dur: total, layer: "behind", fx: "none", out: "none", html: bd.html || "", css: bd.css || "", anim: bd.anim || [] });
  const place = bd?.place && Number(bd.place.scale) > 0 ? bd.place : null;
  if (place) {
    const s0 = Math.max(0.2, Math.min(2, Number(place.scale))), fx = (cam.faceX ?? 0.5) * W, fy = cam.faceY * H;
    cam.scale = s0;
    cam.x = Math.round(Number(place.x ?? 0.5) * W - (W / 2 + (fx - W / 2) * s0));
    cam.y = Math.round(Number(place.y ?? 0.5) * H - (H / 2 + (fy - H / 2) * s0));
  }
  const splitItems = brolls.filter((b) => b.mode === "split").map((b) => ({ id: b.id, start: b.start, dur: b.dur }));
  let track = 2;
  const matteTrack = track++;
  track = allocTracks(brolls, track);
  // blurfill: clip ngang ở dải giữa + chính clip phóng to làm mờ phía sau, lớp nền cần track riêng
  const blurBg = brolls.filter((b) => b.mode === "blurfill").map((b) => ({ ref: b, start: b.start, dur: b.dur }));
  track = allocTracks(blurBg, track);
  for (const g of blurBg) g.ref.bgTrack = g.track;
  track = allocTracks(splitItems, track);
  track = allocTracks(scenes, track);
  track = allocTracks(texts, track);
  track = allocTracks(blocks, track);
  track = allocTracks(caps, track);
  const musicTrack = track; // 2 track cho nhạc nền nối lượt
  track += 4;
  // khung phát tối thiểu 0,8s: tiếng ngắn (pop 0,1s) chỉ được giữ đúng độ dài file thì khung xem trước (đồng bộ theo nhịp) chưa kịp phát đã hết → không kêu
  // + đệm SFX_PAD giây im lặng ở đầu file, phát sớm hơn bấy nhiêu: khung xem trước bật tiếng trễ 50–100ms rồi tua tới đúng vị trí —
  //   tiếng ngắn (pop / click 0,1s) bị tua mất gần hết; có đệm thì phần trễ chỉ ăn vào đoạn im lặng (bản xuất vẫn kêu đúng lúc)
  const sfxItems = sfx.map((e) => {
    const at = round3(Math.max(0, e.start - SFX_PAD)), lead = round3(e.start - at);
    return { ...e, start: at, skip: round3(SFX_PAD - lead), dur: Math.min(round3(lead + Math.max(0.8, sfxLen(e.kind))), Math.max(0.1, round3(tm.total - at))) };
  });
  const clipTrack = allocTracks(sfxItems, track);

  // Hoà tan 2 cảnh: cảnh trước chạy tiếp (phần sau điểm cắt của video gốc) chồng lên cảnh sau rồi mờ dần
  const srcDur = Number(p.source?.duration) || Infinity;
  const fxTrack = clipTrack + (p.audio.clips || []).length + brolls.length + 1;
  const dissolves = tm.segs.slice(1).map((sg, i) => {
    const seg = p.segments.find((x) => x.id === sg.id) || {}, prev = tm.segs[i];
    if ((seg.tIn || p.transitions.cut) !== "dissolve") return null;
    const dur = round3(Number(seg.tDur ?? p.transitions.dur) || 0.5);
    const from = round3(Math.min(prev.in + (prev.outEnd - prev.outStart) * prev.rate, Math.max(0, srcDur - dur)));
    return { id: `vd${i}`, start: round3(sg.outStart), dur, from, track: fxTrack + i };
  }).filter(Boolean);
  const dissolveHtml = dissolves.map((d) => `<video id="${d.id}" class="talk" data-start="${d.start}" data-duration="${d.dur}" data-media-start="${d.from}" data-track-index="${d.track}" src="${esc(src)}" muted playsinline></video>`).join("\n      ");
  // Dừng hình: ảnh khung tại thời điểm đó phủ lên video trong lúc lời nói vẫn chạy
  const freezeHtml = vfx.filter((v) => v.type === "freeze").map((v, i) => {
    const at = round3(tm.outToSrc(v.start)), rel = `assets/fx/dung-${at}.jpg`;
    if (projectDir && !fs.existsSync(path.join(projectDir, rel))) {
      fs.mkdirSync(path.join(projectDir, "assets", "fx"), { recursive: true });
      try { execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(at), "-i", path.join(projectDir, src), "-frames:v", "1", "-q:v", "2", path.join(projectDir, rel)]); } catch {}
    }
    return `<img id="fz${i}" class="clip talk" data-start="${v.start}" data-duration="${v.dur}" data-track-index="${fxTrack + dissolves.length + i}" src="${rel}">`;
  }).join("\n      ");
  const talk = tm.segs
    .map((s, i) => {
      const len = round3(s.outEnd - s.outStart);
      if(s.src&&(!Number.isFinite(s.mediaStart)||s.mediaStart<0||!Number.isFinite(s.mediaInfo?.duration)||s.mediaStart+s.out-s.in>s.mediaInfo.duration+.01))throw new Error('Khoảng cắt vượt file nguồn của clip '+s.id);
      if(s.fit!==undefined&&!['cover','contain'].includes(s.fit))throw new Error('Cách đặt video vào khung không hợp lệ.');
      const cropStyle=croppedMediaStyle(s.crop,s.mediaInfo??p.source,{width:W,height:H},s.fit??'cover');
      const video=`<video id="v${i}" class="talk"${cropStyle?` style="${cropStyle}"`:s.fit?` style="object-fit:${s.fit};object-position:50% 50%;background:#101113;"`:""} data-start="${round3(s.outStart)}" data-duration="${len}" data-media-start="${round3(s.mediaStart??s.in)}" data-track-index="0"${s.rate !== 1 ? ` data-playback-rate="${round3(s.rate)}"` : ""} data-face-source="${esc(s.src??src)}" src="${esc(s.src??src)}" muted playsinline></video>`;
      const transform=sourceTransformStyle(s.transform);
      const color=sourceColorEffects(s.color,'source-color-'+i);
      const motion=normalizeSourceZoom(s.motionZoom);
      const mediaContent=motion?`<div style="position:absolute;inset:0;overflow:hidden"><div id="source-zoom-${i}" style="position:absolute;inset:0;transform-origin:${motion.origin};transform:scale(${motion.keys[0].scale})">${video}</div></div>`:video;
      const baseContent=cropStyle?`<div style="position:absolute;inset:0;overflow:hidden;background:#101113">${mediaContent}</div>`:mediaContent;
      const content=color.filter||color.vignette?`${color.defs}<div style="position:absolute;inset:0;${color.filter?`filter:${color.filter};`:''}">${baseContent}</div>${color.vignette?`<div style="position:absolute;inset:0;pointer-events:none;background:${color.vignette}"></div>`:''}`:baseContent;
      return motion||cropStyle||transform||color.filter||color.vignette?`<div id="source-frame-${i}" data-start="${round3(s.outStart)}" data-duration="${len}" style="position:absolute;inset:0;overflow:hidden;background:#101113"><div style="position:absolute;inset:0;${transform?`transform:${transform};transform-origin:50% 50%;`:''}">${content}</div></div>`:video;
    })
    .join("\n      ");
  // làm rõ giọng (audio.clean): dùng file giọng đã lọc ồn (đúng độ dài video gốc) — chưa tạo xong thì dùng tiếng gốc
  const voiceSrc = projectDir && p.audio.clean && voiceReady(projectDir, src, p.audio.clean) ? voiceFile(p.audio.clean) : src;
  // Khai báo hasAudio được ưu tiên; thiếu thì ffprobe từng file (nguồn đầu im lặng không tắt tiếng clip sau).
  const presence = sourceAudioPresence(projectDir);
  // ffprobe đọc không được (file hỏng/đang chép): giữ tiếng như trước, để bước render báo lỗi nguồn thật. Đường dẫn ngoài dự án vẫn bị chặn.
  const hasAudio = (s, known) => { try { return presence(s, known); } catch (error) { if (error.message.startsWith("Không kiểm tra được")) return true; throw error; } };
  const voice = tm.segs.filter(s=>s.src?hasAudio(s.src,s.mediaInfo?.hasAudio):hasAudio(src,p.source?.hasAudio===false||s.mediaInfo?.hasAudio===false?false:undefined))
    .map((s, i) => {
      const len = round3(s.outEnd - s.outStart);
      if(s.audioEnvelope){
        const gain=Number(s.audioVolume??1);if(!Number.isFinite(gain)||gain<0||gain>2)throw new Error('Âm lượng đoạn video phải từ0đến2.');
        return sourceAudioParts(s.audioEnvelope,s.outEnd-s.outStart).map((part,k)=>`<audio id="a${i}-env${k}" data-start="${round3(s.outStart+part.from)}" data-duration="${round3(part.duration)}" data-media-start="${round3((s.mediaStart??s.in)+part.from*s.rate)}" data-track-index="${10+k}"${s.rate!==1?` data-playback-rate="${round3(s.rate)}"`:''} data-volume="${round3(p.audio.voice*gain*part.gain)}" data-fade-in="${part.fadeIn}" data-fade-out="${part.fadeOut}" src="${esc(s.src??voiceSrc)}"></audio>`).join('\n');
      }
      const fadeIn=s.audioFadeIn??FADE,fadeOut=s.audioFadeOut??FADE;if(![fadeIn,fadeOut].every(v=>Number.isFinite(v)&&v>=0&&v<=10)||fadeIn+fadeOut>(s.outEnd-s.outStart)+1e-9&&(s.audioFadeIn!==undefined||s.audioFadeOut!==undefined))throw new Error('Fade tiếng đoạn video không hợp lệ hoặc chồng nhau.');
      const gain=Number(s.audioVolume??1);if(!Number.isFinite(gain)||gain<0||gain>2)throw new Error('Âm lượng đoạn video phải từ0đến2.');
      return `<audio id="a${i}" data-start="${round3(s.outStart)}" data-duration="${len}" data-media-start="${round3(s.mediaStart??s.in)}" data-track-index="1"${s.rate !== 1 ? ` data-playback-rate="${round3(s.rate)}"` : ""} data-volume="${round3(p.audio.voice*gain)}" data-fade-in="${fadeIn}" data-fade-out="${fadeOut}" src="${esc(s.src??voiceSrc)}"></audio>`;
    })
    .join("\n    ");

  const imageSizes=new Map();
  const imagePipHeight=b=>{
    if(b.mode!=='pip'||['phone','strip'].includes(b.frame))return '';
    const file=path.resolve(projectDir,b.src),relative=path.relative(path.resolve(projectDir),file);
    if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Ảnh cảnh trám phải thuộc dự án.');
    if(!imageSizes.has(file)){
      const stream=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',file],{encoding:'utf8',windowsHide:true,timeout:20000,maxBuffer:1024*1024})).streams?.[0];
      if(!(stream?.width>0&&stream?.height>0))throw new Error('Không đọc được kích thước ảnh cảnh trám.');
      imageSizes.set(file,stream);
    }
    const size=imageSizes.get(file),polaroid=b.frame==='polaroid',border=b.frame==='tilt'?24:0,width=polaroid?700:W===1920?820:800;
    return `height:${round3((width-(polaroid?40:border))*size.height/size.width+(polaroid?110:border))}px;`;
  };
  const brollHtml = brolls
    .map((b) => {
      const cls = (b.mode === "split" ? "split" : b.mode === "pip" ? "pip" : b.mode === "blurfill" ? "blurfill" : "") + (b.frame && b.mode === "pip" ? " fr-" + String(b.frame).replace(/[^a-z-]/g, "") : "");
      const grade=sourceColorEffects(b.color,'broll-color-'+String(b.id).replace(/[^a-zA-Z0-9_-]/g,'-'));
      const st = `object-position:${esc(b.pos || "50% 50%")};${xform(b)}${grade.filter?`filter:${grade.filter};`:''}`;
      if(grade.vignette)throw new Error('B-roll chưa hỗ trợ tối góc riêng; dùng preset hoặc thông số màu khác.');
      const common = `id="${esc(b.id)}" data-start="${b.start}" data-duration="${b.dur}" data-track-index="${b.track}"`;
      const isImg = /\.(png|jpe?g|webp|gif)$/i.test(b.src || ""), rate = Number(b.speed) > 0 && Number(b.speed) !== 1 ? ` data-playback-rate="${round3(Math.max(0.25, Math.min(4, Number(b.speed))))}"` : "";
      const bg = b.mode !== "blurfill" ? "" : (() => {
        const bgCommon = `id="${esc(b.id)}-bg" data-start="${b.start}" data-duration="${b.dur}" data-track-index="${b.bgTrack}"`, bgSt = `filter:blur(36px) brightness(.85)${grade.filter ? " " + grade.filter : ""};`;
        return isImg ? `<img ${bgCommon} class="clip broll-img blurfill-bg" src="${esc(b.src)}" style="${bgSt}">`
          : `<video ${bgCommon} class="broll blurfill-bg" data-face-source="${esc(b.src)}" data-media-start="${Number(b.mediaStart) || 0}"${rate} src="${esc(b.src)}" muted playsinline style="${bgSt}"></video>`;
      })();
      if (isImg)
        return `${grade.defs}${bg}<img ${common} class="clip broll-img ${cls}" src="${esc(b.src)}" style="${st}${imagePipHeight(b)}">`;
      return `${grade.defs}${bg}<video ${common} class="broll ${cls}" data-face-source="${esc(b.src)}" data-media-start="${Number(b.mediaStart) || 0}"${rate} src="${esc(b.src)}" muted playsinline style="${st}"></video>`;
    })
    .join("\n    ");
  const splitLines = splitItems.map(
    (b) => `<div id="${esc(b.id)}-line" class="clip split-line" data-start="${b.start}" data-duration="${b.dur}" data-track-index="${b.track}"></div>`,
  );

  const sceneHtml = scenes
    .map((s) => `<div id="${esc(s.id)}" class="clip scene sc-${esc(s.type)}" data-start="${s.start}" data-duration="${s.dur}" data-track-index="${s.track}">${sceneInner(s)}</div>`)
    .join("\n    ");

  // Khối đồ hoạ tự do (mẫu / AI tự vẽ): HTML + CSS riêng, chuyển động khai báo (không chạy JS)
  const blockHtml = blocks
    .map((b) => {
      const id = "blk-" + String(b.id).replace(/[^a-zA-Z0-9_-]/g, "");
      const css = cleanCss(b.css).replace(/:scope(?![a-zA-Z0-9_-])/g, "#" + id);
      const inHtml = `<div class="blk-in"${b.x || b.y || (b.scale && b.scale !== 1) ? ` style="${xform(b)}"` : ""}>${cleanHtml(b.html)}</div>`;
      // khối bám theo: lớp ngoài chạy cùng camera, lớp trong theo vật. Toạ độ khối tính theo khung video gốc
      const followed = Array.isArray(b.follow) && b.follow.length > 1, c = p.camera || {};
      const wrapped = followed ? `<div class="trk-cam" style="--face-x:${Math.round((c.faceX ?? 0.5) * 100)}%;--face-y:${Math.round((c.faceY ?? 0.36) * 100)}%"><div class="trk-frame" style="translate:${Number(c.x) || 0}px ${Number(c.y) || 0}px;scale:${Number(c.scale) || 1}"><div class="trk-obj">${inHtml}</div></div></div>` : inHtml;
      return `<div id="${id}" class="clip blk${b.layer === "behind" ? " behind" : ""}" data-start="${b.start}" data-duration="${b.dur}" data-track-index="${b.track}"${b.layerRow ? ` style="z-index:${(b.layer === "behind" ? 44 : 47) + b.layerRow}"` : ""}>` +
        (css ? `<style>${css}</style>` : "") + wrapped + `</div>`;
    })
    .join("\n    ");

  const capCfg = p.captions;
  // Kiểu "stack": xếp từ thành các hàng chồng lên nhau, to nhỏ + màu xen kẽ (cố định theo vị trí từ, không ngẫu nhiên)
  const SMALL = new Set("là và của thì có được cho với để những các một này đó mà ở đã sẽ cũng rằng nên khi vì nếu thế the a an to of and is are it in on for that this".split(" "));
  const KEYFX = brand.caption.keyFx?.length ? brand.caption.keyFx : null;
  let lastH = 0, lastRoom = 200; // chiều cao ước lượng của khối vừa dựng (px), chỗ trống ngang còn lại
  let keyN = 0;
  function stackWords(words, b, single = false) {
    const pal = b.caption.palette?.length ? b.caption.palette : [b.caption.color, b.c2, b.c3, b.caption.active];
    const bare = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
    // Từ khoá = từ dài nhất (không phải từ nối) → to nhất, đứng riêng một hàng
    let key = -1;
    words.forEach((w, i) => { const t = bare(nfc(w.w)); if (!SMALL.has(t) && (key < 0 || t.length > bare(nfc(words[key].w)).length)) key = i; });
    const rows = [];
    let k = 0;
    const manual = words.some((w) => w.br || w.sz != null);
    words.forEach((w, i) => {
      const txt = nfc(w.w), small = SMALL.has(bare(txt));
      const size = w.sz != null ? Number(w.sz) : i === key ? 1.75 : small ? 0.6 : k++ % 2 ? 0.9 : 1.15;
      // Hiệu ứng từ: chỉnh tay > tự động theo mẫu (chỉ từ khoá)
      const fx = w.fx && w.fx !== "plain" ? w.fx : !w.fx && !manual && i === key && KEYFX ? KEYFX[keyN++ % KEYFX.length] : "";
      const last = rows[rows.length - 1];
      const it = { txt, size, i, fx, c: w.c, c2: w.c2, dx: w.dx };
      if (manual) { if (last && !w.br && !single) last.push(it); else rows.push([it]); }
      else if (last && i !== key && !last.key && last.length < 2) last.push(it);
      else { const r = [it]; r.key = i === key; rows.push(r); }
    });
    // Hàng quá dài thì thu nhỏ cả hàng cho vừa khung (ước lượng bề rộng chữ đậm ≈ 0.6 cỡ chữ mỗi ký tự)
    const base = Number(b.caption.size) || 58, maxW = (W - 230) / 1.12; // vừa khung kể cả khi phóng to 12%, chừa chỗ cho chữ lắc / trôi
    for (const r of rows) {
      const rowW = (r) => r.reduce((s, w) => s + graphemes(w.txt).length * 0.62 * w.size * base, 0) + (r.length - 1) * 0.16 * base + 2 * Math.abs(r[0].dx || 0) * base;
      const wpx = r.reduce((s, w) => s + graphemes(w.txt).length * 0.62 * w.size * base, 0) + (r.length - 1) * 0.1 * base + 2 * Math.abs(r[0].dx || 0) * base;
      if (wpx > maxW) for (const w of r) w.size = Math.round(((w.size * maxW) / wpx) * 100) / 100;
    }
    // chỗ trống còn lại mỗi bên (px) sau khi phóng to → giới hạn biên độ lắc / trôi ở runtime
    lastRoom = Math.max(12, (W - 40 - Math.max(...rows.map((r) => r.reduce((s, w) => s + graphemes(w.txt).length * 0.62 * w.size * base, 0) + (r.length - 1) * 0.16 * base + 2 * Math.abs(r[0].dx || 0) * base)) * 1.12) / 2);
    lastH = rows.reduce((h, r) => h + Math.max(...r.map((w) => w.size)) * base * 0.8, 0) - (rows.length - 1) * 0.2 * base;
    return rows.map((r, ri) => `<div class="cs-row" style="--off:${r[0].dx ?? [0, -0.5, 0.45, -0.25][ri % 4]}em">` +
      r.map((w, wi) => {
        const c = w.c || pal[w.i % pal.length], c2 = w.c2 || pal[(w.i + 2) % pal.length];
        if (w.fx === "flash") flashes.push({ cap: capId, i: w.i, color: b.caption.flash || b.c3 });
        const cls = w.fx ? " fx-" + esc(w.fx) : w.size >= 1.1 ? " lit" : "";
        // .cwm = lớp chuyển động riêng của từng từ (trôi độc lập), .cw = lớp hiệu ứng vào / ra
        return `<span class="cwm" data-r="${ri}" data-k="${wi}"><span class="cw${cls}" data-t="${esc(w.txt)}" style="--sz:${w.size};--c:${esc(c)};--c2:${esc(c2)};color:${esc(c)}">${esc(w.txt)}</span></span>`;
      }).join(" ") + "</div>").join("");
  }

  const shiftX = (c) => { const x = Number(c.x ?? capCfg.x) || 0; return x ? `left:${70 + x}px;right:${70 - x}px` : ""; };
  const flashes = [];
  let capId = "";
  const capHtml = caps
    .map((c) => (capId = c.id, c.inner = brand.caption.style === "stack" ? stackWords(c.words, brand, c.single) : null, c.h = lastH, c.room = lastRoom,
      `<div id="cap-${esc(c.id)}" class="clip cap${c.behind && matte ? " behind" : ""}" data-start="${c.start}" data-duration="${c.dur}" data-track-index="${c.track}">` +
      `<div class="cap-line cap-${esc(brand.caption.style)}${c.single ? " cap-single" : ""}${brand.caption.uppercase ? " up" : ""}" style="${
        // tầng trên neo mép dưới, tầng dưới neo mép trên (không dùng translate % vì GSAP gộp vào transform)
        // khối quá cao so với chỗ trống thì neo theo mép khung (chừa 90px) để không bị cắt
        c.slot === 0 && (Number(c.y) || 880 * ky) - c.h < 160 * ky ? `top:${Math.round(160 * ky)}px;transform-origin:50% 0%;${shiftX(c)}`
        : c.slot === 1 && (Number(c.y) || 1010 * ky) + c.h > H - 140 * ky ? `bottom:${Math.round(140 * ky)}px;transform-origin:50% 100%;${shiftX(c)}`
        : c.slot === 0 ? `bottom:${Math.round(H - (Number(c.y) || 880 * ky))}px;transform-origin:50% 100%;${shiftX(c)}`
        : c.slot === 1 ? `top:${Math.round(Number(c.y) || 1010 * ky)}px;transform-origin:50% 0%;${shiftX(c)}`
        : `top:${Math.round(Number(c.y ?? capCfg.y) || 1450 * ky)}px;translate:${Number(capCfg.x) || 0}px -50%`};scale:${Number(capCfg.scale) || 1}">` +
      (c.inner != null ? c.inner : c.words.map((w) => `<span class="cw">${esc(nfc(w.w))}</span>`).join(" ")) +
      `</div></div>`))
    .join("\n    ");

  const textHtml = texts
    .map((t) => `<div id="${esc(t.id)}" class="clip tx" data-start="${t.start}" data-duration="${t.dur}" data-track-index="${t.track}"${t.layerRow ? ` style="z-index:${40 + t.layerRow}"` : ""}>${textBox(t, false, brand)}</div>`)
    .join("\n    ");

  // Nhạc và SFX được copy vào project để renderer đọc được.
  const sfxDir = path.join(projectDir, "assets", "sfx");
  const kinds = new Set(sfx.map((e) => e.kind));
  if (kinds.size) fs.mkdirSync(sfxDir, { recursive: true });
  for (const k of kinds) {
    const from = path.join(KIT, "assets", "sfx", `${k}.wav`);
    const to = path.join(sfxDir, `${k}-d.wav`);
    // chép lại khi tiếng gốc của phần mềm mới hơn bản trong dự án (bản cập nhật sửa / thay tiếng)
    // so nội dung, không theo mtime: bản cũ thiếu đuôi im lặng vẫn được thay; giống hệt thì không ghi lại
    if (fs.existsSync(from)) { const want = paddedSfxWav(fs.readFileSync(from), { lead: SFX_PAD }); if (!fs.existsSync(to) || !fs.readFileSync(to).equals(want)) fs.writeFileSync(to, want); }
  }
  const sfxHtml = sfxItems
    .map((e, i) => `<audio id="sfx${i}" data-start="${e.start}" data-duration="${e.dur}" data-track-index="${e.track}" ${e.skip > 0 ? ` data-media-start="${e.skip}"` : ""} data-volume="${round3((e.vol ?? 1) * p.audio.sfxVolume)}" src="assets/sfx/${e.kind}-d.wav"></audio>`)
    .join("\n    ");
  let music = p.audio.music;
  if (/^kit:/.test(music || "")) {
    const name = kitMusicFile(KIT, music.slice(4)); // bài nhập từ NAS có thể là .mp3
    const from = path.join(KIT, "assets", "music", name), to = path.join(projectDir, "assets", "music", name);
    // Nhạc nền không đóng gói sẵn (cho file tải nhẹ) — thiếu thì tự tổng hợp lại
    if (!fs.existsSync(from)) for (const t of ["make-sfx.mjs", "make-sfx-lux.mjs"]) { try { execFileSync(process.execPath, [path.join(KIT, "tools", t)], { stdio: "ignore" }); } catch {} }
    if (fs.existsSync(from)) { fs.mkdirSync(path.dirname(to), { recursive: true }); if (!fs.existsSync(to)) fs.copyFileSync(from, to); music = `assets/music/${name}`; }
    else music = "";
  }
  // Nhạc ngắn hơn video → nối nhiều lượt, mỗi lượt chồng 2s lên lượt trước (2 track xen kẽ) để chuyển mượt
  let musicHtml = "";
  const duckWindows=p.audio.duckNarration?(p.audio.clips||[]).flatMap(c=>{
    const file=path.resolve(projectDir,c.src||''),relative=path.relative(projectDir,file);
    if(!c.src||relative.startsWith('..')||path.isAbsolute(relative)||!fs.existsSync(file))return [];
    const timing=audioClipTiming(c,{...tm,total:tm.contentTotal},mediaDur(file));return timing&&timing.volume>0?[timing]:[];
  }):[];
  if(p.audio.duckSourceSpeech===true){
    let transcript;try{transcript=JSON.parse(fs.readFileSync(path.join(projectDir,'work/transcript.json'),'utf8'));}catch{}
    duckWindows.push(...primarySpeechWindows(p,transcript));
  }
  const autoDuck=p.audio.duckNarration===true||p.audio.duckSourceSpeech===true;
  if (music) {
    const md = mediaDur(path.join(projectDir, music)), XF = 2;
    if(p.audio.musicLoop==='repeat'){
      const parts=musicLoopParts(total,md,repeatMusicOptions(p.audio,duckWindows));
      for(const [i,part] of parts.entries())musicHtml+=`<audio id="music-repeat${i}" data-start="${round3(part.start)}" data-duration="${round3(part.duration)}" data-media-start="${round3(part.offset)}" data-track-index="${musicTrack+i%2}" data-volume="${round3(p.audio.musicVolume*part.gain)}" data-fade-in="${round3(part.fadeIn)}" data-fade-out="${round3(part.fadeOut)}" src="${esc(music)}"></audio>`;
    }else if(md<total&&md<=XF*3){
      // Nhạc ngắn: lượt nối chồng thích ứng, không đọc quá cuối file nguồn.
      const parts=crossfadeMusicMixParts(total,md,duckWindows,{enabled:autoDuck,level:p.audio.duckLevel,fade:p.audio.duckFade});
      for(const [i,part] of parts.entries())musicHtml+=`<audio id="music-xf${i}" data-start="${round3(part.start)}" data-duration="${round3(part.duration)}" data-media-start="${round3(part.offset)}" data-track-index="${musicTrack+part.track+(part.layer?2:0)}" data-volume="${round3(p.audio.musicVolume*part.gain)}" data-fade-in="${round3(part.fadeIn)}" data-fade-out="${round3(part.fadeOut)}" src="${esc(music)}"></audio>`;
    }else{
    const step = md > XF * 3 && md < total ? md - XF : total;
    for (let k = 0, t = 0; t < total - 0.05; k++, t += step) {
      const d = round3(Math.min(step === total ? total : md, total - t)), last = t + d >= total - 0.05;
      const options={enabled:autoDuck,level:p.audio.duckLevel,fade:p.audio.duckFade};
      const parts=options.enabled&&Number(options.fade)>0?smoothMusicDuckParts(t,d,duckWindows,options):musicDuckParts(t,d,duckWindows,options);
      for(const [index,part] of parts.entries())musicHtml += `<audio id="music${k ? "-" + k : ""}${parts.length>1?'-duck'+index:''}" data-start="${round3(part.start)}" data-duration="${round3(part.duration)}" data-media-start="${round3(part.offset)}" data-track-index="${musicTrack + (k % 2)+(part.overlay?2:0)}" data-volume="${round3(p.audio.musicVolume*part.gain)}" data-fade-in="${part.bed||part.offset===0?(k ? XF : 1.2):part.fadeIn||0}" data-fade-out="${part.bed||Math.abs(part.offset+part.duration-d)<.001?(last ? 2 : XF):part.fadeOut||0}" src="${esc(music)}"></audio>`;
    }
    }
  }
  musicHtml += audioClips(p, tm, projectDir, tm.contentTotal, clipTrack);
  // tiếng gốc cảnh trám video (mặc định tắt — người dùng kéo "Tiếng gốc" trong mục Cảnh trám)
  const brTrack = clipTrack + (p.audio.clips || []).length;
  musicHtml += brolls.filter((x) => Number(x.audioVol) > 0 && !/\.(png|jpe?g|webp|gif)$/i.test(x.src || "") && hasAudio(x.src, x.mediaInfo?.hasAudio)).map((x, i) => {
    const rate = Number(x.speed) > 0 && Number(x.speed) !== 1 ? ` data-playback-rate="${round3(Math.max(0.25, Math.min(4, Number(x.speed))))}"` : "";
    return `
    <audio id="${esc(x.id)}-a" data-start="${x.start}" data-duration="${x.dur}" data-media-start="${Number(x.mediaStart) || 0}" data-track-index="${brTrack + i}"${rate} data-volume="${round3(Math.min(1.5, Number(x.audioVol)))}" src="${esc(x.src)}"></audio>`;
  }).join("");

  const camStyle = `--face-x:${Math.round((cam.faceX ?? 0.5) * 100)}%;--face-y:${Math.round(cam.faceY * 100)}%;filter:brightness(${color.brightness}) contrast(${color.contrast}) saturate(${color.saturate})${color.hue ? ` hue-rotate(${color.hue}deg)` : ""}${color.sepia ? ` sepia(${color.sepia})` : ""} var(--fx-filter,)`;
  const tempA = Math.min(1, Math.abs(Number(color.temp) || 0)) * 0.28;
  const tint = tempA ? `<div id="camTint" style="background:${color.temp > 0 ? `rgba(255,150,60,${tempA})` : `rgba(70,140,255,${tempA})`}"></div>` : "";
  const vig = (color.vignette ? `<div id="camVignette" style="opacity:${Math.min(1, color.vignette)}"></div>` : "") +
    (color.fade ? `<div id="camFade" style="opacity:${Math.min(0.6, color.fade)}"></div>` : "");
  const matteHtml = !matte ? "" : /\.(png|webp|svg|gif)$/i.test(matte)
    ? `<img id="matteImg" class="clip" data-start="0" data-duration="${total}" data-track-index="${matteTrack}" src="${esc(matte)}">`
    : tm.segs.map((s, i) => `<video id="m${i}" class="talk" data-face-source="${esc(src)}" data-start="${round3(s.outStart)}" data-duration="${round3(s.outEnd - s.outStart)}" data-media-start="${round3(s.in)}" data-track-index="${matteTrack}"${s.rate !== 1 ? ` data-playback-rate="${round3(s.rate)}"` : ""} src="${esc(matte)}" muted playsinline></video>`).join("\n      ");
  const beauty = beautyOf(cam, projectDir,p);
  const camFrame = `translate:${Number(cam.x) || 0}px ${Number(cam.y) || 0}px;scale:${Number(cam.scale) || 1}`;
  // dời người (cắt thẳng): faceTo / faceToY = tâm mặt tới (tỉ lệ khung ngang / dọc), scale = cỡ so với khung thường
  const camMove = (c) => c && (Number.isFinite(Number(c.faceTo)) || Number.isFinite(Number(c.faceToY)))
    ? { faceTo: Number.isFinite(Number(c.faceTo)) ? Number(c.faceTo) : null, faceToY: Number.isFinite(Number(c.faceToY)) ? Number(c.faceToY) : null, scale: Number(c.scale) || 1 } : null;
  const data = {
    total,
    endCard:p.endCard?.enabled?{start:tm.contentTotal,duration:p.endCard.duration}:null,
    faceY: cam.faceY, faceX: cam.faceX ?? 0.5,
    // vị trí tâm mặt trên màn hình lúc thường (px) — zoom / dời người giữ mặt đúng chỗ khi khung người đã thu / dời (nền thay sau người)
    faceAt: place ? { x: Math.round(Number(place.x ?? 0.5) * W), y: Math.round(Number(place.y ?? 0.5) * H) } : null,
    backdrop: !!bd,
    texts: texts.map((t) => { const anim = textAnimTiming(t.dur, t.anim); return { id: t.id, start: t.start, dur: t.dur, fx: t.fx || "words", ...(anim ? { anim } : {}) }; }),
    zooms: zooms.map((z) => ({ start: z.start, dur: z.dur, amount: Number(z.amount) || 1.08, cut: z.mode === "cut", to: z.mode === "cut" ? camMove(z) : null, board: z.mode === "board" ? { top: Number(z.top) || Math.round(1520 * ky), side: Number(z.side ?? 89), round: Number(z.round ?? 32), face: Number(z.face) || 0 } : null,
      // mode "frame": người thu vào khung giữa (x, y, w, h — px khung xuất), mặt ở `face` (tỉ lệ chiều cao khung), thu / phóng mượt `ease` giây
      frame: z.mode === "frame" ? { x: Number(z.x ?? Math.round(W * 0.21)), y: Number(z.y ?? Math.round(H * 0.19)), w: Number(z.w ?? Math.round(W * 0.58)), h: Number(z.h ?? Math.round(H * 0.56)),
        round: Number(z.round ?? 28), face: Number(z.face ?? 0.36), ease: Number(z.ease ?? 0.6), drift: Number(z.drift) || 1,
        in: ["up", "down", "left", "right", "pan"].includes(z.in) ? z.in : "", out: ["up", "down", "left", "right", "pan", "cut"].includes(z.out) ? z.out : "",
        pan: z.pan ? { x: Number(z.pan.x) || 0, y: Number(z.pan.y) || 0 } : null, panDur: Number(z.panDur) || 0.6 } : null })),
    splits: mergeSplitSpans(brolls),
    scenes: scenes.map((s) => ({ id: s.id, type: s.type, overlay: OVERLAY.has(s.type), start: s.start, dur: s.dur, cues: s.cues, fadeIn: s.fadeIn, fadeOut: s.fadeOut, tIn: s.tIn || "fade" })),
    brolls: brolls.map((b) => ({ id: b.id, start: b.start, dur: b.dur, tIn: b.tIn || "none", ...(b.tInDuration !== undefined ? { tInDuration: brollEntranceDuration(b) } : {}), full: b.mode !== "pip" && b.mode !== "split", cam: camMove(b.cam) })),
    blocks: blocks.map((b) => ({ id: "blk-" + String(b.id).replace(/[^a-zA-Z0-9_-]/g, ""), start: b.start, dur: b.dur, fx: b.fx || "pop", out: b.out || "fade", cues: b.cues,
      blend: /^(multiply|screen|overlay|soft-light|hard-light|lighten|darken|color-dodge|difference)$/.test(b.blend || "") ? b.blend : "",
      // mốc bám theo: [giây gốc, x, y, cỡ, xoay] đổi sang giây tính từ lúc khối hiện, bỏ mốc ngoài khối
      follow: Array.isArray(b.follow) ? b.follow.map((k) => [round3(tm.srcToOut(Number(k[0]) || 0) - b.start), Number(k[1]) || 0, Number(k[2]) || 0, Number(k[3]) || 1, Number(k[4]) || 0]).filter((k) => k[0] >= 0 && k[0] <= b.dur) : null,
      pan: b.pan ? { x: Number(b.pan.x) || 0, y: Number(b.pan.y) || 0 } : null, panDur: Number(b.panDur) || 0.6, anim: cleanAnim(b.anim),
      // dời người nói trong lúc khối hiện (bảng chiếm 2/3 khung → người sang 1/3 còn lại): faceTo = vị trí tâm mặt theo bề ngang (0–1), scale
      cam: camMove(b.cam) })),
    cuts: tm.segs.slice(1).map((sg) => { const seg = p.segments.find((x) => x.id === sg.id) || {}; return { t: round3(sg.outStart), type: seg.tIn || p.transitions.cut, dur: Number(seg.tDur ?? p.transitions.dur) || 0 }; }).filter((c) => c.type && c.type !== "none"),
    caps: caps.map((c, i) => ({ id: c.id, start: c.start, dur: c.dur, first: !!c.first, atCut: !!c.atCut, single: !!c.single, room: Math.round(c.room || 200), n: i, slot: c.slot || 0, segStart: c.segStart || 0, segIdx: c.segIdx || 0, sway: p.captions.sway ?? 1, words: c.words.map((w) => [w.s, w.e]) })),
    capStyle: brand.caption.style,
    capColor: brand.caption.color,
    capActive: brand.caption.active,
    capFill: !!brand.caption.fill,
    capReveal: !!brand.caption.reveal,
    capEnter: brand.caption.enter || "",
    capHideOnScenes: !!p.captions.hideOnScenes,
    flashes,
    matte: !!matte,
    beauty: beauty && beauty.params,
    W, H,
  };

  const fxKinds = new Set(vfx.map((v) => v.type));
  const vfxDefs = (fxKinds.has("rgb") || fxKinds.has("warp") || fxKinds.has("pixel") ? `<svg id="fxDefs" style="position:absolute;width:0;height:0" aria-hidden="true">
      <filter id="fxRgb" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feColorMatrix in="SourceGraphic" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r"/><feOffset id="fxRgbR" in="r" dx="0" dy="0" result="r2"/>
        <feColorMatrix in="SourceGraphic" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g"/>
        <feColorMatrix in="SourceGraphic" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b"/><feOffset id="fxRgbB" in="b" dx="0" dy="0" result="b2"/>
        <feBlend in="r2" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="b2" mode="screen"/>
      </filter>
      <filter id="fxWarp" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feTurbulence id="fxWarpT" type="fractalNoise" baseFrequency="0.006 0.018" numOctaves="2" seed="1" result="n"/>
        <feDisplacementMap id="fxWarpD" in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="fxPix" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feGaussianBlur id="fxPixB" in="SourceGraphic" stdDeviation="3" result="m"/><feFlood id="fxPixF" x="5" y="5" width="1" height="1" flood-color="#000"/><feComposite id="fxPixC" width="10" height="10"/><feTile result="t"/>
        <feComposite in="m" in2="t" operator="in"/><feMorphology id="fxPixM" operator="dilate" radius="5"/>
      </filter>
      <filter id="fxPixP" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
        <feGaussianBlur id="fxPixPB" in="SourceGraphic" stdDeviation="3" result="m"/><feFlood id="fxPixPF" x="5" y="5" width="1" height="1" flood-color="#000"/><feComposite id="fxPixPC" width="10" height="10"/><feTile result="t"/>
        <feComposite in="m" in2="t" operator="in"/><feMorphology id="fxPixPM" operator="dilate" radius="5"/>
        <feComponentTransfer><feFuncR type="discrete" tableValues="0 .16 .32 .48 .62 .76 .88 1"/><feFuncG type="discrete" tableValues="0 .16 .32 .48 .62 .76 .88 1"/><feFuncB type="discrete" tableValues="0 .16 .32 .48 .62 .76 .88 1"/></feComponentTransfer>
      </filter>
    </svg>` : "") + (fxKinds.has("grain") ? `<div id="fxGrain"></div>` : "");
  data.sourceZooms=tm.segs.flatMap((s,i)=>s.motionZoom?[{id:'source-zoom-'+i,start:s.outStart,zoom:normalizeSourceZoom(s.motionZoom)}]:[]);
  data.vfx = vfx.map((v) => ({ ease: /^[\w.()]+$/.test(v.ease || "") ? v.ease : "", type: v.type, start: v.start, dur: v.dur, amount: v.amount, x: Number(v.x) || 0, y: Number(v.y) || 0, s: Number(v.s) || 1, x0: Number(v.x0) || 0, y0: Number(v.y0) || 0, s0: Number(v.s0) || 1, vao: Number(v.vao) || 0.4 }));
  data.dissolves = dissolves.map((d) => ({ id: d.id, start: d.start, dur: d.dur }));
  const css = fs.readFileSync(path.join(LIB, "kit.css"), "utf8");
  const runtime = fs.readFileSync(path.join(LIB, "runtime.js"), "utf8");

  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=${W}, height=${H}">
<title>${esc(p.title || "video")}</title>
<!-- File này được sinh tự động từ project.json. Sửa trong editor, không sửa tay. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fontLinks(brand)}
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
${brandVars(brand)}
${css}${wide ? "\n:root{--W:1920px;--H:1080px}" : ""}
${cleanCss(brand.css)}
</style>
</head>
<body${wide || bd ? ` class="${[wide && "wide", bd && "bdrop"].filter(Boolean).join(" ")}"` : ""}>
  <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}">
    ${zooms.some((z) => z.mode === "board" || z.mode === "frame") ? `<div id="board" style="background:${esc(brand.board || "#1A1A1A")}"></div>` : ""}
    <div id="cam" style="${camStyle}">
      <div id="camFrame" style="${camFrame}">
      ${talk}
      ${dissolveHtml}
      ${freezeHtml}
      </div>
      ${tint}${vig}
    </div>
    ${matte ? `<div id="matte" style="${camStyle}"><div id="matteFrame" style="${camFrame}">${matteHtml}</div></div>` : ""}
    ${brollHtml}
    ${splitLines.join("\n    ")}
    ${sceneHtml}
    ${textHtml}
    ${blockHtml}
    ${capHtml}
    ${vfxDefs}
    <div id="flashLayer"></div>
    <div id="trLayer"></div>
    ${voice}
    ${musicHtml}
    ${sfxHtml}
    ${endCardHtml(p,tm.contentTotal,W,H)}
    ${p.watermark&&!p.watermark.hidden?`<img id="project-watermark" src="${esc(normalizeWatermark(p.watermark).file)}" data-start="0" data-duration="${tm.contentTotal}" data-track-index="${fxTrack+100}" style="${watermarkStyle(p.watermark,W,H)}">`:''}
  </div>
  <script>window.__EDIT__ = ${JSON.stringify(data)};</script>
  <script>
${runtime}
  </script>${beauty ? `
  <!--beauty-->
  <script>window.__FACE = ${beauty.face};</script>
  <script>
${applyPersonMaskEdits.toString()}
${resolvePersonSourceAdjustment.toString()}
${applyPersonSelection.toString()}
${fs.readFileSync(path.join(LIB, "beauty.js"), "utf8")}
  </script>
  <!--/beauty-->` : ""}
</body>
</html>
`;
}

// Làm đẹp (camera.beauty, thang 0–100): cần điểm mặt đã quét ở work/face.json; tất cả về 0 hoặc chưa quét → không chèn gì
const BEAUTY_KEYS = ["smooth", "white", "firm", "lip", "eye", "eyeBright", "slim", "chin", "nose", "bodyWhite", "bodySmooth", "personLight"];
function beautyOf(cam, projectDir,project) {
  const b = cam.beauty;
  if (!b || b.off) return null;
  const params = { lipColor: /^#[0-9a-f]{6}$/i.test(b.lipColor || "") ? b.lipColor : "#d0475a" };
  params.maskShrink=Math.min(1,Math.max(0,(Number(b.maskShrink)||0)/100));
  params.maskStability=Math.min(1,Math.max(0,(Number(b.maskStability)||0)/100));
  params.maskEdits=normalizePersonMaskEdits(b.maskEdits);
  params.sourceAdjustments=normalizePersonSourceAdjustments(b.sourceAdjustments);
  params.personSelections=normalizePersonSelections(b.personSelections);
  for (const k of BEAUTY_KEYS) params[k] = Math.min(1, Math.max(0, (Number(b[k]) || 0) / 100));
  const status=readFaceTracks(projectDir,project);
  if(!status.tracks.length)return null;
  if (!BEAUTY_KEYS.some((k) => params[k] > 0)&&!params.sourceAdjustments.some(v=>v.personLight||v.bodyWhite||v.bodySmooth)&&!status.bodySources) return null;
  return {params,face:JSON.stringify({v:2,tracks:status.tracks}).replace(/</g,'\u003c')};
}

export function buildProject(projectDir, project) {
  const pj = project || JSON.parse(fs.readFileSync(path.join(projectDir, "project.json"), "utf8"));
  const html = buildHtml(pj, projectDir);
  fs.writeFileSync(path.join(projectDir, "index.html"), html);
  return html.length;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = path.resolve(process.argv[2] || ".");
  const n = buildProject(dir);
  console.log(`index.html (${n} bytes) ← ${path.join(dir, "project.json")}`);
}
