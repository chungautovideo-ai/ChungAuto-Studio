// Video người thật (Google Flow, tiếng Việt) dựng theo mẫu talking-head — dùng làm video xem trước của thư viện.
// Mốc từ: transcript whisper, căn lại theo từng cụm nói (khoảng lặng đo bằng silencedetect) vì whisper lệch sớm.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyTemplate } from "../../../../editor/lib/template.js";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const KIT = path.resolve(DIR, "../../../..");
let p = JSON.parse(fs.readFileSync(path.join(DIR, "project.json"), "utf8"));
const words = JSON.parse(fs.readFileSync(path.join(DIR, "work", "transcript.json"), "utf8")).words;

// [từ đầu, từ cuối, giây bắt đầu nói, giây hết câu]
const PHRASES = [[0, 9, 0.08, 2.15], [10, 17, 2.57, 4.13], [18, 24, 4.35, 5.67], [25, 31, 6.05, 7.32], [32, 40, 7.77, 9.38],
  [41, 43, 10.08, 10.71], [44, 54, 11.03, 13.02], [55, 63, 13.28, 14.71], [64, 68, 15.17, 16.21], [69, 71, 16.57, 17.11], [72, 82, 17.47, 19.45]];
const T = (i) => {
  const [a, b, s, e] = PHRASES.find(([a, b]) => i >= a && i <= b);
  const t0 = words[a].start, t1 = words[b].start;
  return +(s + (t1 > t0 ? (words[i].start - t0) / (t1 - t0) : (i - a) / Math.max(1, b - a)) * (e - s - 0.25)).toFixed(2);
};
const R = (a, b) => Array.from({ length: b - a + 1 }, (_, k) => T(a + k));

// lines = [["pre", "Bạn có thể là", [mốc từng từ]], ["key", "giỏi nhất", mốc]]
function beat({ id, at, dur, lines, panel = "", panelAnim = [], keySize = "" }) {
  const cues = [], anim = [];
  const html = lines.map(([kind, text, ts]) => {
    if (kind === "key") {
      cues.push(ts);
      anim.push({ sel: `.th-key`, from: { opacity: 0, scale: 0.55, y: 30 }, to: { opacity: 1, scale: 1, y: 0 }, cue: cues.length - 1, dur: 0.32, ease: "back.out(2.2)" });
      return `<div class="th-key ${keySize}">${text}</div>`;
    }
    const ws = text.split(" ");
    const cls = `l${cues.length}${kind}`;
    ws.forEach((w, i) => {
      cues.push(ts[Math.min(i, ts.length - 1)]);
      anim.push({ sel: `.${cls} .w:nth-child(${i + 1})`, to: { opacity: 1 }, cue: cues.length - 1, dur: 0.12, ease: "none" });
    });
    return `<div class="th-line ${cls}">${ws.map((w) => `<span class="w">${w}</span>`).join(" ")}</div>`;
  });
  const pc = panelAnim.map((a) => { if (a.t != null) { cues.push(a.t); const { t, ...rest } = a; return { ...rest, cue: cues.length - 1 }; } return a; });
  return { id, at, dur, layer: "front", fx: "fade", out: "fade", sfx: "none", cues,
    html: `<div class="th-beat">${html.join("")}${panel ? `<div class="th-panel-wrap">${panel}</div>` : ""}</div>`,
    anim: [{ sel: ".th-panel", from: { opacity: 0, y: 40, scale: 0.92 }, to: { opacity: 1, y: 0, scale: 1 }, at: 0.05, dur: 0.3, ease: "power3.out" }, ...anim, ...pc] };
}
const stars = (n) => `<div class="th-stars">${[0, 1, 2, 3, 4].map((i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</div>`;
const people = (cls = "") => `<div class="th-panel wide"><div class="th-people">${"<i><b></b></i>".repeat(5)}</div><div class="th-lab"><small>Người biết đến</small><b class="${cls}">0</b></div></div>`;
const chip = { from: { opacity: 0, scale: 0.7 }, to: { opacity: 1, scale: 1 }, dur: 0.25, ease: "back.out(2)" };
const B = [];

B.push(beat({ id: "b1", at: 0, dur: 1.0, lines: [["key", "Làm tốt", T(0)], ["post", "chưa chắc đã", R(2, 4)]], keySize: "sm",
  panel: `<div class="th-panel">${stars(0)}<div class="th-num">0.0</div></div>`,
  panelAnim: [{ sel: ".th-stars i:nth-child(-n+3)", to: { backgroundColor: "#E3C06F" }, t: T(1), dur: 0.3, stagger: 0.12 }, { sel: ".th-num", count: [0, 3.4], dec: 1, t: T(1), dur: 0.6 }] }));
