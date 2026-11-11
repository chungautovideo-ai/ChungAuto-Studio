import test from 'node:test';
import assert from 'node:assert/strict';
import {autoTextAnims,cleanTextAnim} from '../editor/lib/text-effects.js';

const t = (id, at, title, extra = {}) => ({id, at, dur: 2, title, fx: 'words', ...extra});

test('varied entrances, hook and number rules, all ids valid', () => {
  const texts = [t('a', 0.5, 'Xe *đẹp*'), t('b', 5, 'Giá 500 triệu'), t('c', 9, 'Nội thất rộng'), t('d', 13, 'Cách âm tốt'), t('e', 17, 'Lái êm'), t('f', 21, 'Đi phố gọn')];
  const out = autoTextAnims(texts), by = Object.fromEntries(out.map((x) => [x.id, x.anim]));
  assert.equal(out.length, 6);
  assert.equal(by.a.in.type, 'zoom-out');
  assert.equal(by.b.in.type, 'bounce');
  const ins = texts.map((x) => by[x.id].in.type);
  for (let i = 1; i < ins.length; i++) assert.notEqual(ins[i], ins[i - 1], `text ${i} repeats entrance`);
  for (const {anim} of out) assert.deepEqual(cleanTextAnim(anim), anim);
});

test('user anim and hidden texts are untouched; marker keeps its entrance', () => {
  const own = {in: {type: 'spin', dur: 0.5}};
  const texts = [t('a', 1, 'Hook'), t('b', 5, 'Đã chọn', {anim: own}), t('c', 9, 'Ẩn', {hidden: true}), t('d', 12, 'Nhấn mạnh', {fx: 'marker'})];
  const out = autoTextAnims(texts), ids = out.map((x) => x.id);
  assert.deepEqual(ids, ['a', 'd']);
  assert.equal(texts[1].anim, own);
  const d = out.find((x) => x.id === 'd').anim;
  assert.equal(d.in, undefined);
  assert.ok(d.out.type);
});

test('short clips get shorter animations; warnings shake', () => {
  const [x] = autoTextAnims([t('w', 6, 'Đừng làm vậy', {dur: 1})]);
  assert.equal(x.anim.in.type, 'shake');
  assert.equal(x.anim.out.type, 'drop');
  assert.equal(x.anim.in.dur, 0.3);
});
