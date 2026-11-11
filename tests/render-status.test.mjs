import test from 'node:test';
import assert from 'node:assert/strict';
import { describeRender, cleanRenderLog, lastRenderStage, explainRenderFailure, EXIT_CTRL_C } from '../editor/ui/render-status.js';

const bar = '  ████████░░░░░░░░░░░░░░░░░  34%  Capturing frame 389/2006 (2 workers)';
const hf = (o) => '@hf-progress ' + JSON.stringify(o);

test('cleanRenderLog bỏ thanh tiến độ, @hf-progress và trace, giữ dòng có nội dung', () => {
  const log = [bar, hf({ code: 'capture', done: 389, total: 2006, pct: 34 }), '[INFO] [Render:trace] {"phase":"encode"}', 'Lỗi: thiếu file inputs/a.mp4', 'Lỗi: thiếu file inputs/a.mp4', ''].join('\n');
  assert.deepEqual(cleanRenderLog(log), ['Lỗi: thiếu file inputs/a.mp4']);
});

test('lastRenderStage lấy dòng @hf-progress cuối và bỏ qua dòng bị cắt', () => {
  const log = [hf({ code: 'capture', done: 1, total: 10, pct: 1 }), hf({ code: 'assemble', done: 5, total: 60, pct: 97 }), '@hf-progress {"code":"asse'].join('\n');
  assert.equal(lastRenderStage(log).code, 'assemble');
  assert.equal(lastRenderStage('không có gì'), null);
});

test('đang chờ AI: không giả % và nói rõ chưa render', () => {
  const d = describeRender({ running: true, waitingAi: true, aiStatus: 'waiting', listener: false, startedAt: 1000 }, 61000);
  assert.equal(d.state, 'waiting');
  assert.equal(d.indeterminate, true);
  assert.equal(d.pct, 0);
  assert.equal(d.label, 'Chờ AI nhận việc');
  assert.equal(d.elapsed, '1:00');
});

test('AI đã nhận việc nhưng chưa có % → đang chuẩn bị, indeterminate', () => {
  const d = describeRender({ running: true, progress: 0, log: '', startedAt: 0 + 1, quality: 'final' }, 5001);
  assert.equal(d.state, 'running');
  assert.equal(d.indeterminate, true);
  assert.equal(d.label, 'Đang chuẩn bị');
});

test('đang chụp khung hình: % thật + bước chụp x/y', () => {
  const d = describeRender({ running: true, progress: 36, log: bar + '\n' + hf({ code: 'capture', done: 473, total: 2006, pct: 34 }), startedAt: 1, quality: 'final' }, 125001);
  assert.equal(d.state, 'running');
  assert.equal(d.indeterminate, false);
  assert.equal(d.label, 'Đang xuất 36%');
  assert.equal(d.detail, 'Chụp khung hình 473/2006');
  assert.equal(d.canCancel, true);
});

test('đang hoàn tất: giữ 99%, không cho huỷ', () => {
  const d = describeRender({ running: true, finalizing: true, progress: 99, startedAt: 1 }, 2);
  assert.equal(d.state, 'finalizing');
  assert.equal(d.pct, 99);
  assert.equal(d.canCancel, false);
});

test('render báo xong nhưng tiến trình thoát mã Ctrl+C: ok vẫn là xong và ghi chú rõ', () => {
  const d = describeRender({ running: false, ok: true, progress: 100, exitNote: 'Tiến trình render thoát với mã 3221225478 sau khi báo hoàn tất; đã kiểm lại file trước khi nhận.', startedAt: 1, finishedAt: 1001 });
  assert.equal(d.state, 'done');
  assert.match(d.detail, /đã kiểm lại file/);
});

test('lỗi mã Ctrl+C trước khi báo xong → lý do rõ, kèm log đã lọc', () => {
  const job = { running: false, ok: false, exitCode: EXIT_CTRL_C, log: bar + '\n' + hf({ code: 'capture', done: 3, total: 9, pct: 1 }) + '\nChrome closed unexpectedly' };
  const e = explainRenderFailure(job);
  assert.equal(e.headline, 'Tiến trình render bị ngắt');
  assert.deepEqual(e.lines, ['Chrome closed unexpectedly']);
  const d = describeRender(job);
  assert.equal(d.state, 'failed');
  assert.equal(d.label, 'Xuất lỗi');
});

test('tiến trình chết giữa chừng và lỗi bản chụp có tiêu đề riêng', () => {
  assert.equal(explainRenderFailure({ log: 'x\nTiến trình xuất bị dừng giữa chừng.' }).headline, 'Tiến trình xuất bị dừng giữa chừng');
  assert.equal(explainRenderFailure({ log: 'Không tạo được bản chụp render: thiếu file' }).headline, 'Không chuẩn bị được bản chụp dự án');
  assert.equal(explainRenderFailure({ log: 'Render ok\nKhông xác minh/lưu được bản xuất: lệch thời lượng' }).headline, 'Render xong nhưng không lưu được bản xuất');
});

test('huỷ là trạng thái riêng, không gọi là lỗi', () => {
  assert.equal(describeRender({ running: false, ok: false, cancelled: true, startedAt: 1 }).state, 'cancelled');
});

test('không có job → idle', () => {
  assert.equal(describeRender(null).state, 'idle');
  assert.equal(describeRender({ running: false }).state, 'idle');
});
