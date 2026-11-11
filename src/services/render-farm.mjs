// Xuất hộ qua máy mạnh: máy không có GPU đặt việc xuất vào hàng chờ trên NAS (app + dữ liệu dùng chung),
// máy có GPU chạy chế độ "máy xuất hộ" nhận việc và xuất bằng editor/tools/xuat-video.mjs. Không cần mở cổng mạng giữa các máy.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const farmDir = (root) => path.join(root, 'workspace', 'render-farm');
const ALIVE_MS = 45000;
const writeJson = (file, data) => { fs.mkdirSync(path.dirname(file), { recursive: true }); const t = `${file}.${process.pid}.tmp`; fs.writeFileSync(t, JSON.stringify(data, null, 1)); fs.renameSync(t, file); };
const readJson = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };

let gpuCache = null;
// GPU rời đủ mạnh để render (NVIDIA/AMD Radeon/Intel Arc). Card tích hợp không tính.
export function localGpu() {
  if (gpuCache) return gpuCache;
  let names = [];
  try {
    if (process.platform === 'win32') names = execFileSync('powershell', ['-NoProfile', '-Command', '(Get-CimInstance Win32_VideoController).Name'], { encoding: 'utf8', windowsHide: true, timeout: 10000 }).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  } catch {}
  const strong = names.filter((n) => /nvidia|geforce|rtx|gtx|quadro|radeon (rx|pro)|arc a\d/i.test(n));
  return (gpuCache = { names, hasGpu: strong.length > 0, gpu: strong[0] || '' });
}

export function heartbeat(root, extra = {}) {
  const g = localGpu();
  writeJson(path.join(farmDir(root), 'workers', `${os.hostname()}.json`), { host: os.hostname(), gpu: g.gpu, hasGpu: g.hasGpu, cpus: os.cpus().length, ramGB: Math.round(os.totalmem() / 2 ** 30), at: Date.now(), ...extra });
}
export function onlineWorkers(root) {
  const dir = path.join(farmDir(root), 'workers');
  let files = []; try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')); } catch {}
  return files.map((f) => readJson(path.join(dir, f))).filter((w) => w && w.hasGpu && w.host !== os.hostname() && Date.now() - w.at < ALIVE_MS);
}
// settings.renderFarm: 'auto' (mặc định: máy không GPU gửi đi khi có máy xuất hộ) | 'off' | 'always'
export function shouldOffload(root, settings = {}) {
  const mode = process.env.CONTENTOS_RENDER_FARM || settings.renderFarm || 'auto'; // biến môi trường: ép tạm khi thử, không đổi cài đặt chung
  if (mode === 'off' || process.env.CONTENTOS_RENDER_LOCAL === '1') return null;
  const workers = onlineWorkers(root);
  if (!workers.length || (mode === 'auto' && localGpu().hasGpu)) return null;
  return workers.sort((a, b) => (a.busy ? 1 : 0) - (b.busy ? 1 : 0))[0];
}

export function submitJob(root, { projectDir, quality, revision }) {
  const id = crypto.randomUUID(), file = path.join(farmDir(root), 'jobs', `${id}.json`);
  const job = { id, projectDir: path.relative(root, projectDir).replace(/\\/g, '/'), quality, revision, requester: os.hostname(), status: 'queued', progress: 0, log: '', createdAt: Date.now(), updatedAt: Date.now() };
  writeJson(file, job);
  return job;
}
export const readJob = (root, id) => readJson(path.join(farmDir(root), 'jobs', `${id}.json`));
export const updateJob = (root, id, patch) => { const file = path.join(farmDir(root), 'jobs', `${id}.json`), cur = readJson(file); if (cur) writeJson(file, { ...cur, ...patch, updatedAt: Date.now() }); };
// Nhận việc: tạo file khoá độc quyền (wx) để hai máy xuất hộ không cùng nhận một việc
export function claimJob(root) {
  const dir = path.join(farmDir(root), 'jobs');
  let files = []; try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort(); } catch {}
  for (const f of files) {
    const job = readJson(path.join(dir, f));
    if (!job || job.status !== 'queued') continue;
    try { fs.writeFileSync(path.join(dir, `${job.id}.claim`), os.hostname(), { flag: 'wx' }); } catch { continue; }
    updateJob(root, job.id, { status: 'rendering', worker: os.hostname(), startedAt: Date.now() });
    return readJob(root, job.id);
  }
  return null;
}
export const cancelJob = (root, id) => updateJob(root, id, { cancelRequested: true });
