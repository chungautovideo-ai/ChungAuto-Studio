// Nhạc nền có sẵn của phần mềm (editor/assets/music): 3 bài tổng hợp (.wav, tự tạo lại khi thiếu)
// + thư viện nhập từ NAS ghi trong library.json. Dùng chung cho server, build và lời dặn AI.
import fs from "node:fs";
import path from "node:path";

const BUILTIN = [["upbeat-light", "Vui tươi nhẹ", ["vui-tuoi", "nhe-nhang"]], ["ambient-pad", "Êm ấm", ["em-dem", "nen"]], ["beat-bass", "Beat bass", ["beat", "nhip-manh"]]];

function library(kit) {
  try { return JSON.parse(fs.readFileSync(path.join(kit, "assets", "music", "library.json"), "utf8")); } catch { return {}; }
}

// Tiếng hiệu ứng nhập từ NAS (editor/assets/sfx/library.json): { "nas-<tên>": { file, title, group, duration } }
export function kitSfxLibrary(kit) {
  try { return JSON.parse(fs.readFileSync(path.join(kit, "assets", "sfx", "library.json"), "utf8")); } catch { return {}; }
}

// [{ id: "kit:<tên>", name, title, file, mood[], duration?, short? }]
export function kitMusicList(kit) {
  const out = BUILTIN.map(([name, title, mood]) => ({ id: "kit:" + name, name, title, file: name + ".wav", mood }));
  for (const [name, m] of Object.entries(library(kit))) {
    if (/^[\w-]+$/.test(name) && /^[\w-]+\.(mp3|wav|m4a)$/i.test(m.file || "") && fs.existsSync(path.join(kit, "assets", "music", m.file)))
      out.push({ id: "kit:" + name, name, title: m.title || name, file: m.file, mood: m.mood || [], duration: m.duration, short: !!m.short });
  }
  return out;
}

// Tên bài (không có "kit:") → tên file trong assets/music; bài tổng hợp chưa tạo vẫn trả <tên>.wav để build tự tạo lại.
export function kitMusicFile(kit, name) {
  const clean = String(name || "").replace(/[^\w-]/g, "");
  const m = library(kit)[clean];
  return m && /^[\w-]+\.(mp3|wav|m4a)$/i.test(m.file || "") ? m.file : clean + ".wav";
}
