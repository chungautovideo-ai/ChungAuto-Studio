// Skill AI library: browse installed agent skills and hand one to the next AI edit via the Home note.
const CSS = `
#vSkills .sk-head{display:flex;flex-wrap:wrap;align-items:end;justify-content:space-between;gap:16px}
#vSkills .sk-head p{margin:6px 0 0;color:var(--ink2);max-width:62ch;line-height:1.6}
#vSkills .sk-stats{display:flex;gap:10px;flex-wrap:wrap}
#vSkills .sk-stat{border:1px solid var(--line2);border-radius:12px;padding:10px 14px;background:var(--surface);min-width:96px}
#vSkills .sk-stat b{display:block;font:600 22px/1.1 var(--head);color:var(--ink)}#vSkills .sk-stat span{font-size:12px;color:var(--muted)}
#vSkills .sk-tools{display:grid;gap:12px;margin:24px 0 16px}
#vSkills .sk-search{display:flex;align-items:center;gap:10px;border:1px solid var(--line2);background:var(--surface);border-radius:12px;padding:0 14px;min-height:46px}
#vSkills .sk-search:focus-within{outline:2px solid var(--lime);outline-offset:1px}
#vSkills .sk-search svg{width:18px;height:18px;flex:none;fill:none;stroke:var(--muted);stroke-width:1.8;stroke-linecap:round}
#vSkills .sk-search input{flex:1;min-width:0;border:0;background:transparent;color:var(--ink);font-size:15px;padding:12px 0;outline:none}
#vSkills .sk-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
#vSkills .sk-chips{display:flex;flex-wrap:wrap;gap:8px}
#vSkills .sk-chips button{min-height:36px;padding:6px 12px;border:1px solid var(--line2);border-radius:999px;background:transparent;color:var(--ink2);font-size:13px;cursor:pointer;transition:background .15s,color .15s,border-color .15s}
#vSkills .sk-chips button:hover{background:var(--surface2);color:var(--ink)}
#vSkills .sk-chips button[aria-pressed="true"]{background:var(--lime);border-color:var(--lime);color:var(--lime-ink)}
#vSkills .sk-chips button:focus-visible,#vSkills .sk-card:focus-visible,.sk-dialog button:focus-visible{outline:2px solid var(--lime);outline-offset:2px}
#vSkills .sk-chips small{opacity:.7;margin-left:4px}
#vSkills .sk-row-label{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
#vSkills .sk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));gap:12px}
#vSkills .sk-card{display:flex;flex-direction:column;gap:10px;text-align:left;border:1px solid var(--line2);border-radius:14px;background:var(--surface);padding:16px;color:var(--ink);cursor:pointer;min-height:150px;transition:border-color .15s,transform .15s}
#vSkills .sk-card:hover{border-color:var(--lime);transform:translateY(-1px)}
#vSkills .sk-card h3{margin:0;font:600 15px/1.3 var(--head);overflow-wrap:anywhere}
#vSkills .sk-card p{margin:0;color:var(--ink2);font-size:13px;line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.sk-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:auto}
.sk-tag{font-size:11px;padding:3px 8px;border-radius:6px;background:var(--surface2);color:var(--ink2)}
.sk-tag.cat{background:var(--lime-soft);color:var(--lime)}
#vSkills .sk-empty{padding:40px;text-align:center;color:var(--muted);border:1px dashed var(--line2);border-radius:14px}
#vSkills [role=status]{min-height:20px;margin:0;color:var(--muted);font-size:13px}
.sk-dialog{width:min(860px,calc(100vw - 24px));border:1px solid var(--line2);border-radius:16px;background:var(--surface);color:var(--ink);padding:0}
.sk-dialog::backdrop{background:rgba(0,0,0,.6)}
.sk-dialog header{position:sticky;top:0;background:var(--surface);padding:20px 24px 14px;border-bottom:1px solid var(--line);display:grid;gap:10px}
.sk-dialog header h2{margin:0;font:600 20px/1.25 var(--head);overflow-wrap:anywhere}
.sk-dialog header p{margin:0;color:var(--ink2);line-height:1.55;font-size:14px}
.sk-dialog .sk-actions{display:flex;flex-wrap:wrap;gap:8px}
.sk-dialog .sk-actions button{min-height:40px}
.sk-dialog pre{margin:0;padding:20px 24px;white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.6 ui-monospace,Consolas,monospace;color:var(--ink2)}
.sk-dialog .sk-files{padding:0 24px 20px;color:var(--muted);font-size:12px}
@media(prefers-reduced-motion:reduce){#vSkills .sk-card,#vSkills .sk-chips button{transition:none}#vSkills .sk-card:hover{transform:none}}
`;

let state = null;
const filter = { q: '', category: '', pack: '' };

const el = (tag, props = {}, ...children) => { const node = Object.assign(document.createElement(tag), props); node.append(...children); return node; };

function chip(label, count, pressed, onClick) {
  const button = el('button', { type: 'button', onclick: onClick }, label, el('small', {}, String(count)));
  button.setAttribute('aria-pressed', String(pressed));
  return button;
}

