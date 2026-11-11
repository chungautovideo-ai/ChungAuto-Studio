#!/usr/bin/env node
// Cắt clip ngắn: 1 video dài (livestream, podcast, webinar) → nhiều clip hay nhất, mỗi clip 1 dự án riêng (9:16 / 16:9), caption từng nền tảng.
//   node editor/tools/cat-clip.mjs --cau <dir>     in lời nói theo câu kèm giây (để AI chọn đoạn) — cần work/transcript.json
//   node editor/tools/cat-clip.mjs --buoc <dir> <số>  báo bước đang làm
//   node editor/tools/cat-clip.mjs --tao <dir>     đọc work/clips.json → cắt video, tạo dự án con (lời đã nhận, cắt khoảng lặng, phụ đề),
//                                                  caption từng nền tảng (content.md), việc AI edit theo mẫu nếu người dùng bật
// work/clips.json = [{ k, start, end, title, hook, score (1–10), reason, faceX (0–1, tâm người khi cắt dọc từ video ngang),
//                     captions: { tiktok, reels, shorts, facebook, youtube } }]   — start / end = giây trong video dài
import fs from "node:fs";
import path from "node:path";
import { spawnSync, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { groupCaptionLines } from "../lib/brand.js";
import { buildProject } from "../lib/build.mjs";
import { prepareTools } from "../lib/system.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; } };
const writeJson = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2) + "\n");
const slug = (s) => String(s || "clip").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase().slice(0, 40) || "clip";
export const STEPS = [["Nhận việc", 4], ["Đọc lời nói", 15], ["Chọn đoạn hay nhất", 40], ["Cắt clip, tạo dự án", 65], ["Viết caption từng nền tảng", 85], ["Xếp hàng edit theo mẫu", 95]];
const dirOf = (d) => {
  const abs = path.resolve(ROOT, d || "");
  if (!fs.existsSync(path.join(abs, "work", "ai-job.json"))) { console.error(`✗ Không thấy việc cắt clip trong ${d}`); process.exit(2); }
  return abs;
};
prepareTools(ROOT);
const words = (abs) => (readJson(path.join(abs, "work", "transcript.json"))?.words || []).map((w) => ({ w: w.word ?? w.w, s: w.start ?? w.s, e: w.end ?? w.e })).filter((w) => w.w);

