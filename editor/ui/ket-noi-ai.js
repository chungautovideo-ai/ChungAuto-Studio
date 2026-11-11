// Kết nối AI: xem Claude Code / Codex đã có trên máy và đã đăng nhập chưa, đăng nhập ngay tại đây thay vì gặp lỗi lúc AI edit.
// Phần mềm chỉ mở cửa sổ đăng nhập của hãng, không đụng tới mật khẩu / token.
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const toast = (t, err) => (window.__toast ? window.__toast(t, err) : alert(t));
const TAI = { claude: "https://claude.com/download", codex: "https://chatgpt.com/codex", antigravity: "https://antigravity.google" };
const S = { d: null, cho: null, tuLuc: 0 };

const docTrangThai = async (moi) => {
  const r = await fetch(`/api/ket-noi-ai${moi ? "?moi=1" : ""}`, { signal: AbortSignal.timeout(40000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.agents) throw new Error(`Chưa kiểm tra được trạng thái AI${j.error ? `: ${j.error}` : ""}. Bấm Kiểm tra lại.`);
  return j;
};
// Máy có AI dùng được chưa: không (cần làm gì đó) thì hiện chấm đỏ ở menu
export const canKetNoi = (d) => !d.agents.some((a) => a.coMay && a.dangNhap !== false);

function nhan(a) {
  if (!a.coMay) return ["Chưa cài trên máy", "#ffb347"];
  if (a.dangNhap === true) return ["Đã đăng nhập", "#7ee081"];
  if (a.dangNhap === false) return ["Chưa đăng nhập", "#ff8a80"];
  return ["Chưa kiểm tra được, nếu lỗi hãy đăng nhập lại", "#b9b9c0"];
}
function theAi(a) {
  const [chu, mau] = nhan(a), dangDoi = S.cho === a.id;
  const nut = !a.coMay ? `<button class="primary" data-tai="${a.id}">Cài ${esc(a.ten)}</button>`
    : a.dangNhap === true ? "" : `<button class="primary" data-dn="${a.id}" ${dangDoi ? "disabled" : ""}>${dangDoi ? "Đang chờ bạn đăng nhập…" : "Đăng nhập"}</button>`;
  return `<div class="adm-box" style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap">
    <div><b style="font-size:17px">${esc(a.ten)}</b><div style="color:${mau};font-size:14px;margin-top:4px">${esc(chu)}</div></div>${nut}</div>`;
}
function ve() {
  const sec = $("#vKetNoi"), d = S.d;
  const ten = (id) => d.agents.find((a) => a.id === id)?.ten || "AI";
  const phien = d.phien ? `${ten(d.phien.agent)} ${d.phien.busy ? "đang làm việc" : "đang mở, sẵn sàng nhận việc"}.` : "Chưa có cửa sổ AI nào đang chờ việc. Đã đăng nhập thì phần mềm vẫn chạy ngầm được.";
  sec.innerHTML = `<div class="hero"><h1>Kết nối AI</h1><p>Dựng trong phiên Codex/Claude/Antigravity đang mở, chạy qua CLI trên máy hoặc dùng gateway API. Chọn cách thực thi trong từng lượt giao việc.</p></div>
    <div style="display:grid;gap:12px">${d.agents.map(theAi).join("")}</div>
    <p class="muted" style="font-size:14px;margin-top:14px">${esc(phien)}</p>
    <div class="btns" style="margin-top:6px"><button class="outline" id="kaLai">↻ Kiểm tra lại</button><button class="outline" id="kaApi">Kết nối API / danh sách model</button></div>
    <p class="muted" style="font-size:13px;margin-top:14px">Bấm Đăng nhập sẽ mở cửa sổ đăng nhập của hãng. Mật khẩu chỉ nhập ở đó, phần mềm không xem được.</p>`;
  sec.querySelectorAll("[data-dn]").forEach((b) => (b.onclick = () => dangNhap(b.dataset.dn)));
  sec.querySelectorAll("[data-tai]").forEach((b) => (b.onclick = () => window.open(TAI[b.dataset.tai], "_blank", "noopener")));
  $("#kaApi").onclick=async()=>{const {openImageConnection}=await import("/ui/contentos-connections.js");await openImageConnection({kind:"llm"});};
  $("#kaLai").onclick = async (e) => { e.target.disabled = true; e.target.textContent = "Đang kiểm tra…"; await tai(true); };
}
function chamMenu() { const c = $("#aiDot"); if (c && S.d) c.hidden = !canKetNoi(S.d); }
// im: kiểm tra ngầm lúc mở phần mềm — lỗi thì thôi, không làm phiền người dùng
async function tai(moi, im) {
  try { S.d = await docTrangThai(moi); } catch (e) {
    if (im) return;
    if (!S.d) $("#vKetNoi").innerHTML = `<div class="hero"><h1>Kết nối AI</h1><p>${esc(e.message)}</p></div><button class="outline" id="kaLai">↻ Kiểm tra lại</button>`;
    const b = $("#kaLai"); if (b) { b.disabled = false; b.textContent = "↻ Kiểm tra lại"; b.onclick = () => tai(true); }
    return toast(e.message, true);
  }
  chamMenu();
  if (!$("#vKetNoi").hidden) ve();
}
async function dangNhap(id) {
  const r = await fetch("/api/ai-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agent: id }) }).then((x) => x.json()).catch(() => ({ ok: false }));
  if (!r.ok) return toast(r.error || "Không mở được cửa sổ đăng nhập.", true);
  S.cho = id; S.tuLuc = Date.now(); ve();
  toast("Đã mở cửa sổ đăng nhập, làm theo hướng dẫn trong đó.");
  const hoi = async () => {
    if (S.cho !== id) return;
    await tai(true);
    const a = S.d?.agents.find((x) => x.id === id);
    if (a?.dangNhap === true) { S.cho = null; ve(); return toast(`Đã kết nối ${a.ten}`); }
    if (Date.now() - S.tuLuc > 180000) { S.cho = null; return ve(); } // quá 3 phút: thôi hỏi, người dùng bấm Kiểm tra lại
    setTimeout(hoi, 4000);
  };
  setTimeout(hoi, 4000);
}
export async function loadKetNoi() {
  const sec = $("#vKetNoi");
  if (!S.d) sec.innerHTML = `<div class="hero"><h1>Kết nối AI</h1><p>Đang kiểm tra…</p></div>`;
  else ve();
  await tai(false);
}
export const kiemNen = () => tai(false, true);
