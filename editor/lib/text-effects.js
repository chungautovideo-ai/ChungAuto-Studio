// Hiệu ứng chữ kiểu CapCut cho project.texts[]: kiểu chữ (style) + hoạt ảnh Vào / Ra / Lặp (anim).
// Dùng chung cho build.mjs (dựng index.html) và editor UI (inspector). Không có style/anim = hành vi cũ.
// Chuyển động thật nằm trong runtime.js (GSAP timeline, seek được); file này chỉ giữ danh mục + toán thời gian.

export const TEXT_STYLES = [
  { id: "none", label: "Mặc định" },
  { id: "outline", label: "Viền đậm" },
  { id: "shadow", label: "Đổ bóng" },
  { id: "neon", label: "Neon" },
  { id: "box", label: "Nền hộp" },
  { id: "gradient", label: "Chuyển màu" },
  { id: "long-shadow", label: "Bóng 3D" },
];

export const TEXT_ANIMS = {
  in: [
    { id: "fade", label: "Mờ dần" }, { id: "zoom-in", label: "Phóng to" }, { id: "zoom-out", label: "Thu nhỏ" },
    { id: "slide-up", label: "Trượt lên" }, { id: "slide-down", label: "Trượt xuống" }, { id: "slide-left", label: "Trượt trái" },
    { id: "slide-right", label: "Trượt phải" }, { id: "bounce", label: "Bật nảy" }, { id: "type", label: "Đánh máy" },
    { id: "spin", label: "Xoay vào" }, { id: "shake", label: "Lắc" }, { id: "blur", label: "Mờ nét" },
  ],
  out: [
    { id: "fade", label: "Mờ dần" }, { id: "zoom-out", label: "Phóng to ra" }, { id: "shrink", label: "Thu nhỏ" },
    { id: "slide-up", label: "Trượt lên" }, { id: "slide-down", label: "Trượt xuống" }, { id: "slide-left", label: "Trượt trái" },
    { id: "slide-right", label: "Trượt phải" }, { id: "drop", label: "Rơi xuống" }, { id: "blur", label: "Mờ nét" },
  ],
  loop: [
    { id: "pulse", label: "Nhịp tim" }, { id: "wiggle", label: "Lắc lư" }, { id: "blink", label: "Nhấp nháy" },
    { id: "float", label: "Lơ lửng" }, { id: "shake", label: "Rung" },
  ],
};

export const ANIM_DUR = { min: 0.2, max: 2, def: 0.5 };
export const LOOP_SPEED = { min: 0.25, max: 3, def: 1 };
// Hiệu ứng vào mặc định theo fx (words/slide/…) xong muộn nhất ~0,95s (chữ phụ) — vòng lặp bắt đầu sau mốc này.
export const FX_IN_END = 0.95;
const FX_OUT_DUR = 0.26;

const has = (group, id) => TEXT_ANIMS[group].some((a) => a.id === id);
const clamp = (v, lo, hi, def) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : def; };
const r3 = (n) => Math.round(n * 1000) / 1000;

export function textStyleOf(t) {
  return TEXT_STYLES.some((s) => s.id === t?.style && s.id !== "none") ? t.style : "";
}

// Dọn anim từ project.json: bỏ loại lạ, kẹp dur/speed. Trả null khi không có gì.
export function cleanTextAnim(anim) {
  if (!anim || typeof anim !== "object") return null;
  const out = {};
  for (const g of ["in", "out"]) if (has(g, anim[g]?.type)) out[g] = { type: anim[g].type, dur: clamp(anim[g].dur, ANIM_DUR.min, ANIM_DUR.max, ANIM_DUR.def) };
  if (has("loop", anim.loop?.type)) out.loop = { type: anim.loop.type, speed: clamp(anim.loop.speed, LOOP_SPEED.min, LOOP_SPEED.max, LOOP_SPEED.def) };
  return Object.keys(out).length ? out : null;
}

