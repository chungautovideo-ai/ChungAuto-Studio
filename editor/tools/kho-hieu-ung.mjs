#!/usr/bin/env node
// Kho hiệu ứng dùng chung (workspace/kho-hieu-ung.json trên NAS — cùng file với "Kho hiệu ứng" trong editor) cho agent:
// phân tích xong / tạo hiệu ứng mới → cất vào kho; lần sau tìm trong kho trước, có thì dùng lại, chưa có mới tạo.
//   node editor/tools/kho-hieu-ung.mjs --tim "<từ khoá>" [--loai blocks|texts|brolls] [--so 8]
//   node editor/tools/kho-hieu-ung.mjs --xem <id>                              → in đủ html/css/anim của mục
//   node editor/tools/kho-hieu-ung.mjs --them <file.json> [--tu-video "<nguồn phân tích>"] [--boi codex|claude|antigravity]
//   node editor/tools/kho-hieu-ung.mjs --lay <id> <candidate-project.json> --at <giây nguồn> [--dur <giây>]
// file.json của --them: { kind: "blocks"|"texts"|"brolls", name, tags:[...], desc, dur, html, css, anim, fields, sfx, ... }
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const KHO_FILE = path.join(ROOT, 'workspace', 'kho-hieu-ung.json');
const KINDS = ['blocks', 'texts', 'brolls'];
const MAX_ITEM = 400 * 1024; // mục quá lớn (ảnh base64 nặng) làm chậm editor trên mọi máy
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
const tokens = (s) => norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 1);
const fingerprint = (it) => crypto.createHash('sha256').update(JSON.stringify([it.kind, it.html || '', it.css || '', it.text || null, it.mode || '', it.frame || ''])).digest('hex');

export const readKho = (file = KHO_FILE) => { try { const v = JSON.parse(fs.readFileSync(file, 'utf8')); return Array.isArray(v) ? v : []; } catch { return []; } };
function writeKho(list, file = KHO_FILE) { // nhiều máy cùng ghi: ghi file tạm rồi đổi tên
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(list, null, 1)); fs.renameSync(tmp, file);
}

export function timKho(query, { loai, so = 8, file } = {}) {
  const q = tokens(query);
  return readKho(file).filter((x) => !loai || (x.kind || 'blocks') === loai)
    .map((x) => { const hay = new Set(tokens([x.name, x.desc, (x.tags || []).join(' '), x.group, x.from, x.tuVideo].join(' '))); return { x, score: q.filter((w) => hay.has(w)).length }; })
    .filter((r) => r.score > 0 || !q.length).sort((a, b) => b.score - a.score || (b.x.dungO?.length || 0) - (a.x.dungO?.length || 0)).slice(0, so)
    .map(({ x, score }) => ({ id: x.id, khop: `${score}/${q.length}`, loai: x.kind || 'blocks', ten: x.name, moTa: x.desc || '', tags: x.tags || [], dai: x.dur, tuMau: x.from || '', tuVideo: x.tuVideo || '', daDung: x.dungO?.length || 0 }));
}

