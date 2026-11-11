import fs from 'node:fs';
import os from 'node:os';

// Lỗi Windows/SMB khi vào kho NAS → nguyên nhân + cách sửa người dùng làm được. Dùng chung cho kho NAS trong app và doctor.
const host = (root) => (/^[\\/]{2}([^\\/]+)/.exec(String(root || '')) || [])[1] || '';
export function nasErrorMessage(error, nasRoot) {
  const code = error?.code || (error?.name === 'TimeoutError' ? 'ETIMEDOUT' : 'UNKNOWN'), h = host(nasRoot);
  const open = h ? `Mở File Explorer, gõ \\\\${h} rồi Enter` : 'Mở thư mục kho trong File Explorer';
  if (['EACCES', 'EPERM', 'ELOGON'].includes(code)) return { code, reason: 'Máy này chưa đăng nhập hoặc không có quyền vào kho NAS.', fix: `${open}, đăng nhập tài khoản NAS và tick "Remember my credentials", rồi bấm Tải lại trong app.` };
  if (code === 'ETIMEDOUT' || code === 'EHOSTUNREACH' || code === 'ENETUNREACH') return { code, reason: 'NAS không phản hồi (mất mạng, NAS tắt hoặc mạng chậm).', fix: `Kiểm tra máy đang cùng mạng với NAS. ${open} để thử; nếu Explorer cũng không vào được thì báo người quản lý NAS.` };
  if (['ENOENT', 'ENOTDIR', 'UNKNOWN', 'EINVAL', 'ENOTFOUND', 'EBADF'].includes(code)) return { code, reason: h ? `Máy này không tìm thấy kho ${nasRoot} (sai tên máy NAS/thư mục share, hoặc chưa kết nối mạng NAS).` : `Không thấy thư mục kho ${nasRoot}.`, fix: `${open}. Nếu không vào được bằng tên, thử bằng địa chỉ IP của NAS rồi sửa "Kho NAS" ở Không gian làm việc cho đúng đường dẫn máy này vào được.` };
  return { code, reason: `Không đọc được kho NAS (${code}).`, fix: `${open} để kiểm tra quyền và kết nối.` };
}
export class NasError extends Error {
  constructor(error, nasRoot) { const m = nasErrorMessage(error, nasRoot); super(`${m.reason} ${m.fix}`); this.code = m.code; this.reason = m.reason; this.fix = m.fix; this.status = 503; }
}
// Kiểm thật: stat + đọc danh sách thư mục gốc, có giới hạn thời gian (share SMB treo có thể giữ rất lâu).
export async function diagnoseNas(nasRoot, { timeoutMs = 8000 } = {}) {
  const launchedFromNetwork = process.platform === 'win32' && /^\\\\/.test(process.cwd());
  const base = { nasRoot: nasRoot || '', machine: os.hostname(), user: os.userInfo().username, launchedFromNetwork };
  if (!nasRoot) return { ...base, ok: false, code: 'NOT_SET', reason: 'Workspace chưa cấu hình kho NAS.', fix: 'Vào Không gian làm việc, nhập đường dẫn kho NAS.' };
  const started = Date.now();
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })), timeoutMs).unref());
    const entries = await Promise.race([(async () => { const s = await fs.promises.stat(nasRoot); if (!s.isDirectory()) throw Object.assign(new Error('not dir'), { code: 'ENOTDIR' }); return fs.promises.readdir(nasRoot); })(), timeout]);
    return { ...base, ok: true, entries: entries.length, ms: Date.now() - started };
  } catch (error) { return { ...base, ok: false, ms: Date.now() - started, ...nasErrorMessage(error, nasRoot), raw: String(error?.message || error).slice(0, 300) }; }
}
