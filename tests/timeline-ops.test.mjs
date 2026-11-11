import test from 'node:test';
import assert from 'node:assert/strict';
import { snapTo, splitSpan, trimSpan, packRows, encodeWav } from '../editor/lib/timeline-ops.js';

test('encodeWav writes a valid mono 16-bit header and clamps samples', () => {
  const v = new DataView(encodeWav(new Float32Array([0, 1, -1, 2]), 48000));
  assert.equal(String.fromCharCode(v.getUint8(0), v.getUint8(1), v.getUint8(2), v.getUint8(3)), 'RIFF');
  assert.equal(v.getUint32(24, true), 48000);
  assert.equal(v.getUint32(40, true), 8);
  assert.deepEqual([v.getInt16(44, true), v.getInt16(46, true), v.getInt16(48, true), v.getInt16(50, true)], [0, 32767, -32768, 32767]);
});

test('packRows keeps a free chosen row, falls back when it collides and collapses empty rows', () => {
  const auto = packRows([{ id: 'a', start: 0, end: 4 }, { id: 'b', start: 2, end: 5 }, { id: 'c', start: 4, end: 6 }]);
  assert.deepEqual([...auto.rowOf], [['a', 0], ['b', 1], ['c', 0]]);
  assert.equal(auto.count, 2);
  const chosen = packRows([{ id: 'a', start: 0, end: 4 }, { id: 'c', start: 4, end: 6, row: 1 }]);
  assert.equal(chosen.rowOf.get('c'), 1);
  const collide = packRows([{ id: 'a', start: 0, end: 4, row: 0 }, { id: 'b', start: 1, end: 3, row: 0 }]);
  assert.deepEqual([collide.rowOf.get('a'), collide.rowOf.get('b')], [0, 1]);
  const gap = packRows([{ id: 'a', start: 0, end: 2, row: 5 }]);
  assert.deepEqual([gap.rowOf.get('a'), gap.count], [0, 1]);
});

test('snapTo picks the nearest point inside tolerance only', () => {
  assert.equal(snapTo(5.04, [0, 5, 5.1, 9], 0.08), 5);
  assert.equal(snapTo(5.2, [0, 5, 9], 0.08), null);
  assert.equal(snapTo(2, [], 1), null);
});

test('splitSpan refuses cuts at the edges and keeps total duration', () => {
  assert.equal(splitSpan(2, 3, 2.05), null);
  assert.equal(splitSpan(2, 3, 4.95), null);
  const [a, b] = splitSpan(2, 3, 3);
  assert.deepEqual(a, { start: 2, dur: 1 });
  assert.deepEqual(b, { start: 3, dur: 2 });
});

test('track hide/mute flags apply to the build copy and leave saved items untouched', async () => {
  const { normalizeProject } = await import('../editor/lib/build.mjs');
  const saved = { texts: [{ id: 't1', at: 1, dur: 2 }], blocks: [{ id: 'k1', group: 'chu' }, { id: 'k2' }], audio: { voice: 1, musicVolume: 0.1, clips: [{ id: 'a1', src: 'x.m4a' }] },
    captions: { enabled: true }, tracks: { texts: { hidden: true }, voice: { muted: true }, captions: { hidden: true }, 'audio-clips': { muted: true } } };
  const p = normalizeProject(structuredClone(saved));
  assert.equal(p.texts[0].hidden, true);
  assert.equal(p.blocks.find((b) => b.id === 'k1').hidden, true);
  assert.equal(p.blocks.find((b) => b.id === 'k2').hidden, undefined);
  assert.equal(p.audio.voice, 0);
  assert.equal(p.audio.musicVolume, 0.1);
  assert.equal(p.captions.enabled, false);
  assert.equal(p.audio.clips[0].hidden, true);
  assert.equal(saved.texts[0].hidden, undefined);
});

test('trimSpan keeps the right part for delete-left (Q) and the left part for delete-right (W)', () => {
  assert.deepEqual(trimSpan(10, 4, 11, 'left'), { start: 11, dur: 3 });
  assert.deepEqual(trimSpan(10, 4, 11, 'right'), { start: 10, dur: 1 });
  assert.equal(trimSpan(10, 4, 20, 'right'), null);
});
