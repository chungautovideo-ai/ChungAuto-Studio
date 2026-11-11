import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { advance, pending } from '../src/services/telegram-pipeline.mjs';

function setup(req) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tgp-')), inbox = path.join(root, 'inbox'), dir = path.join(inbox, req.id);
  fs.mkdirSync(dir, { recursive: true });
  if (req.file) fs.writeFileSync(path.join(dir, req.file), 'video');
  fs.writeFileSync(path.join(dir, 'request.json'), JSON.stringify(req));
  const said = [], sent = [];
  let t = 0, asrRunning = false;
  const deps = {
    root, now: () => t,
    server: async (p, init) => {
      if (p.startsWith('/api/new-project')) { fs.mkdirSync(path.join(root, 'ws/proj/work'), { recursive: true }); return { ok: true, dir: 'ws/proj' }; }
      if (p === '/api/asr') return { status: {}, job: { running: asrRunning } }; // dạng asrState() của server
      if (p === '/api/ai-job') { assert.equal(JSON.parse(init.body).template, 'quan-su-car-v1'); return { ok: true }; }
    },
    exportVideo: async (d) => { const f = path.join(d, 'out.mp4'); fs.writeFileSync(f, 'x'); return f; },
    notify: async (c, m) => said.push(m), sendVideo: async (c, f) => sent.push(f),
  };
  return { inbox, dir, deps, said, sent, tick: (ms) => { t += ms; }, asr: (v) => { asrRunning = v; }, job: (v) => fs.writeFileSync(path.join(root, 'ws/proj/work/ai-job.json'), JSON.stringify(v)) };
}

test('video request goes project → AI job → export → sent to customer', async () => {
  const s = setup({ id: 'r1', chatId: '1', template: 'quan-su-car-v1', file: 'a.mp4', status: 'new' });
  s.asr(true);
  assert.equal((await advance(s.dir, s.deps)).status, 'transcribing'); // chờ khi máy đang nhận giọng
  s.asr(false);
  assert.equal((await advance(s.dir, s.deps)).status, 'building');
  assert.equal((await advance(s.dir, s.deps)).status, 'building'); // AI chưa xong
  s.job({ status: 'done' });
  assert.equal((await advance(s.dir, s.deps)).status, 'sent');
  assert.equal(s.sent.length, 1);
  assert.deepEqual(pending(s.inbox), []);
});

test('link request, AI error and timeout hand over to staff', async () => {
  const link = setup({ id: 'r2', chatId: '1', template: 'quan-su-car-v1', link: 'https://drive.google.com/x', status: 'new' });
  assert.equal((await advance(link.dir, link.deps)).status, 'needs-staff');

  const err = setup({ id: 'r3', chatId: '1', template: 'quan-su-car-v1', file: 'a.mp4', status: 'new' });
  await advance(err.dir, err.deps); await advance(err.dir, err.deps);
  err.job({ status: 'error', error: 'boom' });
  const failed = await advance(err.dir, err.deps);
  assert.equal(failed.status, 'error'); assert.match(failed.error, /boom/); assert.equal(err.said.length, 1);

  const slow = setup({ id: 'r4', chatId: '1', template: 'quan-su-car-v1', file: 'a.mp4', status: 'new' });
  await advance(slow.dir, slow.deps); await advance(slow.dir, slow.deps);
  slow.tick(4 * 3600 * 1000);
  assert.equal((await advance(slow.dir, slow.deps)).status, 'needs-staff');
});
