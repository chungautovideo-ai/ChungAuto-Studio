import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { kiemCanhTram } from '../editor/tools/kiem-canh-tram.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ff = (() => { const p = path.join(root, 'tools', 'ffmpeg', 'ffmpeg' + (process.platform === 'win32' ? '.exe' : '')); return fs.existsSync(p) ? p : 'ffmpeg'; })();
const clip = (file, sec, fps = 30, g = 15) => execFileSync(ff, ['-v', 'error', '-y', '-f', 'lavfi', '-i', `testsrc=size=320x180:rate=${fps}`, '-t', String(sec), '-g', String(g), '-x264-params', `keyint=${g}:min-keyint=${g}:scenecut=0`, '-pix_fmt', 'yuv420p', file]);

test('voice-only B-roll: gaps and clip overrun are errors, fixed timeline passes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'contentos-broll-'));
  try {
    fs.mkdirSync(path.join(dir, 'inputs'));
    clip(path.join(dir, 'inputs', 'a.mp4'), 4); clip(path.join(dir, 'inputs', 'b.mp4'), 4);
    const base = { version: 1, format: '9:16', source: { video: 'inputs/raw.mp4', width: 1080, height: 1920, duration: 6, hasAudio: true, voiceOnly: true }, segments: [{ id: 's1', in: 0, out: 6, keep: true }], texts: [], zooms: [], scenes: [], blocks: [] };
    const bad = kiemCanhTram(dir, { project: { ...base, brolls: [
      { id: 'b1', src: 'inputs/a.mp4', at: 0, dur: 2, mode: 'full', mediaStart: 3 }, // cần đến 5s, clip 4s
      { id: 'b2', src: 'inputs/b.mp4', at: 2.5, dur: 3, mode: 'full', mediaStart: 0 }, // trống 2–2,5s và 5,5–6s
    ] } });
    assert.equal(bad.ok, false);
    assert.ok(bad.loi.some((x) => /b1.*hết hình/.test(x)));
    assert.ok(bad.loi.some((x) => /Khoảng trống 2\.00s/.test(x)));
    assert.ok(bad.loi.some((x) => /Cuối video/.test(x)));
    const good = kiemCanhTram(dir, { project: { ...base, brolls: [
      { id: 'b1', src: 'inputs/a.mp4', at: 0, dur: 3, mode: 'full', mediaStart: 0.5 },
      { id: 'b2', src: 'inputs/b.mp4', at: 3, dur: 3, mode: 'full', mediaStart: 0.5 },
    ] } });
    assert.deepEqual(good.loi, []);
    assert.deepEqual(good.canh, []);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('stutter causes are warned: 24fps, sparse keyframes, jump inside same clip', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'contentos-broll-'));
  try {
    fs.mkdirSync(path.join(dir, 'inputs'));
    clip(path.join(dir, 'inputs', 'slow.mp4'), 8, 24, 120);
    const r = kiemCanhTram(dir, { project: { version: 1, format: '9:16', source: { video: 'inputs/raw.mp4', width: 1080, height: 1920, duration: 4, hasAudio: true, voiceOnly: true }, segments: [{ id: 's1', in: 0, out: 4, keep: true }], texts: [], zooms: [], scenes: [], blocks: [], brolls: [
      { id: 'b1', src: 'inputs/slow.mp4', at: 0, dur: 2, mode: 'full', mediaStart: 0 },
      { id: 'b2', src: 'inputs/slow.mp4', at: 2, dur: 2, mode: 'full', mediaStart: 5 },
    ] } });
    assert.ok(r.canh.some((x) => /24\.00fps/.test(x)));
    assert.ok(r.canh.some((x) => /keyframe/.test(x)));
    assert.ok(r.canh.some((x) => /b2.*nhảy/.test(x)));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