B.push(beat({ id: "b2", at: 1.0, dur: 1.5, lines: [["key", "tự nói", T(5)], ["post", "lên điều gì", R(7, 9)]], keySize: "sm",
  panel: `<div class="th-panel"><div class="th-wave">${Array.from({ length: 11 }, () => "<i></i>").join("")}</div></div>`,
  panelAnim: [{ sel: ".th-wave i", from: { scaleY: 0.25 }, to: { scaleY: 1 }, at: 0.1, dur: 0.25, stagger: 0.04, ease: "sine.inOut" }, { sel: ".th-wave i", to: { scaleY: 0.35 }, at: 0.7, dur: 0.3, stagger: 0.03 }, { sel: ".th-wave i", to: { scaleY: 0.9 }, at: 1.05, dur: 0.25, stagger: 0.03 }] }));
B.push(beat({ id: "b3", at: 2.5, dur: 2.5, lines: [["pre", "Bạn có thể là", R(10, 13)], ["key", "giỏi nhất", T(20)]], keySize: "sm",
  panel: `<div class="th-chips">${["Thợ nước", "Thợ điện", "Nhà thầu"].map((x) => `<div class="th-chip"><span class="ck"></span>${x}<small>★ 5.0</small></div>`).join("")}</div>`,
  panelAnim: [{ sel: ".th-chip", from: { opacity: 0 }, to: { opacity: 0 }, at: 0, dur: 0.01 },
    { sel: ".th-chip:nth-child(1)", ...chip, t: T(14) }, { sel: ".th-chip:nth-child(2)", ...chip, t: T(16) }, { sel: ".th-chip:nth-child(3)", ...chip, t: T(18) }] }));
B.push(beat({ id: "b4", at: 5.0, dur: 1.0, lines: [["pre", "trong khu vực", R(22, 24)]],
  panel: `<div class="th-panel wide"><div class="th-track"><b></b><i></i></div></div>`,
  panelAnim: [{ sel: ".th-track i", from: { left: "8%" }, to: { left: "62%" }, at: 0.1, dur: 0.7, ease: "power2.inOut" }, { sel: ".th-track b", from: { width: "8%" }, to: { width: "62%" }, at: 0.1, dur: 0.7, ease: "power2.inOut" }] }));
B.push(beat({ id: "b5", at: 6.0, dur: 1.6, lines: [["pre", "nhưng nếu", R(25, 26)], ["key", "không ai", T(27)], ["post", "biết đến bạn", R(29, 31)]], keySize: "sm",
  panel: people() }));
B.push(beat({ id: "b6", at: 7.6, dur: 2.0, lines: [["pre", "thì bạn làm", R(32, 34)], ["key", "tốt", T(35)], ["post", "đến đâu cũng vậy thôi", R(36, 40)]],
  panel: `<div class="th-panel">${stars(1)}<div class="th-num">2.4</div></div>`,
  panelAnim: [{ sel: ".th-stars i", to: { backgroundColor: "#E3C06F" }, t: T(35), dur: 0.3, stagger: 0.08 }, { sel: ".th-num", count: [2.4, 5], dec: 1, t: T(35), dur: 0.6 }] }));
// Thẻ vàng phóng ra từ chỗ widget → "Nghĩ mà xem"
B.push({ id: "c1", name: "Thẻ vàng", at: 9.6, dur: 1.25, layer: "front", fx: "none", out: "none", sfx: "whoosh", sfxVol: 0.6, cues: [T(41), T(42), T(43)],
  html: `<div class="th-card gold"><div class="th-bubble"><i></i><i></i><i></i></div><div class="big">Nghĩ</div><div class="sub"><span class="w">mà</span> <span class="w">xem</span></div></div>`,
  anim: [{ sel: ".th-card", from: { clipPath: "inset(66% 14% 22% 14% round 40px)" }, to: { clipPath: "inset(0% 0% 0% 0% round 0px)" }, at: 0, dur: 0.38, ease: "power3.inOut" },
    { sel: ".big,.th-bubble", from: { opacity: 0, y: 30 }, to: { opacity: 1, y: 0 }, at: 0.3, dur: 0.25 },
    { sel: ".sub .w:nth-child(1)", from: { opacity: 0.3 }, to: { opacity: 1 }, cue: 1, dur: 0.1 },
    { sel: ".sub .w:nth-child(2)", from: { opacity: 0.3 }, to: { opacity: 1 }, cue: 2, dur: 0.1 },
    { sel: ".th-card", to: { y: 1920, filter: "blur(8px)" }, at: 1.06, dur: 0.17, ease: "power2.in" }] });
