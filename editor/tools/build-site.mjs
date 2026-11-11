#!/usr/bin/env node
// Build website thư viện mẫu từ editor/library/ → site/
//
//   node editor/tools/build-site.mjs            # build
//   node editor/tools/build-site.mjs --serve    # chỉ xem giao diện (không có đăng nhập)
//   node cloud/server.mjs                         # website đầy đủ: đăng nhập, gói, tải mẫu
//
// site/ là web tĩnh: đưa lên hosting bất kỳ (Netlify, Vercel, Cloudflare Pages, S3…).
// site/ cũng là thư viện online cho editor: đặt LIBRARY_URL=<địa chỉ site> trong .env.
// Cấu hình (tuỳ chọn): site.config.json ở thư mục gốc kit:
//   { "siteName": "...", "downloadUrl": "...", "contactUrl": "...", "editorUrl": "http://127.0.0.1:5173" }

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { presetParts } from "../lib/build.mjs";

const EDITOR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(EDITOR, "..");
const LIB = path.join(EDITOR, "library");
const OUT = path.join(ROOT, "site");
const cfg = {
  siteName: "AutoSocial",
  downloadUrl: "#tai-phan-mem",
  contactUrl: "#lien-he",
  editorUrl: "http://127.0.0.1:5173",
  // Danh sách ngành nghề hiển thị trên website (ngành chưa có mẫu sẽ hiện "Sắp có").
  industries: ["Video talking head", "Review", "Bất động sản", "Tài chính – Đầu tư", "Bảo hiểm", "Giáo dục – Đào tạo", "Công nghệ – AI", "Marketing – Agency",
    "Bán hàng online", "F&B – Nhà hàng", "Làm đẹp – Spa", "Thời trang", "Y tế – Sức khoẻ", "Nha khoa", "Gym – Thể hình",
    "Du lịch – Khách sạn", "Ô tô – Xe máy", "Nội thất – Kiến trúc", "Luật – Tư vấn", "Coaching – Thương hiệu cá nhân"],
  ...(fs.existsSync(path.join(ROOT, "site.config.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8")) : {}),
};

// ---------- Build ----------
// Xoá nội dung cũ (giữ thư mục site/ để không vướng khi đang mở nó ở cửa sổ khác).
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) fs.rmSync(path.join(OUT, f), { recursive: true, force: true });
const catalog = [];
for (const id of fs.readdirSync(LIB).sort()) {
  const dir = path.join(LIB, id);
  const tplFile = path.join(dir, "template.json");
  if (!fs.existsSync(tplFile)) continue;
  const tpl = JSON.parse(fs.readFileSync(tplFile, "utf8"));
  if (tpl.web === false) continue; // mẫu ẩn khỏi website (vẫn dùng được trong phần mềm)
  // Web chỉ chứa video xem trước + ảnh bìa. File mẫu (template.json, SKILL.md) tải qua máy chủ
  // tài khoản (cloud/server.mjs) theo gói Basic / Pro / Premium — không để công khai trên web tĩnh.
  const dest = path.join(OUT, id);
  fs.mkdirSync(dest, { recursive: true });
  // --no-previews: chưa đưa video/ảnh mẫu lên web (dùng ảnh bìa trung tính vẽ từ màu của mẫu)
  const NOPREV = process.argv.includes("--no-previews");
  // previewSafe: video xem trước tự dựng / có quyền dùng → luôn đưa lên web
  const showPrev = !NOPREV || tpl.previewSafe === true;
  if (showPrev) for (const f of ["preview.mp4", "poster.jpg"]) if (fs.existsSync(path.join(dir, f))) fs.copyFileSync(path.join(dir, f), path.join(dest, f));
  // ảnh minh hoạ từng hiệu ứng của mẫu (fx/*.jpg)
  const effects = showPrev ? (tpl.effects || []).filter((e) => e.img && fs.existsSync(path.join(dir, e.img))) : [];
  for (const e of effects) { fs.mkdirSync(path.dirname(path.join(dest, e.img)), { recursive: true }); fs.copyFileSync(path.join(dir, e.img), path.join(dest, e.img)); }
  // Thành phần trong mẫu (chữ / hiệu ứng / cảnh trám) — chỉ phần hiển thị xem trước, web mở khi xem chi tiết mẫu
  let parts = 0;
  if ((tpl.presets || []).length) {
    // thẻ "nền người" (hiệu ứng phủ lên video) vẽ trên poster của mẫu (đường dẫn tính từ trang web gốc)
    const pp = presetParts({ brand: tpl.brand, format: tpl.format }, tpl.presets, fs.existsSync(path.join(dir, "poster.jpg")) ? `${id}/poster.jpg` : "");
    for (const it of pp.items) if (it.img && fs.existsSync(path.join(dir, it.img))) { fs.mkdirSync(path.dirname(path.join(dest, it.img)), { recursive: true }); fs.copyFileSync(path.join(dir, it.img), path.join(dest, it.img)); }
    const items = pp.items.map(({ id: pid, group, kind, name, desc, layer, mode, frame, tIn, body, img }) => ({ id: pid, group, kind, name, desc, layer, mode, frame, tIn, body, ...(img && fs.existsSync(path.join(dir, img)) ? { img: `${id}/${img}` } : {}) }));
    fs.writeFileSync(path.join(dest, "parts.json"), JSON.stringify({ style: pp.style, fonts: pp.fonts, items }));
    parts = { chu: items.filter((x) => x.group === "chu").length, dohoa: items.filter((x) => x.group === "dohoa").length, canhtram: items.filter((x) => x.group === "canhtram").length };
  }
  const tier = tpl.tier || "free";
  // Nội dung skill KHÔNG đưa lên web — chỉ có trong file .zip tải về (qua tài khoản)
  catalog.push({
    ...tpl, id, tier,
    preview: showPrev && fs.existsSync(path.join(dir, "preview.mp4")) ? `${id}/preview.mp4` : null,
    poster: showPrev && fs.existsSync(path.join(dir, "poster.jpg")) ? `${id}/poster.jpg` : null,
    effects: effects.map((e) => ({ ...e, img: `${id}/${e.img}` })),
    presets: undefined, parts,
  });
}
catalog.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || String(a.name).localeCompare(b.name, "vi"));
fs.writeFileSync(path.join(OUT, "catalog.json"), JSON.stringify({ items: catalog }, null, 2));

