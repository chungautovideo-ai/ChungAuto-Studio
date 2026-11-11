import test from 'node:test';
import assert from 'node:assert/strict';
import {autoCutMarks} from '../editor/lib/autocut.js';

const seg = (id, text) => ({id, in: 0, out: 1, keep: true, text});

test('marks filler-only segments and earlier takes, keeps the last full take', () => {
  const segs = [
    seg('s1', 'Ờ...'),
    seg('s2', 'Hôm nay mình sẽ'),
    seg('s3', 'Hôm nay mình sẽ review chiếc xe này.'),
    seg('s4', 'Giá xe là 500 triệu.'),
    seg('s5', 'Ừm, à'),
    seg('s6', 'Nội thất rất rộng'),
  ];
  const marks = autoCutMarks(segs);
  assert.deepEqual(marks.map((m) => m.id), ['s1', 's2', 's5']);
  assert.match(marks[1].reason, /s3/);
});

test('leaves distinct sentences and already-cut segments alone', () => {
  const segs = [seg('s1', 'Xe chạy êm.'), {...seg('s2', 'Ờ'), keep: false}, seg('s3', 'Xe tiết kiệm xăng.')];
  assert.deepEqual(autoCutMarks(segs), []);
});

test('near-duplicate retake with a changed word is still cut', () => {
  const segs = [seg('s1', 'Chiếc xe này có giá rất tốt'), seg('s2', 'Chiếc xe này có mức giá rất tốt')];
  assert.deepEqual(autoCutMarks(segs).map((m) => m.id), ['s1']);
});
