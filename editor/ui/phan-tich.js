// Phân tích kênh mạng xã hội (gói Pro+): dán link kênh → AI (Claude / Codex) lấy dữ liệu, xem từng video, nghe lời → báo cáo
// Màn hình #vPhanTich: ô nhập + danh sách báo cáo (trạng thái, %) · trang đọc báo cáo (mục lục, số liệu từng tuyến / hook, bài dẫn chứng)
import {renderFeaturePreview} from './contentos-feature-preview.js';
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const api = async (url, opts) => (await fetch(url, opts)).json();
const PLAT = { tiktok: ["TikTok", "#25F4EE"], facebook: ["Facebook", "#1877F2"], instagram: ["Instagram", "#E1306C"], youtube: ["YouTube", "#FF0033"],
  threads: ["Threads", "#ffffff"], linkedin: ["LinkedIn", "#0A66C2"], x: ["X", "#ffffff"] };
const fmtN = (n) => (Number(n) ? new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(Number(n)) : "—");
const pct = (n) => (Number.isFinite(Number(n)) ? `${String(Math.round(Number(n) * 100) / 100).replace(".", ",")}%` : "—");
const dmy = (d) => (d ? esc(String(d).slice(0, 10).split("-").reverse().join("/")) : "—");
const ago = (iso) => (iso ? new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
const toast = (t, err) => window.__toast ? window.__toast(t, err) : alert(t);
const S = { data: null, open: null, report: null, tab: {} };
let timer = 0;

export async function loadPhanTich() {
  try { S.data = await api("/api/phan-tich"); } catch { S.data = { allowed: false, items: [] }; }
  // đang có ô nhập → chỉ làm mới danh sách (không xoá chữ người dùng đang gõ / câu trả lời)
  if (!S.open) { if ($("#ptForm") && S.data.allowed) paintItems(); else renderList(); }
  clearTimeout(timer);
  if ((S.data.items || []).some((x) => x.status === "waiting" || x.status === "working"))
    timer = setTimeout(() => { if (!$("#vPhanTich").hidden) loadPhanTich(); }, 4000);
}

// link kênh hợp lệ (để hỏi "nghe chi tiết" ngay khi dán)
const isChannel = (u) => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) && /(tiktok|facebook|fb|youtube|youtu|instagram|threads|linkedin|twitter|(^|\.)x)\.(com|be|net|watch)$/i.test(x.hostname.replace(/^www\.|^m\./, "")); } catch { return false; } };

