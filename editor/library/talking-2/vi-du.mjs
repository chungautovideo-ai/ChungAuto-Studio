// Dựng thử mẫu talking-2 bằng tiếng Việt: người thật Google Flow (4 đoạn 8s: gần · xa · gần · xa), nội dung theo video mẫu.
// Khung xa có thêm zoom cắt (mode "cut") vào mặt → nhịp đổi khung như 2 máy quay của mẫu. Mốc = giây gốc.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyTemplate } from "../../../../editor/lib/template.js";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const KIT = path.resolve(DIR, "../../../..");
const words = JSON.parse(fs.readFileSync(path.join(DIR, "work", "transcript.json"), "utf8")).words;
// [từ đầu, từ cuối, giây bắt đầu nói, giây hết câu] — đo bằng silencedetect (whisper hay dồn mốc)
const PHRASES = [[0, 12, 0.72, 3.43], [13, 22, 4.04, 6.62], [23, 33, 8.62, 11.42], [34, 45, 12.12, 14.86], [46, 54, 16.0, 18.92],
  [55, 60, 19.51, 21.21], [61, 64, 21.61, 23.72], [65, 72, 25.09, 26.55], [73, 88, 27.1, 30.48]];
const T = (i) => {
  const [a, b, s, e] = PHRASES.find(([a, b]) => i >= a && i <= b);
  const t0 = words[a].start, t1 = words[b].start;
  return +(s + (t1 > t0 ? (words[i].start - t0) / (t1 - t0) : (i - a) / Math.max(1, b - a)) * (e - s - 0.25)).toFixed(2);
};
const DUR = 32;
let p = JSON.parse(fs.readFileSync(path.join(DIR, "project.json"), "utf8"));
p.camera = { scale: 1, x: 0, y: 0, faceX: 0.69, faceY: 0.33, matte: fs.existsSync(path.join(DIR, "inputs/matte.webm")) ? "inputs/matte.webm" : "" };
// bỏ khoảng lặng; cắt ở chỗ đổi khung
p.segments = [[0.55, 3.6], [3.95, 6.8], [8.5, 11.55], [11.98, 15.0], [15.98, 19.1], [19.4, 23.85], [24.98, 26.62], [26.95, DUR - 1.35]]
  .map(([a, b], i) => ({ id: `s${i + 1}`, in: a, out: b, keep: true, text: "" }));
// zoom cắt: khung gần giả trong đoạn quay xa (×1.6), nhấn nhẹ trong đoạn quay gần (×1.2)
p.zooms = [[3.95, 6.8, 1.2], [8.5, 11.55, 1.6], [19.4, 23.85, 1.18], [28.85, DUR - 1.35, 1.6]]
  .map(([a, b, z], i) => ({ id: `z${i + 1}`, at: a, dur: +(b - a).toFixed(2), amount: z, mode: "cut" }));

