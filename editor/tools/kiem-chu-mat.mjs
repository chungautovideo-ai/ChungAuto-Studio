#!/usr/bin/env node
// Kiểm chữ/đồ hoạ không đè mặt người nói, đo trên khung đã dựng (Chrome) tại từng lúc khối hiện.
//   node editor/tools/kiem-chu-mat.mjs <thư mục dự án> [--project <project.json|candidate-project.json>] [--phu-de]
// Chỉ đọc dự án; ghi cache dò mặt ở work/face-track/. Mỗi khối đè mặt → lỗi + gợi ý dịch y (lên trên đầu hoặc xuống dưới cằm,
// chọn chỗ gần nhất còn trong vùng an toàn) vì mặt di chuyển theo cảnh, không có một vị trí cố định đúng cho cả video.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { buildHtml, resolveTimeline } from '../lib/build.mjs';
import { renderEnvironment } from '../../src/services/render-environment.mjs';
import { findRenderBrowser } from '../../src/services/render-browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SAFE_TOP = 150, SAFE_BOTTOM = 1700, PAD = 24, MIN_OVERLAP = 0.02; // vùng an toàn TikTok/Reels khung 1920

function faceTrack(dir, src) {
  const file = path.resolve(dir, src), st = fs.statSync(file);
  const key = crypto.createHash('sha1').update(`${src}|${st.size}|${st.mtimeMs}`).digest('hex').slice(0, 16);
  const cache = path.join(dir, 'work', 'face-track', key + '.json');
  if (!fs.existsSync(cache)) {
    fs.mkdirSync(path.dirname(cache), { recursive: true });
    const py = [path.join(ROOT, 'tools', 'vision-embedded', 'python.exe'), path.join(ROOT, 'tools', 'vision-python', 'python.exe')].find(fs.existsSync) || 'python';
    execFileSync(py, ['-X', 'utf8', path.join(ROOT, 'editor', 'tools', 'do-mat.py'), file, cache, '--fps', '3'], { stdio: ['ignore', 'ignore', 'pipe'] });
  }
  return JSON.parse(fs.readFileSync(cache, 'utf8'));
}
const faceAt = (track, t) => { // mẫu gần nhất trong 0,5s, không có thì không kết luận
  let best = null;
  for (const s of track.samples) if (Math.abs(s[0] - t) <= 0.5 && (!best || Math.abs(s[0] - t) < Math.abs(best[0] - t))) best = s;
  return best && best[1] != null ? best.slice(1) : null;
};