// Mốc thời gian (giây tính từ lúc chữ hiện) cho clip dài `dur`.
// Vào bắt đầu ở 0; Ra kết thúc đúng ở dur; Lặp chạy giữa lúc vào xong và lúc ra bắt đầu.
// Khi vào + ra dài hơn clip thì co cả hai theo tỉ lệ để không chồng nhau.
export function textAnimTiming(dur, anim) {
  const a = cleanTextAnim(anim) || {};
  let inD = a.in ? a.in.dur : 0, outD = a.out ? a.out.dur : 0;
  const room = dur * 0.9;
  if (inD + outD > room) { const k = room / (inD + outD); inD *= k; outD *= k; }
  const res = {};
  if (a.in) res.in = { type: a.in.type, start: 0, dur: r3(inD) };
  if (a.out) res.out = { type: a.out.type, start: r3(dur - outD), dur: r3(outD) };
  if (a.loop) {
    const start = a.in ? inD : Math.min(FX_IN_END, dur / 2);
    const end = a.out ? dur - outD : Math.max(start, dur - FX_OUT_DUR);
    if (end - start > 0.1) res.loop = { type: a.loop.type, start: r3(start), end: r3(end), speed: a.loop.speed };
  }
  return Object.keys(res).length ? res : null;
}

// Tự chọn hiệu ứng Vào/Ra đa dạng cho chữ lớn (texts[]) chưa có anim. Trả [{id, anim}] theo thứ tự thời gian, không sửa texts.
// anim.in thay hiệu ứng vào của fx → chữ có fx riêng (marker/mask/type) chỉ được thêm Ra. anim người dùng đã chọn luôn giữ.
const AUTO_PAIRS = [["slide-up", "fade"], ["zoom-in", "zoom-out"], ["slide-left", "slide-left"], ["blur", "blur"],
  ["bounce", "shrink"], ["slide-right", "drop"], ["zoom-out", "fade"], ["slide-down", "slide-up"]];
const AUTO_OUTS = ["fade", "slide-up", "blur", "shrink"];
const KEEP_FX_IN = new Set(["marker", "mask", "type"]);
export function autoTextAnims(texts) {
  const visible = (texts || []).filter((t) => t && !t.hidden).sort((a, b) => (a.at || 0) - (b.at || 0));
  const hookId = visible[0] && (visible[0].at || 0) < 3 ? visible[0].id : null;
  const out = [];
  let prevIn = null, k = 0, ko = 0;
  for (const t of visible) {
    const own = cleanTextAnim(t.anim);
    if (own) { prevIn = own.in?.type || "fx:" + (t.fx || "words"); continue; }
    const short = (t.dur ?? 2) < 1.5, dIn = short ? 0.3 : 0.45, dOut = short ? 0.25 : 0.35;
    if (KEEP_FX_IN.has(t.fx)) {
      out.push({ id: t.id, anim: { out: { type: AUTO_OUTS[ko++ % AUTO_OUTS.length], dur: dOut } } });
      prevIn = "fx:" + t.fx;
      continue;
    }
    const words = `${t.title || ""} ${t.sub || ""}`;
    let pair = t.id === hookId ? ["zoom-out", "fade"] // hook: chữ to thu về, mạnh ngay khung đầu
      : /đừng|sai|lỗi|cảnh báo|không nên/iu.test(words) ? ["shake", "drop"]
      : /\d|%|giá/iu.test(words) ? ["bounce", "zoom-out"] // số liệu, giá: bật nảy
      : /\?/.test(words) ? ["blur", "fade"] : null;
    if (!pair || pair[0] === prevIn) do pair = AUTO_PAIRS[k++ % AUTO_PAIRS.length]; while (pair[0] === prevIn);
    out.push({ id: t.id, anim: { in: { type: pair[0], dur: dIn }, out: { type: pair[1], dur: dOut } } });
    prevIn = pair[0];
  }
  return out;
}

// Sửa chữ kiểu CapCut: thay đổi ở bảng Văn bản chỉ lan sang các chữ đang chọn cùng (hoặc tất cả khi bấm "Áp cho tất cả").
// Nội dung, thời gian, id, trạng thái ẩn là riêng từng chữ — không bao giờ chép.
const OWN_KEYS = new Set(["id", "label", "title", "sub", "at", "dur", "hidden"]);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function copyKeys(src, targets, keys) {
  for (const t of targets) for (const k of keys) { if (src[k] === undefined) delete t[k]; else t[k] = structuredClone(src[k]); }
}
// Chép các khoá kiểu đã đổi giữa before → after sang targets. Trả danh sách khoá đã chép.
export function spreadTextEdit(before, after, targets) {
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((k) => !OWN_KEYS.has(k) && !same(before[k], after[k]));
  copyKeys(after, targets, keys);
  return keys;
}
// Làm mọi target có cùng kiểu với src (thêm khoá thiếu, xoá khoá src không có).
export function copyTextStyle(src, targets) {
  for (const t of targets) copyKeys(src, [t], [...new Set([...Object.keys(src), ...Object.keys(t)])].filter((k) => !OWN_KEYS.has(k)));
}