const typeIn = (sel, cue, dur = 0.5, n = 9) => ({ sel, from: { clipPath: "inset(-30% 100% -30% 0%)" }, to: { clipPath: "inset(-30% 0% -30% 0%)" }, cue, dur, ease: `steps(${n})` });
function txt({ id, at, dur, y, lines, extra = "", anim = [], size }) {
  const cues = [], ani = [];
  const html = lines.map(([cls, text, t, d], i) => { cues.push(t); ani.push(typeIn(`.r${i}`, cues.length - 1, d, Math.max(4, Math.round(text.length / 1.4)))); return `<div class="${cls} t2-type r${i}">${text}</div>`; }).join("");
  const more = anim.map((a) => { if (a.t == null) return a; cues.push(a.t); const { t, ...r } = a; return { ...r, cue: cues.length - 1 }; });
  return { id, at, dur, layer: "front", fx: "none", out: "fade", sfx: "none", cues,
    html: `<div class="t2-txt" style="--t2-y:${y}px${size ? `;--t2-size:${size}px` : ""}">${html}${extra}</div>`, anim: [...ani, ...more] };
}
const blk = (o) => ({ layer: "front", fx: "none", out: "fade", sfx: "none", cues: [], anim: [], ...o });
// lục giác quanh đầu, tâm (cx, cy)
const hex = (cx, cy) => { const pt = (x, y) => `${x + cx - 540},${y + cy - 626}`; return `<svg class="t2-hex" viewBox="0 0 1080 1920"><polygon pathLength="1" points="${[[440, 315], [805, 415], [900, 780], [650, 1030], [260, 940], [180, 580]].map(([x, y]) => pt(x, y)).join(" ")}"/><polygon class="glint" pathLength="1" points="${[[440, 315], [805, 415], [900, 780], [650, 1030], [260, 940], [180, 580]].map(([x, y]) => pt(x, y)).join(" ")}"/><path class="dash" d="M${pt(475, 448)} L${pt(710, 510)} L${pt(765, 740)} L${pt(730, 790)}"/><circle cx="${475 + cx - 540}" cy="${448 + cy - 626}" r="6"/><circle cx="${710 + cx - 540}" cy="${510 + cy - 626}" r="6"/><circle cx="${308 + cx - 540}" cy="${618 + cy - 626}" r="6"/></svg>`; };
const ring = (cx, cy) => `<div class="t2-ring" style="left:${cx - 356}px;top:${cy - 356}px;width:712px;height:712px"><svg viewBox="0 0 712 712"><g class="rot" style="transform-origin:356px 356px"><circle class="tk" cx="356" cy="356" r="330" pathLength="360"/><circle class="ln" cx="356" cy="356" r="300"/>${[0, 40, 95, 150, 205, 260, 310].map((a) => `<circle class="dt" cx="${(356 + 345 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(356 + 345 * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="5"/>`).join("")}</g></svg></div>`;
const ICON = `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="56" r="9"/><path d="M33 86c2-11 9-16 17-16s15 5 17 16"/><circle cx="24" cy="62" r="7"/><path d="M10 88c1-8 6-12 13-12"/><circle cx="76" cy="62" r="7"/><path d="M90 88c-1-8-6-12-13-12"/><path d="M50 6l16 6v12c0 10-7 16-16 19-9-3-16-9-16-19V12z" fill="currentColor" fill-opacity=".25"/><path d="M43 24l5 5 9-10"/></svg>`;
const IG = `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#fff"/></svg>`;
const B = [];

// 1) khung gần: "Có những bác sĩ" + lục giác sau đầu + icon + 2 vòng góc đếm tới 3
B.push(txt({ id: "a-txt", at: 0.55, dur: 3.05, y: 880, size: 96, lines: [["t2-ttl", "Có những bác sĩ", T(0), 0.55], ["t2-sub", "xây dựng khán giả chỉ trong 3 năm", T(4), 1.1]] }));
B.push(blk({ id: "a-hex", name: "Lục giác", at: 0.6, dur: 3.0, layer: "behind", cues: [0.65], html: hex(612, 575),
  anim: [{ sel: "polygon", from: { strokeDasharray: "1", strokeDashoffset: 1 }, to: { strokeDashoffset: 0 }, cue: 0, dur: 0.7, ease: "power2.out" },
    { sel: ".glint", from: { strokeDashoffset: 0.1 }, to: { strokeDashoffset: -0.6 }, cue: 0, dur: 3, ease: "none" },
    { sel: ".dash,circle", from: { opacity: 0 }, to: { opacity: 1 }, cue: 0, dur: 0.4, stagger: 0.12 }] }));
B.push(blk({ id: "a-icon", name: "Huy hiệu", at: T(7) - 0.05, dur: 1.0, sfx: "pop", sfxVol: 0.5, cues: [T(7), T(7) + 0.6],
  html: `<div class="t2-icon" style="--t2-iy:1500px">${ICON}</div>`,
  anim: [{ sel: ".t2-icon", from: { opacity: 0, y: 60, scale: 0.7 }, to: { opacity: 1, y: 0, scale: 1 }, cue: 0, dur: 0.28, ease: "back.out(2)" },
    { sel: ".t2-icon", to: { opacity: 0, y: -40 }, cue: 1, dur: 0.35, ease: "power1.in" }] }));
B.push(blk({ id: "a-num", name: "Số góc", at: T(9) - 0.1, dur: 3.6 - T(9) + 0.1, sfx: "whoosh", sfxVol: 0.4, cues: [T(9)],
  html: `<div class="t2-corner tr"><b class="n">1</b></div><div class="t2-corner bl"><b class="n">1</b></div>`,
  anim: [{ sel: ".tr", from: { x: 320, y: -320 }, to: { x: 0, y: 0 }, cue: 0, dur: 0.32, ease: "power3.out" },
    { sel: ".bl", from: { x: -320, y: 320 }, to: { x: 0, y: 0 }, cue: 0, dur: 0.32, ease: "power3.out" },
    { sel: ".n", count: [1, 3], cue: 0, dur: 0.5, ease: "none" }] }));

