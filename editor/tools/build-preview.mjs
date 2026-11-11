#!/usr/bin/env node
// Tạo video xem trước cho một mẫu trong thư viện: áp mẫu lên một project có sẵn,
// lấy N giây đầu của bản dựng rồi render → editor/library/<id>/preview.mp4 + poster.jpg
//
//   node editor/tools/build-preview.mjs <templateId> <projectDir> [--seconds 12]
//
// Dùng footage CỦA BẠN cho video mẫu bán kèm kit (không dùng video của người khác).

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { applyTemplate } from "../lib/template.js";
import { makeTimemap } from "../lib/timemap.js";
import { buildProject } from "../lib/build.mjs";

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const [id, projectDir] = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--seconds");
const secIdx = args.indexOf("--seconds");
const SECONDS = secIdx >= 0 ? Number(args[secIdx + 1]) : 12;
if (!id || !projectDir) { console.error("Cần <templateId> <projectDir>"); process.exit(1); }

const libDir = path.join(KIT, "library", id);
const tpl = JSON.parse(fs.readFileSync(path.join(libDir, "template.json"), "utf8"));
const src = path.resolve(projectDir);
let p = applyTemplate(JSON.parse(fs.readFileSync(path.join(src, "project.json"), "utf8")), tpl);

// Giữ các đoạn đầu cho tới khi đủ SECONDS giây bản dựng.
let acc = 0;
p.segments = (p.segments || []).sort((a, b) => a.in - b.in).filter((s) => {
  if (s.keep === false) return acc < SECONDS;
  if (acc >= SECONDS) return false;
  const len = s.out - s.in;
  if (acc + len > SECONDS) s.out = Math.round((s.in + (SECONDS - acc)) * 1000) / 1000;
  acc += s.out - s.in;
  return true;
});
const tm = makeTimemap(p);
const lastSrc = tm.outToSrc(tm.total);
const inside = (it) => (it.at || 0) < lastSrc - 0.5;
for (const k of ["texts", "zooms", "scenes", "brolls"]) p[k] = (p[k] || []).filter(inside);
if (p.captions?.lines) p.captions.lines = p.captions.lines.filter((l) => (l.words?.[0]?.s ?? 0) < lastSrc);

// Thư mục dựng tạm: copy các file media project dùng tới.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `hf-preview-${id}-`));
const used = new Set([p.source?.video, p.audio?.music, ...(p.brolls || []).map((b) => b.src)].filter(Boolean));
for (const rel of used) {
  fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true });
  fs.copyFileSync(path.join(src, rel), path.join(tmp, rel));
}
fs.writeFileSync(path.join(tmp, "project.json"), JSON.stringify(p, null, 2));
buildProject(tmp, p);

const out = path.join(libDir, "preview.mp4");
import { HF } from "../lib/hf.mjs";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const r = spawnSync(npx, [HF, "render", "--quality", "draft", "--fps", "30", "--output", "preview-raw.mp4"], { cwd: tmp, stdio: "inherit", shell: process.platform === "win32" });
if (r.status !== 0) { console.error("Render lỗi"); process.exit(1); }
// Nén nhẹ cho thư viện (540×960) + ảnh bìa.
spawnSync("ffmpeg", ["-v", "error", "-y", "-i", path.join(tmp, "preview-raw.mp4"), "-vf", "scale=540:-2", "-c:v", "libx264", "-crf", "26", "-preset", "veryfast", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", out], { stdio: "inherit" });
spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", String(Math.min(tm.total / 3, 1.8)), "-i", out, "-frames:v", "1", "-q:v", "4", path.join(libDir, "poster.jpg")], { stdio: "inherit" });
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`✓ ${out}`);