B.push(beat({ id: "b7", at: 10.85, dur: 2.3, lines: [["pre", "Một công ty kém hơn", R(44, 48)], ["key", "nhiều việc", T(51)], ["post", "hơn bạn", R(53, 54)]], keySize: "sm",
  panel: `<div class="th-cmp"><div class="bad"><small>Công ty kém</small><em>ĐƠN NHẬN</em><b class="n1">0</b></div><div><small>Bạn</small><em>ĐƠN NHẬN</em><b class="n2">0</b></div></div>`,
  panelAnim: [{ sel: ".n1", count: [0, 142], t: T(51), dur: 0.9 }, { sel: ".n2", count: [0, 23], t: T(51), dur: 0.9 }] }));
// Thẻ xám: vòng tròn mở ra → lưới người, nhãn "nhiều người"
B.push({ id: "c2", name: "Thẻ xám", at: 13.15, dur: 1.8, layer: "front", fx: "none", out: "none", sfx: "swish", cues: [T(56), T(58), T(60)],
  html: `<div class="th-card gray"><div class="th-grid">${Array.from({ length: 18 }, (_, i) => `<i class="${[3, 8, 13, 17].includes(i) ? "on" : ""}"></i>`).join("")}</div><div class="th-pill">nhiều người</div><div class="note"><span class="w">biết đến</span> <span class="w">dịch vụ của họ</span></div></div>`,
  anim: [{ sel: ".th-card", from: { clipPath: "circle(0% at 50% 50%)" }, to: { clipPath: "circle(75% at 50% 50%)" }, at: 0, dur: 0.4, ease: "power2.inOut" },
    { sel: ".th-grid i", from: { opacity: 0, y: 20 }, to: { opacity: 1, y: 0 }, at: 0.25, dur: 0.2, stagger: 0.015 },
    { sel: ".th-pill", from: { opacity: 0, scale: 0.7 }, to: { opacity: 1, scale: 1 }, cue: 0, dur: 0.25, ease: "back.out(2)" },
    { sel: ".note .w:nth-child(1)", from: { opacity: 0.3 }, to: { opacity: 1 }, cue: 1, dur: 0.1 },
    { sel: ".note .w:nth-child(2)", from: { opacity: 0.3 }, to: { opacity: 1 }, cue: 2, dur: 0.1 },
    { sel: ".th-card", to: { yPercent: -100 }, at: 1.6, dur: 0.2, ease: "power2.in" }] });
B.push(beat({ id: "b8", at: 14.95, dur: 1.5, lines: [["key", "Làm tốt", T(64)], ["post", "rất quan trọng", R(66, 68)]], keySize: "sm",
  panel: `<div class="th-panel">${stars(0)}<div class="th-num">0.0</div></div>`,
  panelAnim: [{ sel: ".th-stars i", to: { backgroundColor: "#E3C06F" }, t: T(65), dur: 0.3, stagger: 0.08 }, { sel: ".th-num", count: [0, 5], dec: 1, t: T(65), dur: 0.7 }] }));
B.push(beat({ id: "b9", at: 16.45, dur: 3.56, lines: [["pre", "nhưng trước hết", R(69, 71)], ["post", "ai cũng phải biết việc tốt của bạn", R(72, 79)], ["key", "tồn tại", T(81)]], keySize: "sm",
  panel: people("n"),
  panelAnim: [{ sel: ".th-people b", to: { opacity: 1 }, t: T(72), dur: 0.2, stagger: 0.3 }, { sel: ".n", count: [0, 1284], sep: ",", t: T(72), dur: 1.9, ease: "power1.out" }] }));

p.blocks = B;
p.captions = { ...(p.captions || {}), enabled: false };
const tpl = JSON.parse(fs.readFileSync(path.join(KIT, "editor", "templates", "talking-head", "template.json"), "utf8"));
p = applyTemplate(p, tpl, { restyle: true });
fs.writeFileSync(path.join(DIR, "project.json"), JSON.stringify(p, null, 2) + "\n");
console.log("blocks", p.blocks.length, "cues", [0, 20, 35, 41, 51, 56, 64, 81].map((i) => `${words[i].word}=${T(i)}`).join(" "));
