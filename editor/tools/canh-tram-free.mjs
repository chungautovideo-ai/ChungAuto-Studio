#!/usr/bin/env node
// Cảnh trám miễn phí (Pexels — miễn phí bản quyền, dùng thương mại được): AI tìm theo từ khoá trong lời nói rồi tải về dự án.
// Tìm qua website AutoSocial (khoá API ở máy chủ, dùng tài khoản đăng nhập trong phần mềm); không được thì dùng PEXELS_API_KEY trong .env.
//   node editor/tools/canh-tram-free.mjs --tim "<từ khoá TIẾNG ANH>" [--ngang] [--so 6]   → danh sách: id, giây, khung, trang gốc
//   node editor/tools/canh-tram-free.mjs --tai <dự án> <id> [--ngang]                    → <dự án>/inputs/stock/pexels-<id>.mp4
// Mỗi file tải ghi nguồn vào <dự án>/work/canh-tram-free.json (tác giả, trang gốc) để ghi công khi đăng.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2), has = (k) => args.includes(k), get = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; } };
const ori = has("--ngang") ? "landscape" : has("--vuong") ? "square" : "portrait";

// .env của phần mềm (PEXELS_API_KEY, CLOUD_URL) — không ghi đè biến đã có
for (const f of [path.join(ROOT, ".env")]) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const base = (process.env.CLOUD_URL || readJson(path.join(ROOT, "editor", "version.json"))?.updateUrl || "").replace(/\/$/, "");
const token = readJson(path.join(ROOT, "editor", ".account.json"))?.token;

async function search(q, n) {
  let why = "";
  if (base && token) {
    try {
      const r = await fetch(`${base}/api/stock/search?q=${encodeURIComponent(q)}&orientation=${ori}&n=${n}`, { headers: { Authorization: "Bearer " + token }, signal: AbortSignal.timeout(20000) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) return j.items;
      why = j.error || `máy chủ trả ${r.status}`;
    } catch (e) { why = e.message; }
  } else why = token ? "chưa có địa chỉ website" : "phần mềm chưa đăng nhập tài khoản";
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error(`Không tìm được cảnh trám miễn phí: ${why}. (Đăng nhập tài khoản trong phần mềm, hoặc thêm PEXELS_API_KEY vào .env.)`);
  const r = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&orientation=${ori}&size=medium&per_page=${n}`, { headers: { Authorization: key }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`Pexels lỗi ${r.status}`);
  const big = (f) => Math.min(f.width, f.height);
  return ((await r.json()).videos || []).map((v) => {
    const mp4 = (v.video_files || []).filter((f) => f.file_type === "video/mp4" && f.link && f.width && f.height);
    const f = mp4.filter((x) => big(x) >= 1080 && Math.max(x.width, x.height) <= 3840).sort((a, b) => big(a) - big(b))[0] || mp4.sort((a, b) => big(b) - big(a))[0];
    return f && { id: v.id, duration: v.duration, width: f.width, height: f.height, file: f.link, image: v.image, page: v.url, author: v.user?.name || "", authorUrl: v.user?.url || "" };
  }).filter(Boolean);
}

if (has("--tim")) {
  const q = get("--tim"), n = Math.min(15, Number(get("--so")) || 6);
  if (!q) { console.error("Thiếu từ khoá: --tim \"woman applying face cream\""); process.exit(1); }
  let items;
  try { items = await search(q, n); } catch (e) { console.error("✗ " + e.message); process.exit(1); }
  if (!items.length) { console.log(`Không có kết quả cho "${q}" — thử từ khoá tiếng Anh khác (ngắn, cụ thể: hành động + vật).`); process.exit(0); }
  console.log(`Kết quả "${q}" (${ori === "portrait" ? "dọc" : ori === "landscape" ? "ngang" : "vuông"}, Pexels — miễn phí bản quyền):`);
  for (const it of items) console.log(`  id ${it.id} · ${it.duration}s · ${it.width}×${it.height} · ${it.page}`);
  console.log(`Tải: node editor/tools/canh-tram-free.mjs --tai <dự án> <id>${ori === "landscape" ? " --ngang" : ""}`);
} else if (has("--tai")) {
  const i = args.indexOf("--tai"), dir = path.resolve(ROOT, args[i + 1] || ""), id = String(args[i + 2] || "").replace(/\D/g, "");
  if (!fs.existsSync(path.join(dir, "project.json")) || !id) { console.error("Dùng: --tai <thư mục dự án> <id>"); process.exit(1); }
  // tìm lại đúng video theo id (lấy link file mới nhất) — Pexels không cho tải theo id không khoá, nên hỏi lại qua tìm kiếm bằng id
  let it = null;
  const cache = path.join(dir, "work", "canh-tram-free.json"), done = readJson(cache) || { source: "Pexels", license: "https://www.pexels.com/license/", items: [] };
  if (base && token) {
    try {
      const r = await fetch(`${base}/api/stock/video?id=${id}&orientation=${ori}`, { headers: { Authorization: "Bearer " + token }, signal: AbortSignal.timeout(20000) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) it = j.item;
    } catch {}
  }
  if (!it && process.env.PEXELS_API_KEY) {
    const r = await fetch(`https://api.pexels.com/videos/videos/${id}`, { headers: { Authorization: process.env.PEXELS_API_KEY } });
    if (r.ok) {
      const v = await r.json(), big = (f) => Math.min(f.width, f.height);
      const mp4 = (v.video_files || []).filter((f) => f.file_type === "video/mp4" && f.link && f.width && f.height);
      const f = mp4.filter((x) => big(x) >= 1080 && Math.max(x.width, x.height) <= 3840).sort((a, b) => big(a) - big(b))[0] || mp4.sort((a, b) => big(b) - big(a))[0];
      if (f) it = { id: v.id, duration: v.duration, width: f.width, height: f.height, file: f.link, page: v.url, author: v.user?.name || "", authorUrl: v.user?.url || "" };
    }
  }
  if (!it) { console.error(`Không lấy được video id ${id} (chạy --tim trước, kiểm tra đăng nhập / mạng).`); process.exit(1); }
  const rel = `inputs/stock/pexels-${id}.mp4`, out = path.join(dir, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (!fs.existsSync(out)) {
    const r = await fetch(it.file, { signal: AbortSignal.timeout(300000) });
    if (!r.ok) { console.error(`Tải lỗi ${r.status}`); process.exit(1); }
    fs.writeFileSync(out + ".part", Buffer.from(await r.arrayBuffer()));
    fs.renameSync(out + ".part", out);
  }
  done.items = done.items.filter((x) => x.id !== it.id).concat({ id: it.id, file: rel, page: it.page, author: it.author, authorUrl: it.authorUrl, duration: it.duration, width: it.width, height: it.height });
  fs.mkdirSync(path.dirname(cache), { recursive: true });
  fs.writeFileSync(cache, JSON.stringify(done, null, 2));
  console.log(`✓ ${rel} (${it.duration}s · ${it.width}×${it.height} · ${(fs.statSync(out).size / 1048576).toFixed(1)} MB) — tác giả ${it.author} trên Pexels`);
  console.log(`Chèn vào project.json → brolls[]: { "src": "${rel}", "at": <giây gốc>, "dur": 2–4, "mediaStart": 0, … kiểu cảnh trám của mẫu }`);
} else {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 6).join("\n"));
}
