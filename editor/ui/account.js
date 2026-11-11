// Đăng nhập bắt buộc + ô tài khoản trên header. Dùng chung cho editor và màn hình dự án.
// Tài khoản quản lý ở máy chủ cloud (CLOUD_URL); editor chỉ giữ token ở editor/.account.json.
const TIER = { none: "Chưa kích hoạt", free: "Basic", pro: "Pro", premium: "Premium" };
const css = `
.gate{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;
  background:radial-gradient(ellipse at 50% 0%,rgba(216,255,62,.12),transparent 60%),#0a0a0b;font:14px/1.5 Inter,system-ui,sans-serif;color:#f5f5f6}
.gate .box{width:min(420px,100%);background:#131315;border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:28px}
.gate h1{margin:0 0 6px;font:800 22px/1.1 "Inter Tight",Inter,sans-serif;text-transform:uppercase}
.gate h1::before{content:"";display:inline-block;width:10px;height:10px;border-radius:3px;background:#d8ff3e;margin-right:10px;vertical-align:3px}
.gate p{color:#c2c2c8;margin:0 0 18px}
.gate form{display:grid;gap:10px}
.gate input{font:inherit;color:#f5f5f6;background:#0e0e10;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:12px 14px}
.gate input:focus{outline:none;border-color:#d8ff3e}
.gate button{font:700 14px/1 Inter,sans-serif;border:0;border-radius:12px;padding:13px;cursor:pointer;background:#d8ff3e;color:#0a0a0b}
.gate p.dl{margin:-8px 0 16px;padding:10px 12px;border-radius:10px;background:rgba(216,255,62,.08);color:#d8ff3e;font-size:13px}
.gate .err{color:#ff3d8b;font-size:13px;min-height:1em}
.gate .alt{margin-top:14px;font-size:13px;color:#7b7b83;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
.gate a{color:#d8ff3e;cursor:pointer;text-decoration:none}
.acct-chip{position:relative;display:inline-flex}
.acct-chip>button{display:inline-flex;gap:7px;align-items:center;font:600 12.5px/1 Inter,sans-serif;color:#c2c2c8;background:#1a1a1d;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:6px 9px;cursor:pointer}
.acct-chip .t{font:800 10px/1 "Inter Tight",Inter,sans-serif;letter-spacing:.05em;text-transform:uppercase;padding:3px 6px;border-radius:5px;background:#232327;color:#c2c2c8}
.acct-chip .t.pro{background:#2a3112;color:#d8ff3e}.acct-chip .t.premium{background:linear-gradient(90deg,#ff3d8b,#ff9a3d);color:#fff}
.acct-chip .em{max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.acct-menu{position:absolute;right:0;top:calc(100% + 6px);z-index:95;min-width:230px;background:#131315;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:6px;box-shadow:0 16px 40px rgba(0,0,0,.5);display:none}
.acct-menu.show{display:block}
.acct-menu div{padding:8px 10px;font-size:12px;color:#7b7b83}
.acct-menu button{display:block;width:100%;text-align:left;font:600 13px/1.2 Inter,sans-serif;color:#f5f5f6;background:none;border:0;border-radius:8px;padding:9px 10px;cursor:pointer}
.acct-menu button:hover{background:#1a1a1d}`;

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
const openWeb = (hash = "") => { const u = window.__account?.cloudUrl; if (u) window.open(u + "/" + hash, "_blank", "noopener"); };
// chưa đăng nhập trong phần mềm thì mọi nút mở khoá đều dẫn tới đăng nhập: khách có thể đã mua gói, chỉ là phần mềm chưa biết tài khoản
window.__openUpgrade = () => { const st = window.__account; if (st?.configured && !st.loggedIn) gate(st); else openWeb("#bang-gia"); };