export async function kiemChuMat(dir, { project, phuDe = false } = {}) {
  const p = project || JSON.parse(fs.readFileSync(path.join(dir, 'project.json'), 'utf8'));
  const r = resolveTimeline(p);
  const items = [...r.blocks.map((b) => ({ id: 'blk-' + String(b.id).replace(/[^a-zA-Z0-9_-]/g, ''), kind: 'khối', name: b.name || b.preset, start: b.start, dur: b.dur })),
    ...r.texts.map((t) => ({ id: t.id, kind: 'chữ', name: t.title || t.id, start: t.start, dur: t.dur })),
    ...(phuDe ? r.caps.map((c) => ({ id: 'cap-' + c.id, kind: 'phụ đề', name: c.id, start: c.start, dur: c.end - c.start })) : [])];
  const tracks = new Map();
  const html = path.join(dir, `.kiem-chu-mat-${process.pid}.html`);
  fs.writeFileSync(html, buildHtml(p, dir).replace('</body>', `<script>window.__seekKCM=t=>{const tl=window.__timelines&&window.__timelines.main;if(tl){tl.pause();tl.seek(t);}document.querySelectorAll("[data-start]").forEach(el=>{const s=+el.dataset.start,d=+el.dataset.duration;el.style.visibility=t>=s&&t<s+d?"visible":"hidden";});};</script></body>`));
  const require = createRequire(path.join(ROOT, 'engines', 'hyperframes', 'package.json'));
  const puppeteer = require('puppeteer-core');
  // Chrome trên ổ máy khởi động nhanh hơn bản kèm app trên NAS; không có thì dùng bản kèm app (chờ lâu hơn)
  const browser = await puppeteer.launch({ executablePath: findRenderBrowser() || renderEnvironment(ROOT).HYPERFRAMES_BROWSER_PATH, headless: true, timeout: 180000, protocolTimeout: 180000, args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  const loi = [], canh = [], thongKe = { daDo: 0, chuaHien: 0, canhTramChe: 0, khongThayMat: 0 };
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920 });
    await page.goto(pathToFileURL(html).href, { waitUntil: 'load', timeout: 120000 });
    for (const it of items) {
      for (const t of [it.start + Math.min(0.3, it.dur / 3), it.start + it.dur / 2, it.start + it.dur - Math.min(0.3, it.dur / 3)]) {
        const m = await page.evaluate((id, t) => {
          window.__seekKCM(t);
          const el = document.getElementById(id);
          if (!el || getComputedStyle(el).visibility === 'hidden') return null;
          let box = null; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let n; (n = w.nextNode());) {
            if (!n.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(n);
            for (const q of rg.getClientRects()) if (q.width > 2 && q.height > 2) box = box ? [Math.min(box[0], q.left), Math.min(box[1], q.top), Math.max(box[2], q.right), Math.max(box[3], q.bottom)] : [q.left, q.top, q.right, q.bottom];
          }
          const vis = (v) => getComputedStyle(v).visibility !== 'hidden' && +v.dataset.start <= t && t < +v.dataset.start + +v.dataset.duration;
          const cover = [...document.querySelectorAll('video.broll,img.broll-img')].some((v) => vis(v) && !/\b(pip|split)\b/.test(v.className));
          const talk = [...document.querySelectorAll('video.talk')].filter(vis).pop();
          if (!talk) return { box, cover, talk: null };
          const rc = talk.getBoundingClientRect(), cs = getComputedStyle(talk);
          return { box, cover, talk: { rect: [rc.left, rc.top, rc.width, rc.height], fit: cs.objectFit, src: talk.dataset.faceSource || talk.getAttribute('src'), ms: +talk.dataset.mediaStart || 0, start: +talk.dataset.start, rate: +talk.dataset.playbackRate || 1 } };
        }, it.id, t);
        if (!m?.box) { thongKe.chuaHien++; continue; }
        if (m.cover || !m.talk) { thongKe.canhTramChe++; continue; } // người đang bị cảnh trám toàn màn che
        if (!tracks.has(m.talk.src)) tracks.set(m.talk.src, faceTrack(dir, m.talk.src));
        const tr = tracks.get(m.talk.src), f = faceAt(tr, m.talk.ms + (t - m.talk.start) * m.talk.rate);
        if (!f) { thongKe.khongThayMat++; continue; }
        thongKe.daDo++;
        const [rx, ry, rw, rh] = m.talk.rect, vw = tr.w, vh = tr.h;
        const k = (m.talk.fit === 'contain' ? Math.min : Math.max)(rw / vw, rh / vh), ox = rx + (rw - vw * k) / 2, oy = ry + (rh - vh * k) / 2;
        const face = [ox + f[0] * vw * k, oy + f[1] * vh * k, ox + f[2] * vw * k, oy + f[3] * vh * k];
        const [a, b] = [m.box, face], ix = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])), iy = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
        const ratio = (ix * iy) / Math.max(1, (a[2] - a[0]) * (a[3] - a[1]));
        if (process.env.KIEM_CHU_MAT_DEBUG) console.error(JSON.stringify({ id: it.id, t: +t.toFixed(2), chu: a.map(Math.round), mat: face.map(Math.round), talk: m.talk.rect.map(Math.round), fit: m.talk.fit, ratio: +ratio.toFixed(3) }));
        if (ratio < MIN_OVERLAP) continue;
        const up = face[1] - PAD - a[3], down = face[3] + PAD - a[1]; // dịch y để chữ nằm trên đầu / dưới cằm
        const fits = (dy) => a[1] + dy >= SAFE_TOP && a[3] + dy <= SAFE_BOTTOM;
        const goi = [up, down].filter(fits).sort((x, y) => Math.abs(x) - Math.abs(y))[0];
        loi.push({ id: it.id, loai: it.kind, ten: it.name, luc: +t.toFixed(2), deMat: +(ratio * 100).toFixed(0) + '%', chu: a.map(Math.round), mat: face.map(Math.round),
          goiY: goi != null ? `dịch y ${goi > 0 ? '+' : ''}${Math.round(goi)}px (${goi < 0 ? 'lên trên đầu' : 'xuống dưới cằm'})` : 'không đủ chỗ trên/dưới mặt: thu nhỏ chữ, đổi sang bên trống, rút ngắn khối hoặc đặt trên cảnh trám' });
        break; // một lỗi mỗi khối là đủ để sửa
      }
    }
  } finally { await browser.close(); fs.rmSync(html, { force: true }); }
  if (items.length && !thongKe.daDo) canh.push('Không đo được lần nào (chữ không hiện hoặc không thấy mặt): xem preview bằng mắt.');
  return { ok: !loi.length, khoi_da_kiem: items.length, thongKe, loi, canh };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2), dir = args[0];
    if (!dir || dir.startsWith('--')) throw Error('Dùng: node editor/tools/kiem-chu-mat.mjs <thư mục dự án> [--project <file>] [--phu-de]');
    const pi = args.indexOf('--project'), project = pi > 0 ? JSON.parse(fs.readFileSync(args[pi + 1], 'utf8')) : undefined;
    const r = await kiemChuMat(path.resolve(dir), { project, phuDe: args.includes('--phu-de') });
    console.log(JSON.stringify(r, null, 2));
    if (!r.ok) process.exitCode = 1;
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
