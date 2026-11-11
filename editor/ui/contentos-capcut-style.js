// Kết nối → CapCut: chọn dự án CapCut trên máy, học phong cách edit của chủ sở hữu thành skill phong-cach-chu-so-huu.
const el = (tag, props = {}, ...children) => { const node = Object.assign(document.createElement(tag), props); node.append(...children); return node; };
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

function summary(p, projects) {
  return el('div', { className: 'cc-summary' },
    el('p', {}, `Đã học từ ${projects.join(', ')} (${p.minutes} phút).`),
    el('ul', {},
      el('li', {}, `Nhịp cắt: cảnh trung vị ${p.shot.median}s, ${p.shot.perMinute} cảnh/phút, cảnh trám ${p.overlayClipsPerMinute}/phút.`),
      el('li', {}, `Phụ đề: ${p.captions ? `bật, ${p.captionFonts.map(([n]) => n).join(', ') || 'font mặc định'} màu ${p.captionColors.map(([c]) => c).join(', ')}` : 'ít dùng'}.`),
      el('li', {}, `Chữ nhấn ${p.textsPerMinute}/phút · hoạt ảnh: ${p.textAnims.slice(0, 3).map(([n]) => n).join(', ') || 'không'}.`),
      el('li', {}, `Chuyển cảnh ${p.transitionsPerMinute}/phút: ${p.transitions.slice(0, 3).map(([n]) => n).join(', ') || 'không'}.`),
      el('li', {}, `Tiếng hiệu ứng ${p.soundsPerMinute}/phút: ${p.sounds.slice(0, 3).map(([n]) => n).join(', ') || 'không'}.`)),
    el('div', { className: 'cc-actions' },
      el('a', { href: '#skills', className: 'outline cc-link' }, 'Xem skill “phong-cach-chu-so-huu” trong Skill AI'),
      el('a', { href: '/api/v1/capcut/style/skill', download: 'phong-cach-chu-so-huu-SKILL.md', className: 'outline cc-link' }, 'Tải file skill')),
    el('p', {}, 'Đã lưu sẵn trong app: bật “Phong cách Edit trên CapCut của bạn” ở bước thiết lập trước khi bấm AI edit để dùng lại.'));
}

export async function loadCapcutStyle(section) {
  section.replaceChildren(el('h2', {}, 'CapCut · Học phong cách edit'),
    el('p', {}, 'Đọc dự án CapCut trên máy này (chỉ đọc file dự án, không đọc video, không gửi đi đâu) để đo nhịp cắt, phụ đề, chữ, chuyển cảnh, tiếng hiệu ứng của bạn, rồi đóng gói thành skill riêng. AI dựng sẽ đọc skill này khi edit.'));
  const status = el('p', { role: 'status', 'aria-live': 'polite' }, 'Đang đọc kết nối…');
  section.append(status);
  let ai, data;
  try {
    [ai, data] = await Promise.all([fetch('/api/ket-noi-ai').then((r) => r.json()).catch(() => null), fetch('/api/v1/capcut/projects').then((r) => r.json())]);
  } catch (e) { status.textContent = 'Không đọc được danh sách CapCut: ' + e.message; return; }
  if (!section.contains(status)) return; // một lượt nạp mới hơn đã vẽ lại khung này
  const claude = ai?.agents?.find?.((a) => a.id === 'claude');
  if (!claude?.dangNhap) { status.textContent = 'Kết nối Claude trước (tab AI dựng), rồi quay lại để học phong cách từ CapCut.'; return; }
  if (!data?.available) { status.textContent = 'Không thấy CapCut trên máy này (cần CapCut bản máy tính đã mở ít nhất một dự án).'; return; }
  status.textContent = `Claude đã kết nối · thấy ${data.projects.length} dự án CapCut gần nhất. Chọn các video đã hoàn thiện tiêu biểu cho phong cách của bạn.`;
  if (data.learned?.profile) section.append(summary(data.learned.profile, data.learned.projects));

  const search = el('input', { type: 'search', placeholder: 'Tìm dự án CapCut…', className: 'cc-search' });
  search.setAttribute('aria-label', 'Tìm dự án CapCut');
  const listBox = el('div', { className: 'cc-list', role: 'group' });
  listBox.setAttribute('aria-label', 'Dự án CapCut');
  const picked = new Set();
  const go = el('button', { type: 'button', className: 'primary', disabled: true }, 'Học phong cách');
  const note = el('p', { role: 'status', 'aria-live': 'polite' });
  const refreshButton = () => { go.disabled = !picked.size; go.textContent = picked.size ? `Học phong cách từ ${picked.size} dự án` : 'Học phong cách'; };
  const render = () => {
    const q = search.value.trim().toLowerCase();
    listBox.replaceChildren(...data.projects.filter((p) => !q || p.name.toLowerCase().includes(q)).slice(0, 80).map((p) => {
      const box = el('input', { type: 'checkbox', checked: picked.has(p.name) });
      box.onchange = () => { if (box.checked) picked.add(p.name); else picked.delete(p.name); refreshButton(); };
      return el('label', { className: 'cc-row' }, box, el('b', {}, p.name), el('span', {}, `${clock(p.duration)} · ${new Date(p.modified).toLocaleDateString('vi-VN')}`));
    }));
  };
  search.addEventListener('input', render);
  go.onclick = async () => {
    go.disabled = true; note.textContent = 'Đang phân tích dự án CapCut…';
    try {
      const r = await fetch('/api/v1/capcut/style', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ names: [...picked] }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Không học được phong cách.');
      note.textContent = `Đã tạo skill từ ${j.used.length} dự án${j.skipped.length ? `; bỏ qua ${j.skipped.map((s) => `${s.name} (${s.reason})`).join(', ')}` : ''}.`;
      section.querySelector('.cc-summary')?.remove();
      status.after(summary(j.profile, j.used));
    } catch (e) { note.textContent = e.message; }
    refreshButton();
  };
  render();
  section.append(search, listBox, el('div', { className: 'cc-actions' }, go), note);
}