function gate(st) {
  let reg = false;
  const box = el("div", { class: "box" });
  const wrap = el("div", { class: "gate" }, box);
  const draw = (err = "") => {
    box.innerHTML = "";
    const form = el("form", {},
      reg ? el("input", { name: "name", placeholder: "Tên của bạn", autocomplete: "name" }) : null,
      el("input", { name: "email", type: "email", placeholder: "Email", required: "", autocomplete: "email", ...(st.downloadedFor?.email ? { value: st.downloadedFor.email } : {}) }),
      el("input", { name: "password", type: "password", placeholder: reg ? "Mật khẩu (ít nhất 8 ký tự)" : "Mật khẩu", required: "", autocomplete: reg ? "new-password" : "current-password" }),
      el("button", {}, reg ? "Tạo tài khoản" : "Đăng nhập"),
      reg ? null : el("a", { href: "https://autosocial.topexpert.vn/dang-nhap.html?mode=quen", target: "_blank", rel: "noopener", style: "display:block;margin-top:8px;font-size:13px;color:#c3c3c9" }, "Quên mật khẩu?"),
      el("div", { class: "err" }, err));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const body = Object.fromEntries(new FormData(form));
      form.querySelector("button").textContent = "Đang xử lý…";
      try {
        const r = await fetch(`/api/account/${reg ? "register" : "login"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const j = await r.json();
        if (!j.ok) throw new Error(j.error || "Lỗi");
        location.reload();
      } catch (er) { draw(er.message); }
    });
    box.replaceChildren(...[
      el("h1", {}, reg ? "Tạo tài khoản" : "Đăng nhập"),
      el("p", {}, st.expired ? "Phiên đăng nhập đã hết hạn, hãy đăng nhập lại." : "Phần mềm dùng tài khoản riêng với website: đăng nhập đúng email đã mua để mở tính năng của gói. Email đã được kích hoạt gói Basic dùng được ngay các mẫu edit Basic."),
      st.downloadedFor ? el("p", { class: "dl" }, `Bản phần mềm gói ${st.downloadedFor.planName || TIER[st.downloadedFor.plan] || st.downloadedFor.plan} — tải bằng tài khoản ${st.downloadedFor.email}. Đăng nhập đúng email này để mở đủ tính năng của gói.`) : null,
      form,
      el("div", { class: "alt" },
        el("a", { onclick: () => { reg = !reg; draw(); } }, reg ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"),
        el("a", { onclick: () => openWeb("#bang-gia") }, "Xem bảng giá"),
        el("a", { onclick: () => wrap.remove() }, "Để sau"))].filter(Boolean));
  };
  draw();
  document.body.append(wrap);
}

function chip(st) {
  const host = document.getElementById("acctChip");
  if (host && st.configured && !st.loggedIn) host.replaceChildren(el("span", { class: "acct-chip" }, el("button", { onclick: () => gate(st) }, "Đăng nhập")));
  if (!host || !st.user) return;
  const u = st.user;
  const menu = el("div", { class: "acct-menu" },
    el("div", {}, `${u.email}${u.planExpires ? ` · ${TIER[u.plan]} đến ${new Date(u.planExpires).toLocaleDateString("vi-VN")}` : ""}${st.offline ? " · đang ngoại tuyến" : ""}`),
    st.downloadedFor && st.downloadedFor.email !== u.email ? el("div", {}, `Bản cài này tải bằng ${st.downloadedFor.email} (gói ${st.downloadedFor.planName || st.downloadedFor.plan})`) : null,
    u.plan === "none" ? el("div", { class: "warn" }, "Tài khoản chưa kích hoạt gói Basic — chưa tải được mẫu edit.") : null,
    u.plan !== "premium" ? el("button", { onclick: () => openWeb("#bang-gia") }, u.plan === "none" ? "Mua gói Basic / Pro / Premium" : `Nâng cấp ${u.plan === "free" ? "Pro / Premium" : "Premium"}`) : null,
    el("button", { onclick: () => openWeb("") }, "Tài khoản trên website"),
    el("button", { onclick: async () => { await fetch("/api/account/logout", { method: "POST" }); location.reload(); } }, "Đăng xuất"));
  const btn = el("button", { title: "Tài khoản", onclick: (e) => { e.stopPropagation(); menu.classList.toggle("show"); } },
    el("span", { class: `t ${u.plan}` }, TIER[u.plan] || u.plan), el("span", { class: "em" }, u.email));
  host.replaceChildren(el("span", { class: "acct-chip" }, btn, menu));
  document.addEventListener("click", () => menu.classList.remove("show"));
}

(async function () {
  let st;
  try { st = await (await fetch("/api/account")).json(); } catch { return; }
  window.__account = st;
  document.head.append(el("style", {}, css));
  // Phần mềm dùng không cần đăng nhập, nhưng tính năng theo gói thì cần: bản tải cho gói Pro trở lên hoặc phiên đã hết hạn thì mời đăng nhập 1 lần
  chip(st);
  const SEEN = "vek-moi-dang-nhap";
  let seen = false;
  try { seen = sessionStorage.getItem(SEEN) === "1"; sessionStorage.setItem(SEEN, "1"); } catch {}
  if (st.configured && !st.loggedIn && !seen && (st.expired || ["pro", "premium"].includes(st.downloadedFor?.plan))) gate(st);
  // vừa mua gói trên website rồi quay lại phần mềm: đọc lại gói, đổi thì tải lại trang để mở khoá
  window.addEventListener("focus", async () => {
    if (!st.loggedIn) return;
    try {
      const n = await (await fetch("/api/account")).json();
      if (n.user?.plan && n.user.plan !== st.user?.plan) location.reload();
    } catch {}
  });
})();
