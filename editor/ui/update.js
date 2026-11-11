// Thông báo nhỏ góc phải khi có phiên bản mới + cập nhật 1 bấm.
// Dùng chung cho editor (index.html) và màn hình dự án (home.html).
const KEY = "editor.dismissUpdate";
const css = `
.upd{position:fixed;right:16px;top:70px;z-index:90;width:320px;background:#131315;border:1px solid rgba(216,255,62,.45);border-radius:14px;
  box-shadow:0 18px 50px rgba(0,0,0,.55);padding:14px 14px 12px;font:13px/1.45 Inter,system-ui,sans-serif;color:#f5f5f6;animation:updIn .25s ease-out}
@keyframes updIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.upd .h{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.upd .b{font:800 10px/1 "Inter Tight",Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;background:#d8ff3e;color:#0a0a0b;padding:4px 7px;border-radius:6px}
.upd .t{font-weight:700;flex:1}
.upd .x{background:none;border:0;color:#7b7b83;font-size:14px;cursor:pointer;padding:2px 4px}
.upd .d{color:#7b7b83;font-size:12px}
.upd ul{margin:8px 0 0;padding-left:18px;color:#c2c2c8;font-size:12.5px;max-height:150px;overflow:auto}
.upd .a{display:flex;gap:8px;margin-top:12px;align-items:center}
.upd .a button{font:600 12.5px/1 Inter,sans-serif;border-radius:9px;padding:8px 12px;cursor:pointer;border:1px solid transparent}
.upd .go{background:#d8ff3e;color:#0a0a0b}
.upd .later{background:#1a1a1d;border-color:rgba(255,255,255,.12)!important;color:#c2c2c8}
.upd .lnk{background:none;color:#c2c2c8;text-decoration:underline;text-underline-offset:3px;padding:8px 4px!important}
.upd .msg{margin-top:10px;font-size:12.5px;color:#c2c2c8}
.upd .bar{height:3px;border-radius:2px;background:#232327;overflow:hidden;margin-top:8px}
.upd .bar i{display:block;height:100%;width:35%;background:#d8ff3e;animation:updBar 1.1s ease-in-out infinite}
@keyframes updBar{0%{margin-left:-35%}100%{margin-left:100%}}`;

// "21/10/2026 lúc 13:16" theo giờ máy người dùng.
export function when(L) {
  const d = L.releasedAt ? new Date(L.releasedAt) : L.date ? new Date(L.date + "T00:00:00") : null;
  if (!d || isNaN(d)) return "";
  const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  return L.releasedAt ? `${date} lúc ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}` : date;
}

function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}

async function check() {
  let r;
  try { r = await (await fetch("/api/version")).json(); } catch { return; }
  const lbl = document.getElementById("appVersion");
  if (lbl && r.current?.version) lbl.textContent = `v${r.current.version}`;
  if (r.thayBan) {
    const n = document.createElement("div");
    n.style.cssText = "position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:90;max-width:560px;padding:12px 16px;border-radius:12px;background:#1a1a1d;border:1px solid #d8ff3e;color:#f5f5f6;font:14px/1.5 Inter,sans-serif";
    n.textContent = `Đã chuyển sang bản mới v${r.current.version}, bản cũ v${r.thayBan} đã tắt. Video đã làm ở bản cũ vẫn nằm trong thư mục cài cũ. Đăng nhập lại trong phần mềm để mở tính năng của gói.`;
    n.onclick = () => n.remove();
    document.body.append(n);
  }
  if (!r.hasUpdate || !r.latest) return;
  let dismissed = null;
  try { dismissed = localStorage.getItem(KEY); } catch {}
  if (dismissed === r.latest.version) return;
  show(r);
}

