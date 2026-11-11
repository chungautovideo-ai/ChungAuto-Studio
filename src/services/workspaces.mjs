import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function createWorkspaceStore(root) {
  const file = path.join(root, 'workspace', 'contentos', 'workspaces.json');
  const initial = () => ({ schemaVersion: 1, activeId: 'default', workspaces: [{ id: 'default', name: 'Không gian của tôi', industry: '', brand: '', nasRoot: '', createdAt: new Date().toISOString() }] });
  function read() {
    if (!fs.existsSync(file)) return initial();
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (value.schemaVersion !== 1 || !Array.isArray(value.workspaces) || !value.workspaces.some(w => w.id === value.activeId)) throw new Error('Workspace store không hợp lệ; cần khôi phục backup.');
    return value;
  }
  function write(value) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temp = file + '.' + crypto.randomUUID() + '.tmp';
    fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
    fs.renameSync(temp, file);
    return value;
  }
  const text = (v, max) => String(v ?? '').trim().slice(0, max);
  return {
    list: read,
    active() { const s = read(); return s.workspaces.find(w => w.id === s.activeId); },
    create(body) {
      const name = text(body.name, 100);
      if (!name) throw new Error('Nhập tên workspace.');
      const s = read();
      if (s.workspaces.some(w => w.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw new Error('Tên workspace đã tồn tại.');
      const workspace = { id: crypto.randomUUID(), name, industry: text(body.industry, 100), brand: text(body.brand, 100), nasRoot: '', createdAt: new Date().toISOString() };
      s.workspaces.push(workspace); s.activeId = workspace.id;
      write(s); return workspace;
    },
    select(id) { const s = read(); if (!s.workspaces.some(w => w.id === id)) throw new Error('Workspace không tồn tại.'); s.activeId = id; return write(s); },
    update(id, body) {
      const s = read(), w = s.workspaces.find(w => w.id === id);
      if (!w) throw new Error('Workspace không tồn tại.');
      for (const key of ['brand', 'industry', 'nasRoot']) if (key in body) w[key] = text(body[key], key === 'nasRoot' ? 1000 : 100);
      if (w.nasRoot && !path.isAbsolute(w.nasRoot)) throw new Error('Đường dẫn kho cần là đường dẫn tuyệt đối hoặc UNC.');
      write(s); return w;
    },
  };
}
