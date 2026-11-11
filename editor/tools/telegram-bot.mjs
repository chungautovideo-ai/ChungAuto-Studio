#!/usr/bin/env node
// Bot Telegram nhận video khách (chạy trên máy đã lưu token ở Kết nối → Telegram; token DPAPI chỉ giải mã được trên máy đó).
//   node editor/tools/telegram-bot.mjs                      chạy bot (để cửa sổ mở)
//   node editor/tools/telegram-bot.mjs --khach              xem danh sách khách
//   node editor/tools/telegram-bot.mjs --duyet <chatId>     duyệt khách   |  --chan <chatId>  chặn khách
// Khách đã duyệt: chọn mẫu → gửi video ≤20 MB hoặc link → lưu workspace/telegram/inbox/<id>/ + request.json.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createTelegramStore } from '../../src/services/connections.mjs';
import { advance, pending } from '../../src/services/telegram-pipeline.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TG = path.join(ROOT, 'workspace', 'telegram'), CUS = path.join(TG, 'customers.json'), STATE = path.join(TG, 'state.json');
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const write = (f, v) => { fs.mkdirSync(path.dirname(f), { recursive: true }); const t = `${f}.${process.pid}.tmp`; fs.writeFileSync(t, JSON.stringify(v, null, 1)); fs.renameSync(t, f); };
const TEMPLATES = [['quan-su-car-v1', 'Quân Sư Car'], ['chungauto-news-v1', 'ChungAuto News'], ['day-lai-xe-v1', 'Dạy lái xe'], ['chungauto-factory-quang-cao-v50', 'Quảng cáo V50']];
const tplName = (id) => TEMPLATES.find((t) => t[0] === id)?.[1] || id;
const MAX_DOWNLOAD = 20 * 1024 * 1024; // giới hạn tải của Bot API cloud

const args = process.argv.slice(2);
if (args[0] === '--khach') { console.log(JSON.stringify(read(CUS, {}), null, 1)); process.exit(0); }
if (args[0] === '--duyet' || args[0] === '--chan') {
  const c = read(CUS, {});
  if (!c[args[1]]) { console.error('Không có khách ' + args[1] + ' (khách phải nhắn bot trước).'); process.exit(1); }
  c[args[1]].status = args[0] === '--duyet' ? 'approved' : 'blocked'; write(CUS, c);
  console.log(args[1], c[args[1]].status); process.exit(0);
}

const ws = read(path.join(ROOT, 'workspace', 'contentos', 'workspaces.json'), {}).activeId || 'default';
const token = createTelegramStore(ROOT).token(ws);
if (!token) { console.error('Chưa có token trên máy này: mở ContentOS → Kết nối → Telegram để lưu token.'); process.exit(1); }
const api = async (method, body) => {
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}), signal: AbortSignal.timeout(60000) });
  return r.json();
};
const say = (chat, text, extra = {}) => api('sendMessage', { chat_id: chat, text, ...extra });
const menu = { reply_markup: { inline_keyboard: TEMPLATES.map(([id, name]) => [{ text: name, callback_data: 'mau:' + id }]) } };

async function onCallback(q) {
  const id = String(q.message.chat.id), c = read(CUS, {});
  if (c[id]?.status === 'approved' && q.data?.startsWith('mau:') && TEMPLATES.some((t) => 'mau:' + t[0] === q.data)) {
    c[id].template = q.data.slice(4); write(CUS, c);
    await say(id, `Đã chọn mẫu: ${tplName(c[id].template)}. Giờ gửi video (≤20 MB) hoặc link video.`);
  }
  return api('answerCallbackQuery', { callback_query_id: q.id });
}

