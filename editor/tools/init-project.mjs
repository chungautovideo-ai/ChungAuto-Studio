#!/usr/bin/env node
// Tạo project mới từ video quay thô.
//
//   node editor/tools/init-project.mjs --video "D:/quay/raw.mp4" --slug ten-video [--root workspace/content]
//
// Kết quả: <root>/<YYYY-MM-DD>/<slug>/{inputs/raw.mp4, project.json, work/}
// Video gốc được COPY, không bao giờ sửa file gốc.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const video = get("--video");
const slug = get("--slug");
const root = path.resolve(get("--root", "workspace/content"));
if (!video || !slug) {
  console.error("Cần --video <file> --slug <ten-video>");
  process.exit(1);
}
const date = new Date().toISOString().slice(0, 10);
const dir = path.join(root, date, slug);
fs.mkdirSync(path.join(dir, "inputs"), { recursive: true });
fs.mkdirSync(path.join(dir, "work"), { recursive: true });

const ext = path.extname(video).toLowerCase() || ".mp4";
const dest = path.join(dir, "inputs", `raw${ext}`);
if (!fs.existsSync(dest)) fs.copyFileSync(video, dest);

const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:stream_tags=rotate:format=duration", "-of", "json", dest], { encoding: "utf8" }));
const v = probe.streams.find((s) => s.codec_type === "video") || {};
const hasAudio = probe.streams.some((s) => s.codec_type === "audio");
const duration = Math.round(Number(probe.format.duration) * 1000) / 1000;

const pj = path.join(dir, "project.json");
if (!fs.existsSync(pj)) {
  const project = {
    version: 1,
    title: slug,
    source: { video: `inputs/raw${ext}`, width: v.width, height: v.height, duration, hasAudio },
    camera: { scale: 1, x: 0, y: 0, faceY: 0.36 },
    segments: [{ id: "s1", in: 0, out: duration, keep: true, text: "" }],
    texts: [], zooms: [], scenes: [], brolls: [],
    audio: { voice: 1, music: "", musicVolume: 0.1, sfx: [], sfxVolume: 0.5, autoSfx: true },
  };
  fs.writeFileSync(pj, JSON.stringify(project, null, 2) + "\n");
}
console.log(JSON.stringify({ dir, video: dest, width: v.width, height: v.height, duration, hasAudio }, null, 2));