function render(host) {
  const q = filter.q.trim().toLowerCase();
  const visible = state.skills.filter(s => (!filter.category || s.category === filter.category) && (!filter.pack || s.pack === filter.pack)
    && (!q || `${s.name} ${s.title} ${s.description} ${s.packLabel}`.toLowerCase().includes(q)));
  host.querySelector('[data-sk-cats]').replaceChildren(chip('Tất cả', state.total, !filter.category, () => { filter.category = ''; render(host); }),
    ...state.categories.map(c => chip(c.label, c.count, filter.category === c.id, () => { filter.category = filter.category === c.id ? '' : c.id; render(host); })));
  host.querySelector('[data-sk-packs]').replaceChildren(chip('Mọi nguồn', state.total, !filter.pack, () => { filter.pack = ''; render(host); }),
    ...state.packs.map(p => chip(p.label, p.count, filter.pack === p.id, () => { filter.pack = filter.pack === p.id ? '' : p.id; render(host); })));
  const grid = host.querySelector('[data-sk-grid]');
  grid.replaceChildren(...visible.map(s => {
    const card = el('button', { type: 'button', className: 'sk-card', onclick: () => openDetail(s) },
      el('h3', {}, s.title), el('p', {}, s.description || 'Chưa có mô tả.'),
      el('div', { className: 'sk-meta' }, el('span', { className: 'sk-tag cat' }, s.categoryLabel), el('span', { className: 'sk-tag' }, s.packLabel)));
    card.setAttribute('aria-label', `${s.title} — ${s.categoryLabel}, nguồn ${s.packLabel}`);
    return card;
  }));
  if (!visible.length) grid.append(el('p', { className: 'sk-empty' }, 'Không có skill khớp bộ lọc. Thử từ khóa khác hoặc bỏ lọc.'));
  host.querySelector('[data-sk-status]').textContent = `Đang hiện ${visible.length}/${state.total} skill`;
}

function useForVideo(skill) {
  const note = document.getElementById('homeNote'), line = `Dùng skill ${skill.name}`;
  if (!note.value.includes(line)) note.value = note.value.trim() ? `${note.value.trim()}\n${line}` : line;
  note.dispatchEvent(new Event('input', { bubbles: true }));
  document.getElementById('navHome').click();
  note.focus();
}

async function openDetail(skill) {
  const dialog = el('dialog', { className: 'sk-dialog' });
  dialog.setAttribute('aria-labelledby', 'skDialogTitle');
  const pre = el('pre', {}, 'Đang tải nội dung skill…'), files = el('p', { className: 'sk-files' });
  const use = el('button', { type: 'button', className: 'primary', onclick: () => { dialog.close(); useForVideo(skill); } }, 'Dùng cho video này');
  const copy = el('button', { type: 'button', className: 'outline' }, 'Chép lệnh gọi skill');
  copy.onclick = async () => { try { await navigator.clipboard.writeText(`Dùng skill ${skill.name}`); copy.textContent = 'Đã chép'; } catch { copy.textContent = 'Không chép được'; } };
  const close = el('button', { type: 'button', className: 'outline', onclick: () => dialog.close() }, 'Đóng');
  dialog.append(el('header', {}, el('h2', { id: 'skDialogTitle' }, skill.title), el('p', {}, skill.description),
    el('div', { className: 'sk-meta' }, el('span', { className: 'sk-tag cat' }, skill.categoryLabel), el('span', { className: 'sk-tag' }, skill.packLabel), ...skill.agents.map(a => el('span', { className: 'sk-tag' }, a === 'claude' ? 'Claude' : 'Codex'))),
    el('div', { className: 'sk-actions' }, use, copy, close)), pre, files);
  dialog.addEventListener('close', () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
  use.focus();
  try {
    const response = await fetch('/api/v1/skills/detail?name=' + encodeURIComponent(skill.name));
    const detail = await response.json();
    if (!response.ok) throw new Error(detail.error || 'Không đọc được skill.');
    pre.textContent = detail.body.trim();
    files.textContent = `Tệp: ${detail.path} · thư mục gồm ${detail.files.join(', ')}`;
  } catch (error) { pre.textContent = error.message; }
}

export async function loadSkillLibrary() {
  const host = document.getElementById('vSkills');
  if (!document.getElementById('skCss')) document.head.append(el('style', { id: 'skCss', textContent: CSS }));
  if (!host.dataset.ready) {
    host.dataset.ready = '1';
    host.innerHTML = `<div class="sk-head"><div><h1>Skill AI</h1><p>Bộ kỹ năng AI dùng khi dựng video: quy chuẩn edit ContentOS, Remotion, HyperFrames, Ghost Editor, MRT Keyword, OpenMontage, TikTok/Data Animation, FFmpeg và Ponytail. Chọn một skill để xem quy tắc hoặc gắn vào yêu cầu edit kế tiếp.</p></div><div class="sk-stats" data-sk-stats></div></div>
<div class="sk-tools"><label class="sk-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span class="sk-sr">Tìm skill</span><input type="search" data-sk-q placeholder="Tìm theo tên, mô tả, nguồn… (vd: phụ đề, keyword, chart)"></label>
<span class="sk-row-label">Mục đích</span><div class="sk-chips" data-sk-cats></div><span class="sk-row-label">Nguồn</span><div class="sk-chips" data-sk-packs></div><p role="status" aria-live="polite" data-sk-status></p></div>
<div class="sk-grid" data-sk-grid></div>`;
    host.querySelector('[data-sk-q]').addEventListener('input', event => { filter.q = event.target.value; render(host); });
  }
  host.querySelector('[data-sk-status]').textContent = 'Đang đọc thư viện skill…';
  try {
    const response = await fetch('/api/v1/skills');
    if (!response.ok) throw new Error('Không đọc được thư viện skill.');
    state = await response.json();
  } catch (error) { host.querySelector('[data-sk-status]').textContent = error.message; return; }
  const stat = (n, label) => el('div', { className: 'sk-stat' }, el('b', {}, String(n)), el('span', {}, label));
  host.querySelector('[data-sk-stats]').replaceChildren(stat(state.total, 'skill đã cài'), stat(state.packs.length, 'nguồn'), stat(state.categories.length, 'nhóm mục đích'));
  render(host);
}
