// Dọn dung lượng: ổ đĩa còn bao nhiêu + từng dự án chiếm bao nhiêu (video gốc · bản xuất · bản xem trước nhẹ · lịch sử chỉnh · tạm), xoá từng phần 1 nút
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const api = async (url, opts) => (await fetch(url, opts)).json();
const toast = (t, err) => (window.__toast ? window.__toast(t, err) : alert(t));
export const size = (n) => (n >= 1073741824 ? (n / 1073741824).toFixed(1).replace(".", ",") + " GB" : n >= 1048576 ? Math.round(n / 1048576) + " MB" : n > 0 ? "< 1 MB" : "0");
const PART = {
  inputs: ["Video gốc", "#4aa8ff", "Video bạn đã thêm — xoá thì dự án không mở được nữa (xoá cả dự án)."],
  renders: ["Bản xuất", "#d8ff3e", "Video đã xuất — xoá nếu đã lưu / đăng rồi."],
  proxy: ["Bản xem trước nhẹ", "#9b8cff", "Phần mềm tự tạo lại khi mở dự án — xoá thoải mái."],
  history: ["Lịch sử chỉnh", "#ffb84a", "Các bản lưu cũ để hoàn tác — xoá vẫn giữ bản hiện tại."],
  tam: ["File tạm", "#5fe0e0", "Video / ảnh tải về khi phân tích kênh — xoá thoải mái."],
  khac: ["Khác", "#666", "Ảnh, âm thanh, dữ liệu dựng của dự án."],
};
const S = { data: null };

// đồng hồ dung lượng ở góc dưới menu trái (đỏ khi còn < 5 GB)
export async function diskMeter(el, onClick) {
  let d;
  try { d = await api("/api/dung-luong?quick=1"); } catch { return; }
  if (!d.total) return;
  const pct = Math.round(((d.total - d.free) / d.total) * 100), low = d.free < 5 * 1073741824;
  el.hidden = false;
  el.className = "disk" + (low ? " low" : "");
  el.innerHTML = `<div class="dk-t"><span>${low ? "⚠ Ổ đĩa sắp đầy" : "Ổ đĩa"}</span><b>còn ${size(d.free)}</b></div><div class="dk-b"><i style="width:${pct}%"></i></div>`;
  el.title = `Đã dùng ${pct}% (${size(d.total - d.free)} / ${size(d.total)}) — bấm để dọn dung lượng`;
  el.onclick = onClick;
  return d;
}

export async function loadDungLuong() {
  const sec = $("#vDungLuong");
  sec.innerHTML = `<div class="hero"><h1>Dọn dung lượng</h1><p>Đang đo dung lượng các dự án…</p></div>`;
  try { S.data = await api("/api/dung-luong"); } catch { S.data = null; }
  render();
}

