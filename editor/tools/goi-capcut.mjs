#!/usr/bin/env node
// Xuất gói để chỉnh tiếp trong CapCut: video đã cắt (không chữ), phụ đề .srt, lớp đồ hoạ nền trong suốt, cảnh trám, nhạc + tiếng hiệu ứng.
// Tiến độ ghi vào <dự án>/work/render.json như xuất video → editor tự hiện, bấm Huỷ được.
//   node editor/tools/goi-capcut.mjs <thư mục dự án> [--chu dep|sua]
//   --chu dep: chữ nhấn là file video, giữ đúng kiểu mẫu · sua: chữ nhấn thành file .srt, sửa được chữ trong CapCut
// In ra dòng cuối: SAVED <thư mục gói>
import fs from "node:fs";
import path from "node:path";
import { spawn, execFileSync, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildHtml, resolveTimeline, parseTitle, frameOf } from "../lib/build.mjs";
import {packageCapcutWatermark} from '../lib/capcut-watermark.mjs';
import {capcutAudioGroups,capcutAudioMix} from '../lib/capcut-audio.mjs';
import {packageCapcutTextEffect} from '../lib/capcut-text-effect.mjs';
import { HF } from "../lib/hf.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const dirArg = args.find((a) => !a.startsWith("--"));
const editableText = args.includes("--chu") && args[args.indexOf("--chu") + 1] === "sua";
if (!dirArg) { console.error("Dùng: node editor/tools/goi-capcut.mjs <thư mục dự án> [--chu dep|sua]"); process.exit(1); }
const PROJECT = path.resolve(ROOT, dirArg);
const PJ = path.join(PROJECT, "project.json");
if (!fs.existsSync(PJ)) { console.error("Không thấy project.json trong " + PROJECT); process.exit(1); }

const slug = path.basename(PROJECT);
const STATUS = path.join(PROJECT, "work", "render.json");
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; } };
const st = { running: true, capcut: true, quality: "final", progress: 0, ok: null, log: "", pid: process.pid, startedAt: Date.now() };
const save = () => { if (!st.cancel && readJson(STATUS)?.cancel) st.cancel = true; fs.mkdirSync(path.dirname(STATUS), { recursive: true }); fs.writeFileSync(STATUS, JSON.stringify(st, null, 2)); };
save();

const OUT = path.join(PROJECT, "renders", `capcut-${slug}`);
const TEMP = ["capcut-sach.html", "capcut-lop.html"].map((f) => path.join(PROJECT, f));
const LAYER_MOV = path.join(PROJECT, "work", "capcut-lop.mov");
const cleanup = () => { for (const f of [...TEMP, LAYER_MOV]) try { fs.rmSync(f, { force: true }); } catch {} };
let child = null;
const killTree = () => {
  if (!child) return;
  try {
    if (process.platform === "win32") execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" });
    else process.kill(-child.pid, "SIGKILL");
  } catch {}
};
class Cancelled extends Error {}
const watch = setInterval(() => { if (readJson(STATUS)?.cancel && !st.cancel) { st.cancel = true; killTree(); } }, 800);
const checkCancel = () => { if (st.cancel) throw new Cancelled(); };

