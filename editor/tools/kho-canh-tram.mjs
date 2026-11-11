#!/usr/bin/env node
// Kho cảnh trám dùng chung (trên NAS) cho các mẫu faceless: tìm trước, có sẵn thì dùng lại, thiếu mới tải trên mạng.
//   node editor/tools/kho-canh-tram.mjs --tim "<từ khoá>" [--kenh qsc|news|blx] [--so 8]
//   node editor/tools/kho-canh-tram.mjs --them <file> --tags "a,b,c" [--chu-de X] [--kenh qsc,blx|chung] [--nguon pexels:ID] [--trang URL] [--mo-ta "..."]
//   node editor/tools/kho-canh-tram.mjs --lay <id> <thư mục dự án>      → <dự án>/inputs/kho/<id>.mp4 + ghi nguồn work/canh-tram-free.json
// Khác workspace/kho-canh-tram.json (danh sách link Google Drive). Clip trong kho đã chuẩn hoá 30fps, keyframe 0,5s, ≤1280px.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const KHO = path.join(ROOT, 'workspace', 'kho-canh-tram');
const INDEX = path.join(KHO, 'index.json');
const bin = (n) => { const p = path.join(ROOT, 'tools', 'ffmpeg', n + (process.platform === 'win32' ? '.exe' : '')); return fs.existsSync(p) ? p : n; };
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
const tokens = (s) => norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 1);

export const readIndex = () => { try { return JSON.parse(fs.readFileSync(INDEX, 'utf8')); } catch { return { version: 1, clips: [] }; } };
function writeIndex(idx) { // nhiều máy cùng ghi: ghi file tạm rồi đổi tên
  fs.mkdirSync(KHO, { recursive: true });
  const tmp = INDEX + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(idx, null, 1)); fs.renameSync(tmp, INDEX);
}

export function timKho(query, { kenh, so = 8 } = {}) {
  const q = tokens(query);
  return readIndex().clips
    .filter((c) => !kenh || !c.kenh?.length || c.kenh.includes('chung') || c.kenh.includes(kenh))
    .map((c) => { const hay = new Set(tokens([c.tags.join(' '), c.chuDe, c.moTa, c.xe, c.mau].join(' '))); return { c, score: q.filter((w) => hay.has(w)).length }; })
    .filter((x) => x.score > 0).sort((a, b) => b.score - a.score || (b.c.dungO?.length || 0) - (a.c.dungO?.length || 0)).slice(0, so)
    .map(({ c, score }) => ({ id: c.id, khop: `${score}/${q.length}`, file: path.relative(ROOT, path.join(KHO, c.file)).replace(/\\/g, '/'), dai: c.dur, khung: `${c.w}x${c.h}`, ngang: c.w > c.h, tags: c.tags, chuDe: c.chuDe, nguon: c.nguon, daDung: c.dungO?.length || 0 }));
}

export function themKho(file, { tags = [], chuDe = '', kenh = ['chung'], nguon = '', trang = '', moTa = '', xe = '', mau = '' } = {}) {
  const idx = readIndex(), sha = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const dup = idx.clips.find((c) => c.shaGoc === sha || (nguon && c.nguon === nguon));
  if (dup) return { ok: true, trung: true, id: dup.id };
  const id = (nguon ? nguon.replace(/[^a-z0-9]+/gi, '-') : 'clip-' + sha.slice(0, 10)).toLowerCase();
  fs.mkdirSync(KHO, { recursive: true });
  const out = path.join(KHO, id + '.mp4');
  execFileSync(bin('ffmpeg'), ['-v', 'error', '-y', '-i', file, '-an', '-r', '30', '-g', '15', '-keyint_min', '15', '-sc_threshold', '0', '-vf', "scale='if(gt(iw,ih),min(1280,iw),-2)':'if(gt(iw,ih),-2,min(1280,ih))'", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
  const pr = JSON.parse(execFileSync(bin('ffprobe'), ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', out], { encoding: 'utf8' }));
  const clip = { id, file: id + '.mp4', shaGoc: sha, w: pr.streams[0].width, h: pr.streams[0].height, dur: +(+pr.format.duration).toFixed(2), tags, chuDe, kenh, nguon, trang, moTa, xe, mau, themLuc: new Date().toISOString(), dungO: [] };
  writeIndex({ ...readIndex(), clips: [...readIndex().clips.filter((c) => c.id !== id), clip] });
  return { ok: true, id, file: path.relative(ROOT, out).replace(/\\/g, '/') };
}

export function layKho(id, dir) {
  const idx = readIndex(), c = idx.clips.find((x) => x.id === id);
  if (!c) throw Error('Không có clip này trong kho: ' + id);
  const dest = path.join(dir, 'inputs', 'kho', c.file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (!fs.existsSync(dest) || fs.statSync(dest).size !== fs.statSync(path.join(KHO, c.file)).size) fs.copyFileSync(path.join(KHO, c.file), dest);
  const credits = path.join(dir, 'work', 'canh-tram-free.json'); let list = [];
  try { list = JSON.parse(fs.readFileSync(credits, 'utf8')); } catch {}
  if (!list.some((x) => x.kho === c.id)) { fs.mkdirSync(path.dirname(credits), { recursive: true }); fs.writeFileSync(credits, JSON.stringify([...list, { kho: c.id, source: c.nguon || 'kho', page: c.trang || '', file: 'inputs/kho/' + c.file }], null, 2)); }
  const project = path.basename(dir);
  if (!c.dungO.includes(project)) { c.dungO.push(project); writeIndex(idx); }
  return { ok: true, src: 'inputs/kho/' + c.file, dai: c.dur, khung: `${c.w}x${c.h}`, ngang: c.w > c.h };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), get = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  try {
    let r;
    if (a[0] === '--tim') r = { ketQua: timKho(a[1] || '', { kenh: get('--kenh'), so: +(get('--so') || 8) }) };
    else if (a[0] === '--them') r = themKho(a[1], { tags: (get('--tags') || '').split(',').map((s) => s.trim()).filter(Boolean), chuDe: get('--chu-de') || '', kenh: (get('--kenh') || 'chung').split(','), nguon: get('--nguon') || '', trang: get('--trang') || '', moTa: get('--mo-ta') || '', xe: get('--xe') || '', mau: get('--mau') || '' });
    else if (a[0] === '--lay') r = layKho(a[1], path.resolve(a[2] || '.'));
    else throw Error('Dùng: --tim "<từ khoá>" [--kenh k] | --them <file> --tags "..." [...] | --lay <id> <dự án>');
    console.log(JSON.stringify(r, null, 2));
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