export function kiemMuc(it) {
  if (!it || typeof it !== 'object' || Array.isArray(it)) throw Error('Mục phải là object JSON.');
  if (!KINDS.includes(it.kind)) throw Error('kind phải là blocks | texts | brolls.');
  if (!String(it.name || '').trim()) throw Error('Thiếu name.');
  if (it.kind === 'blocks' && !String(it.html || '').trim()) throw Error('Khối đồ hoạ (blocks) cần html.');
  if (it.kind === 'texts' && (!it.text || typeof it.text !== 'object')) throw Error('Chữ (texts) cần object text.');
  const body = JSON.stringify(it);
  if (Buffer.byteLength(body) > MAX_ITEM) throw Error('Mục quá lớn (>400 KB): bỏ ảnh base64 nặng, dùng ảnh nhỏ hoặc CSS.');
  // kho chỉ chứa HTML/CSS khai báo + anim dạng dữ liệu; không nhận mã chạy
  if (/<script|<iframe|<object|<embed|javascript:|\son[a-z]+\s*=|@import|expression\(/i.test(`${it.html || ''} ${it.css || ''}`)) throw Error('html/css có mã chạy (script, on*=, javascript:, @import…) — không nhận vào kho.');
}

export function themKho(it, { tuVideo = '', boi = '', file, now = new Date() } = {}) {
  kiemMuc(it);
  const list = readKho(file), fp = fingerprint(it), dup = list.find((x) => x.fp === fp || fingerprint(x) === fp);
  if (dup) return { ok: true, trung: true, id: dup.id };
  const { id: _i, savedAt: _s, dungO: _d, fp: _f, ...rest } = it;
  const item = { ...rest, group: it.kind === 'blocks' ? (it.group === 'chu' ? 'chu' : 'dohoa') : it.group, name: String(it.name).trim().slice(0, 80),
    tags: (Array.isArray(it.tags) ? it.tags : []).map((t) => String(t).trim()).filter(Boolean).slice(0, 20), desc: String(it.desc || '').slice(0, 500),
    tuVideo: String(tuVideo || it.tuVideo || '').slice(0, 300), boi: String(boi || '').slice(0, 30), fp,
    id: 'kho-' + now.getTime().toString(36) + crypto.randomBytes(2).toString('hex'), savedAt: now.toISOString(), dungO: [] };
  writeKho([item, ...readKho(file)], file);
  return { ok: true, id: item.id };
}

export function layKho(id, candidateFile, { at, dur, file } = {}) {
  const list = readKho(file), pr = list.find((x) => x.id === id);
  if (!pr) throw Error('Không có hiệu ứng này trong kho: ' + id);
  if (!/candidate-project\.json$/.test(candidateFile)) throw Error('Chỉ chèn vào job.candidate (…/candidate-project.json), không sửa project.json gốc.');
  const proj = JSON.parse(fs.readFileSync(candidateFile, 'utf8'));
  const t = Number(at);
  if (!Number.isFinite(t) || t < 0) throw Error('Cần --at <giây> (mốc theo video nguồn).');
  const kind = pr.kind || 'blocks', items = (proj[kind] ||= []);
  const uid = (p) => { let i = items.length + 1; while (items.some((x) => x.id === p + i)) i++; return p + i; };
  let added;
  if (kind === 'texts') added = { id: uid('t'), at: t, dur: Number(dur) || pr.dur || 2.5, ...structuredClone(pr.text) };
  else if (kind === 'blocks') {
    added = { id: uid('k'), name: pr.name, at: t, dur: Number(dur) || pr.dur || 3, layer: 'front', fx: 'none', out: 'fade', sfx: pr.sfx || 'none',
      html: pr.html, css: (pr.css || '') + (pr.tplCss ? '\n' + pr.tplCss : ''), anim: structuredClone(pr.anim || []), cues: [], fields: structuredClone(pr.fields || []), preset: pr.id, group: pr.group };
    for (const k of ['x', 'y', 'scale', 'layer', 'fx', 'out', 'pan', 'panDur', 'wordSfx', 'wordSfxVol', 'cam']) if (pr[k] != null) added[k] = structuredClone(pr[k]);
  } else throw Error('Kiểu cảnh trám (brolls) là kiểu hiển thị: áp mode/frame/tIn/x/y/scale vào cảnh trám có sẵn bằng tay (xem --xem ' + id + ').');
  items.push(added);
  fs.writeFileSync(candidateFile, JSON.stringify(proj, null, 2) + '\n');
  const project = path.basename(path.resolve(candidateFile, '..', '..', '..', '..', '..'));
  if (!pr.dungO?.includes(project)) { pr.dungO = [...(pr.dungO || []), project]; writeKho(list, file); }
  return { ok: true, kind, id: added.id, at: t, dur: added.dur };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), get = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  try {
    let r;
    if (a[0] === '--tim') r = { ketQua: timKho(a[1] || '', { loai: get('--loai'), so: +(get('--so') || 8) }) };
    else if (a[0] === '--xem') { r = readKho().find((x) => x.id === a[1]); if (!r) throw Error('Không có: ' + a[1]); }
    else if (a[0] === '--them') r = themKho(JSON.parse(fs.readFileSync(a[1], 'utf8')), { tuVideo: get('--tu-video'), boi: get('--boi') });
    else if (a[0] === '--lay') r = layKho(a[1], path.resolve(a[2] || ''), { at: get('--at'), dur: get('--dur') });
    else throw Error('Dùng: --tim "<từ khoá>" [--loai blocks|texts|brolls] | --xem <id> | --them <file.json> [--tu-video "..."] [--boi agent] | --lay <id> <candidate-project.json> --at <giây>');
    console.log(JSON.stringify(r, null, 2));
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
