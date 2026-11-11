// Tích hợp (gói Pro+): tài khoản công cụ tạo video / ảnh AI (Google Flow, Seedance, Kling…) để AI tạo cảnh trám bằng đúng tài khoản người dùng.
// Chỉ lưu tên / email tài khoản, link, gói, ghi chú — không lưu mật khẩu (người dùng đăng nhập sẵn trên trình duyệt).
import {renderFeaturePreview} from './contentos-feature-preview.js';
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const api = async (url, opts) => (await fetch(url, opts)).json();
const toast = (t, err) => (window.__toast ? window.__toast(t, err) : alert(t));
const LOOK = {
  flow: { c: "#4285F4", ic: "F", d: "Veo · Nano Banana — video + ảnh chất lượng cao, giữ nhân vật theo ảnh tham chiếu." },
  seedance: { c: "#25F4EE", ic: "S", d: "Seedance trên Dreamina (CapCut) — video chuyển động mượt, ảnh tham chiếu → video." },
  kling: { c: "#ffb84a", ic: "K", d: "Kling AI — image to video, chuyển động camera tốt." },
  khac: { c: "#9b8cff", ic: "+", d: "Công cụ tạo video / ảnh AI khác — ghi link trang tạo." },
};
const S = { data: null, edit: null };

export async function loadTichHop() {
  try { S.data = await api("/api/tich-hop"); } catch { S.data = { allowed: false, items: [], tools: {} }; }
  render();
}