// 2) nhấn gần: "Còn bạn" + số 20 khối cam
B.push(txt({ id: "b-txt", at: 3.95, dur: 2.85, y: 880, lines: [["t2-ttl", "Còn bạn", T(13), 0.45], ["t2-sub", "xây dựng chuyên môn suốt 20 năm", T(16), 1.0]] }));
B.push(blk({ id: "b-20", name: "Số 3D", at: T(21) - 0.05, dur: 6.8 - T(21) + 0.05, sfx: "boom", sfxVol: 0.35, cues: [T(21)],
  html: `<div class="t2-3d" style="left:30px;top:1180px">20</div>`,
  anim: [{ sel: ".t2-3d", from: { x: -400, opacity: 0 }, to: { x: 0, opacity: 1 }, cue: 0, dur: 0.32, ease: "power3.out" }] }));

// 3) khung gần (zoom từ đoạn xa): vòng tia sáng + bong bóng câu hỏi
B.push(blk({ id: "c-ring", name: "Vòng sáng", at: 8.5, dur: 3.05, layer: "behind", sfx: "shimmer", sfxVol: 0.3, cues: [8.6], html: ring(745, 620),
  anim: [{ sel: ".t2-ring", from: { opacity: 0, scale: 0.86 }, to: { opacity: 1, scale: 1 }, cue: 0, dur: 0.6, ease: "power2.out" },
    { sel: ".rot", from: { rotation: -25 }, to: { rotation: 15 }, cue: 0, dur: 3.05, ease: "none" }] }));
B.push(blk({ id: "c-ask", name: "Câu hỏi", at: 8.55, dur: 3.0, sfx: "pop", sfxVol: 0.45, cues: [8.6, T(23), T(30)],
  html: `<div class="t2-ask" style="--t2-ay:1080px"><div class="q">?</div><div class="l1 t2-type">Tại sao họ lại hiện diện</div><div class="l2 t2-type">online nhiều hơn bạn?</div></div>`,
  anim: [{ sel: ".t2-ask", from: { opacity: 0, scale: 0.6 }, to: { opacity: 1, scale: 1 }, cue: 0, dur: 0.25, ease: "back.out(2)" },
    typeIn(".l1", 1, 1.0, 12), typeIn(".l2", 2, 0.9, 10)] }));

// 4) khung xa: thẻ vòm kính phủ định + ✕
B.push(blk({ id: "d-arch", name: "Thẻ vòm", at: 11.98, dur: 3.02, out: "none", sfx: "boom", sfxVol: 0.3, cues: [12.0, T(34), T(37), T(41), T(43), 14.75],
  html: `<div class="t2-arch" style="--t2-cy:1138px"><div class="s t2-type">Không hẳn vì</div><div class="k t2-type">họ có điều gì</div><div class="s t2-type">quan trọng hơn để nói</div><div class="x"></div></div>`,
  anim: [{ sel: ".t2-arch", from: { y: 820 }, to: { y: 0 }, cue: 0, dur: 0.42, ease: "power3.out" },
    typeIn(".s:nth-child(1)", 1, 0.4, 6), typeIn(".k", 2, 0.5, 8), typeIn(".s:nth-child(3)", 3, 0.6, 12),
    { sel: ".x", from: { opacity: 0, scale: 0.3 }, to: { opacity: 1, scale: 1 }, cue: 4, dur: 0.22, ease: "back.out(2.5)" },
    { sel: ".t2-arch", to: { y: 900 }, cue: 5, dur: 0.25, ease: "power2.in" }] }));

// 5) khung gần: "biết cách xuất hiện"
B.push(txt({ id: "e-txt", at: 15.98, dur: 3.12, y: 890, size: 84, lines: [["t2-sub", "mà có thể vì họ", T(46), 0.5], ["t2-ttl", "biết cách xuất hiện", T(51), 0.6]] }));

// 6) nhấn gần: "Bạn đã có" + viên kính "kinh nghiệm" + vòm thương hiệu
B.push(txt({ id: "f-txt", at: 19.4, dur: 4.45, y: 870, lines: [["t2-ttl", "Bạn đã có", T(55), 0.45], ["t2-sub", "phần khó nhất", T(58), 0.5]],
  extra: `<div class="t2-pill">kinh nghiệm</div>`,
  anim: [{ sel: ".t2-pill", from: { opacity: 0, scale: 0.8 }, to: { opacity: 1, scale: 1 }, t: T(63), dur: 0.3, ease: "back.out(1.8)" }] }));
B.push(blk({ id: "f-brand", name: "Vòm thương hiệu", at: 22.6, dur: 1.25, out: "none", sfx: "whoosh", sfxVol: 0.4, cues: [22.62],
  html: `<div class="t2-brand" style="--t2-by:1426px;--t2-bs:128px"><b>AUTOSOCIAL</b><i></i></div>`,
  anim: [{ sel: ".t2-brand", from: { y: 560 }, to: { y: 0 }, cue: 0, dur: 0.42, ease: "power3.out" }] }));

