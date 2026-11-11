#!/usr/bin/env node
// Cập nhật phần mềm từ file .zip bản mới (phần mềm đã tải + kiểm tra mã; việc "cập nhật" giao cho AI qua editor).
//   node editor/tools/cap-nhat.mjs <file.zip>
// Chép đè file của bản mới, GIỮ NGUYÊN: .env, tài khoản, workspace/ (video, dự án, kho hiệu ứng), mẫu đã cài, brand, node_modules…
// package.json đổi → npm install. In tóm tắt để AI báo người dùng.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { unzip } from "../lib/zip.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(KIT, "..");
// giống danh sách giữ nguyên của editor/server.mjs (applyUpdate)
const PROTECTED = [/^\.env$/, /^editor\/\.account\.json$/, /^editor\/goi-tai\.json$/, /^workspace\//, /^editor\/templates\//, /^editor\/brands\//, /^editor\/node_modules\//, /^node_modules\//, /^site\.config\.json$/, /^\.claude\/settings\.local\.json$/, /^release\//, /^site\//];
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; } };

const zipFile = process.argv[2];
if (!zipFile || !fs.existsSync(zipFile)) { console.error("✗ Cần đường dẫn file .zip bản cập nhật"); process.exit(1); }
const files = unzip(fs.readFileSync(zipFile));
const top = files.length && files.every((x) => x.name.split("/")[0] === files[0].name.split("/")[0]) ? files[0].name.split("/")[0] + "/" : "";
const before = readJson(path.join(KIT, "version.json")) || { version: "0.0.0" };
const oldPkg = fs.existsSync(path.join(KIT, "package.json")) ? fs.readFileSync(path.join(KIT, "package.json"), "utf8") : "";
let n = 0, kept = 0;
for (const { name, data } of files) {
  const rel = name.slice(top.length);
  if (!rel || rel.endsWith("/")) continue;
  if (PROTECTED.some((re) => re.test(rel))) { kept++; continue; }
  const dest = path.resolve(ROOT, rel);
  if (!dest.startsWith(ROOT + path.sep)) continue;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  let out = data;
  // bản mới không ghi địa chỉ cập nhật → giữ địa chỉ cũ để lần sau vẫn nhận thông báo
  if (rel === "editor/version.json" && before.updateUrl) {
    try { const v = JSON.parse(data.toString("utf8")); if (!v.updateUrl) { v.updateUrl = before.updateUrl; out = Buffer.from(JSON.stringify(v, null, 2) + "\n"); } } catch {}
  }
  fs.writeFileSync(dest, out);
  if (/\.(command|sh)$/.test(rel)) try { fs.chmodSync(dest, 0o755); } catch {}
  n++;
}
const after = readJson(path.join(KIT, "version.json")) || {};
const newPkg = fs.existsSync(path.join(KIT, "package.json")) ? fs.readFileSync(path.join(KIT, "package.json"), "utf8") : "";
if (newPkg !== oldPkg) {
  console.log("… thư viện thay đổi → npm install");
  const r = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["install", "--omit=dev"], { cwd: KIT, shell: process.platform === "win32", stdio: "inherit" });
  if (r.status) console.log("⚠ npm install báo lỗi — chạy lại: cd editor && npm install --omit=dev");
}
console.log(`✓ Đã cập nhật v${before.version} → v${after.version || "?"}: ${n} file mới / thay đổi, giữ nguyên ${kept} file của người dùng (dự án, mẫu, .env…)`);
const notes = after.notes || [];
if (notes.length) console.log("Có gì mới:\n" + notes.map((x) => "  • " + x).join("\n"));