function render() {
  const sec = $("#vDungLuong"), d = S.data;
  if (!d?.ok) { sec.innerHTML = `<div class="kho-empty">Không đo được dung lượng.</div>`; return; }
  const used = d.total - d.free, pct = d.total ? Math.round((used / d.total) * 100) : 0, low = d.free < 5 * 1073741824;
  const sum = (k) => d.items.reduce((a, x) => a + (x.parts[k] || 0), 0);
  const easy = sum("proxy") + sum("history") + sum("tam");
  sec.innerHTML = `<div class="hero"><h1>Dọn dung lượng</h1><p>Video quay thô rất nặng — xoá dự án cũ, bản xuất đã đăng, bản xem trước nhẹ để có chỗ dựng video mới.</p></div>
    <div class="dl-top ${low ? "low" : ""}">
      <div class="dl-meter"><div class="dl-nums"><b>${size(d.free)}</b><span>còn trống trên ${size(d.total)}</span></div>
        <div class="dl-bar"><i style="width:${pct}%"></i></div>
        <small>${low ? "⚠ Ổ đĩa sắp đầy — cần ít nhất 10–20 GB trống để dựng video thoải mái." : `Đã dùng ${pct}% ổ đĩa · dự án trong phần mềm chiếm ${size(d.items.reduce((a, x) => a + x.total, 0))}.`}</small></div>
      <div class="dl-quick">${easy > 52428800 ? `<button class="primary" id="dlEasy">Dọn nhanh ${size(easy)}</button><small>Bản xem trước nhẹ, lịch sử chỉnh, file tạm — không mất gì quan trọng.</small>` : `<small>Không còn file tạm đáng kể. Xoá dự án cũ / bản xuất ở dưới.</small>`}</div>
    </div>
    <div class="dl-legend">${Object.entries(PART).map(([k, [l, c, h]]) => `<span title="${esc(h)}"><i style="background:${c}"></i>${l} <b>${size(sum(k))}</b></span>`).join("")}</div>
    <div class="dl-tip">Ngoài phần mềm: dọn <b>Thùng rác</b> của máy và xoá video gốc trong thư mục Tải về (Downloads) đã thêm vào phần mềm — phần mềm đã giữ bản riêng.</div>
    <div class="dl-list">${d.items.map((x, i) => {
      const parts = Object.entries(x.parts).filter(([, v]) => v > 0);
      const btn = (k) => x.parts[k] > 1048576 ? `<button class="ghost-btn small" data-i="${i}" data-part="${k}">Xoá ${PART[k][0].toLowerCase()} · ${size(x.parts[k])}</button>` : "";
      return `<div class="dl-row">
        <div class="dl-th" style="${x.project ? `background-image:url('/api/project-poster?dir=${encodeURIComponent(x.dir)}')` : ""}">${x.project ? "" : "📁"}</div>
        <div class="dl-info"><b>${esc(x.title)}</b><small>${x.updated ? new Date(x.updated).toLocaleDateString("vi-VN") : ""}${x.kind !== "project" ? " · " + esc(x.kind.replace(/^_/, "").replace(/-/g, " ")) : ""}</small>
          <div class="dl-stack" title="${parts.map(([k, v]) => `${PART[k][0]}: ${size(v)}`).join(" · ")}">${parts.map(([k, v]) => `<i style="flex:${v};background:${PART[k][1]}"></i>`).join("")}</div>
          <div class="dl-acts">${btn("proxy")}${btn("history")}${btn("tam")}${btn("renders")}</div></div>
        <div class="dl-size"><b>${size(x.total)}</b><button class="link-btn danger" data-i="${i}" data-part="all">Xoá ${x.project ? "dự án" : "thư mục"}</button></div>
      </div>`;
    }).join("") || `<div class="kho-empty">Chưa có dự án nào.</div>`}</div>`;
  const run = async (x, part) => {
    const r = await api("/api/dung-luong", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dir: x.dir, part }) }).catch(() => ({ ok: false, error: "Không xoá được." }));
    if (!r.ok) { toast(r.error, true); return false; }
    return true;
  };
  sec.querySelectorAll("[data-part]").forEach((b) => (b.onclick = async () => {
    const x = d.items[b.dataset.i], part = b.dataset.part;
    const msg = part === "all" ? `Xoá hẳn "${x.title}" (${size(x.total)})?\n\nXoá video gốc, bản xuất và mọi chỉnh sửa của dự án này. Không hoàn tác được.`
      : part === "renders" ? `Xoá các video đã xuất của "${x.title}" (${size(x.parts.renders)})?\n\nDự án vẫn còn — muốn có lại thì bấm Xuất video lần nữa.` : "";
    if (msg && !confirm(msg)) return;
    b.disabled = true;
    if (await run(x, part)) { toast(`Đã xoá — giải phóng ${size(part === "all" ? x.total : x.parts[part])}.`); window.__refreshDisk?.(); if (part === "all") window.__reloadProjects?.(); loadDungLuong(); }
    else b.disabled = false;
  }));
  $("#dlEasy") && ($("#dlEasy").onclick = async () => {
    $("#dlEasy").disabled = true; $("#dlEasy").textContent = "Đang dọn…";
    for (const x of d.items) for (const k of ["proxy", "history", "tam"]) if (x.parts[k] > 0) await run(x, k);
    toast(`Đã dọn nhanh ${size(easy)}.`); window.__refreshDisk?.(); loadDungLuong();
  });
}