function show(r) {
  document.head.append(el("style", {}, css));
  const L = r.latest;
  const notes = el("ul", { hidden: "" }, (L.notes || []).map((n) => el("li", {}, n)));
  const msg = el("div", { class: "msg", hidden: "" });
  const card = el("div", { class: "upd", role: "status" },
    el("div", { class: "h" }, el("span", { class: "b" }, "Bản mới"), el("span", { class: "t" }, `v${L.version} đã có`),
      el("button", { class: "x", title: "Ẩn", onclick: dismiss }, "✕")),
    el("div", { class: "d" }, `Bạn đang dùng v${r.current.version} · phát hành ${when(L)}`),
    notes,
    el("div", { class: "a" },
      el("button", { class: "go", onclick: () => run(L, card, msg) }, "Cập nhật ngay"),
      el("button", { class: "later", onclick: dismiss }, "Để sau"),
      (L.notes || []).length ? el("button", { class: "lnk", onclick: (e) => { notes.hidden = !notes.hidden; e.target.textContent = notes.hidden ? "Xem thay đổi" : "Ẩn bớt"; } }, "Xem thay đổi") : null),
    msg);
  document.body.append(card);
  function dismiss() { try { localStorage.setItem(KEY, L.version); } catch {} card.remove(); }
}

// Cập nhật: phần mềm tải bản mới (kiểm mã) → giao AI (Claude / Codex đang mở) cài, kiểm tra, khởi động lại, báo có gì mới
async function run(L, card, msg) {
  if (!confirm(`Cập nhật lên v${L.version}?\n\nPhần mềm tự tải và cài, xong tự khởi động lại. Video, dự án, mẫu đã tải, kho hiệu ứng và file .env được giữ nguyên.`)) return;
  card.querySelector(".a").hidden = true;
  msg.hidden = false;
  msg.replaceChildren("Đang tải bản mới…", el("div", { class: "bar" }, el("i")));
  let r;
  try { r = await (await fetch("/api/update?ai=1", { method: "POST" })).json(); }
  catch (e) { msg.textContent = "Tải bản mới lỗi: " + e.message; card.querySelector(".a").hidden = false; return; }
  if (!r.ok) { msg.textContent = "Tải bản mới lỗi: " + (r.error || "không rõ"); card.querySelector(".a").hidden = false; return; }
  if (r.upToDate) { msg.textContent = "Bạn đang dùng bản mới nhất."; return; }
  const dir = r.job.dir;
  let listening = !!r.listener, sawDone = false;
  let selfTried = 0;
  const selfInstall = async () => { // không có AI nhận (hoặc nhận chậm): phần mềm tự cài, người dùng không phải làm gì
    selfTried = Date.now();
    try { const s = await (await fetch("/api/update/self", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dir }) })).json(); if (s.busy) msg.textContent = s.error; } catch {}
  };
  const step = (st) => msg.replaceChildren(
    el("div", {}, "✓ Đã tải bản mới v" + L.version),
    el("div", {}, st === "waiting" ? (listening ? "… Đang giao AI cài (cửa sổ Claude / Codex đang mở sẽ tự nhận)" : "… Đang cài bản mới")
      : st === "working" ? "… AI đang cài bản mới và kiểm tra" : st === "done" ? "✓ AI đã cài xong — đang khởi động lại phần mềm…" : ""),
    st === "error" ? null : el("div", { class: "bar" }, el("i")));
  step("waiting");
  const t0 = Date.now();
  if (!listening) selfInstall();
  const poll = setInterval(async () => {
    try {
      // máy chủ khởi động lại xong với bản mới → tải lại trang
      const v = await (await fetch("/api/version", { cache: "no-store" })).json();
      if (v.current?.version === L.version && !v.proBuild) { clearInterval(poll); location.reload(); return; }
    } catch { return; } // đang khởi động lại
    try {
      const j = (await (await fetch(`/api/ai-job?dir=${encodeURIComponent(dir)}`, { cache: "no-store" })).json());
      listening = listening || !!j.listener;
      if (j.job?.status === "error") { clearInterval(poll); msg.textContent = "AI không cập nhật được: " + (j.job.error || ""); card.querySelector(".a").hidden = false; return; }
      if (j.job?.status === "done") sawDone = true;
      step(sawDone ? "done" : j.job?.status || "waiting");
      if (j.job?.status === "waiting" && Date.now() - Math.max(t0, selfTried) > 30000) selfInstall(); // AI không nhận sau 30 giây
    } catch {}
    if (sawDone && Date.now() - t0 > 120000) { clearInterval(poll); msg.textContent = `Đã cài v${L.version}. Mở lại phần mềm (bấm đúp Mo-Editor hoặc nhờ AI mở lại) rồi bấm F5.`; }
  }, 2000);
}

check();