if (args[0] === "--buoc") {
  const abs = dirOf(args[1]), n = Math.max(1, Math.min(STEPS.length, Math.round(Number(args[2])) || 1));
  writeJson(path.join(abs, "work", "ai-progress.json"), { n, total: STEPS.length, step: STEPS[n - 1][0], pct: STEPS[n - 1][1], at: Date.now(), steps: STEPS.map((s) => s[0]) });
  console.log(`✓ Bước ${n}/${STEPS.length}: ${STEPS[n - 1][0]}`);
} else if (args[0] === "--cau") {
  const abs = dirOf(args[1]), W = words(abs);
  if (!W.length) { console.error("✗ Chưa có lời nói (work/transcript.json) — chờ phần mềm nhận giọng xong hoặc chạy node editor/tools/transcribe.mjs <dir>"); process.exit(1); }
  // gom thành câu: dấu câu hoặc nghỉ > 0,7s
  const out = []; let cur = [];
  W.forEach((w, i) => {
    cur.push(w);
    const nx = W[i + 1];
    if (/[.!?…]$/.test(w.w) || !nx || nx.s - w.e > 0.7 || cur.length >= 40) { out.push(cur); cur = []; }
  });
  const f = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, "0")}`;
  for (const c of out) console.log(`[${c[0].s.toFixed(1)}–${c.at(-1).e.toFixed(1)}] (${f(c[0].s)}) ${c.map((w) => w.w).join(" ")}`);
  console.log(`\n${out.length} câu · ${W.length} từ · dài ${f(W.at(-1).e)}`);
} else if (args[0] === "--tao") {
  const abs = dirOf(args[1]), job = readJson(path.join(abs, "work", "ai-job.json")), pj = readJson(path.join(abs, "project.json"));
  const clips = readJson(path.join(abs, "work", "clips.json"));
  if (!Array.isArray(clips) || !clips.length) { console.error("✗ Ghi work/clips.json trước (mảng { k, start, end, title, hook, score, reason, captions })."); process.exit(1); }
  const src = path.join(abs, pj.source.video), dur = pj.source.duration, W = words(abs);
  const formats = job.formats?.length ? job.formats : ["9:16"];
  const day = new Date().toISOString().slice(0, 10), base = path.basename(abs);
  const errs = [];
  // startText / endText (vài từ đầu / cuối clip, nguyên văn lời nói) → tìm đúng giây của từ đó quanh start / end (±40s) — không cắt giữa câu
  const norm = (t) => String(t || "").normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  const WN = W.map((w) => norm(w.w).join(" "));
  const findPhrase = (text, near, last) => {
    const q = norm(text);
    if (!q.length) return null;
    let best = null;
    for (let i = 0; i + q.length <= W.length; i++) {
      if (Math.abs(W[i].s - near) > 40) continue;
      if (q.every((t, j) => WN[i + j] === t)) { const d = Math.abs(W[i].s - near); if (!best || d < best.d) best = { i, d }; }
    }
    return best ? (last ? W[best.i + q.length - 1].e : W[best.i].s) : null;
  };
  for (const c of clips) {
    if (c.startText) { const t = findPhrase(c.startText, c.start, false); if (t != null) c.start = t; else errs.push(`clip ${c.k}: không thấy startText "${c.startText}" quanh giây ${c.start}`); }
    if (c.endText) { const t = findPhrase(c.endText, c.end, true); if (t != null) c.end = t; else errs.push(`clip ${c.k}: không thấy endText "${c.endText}" quanh giây ${c.end}`); }
  }
  clips.sort((a, b) => a.start - b.start).forEach((c, i) => {
    if (!(c.end > c.start) || c.start < 0 || c.end > dur + 0.5) errs.push(`clip ${c.k}: thời gian sai (${c.start}–${c.end}, video dài ${dur}s)`);
    if (c.end - c.start < 8) errs.push(`clip ${c.k}: quá ngắn (${(c.end - c.start).toFixed(1)}s)`);
    const prev = clips[i - 1];
    if (prev && c.start < prev.end - 0.5) errs.push(`clip ${c.k} chồng lên clip ${prev.k}`);
  });
  if (errs.length) { errs.forEach((e) => console.error("✗ " + e)); process.exit(1); }
  const made = [];
  for (const c of clips) {
    // lấy trọn từ: không cắt giữa từ (lùi / tiến về mép từ gần nhất)
    // từ đầu = từ đầu tiên kết thúc sau start · từ cuối = từ cuối cùng kết thúc trước end (+0,05s dung sai) → lời không dính câu kế
    const w0 = W.find((w) => w.e > c.start + 0.01), w1 = W.filter((w) => w.e <= c.end + 0.05).at(-1);
    const s = Math.max(0, (w0?.s ?? c.start) - 0.15), e = Math.min(dur, (w1?.e ?? c.end) + 0.2);
    const ws0 = w0?.s ?? c.start, we1 = w1?.e ?? c.end;
    for (const fmt of formats) {
      let dir = path.join(ROOT, "workspace", "content", day, `${base}-clip-${c.k}${formats.length > 1 ? (fmt === "16:9" ? "-ngang" : "-doc") : ""}`), n = 2;
      if (c.dir && formats.length === 1) dir = path.join(ROOT, c.dir);
      while (!c.dir && fs.existsSync(dir)) dir = dir.replace(/(-\d+)?$/, `-${n++}`);
      fs.mkdirSync(path.join(dir, "inputs"), { recursive: true });
      fs.mkdirSync(path.join(dir, "work"), { recursive: true });
      const out = path.join(dir, "inputs", "raw.mp4");
      if (!fs.existsSync(out)) {
        const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", s.toFixed(3), "-i", src, "-t", (e - s).toFixed(3), "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
          "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out], { encoding: "utf8" });
        if (r.status !== 0) { console.error(`✗ clip ${c.k}: cắt lỗi ${r.stderr.slice(0, 200)}`); continue; }
      }
      let pr = {};
      try { pr = JSON.parse(execSync(`ffprobe -v error -show_entries stream=codec_type,width,height:format=duration -of json "${out}"`, { encoding: "utf8" })); } catch {}
      const v = (pr.streams || []).find((x) => x.codec_type === "video") || {}, cd = Math.round(Number(pr.format?.duration || e - s) * 1000) / 1000;
      // lời nói của đoạn này (dời mốc về 0) → không phải nghe lại
      const tw = W.filter((w) => w.s >= ws0 - 0.01 && w.e <= we1 + 0.01).map((w) => ({ word: w.w, start: Math.round((w.s - s) * 1000) / 1000, end: Math.round((w.e - s) * 1000) / 1000 }));
      writeJson(path.join(dir, "work", "transcript.json"), { engine: "cat-clip", from: path.relative(ROOT, abs).replace(/\\/g, "/"), language: "vi", createdAt: new Date().toISOString(), words: tw });
      const wide = fmt === "16:9", vertical = v.height > v.width;
      const project = {
        version: 1, title: `${c.title || base + " clip " + c.k}`.slice(0, 80), format: fmt,
        source: { video: "inputs/raw.mp4", width: v.width, height: v.height, duration: cd, hasAudio: true },
        // video ngang cắt thành dọc: đặt người nói vào giữa khung (faceX AI ước lượng)
        camera: { scale: 1, x: 0, y: 0, faceY: 0.36, ...(!wide && !vertical ? { faceX: Math.min(1, Math.max(0, Number(c.faceX ?? 0.5))) } : {}) },
        segments: [{ id: "s1", in: 0, out: cd, keep: true, text: "" }],
        texts: [], zooms: [], scenes: [], brolls: [],
        audio: { voice: 1, music: "", musicVolume: 0.1, sfx: [], sfxVolume: 0.5, autoSfx: true },
        clipOf: { dir: path.relative(ROOT, abs).replace(/\\/g, "/"), k: c.k, start: Math.round(s * 1000) / 1000, end: Math.round(e * 1000) / 1000 },
      };
      fs.writeFileSync(path.join(dir, "project.json"), JSON.stringify(project, null, 2) + "\n");
      // cắt khoảng lặng + phụ đề như video mới tải (nếu không có mẫu edit thì clip vẫn có phụ đề)
      try { execSync(`node "${path.join(ROOT, "editor", "tools", "segments.mjs")}" "${dir}"`, { stdio: "ignore" }); } catch {}
      const p2 = readJson(path.join(dir, "project.json")) || project;
      const cw = tw.map((w, i) => ({ i, w: w.word, s: w.start, e: w.end }));
      p2.captions = { enabled: true, y: wide ? 900 : 1450, x: 0, scale: 1, maxWords: 4, hideOnScenes: false, ...(p2.captions || {}), lines: groupCaptionLines(cw, 4) };
      writeJson(path.join(dir, "project.json"), p2);
      try { buildProject(dir, p2); } catch (er) { console.error(`  clip ${c.k}: dựng xem trước lỗi ${er.message}`); }
      spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", "1", "-i", out, "-frames:v", "1", "-vf", "scale=360:-2", "-q:v", "5", path.join(dir, "poster.jpg")]);
      // caption từng nền tảng
      const C = c.captions || {};
      const md = `# ${c.title || "Clip " + c.k}\n\nHook: ${c.hook || ""}\nĐiểm hay: ${c.score ?? "?"}/10 — ${c.reason || ""}\nĐoạn gốc: ${s.toFixed(1)}s → ${e.toFixed(1)}s (${Math.round(e - s)}s)\n\n` +
        [["TikTok", C.tiktok], ["Instagram Reels", C.reels], ["YouTube Shorts", C.shorts], ["Facebook", C.facebook], ["YouTube", C.youtube]].filter(([, t]) => t).map(([k, t]) => `## ${k}\n${t}\n`).join("\n");
      fs.writeFileSync(path.join(dir, "content.md"), md);
      // người dùng bật "Edit từng clip theo mẫu" → xếp việc AI edit (hộp việc làm lần lượt)
      if (job.editEach && job.template && fs.existsSync(path.join(ROOT, "editor", "templates", job.template, "template.json"))) {
        const tj = readJson(path.join(ROOT, "editor", "templates", job.template, "template.json")) || {};
        writeJson(path.join(dir, "work", "ai-job.json"), { status: "waiting", account: job.account, background: !!job.background, dir: path.relative(ROOT, dir).replace(/\\/g, "/"),
          template: job.template, templateName: tj.name || job.template, assets: [], drive: [], trim: true, fx: job.fx || "vua",
          note: `Clip ${c.k} cắt từ video dài "${base}": ${c.title || ""}. Hook mở đầu: ${c.hook || "(câu đầu)"}. ${job.note || ""}`.trim(), createdAt: new Date().toISOString() });
      }
      made.push({ k: c.k, format: fmt, dir: path.relative(ROOT, dir).replace(/\\/g, "/"), title: c.title, dur: Math.round((e - s) * 10) / 10 });
      console.log(`✓ Clip ${c.k} ${fmt}: ${path.relative(ROOT, dir)} · ${Math.round(e - s)}s · ${c.title || ""}`);
    }
  }
  writeJson(path.join(abs, "work", "clips-made.json"), { at: new Date().toISOString(), clips: made });
  console.log(`\n✓ Đã tạo ${made.length} dự án clip${job.editEach && job.template ? ` — đã xếp ${made.length} việc AI edit theo mẫu "${job.template}" (hộp việc làm lần lượt)` : ""}.`);
} else {
  console.log("Dùng: --cau <dir> · --buoc <dir> <số> · --tao <dir>");
}