// dựng 1 file html, tiến độ quy về đoạn [from, to] của cả gói
function render(html, output, format, from, to) {
  checkCancel();
  const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const TMP = path.join(ROOT, "tools", "tmp-render");
  fs.mkdirSync(TMP, { recursive: true });
  const a = [HF, "render", "--composition", path.basename(html), "--fps", "30", "--output", output, ...(format ? ["--format", format] : ["--quality", "high"])];
  return new Promise((resolve, reject) => {
    child = spawn(cmd, a, { cwd: PROJECT, shell: process.platform === "win32", detached: process.platform !== "win32",
      env: { ...process.env, FORCE_COLOR: "0", TEMP: TMP, TMP, TMPDIR: TMP, HF_CAPTURE_PARALLEL_STREAM: "true" } });
    let last = 0;
    const onData = (d) => {
      const s = d.toString().replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");
      st.log = (st.log + s).slice(-6000);
      const m = s.match(/(\d{1,3}(?:\.\d+)?)\s*%/g);
      if (m) st.progress = Math.round(from + ((to - from) * Math.min(100, parseFloat(m[m.length - 1]))) / 100);
      if (Date.now() - last > 700) { last = Date.now(); save(); }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("close", (code) => {
      child = null;
      if (st.cancel) return reject(new Cancelled());
      code === 0 && fs.existsSync(path.resolve(PROJECT, output)) ? resolve() : reject(new Error("Dựng lỗi:\n" + st.log.slice(-1500)));
    });
  });
}

const ffmpeg = (...a) => execFileSync("ffmpeg", ["-v", "error", "-y", ...a], { cwd: PROJECT, stdio: "ignore" });
const stamp = (t) => { const d = Math.round(t * 10); return `${String(Math.floor(d / 600)).padStart(2, "0")}-${String(Math.floor(d / 10) % 60).padStart(2, "0")}-${d % 10}`; };
const clock = (t) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${(t % 60).toFixed(1).padStart(4, "0")}`;
const srtTime = (t) => {
  const ms = Math.round(t * 1000), p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
const srt = (items) => items.map((x, i) => `${i + 1}\n${srtTime(x.start)} --> ${srtTime(x.end)}\n${x.text}\n`).join("\n");
// Phụ đề theo từng từ / khối của mẫu → dòng dễ sửa: tối đa 7 từ, xuống dòng ở dấu câu hoặc chỗ ngừng nói
function captionLines(caps) {
  const words = caps.flatMap((c) => c.words.map((w) => ({ w: String(w.w).normalize("NFC"), s: c.start + w.s, e: c.start + w.e }))).sort((a, b) => a.s - b.s);
  const lines = [];
  let cur = null;
  for (const x of words) {
    if (!cur || cur.n >= 7 || x.s - cur.end > 0.6 || /[.,?!…:;]$/.test(cur.text)) { cur = { start: x.s, end: x.e, text: x.w, n: 1 }; lines.push(cur); }
    else { cur.text += " " + x.w; cur.end = Math.max(cur.end, x.e); cur.n++; }
  }
  lines.forEach((l, i) => { const next = lines[i + 1]; l.end = Math.max(l.end, l.start + 0.6); if (next && l.end > next.start) l.end = next.start; });
  return lines;
}
const plainTitle = (raw) => parseTitle(raw).map((l) => l.map((w) => w.t).join(" ")).join("\n");

// Bản dựng đầy đủ làm chuẩn thời gian âm thanh: lấy đúng các thẻ <audio> → trộn bằng ffmpeg (không phải dựng hình)
function mixAudio(tags, out, total) {
  if (!tags.length) return false;
  const {inputs,script:mixScript}=capcutAudioMix(tags,total);
  const script = path.join(PROJECT, "work", "capcut-mix.txt");
  fs.writeFileSync(script,mixScript);
  try { ffmpeg(...inputs, "-/filter_complex", script, "-map", "[out]", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", out); }
  finally { fs.rmSync(script, { force: true }); }
  return true;
}

async function main() {
  // index.html không dùng tới, nhưng bản dựng đầy đủ cần cho âm thanh
  const project = JSON.parse(fs.readFileSync(PJ, "utf8"));
  const r = resolveTimeline(project), total = r.tm.total;
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const rel = (f) => path.relative(PROJECT, f).replace(/\\/g, "/");
  const lines = [];
  const {W,H}=frameOf(project);
  const logo=packageCapcutWatermark(project,PROJECT,OUT,{width:W,height:H},total);
  if(logo)lines.push(logo.instruction);

  // 1. Video chính: giữ cắt, zoom, màu; bỏ chữ, phụ đề, cảnh minh hoạ, cảnh trám, nhạc, tiếng hiệu ứng
  const full = buildHtml(structuredClone(project), PROJECT);
  const bare = structuredClone(project);
  delete bare.watermark;
  Object.assign(bare, { texts: [], scenes: [], brolls: [], blocks: [] });
  bare.captions = { ...(bare.captions || {}), enabled: false };
  bare.audio = { ...(bare.audio || {}), music: "", sfx: [], clips: [], sfxLevel: "tat", autoSfx: false };
  fs.writeFileSync(TEMP[0], buildHtml(bare, PROJECT));
  const video = path.join(OUT, "1-video-da-cat.mp4");
  const overlayItems = [...(editableText ? [] : r.texts), ...r.scenes, ...r.blocks];
  await render(TEMP[0], rel(video), null, 0, overlayItems.length ? 45 : 80);

  // 2. Phụ đề + chữ nhấn dạng chữ thật
  const caps = captionLines(r.caps);
  if (caps.length) { fs.writeFileSync(path.join(OUT, "2-phu-de.srt"), srt(caps)); lines.push("- Phụ đề: Captions > Add Captions > Import file > chọn 2-phu-de.srt"); }
  if (editableText && r.texts.length) {
    const items = r.texts.map((t) => ({ start: t.start, end: t.start + t.dur, text: plainTitle(t.title || "") })).filter((x) => x.text);
    if (items.length) { fs.writeFileSync(path.join(OUT, "2-chu-nhan.srt"), srt(items)); lines.push("- Chữ nhấn: nhập 2-chu-nhan.srt giống phụ đề rồi chọn kiểu chữ trong CapCut"); }
  }
  if (fs.readdirSync(OUT).some((f) => f.endsWith(".srt"))) {
    const fx = packageCapcutTextEffect(project, path.join(ROOT, "editor", "ui"), OUT);
    if (fx) lines.push(fx);
  }

  // 3. Lớp đồ hoạ: dựng 1 lượt nền trong suốt rồi cắt theo từng đoạn có đồ hoạ (đoạn chồng / sát nhau gộp làm 1)
  if (overlayItems.length) {
    const top = structuredClone(project);
    delete top.watermark;
    Object.assign(top, { brolls: [], vfx: [], ...(editableText ? { texts: [] } : {}) });
    top.captions = { ...(top.captions || {}), enabled: false };
    let html = buildHtml(top, PROJECT)
      .replace(/<!--beauty-->[\s\S]*?<!--\/beauty-->/, "")
      .replace(/<audio\s[\s\S]*?<\/audio>/g, "")
      .replace("</head>", `<style>html,body,#root{background:transparent!important}#cam,#matte,#board,#flashLayer,#trLayer{display:none!important}</style>\n</head>`);
    fs.writeFileSync(TEMP[1], html);
    await render(TEMP[1], rel(LAYER_MOV), "mov", 45, 85);
    const dir = path.join(OUT, "3-lop-do-hoa");
    fs.mkdirSync(dir);
    const spans = [];
    for (const it of overlayItems.map((x) => [x.start, x.start + x.dur]).sort((a, b) => a[0] - b[0])) {
      const l = spans[spans.length - 1];
      if (l && it[0] <= l[1] + 0.2) l[1] = Math.max(l[1], it[1]); else spans.push([...it]);
    }
    for (const [i, [a, b]] of spans.entries()) {
      checkCancel();
      const name = `${stamp(a)}_do-hoa-${i + 1}.mov`;
      ffmpeg("-ss", a.toFixed(3), "-t", (b - a).toFixed(3), "-i", rel(LAYER_MOV), "-c", "copy", "-an", rel(path.join(dir, name)));
    }
    lines.push(`- Đồ hoạ: kéo từng file trong 3-lop-do-hoa lên track trên video, đặt vào đúng mốc ghi ở tên file (00-12-5 = phút 00, giây 12,5)`);
  }
  st.progress = 88; save();

  // 4. Cảnh trám: đã cắt đúng đoạn, đúng tốc độ
  if (r.brolls.length) {
    const dir = path.join(OUT, "4-canh-tram");
    fs.mkdirSync(dir);
    for (const [i, b] of r.brolls.entries()) {
      checkCancel();
      const src = path.join(PROJECT, b.src || "");
      if (!b.src || !fs.existsSync(src)) continue;
      if (/\.(png|jpe?g|webp|gif)$/i.test(b.src)) { fs.copyFileSync(src, path.join(dir, `${stamp(b.start)}_canh-tram-${i + 1}${path.extname(b.src)}`)); continue; }
      const speed = Number(b.speed) > 0 ? Number(b.speed) : 1;
      ffmpeg("-ss", String(Number(b.mediaStart) || 0), "-t", (b.dur * speed).toFixed(3), "-i", b.src, "-an", "-vf", `setpts=PTS/${speed}`, "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
        rel(path.join(dir, `${stamp(b.start)}_canh-tram-${i + 1}.mp4`)));
    }
    lines.push("- Cảnh trám: kéo file trong 4-canh-tram lên track trên video, đặt vào đúng mốc ghi ở tên file");
  }

  // 5. Âm thanh: mỗi loại 1 file dài bằng video, đặt ở 00:00 là khớp
  const adir = path.join(OUT, "5-am-thanh");
  fs.mkdirSync(adir);
  const groups=capcutAudioGroups(full,PROJECT),audioManifest=[];
  for(const group of groups){
    checkCancel();mixAudio(group.tags,rel(path.join(adir,group.file)),total);
    audioManifest.push({kind:group.kind,file:'5-am-thanh/'+group.file,label:group.label,start:0,duration:total,clips:group.tags});
  }
  if(groups.length){
    lines.push('- Âm thanh: kéo từng file trong 5-am-thanh vào một track riêng, đặt tất cả tại 00:00; thuyết minh và nhạc được tách để chỉnh độc lập.');
    for(const group of groups)lines.push('- '+group.file+': '+group.label+'.');
    fs.writeFileSync(path.join(OUT,'audio-tracks.json'),JSON.stringify({schemaVersion:1,duration:total,tracks:audioManifest},null,2)+'\n');
  }else fs.rmSync(adir,{recursive:true,force:true});

  fs.writeFileSync(path.join(OUT, "huong-dan.txt"), [`GÓI CHỈNH TRONG CAPCUT — ${project.title || slug} (${clock(total)})`, "",
    "1. Mở CapCut máy tính > Create project, kéo cả thư mục này vào khung Media.",
    "2. Kéo 1-video-da-cat.mp4 xuống timeline, đặt sát 00:00. Đây là mốc chuẩn cho mọi file khác.",
    ...lines.map((l, i) => `${i + 3}. ${l.slice(2)}`), "",
    "Muốn sửa nội dung chữ trong file đồ hoạ: sửa trong phần mềm rồi xuất lại gói.", ""].join("\r\n"));

  // chép sang thư mục người dùng đã chọn
  st.saved = video;
  const dest = readJson(path.join(ROOT, "workspace", "settings.json"))?.exportDir;
  if (dest && path.resolve(dest) !== path.resolve(PROJECT, "renders")) {
    try {
      let to = path.join(dest, `capcut-${slug}`);
      for (let k = 2; fs.existsSync(to); k++) to = path.join(dest, `capcut-${slug}-${k}`);
      fs.cpSync(OUT, to, { recursive: true });
      st.saved = path.join(to, "1-video-da-cat.mp4");
    } catch (e) { st.saveError = "Không chép được sang thư mục đã chọn: " + e.message; }
  }
  st.output = rel(video);
  try { st.probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_name,width,height", "-of", "json", video], { encoding: "utf8" })); } catch {}
}

try {
  await main();
  st.ok = true; st.progress = 100;
  console.log("✓ Xong gói CapCut");
  console.log("SAVED " + path.dirname(st.saved));
} catch (e) {
  st.ok = false;
  if (e instanceof Cancelled) { st.cancelled = true; st.log = "Người dùng đã huỷ xuất gói CapCut."; fs.rmSync(OUT, { recursive: true, force: true }); }
  else { st.log = (st.log + "\n" + (e?.message || e)).slice(-6000); console.error("✗ " + st.log.slice(-1500)); }
  process.exitCode = 1;
}
clearInterval(watch);
cleanup();
st.running = false; st.finishedAt = Date.now();
save();
