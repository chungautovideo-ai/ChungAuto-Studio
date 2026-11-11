import {componentTab,componentEntries,componentSelected} from '/lib/component-list.js';
import {describeRender} from '/ui/render-status.js';
import {snapTo,splitSpan,trimSpan,packRows,encodeWav} from '/lib/timeline-ops.js';
import {applyColorNormalization,restoreColorNormalization} from '/lib/color-management.js';
import {primarySpeechWindows} from '/lib/primary-speech.js';
import {normalizePersonMaskEdits} from '/lib/person-mask-edits.js';
import {normalizePersonSourceAdjustments,resolvePersonSourceAdjustment} from '/lib/person-source-adjustments.js';
import {suggestPersonExposure} from '/lib/person-exposure.js';
import {normalizePersonSelections,mergePersonSelection} from '/lib/person-selection.js';
import {openPersonMaskDialog} from '/ui/contentos-person-mask.js';
import {openPersonSelectionDialog} from '/ui/contentos-person-selection.js';
import {precisionRangeControl} from '/ui/contentos-precision-range.js';
import {personCoverageControls} from '/ui/contentos-person-coverage.js';
import {endCardControls} from '/ui/contentos-end-card.js';
import {featurePointerControls} from '/ui/contentos-feature-pointer.js';
import {primaryPrivacyRequest,applyPrimaryPrivacy,restorePrimaryPrivacy,applyBrollPrivacy,restoreBrollPrivacy} from '/lib/primary-privacy.js';
import {textAppearanceControls} from '/ui/contentos-text-appearance.js';
import {textEffectsControls} from '/ui/contentos-text-effects.js';
import {spreadTextEdit,copyTextStyle} from '/lib/text-effects.js';
import {reorderPrimaryClips} from '/lib/primary-sequence.js';
import {coverFromAievImage} from '/lib/cover-composition.js';
import {sourceRangePreview} from '/ui/contentos-source-range-preview.js';
import {trimSourceSegment} from '/lib/segment-trim.js';
import {appendPrimaryClips} from '/lib/primary-clips.js';
import {sourceTranscriptMatches} from '/lib/source-transcript.js';
import {pinSourceAudioEnvelope,shiftSourceAudioEnvelope} from '/lib/source-audio.js';
import {normalizeSourceZoom,shiftSegmentZoom} from '/lib/source-zoom.js';
import {SOURCE_COLOR_PRESETS,SOURCE_COLOR_RANGES} from '/lib/source-color.js';
import {jobBrandControls} from '/ui/contentos-job-brand.js';
import {musicRegionControls} from '/ui/contentos-music-regions.js';
import {creativeBriefControls} from '/ui/contentos-creative-brief.js';
import {jobTemplateVersion} from '/ui/contentos-template-version.js';
import {runModelPicker} from '/ui/contentos-model-picker.js';
import {newsProjectContext} from '/ui/contentos-news-context.js';
import { makeTimemap, round3 } from "/lib/timemap.js";
import {planBrollAssembly} from '/lib/broll-assembly.js';
import {narrationCaptionWords} from '/lib/narration-captions.js';
import {readNarrationResponse} from '/ui/contentos-narration-stream.js';
import { applyTemplate } from "/lib/template.js";
import { textAppearanceStyle, textTypographyStyle, fontLinks, fontVariants, WORD_FX, FONTS, BRAND_DEFAULT, CAPTION_STYLES, COLOR_PRESETS, COLOR_NEUTRAL, SKIN_PRESETS, mixColor, CUT_TRANSITIONS, ENTER_TRANSITIONS, VFX_TYPES, groupCaptionLines, retimeLine } from "/lib/brand.js";

const $ = (s, r = document) => r.querySelector(s);
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "html") el.innerHTML = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
};
// Icon kèm chữ trên nút (dùng bộ ICON của timeline) — chỉ để nhận ra nhanh chỗ bấm, không thay chữ
const ico = (name) => h("span", { class: "ico", "aria-hidden": "true", html: ICON[name] });
const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const fmt = (t) => {
  t = Math.max(0, t || 0);
  const m = Math.floor(t / 60), s = t - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const uid = (p, list) => {
  let i = list.length + 1;
  while (list.some((x) => x.id === `${p}${i}`)) i++;
  return `${p}${i}`;
};

const FX = [
  ["words", "Hiện từng từ"], ["slide", "Trượt ngắn"], ["mask", "Reveal mask"], ["marker", "Marker nhấn từ"], ["type", "Gõ chữ"],
];
const SCENE_TYPES = [
  ["process", "Quy trình"], ["stat", "Số liệu"], ["compare", "Trước – sau"], ["timeline", "Thời gian"], ["doc", "Tài liệu"],
  ["chips", "Thẻ liệt kê (đè lên video)"], ["logo", "Thẻ thương hiệu (cuối video)"],
];
// Bản thu CC0 (editor/assets/sfx) — xếp theo nhóm để dễ chọn
const SFX = [
  ["pop", "Bật · Pop"], ["pop-2", "Bật · Pop tròn"], ["pop-soft", "Bật · Pop nhẹ"], ["glass-pop", "Bật · Pop giọt nước"], ["bubble", "Bật · Bong bóng"], ["plop", "Bật · Plop"],
  ["tap", "Bật · Tap"], ["drop", "Bật · Giọt rơi"], ["bong", "Bật · Bong"], ["blip", "Bật · Blip"], ["select", "Bật · Chọn"],
  ["click", "Bấm · Click"], ["toggle", "Bấm · Bật tắt"], ["switch", "Bấm · Công tắc"], ["open", "Bấm · Mở ra"], ["close", "Bấm · Đóng lại"], ["scroll", "Bấm · Cuộn"],
  ["keys", "Bấm · Gõ phím (ngắn)"], ["typing", "Bấm · Gõ phím (dài)"], ["keystroke", "Bấm · Gõ 1 phím"], ["shutter", "Bấm · Chụp ảnh"],
  ["tick", "Tích · Tick"], ["mau-tick", "Tích · Tích nhỏ (chữ sáng)"], ["mau-tick-2", "Tích · Tích cao"],
  ["whoosh", "Lướt · Whoosh (vút)"], ["whoosh-2", "Lướt · Whoosh mạnh"], ["soft-whoosh", "Lướt · Whoosh nhẹ (chuyển cảnh)"], ["swish", "Lướt · Swish ngắn"], ["swish-2", "Lướt · Swish 2"],
  ["silk-swish", "Lướt · Phất vải"], ["card-slide", "Lướt · Trượt thẻ"], ["knife", "Lướt · Lướt kim loại"], ["blade", "Lướt · Rút kiếm"], ["downlift", "Lướt · Chậm lại (slow-mo)"],
  ["paper", "Giấy · Sột soạt"], ["page-flip", "Giấy · Lật trang"], ["page-turn", "Giấy · Lật trang sách"], ["book-close", "Giấy · Gập sách"],
  ["ping", "Chuông · Ping ly"], ["crystal-ting", "Chuông · Ting pha lê"], ["mau-ding", "Chuông · Ding"], ["chime", "Chuông · Chime"], ["lux-chime", "Chuông · Chime ấm"],
  ["soft-bell", "Chuông · Chuông dịu"], ["bell-ding", "Chuông · Chuông bàn"], ["ding-deep", "Chuông · Ding trầm"], ["chimes", "Chuông · Chuông gió"], ["kalimba", "Chuông · Kalimba 2 nốt"],
  ["confirm", "Chuông · Đúng / xác nhận"], ["question", "Chuông · Câu hỏi"], ["error", "Chuông · Sai / lỗi"], ["negative", "Chuông · Sai (trầm)"],
  ["bell", "Chuông · Chuông lớn"], ["gong", "Chuông · Cồng"], ["level-up", "Chuông · Lên cấp"],
  ["sparkle", "Lấp lánh · Sparkle"], ["shimmer", "Lấp lánh · Shimmer"], ["airy-sparkle", "Lấp lánh · Vang nhẹ"], ["magic", "Lấp lánh · Phép thuật"],
  ["magic-2", "Lấp lánh · Phép thuật 2"], ["magic-3", "Lấp lánh · Phép thuật 3"], ["spell", "Lấp lánh · Tia phép"], ["gem", "Lấp lánh · Viên ngọc"],
  ["coin", "Lấp lánh · Tiền xu"], ["coins", "Lấp lánh · Túi xu"],
  ["riser", "Dâng · Riser (dâng lên)"], ["reveal-swell", "Dâng · Dâng → chuông"], ["mau-swell", "Dâng · Ầm dâng (đổi bảng)"], ["power-up", "Dâng · Tăng sức"], ["mystery", "Dâng · Bí ẩn (hồi hộp)"],
  ["mau-knock", "Nhấn · Gõ gỗ nhẹ"], ["wood", "Nhấn · Gõ gỗ mạnh"], ["metal", "Nhấn · Gõ kim loại"], ["glass-hit", "Nhấn · Chạm kính"], ["glass-break", "Nhấn · Vỡ kính"],
  ["thud", "Nhấn · Thịch mềm"], ["slam", "Nhấn · Đập bàn"], ["mau-hit", "Nhấn · Thịch"], ["deep-hit", "Nhấn · Đấm trầm"], ["boom", "Nhấn · Boom (dội)"],
  ["impact-boom", "Nhấn · Nổ trầm"], ["explosion", "Nhấn · Nổ"],
  ["glitch", "Số · Glitch (nhiễu)"], ["zap", "Số · Zap điện"], ["laser", "Số · Laser"], ["dice", "Khác · Xúc xắc"], ["spring", "Khác · Lò xo (vui)"],
  ["zoom-in", "Camera · Zoom vào"], ["zoom-out", "Camera · Zoom ra"], ["shutter-2", "Camera · Chụp (cơ)"], ["beep", "Đếm · Bíp"], ["countdown", "Đếm · Đếm ngược 3-2-1"], ["clock-spin", "Đếm · Vặn núm"], ["applause", "Người · Vỗ tay"], ["heartbeat", "Người · Nhịp tim"], ["scan", "Số · Quét dữ liệu"], ["compute", "Số · Máy tính chạy"], ["glitch-2", "Số · Nhiễu ngắn"], ["static", "Số · Nhiễu sóng"], ["power-down", "Số · Tắt nguồn"], ["data-blip", "Số · Bíp dữ liệu"], ["vinyl", "Phim · Đĩa than"], ["rewind", "Phim · Tua lại"], ["water-drop", "Nước · Giọt nước"], ["splash", "Nước · Bắn nước"], ["bubble-2", "Nước · Bọt nước"], ["glass-clink", "Nhấn · Cụng ly"], ["metal-hit", "Nhấn · Va kim loại"], ["stomp", "Nhấn · Dậm"], ["rock-hit", "Nhấn · Va đá"], ["lock", "Máy · Khoá"], ["unlock", "Máy · Mở khoá"], ["latch", "Máy · Chốt"], ["machine", "Máy · Máy chạy"], ["door-scifi", "Máy · Cửa viễn tưởng"], ["chain", "Máy · Xích"], ["crumple", "Giấy · Vò giấy"], ["scissors", "Giấy · Kéo cắt"], ["snip", "Giấy · Cắt nhanh"], ["paper-slide", "Giấy · Trượt giấy"], ["staple", "Giấy · Bấm ghim"], ["typewriter", "Viết · Máy đánh chữ"], ["typewriter-2", "Viết · Máy đánh chữ 2"], ["pencil", "Viết · Bút chì"], ["chalk", "Viết · Phấn bảng"], ["erase", "Viết · Tẩy"], ["hum", "Viễn tưởng · Ù nền"], ["force-field", "Viễn tưởng · Lá chắn"], ["laser-2", "Viễn tưởng · Laser cổ"], ["rollover", "Bấm · Rê chuột"], ["maximize", "Bấm · Phóng to cửa sổ"], ["minimize", "Bấm · Thu nhỏ cửa sổ"], ["back", "Bấm · Quay lại"]];
// Tốc độ phát (video tăng tốc ngắn lại, giọng giữ nguyên độ cao)
// Kho "hay dùng" từ NAS (server /api/kit-sfx): mỗi nhóm thành một mục "Hay dùng: <nhóm>" trong Kho hiệu ứng
setTimeout(()=>editorFetch('/api/kit-sfx').then(r=>r.ok?r.json():{}).then(lib=>{for(const [id,m] of Object.entries(lib||{}))if(!SFX.some(x=>x[0]===id))SFX.push([id,'Hay dùng: '+m.group+' · '+m.title]);}).catch(()=>{}),0);
const SPEEDS = [["0.75", "0.75x (chậm)"], ["1", "1x (bình thường)"], ["1.1", "1.1x"], ["1.2", "1.2x"], ["1.25", "1.25x"], ["1.5", "1.5x"], ["1.75", "1.75x"], ["2", "2x"], ["3", "3x"]];
// Chọn âm thanh + âm lượng + nghe thử cho 1 mục (chữ, zoom, cảnh minh hoạ, cảnh trám)
function sfxFields(it, autoLabel, autoKind) {
  const auto = autoLabel ? [["", autoLabel]] : [];
  const s = sel(it, "sfx", [...auto, ...SFX, ["none", "Không"]], autoLabel ? "" : "none");
  const play = h("button", { class: "outline small", title: "Nghe thử", onclick: () => {
    const kind = it.sfx && it.sfx !== "none" ? it.sfx : autoKind;
    if (!kind) return toast("Chưa chọn âm thanh");
    const a = new Audio(`/kit-sfx/${kind}.wav`);
    a.volume = Math.min(1, (it.sfxVol ?? 1) * (P().audio?.sfxVolume ?? 0.5));
    a.play().catch(() => {});
  } }, "▶ Nghe thử");
  return h("div", {},
    h("div", { class: "row", style: "align-items:end" }, field("Âm thanh", s), field("", play)),
    field("Âm lượng âm thanh này", slider(it, "sfxVol", 0, 1.5, 0.05, 1)));
}
// Kho tiếng hiệu ứng (tab Âm thanh): thẻ theo nhóm — bấm nghe thử · kéo thả xuống timeline · bấm đúp = thêm tại playhead
function playSfx(kind) {
  stopAudioAudition();
  const a = new Audio(`/kit-sfx/${kind}.wav`);
  audioAudition=a;
  a.volume = Math.min(1, P().audio?.sfxVolume ?? 0.5);
  a.play().catch(() => {});
}
function addSfxAt(kind, outT) {
  const a = (P().audio = P().audio || {}), list = (a.sfx = a.sfx || []);
  snapshot(); list.push({ at: round3(S.tm.outToSrc(clamp(outT, 0, S.tm.total))), kind });
  changed(); renderList();
  toast(`Đã thêm “${(SFX.find((x) => x[0] === kind) || [, kind])[1]}” lúc ${fmt(outT)}.`);
}
function sfxLibrary() {
  const groups = [...new Set(SFX.map(([, l]) => l.split(" · ")[0]))];
  const box = h("div", { style: "margin-top:14px" });
  const grid = h("div", { style: "display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:6px;margin-top:8px;max-height:300px;overflow:auto;padding-right:4px" });
  const q = h("input", { placeholder: "Tìm tiếng (pop, whoosh, chuông…)", value: S.sfxQ || "" });
  const chips = h("div", { class: "chips", style: "margin-top:8px" });
  const draw = () => {
    const g = S.sfxGroup || "", k = (S.sfxQ || "").trim().toLowerCase();
    chips.replaceChildren(...["", ...groups].map((x) => h("button", { class: `chip ${g === x ? "on" : ""}`, onclick: () => { S.sfxGroup = x; draw(); } }, x || "Tất cả")));
    const items = SFX.filter(([id, l]) => (!g || l.startsWith(g + " · ")) && (!k || (id + " " + l).toLowerCase().includes(k)));
    grid.replaceChildren(...items.map(([id, l]) => h("div", {
      class: "card", title: "Bấm: nghe thử · Kéo thả xuống timeline: thêm đúng chỗ · Bấm đúp: thêm tại playhead",
      style: "padding:8px 10px;cursor:grab;display:flex;align-items:center;gap:8px;min-height:0",
      draggable: "true",
      ondragstart: (e) => { e.dataTransfer.setData("text/vek-sfx", id); e.dataTransfer.effectAllowed = "copy"; document.body.classList.add("dragging-preset"); },
      ondragend: () => { document.body.classList.remove("dragging-preset"); tlDropLine(null); },
      onclick: () => playSfx(id),
      ondblclick: () => addSfxAt(id, S.time),
    }, h("span", { style: "opacity:.7" }, "▶"), h("span", { style: "font-size:12px;line-height:1.25" }, l.split(" · ").slice(1).join(" · ") || l))));
    if (!items.length) grid.append(h("div", { class: "muted" }, "Không có tiếng nào khớp."));
  };
  q.addEventListener("input", () => { S.sfxQ = q.value; draw(); });
  draw();
  box.append(h("div", { class: "field" }, h("label", {}, "Kho tiếng hiệu ứng — kéo thả xuống timeline"), h("div", { class: "help" }, "Bấm để nghe thử · kéo thả xuống timeline để thêm đúng chỗ · bấm đúp để thêm tại playhead.")),
    q, chips, grid, h("hr", { class: "sep" }));
  return box;
}
const TABS = [
  { key: "texts", label: "Chữ", kind: "text" },
  { key: "captions", label: "Phụ đề", kind: "cap" },
  { key: "segments", label: "Cắt", kind: "seg" },
  { key: "zooms", label: "Zoom", kind: "zoom" },
  { key: "scenes", label: "Minh hoạ", kind: "scene" },
  { key: "brolls", label: "Cảnh trám", kind: "broll" },
  { key: "blocks", label: "Đồ hoạ", kind: "block" },
  { key: "audio", label: "Âm thanh" },
  { key: "camera", label: "Cắt khung" },
  { key: "filters", label: "Bộ lọc" },
  { key: "skin", label: "Màu da" },
  { key: "beauty", label: "Làm đẹp" },
  { key: "adjust", label: "Điều chỉnh" },
  { key: "vfx", label: "Hiệu ứng hình" },
  { key: "kho-chu", label: "Văn bản" },
  { key: "kho-dohoa", label: "Đồ hoạ" },
  { key: "kho-canhtram", label: "Cảnh trám" },
  { key: "brand", label: "Thương hiệu" },
];
// Thanh tab trên cùng (kiểu CapCut): nhiều mục gom vào 1 tab, chọn mục con ở menu bên trái của bảng chỉnh
const GROUPS = [
  { key: "text", label: "Văn bản", icon: "texts", tabs: ["texts", "captions", "segments"] },
  ...TABS.filter((t) => !["texts", "captions", "segments", "filters", "skin", "beauty", "adjust", "vfx", "camera"].includes(t.key) && !t.key.startsWith("kho-")).map((t) => ({ key: t.key, label: t.label, icon: t.key, tabs: [t.key] })),
];
// tab chỉ hiện khi cần: Minh hoạ (cảnh nền đen của mẫu cũ) trùng vai trò Cảnh trám / Đồ hoạ
const groupVisible = (g) => g.key !== "scenes" || itemsOf("scenes").length > 0;
// Bộ lọc màu (kiểu CapCut): đặt ngay sau Khung hình
GROUPS.splice(GROUPS.findIndex((g) => g.key === "audio") + 1, 0, { key: "color", label: "Bộ lọc", icon: "filters", tabs: ["filters", "skin", "beauty", "adjust", "vfx", "camera"] });
GROUPS.push({ key: "kho", label: "Kho của tôi", icon: "kho", tabs: ["kho-chu", "kho-dohoa", "kho-canhtram"] });
const groupOf = (tab) => GROUPS.find((g) => g.tabs.includes(tab));
const lastSub = {};
const AUDIO_GROUPS = [["music","Nhạc nền"],["voice","Giọng nói"],["sfx","Hiệu ứng"],["mix","Trộn âm"]];
let audioGroup="music";
let audioAudition=null;
function stopAudioAudition(){if(audioAudition){audioAudition.pause();audioAudition.removeAttribute("src");audioAudition.load();audioAudition=null;}}

const S = {
  project: null, media: [], name: "", tab: "texts", selId: null, time: 0, playing: false,
  undo: [], redo: [], groupOpen: false, dirty: false, ver: 0, tm: null, job: null,
};
let player = $("#player");

// ---------- Dữ liệu ----------
function P() { return S.project; }
function recalc() { S.tm = makeTimemap(P()); }
function itemsOf(key) {
  if (key === "captions") { const c = (P().captions = P().captions || {}); return c.lines || (c.lines = []); }
  return P()[key] || (P()[key] = []);
}
function selected() {
  const key = S.selKind || S.tab, tab = TABS.find((t) => t.key === key);
  if (!tab?.kind) return null;
  return itemsOf(key).find((x) => x.id === S.selId) || null;
}
// Khối chữ từ thẻ mẫu (group "chu") thuộc tab Văn bản → Chữ, dù dữ liệu nằm trong blocks
const tabOfItem = componentTab;
function focusItem(it, key) {
  const tab = tabOfItem(it, key);
  if (S.tab !== tab) { S.tab = tab; S.part = null; renderTabs(); }
  S.selKind = tab !== key ? key : null;
  S.selId = it.id;
}
function outStart(it) { return it.words ? Math.max(0, lineTimes(it).o) : S.tm.srcToOut(it.at || 0); }
function setOutStart(it, o) { it.at = round3(S.tm.outToSrc(clamp(o, 0, S.tm.total))); }

// Gom các thay đổi liên tiếp (gõ phím, kéo) thành 1 bước hoàn tác.
let groupTimer;
function snapshot() {
  if (!S.groupOpen) {
    S.undo.push(JSON.stringify(P()));
    if (S.undo.length > 200) S.undo.shift();
    S.redo = [];
    S.groupOpen = true;
  }
  clearTimeout(groupTimer);
  groupTimer = setTimeout(() => (S.groupOpen = false), 700);
}
// list: false khi đang gõ trong 1 ô của danh sách (vẽ lại danh sách sẽ làm mất con trỏ)
function changed({ reload = true, inspector = false, list = true } = {}) {
  spreadText();
  S.dirty = true;
  recalc();
  renderStatus();
  renderTabs();
  if (list && TABS.find((t) => t.key === S.tab)?.kind) renderList();
  renderTimeline();
  if (inspector) renderInspector();
  scheduleBuild(reload);
}
function undo() {
  if (!S.undo.length) return;
  S.redo.push(JSON.stringify(P()));
  S.project = JSON.parse(S.undo.pop());
  S.groupOpen = false;
  changed({ inspector: true });
  if(!TABS.find(t=>t.key===S.tab)?.kind)renderList();
}
function redo() {
  if (!S.redo.length) return;
  S.undo.push(JSON.stringify(P()));
  S.project = JSON.parse(S.redo.pop());
  S.groupOpen = false;
  changed({ inspector: true });
  if(!TABS.find(t=>t.key===S.tab)?.kind)renderList();
}

// ---------- Server ----------
let projectWriteQueue=Promise.resolve();
function api(path,method='GET',body) {
  const frozen=body===undefined?undefined:structuredClone(body);
  if(method==='GET')return apiRequest(path,method,frozen);
  const result=projectWriteQueue.then(()=>apiRequest(path,method,frozen));
  projectWriteQueue=result.catch(()=>{});
  return result;
}
function showProjectConflict(message) {
  S.conflict=true;
  if(document.querySelector('#projectConflict'))return;
  const dialog=h('dialog',{id:'projectConflict','aria-label':'Xung đột bản dựng',style:'max-width:560px;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:16px;padding:24px'},
    h('h2',{},'Bản dựng đã thay đổi'),h('p',{},message),h('p',{},'Chỉnh sửa trong cửa sổ này vẫn được giữ. Tải bản chỉnh sửa xuống để đối chiếu trước khi nạp lại dự án.'),
    h('button',{class:'primary',onclick:()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(P(),null,2)],{type:'application/json'}));const a=h('a',{href:url,download:'contentos-chinh-sua-chua-luu.json'});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}},'Tải chỉnh sửa đang giữ'),
    h('button',{onclick:()=>location.reload()},'Nạp lại dự án'),h('button',{onclick:()=>{dialog.close();dialog.remove();}},'Quay lại xem'));
  document.body.append(dialog);dialog.showModal();
}
async function editorFetch(url,options={}) {
  const requestRevision=S.revision,requestDir=S.dir;
  const opts={...options,headers:new Headers(options.headers)};
  if(S.dir)opts.headers.set('X-ContentOS-Project',S.dir);
  if(S.revision)opts.headers.set('X-ContentOS-Revision',S.revision);
  const r=await fetch(url,opts);
  const contextCurrent=S.dir===requestDir&&S.revision===requestRevision;
  const revision=r.headers.get('X-ContentOS-Revision');if(revision&&contextCurrent)S.revision=revision;
  if(r.status===409&&contextCurrent){const j=await r.clone().json().catch(()=>({}));if(j.code==='PROJECT_REVISION_CONFLICT'||j.code==='PROJECT_CONTEXT_CONFLICT')showProjectConflict(j.error);}
  return r;
}
async function apiRequest(path, method = "GET", body) {
  if(S.conflict&&method!=='GET')throw new Error('Có xung đột bản dựng. Tải chỉnh sửa đang giữ rồi nạp lại dự án trước khi lưu/giao AI/xuất.');
  const opts = { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined };
  if (S.dir) opts.headers['X-ContentOS-Project'] = S.dir;
  let r;
  for (let i = 0; !r; i++) { // phần mềm vừa khởi động lại: thử lại vài giây trước khi báo lỗi
    try { r = await editorFetch(path, opts); }
    catch {
      if (i >= 2) throw new Error("Mất kết nối với phần mềm trên máy. Bấm đúp biểu tượng AutoSocial (hoặc Mo-Editor) để mở lại rồi thử lại.");
      await new Promise((ok) => setTimeout(ok, 1500));
    }
  }
  const j = await r.json();
  if (!r.ok || j.ok === false) throw new Error(j.error || r.statusText);
  return j;
}
let buildTimer, buildReload = false;
function scheduleBuild(reload) {
  buildReload = buildReload || reload;
  clearTimeout(buildTimer);
  S.buildQueued = true;
  buildTimer = setTimeout(async () => {
    S.buildQueued = false;
    const rl = buildReload;
    buildReload = false;
    try {
      S.buildPending = true;
      await api("/api/build", "POST", P());
      S.buildPending = false;
      flushThumbs();
      if (rl) reloadPlayer();
    } catch (e) { S.buildPending = false; toast("Lỗi dựng: " + e.message, true); }
  }, 450);
}

// ---------- Ảnh thẻ "sống": dựng bằng đúng markup + CSS của video (Shadow DOM) ----------
// Thẻ luôn giống cảnh xuất ra; chỉ tải lại khi nội dung mục đó hoặc brand đổi.
S.thumbs = new Map();
const hashStr = (str) => { let x = 5381; for (let i = 0; i < str.length; i++) x = ((x << 5) + x + str.charCodeAt(i)) | 0; return (x >>> 0).toString(36); };
function liveThumb(kind, it) {
  const ver = hashStr(JSON.stringify(it) + JSON.stringify(P().brand || {}));
  const key = `${kind}:${it.id}`;
  let c = S.thumbs.get(key);
  if (!c) {
    c = { el: h("div", { class: "thumb live" }), host: h("div", { class: "live-host" }), ver: null };
    c.root = c.host.attachShadow({ mode: "open" });
    c.el.append(c.host);
    S.thumbs.set(key, c);
  }
  c.kind = kind;
  c.id = it.id;
  if (c.ver !== ver) { c.ver = ver; setTimeout(() => flushThumbs(false), 0); }
  return c.el;
}
const loadedFonts = new Set();
// Tải lại các thẻ đã đổi. Nếu đang chờ dựng lại thì đợi bản dựng xong (server mới có dữ liệu mới).
function flushThumbs(afterBuild = true) {
  if (!afterBuild && (S.buildQueued || S.buildPending)) return;
  for (const c of S.thumbs.values()) {
    if (c.loaded === c.ver) continue;
    const { kind, id, ver } = c;
    c.loaded = ver;
    editorFetch(`/api/preview?kind=${kind}&id=${encodeURIComponent(id)}&format=json&v=${ver}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j || c.ver !== ver) return;
        for (const href of j.fonts || []) {
          if (loadedFonts.has(href)) continue;
          loadedFonts.add(href);
          document.head.append(h("link", { rel: "stylesheet", href }));
        }
        c.root.innerHTML = `<style>${j.style}</style>${j.body}`;
      })
      .catch(() => {});
  }
}
// Tỷ lệ thu nhỏ khung 1080×1920 vừa với chiều rộng thẻ.
new ResizeObserver(() => {
  const t = document.querySelector("#list .thumb");
  if (t) $("#list").style.setProperty("--k", t.clientWidth / 1080);
}).observe($("#list"));
const fileName = (f) => String(f || "").split(/[\\/]/).pop();
function showProjectFile() {
  $("#projName").title = S.projectFile ? "File dự án: " + S.projectFile : "";
  document.title = `${S.projectFile ? fileName(S.projectFile) : S.name} · Video Editor`;
}
async function save() {
  try {
    const r = await api("/api/project", "PUT", P());
    S.dirty = false;
    renderStatus();
    if (r.projectFileError) toast(r.projectFileError, true);
    else toast(r.projectFile ? "Đã lưu " + fileName(r.projectFile) : "Đã lưu dự án");
    if(P().segments.some(s=>s.src))loadSourceTimelines();
    return true;
  } catch (e) { toast("Lỗi lưu: " + e.message, true); return false; }
}
// Lưu thành… file .cosproj (hộp Lưu của Windows); từ đó Lưu (Ctrl+S) cập nhật luôn file này
async function saveAs() {
  try {
    const r = await api("/api/project-file/save-as", "POST", { project: P() });
    if (r.cancelled) return;
    S.dirty = false; renderStatus();
    S.projectFile = r.file; showProjectFile();
    toast("Đã lưu dự án thành " + fileName(r.file));
  } catch (e) { toast("Lỗi lưu: " + e.message, true); }
}
async function openProjectFileMenu() {
  const { openProjectFile, askUnsaved } = await import("/ui/contentos-project-file.js");
  await openProjectFile({ toast, beforeOpen: async () => {
    if (!S.dirty) return true;
    const pick = await askUnsaved("Dự án đang mở có chỉnh sửa chưa lưu. Lưu trước khi mở dự án khác?");
    if (pick === "cancel") return false;
    if (pick === "save") return save();
    S.dirty = false; // không lưu: bản tự lưu khôi phục vẫn còn trong dự án cũ
    return true;
  } }).catch((e) => toast(e.message, true));
}

// ---------- Player ----------
// khung dự án: 9:16 dọc 1080×1920 · 16:9 ngang 1920×1080 (project.format)
const isWide = () => P()?.format === "16:9";
const frameW = () => (isWide() ? 1920 : 1080), frameH = () => (isWide() ? 1080 : 1920);
let nextPlayer = null;
function reloadPlayer() {
  const loading=$("#loading");loading.replaceChildren(document.createTextNode('Đang cập nhật…'));loading.classList.add("show");
  nextPlayer?.remove(); // đang nạp dở bản trước → bỏ, nạp bản mới nhất (bản đang xem vẫn phát tiếp)
  const nu = document.createElement("hyperframes-player");
  nu.setAttribute("width", String(frameW())); nu.setAttribute("height", String(frameH()));
  document.body.classList.toggle("wide", isWide());
  nu.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;pointer-events:none";
  player.after(nu);
  nextPlayer = nu;
  nu.setAttribute("src", `/p/index.html?v=${++S.ver}${S.lite ? "&lite=1" : ""}`);
  const t0 = Date.now();
  let readyAt = 0;
  nu.addEventListener("ready", () => { readyAt = readyAt || Date.now();try{nu.seek(S.time);}catch{} }, { once: true });
  // chờ runtime sẵn sàng + ảnh / video trong khung đã có hình (tối đa ~7s) rồi mới đổi chỗ
  const loaded = () => {
    try {
      const d = nu.shadowRoot?.querySelector("iframe")?.contentDocument;
      if (!d || d.readyState !== "complete") return false;
      return [...d.querySelectorAll("video")].filter(v=>{const start=Number(v.dataset.start)||0,duration=Number(v.dataset.duration);return S.time>=start&&(!Number.isFinite(duration)||S.time<start+duration);}).every((v) => !v.error&&v.readyState >= 2) && [...d.querySelectorAll("img")].every((i) => i.complete&&i.naturalWidth>0);
    } catch { return false; }
  };
  const tick = () => {
    if (nextPlayer !== nu) return;
    const waited = Date.now() - t0;
    if(!((readyAt||waited>2500)&&loaded())){
      if(waited<15000)return setTimeout(tick,120);
      nu.remove();nextPlayer=null;
      loading.replaceChildren(document.createTextNode('Chưa tải được hình xem trước. Kiểm tra nguồn video/ảnh và kết nối NAS. '),h('button',{class:'outline small',onclick:reloadPlayer},'Thử lại'));
      return;
    }
    try { nu.seek(S.time); } catch {}
    setTimeout(() => {
      if (nextPlayer !== nu) return;
      const old = player, wasPlaying = S.playing;
      nu.style.cssText = ""; nu.id = "player";
      old.remove();
      player = nu; nextPlayer = null;
      bindPlayer(nu);
      playerWin()?.__beautyMask?.(S.beautyMaskMode || 0);
      refreshTextTypography();
      $("#loading").classList.remove("show");
      seek(S.time);
      if (wasPlaying) nu.play?.(); // đang phát thì phát tiếp trên bản mới
      setTimeout(updateSelection, 120);
    }, 80);
  };
  setTimeout(tick, 150);
}
function seek(t) {
  S.time = clamp(t, 0, S.tm?.total || 0);
  try { player.seek(S.time); } catch {}
  renderTime();
  setTimeout(updateSelection, 60);
}
function togglePlay() {
  if (S.playing) player.pause(); else player.play();
}
function bindPlayer(p) {
  p.addEventListener("timeupdate", (e) => {
    S.time = clamp(e.detail?.currentTime ?? p.currentTime ?? S.time, 0, S.tm?.total || Infinity);
    renderTime();
    if (S.playing) updateSelection();
  });
  p.addEventListener("play", () => { S.playing = true; renderPlay(); requestAnimationFrame(playTick); });
  p.addEventListener("pause", () => { S.playing = false; renderPlay(); });
  p.addEventListener("ended", () => { S.playing = false; renderPlay(); });
}
bindPlayer(player);
// Khi đang phát: đọc thời gian thẳng từ runtime mỗi khung hình (phòng khi player không gửi timeupdate).
// Xem nhẹ (máy yếu): bật tay bằng nút ⚡, hoặc tự bật khi phát < 22 khung / giây 4 giây liền (chỉ khi cửa sổ đang hiện)
try { const v = localStorage.getItem("vek.lite"); S.lite = v === "1"; S.liteAsked = v === "0"; } catch { S.lite = false; }
function setLite(on, auto) {
  S.lite = on;
  try { localStorage.setItem("vek.lite", on ? "1" : "0"); } catch {}
  $("#btnLite")?.classList.toggle("on", on);
  reloadPlayer();
  toast(on ? (auto ? "Máy hơi yếu nên đã bật ⚡ Xem nhẹ cho mượt — video xuất ra vẫn đầy đủ chất lượng. Bấm ⚡ để tắt." : "Đã bật ⚡ Xem nhẹ — xem trước bằng video 540p, bộ lọc và hiệu ứng vẫn hiện, video xuất ra vẫn đầy đủ.") : "Đã tắt Xem nhẹ — xem trước bằng video gốc.");
}
const fpsMeter = { t0: 0, n: 0, slow: 0 };
function measureFps() {
  const now = performance.now();
  if (!fpsMeter.t0 || now - fpsMeter.t0 > 3000) { fpsMeter.t0 = now; fpsMeter.n = 0; return; } // vừa bắt đầu phát / vừa tạm dừng
  fpsMeter.n++;
  if (now - fpsMeter.t0 < 1000) return;
  const fps = (fpsMeter.n * 1000) / (now - fpsMeter.t0);
  fpsMeter.t0 = now; fpsMeter.n = 0;
  fpsMeter.slow = fps < 22 && document.visibilityState === "visible" ? fpsMeter.slow + 1 : 0;
  if (fpsMeter.slow >= 4 && !S.lite && !S.liteAsked) { S.liteAsked = true; setLite(true, true); }
}
function playTick() {
  if (!S.playing) { fpsMeter.t0 = 0; return; }
  measureFps();
  try {
    const rt = player.shadowRoot?.querySelector("iframe")?.contentWindow?.__player;
    let t = typeof rt?.getTime === "function" ? rt.getTime() : player.currentTime;
    if (Number.isFinite(t) && S.tm?.total && t > S.tm.total) t = S.tm.total;
    if (Number.isFinite(t) && Math.abs(t - S.time) > 0.001) { S.time = t; renderTime(); updateSelection(); }
  } catch {}
  requestAnimationFrame(playTick);
}
function frameDoc() {
  try { return player.shadowRoot?.querySelector("iframe")?.contentDocument || null; } catch { return null; }
}
function frameScale() {
  const f = player.shadowRoot?.querySelector("iframe");
  if (!f) return null;
  const ir = f.getBoundingClientRect(), fr = $("#frame").getBoundingClientRect();
  const k = ir.width / frameW() || fr.width / frameW();
  return { k, ox: ir.left - fr.left, oy: ir.top - fr.top };
}

// ---------- Chọn & kéo thả trực tiếp trên khung xem trước (kiểu CapCut) ----------
// Đối tượng chỉnh được: cụm chữ, phần tiêu đề / nội dung của cảnh minh hoạ, cảnh trám.
const PART_LABEL = { head: "Tiêu đề", body: "Nội dung" };

function activeAt(it) {
  if (it.words) { const { o, d } = lineTimes(it); return o >= 0 && S.time >= o - 0.01 && S.time <= o + d; }
  const o = outStart(it);
  return !it.hidden && S.time >= o - 0.01 && S.time <= o + (Number(it.dur) || 0);
}
// Trả về {kind, it, part, el, tab} của mục đang chọn, hoặc null.
function currentTarget() {
  if (S.tab === "captions") return captionTarget();
  const it = selected(), d = frameDoc();
  if (!it || !d || !activeAt(it)) return null;
  if ((S.selKind || S.tab) === "blocks") {
    const el = d.getElementById("blk-" + String(it.id).replace(/[^a-zA-Z0-9_-]/g, ""))?.querySelector(".blk-in");
    return el ? { kind: "block", it, el } : null;
  }
  const root = d.getElementById(it.id);
  if (!root) return null;
  if (S.tab === "texts") return { kind: "text", it, el: root.querySelector(".tx-box"), root };
  if (S.tab === "scenes") {
    if (!S.part) return { kind: "static", it, el: root };
    return { kind: "part", it, part: S.part, el: root.querySelector(`.sc-${S.part}`) };
  }
  if (S.tab === "brolls") return { kind: "broll", it, el: root };
  return null;
}
function captionTarget() {
  const d = frameDoc();
  const line = selected() && activeAt(selected()) ? selected() : itemsOf("captions").find(activeAt);
  const root = line && d?.getElementById("cap-" + line.id);
  if (!root) return null;
  if (line.id !== S.selId) S.selId = line.id;
  return { kind: "caption", it: line, el: root.querySelector(".cap-line") };
}
function getXform(t) {
  if (t.kind === "text") return { x: Number(t.it.x || 0), y: Number(t.it.y ?? 1180), s: Number(t.it.scale || 1) };
  if (t.kind === "part") { const l = t.it.layout?.[t.part] || {}; return { x: Number(l.x || 0), y: Number(l.y || 0), s: Number(l.s || 1) }; }
  if (t.kind === "caption") { const c = ensureCaptions(); return { x: Number(c.x || 0), y: Number(c.y ?? 1450), s: Number(c.scale || 1) }; }
  return { x: Number(t.it.x || 0), y: Number(t.it.y || 0), s: Number(t.it.scale || 1) };
}
function setXform(t, v) {
  const r = { x: Math.round(v.x), y: Math.round(v.y), s: round3(v.s) };
  if (t.kind === "text") { t.it.x = r.x; t.it.y = r.y; t.it.scale = r.s; }
  else if (t.kind === "part") { t.it.layout = t.it.layout || {}; t.it.layout[t.part] = r; }
  else if (t.kind === "caption") { const c = ensureCaptions(); c.x = r.x; c.y = r.y; c.scale = r.s; }
  else { t.it.x = r.x; t.it.y = r.y; t.it.scale = r.s; }
  applyLive(t, r);
}
function applyLive(t, v) {
  if (!t.el) return;
  if (t.kind === "caption") {
    frameDoc()?.querySelectorAll(".cap-line").forEach((el) => { el.style.top = `${v.y}px`; el.style.translate = `${v.x}px -50%`; el.style.scale = `${v.s}`; });
    return;
  }
  if (t.kind === "text") {
    t.el.style.top = `${v.y}px`;
    t.el.style.translate = `${v.x}px -50%`;
  } else t.el.style.translate = `${v.x}px ${v.y}px`;
  t.el.style.scale = `${v.s}`;
}
function targetRect(t) {
  let rects;
  if (t.kind === "text") rects = [...t.root.querySelectorAll(".tx-label,.tx-title,.tx-sub")].map((p) => p.getBoundingClientRect());
  else if (t.kind === "part") rects = [...t.el.children].map((p) => p.getBoundingClientRect());
  else if (t.kind === "block") rects = [...t.el.querySelectorAll("*")].filter((x) => !x.children.length || x.tagName === "svg").map((p) => p.getBoundingClientRect());
  else rects = [t.el.getBoundingClientRect()];
  rects = rects.filter((r) => r.width > 0 && r.height > 0);
  if (!rects.length) return null;
  return {
    left: Math.min(...rects.map((r) => r.left)), top: Math.min(...rects.map((r) => r.top)),
    right: Math.max(...rects.map((r) => r.right)), bottom: Math.max(...rects.map((r) => r.bottom)),
  };
}
function updateSelection() {
  const sel = $("#sel");
  sel.classList.remove("show", "static");
  if (!P() || !S.tm) return; // resize can arrive before the initial project response
  const t = currentTarget(), fs = frameScale();
  if (!t || !fs) return;
  const fr = $("#frame").getBoundingClientRect();
  let r;
  if (t.kind === "static") {
    r = { x: 4, y: 4, w: fr.width - 8, h: fr.height - 8 };
    sel.classList.add("static");
  } else {
    const b = targetRect(t);
    if (!b) return;
    const pad = t.kind === "broll" ? 0 : 8;
    r = { x: fs.ox + b.left * fs.k - pad, y: fs.oy + b.top * fs.k - pad, w: (b.right - b.left) * fs.k + pad * 2, h: (b.bottom - b.top) * fs.k + pad * 2 };
  }
  Object.assign(sel.style, { left: r.x + "px", top: r.y + "px", width: r.w + "px", height: r.h + "px" });
  $("#selTag").textContent = labelOf(t.it, S.selKind || S.tab) + (t.part ? ` · ${PART_LABEL[t.part]}` : "");
  sel.classList.add("show");
}

// Bấm vào video: tìm phần tử trên cùng dưới con trỏ ở thời điểm hiện tại.
function hitTest(clientX, clientY) {
  const d = frameDoc(), fs = frameScale();
  if (!d || !fs) return null;
  const fr = $("#frame").getBoundingClientRect();
  const x = (clientX - fr.left - fs.ox) / fs.k, y = (clientY - fr.top - fs.oy) / fs.k;
  for (const el of d.elementsFromPoint(x, y)) {
    const cap = el.closest(".cap");
    if (cap) {
      const it = itemsOf("captions").find((l) => "cap-" + l.id === cap.id);
      if (it && activeAt(it)) return { tab: "captions", it };
      continue;
    }
    const tx = el.closest(".tx");
    if (tx) {
      const it = itemsOf("texts").find((i) => i.id === tx.id);
      if (it && activeAt(it) && el.closest(".tx-label,.tx-title,.tx-sub")) return { tab: "texts", it };
      continue;
    }
    const sc = el.closest(".scene");
    if (sc) {
      const it = itemsOf("scenes").find((i) => i.id === sc.id);
      if (!it || !activeAt(it)) continue;
      const part = el.closest(".sc-head") ? "head" : el.closest(".sc-body") ? "body" : null;
      return { tab: "scenes", it, part };
    }
    const blk = el.closest(".blk");
    if (blk) {
      const it = itemsOf("blocks").find((b) => "blk-" + String(b.id).replace(/[^a-zA-Z0-9_-]/g, "") === blk.id);
      if (it && activeAt(it)) return { tab: tabOfItem(it, "blocks"), it, kind: "blocks" };
      continue;
    }
    if (el.matches(".broll,.broll-img")) {
      const it = itemsOf("brolls").find((i) => i.id === el.id);
      if (it && activeAt(it)) return { tab: "brolls", it };
    }
  }
  return null;
}

(function setupDrag() {
  const overlay = $("#overlay"), sel = $("#sel"), line = $(".center-line");
  let st = null;
  const begin = (e, mode) => {
    const t = currentTarget();
    if (!t || t.kind === "static") return false;
    e.preventDefault();
    e.stopPropagation();
    if (S.playing) player.pause();
    const fs = frameScale(), fr = $("#frame").getBoundingClientRect(), sr = sel.getBoundingClientRect();
    st = { mode, t, v0: getXform(t), mx: e.clientX, my: e.clientY, k: fs.k,
      cx: sr.left + sr.width / 2, cy: sr.top + sr.height / 2, fr };
    st.d0 = Math.max(10, Math.hypot(e.clientX - st.cx, e.clientY - st.cy));
    snapshot();
    return true;
  };
  sel.addEventListener("pointerdown", (e) => begin(e, e.target.classList.contains("handle") ? "scale" : "move"));
  // Bấm vào chỗ trống trên video → chọn phần tử dưới con trỏ và kéo luôn.
  overlay.addEventListener("pointerdown", (e) => {
    if (e.target !== overlay && !e.target.classList.contains("safe") && !e.target.classList.contains("center-line")) return;
    const hit = hitTest(e.clientX, e.clientY);
    if (!hit) { if (S.selId) { S.selId = null; S.part = null; renderList(); renderInspector(); renderTimeline(); updateSelection(); } return; }
    if (hit.kind) focusItem(hit.it, hit.kind);
    else { if (S.tab !== hit.tab) { S.tab = hit.tab; renderTabs(); } S.selKind = null; S.selId = hit.it.id; }
    S.part = hit.part || null;
    renderList(); renderInspector(); renderTimeline();
    updateSelection();
    begin(e, "move");
  });
  window.addEventListener("pointermove", (e) => {
    if (!st) return;
    const v = { ...st.v0 };
    if (st.mode === "move") {
      v.x = st.v0.x + (e.clientX - st.mx) / st.k;
      v.y = st.v0.y + (e.clientY - st.my) / st.k;
      const snap = Math.abs(v.x) < 10 / st.k;
      if (snap) v.x = 0;
      line.classList.toggle("snap", snap);
      if (st.t.kind === "text" || st.t.kind === "caption") v.y = clamp(v.y, 180, 1700);
    } else {
      v.s = clamp(st.v0.s * (Math.hypot(e.clientX - st.cx, e.clientY - st.cy) / st.d0), 0.2, 4);
    }
    setXform(st.t, v);
    updateSelection();
  });
  const endDrag = () => {
    if (!st) return;
    st = null;
    line.classList.remove("snap");
    changed({ reload: false, inspector: true });
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
})();

// ---------- Render các vùng ----------
function renderStatus() {
  const s = $("#status");
  s.textContent = S.dirty ? "Chưa lưu" : "Đã lưu";
  s.classList.toggle("dirty", S.dirty);
  $("#btnUndo").disabled = !S.undo.length;
  $("#btnRedo").disabled = !S.redo.length;
}
function renderTime() {
  $("#time").textContent = `${fmt(S.time)} / ${fmt(S.tm?.total)}`;
  $("#tlClock").innerHTML = `${fmtClock(S.time)} <span>/ ${fmtClock(S.tm?.total)}</span>`;
  const x = S.time * (S.pps || 1);
  $("#playhead").style.left = x + "px";
  const sc = $("#tlScroll");
  if (S.playing && (x > sc.scrollLeft + sc.clientWidth - 60 || x < sc.scrollLeft)) sc.scrollLeft = x - 80;
}
function renderPlay() { $("#btnPlay").textContent = S.playing ? "Dừng" : "Phát"; }

// Cột icon bên trái: mỗi icon 1 nhóm tinh chỉnh — bấm mới mở bảng chỉnh (bấm lại để đóng)
const RAIL_ICON = {
  texts: '<path d="M3 3.5h10M8 3.5V13"/>',
  captions: '<rect x="1.5" y="4" width="13" height="8" rx="2"/><path d="M4.5 8h3M9 8h2.5"/>',
  segments: '<circle cx="4.5" cy="4.5" r="2"/><circle cx="4.5" cy="11.5" r="2"/><path d="M6.2 5.6L14 12M6.2 10.4L14 4"/>',
  zooms: '<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14M7 5v4M5 7h4"/>',
  scenes: '<rect x="2" y="3" width="12" height="10" rx="2"/><path d="M5 10l2.5-3 2 2 1.5-1.5L13 10"/>',
  brolls: '<rect x="2" y="2.5" width="12" height="5" rx="1.2"/><rect x="2" y="8.5" width="12" height="5" rx="1.2"/>',
  blocks: '<rect x="2" y="2" width="5.5" height="5.5" rx="1.2"/><circle cx="11.2" cy="4.8" r="2.8"/><path d="M2.5 14l3-5 3 5z"/><rect x="9" y="9" width="5" height="5" rx="1"/>',
  audio: '<path d="M6 12.5V4l7-1.5V11"/><circle cx="4.5" cy="12.5" r="1.5"/><circle cx="11.5" cy="11" r="1.5"/>',
  camera: '<path d="M2 5V2.5h3M11 2.5h3V5M14 11v2.5h-3M5 13.5H2V11"/><circle cx="8" cy="8" r="2.5"/>',
  kho: '<path d="M2 5.5L8 2.5l6 3v6L8 14.5l-6-3z"/><path d="M2 5.5l6 3 6-3M8 8.5v6"/>',
  filters: '<circle cx="6" cy="6" r="3.6"/><circle cx="10" cy="6" r="3.6"/><circle cx="8" cy="10" r="3.6"/>',
  brand: '<path d="M8 1.8a6.2 6.2 0 100 12.4c1 0 1.4-.8 1-1.6-.5-1 .2-2 1.3-2H12a2.4 2.4 0 002.2-2.4A6.3 6.3 0 008 1.8z"/><circle cx="5" cy="7" r=".9" fill="currentColor"/><circle cx="7.5" cy="4.6" r=".9" fill="currentColor"/><circle cx="10.6" cy="5.4" r=".9" fill="currentColor"/>',
};
function renderTabs() {
  const nav = $("#tabs");
  nav.innerHTML = "";
  const countOf = (k) => { const t = TABS.find((x) => x.key === k); return t?.kind ? (k === "segments" ? itemsOf(k).filter((s) => s.keep !== false).length : (["texts","blocks"].includes(k)?componentEntries(P(),k).length:itemsOf(k).length)) : 0; };
  const cur = groupOf(S.tab);
  lastSub[cur.key] = S.tab;
  for (const g of GROUPS) {
    if (!groupVisible(g) && g !== cur) continue;
    const on = g === cur && S.drawer;
    const b = h("button", {
      class: `rail-btn ${on ? "on" : ""}`, title: g.label,
      onclick: () => (on && !S.panel && !DESK.matches ? closeDrawer() : (switchTab(lastSub[g.key] || g.tabs[0]), S.panel = null, openDrawer())),
    });
    b.innerHTML = `<svg viewBox="0 0 16 16" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${RAIL_ICON[g.icon] || ""}</svg>`;
    b.append(h("span", {}, g.label));
    const n = g.tabs.length > 1 ? 0 : countOf(g.tabs[0]);
    if (n) b.append(h("i", { class: "count" }, n));
    nav.append(b);
  }
  // Menu trái trong bảng chỉnh: các mục con của tab đang mở
  const sub = $("#submenu");
  sub.innerHTML = "";
  const audioMenu=S.tab==="audio"&&!S.panel;
  const multi = (cur.tabs.length > 1 || audioMenu) && !S.panel;
  $(".drawer-body").classList.toggle("has-sub", multi);
  if(audioMenu) for(const [key,label] of AUDIO_GROUPS) sub.append(h("button",{class:`sub-btn ${audioGroup===key?"on":""}`,"data-audio-group":key,"aria-pressed":String(audioGroup===key),onclick:()=>{stopAudioAudition();audioGroup=key;renderTabs();renderList();}},label));
  if (multi&&!audioMenu) for (const k of cur.tabs) {
    const t = TABS.find((x) => x.key === k), n = countOf(k);
    sub.append(h("button", { class: `sub-btn ${S.tab === k ? "on" : ""}`, onclick: () => { switchTab(k); S.panel = null; openDrawer(); } },
      h("span", {}, t.label), n ? h("i", {}, n) : null));
  }
  $("#drawerTitle").textContent = S.panel === "history" ? "Lịch sử bản lưu" : TABS.find((t) => t.key === S.tab)?.label || "";
  const cut = itemsOf("segments").filter((s) => s.keep === false).length;
  $("#meta").textContent = [
    `${fmt(S.tm?.total)} sau khi cắt`,
    cut ? `${cut} đoạn đã cắt` : null,
    `${componentEntries(P(),"texts").length} nhịp chữ`,
    `${itemsOf("scenes").length} cảnh minh hoạ`,
    mattePending() ? "⚠ Cần tách nền người (có hiệu ứng nằm sau người)" : null,
  ].filter(Boolean).join(" · ");
  $("#meta").classList.toggle("warn", mattePending());
}

const HINTS = {
  texts: "Chọn một thẻ để chỉnh. Kéo chữ trực tiếp trên video để đổi vị trí, kéo chấm tròn ở góc để đổi cỡ.",
  segments: "Bỏ chọn ô để cắt đoạn khỏi bản dựng. Chữ và cảnh tự dịch theo lời nói.",
  zooms: "Zoom nhẹ 6–10% ở những câu quan trọng.",
  scenes: "Cảnh nền đen diễn giải ý đang nói — mỗi cảnh một ý.",
  blocks: "Đồ hoạ tự do của mẫu: thẻ, lịch, số lớn, khung ảnh… AI vẽ theo nội dung lời nói; sửa chữ trong HTML, đổi thời điểm và lớp (trước / sau người).",
  brolls: "Cảnh trám và showcase. Chép file vào thư mục inputs/ của project rồi thêm ở đây.",
  audio: "Giọng thật là chính. Nhạc nền nhỏ, không át lời.",
  camera: "Giữ mặt cân giữa, thấy đủ đầu và vai.",
  captions: "Phụ đề chạy theo lời nói. Sửa chữ từng dòng ở giữa; kéo phụ đề trên video để đổi vị trí cho cả video.",
  brand: "Bộ font và màu dùng chung cho chữ nhấn, cảnh minh hoạ và phụ đề. Lưu thành preset để dùng lại cho video khác.",
};

function labelOf(it, tab = S.tab) {
  if (tab === "texts") return (it.title || it.sub || it.label || "(trống)").replace(/[*|]/g, " ").replace(/\s+/g, " ").trim();
  if (tab === "zooms") return it.mode === "board" ? "Bảng đồ hoạ" : it.mode === "frame" ? "Khung giữa" : `Zoom ${it.mode === "cut" ? "cắt " : ""}${Math.round(((Number(it.amount) || 1.08) - 1) * 100)}%`;
  if (tab === "scenes") return it.data?.title || SCENE_TYPES.find((x) => x[0] === it.type)?.[1] || it.type;
  if (tab === "brolls") return (it.src || "").split("/").pop();
  if (tab === "blocks") return it.name || String(it.html || "").replace(/<[^>]*>/g, " ").split(" ").filter(Boolean).join(" ").slice(0, 40) || it.id;
  if (tab === "segments") return it.text || "(đoạn)";
  if (tab === "captions") return (it.words || []).map((w) => w.w).join(" ") || "(phụ đề)";
  return it.id;
}
const thumbUrl = (src, t) => `/api/thumb?src=${encodeURIComponent(src || "")}&t=${Math.max(0, t || 0).toFixed(1)}`;
const bg = (url) => `background-image:url("${url}")`;

function cardThumb(it) {
  const src = P().source?.video;
  if (S.tab === "texts" || S.tab === "scenes") return liveThumb(S.tab, it);
  if (S.tab === "zooms") {
    const a = Number(it.amount) || 1.08;
    return h("div", { class: "thumb", style: `${bg(thumbUrl(src, (it.at || 0) + (Number(it.dur) || 2) / 2))};background-size:${a * 100}%` },
      h("span", { class: "zoomtag" }, `+${Math.round((a - 1) * 100)}%`));
  }
  if (S.tab === "blocks") return h("div", { class: "thumb", style: bg(thumbUrl(src, (it.at || 0) + 0.3)) }, h("span", { class: "zoomtag" }, it.layer === "behind" ? "Sau người" : "Trước"));
  if (S.tab === "brolls") {
    const b = h("div", { class: "thumb" });
    b.append(h("div", { style: `position:absolute;left:0;right:0;top:0;height:${it.mode === "split" ? 50 : 100}%;background:#ccc center/cover;${bg(thumbUrl(it.src, (Number(it.mediaStart) || 0) + 0.5))}` }));
    if (it.mode === "split") b.append(h("div", { style: `position:absolute;left:0;right:0;bottom:0;height:50%;background:#ccc center 20%/cover;${bg(thumbUrl(src, it.at || 0))}` }));
    return b;
  }
  return h("div", { class: "thumb" });
}

function renderList() {
  stopAudioAudition();
  const list = $("#list"), actions = $("#listActions");
  list.innerHTML = "";
  actions.innerHTML = "";
  list.className = "cards";
  $("#boardHint").textContent = "";
  document.querySelector(".board-head").style.display = S.tab === "segments" ? "none" : "";
  const tab = TABS.find((t) => t.key === S.tab);
  const q = $("#search").value.trim().toLowerCase();
  $("#search").style.display = tab.kind ? "" : "none";
  if (S.tab.startsWith("kho-")) { khoTab(list); return; }
  if (!tab.kind) {
    list.className = "cards rows";
    list.append(settingsForm());
    return;
  }
  if (S.tab === "captions") {
    list.className = "cards rows";
    renderCaptionsBoard(list, q);
    return;
  }
  const items = itemsOf(S.tab);
  if (S.tab === "segments") {
    list.className = "cards rows";
    list.append(h('button',{class:'outline small',onclick:primaryClipsDialog},'Thêm A-roll vào bản dựng'));
    renderSegmentRows(list, items, q);  } else {
    const grp = S.tab === "texts" ? "chu" : S.tab === "blocks" ? "dohoa" : null;
    // Edit existing layers first; keep insertion presets in the same panel.
    if (grp) {
      list.className = 'cards rows';
      presetSection(list,grp);
      usedComponentRows(list,componentEntries(P(),S.tab),q);
    }
    if (S.tab === "brolls") brollPanel(list);
    if (S.tab === "brolls" || grp) { /* panels above own their existing-layer list */ } else items.slice().sort((a, b) => (a.at || 0) - (b.at || 0)).forEach((it, i) => {
      if (q && !labelOf(it).toLowerCase().includes(q)) return;
      const o = outStart(it);
      const kind = S.tab === "texts" ? FX.find((f) => f[0] === (it.fx || "words"))?.[1]
        : S.tab === "scenes" ? SCENE_TYPES.find((f) => f[0] === it.type)?.[1]
        : S.tab === "brolls" ? ({ split: "Chia màn hình", pip: "Khung nổi", blurfill: "Nền mờ" }[it.mode] || "Toàn màn hình") : `${(Number(it.dur) || 0).toFixed(1)}s`;
      list.append(h("div", { class: `card ${it.hidden ? "off" : ""} ${S.selId === it.id ? "on" : ""}`, onclick: () => select(it) },
        h("div", { class: "no" }, i + 1),
        cardThumb(it),
        h("div", { class: "name" }, labelOf(it)),
        h("div", { class: "desc" }, `${fmt(o)} · ${kind}`),
        h("div", { class: "foot" },
          h("label", { onclick: (e) => e.stopPropagation() },
            h("input", { type: "checkbox", checked: !it.hidden, onchange: (e) => { snapshot(); it.hidden = !e.target.checked; changed({ inspector: true }); } }),
            "Dùng"))));
    });
  }
  if (!list.children.length) list.append(h("div", { class: "empty" }, q ? "Không có kết quả." : "Chưa có mục nào."));
  requestAnimationFrame(() => { const t = list.querySelector(".thumb"); if (t) list.style.setProperty("--k", t.clientWidth / 1080); });

  const add = (label, fn, cls = "outline small") => actions.append(h("button", { class: cls, onclick: fn }, label));
  const at = () => round3(S.tm.outToSrc(S.time));
  if(S.tab==='brolls')add('Thêm A-roll vào bản dựng',primaryClipsDialog,'outline small');
  if (S.tab === "texts") add("Thêm chữ", () => addItem({ id: uid("t", itemsOf("texts")), at: at(), dur: 2.5, title: "CHỮ MỚI", fx: "words" }));
  if (S.tab === "zooms") add("Thêm zoom", () => addItem({ id: uid("z", itemsOf("zooms")), at: at(), dur: 3, amount: 1.08 }));
  if (S.tab === "scenes") add("Thêm cảnh", () => addItem({ id: uid("g", itemsOf("scenes")), type: "process", at: at(), dur: 5, data: { title: "TIÊU ĐỀ", steps: ["Bước 1", "Bước 2", "Bước 3"] } }));
  if (S.tab === "blocks") add("Thêm đồ hoạ", () => addItem({ id: uid("k", itemsOf("blocks")), name: "Thẻ mới", at: at(), dur: 3, layer: "front", fx: "pop", out: "fade",
    html: '<div class="card">Nội dung</div>',
    css: ":scope .card{position:absolute;left:240px;top:300px;width:600px;padding:40px;background:#fff;border-radius:24px;font:600 52px/1.2 var(--f-sub);color:#111;text-align:center}" }));
  if (S.tab === "brolls") { add("Tạo ảnh AI", async () => { const {openImageTool}=await import("/ui/contentos-images.js");const imageProject=P(),imageDir=S.dir,imageWorkspace=P().workspaceId,imageBase=JSON.stringify(P()),imageAt=S.time;
    const validateInsertion=()=>{if(P()!==imageProject||S.dir!==imageDir||JSON.stringify(P())!==imageBase)throw new Error('Bản dựng đã đổi. Mở lại công cụ ảnh để chọn vị trí chèn.');if(!(S.tm.total-imageAt>=.2))throw new Error('Đưa playhead trước cuối video ít nhất0.2giây rồi mở lại công cụ ảnh.');};
    const imageRequest=(url,options)=>{if(S.dir!==imageDir||P().workspaceId!==imageWorkspace)throw new Error('Dự án/workspace đã đổi. Mở lại công cụ ảnh.');return editorFetch(url,options);};
    await openImageTool({request:imageRequest,projectMedia:true,validateInsertion,onInserted:async asset=>{validateInsertion();S.media=await api('/api/media');validateInsertion();insertBroll(asset.path,imageAt);},onAttached:async()=>{S.media=await api("/api/media");renderList();}}); }, "ghost small"); add("Từ máy tính", () => $("#fileInput").click(), "ghost small"); add("Từ kho (Drive)", brollFromKho, "ghost small"); add("NAS / Điện thoại", async () => { const {openIntake}=await import("/ui/contentos-intake.js"); await openIntake({dir:S.dir,onReceived:async()=>{S.media=await api("/api/media");if(S.tab==="brolls")renderList();toast("Đã nhận tư liệu vào kho của dự án.");}}); }, "ghost small"); }
  if (false) add("Thêm cảnh trám", () => {
    const vids = S.media.filter((m) => m !== P().source?.video && /\.(mp4|mov|webm|m4v|png|jpe?g|webp)$/i.test(m));
    if (!vids.length) return toast("Chép video/ảnh minh hoạ vào thư mục inputs/ của project trước.", true);
    addItem({ id: uid("b", itemsOf("brolls")), src: vids[0], at: at(), dur: 4, mode: "split" });
  });
}
function addItem(it) {
  snapshot();
  itemsOf(S.tab).push(it);
  S.selKind = null;
  S.selId = it.id;
  changed({ inspector: true });
}
function select(it, key = S.tab) {
  focusItem(it, key);
  S.part = null;
  openDrawer();
  // chọn mục → cuộn bảng tới phần chỉnh của mục đó
  requestAnimationFrame(() => { const b = $(".drawer-body"), i = $("#inspector"); if (b && i) b.scrollTo({ top: Math.max(0, i.offsetTop - 8), behavior: "smooth" }); });
  renderList();
  renderInspector();
  renderTimeline();
  if (S.tab === "segments") {
    if (it.keep !== false) seek(S.tm.srcToOut(it.in) + 0.01);
  } else {
    const o = outStart(it);
    seek(S.tab === "texts" ? o + Math.min(0.9, (Number(it.dur) || 1) * 0.5) : o + Math.min(1.2, (Number(it.dur) || 1) * 0.5));
  }
}
function splitAtPlayhead() {
  const t = S.tm.outToSrc(S.time);
  const segs = itemsOf("segments");
  const s = segs.find((x) => x.keep !== false && t > x.in + 0.05 && t < x.out - 0.05);
  if (!s) return toast("Đưa playhead vào giữa một đoạn đang giữ để tách.", true);
  snapshot();
  pinSourceAudioEnvelope(s,(s.out-s.in)/Math.max(.25,Math.min(4,Number(s.speed)||Number(P().speed)||1)));
  const n = { ...structuredClone(s), id: uid("s", segs), in: round3(t), text: "" };
  delete n.tIn;
  shiftSegmentZoom(n,round3(t)-s.in,P().speed);
  shiftSourceAudioEnvelope(n,(round3(t)-s.in)/Math.max(.25,Math.min(4,Number(s.speed)||Number(P().speed)||1)));
  if(s.src)n.mediaStart=round3((s.mediaStart??0)+round3(t)-s.in);
  s.out = round3(t);
  const words = (s.text || "").split(" ");
  if (words.length > 1) { s.text = words.slice(0, Math.ceil(words.length / 2)).join(" ") + "…"; n.text = "…" + words.slice(Math.ceil(words.length / 2)).join(" "); }
  segs.splice(segs.indexOf(s) + 1, 0, n);
  S.selId = n.id;
  changed({ inspector: true });
  toast("Đã tách đoạn. Bỏ chọn ô để cắt phần không cần.");
}

// ---------- Panel thuộc tính ----------
function field(label, input, help) {
  return h("div", { class: "field" }, h("label", {}, label), input, help ? h("div", { class: "help" }, help) : null);
}
function bind(obj, key, el, parse = (v) => v, opts = {}) {
  el.addEventListener("input", () => {
    snapshot();
    const v = parse(el.type === "checkbox" ? el.checked : el.value);
    if(key==='audioFadeIn'||key==='audioFadeOut')delete obj.audioEnvelope;
    if (v === "" || v == null || (typeof v === "number" && isNaN(v))) delete obj[key]; else obj[key] = v;
    changed({ reload: opts.reload !== false });
  });
  return el;
}
const txt = (obj, key, ph) => bind(obj, key, h("input", { value: obj[key] ?? "", placeholder: ph || "" }));
const area = (obj, key, ph) => bind(obj, key, h("textarea", { placeholder: ph || "" }, obj[key] ?? ""));
const num = (obj, key, step = 0.1, def = "") => bind(obj, key, h("input", { type: "number", step, value: obj[key] ?? def }), Number);
const sel = (obj, key, options, def) => {
  const el = h("select", {}, options.map(([v, l]) => h("option", { value: v, selected: (obj[key] ?? def) === v }, l)));
  return bind(obj, key, el);
};
const chk = (obj, key, def = false) => bind(obj, key, h("input", { type: "checkbox", checked: obj[key] ?? def, style: "width:auto" }), (v) => v);
function slider(obj, key, min, max, step, def) {
  const val = obj[key] ?? def;
  const r = h("input", { type: "range", min, max, step, value: val });
  const n = h("input", { type: "number", min, max, step, value: val });
  const set = (v) => { snapshot(); if(key==='audioFadeIn'||key==='audioFadeOut')delete obj.audioEnvelope; obj[key] = Number(v); r.value = v; n.value = v; changed(); };
  r.addEventListener("input", () => set(r.value));
  n.addEventListener("input", () => set(n.value));
  return h("div", { class: "range" }, r, n);
}
const lines = (obj, key, ph) => {
  const el = h("textarea", { placeholder: ph || "Mỗi dòng một ý" }, (obj[key] || []).join("\n"));
  el.addEventListener("input", () => { snapshot(); obj[key] = el.value.split("\n").map((s) => s.trim()).filter(Boolean); changed(); });
  return el;
};
function timeFields(it) {
  const start = h("input", { type: "number", step: 0.1, value: outStart(it).toFixed(2) });
  start.addEventListener("change", () => { snapshot(); setOutStart(it, Number(start.value)); changed(); });
  return h("div", { class: "row" },
    field("Bắt đầu (s)", start),
    field("Thời lượng (s)", num(it, "dur", 0.1)));
}
function itemButtons(it, key) {
  return h("div", { class: "btns" },
    h("button", { class: "link", onclick: () => seek(outStart(it)) }, "Xem từ đây"),
    h("button", { class: "link", onclick: () => { snapshot(); setOutStart(it, S.time); changed({ inspector: true }); } }, "Bắt đầu tại playhead"),
    h("button", { class: "link", onclick: () => { snapshot(); it.hidden = !it.hidden; changed({ inspector: true }); } }, it.hidden ? "Dùng lại" : "Tạm ẩn"),
    h("button", { class: "link danger", onclick: () => {
      snapshot();
      const arr = itemsOf(key);
      arr.splice(arr.indexOf(it), 1);
      S.selId = null;
      changed({ inspector: true });
      updateSelection();
    } }, "Xoá"));
}

// Nhạc có sẵn của phần mềm: 3 bài tổng hợp + thư viện nhập từ NAS (server /api/kit-music); tải 1 lần rồi vẽ lại.
let KIT_MUSIC=[{id:'kit:upbeat-light',title:'Vui tươi nhẹ',file:'upbeat-light.wav'},{id:'kit:ambient-pad',title:'Êm ấm',file:'ambient-pad.wav'},{id:'kit:beat-bass',title:'Beat bass',file:'beat-bass.wav'}],kitMusicLoading=false;
function loadKitMusic(){if(kitMusicLoading)return;kitMusicLoading=true;api('/api/kit-music').then(list=>{if(Array.isArray(list)&&list.length){KIT_MUSIC=list;if(S.tab==='audio')renderList();}}).catch(()=>{kitMusicLoading=false;});}
function audioMusicBrowser(files,a){
  loadKitMusic();
  const kitTitle=m=>m.title+(m.mood?.length?' · '+m.mood.join(', '):'')+(m.duration?' · '+Math.round(m.duration)+'s':'');
  const tracks=[...KIT_MUSIC.map(m=>[m.id,kitTitle(m),m.file]),...files.map(src=>[src,src.split('/').pop()])];
  const root=h('div',{class:'cos-music-browser'}),rows=h('div',{class:'cos-music-rows'});
  const search=h('input',{type:'search',placeholder:'Tìm nhạc trong dự án…','aria-label':'Tìm nhạc nền'});
  let source='all';
  const draw=()=>{
    rows.replaceChildren();
    const found=tracks.filter(([src,name])=>(source!=='imported'||!src.startsWith('kit:'))&&name.toLocaleLowerCase().includes(search.value.toLocaleLowerCase()));
    for(const [src,name,kitFile] of found){
      const isKit=src.startsWith('kit:'),chosen=a.music===src;
      const status=h('small',{},isKit?'Nhạc có sẵn':'Tư liệu dự án');
      const play=h('button',{class:'outline small','aria-label':'Nghe thử '+name,title:'Nghe thử',onclick:async()=>{
        if(audioAudition?.dataset.track===src){stopAudioAudition();play.textContent='▶';return;}
        stopAudioAudition();for(const b of rows.querySelectorAll('[data-audition]'))b.textContent='▶';
        // nhạc có sẵn nghe thẳng từ thư viện phần mềm, không cần dựng trước
        const audio=new Audio(isKit?'/kit-music/'+encodeURIComponent(kitFile):'/p/'+src.split('/').map(encodeURIComponent).join('/'));audio.dataset.track=src;audioAudition=audio;audio.volume=.5;play.textContent='■';
        audio.onended=()=>{if(audioAudition===audio){stopAudioAudition();play.textContent='▶';}};
        try{await audio.play();}catch{if(audioAudition===audio){stopAudioAudition();play.textContent='▶';status.textContent='Chưa nghe được. Đợi dựng xong rồi thử lại.';}}
      },'data-audition':''},'▶');
      rows.append(h('div',{class:'cos-music-row'+(chosen?' on':'')},play,h('div',{class:'cos-music-title'},h('b',{},name),status),h('button',{class:'outline small','aria-label':'Chọn nhạc '+name,'aria-pressed':String(chosen),onclick:()=>{snapshot();a.music=src;changed();renderList();}},chosen?'Đang dùng':'Chọn')));
    }
    if(!found.length)rows.append(h('p',{class:'help'},'Chưa có bài phù hợp. Thêm nhạc từ máy hoặc NAS.'));
  };
  search.oninput=draw;
  const filter=h('select',{'aria-label':'Nguồn nhạc',onchange:e=>{source=e.target.value;draw();}},h('option',{value:'all'},'Tất cả'),h('option',{value:'imported'},'Đã nhập'));
  root.append(h('div',{class:'cos-music-search'},search,filter),rows,h('button',{class:'link',onclick:()=>{snapshot();delete a.music;changed();renderList();}},'Không dùng nhạc nền'));
  draw();return root;
}

// Âm thanh / Khung hình: form nằm ở giữa, không cần chọn thẻ.
function settingsForm() {
  const box = h("div", { class: "settings insp" });
  const add = (...els) => box.append(...els.filter(el=>el!=null&&el!==false));
  if (S.tab === "audio") {
    if(P().contentos?.origin==='approved-news-narration')add(h('p',{class:'help'},'Dự án tạo từ lời đọc đã duyệt, có nền trống theo thời lượng audio. Thêm và kiểm tra cảnh trám/hình ảnh trước khi xuất.'));
    add(h('button',{class:'outline small',onclick:async()=>{const {openVoiceTool}=await import('/ui/giong.js');await openVoiceTool({request:editorFetch,onAttached:async()=>{S.media=await api('/api/media');renderList();toast('Đã nhận audio vào tư liệu dự án.');}});}},'Giọng nói AI'));
    const a = (P().audio = P().audio || {});
    const music = S.media.filter((m) => /\.(mp3|wav|m4a|aac)$/i.test(m) && !m.startsWith("assets/sfx/"));
    const clips=(a.clips=a.clips||[]);
    const audioSelect=h('select',{'aria-label':'Audio thuyết minh'},music.map(src=>h('option',{value:src},src)));
    add(field('Thuyết minh / audio riêng',audioSelect,'Chọn audio đã nhập, rồi thêm tại playhead. Mốc bắt đầu bám thời gian video gốc khi thay đổi đoạn cắt.'));
    const audioInfo=h('p',{class:'help','aria-live':'polite'});add(audioInfo);
    let audioInfoToken=0;
    const audioChecks=new Map();
    const inspectAudio=src=>{if(!audioChecks.has(src))audioChecks.set(src,api('/api/audio-info','POST',{src}));return audioChecks.get(src);};
    const audioContextText=info=>info.voice?.status==='match'?'Khớp kịch bản đã duyệt · v'+info.voice.narration.version:info.voice?.status==='different-script'?'Audio thuộc kịch bản khác bản đang gắn. Kiểm tra trước khi chèn.':info.voice?.status==='no-script'?'Audio có nguồn kịch bản; dự án chưa gắn bản tin.':'Audio chưa có liên kết kịch bản đã duyệt.';
    audioSelect.onchange=async()=>{const token=++audioInfoToken,src=audioSelect.value;audioInfo.textContent='Đang đọc audio…';try{const info=await inspectAudio(src);if(token!==audioInfoToken||!audioInfo.isConnected)return;const remaining=Math.max(0,S.tm.total-S.time);audioInfo.textContent=info.duration.toFixed(2)+' giây · '+audioContextText(info)+(info.duration>remaining?' Audio dài hơn phần video còn lại; đầu ra sẽ chỉ dùng phần nằm trong bản dựng.':'');}catch(error){if(token===audioInfoToken&&audioInfo.isConnected)audioInfo.textContent=error.message;}};
    if(music.length)queueMicrotask(()=>{if(audioInfo.isConnected)audioSelect.onchange();});
    add(h('button',{class:'outline small',disabled:!music.length,onclick:async(event)=>{
      const src=audioSelect.value,projectDir=S.dir,project=P(),at=round3(S.tm.outToSrc(S.time));event.target.disabled=true;
      try{const info=await api('/api/audio-info','POST',{src});if(S.dir!==projectDir||P()!==project)throw new Error('Dự án đã đổi. Chọn lại audio.');
        if(info.voice?.status==='different-script')throw new Error('Audio khác kịch bản đang gắn. Kiểm tra hoặc cập nhật bản tin trước khi chèn.');
        snapshot();clips.push({id:crypto.randomUUID(),src,at,from:0,vol:1,sourceDuration:info.duration,...(info.voice?{voiceSource:info.voice}:{})});changed();renderList();
      }catch(error){toast(error.message,true);event.target.disabled=false;}
    }},'Thêm audio tại playhead'));
    add(h('button',{class:'link',onclick:()=>renderList()},'Kiểm tra lại liên kết lời đọc'));
    clips.forEach((clip,index)=>{
      const row=h('div',{class:'field',style:'border:1px solid #444;padding:10px;border-radius:10px'},h('b',{},`Audio ${index+1}: ${clip.src}`));
      row.append(h('button',{'data-ai-audio':clip.id,onclick:()=>{S.ai.audioClipId=clip.id;S.ai.omitSelection=false;toggleAiChat(true);}},'Nhờ AI sửa clip audio này'));
      if(clip.voiceSource?.narration)row.append(h('p',{class:'help'},'Voice từ kịch bản v'+clip.voiceSource.narration.version+' · '+clip.voiceSource.narration.scriptId));
      if(clip.voiceSource){
        const status=h('p',{class:'help','aria-live':'polite','data-voice-clip-status':clip.id},'Đang kiểm tra liên kết lời đọc…');row.append(status);
        queueMicrotask(async()=>{if(!status.isConnected)return;try{
          const info=await inspectAudio(clip.src);if(!status.isConnected)return;
          const saved=clip.voiceSource,current=info.voice;
          const changed=!current||saved.voiceResultId!==current.voiceResultId||saved.textHash!==current.textHash||saved.narration?.scriptId!==current.narration?.scriptId||saved.narration?.scriptHash!==current.narration?.scriptHash;
          status.textContent=changed?'Liên kết audio đã đổi so với lúc chèn. Kiểm tra tư liệu và chọn lại lời đọc.':current.status==='different-script'?'Lời đọc trên timeline thuộc bản kịch bản cũ hoặc khác bản đang gắn. Kiểm tra trước khi xuất.':audioContextText(info);
        }catch(error){if(status.isConnected)status.textContent='Không kiểm tra được lời đọc: '+error.message;}});
      }
      const available=Math.max(0,Math.min(Number(clip.dur)||Infinity,(Number(clip.sourceDuration)||0)-(Number(clip.from)||0)));if(!clip.hidden&&available>S.tm.total-S.tm.srcToOut(Number(clip.at)||0))row.append(h('p',{class:'help'},'Audio vượt phần video còn lại; phần dư không nằm trong file xuất. Chỉnh độ dài hoặc mở rộng bản dựng.'));
      row.append(field('Bắt đầu trên video gốc (giây)',num(clip,'at',0.1,0)),field('Bỏ đầu audio (giây)',num(clip,'from',0.1,0)),field('Độ dài dùng (giây; trống = hết file)',num(clip,'dur',0.1,'')),field('Âm lượng audio',slider(clip,'vol',0,2,0.05,1)),field('Fade vào audio (giây)',num(clip,'fadeIn',0.1,0)),field('Fade ra audio (giây)',num(clip,'fadeOut',0.1,0)),field('Tạm ẩn',chk(clip,'hidden')),
       h('button',{class:'link danger',onclick:()=>{snapshot();clips.splice(index,1);changed();renderList();}},'Xóa đoạn audio'));
      add(row);
    });
    const voiceNodes=[...box.children];
    // Mức âm thanh hiệu ứng tự động — đặt đầu tab cho dễ thấy (Nhiều / Vừa / Tắt)
    const lvl = ["tat", "vua", "nhieu"].includes(a.sfxLevel) ? a.sfxLevel : "nhieu";
    const LV = [["nhieu", "Nhiều", "Chữ, chữ phụ trong khối, cảnh trám vào + ra, zoom, chuyển cảnh, từ khoá phụ đề"], ["vua", "Vừa", "Chữ, khối đồ hoạ, cảnh trám, chuyển cảnh"], ["tat", "Tắt", "Chỉ âm thanh chọn riêng ở từng mục"]];
    add(field("Âm thanh hiệu ứng tự động", h("div", { class: "chips" }, LV.map(([k, t]) => h("button", { class: `chip ${lvl === k ? "on" : ""}`, onclick: () => { snapshot(); a.sfxLevel = k; changed(); renderList(); } }, t))),
      LV.find((x) => x[0] === lvl)[2] + ". Âm thanh chọn riêng ở từng mục luôn phát."));
    // Làm rõ giọng: lọc ồn quạt / xe / máy lạnh, nén cho giọng đều (ffmpeg trên máy — vài giây)
    const CL = [["", "Tắt", "Dùng tiếng gốc của video."], ["nhe", "Nhẹ", "Lọc tiếng ù và ồn nhẹ, giữ nguyên chất giọng."], ["vua", "Vừa", "Khử ồn nền rõ hơn, giọng đều và gần hơn."],
      ["manh", "Mạnh", "Khử ồn tối đa, tắt hẳn tiếng nền giữa các câu — dùng khi quay chỗ ồn (có thể hơi mất tự nhiên)."]];
    const cl = CL.some((x) => x[0] === (a.clean || "")) ? a.clean || "" : "";
    add(field("Làm rõ giọng", h("div", { class: "chips" }, CL.map(([k, t]) => h("button", {
      class: `chip ${cl === k ? "on" : ""}`, disabled: !!S.voiceBusy,
      onclick: async () => {
        if (k === cl) return;
        if (k) {
          S.voiceBusy = true; renderList(); toast("Đang làm rõ giọng…");
          try { await api("/api/voice-clean", "POST", { level: k }); } catch (e) { S.voiceBusy = false; renderList(); return toast(e.message, true); }
          S.voiceBusy = false;
        }
        snapshot(); a.clean = k; changed(); renderList();
        toast(k ? `Đã làm rõ giọng (mức ${t}). Bấm Phát để nghe.` : "Đã dùng lại tiếng gốc.");
      },
    }, S.voiceBusy && k && k !== cl ? "…" : t))), CL.find((x) => x[0] === cl)[2]));
    add(field("Âm lượng giọng", slider(a, "voice", 0, 2, 0.05, 1)),
      field("Nhạc nền", sel(a, "music", [["", "Không dùng nhạc"], ...KIT_MUSIC.map((m) => [m.id, "Có sẵn · " + m.title]), ...music.map((m) => [m, m])], ""), "Chép file nhạc không lời vào inputs/ rồi chọn ở đây."),
      field("Âm lượng nhạc", slider(a, "musicVolume", 0, 0.5, 0.01, 0.1), "Nên để 0.06–0.14 khi có người nói."),
      field('Cách lặp nhạc',(()=>{const input=sel(a,'musicLoop',[['crossfade','Nối mượt VEK'],['repeat','Lặp liền mạch']],'crossfade');input.addEventListener('input',()=>{renderList();});return input;})(),'Lặp liền mạch giữ nhịp file gốc. Bật hạ nhạc theo clip để tự lấy vùng audio; tắt để dùng vùng khai báo bên dưới.'),
      ...(a.musicLoop==='repeat'?[field('Fade vào nhạc (giây)',num(a,'musicFadeIn',.1,.5)),field('Fade ra nhạc (giây)',num(a,'musicFadeOut',.1,1)),
        field('Mức nhạc trong vùng lời nói',num(a,'musicSpeechLevel',.05,1),'Tỷ lệ so với âm lượng nhạc; 0.3 = 30%. Áp dụng cho vùng thời gian bên dưới khi tắt hạ nhạc theo clip.'),
        musicRegionControls({getRanges:()=>a.musicSpeech??[],applyRanges:value=>{snapshot();a.musicSpeech=value;changed();renderList();},total:S.tm.total,time:S.time,seek,onError:toast}),
        h('details',{},h('summary',{},'Nhập vùng nâng cao'),field('Vùng lời nói trên bản dựng (giây)',(()=>{const input=h('textarea',{'aria-label':'Vùng lời nói nhạc nền'},JSON.stringify(a.musicSpeech??[]));return h('div',{},input,h('button',{onclick:()=>{try{const value=JSON.parse(input.value);if(!Array.isArray(value)||value.length>1000||value.some(r=>!Array.isArray(r)||r.length!==2||!r.every(Number.isFinite)||r[0]<0||r[1]<=r[0]))throw new Error('Nhập dạng [[bắt đầu,kết thúc]], tối đa1000vùng.');snapshot();a.musicSpeech=value;changed();renderList();}catch(error){toast(error.message);}}},'Áp dụng vùng lời nói'));})(),'Ví dụ [[0.5,1.2],[2,3]]. Chuyển mức mượt0.4giây quanh biên. Bật hạ nhạc theo clip sẽ ưu tiên vùng clip và giữ lại danh sách này. Áp dụng rồi Lưu dự án.'))]:[]),
      field('Hạ nhạc khi có thuyết minh',h('input',{type:'checkbox','aria-label':'Hạ nhạc theo clip thuyết minh',checked:a.duckNarration===true,onchange:event=>{snapshot();a.duckNarration=event.target.checked;changed();}}),'Áp dụng theo toàn bộ clip audio riêng đang bật và có âm lượng; không phân tích khoảng im lặng hay tiếng gốc A-roll. Lưu để dùng cho bản xuất.'),
      field('Hạ nhạc theo lời A-roll',h('input',{type:'checkbox','aria-label':'Hạ nhạc theo lời A-roll',checked:a.duckSourceSpeech===true,onchange:event=>{if(event.target.checked){try{primarySpeechWindows(P(),S.transcript);}catch(error){event.target.checked=false;toast(error.message,true);return;}}snapshot();P().audio.duckSourceSpeech=event.target.checked;changed();}}),'Dùng mốc từ trong transcript hiện có, tính lại theo đoạn giữ và tốc độ. Nhận giọng trước khi bật; không tự phát hiện tiếng nói từ waveform. Dùng chung mức hạ nhạc bên dưới.'),
      field('Thời gian hạ/nâng nhạc',slider(a,'duckFade',0,2,.05,0),'Giây chuyển nhạc trước và sau vùng thuyết minh; 0 giữ chuyển tức thời. Chỉ áp dụng khi bật hạ nhạc.'),
      field('Mức nhạc còn lại khi có thuyết minh',slider(a,'duckLevel',0,1,.05,.25),'0.25 = 25% âm lượng nhạc đã đặt. Chỉ có hiệu lực khi bật hạ nhạc.'),
      field("Âm lượng hiệu ứng", slider(a, "sfxVolume", 0, 1.5, 0.05, 0.5)),
      h("hr", { class: "sep" }),
      h("div", { class: "field" }, h("label", {}, "Hiệu ứng thêm tay")));
    const list = (a.sfx = a.sfx || []);
    list.forEach((s, i) => {
      const t = h("input", { type: "number", step: 0.1, value: S.tm.srcToOut(s.at).toFixed(2) });
      t.addEventListener("change", () => { snapshot(); s.at = round3(S.tm.outToSrc(Number(t.value))); changed(); });
      add(h("div", { class: "row3", style: "margin-bottom:8px;align-items:center;grid-template-columns:80px 1fr 64px auto" }, t, sel(s, "kind", SFX, "pop"),
        bind(s, "vol", h("input", { type: "number", min: 0, max: 1.5, step: 0.05, value: s.vol ?? 1, title: "Âm lượng" }), Number),
        h("button", { class: "link danger", onclick: () => { snapshot(); list.splice(i, 1); changed({ inspector: true }); renderList(); } }, "Xoá")));
    });
    add(h("button", { class: "outline small", onclick: () => { snapshot(); list.push({ at: round3(S.tm.outToSrc(S.time)), kind: "click" }); changed(); renderList(); } }, "Thêm hiệu ứng tại playhead"));
    // Keep background music before the long voice/SFX lists, with the same bound controls.
    const musicPanel=h('section',{class:'cos-audio-panel','aria-label':'Nhạc nền'},h('h3',{},'Nhạc nền'),h('p',{class:'help'},'Chọn bài cho toàn video. Chỉnh âm lượng và hạ nhạc trong Trộn âm; bấm Lưu để giữ thay đổi.'));
    const upload=h('input',{type:'file',accept:'.mp3,.wav,.m4a,.aac',hidden:true,'aria-label':'File nhạc nền',onchange:async event=>{const file=event.target.files?.[0];event.target.value='';if(file)await uploadFile(file,{role:'music'});}});
    musicPanel.append(upload,h('div',{class:'btns'},h('button',{class:'outline small',onclick:()=>upload.click()},'Thêm nhạc từ máy'),h('button',{class:'outline small',onclick:async()=>{const {openIntake}=await import('/ui/contentos-intake.js');await openIntake({dir:S.dir,onReceived:async()=>{S.media=await api('/api/media');renderList();toast('Đã nhận tư liệu. Chọn bài trong Nhạc nền.');}});}},'Từ NAS / Điện thoại')));
    const musicLabels=new Set(['Nhạc nền','Âm lượng nhạc','Cách lặp nhạc','Fade vào nhạc (giây)','Fade ra nhạc (giây)','Mức nhạc trong vùng lời nói','Hạ nhạc khi có thuyết minh','Hạ nhạc theo lời A-roll','Thời gian hạ/nâng nhạc','Mức nhạc còn lại khi có thuyết minh']);
    for(const node of [...box.children])if(musicLabels.has(node.querySelector(':scope > label')?.textContent)||node.hasAttribute('data-music-regions')||node.tagName==='DETAILS'&&node.querySelector('[aria-label="Vùng lời nói nhạc nền"]'))musicPanel.append(node);
    const musicSelect=musicPanel.querySelector('select');if(musicSelect){musicSelect.setAttribute('aria-label','Bài nhạc nền');musicSelect.addEventListener('input',()=>renderList());}
    const sourceHelp=musicPanel.querySelector('.field .help');if(sourceHelp)sourceHelp.textContent='Dùng bài có sẵn hoặc nhập nhạc của bạn bằng nút phía trên.';
    const musicSummary=h('p',{class:'help'},a.music?'Đang dùng: '+a.music:'Chưa chọn nhạc nền.');musicPanel.prepend(musicSummary);
    box.prepend(musicPanel);
    musicPanel.append(h('button',{class:'outline small',onclick:()=>{S.lib.saving=true;openLibrary(true);}},'Lưu phong cách và âm thanh thành mẫu…'));
    musicPanel.append(h('button',{class:'outline small',onclick:()=>{const brief='Chọn nhạc nền phù hợp từ nhạc có sẵn hoặc file audio đã nhập, giữ tiếng nói rõ, chỉnh nhạc nhỏ và SFX vừa phải. Không đổi nội dung, đoạn cắt hoặc lời đọc. Báo rõ bài đã chọn và các thay đổi âm thanh.';S.ai.text=S.ai.text?.trim()?S.ai.text+'\n'+brief:brief;S.ai.omitSelection=true;toggleAiChat(true);renderAiChat();}},'Nhờ AI chọn nhạc và SFX…'));
    const voicePanel=h('section',{class:'cos-audio-panel','aria-label':'Giọng nói'},h('h3',{},'Giọng nói'));
    voicePanel.append(...voiceNodes);
    const mixPanel=h('section',{class:'cos-audio-panel','aria-label':'Trộn âm'},h('h3',{},'Trộn âm'),h('p',{class:'help'},'Cân bằng tiếng nói, nhạc và hiệu ứng. Thay đổi dùng chung cho preview và bản xuất.'));
    const mixLabels=new Set(['Âm lượng giọng','Âm lượng nhạc','Âm lượng hiệu ứng','Hạ nhạc khi có thuyết minh','Hạ nhạc theo lời A-roll','Thời gian hạ/nâng nhạc','Mức nhạc còn lại khi có thuyết minh']);
    for(const node of [...box.children,...musicPanel.children]){
      const label=node.querySelector(':scope > label')?.textContent;
      if(mixLabels.has(label))mixPanel.append(node);
      else if(label==='Làm rõ giọng')voicePanel.append(node);
    }
    const sfxPanel=h('section',{class:'cos-audio-panel','aria-label':'Kho hiệu ứng âm thanh'},h('h3',{},'Hiệu ứng âm thanh'));
    for(const node of [...box.children])if(node!==musicPanel&&node.tagName!=='HR')sfxPanel.append(node);
    sfxPanel.append(sfxLibrary());
    musicPanel.insertBefore(audioMusicBrowser(music,a),musicSelect?.closest('.field')||null);
    if(musicSelect)musicSelect.closest('.field').hidden=true;
    const panels={music:musicPanel,voice:voicePanel,sfx:sfxPanel,mix:mixPanel};
    box.replaceChildren(...Object.entries(panels).map(([key,panel])=>{panel.hidden=key!==audioGroup;panel.dataset.audioPanel=key;return panel;}));
  } else if (S.tab === "camera") {
    const c = (P().camera = P().camera || {});
    // mẫu có nền thay sau người: bật / tắt + đặt người (tâm mặt, cỡ) — thay cho phóng / dịch khung thường
    const bd = P().brand?.backdrop;
    if (bd) {
      const on = h("input", { type: "checkbox", style: "width:auto", checked: !bd.off, onchange: (e) => { snapshot(); bd.off = !e.target.checked; changed({ inspector: true }); } });
      add(field("Nền", h("label", { class: "inline" }, on, "Nền thay sau người (của mẫu)")),
        h("div", { class: "help" }, c.matte ? "Người tách nền đứng trên tấm nền đồ hoạ của mẫu, cảnh trám nằm dưới người." : "Cần lớp tách nền người — nhờ AI tạo matte (npx hyperframes remove-background) thì nền mới hiện."));
      if (!bd.off) {
        const pl = (bd.place = bd.place || { x: 0.5, y: 0.6, scale: 0.72 });
        add(field("Cỡ người", slider(pl, "scale", 0.4, 1.4, 0.01, 0.72)),
          field("Tâm mặt theo chiều ngang", slider(pl, "x", 0.2, 0.8, 0.01, 0.5)),
          field("Tâm mặt theo chiều dọc", slider(pl, "y", 0.25, 0.8, 0.01, 0.6)),
          field("Vị trí mắt trong video gốc", slider(c, "faceY", 0.15, 0.65, 0.01, 0.36), "Đặt đúng chỗ mắt trong video quay để người đứng đúng vị trí."));
        return box;
      }
    }
    add(field("Phóng to khung", slider(c, "scale", 1, 1.8, 0.01, 1)),
      field("Dịch ngang (px)", slider(c, "x", -500, 500, 2, 0)),
      field("Dịch dọc (px)", slider(c, "y", -600, 600, 2, 0)),
      field("Vị trí mắt theo chiều dọc", slider(c, "faceY", 0.15, 0.65, 0.01, 0.36), "Dùng làm tâm zoom và để đặt mặt khi chia màn hình."));
  } else if (S.tab === "filters") {
    filtersForm(box);
  } else if (S.tab === "skin") {
    skinForm(box);
  } else if (S.tab === "beauty") {
    beautyForm(box);
  } else if (S.tab === "adjust") {
    adjustForm(box);
  } else if (S.tab === "vfx") {
    vfxForm(box);
  } else if (S.tab === "brand") {
    brandForm(box);
  }
  return box;
}

function refreshTextTypography(){
 const doc=frameDoc();if(!doc)return false;
 if(!doc.querySelector('[data-text-fonts]')){const link=doc.createElement('link');link.rel='stylesheet';link.href='/ui/fonts/fonts.css';link.dataset.textFonts='1';doc.head.append(link);}
 const brand=ensureBrand();
 for(const it of P().texts||[]){const root=doc.getElementById(it.id);if(!root)continue;
  for(const [key,selector] of [['fontTitle','.tx-title'],['fontLabel','.tx-label'],['fontSub','.tx-sub']]){const el=root.querySelector(selector);if(!el)continue;const style=doc.createElement('span').style;style.cssText=(key==='fontTitle'?'--fs:'+(it.size??118)+'px;':'')+textTypographyStyle(it,key,brand);for(const property of ['font-family','font-weight','font-style','--fs','font-size','letter-spacing','line-height']){el.style.removeProperty(property);if(style.getPropertyValue(property))el.style.setProperty(property,style.getPropertyValue(property));}}
 }
 for(const it of P().texts||[]){const root=doc.getElementById(it.id);if(!root)continue;for(const [key,selector] of [['appearance','.tx-title'],['labelAppearance','.tx-label'],['subAppearance','.tx-sub']]){const el=root.querySelector(selector);if(!el)continue;const style=doc.createElement('span').style;style.cssText=textAppearanceStyle(it[key]);el.classList.toggle('tx-painted',!!style.length);for(const prop of ['--ta-fill','--ta-ink','--ta-stroke','--ta-shadow','--ta-ring','--ta-slant','--ta-weight']){el.style.removeProperty(prop);if(style.getPropertyValue(prop))el.style.setProperty(prop,style.getPropertyValue(prop));}}}
 const markup=fontLinks({...brand,extraFontNames:(P().texts||[]).flatMap(t=>[t.fontTitle,t.fontSub,t.fontLabel])});
 const parsed=new DOMParser().parseFromString(markup,'text/html');for(const link of parsed.querySelectorAll('link[href]')){if(![...doc.querySelectorAll('link[href]')].some(l=>l.href===link.href)){doc.head.append(doc.importNode(link,true));}}
 requestAnimationFrame(updateSelection);return true;
}
// Sửa chữ kiểu CapCut: bảng Văn bản ghi vào 1 chữ nguồn; spreadText() chép phần kiểu vừa đổi sang các chữ đang chọn cùng (S.multi).
// Gọi trước khi vẽ lại, cùng bước hoàn tác với snapshot() của control.
function spreadText(){const e=S.textEdit;if(!e||!e.targets.length||!P().texts?.includes(e.it))return;spreadTextEdit(e.base,e.it,e.targets);e.base=structuredClone(e.it);}
function textGroup(){return (S.multi?.length>1?multiItems():[]).filter(m=>m.key==='texts').map(m=>m.it);}
function typographyCommit(){spreadText();const patched=refreshTextTypography();changed({reload:!patched,list:false});}
function typographyInput(it,key,label,min,max,step,placeholder){
 const input=h('input',{type:'number',min,max,step,value:it[key]??'',placeholder,'aria-label':label});
 input.oninput=()=>{snapshot();if(input.value==='')delete it[key];else if(input.validity.valid)it[key]=Number(input.value);else return;typographyCommit();};return field(label,input);
}
function textFontControls(it,key,label){
 const brand=ensureBrand(),family=it[key]||brand[key],variants=fontVariants(family);
 const familySelect=h('select',{'aria-label':label},[["",`Theo mẫu (${brand[key]})`],...fontOptions(it[key])].map(([value,name])=>h('option',{value,selected:(it[key]||'')===value},name)));
 familySelect.oninput=()=>{snapshot();if(familySelect.value)it[key]=familySelect.value;else delete it[key];if(it[key+'Variant']&&!fontVariants(it[key]||brand[key]).some(v=>v.id===it[key+'Variant']))delete it[key+'Variant'];typographyCommit();renderInspector();};
 const styleSelect=h('select',{'aria-label':'Kiểu '+label.toLowerCase()},[["","Theo mẫu"],...variants.map(v=>[v.id,v.label])].map(([value,name])=>h('option',{value,selected:(it[key+'Variant']||'')===value},name)));
 styleSelect.oninput=()=>{snapshot();if(styleSelect.value)it[key+'Variant']=styleSelect.value;else delete it[key+'Variant'];typographyCommit();};
 const prefix=key==='fontTitle'?'':key==='fontLabel'?'label':'sub',size=prefix?prefix+'Size':'size',spacing=prefix?prefix+'LetterSpacing':'letterSpacing',height=prefix?prefix+'LineHeight':'lineHeight';
 return h('div',{},h('div',{class:'field'},h('label',{},label),h('div',{style:'display:grid;grid-template-columns:minmax(0,1fr) minmax(110px,.6fr);gap:8px'},familySelect,styleSelect)),h('div',{class:'row3'},typographyInput(it,size,'Cỡ '+label.toLowerCase()+' (px)',12,300,1,key==='fontTitle'?'118':key==='fontLabel'?'28':'46'),typographyInput(it,spacing,'Giãn chữ '+label.toLowerCase()+' (px)',-10,40,.1,'Theo mẫu'),typographyInput(it,height,'Giãn dòng '+label.toLowerCase(),.7,3,.05,'Theo mẫu')));
}
function renderInspector() {
  const root = $("#inspector");
  root.innerHTML = "";
  root.append(renderRenderBox());
  const box = h("div", { class: "insp" });
  root.append(box);
  S.textEdit = null;
  const group = S.tab === "texts" && !S.selKind && !S.panel ? textGroup() : [];
  const it = group.length > 1 && !group.includes(selected()) ? group[0] : selected();
  const add = (...els) => box.append(...els.filter(el=>el!=null&&el!==false));
  if (S.panel) { renderPanel(box); return; }

  if (!it) { box.remove(); return; } // chưa chọn mục: không hiện hướng dẫn

  if (S.tab === "texts" && !S.selKind) {
    const others = group.length > 1 && group.includes(it) ? group.filter((t) => t !== it) : [];
    S.textEdit = { it, base: structuredClone(it), targets: others };
    const allOthers = itemsOf("texts").filter((t) => t !== it);
    const applyAll = h("button", { class: "outline small", disabled: !allOthers.length, title: "Chép kiểu chữ, font, màu, hiệu ứng, vị trí của chữ này sang mọi chữ khác (giữ nội dung và thời gian)", onclick: () => {
      snapshot(); copyTextStyle(it, allOthers); changed({ inspector: true }); toast(`Đã áp kiểu cho ${allOthers.length + 1} chữ. Ctrl+Z để hoàn tác.`);
    } }, "Áp cho tất cả chữ");
    add(h("h3", {}, others.length ? `Đang sửa ${others.length + 1} chữ` : "Sửa chữ"),
      h("div", { class: "sub txt-scope" }, others.length ? `Thay đổi kiểu áp cho ${others.length + 1} chữ đã chọn · nội dung, thời gian giữ riêng` : `${it.id} · hiện lúc ${fmt(outStart(it))} · chỉ chữ này`, applyAll),
      field("Nhãn", txt(it, "label", "VD: BƯỚC 1")),
      field("Tiêu đề", area(it, "title"), "Bọc *từ* để nhấn marker · dùng | để xuống dòng · 2–6 từ, tối đa 2 dòng."),
      textFontControls(it,"fontTitle","Font tiêu đề"),
      textAppearanceControls(it,"appearance","Màu & kiểu tiêu đề",{h,field,snapshot,commit:typographyCommit}),
      field("Chữ phụ", txt(it, "sub")),
      h("details",{},h("summary",{},"Font nhãn & chữ phụ"),textFontControls(it,"fontLabel","Font nhãn"),textFontControls(it,"fontSub","Font chữ phụ"),textAppearanceControls(it,"labelAppearance","Màu & kiểu nhãn",{h,field,snapshot,commit:typographyCommit}),textAppearanceControls(it,"subAppearance","Màu & kiểu chữ phụ",{h,field,snapshot,commit:typographyCommit})),
      h("details",{class:"txfx-box",open:true},h("summary",{},"Hiệu ứng chữ (kiểu CapCut)"),textEffectsControls(it,{h,field,snapshot,commit:(redraw=false,rebuild=true)=>rebuild?changed({inspector:redraw,list:false}):renderInspector()})),
      field(it.anim?.in?"Hiệu ứng vào (đang dùng Hoạt ảnh Vào)":"Hiệu ứng vào", sel(it, "fx", FX, "words")),
      sfxFields(it, "Tự động (pop / gõ phím)", it.fx === "type" ? "keys" : "pop"),
      timeFields(it),
      h("div", { class: "row3" },
        field("Dịch ngang", num(it, "x", 2, 0)),
        field("Dọc", num(it, "y", 2, 1180)),
        field("Tỷ lệ", num(it, "scale", 0.01, 1))),
      itemButtons(it, "texts"));
    const warn = [];
    const y = Number(it.y ?? 1180);
    if (y > 1500) warn.push("Chữ đang lấn vùng giao diện TikTok/Reels phía dưới (20%).");
    if (y < 760) warn.push("Chữ có thể đè lên mặt — nên đặt gần ngực.");
    if (Math.abs(Number(it.x || 0)) > 0) warn.push("Cụm chữ đang lệch khỏi trục giữa x = 540.");
    const words = (it.title || "").replace(/[*|]/g, " ").trim().split(/\s+/).filter(Boolean).length;
    if (words > 6) warn.push(`Tiêu đề có ${words} từ — nên 2–6 từ mỗi nhịp.`);
    if (warn.length) add(h("div", { class: "note" }, h("b", {}, "Lưu ý"), ...warn.map((w) => h("div", { class: "help" }, "• " + w))));
  } else if (S.tab === "captions") {
    const { o, d } = lineTimes(it);
    const ta = h("textarea", { rows: 3 }, lineText(it));
    let snapped = false;
    ta.addEventListener("focus", () => (snapped = false));
    ta.addEventListener("input", () => { if (!snapped) { snapshot(); snapped = true; } Object.assign(it, retimeLine(it, ta.value)); changed({ list: false });
      const row = document.querySelector(`.capr[data-id="${it.id}"] input`); if (row) row.value = ta.value; });
    const lines = itemsOf("captions"), idx = lines.indexOf(it);
    add(h("h3", {}, "Dòng phụ đề"), h("div", { class: "sub" }, o < 0 ? "Nằm trong đoạn đã cắt" : `${fmt(o)} → ${fmt(o + d)}`),
      field("Nội dung", ta, "Giữ nguyên số từ thì mốc từng từ không đổi; thêm/bớt từ thì thời gian được chia lại."),
      h("div", { class: "row" },
        field("Vị trí dọc riêng (px)", bind(it, "y", h("input", { type: "number", step: 10, value: it.y ?? "", placeholder: `Theo cả video (${ensureCaptions().y})` }), (v) => (v === "" ? "" : Number(v)))),
        field("Lớp", h("label", { class: "inline" }, chk(it, "behind", !!ensureCaptions().behind), "Nằm sau người"))),
      ensureBrand().caption.style === "stack" ? field("Hiệu ứng từng từ", h("div", { class: "wfx" }, ...it.words.map((w) =>
        h("label", { class: "wfx-i" }, h("span", {}, w.w), sel(w, "fx", WORD_FX, ""))))) : null,
      h("div", { class: "btns" },
        idx < lines.length - 1 ? h("button", { class: "link", onclick: () => {
          snapshot();
          const n = lines[idx + 1];
          it.words = [...it.words, ...n.words];
          lines.splice(idx + 1, 1);
          changed({ inspector: true }); renderList();
        } }, "Gộp với dòng sau") : null,
        it.words.length > 1 ? h("button", { class: "link", onclick: () => {
          snapshot();
          const k = Math.ceil(it.words.length / 2);
          lines.splice(idx + 1, 0, { id: uid("c", lines), words: it.words.slice(k) });
          it.words = it.words.slice(0, k);
          changed({ inspector: true }); renderList();
        } }, "Tách đôi") : null,
        h("button", { class: "link danger", onclick: () => { snapshot(); lines.splice(idx, 1); S.selId = null; changed({ inspector: true }); renderList(); } }, "Xoá dòng")));
  } else if (S.tab === "segments") {
    const kept = it.keep !== false;
    add(h("h3", {}, "Đoạn lời nói"), h("div", { class: "sub" }, kept ? "Đang giữ trong bản dựng" : "Đang bị cắt khỏi bản dựng"),
      P().source?.timeline==='segments'?(()=>{const ordered=P().segments.slice().sort((a,b)=>a.in-b.in),index=ordered.findIndex(s=>s.id===it.id),move=step=>{try{const ids=ordered.map(s=>s.id);[ids[index],ids[index+step]]=[ids[index+step],ids[index]];const next=reorderPrimaryClips(P(),ids);snapshot();S.project=next;changed({inspector:true});renderList();toast('Đã đổi thứ tự; kiểm tra nội dung tại điểm nối rồi Lưu.');}catch(error){toast(error.message,true);}};return h('div',{},h('div',{class:'btns'},h('button',{disabled:index===0,onclick:()=>move(-1)},'Đưa đoạn lên trước'),h('button',{disabled:index===ordered.length-1,onclick:()=>move(1)},'Đưa đoạn ra sau')),h('p',{class:'help'},'Chữ/phụ đề/clip âm thanh theo đoạn neo. Nhạc nền và vùng hạ nhạc giữ mốc đầu ra; kiểm tra nội dung kéo qua điểm nối. Lời nhận giọng cần tạo lại sau đổi thứ tự.'));})():null,
      field("Nội dung", area(it, "text")),
      kept?h('button',{class:'outline small','data-primary-plate-privacy':'',onclick:()=>editPlatePrivacy(it,'segments')},'Che biển số · tracking local'):'',
      it.platePrivacy?h('button',{class:'outline small','data-review-plate':'',onclick:openPlateReview},'Kiểm tra bản che trước tự xuất'):'',
      it.platePrivacy?h('button',{class:'outline small','data-restore-primary-privacy':'',onclick:()=>{try{const next=restorePrimaryPrivacy(P(),it.id);snapshot();S.project=next;changed({inspector:true});renderList();}catch(error){toast(error.message,true);}}},'Khôi phục nguồn trước khi che'):'',
      it.src?h('p',{class:'help'},'Nguồn: '+it.src+' · bắt đầu file '+(it.mediaStart??0)+'s. Mốc Vào/Ra bên dưới thuộc timeline chung.'):null,
      it.src?field('Bắt đầu trong file nguồn (giây)',num(it,'mediaStart',.05)):null,
      field('Đặt video vào khung',sel(it,'fit',[['cover','Lấp đầy khung (cắt mép)'],['contain','Hiện toàn bộ hình (có viền)']],'cover'),'Áp cho đoạn đang chọn, giữ tỷ lệ video gốc.'),
      (()=>{const root=h('section',{'aria-label':'Zoom chuyển động đoạn video'}),zoom=it.motionZoom;root.append(h('h4',{},'Zoom chuyển động'));const commit=value=>{try{const next=normalizeSourceZoom(value);snapshot();if(next)it.motionZoom=next;else delete it.motionZoom;changed({inspector:true});renderList();}catch(e){toast(e.message,true);}};if(!zoom){root.append(h('button',{onclick:()=>commit({origin:'50% 38%',keys:[{time:0,scale:1},{time:1,scale:1.15}]})},'Thêm chuyển động zoom'));return root;}const origin=h('input',{'aria-label':'Tâm zoom đoạn video',value:zoom.origin??'50% 38%'});root.append(field('Tâm zoom (%)',origin));zoom.keys.forEach((key,index)=>{const time=h('input',{type:'number',min:0,step:.01,value:key.time,'aria-label':'Giây mốc zoom '+(index+1)}),scale=h('input',{type:'number',min:.1,max:10,step:.05,value:key.scale,'aria-label':'Cỡ mốc zoom '+(index+1)}),ease=h('select',{},['linear','out','inOut'].map(value=>h('option',{value,selected:(key.ease??'inOut')===value},value)));root.append(h('div',{},field('Giây từ đầu đoạn',time),field('Hệ số zoom',scale),ease,h('button',{onclick:()=>{const next=structuredClone(zoom);next.origin=origin.value;next.keys[index]={time:Number(time.value),scale:Number(scale.value),ease:ease.value};commit(next);}},'Áp mốc '+(index+1)),h('button',{disabled:zoom.keys.length<=2,onclick:()=>commit({...zoom,keys:zoom.keys.filter((_,i)=>i!==index)})},'Xóa mốc '+(index+1))));});root.append(h('button',{onclick:()=>commit({...zoom,keys:[...zoom.keys,{time:zoom.keys.at(-1).time+1,scale:zoom.keys.at(-1).scale,ease:'inOut'}]})},'Thêm mốc zoom'),h('button',{onclick:()=>commit(null)},'Bỏ chuyển động zoom'),h('p',{class:'help'},'Mốc theo giây chuyển động gốc; clip bắt đầu tại '+(zoom.timeOffset??0)+'s trên chuyển động này. Không nhân với tốc độ nguồn.'));return root;})(),
      h('button',{class:'outline small','data-color-normalize':'segments',onclick:()=>editColorNormalization(it,'segments')},'Chuẩn hóa màu nguồn…'),
      it.colorNormalization?h('button',{class:'link',onclick:()=>{snapshot();S.project=restoreColorNormalization(P(),'segments',it.id);changed({inspector:true});renderList();}},'Khôi phục màu nguồn gốc'):'',
      h('button',{class:'outline small','data-shot-color':'segments',onclick:()=>editShotColor(it,'segments')},'Phân tích màu cảnh…'),
      field('Màu riêng đoạn video',h('div',{},...Object.entries(SOURCE_COLOR_RANGES).map(([key,[min,max]])=>{const label={brightness:'Độ sáng',contrast:'Tương phản',saturation:'Bão hòa',temperature:'Nhiệt độ',tint:'Sắc xanh/hồng',hue:'Xoay màu',blur:'Làm mờ',vignette:'Tối góc'}[key],input=h('input',{type:'number',min,max,step:key==='hue'||key==='blur'?1:.05,value:it.color?.[key]??0,'aria-label':label+' đoạn video',oninput:()=>{const v=Number(input.value);if(!Number.isFinite(v)||v<min||v>max)return toast('Thông số màu ngoài phạm vi.',true);snapshot();it.color={...(it.color||{}),[key]:v};changed();}});return field(label,input);}),(()=>{const select=h('select',{'aria-label':'Preset màu đoạn video',oninput:()=>{snapshot();it.color={...(it.color||{}),preset:select.value};changed();}},[['','Không dùng preset'],...Object.keys(SOURCE_COLOR_PRESETS).map(k=>[k,k])].map(([value,label])=>h('option',{value,selected:(it.color?.preset??'')===value},label)));return field('Preset màu',select);})()),'0 giữ nguyên thông số; màu riêng được áp bên trong màu chung của video.'),
      field('Biến đổi khung nguồn',h('div',{},...[['x','Dịch ngang',-1,1,.01,0],['y','Dịch dọc',-1,1,.01,0],['scale','Phóng to',.1,5,.05,1],['rotate','Xoay (độ)',-180,180,1,0]].map(([key,label,min,max,step,fallback])=>{const input=h('input',{type:'number',min,max,step,value:it.transform?.[key]??fallback,'aria-label':label+' khung nguồn',oninput:()=>{const v=Number(input.value);if(!Number.isFinite(v)||v<min||v>max)return toast('Giá trị biến đổi ngoài phạm vi.',true);snapshot();it.transform={...(it.transform||{}),[key]:v};changed();}});return field(label,input);}),...['flipH','flipV'].map((key,i)=>{const input=h('input',{type:'checkbox',checked:it.transform?.[key]===true,'aria-label':i?'Lật dọc khung nguồn':'Lật ngang khung nguồn',onchange:()=>{snapshot();it.transform={...(it.transform||{}),[key]:input.checked};changed();}});return field(i?'Lật dọc':'Lật ngang',input);})), 'Dịch 1 bằng một cạnh khung; phóng/xoay quanh tâm. Áp riêng clip đang chọn.'),
      field('Cắt vùng nguồn',h('div',{},...['top','right','bottom','left'].map((edge,i)=>{const label=['Trên','Phải','Dưới','Trái'][i],input=h('input',{type:'number',min:0,max:45,step:.1,value:Math.round((it.crop?.[edge]??0)*10000)/100,'aria-label':'Cắt nguồn '+label, oninput:()=>{const v=Number(input.value);if(!Number.isFinite(v)||v<0||v>45)return toast('Cắt mỗi cạnh từ0đến45%.',true);snapshot();it.crop={...(it.crop||{}),[edge]:v/100};changed();}});return field(label+' (%)',input);})), 'Cắt theo phần trăm hình gốc trước khi đặt vào khung; 0 giữ nguyên cạnh.'),
      field('Âm lượng đoạn video',slider(it,'audioVolume',0,2,.05,1),'Nhân với Âm lượng giọng trong Âm thanh. 0 = tắt tiếng riêng đoạn này.'),
      it.audioEnvelope?h('p',{class:'help'},'Âm lượng giữ theo đoạn gốc tại '+it.audioEnvelope.offset+'s. Đổi fade sẽ đặt lại đường âm lượng cho clip này.'):null,
      field('Fade vào tiếng đoạn (giây)',slider(it,'audioFadeIn',0,10,.01,.02)),
      field('Fade ra tiếng đoạn (giây)',slider(it,'audioFadeOut',0,10,.01,.02),'Thời gian theo bản dựng; tổng fade không vượt độ dài đoạn.'),
      h("div", { class: "row" },
        field(it.src ? "Vào (timeline nguồn chung)" : "Vào (giây gốc)", it.src ? sourceTrimInput(it,'l') : num(it, "in", 0.05)),
        field(it.src ? "Ra (timeline nguồn chung)" : "Ra (giây gốc)", it.src ? sourceTrimInput(it,'r') : num(it, "out", 0.05))),
      h("div", { class: "help" }, "Nới 0.05–0.15s nếu bị mất phụ âm đầu/đuôi câu. Có thể kéo mép clip trên track Video."),
      field("Chuyển cảnh vào đoạn này", sel(it, "tIn", [["", "Theo mặc định của video"], ...CUT_TRANSITIONS], "")),
      h("div", { class: "row" },
        field("Tốc độ đoạn này", (() => {
          const el = h("select", {}, [["", "Theo cả video"], ...SPEEDS].map(([v, l]) => h("option", { value: v, selected: String(it.speed ?? "") === v }, l)));
          el.onchange = () => { snapshot(); for (const x of itemsOf("segments")) if ((x.g || x.id) === (it.g || it.id)) { if (el.value) x.speed = Number(el.value); else delete x.speed; } changed({ inspector: true }); };
          return el;
        })()),
        field("Tốc độ cả video", speedAll())),
      h("div", { class: "btns" },
        h("button", { class: "link", onclick: () => { snapshot(); it.keep = !kept; changed({ inspector: true }); } }, kept ? "Cắt đoạn này" : "Giữ lại đoạn này"),
        kept ? h("button", { class: "link", onclick: () => { seek(S.tm.srcToOut(it.in)); player.play(); } }, "Nghe đoạn này") : null));
  } else if (S.tab === "zooms") {
    add(h("h3", {}, "Zoom người nói"), h("div", { class: "sub" }, "Chỉ zoom ở câu quan trọng, 6–10%."),
      timeFields(it), field("Kiểu zoom", sel(it, "mode", [["", "Mượt (phóng dần)"], ["cut", "Cắt nhảy khung gần (như 2 máy quay)"], ["board", "Bảng đồ hoạ (người thu xuống khung dưới, nền tối phía trên)"],
        ["frame", "Khung giữa (người thu vào khung giữa màn hình, nền phía sau)"]], "")),
      it.mode === "board" || it.mode === "frame" ? field("Cỡ người trong khung", slider(it, "amount", 0.2, 0.99, 0.01, it.mode === "frame" ? 0.62 : 0.89)) : field("Mức zoom", slider(it, "amount", 1.02, it.mode === "cut" ? 1.8 : 1.2, 0.01, 1.08)),
      it.mode === "board" ? field("Mép trên khung (px)", slider(it, "top", 1100, 1700, 10, 1520)) : null,
      ...(it.mode === "frame" ? [
        field("Khung: trái (px)", slider(it, "x", 0, frameW() - 100, 2, Math.round(frameW() * 0.21))), field("Khung: trên (px)", slider(it, "y", 0, frameH() - 100, 2, Math.round(frameH() * 0.19))),
        field("Khung: rộng (px)", slider(it, "w", 100, frameW(), 2, Math.round(frameW() * 0.58))), field("Khung: cao (px)", slider(it, "h", 100, frameH(), 2, Math.round(frameH() * 0.56))),
        field("Vị trí mặt trong khung", slider(it, "face", 0.15, 0.7, 0.01, 0.36)), field("Thu vào / phóng ra (giây, 0 = cắt thẳng)", slider(it, "ease", 0, 1.2, 0.05, 0.6)),
        field("Trôi chậm (phóng dần tới)", slider(it, "drift", 1, 1.2, 0.01, 1)),
        field("Vào", sel(it, "in", [["", "Thu từ toàn khung"], ["up", "Lia vào từ dưới"], ["down", "Lia vào từ trên"], ["left", "Lia vào từ phải"], ["right", "Lia vào từ trái"]], "")),
        field("Ra", sel(it, "out", [["", "Phóng về toàn khung"], ["up", "Lia lên"], ["down", "Lia xuống"], ["left", "Lia sang trái"], ["right", "Lia sang phải"], ["cut", "Cắt thẳng"]], ""))] : []),
      sfxFields(it, null, null), h("div", { class: "help" }, "Gợi ý: swish hoặc whoosh nhẹ cho zoom nhấn ý, boom cho câu chốt mạnh."),
      itemButtons(it, "zooms"));
  } else if (S.tab === "scenes") {
    const d = (it.data = it.data || {});
    add(h("h3", {}, "Cảnh minh hoạ nền đen"), h("div", { class: "sub" }, "Mỗi cảnh một ý, các phần hiện theo nhịp lời nói."),
      field("Kiểu cảnh", (() => { const s = sel(it, "type", SCENE_TYPES, "process"); s.addEventListener("change", () => renderInspector()); return s; })()),
      timeFields(it),
      field("Hiệu ứng xuất hiện", sel(it, "tIn", ENTER_TRANSITIONS, "fade")),
      sfxFields(it, "Tự động (whoosh)", "whoosh"),
      field("Nhãn nhỏ", txt(d, "kicker")),
      field("Tiêu đề", txt(d, "title")));
    if (it.type === "process") add(field("Các bước", lines(d, "steps", "Mỗi dòng một bước")));
    if (it.type === "chips") add(field("Các thẻ", lines(d, "items", "Mỗi dòng một thẻ")),
      field("Biểu tượng", sel(d, "icon", [["search", "Kính lúp"], ["check", "Dấu tích"], ["dot", "Chấm"]], "search")),
      h("div", { class: "help" }, "Thẻ đè trong suốt lên video, hiện lần lượt. Kéo phần nội dung trên video để đổi chỗ."));
    if (it.type === "stat") add(
      h("div", { class: "row3" }, field("Giá trị", num(d, "value", 1)), field("Tiền tố", txt(d, "prefix")), field("Hậu tố", txt(d, "suffix", "%"))),
      h("div", { class: "row" }, field("Thang tối đa (thanh)", num(d, "max", 1)), field("Số lẻ", num(d, "decimals", 1, 0))),
      field("Mô tả", txt(d, "label")),
      h("div", { class: "help" }, "Chỉ dùng số liệu có trong tư liệu — không tự tạo số."));
    if (it.type === "compare") add(
      field("Nhãn trước", txt(d, "beforeLabel", "Trước")), field("Ý trước", lines(d, "before")),
      field("Nhãn sau", txt(d, "afterLabel", "Sau")), field("Ý sau", lines(d, "after")));
    if (it.type === "timeline") {
      const el = h("textarea", { placeholder: "2023 | Ra mắt\n2024 | 1 triệu người dùng" }, (d.items || []).map((x) => `${x.time} | ${x.label}`).join("\n"));
      el.addEventListener("input", () => {
        snapshot();
        d.items = el.value.split("\n").map((l) => l.split("|")).filter((p) => p[0]?.trim()).map((p) => ({ time: p[0].trim(), label: (p[1] || "").trim() }));
        changed();
      });
      add(field("Các mốc (thời gian | nội dung)", el));
    }
    if (it.type === "doc") {
      const hl = h("input", { value: [].concat(d.highlight ?? []).join(", "), placeholder: "VD: 1, 3" });
      hl.addEventListener("input", () => { snapshot(); d.highlight = hl.value.split(/[,\s]+/).filter(Boolean).map((n) => Number(n) - 1); changed(); });
      add(field("Tên tài liệu", txt(d, "docTitle")), field("Các dòng", lines(d, "lines")),
        field("Dòng được đánh dấu (số thứ tự)", hl), field("Kết quả", txt(d, "result")));
    }
    add(h("div", { class: "note" }, h("b", {}, "Chỉnh trên video"), h("br"), "Bấm vào tiêu đề hoặc phần nội dung của cảnh trên video để kéo riêng từng phần; kéo 4 góc để phóng to/thu nhỏ."),
      h("div", { class: "btns", style: "border:0;padding-top:4px" },
        h("button", { class: "link", onclick: () => { snapshot(); delete it.layout; changed({ inspector: true }); } }, "Đặt lại bố cục cảnh")));
    add(itemButtons(it, "scenes"));
  } else if ((S.selKind || S.tab) === "blocks") {
    const code = (key, rows) => { const el = h("textarea", { rows, spellcheck: "false", style: "font:12px/1.45 ui-monospace,Consolas,monospace" }, it[key] || ""); el.addEventListener("input", () => { snapshot(); it[key] = el.value; changed(); }); return el; };
    const anim = h("textarea", { rows: 5, spellcheck: "false", style: "font:12px/1.45 ui-monospace,Consolas,monospace" }, it.anim ? JSON.stringify(it.anim, null, 1) : "");
    anim.addEventListener("change", () => { try { snapshot(); it.anim = anim.value.trim() ? JSON.parse(anim.value) : []; changed(); anim.style.borderColor = ""; } catch { anim.style.borderColor = "#e5484d"; toast("Chuyển động: JSON chưa đúng", true); } });
    add(h("h3", {}, it.preset ? it.name : "Đồ hoạ tự do"), h("div", { class: "sub" }, `${it.id} · hiện lúc ${fmt(outStart(it))}`));
    add(h("button", { class: "outline small kho-save", onclick: () => saveToKho(it, "blocks") }, "⭐ Lưu vào kho hiệu ứng"));
    const pointer=featurePointerControls({item:it,onChange:html=>{snapshot();it.html=html;changed();}});if(pointer)add(pointer);
    for (const f of it.fields || []) {
      const inp = h("input", { value: fieldValue(it, f) });
      inp.addEventListener("input", () => { snapshot(); setFieldValue(it, f, inp.value); changed(); });
      add(field(f.label, inp, f.words ? "Chữ sáng dần từng từ theo thứ tự." : null));
    }
    if (!it.fields?.length) autoTextFields(it).forEach(({ text }, k, all) => {
      const inp = h("input", { value: text });
      inp.addEventListener("input", () => { snapshot(); const hien = autoTextFields(it)[k]; if (hien) setAutoText(it, hien.i, inp.value, hien.words); changed(); });
      add(field(all.length > 1 ? `Chữ ${k + 1}` : "Chữ", inp));
    });
    add(field("Tên", txt(it, "name")),
      timeFields(it),
      h("div", { class: "row" },
        field("Lớp", sel(it, "layer", [["front", "Trước người"], ["behind", "Sau người (cần tách nền)"]], "front")),
        field("Hiệu ứng vào", sel(it, "fx", [["pop", "Bật ra"], ["fade", "Mờ dần"], ["rise", "Trồi lên"], ["drop", "Rơi xuống"], ["left", "Từ trái"], ["right", "Từ phải"], ["mask", "Mọc trong khung"], ["blur", "Nhoè vào"], ["pan-up", "Lia vào từ dưới (cả khung)"], ["pan-down", "Lia vào từ trên (cả khung)"], ["pan-left", "Lia vào từ phải (cả khung)"], ["pan-right", "Lia vào từ trái (cả khung)"], ["pan", "Lia chéo theo mẫu (nối cảnh)"], ["none", "Không"]], "pop"))),
      field("Hiệu ứng ra", sel(it, "out", [["fade", "Mờ dần"], ["pop", "Thu lại"], ["drop", "Rơi xuống"], ["pan-up", "Lia lên (cả khung)"], ["pan-down", "Lia xuống (cả khung)"], ["pan-left", "Lia sang trái (cả khung)"], ["pan-right", "Lia sang phải (cả khung)"], ["pan", "Lia chéo theo mẫu (nối cảnh)"], ["none", "Không (cắt)"]], "fade")),
      sfxFields(it, "Tự động (pop)", "pop"),
      h("details", { class: "adv" }, h("summary", {}, "Nâng cao (mã)"),
        field("Nội dung (HTML)", code("html", 6), "Không chạy được script."),
        field("Kiểu (CSS)", code("css", 6), ":scope = khối này. Khung 1080×1920."),
        field("Chuyển động (JSON)", anim, 'at = giây từ lúc khối hiện, hoặc "cue": số thứ tự mốc lời nói')),
      it.layer === "behind" && !P().camera?.matte ? h("div", { class: "note" }, h("b", {}, "Lưu ý"), h("div", { class: "help" }, "Chưa có lớp tách nền người — khối sẽ nằm trên video như bình thường. Nhờ AI tạo matte (npx hyperframes remove-background).")) : null,
      itemButtons(it, "blocks"));
  } else if (S.tab === "brolls") {
    const opts = S.media.filter((m) => /\.(mp4|mov|webm|m4v|png|jpe?g|webp)$/i.test(m)).map((m) => [m, m]);
    add(h("h3", {}, "Cảnh trám / showcase"), h("div", { class: "sub" }, "Tiếng gốc của clip mặc định tắt — kéo “Tiếng gốc cảnh trám” bên dưới để nghe."),
      field("File", sel(it, "src", opts)),
      h("div", { class: "row3" }, field("Ngang", num(it, "x", 2, 0)), field("Dọc", num(it, "y", 2, 0)), field("Tỷ lệ", num(it, "scale", 0.01, 1))),
      h("div", { class: "help" }, "Bấm thẳng vào cảnh trám trên video để kéo; kéo 4 góc để phóng to/thu nhỏ."),
      h("div", { class: "btns", style: "border:0;padding-top:0;margin-top:0" }, h("button", { class: "link", onclick: () => { snapshot(); delete it.x; delete it.y; delete it.scale; changed({ inspector: true }); } }, "Đặt lại vị trí")),
      timeFields(it),
      sfxFields(it, "Tự động (whoosh)", "whoosh"),
      /\.(png|jpe?g|webp|gif)$/i.test(it.src || "") ? null : field("Tốc độ cảnh trám", sel(it, "speed", SPEEDS, "1")),
      /\.(png|jpe?g|webp|gif)$/i.test(it.src || "") ? null : field("Tiếng gốc cảnh trám", slider(it, "audioVol", 0, 1.5, 0.05, 0), "0 = tắt tiếng clip (mặc định)."),
      h("div", { class: "row" }, field("Bắt đầu trong clip (s)", num(it, "mediaStart", 0.1, 0)), field("Căn khung", txt(it, "pos", "50% 50%"))),
      h('button',{class:'outline small','data-color-normalize':'brolls',onclick:()=>editColorNormalization(it,'brolls')},'Chuẩn hóa màu nguồn…'),
      it.colorNormalization?h('button',{class:'link',onclick:()=>{snapshot();S.project=restoreColorNormalization(P(),'brolls',it.id);changed({inspector:true});renderList();}},'Khôi phục màu nguồn gốc'):'',
      h('button',{class:'outline small','data-shot-color':'brolls',onclick:()=>editShotColor(it,'brolls')},'Phân tích màu cảnh…'),
      h('details',{},h('summary',{},'Màu cảnh trám'),field('Preset màu',(()=>{const input=h('select',{'aria-label':'Preset màu cảnh trám'},...[['','Không dùng preset'],...Object.keys(SOURCE_COLOR_PRESETS).map(k=>[k,k])].map(([value,label])=>h('option',{value},label)));input.value=it.color?.preset||'';input.oninput=()=>{snapshot();it.color={...(it.color||{}),preset:input.value};changed();};return input;})()),...Object.entries(SOURCE_COLOR_RANGES).filter(([key])=>key!=='vignette').map(([key,[min,max]])=>field({brightness:'Độ sáng',contrast:'Tương phản',saturation:'Bão hòa',temperature:'Nhiệt độ',tint:'Sắc xanh/hồng',hue:'Xoay màu',blur:'Làm mờ'}[key],(()=>{const input=h('input',{type:'number',min,max,step:key==='hue'||key==='blur'?1:.05,value:it.color?.[key]??0,'aria-label':key+' cảnh trám',oninput:()=>{const value=Number(input.value);if(!Number.isFinite(value)||value<min||value>max)return;snapshot();it.color={...(it.color||{}),[key]:value};changed();}});return input;})())),h('button',{class:'outline small',onclick:()=>{snapshot();delete it.color;changed({inspector:true});}},'Bỏ màu riêng')),
      /\.(mp4|mov|webm|m4v)$/i.test(it.src||'')&&!it.remotion?h('button',{class:'outline small','data-plate-privacy':'',onclick:()=>editPlatePrivacy(it)},'Che biển số · tracking local'):'',
      it.platePrivacy?h('button',{class:'outline small','data-review-plate':'',onclick:openPlateReview},'Kiểm tra bản che trước tự xuất'):'',
      it.platePrivacy?h('button',{class:'outline small',onclick:()=>{const next=restoreBrollPrivacy(P(),it.id);snapshot();S.project=next;changed({inspector:true});renderList();}},'Khôi phục nguồn trước khi che'):'',
      itemButtons(it, "brolls"));
  }
}

// GET /api/render trả trạng thái công việc; job lỗi/huỷ có ok:false — đó là DỮ LIỆU cần hiện, không phải lỗi gọi API.
// (api() coi ok:false là lỗi và ném ra → vòng theo dõi bỏ qua mãi, thanh xuất kẹt ở % cuối và không bao giờ hiện lỗi.)
async function readRenderJob() {
  const r = await editorFetch("/api/render");
  if (!r.ok) throw new Error(`Đọc trạng thái xuất video lỗi (HTTP ${r.status})`);
  return r.json();
}
function renderRenderBox() {
  const j = S.job;
  const wrap = h("div", { id: "renderBox" });
  if (!j) return wrap;
  const d = describeRender(j);
  const box = h("div", { class: "render-box" + (d.state === "failed" ? " fail" : ""), style: "margin:0 0 14px" },
    h("b", {}, j.quality === "final" ? "Xuất Final" : "Dựng nháp"), " ",
    h("span", { class: "muted" }, j.capcut && d.state === "running" ? `Đang tạo gói CapCut… ${d.pct}%` : `${d.label}${d.elapsed ? " · " + d.elapsed : ""}`),
    h("div", { class: "bar" + (d.indeterminate ? " indet" : ""), role: "progressbar", "aria-label": "Tiến độ xuất video", "aria-valuemin": "0", "aria-valuemax": "100", ...(d.indeterminate ? {} : { "aria-valuenow": String(d.pct) }) },
      h("div", { style: d.indeterminate ? "" : `width:${d.pct}%` })),
    d.detail && d.state !== "failed" && d.state !== "done" ? h("div", { class: "help" }, d.detail) : null,
    j.channels?.length ? h("div", { class: "help" }, `Xuất xong AI đăng lên: ${j.channels.join(", ")}`) : null,
    j.waitingAi && !j.listener && j.aiStatus !== "working" ? h("div", {},
      h("div", { class: "help" }, "Chưa có Claude / Codex nào đang chờ việc — copy câu này, dán vào cửa sổ Claude (tab Code) hoặc Codex đang mở thư mục phần mềm:"),
      h("div", { class: "btns" }, h("code", { style: "padding:6px 10px;background:#0e0e10;border-radius:8px;font-size:12.5px" }, "xuất video đang chờ trong phần mềm"),
        h("button", { class: "primary small", onclick: async () => { try { await navigator.clipboard.writeText("xuất video đang chờ trong phần mềm"); toast("Đã copy — dán vào Claude / Codex"); } catch { toast("xuất video đang chờ trong phần mềm"); } } }, "Copy"))) : null,
    j.running && !j.finalizing ? h("div", { class: "btns" }, h("button", { class: "outline small", disabled: !!j.cancel, onclick: cancelRender }, j.cancel ? "Đang huỷ…" : "Huỷ xuất video")) : null);
  if (!j.running && j.ok) {
    const st = j.probe?.streams || [], dur = Number(j.probe?.format?.duration || 0);
    box.append(
      h("div", { class: "help" }, `${st.map((s) => s.codec_name).join(" + ")} · ${st.find((s) => s.width)?.width || "?"}×${st.find((s) => s.height)?.height || "?"} · ${dur.toFixed(1)}s`),
      h("div", { class: "btns" },
        h("button", { class: "primary small", onclick: () => revealSaved(j.saved) }, ico("folder"), "Mở thư mục chứa video"),
        h("a", { href: `/p/${j.output}`, target: "_blank" }, h("button", { class: "outline small" }, "Xem video")),
        j.capcut ? null : h("button", { class: "outline small", onclick: () => postBox(j.saved || j.output) }, "📣 Đăng tự động")),
      h("button", { class: "saved-path", title: "Bấm để mở thư mục chứa file", onclick: () => revealSaved(j.saved) }, "Đã lưu: " + (j.saved || j.output)),
      j.audioLoudness ? h('div',{class:'help',role:'status'},j.audioLoudness.silent?'Bản xuất có track âm thanh nhưng tín hiệu im lặng hoặc quá nhỏ.':`Âm lượng bản xuất: ${Number(j.audioLoudness.integratedLufs).toFixed(2)} LUFS · đỉnh ${Number(j.audioLoudness.truePeakDbtp).toFixed(2)} dBTP · LRA ${Number(j.audioLoudness.loudnessRangeLu).toFixed(2)} LU. Chưa thay cho nghe duyệt nhạc/SFX và độ rõ lời.`) : null,
      ...(j.warnings||[]).map(message=>h('div',{class:'help',role:'status',style:'color:var(--pink)'},message)),
      ...(j.saveError ? [h("div", { class: "help", style: "color:var(--pink)" }, j.saveError)] : []));
  }
  if (d.state === "done" && d.detail) box.append(h("div", { class: "help", role: "status" }, d.detail));
  if (d.state === "failed") box.append(...exportErrorParts(d));
  wrap.append(box);
  return wrap;
}
// Lỗi xuất: tiêu đề + lý do bằng lời, dòng log đã lọc nằm trong "Chi tiết" (không đổ cả thanh tiến độ ra màn hình).
function exportErrorParts(d) {
  const e = d.error || {};
  return [
    h("div", { class: "export-err", role: "alert" }, h("b", {}, e.headline || "Xuất video không thành công"), e.reason ? h("span", {}, e.reason) : null),
    e.lines?.length ? h("details", { class: "export-details" }, h("summary", {}, "Chi tiết"), h("pre", { class: "log" }, e.lines.join("\n"))) : null,
    h("div", { class: "btns" }, h("button", { class: "primary small", onclick: () => exportBox("final") }, "Xuất lại")),
  ].filter(Boolean);
}
// Thanh trạng thái xuất video cố định phía trên editor: thấy được ở mọi tab, kể cả khi bảng chỉnh đang ẩn.
const STRIP_STALE_MS = 30 * 60 * 1000;
const stripKey = (j) => "exportStrip:" + (j.startedAt || 0);
const stripDismissed = (j) => { try { return sessionStorage.getItem(stripKey(j)) === "1"; } catch { return false; } };
function paintExportStrip() {
  const j = S.job || S.lastJob, d = describeRender(j);
  const ended = ["done", "failed", "cancelled"].includes(d.state);
  const el = $("#exportStrip");
  if (d.state === "idle" || (ended && (stripDismissed(j) || Date.now() - (j.finishedAt || 0) > STRIP_STALE_MS))) { el?.remove(); return; }
  const close = () => { try { sessionStorage.setItem(stripKey(j), "1"); } catch {} S.lastJob = null; paintExportStrip(); };
  const head = h("div", { class: "es-head" },
    h("b", {}, d.title), h("span", { class: "es-label" }, d.state === "failed" ? d.label : d.state === "done" ? d.label : d.indeterminate ? d.label : d.state === "running" ? "Đang xuất" : d.label),
    h("span", { class: "es-meta" }, (!d.indeterminate && d.state !== "failed" ? `${d.pct}%` : "") + (d.elapsed ? (d.indeterminate || d.state === "failed" ? "" : " · ") + d.elapsed : "")),
    ended ? h("button", { class: "ghost small exp-x", "aria-label": "Đóng thông báo xuất video", onclick: close }, "✕") : null);
  const parts = [head];
  if (d.state !== "failed") parts.push(h("div", { class: "bar" + (d.indeterminate ? " indet" : "") + (d.state === "done" ? " ok" : ""), role: "progressbar", "aria-label": "Tiến độ xuất video", "aria-valuemin": "0", "aria-valuemax": "100", ...(d.indeterminate ? {} : { "aria-valuenow": String(d.pct) }) }, h("div", { style: d.indeterminate ? "" : `width:${d.pct}%` })));
  if (d.state === "failed") parts.push(...exportErrorParts(d));
  else if (d.state === "done") {
    parts.push(h("div", { class: "help" }, "Đã lưu: " + (j.saved || j.output || "")),
      h("div", { class: "btns" }, h("button", { class: "primary small", onclick: () => revealSaved(j.saved) }, ico("folder"), "Mở thư mục chứa video"),
        j.output ? h("a", { href: `/p/${j.output}`, target: "_blank" }, h("button", { class: "outline small" }, "Xem video")) : null));
  } else {
    if (d.detail) parts.push(h("div", { class: "help" }, d.detail));
    if (d.canCancel || d.cancelling) parts.push(h("div", { class: "btns" }, h("button", { class: "outline small", disabled: !!d.cancelling, onclick: cancelRender }, d.cancelling ? "Đang huỷ…" : "Huỷ xuất video")));
  }
  const next = h("div", { id: "exportStrip", class: "export-strip " + d.state, role: d.state === "failed" ? "alert" : "status", "aria-live": d.state === "failed" ? "assertive" : "polite" }, ...parts);
  if (el) el.replaceWith(next); else document.body.append(next);
}
async function render(quality, target = null) {
  try {
    S.job = await api("/api/render", "POST", { quality, project: P(), target });
    S.dirty = false;
    renderStatus();
    pollRender();
  } catch (e) { toast("Lỗi render: " + e.message, true); }
}
// Xuất Final giao AI (Claude / Codex): AI chạy editor/tools/xuat-video.mjs, có kênh thì đăng luôn
async function renderAi(quality, channels, note, scheduleAt = "", target = null) {
  try {
    const r = await api("/api/render-ai", "POST", { quality, project: P(), channels, note, scheduleAt, target });
    S.dirty = false;
    renderStatus();
    S.job = await readRenderJob();
    if (!r.listener && !r.runner) toast("Đã tạo việc xuất video — copy câu lệnh ở khung xuất video, dán vào Claude / Codex.", false);
    else if (r.scheduled) toast(`AI đang xuất video · đã lên lịch đăng ${whenText(r.scheduled.at)} (xem ở Mạng xã hội).`);
    else toast(channels.length ? "AI đang xuất video, xong sẽ đăng lên kênh đã chọn." : "AI đang xuất video.");
    pollRender();
  } catch (e) { toast("Lỗi xuất video: " + e.message, true); }
}
// Gói chỉnh trong CapCut: video đã cắt, phụ đề .srt, lớp đồ hoạ, cảnh trám, âm thanh
async function renderCapcut(chu) {
  try {
    await api("/api/capcut", "POST", { project: P(), chu });
    S.dirty = false;
    renderStatus();
    S.job = await readRenderJob();
    toast("Đang tạo gói CapCut, lâu hơn xuất video thường khoảng 2 lần.");
    pollRender();
  } catch (e) { toast("Lỗi tạo gói CapCut: " + e.message, true); }
}
async function cancelRender() {
  if (!confirm("Huỷ xuất video đang chạy?")) return;
  try {
    const r = await api("/api/render-ai", "DELETE");
    if (r.cancelling) { toast("Đang dừng xuất video…"); return; } // AI đang xuất: script tự dừng, vòng theo dõi nhận kết quả
    clearInterval(renderPoll);
    $("#btnDraft").disabled = $("#btnFinal").disabled = false;
    S.job = null; S.lastJob = null;
    paintExportBtn();
    $("#renderBox")?.replaceWith(renderRenderBox());
    toast("Đã huỷ xuất video.");
  } catch (e) { toast(e.message, true); }
}
// theo dõi tiến độ xuất (cả khi mở lại / tải lại trang giữa chừng)
let renderPoll = null;
// % xuất hiện ngay trên nút Xuất video (thanh lấp đầy), không cần mở bảng chỉnh
function paintExportBtn() {
  const j = S.job, b = $("#btnFinal"), busy = !!j?.running, pct = busy ? Math.round(j.progress || 0) : 0;
  const d = describeRender(busy ? j : null);
  b.classList.toggle("busy", busy);
  b.style.setProperty("--p", pct + "%");
  b.querySelector("span").textContent = !busy ? "Xuất video" : j.waitingAi || j.waitingResource ? "Chờ xuất…" : j.finalizing ? "Hoàn tất…" : d.indeterminate ? "Đang chuẩn bị…" : `Đang xuất ${pct}%`;
  paintExportStrip();
}
function pollRender() {
  S.panel = null;
  openDrawer(); // tiến độ xuất video hiện ở đầu bảng chỉnh
  renderInspector();
  clearInterval(renderPoll);
  $("#btnDraft").disabled = $("#btnFinal").disabled = true;
  paintExportBtn();
  renderPoll = setInterval(async () => {
    try { S.job = await readRenderJob(); } catch { return; }
    const rb = $("#renderBox");
    if (rb) rb.replaceWith(renderRenderBox());
    paintExportBtn();
    if (!S.job.running) {
      clearInterval(renderPoll);
      toast(S.job.ok ? (S.job.capcut ? "Xong gói CapCut — bấm Mở thư mục, làm theo file huong-dan.txt." : `Đã xuất video → ${S.job.saved || S.job.output}`) : S.job.cancelled ? "Đã huỷ xuất video." : `Xuất video lỗi: ${describeRender(S.job).detail}`, !S.job.ok && !S.job.cancelled);
      $("#btnDraft").disabled = $("#btnFinal").disabled = false;
    }
  }, 1000);
}

// ---------- Timeline (kiểu CapCut) ----------
const svg = (d, extra = "") => `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
const ICON = {
  export: svg('<path d="M8 2v8M4.5 6.5L8 10l3.5-3.5M2.5 13.5h11"/>'),
  folder: svg('<path d="M1.5 4.5a1 1 0 011-1h3.2l1.5 1.5h6.3a1 1 0 011 1v6.5a1 1 0 01-1 1h-11a1 1 0 01-1-1z"/>'),
  restore: svg('<path d="M2.5 8a5.5 5.5 0 105.5-5.5A5.6 5.6 0 004 4.3"/><path d="M3.5 1.8v2.7h2.7M8 5v3.2l2 1.3"/>'),
  text: svg('<path d="M3 3.5h10M8 3.5V13"/>'),
  scene: svg('<rect x="2" y="3" width="12" height="10" rx="2"/><path d="M5 10l2.5-3 2 2 1.5-1.5L13 10"/>'),
  broll: svg('<rect x="2" y="2.5" width="12" height="5" rx="1.2"/><rect x="2" y="8.5" width="12" height="5" rx="1.2"/>'),
  zoom: svg('<circle cx="7" cy="7" r="4.2"/><path d="M10.2 10.2L13.5 13.5M5.3 7h3.4M7 5.3v3.4"/>'),
  video: svg('<rect x="2" y="3" width="12" height="10" rx="2"/><path d="M6.5 6v4l3.5-2z" fill="currentColor"/>'),
  voice: svg('<path d="M3 7v2M5.5 5v6M8 3v10M10.5 5.5v5M13 7v2"/>'),
  cap: svg('<rect x="1.5" y="4" width="13" height="8" rx="2"/><path d="M4.5 8h3M9 8h2.5"/>'),
  sfx: svg('<path d="M6 12.5V4l7-1.5V11"/><circle cx="4.5" cy="12.5" r="1.5"/><circle cx="11.5" cy="11" r="1.5"/>'),
};
const LANES = [
  { key: "texts", name: "Chữ", icon: "text", h: 24 },
  { key: "captions", name: "Phụ đề", icon: "cap", h: 18 },
  { key: "scenes", name: "Minh hoạ", icon: "scene", h: 24 },
  { key: "brolls", name: "Cảnh trám", icon: "broll", h: 24 },
  { key: "blocks", name: "Đồ hoạ", icon: "scene", h: 22 },
  { key: "zooms", name: "Zoom", icon: "zoom", h: 20 },
  { key: "segments", name: "Video", icon: "video", h: 52 },
  { key: "voice", name: "Giọng nói", icon: "voice", h: 30, tab: "segments" },
  { key: 'audio-clips', name: 'Thuyết minh', icon: 'voice', h: 24, tab: 'audio' },
  { key: 'music', name: 'Nhạc nền', icon: 'sfx', h: 24, tab: 'audio' },
  { key: "sfx", name: "Hiệu ứng", icon: "sfx", h: 14, tab: "audio" },
];
const CLIP_CLS = { texts: "text", scenes: "scene", brolls: "broll", zooms: "zoom", blocks: "block" };
S.tlZoom = 0;
const fmtClock = (t) => {
  t = Math.max(0, t || 0);
  const m = Math.floor(t / 60), s = t - m * 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
};
function tlPps() {
  const avail = $("#tlScroll").clientWidth - 60;
  const fit = Math.max(3, avail / Math.max(S.tm.total, 1));
  return fit * Math.pow(2, (S.tlZoom / 100) * 5); // tới 32 lần
}

// Mục nằm trên 1 track: [mục, bộ dữ liệu]. Chữ mẫu (khối group "chu") hiện ở track Chữ.
function laneItems(key) {
  const chu = (b) => b.group === "chu";
  if (key === "texts") return [...itemsOf("texts").map((x) => [x, "texts"]), ...itemsOf("blocks").filter(chu).map((x) => [x, "blocks"])];
  if (key === "blocks") return itemsOf("blocks").filter((b) => !chu(b)).map((x) => [x, "blocks"]);
  return itemsOf(key).map((x) => [x, key]);
}
function renderTimeline() {
  if(!S.tm||!P())return;
  const total = S.tm.total || 1;
  const pps = (S.pps = tlPps());
  const width = total * pps;
  $("#tlContent").style.width = width + 200 + "px";

  const ruler = $("#ruler");
  ruler.innerHTML = "";
  const major = [0.5, 1, 2, 5, 10, 15, 30, 60, 120].find((s) => s * pps >= 64) || 120;
  const minor = major / (major >= 5 ? 5 : major >= 1 ? 4 : 2);
  for (let i = 0, t = 0; t <= total + 1e-6; i++, t = i * minor) {
    const isMajor = Math.abs(t / major - Math.round(t / major)) < 1e-6;
    ruler.append(h("div", { class: `tick ${isMajor ? "major" : ""}`, style: `left:${t * pps}px` }));
    if (isMajor) ruler.append(h("span", { style: `left:${t * pps}px` }, fmtClock(t).replace(/\.0$/, "")));
  }

  const heads = $("#tlHeads"), lanes = $("#lanes");
  heads.innerHTML = "";
  heads.append(h("div", { class: "tl-heads-top" })); // chỗ trống ngang thước thời gian (ghim)
  heads.scrollTop = $("#tlScroll").scrollTop;
  lanes.innerHTML = "";
  for (const ln of LANES) {
    if (ln.key === "scenes" && !itemsOf("scenes").length) continue;
    const tab = ln.tab || ln.key;
    // Mục chồng thời gian nhau → xếp thành nhiều hàng (layer) trong cùng track, không đè lên nhau
    // Hàng (track) trong làn: giữ hàng người dùng kéo tới (`row`), còn lại tự xếp; hàng 0 sát đáy như CapCut.
    let rowOf = new Map(), rows = 1;
    if (CLIP_CLS[ln.key]) ({ rowOf, count: rows } = packRows(laneItems(ln.key).map(([x]) => ({ id: x.id, start: outStart(x), end: outStart(x) + (Number(x.dur) || 1), row: x.row }))));
    const laneH = ln.h * rows + (rows - 1) * 2;
    const tf = track(ln.key);
    heads.append(h("div", { class: `tl-head-row ${S.tab === tab ? "on" : ""}`, style: `height:${laneH}px`, onclick: () => switchTab(tab), html: `${ICON[ln.icon]}<span>${ln.name}</span>` }, ...trackButtons(ln.key)));
    const el = h("div", { class: `lane ${tf.locked ? "tl-locked" : ""} ${tf.hidden || tf.muted ? "tl-dim" : ""}`, style: `height:${laneH}px`, "data-lane": ln.key, "data-rows": rows, "data-rowh": ln.h + 2 });
    if (ln.key === "segments") {S.tm.segs.forEach((s) => el.append(videoClip(s, pps, ln.h)));if(P().endCard?.enabled){const card=h('button',{class:'clip video','data-end-card-track':'',style:`left:${S.tm.contentTotal*pps}px;width:${Math.max(8,(S.tm.total-S.tm.contentTotal)*pps-1)}px`,title:'Sửa đoạn kết / CTA',onclick:()=>{switchTab('brand');const controls=document.querySelector('[data-end-card-controls]');if(controls)controls.open=true;seek(S.tm.contentTotal+.1);}},'Outro / CTA');el.append(card);}}
    else if (ln.key === "voice") S.tm.segs.forEach((s) => el.append(voiceClip(s, pps, ln.h)));
    else if(ln.key==='audio-clips')(P().audio?.clips||[]).filter(c=>!c.hidden).forEach((c,i)=>{
      const start=S.tm.srcToOut(Number(c.at)||0),available=Number(c.sourceDuration)>0?Math.max(0,Number(c.sourceDuration)-(Number(c.from)||0)):S.tm.total-start,duration=Math.min(c.dur===undefined?available:Number(c.dur),available,S.tm.total-start);if(!Number.isFinite(duration)||duration<=0)return;
      const clipEl=h('div',{'data-audio-clip':c.id,role:'button',tabindex:0,'aria-label':'Chọn clip audio '+(i+1),'aria-pressed':String(S.tab==='audio'&&S.ai.audioClipId===c.id),onkeydown:e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.currentTarget.click();}},class:'clip voice'+(S.tab==='audio'&&S.ai.audioClipId===c.id?' on':''),style:`left:${start*pps}px;width:${Math.max(4,duration*pps-1)}px`,title:c.src,onclick:()=>{audioGroup='voice';S.ai.audioClipId=c.id;switchTab('audio');renderTabs();renderList();seek(start);renderTimeline();if(!aiChat.hidden)renderAiChat();}},h('span',{class:'lbl'},`Audio ${i+1}`));
      drawWave(clipEl,waveOf(c.src),duration*pps-1,ln.h-2,Number(c.from)||0,false);el.append(clipEl);
    });
    else if(ln.key==='music'){
      const src=P().audio?.music;
      if(src){const musicEl=h('button',{'data-music-track':'',class:'clip voice',style:`left:0;width:${Math.max(4,width-1)}px;height:22px;text-align:left`,title:'Nhạc nền toàn video · '+src,onclick:()=>{audioGroup='music';switchTab('audio');renderTabs();renderList();requestAnimationFrame(()=>document.querySelector('[aria-label="Nhạc nền"]')?.scrollIntoView({block:'nearest'}));}},h('span',{class:'lbl'},'♫ '+src));drawWave(musicEl,waveOf(src),width-1,20,0,true);el.append(musicEl);}
    }
    else if (ln.key === "captions") itemsOf("captions").forEach((l) => {
      const { o, d } = lineTimes(l);
      if (o < 0) return;
      el.append(h("div", { class: `clip capb ${S.tab === "captions" && S.selId === l.id ? "on" : ""}`, style: `left:${o * pps}px;width:${Math.max(4, d * pps - 1)}px`, title: lineText(l),
        onpointerdown: (e) => {
          const pick = () => { if (S.tab !== "captions") { S.tab = "captions"; renderTabs(); } S.selId = l.id; openDrawer(); renderList(); renderInspector(); renderTimeline(); seek(o + 0.05); };
          if (e.pointerType === "touch") return touchTap(e, pick); // vuốt để cuộn, chạm để chọn
          e.preventDefault(); pick();
        } },
        h("span", { class: "lbl" }, lineText(l))));
    });
    else if (ln.key === "sfx") (P().audio?.sfx || []).forEach((s) => el.append(h("div", { class: "clip sfx", style: `left:${S.tm.srcToOut(s.at) * pps}px`, title: s.kind })));
    else laneItems(ln.key).forEach(([it, key]) => {
      const c = blockFor(it, key, CLIP_CLS[ln.key], pps), r = rowOf.get(it.id) || 0;
      c.style.top = (rows - 1 - r) * (ln.h + 2) + "px"; c.style.bottom = "auto"; c.style.height = ln.h + "px";
      c.dataset.row = r;
      el.append(c);
    });
    lanes.append(el);
  }
  renderTime();
}

// Track video: dải ảnh lấy từ sprite filmstrip của server.
function videoClip(s, pps, laneH) {
  const seg = itemsOf("segments").find((x) => x.id === s.id);
  const len = s.outEnd - s.outStart, w = Math.max(3, len * pps - 1);
  const el = h("div", {
    class: `clip video ${(S.tab === "segments" && S.selId === s.id) || inMulti("segments", s.id) ? "on" : ""}`,
    style: `left:${s.outStart * pps}px;width:${w}px`,
    title: seg?.text || "",
    "data-k": "segments", "data-id": s.id,
  });
  const st = s.src ? S.sourceTimelines?.[s.src]?.strip : S.strip;
  if (st) {
    const th = laneH - 2, sc = th / st.th, tw = st.tw * sc;
    const frames = st.cols * st.rows;
    const film = h("div", { class: "film" });
    const n = Math.min(600, Math.ceil(w / tw));
    for (let k = 0; k < n; k++) {
      const t = (s.src ? s.mediaStart??0 : s.in) + (k * tw + tw / 2) / pps * s.rate;
      const idx = Math.min(frames - 1, Math.floor(t * st.fps));
      const cx = (idx % st.cols) * st.tw * sc, cy = Math.floor(idx / st.cols) * st.th * sc;
      film.append(h("i", { style: `width:${tw}px;background-image:url(${st.url});background-size:${st.cols * st.tw * sc}px ${st.rows * st.th * sc}px;background-position:-${cx}px -${cy}px` }));
    }
    el.append(film);
  }
  if (w > 70 && seg?.text) el.append(h("div", { class: "cap" }, seg.text));
  if (w > 40) el.append(h("div", { class: "dur" }, `${len.toFixed(1)}s`));
  el.append(h("div", { class: "rz l", title: "Kéo để nới / thu đầu đoạn" }), h("div", { class: "rz r", title: "Kéo để nới / thu cuối đoạn" }));
  el.addEventListener("pointerdown", (e) => {
    const pickSeg = () => { if (S.tab !== "segments") { S.tab = "segments"; renderTabs(); } S.selKind = null; S.selId = s.id; };
    if (e.button === 2) { pickSeg(); renderList(); renderInspector(); renderTimeline(); return; } // chuột phải: chọn rồi mở menu
    if (S.tlTool === "split" && e.button === 0) { e.preventDefault(); pickSeg(); seek(tlTimeAt(e.clientX)); splitSelected(); return; }
    if (e.button === 0 && (e.shiftKey || e.ctrlKey || e.metaKey)) { e.preventDefault(); return toggleMulti("segments", s.id); }
    if (!el.classList.contains("on") || e.target.classList.contains("rz")) S.multi = [];
    if (tapOnly(e, el)) {
      const t = s.outStart + e.offsetX / pps;
      return touchTap(e, () => {
        if (S.tab !== "segments") { S.tab = "segments"; renderTabs(); }
        S.selId = s.id; openDrawer(); renderList(); renderInspector(); renderTimeline(); seek(t);
      });
    }
    e.preventDefault();
    if (e.target.classList.contains("rz")) {
      e.stopPropagation();
      const side = e.target.classList.contains("r") ? "r" : "l", x0 = e.clientX, edge = side === "r" ? s.outEnd : s.outStart, pts = snapPoints(null);
      let dt = 0;
      const mv = (ev) => {
        dt = (ev.clientX - x0) / pps;
        const hit = S.snap ? snapTo(edge + dt, pts, 8 / pps) : null;
        if (hit !== null) dt = hit - edge;
        snapLine(hit);
        if (side === "r") el.style.width = Math.max(6, w + dt * pps) + "px";
        else { el.style.left = (s.outStart + dt) * pps + "px"; el.style.width = Math.max(6, w - dt * pps) + "px"; }
      };
      const up = () => {
        window.removeEventListener("pointermove", mv);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        snapLine(null);
        if (Math.abs(dt) < 0.02) return;
        snapshot();
        trimSeg(s.id, side, side === "r" ? s.out + dt * s.rate : s.in + dt * s.rate);
        changed({ inspector: true });
        if (S.tab === "segments") renderList();
      };
      window.addEventListener("pointermove", mv);
      window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
      return;
    }
    const t = s.outStart + e.offsetX / pps;
    if (S.tab !== "segments") { S.tab = "segments"; renderTabs(); }
    S.selId = s.id;
    openDrawer();
    renderList(); renderInspector(); renderTimeline();
    seek(t);
    dragReorder(s, e);
  });
  return el;
}

// Kéo thân clip video sang trái / phải để đổi thứ tự (như track chính CapCut). Dự án nhiều nguồn video mới đổi được.
function dragReorder(s, e) {
  const x0 = e.clientX, ghost = document.querySelector(`#lanes .clip.video[data-id="${CSS.escape(s.id)}"]`);
  let dx = 0, warned = false;
  const mv = (ev) => {
    dx = ev.clientX - x0;
    if (Math.abs(dx) < 6) return;
    if (P().source?.timeline !== "segments") { if (!warned) toast("Kéo đổi thứ tự clip chỉ áp dụng cho dự án ghép nhiều video nguồn.", true); warned = true; return; }
    if (ghost) { ghost.style.transform = `translateX(${dx}px)`; ghost.classList.add("tl-dragging"); }
  };
  const up = () => {
    window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
    if (ghost) { ghost.style.transform = ""; ghost.classList.remove("tl-dragging"); }
    if (Math.abs(dx) < 6 || P().source?.timeline !== "segments") return;
    const center = (s.outStart + s.outEnd) / 2 + dx / S.pps;
    const kept = S.tm.segs.filter((x) => x.id !== s.id), before = kept.find((x) => center < (x.outStart + x.outEnd) / 2);
    const ordered = P().segments.slice().sort((a, b) => a.in - b.in).map((x) => x.id).filter((id) => id !== s.id);
    const at = before ? ordered.indexOf(before.id) : ordered.length;
    ordered.splice(at, 0, s.id);
    try {
      const next = reorderPrimaryClips(P(), ordered);
      snapshot(); S.project = next; changed({ inspector: true }); renderList();
      toast("Đã đổi thứ tự clip. Kiểm tra điểm nối rồi Lưu.");
    } catch (error) { toast(error.message, true); }
  };
  window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
}

// Track giọng: waveform từ /api/wave.
function voiceClip(s, pps, laneH) {
  const len = s.outEnd - s.outStart, w = Math.max(3, Math.round(len * pps - 1));
  const el = h("div", { class: "clip voice", style: `left:${s.outStart * pps}px;width:${w}px` });
  const wv = s.src ? S.sourceTimelines?.[s.src]?.wave : S.wave;
  if (wv && w < 30000) {
    const c = h("canvas", { class: "wave", width: w, height: laneH - 2, style: `width:${w}px` });
    const g = c.getContext("2d");
    const mid = (laneH - 2) / 2;
    g.fillStyle = "rgba(110,190,255,.75)";
    for (let x = 0; x < w; x += 2) {
      const t = (s.src ? s.mediaStart??0 : s.in) + x / pps * s.rate;
      const v = wv.peaks[Math.floor(t * wv.per)] || 0;
      const hh = Math.max(1, v * mid * 1.8);
      g.fillRect(x, mid - hh / 2 * 1, 1.4, hh);
    }
    el.append(c);
  }
  el.addEventListener("pointerdown", (e) => { e.preventDefault(); seek(s.outStart + e.offsetX / pps); });
  return el;
}

function switchTab(key) {
  if (S.tab === key) return;
  stopAudioAudition();
  S.tab = key;
  S.selKind = null;
  S.selId = null;
  S.part = null;
  renderTabs(); renderList(); renderInspector(); renderTimeline(); updateSelection();
}

// Điện thoại: chạm vào clip CHƯA chọn = chọn nó (vuốt thì vẫn cuộn timeline). Clip đã chọn mới kéo được (CSS touch-action:none).
function touchTap(e, onTap) {
  const x0 = e.clientX, y0 = e.clientY;
  const done = () => { window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", done); };
  const up = (ev) => { done(); if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 10) onTap(ev); };
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", done);
}
const tapOnly = (e, el) => e.pointerType === "touch" && !el.classList.contains("on");

// Clip overlay: kéo thân để dời, kéo mép trái/phải để đổi thời lượng.
function blockFor(it, key, cls, pps) {
  const o = outStart(it), d = Number(it.dur) || 1;
  const b = h("div", {
    class: `clip ${cls} ${it.hidden ? "off" : ""} ${((S.selKind || S.tab) === key && S.selId === it.id) || inMulti(key, it.id) ? "on" : ""}`,
    style: `left:${o * pps}px;width:${Math.max(8, d * pps - 1)}px`,
    title: labelOf(it, key),
    "data-k": key, "data-id": it.id,
    html: `${ICON[LANES.find((l) => l.key === key).icon]}<span class="lbl">${esc(labelOf(it, key))}</span>`,
  }, h("div", { class: "rz l", style: "left:0" }), h("div", { class: "rz r" }));
  b.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    if (e.button === 2) { focusItem(it, key); renderList(); renderInspector(); renderTimeline(); return; } // chuột phải: chọn rồi mở menu
    if (S.tlTool === "split" && e.button === 0) { e.preventDefault(); focusItem(it, key); seek(tlTimeAt(e.clientX)); splitSelected(); return; }
    if (e.button === 0 && (e.shiftKey || e.ctrlKey || e.metaKey)) { e.preventDefault(); return toggleMulti(key, it.id); }
    if (tapOnly(e, b)) return touchTap(e, () => { focusItem(it, key); select(it); });
    e.preventDefault();
    const mode = e.target.classList.contains("r") ? "r" : e.target.classList.contains("l") ? "l" : "move";
    // Kéo một mục trong nhóm đang chọn nhiều → dời cả nhóm cùng khoảng thời gian.
    const group = mode === "move" && inMulti(key, it.id) ? multiItems().filter((m) => CLIP_CLS[m.key] && m.it !== it) : [];
    if (!group.length) S.multi = [];
    const x0 = e.clientX, y0 = e.clientY, pts = snapPoints(it.id), tol = 8 / pps;
    const lane = b.parentElement, laneRows = Number(lane?.dataset.rows) || 1, rowH = Number(lane?.dataset.rowh) || 24, row0 = Number(b.dataset.row) || 0;
    let moved = false, no = o, nd = d, row = row0;
    snapshot();
    const mv = (ev) => {
      const dt = (ev.clientX - x0) / pps;
      if (Math.abs(ev.clientX - x0) > 2 || Math.abs(ev.clientY - y0) > 2) moved = true;
      // Kéo lên / xuống: đổi hàng trong làn; kéo lên trên hàng cao nhất = tạo track mới (CapCut).
      if (mode === "move" && !group.length && lane && Math.abs(ev.clientY - y0) > rowH / 2) {
        const fromTop = ev.clientY - lane.getBoundingClientRect().top;
        row = clamp(laneRows - 1 - Math.floor(fromTop / rowH), 0, laneRows);
        b.style.top = (laneRows - 1 - row) * rowH + "px";
      }
      if (mode === "move") no = clamp(o + dt, 0, S.tm.total - 0.2);
      else if (mode === "r") nd = clamp(d + dt, 0.3, 120);
      else { no = clamp(o + dt, 0, o + d - 0.3); nd = d - (no - o); }
      // Hít (N): mép đầu / cuối bám playhead, mép clip khác, điểm cắt video
      let hit = null;
      if (S.snap && mode === "move") {
        const a = snapTo(no, pts, tol), z = snapTo(no + nd, pts, tol);
        if (a !== null && (z === null || Math.abs(a - no) <= Math.abs(z - no - nd))) { no = a; hit = a; } else if (z !== null) { no = z - nd; hit = z; }
      } else if (S.snap && mode === "r") { const z = snapTo(no + nd, pts, tol); if (z !== null && z - no >= 0.3) { nd = z - no; hit = z; } }
      else if (S.snap) { const a = snapTo(no, pts, tol); if (a !== null && o + d - a >= 0.3) { no = a; nd = o + d - a; hit = a; } }
      snapLine(hit);
      b.style.left = no * pps + "px";
      b.style.width = Math.max(8, nd * pps - 1) + "px";
      for (const m of group) { const g = document.querySelector(`#lanes .clip[data-k="${m.key}"][data-id="${CSS.escape(m.it.id)}"]`); if (g) g.style.transform = `translateX(${(no - o) * pps}px)`; }
    };
    const up = () => {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      snapLine(null);
      if (!group.length) focusItem(it, key);
      if (moved) {
        for (const m of group) setOutStart(m.it, outStart(m.it) + (no - o));
        setOutStart(it, no);
        it.dur = round3(nd);
        if (row !== row0) {
          // Ghim hàng hiện tại của cả làn rồi đặt hàng mới cho mục vừa kéo (track rỗng tự gộp lại).
          for (const c of lane.querySelectorAll(".clip[data-id]")) { const x = itemsOf(c.dataset.k).find((y) => y.id === c.dataset.id); if (x) x.row = Number(c.dataset.row) || 0; }
          it.row = row;
        }
        changed({ inspector: true });
      } else select(it);
    };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  });
  return b;
}

// Tua: kéo trên thước hoặc núm playhead.
function scrubFrom(e) {
  e.preventDefault();
  if (S.playing) player.pause();
  const go = (ev) => {
    const r = $("#tlContent").getBoundingClientRect();
    seek((ev.clientX - r.left) / (S.pps || 1));
  };
  go(e);
  const up = () => { window.removeEventListener("pointermove", go); window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up); };
  window.addEventListener("pointermove", go);
  window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
}
$("#ruler").addEventListener("pointerdown", scrubFrom);
$("#knob").addEventListener("pointerdown", scrubFrom);

function setTlZoom(v, anchorTime) {
  const sc = $("#tlScroll");
  const t = anchorTime ?? S.time;
  const xBefore = t * S.pps - sc.scrollLeft;
  S.tlZoom = clamp(v, 0, 100);
  $("#tlZoom").value = S.tlZoom;
  renderTimeline();
  sc.scrollLeft = Math.max(0, t * S.pps - xBefore);
}
$("#tlZoom").addEventListener("input", (e) => setTlZoom(Number(e.target.value)));
$("#tlZoomIn").onclick = () => setTlZoom(S.tlZoom + 12);
$("#tlZoomOut").onclick = () => setTlZoom(S.tlZoom - 12);
$("#tlFit").onclick = () => { setTlZoom(0); $("#tlScroll").scrollLeft = 0; };
// Cột tên track cuộn dọc cùng vùng track
$("#tlScroll").addEventListener("scroll", () => { $("#tlHeads").scrollTop = $("#tlScroll").scrollTop; });
// Kéo thẻ thành phần có sẵn thả xuống timeline → chèn đúng thời điểm thả
const tlTimeAt = (clientX) => clamp((clientX - $("#tlContent").getBoundingClientRect().left) / S.pps, 0, S.tm?.total || 0);
function tlDropLine(t) {
  let el = $("#tlDrop");
  if (t == null) { el?.remove(); return; }
  if (!el) { el = h("div", { id: "tlDrop", class: "tl-drop" }, h("span")); $("#tlContent").append(el); }
  el.style.left = t * S.pps + "px";
  el.firstChild.textContent = fmt(t);
}
const DROP_TYPES = ["text/vek-preset", "text/vek-media", "text/vek-bstyle", "text/vek-kho", "text/vek-sfx"];
$("#tlScroll").addEventListener("dragover", (e) => {
  if (!DROP_TYPES.some((t) => e.dataTransfer.types.includes(t))) return;
  e.preventDefault(); e.dataTransfer.dropEffect = "copy";
  tlDropLine(tlTimeAt(e.clientX));
});
$("#tlScroll").addEventListener("dragleave", (e) => { if (!$("#tlScroll").contains(e.relatedTarget)) tlDropLine(null); });
$("#tlScroll").addEventListener("drop", (e) => {
  tlDropLine(null);
  const t = tlTimeAt(e.clientX), dt = e.dataTransfer;
  const pr = S.presets?.items?.find((x) => x.id === dt.getData("text/vek-preset"));
  const media = dt.getData("text/vek-media"), bst = BROLL_STYLES.find((x) => x.id === dt.getData("text/vek-bstyle"));
  const kho = S.kho?.items?.find((x) => x.id === dt.getData("text/vek-kho"));
  const sfxKind = dt.getData("text/vek-sfx");
  if (sfxKind && SFX.some((x) => x[0] === sfxKind)) {
    e.preventDefault(); document.body.classList.remove("dragging-preset");
    addSfxAt(sfxKind, t); playSfx(sfxKind);
    return;
  }
  if (!pr && !media && !bst && !kho) return;
  e.preventDefault();
  document.body.classList.remove("dragging-preset");
  if (kho) {
    if (kho.kind !== "brolls") { insertPreset(kho, t); seek(t + 0.5); return; }
    const b = brollAt(t);
    if (!b) return toast("Thả kiểu cảnh trám lên đúng một cảnh trám trên timeline.", true);
    snapshot(); applyKhoBroll(b, kho); S.selId = b.id; changed({ inspector: true }); seek(outStart(b) + 0.5);
    return toast(`Đã áp “${kho.name}”.`);
  }
  if (pr) { insertPreset(pr, t); seek(t + 0.5); }
  else if (media) { insertBroll(media, t); seek(t + 0.3); }
  else {
    const it = itemsOf("brolls").find((b) => !b.hidden && t >= outStart(b) - 0.05 && t <= outStart(b) + (Number(b.dur) || 0));
    if (!it) return toast("Thả kiểu lên đúng một cảnh trám trên timeline.", true);
    snapshot(); applyBStyle(it, bst); S.selId = it.id; changed({ inspector: true }); renderList(); seek(outStart(it) + 0.5);
    toast(`Đã đổi cảnh trám sang kiểu “${bst.name}”.`);
  }
});
$("#tlScroll").addEventListener("wheel", (e) => {
  if (!(e.ctrlKey || e.metaKey)) return;
  e.preventDefault();
  const r = $("#tlContent").getBoundingClientRect();
  setTlZoom(S.tlZoom - Math.sign(e.deltaY) * 8, (e.clientX - r.left) / S.pps);
}, { passive: false });

function deleteSelected() {
  if (S.multi?.length > 1) return deleteMulti();
  const it = selected();
  if (!it) return toast("Chọn một mục trên timeline trước.", true);
  if (guardLock(selLane()?.lane)) return;
  snapshot();
  if (S.tab === "segments") { it.keep = false; toast("Đã cắt đoạn khỏi bản dựng. Bật lại ở mục Cắt."); }
  else { const arr = itemsOf(S.selKind || S.tab), i = arr.indexOf(it); if (i >= 0) arr.splice(i, 1); S.selId = null; }
  changed({ inspector: true });
  updateSelection();
}
// ---------- Timeline kiểu CapCut: khoá / ẩn / tắt tiếng track, công cụ Chọn / Tách, hít, Q / W, chép / dán, menu chuột phải ----------
const TRACK_CTRL = { texts: ["lock", "hide"], captions: ["lock", "hide"], scenes: ["lock", "hide"], brolls: ["lock", "hide"], blocks: ["lock", "hide"], zooms: ["lock", "hide"],
  segments: ["lock"], voice: ["lock", "mute"], "audio-clips": ["lock", "mute"], music: ["lock", "mute"], sfx: ["lock", "mute"] };
const TRACK_FLAG = { lock: "locked", hide: "hidden", mute: "muted" };
const TRACK_LABEL = { lock: ["Khoá track", "Mở khoá track"], hide: ["Ẩn track", "Hiện track"], mute: ["Tắt tiếng track", "Bật tiếng track"] };
const TRACK_SVG = {
  lock: '<rect x="3.5" y="7" width="9" height="6.5" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/>',
  lockOn: '<rect x="3.5" y="7" width="9" height="6.5" rx="1.5" fill="currentColor"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/>',
  hide: '<path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/>',
  hideOn: '<path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8z"/><path d="M2.5 13.5l11-11"/>',
  mute: '<path d="M2.5 6v4h2.5l3.5 3V3L5 6z"/><path d="M11 5.5a3.5 3.5 0 0 1 0 5"/>',
  muteOn: '<path d="M2.5 6v4h2.5l3.5 3V3L5 6z"/><path d="M11 6l3 4M14 6l-3 4"/>',
};
const track = (k) => P()?.tracks?.[k] || {};
const trackOf = (key, it) => (key === "blocks" && it?.group === "chu" ? "texts" : key);
function trackButtons(k) {
  return (TRACK_CTRL[k] || []).map((c) => {
    const on = !!track(k)[TRACK_FLAG[c]], label = TRACK_LABEL[c][on ? 1 : 0];
    return h("button", { type: "button", class: `tl-tbtn ${on ? "on" : ""}`, title: label, "aria-label": label, "aria-pressed": String(on),
      onclick: (e) => { e.stopPropagation(); toggleTrack(k, TRACK_FLAG[c]); },
      html: `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRACK_SVG[c + (on ? "On" : "")]}</svg>` });
  });
}
function toggleTrack(k, flag) {
  snapshot();
  const all = (P().tracks = P().tracks || {});
  all[k] = { ...(all[k] || {}), [flag]: !all[k]?.[flag] };
  if (flag === "locked" && all[k].locked && selLane()?.lane === k) S.selId = null; // CapCut: track khoá không giữ mục đang chọn
  changed({ inspector: true });
}
function selLane() {
  const it = selected();
  if (!it) return null;
  const key = S.selKind || S.tab;
  return { it, key, lane: trackOf(key, it) };
}
function guardLock(lane) {
  if (!lane || !track(lane).locked) return false;
  toast("Track đang khoá. Mở khoá ở đầu track trước.", true);
  return true;
}
// Điểm hít: playhead, đầu / cuối video, điểm cắt video, mép các mục phủ khác.
function snapPoints(skipId) {
  const pts = [S.time, 0, S.tm.total];
  for (const s of S.tm.segs) pts.push(s.outStart, s.outEnd);
  for (const k of Object.keys(CLIP_CLS)) for (const x of itemsOf(k)) if (x.id !== skipId && !x.hidden) { const o = outStart(x); pts.push(o, o + (Number(x.dur) || 1)); }
  return pts;
}
function snapLine(t) {
  let el = $("#tlSnapLine");
  if (t === null || t === undefined) { el?.remove(); return; }
  if (!el) { el = h("div", { id: "tlSnapLine", class: "tl-snap" }); $("#tlContent").append(el); }
  el.style.left = t * S.pps + "px";
}
S.snap = localStorage.getItem("cos.tlSnap") !== "0";
function setSnap(on) {
  S.snap = on;
  localStorage.setItem("cos.tlSnap", on ? "1" : "0");
  $("#tlSnap").classList.toggle("on", on);
  $("#tlSnap").setAttribute("aria-pressed", String(on));
}
S.tlTool = "select";
function setTlTool(tool) {
  S.tlTool = tool;
  document.body.classList.toggle("tl-split-mode", tool === "split");
  for (const [id, v] of [["tlToolSelect", "select"], ["tlToolSplit", "split"]]) { $("#" + id).classList.toggle("on", tool === v); $("#" + id).setAttribute("aria-pressed", String(tool === v)); }
}
// Ctrl+B: tách mục đang chọn tại playhead; chưa chọn mục phủ thì tách video chính.
function splitSelected() {
  const sel = selLane();
  if (sel && CLIP_CLS[sel.key]) {
    if (guardLock(sel.lane)) return;
    const parts = splitSpan(outStart(sel.it), Number(sel.it.dur) || 1, S.time);
    if (!parts) return toast("Đưa playhead vào giữa mục đang chọn để tách.", true);
    snapshot();
    const arr = itemsOf(sel.key), b = structuredClone(sel.it);
    b.id = uid(sel.key[0] + "s", arr);
    sel.it.dur = round3(parts[0].dur);
    setOutStart(b, parts[1].start); b.dur = round3(parts[1].dur);
    arr.splice(arr.indexOf(sel.it) + 1, 0, b);
    S.selId = b.id;
    return changed({ inspector: true });
  }
  if (guardLock("segments")) return;
  if (S.tab !== "segments") { S.tab = "segments"; renderTabs(); }
  splitAtPlayhead();
}
// Q: xoá phần bên trái playhead · W: xoá phần bên phải (mục đang chọn, hoặc đoạn video dưới playhead).
function trimAtPlayhead(side) {
  const sel = selLane();
  if (sel && CLIP_CLS[sel.key]) {
    if (guardLock(sel.lane)) return;
    const kept = trimSpan(outStart(sel.it), Number(sel.it.dur) || 1, S.time, side);
    if (!kept) return toast("Playhead phải nằm trong mục đang chọn.", true);
    snapshot();
    setOutStart(sel.it, kept.start); sel.it.dur = round3(kept.dur);
    return changed({ inspector: true });
  }
  if (guardLock("segments")) return;
  const s = S.tm.segs.find((x) => S.time > x.outStart + 0.1 && S.time < x.outEnd - 0.1);
  if (!s) return toast("Đưa playhead vào giữa một đoạn video.", true);
  snapshot();
  trimSeg(s.id, side === "left" ? "l" : "r", S.tm.outToSrc(S.time));
  changed({ inspector: true });
  if (S.tab === "segments") renderList();
  if (side === "left") seek(s.outStart); // như CapCut: playhead về điểm nối mới
}
let tlClipboard = null;
// Bộ nhớ chép: [{key, item, off}] — off = khoảng cách tới mục đầu, dán giữ nguyên nhịp của nhóm.
function copySelected() {
  const sel = selLane();
  const list = (S.multi?.length > 1 ? multiItems() : sel ? [sel] : []).filter((m) => CLIP_CLS[m.key]);
  if (!list.length) return toast("Sao chép được chữ, đồ hoạ, zoom và cảnh trám.", true);
  const base = Math.min(...list.map((m) => outStart(m.it)));
  tlClipboard = list.map((m) => ({ key: m.key, item: structuredClone(m.it), off: outStart(m.it) - base }));
  toast(`Đã sao chép ${list.length} mục. Ctrl+V để dán tại playhead.`);
}
function pasteClip() {
  if (!tlClipboard?.length) return toast("Chưa có mục nào được sao chép.", true);
  if (tlClipboard.some((c) => guardLock(trackOf(c.key, c.item)))) return;
  snapshot();
  let last = null;
  for (const c of tlClipboard) {
    const arr = itemsOf(c.key), b = structuredClone(c.item);
    b.id = uid(c.key[0] + "c", arr);
    delete b.row;
    setOutStart(b, S.time + c.off);
    arr.push(b);
    last = [b, c.key];
  }
  S.multi = [];
  focusItem(...last);
  changed({ inspector: true });
}
// ↑ / ↓: nhảy tới điểm cắt / mép mục trước hoặc sau.
function jumpEdit(dir) {
  const pts = [...new Set(snapPoints(null).slice(1).map(round3))].sort((a, b) => a - b);
  const t = dir > 0 ? pts.find((p) => p > S.time + 0.01) : [...pts].reverse().find((p) => p < S.time - 0.01);
  if (t !== undefined) seek(t);
}
function closeTlMenu() { $("#tlMenu")?.remove(); document.removeEventListener("pointerdown", tlMenuOutside, true); }
function tlMenuOutside(e) { if (!$("#tlMenu")?.contains(e.target)) closeTlMenu(); }
function openTlMenu(x, y) {
  closeTlMenu();
  const overlay = !!CLIP_CLS[selLane()?.key];
  const rows = [["Tách", "Ctrl+B", splitSelected], ["Xoá bên trái", "Q", () => trimAtPlayhead("left")], ["Xoá bên phải", "W", () => trimAtPlayhead("right")],
    overlay && ["Sao chép", "Ctrl+C", copySelected], tlClipboard && ["Dán tại playhead", "Ctrl+V", pasteClip], ["Xoá", "Delete", deleteSelected]].filter(Boolean);
  const menu = h("div", { id: "tlMenu", class: "tl-menu", role: "menu", "aria-label": "Thao tác trên timeline",
    onkeydown: (e) => {
      const items = [...menu.querySelectorAll("button")], i = items.indexOf(document.activeElement);
      if (e.key === "Escape") { e.preventDefault(); closeTlMenu(); }
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus(); }
    } },
    ...rows.map(([label, key, fn]) => h("button", { type: "button", role: "menuitem", onclick: () => { closeTlMenu(); fn(); } }, h("span", {}, label), h("kbd", {}, key))));
  document.body.append(menu);
  menu.style.left = Math.min(x, innerWidth - menu.offsetWidth - 8) + "px";
  menu.style.top = Math.min(y, innerHeight - menu.offsetHeight - 8) + "px";
  menu.querySelector("button")?.focus();
  setTimeout(() => document.addEventListener("pointerdown", tlMenuOutside, true));
}
$("#tlScroll").addEventListener("contextmenu", (e) => { if (!e.target.closest(".clip")) return; e.preventDefault(); openTlMenu(e.clientX, e.clientY); });
$("#tlSplit").onclick = splitSelected;
$("#tlDelete").onclick = deleteSelected;
$("#tlTrimLeft").onclick = () => trimAtPlayhead("left");
$("#tlTrimRight").onclick = () => trimAtPlayhead("right");
$("#tlToolSelect").onclick = () => setTlTool("select");
$("#tlToolSplit").onclick = () => setTlTool("split");
$("#tlSnap").onclick = () => setSnap(!S.snap);
setSnap(S.snap);

// ---------- Công cụ clip kiểu CapCut trên thanh timeline: đóng băng, lật, xoay, cắt khung, tốc độ, ghi âm ----------
function clipAtPlayhead() {
  const sel = selLane();
  if (sel?.key === "segments") return sel.it;
  const s = S.tm.segs.find((x) => S.time >= x.outStart && S.time < x.outEnd);
  return s ? itemsOf("segments").find((x) => x.id === s.id) : null;
}
function editClip(fn, done) {
  if (guardLock("segments")) return;
  const seg = clipAtPlayhead();
  if (!seg) return toast("Đưa playhead vào một đoạn video hoặc chọn đoạn video.", true);
  snapshot(); fn(seg); changed({ inspector: true }); if (done) toast(done);
}
function openClipField(label) {
  const seg = clipAtPlayhead();
  if (!seg) return toast("Đưa playhead vào một đoạn video hoặc chọn đoạn video.", true);
  if (S.tab !== "segments") { S.tab = "segments"; renderTabs(); }
  S.selKind = null; S.selId = seg.id; S.multi = [];
  openDrawer(); renderList(); renderInspector(); renderTimeline();
  setTimeout(() => { // chờ ngăn kéo mở + bảng thuộc tính vẽ xong
    const f = [...document.querySelectorAll("#inspector .field > label")].find((l) => l.textContent.trim().startsWith(label))?.parentElement;
    if (!f) return toast(`Chưa có mục “${label}” cho đoạn này.`, true);
    f.scrollIntoView({ block: "center", behavior: "smooth" }); f.querySelector("input,select,button")?.focus({ preventScroll: true });
  }, 250);
}
$("#tlFreeze").onclick = () => {
  if (guardLock("segments")) return;
  snapshot();
  (P().vfx = P().vfx || []).push({ id: "vfx" + Date.now().toString(36), type: "freeze", at: round3(S.tm.outToSrc(S.time)), dur: 1.5, amount: 0.5 });
  changed(); toast("Đã đóng băng khung 1,5 giây tại playhead (chỉnh trong Hiệu ứng).");
};
$("#tlFlip").onclick = () => editClip((s) => { s.transform = { ...(s.transform || {}), flipH: !s.transform?.flipH }; }, "Đã lật ngang đoạn video.");
$("#tlRotate").onclick = () => editClip((s) => { let r = (Number(s.transform?.rotate) || 0) + 90; if (r > 180) r -= 360; s.transform = { ...(s.transform || {}), rotate: r }; }, "Đã xoay đoạn video 90°.");
$("#tlCrop").onclick = () => openClipField("Cắt vùng nguồn");
$("#tlSpeed").onclick = () => openClipField("Tốc độ đoạn này");
// Ghi âm thuyết minh: micro → WAV → inputs/ → track Thuyết minh tại playhead (bấm lại để dừng).
let voiceRec = null;
$("#tlRecord").onclick = async () => {
  const btn = $("#tlRecord");
  if (voiceRec) return voiceRec.stop();
  if (guardLock("audio-clips")) return;
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return toast("Không mở được micro: " + e.message, true); }
  const at = round3(S.tm.outToSrc(S.time)), chunks = [], project = P(), rec = new MediaRecorder(stream);
  voiceRec = rec; btn.classList.add("on"); btn.setAttribute("aria-pressed", "true"); toast("Đang ghi âm thuyết minh… bấm nút micro lần nữa để dừng.");
  rec.ondataavailable = (e) => chunks.push(e.data);
  rec.onstop = async () => {
    stream.getTracks().forEach((t) => t.stop());
    voiceRec = null; btn.classList.remove("on"); btn.setAttribute("aria-pressed", "false");
    try {
      const ctx = new AudioContext(), audio = await ctx.decodeAudioData(await new Blob(chunks).arrayBuffer());
      ctx.close();
      if (audio.duration < 0.3) throw new Error("Bản ghi quá ngắn.");
      const name = `thuyet-minh-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.wav`;
      const r = await editorFetch(`/api/upload?name=${encodeURIComponent(name)}`, { method: "POST", body: new Blob([encodeWav(audio.getChannelData(0), audio.sampleRate)], { type: "audio/wav" }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Tải bản ghi lên lỗi.");
      if (P() !== project) throw new Error("Dự án đã đổi; bản ghi nằm trong tư liệu của dự án trước.");
      S.media = j.media || S.media;
      snapshot();
      (P().audio.clips = P().audio.clips || []).push({ id: crypto.randomUUID(), src: j.path, at, from: 0, vol: 1, sourceDuration: round3(audio.duration) });
      changed(); toast(`Đã chèn thuyết minh ${audio.duration.toFixed(1)}s vào track Thuyết minh.`);
    } catch (e) { toast("Không lưu được ghi âm: " + e.message, true); }
  };
  rec.start();
};

// ---------- Chọn nhiều (Shift / Ctrl + bấm, kéo khung trên vùng trống, Ctrl+A) ----------
S.multi = [];
function mkey(k, id) { return k + ":" + id; }
function inMulti(k, id) { return (S.multi || []).includes(mkey(k, id)); }
function multiItems() {
  return S.multi.map((m) => { const i = m.indexOf(":"), key = m.slice(0, i), id = m.slice(i + 1); return { key, it: itemsOf(key).find((x) => x.id === id) }; }).filter((m) => m.it);
}
function toggleMulti(k, id) {
  queueMicrotask(renderInspector);
  if (!S.multi.length) { const cur = selLane(); if (cur) S.multi = [mkey(cur.key, cur.it.id)]; }
  const m = mkey(k, id);
  S.multi = S.multi.includes(m) ? S.multi.filter((x) => x !== m) : [...S.multi, m];
  renderTimeline();
  toast(`Đang chọn ${S.multi.length} mục.`);
}
function setMulti(list) {
  queueMicrotask(renderInspector);
  S.multi = list.filter((m) => !track(m.startsWith("segments:") ? "segments" : trackOf(m.slice(0, m.indexOf(":")))).locked);
  renderTimeline();
  if (S.multi.length) toast(`Đang chọn ${S.multi.length} mục. Delete để xoá, Ctrl+C để sao chép, kéo một mục để dời cả nhóm.`);
}
function selectAll() {
  const list = S.tm.segs.map((s) => mkey("segments", s.id));
  for (const k of Object.keys(CLIP_CLS)) for (const x of itemsOf(k)) list.push(mkey(k, x.id));
  setMulti(list);
}
// Kéo khung trên vùng trống của các làn để chọn mọi clip chạm khung.
$("#lanes").addEventListener("pointerdown", (e) => {
  if (e.button !== 0 || e.pointerType === "touch" || e.target.closest(".clip") || S.tlTool !== "select") return;
  const box = $("#tlContent").getBoundingClientRect(), x0 = e.clientX, y0 = e.clientY;
  const band = h("div", { class: "tl-marquee" });
  $("#tlContent").append(band);
  const mv = (ev) => {
    const l = Math.min(x0, ev.clientX), t = Math.min(y0, ev.clientY);
    band.style.cssText = `left:${l - box.left}px;top:${t - box.top}px;width:${Math.abs(ev.clientX - x0)}px;height:${Math.abs(ev.clientY - y0)}px`;
  };
  const up = (ev) => {
    window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
    band.remove();
    if (Math.abs(ev.clientX - x0) < 4 && Math.abs(ev.clientY - y0) < 4) { if (S.multi.length) { S.multi = []; renderTimeline(); renderInspector(); } return; }
    const r = { l: Math.min(x0, ev.clientX), r: Math.max(x0, ev.clientX), t: Math.min(y0, ev.clientY), b: Math.max(y0, ev.clientY) };
    setMulti([...document.querySelectorAll("#lanes .clip[data-k]")].filter((c) => { const q = c.getBoundingClientRect(); return q.right > r.l && q.left < r.r && q.bottom > r.t && q.top < r.b; }).map((c) => mkey(c.dataset.k, c.dataset.id)));
  };
  window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
});
function deleteMulti() {
  const list = multiItems();
  snapshot();
  for (const { key, it } of list) {
    if (key === "segments") it.keep = false;
    else { const arr = itemsOf(key), i = arr.indexOf(it); if (i >= 0) arr.splice(i, 1); }
  }
  S.multi = []; S.selId = null;
  changed({ inspector: true });
  toast(`Đã xoá ${list.length} mục. Ctrl+Z để hoàn tác.`);
}

// ---------- Dạng sóng âm cho nhạc nền và thuyết minh (đỉnh 20/giây từ /api/wave-file) ----------
S.waves = {};
function waveOf(src) {
  if (!src) return null;
  if (S.waves[src] === undefined) {
    S.waves[src] = null;
    fetch("/api/wave-file?src=" + encodeURIComponent(src)).then((r) => (r.ok ? r.json() : null)).then((w) => { if (w?.peaks) { S.waves[src] = w; renderTimeline(); } }).catch(() => {});
  }
  return S.waves[src];
}
// Vẽ đỉnh từ giây `from` của file; loop=true lặp lại file (nhạc nền ngắn hơn video).
function drawWave(el, wv, w, hgt, from, loop) {
  if (!wv || w < 4 || w > 30000) return;
  const c = h("canvas", { class: "wave", width: Math.round(w), height: hgt, style: `width:${Math.round(w)}px` }), g = c.getContext("2d"), mid = hgt / 2, n = wv.peaks.length;
  g.fillStyle = "rgba(110,190,255,.6)";
  for (let x = 0; x < w; x += 2) {
    let i = Math.floor((from + x / S.pps) * wv.per);
    if (loop && n) i %= n;
    const hh = Math.max(1, (wv.peaks[i] || 0) * mid * 1.8);
    g.fillRect(x, mid - hh / 2, 1.4, hh);
  }
  el.prepend(c);
}

// ===================== Phụ đề =====================
function lineTimes(l) {
  const kept = (l.words || []).filter((w) => S.tm.isKept((w.s + w.e) / 2));
  if (!kept.length) return { o: -1, d: 0 };
  const o = S.tm.srcToOut(kept[0].s);
  return { o, d: S.tm.srcToOut(kept[kept.length - 1].e) - o + 0.15 };
}
const lineText = (l) => (l.words || []).map((w) => w.w).join(" ");
function transcriptWords() {
  if(!sourceTranscriptMatches(P(),S.transcript))return [];
  return (S.transcript?.words || [])
    .map((w, i) => ({ i, w: String(w.word ?? w.text ?? "").trim().normalize("NFC"), s: Number(w.start), e: Number(w.end) }))
    .filter((w) => w.w && w.e >= w.s);
}
function ensureCaptions() {
  const c = (P().captions = P().captions || {});
  for (const [k, v] of Object.entries({ enabled: false, y: P().format==='16:9'?1450*1080/1920:1450, x: 0, scale: 1, maxWords: 4, hideOnScenes: false })) if (c[k] === undefined) c[k] = v;
  c.lines = c.lines || [];
  return c;
}
// font có đủ dấu tiếng Việt; font riêng của mẫu chưa có trong danh sách thì thêm vào để không mất
const fontOptions = (cur) => [...new Set([...Object.keys(FONTS), ...(cur ? [cur] : [])])].map((f) => [f, f]);
function ensureBrand() {
  if (!P().brand) P().brand = structuredClone(BRAND_DEFAULT);
  P().brand.caption = { ...BRAND_DEFAULT.caption, ...(P().brand.caption || {}) };
  return P().brand;
}
function generateCaptions() {
  const words = transcriptWords();
  if (!words.length) return toast("Chưa có lời nói (transcript). Chạy nhận dạng giọng trước.", true);
  snapshot();
  const c = ensureCaptions();
  c.enabled = true;
  c.lines = groupCaptionLines(words, Number(c.maxWords) || 4);
  S.selId = null;
  changed({ inspector: true });
  renderList();
  toast(`Đã tạo ${c.lines.length} dòng phụ đề.`);
}
const colorIn = (obj, key, def) => bind(obj, key, h("input", { type: "color", value: obj[key] ?? def, class: "color" }));

function renderCaptionsBoard(list, q) {
  const c = ensureCaptions(), b = ensureBrand(), bc = b.caption;
  const box = h("div", { class: "settings insp", style: "margin-bottom:12px" });
  if(S.transcript&&!sourceTranscriptMatches(P(),S.transcript))box.append(h('p',{class:'err'},'Nguồn hoặc điểm đọc đã đổi. Phụ đề đã lưu vẫn giữ nguyên; nhận giọng lại và kiểm tra trước khi tạo lại phụ đề.'),asrBox());
  const narrationClips=(P().audio?.clips||[]).filter(c=>!c.hidden);
  if(narrationClips.length){
    const select=h('select',{'aria-label':'Voice để tạo phụ đề'},narrationClips.map((c,i)=>h('option',{value:c.id},`Voice ${i+1}: ${c.src.split('/').pop()}`))),status=h('p',{role:'status'}),preview=h('pre',{style:'white-space:pre-wrap;max-height:160px;overflow:auto'}),apply=h('button',{disabled:true},'Thay phụ đề bằng lời voice');let candidate=null;
    const language=h('select',{'aria-label':'Ngôn ngữ voice'},h('option',{value:'vi'},'Tiếng Việt'),h('option',{value:'en'},'English'),h('option',{value:'auto'},'Tự nhận ngôn ngữ'));language.onchange=()=>{candidate=null;apply.disabled=true;preview.textContent='';};
    let recognitionController=null;
    const cancel=h('button',{disabled:true,onclick:()=>recognitionController?.abort()},'Hủy nhận giọng');
    const project=P(),base=JSON.stringify(project),projectDir=S.dir;select.onchange=()=>{candidate=null;apply.disabled=true;preview.textContent='';};
    box.append(h('h3',{},'Phụ đề từ voice trên timeline'),select,language,h('button',{onclick:async event=>{if(S.dirty){status.textContent='Lưu bản dựng trước khi nhận giọng từ voice.';return;}const clipId=select.value;event.target.disabled=true;select.disabled=true;language.disabled=true;apply.disabled=true;status.textContent='Đang nghe audio bằng Whisper trên máy…';try{
      recognitionController=new AbortController();cancel.disabled=false;
      const response=await editorFetch('/api/asr/narration',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clipId,language:language.value,stream:true}),signal:recognitionController.signal});
      const {result}=await readNarrationResponse(response,progress=>{if(status.isConnected)status.textContent=`${Math.round(progress.pct||0)}% · ${progress.phase||'Đang nhận giọng'}`;});if(!status.isConnected)return;
      if(P()!==project||S.dir!==projectDir||JSON.stringify(P())!==base)throw new Error('Bản dựng đã đổi. Mở lại tab để nhận giọng.');
      const clip=narrationClips.find(c=>c.id===clipId),words=narrationCaptionWords(project,clip,result.words);if(!words.length)throw new Error('Không có từ nhận dạng trong phần voice đang dùng.');
      candidate=groupCaptionLines(words,Number(c.maxWords)||4);preview.textContent=candidate.map(line=>line.words.map(w=>w.w).join(' ')).join('\n');status.textContent=`Đã nhận ${words.length} từ, ${candidate.length} dòng. Kiểm tra chữ và mốc thời gian; chưa thay phụ đề.`;apply.disabled=false;
    }catch(error){if(status.isConnected)status.textContent=recognitionController?.signal.aborted?'Đã yêu cầu hủy nhận giọng. Phụ đề hiện tại được giữ nguyên.':error.message;}finally{recognitionController=null;cancel.disabled=true;event.target.disabled=false;select.disabled=false;language.disabled=false;}}},'Nhận giọng từ voice'),cancel,h('p',{class:'help'},'Dùng phần audio đã cắt và vị trí trên timeline. Kết quả nhận dạng có thể khác kịch bản; cần kiểm tra trước khi áp dụng. Không cắt lại video.'),status,preview,apply);
    apply.onclick=()=>{if(!candidate||P()!==project||S.dir!==projectDir||JSON.stringify(P())!==base){status.textContent='Bản dựng đã đổi. Nhận giọng lại trước khi áp dụng.';apply.disabled=true;return;}snapshot();c.lines=candidate;c.enabled=true;changed({inspector:true});renderList();toast('Đã thay phụ đề từ voice. Kiểm tra preview rồi Lưu; có thể Hoàn tác.');};
  }
  // bật phụ đề mà chưa có dòng nào → tự tạo từ lời nói (không thì bật xong vẫn không thấy gì)
  const onBox = chk(c, "enabled", false);
  onBox.addEventListener("change", () => { if (onBox.checked && !c.lines.length && transcriptWords().length) generateCaptions(); });
  box.append(
    h("div", { class: "row" },
      field("Hiện phụ đề", h("label", { class: "inline" }, onBox, "Bật phụ đề cho toàn video")),
      field("Kiểu", sel(bc, "style", CAPTION_STYLES, "pill"))),
    h("div", { class: "row" },
      field("Font phụ đề", sel(bc, "font", [["", "Theo kiểu phụ đề"], ...fontOptions(bc.font)], "")),
      field("Font tiêu đề", sel(b, "fontTitle", fontOptions(b.fontTitle), "Anton"))),
    h("div", { class: "row3" },
      field("Cỡ chữ", num(bc, "size", 1, 58)),
      field("Màu chữ", colorIn(bc, "color", "#FFFFFF")),
      field("Màu từ đang nói", colorIn(bc, "active", "#F6E96B"))),
    h("div", { class: "row" },
      field("Số từ mỗi dòng", num(c, "maxWords", 1, 4), "Đổi xong bấm Tạo lại."),
      field("Tuỳ chọn", h("div", {},
        h("label", { class: "inline" }, chk(bc, "uppercase", false), "In hoa"),
        h("label", { class: "inline" }, chk(c, "hideOnScenes", false), "Ẩn khi có cảnh minh hoạ"),
        h("label", { class: "inline" }, chk(c, "behind", false), "Chữ nằm sau người (cần lớp tách nền)")))),
    h("div", { class: "btns", style: "border:0;padding-top:0" },
      h("button", { class: "outline small", onclick: () => {
        if (c.lines.length && !confirm("Tạo lại sẽ thay toàn bộ chữ phụ đề đã sửa tay. Tiếp tục?")) return;
        generateCaptions();
      } }, c.lines.length ? "Tạo lại từ lời nói" : "Tạo phụ đề từ lời nói")),
    h("div", { class: "help" }, "Kéo phụ đề trên video để đổi vị trí cho cả video; kéo góc để đổi cỡ."));
  list.append(box);
  if (!c.lines.length) {
    list.append(transcriptWords().length ? h("div", { class: "empty" }, "Chưa có phụ đề. Bấm “Tạo phụ đề từ lời nói”.") : asrBox());
    return;
  }
  for (const l of c.lines) {
    const text = lineText(l);
    if (q && !text.toLowerCase().includes(q)) continue;
    const { o } = lineTimes(l);
    const inp = h("input", { value: text });
    inp.addEventListener("click", (e) => e.stopPropagation());
    let snapped = false; // 1 lượt sửa = 1 bước hoàn tác
    inp.addEventListener("focus", () => { snapped = false; S.selId = l.id; if (o >= 0) seek(o + 0.05); highlightRows(); renderInspector(); });
    inp.addEventListener("input", () => { if (!snapped) { snapshot(); snapped = true; } Object.assign(l, retimeLine(l, inp.value)); changed({ list: false }); });
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") inp.blur(); });
    list.append(h("div", { class: `capr ${o < 0 ? "cut" : ""} ${S.selId === l.id ? "on" : ""}`, "data-id": l.id, onclick: () => { S.selId = l.id; if (o >= 0) seek(o + 0.05); highlightRows(); renderInspector(); } },
      h("span", { class: "tc" }, o < 0 ? "đã cắt" : fmt(o)), inp));
  }
}
function highlightRows() {
  document.querySelectorAll(".capr").forEach((r) => r.classList.toggle("on", r.dataset.id === S.selId));
  renderTimeline();
}

// ===================== Cắt bằng transcript =====================
function primaryClipsDialog(){
  if(S.dirty)return toast('Lưu bản dựng trước khi chọn thêm nguồn.',true);
  const project=P(),base=JSON.stringify(project),dir=S.dir,chosen=[],ranges=new Map(),previews=[];let generation=0;
  const dialog=h('dialog',{'aria-label':'Thêm video nguồn',style:'max-width:680px;max-height:85vh;overflow:auto;background:var(--surface);color:var(--ink);padding:24px;border:1px solid var(--line);border-radius:16px'}),status=h('p',{role:'status'}),preview=h('pre',{style:'white-space:pre-wrap'}),apply=h('button',{disabled:true},'Thêm vào bản dựng');let result;
  const rangeControls=h('div',{'aria-label':'Điểm cắt nguồn đã chọn'});
  const choices=()=>chosen.map(src=>({src,...ranges.get(src)}));
  const invalidate=()=>{generation++;result=null;apply.disabled=true;};
  const insertionTime=S.tm.outToSrc(S.time),insertionOutput=S.time;
  const placement=h('select',{'aria-label':'Vị trí chèn A-roll',onchange:invalidate},h('option',{value:''},'Cuối bản dựng'),h('option',{value:'__contentos_playhead__'},`Tại playhead lúc mở hộp (${insertionOutput.toFixed(2)}s đầu ra)`),...project.segments.slice().sort((a,b)=>a.in-b.in).map((s,index)=>h('option',{value:s.id},`Trước đoạn ${index+1}: ${s.text||s.src||project.source.video}${s.keep===false?' (đang bỏ)':''}`)));
  const drawRanges=()=>{previews.splice(0).forEach(p=>p.dispose());rangeControls.replaceChildren(...chosen.map((src,index)=>{const range=ranges.get(src)??{from:0,speed:1};ranges.set(src,range);const inputs=new Map();const input=(key,label,def)=>{const el=h('input',{type:'number',min:key==='speed'?.25:0,step:.05,value:range[key]??def,'aria-label':label+' '+src});inputs.set(key,el);el.oninput=()=>{invalidate();if(key==='to'&&el.value==='')delete range.to;else range[key]=el.value===''?NaN:Number(el.value);};return field(label,el);};const form=h('section',{},h('b',{},`${index+1}. ${src}`),input('from','Vào file (giây)',0),input('to','Ra file (để trống dùng hết)',''),input('speed','Tốc độ',1));const preview=sourceRangePreview({src,url:'/api/primary-media-preview?'+new URLSearchParams({src,dir,revision:S.revision,workspaceId:project.workspaceId||'default'}),range,onChange:(key,value)=>{invalidate();range[key]=value;inputs.get(key).value=value;},validate:()=>{if(P()!==project||S.dir!==dir||JSON.stringify(P())!==base)throw new Error('Bản dựng đã đổi. Mở lại hộp chọn nguồn.');}});previews.push(preview);form.append(preview.element);return form;}));};
  const videos=S.media.filter(src=>/\.(mp4|mov|m4v|webm)$/i.test(src));
  dialog.append(h('h3',{},'Thêm video vào bản dựng'),h('p',{},'Chọn nguồn theo thứ tự và vị trí chèn. Khi chèn giữa, chữ/phụ đề/audio đi theo đoạn neo; nhạc nền/vùng hạ nhạc giữ mốc đầu ra. Kiểm tra nội dung kéo qua điểm nối. Chưa đổi bản dựng tới khi bấm Thêm.'),field('Vị trí chèn',placement),...videos.map(src=>h('label',{style:'display:block;margin:8px 0'},h('input',{type:'checkbox',onchange:event=>{if(event.target.checked)chosen.push(src);else chosen.splice(chosen.indexOf(src),1);invalidate();drawRanges();preview.textContent=chosen.map((s,i)=>`${i+1}. ${s}`).join('\n');}}),src)),rangeControls,h('p',{},'Thiếu nguồn: đóng hộp này và dùng Cảnh trám → NAS / Điện thoại hoặc Từ máy tính để nhận tư liệu.'),h('button',{onclick:async event=>{event.target.disabled=true;apply.disabled=true;const token=generation,selection=choices();try{if(P()!==project||S.dir!==dir||JSON.stringify(P())!==base)throw new Error('Bản dựng đã đổi. Mở lại chọn nguồn.');const {assets}=await api('/api/primary-media-info','POST',{selected:selection.map(item=>item.src)});if(token!==generation)throw new Error('Lựa chọn đã đổi. Kiểm tra nguồn lại.');if(P()!==project||S.dir!==dir||JSON.stringify(P())!==base)throw new Error('Bản dựng đã đổi. Mở lại chọn nguồn.');result=appendPrimaryClips(project,selection,assets,placement.value==='__contentos_playhead__'?{atSource:insertionTime}:placement.value?{beforeId:placement.value}:{});status.textContent=`Đã kiểm tra ${result.added} video. Bản dựng mới dài ${makeTimemap(result.project).total.toFixed(2)}s. Chưa thêm hoặc lưu.`;apply.disabled=false;}catch(error){status.textContent=error.message;result=null;}finally{event.target.disabled=false;}}},'Kiểm tra nguồn'),preview,status,apply,h('button',{onclick:()=>dialog.close()},'Đóng'));
  apply.onclick=()=>{if(!result||P()!==project||S.dir!==dir||JSON.stringify(P())!==base){status.textContent='Bản dựng đã đổi. Mở lại chọn nguồn.';return;}snapshot();S.project=result.project;S.selId=null;changed({inspector:true});renderList();dialog.close();toast('Đã thêm video. Kiểm tra và bấm Lưu; có thể Hoàn tác.');};
  dialog.addEventListener('close',()=>{previews.forEach(p=>p.dispose());dialog.remove();},{once:true});document.body.append(dialog);dialog.showModal();
}
async function loadSourceTimelines(){
  S.sourceTimelines??={};const project=P(),dir=S.dir;
  for(const src of new Set(project.segments.map(s=>s.src).filter(Boolean))){
    if(S.sourceTimelines[src])continue;
    try{const data=await api('/api/timeline-source?src='+encodeURIComponent(src));if(P()!==project||S.dir!==dir)return;S.sourceTimelines[src]=data;renderTimeline();}catch(error){toast('Chưa tạo được timeline nguồn '+src+': '+error.message,true);}
  }
}
S.tsel = null;
let tsUp = null;
window.addEventListener("pointerup", () => tsUp && tsUp());
function segTextFromWords() {
  const words = transcriptWords();
  if (!words.length) return;
  for (const s of itemsOf("segments")) s.text = words.filter((w) => (w.s + w.e) / 2 >= s.in && (w.s + w.e) / 2 <= s.out).map((w) => w.w).join(" ");
}
function splitAtSrc(t) {
  const segs = itemsOf("segments");
  const s = segs.find((x) => t > x.in + 0.01 && t < x.out - 0.01);
  if (!s) return;
  s.g = s.g || s.id;
  pinSourceAudioEnvelope(s,(s.out-s.in)/Math.max(.25,Math.min(4,Number(s.speed)||Number(P().speed)||1)));
  const n = { ...structuredClone(s), id: uid("s", segs), in: round3(t) };
  delete n.tIn;
  shiftSegmentZoom(n,round3(t)-s.in,P().speed);
  shiftSourceAudioEnvelope(n,(round3(t)-s.in)/Math.max(.25,Math.min(4,Number(s.speed)||Number(P().speed)||1)));
  if(s.src)n.mediaStart=round3((s.mediaStart??0)+round3(t)-s.in);
  s.out = round3(t);
  segs.splice(segs.indexOf(s) + 1, 0, n);
}
// Gộp các đoạn liền nhau cùng trạng thái giữ/cắt để không sinh quá nhiều clip.
function mergeSegs() {
  const segs = itemsOf("segments").sort((a, b) => a.in - b.in);
  for (let i = segs.length - 1; i > 0; i--) {
    const a = segs[i - 1], b = segs[i];
    if (!a.audioEnvelope && !b.audioEnvelope && !a.src && !b.src && Math.abs(a.out - b.in) < 0.002 && (a.keep !== false) === (b.keep !== false) && !b.tIn && (a.g || a.id) === (b.g || b.id) && a.speed === b.speed) {
      a.out = b.out;
      a.text = [a.text, b.text].filter(Boolean).join(" ");
      segs.splice(i, 1);
    }
  }
  segs.forEach((s) => { if (s.out - s.in < 0.04) s.keep = false; });
  segTextFromWords();
}
function setRange(a, b, keep) {
  splitAtSrc(a);
  splitAtSrc(b);
  for (const s of itemsOf("segments")) if (s.in >= a - 0.002 && s.out <= b + 0.002) s.keep = keep;
  mergeSegs();
}
function wordRangeTimes(i0, i1) {
  const ws = transcriptWords();
  const [x, y] = [Math.min(i0, i1), Math.max(i0, i1)];
  const first = ws[x], last = ws[y], prev = ws[x - 1], next = ws[y + 1];
  const a = prev ? (prev.e + first.s) / 2 : Math.max(0, first.s - 0.08);
  const b = next ? (last.e + next.s) / 2 : last.e + 0.12;
  return [round3(a), round3(b)];
}
function cutSelection(keep) {
  if (!S.tsel) return toast("Bôi đen chữ trong lời nói trước.", true);
  const [a, b] = wordRangeTimes(S.tsel.a, S.tsel.b);
  snapshot();
  setRange(a, b, keep);
  S.tsel = null;
  S.selId = null;
  changed({ inspector: true });
  renderList();
  toast(keep ? "Đã giữ lại đoạn chọn." : "Đã cắt đoạn chọn. Ctrl+Z để hoàn tác.");
}
function autoCutSilence(th = 0.6) {
  const ws = transcriptWords();
  if (!ws.length) return toast("Chưa có lời nói (transcript).", true);
  snapshot();
  let n = 0;
  const dur = P().source?.duration || ws[ws.length - 1].e;
  if (ws[0].s > 0.5) { setRange(0, ws[0].s - 0.12, false); n++; }
  for (let i = 1; i < ws.length; i++) {
    if (ws[i].s - ws[i - 1].e > th) { setRange(ws[i - 1].e + 0.12, ws[i].s - 0.08, false); n++; }
  }
  if (dur - ws[ws.length - 1].e > 0.6) { setRange(ws[ws.length - 1].e + 0.2, dur, false); n++; }
  changed({ inspector: true });
  renderList();
  toast(n ? `Đã cắt ${n} khoảng lặng dài hơn ${th}s.` : "Không có khoảng lặng nào cần cắt.");
}
// ===================== Nhận giọng nói (whisper chạy trong phần mềm) =====================
S.asr = null;
let asrTimer = null;
async function refreshAsr() { try { S.asr = await (await editorFetch("/api/asr")).json(); } catch {} return S.asr; }
function asrBox() {
  const st = S.asr?.status, job = S.asr?.job;
  const box = h("div", { class: "note asr-box", style: "margin:0 0 12px" });
  if(S.transcript&&!sourceTranscriptMatches(P(),S.transcript))box.append(h('p',{class:'err'},'Nguồn hoặc điểm đọc đã đổi. Nhận giọng lại trước khi cắt theo chữ hoặc tạo phụ đề. Phụ đề đã lưu vẫn được giữ để kiểm tra.'));
  if (job?.running) {
    box.append(h("b", {}, job.kind === "install" ? "Đang cài công cụ nhận giọng" : "Đang nghe lời nói trong video"), h("br"),
      h("span", { class: "muted" }, job.phase || "…"),
      h("div", { class: "asr-bar" }, h("i", { style: `width:${Math.max(2, job.pct || 0)}%` })),
      h("div", { class: "help" }, job.kind === "install" ? "Chỉ tải 1 lần, dùng cho mọi video sau." : "Chạy ngay trên máy bạn, âm thanh không gửi đi đâu. Video 1 phút mất khoảng 1–3 phút."));
    return box;
  }
  if (job && job.ok === false) box.append(h("div", { class: "err", style: "margin-bottom:6px" }, "Lỗi: " + job.error));
  if (!st) { box.append("Đang kiểm tra công cụ nhận giọng…"); return box; }
  if (!st.ready) {
    box.append(h("b", {}, "Chưa có công cụ nhận giọng"), h("br"),
      "Phần mềm cần tải công cụ nhận giọng tiếng Việt (whisper, khoảng " + st.downloadMB + " MB) một lần để tự nghe lời nói, tạo phụ đề và cắt bằng chữ.",
      h("div", { class: "btns", style: "border:0;padding:8px 0 0" },
        st.canInstallBin || st.bin
          ? h("button", { class: "primary small", onclick: async () => {
              if (!confirm(`Tải công cụ nhận giọng (khoảng ${st.downloadMB} MB) từ GitHub ggml-org/whisper.cpp và HuggingFace về máy?`)) return;
              await editorFetch("/api/asr/install", { method: "POST" }); await refreshAsr(); updateAsr(); pollAsr();
            } }, "Tải công cụ nhận giọng")
          : h("div", { class: "help" }, "Trên macOS: mở Terminal, chạy  brew install whisper-cpp  rồi bấm nút này lại.")));
    return box;
  }
  const has = transcriptWords().length > 0;
  const language=h('select',{'aria-label':'Ngôn ngữ nhận giọng nguồn'},[['vi','Tiếng Việt'],['en','English'],['auto','Tự nhận ngôn ngữ']].map(([value,label])=>h('option',{value,selected:(S.asrLanguage||'vi')===value},label)));
  language.onchange=()=>{S.asrLanguage=language.value;};
  box.append(language);
  box.append(h("b", {}, has ? "Đã có lời nói" : "Chưa có lời nói"), h("br"),
    has ? `${transcriptWords().length} từ. Nhận lại nếu bạn vừa thay video gốc.` : "Bấm để phần mềm tự nghe lời nói, chia đoạn theo khoảng lặng và tạo phụ đề.",
    h("div", { class: "btns", style: "border:0;padding:8px 0 0" },
      h("button", { class: has ? "outline small" : "primary small", onclick: startAsr }, has ? "Nhận giọng lại" : "Nhận giọng nói")));
  return box;
}
function updateAsr() { document.querySelectorAll(".asr-box").forEach((el) => el.replaceWith(asrBox())); }
async function startAsr() {
  if (transcriptWords().length && !confirm("Nhận giọng lại sẽ thay lời nói hiện tại (đoạn cắt và phụ đề đã sửa vẫn giữ). Tiếp tục?")) return;
  if(S.dirty)return toast('Lưu bản dựng trước khi nhận giọng.',true);
  const r = await editorFetch("/api/asr", { method: "POST",headers:{'Content-Type':'application/json'},body:JSON.stringify({language:S.asrLanguage||'vi'}) }).then((x) => x.json()).catch(() => ({}));
  if (!r.ok) return toast(r.error || "Không chạy được nhận giọng.", true);
  await refreshAsr(); updateAsr(); pollAsr();
}
function pollAsr() {
  clearInterval(asrTimer);
  asrTimer = setInterval(async () => {
    const a = await refreshAsr();
    updateAsr();
    if (a?.job?.running) return;
    clearInterval(asrTimer);
    if (a?.job?.ok && a.job.kind === "transcribe") {
      // lấy lời nói mới (và đoạn cắt + phụ đề phần mềm vừa tự tạo nếu dự án còn trắng)
      const j = await (await editorFetch("/api/project")).json();
      const fresh = (P().segments || []).length <= 1 && !(P().captions?.lines || []).length;
      S.transcript = j.transcript;
  try{S.ai.completionMode=(await api('/api/completion-policy')).effective.mode;}catch{S.ai.completionMode='review';}
      if (fresh) { S.project = j.project; S.revision=j.revision; recalc(); }
      renderTabs(); renderList(); renderInspector(); renderTimeline();
      await api("/api/build", "POST", P()); reloadPlayer();
      toast(`Đã nhận giọng: ${a.job.words} từ`);
    } else if (a?.job?.ok && a.job.kind === "install") { toast("Đã cài công cụ nhận giọng"); renderList(); }
    else if (a?.job?.ok === false) toast(a.job.error, true);
  }, 1500);
}

// Tab Cắt: mỗi hàng là 1 câu ngắn (các đoạn cùng nhóm g). Ô tích = giữ / bỏ cả câu.
// Bấm 1 chữ = cắt riêng chữ đó (gạch ngang) — dùng cho chỗ vấp, lặp từ; bấm lại để giữ.
// ===================== Thành phần có sẵn của mẫu edit (thẻ xem trước · bấm là chèn) =====================
S.presets = null;
const cardCache = new Map();
let cardSheet = null;
// 1 bảng CSS dùng chung cho mọi thẻ xem trước (shadow DOM)
function sharedSheet() {
  if (!cardSheet) { cardSheet = new CSSStyleSheet(); try { cardSheet.replaceSync(S.presets?.style || ""); } catch {} }
  return cardSheet;
}
async function loadPresets() {
  try { S.presets = await (await editorFetch("/api/presets")).json(); } catch { S.presets = null; }
  cardCache.clear(); cardSheet = null;
  if (S.presets?.fonts) for (const href of S.presets.fonts) if (!loadedFonts.has(href)) { loadedFonts.add(href); document.head.append(h("link", { rel: "stylesheet", href })); }
  if (S.tab === "texts" || S.tab === "blocks") renderList();
}
// Hiệu ứng nằm SAU người nói → cần lớp tách nền (camera.matte); chưa có thì ghi chú để lúc edit tách nền
const needsMatte = (x) => x?.layer === "behind" || x?.matte === true;
const mattePending = () => !P()?.camera?.matte && itemsOf("blocks").some((b) => !b.hidden && b.layer === "behind");
const matteTag = (x) => (needsMatte(x) ? h("span", { class: "matte-tag", title: "Hiệu ứng nằm sau người — video cần tách nền" }, "Sau người · cần tách nền") : null);
function usedComponentRows(list,items,q) {
  const matching=items.slice().sort((a,b)=>(a.item.at||0)-(b.item.at||0)).filter(({item,key})=>!q||labelOf(item,key).toLowerCase().includes(q));
  list.append(h('div',{class:'rows-title',style:'margin-top:0'},`Trong bản dựng · ${items.length}`));
  if(!matching.length)list.append(h('p',{class:'help'},q?'Không có thành phần đang dùng khớp tìm kiếm.':'Chưa có thành phần. Mở mẫu có sẵn hoặc thêm mới.'));
  for(const {item:it,key} of matching){
    const name=labelOf(it,key),kind=key==='texts'?(FX.find(f=>f[0]===(it.fx||'words'))?.[1]||'Chữ'):(it.group==='chu'?'Chữ đồ họa':it.layer==='behind'?'Sau người':'Đồ họa');
    list.append(h('div',{class:`cos-used-row ${it.hidden?'off':''}`},
      h('button',{class:'cos-used-pick','aria-label':`Chỉnh ${name}`,'aria-pressed':String(componentSelected(S,it,key)),title:name,onclick:()=>select(it,key)},
        h('span',{class:'name'},name),h('small',{},`${fmt(outStart(it))} · ${kind}`)),
      h('label',{},h('input',{type:'checkbox','aria-label':`Dùng ${name}`,checked:!it.hidden,onchange:e=>{snapshot();it.hidden=!e.target.checked;changed({inspector:true});}}),'Dùng')));
  }
}
const presetSectionOpen = new Map();
function presetSection(list, grp) {
  const q = $("#search").value.trim().toLowerCase();
  const items = (S.presets?.items || []).filter((x) => x.group === grp && (!q || `${x.name} ${x.desc || ""}`.toLowerCase().includes(q)));
  if (!items.length) return;
  const key=S.dir+':'+grp;
  const shelf=h('details',{class:'cos-preset-shelf'}),grid=h('div',{class:'cards cos-preset-grid'});
  shelf.open=!!q||(presetSectionOpen.get(key)??componentEntries(P(),S.tab).length===0);
  shelf.append(h('summary',{},`Mẫu có sẵn · ${items.length}`),h('p',{class:'help'},S.presets.template?.name||'Mẫu edit'),grid);
  shelf.addEventListener('toggle',()=>{
    if(!q)presetSectionOpen.set(key,shelf.open);
    if(shelf.open)requestAnimationFrame(()=>{
      for(const thumb of grid.querySelectorAll('.thumb.live')){const host=thumb.querySelector('.live-host');if(host?.shadowRoot)fitPreset(host,host.shadowRoot,thumb);}
    });
  });
  list.append(shelf);list=grid;
  for (const pr of items) {
    const cached = cardCache.get("p:" + pr.id);
    if (cached) { list.append(cached); continue; }
    const host = h("div", { class: "live-host" }), root = host.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [sharedSheet()];
    root.innerHTML = pr.body;
    const thumb = h("div", { class: "thumb live" }, host);
    requestAnimationFrame(() => fitPreset(host, root, thumb));
    if (needsMatte(pr)) thumb.append(matteTag(pr));
    const card = h("div", { class: "card preset", role:'button',tabindex:0,'aria-label':`Chèn mẫu ${pr.name}`,draggable: "true", title: "Kéo thả xuống timeline (hoặc bấm để chèn tại vị trí đang xem)", onclick: () => insertPreset(pr),
      onkeydown:e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();insertPreset(pr);}},
      ondragstart: (e) => { e.dataTransfer.setData("text/vek-preset", pr.id); e.dataTransfer.effectAllowed = "copy"; document.body.classList.add("dragging-preset"); },
      ondragend: () => { document.body.classList.remove("dragging-preset"); tlDropLine(null); } },
      thumb,
      h("div", { class: "name" }, pr.name),
      h("div", { class: "desc" }, pr.desc || ""));
    cardCache.set("p:" + pr.id, card);
    list.append(card);
  }
}
// Phóng ảnh xem trước vừa khít phần có nội dung (chữ, nhãn, đồ hoạ) thay vì cả khung 1080×1920
function fitPreset(host, root, thumb) {
  const tw = thumb.clientWidth, th = thumb.clientHeight;
  if (!tw) return;
  host.style.transform = "none";
  const base = host.getBoundingClientRect();
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const el of root.querySelectorAll(".blk-in *, .tx *")) {
    if (el.children.length && el.tagName !== "svg") continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    x0 = Math.min(x0, r.left - base.left); y0 = Math.min(y0, r.top - base.top); x1 = Math.max(x1, r.right - base.left); y1 = Math.max(y1, r.bottom - base.top);
  }
  if (x1 < x0) { host.style.transform = ""; return; }
  const pad = 60, w = x1 - x0 + pad * 2, hh = y1 - y0 + pad * 2, k = Math.min(tw / w, th / hh, 0.6);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  host.style.transform = `translate(${tw / 2 - cx * k}px, ${th / 2 - cy * k}px) scale(${k})`;
}
// ===================== Cảnh trám: kiểu hiển thị (thẻ xem trước) + file của người dùng =====================
const BROLL_STYLES = [
  { id: "noi-bo-goc", name: "Khung nổi bo góc", desc: "Nổi giữa khung, viền nhẹ", mode: "pip", frame: "", tIn: "zoom" },
  { id: "noi-phat-sang", name: "Khung nổi phát sáng", desc: "Viền màu thương hiệu phát sáng", mode: "pip", frame: "glow", tIn: "zoom" },
  { id: "the-nghieng", name: "Thẻ nghiêng", desc: "Viền trắng dày, nghiêng nhẹ", mode: "pip", frame: "tilt", tIn: "slide" },
  { id: "dien-thoai", name: "Màn hình điện thoại", desc: "Đặt trong khung điện thoại — hợp ảnh chụp màn hình dọc", mode: "pip", frame: "phone", tIn: "slide" },
  { id: "polaroid", name: "Ảnh polaroid", desc: "Khung ảnh trắng, nghiêng nhẹ", mode: "pip", frame: "polaroid", tIn: "zoom" },
  { id: "chia-doi", name: "Chia đôi màn hình", desc: "Cảnh trám trên, người nói dưới", mode: "split", frame: "", tIn: "slide" },
  { id: "toan-man", name: "Toàn màn hình", desc: "Phủ kín khung hình", mode: "full", frame: "", tIn: "fade" },
  { id: "nen-mo", name: "Clip ngang nền mờ", desc: "Clip ngang ở dải giữa, trên dưới là chính clip làm mờ", mode: "blurfill", frame: "", tIn: "none" },
];
S.brollStyle = "noi-phat-sang";
const isMediaFile = (m) => /\.(mp4|mov|webm|m4v|png|jpe?g|webp)$/i.test(m) && m !== P().source?.video && !/matte|\.tmp-|^work\/|^renders\/|^assets\//i.test(m);
const mediaThumb = (m) => (/\.(png|jpe?g|webp)$/i.test(m) ? `/p/${m}` : thumbUrl(m, 0.5));
function applyBStyle(it, st) {
  it.mode = st.mode; it.tIn = st.tIn;
  if (st.frame) it.frame = st.frame; else delete it.frame;
  if (st.cam) it.cam = { ...st.cam }; else delete it.cam; // kiểu của mẫu dời người (vd thu về góc dưới) trong lúc cảnh trám hiện
  delete it.x; delete it.y; delete it.scale;
}
function insertBroll(src, outT = S.time) {
  const list = itemsOf("brolls"), st = BROLL_STYLES.find((x) => x.id === S.brollStyle) || BROLL_STYLES[0];
  const it = { id: uid("b", list), src, at: round3(S.tm.outToSrc(clamp(outT, 0, S.tm.total))), dur: 3 };
  applyBStyle(it, st);
  snapshot(); list.push(it);
  S.tab = "brolls"; S.selId = it.id;
  renderTabs(); changed({ inspector: true }); renderList();
  toast(`Đã thêm cảnh trám (${st.name}).`);
}
async function openPlateReview(){
  if(!S.editorReady||S.dirty)return toast('Lưu bản dựng trước khi kiểm tra bản che.',true);
  const project=P(),dir=S.dir,revision=S.revision;
  const validate=()=>{if(P()!==project||S.dir!==dir||S.revision!==revision||S.dirty)throw new Error('Bản dựng đã đổi; Lưu rồi kiểm tra lại.');};
  const mediaUrl=src=>'/api/primary-media-preview?'+new URLSearchParams({src,dir,revision,workspaceId:project.workspaceId||'default'});
  const {openPlateReviewDialog}=await import('/ui/contentos-plate-review.js');await openPlateReviewDialog({request:editorFetch,validate,mediaUrl});
}
async function editColorNormalization(target,group){
 if(!S.editorReady||S.dirty)return toast('Lưu bản dựng trước khi chuẩn hóa màu.',true);
 const project=P(),dir=S.dir,revision=S.revision,original=JSON.stringify(target);
 const validate=()=>{if(P()!==project||S.dir!==dir||S.revision!==revision||S.dirty||!project[group]?.includes(target)||JSON.stringify(target)!==original)throw new Error('Bản dựng đã đổi; Lưu rồi mở lại.');};
 const mediaUrl=src=>'/api/primary-media-preview?'+new URLSearchParams({src,dir,revision,workspaceId:project.workspaceId||'default'});
 const {openColorNormalization}=await import('/ui/contentos-color-normalization.js');await openColorNormalization({kind:group,id:target.id,request:editorFetch,validate,mediaUrl,onApply:result=>{validate();const entries=result.results||[{kind:group,id:target.id,result}];let next=project;for(const entry of entries)next=applyColorNormalization(next,entry.kind,entry.id,entry.result);snapshot();S.project=next;for(const entry of entries)if(!S.media.includes(entry.result.path))S.media.push(entry.result.path);changed({inspector:true});renderList();toast('Đã thay bản Rec.709; chỉnh sáng/màu tiếp rồi Lưu.');}});
}
async function editShotColor(target,group){
 if(!S.editorReady||S.dirty)return toast('Lưu bản dựng trước khi phân tích màu.',true);
 const project=P(),dir=S.dir,revision=S.revision,original=JSON.stringify(target);
 const validate=()=>{if(P()!==project||S.dir!==dir||S.revision!==revision||S.dirty||!project[group]?.includes(target)||JSON.stringify(target)!==original)throw new Error('Bản dựng đã đổi. Lưu rồi phân tích lại.');};
 const {openShotColor}=await import('/ui/contentos-shot-color.js');
 await openShotColor({kind:group,id:target.id,request:editorFetch,validate,onApply:color=>{validate();snapshot();target.color=structuredClone(color);changed({inspector:true});renderList();toast('Đã thay màu riêng bằng gợi ý. Kiểm preview rồi Lưu; có thể Hoàn tác.');},onNormalize:()=>editColorNormalization(target,group).catch(error=>toast(error.message,true))});
}
async function editPlatePrivacy(target,group='brolls'){
  if(!S.editorReady||S.dirty)return toast('Lưu bản dựng và đợi editor chuẩn bị xong trước khi che biển số.',true);
  const project=P(),dir=S.dir,revision=S.revision,original=JSON.stringify(target);
  const validate=()=>{if(P()!==project||S.dir!==dir||S.revision!==revision||S.dirty||!project[group]?.includes(target)||JSON.stringify(target)!==original)throw new Error('Bản dựng đã đổi. Lưu rồi mở lại công cụ che biển.');};
  const mediaUrl=src=>'/api/primary-media-preview?'+new URLSearchParams({src,dir,revision,workspaceId:project.workspaceId||'default'});
  let selected;try{if(group==='segments')selected=primaryPrivacyRequest(project,target.id);}catch(error){return toast(error.message,true);}
  const {openPlatePrivacy}=await import('/ui/contentos-plate-privacy.js');
  await openPlatePrivacy({item:selected?{...target,src:selected.src,mediaStart:selected.from}:target,kind:group,sourceUrl:mediaUrl(selected?.src??target.src),resultUrl:mediaUrl,request:editorFetch,validate,onReplace:result=>{
    if(group==='segments'){validate();const next=applyPrimaryPrivacy(project,target.id,result);snapshot();S.project=next;if(!S.media.includes(result.path))S.media.push(result.path);changed({inspector:true});renderList();toast('Đã thay nguồn đoạn Video bằng bản che. Kiểm toàn đoạn rồi Lưu; có thể Hoàn tác.');return;}
    validate();const next=applyBrollPrivacy(project,target.id,result);snapshot();S.project=next;
    if(!S.media.includes(result.path))S.media.push(result.path);changed({inspector:true});renderList();toast('Đã thay bản che. Kiểm toàn đoạn và bấm Lưu; có thể Hoàn tác.');
  }});
}
async function editRemotionBroll(target){
  if(!S.editorReady||S.dirty)return toast('Lưu bản dựng và đợi editor chuẩn bị xong trước khi sửa cảnh Remotion.',true);
  const project=P(),dir=S.dir,revision=S.revision,source=target.src;
  const validate=()=>{if(P()!==project||S.dir!==dir||S.revision!==revision||S.dirty||!project[group]?.includes(target)||target.src!==source)throw new Error('Bản dựng đã đổi. Lưu rồi mở lại công cụ sửa cảnh.');};
  const {openRemotionScene,sceneFromRemotionProps}=await import('/ui/contentos-remotion.js');
  await openRemotionScene({request:editorFetch,validate,initialScene:sceneFromRemotionProps(target.remotion.props),onAdd:result=>{
    validate();snapshot();target.src=result.path;target.dur=result.props.durationInFrames/result.props.fps;delete target.mediaStart;
    target.remotion={composition:'ContentOSTitleCard',props:result.props,sha256:result.sha256};
    if(!S.media.includes(result.path))S.media.push(result.path);changed({inspector:true});renderList();
    toast('Đã thay cảnh Remotion. Bấm Lưu; có thể Hoàn tác.');
  }});
}
function openBrollAssembly(){
  const project=P(),projectDir=S.dir,base=JSON.stringify(project),media=S.media.filter(m=>isMediaFile(m)&&m!==project.source?.video&&!m.startsWith('assets/sfx/'));
  const dialog=h('dialog',{'aria-label':'Ráp cảnh trám theo thời lượng',style:'width:min(800px,94vw);max-height:88vh;overflow:auto'}),status=h('p',{role:'status'}),result=h('pre',{style:'white-space:pre-wrap;overflow-wrap:anywhere'});
  const seconds=h('input',{type:'number',min:1,max:30,step:0.5,value:4,'aria-label':'Số giây mỗi cảnh'}),repeat=h('input',{type:'checkbox','aria-label':'Lặp lại tư liệu'});
  const rows=h('div'),apply=h('button',{disabled:true},'Áp dụng vào timeline');let plan=null,generation=0;
  const invalidate=()=>{generation++;plan=null;apply.disabled=true;result.textContent='';};
  for(const src of media){const check=h('input',{type:'checkbox',value:src,'data-assembly-source':src});const row=h('div',{style:'display:flex;gap:8px;align-items:center;margin:6px 0'},h('label',{},check,src.split('/').pop()));
    for(const [label,offset] of [['↑',-1],['↓',1]])row.append(h('button',{type:'button','aria-label':(offset<0?'Đưa lên: ':'Đưa xuống: ')+src,onclick:()=>{const sibling=offset<0?row.previousElementSibling:row.nextElementSibling;if(sibling){offset<0?rows.insertBefore(row,sibling):rows.insertBefore(sibling,row);invalidate();}}},label));rows.append(row);
  }
  dialog.append(h('h2',{},'Ráp cảnh trám theo thời lượng'),h('p',{},'Ráp toàn màn hình theo thứ tự đã chọn; tiếng cảnh trám tắt. Kiểm tra độ phù hợp nội dung và quyền sử dụng. Không thay các cảnh trám đang hiện trên timeline.'),h('label',{},'Độ dài tối đa mỗi cảnh (giây)',seconds),h('label',{},repeat,' Lặp danh sách nếu thiếu thời lượng'),rows);
  dialog.addEventListener('input',invalidate);
  dialog.append(h('button',{onclick:async event=>{invalidate();const token=generation,selected=[...rows.querySelectorAll('input:checked')].map(e=>e.value);event.target.disabled=true;status.textContent='Đang đọc thời lượng tư liệu…';try{
    const info=await api('/api/broll-media-info','POST',{selected});if(!dialog.isConnected||token!==generation)return;
    if(P()!==project||S.dir!==projectDir||JSON.stringify(P())!==base)throw new Error('Bản dựng đã đổi. Đóng và mở lại công cụ.');
    plan=planBrollAssembly(project,info.assets,{shotSeconds:Number(seconds.value),repeat:repeat.checked});
    result.textContent=plan.clips.map((c,i)=>`${i+1}. ${c.outputStart.toFixed(2)}s · ${c.dur.toFixed(2)}s · ${c.src.split('/').pop()}`).join('\n');
    status.textContent=`${plan.clips.length} cảnh · phủ ${plan.covered.toFixed(2)}/${plan.total.toFixed(2)} giây · thiếu ${plan.uncovered.toFixed(2)} giây · lặp thêm ${plan.reused} lượt. Chưa thay đổi bản dựng.`;apply.disabled=!plan.clips.length;
  }catch(error){if(dialog.isConnected&&token===generation)status.textContent=error.message;}finally{event.target.disabled=false;}}},'Xem cách ráp'),status,result,apply,h('button',{onclick:()=>dialog.close()},'Đóng'));
  apply.onclick=()=>{try{if(!plan||P()!==project||S.dir!==projectDir||JSON.stringify(P())!==base)throw new Error('Bản dựng đã đổi. Xem lại cách ráp trước khi áp dụng.');
    snapshot();project.brolls.push(...plan.clips.map(({outputStart,...clip})=>({...clip,id:'b-'+crypto.randomUUID()})));S.selId=null;changed({inspector:true});renderList();dialog.close();toast('Đã ráp cảnh trám. Kiểm tra preview và bấm Lưu; có thể Hoàn tác.');
  }catch(error){status.textContent=error.message;apply.disabled=true;}};
  dialog.addEventListener('close',()=>{generation++;dialog.remove();},{once:true});document.body.append(dialog);dialog.showModal();
}
// Tab Cảnh trám: chưa chọn → danh sách cảnh trám (file) · bấm 1 cảnh → các lựa chọn hiệu ứng của chính cảnh đó
const IN_FX = [["zoom", "Phóng ra"], ["slide", "Trượt lên"], ["fade", "Mờ dần"], ["wipe", "Quét ngang"], ["drop", "Rơi xuống"], ["none", "Không hiệu ứng"]];
const isImg = (m) => /\.(png|jpe?g|webp)$/i.test(m || "");
function brollPanel(list) {
  const sel = selected(), media = S.media.filter(isMediaFile), face = thumbUrl(P().source?.video, 2);
  const title = (t, extra = "") => list.append(h("div", { class: "rows-title", style: "grid-column:1/-1;" + extra }, t));
  const drag = (type, val) => ({
    draggable: "true",
    ondragstart: (e) => { e.dataTransfer.setData(type, val); document.body.classList.add("dragging-preset"); },
    ondragend: () => { document.body.classList.remove("dragging-preset"); tlDropLine(null); },
  });
  if (!sel) {
    title("Cảnh trám · bấm để chọn hiệu ứng · kéo thả xuống timeline để thêm", "margin-top:0");
    list.append(h('button',{class:'outline small',style:'grid-column:1/-1',onclick:openBrollAssembly},'Ráp cảnh trám theo thời lượng'));
    list.append(h('button',{class:'outline small',style:'grid-column:1/-1',disabled:!S.editorReady,onclick:async()=>{
      if(!S.editorReady)return toast('Đợi editor chuẩn bị bản xem trước.',true);
      if(S.dirty)return toast('Lưu bản dựng trước khi tạo cảnh Remotion.',true);
      const project=P(),dir=S.dir,revision=S.revision,validate=()=>{if(P()!==project||S.dir!==dir)throw new Error('Dự án đã đổi. Mở lại công cụ tạo cảnh.');if(S.revision!==revision)throw new Error('Phiên bản đã đổi. Mở lại công cụ tạo cảnh.');if(S.dirty)throw new Error('Có chỉnh sửa chưa lưu. Lưu bản dựng rồi mở lại công cụ tạo cảnh.');};
      const {openRemotionScene}=await import('/ui/contentos-remotion.js');await openRemotionScene({request:editorFetch,validate,onAdd:result=>{validate();snapshot();const it={id:'b-'+crypto.randomUUID(),src:result.path,at:round3(S.tm.outToSrc(S.time)),dur:result.props.durationInFrames/result.props.fps,mode:'full',remotion:{composition:'ContentOSTitleCard',props:result.props,sha256:result.sha256}};project.brolls=project.brolls||[];project.brolls.push(it);if(!S.media.includes(result.path))S.media.push(result.path);S.selId=it.id;changed({inspector:true});renderList();toast('Đã thêm cảnh Remotion. Kiểm tra preview và bấm Lưu; có thể Hoàn tác.');}});
    }},'Cảnh chữ chuyển động · Remotion'));

    if (!media.length) list.append(h("div", { class: "empty" }, "Chưa có ảnh / video — thêm từ máy tính hoặc từ kho Drive."));
    for (const m of media) {
      const used = itemsOf("brolls").filter((x) => x.src === m).sort((x, y) => outStart(x) - outStart(y));
      list.append(h("div", { class: "card", title: "Bấm để chọn hiệu ứng cho cảnh trám này", ...drag("text/vek-media", m),
        onclick: () => {
          if (used[0]) { S.selId = used[0].id; renderList(); renderInspector(); renderTimeline(); seek(outStart(used[0]) + 0.5); }
          else insertBroll(m);
        } },
        h("div", { class: "thumb", style: `background-image:url("${mediaThumb(m)}");background-size:cover;background-position:50% 0` }),
        h("div", { class: "name" }, m.split("/").pop()),
        h("div", { class: "desc" }, (isImg(m) ? "Ảnh" : "Video") + (used.length ? ` · đang dùng ${used.length} lần` : " · chưa dùng"))));
    }
    return;
  }
  // Đã chọn 1 cảnh trám: hiệu ứng của chính cảnh đó
  list.append(h("div", { class: "bsel", style: "grid-column:1/-1" },
    h("button", { class: "ghost small", onclick: () => { S.selId = null; renderList(); renderInspector(); renderTimeline(); updateSelection(); } }, "‹ Tất cả cảnh trám"),
    h("div", { class: "bsel-thumb", style: `background-image:url("${mediaThumb(sel.src)}")` }),
    h("div", {}, h("b", {}, (sel.src || "").split("/").pop()), h("div", { class: "muted" }, `hiện lúc ${fmt(outStart(sel))} · ${(Number(sel.dur) || 0).toFixed(1)}s`))));
  if(sel.remotion?.composition==='ContentOSTitleCard'&&sel.remotion.props)list.append(h('button',{class:'outline small',style:'grid-column:1/-1',onclick:()=>editRemotionBroll(sel)},'Sửa nội dung cảnh · Remotion'));
  const tplStyles = (S.presets?.items || []).filter((x) => x.group === "canhtram");
  title("Kiểu hiển thị");
  const sample = isImg(sel.src) ? mediaThumb(sel.src) : thumbUrl(sel.src, (Number(sel.mediaStart) || 0) + 0.5);
  for (const st of [...tplStyles, ...BROLL_STYLES]) {
    const on = (sel.mode || "split") === st.mode && (sel.frame || "") === (st.frame || "");
    const host = h("div", { class: "live-host" }), root = host.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [sharedSheet()];
    root.innerHTML = `<div id="root"><img src="${face}" style="position:absolute;inset:0;width:1080px;height:1920px;object-fit:cover"><img class="broll-img ${st.mode === "full" ? "" : st.mode} ${st.frame ? "fr-" + st.frame : ""}" src="${sample}" style="object-position:50% 0"></div>`;
    list.append(h("div", { class: `card preset ${on ? "on" : ""}`, title: "Bấm để áp kiểu này", ...drag("text/vek-bstyle", st.id),
      onclick: () => { snapshot(); applyBStyle(sel, st); if (!st.group) S.brollStyle = st.id; changed({ inspector: true }); renderList(); seek(outStart(sel) + 0.5); } },
      h("div", { class: "thumb live" }, host), h("div", { class: "name" }, st.name), h("div", { class: "desc" }, st.group ? `Của mẫu ${S.presets?.template?.name || ""}` : st.desc)));
  }
  list.append(h("button", { class: "outline small kho-save", style: "grid-column:1/-1;justify-self:start", onclick: () => saveToKho(sel, "brolls") }, "⭐ Lưu kiểu cảnh trám này vào kho"));
  title("Hiệu ứng xuất hiện");
  list.append(h("div", { class: "chips", style: "grid-column:1/-1" }, IN_FX.map(([k, l]) => h("button", {
    class: `chip ${(sel.tIn || "none") === k ? "on" : ""}`,
    onclick: () => { snapshot(); sel.tIn = k; changed({ inspector: true }); renderList(); seek(Math.max(0, outStart(sel) - 0.3)); },
  }, l))));
}

// ===================== Kho hiệu ứng (người dùng tự lưu, dùng chung mọi dự án) =====================
S.kho = null;
let khoSheet = null;
async function loadKho() {
  try { S.kho = await (await editorFetch("/api/kho")).json(); } catch { S.kho = null; }
  khoSheet = null;
  if (["texts", "blocks", "brolls"].includes(S.tab)) renderList();
}
// Lưu 1 mục đang chọn vào kho: chữ / đồ hoạ (khối) hoặc kiểu cảnh trám
async function saveToKho(it, kind) {
  const name = prompt("Đặt tên cho hiệu ứng này:", it.name || (kind === "brolls" ? "Cảnh trám của tôi" : "Hiệu ứng của tôi"));
  if (name == null) return;
  let item;
  if (kind === "blocks") {
    // mốc chuyển động theo lời nói (cue) → đổi sang giây tính từ lúc khối hiện, để dùng lại ở video khác
    const o0 = outStart(it);
    const anim = (it.anim || []).map(({ cue, ...a }) => (cue != null && it.cues?.[cue] != null ? { ...a, at: round3(S.tm.srcToOut(it.cues[cue]) - o0) } : a));
    item = { kind, group: it.group === "chu" ? "chu" : "dohoa", name: name.trim() || it.name, dur: Number(it.dur) || 3,
      html: it.html, css: it.css || "", anim, fields: it.fields || [], sfx: it.sfx, wordSfx: it.wordSfx, wordSfxVol: it.wordSfxVol,
      layer: it.layer, matte: it.layer === "behind" || undefined, fx: it.fx, out: it.out, x: it.x, y: it.y, scale: it.scale, tplCss: P().brand?.css || "", fromId: P().template?.id, from: P().template?.name };
  } else {
    item = { kind, name: name.trim() || "Cảnh trám", mode: it.mode || "split", frame: it.frame || "", tIn: it.tIn || "none",
      x: it.x, y: it.y, scale: it.scale, pos: it.pos, dur: Number(it.dur) || 3, fromId: P().template?.id, from: P().template?.name };
  }
  try { await api("/api/kho", "POST", item); toast(`Đã lưu “${item.name}” vào Kho hiệu ứng.`); loadKho(); }
  catch (e) { toast("Không lưu được: " + e.message, true); }
}
function applyKhoBroll(b, st) {
  b.mode = st.mode; b.tIn = st.tIn;
  if (st.frame) b.frame = st.frame; else delete b.frame;
  for (const k of ["x", "y", "scale", "pos"]) { if (st[k] != null) b[k] = st[k]; else delete b[k]; }
}
const brollAt = (t) => itemsOf("brolls").find((b) => !b.hidden && t >= outStart(b) - 0.05 && t <= outStart(b) + (Number(b.dur) || 0));
// Tab "Kho của tôi": toàn bộ mục đã lưu theo loại · trống thì hướng dẫn thêm (màn hình ngoài → Kho hiệu ứng của tôi)
function khoTab(list) {
  const which = S.tab === "kho-chu" ? "chu" : S.tab === "kho-dohoa" ? "dohoa" : "brolls";
  const before = list.children.length;
  khoSection(list, which);
  list.querySelector(".rows-title")?.remove();
  if (list.children.length === before) list.append(h("div", { class: "empty", style: "grid-column:1/-1;line-height:1.6" },
    "Kho còn trống. Thêm từ mẫu edit ở màn hình ngoài (Kho hiệu ứng của tôi → ＋ Thêm từ mẫu edit), hoặc chọn một mục trên timeline rồi bấm “⭐ Lưu vào kho”."));
  list.append(h("a", { class: "kho-manage", href: "/home#kho", target: "_blank", style: "grid-column:1/-1" }, "Quản lý kho / thêm từ mẫu edit ↗"));
}
// Thẻ "Kho của tôi" — chỉ dùng trong tab Kho của tôi (quản lý kho ở màn hình ngoài: Kho hiệu ứng của tôi)
function khoSection(list, which, target) {
  const want = which === "chu" ? (x) => (x.kind === "blocks" && x.group === "chu") || x.kind === "texts"
    : which === "dohoa" ? (x) => x.kind === "blocks" && x.group !== "chu" : (x) => x.kind === "brolls";
  const items = (S.kho?.items || []).filter(want);
  if (!items.length) return;
  list.append(h("div", { class: "rows-title", style: "grid-column:1/-1;margin-top:0" }, "Kho của tôi"));
  if (!khoSheet && S.kho?.style) { khoSheet = new CSSStyleSheet(); try { khoSheet.replaceSync(S.kho.style); } catch {} }
  const face = thumbUrl(P().source?.video, 2), sample = target?.src ? (isImg(target.src) ? mediaThumb(target.src) : thumbUrl(target.src, 0.5)) : (S.media.filter(isMediaFile).find(isImg) ? mediaThumb(S.media.filter(isMediaFile).find(isImg)) : "");
  for (const it of items) {
    const host = h("div", { class: "live-host" }), root = host.attachShadow({ mode: "open" });
    if (it.kind !== "brolls") { root.adoptedStyleSheets = khoSheet ? [khoSheet] : []; root.innerHTML = it.body || ""; }
    else {
      root.adoptedStyleSheets = [sharedSheet()];
      const cls = `broll-img ${it.mode === "full" ? "" : it.mode} ${it.frame ? "fr-" + it.frame : ""}`;
      const img = sample ? `<img class="${cls}" src="${sample}" style="object-position:50% 0">` : `<div class="${cls}" style="background:linear-gradient(160deg,#3b82f6,#1e293b);height:520px"></div>`;
      root.innerHTML = `<div id="root"><img src="${face}" style="position:absolute;inset:0;width:1080px;height:1920px;object-fit:cover">${img}</div>`;
    }
    const thumb = h("div", { class: "thumb live" }, host, matteTag(it));
    if (it.kind !== "brolls") requestAnimationFrame(() => fitPreset(host, root, thumb));
    list.append(h("div", { class: "card preset kho", draggable: "true",
      title: it.kind !== "brolls" ? "Kéo thả xuống timeline (hoặc bấm để chèn tại vị trí đang xem)" : "Bấm để áp kiểu này cho cảnh trám đang chọn",
      onclick: () => {
        if (it.kind !== "brolls") return insertPreset(it);
        const b = target || brollAt(S.time);
        if (!b) return toast("Chọn một cảnh trám trước, hoặc kéo thả thẻ này lên cảnh trám trên timeline.", true);
        snapshot(); applyKhoBroll(b, it); changed({ inspector: true }); renderList(); toast(`Đã áp “${it.name}”.`);
      },
      ondragstart: (e) => { e.dataTransfer.setData("text/vek-kho", it.id); document.body.classList.add("dragging-preset"); },
      ondragend: () => { document.body.classList.remove("dragging-preset"); tlDropLine(null); } },
      thumb, h("div", { class: "name" }, it.name), h("div", { class: "desc" }, "Của tôi")));
  }
}

function insertPreset(pr, outT = S.time) {
  if (pr.kind === "texts") {
    const texts = itemsOf("texts"), t = { id: uid("t", texts), at: round3(S.tm.outToSrc(clamp(outT, 0, S.tm.total))), dur: pr.dur || 2.5, ...structuredClone(pr.text || {}) };
    for (const k of Object.keys(t)) if (t[k] == null) delete t[k];
    snapshot(); texts.push(t);
    if (S.tab !== "texts") { S.tab = "texts"; renderTabs(); }
    S.selKind = null; S.selId = t.id; S.part = null;
    changed({ inspector: true }); renderList();
    return toast(`Đã chèn “${pr.name}” — sửa chữ ở bảng bên dưới.`);
  }
  const blocks = itemsOf("blocks"), ref = blocks.find((x) => x.wordSfx && x.wordSfx !== "none");
  const b = { id: uid("k", blocks), name: pr.name, at: round3(S.tm.outToSrc(clamp(outT, 0, S.tm.total))), dur: pr.dur || 3, layer: "front", fx: "none", out: "fade",
    sfx: pr.sfx || "none", html: pr.html, css: pr.css || "", anim: structuredClone(pr.anim || []), cues: [], fields: structuredClone(pr.fields || []), preset: pr.id, group: pr.group };
  if (ref) { b.wordSfx = ref.wordSfx; b.wordSfxVol = ref.wordSfxVol; }
  for (const k of ["x", "y", "scale", "layer", "fx", "out", "pan", "panDur", "cues", "wordSfx", "wordSfxVol", "cam"]) if (pr[k] != null) b[k] = structuredClone(pr[k]);
  snapshot();
  blocks.push(b);
  // thẻ có lỗ người (khung tem, thẻ giới thiệu…): thêm luôn zoom "Khung giữa" đúng toạ độ lỗ, cùng thời điểm
  if (pr.zoom) { const zs = itemsOf("zooms"); zs.push({ id: uid("z", zs), at: b.at, dur: b.dur, ...structuredClone(pr.zoom) }); }
  focusItem(b, "blocks"); S.part = null;
  if (needsMatte(b) && !P().camera?.matte) {
    P().notes = { ...(P().notes || {}), needMatte: true }; // AI / lần dựng sau đọc ghi chú này để tách nền
    renderTabs(); changed({ inspector: true }); renderList();
    return toast(`Đã chèn “${pr.name}” — hiệu ứng nằm SAU người: video cần tách nền (đã ghi chú, AI sẽ tách nền khi edit).`, true);
  }
  renderTabs(); changed({ inspector: true }); renderList();
  toast(`Đã chèn “${pr.name}” — sửa chữ ở bảng bên dưới.`);
}
// Sửa chữ của 1 thành phần (fields): thay nội dung phần tử trong html; chữ sáng dần thì dựng lại mốc sáng từng từ
function fieldValue(b, f) {
  const d = new DOMParser().parseFromString(`<body>${b.html || ""}</body>`, "text/html");
  return d.body.querySelector(f.sel)?.textContent.replace(/\s+/g, " ").trim() || "";
}
// Các dòng chữ trong khối (phần tử có chữ, không chứa khối con — hoặc chỉ chứa các từ .w)
function autoTextFields(b) {
  const d = new DOMParser().parseFromString(`<body>${b.html || ""}</body>`, "text/html"), out = [];
  [...d.body.querySelectorAll("*")].forEach((el, i) => {
    if (el.closest("svg") || el.parentElement?.classList.contains("w") || el.classList.contains("w")) return;
    const kids = [...el.children], words = kids.length > 0 && kids.every((c) => c.classList.contains("w"));
    if (kids.length && !words) return;
    const text = el.textContent.replace(/\s+/g, " ").trim();
    if (text && text.length < 160) out.push({ i, text, words });
  });
  return out;
}
function setAutoText(b, i, value, words) {
  const d = new DOMParser().parseFromString(`<body>${b.html || ""}</body>`, "text/html"), el = d.body.querySelectorAll("*")[i];
  if (!el) return;
  if (words) el.innerHTML = value.trim().split(/\s+/).filter(Boolean).map((w) => `<span class="w">${esc(w)}</span>`).join(" ");
  else el.textContent = value;
  // số chạy: dừng ở số vừa sửa
  const so = Number(String(value).replace(/[.,\s]/g, ""));
  if (!words && value.trim() && Number.isFinite(so)) for (const a of b.anim || []) if (a.count && el.matches(a.sel)) a.count[1] = so;
  b.html = d.body.innerHTML;
}
function setFieldValue(b, f, value) {
  const d = new DOMParser().parseFromString(`<body>${b.html || ""}</body>`, "text/html"), el = d.body.querySelector(f.sel);
  if (!el) return;
  const ws = value.trim().split(/\s+/).filter(Boolean);
  if (!f.words) { el.textContent = value; b.html = d.body.innerHTML; return; }
  el.innerHTML = ws.map((w) => `<span class="w">${esc(w)}</span>`).join(" ");
  b.html = d.body.innerHTML;
  const pre = `${f.sel} .w:nth-child(`, old = (b.anim || []).filter((a) => a.sel?.startsWith(pre));
  const ts = old.map((a) => (a.cue != null ? (b.cues?.[a.cue] ?? 0) - (b.at || 0) : Number(a.at) || 0));
  const t0 = ts.length ? Math.min(...ts) : 0.1, step = ts.length > 1 ? (Math.max(...ts) - t0) / (ts.length - 1) : 0.22;
  b.anim = (b.anim || []).filter((a) => !a.sel?.startsWith(pre));
  ws.forEach((_, k) => b.anim.push({ sel: `${pre}${k + 1})`, to: { opacity: 1 }, at: round3(t0 + k * step), dur: 0.08 }));
}

// Tốc độ cả video (project.speed) — đoạn nào đặt tốc độ riêng thì theo đoạn đó
function speedAll() {
  const el = h("select", {}, SPEEDS.map(([v, l]) => h("option", { value: v, selected: String(P().speed ?? 1) === v }, l)));
  el.onchange = () => { snapshot(); if (el.value === "1") delete P().speed; else P().speed = Number(el.value); changed({ inspector: true }); renderList(); };
  return el;
}
function renderSegmentRows(list, items, q) {
  list.append(h("div", { class: "field", style: "padding:4px 2px 8px" }, h("label", {}, "Tốc độ cả video"), speedAll()));
  const ws = transcriptWords();
  if (!ws.length) list.append(asrBox());
  const groups = [];
  for (const it of items.slice().sort((a, b) => a.in - b.in)) {
    const key = it.g || it.id, last = groups[groups.length - 1];
    if (last && last.key === key) last.segs.push(it); else groups.push({ key, segs: [it] });
  }
  for (const g of groups) {
    const a = g.segs[0].in, b = g.segs[g.segs.length - 1].out;
    const gw = ws.filter((w) => (w.s + w.e) / 2 >= a && (w.s + w.e) / 2 < b);
    const text = gw.length ? gw.map((w) => w.w).join(" ") : g.segs.map((x) => x.text).filter(Boolean).join(" ");
    if (q && !text.toLowerCase().includes(q)) continue;
    const kept = g.segs.some((x) => x.keep !== false), all = g.segs.every((x) => x.keep !== false);
    const on = g.segs.some((x) => x.id === S.selId);
    const tx = h("span", { class: "tx" });
    if (gw.length) gw.forEach((w) => {
      const wk = S.tm.isKept((w.s + w.e) / 2);
      tx.append(h("span", { class: `tw ${wk ? "" : "cut"}`, title: wk ? "Bấm để cắt chữ này (vấp / lặp)" : "Bấm để giữ lại chữ này",
        onclick: (e) => {
          e.stopPropagation();
          const [x, y] = wordRangeTimes(w.i, w.i);
          snapshot(); setRange(x, y, !wk); S.selId = null;
          changed({ inspector: true }); renderList();
          if (!wk) seek(S.tm.srcToOut(w.s) + 0.01);
        } }, w.w), " ");
    });
    else tx.append(text);
    list.append(h("div", { class: `seg ${kept ? "" : "cut"} ${on ? "on" : ""}`, onclick: () => select(g.segs.find((x) => x.keep !== false) || g.segs[0]) },
      h("input", { type: "checkbox", checked: kept, title: kept ? "Bỏ chọn để cắt cả câu" : "Chọn để giữ lại cả câu",
        onclick: (e) => e.stopPropagation(),
        onchange: (e) => { snapshot(); g.segs.forEach((x) => (x.keep = e.target.checked)); mergeSegs(); changed({ inspector: true }); renderList(); } }),
      h("span", { class: "tc" }, `${fmt(a)} – ${fmt(b)}`),
      tx,
      kept ? (all ? h("span") : h("span", { class: "tag soft" }, "đã sửa")) : h("span", { class: "tag" }, "đã cắt")));
  }
}

// Kéo mép clip trên track Video: nới / thu đoạn lời nói (giây gốc).
function sourceTrimInput(segment, side) {
  const key=side==='l'?'in':'out';
  const input=h('input',{type:'number',step:.05,value:segment[key]});
  input.addEventListener('change',()=>{
    const value=Number(input.value);
    if(!input.value.trim()||!Number.isFinite(value)){input.value=segment[key];return;}
    snapshot();trimSeg(segment.id,side,value);changed({inspector:true});renderList();
  });
  return input;
}
function trimSeg(id, side, t) {
  const segs = itemsOf("segments").sort((a, b) => a.in - b.in);
  const i = segs.findIndex((x) => x.id === id);
  if (i < 0) return;
  const s = segs[i], dur = Number(P().source?.duration) || s.out;
  if (s.src) {
    trimSourceSegment(segs,id,side,t,uid('s',segs),P().speed);
    return;
  }
  if (side === "r") {
    const n = segs[i + 1];
    t = clamp(t, s.in + 0.2, n ? (n.keep !== false ? n.in : n.out - 0.05) : dur);
    if (t > s.out && n && n.keep === false) { n.in = round3(t); if (n.out - n.in < 0.05) segs.splice(i + 1, 1); }
    else if (t < s.out) {
      if (n && n.keep === false && Math.abs(n.in - s.out) < 0.002) n.in = round3(t);
      else segs.splice(i + 1, 0, { id: uid("s", segs), in: round3(t), out: s.out, keep: false, text: "" });
    }
    s.out = round3(t);
  } else {
    const p = segs[i - 1];
    t = clamp(t, p ? (p.keep !== false ? p.out : p.in + 0.05) : 0, s.out - 0.2);
    if (t < s.in && p && p.keep === false) { p.out = round3(t); if (p.out - p.in < 0.05) segs.splice(i - 1, 1); }
    else if (t > s.in) {
      if (p && p.keep === false && Math.abs(p.out - s.in) < 0.002) p.out = round3(t);
      else segs.splice(i, 0, { id: uid("s", segs), in: s.in, out: round3(t), keep: false, text: "" });
    }
    shiftSegmentZoom(s,round3(t)-s.in,P().speed);
    s.in = round3(t);
  }
  mergeSegs();
}

// Cảnh trám từ kho: link Google Drive người dùng đã lưu (màn hình chính → Kho hiệu ứng → Cảnh trám)
async function brollFromKho() {
  document.querySelector(".exp-pop")?.remove();
  let links = [];
  try { links = (await api("/api/kho/links")).links || []; } catch {}
  const pop = h("div", { class: "exp-pop" }, h("b", {}, "Cảnh trám từ kho (Google Drive)"));
  const close = () => pop.remove();
  if (!links.length) pop.append(h("div", { class: "help" }, "Kho chưa có link nào. Lưu link Drive ở màn hình chính → Kho hiệu ứng của tôi → Cảnh trám."),
    h("div", { class: "btns" }, h("button", { class: "outline small", onclick: close }, "Đóng"), h("a", { href: "/#kho", target: "_blank" }, h("button", { class: "primary small" }, "Mở kho"))));
  else {
    pop.append(h("div", { class: "help" }, "File Drive (chia sẻ “Bất kỳ ai có đường liên kết”): bấm Lấy vào video. Thư mục: mở ra, tải file về máy rồi bấm “Từ máy tính”."));
    for (const l of links) {
      const btn = h("button", { class: l.folder ? "outline small" : "primary small", onclick: async () => {
        if (l.folder) return window.open(l.link, "_blank", "noopener");
        btn.disabled = true; btn.textContent = "Đang tải…";
        try {
          const j = await api("/api/kho/links/fetch", "POST", { link: l.link, name: l.name });
          S.media = j.media; close(); addBrollAt(j.path);
        } catch (e) { toast(e.message, true); btn.disabled = false; btn.textContent = "Lấy vào video"; }
      } }, l.folder ? "Mở thư mục" : "Lấy vào video");
      pop.append(h("div", { class: "row", style: "gap:8px;align-items:center;justify-content:space-between;font-size:13px" },
        h("span", { style: "min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" }, (l.folder ? "📁 " : "🎞 ") + l.name), btn));
    }
    pop.append(h("div", { class: "btns" }, h("button", { class: "ghost small", onclick: close }, "Đóng")));
  }
  document.body.append(pop);
}
// ===================== Kéo thả file vào app =====================
async function uploadFile(f,{role}={}) {
  const uploadProject=S.dir;
  toast(`Đang tải ${f.name}…`);
  let j;
  try {
    const r = await editorFetch(`/api/upload?name=${encodeURIComponent(f.name)}`, { method: "POST", body: f });
    j = await r.json();
  } catch (e) { return toast("Tải lên lỗi: " + e.message, true); }
  if (!j.ok) return toast(j.error, true);
  if(S.dir!==uploadProject)return toast('Dự án đã đổi. File đã nhập vào dự án trước; không áp dụng sang dự án đang mở.',true);
  S.media = j.media;
  if (/\.(mp3|wav|m4a|aac)$/i.test(j.path)) {
    const a = (P().audio = P().audio || {});
    if (role==='music'||!a.music) { snapshot(); a.music = j.path; changed(); toast(`Đã thêm nhạc nền: ${j.path}`); }
    else toast(`Đã tải ${j.path}. Chọn làm nhạc nền ở mục Âm thanh.`);
    if (S.tab === "audio") renderList();
    return;
  }
  addBrollAt(j.path);
}
// thêm cảnh trám (file trong inputs/) tại playhead
function addBrollAt(src) {
  snapshot();
  const it = { id: uid("b", itemsOf("brolls")), src, at: round3(S.tm.outToSrc(S.time)), dur: 4, mode: "pip" };
  itemsOf("brolls").push(it);
  S.tab = "brolls";
  S.selId = it.id;
  changed({ inspector: true });
  renderTabs(); renderList();
  toast("Đã thêm cảnh trám tại playhead. Kéo trên video để đặt vị trí.");
}
(function setupDrop() {
  const dz = $("#dropzone");
  let depth = 0;
  const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes("Files");
  window.addEventListener("dragenter", (e) => { if (!hasFiles(e)) return; depth++; dz.classList.add("show"); });
  window.addEventListener("dragleave", () => { depth = Math.max(0, depth - 1); if (!depth) dz.classList.remove("show"); });
  window.addEventListener("dragover", (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener("drop", async (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth = 0;
    dz.classList.remove("show");
    for (const f of e.dataTransfer.files) await (/\.zip$/i.test(f.name) ? importTplZip(f) : uploadFile(f));
  });
  $("#fileInput").addEventListener("change", async (e) => { for (const f of e.target.files) await uploadFile(f); e.target.value = ""; });
})();

// ===================== Thương hiệu (brand kit) =====================
S.brands = null;
async function loadBrands() {
  try { S.brands = await (await editorFetch("/api/brands")).json(); } catch { S.brands = []; }
  if (S.tab === "brand") renderList();
}
function brandForm(box) {
  const b = ensureBrand();
  box.append(endCardControls({project:P(),media:S.media,open:S.endCardOpen===true,onToggle:value=>S.endCardOpen=value,onChange:value=>{snapshot();P().endCard=value;changed({list:false});},onPreview:()=>seek(Math.min(S.tm.total-.05,S.tm.contentTotal+.6))}));
  const wm=P().watermark;
  const logoSelect=h('select',{'aria-label':'Ảnh logo góc'},[['','Không dùng logo góc'],...S.media.filter(m=>/\.(png|jpe?g|webp)$/i.test(m)).map(m=>[m,m])].map(([value,label])=>h('option',{value,selected:(wm?.file??'')===value},label)));
  if(wm?.file&&![...logoSelect.options].some(o=>o.value===wm.file))logoSelect.append(h('option',{value:wm.file,selected:true},wm.file));
  logoSelect.oninput=()=>{snapshot();if(logoSelect.value)P().watermark={position:'top-left',heightPercent:3,marginPercent:4,opacity:.9,...P().watermark,file:logoSelect.value};else delete P().watermark;changed();renderList();};
  box.append(h('h3',{},'Logo góc video'),field('Ảnh logo góc',logoSelect,'Thêm ảnh qua Cảnh trám/Từ máy tính rồi chọn; ảnh giữ nguyên tỷ lệ. Lưu dự án để giữ thay đổi.'));
  if(wm)box.append(field('Góc logo',sel(wm,'position',[['top-left','Trên trái'],['top-right','Trên phải'],['bottom-left','Dưới trái'],['bottom-right','Dưới phải']],'top-left')),field('Chiều cao logo (%)',slider(wm,'heightPercent',.1,30,.1,3)),field('Lề logo (% chiều rộng)',slider(wm,'marginPercent',0,30,.1,4)),field('Độ hiện logo',slider(wm,'opacity',0,1,.05,.9)),field('Tạm ẩn logo',chk(wm,'hidden')));
  const fonts = Object.keys(FONTS).map((f) => [f, f]);
  const preview = h("div", { class: "brand-prev" },
    h("div", { class: "bp-label", style: `font-family:'${b.fontLabel}'` }, "NHÃN"),
    h("div", { class: "bp-title", style: `font-family:'${b.fontTitle}';background:linear-gradient(180deg,${b.c1},${b.c2} 52%,${b.c3});-webkit-background-clip:text;background-clip:text;color:transparent` }, "TIÊU ĐỀ VÀNG"),
    h("div", { class: "bp-sub", style: `font-family:'${b.fontSub}';color:${b.sub}` }, "Chữ phụ nghiêng"));
  const rerender = () => setTimeout(renderList, 0);
  const s1 = sel(b, "fontTitle", fonts, "Anton"), s2 = sel(b, "fontSub", fonts, "Montserrat"), s3 = sel(b, "fontLabel", fonts, "Montserrat");
  [s1, s2, s3].forEach((x) => x.addEventListener("change", rerender));
  const cols = ["c1", "c2", "c3", "sub"].map((k) => { const el = colorIn(b, k, BRAND_DEFAULT[k]); el.addEventListener("change", rerender); return el; });
  box.append(preview,
    h("div", { class: "row3" }, field("Font tiêu đề", s1), field("Font chữ phụ", s2), field("Font nhãn", s3)),
    field("Màu tiêu đề (gradient trên → dưới)", h("div", { class: "swatches" }, cols[0], cols[1], cols[2])),
    field("Màu chữ phụ", cols[3]),
    h("div", { class: "help" }, "Chỉ các font có đủ dấu tiếng Việt. Màu áp dụng cho chữ nhấn, cảnh minh hoạ và biểu đồ. Kiểu phụ đề chỉnh ở mục Phụ đề."),
    h("hr", { class: "sep" }));
  const workspaceBrand=h('section',{'aria-label':'Nhận diện mặc định workspace'},h('h3',{},'Nhận diện của workspace'),h('p',{},'Lưu font, màu, kiểu phụ đề và logo góc từ bộ đang chỉnh. Không đổi dự án khác. Áp dụng vào bản hiện tại vẫn cần Lưu dự án. CSS đồ họa của mẫu được giữ riêng.'));
  const brandProject=P(),brandProjectDir=S.dir;let brandVersion=null;const brandStatus=h('p',{'role':'status'},'Đang đọc mặc định…');
  const loadWorkspaceBrand=async()=>{const response=await editorFetch('/api/v1/brand-default');const data=await response.json();if(!response.ok)throw new Error(data.error||'Không đọc được nhận diện.');if(P()!==brandProject||S.dir!==brandProjectDir||data.workspaceId!==(brandProject.workspaceId||'default'))throw new Error('Workspace hoặc dự án đã đổi.');return data;};
  const saveDefault=h('button',{class:'outline',disabled:true,onclick:async()=>{saveDefault.disabled=true;try{const response=await editorFetch('/api/v1/brand-default',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspaceId:P().workspaceId||'default',version:brandVersion,brand:ensureBrand(),watermark:P().watermark||null})}),data=await response.json();if(!response.ok)throw new Error(data.error||'Không lưu được mặc định.');brandVersion=data.version;applyDefault.disabled=false;brandStatus.textContent='Đã lưu nhận diện workspace · phiên bản '+data.version;}catch(error){brandStatus.textContent=error.message;}finally{saveDefault.disabled=false;}}},'Lưu bộ đang chỉnh làm mặc định');
  const applyDefault=h('button',{class:'outline',disabled:true,onclick:async()=>{try{const data=await loadWorkspaceBrand();if(!data.brand)throw new Error('Workspace chưa có nhận diện mặc định.');const response=await editorFetch('/api/v1/brand-default/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspaceId:data.workspaceId,version:data.version})}),applied=await response.json();if(!response.ok)throw new Error(applied.error||'Không áp được nhận diện.');if(P()!==brandProject||S.dir!==brandProjectDir)throw new Error('Dự án đã đổi.');snapshot();P().brand={...P().brand,...structuredClone(data.brand)};if(applied.watermark)P().watermark=applied.watermark;changed({inspector:true});renderList();toast('Đã áp nhận diện workspace. Kiểm tra và Lưu dự án.');}catch(error){brandStatus.textContent=error.message;}}},'Áp mặc định vào dự án');
  workspaceBrand.append(saveDefault,applyDefault,brandStatus);box.append(workspaceBrand);
  loadWorkspaceBrand().then(data=>{if(!workspaceBrand.isConnected)return;brandVersion=data.version;saveDefault.disabled=false;applyDefault.disabled=!data.brand;brandStatus.textContent=data.brand?data.brand.name+' · phiên bản '+data.version:'Chưa có mặc định cho workspace này.';}).catch(error=>{if(workspaceBrand.isConnected)brandStatus.textContent=error.message;});
  const name = h("input", { placeholder: "Tên preset, VD: Khách hàng A", value: b.name && b.name !== BRAND_DEFAULT.name ? b.name : "" });
  box.append(field("Lưu bộ này để dùng lại cho video khác", h("div", { class: "row", style: "grid-template-columns:1fr auto" }, name,
    h("button", { class: "primary small", onclick: async () => {
      const n = name.value.trim();
      if (!n) return toast("Đặt tên cho preset.", true);
      b.name = n;
      const r = await (await editorFetch("/api/brands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) })).json();
      S.brands = r.brands;
      changed();
      renderList();
      toast(`Đã lưu preset “${n}”.`);
    } }, "Lưu preset"))));
  if (S.brands === null) { loadBrands(); return; }
  const list = h("div", { class: "brand-list" });
  if (!S.brands.length) list.append(h("div", { class: "help" }, "Chưa có preset nào."));
  for (const p of S.brands) {
    list.append(h("div", { class: "brand-row" },
      h("span", { class: "dots" }, ...[p.c1, p.c2, p.c3, p.sub].map((c) => h("i", { style: `background:${c}` }))),
      h("span", { class: "nm" }, p.name || p.id, h("small", {}, ` · ${p.fontTitle} / ${p.fontSub}`)),
      h("button", { class: "outline small", onclick: () => {
        snapshot();
        const nb = structuredClone(p);
        delete nb.id;
        P().brand = nb;
        changed({ inspector: true });
        renderList();
        toast(`Đã áp dụng “${p.name}”.`);
      } }, "Áp dụng"),
      h("button", { class: "link danger", onclick: async () => {
        if (!confirm(`Xoá preset “${p.name}”?`)) return;
        S.brands = (await (await editorFetch(`/api/brands?id=${encodeURIComponent(p.id)}`, { method: "DELETE" })).json()).brands;
        renderList();
      } }, "Xoá")));
  }
  box.append(field("Preset đã lưu", list));
}

// ===================== Màu video gốc =====================
// ===================== Bộ lọc màu (kiểu CapCut): Bộ lọc · Màu da · Điều chỉnh =====================
// camera.color = giá trị cuối cùng (bản dựng đọc) + filter / filterAmt / skin / adjust (để chỉnh lại được)
function colorState() {
  const c = (P().camera = P().camera || {});
  c.color = { ...COLOR_NEUTRAL, ...(c.color || {}) };
  if (c.color.preset && !c.color.filter && COLOR_PRESETS[c.color.preset]) c.color.filter = c.color.preset; // dự án cũ
  // màu do mẫu / dự án cũ đặt thẳng giá trị → giữ nguyên bằng cách coi phần lệch là chỉnh tay
  if (!c.color.adjust && !c.color.filter) {
    c.color.adjust = {};
    for (const [k, n] of Object.entries(COLOR_NEUTRAL)) if (Number(c.color[k]) !== n) c.color.adjust[k] = Math.round((c.color[k] - n) * 1000) / 1000;
  }
  if (c.color.filter && !c.color.adjust) {
    const base = mixColor(c.color.filter, c.color.filterAmt ?? 1, c.color.skin || "none", {});
    c.color.adjust = {};
    for (const k of Object.keys(COLOR_NEUTRAL)) if (c.color[k] != null && Math.abs(c.color[k] - base[k]) > 0.001) c.color.adjust[k] = Math.round((c.color[k] - base[k]) * 1000) / 1000;
  }
  delete c.color.preset; delete c.color.label;
  c.color.filter = c.color.filter || "none";
  c.color.filterAmt = c.color.filterAmt ?? 1;
  c.color.skin = c.color.skin || "none";
  c.color.adjust = c.color.adjust || {};
  return c.color;
}
function applyColor(col) {
  Object.assign(col, mixColor(col.filter, col.filterAmt, col.skin, col.adjust));
  changed();
}
// Ảnh mẫu: khung hình hiện tại của video, phủ đúng các lớp màu như bản dựng
function colorThumb(v, label, on, onclick) {
  const src = P().source?.video, t = Math.round(S.tm.outToSrc(S.time) || 2);
  const tempA = Math.min(1, Math.abs(v.temp || 0)) * 0.28;
  return h("div", { class: `card fcard ${on ? "on" : ""}`, onclick },
    h("div", { class: "thumb fthumb" },
      h("img", { src: thumbUrl(src, t), style: `filter:brightness(${v.brightness}) contrast(${v.contrast}) saturate(${v.saturate})${v.hue ? ` hue-rotate(${v.hue}deg)` : ""}${v.sepia ? ` sepia(${v.sepia})` : ""}` }),
      tempA ? h("i", { style: `background:${v.temp > 0 ? `rgba(255,150,60,${tempA})` : `rgba(70,140,255,${tempA})`};mix-blend-mode:soft-light` }) : null,
      v.fade ? h("i", { style: `background:#6e6e6e;mix-blend-mode:lighten;opacity:${Math.min(0.6, v.fade)}` }) : null,
      v.vignette ? h("i", { style: `background:radial-gradient(ellipse at 50% 42%,transparent 45%,rgba(0,0,0,.75) 100%);opacity:${Math.min(1, v.vignette)}` }) : null),
    h("div", { class: "name" }, label));
}
function filtersForm(box) {
  const col = colorState();
  if (col.filter !== "none") {
    const amt = h("input", { type: "range", min: 0, max: 1, step: 0.01, value: col.filterAmt });
    const num = h("span", { class: "muted" }, Math.round(col.filterAmt * 100) + "%");
    amt.addEventListener("input", () => { snapshot(); col.filterAmt = Number(amt.value); num.textContent = Math.round(col.filterAmt * 100) + "%"; applyColor(col); });
    box.append(field(`Cường độ · ${COLOR_PRESETS[col.filter]?.label || ""}`, h("div", { class: "range" }, amt, num)));
  }
  const groups = {};
  for (const [k, v] of Object.entries(COLOR_PRESETS)) (groups[v.group] = groups[v.group] || []).push([k, v]);
  for (const [g, list] of Object.entries(groups)) {
    box.append(h("div", { class: "rows-title" }, g));
    box.append(h("div", { class: "fgrid" }, list.map(([k, v]) => colorThumb(mixColor(k, k === col.filter ? col.filterAmt : 1, col.skin, col.adjust), v.label, col.filter === k,
      () => { snapshot(); if (col.filter !== k) col.filterAmt = 1; col.filter = k; applyColor(col); renderList(); }))));
  }
}
function skinForm(box) {
  const col = colorState();
  box.append(h("div", { class: "help", style: "margin-bottom:10px" }, "Chỉnh nhẹ tông màu cả khung cho da đẹp hơn — dùng chung được với bộ lọc."));
  box.append(h("div", { class: "fgrid" }, Object.entries(SKIN_PRESETS).map(([k, v]) => colorThumb(mixColor(col.filter, col.filterAmt, k, col.adjust), v.label, col.skin === k,
    () => { snapshot(); col.skin = k; applyColor(col); renderList(); }))));
}
// Hiệu ứng hình trên cả khung: thêm tại đầu phát, chỉnh thời lượng + độ mạnh
function vfxForm(box) {
  const list = (P().vfx = P().vfx || []);
  const name = Object.fromEntries(VFX_TYPES.map(([k, l]) => [k, l]));
  box.append(h("div", { class: "help", style: "margin-bottom:10px" }, "Thêm tại vị trí đầu phát. Dừng hình giữ nguyên ảnh, lời nói vẫn chạy."),
    h("div", { class: "btns", style: "margin-bottom:12px;flex-wrap:wrap" }, VFX_TYPES.map(([k, l]) => h("button", { class: "outline small", onclick: () => {
      snapshot(); list.push({ id: "vfx" + Date.now().toString(36), type: k, at: round3(S.tm.outToSrc(S.time)), dur: k === "freeze" ? 1.5 : k === "grain" ? 4 : 0.5, amount: 0.5 }); changed(); renderList();
    } }, "＋ " + l))));
  if (!list.length) box.append(h("div", { class: "help" }, "Chưa có hiệu ứng nào."));
  [...list].sort((a, b) => a.at - b.at).forEach((v) => box.append(h("div", { class: "note", style: "margin-bottom:8px" },
    h("div", { class: "btns", style: "justify-content:space-between" },
      h("button", { class: "link", title: "Tới chỗ hiệu ứng", onclick: () => seek(S.tm.srcToOut(v.at)) }, `${name[v.type] || v.type} · ${fmt(S.tm.srcToOut(v.at))}`),
      h("button", { class: "link danger", onclick: () => { snapshot(); list.splice(list.indexOf(v), 1); changed(); renderList(); } }, "Xoá")),
    field("Thời lượng (giây)", slider(v, "dur", 0.1, 10, 0.1, 0.5)),
    v.type === "freeze" ? null : field("Độ mạnh", slider(v, "amount", 0, 1, 0.01, 0.5)))));
}
function adjustForm(box) {
  const col = colorState();
  const base = () => mixColor(col.filter, col.filterAmt, col.skin, {});
  const row = (k, label, min, max, step) => {
    const r = h("input", { type: "range", min, max, step, value: col[k] }), n = h("input", { type: "number", min, max, step, value: col[k] });
    const set = (v) => { snapshot(); col.adjust[k] = Math.round((Number(v) - base()[k]) * 1000) / 1000; applyColor(col); r.value = col[k]; n.value = col[k]; };
    r.addEventListener("input", () => set(r.value)); n.addEventListener("input", () => set(n.value));
    return field(label, h("div", { class: "range" }, r, n));
  };
  box.append(row("brightness", "Độ sáng", 0.6, 1.4, 0.01), row("contrast", "Tương phản", 0.6, 1.5, 0.01), row("saturate", "Bão hoà", 0, 2, 0.01),
    row("temp", "Nhiệt độ màu (lạnh ↔ ấm)", -1, 1, 0.01), row("hue", "Sắc độ (độ)", -30, 30, 1), row("sepia", "Màu cổ (sepia)", 0, 1, 0.01),
    row("fade", "Phai màu (nâng vùng tối)", 0, 0.6, 0.01), row("vignette", "Tối viền", 0, 1, 0.01),
    h("div", { class: "btns" }, h("button", { class: "link", onclick: () => { snapshot(); col.adjust = {}; applyColor(col); renderList(); } }, "Đặt lại chỉnh tay"),
      h("button", { class: "link danger", onclick: () => { snapshot(); Object.assign(col, { filter: "none", filterAmt: 1, skin: "none", adjust: {} }); applyColor(col); renderList(); } }, "Về màu gốc")));
}

// ===================== Làm đẹp (kiểu CapCut): da · môi · mắt · khuôn mặt =====================
// camera.beauty = { smooth, white, firm, lip, lipColor, eye, eyeBright, slim, chin, nose } (0–100). Cần quét điểm mặt 1 lần (work/face.json).
const BEAUTY = [
  ["Người & da toàn thân", [["personLight", "Sáng riêng người"], ["bodyWhite", "Sáng da mặt, cổ & tay"], ["bodySmooth", "Mịn da toàn thân"]]],
  ["Da", [["smooth", "Mịn da"], ["white", "Trắng da"], ["firm", "Căng da"]]],
  ["Môi", [["lip", "Son môi"]]],
  ["Mắt", [["eye", "To mắt"], ["eyeBright", "Sáng mắt"]]],
  ["Khuôn mặt", [["slim", "Gọt mặt"], ["chin", "Cằm V"], ["nose", "Mũi nhỏ"]]],
];
const LIP_COLORS = [["#d0475a", "Hồng đào"], ["#c2202f", "Đỏ"], ["#e0707a", "Hồng nhạt"], ["#b5524a", "Cam đất"], ["#9c2b4a", "Đỏ rượu"], ["#d9826b", "Nude"]];
const BEAUTY_NATURAL = { smooth: 45, white: 20, firm: 30, lip: 25, eye: 15, eyeBright: 25, slim: 20, chin: 15, nose: 10 };
S.face = null; // { scanned, frames, found } · S.faceScan = { p } khi đang quét
function playerWin() { try { return player.shadowRoot?.querySelector("iframe")?.contentWindow; } catch { return null; } }
// đổi thông số: player đã có lớp làm đẹp thì cập nhật ngay, chưa có (lần đầu bật) thì dựng lại + nạp lại
function beautyChanged(b) {
  const w = playerWin(), on = BEAUTY.some(([, l]) => l.some(([k]) => Number(b[k]) > 0))||(b.sourceAdjustments||[]).some(v=>v.personLight||v.bodyWhite||v.bodySmooth)||(b.personSelections||[]).some(v=>v.adjustments&&(v.adjustments.personLight||v.adjustments.bodyWhite||v.adjustments.bodySmooth));
  if (w?.__beautySet && on) {
    const p = { lipColor: b.lipColor || "#d0475a" };
    p.maskShrink=Math.min(1,Math.max(0,(Number(b.maskShrink)||0)/100));
    p.maskStability=Math.min(1,Math.max(0,(Number(b.maskStability)||0)/100));
    p.maskEdits=normalizePersonMaskEdits(b.maskEdits);
    p.sourceAdjustments=normalizePersonSourceAdjustments(b.sourceAdjustments);
    p.personSelections=normalizePersonSelections(b.personSelections);
    for (const [, l] of BEAUTY) for (const [k] of l) p[k] = Math.min(1, Math.max(0, (Number(b[k]) || 0) / 100));
    w.__beautySet(p);
    changed({ reload: false });
  } else changed();
}
async function scanFaceNow() {
  if (S.faceScan) return;
  if(S.dirty||!S.editorReady)return toast('Lưu bản dựng trước khi quét mặt.',true);
  const project=P(),dir=S.dir,revision=S.revision,controller=new AbortController();
  const fps=S.faceScanFps===30?30:15;
  const validate=()=>{if(P()!==project||S.dir!==dir||S.revision!==revision||S.dirty){controller.abort();throw new Error('Dự án đã đổi; mở lại và quét mặt trên bản đã lưu.');}};
  S.faceScan = { p: 0,controller,fps };
  renderList();
  try {
    const { scanFace } = await import("/ui/face-scan.js");
    validate();const manifest=await api('/api/face?sources=1');validate();
    if(!manifest.sources.length||manifest.sources.length>40)throw new Error('Quét mặt cần1–40nguồn A-roll/B-roll đang dùng.');
    const tracks=[];
    for(const [index,source] of manifest.sources.entries()){
      const url='/api/primary-media-preview?'+new URLSearchParams({src:source.src,dir,revision,workspaceId:project.workspaceId||'default'});
      const data=await scanFace(url,{fps,personSkin:true,sourceId:source.src,signal:controller.signal,onProgress:p=>{validate();S.faceScan.p=(index+p)/manifest.sources.length;const bar=$('#faceBar');if(bar)bar.style.width=Math.round(S.faceScan.p*100)+'%';const t=$('#facePct');if(t)t.textContent=Math.round(S.faceScan.p*100)+'%';}});validate();tracks.push({...data,fingerprint:source.fingerprint});
    }
    validate();S.face=await api('/api/face','PUT',{v:2,tracks});validate();
    toast(`Đã quét ${tracks.length} nguồn A-roll/B-roll ở ${fps} fps. Chọn mức Làm đẹp để áp dụng.`);
    changed({reload:true});
  } catch (e) { toast("Quét khuôn mặt lỗi: " + e.message, true); }
  S.faceScan = null;
  renderList();
}
function beautyForm(box) {
  const c = (P().camera = P().camera || {}), b = (c.beauty = c.beauty || {});
  const faceKey=JSON.stringify([S.dir,S.revision,(P().segments||[]).filter(s=>s.keep!==false).map(s=>s.src||P().source?.video),(P().brolls||[]).filter(b=>!b.hidden).map(b=>b.src)]);
  if(S.faceContext!==faceKey){S.faceContext=faceKey;S.face=null;}
  if (!S.face) { S.face = { loading: true }; editorFetch("/api/face").then((r) => r.json()).then((j) => {if(S.faceContext!==faceKey)return; S.face = j; if (S.tab === "beauty") renderList(); }).catch(() => {if(S.faceContext===faceKey) S.face = { scanned: false }; }); }
  box.append(h("div", { class: "help", style: "margin-bottom:10px" }, "Tách riêng người và da mặt/cổ/tay bằng AI local. Sáng riêng người tác động cả quần áo; các thanh da toàn thân chỉ dùng vùng AI nhận là da. Da/Môi/Mắt bên dưới vẫn theo khuôn mặt. Có thể nhận sai ở vùng nhỏ hoặc bị che; kiểm tra trước khi xuất."));
  if (S.faceScan) {
    box.append(h("div", { class: "field" }, h("label", {}, `Đang quét mặt & toàn thân · ${S.faceScan.fps} fps… `, h("span", { id: "facePct" }, Math.round(S.faceScan.p * 100) + "%")),
      h("div", { class: "fbar" }, h("i", { id: "faceBar", style: `width:${Math.round(S.faceScan.p * 100)}%` })),
      h("div", { class: "help" }, "Quét lần lượt các nguồn A-roll/B-roll đang dùng ngay trên máy.")),h('button',{class:'outline',onclick:()=>S.faceScan?.controller.abort()},'Hủy quét'));
    return;
  }
  if (S.face?.loading) { box.append(h("div", { class: "help" }, "Đang tải…")); return; }
  const quality=h('select',{'aria-label':'Chất lượng quét người và da'},h('option',{value:15},'Nhanh · 15 fps'),h('option',{value:30},'Chi tiết · 30 fps'));
  quality.value=String(S.faceScanFps===30?30:15);
  quality.onchange=()=>{S.faceScanFps=Number(quality.value);};
  box.append(field('Chất lượng cho lượt quét tiếp theo',quality),h('div',{class:'help'},'30 fps lấy mẫu dày hơn cho chuyển động nhanh, tốn thời gian và dữ liệu hơn. Chọn rồi bấm Quét; không tự thay bản quét hiện có.'));
  if(S.face?.scanRates?.length)box.append(h('div',{class:'help'},`Dữ liệu đang dùng: ${S.face.scanRates.join(' / ')} fps.`));
  if (!S.face?.scanned) {
    box.append(h("button", { class: "primary", onclick: scanFaceNow }, "Quét khuôn mặt các nguồn A-roll/B-roll & da toàn thân"),
      h("div", { class: "help", style: "margin-top:8px" }, "Quét 1 lần để biết vị trí da, môi, mắt trong từng khung hình. Chạy ngay trên máy."));
    return;
  }
  if(S.face.missing?.length)box.append(h('div',{class:'help'},`${S.face.missing.length} nguồn A-roll/B-roll chưa có dữ liệu mặt khớp. Quét lại sau thay nguồn/chống rung; nguồn thiếu sẽ bỏ qua làm đẹp.`));
  box.append(h('div',{class:'help'},S.face.bodySources?`Đã có mặt nạ người/da ở ${S.face.bodySources} nguồn. Dùng mức nhẹ, kiểm cổ/tay và viền chuyển động.`:'Bản quét cũ chỉ có mặt. Bấm Quét lại mặt để bổ sung người & da toàn thân.'));
  if(S.face.bodySources){
    const select=h('select',{'aria-label':'Xem vùng AI nhận diện'},h('option',{value:0},'Video bình thường'),h('option',{value:1},'Xem vùng người'),h('option',{value:2},'Xem vùng da'));
    select.value=String(S.beautyMaskMode||0);
    select.onchange=()=>{S.beautyMaskMode=Number(select.value)||0;const w=playerWin();if(w?.__beautyMask)w.__beautyMask(S.beautyMaskMode);else toast('Đợi bản xem trước nạp xong rồi thử lại.',true);};
    box.append(field('Kiểm tra vùng AI · chỉ xem trước',select));
    const advanced=h('details',{},h('summary',{},'Nâng cao · Viền vùng người/da'));
    const shrink=h('input',{type:'range',min:0,max:100,step:1,value:b.maskShrink||0,'aria-label':'Thu viền vùng người/da'}),value=h('span',{class:'muted'},String(b.maskShrink||0));
    shrink.addEventListener('pointerdown',()=>snapshot());
    shrink.addEventListener('input',()=>{snapshot();b.maskShrink=Number(shrink.value);value.textContent=shrink.value;beautyChanged(b);});
    advanced.append(field('Thu viền vùng người/da',h('div',{class:'range'},shrink,value)),h('div',{class:'help'},'Thu vùng chỉnh vào trong để giảm lem nền. Mức cao có thể mất chi tiết da nhỏ; chỉ tác động ba thanh người/da toàn thân. Mặc định 0 giữ vùng quét.'));
    const stability=h('input',{type:'range',min:0,max:100,step:1,value:b.maskStability||0,'aria-label':'Ổn định vùng người/da'}),stabilityValue=h('span',{class:'muted'},String(b.maskStability||0));
    stability.addEventListener('pointerdown',()=>snapshot());
    stability.addEventListener('input',()=>{snapshot();b.maskStability=Number(stability.value);stabilityValue.textContent=stability.value;beautyChanged(b);});
    advanced.append(field('Ổn định vùng người/da',h('div',{class:'range'},stability,stabilityValue)),h('div',{class:'help'},'Giảm tác động tại vùng các mẫu quét liền kề nhận khác nhau; không mở rộng vùng chỉnh ra nền. Chưa bù chuyển động: tay/tóc nhanh có thể được chỉnh nhẹ hơn. Mặc định 0; kiểm lại khi tăng.'));
    advanced.append(h('button',{class:'outline',onclick:async()=>{
      if(S.dirty)return toast('Lưu bản dựng trước khi sửa vùng nhận diện.',true);
      const project=P(),dir=S.dir,revision=S.revision;
      const validate=()=>{if(P()!==project||S.dir!==dir||S.revision!==revision)throw new Error('Dự án đã đổi; mở lại sửa vùng.');};
      try{const manifest=await api('/api/face?sources=1');validate();await openPersonMaskDialog({sources:manifest.sources.map(s=>s.src),edits:b.maskEdits,request:editorFetch,validate,mediaUrl:src=>'/api/primary-media-preview?'+new URLSearchParams({src,dir,revision,workspaceId:project.workspaceId||'default'}),onApply:edits=>{validate();snapshot();b.maskEdits=edits;beautyChanged(b);renderList();toast('Đã áp dụng nét sửa vùng. Bấm Lưu để giữ bản dựng.');}});}catch(error){toast(error.message,true);}
    }},'Sửa vùng nhận diện bằng cọ'),h('div',{class:'help'},`${b.maskEdits?.length||0} nét sửa đã áp dụng. Nét cọ theo tọa độ nguồn và khoảng giây, chưa tự bám người.`));
    box.append(advanced);
  }
  for (const [g, list] of BEAUTY) {
    box.append(h("div", { class: "rows-title" }, g));
    const isBody=g==='Người & da toàn thân',tracks=S.face.bodySourceDetails||[];
    let selected=isBody&&tracks.find(t=>t.src===S.beautySource);
    const rangeEnd=v=>v.to??v.from+v.f.length/v.fps,rangeKey=v=>`${v.src}|${v.sha256}|${v.from}|${rangeEnd(v)}`,rangeLabel=v=>`${v.from.toFixed(2)}–${rangeEnd(v).toFixed(2)} giây nguồn`;
    let rangeOption=null,rangeReset=null,sourceReset=null;
    const hasSourceOverride=()=>!!selected&&(b.sourceAdjustments||[]).some(v=>v.src===selected.src&&v.sha256===selected.sha256);
    // Update reset/label in place after each edit; renderList would replace the focused control.
    const syncBodyScope=()=>{if(selectedRange){if(rangeReset)rangeReset.hidden=!selectedRange.adjustments;if(rangeOption)rangeOption.textContent=rangeLabel(selectedRange)+(selectedRange.adjustments?' · mức riêng':'');}else if(sourceReset)sourceReset.hidden=!hasSourceOverride();};
    const selectedRange=selected&&(b.personSelections||[]).find(v=>v.src===selected.src&&v.sha256===selected.sha256&&rangeKey(v)===S.beautyRange);
    if(isBody&&tracks.length){
      const scope=h('select',{'aria-label':'Phạm vi chỉnh người và da'},h('option',{value:''},'Mức chung · các nguồn chưa chỉnh riêng'),...tracks.map(t=>h('option',{value:t.src},t.src)));
      scope.value=selected?.src||'';scope.onchange=()=>{S.beautySource=scope.value;S.beautyRange='';renderList();};
      box.append(field('Chỉnh người/da cho',scope),h('div',{class:'help'},selected?(selectedRange?'Đang chỉnh riêng một khoảng trong file này; chọn phạm vi bên dưới.':'Chỉ file nguồn này, gồm mọi đoạn dùng cùng file. Kéo thanh để lưu mức riêng; không tự chuyển khung xem.'):'Mức mặc định. Nguồn có mức riêng giữ mức riêng khi đổi các thanh này.'));
      if(selected){
        const ranges=(b.personSelections||[]).filter(v=>v.src===selected.src&&v.sha256===selected.sha256).sort((a,b)=>a.from-b.from);
        if(ranges.length){
          const control=h('select',{'aria-label':'Khoảng chỉnh người và da'},h('option',{value:''},'Toàn nguồn · mức mặc định của file'),...ranges.map(v=>{const option=h('option',{value:rangeKey(v)},rangeLabel(v)+(v.adjustments?' · mức riêng':''));if(v===selectedRange)rangeOption=option;return option;}));
          control.value=selectedRange?rangeKey(selectedRange):'';control.onchange=()=>{S.beautyRange=control.value;renderList();};
          box.append(field('Phạm vi ba thanh bên dưới',control),h('div',{class:'help'},selectedRange?'Chỉ khoảng nguồn đã chọn. Kéo thanh để lưu mức riêng; vùng người vẫn theo mặt nạ đã duyệt.':'Mức của file; khoảng đã có mức riêng giữ nguyên.'));
          if(selectedRange){rangeReset=h('button',{class:'link',style:'display:block;white-space:normal;text-align:left;margin:4px 0',onclick:()=>{snapshot();delete selectedRange.adjustments;beautyChanged(b);renderList();}},'Dùng mức nguồn cho khoảng này');box.append(rangeReset);}
        }
      }
      if(selected&&!selectedRange){sourceReset=h('button',{class:'link',style:'display:block;white-space:normal;text-align:left;margin:4px 0',onclick:()=>{snapshot();b.sourceAdjustments=(b.sourceAdjustments||[]).filter(v=>v.src!==selected.src);beautyChanged(b);renderList();}},'Dùng mức chung cho nguồn này');box.append(sourceReset);}
      syncBodyScope();
      if(selected)box.append(personCoverageControls({h,project:P(),src:selected.src,sha256:selected.sha256}));
      if(selected){
        const choosePerson=async(range)=>{
          if(S.dirty)return toast('Lưu bản dựng trước khi chọn người.',true);
          const project=P(),dir=S.dir,revision=S.revision;
          const validate=()=>{if(P()!==project||S.dir!==dir||S.revision!==revision||S.dirty)throw new Error('Bản dựng đã đổi; mở lại chọn người.');};
          try{await openPersonSelectionDialog({src:selected.src,initialFrom:range?.from??Math.max(0,...(b.personSelections||[]).filter(v=>v.src===selected.src).map(rangeEnd)),initialDuration:range?rangeEnd(range)-range.from:1,request:editorFetch,validate,mediaUrl:src=>'/api/primary-media-preview?'+new URLSearchParams({src,dir,revision,workspaceId:project.workspaceId||'default'}),onApply:selection=>{validate();const next=mergePersonSelection(b.personSelections,selection);snapshot();b.personSelections=next;beautyChanged(b);renderList();toast('Đã giới hạn vùng người. Bấm Lưu để giữ bản dựng.');}});}catch(error){toast(error.message,true);}
        };
        const reviewPerson=async(range)=>{
          if(S.dirty)return toast('Lưu bản dựng trước khi xem vùng người.',true);
          const project=P(),dir=S.dir,revision=S.revision;
          const validate=()=>{if(P()!==project||S.dir!==dir||S.revision!==revision||S.dirty)throw new Error('Bản dựng đã đổi; mở lại vùng người.');};
          const checkSource=async()=>{validate();const manifest=await api('/api/face?sources=1');validate();const source=manifest.sources.find(s=>s.src===range.src);if(!source||source.fingerprint?.sha256!==range.sha256||selected.sha256!==range.sha256)throw new Error('Nguồn đã đổi hoặc không còn khớp vùng người; quét và chọn lại.');};
          try{await openPersonSelectionDialog({src:selected.src,savedSelection:range,request:editorFetch,validate,checkSource,mediaUrl:src=>'/api/primary-media-preview?'+new URLSearchParams({src,dir,revision,workspaceId:project.workspaceId||'default'})});}catch(error){toast(error.message,true);}
        };
        box.append(h('button',{class:'outline',onclick:()=>choosePerson()},'Chọn và theo dõi người'));
        const chosen=(b.personSelections||[]).filter(v=>v.src===selected.src).sort((a,b)=>a.from-b.from);
        if(chosen.length){
          const ranges=h('details',{},h('summary',{},`${chosen.length} khoảng đã chọn người`));
          for(const range of chosen){const last=chosen.length===1;ranges.append(h('div',{class:'btns',style:'display:flex;align-items:center;flex-wrap:wrap;gap:8px'},h('span',{class:'help'},`${range.from.toFixed(2)}–${rangeEnd(range).toFixed(2)} giây · ${range.f.length} mẫu`),h('button',{class:'link',onclick:()=>reviewPerson(range)},'Xem vùng'),h('button',{class:'link',onclick:()=>choosePerson(range)},'Chọn lại khoảng'),h('button',{class:'link','aria-label':`Xóa khoảng ${range.from.toFixed(2)}${last?' · trở về toàn bộ người':''}`,onclick:()=>{snapshot();b.personSelections=(b.personSelections||[]).filter(v=>v!==range);beautyChanged(b);renderList();}},last?'Xóa khoảng cuối · dùng toàn bộ người':'Xóa khoảng')));}
          box.append(h('div',{class:'help'},'Ba thanh toàn thân chỉ tác động trong các khoảng đã chọn. Ngoài khoảng hoặc sai nguồn sẽ bỏ qua. Da/Môi/Mắt/Khuôn mặt bên dưới chưa theo giới hạn này. Thêm khoảng không chồng nhau; đúng mốc đầu/cuối sẽ thay riêng khoảng đó.'),ranges,h('button',{class:'outline',style:'white-space:normal;text-align:left;max-width:100%',onclick:()=>{snapshot();b.personSelections=(b.personSelections||[]).filter(v=>v.src!==selected.src);beautyChanged(b);renderList();}},'Bỏ chọn đối tượng · xóa mọi khoảng, dùng toàn bộ người'));
        }
      }
      if(selected){
        const chosen=(b.personSelections||[]).filter(v=>v.src===selected.src),selectionKey=JSON.stringify(chosen),cached=S.selectedPersonExposure;
        const measured=chosen.length&&cached?.track===selected&&cached.src===selected.src&&cached.sha256===selected.sha256&&cached.dir===S.dir&&cached.revision===S.revision&&cached.selectionKey===selectionKey?cached.result:null;
        // Only server-verified suggestions (colour metadata checked); never rebuilt from saved luma here.
        const suggestion=measured?.suggestion||(chosen.length?{available:false,reason:'Số đo hiện có gồm tất cả người; đo lại trong vùng người được chọn trước khi áp gợi ý.'}:selected.suggestion)||{available:false,reason:'Chưa có gợi ý độ sáng đã kiểm hệ màu cho nguồn này; quét lại hoặc chỉnh tay.'};
        if(chosen.length)box.append(h('button',{class:'outline',style:'white-space:normal',onclick:async event=>{
          if(S.dirty)return toast('Lưu bản dựng trước khi đo sáng người được chọn.',true);
          const project=P(),dir=S.dir,revision=S.revision,button=event.currentTarget;button.disabled=true;button.textContent='Đang đo sáng trong vùng đã chọn…';
          try{
            const response=await editorFetch('/api/person-exposure/selected',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({src:selected.src,sha256:selected.sha256})}),result=await response.json();
            if(!response.ok||!result.ok)throw Error(result.error||'Không đo được vùng người.');
            if(P()!==project||S.dir!==dir||S.revision!==revision||S.dirty||S.beautySource!==selected.src||JSON.stringify((b.personSelections||[]).filter(v=>v.src===selected.src))!==selectionKey)throw Error('Bản dựng hoặc vùng chọn đã đổi; đo lại trên bản hiện tại.');
            S.selectedPersonExposure={track:selected,src:selected.src,sha256:selected.sha256,dir,revision,selectionKey,result};renderList();
          }catch(error){toast(error.message,true);}finally{button.disabled=false;button.textContent='Đo sáng người được chọn';}
        }},'Đo sáng người được chọn'));
        if(measured)box.append(h('div',{class:'help'},`Đo riêng vùng người đã chọn · ${measured.times.length} khung nguồn đang dùng. Chưa tính nét cọ, ổn định mask hoặc hiệu chỉnh màu.`));
        box.append(h('div',{class:'help'},suggestion.reason+(suggestion.available?` Đã đo ${suggestion.samples} mẫu vùng người.`:'')));
        if(suggestion.available)box.append(h('div',{class:'help'},'Gợi ý theo độ sáng hiển thị, không xác định tông da tự nhiên hoặc hệ màu HDR/Log. Giữ màu da phù hợp khi kiểm bản xem trước.'));
        if(!selectedRange&&suggestion.available&&(suggestion.personLight||suggestion.bodyWhite))box.append(h('button',{class:'outline',onclick:()=>{snapshot();b.sourceAdjustments=normalizePersonSourceAdjustments([...(b.sourceAdjustments||[]).filter(v=>v.src!==selected.src),{src:selected.src,sha256:selected.sha256,personLight:suggestion.personLight,bodyWhite:suggestion.bodyWhite,bodySmooth:Number(resolvePersonSourceAdjustment(b.sourceAdjustments,selected.src,selected.sha256,b).bodySmooth)||0}]);beautyChanged(b);renderList();}},`Áp dụng gợi ý · sáng người ${suggestion.personLight} · sáng da ${suggestion.bodyWhite}`));
      }
    }
    const values=selected?(selectedRange?.adjustments||resolvePersonSourceAdjustment(b.sourceAdjustments,selected.src,selected.sha256,b)):b;
    for (const [k, label] of list) {
      const control=precisionRangeControl({h,label,value:values[k]||0,disabled:['bodyWhite','bodySmooth','personLight'].includes(k)&&!S.face.bodySources,commitEqualValue:selectedRange?!selectedRange.adjustments:!!selected&&!hasSourceOverride(),onChange:value=>{snapshot();if(selectedRange){selectedRange.adjustments={personLight:Number(values.personLight)||0,bodyWhite:Number(values.bodyWhite)||0,bodySmooth:Number(values.bodySmooth)||0,...selectedRange.adjustments,[k]:value};}else if(selected){const current=resolvePersonSourceAdjustment(b.sourceAdjustments,selected.src,selected.sha256,b);const next={src:selected.src,sha256:selected.sha256,personLight:Number(current.personLight)||0,bodyWhite:Number(current.bodyWhite)||0,bodySmooth:Number(current.bodySmooth)||0,[k]:value};b.sourceAdjustments=normalizePersonSourceAdjustments([...(b.sourceAdjustments||[]).filter(v=>v.src!==selected.src),next]);}else b[k]=value;beautyChanged(b);syncBodyScope();}});
      box.append(field(label, control));
      if (k === "lip") box.append(h("div", { class: "swatches" }, LIP_COLORS.map(([col, nm]) => h("button", { class: `sw ${(b.lipColor || "#d0475a") === col ? "on" : ""}`, title: nm, style: `background:${col}`,
        onclick: () => { snapshot(); b.lipColor = col; if (!b.lip) b.lip = 50; beautyChanged(b); renderList(); } }))));
    }
  }
  box.append(h("div", { class: "btns" },
    h("button", { class: "link", onclick: () => { snapshot(); Object.assign(b, BEAUTY_NATURAL); beautyChanged(b); renderList(); } }, "Tự nhiên"),
    h("button", { class: "link", onclick: () => { snapshot(); for (const [, l] of BEAUTY) for (const [k] of l) b[k] = 0; b.sourceAdjustments=[];for(const range of b.personSelections||[])delete range.adjustments; beautyChanged(b); renderList(); } }, "Tắt làm đẹp"),
    h("button", { class: "link", onclick: scanFaceNow }, "Quét lại mặt & toàn thân")),
    S.face.frames ? h("div", { class: "help" }, `Tìm thấy mặt ở ${Math.round((S.face.found / S.face.frames) * 100)}% mẫu khung đã quét. Khi không có điểm mặt, bỏ qua làm đẹp; tỷ lệ này chỉ tính khuôn mặt, không phải độ chính xác mặt nạ người.`) : null);
}

// ===================== Lịch sử & Nhờ AI =====================
S.panel = null;
S.ai = { text: "", busy: false, result: null, error: null };
function openPanel(p) {
  if (S.panel === p && S.drawer) { S.panel = null; closeDrawer(); return; }
  S.panel = p;
  openDrawer();
  renderTabs(); renderInspector();
}
function renderPanel(box) {
  const close = h("button", { class: "link", style: "float:right", onclick: () => openPanel(null) }, "Đóng");
  if (S.panel === "history") {
    box.append(close, h("h3", {}, "Lịch sử phiên bản"), h("div", { class: "sub" }, "Mỗi lần bấm Lưu, bản trước được giữ lại (30 bản gần nhất)."));
    const list = h("div", { class: "brand-list" }, h("div", { class: "help" }, "Đang tải…"));
    box.append(list);
    editorFetch("/api/history").then((r) => r.json()).then((rows) => {
      list.innerHTML = "";
      if (!rows.length) list.append(h("div", { class: "help" }, "Chưa có bản lưu cũ. Bấm Lưu vài lần sẽ thấy ở đây."));
      for (const r of rows) {
        list.append(h("div", { class: "brand-row hist" },
          h("span", { class: "nm" }, new Date(r.time).toLocaleString("vi-VN"),
            h("small", {}, ` · ${r.texts} chữ · ${r.scenes} cảnh · ${r.cut} đoạn cắt${r.captions ? " · phụ đề" : ""}`)),
          h("button", { class: "outline small", onclick: async () => {
            const data = await (await editorFetch(`/api/history?file=${encodeURIComponent(r.file)}`)).json();
            snapshot();
            S.project = data;
            S.selId = null;
            changed({ inspector: false });
            renderList();
            toast(`Đã mở bản lưu lúc ${new Date(r.time).toLocaleTimeString("vi-VN")}. Bấm Lưu để giữ, Ctrl+Z để quay lại.`);
          } }, "Mở bản này")));
      }
    });
    return;
  }
}

// ---------- Nhờ AI sửa: bong bóng chat góc dưới phải ----------
const AI_EX = ["Rút gọn chữ ở mục đang chọn", "Đổi mọi chữ nhấn sang hiệu ứng trượt ngắn", "Thêm zoom nhẹ ở 3 câu quan trọng nhất", "Dùng chuyển cảnh loé sáng ở mọi điểm cắt", "Sửa lỗi chính tả trong phụ đề"];
S.ai.msgs = [];
const aiFab = document.body.appendChild(h("button", { class: "ai-fab", type: "button", title: "Nhờ AI sửa", "aria-label": "Nhờ AI sửa" }));
aiFab.innerHTML = '<svg viewBox="0 0 16 16" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M8 1.5l1.6 4.4 4.4 1.6-4.4 1.6L8 13.5l-1.6-4.4L2 7.5l4.4-1.6z"/></svg>';
const aiChat = document.body.appendChild(h("div", { class: "ai-chat", role: "dialog", "aria-label": "Nhờ AI sửa", hidden: true }));
function aiViewKey(){return S.dir?'contentos.editor-view.'+S.dir:null;}
function persistAiView(){
  const key=aiViewKey();if(!key)return;
  try{localStorage.setItem(key,JSON.stringify({layout:S.editorLayout||'studio',draft:S.ai.text||'',execution:S.ai.execution,completionMode:S.ai.completionMode,creativeBrief:S.ai.creativeBrief,useWorkspaceBrand:S.ai.useWorkspaceBrand===true,messages:S.ai.msgs.slice(-100).map(({text,me,err})=>({text,me,err}))}));}catch{}
}
function setEditorLayout(mode){
  S.editorLayout=mode==='space'?'space':'studio';
  const space=S.editorLayout==='space';
  document.body.classList.remove('focus');$('#vFocus').classList.remove('on');
  document.body.classList.toggle('cos-space',space);
  $('#btnSpace').setAttribute('aria-pressed',String(space));
  $('#btnStudio').setAttribute('aria-pressed',String(!space));
  if(space){$('.layout').prepend(aiChat);aiChat.setAttribute('role','region');aiChat.hidden=false;renderAiChat();}
  else{document.body.append(aiChat);aiChat.setAttribute('role','dialog');aiChat.hidden=true;aiFab.classList.remove('on');}
  persistAiView();requestAnimationFrame(()=>relayout());
}
$('#btnSpace').onclick=()=>setEditorLayout('space');
$('#btnStudio').onclick=()=>setEditorLayout('studio');
window.addEventListener('pagehide',persistAiView);
function aiSelection(){
  if(S.tab==='audio'&&S.ai.audioClipId){const item=P().audio?.clips?.find(c=>c.id===S.ai.audioClipId);if(item)return {item,group:'audio.clips'};}
  const item=selected();return item?{item,group:S.selKind||S.tab}:null;
}
function renderAiChat() {
  const pickedAi=aiSelection(),it=pickedAi?.item;
  const pickedLabel=it?(pickedAi.group==='audio.clips'?it.src:labelOf(it,pickedAi.group)):'';
  const execution=S.ai.execution||{mode:'session',agent:'auto'};
  const choices=[['session:auto','Phiên đang mở · Codex, Claude hoặc Antigravity'],['session:codex','Phiên đang mở · chỉ Codex'],['session:claude','Phiên đang mở · chỉ Claude'],['session:antigravity','Phiên đang mở · chỉ Antigravity'],['cli:codex','Chạy ngầm CLI · Codex'],['cli:claude','Chạy ngầm CLI · Claude'],['api:gateway','API · sửa bản dựng hiện có']];
  const executionSelect=h('select',{'aria-label':'AI thực hiện',disabled:S.ai.busy},...choices.map(([value,title])=>h('option',{value},title)));
  executionSelect.value=execution.mode+':'+execution.agent;
  executionSelect.onchange=()=>{const [mode,agent]=executionSelect.value.split(':');S.ai.execution={mode,agent};persistAiView();renderAiChat();};
  const modelInput=h('input',{'aria-label':execution.mode==='api'?'Model API':'Model CLI',placeholder:execution.mode==='api'?'Để trống: quy tắc tác vụ / model mặc định':'Để trống: dùng cấu hình CLI',maxlength:128,disabled:S.ai.busy});
  modelInput.value=execution.model||'';
  modelInput.oninput=()=>{S.ai.execution={...execution,model:modelInput.value.trim()};persistAiView();};
  aiChat.innerHTML = "";
  const log = h("div", { class: "ac-log" },
    S.ai.msgs.length ? S.ai.msgs.map((m) => h("div", { class: `ac-msg ${m.me ? "me" : m.err ? "err" : "ai"}` }, m.text,
      m.undo ? h("button", { class: "link", onclick: () => { undo(); m.undo = false; renderAiChat(); } }, "Hoàn tác") : null))
      : [h("div", { class: "ac-hi" }, "Mô tả điều bạn muốn đổi trong video. Claude / Codex / Antigravity đang mở sẽ nhận việc và sửa, hoàn tác được bằng Ctrl+Z."),
        h("div", { class: "chips" }, AI_EX.map((t) => h("button", { class: "chip", onclick: () => { ta.value = t; S.ai.text=t;persistAiView();ta.focus(); } }, t)))],
    S.ai.busy ? h("div", { class: "ac-msg ai busy" }, S.ai.note || "Đang gửi cho AI…",
      S.ai.dir ? h("button", { class: "link", onclick: () => cancelAi() }, "Huỷ yêu cầu") : null) : null);
  const ta = h("textarea", { rows: 2, placeholder: it ? `Sửa “${pickedLabel}”…` : "VD: rút gọn chữ ở cảnh đang chọn còn 4 từ" }, S.ai.text);
  ta.addEventListener("input", () => {S.ai.text = ta.value;S.ai.sources=null;aiChat.querySelectorAll('.cos-source-card').forEach(card=>card.remove());persistAiView();});
  ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runAi(ta.value); } e.stopPropagation(); });
  aiChat.append(
    h("div", { class: "ac-head" }, h("b", {}, "Nhờ AI sửa"), it ? h("label", {}, h("input", {type:"checkbox","aria-label":"Gửi thành phần đang chọn cho AI",checked:!S.ai.omitSelection,disabled:S.ai.busy,onchange:e=>{S.ai.omitSelection=!e.target.checked;} }), `Gửi mục đang chọn: ${pickedLabel}`, execution.mode==='api'&&!(['texts','segments','zooms','scenes','brolls','audio.clips'].includes(pickedAi?.group)) ? ' · API chưa hỗ trợ sửa riêng nhóm này' : '') : null,
      h("button", { class: "ac-x", "aria-label": S.editorLayout==='space'?'Mở Studio':'Đóng', onclick: () => S.editorLayout==='space'?setEditorLayout('studio'):toggleAiChat(false) }, S.editorLayout==='space'?'Mở Studio':'✕')),
    ...(S.editorLayout==='space'?[h('div',{class:'cos-space-hint'},'Cùng bản dựng với Studio · AI hiện dùng luồng Codex/Claude của VEK. ',h('button',{class:'link',onclick:async()=>{
      const {openIntake}=await import('/ui/contentos-intake.js');
      await openIntake({dir:S.dir,onReceived:async()=>{S.media=await api('/api/media');renderList();toast('Đã nhận tư liệu vào dự án.');}});
    }},'Thêm tư liệu NAS / Điện thoại'))]:[]),
    log,
    h('button',{class:'link',onclick:()=>showReviseHistory()},'Xem công việc AI của dự án'),
    h('div',{class:'cos-ai-execution'},h('label',{},'AI thực hiện',executionSelect),['cli','api'].includes(execution.mode)?h('label',{},execution.mode==='api'?'Model API cho lượt này (tùy chọn)':'Model CLI (tùy chọn)',modelInput):null,execution.mode==='api'?runModelPicker({input:modelInput,disabled:S.ai.busy,request:editorFetch,isCurrent:()=>S.ai.execution?.mode==='api'&&!S.ai.busy}):null,h('small',{},execution.mode==='session'?'Model và quyền công cụ do phiên đang mở quản lý.':execution.mode==='api'?'Để trống dùng quy tắc tác vụ đã bật hoặc model kết nối; model nhập riêng ưu tiên cho lượt này. Chưa fallback hoặc tối ưu chi phí tự động. Tối đa 6 lượt; có thể tính phí. Chỉ dùng tư liệu hiện có. Nếu bật nhìn ảnh trong kết nối LLM, tối đa 6 frame được gửi gateway. Có thể điền preset chữ/HTML của mẫu đã cài; chưa chạy skill tùy ý.':'Model ID phải được tài khoản/CLI hỗ trợ. Để trống dùng cấu hình CLI; chưa có tự chọn model theo ngân sách.'),h('button',{class:'link',disabled:S.ai.busy,onclick:async()=>{
      try{const status=await api('/api/ket-noi-ai');S.ai.connectionNote=(status.agents||[]).map(a=>`${a.ten}: ${!a.coMay?'chưa cài':a.dangNhap===true?'đã đăng nhập':a.dangNhap===false?'chưa đăng nhập':'chưa xác minh đăng nhập'}`).join(' · ')+(status.phien?' · Có tín hiệu phiên '+(status.phien.agent||'AI'):' · Chưa thấy phiên chờ việc');renderAiChat();}catch(error){toast(error.message,true);}
    }},'Kiểm tra kết nối'),S.ai.connectionNote?h('small',{},S.ai.connectionNote):null),
    jobBrandControls({checked:S.ai.useWorkspaceBrand===true,disabled:S.ai.busy,onChange:value=>{S.ai.useWorkspaceBrand=value;persistAiView();}}),
    creativeBriefControls({selection:S.ai.creativeBrief||{},disabled:S.ai.busy,onChange:selection=>{S.ai.creativeBrief=selection;persistAiView();}}),
    newsProjectContext(S.dir,{request:editorFetch,onAttached:async()=>{S.media=await api('/api/media');renderList();toast('Đã nhận voice vào tư liệu dự án; chọn trong Âm thanh để chèn timeline.');}}),
    h('div',{class:'cos-chat-sources'},
      h('button',{class:'link',disabled:S.ai.busy,onclick:async()=>{
        try{const result=await api('/api/v1/sources/inspect','POST',{text:ta.value});S.ai.sources=result.sources;renderAiChat();if(!result.sources.length)toast('Mỗi nguồn một dòng: A-roll: đường dẫn hoặc B-roll: đường dẫn.');}catch(error){toast(error.message,true);}
      }},'Kiểm tra nguồn A-roll/B-roll / B-roll'),
      ...(S.ai.sources||[]).map(source=>h('div',{class:'cos-source-card'},h('b',{},source.role==='aroll'?'A-roll':source.role==='broll'?'B-roll':'Nguồn'),h('code',{},source.path),h('small',{},source.status==='error'?source.error:`${source.files.length} media đã thấy${source.truncated?' · danh sách còn tiếp':''}${source.subdirectories?' · '+source.subdirectories+' thư mục con chưa quét':''} · không quét sâu`))),
      h('small',{},'Mỗi nguồn một dòng; sửa đường dẫn/vai trò ngay trong tin nhắn. Đặt đường dẫn trong dấu nháy nếu có mô tả theo sau.')),
    h("div", { class: "ac-in" }, ta, h("button", { class: "primary", disabled: S.ai.busy, onclick: () => runAi(ta.value), "aria-label": "Gửi" }, "Gửi")));
  log.scrollTop = log.scrollHeight;
  const inputRow=aiChat.querySelector('.ac-in'),options=h('details',{class:'cos-ai-options',...(S.ai.optionsOpen?{open:true}:{})},h('summary',{},'Thiết lập dựng · '+(execution.mode==='session'?'Phiên chat':execution.mode==='api'?'API':'CLI')));
  for(const node of [...aiChat.children])if(node!==inputRow&&!node.matches('.ac-head,.cos-space-hint,.ac-log'))options.append(node);
  options.addEventListener('toggle',()=>{if(options.isConnected)S.ai.optionsOpen=options.open;});aiChat.insertBefore(options,inputRow);
  if (!S.ai.busy) ta.focus();
  persistAiView();
}
function toggleAiChat(v = aiChat.hidden) {
  if(S.editorLayout==='space'&&!v){setEditorLayout('studio');return;}
  aiChat.hidden = !v;
  aiFab.classList.toggle("on", v);
  if (v) renderAiChat();
}
aiFab.onclick = () => toggleAiChat();
async function runAi(text) {
  const instruction = String(text ?? S.ai.text).trim();
  if (!instruction || S.ai.busy) return;
  const draft=instruction;
  const selectedItem=aiSelection();
  const selectionContext=selectedItem && !S.ai.omitSelection ? {selection:{group:selectedItem.group,id:selectedItem.item.id}} : null;
  S.ai.msgs.push({ me: true, text: instruction });
  S.ai.text = "";
  S.ai.busy = true;
  renderAiChat();
  try {
    const r = await api("/api/ai-revise", "POST", { instruction, useWorkspaceBrand:S.ai.useWorkspaceBrand===true, creativeBrief:S.ai.creativeBrief||{}, completionMode:'review', execution:S.ai.execution||{mode:'session',agent:'auto'}, project: P(), context: selectionContext });
    S.dirty = false;
    S.ai.dir = r.job.dir;
    S.ai.waiting = true;
    S.ai.note = aiWaitNote(r.listener || r.runner)+(r.job.execution?.mode==='api'?' · Model: '+r.job.execution.model+' · '+(r.job.execution.routing?.source||'mặc định'):'');
    renderAiChat();
    await consumeAiResult(r.job.dir);
  } catch (e) {
    if(!S.ai.dir)S.ai.text=draft;
    S.ai.msgs.push({ err: true, text: String(e.message || e) });
  }
  S.ai.busy = S.ai.waiting = false; S.ai.dir = null; S.ai.note = "";
  if (!aiChat.hidden) renderAiChat();
}
async function consumeAiResult(dir){
    const job = await aiResult(dir);
    if (job) {
      if(S.dirty)throw new Error("AI đã có kết quả mới; chỉnh sửa tay đang giữ chưa được thay thế. Lưu bản chỉnh sửa để đối chiếu trước khi nạp kết quả AI.");
      const fresh = await (await editorFetch("/api/project", { cache: "no-store" })).json();
      if(!fresh.revision)throw new Error(fresh.error||"Không đọc được phiên bản AI.");
      S.revision=fresh.revision;
      snapshot();
      S.groupOpen = false;
      S.project = fresh.project;
      changed();
      renderList();
      S.ai.msgs.forEach((m) => (m.undo = false)); // chỉ hoàn tác được lần sửa mới nhất
      const completionNote=' Chờ bạn kiểm tra và bấm Xuất khi sẵn sàng.';
      S.ai.msgs.push({ text: `Đã sửa: ${job.summary || "xong yêu cầu."}${completionNote}`, undo: true });
    }
}
async function showReviseHistory(){
  try{
    const data=await api('/api/ai-revise/history');
    const dialog=h('dialog',{'aria-label':'Công việc AI của dự án',style:'width:min(700px,92vw);max-height:80vh;overflow:auto;background:var(--surface);color:var(--ink);border:1px solid var(--line2);border-radius:14px;padding:20px'},h('h2',{},'Công việc AI của dự án'));
    for(const job of data.jobs){
      const row=h('article',{style:'padding:12px 0;border-bottom:1px solid var(--line)'},h('b',{},({waiting:'Chờ AI',working:'AI đã nhận việc',done:'Đã áp bản sửa',error:'Lỗi',cancelled:'Đã hủy'})[job.status]||job.status),h('p',{},job.instruction),h('small',{},job.error||job.summary||job.createdAt),job.completionReviewReason?h('p',{class:'help'},job.completionReviewReason):null,job.completionState?h('p',{},({'awaiting-review':'Chờ bạn kiểm tra và xuất','export-requested':'Đã yêu cầu xuất','export-started':'Đang xuất','exported':'Đã xuất','export-error':'Xuất lỗi; bản dựng đã giữ, kiểm tra nhật ký Xuất video'})[job.completionState]||job.completionState):null);
      if(job.execution?.mode==='api')row.append(h('p',{},'Model API: '+(job.execution.model||'mặc định kết nối')+' · '+({manual:'chọn riêng', 'workspace-rule':'quy tắc workspace','connection-default':'mặc định kết nối'}[job.execution.routing?.source]||'cấu hình cũ')));
      const version=jobTemplateVersion(job);if(version)row.append(version);
      if(job.candidate)row.append(h('button',{class:'outline',onclick:async()=>{try{const {openCandidateReview}=await import('/ui/contentos-candidate.js');await openCandidateReview({dir:job.dir,onResolved:()=>toast('Đã lưu lựa chọn. Nạp lại dự án để xem bản đã lưu; giữ chỉnh sửa chưa lưu trước khi nạp lại.')});}catch(error){toast(error.message,true);}}},'Đối chiếu bản AI'));
      dialog.append(row);
    }
    if(!data.jobs.length)dialog.append(h('p',{},'Chưa có yêu cầu sửa AI cho dự án này.'));
    dialog.append(h('button',{class:'outline',onclick:()=>{dialog.close();dialog.remove();}},'Đóng lịch sử AI'));dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();
  }catch(error){toast(error.message,true);}
}
async function recoverReviseJob(){
  if(S.ai.busy)return;
  try{
    const {active}=await api('/api/ai-revise/history');if(!active)return;
    S.ai.busy=true;S.ai.waiting=active.status==='waiting';S.ai.dir=active.dir;
    S.ai.note='Đã tìm lại yêu cầu '+(active.status==='waiting'?'đang chờ AI.':'AI đã nhận. Trạng thái này chưa xác nhận worker còn sống.');
    if(!S.ai.msgs.some(m=>m.me&&m.text===active.instruction))S.ai.msgs.push({me:true,text:active.instruction});
    if(!aiChat.hidden)renderAiChat();
    try{await consumeAiResult(active.dir);}catch(error){S.ai.msgs.push({err:true,text:error.message});}
    S.ai.busy=S.ai.waiting=false;S.ai.dir=null;S.ai.note='';persistAiView();if(!aiChat.hidden)renderAiChat();
  }catch(error){toast('Chưa đọc được công việc AI: '+error.message,true);}
}
const aiWaitNote = (online) => (online ? "Đang chờ AI nhận việc… Tạm thời đừng chỉnh tay kẻo mất phần sửa." : "Chưa có Claude / Codex / Antigravity kết nối. Mở Claude / Codex / Antigravity trong thư mục phần mềm và dán: sửa video đang chờ trong phần mềm");
// đợi việc xong: trả job khi xong, null khi người dùng huỷ, báo lỗi khi AI không làm được
async function aiResult(dir) {
  for (;;) {
    await new Promise((ok) => setTimeout(ok, 2000));
    if (S.ai.dir !== dir) return null;
    let r;
    try { r = await api(`/api/ai-job?dir=${encodeURIComponent(dir)}`); } catch(error) { if(S.conflict)throw error;continue; }
    if (!r.job) return null;
    if (r.job.status === 'cancelled') return null;
    if (r.job.status === "done") return r.job;
    if (r.job.status === "error") throw new Error(r.job.error || "AI không sửa được.");
    const working = r.job.status === "working", note = working ? `${r.job.agent === "codex" ? "Codex" : r.job.agent === "antigravity" ? "Antigravity" : "Claude"} đang sửa… Tạm thời đừng chỉnh tay kẻo mất phần sửa.` : aiWaitNote(r.listener || r.runner);
    if (note !== S.ai.note || working === S.ai.waiting) { S.ai.note = note; S.ai.waiting = !working; if (!aiChat.hidden) renderAiChat(); }
  }
}
async function cancelAi() {
  const dir = S.ai.dir;
  if(!dir)return;
  try{
    const response=await editorFetch(`/api/ai-job?dir=${encodeURIComponent(dir)}`, { method: "DELETE" });
    if(!response.ok){const result=await response.json();throw new Error(result.error||'Không hủy được việc.');}
    S.ai.dir=null;S.ai.msgs.push({text:'Đã huỷ yêu cầu.'});
  }catch(error){toast(error.message,true);}
}
$("#btnHistory").onclick = () => openPanel("history");



// ===================== Thư viện video mẫu =====================
const TIER_NAME = { none: "Chưa kích hoạt", free: "Basic", pro: "Pro", premium: "Premium" };
S.lib = { open: false, tab: "all", items: null, playing: null, saving: false };
function openLibrary(v = true) {
  S.lib.open = v;
  $("#library").classList.toggle("show", v);
  if (v) { S.lib.items = null; renderLibrary(); loadLibrary(); }
  else { S.lib.playing = null; $("#library").innerHTML = ""; }
}
async function loadLibrary() {
  try { S.lib.items = await (await editorFetch("/api/library")).json(); }
  catch { S.lib.items = []; }
  renderLibrary();
}
async function installTpl(it) {
  const r = await (await editorFetch(`/api/library/install?id=${encodeURIComponent(it.id)}`, { method: "POST" })).json();
  if (!r.ok) return toast(r.error, true);
  S.lib.items = r.items;
  renderLibrary();
  toast(`Đã tải mẫu “${it.name}” vào phần mềm.`);
}
async function uninstallTpl(it) {
  if (!confirm(`Gỡ mẫu “${it.name}” khỏi phần mềm?`)) return;
  const r = await (await editorFetch(`/api/library/install?id=${encodeURIComponent(it.id)}`, { method: "DELETE" })).json();
  S.lib.items = r.items;
  renderLibrary();
}
async function applyTpl(it, restyle) {
  const applyProject=P(),applyDir=S.dir;
  const r = await editorFetch(`/api/templates?id=${encodeURIComponent(it.id)}`);
  const j = await r.json();
  if (!r.ok) {toast(j.error || "Chưa tải mẫu.", true);return false;}
  if(P()!==applyProject||S.dir!==applyDir){toast('Dự án đã đổi trong lúc đọc mẫu. Chọn lại phiên bản trên dự án đang mở.',true);return false;}
  snapshot();
  S.groupOpen = false;
  S.project = applyTemplate(P(), j.template, { restyle });
  setTimeout(loadPresets, 1500); // mẫu mới → thành phần có sẵn mới
  // Bật phụ đề theo mẫu: tạo dòng từ lời nói nếu chưa có
  if (P().captions?.enabled && !(P().captions.lines || []).length && transcriptWords().length)
    P().captions.lines = groupCaptionLines(transcriptWords(), Number(P().captions.maxWords) || 4);
  changed({ inspector: true });
  renderTabs(); renderList();
  openLibrary(false);
  toast(`Đã áp dụng mẫu “${it.name}”. Ctrl+Z để quay lại.`);
  return true;
}
// Mẫu trả phí tải trên website (đăng nhập ở web), rồi nhập file .zip vào phần mềm
function openWebTpl(it) {
  const u = window.__account?.cloudUrl;
  if (u) window.open(`${u}/#thu-vien`, "_blank", "noopener");
  toast(`Đăng nhập website, tải mẫu “${it.name}” (.zip) rồi bấm “Nhập mẫu .zip” hoặc kéo file vào phần mềm.`);
}
// Mẫu .zip tải từ website → gửi cho AI (Claude / Codex đang mở) cài, xong tự làm mới thư viện
async function importTplZip(file) {
  const r = await editorFetch(`/api/template-upload?name=${encodeURIComponent(file.name)}`, { method: "POST", body: file }).then((x) => x.json()).catch(() => ({ ok: false, error: "Không gửi được file." }));
  if (!r.ok) return toast(r.error, true);
  toast(r.listener ? `Đã gửi mẫu “${r.job.templateName}” cho AI cài — theo dõi trong cửa sổ Claude / Codex.` : `Đã tải mẫu lên. Mở Claude / Codex trong thư mục phần mềm và dán: “cài mẫu đang chờ trong phần mềm”.`);
  const poll = setInterval(async () => {
    let j = null;
    try { j = (await (await editorFetch(`/api/ai-job?dir=${encodeURIComponent(r.job.dir)}`)).json()).job; } catch {}
    if (j?.status === "done") {
      clearInterval(poll);
      try { S.lib.items = await (await editorFetch("/api/library")).json().then((x) => (Array.isArray(x) ? x : x.items || [])); } catch {}
      if ($("#library")?.classList.contains("show")) renderLibrary();
      toast(`Đã cài mẫu “${r.job.templateName}”.`);
    } else if (j?.status === "error") { clearInterval(poll); toast("Không cài được mẫu: " + (j.error || ""), true); }
  }, 2500);
}
function pickTplZip() {
  const inp = h("input", { type: "file", accept: ".zip,application/zip" });
  inp.addEventListener("change", () => inp.files[0] && importTplZip(inp.files[0]));
  inp.click();
}

// Gói VIP chưa mở không hiện; VIP đã mở lên đầu (Premium → Pro), còn lại giữ thứ tự thư viện
const LIB_TIER_RANK = { premium: 0, pro: 1 };
const libVisible = () => (Array.isArray(S.lib.items) ? S.lib.items : []).filter((x) => !(x.locked && !x.installed)).map((x, i) => [x, i])
  .sort(([a, i], [b, j]) => (LIB_TIER_RANK[a.tier] ?? 2) - (LIB_TIER_RANK[b.tier] ?? 2) || i - j).map(([x]) => x);
function renderLibrary() {
  const box = $("#library");
  box.innerHTML = "";
  const cur = P()?.template;
  const all = libVisible().filter((x) => S.lib.tab === "all" || x.installed);
  const inds = [...new Set(all.flatMap((x) => x.industries || []))];
  if (S.lib.ind && !inds.includes(S.lib.ind)) S.lib.ind = null;
  const items = all.filter((x) => !S.lib.ind || (x.industries || []).includes(S.lib.ind));
  const restyle = h("input", { type: "checkbox", checked: S.lib.restyle !== false });
  restyle.addEventListener("change", () => (S.lib.restyle = restyle.checked));
  const head = h("div", { class: "lib-head" },
    h("div", {},
      h("h2", {}, "Thư viện video edit"),
      h("div", { class: "muted" }, "Xem video mẫu, tải về phong cách bạn thích rồi áp dụng — sau đó vẫn chỉnh tay đầy đủ như bình thường.")),
    h("button", { class: "ghost icon", title: "Đóng (Esc)", onclick: () => openLibrary(false) }, "✕"));
  const bar = h("div", { class: "lib-bar" },
    h("div", { class: "tabs" },
      h("button", { class: S.lib.tab === "all" ? "on" : "", onclick: () => { S.lib.tab = "all"; renderLibrary(); } }, "Tất cả mẫu", h("span", { class: "count" }, libVisible().length)),
      h("button", { class: S.lib.tab === "installed" ? "on" : "", onclick: () => { S.lib.tab = "installed"; renderLibrary(); } }, "Đã tải về", h("span", { class: "count" }, (S.lib.items || []).filter((x) => x.installed).length))),
    cur ? h("div", { class: "lib-cur" }, "Video này đang dùng mẫu ", h("b", {}, cur.name)) : h("div", { class: "lib-cur muted" }, "Video này chưa dùng mẫu nào"),
    h("label", { class: "inline" }, restyle, "Đổi luôn hiệu ứng các chữ đã có"),
    h("button", { class: "outline small", onclick: () => { S.lib.saving = !S.lib.saving; renderLibrary(); } }, "Lưu kiểu video này thành mẫu"),
    h("button", { class: "outline small", title: "Mẫu .zip tải từ website (cũng có thể kéo thả file .zip vào phần mềm)", onclick: pickTplZip }, "Nhập mẫu .zip"));
  const indBar = inds.length ? h("div", { class: "chips lib-inds" },
    h("button", { class: `chip ${!S.lib.ind ? "on" : ""}`, onclick: () => { S.lib.ind = null; renderLibrary(); } }, "Mọi ngành"),
    inds.map((x) => h("button", { class: `chip ${S.lib.ind === x ? "on" : ""}`, onclick: () => { S.lib.ind = x; renderLibrary(); } }, x))) : null;
  box.append(h("div", { class: "lib-panel" }, head, bar, indBar,
    S.lib.saving ? saveTplForm() : null,
    S.lib.playing ? playerBlock(S.lib.playing, restyle) : null,
    S.lib.items === null ? h("div", { class: "empty" }, "Đang tải thư viện…")
      : !items.length ? h("div", { class: "empty" }, S.lib.tab === "installed" ? "Chưa tải mẫu nào." : "Thư viện trống.")
      : h("div", { class: "lib-grid" }, items.map((it) => libCard(it, cur, restyle)))));
}
function libCard(it, cur, restyle) {
  const using = cur?.id === it.id;
  const media = h("div", { class: "lib-media", onclick: () => { if (it.preview) { S.lib.playing = it; renderLibrary(); } } });
  if (it.poster) media.style.backgroundImage = `url("${it.poster}")`;
  if (it.preview) {
    const v = h("video", { src: it.preview, muted: true, loop: true, playsinline: true, preload: "none" });
    v.muted = true;
    media.append(v, h("div", { class: "lib-play" }, "▶"));
    media.addEventListener("mouseenter", () => { v.currentTime = 0; v.play().catch(() => {}); media.classList.add("hover"); });
    media.addEventListener("mouseleave", () => { v.pause(); media.classList.remove("hover"); });
  } else media.append(h("div", { class: "lib-nopreview" }, "Chưa có video xem trước"));
  media.append(h("span", { class: `lib-tier ${it.tier || "free"}` }, `${TIER_NAME[it.tier || "free"]}${it.locked ? " · khoá" : ""}`));
  if (using) media.append(h("span", { class: "lib-badge" }, "Đang dùng"));
  else if (it.installed) media.append(h("span", { class: "lib-badge dim" }, "Đã tải"));
  const b = it.brand || {};
  return h("div", { class: `lib-card ${using ? "on" : ""}` }, media,
    h("div", { class: "lib-body" },
      h("div", { class: "lib-name" }, it.name),
      h("div", { class: "lib-dots" }, [b.c1, b.c2, b.c3].filter(Boolean).map((c) => h("i", { style: `background:${c}` })),
        h("span", {}, [b.fontTitle, b.caption?.style && `phụ đề ${({ pill: "viên sáng", clean: "sạch", bold: "in hoa", box: "khung tối", stack: "chữ xếp chồng" })[b.caption.style]}`].filter(Boolean).join(" · "))),
      h("div", { class: "lib-desc" }, it.description || ""),
      h("div", { class: "lib-tags" }, (it.industries || it.tags || []).map((t) => h("span", {}, t))),
      h("div", { class: "lib-actions" },
        it.locked && !it.installed
          ? h("button", { class: "primary small", onclick: () => openWebTpl(it) }, "Tải trên website")
          : it.installed
          ? h("button", { class: "primary small", onclick: () => applyTpl(it, restyle.checked) }, using ? "Áp dụng lại" : "Áp dụng vào video này")
          : h("button", { class: "primary small", onclick: () => installTpl(it) }, "Tải về"),
        it.preview ? h("button", { class: "ghost small", onclick: () => { S.lib.playing = it; renderLibrary(); } }, "Xem trước") : null,
        it.installed?h('button',{class:'outline small',onclick:async()=>{const {openTemplateHistory}=await import('/ui/contentos-template-history.js');await openTemplateHistory({id:it.id,request:editorFetch,onApply:version=>applyTpl(version,restyle.checked),onImprove:draft=>{S.lib.saveDraft=draft;S.lib.saving=true;renderLibrary();}});}},'Phiên bản & skill'):null,
        it.installed && it.source !== "custom" ? h("button", { class: "link", onclick: () => uninstallTpl(it) }, "Gỡ") : null,
        it.source === "custom" ? h("button", { class: "link danger", onclick: () => uninstallTpl(it) }, "Xoá") : null)));
}
function playerBlock(it, restyle) {
  return h("div", { class: "lib-player" },
    h("video", { src: it.preview, controls: true, autoplay: true, playsinline: true }),
    h("div", { class: "lib-player-info" },
      h("div", { class: "lib-name", style: "font-size:20px" }, it.name),
      h("div", { class: "lib-desc" }, it.description || ""),
      h("div", { class: "lib-tags" }, (it.industries || it.tags || []).map((t) => h("span", {}, t))),
      h("div", { class: "lib-actions" },
        it.locked && !it.installed
          ? h("button", { class: "primary", onclick: () => openWebTpl(it) }, `Mẫu ${TIER_NAME[it.tier]} — tải trên website`)
          : it.installed
          ? h("button", { class: "primary", onclick: () => applyTpl(it, restyle.checked) }, "Áp dụng vào video này")
          : h("button", { class: "primary", onclick: () => installTpl(it) }, "Tải về mẫu này"),
        h("button", { class: "ghost", onclick: () => { S.lib.playing = null; renderLibrary(); } }, "Đóng xem trước")),
      h("div", { class: "help" }, "Tải về sẽ cài phong cách + skill dựng của mẫu vào phần mềm. Áp dụng chỉ đổi kiểu dáng (font, màu, phụ đề, chuyển cảnh, màu video, hiệu ứng chữ) — nội dung và các đoạn cắt của bạn được giữ nguyên.")));
}
function saveTplForm() {
  const draft=S.lib.saveDraft||{},parentId=draft.parentId||P().template?.id;
  const mode=h('select',{'aria-label':'Cách lưu mẫu'},h('option',{value:'new'},'Mẫu mới'),parentId?h('option',{value:'revision'},'Phiên bản cải tiến của mẫu đang dùng'):null);
  const changeNote=h('input',{maxlength:3000,placeholder:'VD: nhạc nhỏ hơn, ít SFX, đổi font tiêu đề'});
  const name = h("input", { placeholder: "Tên mẫu, VD: Review công nghệ – kênh A" });
  const desc = h("textarea", { rows: 2, placeholder: "Mô tả ngắn: hợp loại video nào, nhịp ra sao" });
  const skill = h("textarea", { rows: 4, placeholder: "Quy tắc dựng cho AI (tuỳ chọn): nhịp chữ, kiểu cảnh nên dùng, cách cắt…" });
  const ind = h("input", { placeholder: "VD: Bất động sản, Tài chính – Đầu tư" });
  mode.value=draft.mode==='new'?'new':parentId?'revision':'new';name.value=draft.name||'';desc.value=draft.description||'';skill.value=draft.skill||'';ind.value=(draft.industries||[]).join(', ');changeNote.value=draft.changeNote||'';
  const scopeHelp=h('p',{class:'help','aria-live':'polite','data-template-save-scope':''});
  const updateScope=()=>{scopeHelp.textContent=mode.value==='revision'?'Giữ các preset chữ/đồ họa và quy tắc của mẫu gốc; lấy phong cách và cấu hình âm thanh bạn vừa chỉnh. Để trống Skill để giữ quy tắc gốc.':'Tạo mẫu phong cách mới từ font/màu/phụ đề, chuyển cảnh và cấu hình âm thanh. Không tự sao chép preset đồ họa của mẫu đang dùng.';};
  mode.addEventListener('change',updateScope);updateScope();
  const retain=()=>{S.lib.saveDraft={mode:mode.value,parentId:mode.value==='revision'?parentId:null,name:name.value,description:desc.value,skill:skill.value,industries:ind.value.split(',').map(s=>s.trim()).filter(Boolean),changeNote:changeNote.value};};
  for(const input of [mode,name,desc,skill,ind,changeNote])input.addEventListener('input',retain);
  return h("div", { class: "lib-save" },
    field('Cách lưu',mode),scopeHelp,field('Ghi chú cải tiến',changeNote),h('p',{class:'help'},'Không sao chép lời thoại, clip, cue SFX hoặc file nhạc riêng. Mẫu cũ được giữ nguyên; nhạc có sẵn của bộ công cụ có thể dùng lại. Lưu mẫu không tự áp dụng vào dự án.'),
    h("div", { class: "row" }, field("Tên mẫu", name), field("Mô tả", desc)),
    field("Ngành phù hợp (cách nhau dấu phẩy)", ind),
    field("Skill cho AI", skill),
    h("div", { class: "btns", style: "border:0;padding-top:0" },
      h("button", { class: "primary small", onclick: async event => {
        if (!name.value.trim()) return toast("Đặt tên cho mẫu.", true);
        event.target.disabled=true;
        try{
        const response=await editorFetch("/api/templates", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.value.trim(), description: desc.value.trim(), skill: skill.value, parentId:mode.value==='revision'?parentId:undefined,changeNote:changeNote.value, industries: ind.value.split(",").map((x) => x.trim()).filter(Boolean), project: P() }) });
        const r=await response.json();if(!response.ok||!r.ok)throw new Error(r.error||'Không lưu được mẫu.');
        S.lib.items = r.items;
        S.lib.saving = false;
        S.lib.saveDraft=null;
        S.lib.tab = "installed";
        renderLibrary();
        toast(`Đã lưu mẫu “${name.value.trim()}” · phiên bản ${r.version||1}.`);
        }catch(error){toast(error.message,true);}finally{event.target.disabled=false;}
      } }, "Lưu mẫu"),
      h("button", { class: "ghost small", onclick: () => { S.lib.saving = false; renderLibrary(); } }, "Huỷ")));
}
$("#btnLibrary").onclick = () => openLibrary(!S.lib.open);
window.addEventListener("keydown", (e) => { if (e.key === "Escape" && S.lib.open) openLibrary(false); });


// ---------- Khác ----------
let toastTimer;
function toast(msg, err) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.toggle("err", !!err);
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}
const typing = () => /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
window.addEventListener("keydown", (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); e.shiftKey ? saveAs() : save(); return; }
  if (mod && e.key.toLowerCase() === "o") { e.preventDefault(); openProjectFileMenu(); return; }
  if (typing()) return;
  if (S.lib.open) return;
  if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
  else if (e.code === "Space") { e.preventDefault(); togglePlay(); }
  else if (e.key === "Escape" && S.drawer && !S.multi?.length) closeDrawer();
  // Phím tắt timeline theo bộ mặc định của CapCut (Windows)
  else if (S.editorLayout !== 'space' && mod && !e.shiftKey && e.key.toLowerCase() === "b") { e.preventDefault(); splitSelected(); }
  else if (S.editorLayout !== 'space' && mod && e.key.toLowerCase() === "a") { e.preventDefault(); selectAll(); }
  else if (e.key === "Escape" && S.multi.length) { S.multi = []; renderTimeline(); renderInspector(); }
  else if (S.editorLayout !== 'space' && mod && e.key.toLowerCase() === "c" && !String(window.getSelection?.() || "") && CLIP_CLS[selLane()?.key]) { e.preventDefault(); copySelected(); }
  else if (S.editorLayout !== 'space' && mod && e.key.toLowerCase() === "v" && tlClipboard) { e.preventDefault(); pasteClip(); }
  else if (mod && (e.key === "=" || e.key === "+")) { e.preventDefault(); setTlZoom(S.tlZoom + 12); }
  else if (mod && e.key === "-") { e.preventDefault(); setTlZoom(S.tlZoom - 12); }
  else if (!mod && e.shiftKey && e.key.toLowerCase() === "z") $("#tlFit").click();
  else if (S.editorLayout !== 'space' && !mod && e.key.toLowerCase() === "q") trimAtPlayhead("left");
  else if (S.editorLayout !== 'space' && !mod && e.key.toLowerCase() === "w") trimAtPlayhead("right");
  else if (!mod && !e.shiftKey && e.key.toLowerCase() === "a") setTlTool("select");
  else if (!mod && !e.shiftKey && e.key.toLowerCase() === "b") setTlTool("split");
  else if (!mod && e.key.toLowerCase() === "n") setSnap(!S.snap);
  else if (!mod && (e.key === "ArrowUp" || e.key === "ArrowDown") && document.activeElement?.id !== "tlResize" && !document.activeElement?.closest?.("#tlMenu")) { e.preventDefault(); jumpEdit(e.key === "ArrowDown" ? 1 : -1); }
  else if (!mod && e.key.toLowerCase() === "f" && S.editorLayout!=='space') $("#vFocus").click();
  else if (e.key === "ArrowLeft") seek(S.time - (e.shiftKey ? 1 : 1 / 30));
  else if (e.key === "ArrowRight") seek(S.time + (e.shiftKey ? 1 : 1 / 30));
  else if (S.editorLayout!=='space' && (e.key === "Delete" || e.key === "Backspace") && S.tab === "segments" && S.tsel) cutSelection(false);
  else if (S.editorLayout!=='space' && (e.key === "Delete" || e.key === "Backspace") && selected()) deleteSelected();
  else if (S.editorLayout!=='space' && e.key.toLowerCase() === "s" && !mod) $("#tlSplit").click();
});
window.addEventListener("beforeunload", (e) => { if (S.dirty) { e.preventDefault(); e.returnValue = ""; } });
window.addEventListener("resize", () => { renderTimeline(); updateSelection(); });
// Bảng chỉnh trượt ra cạnh cột icon — chỉ mở khi bấm icon / chọn mục trên timeline, cho màn hình gọn.
// Máy tính: bảng chỉnh luôn mở bên trái (kiểu CapCut) · điện thoại: trồi lên khi bấm công cụ
const DESK = matchMedia("(min-width:761px)");
S.drawer = DESK.matches;
document.body.classList.toggle("drawer-open", S.drawer);
const relayout = () => requestAnimationFrame(() => { renderTimeline(); updateSelection(); });
function openDrawer() {
  if (!S.drawer) { S.drawer = true; document.body.classList.add("drawer-open"); relayout(); }
  if (document.body.classList.contains("focus")) { document.body.classList.remove("focus"); relayout(); }
  renderTabs();
}
function closeDrawer() {
  if (DESK.matches) { S.panel = null; renderTabs(); renderList(); renderInspector(); return; }
  S.drawer = false; S.panel = null;
  document.body.classList.remove("drawer-open");
  renderTabs(); relayout();
}
$("#drawerClose").onclick = closeDrawer;
// Kéo mép trên timeline lên / xuống để phóng to / thu nhỏ (nhớ cho lần sau · bấm đúp để trả về)
(() => {
  const KEY = "editor.tlHeight", grip = $("#tlResize");
  let preferred = 0;
  const limits = () => {
    const mobile = innerWidth <= 760;
    const header = document.querySelector('.top')?.getBoundingClientRect().height || (mobile ? 100 : 56);
    return { min: 96, max: Math.max(96, Math.min(Math.round(innerHeight * .72), Math.floor(innerHeight - header - (mobile ? 68 : 0) - (mobile ? 180 : 300)))) };
  };
  const apply = (px) => {
    const { min, max } = limits();
    const height = Math.round(Math.max(min, Math.min(max, px || (innerWidth <= 760 ? innerHeight * .4 : 256))));
    document.body.style.setProperty("--tl-h", height + "px");
    grip.setAttribute('aria-valuemin', String(min));
    grip.setAttribute('aria-valuemax', String(max));
    grip.setAttribute('aria-valuenow', String(height));
    grip.setAttribute('aria-valuetext', `Chiều cao timeline ${height} pixel`);
    relayout();
  };
  try { const v = Number(localStorage.getItem(KEY)); if (Number.isFinite(v) && v > 0) preferred = v; } catch {}
  apply(preferred);
  window.addEventListener('resize', () => apply(preferred));
  grip.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const y0 = e.clientY, h0 = $("#timeline").getBoundingClientRect().height;
    const { max, min } = limits();
    let px = h0;
    document.body.classList.add("tl-dragging"); grip.classList.add("drag");
    const mv = (ev) => { px = Math.round(Math.min(max, Math.max(min, h0 + (y0 - ev.clientY)))); document.body.style.setProperty("--tl-h", px + "px"); };
    const up = () => {
      window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      document.body.classList.remove("tl-dragging"); grip.classList.remove("drag");
      preferred = px;
      try { localStorage.setItem(KEY, String(px)); } catch {}
      apply(preferred);
    };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  });
  const reset = () => { preferred = 0; try { localStorage.removeItem(KEY); } catch {} apply(0); };
  grip.addEventListener("dblclick", reset);
  grip.addEventListener('keydown', (e) => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter'].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'Enter') return reset();
    const { min, max } = limits();
    const height = Number(grip.getAttribute('aria-valuenow')) || 256;
    preferred = Math.max(min, Math.min(max, e.key === 'Home' ? min : e.key === 'End' ? max : height + (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 48 : 16)));
    try { localStorage.setItem(KEY, String(preferred)); } catch {}
    apply(preferred);
  });
})();
// Chỉ xem video: ẩn bảng chỉnh + timeline
$("#vFocus").onclick = () => { const on = document.body.classList.toggle("focus"); if (on) closeDrawer(); $("#vFocus").classList.toggle("on", on); relayout(); };
// Menu "⋯"
const more = $("#moreMenu");
$("#btnMore").onclick = (e) => { e.stopPropagation(); const open = more.classList.toggle("show"); $("#btnMore").setAttribute("aria-expanded", open); };
document.addEventListener("click", (e) => { if (!e.target.closest(".more")) { more.classList.remove("show"); $("#btnMore").setAttribute("aria-expanded", "false"); } });
more.addEventListener("click", (e) => { if (e.target.closest("button,a")) { more.classList.remove("show"); $("#btnMore").setAttribute("aria-expanded", "false"); } });
document.addEventListener('keydown', e => { if(e.key==='Escape'&&more.classList.contains('show')){more.classList.remove('show');$('#btnMore').setAttribute('aria-expanded','false');$('#btnMore').focus();} });
$("#btnUndo").onclick = undo;
$("#btnRedo").onclick = redo;
$("#btnSave").onclick = save;
$("#btnSaveAs").onclick = saveAs;
$("#btnOpenFile").onclick = openProjectFileMenu;
// Tự lưu bản khôi phục mỗi 30 giây khi còn chỉnh sửa chưa lưu (không thay project.json; lưu thật thì xoá)
setInterval(() => {
  if (!S.dirty || !S.editorReady || S.conflict || !S.dir) return;
  editorFetch("/api/project-recovery", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(P()) }).catch(() => {});
}, 30000);
const RECOVERY_LIVE_MS = 90000; // tự lưu 30 giây/lần: bản mới hơn mức này là cửa sổ khác còn đang chỉnh
// Đếm nhanh để người dùng thấy bản tự lưu khác bản đã lưu ở đâu trước khi chọn.
function recoveryDiff(saved, rec) {
  const n = (p, k) => (k === "captions" ? p?.captions?.lines : p?.[k])?.length || 0;
  return [["captions", "dòng phụ đề"], ["texts", "khối chữ"], ["scenes", "cảnh trám"], ["blocks", "đồ hoạ"], ["segments", "đoạn cắt"]]
    .filter(([k]) => n(saved, k) !== n(rec, k)).map(([k, label]) => `${label}: đã lưu ${n(saved, k)} → tự lưu ${n(rec, k)}`);
}
async function offerRecovery(info) {
  const at = new Date(info.savedAt).toLocaleString("vi-VN");
  if (Date.now() - new Date(info.savedAt).getTime() < RECOVERY_LIVE_MS) return toast("Dự án này đang được chỉnh ở cửa sổ khác. Chỉ chỉnh và Lưu ở một cửa sổ để không ghi đè nhau.", true);
  let diff = [];
  try { diff = recoveryDiff(P(), (await api("/api/project-recovery")).recovery?.project); } catch {}
  const d = h("dialog", { style: "max-width:520px;width:calc(100% - 32px);background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:16px;padding:24px", "aria-label": "Khôi phục bản tự lưu" },
    h("h2", {}, "Khôi phục chỉnh sửa chưa lưu?"),
    h("p", {}, `Dự án có bản tự lưu lúc ${at} chưa được lưu (phần mềm hoặc trình duyệt đóng khi còn chỉnh sửa).`),
    diff.length ? h("ul", { class: "help", style: "margin:0 0 16px;padding-left:18px" }, diff.map((x) => h("li", {}, x))) : h("p", { class: "help" }, "Số mục giống bản đã lưu; khác biệt nằm ở chi tiết chỉnh sửa."),
    h("div", { style: "display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap" },
      h("button", { class: "ghost", onclick: async () => { d.close(); try { await api("/api/project-recovery", "DELETE"); } catch {} } }, "Bỏ bản tự lưu"),
      h("button", { class: "primary", onclick: async () => {
        d.close();
        try {
          const r = await api("/api/project-recovery");
          if (!r.recovery) return toast("Không còn bản tự lưu.", true);
          snapshot(); S.project = r.recovery.project; S.groupOpen = false;
          changed({ inspector: true }); renderList();
          toast("Đã khôi phục — bấm Lưu để giữ.");
        } catch (e) { toast(e.message, true); }
      } }, ico("restore"), "Khôi phục")));
  d.onclose = () => d.remove();
  document.body.append(d); d.showModal();
}
// ===================== Ảnh bìa: khung hình đẹp + chữ tiêu đề lớn theo font / màu thương hiệu → renders/anh-bia-<n>.jpg =====================
const COVER_LOOK = [["mau", "Theo mẫu"], ["trang", "Trắng viền đen"], ["vang", "Vàng nổi bật"]];
const COVER_POS = [["top", "Trên"], ["mid", "Giữa"], ["bot", "Dưới"]];
const COVER_ALIGN = [['left','Trái'],['center','Giữa'],['right','Phải']];
async function loadCoverFont(fam) {
  const spec = FONTS[fam] || (ensureBrand().fonts || []).find((x) => x.split(":")[0] === fam)?.replace(/ /g, "+");
  if (spec && !spec.startsWith('local:') && !document.querySelector(`link[data-cover-font="${fam}"]`)) {
    document.head.append(h("link", { rel: "stylesheet", "data-cover-font": fam, href: `https://fonts.googleapis.com/css2?family=${spec.replace(/ /g, "+")}&display=block&subset=vietnamese` }));
  }
  try { await Promise.all([document.fonts.load(`900 100px "${fam}"`, "ẮÂÊÔƠƯĐ"), document.fonts.load(`700 100px "${fam}"`, "ẮÂÊÔƠƯĐ")]); } catch {}
}
function coverTitle() {
  const t = itemsOf("texts").filter((x) => !x.hidden).sort((a, b) => (a.at || 0) - (b.at || 0))[0];
  if (t?.title) return t.title.replace(/[*|]/g, " ").replace(/\s+/g, " ").trim();
  const b = itemsOf("blocks").find((x) => !x.hidden && x.html);
  const txt = b && new DOMParser().parseFromString(b.html.replace(/></g, "> <"), "text/html").body.textContent.replace(/\s+/g, " ").trim();
  return (txt || P().title || "").slice(0, 60);
}
function openCover() {
  document.querySelector(".exp-pop, .exp-modal")?.remove();
  const wide = P().format === "16:9", W = wide ? 1920 : 1080, H = wide ? 1080 : 1920;
  if(S.coverDir!==S.dir){S.cover=null;S.coverDir=S.dir;}
  const st = (S.cover = S.cover || { title: coverTitle(), subtitle:'',cta:'',size: wide ? 140 : 130, pos: "top", look: "mau" });
  const coverProject=P(),coverDir=S.dir,coverWorkspace=P().workspaceId;
  const validateCover=()=>{if(P()!==coverProject||S.dir!==coverDir||P().workspaceId!==coverWorkspace)throw new Error('Dự án đã đổi. Mở lại công cụ ảnh bìa.');};
  const cv = h("canvas", { width: W, height: H, style: `width:${wide ? 380 : 216}px;height:${wide ? 214 : 384}px;border-radius:10px;background:#000;align-self:center` });
  const img = new Image();
  const coverNotice=h('p',{'data-cover-notice':'',role:'status'});let coverLayoutError='';
  let srcT = S.tm.outToSrc(S.time);
  const grab = () => { delete st.backgroundImageId; srcT = S.tm.outToSrc(S.time); img.src = `/api/thumb?src=${encodeURIComponent(P().source?.video || "")}&t=${srcT.toFixed(1)}&w=${W}`; };
  img.onload = () => draw();
  const draw = async () => {
    const b = ensureBrand(), fam = b.fontTitle || "Anton";
    await loadCoverFont(fam);
    const x = cv.getContext("2d"), col = P().camera?.color || {};
    x.clearRect(0, 0, W, H);
    // khung hình phủ kín (cắt giữa) + màu hình của dự án
    if (img.naturalWidth) {
      const k = Math.max(W / img.naturalWidth, H / img.naturalHeight), iw = img.naturalWidth * k, ih = img.naturalHeight * k;
      x.filter = `brightness(${col.brightness ?? 1}) contrast(${col.contrast ?? 1}) saturate(${col.saturate ?? 1})`;
      x.drawImage(img, (W - iw) / 2, (H - ih) * (P().camera?.faceY ?? 0.36) * 0.6, iw, ih);
      x.filter = "none";
    }
    // chữ tiêu đề: tự xuống dòng trong 88% bề ngang, in hoa
    const size = Number(st.size) || 130, text = String(st.title || "").toUpperCase().trim();
    x.font = `900 ${size}px "${fam}", sans-serif`;
    const lines = [];
    for (const para of text.split(/\n/)) {
      let cur = "";
      for (const w of para.split(/\s+/).filter(Boolean)) { const t = cur ? cur + " " + w : w; if (x.measureText(t).width > W * 0.88 && cur) { lines.push(cur); cur = w; } else cur = t; }
      if (cur) lines.push(cur);
    }
    const wrapExtra=(value,fontSize)=>{x.font=`700 ${fontSize}px "${fam}", sans-serif`;const rows=[];for(const para of String(value||'').trim().split('\n')){let row='';for(const word of para.split(/\s+/).filter(Boolean)){const next=row?row+' '+word:word;if(row&&x.measureText(next).width>W*.88){rows.push(row);row=word;}else row=next;}if(row)rows.push(row);}return rows;};
    const subSize=Math.round(size*.42),ctaSize=Math.round(size*.4),subRows=wrapExtra(st.subtitle,subSize),ctaRows=wrapExtra(st.cta,ctaSize);
    const statRows=(st.stats||[]).flatMap(item=>wrapExtra([item.value,item.label].filter(Boolean).join(' · '),subSize));
    const statHeight=statRows.length?size*.3+statRows.length*subSize*1.15:0;
    const lh = size * 1.08, bh = lines.length * lh, subHeight=subRows.length?size*.3+subRows.length*subSize*1.15:0,ctaY=H*.94-ctaRows.length*ctaSize*1.15,contentBottom=ctaRows.length?ctaY-size*.5:H*.9,contentHeight=bh+subHeight+statHeight,y0=st.pos==='mid'?(H*.1+contentBottom-contentHeight)/2:st.pos==='bot'?contentBottom-contentHeight:H*.1;
    coverLayoutError=y0<H*.07||y0+contentHeight>contentBottom?'Chữ vượt vùng ảnh bìa. Giảm cỡ chữ hoặc rút ngắn nội dung trước khi lưu.':'';coverNotice.textContent=coverLayoutError;
    // dải tối mờ sau chữ cho dễ đọc
    const g = x.createLinearGradient(0, y0 - size, 0, y0 + bh + size);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.5, "rgba(0,0,0,.55)"); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(0, y0 - size, W, bh + size * 2);
    x.textAlign = st.align||'center'; const textX=st.align==='left'?W*.06:st.align==='right'?W*.94:W/2;
    x.textBaseline = "top"; x.lineJoin = "round";
    x.font = `900 ${size}px "${fam}", sans-serif`;
    lines.forEach((l, i) => {
      const y = y0 + i * lh;
      x.lineWidth = size * 0.16; x.strokeStyle = "#0a0a0a";
      x.shadowColor = "rgba(0,0,0,.55)"; x.shadowBlur = size * 0.25; x.shadowOffsetY = size * 0.06;
      x.strokeText(l, textX, y,W*.88);
      x.shadowColor = "transparent";
      if (st.look === "mau") {
        const tg = x.createLinearGradient(0, y, 0, y + size);
        tg.addColorStop(0, b.c1 || "#fff"); tg.addColorStop(0.55, b.c2 || b.c1 || "#fff"); tg.addColorStop(1, b.c3 || b.c2 || "#fff");
        x.fillStyle = tg;
      } else x.fillStyle = st.look === "vang" ? "#FFD84A" : "#FFFFFF";
      x.fillText(l, textX, y,W*.88);
    });
    const drawExtra=(rows,fontSize,top,color)=>{
      x.font=`700 ${fontSize}px "${fam}", sans-serif`;
      x.lineWidth=fontSize*.12;x.strokeStyle='#0a0a0a';x.fillStyle=color;
      rows.forEach((line,i)=>{x.strokeText(line,textX,top+i*fontSize*1.15,W*.88);x.fillText(line,textX,top+i*fontSize*1.15,W*.88);});
    };
    drawExtra(subRows,subSize,y0+bh+size*.3,'#fff');
    drawExtra(statRows,subSize,y0+bh+subHeight+size*.3,b.c2||'#FFD84A');
    drawExtra(ctaRows,ctaSize,ctaY,b.c2||'#FFD84A');
  };
  const ta = h("textarea", { rows: 2, style: "resize:vertical", placeholder: "Chữ tiêu đề trên ảnh bìa (xuống dòng = Enter)" }, st.title);
  ta.oninput = () => { st.title = ta.value; draw(); };
  ta.maxLength=2000;ta.dataset.coverTitle='';
  const subtitle=h('textarea',{rows:2,maxlength:1000,'data-cover-subtitle':'',placeholder:'Phụ đề (tùy chọn)'},st.subtitle||'');subtitle.oninput=()=>{st.subtitle=subtitle.value;draw();};
  const cta=h('input',{maxlength:200,'data-cover-cta':'',value:st.cta||'',placeholder:'Kêu gọi hành động (tùy chọn)'});cta.oninput=()=>{st.cta=cta.value;draw();};
  const statFields=h('div',{'data-cover-stats':''});
  function renderStats(){
    statFields.replaceChildren();
    for(const [index,item] of (st.stats||[]).entries()){
      const value=h('input',{value:item.value,maxlength:100,placeholder:'Giá trị',style:'min-width:0;flex:1','aria-label':'Giá trị chỉ số '+(index+1)}),label=h('input',{value:item.label,maxlength:100,placeholder:'Nhãn',style:'min-width:0;flex:1','aria-label':'Nhãn chỉ số '+(index+1)});
      value.oninput=()=>{item.value=value.value;draw();};label.oninput=()=>{item.label=label.value;draw();};
      statFields.append(h('div',{style:'display:flex;gap:6px;margin:6px 0'},value,label,h('button',{class:'ghost small',onclick:()=>{st.stats.splice(index,1);renderStats();draw();},'aria-label':'Xóa chỉ số '+(index+1)},'×')));
    }
    statFields.append(h('button',{class:'outline small',disabled:(st.stats||[]).length>=12,onclick:()=>{st.stats=st.stats||[];st.stats.push({label:'',value:''});renderStats();}},'Thêm chỉ số'));
  }
  renderStats();
  const size = h("input", { type: "range", min: 60, max: 240, step: 2, value: st.size });
  size.oninput = () => { st.size = Number(size.value); draw(); };
  const chips = (list, key) => h("div", { class: "chips" }, list.map(([k, t]) => h("button", { class: `chip ${st[key] === k ? "on" : ""}`, onclick: (e) => {
    st[key] = k; e.target.parentElement.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c === e.target)); draw();
  } }, t)));
  const save = h("button", { class: "primary small", onclick: async () => {
    save.disabled = true;
    try {
      validateCover();
      await img.decode();
      await draw();
      if(coverLayoutError)throw new Error(coverLayoutError);
      const blob = await new Promise((r) => cv.toBlob(r, "image/jpeg", 0.92));
      if(!blob)throw new Error('Không tạo được ảnh bìa.');
      validateCover();
      const metadata={source:st.backgroundImageId?{kind:'image',id:st.backgroundImageId}:{kind:'video-frame',video:P().source?.video||'',time:srcT},composition:{title:String(st.title||''),subtitle:String(st.subtitle||''),cta:String(st.cta||''),size:Number(st.size),pos:st.pos,look:st.look,align:st.align||'center',stats:st.stats||[]}};
      const j = await (await editorFetch("/api/cover", { method: "POST", headers:{'X-ContentOS-Cover':encodeURIComponent(JSON.stringify(metadata))}, body: blob })).json();
      if (!j.ok) throw new Error(j.error || "Không lưu được.");
      const a = h("a", { href: URL.createObjectURL(blob), download: j.name });
      document.body.append(a); a.click(); a.remove();
      toast(`Đã lưu ảnh bìa: ${j.path} (và tải về máy).`);
      await refreshCovers();
    } catch (e) { toast(e.message, true); }
    save.disabled = false;
  } }, "Lưu ảnh bìa");
  const savedCovers=h('select',{'data-saved-covers':'','aria-label':'Ảnh bìa đã lưu'},h('option',{value:''},'Chọn bản đã lưu để sửa tiếp'));
  const savedNotice=h('p',{'data-saved-cover-status':'',role:'status'});
  const coverQuery='/api/v1/publish-covers?workspaceId='+encodeURIComponent(coverWorkspace||'default')+'&dir='+encodeURIComponent(coverDir);
  async function refreshCovers(){try{validateCover();const response=await editorFetch(coverQuery),result=await response.json();if(!response.ok)throw new Error(result.error||'Không đọc được ảnh bìa.');validateCover();savedCovers.replaceChildren(h('option',{value:''},'Chọn bản đã lưu để sửa tiếp'),...result.covers.map(c=>h('option',{value:c.name,disabled:!!c.error},c.name+(c.error?' · '+c.error:''))));}catch(error){savedNotice.textContent=error.message;}}
  const loadSaved=h('button',{class:'outline small','data-load-cover':'',onclick:async()=>{
    if(!savedCovers.value){savedNotice.textContent='Chọn một ảnh bìa đã lưu.';return;}loadSaved.disabled=true;
    try{validateCover();const response=await editorFetch(coverQuery+'&name='+encodeURIComponent(savedCovers.value)+'&edit=1'),record=await response.json();if(!response.ok)throw new Error(record.error||'Không mở được cấu hình ảnh bìa.');validateCover();
      const url=record.source.kind==='image'?'/api/v1/images/'+record.source.id+'/file':'/api/thumb?src='+encodeURIComponent(record.source.video)+'&t='+record.source.time+'&w='+W;
      const loaded=new Image();loaded.src=url;await loaded.decode();validateCover();
      Object.assign(st,record.composition,{subtitle:record.composition.subtitle||'',cta:record.composition.cta||'',align:record.composition.align||'center',stats:record.composition.stats||[]});renderStats();if(record.source.kind==='image')st.backgroundImageId=record.source.id;else{delete st.backgroundImageId;srcT=record.source.time;}
      img.src=url;ta.value=st.title;subtitle.value=st.subtitle;cta.value=st.cta;size.value=st.size;pop.querySelectorAll('[data-cover-position] button').forEach((button,i)=>button.classList.toggle('on',COVER_POS[i][0]===st.pos));pop.querySelectorAll('[data-cover-look] button').forEach((button,i)=>button.classList.toggle('on',COVER_LOOK[i][0]===st.look));pop.querySelectorAll('[data-cover-align] button').forEach((button,i)=>button.classList.toggle('on',COVER_ALIGN[i][0]===st.align));await draw();savedNotice.textContent='Đã mở '+record.name+'. Dùng font/màu thương hiệu hiện tại; Lưu tạo bản mới, giữ bản cũ.';
    }catch(error){savedNotice.textContent=error.message;}finally{loadSaved.disabled=false;}
  }},'Mở bản đã lưu để sửa');
  const pop = h("div", { class: "exp-pop" }, h("b", {}, "🖼 Ảnh bìa"),
    h("div", { class: "help" }, "Tua video tới khung đẹp (mặt rõ, đang cười / biểu cảm) rồi bấm “Lấy khung hiện tại”. Chữ dùng font và màu thương hiệu của dự án."),
    cv,coverNotice,savedCovers,loadSaved,savedNotice,
    h("div", { class: "btns" }, h("button", { class: "outline small", onclick: grab }, "Lấy khung hiện tại"),h('button',{class:'outline small',onclick:async()=>{
      const {openImageTool}=await import('/ui/contentos-images.js');
      const selectImage=async(item,url)=>{validateCover();const check=new Image();check.src=url;await check.decode();validateCover();img.src=url;st.backgroundImageId=item.id;};
      await openImageTool({request:editorFetch,projectMedia:true,onSelected:selectImage,onSelectedComposition:async(item,url)=>{const composition=coverFromAievImage(item);if(!composition)throw new Error('Ảnh không có chữ AIEV hỗ trợ.');await selectImage(item,url);Object.assign(st,composition);renderStats();ta.value=st.title;subtitle.value=st.subtitle;cta.value=st.cta;pop.querySelectorAll('[data-cover-position] button').forEach((button,i)=>button.classList.toggle('on',COVER_POS[i][0]===st.pos));pop.querySelectorAll('[data-cover-align] button').forEach((button,i)=>button.classList.toggle('on',COVER_ALIGN[i][0]===st.align));await draw();}});
    }},'Chọn / Tạo ảnh AI')),
    field("Chữ tiêu đề", ta),field('Phụ đề',subtitle),field('CTA',cta),h('details',{},h('summary',{},'Chỉ số / thông tin sản phẩm'),statFields),field("Cỡ chữ", size), field("Vị trí chữ", h('div',{'data-cover-position':''},chips(COVER_POS, "pos"))),field('Căn chữ',h('div',{'data-cover-align':''},chips(COVER_ALIGN,'align'))), field("Kiểu chữ", h('div',{'data-cover-look':''},chips(COVER_LOOK, "look"))),
    h("div", { class: "btns" }, h("button", { class: "ghost small", onclick: () => pop.remove() }, "Đóng"), save));
  pop.style.maxHeight='calc(100vh - 78px)';pop.style.overflowY='auto';
  document.body.append(pop);
  grab();
  refreshCovers();
}
$("#btnCover").onclick = openCover;
$("#btnCoverM").onclick = () => { more.classList.remove('show'); $("#btnMore").setAttribute('aria-expanded','false'); openCover(); };
$("#btnLibraryM").onclick = () => { more.classList.remove('show'); $("#btnMore").setAttribute('aria-expanded','false'); $("#btnLibrary").click(); };
$("#btnDraft").onclick = () => exportBox("draft");
$("#btnDraftM").onclick = () => exportBox("draft");
$("#btnFinal").onclick = () => exportBox("final");
$("#btnCapcut").onclick = $("#btnCapcutM").onclick = () => capcutBox();
async function revealSaved(file) {
  if (!file) return;
  try { await api("/api/reveal", "POST", { path: file }); } catch (e) { toast(e.message, true); }
}
// Chọn thời gian đăng: Đăng ngay / Hẹn giờ (ngày + giờ) → get() trả ISO hoặc "" (đăng ngay); null = giờ hẹn không hợp lệ
function whenPicker(nowLabel = "Đăng ngay") {
  const d = new Date(Date.now() + 3600e3); d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  const local = (x) => new Date(x.getTime() - x.getTimezoneOffset() * 60e3).toISOString().slice(0, 16);
  const name = "when-" + Math.random().toString(36).slice(2, 7);
  const now = h("input", { type: "radio", name, checked: true }), later = h("input", { type: "radio", name });
  const at = h("input", { type: "datetime-local", value: local(d), min: local(new Date()), style: "flex:1;min-width:0" });
  const sync = () => { at.disabled = !later.checked; at.style.opacity = later.checked ? 1 : 0.45; };
  now.onchange = later.onchange = sync; at.onfocus = () => { later.checked = true; sync(); };
  sync();
  const el = h("div", { class: "when", style: "display:flex;flex-direction:column;gap:6px;margin:6px 0" },
    h("b", { style: "font-size:12px" }, "Thời gian đăng"),
    h("label", { class: "row", style: "gap:8px;font-size:13px" }, now, nowLabel),
    h("label", { class: "row", style: "gap:8px;font-size:13px;align-items:center" }, later, "Hẹn giờ:", at));
  const get = () => {
    if (!later.checked) return "";
    const t = new Date(at.value);
    return isNaN(t) || t.getTime() < Date.now() + 60e3 ? null : t.toISOString();
  };
  return { el, get };
}
const whenText = (iso) => new Date(iso).toLocaleString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
// Đăng tự động (gói Pro+): chọn kênh đã lưu ở màn hình Mạng xã hội → AI viết content từng kênh + đăng
async function postBox(file) {
  document.querySelector(".exp-pop")?.remove();
  let d;
  try { d = await api("/api/social"); } catch (e) { return toast(e.message, true); }
  const close = () => pop.remove();
  const pop = h("div", { class: "exp-pop" }, h("b", {}, "📣 Đăng tự động lên mạng xã hội"));
  if (!d.allowed) {
    pop.append(h("div", { class: "help" }, `Tính năng dành cho gói Pro trở lên${d.account?.email ? ` — tài khoản ${d.account.email} đang ở gói ${({ none: "CHƯA KÍCH HOẠT", free: "BASIC" })[d.plan || "free"] || String(d.plan).toUpperCase()}` : ""}.`),
      h("div", { class: "btns" }, h("button", { class: "outline small", onclick: close }, "Đóng"),
        h("button", { class: "primary small", onclick: () => { close(); window.__openUpgrade?.(); } }, "Nâng cấp gói")));
  } else if (!d.channels.length) {
    pop.append(h("div", { class: "help" }, "Chưa lưu kênh nào. Thêm kênh ở màn hình chính → Mạng xã hội."),
      h("div", { class: "btns" }, h("button", { class: "outline small", onclick: close }, "Đóng"),
        h("a", { href: "/#social", target: "_blank" }, h("button", { class: "primary small" }, "Thêm kênh"))));
  } else {
    const boxes = d.channels.map((c) => {
      const cb = h("input", { type: "checkbox", checked: c.auto !== false });
      cb.dataset.id = c.id;
      return h("label", { class: "row", style: "gap:8px;font-size:13px" }, cb, `${c.platform} — ${c.name || c.url}`);
    });
    const note = h("textarea", { rows: 3, placeholder: "Ghi chú cho AI (không bắt buộc): VD nhắc ưu đãi tuần này, link inbox…", style: "width:100%" });
    const when = whenPicker();
    const go = async () => {
      const channels = boxes.map((l) => l.querySelector("input")).filter((x) => x.checked).map((x) => x.dataset.id);
      if (!channels.length) return toast("Chọn ít nhất 1 kênh.", true);
      const scheduleAt = when.get();
      if (scheduleAt === null) return toast("Giờ hẹn phải sau bây giờ ít nhất 1 phút.", true);
      try {
        const r = await api("/api/social/post", "POST", { file, channels, note: note.value, scheduleAt });
        close();
        if (r.scheduled) toast(`Đã lên lịch đăng ${whenText(r.scheduled.at)} — xem ở màn hình chính → Mạng xã hội.`);
        else toast(r.listener ? "Đã giao AI — xem tiến trình trong cửa sổ Claude / Codex." : "Đã tạo việc đăng bài — dán “đăng bài đang chờ trong phần mềm” vào Claude / Codex.");
      } catch (e) { toast(e.message, true); }
    };
    pop.append(h("div", { class: "help" }, "AI xem nội dung video, viết content đúng tiêu chí từng kênh rồi đăng bằng trình duyệt (đã đăng nhập sẵn các kênh). Bấm Đăng = đồng ý đăng công khai lên các kênh đã chọn."),
      ...boxes, when.el, note,
      h("div", { class: "btns" }, h("button", { class: "outline small", onclick: close }, "Huỷ"), h("button", { class: "primary small", onclick: go }, "Đăng")));
  }
  document.body.append(pop);
}
// Hộp xuất video (kiểu CapCut): hộp giữa màn hình — ảnh video bên trái, bên phải: thư mục lưu (đổi được, nhớ cho lần sau),
// thông số, và (Xuất Final, gói Pro+) thẻ kênh mạng xã hội để AI xuất xong tự đăng
const PLAT = { tiktok: ["TikTok", "#25F4EE"], facebook: ["Facebook", "#1877F2"], instagram: ["Instagram", "#E1306C"], youtube: ["YouTube Shorts", "#FF0033"],
  threads: ["Threads", "#ffffff"], linkedin: ["LinkedIn", "#0A66C2"], x: ["X (Twitter)", "#ffffff"], zalo: ["Zalo OA", "#0068FF"] };
// Hiệu ứng văn bản ⭐ lấy từ CapCut (editor/tools/capcut-favorites.mjs) → lưu vào dự án, gói "Dễ sửa chữ" ghi tên để áp trong CapCut
function capcutFxPicker() {
  const box = h("div", { class: "capcut-fx" }, h("div", { class: "help" }, "Đang tải hiệu ứng ⭐ CapCut…"));
  fetch("/ui/capcut-text-effects/effects.json").then((r) => (r.ok ? r.json() : null)).catch(() => null).then((data) => {
    const list = data?.effects || [];
    if (!list.length) { box.replaceChildren(h("div", { class: "help" }, "Chưa có hiệu ứng ⭐ CapCut. Chạy: node editor/tools/capcut-favorites.mjs")); return; }
    const grid = h("div", { class: "capcut-fx-grid", role: "radiogroup", "aria-label": "Hiệu ứng văn bản CapCut" });
    const paint = () => {
      const cur = P().capcutTextEffect?.id || "";
      grid.replaceChildren(...[{ id: "", title: "Không áp" }, ...list].map((e) =>
        h("button", { class: "capcut-fx-item" + (e.id === cur ? " on" : ""), role: "radio", "aria-checked": String(e.id === cur), title: e.title,
          onclick: () => { snapshot(); if (e.id) P().capcutTextEffect = { id: e.id, title: e.title }; else delete P().capcutTextEffect; S.groupOpen = false; S.dirty = true; renderStatus(); paint(); } },
          e.cover ? h("img", { src: "/ui/capcut-text-effects/" + e.cover, alt: "", loading: "lazy" }) : h("span", { class: "capcut-fx-none" }, "⦸"),
          h("span", {}, e.title))));
    };
    paint();
    box.replaceChildren(h("b", {}, `Hiệu ứng chữ ⭐ CapCut (${list.length})`), grid);
  });
  return box;
}
// Chọn kiểu gói CapCut: chữ nhấn giữ đúng mẫu hay sửa được chữ
function capcutBox() {
  document.querySelector(".exp-pop, .exp-modal")?.remove();
  const close = () => { modal.remove(); document.removeEventListener("keydown", esc); };
  const esc = (e) => { if (e.key === "Escape") close(); };
  const pick = (chu, label, hint) => h("button", { class: "outline capcut-pick", onclick: () => { close(); renderCapcut(chu); } }, h("b", {}, label), h("span", { class: "help" }, hint));
  const card = h("div", { class: "exp-card slim", role: "dialog", "aria-modal": "true", "aria-label": "Bản sửa CapCut" },
    h("div", { class: "exp-top" }, h("b", {}, "Bản sửa CapCut"), h("button", { class: "ghost small exp-x", "aria-label": "Đóng", onclick: close }, "✕")),
    h("div", { class: "capcut-body" },
      h("div", { class: "help" }, "Tạo gói gồm video đã cắt, phụ đề, đồ hoạ, cảnh trám và âm thanh. Nhạc, thuyết minh, SFX và tiếng cảnh trám xuất thành file riêng khi có; đặt các file âm thanh tại 00:00 theo hướng dẫn trong gói."),
      pick("dep", "Giữ đẹp như mẫu", "Chữ nhấn là file video, đúng kiểu mẫu, không sửa được nội dung chữ."),
      pick("sua", "Dễ sửa chữ", "Chữ nhấn thành chữ thật trong CapCut; hướng dẫn trong gói ghi hiệu ứng ⭐ đã chọn bên dưới để áp."),
      capcutFxPicker()));
  const modal = h("div", { class: "exp-modal", onpointerdown: (e) => { if (e.target === modal) close(); } }, card);
  document.body.append(modal);
  document.addEventListener("keydown", esc);
}
async function exportBox(quality) {
  document.querySelector(".exp-pop, .exp-modal")?.remove();
  const final = quality === "final";
  let info = { dir: "", def: "" };
  try { info = await api("/api/export-dir"); } catch {}
  // Nơi lưu + tên file (kiểu Export Settings của Premiere): đổi được bằng hộp Lưu của Windows hoặc gõ tên
  const autoName = () => `${S.name}-${quality === "draft" ? "nhap" : "final"}.mp4`;
  let nameEdited = false;
  const splitFullPath = (raw) => {
    const s = String(raw || "").trim().replace(/^["']+|["']+$/g, "");
    if (!/^(?:[a-zA-Z]:[\\/]|\\\\|\/)/.test(s) || !/[\\/]/.test(s)) return null;
    const sep = Math.max(s.lastIndexOf("\\"), s.lastIndexOf("/"));
    if (sep <= 0) return null;
    const dir = s.slice(0, sep) || s.slice(0, sep + 1);
    const base = s.slice(sep + 1).replace(/\.(?:mp4\.)?json$/i, "");
    return { dir, base };
  };
  const nameEl = h("input", { type: "text", value: autoName(), "aria-label": "Tên file video", spellcheck: false, oninput: () => {
    nameEdited = true;
    const sp = splitFullPath(nameEl.value);
    if (sp && sp.base) { info.dir = sp.dir; nameEl.value = sp.base; paint(); }
  } });
  const qualityEl = h("select", { "aria-label": "Chất lượng", onchange: () => { quality = qualityEl.value; if (!nameEdited) nameEl.value = autoName(); qualTag.textContent = quality === "draft" ? "Nháp · nhanh" : "Chất lượng cao"; } },
    h("option", { value: "final" }, "Cao (xuất bản)"), h("option", { value: "draft" }, "Nháp (nhanh)"));
  qualityEl.value = quality;
  const qualTag = h("span", {}, final ? "Chất lượng cao" : "Nháp · nhanh");
  const pathEl = h("input", { type: "text", class: "exp-path", "aria-label": "Thư mục lưu video", spellcheck: false, placeholder: info.def || "VD: D:\\Video hoặc \\\\NAS\\...", oninput: () => {
    const v = pathEl.value.trim().replace(/^["']+|["']+$/g, "");
    if (/\.(?:mp4(?:\.json)?|mov)$/i.test(v)) {
      const sp = splitFullPath(v);
      if (sp) { info.dir = sp.dir; if (sp.base) { nameEl.value = sp.base; nameEdited = true; } paint(); return; }
    }
    info.dir = v;
    pathEl.title = v || info.def;
    reset.style.display = info.dir && info.dir !== info.def ? "" : "none";
  } });
  const paint = () => {
    pathEl.value = info.dir || info.def;
    pathEl.title = pathEl.value;
    reset.style.display = info.dir && info.dir !== info.def ? "" : "none";
  };
  const change = h("button", { class: "outline small", onclick: async () => {
    change.disabled = true; change.textContent = "Đang mở…";
    try { const r = await api("/api/export-target", "POST", { pick: true, dir: pathEl.value.trim() || info.dir || info.def, name: nameEl.value }); if (!r.cancelled) { info.dir = r.dir; nameEl.value = r.name; nameEdited = true; } } catch (e) { toast(e.message, true); }
    change.disabled = false; change.replaceChildren(ico("folder"), "Chọn nơi lưu…"); paint();
  } }, ico("folder"), "Chọn nơi lưu…");
  const reset = h("button", { class: "link small", onclick: async () => { await api("/api/export-dir", "POST", { reset: true }); info.dir = ""; paint(); } }, "Mặc định");
  // Xuất Final: thẻ kênh (gói Pro+) → giao AI xuất (+ đăng) — tải lại trang không mất việc
  const social = h("div", { class: "exp-social" });
  const goBtn = h("button", { class: "primary", onclick: () => go() }, ico("export"), final ? "Xuất video" : "Dựng nháp");
  let cards = [], note = null, when = null;
  const sync = () => {
    const n = cards.filter((c) => c.on).length;
    goBtn.replaceChildren(ico("export"), !final ? "Dựng nháp" : n ? `Xuất & đăng ${n} kênh` : "Xuất video");
    social.classList.toggle("has-pick", n > 0);
  };
  if (final) {
    social.append(h("div", { class: "exp-h" }, "Tự động đăng"), h("div", { class: "help" }, "Đang tải kênh…"));
    api("/api/social").then((d) => {
      social.innerHTML = "";
      social.append(h("div", { class: "exp-h" }, "Tự động đăng", h("span", { class: "exp-tag" }, "Pro")));
      if (!d.allowed) {
        social.append(h("div", { class: "exp-empty" }, "Xuất xong AI tự viết content và đăng lên TikTok, Facebook, YouTube… dành cho gói Pro trở lên. ",
          h("a", { href: "#", onclick: (e) => { e.preventDefault(); window.__openUpgrade?.(); } }, "Nâng cấp gói")));
        return;
      }
      if (!d.channels.length) {
        social.append(h("div", { class: "exp-empty" }, "Chưa lưu kênh nào. ", h("a", { href: "/#social", target: "_blank" }, "Thêm kênh"), " rồi mở lại hộp này."));
        return;
      }
      cards = d.channels.map((c) => {
        const [label, col] = PLAT[c.platform] || [c.platform, "#888"];
        const card = { id: c.id, on: false };
        card.el = h("button", { type: "button", class: "exp-ch", "aria-pressed": "false", title: c.url || "", onclick: () => {
          card.on = !card.on; card.el.classList.toggle("on", card.on); card.el.setAttribute("aria-pressed", String(card.on)); sync();
        } },
          h("i", { class: "exp-ico", style: `--pc:${col}` }, label[0]),
          h("span", { class: "exp-cn" }, h("b", {}, c.name || label), h("small", {}, label)),
          h("span", { class: "exp-tick" }));
        return card;
      });
      note = h("textarea", { rows: 2, placeholder: "Ghi chú cho AI viết content (không bắt buộc): ưu đãi, link inbox…" });
      when = whenPicker("Đăng ngay khi xuất xong");
      social.append(h("div", { class: "help" }, "Chọn kênh muốn đăng — AI xuất xong viết content đúng tiêu chí từng kênh rồi đăng giúp bạn. Không chọn = chỉ xuất video."),
        h("div", { class: "exp-chs" }, cards.map((c) => c.el)),
        h("div", { class: "exp-more" }, when.el, note));
    }).catch(() => (social.innerHTML = ""));
  }
  const close = () => { modal.remove(); document.removeEventListener("keydown", esc); };
  const esc = (e) => { if (e.key === "Escape") close(); };
  const go = async () => {
    const channels = cards.filter((c) => c.on).map((c) => c.id);
    const chosenDir = pathEl.value.trim() || info.dir || info.def;
    let t;
    try { t = await api("/api/export-target", "POST", { dir: chosenDir, name: nameEl.value }); } catch (e) { return toast(e.message, true); }
    if (t.exists && !confirm(`"${t.name}" đã có trong thư mục:\n${t.dir}\n\nGhi đè file này?`)) return nameEl.focus();
    const target = { dir: t.dir, name: t.name, overwrite: !!t.exists };
    // chỉ xuất (không đăng kênh nào): phần mềm tự xuất ngay, không cần Claude/Codex; AI chỉ dùng khi cần viết content + đăng
    if (!final || !channels.length) {
      close();
      return render(quality, target);
    }
    const scheduleAt = channels.length && when ? when.get() : "";
    if (scheduleAt === null) return toast("Giờ hẹn phải sau bây giờ ít nhất 1 phút.", true);
    close();
    renderAi(quality, channels, note?.value || "", scheduleAt, target);
  };
  const src = P().source?.video, dur = S.tm?.total || 0, wide = isWide();
  const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
  const card = h("div", { class: `exp-card ${final ? "" : "slim"}`, role: "dialog", "aria-modal": "true", "aria-label": final ? "Xuất video" : "Dựng nháp" },
    h("div", { class: "exp-top" }, h("b", {}, final ? "Xuất video" : "Dựng nháp"), h("button", { class: "ghost small exp-x", "aria-label": "Đóng", onclick: close }, "✕")),
    h("div", { class: "exp-body" },
      h("div", { class: `exp-thumb ${wide ? "wide" : ""}`, style: bg(thumbUrl(src, Math.round(S.tm?.outToSrc?.(S.time) || 1))) },
        h("span", {}, mmss(dur))),
      h("div", { class: "exp-side" },
        h("div", { class: "exp-specs" },
          h("span", {}, wide ? "1920×1080" : "1080×1920"), h("span", {}, "30 fps"), h("span", {}, "MP4"), qualTag),
        h("label", { class: "exp-h" }, "Chất lượng"), qualityEl,
        h("label", { class: "exp-h" }, "Tên file"), nameEl,
        h("div", { class: "exp-h" }, "Lưu vào"),
        h("div", { class: "exp-dir" }, pathEl, change, reset),
        final?h('button',{class:'outline small',onclick:async()=>{if(S.dirty)return toast('Lưu bản dựng trước khi soạn nội dung phát hành.',true);const {openPublishDrafts}=await import('/ui/contentos-publish-drafts.js');await openPublishDrafts({dir:S.dir,revision:S.revision,request:editorFetch});}},'Nội dung phát hành theo kênh'):null,
        social)),
    h("div", { class: "exp-foot" }, h("button", { class: "ghost", onclick: close }, "Huỷ"), goBtn));
  const modal = h("div", { class: "exp-modal", onpointerdown: (e) => { if (e.target === modal) close(); } }, card);
  document.body.append(modal);
  document.addEventListener("keydown", esc);
  paint();
  goBtn.focus();
}
$("#btnPlay").onclick = togglePlay;
$("#btnLite").classList.toggle("on", !!S.lite);
$("#btnLite").onclick = () => { S.liteAsked = true; setLite(!S.lite); };
$("#btnBack").onclick = () => seek(S.time - 1);
$("#btnFwd").onclick = () => seek(S.time + 1);
$("#search").addEventListener("input", renderList);
$("#showSafe").addEventListener("change", (e) => $("#safe").classList.toggle("show", e.target.checked));

// AI đang edit chính dự án đang mở → thanh tiến trình nổi trên editor (%, bước), xong thì tải lại bản AI vừa dựng
// giữ khớp EDIT_STEPS trong editor/ui/home.js · editor/server.mjs · editor/tools/ai-inbox.mjs
const AI_STEPS = ["Nhận việc", "Đọc lời nói", "Cắt vấp, khoảng lặng", "Chữ edit, hiệu ứng, zoom theo mẫu", "Phụ đề, tiếng hiệu ứng, nhạc nền", "Tách nền, kiểm tra", "Dựng bản xem trước"];
function watchAiJob(dir) {
  if (!dir) return;
  const bar = document.body.appendChild(h("div", { class: "ai-run", hidden: true, role: "status" }));
  let open = false, was = null, timer = 0;
  const later = (ms) => { clearTimeout(timer); timer = setTimeout(tick, ms); };
  const tick = async () => {
    let r;
    try { r = await api(`/api/ai-job?dir=${encodeURIComponent(dir)}`); } catch { return later(4000); }
    const jb = r.job, st = jb?.status;
    if (st === "done" && (was === "working" || was === "waiting")) {
      bar.hidden = false;
      bar.className = "ai-run ok";
      bar.innerHTML = "";
      bar.append(h("b", {}, "AI đã edit xong video này"), h("button", { class: "primary small", onclick: () => location.reload() }, "Tải bản mới"));
      return;
    }
    was = st;
    if (st !== "working" && st !== "waiting" && st !== "error") { bar.hidden = true; return later(5000); }
    if (jb.kind) { bar.hidden = true; return later(5000); } // xuất video / đăng bài: có tiến độ riêng
    const pr = r.progress?.n ? r.progress : null, who = jb.agent === "codex" ? "Codex" : "Claude";
    bar.hidden = false;
    bar.className = "ai-run" + (st === "error" ? " err" : "");
    bar.innerHTML = "";
    if (st === "error") bar.append(h("b", {}, "AI báo lỗi khi edit video này"), h("span", { class: "ar-sub" }, jb.error || ""));
    else if (st === "waiting") bar.append(h("b", {}, "Chưa bắt đầu edit video"), h("span", { class: "ar-sub" }, "Việc đang chờ AI nhận — xem ở màn hình chính."));
    else {
      bar.append(
        h("div", { class: "ar-top" }, h("b", {}, `${who} đang edit video này`), h("span", { class: "ar-pct" }, pr ? `${pr.pct}%` : ""),
          h("button", { class: "link", onclick: () => { open = !open; later(0); } }, open ? "Ẩn các bước" : "Xem các bước")),
        h("div", { class: "ar-bar" }, h("i", { style: `width:${pr?.pct || 3}%` })),
        h("span", { class: "ar-sub" }, pr ? `Bước ${pr.n}/${pr.total}: ${pr.step}${r.progress.detail ? ` — ${r.progress.detail}` : ""}` : "Đang bắt đầu…",
          " · Chờ AI xong rồi hãy chỉnh, kẻo bị ghi đè."),
        open && pr ? h("ol", { class: "ar-steps" }, AI_STEPS.map((s, i) => h("li", { class: i + 1 < pr.n ? "ok" : i + 1 === pr.n ? "on" : "" }, h("i", {}, i + 1 < pr.n ? "✓" : String(i + 1)), s))) : null);
    }
    later(2500);
  };
  tick();
}

(async function init() {
  const res = await editorFetch("/api/project");
  if (res.status === 409) { location.href = "/home"; return; }
  const j = await res.json();
  S.project = j.project;
  S.dir = j.dir;
  S.revision=j.revision;
  S.media = j.media;
  S.name = j.name;
  S.transcript = j.transcript;
  S.projectFile = j.projectFile || "";
  try{S.ai.completionMode=(await api('/api/completion-policy')).effective.mode;}catch{S.ai.completionMode='review';}
  S.ai.useWorkspaceBrand=false;
  S.ai.creativeBrief={};
  try{
    const saved=JSON.parse(localStorage.getItem(aiViewKey())||'null');
    if(saved){S.ai.useWorkspaceBrand=saved.useWorkspaceBrand===true;if(saved.creativeBrief&&typeof saved.creativeBrief==='object')S.ai.creativeBrief={styleId:typeof saved.creativeBrief.styleId==='string'?saved.creativeBrief.styleId:'',promptId:typeof saved.creativeBrief.promptId==='string'?saved.creativeBrief.promptId:''};if(['auto-export','review'].includes(saved.completionMode))S.ai.completionMode=saved.completionMode;S.ai.text=typeof saved.draft==='string'?saved.draft:'';S.ai.msgs=Array.isArray(saved.messages)?saved.messages.filter(m=>typeof m.text==='string').slice(-100):[];S.editorLayout=saved.layout;if((['session','cli'].includes(saved.execution?.mode)&&['auto','codex','claude'].includes(saved.execution?.agent)||saved.execution?.mode==='api'&&saved.execution?.agent==='gateway'))S.ai.execution=saved.execution;}
  }catch{}
  $("#projName").textContent = j.name;
  document.title = `${j.name} · Video Editor`;
  $("#safe").classList.add("show");
  recalc();
  renderStatus(); renderTabs(); renderList(); renderInspector(); renderTimeline();
  refreshAsr().then((a) => { updateAsr(); if (a?.job?.running) pollAsr(); });
  loadPresets();
  loadKho();
  await api("/api/build", "POST", P());
  reloadPlayer();
  S.editorReady=true;renderList();
  showProjectFile();
  if (j.recovery) offerRecovery(j.recovery);
  setEditorLayout(S.editorLayout||'studio');
  recoverReviseJob();
  watchAiJob(j.dir);
  // bản xem trước nhẹ (video / tách nền thu nhỏ) đang tạo nền → xong thì tự tải lại xem trước cho mượt
  (async function waitProxy(seen = false) {
    let n = 0;
    try { n = (await api("/api/proxy-status")).pending; } catch { return; }
    if (n) return setTimeout(() => waitProxy(true), 5000);
    if (seen) { reloadPlayer(); toast("Đã chuyển sang bản xem trước nhẹ — phát mượt hơn."); }
  })();
  // đang xuất video dở (AI hoặc phần mềm) → hiện lại tiến độ sau khi tải lại trang
  // đang xuất → theo dõi tiếp; vừa xong/lỗi/huỷ trong 30 phút → vẫn hiện kết quả trên thanh trạng thái (không mở lại bảng chỉnh)
  readRenderJob().then((r) => { if (r.running) { S.job = r; pollRender(); } else if (r.startedAt && r.finishedAt) { S.lastJob = r; paintExportStrip(); } }).catch((e) => console.error("Trạng thái xuất video:", e));
  // Filmstrip + waveform tính lần đầu mất vài giây, sau đó dùng cache.
  // Liên kết "Mở trong phần mềm" từ website thư viện: ?install=<id>
  const inst = new URLSearchParams(location.search).get("install");
  if (inst) {
    history.replaceState(null, "", location.pathname);
    editorFetch(`/api/library/install?id=${encodeURIComponent(inst)}`, { method: "POST" }).then((r) => r.json()).then((r) => {
      if (!r.ok) return toast(r.error || "Không cài được mẫu.", true);
      toast("Đã tải mẫu về phần mềm. Bấm “Áp dụng vào video này”.");
      S.lib.tab = "installed";
      openLibrary(true);
    });
  }
  if(P().segments.some(s=>s.src)) {
    S.sourceTimelines={};
    await loadSourceTimelines();
  } else {
    api("/api/strip").then((st) => { S.strip = st; renderTimeline(); }).catch(() => {});
    api("/api/wave").then((wv) => { S.wave = wv; renderTimeline(); }).catch(() => {});
  }
})();





