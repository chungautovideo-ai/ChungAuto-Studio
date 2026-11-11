#!/usr/bin/env node
// Kiểm đồ hoạ có hợp nội dung video không: chữ mẫu, icon / logo / ảnh mẫu còn nguyên, đồ hoạ không khớp lời nói.
//   node editor/tools/kiem-do-hoa.mjs <thư mục dự án>
// Mỗi khối có chữ hoặc hình phải ghi blocks[].minhHoa = từ khoá đúng như trong lời nói quanh lúc khối hiện.
// Khối chỉ để trang trí, không mang nghĩa (viền, sóng âm, mũi tên, vệt sáng): minhHoa = "trang trí".
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; } };
const CHUAN = (s) => String(s || "").normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const MEDIA = /<svg[\s\S]*?<\/svg>|<img\b[^>]*>/gi;
const mediaOf = (h) => (String(h || "").match(MEDIA) || []).map((m) => m.replace(/\s+/g, " "));
const textOf = (h) => CHUAN(String(h || "").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<svg[\s\S]*?<\/svg>/gi, " ").replace(/<[^>]+>/g, " "));

export function kiemDoHoa(dir, {project} = {}) {
  const p = project || read(path.join(dir, "project.json"));
  if (!p) return { loi: ["Không đọc được project.json"], canh: [], so: 0 };
  const words = (read(path.join(dir, "work", "transcript.json"))?.words || []).map((w) => ({ w: CHUAN(w.word ?? w.w), s: w.start ?? w.s, e: w.end ?? w.e }));
  const id = p.template?.id, tpl = id && (read(path.join(ROOT, "editor", "templates", id, "template.json")) || read(path.join(ROOT, "editor", "library", id, "template.json")));
  const presets = tpl?.presets || [], mauMedia = new Set(presets.flatMap((x) => mediaOf(x.html))), mauChu = new Set(presets.map((x) => textOf(x.html)).filter(Boolean));
  const loi = [], canh = [], ds = (p.blocks || []).filter((b) => !b.hidden);
  for (const b of ds) {
    const ten = `Khối "${b.name || b.id}" (${Number(b.at) || 0}s)`, media = mediaOf(b.html), chu = textOf(b.html), ly = String(b.minhHoa || "").trim();
    if (!media.length && !chu) continue;
    // Fixed brand/frame media is reusable only inside the preset that declares its SHA256.
    const coDinh = new Set(presets.find((x) => x.id === b.preset)?.reusableBrandMedia || []);
    const giu = media.filter((m) => mauMedia.has(m) && !coDinh.has(crypto.createHash("sha256").update(m).digest("hex"))).length;
    const a = (Number(b.at) || 0) - 2, z = (Number(b.at) || 0) + (Number(b.dur) || 0) + 2;
    const quanh = " " + words.filter((w) => w.e >= a && w.s <= z).map((w) => w.w).join(" ") + " ";
    // chữ trùng chữ mẫu nhưng đúng là lời đang nói thì vẫn hợp
    if (chu && mauChu.has(chu) && !quanh.includes(" " + chu + " ")) loi.push(`${ten}: còn nguyên chữ mẫu "${chu.slice(0, 50)}". Viết lại theo lời nói trong video`);
    if (CHUAN(ly) === "trang tri" || CHUAN(ly) === "trang trí") {
      if (chu) loi.push(`${ten}: có chữ thì không phải trang trí. Ghi từ khoá trong lời nói`);
      else canh.push(`${ten}: để trang trí, nhìn lại xem hình có mang nghĩa khác không`);
      continue;
    }
    if (giu) loi.push(`${ten}: ${giu} icon / logo / ảnh của mẫu còn nguyên. Giữ khung và chuyển động, thay hình cho đúng điều đang nói; không có gì hợp thì bỏ khối`);
    if (!ly) { loi.push(`${ten}: thiếu minhHoa (từ khoá trong lời nói mà khối này minh hoạ)`); continue; }
    if (!words.length) continue;
    if (!quanh.includes(" " + CHUAN(ly) + " ")) loi.push(`${ten}: "${ly}" không có trong lời nói quanh lúc khối hiện. Đổi đồ hoạ, dời đúng lúc nói, hoặc bỏ khối`);
  }
  return { loi, canh, so: ds.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] && path.resolve(process.argv[2]);
  if (!dir) { console.error("Dùng: kiem-do-hoa.mjs <thư mục dự án>"); process.exit(1); }
  const r = kiemDoHoa(dir);
  r.canh.forEach((x) => console.log("⚠ " + x));
  r.loi.forEach((x) => console.log("✗ " + x));
  console.log(r.loi.length ? `✗ ${r.loi.length} lỗi / ${r.so} khối` : `✓ ${r.so} khối đồ hoạ hợp nội dung`);
  process.exit(r.loi.length ? 1 : 0);
}
