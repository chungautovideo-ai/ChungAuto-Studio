#!/usr/bin/env node
// Chạy trên PC mạnh (có GPU): nhận việc xuất video của các máy không có GPU qua hàng chờ trên NAS và xuất hộ.
//   node editor/tools/may-xuat-ho.mjs        (để cửa sổ mở; Ctrl+C để dừng nhận việc)
// Mỗi 3 giây báo "còn sống" vào workspace/render-farm/workers; mỗi lần một việc; file ra ghi vào renders/ của dự án trên NAS.
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { heartbeat, claimJob, updateJob, readJob, localGpu } from '../../src/services/render-farm.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const g = localGpu();
console.log(`Máy xuất hộ: ${g.hasGpu ? g.gpu : 'KHÔNG thấy GPU rời — máy khác sẽ không gửi việc sang'} · đang chờ việc…`);
let current = null;
const kill = (pid) => { try { process.platform === 'win32' ? execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' }) : process.kill(pid, 'SIGKILL'); } catch {} };

function run(job) {
  const content = path.join(ROOT, 'workspace', 'content') + path.sep, abs = path.resolve(ROOT, job.projectDir);
  if (!abs.startsWith(content)) { updateJob(ROOT, job.id, { status: 'failed', log: 'Dự án ngoài workspace/content — từ chối.', finishedAt: Date.now() }); return; }
  current = job;
  console.log(`→ Nhận việc ${job.id} từ ${job.requester}: ${job.projectDir} (${job.quality})`);
  const args = [path.join(ROOT, 'editor', 'tools', 'xuat-video.mjs'), path.join(ROOT, job.projectDir), '--quality', job.quality, ...(job.revision ? ['--revision', job.revision] : [])];
  const child = spawn(process.execPath, args, { cwd: ROOT, env: { ...process.env, CONTENTOS_RENDER_TO_PROJECT: '1', CONTENTOS_RENDER_LOCAL: '1' }, windowsHide: true });
  let log = '', progress = 0, saved = '', last = 0;
  const onData = (d) => {
    const s = d.toString().replace(/\x1b\[[0-9;?]*[A-Za-z]/g, ''); log = (log + s).slice(-6000);
    const m = s.match(/(\d{1,3}(?:\.\d+)?)\s*%/g); if (m) progress = Math.min(100, parseFloat(m.at(-1)));
    const sv = s.match(/SAVED (.+)/); if (sv) saved = sv[1].trim();
    if (Date.now() - last > 2000) { last = Date.now(); updateJob(ROOT, job.id, { progress, log: log.slice(-1500) }); if (readJob(ROOT, job.id)?.cancelRequested) kill(child.pid); }
  };
  child.stdout.on('data', onData); child.stderr.on('data', onData);
  child.on('close', (code) => {
    const ok = code === 0 && !!saved;
    updateJob(ROOT, job.id, { status: ok ? 'done' : (readJob(ROOT, job.id)?.cancelRequested ? 'cancelled' : 'failed'), progress: ok ? 100 : progress, exitCode: code, saved: ok ? path.relative(ROOT, saved).replace(/\\/g, '/') : '', log: log.slice(-6000), finishedAt: Date.now() });
    console.log(ok ? `✓ Xong ${job.id}: ${saved}` : `✗ Lỗi ${job.id} (mã ${code})`);
    current = null;
  });
}
setInterval(() => {
  heartbeat(ROOT, { busy: !!current, jobId: current?.id || null });
  if (!current && g.hasGpu) { const job = claimJob(ROOT); if (job) run(job); }
}, 3000);
heartbeat(ROOT, { busy: false });
