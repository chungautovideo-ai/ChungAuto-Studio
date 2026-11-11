import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { submitJob, claimJob, readJob, shouldOffload, localGpu } from '../src/services/render-farm.mjs';

test('a queued export is claimed by exactly one helper', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'contentos-farm-'));
  try {
    const job = submitJob(root, { projectDir: path.join(root, 'workspace/content/a'), quality: 'draft', revision: 'r1' });
    assert.equal(job.projectDir, 'workspace/content/a');
    const first = claimJob(root), second = claimJob(root);
    assert.equal(first.id, job.id); assert.equal(first.status, 'rendering');
    assert.equal(second, null);
    assert.equal(readJob(root, job.id).worker, os.hostname());
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('offload only goes to a live GPU helper on another machine', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'contentos-farm-'));
  try {
    const w = path.join(root, 'workspace/render-farm/workers'); fs.mkdirSync(w, { recursive: true });
    const put = (host, data) => fs.writeFileSync(path.join(w, host + '.json'), JSON.stringify({ host, hasGpu: true, gpu: 'RTX', at: Date.now(), ...data }));
    put(os.hostname(), {}); put('cu', { at: Date.now() - 120000 }); put('khong-gpu', { hasGpu: false });
    assert.equal(shouldOffload(root, { renderFarm: 'always' }), null);
    put('pc-manh', {});
    assert.equal(shouldOffload(root, { renderFarm: 'always' }).host, 'pc-manh');
    assert.equal(shouldOffload(root, { renderFarm: 'off' }), null);
    assert.equal(shouldOffload(root, {})?.host ?? null, localGpu().hasGpu ? null : 'pc-manh');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
