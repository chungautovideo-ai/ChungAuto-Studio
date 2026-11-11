// Mọi hộp mở lên (<dialog>, role="dialog", aria-modal) đều có nút ✕ ở góc phải trên.
// Hộp đã có nút ✕ / aria-label "Đóng" riêng thì giữ nguyên, không thêm trùng.
const BOX = 'dialog,[role="dialog"],[aria-modal="true"]';
const hasX = (el) => [...el.querySelectorAll('button,[role="button"]')].some((b) =>
  /^(Đóng|Close)$/i.test(b.getAttribute('aria-label') || '') || /^[✕×xX]$/.test(b.textContent.trim()));

function closeBox(el) {
  const d = el.closest('dialog');
  if (d) return d.close();
  // hộp tự viết: thường nghe phím Esc để đóng đúng cách (dọn trạng thái); không phản hồi thì gỡ khỏi trang
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  setTimeout(() => {
    if (!el.isConnected || getComputedStyle(el).display === 'none') return;
    if (el.id) el.classList.remove('show'); // khung cố định của trang (vd #aim): chỉ ẩn, không gỡ
    else (el.closest('.exp-modal') || el).remove();
  }, 60);
}

function addX(el) {
  if (el.dataset.xClose || hasX(el)) return;
  el.dataset.xClose = '1';
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'cos-x-close'; b.textContent = '✕';
  b.setAttribute('aria-label', 'Đóng'); b.title = 'Đóng (Esc)';
  b.addEventListener('click', (e) => { e.stopPropagation(); closeBox(el); });
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  el.prepend(b);
}

const scan = (root) => {
  if (root.nodeType !== 1) return;
  if (root.matches(BOX)) addX(root);
  root.querySelectorAll?.(BOX).forEach(addX);
};
const style = document.createElement('style');
style.textContent = '.cos-x-close{position:absolute;top:10px;right:10px;z-index:5;width:32px;height:32px;min-width:0;padding:0;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:rgba(20,20,22,.85);color:#e8e8ec;font-size:15px;line-height:1;cursor:pointer;display:grid;place-items:center}.cos-x-close:hover{background:#2a2a2e;color:#fff}.cos-x-close:focus-visible{outline:2px solid var(--lime,#d8ff3e);outline-offset:2px}';
document.head.append(style);
scan(document.body);
new MutationObserver((list) => { for (const m of list) m.addedNodes.forEach(scan); }).observe(document.body, { childList: true, subtree: true });
