#!/usr/bin/env node
// Phân tích kênh mạng xã hội (gói Pro+): công cụ cho AI làm việc "phân tích kênh" (thư mục workspace/content/_phan-tich-kenh/<id>/)
//   node editor/tools/phan-tich-kenh.mjs --buoc <dir> <số>     báo bước đang làm (phần mềm hiện % + tên bước)
//   node editor/tools/phan-tich-kenh.mjs --tai <dir> [--khong-nghe]  tải video + thumbnail từng bài (yt-dlp, bản nhẹ) → --media
//                                       (--khong-nghe: người dùng KHÔNG tích "Nghe chi tiết" → chỉ thumbnail + khung hình, không nhận giọng)
//   node editor/tools/phan-tich-kenh.mjs --media <dir>          bài nào có file video work/posts/<n>.mp4 → ảnh khung (tấm 4×3) + lời thoại
//   node editor/tools/phan-tich-kenh.mjs --check <dir>          kiểm report.json + TÍNH số liệu thật từ posts.json (lượt xem TB, tương tác…)
// Dữ liệu: work/posts.json = [{ n, url, date, caption, views, likes, comments, shares, saves, duration, ... }]
//          work/report.json = báo cáo (khung ở skill phan-tich-kenh-social) — phần mềm đọc để hiện trang báo cáo
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { transcribe, whisperStatus } from "../lib/whisper.mjs";
import { ytdlpPath, installYtdlp } from "../lib/system.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; } };
const writeJson = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2) + "\n");
export const STEPS = [["Nhận việc", 3], ["Mở kênh, lấy danh sách bài", 12], ["Lấy số liệu từng bài", 30], ["Xem khung hình, nghe lời thoại", 60],
  ["Phân tích định vị, tuyến nội dung, hook", 80], ["Viết báo cáo", 95]];
const dirOf = (d) => {
  const abs = path.resolve(ROOT, d || "");
  if (!fs.existsSync(path.join(abs, "work", "ai-job.json"))) { console.error(`✗ Không thấy việc phân tích trong ${d}`); process.exit(2); }
  return abs;
};
const exe = (n) => (process.platform === "win32" ? n + ".exe" : n);
const ffDir = path.join(ROOT, "tools", "ffmpeg");
const ff = (n) => (fs.existsSync(path.join(ffDir, exe(n))) ? path.join(ffDir, exe(n)) : n);
// nghe tối đa N giây đầu mỗi bài (--nghe <giây>, 0 = cả bài)
const NGHE = args.includes("--nghe") ? Number(args[args.indexOf("--nghe") + 1]) || 0 : 0;
const KHONG_NGHE = args.includes("--khong-nghe");
const VID = /\.(mp4|webm|mov|m4v)$/i;
const videoOf = (pd, n) => (fs.existsSync(pd) ? fs.readdirSync(pd).find((f) => VID.test(f) && f.split(".")[0] === String(n)) : null);