// 7) khung xa: "Phần còn lại" trên đầu
B.push(txt({ id: "g-txt", at: 24.98, dur: 1.64, y: 230, lines: [["t2-ttl", "Phần còn lại", T(65), 0.5], ["t2-sub", "cứ để chúng tôi lo", T(69), 0.6]], size: 104 }));

// 8) khung xa: nhãn liên hệ + "personal brand" ánh kim trên đầu
B.push(blk({ id: "h-soc", name: "Nhãn liên hệ", at: 26.95, dur: 1.9, sfx: "whoosh", sfxVol: 0.35, cues: [T(73), 28.7],
  html: `<div class="t2-social" style="--t2-sy:1060px">${IG}<span>thuonghieucuaban</span></div>`,
  anim: [{ sel: ".t2-social", from: { clipPath: "inset(40% 46% 40% 46% round 8px)" }, to: { clipPath: "inset(0% 0% 0% 0% round 16px)" }, cue: 0, dur: 0.35, ease: "power3.out" },
    { sel: ".t2-social", to: { clipPath: "inset(40% 46% 40% 46% round 8px)" }, cue: 1, dur: 0.15, ease: "power2.in" }] }));
B.push(blk({ id: "h-metal", name: "Chữ ánh kim", at: T(78), dur: 28.85 - T(78), cues: [T(79), T(81), T(79) + 0.1],
  html: `<div class="t2-frame" style="top:150px"></div><div class="t2-metal" style="--t2-my:150px"><span class="m1">personal</span><span class="m2">brand</span></div>`,
  anim: [{ sel: ".m1", from: { clipPath: "inset(0% 100% 0% 0%)" }, to: { clipPath: "inset(0% 0% 0% 0%)" }, cue: 0, dur: 0.4, ease: "steps(8)" },
    { sel: ".m2", from: { clipPath: "inset(0% 100% 0% 0%)" }, to: { clipPath: "inset(0% 0% 0% 0%)" }, cue: 1, dur: 0.35, ease: "steps(5)" },
    { sel: ".t2-frame", from: { opacity: 0, scale: 1.08 }, to: { opacity: 1, scale: 1 }, cue: 2, dur: 0.3 }] }));

// 9) khung gần (zoom): "xứng tầm" + số 20 kính sau đầu + "năm" viết tay
B.push(txt({ id: "i-txt", at: 28.85, dur: DUR - 1.35 - 28.85, y: 990, lines: [["t2-ttl", "xứng tầm", T(83), 0.45], ["t2-sub", "20 năm của bạn", T(85), 0.5]] }));
B.push(blk({ id: "i-20", name: "Số kính sau người", at: 28.9, dur: DUR - 1.35 - 28.9, layer: "behind", out: "none", sfx: "shimmer", sfxVol: 0.3, cues: [T(84)],
  html: `<div class="t2-big" style="--t2-gy:120px;--t2-gs:800px">20</div>`,
  anim: [{ sel: ".t2-big", from: { opacity: 0, scale: 1.12, filter: "blur(14px)" }, to: { opacity: 1, scale: 1, filter: "blur(0px)" }, cue: 0, dur: 0.45, ease: "power2.out" }] }));
B.push(blk({ id: "i-year", name: "Chữ viết tay", at: 29.4, dur: DUR - 1.35 - 29.4, out: "none", cues: [T(86)],
  html: `<div class="t2-hand" style="--t2-hy:150px">năm</div>`,
  anim: [{ sel: ".t2-hand", from: { clipPath: "inset(-20% 100% -20% 0%)" }, to: { clipPath: "inset(-20% 0% -20% 0%)" }, cue: 0, dur: 0.6, ease: "power1.inOut" }] }));

p.blocks = B;
p.captions = { enabled: false, lines: [] };
const tpl = JSON.parse(fs.readFileSync(path.join(KIT, "editor", "templates", "talking-2", "template.json"), "utf8"));
p = applyTemplate(p, tpl, { restyle: true });
p.audio = { ...p.audio, voice: 1, music: "kit:ambient-pad", musicVolume: 0.05, autoSfx: false };
fs.writeFileSync(path.join(DIR, "project.json"), JSON.stringify(p, null, 2) + "\n");
console.log("blocks", B.length, "segments", p.segments.length, "zooms", p.zooms.length, "matte", p.camera.matte || "(chưa có)");
