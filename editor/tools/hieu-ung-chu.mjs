#!/usr/bin/env node
// Tự chọn hiệu ứng Vào/Ra đa dạng cho chữ nhấn (texts[]) chưa có anim — editor/lib/text-effects.js autoTextAnims.
// Giữ nguyên anim người dùng / mẫu đã chọn; chữ fx marker/mask/type giữ hiệu ứng vào riêng, chỉ thêm Ra.
//
//   node editor/tools/hieu-ung-chu.mjs <projectDir> [--dry]
//
// --dry: chỉ in bảng, không ghi project.json.
import fs from "node:fs";
import path from "node:path";
import { autoTextAnims } from "../lib/text-effects.js";

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith("--")) || ".");
const pj = path.join(dir, "project.json");
if (!fs.existsSync(pj)) { console.error("Không thấy project.json trong " + dir); process.exit(1); }
const project = JSON.parse(fs.readFileSync(pj, "utf8").replace(/^﻿/, "")); // file lưu bằng Notepad/PowerShell có BOM
const texts = project.texts || [];
const picks = autoTextAnims(texts);
const byId = new Map(picks.map((x) => [x.id, x.anim]));

for (const t of [...texts].sort((a, b) => (a.at || 0) - (b.at || 0))) {
  const a = byId.get(t.id), mark = a ? "+" : " ";
  const fx = a ? `${a.in?.type || "(" + (t.fx || "words") + ")"} → ${a.out.type}` : t.hidden ? "ẩn" : "giữ nguyên";
  console.log(`${mark} ${String(t.id).padEnd(6)} ${String(Number(t.at || 0).toFixed(2)).padStart(7)}s  ${fx.padEnd(26)} ${String(t.title || "").replace(/\s+/g, " ")}`);
}
if (!picks.length) { console.log("\nKhông có chữ nào cần chọn hiệu ứng (đã có anim hoặc đang ẩn)."); process.exit(0); }
if (args.includes("--dry")) { console.log(`\n${picks.length} chữ sẽ được đặt hiệu ứng · --dry: chưa ghi`); process.exit(0); }
project.texts = texts.map((t) => (byId.has(t.id) ? { ...t, anim: byId.get(t.id) } : t));
fs.writeFileSync(pj, JSON.stringify(project, null, 2) + "\n");
console.log(`\nĐã đặt hiệu ứng Vào/Ra cho ${picks.length} chữ · ${pj}`);