async function media(abs) {
  const pd = path.join(abs, "work", "posts");
  const vids = fs.existsSync(pd) ? fs.readdirSync(pd).filter((f) => VID.test(f) && /^\d+$/.test(f.split(".")[0])) : [];
  if (!vids.length) { console.log("Không có file video nào trong work/posts/ (đặt tên <số bài>.mp4)."); return; }
  const asr = !KHONG_NGHE && whisperStatus(ROOT).ready;
  for (const f of vids.sort((a, b) => parseInt(a) - parseInt(b))) {
    const n = parseInt(f), v = path.join(pd, f), sheet = path.join(pd, `${n}-khung.jpg`), tf = path.join(pd, `${n}-loi.json`), cover = path.join(pd, `${n}-anh.jpg`);
    // 12 khung đều suốt video (khung đầu ≈ hook 0–3s) xếp tấm 4×3
    const dur = Number(spawnSync(ff("ffprobe"), ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", v], { encoding: "utf8" }).stdout) || 30;
    // ảnh đại diện bài (khung ~1,5s = phần hook) cho trang báo cáo
    if (!fs.existsSync(cover)) spawnSync(ff("ffmpeg"), ["-v", "error", "-y", "-ss", String(Math.min(1.5, dur / 3)), "-i", v, "-frames:v", "1", "-vf", "scale=360:-2", "-q:v", "4", cover]);
    if (!fs.existsSync(sheet)) spawnSync(ff("ffmpeg"), ["-v", "error", "-y", "-i", v, "-vf", `fps=${(12 / dur).toFixed(4)},scale=270:-2,tile=4x3`, "-frames:v", "1", sheet]);
    if (asr && !fs.existsSync(tf)) {
      try { await transcribe(ROOT, v, tf, { language: "vi", maxSec: NGHE, vocabulary: false }); } catch (e) { console.error(`  bài ${n}: không nghe được lời (${e.message})`); }
    }
    const text = (readJson(tf)?.words || []).map((w) => w.w ?? w.word ?? w.text).join(" ");
    console.log(`✓ Bài ${n}: ${fs.existsSync(sheet) ? path.relative(ROOT, sheet) : "(không cắt được khung)"} · ${Math.round(dur)}s · ${text ? `lời: ${text.slice(0, 220)}${text.length > 220 ? "…" : ""}` : asr ? "không có lời" : KHONG_NGHE ? "không nghe (người dùng không chọn)" : "chưa cài nhận giọng"}`);
  }
  console.log(`Lời đầy đủ: work/posts/<n>-loi.json · tấm khung: work/posts/<n>-khung.jpg (xem bằng công cụ đọc ảnh).`);
}

if (args[0] === "--buoc") {
  const abs = dirOf(args[1]), n = Math.max(1, Math.min(STEPS.length, Math.round(Number(args[2])) || 1));
  writeJson(path.join(abs, "work", "ai-progress.json"), { n, total: STEPS.length, step: STEPS[n - 1][0], pct: STEPS[n - 1][1], at: Date.now() });
  console.log(`✓ Bước ${n}/${STEPS.length}: ${STEPS[n - 1][0]}`);
} else if (args[0] === "--tai") {
  const abs = dirOf(args[1]), pd = path.join(abs, "work", "posts"), posts = readJson(path.join(abs, "work", "posts.json"));
  if (!Array.isArray(posts) || !posts.length) { console.error("✗ Ghi work/posts.json (có url từng bài) trước."); process.exit(1); }
  let yt = ytdlpPath(ROOT);
  if (!fs.existsSync(yt)) {
    console.log("… cài yt-dlp (~18MB, 1 lần)");
    try { yt = await installYtdlp(ROOT); } catch (e) { console.error(`✗ ${e.message} — xem bài trong trình duyệt thay thế.`); process.exit(1); }
  }
  fs.mkdirSync(pd, { recursive: true });
  let okN = 0;
  for (const p of posts) {
    if (!p.url) continue;
    const hadVideo = !!videoOf(pd, p.n), thumbFile = path.join(pd, `${p.n}-anh.jpg`);
    if (hadVideo && fs.existsSync(thumbFile)) { okN++; continue; }
    // bản ≤ 540p: đủ xem khung + nghe lời, tải nhanh (đã có video → chỉ lấy thumbnail)
    const r = spawnSync(yt, ["-q", "--no-warnings", "--no-playlist", "-f", "b[height<=540]/b[height<=720]/b", ...(hadVideo ? ["--skip-download"] : []),
      ...(fs.existsSync(path.join(ffDir, exe("ffmpeg"))) ? ["--ffmpeg-location", ffDir] : []),
      // kèm thumbnail gốc của bài (ảnh bìa trên nền tảng) → <n>-anh.jpg cho trang báo cáo
      "--write-thumbnail", "--convert-thumbnails", "jpg", "-o", `thumbnail:${path.join(pd, `${p.n}-anh.%(ext)s`)}`,
      "-o", path.join(pd, `${p.n}.%(ext)s`), p.url], { encoding: "utf8", timeout: 180000 });
    const got = videoOf(pd, p.n);
    if (got) okN++;
    console.log(got ? `✓ Bài ${p.n}: đã tải` : `✗ Bài ${p.n}: không tải được (${String(r.stderr || r.error || "").trim().split("\n").pop().slice(0, 160)}) — xem trong trình duyệt`);
  }
  console.log(`Tải được ${okN}/${posts.length} bài. Đang cắt khung${KHONG_NGHE ? "" : " + nghe lời"}…`);
  await media(abs);
} else if (args[0] === "--media") {
  await media(dirOf(args[1]));
} else if (args[0] === "--check") {
  const abs = dirOf(args[1]), pf = path.join(abs, "work", "posts.json"), rf = path.join(abs, "work", "report.json");
  const posts = readJson(pf), rep = readJson(rf), errs = [];
  if (!Array.isArray(posts) || !posts.length) errs.push("work/posts.json chưa có (mảng bài: n, url, views, likes, comments, shares…)");
  if (!rep) errs.push("work/report.json chưa có hoặc sai JSON");
  if (errs.length) { errs.forEach((e) => console.error("✗ " + e)); process.exit(1); }
  const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);
  const byN = new Map(posts.map((p) => [num(p.n), p]));
  const eng = (p) => num(p.likes) + num(p.comments) + num(p.shares) + num(p.saves);
  const avgViews = (list) => (list.length ? Math.round(list.reduce((s, p) => s + num(p.views), 0) / list.length) : 0);
  const er = (list) => { const v = list.reduce((s, p) => s + num(p.views), 0); return v ? Math.round((list.reduce((s, p) => s + eng(p), 0) / v) * 10000) / 100 : 0; };
  const chAvg = avgViews(posts);
  // số liệu của 1 nhóm bài (tuyến nội dung / kiểu hook / CTA) — tính từ posts.json, AI không tự điền
  const stat = (g) => {
    const ps = (g.posts || []).map((n) => byN.get(num(n))).filter(Boolean);
    const bad = (g.posts || []).filter((n) => !byN.has(num(n)));
    if (bad.length) errs.push(`"${g.name || g.type || g.title}" nhắc bài không có trong posts.json: ${bad.join(", ")}`);
    return Object.assign(g, { count: ps.length, avgViews: avgViews(ps), er: er(ps), vsChannel: chAvg ? Math.round((avgViews(ps) / chAvg) * 100) / 100 : 0 });
  };
  // ảnh bài: khung từ video (--tai / --media) hoặc ảnh bìa trên nền tảng (posts[].cover) — trang báo cáo hiện thay cho chữ
  const pd = path.join(abs, "work", "posts");
  fs.mkdirSync(pd, { recursive: true });
  for (const p of posts) {
    const img = path.join(pd, `${num(p.n)}-anh.jpg`);
    if (fs.existsSync(img) || !/^https?:\/\//.test(p.cover || "")) continue;
    try { const r = await fetch(p.cover, { signal: AbortSignal.timeout(15000) }); if (r.ok) fs.writeFileSync(img, Buffer.from(await r.arrayBuffer())); } catch {}
  }
  const has = (n, suf) => (fs.existsSync(path.join(pd, `${n}-${suf}`)) ? `posts/${n}-${suf}` : "");
  const S = rep.sections || (rep.sections = {});
  (S.pillars || []).forEach(stat);
  for (const k of ["hooks", "flows", "ctas"]) (S.structure?.[k] || []).forEach(stat);
  for (const k of ["strengths", "weaknesses", "top"]) (S[k] || []).forEach((x) => (x.posts || (x.post != null ? [x.post] : [])).forEach((n) => { if (!byN.has(num(n))) errs.push(`${k}: bài ${n} không có trong posts.json`); }));
  const need = ["brand", "pillars", "structure", "top", "funnel", "strengths", "weaknesses"];
  for (const k of need) if (!S[k] || (Array.isArray(S[k]) && !S[k].length)) errs.push(`thiếu mục sections.${k}`);
  rep.stats = { posts: posts.length, avgViews: chAvg, er: er(posts), totalViews: posts.reduce((s, p) => s + num(p.views), 0),
    from: posts.map((p) => p.date).filter(Boolean).sort()[0] || null, to: posts.map((p) => p.date).filter(Boolean).sort().at(-1) || null };
  rep.posts = posts.map((p) => ({ n: num(p.n), url: p.url || "", date: p.date || "", caption: String(p.caption || "").slice(0, 300), views: num(p.views), likes: num(p.likes),
    comments: num(p.comments), shares: num(p.shares), saves: num(p.saves), er: num(p.views) ? Math.round((eng(p) / num(p.views)) * 10000) / 100 : 0, pillar: p.pillar || "", hook: p.hook || "", duration: num(p.duration),
    img: has(num(p.n), "anh.jpg"), sheet: has(num(p.n), "khung.jpg") }));
  rep.checkedAt = new Date().toISOString();
  writeJson(rf, rep);
  if (errs.length) { errs.forEach((e) => console.error("✗ " + e)); process.exit(1); }
  console.log(`✓ Báo cáo hợp lệ · ${posts.length} bài · xem TB ${chAvg.toLocaleString("vi-VN")} · tương tác ${rep.stats.er}% — đã tính số liệu từng tuyến / hook`);
} else {
  console.log("Dùng: --buoc <dir> <số> · --tai <dir> [--khong-nghe] [--nghe <giây>] · --media <dir> · --check <dir>");
}
