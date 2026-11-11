#!/usr/bin/env node
// Đóng gói kit thành file zip để bán / phát hành + latest.json cho tính năng tự cập nhật.
//
//   node editor/tools/release.mjs --version 1.1.0 --notes "Thêm mẫu mới|Sửa lỗi phụ đề" [--url https://ten-web.com] [--no-previews]
//
// Kết quả: release/<tên>-v<phiên bản>.zip + release/latest.json
// Rồi chạy build-site để đưa bản mới lên website: node editor/tools/build-site.mjs
// Người dùng sẽ thấy thông báo "Bản mới" ở góc phải editor và bấm Cập nhật.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { zip } from "../lib/zip.mjs";

const EDITOR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(EDITOR, "..");
const args = process.argv.slice(2);
const get = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };

// ---------- Phiên bản ----------
const vf = path.join(EDITOR, "version.json");
const ver = JSON.parse(fs.readFileSync(vf, "utf8"));
if (get("--version")) ver.version = get("--version");
if (get("--notes")) ver.notes = get("--notes").split("|").map((s) => s.trim()).filter(Boolean);
if (get("--url")) ver.updateUrl = get("--url").replace(/\/$/, "");
const now = new Date();
ver.date = now.toISOString().slice(0, 10);
ver.releasedAt = now.toISOString(); // ngày giờ phát hành (hiện trong thông báo cập nhật)
fs.writeFileSync(vf, JSON.stringify(ver, null, 2) + "\n");

// ---------- Chọn file ----------
// Không bao giờ đóng gói: khoá/API, dữ liệu & video của bạn, thư viện cài sẵn, file sinh ra.
const EXCLUDE = [
  /^\.env$/, /^\.mcp\.json$/, /^\.codex\/config\.toml$/, /^\.vercel\//, /^api\//, /^vercel\.json$/, /^\.git(\/|$)/, /^\.claude\/settings\.local\.json$/,
  /(^|\/)node_modules(\/|$)/, /(^|\/)\.history(\/|$)/, /(^|\/)\.editor-cache(\/|$)/, /(^|\/)\.hyperframes(\/|$)/,
  /^workspace\//, /^site\//, /^release\//, /^tools\//, /^cloud\//,
  /^editor\/templates\//, /^editor\/brands\//, /^editor\/tools\/landing(-template\.html|\/)/, // trang giới thiệu chỉ có trên website
  /^editor\/assets\/music\//, // nhạc nền tự tổng hợp khi cài (make-sfx.mjs) — giữ file tải nhẹ
  /\.log$/, /(^|\/)\.DS_Store$/, /(^|\/)Thumbs\.db$/,
];
EXCLUDE.push(/^editor\/\.account\.json$/, /^editor\/goi-tai\.json$/); // tài khoản / thông tin người tải riêng từng máy
// Công cụ quản trị (phân tích video mẫu → làm mẫu thư viện): chỉ có trong bản admin (máy chủ chỉ giao cho tài khoản admin)
const ADMIN_ONLY = [/^editor\/admin\//, /^\.(claude|agents)\/skills\/admin-[^/]+\//];
// Chỉ đóng gói mẫu Free — mẫu Pro / Premium người dùng tải từ máy chủ theo gói của họ.
const LIBDIR = path.join(EDITOR, "library");
const paid = fs.existsSync(LIBDIR) ? fs.readdirSync(LIBDIR).filter((id) => {
  try { return (JSON.parse(fs.readFileSync(path.join(LIBDIR, id, "template.json"), "utf8")).tier || "free") !== "free"; } catch { return false; }
}) : [];
for (const id of paid) EXCLUDE.push(new RegExp(`^editor/library/${id.replace(/[^\w-]/g, "")}/`));
// --no-previews: bỏ video xem trước (nặng); ảnh bìa nhẹ (~60KB) vẫn kèm để thư viện trong máy có hình cả khi offline
if (args.includes("--no-previews")) EXCLUDE.push(/^editor\/library\/[^/]+\/preview\.mp4$/);
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    const rel = path.relative(ROOT, abs).replace(/\\/g, "/");
    if (EXCLUDE.some((re) => re.test(rel) || re.test(rel + "/"))) continue;
    if (e.isDirectory()) walk(abs);
    else if (e.isFile()) files.push(rel);
  }
})(ROOT);

