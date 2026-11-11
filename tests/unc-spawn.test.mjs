import test from 'node:test';
import assert from 'node:assert/strict';
import { shellSafeOptions, isUnc } from '../src/services/unc-spawn.mjs';

test('shell command in a \\\\server\\share folder runs through pushd on Windows', () => {
  const r = shellSafeOptions('npx.cmd', ['hyperframes@0.9.6', 'render', '--output', 'renders/a.mp4'], { cwd: '\\\\chungauto\\Quay Dựng 2\\job', shell: true }, { platform: 'win32', comspec: 'cmd.exe' });
  assert.equal(r.command, 'cmd.exe');
  assert.deepEqual(r.args.slice(0, 3), ['/d', '/s', '/c']);
  assert.equal(r.args[3], '"pushd "\\\\chungauto\\Quay Dựng 2\\job" && npx.cmd hyperframes@0.9.6 render --output renders/a.mp4"');
  assert.equal(r.options.shell, false);
  assert.equal(r.options.windowsVerbatimArguments, true);
  assert.ok(!isUnc(r.options.cwd));
});

test('local folders, non-shell spawns and other platforms are unchanged', () => {
  const local = { cwd: 'X:\\STUDIO AI\\job', shell: true };
  assert.deepEqual(shellSafeOptions('npx.cmd', ['a'], local, { platform: 'win32' }), { command: 'npx.cmd', args: ['a'], options: local });
  const direct = { cwd: '\\\\chungauto\\share\\job', shell: false };
  assert.deepEqual(shellSafeOptions('node.exe', ['cli.mjs'], direct, { platform: 'win32' }), { command: 'node.exe', args: ['cli.mjs'], options: direct });
  const mac = { cwd: '//chungauto/share/job', shell: true };
  assert.deepEqual(shellSafeOptions('npx', ['a'], mac, { platform: 'darwin' }), { command: 'npx', args: ['a'], options: mac });
});
