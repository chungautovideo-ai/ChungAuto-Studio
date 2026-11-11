import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { themKho, timKho, layKho, readKho } from '../editor/tools/kho-hieu-ung.mjs';

const block = { kind: 'blocks', name: 'Thẻ giá xe bật lên', tags: ['giá', 'xe', 'popup'], desc: 'Thẻ giá nền vàng bật từ dưới lên', dur: 2, html: '<div class="gia">{{gia}}</div>', css: '.gia{color:#000}' };

test('add, dedupe, search and insert into candidate', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'khu-')), file = path.join(dir, 'kho.json');
  const a = themKho(block, { file, tuVideo: 'rea-video:dual_role', boi: 'claude' });
  assert.ok(a.id);
  assert.equal(themKho({ ...block, name: 'tên khác' }, { file }).trung, true); // cùng html/css → không thêm bản trùng
  const hit = timKho('gia xe', { file });
  assert.equal(hit[0].id, a.id);
  assert.equal(hit[0].tuVideo, 'rea-video:dual_role');

  const cand = path.join(dir, 'proj', 'work', 'build-candidates', 'tok', 'work', 'candidate-project.json');
  fs.mkdirSync(path.dirname(cand), { recursive: true });
  fs.writeFileSync(cand, JSON.stringify({ blocks: [{ id: 'k1' }] }));
  const r = layKho(a.id, cand, { at: 4.5, file });
  assert.equal(r.id, 'k2');
  const p = JSON.parse(fs.readFileSync(cand, 'utf8'));
  assert.equal(p.blocks[1].html, block.html);
  assert.equal(p.blocks[1].at, 4.5);
  assert.deepEqual(readKho(file)[0].dungO, ['proj']);
});

test('rejects executable html, original project.json and bad kinds', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'khu-')), file = path.join(dir, 'kho.json');
  assert.throws(() => themKho({ ...block, html: '<img src=x onerror="alert(1)">' }, { file }), /mã chạy/);
  assert.throws(() => themKho({ ...block, html: '<script>x</script>' }, { file }), /mã chạy/);
  assert.throws(() => themKho({ ...block, kind: 'zooms' }, { file }), /kind/);
  const { id } = themKho(block, { file });
  const pj = path.join(dir, 'project.json'); fs.writeFileSync(pj, '{}');
  assert.throws(() => layKho(id, pj, { at: 1, file }), /candidate/);
});