async function onMessage(m) {
  const id = String(m.chat.id), c = read(CUS, {});
  if (!c[id]) {
    c[id] = { name: [m.from?.first_name, m.from?.last_name].filter(Boolean).join(' '), username: m.from?.username || '', status: 'pending', since: new Date().toISOString() };
    write(CUS, c);
    console.log(`Khách mới chờ duyệt: ${id} ${c[id].name} @${c[id].username} → node editor/tools/telegram-bot.mjs --duyet ${id}`);
  }
  const k = c[id];
  if (k.status === 'blocked') return;
  if (k.status !== 'approved') return say(id, 'Chào bạn! ChungAuto đã nhận tin. Tài khoản của bạn đang chờ duyệt — duyệt xong bot sẽ nhận video để edit tự động.');
  if (m.text && /^\/(start|help|mau)\b/.test(m.text)) return say(id, 'Gửi video gốc (≤20 MB) hoặc link video (Google Drive…) để ChungAuto edit tự động và gửi lại. Chọn mẫu trước:', menu);
  const link = (m.text || m.caption || '').match(/https?:\/\/\S+/)?.[0];
  const file = m.video || m.document || m.audio || m.voice;
  if (!file && !link) return say(id, 'Bot nhận video hoặc link video. Gõ /mau để chọn mẫu edit.');
  if (!k.template) return say(id, 'Chọn mẫu edit trước rồi gửi lại video:', menu);
  if (file && file.file_size > MAX_DOWNLOAD) return say(id, 'Video lớn hơn 20 MB: gửi link Google Drive (chia sẻ "Bất kỳ ai có đường liên kết") để bot tải.');

  const reqId = new Date().toISOString().slice(0, 10) + '-' + crypto.randomUUID().slice(0, 8), dir = path.join(TG, 'inbox', reqId);
  const req = { id: reqId, chatId: id, customer: k.name, template: k.template, note: (m.caption || (link ? '' : m.text) || '').slice(0, 1000), createdAt: new Date().toISOString(), status: 'new' };
  if (file) {
    const f = await api('getFile', { file_id: file.file_id });
    if (!f.ok) return say(id, 'Không tải được file từ Telegram, gửi lại giúp mình.');
    const r = await fetch(`https://api.telegram.org/file/bot${token}/${f.result.file_path}`, { signal: AbortSignal.timeout(300000) });
    if (!r.ok) return say(id, 'Không tải được file từ Telegram, gửi lại giúp mình.');
    const name = path.basename(file.file_name || f.result.file_path).replace(/[^\w.\-]+/g, '_') || 'video.mp4';
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, name), Buffer.from(await r.arrayBuffer()));
    req.file = name;
  } else { fs.mkdirSync(dir, { recursive: true }); req.link = link; } // link: bước dựng tải sau (file lớn)
  write(path.join(dir, 'request.json'), req);
  console.log(`Nhận việc ${reqId} từ ${k.name}: ${req.file || req.link} (mẫu ${k.template})`);
  return say(id, `Đã nhận ${req.file ? 'video' : 'link'} (mã ${reqId}). ChungAuto đang edit theo mẫu ${tplName(k.template)}, xong sẽ gửi lại ở đây.`);
}

const me = await api('getMe').catch(() => ({ ok: false }));
if (!me.ok) { console.error('Telegram từ chối token hoặc mất mạng.'); process.exit(1); }
console.log(`Bot @${me.result.username} đang chạy… (đóng cửa sổ để dừng)`);
await api('deleteWebhook', {}); // getUpdates không chạy khi bot còn webhook
// Cầu nối: mỗi 20s đẩy từng yêu cầu trong inbox qua bước tiếp theo (tạo dự án → AI dựng → xuất → gửi khách)
const SERVER = 'http://127.0.0.1:' + (process.env.CONTENTOS_PORT || 5180);
const deps = {
  root: ROOT, now: Date.now,
  server: async (p, init = {}) => (await fetch(SERVER + p, { ...init, signal: AbortSignal.timeout(30 * 60 * 1000) })).json(),
  notify: (chat, text) => say(chat, text),
  exportVideo: (dir) => new Promise((resolve, reject) => {
    const c = spawn(process.execPath, [path.join(ROOT, 'editor', 'tools', 'xuat-video.mjs'), dir], { cwd: ROOT, windowsHide: true });
    let out = ''; c.stdout.on('data', (d) => { out += d; }); c.stderr.on('data', (d) => { out += d; });
    c.on('error', reject);
    c.on('close', (code) => { const saved = out.match(/^SAVED (.+)$/m)?.[1]?.trim(); saved && fs.existsSync(saved) ? resolve(saved) : reject(new Error(`Xuất lỗi (mã ${code}): ${out.trim().split('\n').slice(-3).join(' ')}`)); });
  }),
  sendVideo: async (chat, file, caption) => {
    const form = new FormData();
    form.append('chat_id', chat); form.append('caption', caption); form.append('supports_streaming', 'true');
    form.append('video', await fs.openAsBlob(file), path.basename(file));
    const r = await (await fetch(`https://api.telegram.org/bot${token}/sendVideo`, { method: 'POST', body: form, signal: AbortSignal.timeout(15 * 60 * 1000) })).json();
    if (!r.ok) throw new Error('Gửi video lỗi: ' + r.description);
  },
};
(async function pump() {
  for (const dir of pending(path.join(TG, 'inbox'))) {
    try { const r = await advance(dir, deps); if (r && ['sent', 'needs-staff', 'error'].includes(r.status)) console.log(`Việc ${r.id}: ${r.status}${r.reason ? ' — ' + r.reason : ''}${r.error ? ' — ' + r.error : ''}`); }
    catch (e) { console.error('Cầu nối lỗi:', e.message); }
  }
  setTimeout(pump, 20000);
})();

let offset = read(STATE, {}).offset || 0;
for (;;) {
  try {
    const r = await api('getUpdates', { offset, timeout: 30, allowed_updates: ['message', 'callback_query'] });
    if (!r.ok) { console.error('getUpdates lỗi:', r.description); await new Promise((s) => setTimeout(s, 5000)); continue; }
    for (const u of r.result) {
      offset = u.update_id + 1; write(STATE, { offset });
      try { if (u.callback_query) await onCallback(u.callback_query); else if (u.message) await onMessage(u.message); }
      catch (e) { console.error('Lỗi xử lý tin:', e.message); }
    }
  } catch (e) { console.error('Mất kết nối Telegram, thử lại sau 5s:', e.message); await new Promise((s) => setTimeout(s, 5000)); }
}
