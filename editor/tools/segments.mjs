#!/usr/bin/env node
// Chia lời nói thành các đoạn (segments) từ transcript có mốc thời gian từng từ.
// Cắt ở khoảng lặng, rồi chia mỗi cụm dài thành đoạn ngắn theo câu (editor/lib/segsplit.js) — bỏ câu vấp/lặp: keep:false.
//
//   node editor/tools/segments.mjs <projectDir> [--gap 0.45] [--pad-in 0.12] [--pad-out 0.2] [--auto-cut]
//
// --auto-cut: tự đặt keep:false cho đoạn chỉ có "ờ/à/ừm" và lần nói trước của câu được nói lại (editor/lib/autocut.js);
//             bảng in ra đánh dấu ✂ kèm lý do để AI / người dựng nghe lại, bật lại đoạn nào cắt nhầm.
//
// Đọc  <projectDir>/work/transcript.json  ({words:[{word|text,start,end}]} hoặc [{text,start,end}])
// Ghi  segments vào project.json và in bảng đoạn để AI review.

import fs from "node:fs";
import path from "node:path";
import { splitShort } from "../lib/segsplit.js";
import { autoCutMarks } from "../lib/autocut.js";

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith("--") && !/^\d/.test(a)) || ".");
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? Number(args[i + 1]) : d; };
const GAP = get("--gap", 0.45), PAD_IN = get("--pad-in", 0.12), PAD_OUT = get("--pad-out", 0.2);
const r3 = (n) => Math.round(n * 1000) / 1000;

const pj = path.join(dir, "project.json");
const project = JSON.parse(fs.readFileSync(pj, "utf8"));
const raw = JSON.parse(fs.readFileSync(path.join(dir, "work", "transcript.json"), "utf8"));
const words = (Array.isArray(raw) ? raw : raw.words || raw.segments?.flatMap((s) => s.words || []) || [])
  .map((w) => ({ t: String(w.word ?? w.text ?? "").trim(), s: Number(w.start), e: Number(w.end) }))
  .filter((w) => w.t && w.e > w.s);
if (!words.length) { console.error("transcript.json không có từ nào."); process.exit(1); }

const groups = [];
let cur = [words[0]];
for (let i = 1; i < words.length; i++) {
  if (words[i].s - words[i - 1].e > GAP) { groups.push(cur); cur = []; }
  cur.push(words[i]);
}
groups.push(cur);

const dur = project.source?.duration || words[words.length - 1].e + 1;
// Mỗi cụm nói liền lại chia nhỏ theo câu / cụm ý (~2–6s) để người dùng tích bỏ đúng chỗ lặp, vấp
const ws = words.map((w) => ({ w: w.t, s: w.s, e: w.e }));
const segs = groups.flatMap((g) => splitShort(ws, Math.max(0, g[0].s - PAD_IN), Math.min(dur, g[g.length - 1].e + PAD_OUT)))
  .map((x, i) => ({ id: `s${i + 1}`, in: x.in, out: x.out, keep: true, text: x.text.normalize("NFC") }));
// Không cho 2 đoạn chồng nhau sau khi đệm.
for (let i = 1; i < segs.length; i++) {
  if (segs[i].in < segs[i - 1].out) {
    const mid = r3((segs[i].in + segs[i - 1].out) / 2);
    segs[i - 1].out = mid;
    segs[i].in = mid;
  }
}
const why = new Map(args.includes("--auto-cut") ? autoCutMarks(segs).map((m) => [m.id, m.reason]) : []);
for (const s of segs) if (why.has(s.id)) s.keep = false;
project.segments = segs;
fs.writeFileSync(pj, JSON.stringify(project, null, 2) + "\n");

for (const s of segs) console.log(`${why.has(s.id) ? "✂" : " "} ${s.id.padEnd(4)} ${s.in.toFixed(2).padStart(7)} → ${s.out.toFixed(2).padStart(7)}  ${s.text}${why.has(s.id) ? `   [${why.get(s.id)}]` : ""}`);
const cutSec = segs.filter((s) => !s.keep).reduce((t, s) => t + s.out - s.in, 0);
console.log(`\n${segs.length} đoạn${why.size ? ` · tự cắt ${why.size} đoạn (${cutSec.toFixed(1)}s) — nghe lại các dòng ✂` : ""} · đã ghi vào ${pj}`);