const icon = (d) => `<svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICONS = {
  IC_CAP: icon('<rect x="1.5" y="4" width="13" height="8" rx="2"/><path d="M4.5 8h3M9 8h2.5"/>'),
  IC_CUT: icon('<circle cx="4.5" cy="11.5" r="2"/><circle cx="11.5" cy="11.5" r="2"/><path d="M6 10L12 2M10 10L4 2"/>'),
  IC_MOVE: icon('<path d="M8 1.5v13M1.5 8h13M8 1.5l-2 2M8 1.5l2 2M8 14.5l-2-2M8 14.5l2-2M1.5 8l2-2M1.5 8l2 2M14.5 8l-2-2M14.5 8l-2 2"/>'),
  IC_LIB: icon('<rect x="1.5" y="2.5" width="5" height="11" rx="1.2"/><rect x="9.5" y="2.5" width="5" height="11" rx="1.2"/>'),
  IC_AI: icon('<path d="M8 1.5l1.6 4.4L14 7.5l-4.4 1.6L8 13.5l-1.6-4.4L2 7.5l4.4-1.6z"/>'),
  IC_BRAND: icon('<circle cx="5.5" cy="6" r="3"/><circle cx="10.5" cy="6" r="3"/><circle cx="8" cy="10.5" r="3"/>'),
};
// Bản phát hành mới nhất (release/ do release.mjs tạo) → site/release/ — cho nút tải + tự cập nhật.
let release = null;
const relDir = path.join(ROOT, "release");
if (fs.existsSync(path.join(relDir, "latest.json"))) {
  release = JSON.parse(fs.readFileSync(path.join(relDir, "latest.json"), "utf8"));
  fs.mkdirSync(path.join(OUT, "release"), { recursive: true });
  // bản công khai: bỏ thông tin gói admin (gói đó chỉ máy chủ giao cho tài khoản admin)
  if (release.builds) delete release.builds.admin;
  fs.writeFileSync(path.join(OUT, "release", "latest.json"), JSON.stringify(release, null, 2) + "\n");
  if (!fs.existsSync(path.join(relDir, release.file))) { console.warn(`⚠ Thiếu release/${release.file}`); release = null; }
}
let html = fs.readFileSync(path.join(EDITOR, "tools", "site-template.html"), "utf8");
const vars = { SITE_NAME: cfg.siteName, DOWNLOAD_URL: cfg.downloadUrl, CONTACT_URL: cfg.contactUrl, EDITOR_URL: cfg.editorUrl.replace(/\/$/, ""), YEAR: String(new Date().getFullYear()), ...ICONS };
html = html.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
html = html.replace("/*CATALOG*/[]", JSON.stringify(catalog).replace(/</g, "\\u003c"));
html = html.replace("/*INDUSTRIES*/[]", JSON.stringify(cfg.industries).replace(/</g, "\\u003c"));
html = html.replace("/*RELEASE*/null", JSON.stringify(release).replace(/</g, "\\u003c"));
fs.writeFileSync(path.join(OUT, "index.html"), html);

// ---------- Trang đăng nhập / đăng ký ----------
const show = catalog.find((c) => c.preview);
let auth = fs.readFileSync(path.join(EDITOR, "tools", "auth-template.html"), "utf8").replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
auth = auth.replace("<!--SHOWCASE-->", show ? `<video src="${show.preview}" poster="${show.poster || ""}" muted autoplay loop playsinline></video>` : "");
fs.writeFileSync(path.join(OUT, "dang-nhap.html"), auth);
fs.writeFileSync(path.join(OUT, "dang-ky.html"), auth);
// ---------- Trang thanh toán (QR SePay, tự kích hoạt gói) ----------
fs.writeFileSync(path.join(OUT, "thanh-toan.html"), fs.readFileSync(path.join(EDITOR, "tools", "checkout-template.html"), "utf8").replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m)));
// ---------- Trang Bảng giá (gói + chi phí AI): cùng mã trang chủ, chỉ hiện mục Bảng giá ----------
fs.writeFileSync(path.join(OUT, "bang-gia.html"), html.replace(/<title>[^<]*<\/title>/, `<title>Bảng giá & chi phí AI — ${cfg.siteName}</title>`));
// ---------- Trang Thư viện mẫu: cùng mã trang chủ, menu lọc trái + toàn bộ mẫu ----------
fs.writeFileSync(path.join(OUT, "thu-vien.html"), html.replace(/<title>[^<]*<\/title>/, `<title>Thư viện mẫu video edit — ${cfg.siteName}</title>`));
// ---------- Trang giới thiệu phần mềm /landing ----------
fs.mkdirSync(path.join(OUT, "landing"), { recursive: true });
// ảnh của trang (giao diện phần mềm, trước / sau khi edit) — editor/tools/landing/*
for (const f of fs.readdirSync(path.join(EDITOR, "tools", "landing"))) fs.copyFileSync(path.join(EDITOR, "tools", "landing", f), path.join(OUT, "landing", f));
// máy chủ tài khoản không kèm video xem trước, cần biết mẫu nào có video
fs.writeFileSync(path.join(OUT, "co-xem-truoc.json"), JSON.stringify(fs.readdirSync(LIB).filter((id) => fs.existsSync(path.join(LIB, id, "preview.mp4")))));
fs.writeFileSync(path.join(OUT, "landing", "index.html"), fs.readFileSync(path.join(EDITOR, "tools", "landing-template.html"), "utf8")
  .replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m)).replace("/*CATALOG*/[]", JSON.stringify(catalog).replace(/</g, "\\u003c")));
// ---------- Bản web của phần mềm /app: đăng nhập → nhúng phần mềm đang chạy trên máy người dùng (127.0.0.1:5173) ----------
fs.mkdirSync(path.join(OUT, "app"), { recursive: true });
fs.writeFileSync(path.join(OUT, "app", "index.html"), fs.readFileSync(path.join(EDITOR, "tools", "site-app.html"), "utf8").replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m)));
// link cũ chi-phi.html → trang Bảng giá
fs.writeFileSync(path.join(OUT, "chi-phi.html"), '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=bang-gia.html#chi-phi"><link rel="canonical" href="bang-gia.html"><a href="bang-gia.html#chi-phi">Bảng giá & chi phí AI</a>');
console.log(`site/ ← ${catalog.length} mẫu (${catalog.filter((c) => c.preview).length} có video xem trước)` +
  (release ? ` · phần mềm v${release.version}` : " · chưa có bản phát hành (chạy release.mjs)"));

// ---------- Xem thử trên máy ----------
if (process.argv.includes("--serve")) {
  const MIME = { ".html": "text/html; charset=utf-8", ".json": "application/json", ".mp4": "video/mp4", ".jpg": "image/jpeg", ".md": "text/markdown; charset=utf-8", ".zip": "application/zip" };
  http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const f = path.resolve(OUT, "." + (u === "/" ? "/index.html" : u));
    if (!f.startsWith(OUT) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); return res.end(); }
    const st = fs.statSync(f), type = MIME[path.extname(f)] || "application/octet-stream";
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    if (range) {
      const s = Number(range[1] || 0), e = range[2] ? Math.min(Number(range[2]), st.size - 1) : st.size - 1;
      res.writeHead(206, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Range": `bytes ${s}-${e}/${st.size}`, "Content-Length": e - s + 1 });
      return fs.createReadStream(f, { start: s, end: e }).pipe(res);
    }
    res.writeHead(200, { "Content-Type": type, "Content-Length": st.size, "Accept-Ranges": "bytes" });
    fs.createReadStream(f).pipe(res);
  }).listen(5180, "127.0.0.1", () => console.log("Xem thử: http://127.0.0.1:5180/"));
}
