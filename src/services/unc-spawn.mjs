import os from 'node:os';

// Windows: cmd.exe không nhận thư mục làm việc dạng \\máy\share (tự về C:\Windows) → lệnh chạy sai chỗ khi app mở thẳng từ NAS không gán ổ.
// Lệnh cần shell + cwd UNC thì để cmd tự gán ổ tạm bằng pushd (gỡ khi lệnh xong). Ghép lệnh giống hệt Node làm với shell:true.
export const isUnc = (dir) => /^(\\\\|\/\/)[^\\/]+[\\/]/.test(String(dir || ''));
export function shellSafeOptions(command, args = [], options = {}, { platform = process.platform, comspec = process.env.ComSpec || 'cmd.exe' } = {}) {
  const cwd = options.cwd || process.cwd();
  if (platform !== 'win32' || !options.shell || !isUnc(cwd)) return { command, args, options };
  const line = `pushd "${String(cwd).replace(/\//g, '\\')}" && ${[command, ...args].join(' ')}`;
  return { command: comspec, args: ['/d', '/s', '/c', `"${line}"`], options: { ...options, shell: false, cwd: os.tmpdir(), windowsVerbatimArguments: true } };
}
export function spawnShellSafe(spawn, command, args, options) {
  const r = shellSafeOptions(command, args, options);
  return spawn(r.command, r.args, r.options);
}