const slug = String(ver.name || "video-edit-kit").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
const top = slug;
// 1 bản dùng chung cho mọi máy (Windows + macOS): có cả Mo-Editor.bat lẫn Mo-Editor.command,
// AI (Claude Code / Codex) đọc AGENTS.md và tự cài đúng theo hệ điều hành.
const GUIDE = `CÀI ĐẶT (Windows 10/11 · macOS Apple Silicon & Intel)
=====================================================
1. Giải nén file .zip vào một thư mục cố định (không để trong Downloads),
   ví dụ Windows: D:\\video-edit-kit  ·  macOS: Documents/video-edit-kit
2. Mở thư mục đó bằng Claude Code (app Claude → tab Code → chọn thư mục) hoặc Codex.
3. Gõ:  cài đặt  — AI tự nhận ra máy Windows hay Mac, kiểm tra và tải những gì còn thiếu
   (Node.js, ffmpeg, nhận giọng nói, trình dựng video). Lần đầu ~0,8–1 GB, 5–15 phút. Bạn chỉ cần bấm đồng ý.
4. Xong AI mở phần mềm. Lần sau bấm đúp:  Windows → Mo-Editor.bat  ·  macOS → Mo-Editor.command

macOS: nếu hiện hộp thoại cài Command Line Tools → bấm Install.
       Lần đầu mở Mo-Editor.command bị chặn → chuột phải → Open → Open.
Không dùng AI? Bấm đúp file Mo-Editor của máy bạn — lần đầu cũng tự cài đặt như trên.
Cập nhật: khi có bản mới, phần mềm hiện thông báo ở góc phải → bấm Cập nhật ngay.
`;
const outDir = path.join(ROOT, "release");
fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) if (/\.(zip|dmg)$/.test(f)) fs.rmSync(path.join(outDir, f)); // chỉ giữ bản mới nhất
const isAdminFile = (rel) => ADMIN_ONLY.some((re) => re.test(rel));
function pack(list, file) {
  const entries = list.map((rel) => ({ name: `${top}/${rel}`, data: fs.readFileSync(path.join(ROOT, rel)) }));
  // Thư mục làm việc trống cho người dùng
  entries.push({ name: `${top}/workspace/content/README.txt`, data: Buffer.from("Các dự án video của bạn được lưu ở đây (mỗi dự án 1 thư mục). Cập nhật phần mềm không xoá thư mục này.\n") });
  entries.push({ name: `${top}/CAI-DAT.txt`, data: Buffer.from(GUIDE.replace(/\n/g, "\r\n")) });
  const buf = zip(entries);
  fs.writeFileSync(path.join(outDir, file), buf);
  return { file, size: buf.length, sha256: crypto.createHash("sha256").update(buf).digest("hex"), count: entries.length };
}
const { count, ...build } = pack(files.filter((r) => !isAdminFile(r)), `${slug}-v${ver.version}.zip`);
// Bản admin = bản thường + công cụ tạo mẫu từ video mẫu (tên file có mã ngẫu nhiên; máy chủ chỉ giao cho tài khoản admin)
const { count: adminCount, ...adminBuild } = pack(files, `${slug}-v${ver.version}-admin-${crypto.randomBytes(6).toString("hex")}.zip`);
const latest = {
  name: ver.name, version: ver.version, date: ver.date, releasedAt: ver.releasedAt, notes: ver.notes || [],
  ...build,
  // phần mềm bản cũ (≤ 1.0.5) đọc builds.win / builds.mac khi tự cập nhật → cùng trỏ về 1 file
  builds: { win: build, mac: build, admin: adminBuild },
};
fs.writeFileSync(path.join(outDir, "latest.json"), JSON.stringify(latest, null, 2) + "\n");

console.log(`✓ release/${build.file}  (${(build.size / 1048576).toFixed(1)} MB, ${count} file) — dùng cho cả Windows và macOS`);
console.log(`✓ release/${adminBuild.file}  (${adminCount} file) — bản có "Tạo mẫu từ video" — tài khoản gói Pro+ và admin tải được`);
console.log(`✓ release/latest.json  v${ver.version}`);
if (paid.length) console.log(`  (không kèm ${paid.length} mẫu trả phí: ${paid.join(", ")})`);
if (!ver.updateUrl) console.log("⚠ Chưa có updateUrl — người dùng sẽ không nhận thông báo cập nhật. Thêm --url <địa chỉ website>.");
const previews = files.filter((f) => /^editor\/library\/[^/]+\/preview\.mp4$/.test(f));
if (previews.length) console.log(`⚠ Có ${previews.length} video mẫu trong gói — chắc chắn chúng dùng footage bạn có quyền bán (hoặc thêm --no-previews).`);
if (files.some((f) => f.startsWith("assets/brand/"))) console.log("⚠ assets/brand/ có ảnh avatar có sẵn từ kit gốc — thay bằng ảnh của bạn hoặc xoá trước khi bán.");
