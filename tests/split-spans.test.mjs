import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeSplitSpans} from '../editor/lib/build.mjs';

const split = (start, dur) => ({mode: 'split', start, dur});

test('back-to-back split b-rolls keep the speaker down instead of bouncing between them', () => {
  // gaps 0.185 / 0.0 / 0.0 like a real project: one continuous span, no up-down jump
  const spans = mergeSplitSpans([split(15.8, 1.515), split(17.5, 1.15), split(18.65, 0.8), split(19.45, 1.652)]);
  assert.deepEqual(spans, [{start: 15.8, dur: 5.302}]);
});

test('splits far apart stay separate and other modes are ignored', () => {
  const spans = mergeSplitSpans([split(30, 2), {mode: 'full', start: 32.2, dur: 2}, split(10, 2), split(13.5, 1)]);
  assert.deepEqual(spans, [{start: 10, dur: 2}, {start: 13.5, dur: 1}, {start: 30, dur: 2}]);
});
