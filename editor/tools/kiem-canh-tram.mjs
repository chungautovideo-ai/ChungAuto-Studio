#!/usr/bin/env node
// Kiểm cảnh trám trước khi bàn giao: khoảng đen, mất tiếng, hết hình giữa cảnh, clip có đoạn đen, nguyên nhân giật hình.
//   node editor/tools/kiem-canh-tram.mjs <thư mục dự án> [--project <project.json|candidate-project.json>] [--phu-kin]
// Chỉ đọc. Dự án voiceOnly (hoặc --phu-kin cho mẫu faceless) bắt buộc phủ kín. Có lỗi → exit 1.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveTimeline } from '../lib/build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const bin = (n) => { const p = path.join(ROOT, 'tools', 'ffmpeg', n + (process.platform === 'win32' ? '.exe' : '')); return fs.existsSync(p) ? p : n; };
const GAP = 0.04, MIN_SHOT = 1.0, FLASH = 0.5, MAX_KEY_GAP = 1.0, MAX_CLIP_DUR = 25.0, WEBAUDIO_PAD_TOL = 0.22;

const info = new Map();
function probe(file) {
  if (info.has(file)) return info.get(file);
  const run = (args) => execFileSync(bin('ffprobe'), args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const j = JSON.parse(run(['-v', 'error', '-show_entries', 'stream=codec_type,r_frame_rate,duration:format=duration', '-of', 'json', file]));
  const vs = (j.streams || []).find((s) => s.codec_type === 'video') || {};
  const as = (j.streams || []).find((s) => s.codec_type === 'audio') || {};
  const [n, d] = String(vs.r_frame_rate || '0/1').split('/').map(Number);
  const keys = run(['-v', 'error', '-select_streams', 'v:0', '-skip_frame', 'nokey', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', file]).split(/[\s,]+/).filter(Boolean).map(Number).filter(Number.isFinite);
  const r = {
    dur: Number(j.format?.duration) || Number(vs.duration) || 0,
    vDur: Number(vs.duration) || Number(j.format?.duration) || 0,
    aDur: Number(as.duration) || 0,
    hasAudio: Boolean(as.codec_type),
    fps: d ? n / d : 0,
    keyGap: keys.slice(1).reduce((m, t, i) => Math.max(m, t - keys[i]), 0)
  };
  info.set(file, r);
  return r;
}
// đoạn hình đen trong khoảng clip thực sự được dùng (ffmpeg ghi kết quả ra stderr)
function blackSpans(file, from, len) {
  if (len <= 0) return [];
  const r = spawnSync(bin('ffmpeg'), ['-v', 'info', '-ss', String(from), '-t', String(len), '-i', file, '-an', '-vf', 'blackdetect=d=0.1:pix_th=0.10', '-f', 'null', '-'], { encoding: 'utf8' });
  return [...String(r.stderr || '').matchAll(/black_start:\s*([\d.]+)\s+black_end:\s*([\d.]+)/g)].map((m) => [+(from + Number(m[1])).toFixed(2), +(from + Number(m[2])).toFixed(2)]);
}

export function kiemCanhTram(dir, { project, phuKin = false } = {}) {
  const p = project || JSON.parse(fs.readFileSync(path.join(dir, 'project.json'), 'utf8'));
  const { tm, brolls } = resolveTimeline(p);
  const total = tm.total, loi = [], canh = [], must = phuKin || !!p.source?.voiceOnly, fmt = (t) => `${(+t).toFixed(2)}s`;
  const shots = brolls.filter((b) => !b.hidden).sort((a, b) => a.start - b.start);

  // 0) kiểm luồng âm thanh nguồn (chống mất tiếng trên WebAudio của HyperFrames khi video.duration - audio.duration > 0.25s)
  if (p.source?.video) {
    const srcFile = path.resolve(dir, p.source.video);
    if (fs.existsSync(srcFile)) {
      const sc = probe(srcFile);
      if (must && (p.audio?.voice === 0 || p.source?.hasAudio === false || !sc.hasAudio)) {
        loi.push(`Nguồn giọng đọc (${p.source.video}) bị tắt hoặc thiếu luồng audio → mất hết tiếng`);
      } else if (sc.hasAudio && sc.aDur > 0 && sc.dur - sc.aDur > WEBAUDIO_PAD_TOL) {
        loi.push(`Nguồn ${p.source.video} có hình dài hơn tiếng ${(sc.dur - sc.aDur).toFixed(2)}s (>0.22s) → WebAudio từ chối bộ đệm gây mất tiếng khi chuyển cảnh. Tạo lại raw.mp4 kèm -af apad=whole_dur=${sc.dur} -t ${sc.dur}`);
      }
    }
  }

  // 1) phủ kín: không khe nào lộ video gốc (nền đen khi chỉ có giọng đọc)
  let cur = 0;
  for (const b of shots) {
    if (b.start > cur + GAP) (must ? loi : canh).push(`Khoảng trống ${fmt(cur)}–${fmt(b.start)} không có cảnh trám${must ? ' (lộ nền đen)' : ''}`);
    cur = Math.max(cur, b.start + b.dur);
  }
  if (total > cur + GAP) (must ? loi : canh).push(`Cuối video ${fmt(cur)}–${fmt(total)} không có cảnh trám${must ? ' (lộ nền đen)' : ''}`);

  // 2) từng cảnh: độ dài, hết hình, hình đen, nhịp khung, keyframe, clip quá dài chưa cắt riêng, nhảy cóc/chưa gộp cùng clip
  for (const [i, b] of shots.entries()) {
    const ten = `Cảnh ${b.id} (${fmt(b.start)}, ${b.src})`, file = path.resolve(dir, b.src || '');
    if (!b.src || !fs.existsSync(file)) { loi.push(`${ten}: không thấy file`); continue; }
    if (b.dur < FLASH) loi.push(`${ten}: dài ${fmt(b.dur)} → nháy hình. Gộp vào cảnh bên cạnh`);
    else if (b.dur < MIN_SHOT) canh.push(`${ten}: dài ${fmt(b.dur)} (<1s) dễ thành giật, nên ≥1,5s`);
    if (/\.(png|jpe?g|webp|gif)$/i.test(b.src)) continue;
    const ms = Number(b.mediaStart) || 0, rate = Number(b.speed) > 0 ? Number(b.speed) : 1, need = b.dur * rate, c = probe(file);
    if (ms < 0) loi.push(`${ten}: mediaStart âm`);
    if (ms + need > c.dur - GAP) loi.push(`${ten}: clip dài ${fmt(c.dur)} nhưng cảnh cần đến ${fmt(ms + need)} → đứng/hết hình ${fmt(ms + need - c.dur)} cuối cảnh. Giảm mediaStart, rút cảnh hoặc đổi clip`);
    if (shots.length > 10 && c.dur > MAX_CLIP_DUR) loi.push(`${ten}: clip gốc dài ${fmt(c.dur)} (>25s) trong bản dựng nhiều cảnh → trình phát không nạp trọn bộ đệm (GM=false), tự gỡ src và dừng tiếng (stopAll) gây khoảng đen + mất tiếng. Cắt riêng đoạn dùng (-ss ${ms} -t ${(need + 0.4).toFixed(1)}) vào inputs/chuan/ với mediaStart=0`);
    if (c.fps && Math.abs(c.fps - 30) > 0.5 && Math.abs(c.fps - 60) > 0.5) canh.push(`${ten}: ${c.fps.toFixed(2)}fps trong khung 30fps → chuyển động giật nhẹ. Nén lại -r 30`);
    if (c.keyGap > MAX_KEY_GAP) canh.push(`${ten}: keyframe cách ${c.keyGap.toFixed(1)}s → tua vào giữa clip dễ khựng. Nén lại -g 15`);
    const black = blackSpans(file, ms, Math.min(need, Math.max(0, c.dur - ms)));
    if (black.length) loi.push(`${ten}: hình đen ở ${black.map(([a, z]) => `${a}–${z}s`).join(', ')} trong clip. Đổi mediaStart hoặc clip khác`);
    const prev = shots[i - 1];
    if (prev && prev.src === b.src && prev.start + prev.dur > b.start - GAP) {
      const end = (Number(prev.mediaStart) || 0) + prev.dur * (Number(prev.speed) > 0 ? Number(prev.speed) : 1);
      if (Math.abs(ms - end) <= 0.1 && (prev.mode || 'full') === (b.mode || 'full') && (prev.y || 0) === (b.y || 0) && (prev.scale || 1) === (b.scale || 1)) {
        loi.push(`${ten}: liền sau cảnh ${prev.id} cùng clip và mediaStart nối tiếp (${fmt(end)} → ${fmt(ms)}) chưa gộp → sinh thẻ <video> thừa gây khoảng đen và ngắt tiếng. Gộp thành 1 cảnh liền mạch`);
      } else if (Math.abs(ms - end) > 0.1) {
        canh.push(`${ten}: liền sau cảnh cùng clip nhưng nhảy từ ${fmt(end)} sang ${fmt(ms)} trong clip → trông như giật. Đổi clip/góc khác hoặc nối liền mediaStart`);
      }
    }
  }
  return { ok: !loi.length, tong: +total.toFixed(2), canh_tram: shots.length, phu_kin_bat_buoc: must, loi, canh };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2), dir = args[0];
    if (!dir || dir.startsWith('--')) throw Error('Dùng: node editor/tools/kiem-canh-tram.mjs <thư mục dự án> [--project <file>] [--phu-kin]');
    const pi = args.indexOf('--project'), project = pi > 0 ? JSON.parse(fs.readFileSync(args[pi + 1], 'utf8')) : undefined;
    const r = kiemCanhTram(path.resolve(dir), { project, phuKin: args.includes('--phu-kin') });
    console.log(JSON.stringify(r, null, 2));
    if (!r.ok) process.exitCode = 1;
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