function itemsHtml() {
  const d = S.data, items = d.items || [];
  const st = (x) => x.status === "done" ? `<span class="pt-st ok">Hoàn thành</span>`
    : x.status === "error" ? `<span class="pt-st err" title="${esc(x.error)}">Lỗi</span>`
    : x.status === "working" ? `<span class="pt-st run">${esc(x.step)} · ${x.pct}%</span>` : `<span class="pt-st wait">Chờ AI nhận việc</span>`;
  const waiting = items.some((x) => x.status === "waiting");
  return `${waiting && !d.listener ? `<div class="pt-tip">Chưa có Claude / Codex đang chờ việc — mở Claude / Codex trong thư mục phần mềm rồi dán: <code>phân tích kênh đang chờ trong phần mềm</code></div>` : ""}
    <h2 class="pt-h2">Lịch sử báo cáo</h2>
    ${items.length ? `<div class="pt-list">${items.map((x) => {
      const [pl, col] = PLAT[x.platform] || [x.platform, "#888"];
      return `<div class="pt-row" data-id="${esc(x.id)}">
        <i class="pt-av" style="--pc:${col}">${esc((x.name || x.handle || "?")[0].toUpperCase())}</i>
        <div class="pt-who"><b>${esc(x.name || "@" + x.handle)}</b><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(pl)} · ${x.limit || ""} bài${x.listen ? " · 🎧 nghe lời" : ""} · ${esc(x.url)}</a></div>
        <div class="pt-mid">${st(x)}${x.status === "working" ? `<div class="pt-bar"><i style="width:${x.pct}%"></i></div>` : ""}</div>
        <div class="pt-time">${ago(x.doneAt || x.createdAt)}</div>
        <div class="pt-act">${x.status === "done" ? `<button class="primary small" data-open>Xem báo cáo</button>` : ""}<button class="ghost-btn small" data-del title="Xoá">Xoá</button></div>
      </div>`;
    }).join("")}</div>` : `<div class="kho-empty">Chưa có báo cáo nào. Dán link kênh ở trên để bắt đầu.</div>`}`;
}
function paintItems() {
  const box = $("#ptItems");
  if (!box) return;
  box.innerHTML = itemsHtml();
  box.querySelectorAll(".pt-row").forEach((row) => {
    const id = row.dataset.id;
    row.querySelector("[data-open]")?.addEventListener("click", () => openReport(id));
    row.querySelector("[data-del]").onclick = async () => {
      if (!confirm("Xoá báo cáo này?")) return;
      await api(`/api/phan-tich?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      loadPhanTich();
    };
  });
}

function renderList() {
  const sec = $("#vPhanTich"), d = S.data;
  const hero = `<div class="hero"><h1>Phân tích kênh</h1><p>Dán link kênh đối thủ (hoặc kênh của bạn) — AI xem từng video, lấy tương tác
    rồi viết báo cáo: định vị, tone giọng, tuyến nội dung, kiểu hook, cách dẫn dắt, phễu marketing, điểm mạnh để học hỏi, điểm yếu để khai thác.</p></div>`;
  if (!d) { sec.innerHTML = hero + `<div class="kho-empty">Đang tải…</div>`; return; }
  if (!d.allowed) {
    renderFeaturePreview(sec,'analysis');return;
    sec.innerHTML = hero + `<div class="kho-empty">🔒 Phân tích kênh dành cho gói <b>Pro</b> trở lên.<br><br><button class="primary" id="ptUp">Nâng cấp gói</button></div>`;
    $("#ptUp").onclick = () => (window.__openUpgrade ? window.__openUpgrade() : toast("Nâng cấp gói trên website.", true));
    return;
  }
  sec.innerHTML = hero + `
    <form class="pt-form" id="ptForm">
      <div class="pt-in"><svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6.5 9.5l3-3M7 4.5l1.2-1.2a2.8 2.8 0 014 4L11 8.5M9 11.5l-1.2 1.2a2.8 2.8 0 01-4-4L5 7.5"/></svg>
        <input id="ptUrl" placeholder="Dán link kênh: https://www.tiktok.com/@ten-kenh" autocomplete="off">
        <select id="ptLimit" title="Số bài gần nhất">${[10, 20, 30, 50].map((n) => `<option value="${n}" ${n === 30 ? "selected" : ""}>${n} bài gần nhất</option>`).join("")}</select>
        <button class="primary" type="submit">Phân tích</button></div>
      <div class="pt-ask" id="ptAsk" hidden>
        <div class="q"><span class="ic">🎧</span><div><b>Có nghe chi tiết lời thoại từng video không?</b>
          <small>AI nghe lời nói trong từng video để phân tích kỹ câu hook, cách dẫn dắt, kêu gọi hành động. Lâu hơn: khoảng 1–3 phút mỗi video.</small></div></div>
        <div class="opts"><button type="button" class="yes" data-l="1">Có, nghe chi tiết</button><button type="button" data-l="0">Không, chỉ xem hình + số liệu</button></div>
      </div>
      <div class="pt-opts">
        <label class="pt-listen" title="AI nghe lời nói trong từng video"><input type="checkbox" id="ptListen"><i></i>🎧 Nghe chi tiết lời thoại từng video</label>
        <span class="pt-eta" id="ptEta"></span>
      </div>
      <input id="ptNote" class="pt-note" placeholder="Mục đích (không bắt buộc): VD đối thủ bán serum, mình muốn học cách làm hook và livestream">
      <div class="pt-plats">${Object.values(PLAT).map(([l, c]) => `<span><i style="background:${c}"></i>${l}</span>`).join("")}</div>
    </form>
    <div id="ptItems"></div>`;
  paintItems();
  const url = $("#ptUrl"), ask = $("#ptAsk"), listen = $("#ptListen"), limit = $("#ptLimit");
  let answered = false;
  const eta = () => {
    const n = Number(limit.value), m = Math.round(n * (listen.checked ? 2 : 0.4) + 3);
    $("#ptEta").textContent = `Ước tính AI làm khoảng ${m < 60 ? m + " phút" : (m / 60).toFixed(1).replace(".", ",") + " giờ"} cho ${n} bài`;
  };
  // dán / gõ xong link kênh → hỏi ngay có nghe chi tiết không (trả lời rồi thì thôi, vẫn đổi được bằng công tắc)
  const maybeAsk = () => { if (!answered && isChannel(url.value.trim())) { ask.hidden = false; ask.classList.add("pop"); } };
  url.addEventListener("paste", () => setTimeout(maybeAsk, 0));
  url.addEventListener("input", maybeAsk);
  ask.querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => {
    answered = true; listen.checked = b.dataset.l === "1"; ask.hidden = true; eta();
  }));
  listen.onchange = () => { answered = true; ask.hidden = true; eta(); };
  limit.onchange = eta;
  eta();
  $("#ptForm").onsubmit = async (e) => {
    e.preventDefault();
    const u = url.value.trim();
    if (!u) return url.focus();
    if (!answered) { ask.hidden = false; ask.classList.remove("pop"); void ask.offsetWidth; ask.classList.add("pop"); return; } // phải chọn có / không nghe trước
    const r = await api("/api/phan-tich", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: u, limit: limit.value, listen: listen.checked, note: $("#ptNote").value }) }).catch(() => ({ ok: false, error: "Không gửi được." }));
    if (!r.ok) return toast(r.error, true);
    toast(r.listener ? `Đã giao ${r.listener.agent === "codex" ? "Codex" : "Claude"} phân tích — theo dõi tiến độ ở danh sách.` : "Đã tạo việc — dán “phân tích kênh đang chờ trong phần mềm” vào Claude / Codex.");
    url.value = ""; $("#ptNote").value = ""; answered = false; listen.checked = false; eta();
    loadPhanTich();
  };
}

async function openReport(id) {
  const r = await api(`/api/phan-tich?id=${encodeURIComponent(id)}`).catch(() => null);
  if (!r?.ok) return toast(r?.error || "Không mở được báo cáo.", true);
  S.open = id; S.report = r.report; S.item = r.item;
  renderReport();
  $("#main").scrollTop = 0;
}
export function closeReport() { S.open = null; renderList(); }

// ---------- Trang báo cáo (trực quan: ảnh từng bài, biểu đồ lượt xem / tuyến nội dung, thẻ có ảnh dẫn chứng) ----------
const PAL = ["#d8ff3e", "#4aa8ff", "#ff6fae", "#ffb84a", "#9b8cff", "#3ddc84", "#ff8a8a", "#5fe0e0"];
function renderReport() {
  const R = S.report, it = S.item, sec = $("#vPhanTich"), X = R.sections || {}, st = R.stats || {}, ch = R.channel || {};
  const posts = R.posts || [], byN = new Map(posts.map((p) => [p.n, p]));
  const [pl, col] = PLAT[ch.platform || it.platform] || ["", "#888"];
  const file = (f) => `/api/phan-tich/file?id=${encodeURIComponent(S.open)}&f=${encodeURIComponent(f)}`;
  // màu từng tuyến nội dung (dùng chung cho biểu đồ, thẻ, ảnh bài)
  const pillarNames = [...new Set([...(X.pillars || []).map((g) => g.name), ...posts.map((p) => p.pillar).filter(Boolean)])];
  const pc = (name) => (name ? PAL[pillarNames.indexOf(name) % PAL.length] : "#666");
  const para = (t) => esc(t || "").split(/\n+/).map((x) => `<p>${x}</p>`).join("");
  // ảnh 1 bài: khung / ảnh bìa, góc dưới lượt xem, viền màu tuyến; bấm → mở bài gốc; nút ⊞ → tấm 12 khung
  const thumb = (n, size = "") => {
    const p = byN.get(Number(n));
    if (!p) return "";
    return `<div class="rp-th ${size}" style="--pc:${pc(p.pillar)}" title="${esc(`Bài ${p.n} · ${p.pillar || ""}\n${p.caption}`)}">
      <a href="${esc(p.url || "#")}" target="_blank" rel="noopener">${p.img ? `<img loading="lazy" src="${file(p.img)}" alt="">` : `<span class="ph">Bài ${p.n}</span>`}
        <b class="n">${p.n}</b><span class="v">▶ ${fmtN(p.views)}</span></a>
      ${p.sheet ? `<button class="sh" data-sheet="${esc(p.sheet)}" data-n="${p.n}" title="Xem 12 khung của video">⊞</button>` : ""}</div>`;
  };
  const strip = (ns, size) => ((ns || []).length ? `<div class="rp-strip">${ns.map((n) => thumb(n, size)).join("")}</div>` : "");
  const maxV = Math.max(1, ...[...(X.pillars || []), ...["hooks", "flows", "ctas"].flatMap((k) => X.structure?.[k] || [])].map((g) => g.avgViews || 0));
  const metric = (g) => `<div class="rp-met">
      <div><small>Số bài</small><b>${g.count ?? (g.posts || []).length}</b></div>
      <div><small>Lượt xem TB</small><b>${fmtN(g.avgViews)}</b></div>
      <div><small>Tỉ lệ tương tác</small><b>${pct(g.er)}</b></div>
      <div><small>So với TB kênh</small><b class="${(g.vsChannel || 0) >= 1 ? "up" : "down"}">${g.vsChannel ? `×${String(g.vsChannel).replace(".", ",")}` : "—"}</b></div>
    </div><div class="rp-bar"><i style="width:${Math.round(((g.avgViews || 0) / maxV) * 100)}%;background:${g.color || "#d8ff3e"}"></i></div>`;
  const group = (g, title, opts = {}) => `<div class="rp-card" ${g.color ? `style="--pc:${g.color}"` : ""}>
      <div class="rp-ch">${g.color ? `<i class="dot"></i>` : ""}<h4>${esc(title)}</h4></div>
      ${opts.big ? `<div class="rp-hookimgs">${(g.posts || []).slice(0, 4).map((n) => thumb(n, "md")).join("")}</div>` : ""}
      ${metric(g)}
      ${g.desc ? `<div class="rp-lab">Mô tả</div>${para(g.desc)}` : ""}
      ${(g.examples || []).length ? `<div class="rp-quotes">${g.examples.map((q) => `<q>${esc(String(q).replace(/^"|"$/g, ""))}</q>`).join("")}</div>` : ""}
      ${g.verdict || g.effect ? `<div class="rp-lab">Hiệu quả</div>${para(g.verdict || g.effect)}` : ""}
      ${opts.big ? "" : strip(g.posts, "sm")}</div>`;
  const tabs = (key, list) => {
    const cur = S.tab[key] ?? 0;
    return `<div class="rp-tabs" data-k="${key}">${list.map(([l, arr], i) => `<button class="${i === cur ? "on" : ""}" data-i="${i}">${esc(l)} (${(arr || []).length})</button>`).join("")}</div>
      <div class="rp-tabc">${(list[cur]?.[1] || []).map((g) => list[cur][2](g)).join("") || `<div class="rp-none">Không có.</div>`}</div>`;
  };

  // --- biểu đồ tổng quan: cột lượt xem từng bài (cũ → mới, màu tuyến) · vòng tỉ lệ tuyến · cột hiệu quả tuyến
  const chrono = [...posts].sort((a, b) => b.n - a.n), vmax = Math.max(1, ...posts.map((p) => p.views));
  const avgH = Math.round(((st.avgViews || 0) / vmax) * 100);
  const bars = `<div class="rp-chart"><div class="rp-cols" style="--avg:${avgH}%">
      <span class="avg" title="Trung bình kênh">TB ${fmtN(st.avgViews)}</span>
      ${chrono.map((p) => `<a class="col" href="${esc(p.url)}" target="_blank" rel="noopener" title="${esc(`Bài ${p.n} · ${p.date}\n${fmtN(p.views)} xem · ${pct(p.er)} tương tác\n${p.pillar}`)}">
        <em>${fmtN(p.views)}</em><i style="height:${Math.max(2, Math.round((p.views / vmax) * 100))}%;background:${pc(p.pillar)}"></i></a>`).join("")}
    </div><div class="rp-cols-th">${chrono.map((p) => thumb(p.n, "xs")).join("")}</div>
    <div class="rp-cap">Lượt xem từng bài theo thời gian đăng (cũ → mới) · màu = tuyến nội dung · vạch đứt = trung bình kênh</div></div>`;
  const pil = (X.pillars || []).map((g) => ({ ...g, color: pc(g.name) }));
  const total = pil.reduce((s, g) => s + (g.count || 0), 0) || 1;
  let acc = 0;
  const C = 2 * Math.PI * 42;
  const donut = `<svg viewBox="0 0 100 100" class="rp-donut">${pil.map((g) => {
      const len = ((g.count || 0) / total) * C, seg = `<circle r="42" cx="50" cy="50" fill="none" stroke="${g.color}" stroke-width="14" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-acc}"/>`;
      acc += len; return seg; }).join("")}<text x="50" y="47" text-anchor="middle">${total}</text><text x="50" y="60" text-anchor="middle" class="s">bài</text></svg>`;
  const pmax = Math.max(1, ...pil.map((g) => g.avgViews || 0));
  const pillarChart = `<div class="rp-pie">${donut}<div class="rp-legend">${pil.map((g) => `<div class="lg">
      <i style="background:${g.color}"></i><span class="nm">${esc(g.name)}</span><span class="ct">${g.count} bài</span>
      <span class="hb"><b style="width:${Math.round(((g.avgViews || 0) / pmax) * 100)}%;background:${g.color}"></b></span>
      <span class="av">${fmtN(g.avgViews)} <small>${g.vsChannel ? `×${String(g.vsChannel).replace(".", ",")}` : ""}</small></span></div>`).join("")}
    <div class="rp-cap">Số bài mỗi tuyến · thanh = lượt xem TB · ×n = so với TB kênh</div></div></div>`;

  const SECS = [
    ["overview", "Tổng quan số liệu", bars + pillarChart],
    ["brand-pos", "Định vị thương hiệu", para(X.brand?.positioning) + strip((X.brand?.posts || []).slice(0, 6), "md")],
    ["brand-voice", "Giọng nói thương hiệu", para(X.brand?.voice)],
    ["style", "Phong cách quay dựng", para(X.brand?.style) + (() => { const s = posts.find((p) => p.sheet && (X.brand?.posts || []).includes(p.n)) || posts.find((p) => p.sheet);
      return s ? `<button class="rp-sheet" data-sheet="${esc(s.sheet)}" data-n="${s.n}"><img loading="lazy" src="${file(s.sheet)}" alt=""><span>12 khung của bài ${s.n} — bấm để xem lớn</span></button>` : strip(posts.slice(0, 6).map((p) => p.n), "md"); })()],
    ["audience", "Khách hàng mục tiêu", para(X.brand?.audience)],
    ["activity", "Hoạt động & xu hướng", X.activity ? `<div class="rp-kv">${[["Tần suất đăng", X.activity.frequency], ["Định dạng", X.activity.formats], ["Xu hướng", X.activity.trend]]
      .filter(([, v]) => v).map(([k, v]) => `<div><small>${k}</small>${para(v)}</div>`).join("")}</div>` : ""],
    ["pillars", "Tuyến nội dung", pil.map((g) => group(g, g.name)).join("")],
    ["structure", "Cấu trúc nội dung", tabs("structure", [["Kỹ thuật hook", X.structure?.hooks, (g) => group(g, g.type, { big: true })],
      ["Cách dẫn dắt", X.structure?.flows, (g) => group(g, g.type)], ["Call to action", X.structure?.ctas, (g) => group(g, g.type)]])],
    ["top", "Top nội dung", `<div class="rp-top">${(X.top || []).map((t, i) => { const p = byN.get(Number(t.post)) || {};
      return `<div class="rp-tp">${thumb(t.post, "lg")}<div class="tx"><span class="rk">#${i + 1}</span>
        <div class="rp-met sm"><div><small>Lượt xem</small><b>${fmtN(p.views)}</b></div><div><small>Thích</small><b>${fmtN(p.likes)}</b></div>
          <div><small>Bình luận</small><b>${fmtN(p.comments)}</b></div><div><small>Tương tác</small><b>${pct(p.er)}</b></div></div>
        <span class="pill" style="--pc:${pc(p.pillar)}">${esc(p.pillar || "")}</span>
        <p>${esc(t.why || "")}</p>${p.hook ? `<div class="rp-lab">Mở đầu</div><p class="hk">${esc(p.hook)}</p>` : ""}</div></div>`; }).join("")}</div>`],
    ["ads", "Hoạt động quảng cáo", X.ads ? `<div class="rp-flag ${X.ads.has ? "on" : ""}">${X.ads.has ? "Có dấu hiệu quảng cáo / hợp tác" : "Không thấy dấu hiệu quảng cáo"}</div>${para(X.ads.desc)}${strip((X.ads.posts || []).slice(0, 8), "sm")}` : ""],
    ["funnel", "Phễu marketing", `<div class="rp-funnel">${(X.funnel || []).map((f, i, a) => `<div class="rp-fs" style="--w:${100 - (i * 34) / Math.max(1, a.length - 1)}%">
      <div class="fh"><b>${esc(f.stage)}</b><span>${(f.posts || []).length} bài</span></div>${para(f.desc)}${strip((f.posts || []).slice(0, 6), "xs")}</div>`).join("")}</div>`],
    ["review", "Đánh giá tổng quan", tabs("review", [["Điểm mạnh", X.strengths, (g) => `<div class="rp-card good"><h4>✓ ${esc(g.title)}</h4>${para(g.desc)}${strip((g.posts || []).slice(0, 6), "sm")}</div>`],
      ["Điểm yếu", X.weaknesses, (g) => `<div class="rp-card bad"><h4>! ${esc(g.title)}</h4>${para(g.desc)}${strip((g.posts || []).slice(0, 6), "sm")}</div>`]])],
    ["ideas", "Gợi ý cho bạn", `<div class="rp-ideas">${(X.ideas || []).map((g, i) => `<div class="rp-card idea"><span class="ix">${i + 1}</span><h4>${esc(g.title)}</h4>${para(g.desc)}</div>`).join("")}</div>`],
    ["posts", "Tất cả bài phân tích", `<div class="rp-grid">${posts.map((p) => `<div class="rp-gi">${thumb(p.n, "md")}
      <div class="gm"><span class="pill" style="--pc:${pc(p.pillar)}">${esc(p.pillar || "—")}</span>
        <div class="gs"><span>▶ ${fmtN(p.views)}</span><span>♥ ${fmtN(p.likes)}</span><span>💬 ${fmtN(p.comments)}</span></div>
        <small>${dmy(p.date)} · ${pct(p.er)} tương tác${p.duration ? ` · ${Math.round(p.duration)}s` : ""}</small></div></div>`).join("")}</div>`],
  ].filter(([, , body]) => body && body.replace(/<[^>]+>/g, "").trim());
  sec.innerHTML = `<div class="rp">
    <div class="rp-bar-top no-print"><button class="ghost-btn" id="rpBack">← Danh sách báo cáo</button><button class="ghost-btn" id="rpPrint">In / Lưu PDF</button></div>
    <header class="rp-head">
      <i class="pt-av big" style="--pc:${col}">${esc((ch.name || it.handle || "?")[0].toUpperCase())}</i>
      <div class="rp-id"><small>${esc(pl)} · Báo cáo ${ago(it.doneAt)}</small><h1>${esc(ch.name || "@" + it.handle)}</h1>
        <a href="${esc(ch.url || it.url)}" target="_blank" rel="noopener">${esc(ch.handle || it.url)} ↗</a>${ch.bio ? `<p>${esc(ch.bio)}</p>` : ""}</div>
      <div class="rp-cover no-print">${[...posts].sort((a, b) => b.views - a.views).slice(0, 4).map((p) => thumb(p.n, "sm")).join("")}</div>
    </header>
    <div class="rp-kpi">
      <div><small>Người theo dõi</small><b>${fmtN(ch.followers)}</b></div>
      <div><small>Bài phân tích</small><b>${st.posts || "—"}</b></div>
      <div><small>Lượt xem TB / bài</small><b>${fmtN(st.avgViews)}</b></div>
      <div><small>Tỉ lệ tương tác</small><b>${pct(st.er)}</b></div>
      <div><small>Khoảng thời gian</small><b class="sm">${dmy(st.from)}${st.to && st.to !== st.from ? " → " + dmy(st.to) : ""}</b></div>
    </div>
    ${R.summary ? `<div class="rp-sum"><b>Tóm tắt</b>${para(R.summary)}</div>` : ""}
    <div class="rp-body">
      <nav class="rp-toc no-print">${SECS.map(([id, t], i) => `<a href="#rp-${id}"><span>${String(i + 1).padStart(2, "0")}</span>${t}</a>`).join("")}</nav>
      <div class="rp-main">${SECS.map(([id, t, body], i) => `<section class="rp-sec" id="rp-${id}"><h3><span>${String(i + 1).padStart(2, "0")}</span>${t}</h3>${body}</section>`).join("")}</div>
    </div></div>`;
  $("#rpBack").onclick = closeReport;
  $("#rpPrint").onclick = () => window.print();
  sec.querySelectorAll(".rp-toc a").forEach((a) => (a.onclick = (e) => { e.preventDefault(); $(a.getAttribute("href"))?.scrollIntoView({ behavior: "smooth", block: "start" }); }));
  sec.querySelectorAll(".rp-tabs").forEach((t) => t.querySelectorAll("button").forEach((b) => (b.onclick = () => {
    S.tab[t.dataset.k] = Number(b.dataset.i);
    const y = $("#main").scrollTop; renderReport(); $("#main").scrollTop = y;
  })));
  // tấm 12 khung của video (bấm ⊞ trên ảnh bài, hoặc tấm ở mục Phong cách quay dựng)
  sec.querySelectorAll("[data-sheet]").forEach((b) => (b.onclick = (e) => {
    e.preventDefault();
    const p = byN.get(Number(b.dataset.n)) || {};
    const box = document.body.appendChild(document.createElement("div"));
    box.className = "rp-lb";
    box.innerHTML = `<div class="in"><div class="hd"><b>Bài ${p.n} · ${fmtN(p.views)} xem · ${esc(p.pillar || "")}</b>
      <a href="${esc(p.url || "#")}" target="_blank" rel="noopener">Mở bài gốc ↗</a><button aria-label="Đóng">✕</button></div>
      <img src="${file(b.dataset.sheet)}" alt="12 khung của video">${p.hook ? `<p>${esc(p.hook)}</p>` : ""}</div>`;
    const close = () => { box.remove(); document.removeEventListener("keydown", esc2); };
    const esc2 = (ev) => { if (ev.key === "Escape") close(); };
    box.onclick = (ev) => { if (ev.target === box || ev.target.tagName === "BUTTON") close(); };
    document.addEventListener("keydown", esc2);
  }));
}