function render() {
  const sec = $("#vTichHop"), d = S.data;
  const hero = `<div class="hero"><h1>Tích hợp</h1><p>Lưu tài khoản các công cụ tạo video / ảnh AI. Khi AI edit, bật <b>Cảnh trám AI</b> ở bước thiết lập — AI tự viết prompt,
    lên đúng tài khoản tạo cảnh trám theo ảnh tham chiếu của bạn rồi chèn vào video.</p></div>`;
  if (!d) { sec.innerHTML = hero + `<div class="kho-empty">Đang tải…</div>`; return; }
  if (!d.allowed) {
    renderFeaturePreview(sec,'integrations');return;
    sec.innerHTML = hero + `<div class="kho-empty">🔒 Tích hợp dành cho gói <b>Pro</b> trở lên.<br><br><button class="primary" id="thUp">Nâng cấp gói</button></div>`;
    $("#thUp").onclick = () => (window.__openUpgrade ? window.__openUpgrade() : toast("Nâng cấp gói trên website.", true));
    return;
  }
  const tools = d.tools || {}, items = d.items || [], ed = S.edit;
  const form = (e) => {
    const t = tools[e.tool] || {};
    return `<form class="th-form" id="thForm">
      <div class="th-fh"><i class="th-ic" style="--c:${LOOK[e.tool]?.c}">${LOOK[e.tool]?.ic}</i><b>${e.id ? "Sửa" : "Thêm"} tài khoản ${esc(t.name || "")}</b></div>
      <div class="so-row"><label>Tên gợi nhớ<input name="name" value="${esc(e.name || t.name || "")}" placeholder="VD: Flow công ty"></label>
        <label>Email / tài khoản đang đăng nhập<input name="account" value="${esc(e.account || "")}" placeholder="ten@gmail.com"></label></div>
      <div class="so-row"><label>Link trang tạo${e.tool === "flow" ? " (có /u/1/ nếu dùng tài khoản Google thứ 2…)" : ""}<input name="url" value="${esc(e.url ?? t.url ?? "")}" placeholder="https://…"></label>
        <label>Gói (không bắt buộc)<input name="plan" value="${esc(e.plan || "")}" placeholder="VD: Google AI Pro, Ultra, Basic…"></label></div>
      <label>Ghi chú cho AI (không bắt buộc)<input name="note" value="${esc(e.note || "")}" placeholder="VD: dùng mô hình Veo Fast cho tiết kiệm credit, video 8s"></label>
      <div class="th-warn">🔒 Không nhập mật khẩu ở đây. Bấm <b>Mở để đăng nhập</b> và đăng nhập sẵn trên trình duyệt — AI chỉ dùng phiên đã đăng nhập.</div>
      <div class="so-act"><button type="button" class="ghost-btn" id="thCancel">Huỷ</button><button class="primary" type="submit">${e.id ? "Lưu" : "Thêm tài khoản"}</button></div>
    </form>`;
  };
  sec.innerHTML = hero + (ed ? form(ed) : "") + `
    <div class="th-grid">${Object.entries(tools).map(([k, t]) => {
      const mine = items.filter((x) => x.tool === k), L = LOOK[k] || {};
      return `<div class="th-card" style="--c:${L.c}">
        <div class="th-top"><i class="th-ic">${L.ic}</i><div><b>${esc(t.name)}</b><small>${t.kinds?.includes("video") ? "Video" : ""}${t.kinds?.length > 1 ? " · " : ""}${t.kinds?.includes("image") ? "Ảnh" : ""}</small></div>
          ${mine.length ? `<span class="th-on">Đã kết nối ${mine.length}</span>` : ""}</div>
        <p>${esc(L.d)}</p>
        ${mine.map((x) => `<div class="th-acc" data-id="${esc(x.id)}"><div><b>${esc(x.name)}</b><small>${esc(x.account || "chưa ghi tài khoản")}${x.plan ? " · " + esc(x.plan) : ""}</small></div>
          <a class="ghost-btn small" href="${esc(x.url || t.url)}" target="_blank" rel="noopener">Mở ↗</a><button class="ghost-btn small" data-ed>Sửa</button><button class="ghost-btn small" data-del>Xoá</button></div>`).join("")}
        <div class="th-act"><button class="${mine.length ? "ghost-btn" : "primary"} small" data-add="${k}">＋ ${mine.length ? "Thêm tài khoản khác" : "Kết nối"}</button>
          ${t.url ? `<a class="ghost-btn small" href="${esc(t.url)}" target="_blank" rel="noopener">Mở để đăng nhập ↗</a>` : ""}</div>
      </div>`;
    }).join("")}</div>
    <div class="th-how"><b>Cách dùng</b><ol>
      <li>Kết nối tài khoản ở trên, mở trang công cụ và đăng nhập sẵn trên trình duyệt AI đang dùng (Claude in Chrome / trình duyệt trong app).</li>
      <li>Thêm video → ở <b>Thiết lập trước khi AI edit</b> bật <b>Cảnh trám AI</b>: chọn tài khoản, số lượng Ít / Vừa / Nhiều, tải ảnh tham chiếu (nhân vật, sản phẩm, phong cách).</li>
      <li>AI viết prompt từng cảnh theo lời nói, tạo trên công cụ, tải về và chèn đúng chỗ — prompt lưu trong dự án để bạn xem lại.</li></ol></div>`;
  sec.querySelectorAll("[data-add]").forEach((b) => (b.onclick = () => { S.edit = { tool: b.dataset.add }; render(); $("#main").scrollTop = 0; }));
  sec.querySelectorAll(".th-acc").forEach((row) => {
    const x = items.find((i) => i.id === row.dataset.id);
    row.querySelector("[data-ed]").onclick = () => { S.edit = { ...x }; render(); $("#main").scrollTop = 0; };
    row.querySelector("[data-del]").onclick = async () => {
      if (!confirm(`Xoá tài khoản "${x.name}"?`)) return;
      S.data = { ...S.data, ...(await api(`/api/tich-hop?id=${encodeURIComponent(x.id)}`, { method: "DELETE" })) }; render();
    };
  });
  if (ed) {
    $("#thCancel").onclick = () => { S.edit = null; render(); };
    $("#thForm").onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target, body = { id: ed.id, tool: ed.tool, name: f.name.value, account: f.account.value, url: f.url.value, plan: f.plan.value, note: f.note.value };
      const r = await api("/api/tich-hop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => ({ ok: false, error: "Không lưu được." }));
      if (!r.ok) return toast(r.error, true);
      S.edit = null; S.data.items = r.items; render(); toast("Đã lưu tài khoản tích hợp.");
    };
  }
}
