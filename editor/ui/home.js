import {automotiveOptionsControl} from '/ui/contentos-automotive-options.js';
import {restoreHomeTemplateShelf} from '/ui/contentos-library-hub.js';
import {mountHomeNavigation} from '/ui/contentos-navigation.js';
import {renderFeaturePreview} from './contentos-feature-preview.js';
import {templateDetailsPanel} from './contentos-template-details.js';
import {jobBrandControls} from './contentos-job-brand.js';
import {openVariantBatch} from './contentos-variant-batch.js';
import {openIntakeBatch} from './contentos-intake-batch.js';
import {jobTemplateVersion} from './contentos-template-version.js';
import {runModelPicker} from './contentos-model-picker.js';
// Trang chủ (kiểu Captions): cột trái = video của bạn · giữa = thả video + chọn mẫu · bước 2 = thiết lập rồi "AI edit".
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const dur = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const ago = (ms) => {
  const m = Math.max(1, Math.round((Date.now() - ms) / 60000));
  return m < 60 ? `${m} phút trước` : m < 1440 ? `${Math.round(m / 60)} giờ trước` : m < 43200 ? `${Math.round(m / 1440)} ngày trước` : `${Math.round(m / 43200)} tháng trước`;
};
function toast(t, err) {
  const el = $("#toast");
  el.textContent = t;
  el.classList.toggle("err", !!err);
  el.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove("show"), 3000);
}
const api = async (url, opts) => (await fetch(url, opts)).json();
const post = (url, body) => api(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });

const S = { projects: [], tpls: [], tpl: null, filter: "all", pending: [], setup: null };
try { S.tpl = localStorage.getItem("home.tpl") || null; } catch {}
const kindOf = (f) => (/^video\//.test(f.type) || /\.(mp4|mov|webm|m4v)$/i.test(f.name) ? "video" : /^image\//.test(f.type) || /\.(png|jpe?g|webp|gif)$/i.test(f.name) ? "image" : "audio");
const isVideo = (f) => /^video\//.test(f.type) || /\.(mp4|mov|m4v|webm)$/i.test(f.name);
const isVoice = (f) => /\.(mp3|m4a|wav|aac|ogg|flac)$/i.test(f.name); // giọng đọc thay video (mẫu faceless)

// ---------- Cột trái: video của bạn ----------
async function loadProjects() {
  const r = await api("/api/projects");
  S.projects = r.projects || [];
  renderProjects();
  if(!$("#vProjects").hidden)renderProjectGrid();
}
function renderProjects() {
  const q = $("#pSearch").value.trim().toLowerCase();
  const list = S.projects.filter((p) => !q || p.title.toLowerCase().includes(q));
  $("#count").textContent = S.projects.length || "";
  $("#plist").innerHTML = list.length ? list.map((p) => `
    <div class="pitem ${p.current ? "cur" : ""}" data-dir="${esc(p.dir)}" tabindex="0">
      <div class="th" style="background-image:url('/api/project-poster?dir=${encodeURIComponent(p.dir)}')"></div>
      <div class="tx"><b>${esc(p.title)}</b><small>${p.ai === "working" ? `<span class="ai">AI đang dựng…${p.aiPct != null ? ` ${p.aiPct}%` : ""}</span>` : p.ai === "waiting" ? `<span class="ai wait">Chưa bắt đầu edit video</span>` : p.ai === "error" ? "AI báo lỗi" : `${p.clips ? "✂ đã cắt clip · " : p.clipOf ? `clip ${p.clipOf} · ` : ""}${ago(p.updated)} · ${dur(p.duration)}`}</small></div>
      <div class="pactions">${p.ai === "working" || p.ai === "waiting" ? "" : `<button class="redo" title="Thiết lập dựng lại bằng AI" aria-label="Dựng lại bằng AI">AI lại</button>`}
      <button class="variant" title="Tạo phiên bản độc lập 9:16 hoặc 16:9" aria-label="Tạo phiên bản">Bản mới</button>
      <button class="more" title="Thêm: đổi tên, xoá" aria-label="Thêm thao tác cho ${esc(p.title)}" aria-haspopup="menu">⋯</button></div>
    </div>`).join("") : `<div class="empty" style="padding:14px 10px">${q ? "Không thấy video." : "Chưa có video nào."}</div>`;
}
function renderProjectGrid(){const original=$('#pSearch').value;$('#pSearch').value=$('#projectsSearch').value;renderProjects();$('#projectsGrid').innerHTML=$('#plist').innerHTML;$('#pSearch').value=original;renderProjects();}
$('#projectsSearch').oninput=renderProjectGrid;
$('#openProjectFile').onclick=async()=>{const {openProjectFile}=await import('/ui/contentos-project-file.js');openProjectFile({toast}).catch(e=>toast(e.message,true));};
$("#pSearch").addEventListener("input", renderProjects);
const handleProjectClick=async (e) => {
  const it = e.target.closest(".pitem");
  if (!it) return;
  const p = S.projects.find((x) => x.dir === it.dataset.dir);
  if(e.target.closest('.variant'))return variantDialog(p);
  if (e.target.closest(".redo")) { // nút Edit: mở lại bảng cài đặt lúc đầu; bấm vào video vẫn vào trình chỉnh sửa
    setupView(p.dir);
    return toast("Bấm AI edit sẽ dựng lại video này từ đầu, thay bản đang có.");
  }
  const more = e.target.closest(".more");
  if (more) return moreMenu(more, [
    ["Đổi tên", async () => {
      const title = prompt("Tên mới cho video:", p.title);
      if (title == null || !title.trim() || title.trim() === p.title) return;
      const j = await post("/api/rename-project", { dir: p.dir, title: title.trim() });
      if (!j.ok) return toast(j.error, true);
      toast("Đã đổi tên."); loadProjects();
    }],
    ["Xoá", () => deleteProject(p), true],
  ]);
  if (e.target.closest(".del")) return deleteProject(p);
  if (p.ai === "working" || p.ai === "waiting" || p.ai === "error") return waitAi(p.dir);
  if (p.clips) return showClips(p.dir); // video dài đã cắt clip → danh sách clip
  open(p.dir);
};
// Menu ⋯ dùng chung (video, mẫu): items = [[nhãn, hàm, nguy hiểm?]]
function moreMenu(anchor, items) {
  document.querySelector(".pmenu")?.remove();
  const m = document.createElement("div");
  m.className = "pmenu"; m.setAttribute("role", "menu");
  const off = (ev) => { if (!m.contains(ev.target)) close(); };
  const close = () => { m.remove(); document.removeEventListener("pointerdown", off, true); };
  for (const [label, run, danger] of items) {
    const b = document.createElement("button");
    b.setAttribute("role", "menuitem"); b.textContent = label; if (danger) b.className = "danger";
    b.onclick = (ev) => { ev.stopPropagation(); close(); run(); };
    m.append(b);
  }
  const r = anchor.getBoundingClientRect();
  m.style.cssText = `position:fixed;top:${Math.min(r.bottom + 4, innerHeight - 44 * items.length - 12)}px;left:${Math.max(8, r.right - 140)}px`;
  document.addEventListener("pointerdown", off, true);
  document.body.append(m); m.querySelector("button").focus();
}
async function deleteProject(p) {
  if (!confirm(`Xoá dự án "${p.title}"?\n\nXoá video, bản xuất và chỉnh sửa của dự án này. Skill, mẫu edit và brand vẫn giữ nguyên. Không hoàn tác được.`)) return;
  const r = await post("/api/delete-project", { dir: p.dir });
  if (!r.ok) return toast(r.error, true);
  toast("Đã xoá dự án.");
  return loadProjects();
}
$("#plist").addEventListener("click",handleProjectClick);
$("#projectsGrid").addEventListener("click",handleProjectClick);
$("#projectsGrid").addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.classList.contains("pitem"))e.target.click();});
$("#plist").addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.classList.contains("pitem")) e.target.click(); });
const setSide = (on) => { document.body.classList.toggle("side-off", !on); try { localStorage.setItem("home.side", on ? "1" : "0"); } catch {} };
$("#sideOff").onclick = () => setSide(false);
$("#sideOn").onclick = () => setSide(true);
try { if (localStorage.getItem("home.side") === "0" || matchMedia("(max-width:760px)").matches) document.body.classList.add("side-off"); } catch {}
$("#main").addEventListener("click", (e) => { if (matchMedia("(max-width:760px)").matches && !document.body.classList.contains("side-off") && !e.target.closest(".open-side")) setSide(false); });

async function open(dir) {
  const r = await post("/api/open", { dir });
  if (!r.ok) return toast(r.error, true);
  location.href = "/";
}

function variantDialog(project){
 const dialog=document.createElement('dialog');dialog.style.cssText='max-width:520px;width:calc(100% - 32px);padding:24px;border-radius:16px;background:#17191f;color:#eee;border:1px solid #555';
 dialog.innerHTML=`<form><h2>Tạo phiên bản</h2><p>${esc(project.title)}</p><label>Tên bản mới <input name="title" maxlength="160" style="width:100%;margin:12px 0" value="${esc(project.title.slice(0,140))} · phiên bản"></label><label>Khung video <select name="format"><option value="9:16">9:16 dọc</option><option value="16:9">16:9 ngang</option></select></label><p>Sao chép tư liệu local sang dự án riêng. Giữ bản gốc và chỉnh từng bản độc lập. Cần kiểm tra lại bố cục sau khi đổi khung.</p><p>Chỉ lấy chỉnh sửa đã lưu. Không tự dựng lại, xuất hoặc đăng.</p><p role="status" style="overflow-wrap:anywhere"></p><div style="display:flex;gap:12px"><button type="submit">Tạo phiên bản</button><button type="button" data-close>Đóng</button><button type="button" data-open hidden>Mở bản mới</button></div></form>`;
 document.body.append(dialog);const form=dialog.querySelector('form'),status=dialog.querySelector('[role=status]'),submit=dialog.querySelector('[type=submit]'),close=dialog.querySelector('[data-close]');
 const batch=document.createElement('button');batch.type='button';batch.textContent='Tạo nhiều bản / Lịch sử lô';batch.onclick=()=>{dialog.close();openVariantBatch({project,onChanged:loadProjects,onOpen:open});};form.append(batch);
 form.elements.format.value=project.format==='16:9'?'9:16':'16:9';
 close.onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();let working=false;
 dialog.oncancel=e=>{if(working)e.preventDefault();};
 form.onsubmit=async event=>{
  event.preventDefault();working=true;submit.disabled=true;close.disabled=true;batch.disabled=true;status.textContent='Đang sao chép tư liệu và dựng preview…';
  try{
   const ws=await api('/api/v1/workspaces');
   const response=await fetch('/api/v1/projects/variant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspaceId:ws.activeId,dir:project.dir,revision:project.revision,format:form.elements.format.value,title:form.elements.title.value})}),result=await response.json();if(!response.ok)throw new Error(result.error);
   status.textContent=`Đã tạo bản riêng · ${result.files} file · ${(result.bytes/1048576).toFixed(1)} MiB. Kiểm tra bố cục trước khi xuất.`;await loadProjects();
   const next=dialog.querySelector('[data-open]');next.hidden=false;next.onclick=()=>open(result.dir);submit.hidden=true;
  }catch(error){status.textContent=error.message;submit.disabled=false;}finally{working=false;close.disabled=false;batch.disabled=false;}
 };dialog.showModal();
}

// ---------- Mẫu edit ----------
async function loadTemplates() {
  let items = [];
  try { const L = await api("/api/library?local=1"); items = Array.isArray(L) ? L : L.items || []; } catch {}
  S.tpls = items = visibleTpls(items);
  if (!S.tpl || !items.some((t) => t.id === S.tpl && t.installed)) S.tpl = items.find((t) => t.installed)?.id || null;
  renderFilters(); renderTemplates(); renderStyleBtn();
  // Local library is immediately usable; online posters/catalog enrich it later.
  api("/api/library").then(L => {
    const remote = Array.isArray(L) ? L : L.items || [];
    if (!remote.length) return;
    S.tpls = visibleTpls(remote); renderFilters(); renderTemplates(); renderStyleBtn();
  }).catch(() => {});
}
// đã cài trên máy thì dùng được; chưa cài + gói thấp hơn mới khoá
const isLocked = (t) => t.locked && !t.installed;
// Gói VIP chưa mở không hiện; VIP đã mở lên đầu (Premium → Pro), còn lại giữ thứ tự thư viện
const TIER_RANK = { premium: 0, pro: 1 };
function visibleTpls(items) { return items.filter((t) => !isLocked(t)).map((t, i) => [t, i]).sort(([a, i], [b, j]) => (TIER_RANK[a.tier] ?? 2) - (TIER_RANK[b.tier] ?? 2) || i - j).map(([t]) => t); }
const LOCK_ICON = '<svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" style="vertical-align:-1px;margin-right:4px"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/></svg>';
const tplPoster = (t) => t.poster || (t.installed ? `/api/template-poster?id=${encodeURIComponent(t.id)}` : "");
const TOP_INDUSTRIES = 8; // hơn 30 ngành cùng lúc làm người mới không biết bấm đâu
function renderFilters() {
  const count = new Map();
  for (const x of S.tpls.flatMap((t) => [...new Set(t.industries || [])])) count.set(x, (count.get(x) || 0) + 1);
  const inds = [...count.keys()].sort((a, b) => count.get(b) - count.get(a) || a.localeCompare(b, "vi"));
  const shown = S.allIndustries ? inds : inds.slice(0, TOP_INDUSTRIES);
  if (!["all", "installed"].includes(S.filter) && !shown.includes(S.filter) && inds.includes(S.filter)) shown.push(S.filter);
  const opts = [["all", "Tất cả"], ["installed", "Đã cài"], ...shown.map((x) => [x, `${x} · ${count.get(x)}`])];
  const more = inds.length > TOP_INDUSTRIES ? `<button class="more" data-more aria-expanded="${!!S.allIndustries}">${S.allIndustries ? "Thu gọn" : `Thêm ${inds.length - TOP_INDUSTRIES} ngành`}</button>` : "";
  $("#fbar").innerHTML = opts.map(([k, l]) => `<button class="${S.filter === k ? "on" : ""}" data-f="${esc(k)}" aria-pressed="${S.filter === k}">${esc(l)}</button>`).join("") + more;
}
$("#fbar").addEventListener("click", (e) => {
  if (e.target.closest("[data-more]")) { S.allIndustries = !S.allIndustries; return renderFilters(); }
  const b = e.target.closest("[data-f]"); if (b) { S.filter = b.dataset.f; renderFilters(); renderTemplates(); }
});
$("#tSearch").addEventListener("input", renderTemplates);
function tplCards(list, sel) {
  const kho = `<button class="tcard kho-pick ${sel === "kho-cua-toi" ? "sel" : ""}" data-id="__kho__" aria-pressed="${sel === "kho-cua-toi"}">
      <div class="tp kho-tp"><svg viewBox="0 0 16 16" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"><path d="M2 5.5L8 2.5l6 3v6L8 14.5l-6-3z"/><path d="M2 5.5l6 3 6-3M8 8.5v6"/></svg>
        <span class="tag free">CỦA TÔI</span><span class="ok">✓</span></div>
      <div class="tb"><b>Kho hiệu ứng của tôi</b><small>AI tự chọn chữ, hiệu ứng, cảnh trám trong kho của bạn để edit.</small></div>
    </button>`;
  return kho + list.filter((t) => t.id !== "kho-cua-toi").map((t) => `
    <button class="tcard ${t.id === sel ? "sel" : ""}" data-id="${esc(t.id)}" aria-pressed="${t.id === sel}">
      <div class="tp" style="${tplPoster(t) ? `background-image:url('${esc(tplPoster(t))}')` : ""}">
        ${t.preview ? `<video muted loop playsinline preload="none" src="${esc(t.preview)}"></video>` : ""}
        ${t.installed ? `<span class="tmore" role="button" tabindex="0" aria-haspopup="menu" title="Đổi tên, xoá" aria-label="Thêm thao tác cho mẫu ${esc(t.name)}">⋯</span>` : ""}
        <span class="tag ${isLocked(t) ? "lock" : t.tier === "free" ? "free" : ""}">${isLocked(t) ? LOCK_ICON : ""}${esc(({ free: "BASIC", pro: "PRO", premium: "PREMIUM" })[t.tier || "free"] || String(t.tier).toUpperCase())}${!t.installed && !isLocked(t) ? " · tải" : ""}</span><span class="ok">✓</span>
      </div>
      <div class="tb"><b>${esc(t.name)}</b><small>${esc(t.description || "")}</small></div>
    </button>`).join("");
}
function renderTemplates() {
  const q = $("#tSearch").value.trim().toLowerCase();
  const list = S.tpls.filter((t) => (S.filter === "all" || (S.filter === "installed" ? t.installed : (t.industries || []).includes(S.filter)))
    && (!q || `${t.name} ${t.description} ${(t.tags || []).join(" ")}`.toLowerCase().includes(q)));
  $("#tgrid").innerHTML = list.length ? tplCards(list, S.tpl) : `<div class="empty">Không có mẫu phù hợp.</div>`;
  const details=$('#libraryTemplateDetails');if(details){details.replaceChildren();if(S.tpl&&S.tpls.some(t=>t.id===S.tpl&&t.installed))details.append(templateDetailsPanel(S.tpl));}
}
// Rê chuột lên mẫu: phát video xem trước (không tiếng)
document.addEventListener("mouseover", (e) => { const v = e.target.closest(".tcard")?.querySelector("video"); if (v && v.paused) v.play().catch(() => {}); });
document.addEventListener("mouseout", (e) => { const c = e.target.closest(".tcard"); if (c && !c.contains(e.relatedTarget)) { const v = c.querySelector("video"); if (v) { v.pause(); v.currentTime = 0; } } });
async function chooseTemplate(id) {
  if (id === "__kho__") { const ok = await useWholeKho(); if (ok) { renderTemplates(); renderStyleBtn(); } return ok; }
  const t = S.tpls.find((x) => x.id === id);
  if (!t) return false;
  if (isLocked(t)) {
    const dialog=document.createElement('dialog');dialog.style.cssText='max-width:760px;width:90vw;max-height:90vh;overflow:auto;background:#141416;color:#fff;border:1px solid #444;border-radius:16px;padding:24px';
    const title=document.createElement('h2');title.textContent=t.name;dialog.append(title);
    if(t.preview){const video=document.createElement('video');video.src=t.preview;video.controls=true;video.playsInline=true;video.preload='metadata';video.style.cssText='width:100%;max-height:50vh;object-fit:contain';dialog.append(video);}else if(tplPoster(t)){const img=document.createElement('img');img.src=tplPoster(t);img.alt=t.name;img.style.cssText='width:100%;max-height:50vh;object-fit:contain';dialog.append(img);}
    const description=document.createElement('p');description.textContent=t.description||'Chưa có mô tả mẫu.';const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Đang xem mẫu thư viện VEK · Chưa cài trên máy. Tải và áp mẫu cần quyền '+String(t.tier||'pro').toUpperCase()+' của nhà cung cấp; xem trước không thay mẫu đang chọn.';
    const apply=document.createElement('button');apply.className='primary';apply.textContent='Áp mẫu · Chưa có quyền tải';apply.disabled=true;const close=document.createElement('button');close.className='outline';close.textContent='Đóng';close.onclick=()=>dialog.close();dialog.append(description,status,apply,close);dialog.addEventListener('close',()=>{dialog.querySelector('video')?.pause();dialog.remove();},{once:true});document.body.append(dialog);dialog.showModal();return false;
  }
  if (!t.installed) {
    toast("Đang tải mẫu…");
    const r = await api(`/api/library/install?id=${encodeURIComponent(id)}`, { method: "POST" });
    if (!r.ok) { toast(r.error || "Không tải được mẫu.", true); return false; }
    S.tpls = r.items || S.tpls;
    toast("Đã tải mẫu.");
  }
  S.tpl = id;
  try { localStorage.setItem("home.tpl", id); } catch {}
  renderTemplates(); renderStyleBtn();
  return true;
}
$("#tgrid").addEventListener("click", (e) => {
  const c = e.target.closest(".tcard"); if (!c) return;
  const more = e.target.closest(".tmore");
  if (!more) return chooseTemplate(c.dataset.id);
  e.preventDefault(); e.stopPropagation();
  const t = S.tpls.find((x) => x.id === c.dataset.id); if (!t) return;
  const mine = t.source === "custom"; // mẫu tự tạo: xoá hẳn; mẫu thư viện: chỉ gỡ bản cài, tải lại được
  const remove = async () => {
    if (!confirm(mine ? `Xoá mẫu "${t.name}"?\n\nXoá hẳn khỏi máy, không hoàn tác được. Video đã dựng bằng mẫu này không bị ảnh hưởng.` : `Gỡ mẫu "${t.name}" khỏi máy?\n\nVẫn tải lại được từ thư viện.`)) return;
    const r = await api(`/api/library/install?id=${encodeURIComponent(t.id)}`, { method: "DELETE" });
    if (!r.ok) return toast(r.error || "Không xoá được mẫu.", true);
    if (S.tpl === t.id) S.tpl = null;
    toast(mine ? "Đã xoá mẫu." : "Đã gỡ mẫu."); loadTemplates();
  };
  moreMenu(more, mine ? [
    ["Đổi tên", async () => {
      const name = prompt("Tên mới cho mẫu:", t.name);
      if (name == null || !name.trim() || name.trim() === t.name) return;
      const r = await post("/api/templates/rename", { id: t.id, name: name.trim() });
      if (!r.ok) return toast(r.error, true);
      toast("Đã đổi tên mẫu."); loadTemplates();
    }],
    ["Xoá", remove, true],
  ] : [["Gỡ khỏi máy", remove, true]]);
});
$("#tgrid").addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("tmore")) { e.preventDefault(); e.target.click(); } });
function renderStyleBtn() {
  const t = S.tpls.find((x) => x.id === S.tpl);
  $("#styleName").textContent = t ? t.name : "Chọn mẫu";
  $("#styleDot").style.backgroundImage = t && tplPoster(t) ? `url('${tplPoster(t)}')` : "";
  $("#styleDot").hidden = !t;
}
$("#styleBtn").onclick = () => {restoreHomeTemplateShelf();$("#homeTemplateShelf").scrollIntoView({behavior:"smooth",block:"start"});};

// ---------- Trang chủ: thả video ----------
function renderPending() {
  $("#pending").innerHTML = S.pending.map((f) => `<span>${{ video: "🎬", image: "🖼", audio: "♪" }[kindOf(f)]} ${esc(f.name)}</span>`).join("");
}
$("#clip").onclick = () => $("#clipFile").click();
$("#clipFile").onchange = (e) => { S.pending.push(...e.target.files); e.target.value = ""; renderPending(); toast(`${S.pending.length} tư liệu — thêm video chính để tiếp tục`); };
$("#homeGo").onclick = () => {
 if(homeSourceSnapshot?.text===$('#homeNote').value&&!$('#homePrimarySource').hidden)return $('#homeCreateFromSources').click();
 toast(homeSourceBusy?'Đang kiểm tra nguồn, đợi một chút nhé.':S.mode === "clips" ? "Thêm video dài trước nhé." : "Thêm video hoặc dán đường dẫn nguồn nhé.");
};
let homeSourceVersion=0,homeSourceSnapshot=null,homeAdditionalVideos=[],homeSourceTimer,homeSourceBusy=false,homeSourceQueued=false;
$('#homeNote').addEventListener('input',()=>{homeSourceVersion++;homeSourceSnapshot=null;$('#homeSourceCards').replaceChildren();$('#homePrimarySource').hidden=true;$('#homeSourceStatus').textContent='';clearTimeout(homeSourceTimer);homeSourceQueued=false;
 if(/(?:[a-z]:[\\/]|\\\\[^\\\s]+\\)/i.test($('#homeNote').value)){ $('#homeSourceStatus').textContent='Đã thấy đường dẫn · sẽ tự kiểm tra khi bạn ngừng gõ…';homeSourceTimer=setTimeout(()=>inspectHomeSources(),900); }
});
async function inspectHomeSources(){
 if(homeSourceBusy){homeSourceQueued=true;return;}homeSourceBusy=true;homeSourceQueued=false;
 homeInfoVersion++;$('#homeSourceInfoStatus').textContent='';clearHomePreview();
 const text=$('#homeNote').value,version=++homeSourceVersion,button=$('#homeInspectSources');button.disabled=true;$('#homeSourceStatus').textContent='Đang kiểm tra nguồn…';
 try{
  const state=await api('/api/v1/workspaces'),workspaceId=state.activeId;
  const response=await fetch('/api/v1/sources/inspect-home',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,workspaceId})}),data=await response.json();if(!response.ok)throw new Error(data.error);if(version!==homeSourceVersion)return;
  homeSourceSnapshot={text,workspaceId};$('#homeSourceCards').innerHTML=data.sources.map(source=>`<div style="padding:8px;overflow-wrap:anywhere"><b>${source.role==='aroll'?'A-roll':source.role==='broll'?'B-roll':'Nguồn'}</b><p>${esc(source.path)}</p><small>${esc(source.status==='ready'?source.files.length+' media đã thấy'+(source.recursive?' · gồm thư mục con':' · trong thư mục này'):source.error)}</small></div>`).join('');
  const files=data.sources.flatMap(source=>source.status==='ready'?source.files.filter(f=>/\.(mp4|mov|m4v|webm)$/i.test(f.path)).map(file=>({...file,role:source.role})):[]).sort((a,b)=>(a.role==='aroll'?0:1)-(b.role==='aroll'?0:1));
  const shortName=value=>value.split(/[\\/]/).filter(Boolean).at(-1)||value;
  $('#homeSourceVideo').innerHTML=files.map(file=>`<option value="${esc(file.path)}" title="${esc(file.path)}">${esc(shortName(file.path)+(file.role==='broll'?' · B-roll':''))}</option>`).join('');
  homeAdditionalVideos=[];
  const uniqueFiles=[...new Map(files.map(file=>[file.path,file])).values()];
  $('#homeAdditionalVideoRows').innerHTML=uniqueFiles.map(file=>`<label style="display:block;overflow-wrap:anywhere" title="${esc(file.path)}"><input type="checkbox" data-extra-video="${esc(file.path)}">${esc(shortName(file.path))}</label>`).join('');
  const updateAdditional=()=>{homeAdditionalVideos=homeAdditionalVideos.filter(value=>value!==$('#homeSourceVideo').value);$('#homeAdditionalVideoRows').querySelectorAll('input').forEach(input=>{input.disabled=input.dataset.extraVideo===$('#homeSourceVideo').value;input.checked=homeAdditionalVideos.includes(input.dataset.extraVideo);});$('#homeAdditionalVideoOrder').textContent=[$('#homeSourceVideo').value,...homeAdditionalVideos].filter(Boolean).map((value,index)=>(index+1)+'. '+shortName(value)).join(' → ');};
  $('#homeAdditionalVideoRows').onchange=event=>{const input=event.target,value=input.dataset.extraVideo;if(!value)return;if(input.checked){if(homeAdditionalVideos.length>=19){input.checked=false;return toast('Tối đa20video gồm video chính.',true);}homeAdditionalVideos.push(value);}else homeAdditionalVideos=homeAdditionalVideos.filter(v=>v!==value);updateAdditional();};
  $('#homeSourceVideo').onchange=()=>{clearHomeInfo();updateAdditional();};
  updateAdditional();
  const ready=files.length&&!data.sources.some(source=>source.status==='error');$('#homePrimarySource').hidden=!ready;
  const mainFiles=uniqueFiles.filter(file=>file.role!=='broll'),needsChoice=(mainFiles.length||uniqueFiles.length)>1;
  $('#homeSourceDetails').open=!ready||needsChoice;
  $('#homeExtraSources').hidden=uniqueFiles.length<=1;
  const emptyBroll=data.sources.some(source=>source.role==='broll'&&source.status==='ready'&&!source.files.length);
  $('#homeSourceStatus').textContent=ready?`${data.sources.length} nguồn · ${uniqueFiles.length} video${needsChoice?' · Chọn video chính trong tùy chọn.':' · Sẵn sàng, bấm AI edit để tiếp tục.'}${emptyBroll?' B-roll chưa thấy media trực tiếp; xem lại thư mục.':''}`:data.sources.length?'Chưa sẵn sàng — kiểm tra nguồn bên dưới.':'Dán đường dẫn nguồn vào lời giao việc.';
 }catch(error){if(version===homeSourceVersion)$('#homeSourceStatus').textContent=error.message;}finally{button.disabled=false;homeSourceBusy=false;if(homeSourceQueued){homeSourceQueued=false;clearTimeout(homeSourceTimer);homeSourceTimer=setTimeout(()=>inspectHomeSources(),100);}}
}
$('#homeInspectSources').onclick=()=>{clearTimeout(homeSourceTimer);inspectHomeSources();};
$('#homeSeparateProjects').onclick=()=>{
 const snapshot=homeSourceSnapshot;if(!snapshot||snapshot.text!==$('#homeNote').value)return toast('Kiểm tra lại nguồn trước khi tạo lô.',true);
 if(S.mode==='clips')return toast('Chuyển sang Edit video để tạo nhiều dự án.',true);
 const paths=[$('#homeSourceVideo').value,...homeAdditionalVideos].filter(Boolean);if(paths.length<2)return toast('Chọn thêm video trong phần A-roll tiếp theo.',true);
 openIntakeBatch({snapshot,paths,selectedTemplate:S.tpl,format:document.querySelector('input[name=fmt]:checked')?.value||'9:16',onChanged:loadProjects,onSetup:dir=>setupView(dir,{note:snapshot.text})});
};
$('#homeCreateFromSources').onclick=async()=>{
 const snapshot=homeSourceSnapshot;if(!snapshot||snapshot.text!==$('#homeNote').value)return toast('Kiểm tra lại nguồn trước khi tạo dự án.',true);
 if(S.mode==='clips'&&homeAdditionalVideos.length)return toast('Cắt clip ngắn dùng một video dài. Chuyển sang Edit video để nối nhiều A-roll.',true);
 const button=$('#homeCreateFromSources'),selected=$('#homeSourceVideo').value;if(button.disabled)return;button.disabled=true;$('#homeGo').disabled=true;$('#homeSourceStatus').textContent='Đang sao chép các video đã chọn và kiểm tra…';
 try{
  const response=await fetch('/api/v1/storage/new-project',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...snapshot,selected,additionalVideos:[...homeAdditionalVideos],previewManifest:homePreviewManifest,format:document.querySelector('input[name=fmt]:checked')?.value||''})}),result=await response.json();if(!response.ok)throw new Error(result.error);
  await loadProjects();if(S.mode==='clips')clipSetupView(result.dir,{note:snapshot.text});else setupView(result.dir,{note:snapshot.text,files:S.pending.splice(0)});
 }catch(error){$('#homeSourceStatus').textContent=error.message;$('#homeSourceDetails').open=true;}finally{button.disabled=false;$('#homeGo').disabled=false;}
};
let homeInfoVersion=0;
const clearHomeInfo=()=>{homeInfoVersion++;$('#homeSourceInfoStatus').textContent='';};
$('#homeSourceVideo').onchange=clearHomeInfo;$('#homeNote').addEventListener('input',clearHomeInfo);
$('#homeSourceInfo').onclick=async()=>{
 const snapshot=homeSourceSnapshot,selected=$('#homeSourceVideo').value;if(!snapshot||snapshot.text!==$('#homeNote').value)return;
 const version=++homeInfoVersion,button=$('#homeSourceInfo');button.disabled=true;$('#homeSourceInfoStatus').textContent='Đang đọc thông tin video…';
 try{const r=await fetch('/api/v1/sources/media-info',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...snapshot,selected})}),data=await r.json();if(!r.ok)throw new Error(data.error);if(version!==homeInfoVersion)return;const m=data.media;$('#homeSourceInfoStatus').textContent=`${m.duration.toFixed(2)} giây · ${m.displayWidth}×${m.displayHeight} · ${m.codec||''} · ${m.hasAudio?'có âm thanh':'không có âm thanh'} · ${(m.bytes/1048576).toFixed(1)} MiB`;}
 catch(error){if(version===homeInfoVersion)$('#homeSourceInfoStatus').textContent=error.message;}finally{button.disabled=false;}
};
let homePreviewVersion=0,homePreviewManifest=null;
function clearHomePreview(){homePreviewVersion++;homePreviewManifest=null;$('#homeSourcePreviewFrames').replaceChildren();$('#homeSourcePreviewStatus').textContent='';}
$('#homeSourceVideo').addEventListener('change',clearHomePreview);$('#homeNote').addEventListener('input',clearHomePreview);
$('#homeSourcePreview').onclick=async()=>{
 const snapshot=homeSourceSnapshot,selected=$('#homeSourceVideo').value;if(!snapshot||snapshot.text!==$('#homeNote').value)return;
 homePreviewManifest=null;
 const version=++homePreviewVersion,button=$('#homeSourcePreview');button.disabled=true;$('#homeSourcePreviewStatus').textContent='Đang lấy 6 ảnh cách đều trong video…';
 try{const r=await fetch('/api/v1/sources/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...snapshot,selected})}),result=await r.json();if(!r.ok)throw new Error(result.error);if(version!==homePreviewVersion)return;
  homePreviewManifest=result.manifestPath;
  $('#homeSourcePreviewFrames').replaceChildren(...result.frames.map(frame=>{const figure=document.createElement('figure');figure.style.margin='0';const img=document.createElement('img');img.src=frame.dataUrl;img.alt='Khung hình tại '+frame.time.toFixed(2)+' giây';img.style.cssText='width:100%;max-height:180px;object-fit:contain';const caption=document.createElement('figcaption');caption.textContent=frame.time.toFixed(2)+' giây';figure.append(img,caption);return figure;}));
  $('#homeSourcePreviewStatus').textContent='6 ảnh lấy mẫu theo thời gian · đã lưu trên máy.';
 }catch(error){if(version===homePreviewVersion)$('#homeSourcePreviewStatus').textContent=error.message;}finally{button.disabled=false;}
};
function sendFile(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => { let r = {}; try { r = JSON.parse(xhr.responseText); } catch {} r.ok ? resolve(r) : reject(new Error(r.error || `Không tải được file (mã lỗi ${xhr.status}).`)); };
    // mất kết nối giữa chừng: phần mềm phía sau đã tắt / bị chặn (hay gặp khi Codex bật phần mềm trong hộp cát)
    xhr.onerror = () => reject(new Error("Mất kết nối tới phần mềm khi đang tải file — phần mềm phía sau đã tắt hoặc bị chặn. Bấm đúp Mo-Editor.bat (Mac: Mo-Editor.command) để mở lại, tải lại trang rồi thử lại. Dùng Codex: nhờ Codex mở phần mềm với quyền ngoài hộp cát."));
    xhr.send(file);
  });
}
// ---------- Chế độ màn hình chính: Edit video (1 video → 1 video edit) · Cắt clip ngắn (1 video dài → nhiều clip) ----------
const MODES = {
  edit: { t: "Chào mừng đến ContentOS", p: "Thêm video quay thô và chọn một mẫu edit — AI dựng xong, bạn chỉnh tay.",
    dt: "Thêm video hoặc giọng đọc", ds: "Kéo thả video quay thô, hoặc chỉ file giọng đọc (mp3, m4a, wav…) cho mẫu không lộ mặt — AI tự nhận lời và chọn cảnh", note: "Bạn muốn edit video thế nào? (không bắt buộc) — ví dụ: giữ đoạn mở đầu, nhấn mạnh 3 bước…", go: "AI edit" },
  clips: { t: "Một video dài → nhiều clip ngắn", p: "Livestream, podcast, webinar… AI tìm đoạn hay nhất, cắt thành clip TikTok / Reels / Shorts kèm caption từng nền tảng.",
    dt: "Thêm video dài", ds: "Kéo thả livestream, podcast, webinar vào đây (mp4, mov…) — dài bao nhiêu cũng được", note: "Muốn lấy đoạn nào? (không bắt buộc) — ví dụ: các đoạn nói về giá, mẹo chăm da, câu chuyện khách hàng…", go: "Cắt clip" },
};
try { S.mode = localStorage.getItem("home.mode") === "clips" ? "clips" : "edit"; } catch { S.mode = "edit"; }
function applyMode() {
  const m = MODES[S.mode];
  $("#heroT").textContent = m.t; $("#heroP").textContent = m.p; $("#dropT").textContent = m.dt; $("#dropS").textContent = m.ds;
  $("#homeNote").placeholder = m.note;
  $("#homeGo").innerHTML = `${m.go} <span aria-hidden="true">→</span>`;
  document.querySelectorAll(".mode-sw [data-mode]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.mode === S.mode)));
  document.querySelector(".composer .fmt").hidden = S.mode === "clips"; // khung chọn ở bước thiết lập cắt clip
  $("#clip").hidden = S.mode === "clips";
}
document.querySelectorAll(".mode-sw [data-mode]").forEach((b) => (b.onclick = () => {
  S.mode = b.dataset.mode;
  try { localStorage.setItem("home.mode", S.mode); } catch {}
  applyMode();
}));
applyMode();

// Thiết lập cắt clip: số clip · thời lượng (người dùng nhập số giây) · khung · edit từng clip theo mẫu · ghi chú
function clipSetupView(dir, { note = "" } = {}) {
  const p = S.projects.find((x) => x.dir === dir) || { title: dir.split("/").pop(), duration: 0 };
  const st = { count: "auto", sec: 45, formats: ["9:16"], editEach: false, fx: "vua" };
  show("vSetup");
  const v = $("#vSetup"), tpl = () => S.tpls.find((x) => x.id === S.tpl);
  const mins = p.duration ? Math.round(p.duration / 60) : 0;
  const radios = (name, list, cur) => `<div class="fxl" role="radiogroup">${list.map(([k, l]) => `<label><input type="radio" name="${name}" value="${k}" ${k === cur ? "checked" : ""}><span>${l}</span></label>`).join("")}</div>`;
  const row = (small, b, p2, ctl, id = "") => `<div class="row"><div class="lab"><small>${small}</small><b ${id ? `id="${id}"` : ""}>${b}</b>${p2 ? `<p>${p2}</p>` : ""}</div>${ctl}</div>`;
  const autoN = () => Math.max(1, Math.min(10, Math.round((p.duration || 600) / Math.max(120, st.sec * 4))));
  v.innerHTML = `
    <h2>Thiết lập cắt clip ngắn</h2>
    <div class="box"><div class="row"><div class="vth" style="background-image:url('/api/project-poster?dir=${encodeURIComponent(dir)}')"></div>
      <div class="lab"><small>Video dài</small><b>${p.duration ? (mins ? mins + " phút" : Math.round(p.duration) + " giây") : esc(p.title)}</b><p>${esc(p.title)} — AI đọc lời nói toàn video để chọn đoạn hay.</p></div></div></div>
    <div class="box">
      ${row("Số clip", "Bao nhiêu clip?", "", radios("ccount", [["auto", "Tự động"], ["3", "3"], ["5", "5"], ["10", "10"]], st.count), "")}
      <p class="cl-hint" id="cCountH"></p>
      ${row("Thời lượng mỗi clip", "Mỗi clip dài khoảng", "Gõ số giây bạn muốn — AI cắt quanh con số này, lệch ±25% để không cắt giữa ý.",
        `<div class="cl-sec"><div class="cl-in"><input type="number" id="cSec" min="10" max="180" step="5" value="${st.sec}" aria-label="Số giây mỗi clip"><span>giây</span></div>
          <div class="cl-qs">${[20, 30, 45, 60, 90].map((n) => `<button type="button" data-sec="${n}">${n}s</button>`).join("")}</div></div>`)}
      <p class="cl-hint" id="cSecH"></p>
      ${row("Khung", "Đăng lên", "", `<div class="fxl" role="group"><label><input type="checkbox" name="cfmt" value="9:16" checked><span>9:16 dọc</span></label><label><input type="checkbox" name="cfmt" value="16:9"><span>16:9 ngang</span></label></div>`, "")}
      <p class="cl-hint">9:16 cho TikTok, Reels, Shorts · 16:9 cho YouTube, Facebook ngang. Chọn cả hai = mỗi clip ra 2 bản.</p>
    </div>
    <div class="box">${row("Edit từng clip theo mẫu", "AI edit mỗi clip như video thường", "Bật: chữ, hiệu ứng, zoom theo mẫu (AI làm lần lượt từng clip, lâu hơn). Tắt: chỉ cắt + phụ đề + bỏ khoảng lặng.",
      `<label class="sw"><input type="checkbox" id="cEdit" aria-label="Edit từng clip theo mẫu"><i></i></label>`)}
      <div id="cTpl" hidden></div></div>
    <div class="box"><textarea class="note" id="cNote" placeholder="${esc(MODES.clips.note)}">${esc(note)}</textarea></div>
    <div class="foot"><button class="ghost" id="cBack">Huỷ</button><span class="muted" id="cSum"></span><button class="primary go" id="cGo">Cắt clip <span aria-hidden="true">→</span></button></div>`;
  const sum = () => {
    const n = st.count === "auto" ? `~${autoN()}` : st.count;
    $("#cCountH").textContent = st.count === "auto" ? `AI lấy mọi đoạn thật sự hay — video này khoảng ${autoN()} clip (tối đa 10).` : `AI chọn ${st.count} đoạn hay nhất.`;
    $("#cSum").textContent = `${n} clip ~${st.sec}s × ${st.formats.length} khung${st.editEach ? " · edit theo mẫu" : ""}`;
  };
  const drawTpl = () => {
    const t = tpl(), box = $("#cTpl");
    box.hidden = !st.editEach;
    box.innerHTML = `<div class="row"><div class="vth" style="${t && tplPoster(t) ? `background-image:url('${esc(tplPoster(t))}')` : ""}"></div>
      <div class="lab"><small>Mẫu</small><b>${t ? esc(t.name) : "Chưa chọn mẫu"}</b><p>${t ? esc(t.description || "") : "Chọn mẫu để AI edit từng clip."}</p></div>
      <button class="pen" id="cTplEdit" title="Đổi mẫu" aria-label="Đổi mẫu"><svg viewBox="0 0 16 16" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M11 2.5l2.5 2.5L6 12.5 3 13l.5-3z"/></svg></button></div>
      ${row("Mức độ hiệu ứng", "Vừa hoặc nhiều", "", radios("cfx", [["vua", "Vừa"], ["nhieu", "Nhiều"]], st.fx))}`;
    $("#cTplEdit").onclick = () => pickTemplateModal(drawTpl);
    v.querySelectorAll("input[name=cfx]").forEach((r) => (r.onchange = () => (st.fx = r.value)));
  };
  v.querySelectorAll("input[name=ccount]").forEach((r) => (r.onchange = () => { st.count = r.value; sum(); }));
  const secIn = $("#cSec");
  const setSec = (n) => {
    st.sec = Math.max(10, Math.min(180, Math.round(Number(n) || 45)));
    v.querySelectorAll("[data-sec]").forEach((b) => b.classList.toggle("on", Number(b.dataset.sec) === st.sec));
    const lo = Math.max(8, Math.round(st.sec * 0.75)), hi = Math.round(st.sec * 1.25);
    $("#cSecH").textContent = `Mỗi clip khoảng ${lo}–${hi} giây${st.sec <= 35 ? " · hợp TikTok / Reels lướt nhanh" : st.sec <= 65 ? " · hợp TikTok, Reels, Shorts" : " · hợp Facebook, YouTube (Shorts tối đa 3 phút)"}.`;
    sum();
  };
  secIn.oninput = () => setSec(secIn.value);
  secIn.onblur = () => { secIn.value = st.sec; };
  v.querySelectorAll("[data-sec]").forEach((b) => (b.onclick = () => { secIn.value = b.dataset.sec; setSec(b.dataset.sec); }));
  v.querySelectorAll("input[name=cfmt]").forEach((c) => (c.onchange = () => {
    st.formats = [...v.querySelectorAll("input[name=cfmt]:checked")].map((x) => x.value);
    if (!st.formats.length) { c.checked = true; st.formats = [c.value]; }
    sum();
  }));
  $("#cEdit").onchange = (e) => { st.editEach = e.target.checked; drawTpl(); sum(); };
  $("#cBack").onclick = () => show("vHome");
  $("#cGo").onclick = async () => {
    if (st.editEach && !tpl()?.installed) return pickTemplateModal(drawTpl);
    $("#cGo").disabled = true;
    const j = await post("/api/ai-job", { kind: "clips", dir, count: st.count, sec: st.sec, formats: st.formats, editEach: st.editEach, template: st.editEach ? S.tpl : null, fx: st.fx, note: $("#cNote").value });
    if (!j.ok) { $("#cGo").disabled = false; return toast(j.error, true); }
    loadProjects();
    waitAi(dir);
  };
  drawTpl(); setSec(st.sec);
}

// Kết quả cắt clip: thẻ từng clip (ảnh, tiêu đề, điểm, độ dài, hook, caption từng nền tảng) · Mở chỉnh / copy caption
async function showClips(dir) {
  let r;
  try { r = await api(`/api/clips?dir=${encodeURIComponent(dir)}`); } catch {}
  if (!r?.ok) return toast("Chưa có clip nào.", true);
  const PL = [["tiktok", "TikTok"], ["reels", "Reels"], ["shorts", "Shorts"], ["facebook", "Facebook"], ["youtube", "YouTube"]];
  const aiTxt = (a) => (a === "waiting" ? "Chờ AI edit theo mẫu" : a === "working" ? "AI đang edit…" : a === "done" ? "Đã edit theo mẫu" : a === "error" ? "Edit lỗi" : "");
  aim.classList.add("show");
  box.innerHTML = `<div class="clips"><div class="cl-h"><div><h3 id="aimT">✂ ${r.items.length} clip từ “${esc(r.title)}”</h3>
      <p class="sub">Mỗi clip là một dự án riêng (có trong “Video của bạn”). Mở để chỉnh, rồi Xuất video và Đăng tự động như thường.</p></div></div>
    <div class="cl-grid">${r.items.map((c, i) => `<div class="cl-card">
      <div class="cl-th ${c.format === "16:9" ? "wide" : ""}" style="background-image:url('/api/project-poster?dir=${encodeURIComponent(c.dir)}')">
        <span class="cl-k">#${c.k}</span>${c.score != null ? `<span class="cl-sc" title="${esc(c.reason)}">★ ${c.score}/10</span>` : ""}<span class="cl-d">${Math.round(c.dur)}s · ${c.format}</span></div>
      <div class="cl-b"><b>${esc(c.title || "Clip " + c.k)}</b>${c.hook ? `<q>${esc(c.hook)}</q>` : ""}
        ${aiTxt(c.ai) ? `<span class="cl-ai ${c.ai}">${aiTxt(c.ai)}</span>` : ""}
        <div class="cl-cap">${PL.filter(([k]) => c.captions[k]).map(([k, l]) => `<button class="chip-btn" data-cap="${i}" data-k="${k}">⧉ ${l}</button>`).join("")}</div>
        <button class="primary small cl-open" data-open="${esc(c.dir)}"${c.exists ? "" : " disabled"}>Mở chỉnh →</button></div></div>`).join("")}</div>
    <div class="mfoot"><span></span><button class="outline" id="clClose">Đóng</button></div></div>`;
  box.querySelectorAll("[data-open]").forEach((b) => (b.onclick = () => open(b.dataset.open)));
  box.querySelectorAll("[data-cap]").forEach((b) => (b.onclick = async () => {
    const t = r.items[b.dataset.cap].captions[b.dataset.k];
    try { await navigator.clipboard.writeText(t); toast(`Đã copy caption ${b.textContent.replace("⧉ ", "")}`); } catch { toast(t); }
  }));
  $("#clClose").onclick = closeAim;
}

async function startWithVideo(file) {
  const voice = !isVideo(file) && isVoice(file);
  if (!isVideo(file) && !voice) return toast("Chỉ nhận video hoặc file giọng đọc (mp3, m4a, wav…) — ảnh thêm ở nút đính kèm.", true);
  if (voice && S.mode === "clips") return toast("Cắt clip ngắn cần video dài, không dùng file giọng đọc.", true);
  try {
    const d = await api("/api/dung-luong?quick=1"), need = file.size * 2 + 1073741824;
    if (d.free && d.free < need) {
      const { size } = await import("/ui/dung-luong.js");
      toast(`Ổ đĩa không đủ chỗ: video này cần khoảng ${size(need)}, máy còn ${size(d.free)}. Mở "Dọn dung lượng" để xoá bớt.`, true);
      return openDungLuong();
    }
  } catch {}
  $("#prog").classList.add("show");
  try {
    const fmt = document.querySelector("input[name=fmt]:checked")?.value || ""; // trống = tự nhận theo chiều video
    const r = await sendFile(`/api/new-project?file=${encodeURIComponent(file.name)}${fmt ? `&format=${encodeURIComponent(fmt)}` : ""}`, file, (p) => {
      $("#progBar").style.width = p + "%";
      $("#progTxt").textContent = p < 100 ? `Đang chép ${voice ? "giọng đọc" : "video"}… ${p}%` : voice ? "Đang tạo nền cho giọng đọc…" : "Đang đọc video…";
    });
    $("#prog").classList.remove("show");
    await loadProjects();
    if (S.mode === "clips") clipSetupView(r.dir, { note: $("#homeNote").value });
    else setupView(r.dir, { note: $("#homeNote").value, files: S.pending.splice(0), voice });
    renderPending();
  } catch (e) { $("#prog").classList.remove("show"); toast(e.message, true); if (/Ổ đĩa/.test(e.message)) openDungLuong(); }
}
$("#file").onchange = (e) => e.target.files[0] && startWithVideo(e.target.files[0]);
const drop = $("#drop");
["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", (e) => {
  const files = [...e.dataTransfer.files], vid = files.find(isVideo) || (S.mode !== "clips" ? files.find(isVoice) : null);
  S.pending.push(...files.filter((f) => f !== vid));
  if (vid) startWithVideo(vid); else { renderPending(); toast("Thêm video quay thô hoặc file giọng đọc nữa nhé."); }
});
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => e.preventDefault());

// ---------- Bước 2: thiết lập rồi "AI edit" ----------
let homeNavigation;
function show(view) {
  if(view==='vHome')restoreHomeTemplateShelf();
  if(view!=="vMobile") import("/ui/contentos-mobile.js").then(m=>m.leaveMobile());
  $("#navSourceLibrary").classList.toggle("on", view === "vSourceLibrary");
  $("#navContentOS").classList.toggle("on", view === "vContentOS");
  for (const v of ["vActivity", "vLibrary", "vSkills", "vConnections", "vProjects", "vSources", "vMobile", "vSourceLibrary", "vContentOS", "vHome", "vSetup", "vAdmin", "vKho", "vSocial", "vPhanTich", "vTichHop", "vGiong", "vKetNoi", "vDungLuong"]) $("#" + v).hidden = v !== view;
  $("#navHome").classList.toggle("on", !["vSkills", "vSources", "vMobile", "vSourceLibrary", "vContentOS", "vAdmin", "vKho", "vSocial", "vPhanTich", "vTichHop", "vGiong", "vKetNoi", "vDungLuong"].includes(view));
  $("#navGiong").classList.toggle("on", view === "vGiong");
  $("#navKetNoi").classList.toggle("on", view === "vKetNoi");
  $("#navTichHop").classList.toggle("on", view === "vTichHop");
  $("#navPhanTich").classList.toggle("on", view === "vPhanTich");
  $("#navSocial").classList.toggle("on", view === "vSocial");
  $("#navKho").classList.toggle("on", view === "vKho");
  $("#navAdmin").classList.toggle("on", view === "vAdmin");
  homeNavigation?.sync(view);
  $("#main").scrollTop = 0;
}
$("#navHome").onclick = () => show("vHome");

function setupView(dir, { note = "", files = [], voice = false } = {}) {
  const p = S.projects.find((x) => x.dir === dir) || { title: dir.split("/").pop(), duration: 0 };
  const st = (S.setup = { dir, trim: true, fx: "vua", sfx: "nhieu", stock: "tat", note, items: [] });
  show("vSetup");
  const v = $("#vSetup");
  const tpl = () => S.tpls.find((x) => x.id === S.tpl);
  const ICON = {
    vid: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1.5" y="3" width="10" height="10" rx="2"/><path d="M11.5 7l3-2v6l-3-2"/></svg>',
    cut: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="4.5" cy="4.5" r="2"/><circle cx="4.5" cy="11.5" r="2"/><path d="M6.2 5.6L14 12M6.2 10.4L14 4"/></svg>',
    sty: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="2" y="2" width="12" height="12" rx="3"/><path d="M8 4.8l.9 2.3 2.3.9-2.3.9L8 11.2l-.9-2.3-2.3-.9 2.3-.9z"/></svg>',
    med: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="1.5" y="1.5" width="10" height="10" rx="2"/><path d="M4 9l2-2.5 2 2 1-1M14.5 5v9.5H5"/></svg>',
    note: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M3 2.5h10v8l-3 3H3z"/><path d="M5.5 6h5M5.5 8.5h3"/></svg>',
    ai: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="1.5" y="3" width="13" height="10" rx="2"/><path d="M8 5.5l.8 1.7 1.7.8-1.7.8L8 10.5l-.8-1.7-1.7-.8 1.7-.8z"/></svg>',
  };
  const step = (icon, title, body) => `<div class="step"><div class="rail"><i>${ICON[icon]||ICON.ai}</i><span></span></div><div><h4>${title}</h4>${body}</div></div>`;
  v.innerHTML = `
    <h2>Thiết lập trước khi AI edit</h2>
    ${step("vid", "Video", `<div class="box"><div class="row">
      <div class="vth" style="background-image:url('/api/project-poster?dir=${encodeURIComponent(dir)}')"></div>
      <div class="lab"><small>1 video</small><b>${p.duration ? Math.round(p.duration) + "s" : esc(p.title)}</b><p>${esc(p.title)}</p></div></div>
      <div class="row"><div class="lab"><small>Khung edit</small><b id="fmtT"></b><p>Chữ, hiệu ứng, phụ đề được dựng theo khung này.</p></div>
        <div class="fmt2" role="radiogroup" aria-label="Khung edit"><label><input type="radio" name="fmt2" value="9:16"><span><i class="fr v"></i>9:16 dọc</span></label>
        <label><input type="radio" name="fmt2" value="16:9"><span><i class="fr h"></i>16:9 ngang</span></label></div></div></div>`)}
    ${step("cut", "Cắt video", `<div class="box"><div class="row">
      <div class="lab"><small>Tự cắt</small><b>Cắt chỗ vấp, nói lặp và khoảng lặng</b></div>
      <label class="sw"><input type="checkbox" id="trim" checked aria-label="Tự cắt chỗ vấp và khoảng lặng"><i></i></label></div></div>`)}
    ${step("sty", "Áp dụng mẫu edit", `<div class="box"><div id="tplBox"></div><label>Kịch bản tin đã duyệt (tùy chọn)<select id="setupNews"><option value="">Không chọn bản tin</option></select></label><button type="button" class="outline" id="setupBindNews" disabled>Lưu lựa chọn kịch bản cho dự án</button><p id="setupNewsStatus" role="status"></p><pre id="setupNewsText" style="white-space:pre-wrap;overflow-wrap:anywhere;max-height:220px;overflow:auto"></pre><details><summary>Phong cách / prompt bổ sung từ thư viện</summary><p>Định hướng cho AI dựng theo mẫu đã chọn; không tự áp hiệu ứng lên timeline.</p><label>Phong cách<select id="setupCreativeStyle"><option value="">Không bổ sung</option></select></label><label>Prompt<select id="setupCreativePrompt"><option value="">Không bổ sung</option></select></label><pre id="setupCreativeText" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre><p id="setupCreativeStatus" role="status">Đang đọc thư viện workspace…</p></details><div class="row">
      <div class="lab"><small>Mức độ hiệu ứng</small><b id="fxlT">Vừa — đúng theo mẫu</b><p id="fxlP">Số chữ nhấn / hiệu ứng như video mẫu.</p></div>
      <div class="fxl" role="radiogroup" aria-label="Mức độ hiệu ứng"><label><input type="radio" name="fxl" value="vua" checked><span>Vừa</span></label><label><input type="radio" name="fxl" value="nhieu"><span>Nhiều</span></label></div></div>
      <div class="row"><div class="lab"><small>Âm thanh hiệu ứng</small><b id="sfxT">Nhiều — kêu ở mọi hiệu ứng</b><p id="sfxP">Chữ, chữ phụ, cảnh trám vào + ra, zoom, chuyển cảnh, từ khoá phụ đề.</p></div>
      <div class="fxl" role="radiogroup" aria-label="Âm thanh hiệu ứng"><label><input type="radio" name="sfxl" value="nhieu" checked><span>Nhiều</span></label><label><input type="radio" name="sfxl" value="vua"><span>Vừa</span></label><label><input type="radio" name="sfxl" value="tat"><span>Tắt</span></label></div></div>
      <div class="row"><div class="lab"><small>Cảnh trám miễn phí <span class="adm pro" style="margin-left:4px">PRO</span></small><b id="stkT">Tắt — chỉ dùng tư liệu của bạn</b><p id="stkP">Bật để AI tự tìm video minh hoạ miễn phí bản quyền (Pexels) theo lời nói rồi chèn vào.</p></div>
      <div class="fxl" role="radiogroup" aria-label="Cảnh trám miễn phí"><label><input type="radio" name="stockl" value="tat" checked><span>Tắt</span></label><label><input type="radio" name="stockl" value="it"><span>Ít</span></label><label><input type="radio" name="stockl" value="vua"><span>Vừa</span></label><label><input type="radio" name="stockl" value="nhieu"><span>Nhiều</span></label></div></div>
      <div class="row"><div class="lab"><small>Phong cách Edit trên CapCut của bạn</small><b id="ownT">Đang đọc phong cách đã lưu…</b><p id="ownP">AI dựng theo nhịp cắt, phụ đề, chữ, chuyển cảnh và âm thanh học từ dự án CapCut của bạn.</p></div>
      <div class="fxl" role="radiogroup" aria-label="Phong cách Edit trên CapCut của bạn"><label><input type="radio" name="ownl" value="bat"><span>Bật</span></label><label><input type="radio" name="ownl" value="tat" checked><span>Tắt</span></label></div></div></div>`)}
    ${step("med", "Thêm tư liệu <span class=\"muted\" style=\"font-size:13px\">(cảnh trám, ảnh, ghi âm — không bắt buộc)</span>", `<div class="box"><div id="setupBrollSources" role="status"></div><div id="asList"></div>
      <div class="as-btns"><label class="as-add" id="asAdd"><input type="file" id="asFile" multiple accept="video/*,image/*,audio/*,.m4a,.mp3,.wav,.aac" hidden>+ Thêm file từ máy — kéo thả nhiều file vào đây</label>
      <button class="as-add as-drive" id="asDrive" type="button">📁 Chọn link Drive từ kho cảnh trám</button><button class="as-add" id="setupIntake" type="button">NAS / Điện thoại</button></div><div id="drvPick" hidden></div></div>`)}
    ${step("ai", "Cảnh trám AI <span class=\"adm pro\" style=\"margin-left:6px\">PRO</span>", `<div class="box"><div class="row">
      <div class="lab"><small>Tạo cảnh trám bằng AI</small><b>AI viết prompt, tạo video / ảnh trám trên Google Flow, Seedance… rồi chèn vào video</b><p>Dùng tài khoản bạn đã kết nối ở mục Tích hợp.</p></div>
      <label class="sw"><input type="checkbox" id="aiOn" aria-label="Tạo cảnh trám bằng AI"><i></i></label></div>
      <div id="aiOpts" hidden></div></div>`)}
    ${step("ai", "AI thực hiện", `<div class="box"><select id="setupExecution" aria-label="AI dựng mới"><option value="session:auto">Phiên Codex / Claude / Antigravity đang mở</option><option value="session:codex">Phiên Codex đang mở</option><option value="session:claude">Phiên Claude đang mở</option><option value="session:antigravity">Phiên Antigravity đang mở</option><option value="cli:codex">Codex CLI chạy ngầm</option><option value="cli:claude">Claude CLI chạy ngầm</option><option value="api:gateway">API · dựng cơ bản từ tư liệu dự án</option></select><label id="setupModelLabel" hidden>Model CLI (tùy chọn)<input id="setupModel" aria-label="Model CLI dựng mới" maxlength="128" placeholder="Để trống dùng cấu hình CLI"></label><label>Ngôn ngữ lời thoại<select id="setupTranscriptLanguage" aria-label="Ngôn ngữ lời thoại dựng mới"><option value="vi">Tiếng Việt</option><option value="en">English</option><option value="auto">Tự nhận ngôn ngữ</option></select></label><p id="setupExecutionNote"></p><button type="button" class="outline" id="setupCheckAI">Kiểm tra kết nối AI</button><p id="setupAIStatus" role="status"></p></div>`)}
    ${step("note", "Ghi chú cho AI", `<div class="box"><textarea class="note" id="note" placeholder="Yêu cầu dựng; mỗi nguồn một dòng: A-roll: đường dẫn hoặc B-roll: đường dẫn NAS…">${esc(note)}</textarea><button type="button" class="outline" id="setupInspectSources">Kiểm tra nguồn A-roll / B-roll</button><p id="setupSourceStatus" role="status"></p><div id="setupSourceCards"></div><div id="setupSurveyControls" hidden><label>Video khảo sát<select id="setupSurveyVideo" style="max-width:100%"></select></label><button type="button" class="outline" id="setupSurveyPreview">Tạo lại 6 ảnh khảo sát cho lượt dựng</button></div><label><input type="checkbox" id="setupSkipSurvey"> Không đính kèm ảnh khảo sát đã lưu cho lượt này</label><p id="setupSurveyStatus" role="status">Nếu dự án có bảng ảnh đã lưu, lượt dựng sẽ kiểm tra và dùng lại. Có thể tạo lại từ nguồn đã kiểm tra.</p><div id="setupSurveyFrames" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px"></div></div>`)}
    <div class="foot"><button class="ghost" id="skip">Bỏ qua — tự chỉnh tay</button><span class="muted" id="asState"></span><button class="primary go" id="go">AI edit <span aria-hidden="true">→</span></button></div>`;
  let newsEntries=[],newsContext=null,newsTouched=false;st.newsBriefId=undefined;
  const drawNews=()=>{const selected=newsEntries.find(e=>e.id===st.newsBriefId)||newsContext?.brief;$('#setupNewsText').textContent=st.newsBriefId&&selected?selected.payload.script+'\n\nNguồn: '+selected.payload.sources.map(s=>s.url).join('\n'):'';};
  $('#setupNews').onchange=()=>{newsTouched=true;st.newsBriefId=$('#setupNews').value;drawNews();};
  Promise.all([api('/api/v1/news'),api('/api/v1/news/project?dir='+encodeURIComponent(dir))]).then(([result,context])=>{
    if(S.setup!==st)return;newsEntries=result.entries.filter(e=>e.status==='approved');newsContext=context;
    if(context.brief&&!newsEntries.some(e=>e.id===context.brief.id))newsEntries.push(context.brief);
    if(!newsTouched)st.newsBriefId=context.brief?.id||'';
    $('#setupNews').innerHTML='<option value="">Không chọn bản tin</option>'+newsEntries.map(e=>`<option value="${esc(e.id)}">${esc(e.payload.title)} · v${e.version}</option>`).join('');$('#setupNews').value=st.newsBriefId||'';drawNews();$('#setupBindNews').disabled=false;
    $('#setupNewsStatus').textContent=context.brief?'Đã nạp kịch bản lưu cùng dự án. Đổi lựa chọn chỉ ảnh hưởng lượt dựng, trừ khi bấm lưu.':'Chọn kịch bản cho lượt dựng hoặc lưu làm lựa chọn của dự án.';
  }).catch(error=>{if(S.setup===st)$('#setupNewsStatus').textContent=error.message;});
  $('#setupBindNews').onclick=async()=>{const button=$('#setupBindNews');button.disabled=true;const id=st.newsBriefId||'';
    try{const response=await fetch('/api/v1/news/project',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dir,id,workspaceId:newsContext.workspaceId,revision:newsContext.revision,expectedId:newsContext.brief?.id||null})}),result=await response.json();if(!response.ok)throw new Error(result.error);if(S.setup!==st)return;newsContext.brief=result.brief;$('#setupNewsStatus').textContent=id?'Đã lưu bản kịch bản này cùng dự án.':'Đã bỏ kịch bản mặc định của dự án.';}
    catch(error){if(S.setup===st)$('#setupNewsStatus').textContent=error.message;}finally{button.disabled=false;}
  };
  let creativeEntries=[];
  st.useWorkspaceBrand=false;
  const templateExtras=document.createElement('details');templateExtras.className='setup-options';
  templateExtras.innerHTML='<summary>Kịch bản, thương hiệu & định hướng</summary><div class="setup-options-body"></div>';
  $('#tplBox').after(templateExtras);const extrasBody=templateExtras.lastElementChild;
  extrasBody.append($('#setupNews').parentElement,$('#setupBindNews'),$('#setupNewsStatus'),$('#setupNewsText'),jobBrandControls({onChange:value=>{st.useWorkspaceBrand=value;}}),$('#setupCreativeText').parentElement);
  st.creativeBrief={};
  const syncCreativeBrief=()=>{
    st.creativeBrief={styleId:$('#setupCreativeStyle').value,promptId:$('#setupCreativePrompt').value};
    $('#setupCreativeText').textContent=creativeEntries.filter(e=>e.id===st.creativeBrief.styleId||e.id===st.creativeBrief.promptId).map(e=>e.name+'\n'+(e.payload.content||[e.payload.art,e.payload.palette,e.payload.motion,e.payload.avoid].filter(Boolean).join('\n'))).join('\n\n');
  };
  $('#setupCreativeStyle').onchange=syncCreativeBrief;$('#setupCreativePrompt').onchange=syncCreativeBrief;
  api('/api/v1/catalogs/local').then(result=>{
    if(S.setup!==st)return;creativeEntries=result.entries||[];
    for(const [id,kind] of [['setupCreativeStyle','style'],['setupCreativePrompt','prompt']])$('#'+id).innerHTML='<option value="">Không bổ sung</option>'+creativeEntries.filter(e=>e.kind===kind).map(e=>`<option value="${esc(e.id)}">${esc(e.name+(e.version?' · v'+e.version:''))}</option>`).join('');
    $('#setupCreativeStatus').textContent=creativeEntries.length?'Chọn để gửi bản nội dung đã chốt cùng việc dựng.':'Chưa nhập phong cách/prompt cho workspace. Có thể nhập tại Thư viện → Phong cách & Prompt.';
  }).catch(error=>{if(S.setup===st)$('#setupCreativeStatus').textContent=error.message;});
  st.completionMode='review'; // đã bỏ "Tự xuất": AI dựng xong luôn chờ bạn kiểm tra rồi bấm Xuất
  let requestTouched=false;$('#note').addEventListener('input',()=>{requestTouched=true;});
  if(!note)api('/api/v1/sources/project-request?dir='+encodeURIComponent(dir)).then(result=>{if(S.setup===st&&!requestTouched&&result.request?.text){st.note=result.request.text;$('#note').value=result.request.text;$('#note').dispatchEvent(new Event('input'));}}).catch(()=>{});
  st.execution={mode:'session',agent:'auto'};let cliModel='',apiModel='';
  const apiPicker=runModelPicker({input:$('#setupModel'),isCurrent:()=>S.setup===st&&st.execution.mode==='api'});apiPicker.hidden=true;$('#setupModelLabel').after(apiPicker);
  $('#setupExecutionNote').textContent='Tự chọn AI: có phiên chat đang chờ thì giao phiên đó; không có thì tự chạy ngầm Claude/Codex CLI đã đăng nhập. Chọn đích danh một phiên để luôn chờ phiên.';
  $('#setupExecution').onchange=()=>{
    const [mode,agent]=$('#setupExecution').value.split(':');apiPicker.hidden=mode!=='api';const model=mode==='api'?apiModel:cliModel;st.execution={mode,agent,...(['cli','api'].includes(mode)&&model?{model}:{})};
    $('#setupModel').value=model;$('#setupModel').setAttribute('aria-label',mode==='api'?'Model API dựng mới':'Model CLI dựng mới');$('#setupModelLabel').firstChild.textContent=mode==='api'?'Model API cho lượt này (tùy chọn)':'Model CLI (tùy chọn)';
    $('#setupModelLabel').hidden=mode==='session';$('#setupExecutionNote').textContent=mode==='api'?'Để trống dùng quy tắc dựng mới đã bật hoặc model mặc định kết nối; nhập riêng ưu tiên cho lượt này. Chưa fallback hoặc tự tối ưu chi phí. Có thể tính phí, tối đa 6 lượt. Mẫu: màu/font và preset chữ/HTML có trường sửa; chưa hỗ trợ mọi selector/skill hoặc thay hình trong đồ họa. Nếu bật nhìn ảnh, gửi tối đa 6 frame. Nhập mọi tư liệu trước khi giao.':mode==='cli'?'Chạy tiến trình riêng trên máy. Model ID phải được CLI và tài khoản hỗ trợ; để trống dùng cấu hình CLI.':'Tự chọn AI: có phiên chat đang chờ thì giao phiên đó; không có thì tự chạy ngầm Claude/Codex CLI đã đăng nhập. Chọn đích danh một phiên để luôn chờ phiên.';
  };
  $('#setupModel').oninput=event=>{const model=event.target.value.trim();if(st.execution.mode==='cli')cliModel=model;if(st.execution.mode==='api')apiModel=model;st.execution={...st.execution,...(['cli','api'].includes(st.execution.mode)?{model}:{})};};
  $('#setupCheckAI').onclick=async()=>{
    const button=$('#setupCheckAI');button.disabled=true;$('#setupAIStatus').textContent='Đang kiểm tra…';
    try{const result=await api('/api/ket-noi-ai');if(S.setup!==st)return;$('#setupAIStatus').textContent=(result.agents||[]).map(a=>`${a.ten}: ${!a.coMay?'chưa cài':a.dangNhap===true?'đã đăng nhập':a.dangNhap===false?'chưa đăng nhập':'chưa xác minh đăng nhập'}`).join(' · ')+(result.phien?' · Có tín hiệu phiên '+(result.phien.agent||'AI'):' · Chưa thấy phiên chờ việc');}
    catch(error){if(S.setup===st)$('#setupAIStatus').textContent=error.message;}finally{button.disabled=false;}
  };
  let sourceCheck=0,surveyVersion=0,sourceWorkspace=null;
  const clearSetupSurvey=()=>{surveyVersion++;st.sourceSurvey=undefined;$('#setupSurveyFrames').replaceChildren();$('#setupSurveyStatus').textContent='Ảnh mới chưa được chọn; bảng ảnh đã lưu vẫn được kiểm tra khi giao việc, trừ khi chọn không đính kèm.';};
  $('#setupSurveyVideo').onchange=clearSetupSurvey;
  $('#setupSkipSurvey').onchange=()=>{surveyVersion++;$('#setupSurveyStatus').textContent=$('#setupSkipSurvey').checked?'Lượt này không đính kèm ảnh khảo sát. AI vẫn cần khảo sát nguồn bằng công cụ phù hợp.':'Dùng ảnh mới đã chọn hoặc bảng ảnh đã lưu nếu có.';};
  $('#setupSurveyPreview').onclick=async()=>{
    const token=++surveyVersion,text=$('#note').value,selected=$('#setupSurveyVideo').value,button=$('#setupSurveyPreview');button.disabled=true;st.surveyPending=true;st.sourceSurvey=undefined;$('#setupSurveyFrames').replaceChildren();$('#setupSurveyStatus').textContent='Đang tạo 6 ảnh khảo sát…';
    try{
      const response=await fetch('/api/v1/sources/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspaceId:sourceWorkspace,text,selected})}),result=await response.json();if(!response.ok)throw new Error(result.error);if(token!==surveyVersion||S.setup!==st)return;
      st.sourceSurvey={manifestPath:result.manifestPath,selected};$('#setupSkipSurvey').checked=false;
      $('#setupSurveyFrames').replaceChildren(...result.frames.map(frame=>{const figure=document.createElement('figure');figure.style.margin='0';const img=document.createElement('img');img.src=frame.dataUrl;img.alt='Ảnh khảo sát tại '+frame.time.toFixed(2)+' giây';img.style.cssText='width:100%;max-height:160px;object-fit:contain';const caption=document.createElement('figcaption');caption.textContent=frame.time.toFixed(2)+' giây';figure.append(img,caption);return figure;}));
      $('#setupSurveyStatus').textContent='6 ảnh sẽ được chép riêng vào lượt dựng khi giao việc. Đây là ảnh lấy mẫu, chưa phải phân tích toàn bộ video. Không thay video chính của dự án.';
    }catch(error){if(token===surveyVersion&&S.setup===st)$('#setupSurveyStatus').textContent=error.message;}finally{button.disabled=false;st.surveyPending=false;}
  };
  $('#note').addEventListener('input',()=>{clearSetupSurvey();$('#setupSurveyControls').hidden=true;});
  let setupSourceTimer;
  $('#note').addEventListener('input',()=>{sourceCheck++;$('#setupSourceCards').replaceChildren();$('#setupSourceStatus').textContent='';$('#setupBrollSources').replaceChildren();clearTimeout(setupSourceTimer);if(/(?:[a-z]:[\\/]|\\\\[^\\\s]+\\)/i.test($('#note').value)){ $('#setupBrollSources').textContent='Đang nhận diện nguồn trong ghi chú…';setupSourceTimer=setTimeout(()=>{if(S.setup===st)$('#setupInspectSources').click();},900); }});
  $('#setupInspectSources').onclick=async()=>{
    clearSetupSurvey();$('#setupSurveyControls').hidden=true;
    const token=++sourceCheck,text=$('#note').value,button=$('#setupInspectSources');button.disabled=true;$('#setupSourceStatus').textContent='Đang kiểm tra nguồn…';
    try{const workspace=await api('/api/v1/workspaces');sourceWorkspace=workspace.activeId;const response=await fetch('/api/v1/sources/inspect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dir,text})}),result=await response.json();if(!response.ok)throw new Error(result.error);if(token!==sourceCheck||S.setup!==st)return;
      const videos=result.sources.flatMap(source=>source.status==='ready'?source.files.filter(file=>/\.(mp4|mov|m4v|webm)$/i.test(file.path)):[]);
      $('#setupSurveyVideo').innerHTML=[...new Set(videos.map(file=>file.path))].map(file=>`<option value="${esc(file)}">${esc(file)}</option>`).join('');$('#setupSurveyControls').hidden=!videos.length;
      $('#setupSourceStatus').textContent=result.sources.length?'Nguồn sẽ được kiểm tra lại và chốt khi giao việc.':'Mỗi nguồn một dòng: A-roll: đường dẫn hoặc B-roll: đường dẫn.';
      $('#setupSourceCards').innerHTML=result.sources.map(source=>`<div class="cos-source-card" style="padding:10px;overflow-wrap:anywhere"><b>${source.role==='aroll'?'A-roll':source.role==='broll'?'B-roll':'Nguồn'}</b><p>${esc(source.path)}</p><small>${esc(source.status==='error'?source.error:source.files.length+' media đã thấy'+(source.recursive?' · gồm thư mục con':' · trong thư mục này')+(source.truncated?' · danh sách còn tiếp':''))}</small></div>`).join('');
      $('#setupBrollSources').innerHTML=result.sources.filter(source=>source.role==='broll').map(source=>`<div style="padding:12px;overflow-wrap:anywhere"><b>B-roll · ${esc(source.path.split(/[\\/]/).filter(Boolean).at(-1)||source.path)}</b><p>${esc(source.status==='error'?source.error:source.files.length+' media tìm thấy'+(source.recursive?' trong thư mục con':'')+(source.truncated?' · còn nguồn chưa kiểm kê':'')+' · chưa sao chép')}</p><details><summary>Chi tiết nguồn</summary><p>${esc(source.path)}</p><p>AI sẽ nhận danh sách nguồn khi giao việc và nhập những file cần dùng.</p></details></div>`).join('');
    }catch(error){if(token===sourceCheck&&S.setup===st){$('#setupSourceStatus').textContent=error.message;$('#setupBrollSources').textContent='Chưa kiểm tra được B-roll: '+error.message;}}
    finally{button.disabled=false;if(token!==sourceCheck&&S.setup===st&&/(?:[a-z]:[\\/]|\\\\[^\\\s]+\\)/i.test($('#note').value)){clearTimeout(setupSourceTimer);setupSourceTimer=setTimeout(()=>{if(S.setup===st)button.click();},100);}}
  };
  if(note)setTimeout(()=>{if(S.setup===st)$('#note').dispatchEvent(new Event('input'));},0);
  const renderTpl = () => {
    const t = tpl();
    $("#tplBox").innerHTML = `<div class="row">
      <div class="vth" style="${t && tplPoster(t) ? `background-image:url('${esc(tplPoster(t))}')` : ""}"></div>
      <div class="lab"><small>Mẫu</small><b>${t ? esc(t.name) : "Chưa chọn mẫu"}</b><p>${t ? esc(t.description || "") : "Chọn một mẫu để AI dựng theo phong cách đó."}</p></div>
      <button class="pen" id="tplEdit" title="Đổi mẫu" aria-label="Đổi mẫu"><svg viewBox="0 0 16 16" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M11 2.5l2.5 2.5L6 12.5 3 13l.5-3z"/></svg></button></div>`;
    if(t)$("#tplBox").append(templateDetailsPanel(S.tpl));
    $("#tplEdit").onclick = () => pickTemplateModal(renderTpl);
  };
  renderTpl();
  st.automotiveOptions=null;
  let refreshSetupSfx=()=>{};
  $('#tplBox').after(automotiveOptionsControl({onChange:value=>{st.automotiveOptions=value;refreshSetupSfx();}}));
  // Tư liệu: mỗi file 1 ô mô tả (không bắt buộc — để trống thì AI tự xem và đặt vào đoạn hợp)
  const list = $("#asList"), go = $("#go"), state = $("#asState");
  $("#setupIntake").onclick=async()=>{const {openIntake}=await import('/ui/contentos-intake.js');await openIntake({dir,onReceived:file=>{if(S.setup!==st||st.items.some(x=>x.path===file.path))return;st.items.push({name:file.name,path:file.path,kind:kindOf({name:file.name,type:''}),note:'',url:'',imported:true});render();}});};
  const busy = () => st.items.some((x) => !x.path && !x.err && !x.link) || (st.ai?.on && st.ai.refs.some((r) => !r.path && !r.err));
  const ready = () => st.items.filter((x) => x.path || x.link).length;
  const sync = () => { go.disabled = busy(); state.textContent = busy() ? "Đang tải tư liệu…" : ready() ? `${ready()} tư liệu` : ""; };
  const render = () => {
    list.innerHTML = st.items.map((x, i) => `
      <div class="as-row${x.err ? " err" : ""}">
        <div class="as-prev">${x.imported ? `<span class="as-au">▧</span>` : x.link ? `<span class="as-au">${x.folder ? "📁" : "🎞"}</span>` : x.kind === "image" ? `<img src="${x.url}" alt="">` : x.kind === "video" ? `<video src="${x.url}" muted preload="metadata"></video>` : `<span class="as-au">♪</span>`}
          <div class="as-meta"><b>${esc(x.name)}</b><small>${x.link ? (x.folder ? "Thư mục Drive — AI xem và chọn cảnh hợp" : "File Drive — AI tải về dùng") : x.err ? esc(x.err) : x.path ? { video: "Video", image: "Ảnh", audio: "Âm thanh" }[x.kind] : `Đang tải… ${x.pct || 0}%`}</small></div></div>
        <textarea data-i="${i}" placeholder="${x.kind === "audio" ? "Mô tả (không bắt buộc): tiếng vỗ tay chèn lúc nói “xong”, hoặc nhạc nền cả video…" : "Mô tả (không bắt buộc): cảnh màn hình ChatGPT — chèn khi nói “mở ChatGPT lên”… Để trống: AI tự chọn đoạn hợp."}">${esc(x.note || "")}</textarea>
        <button class="link danger as-x" data-i="${i}" title="Bỏ file này" aria-label="Bỏ ${esc(x.name)}">✕</button>
      </div>`).join("");
    sync();
  };
  list.addEventListener("input", (e) => { const i = e.target.dataset.i; if (e.target.tagName === "TEXTAREA" && st.items[i]) st.items[i].note = e.target.value; });
  list.addEventListener("click", (e) => { const b = e.target.closest(".as-x"); if (b) { st.items.splice(Number(b.dataset.i), 1); render(); } });
  const addFiles = (fs) => {
    for (const f of fs) {
      const it = { name: f.name, kind: kindOf(f), note: "", pct: 0, url: URL.createObjectURL(f) };
      st.items.push(it);
      sendFile(`/api/upload?dir=${encodeURIComponent(dir)}&name=${encodeURIComponent(f.name)}`, f, (pc) => {
        it.pct = pc;
        const s = list.querySelectorAll(".as-row small")[st.items.indexOf(it)];
        if (s && !it.path) s.textContent = `Đang tải… ${pc}%`;
      }).then((r) => { it.path = r.path; render(); }).catch((e) => { it.err = e.message; render(); });
    }
    render();
  };
  $("#asFile").onchange = (e) => { addFiles([...e.target.files]); e.target.value = ""; };
  // Chọn link Drive từ kho cảnh trám (màn Kho hiệu ứng → Cảnh trám) — có thể dán link mới, tự lưu vào kho
  const pick = $("#drvPick");
  const drawPick = (links) => {
    const has = (l) => st.items.some((x) => x.link === l.link);
    pick.innerHTML = `<div class="drv">${links.length ? links.map((l, i) => `<label class="drv-row"><input type="checkbox" data-i="${i}" ${has(l) ? "checked" : ""}><span>${l.folder ? "📁" : "🎞"} <b>${esc(l.name)}</b><small>${esc(l.link)}</small></span></label>`).join("")
      : `<div class="muted" style="font-size:13px">Kho chưa có link Drive nào — dán link bên dưới (tự lưu vào kho).</div>`}
      <form class="drv-add"><input name="n" placeholder="Tên (VD: Cảnh trám AI văn phòng)"><input name="l" placeholder="https://drive.google.com/…" required><button class="ghost-btn" type="submit">＋ Thêm link</button></form></div>`;
    pick.querySelectorAll("input[type=checkbox]").forEach((cb) => (cb.onchange = () => {
      const l = links[cb.dataset.i];
      if (cb.checked) st.items.push({ name: l.name, link: l.link, folder: l.folder, kind: "drive", note: "" });
      else st.items = st.items.filter((x) => x.link !== l.link);
      render();
    }));
    pick.querySelector(".drv-add").onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target, r = await post("/api/kho/links", { name: f.n.value, link: f.l.value });
      if (!r.ok) return toast(r.error || "Link không hợp lệ.", true);
      const l = r.links[0];
      st.items.push({ name: l.name, link: l.link, folder: l.folder, kind: "drive", note: "" });
      render(); drawPick(r.links);
    };
  };
  $("#asDrive").onclick = async () => {
    if (!pick.hidden) { pick.hidden = true; return; }
    let links = [];
    try { links = (await api("/api/kho/links")).links || []; } catch {}
    pick.hidden = false; drawPick(links);
  };
  const ad = $("#asAdd");
  ["dragenter", "dragover"].forEach((ev) => ad.addEventListener(ev, (e) => { e.preventDefault(); ad.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => ad.addEventListener(ev, (e) => { e.preventDefault(); ad.classList.remove("over"); }));
  ad.addEventListener("drop", (e) => addFiles([...e.dataTransfer.files]));
  if (files.length) addFiles(files);
  // Cảnh trám AI (gói Pro+): tài khoản tích hợp + số lượng Ít / Vừa / Nhiều + loại + ảnh tham chiếu
  const ai = (st.ai = { on: false, integration: "", amount: "vua", type: "video", refs: [], note: "" });
  let th = null;
  const aiBox = $("#aiOpts");
  const AMT = { it: ["Ít", "≈ 1 cảnh / 30 giây"], vua: ["Vừa", "≈ 1 cảnh / 15 giây"], nhieu: ["Nhiều", "≈ 1 cảnh / 8 giây"] };
  const est = () => { const n = Math.max(1, Math.round((p.duration || 60) / { it: 30, vua: 15, nhieu: 8 }[ai.amount])); return `${n} cảnh cho video ${p.duration ? Math.round(p.duration) + "s" : ""}`; };
  const drawAi = () => {
    if (!th) { aiBox.innerHTML = `<div class="muted" style="font-size:13px">Đang tải tài khoản…</div>`; return; }
    if (!th.allowed) { aiBox.innerHTML = `<div class="setup-options-body"><p class="setup-notice">Xem trước cấu hình · Chưa có quyền thực thi cho tài khoản hiện tại.</p><label>Công cụ dự kiến<select id="aiPreviewTool"><option>Google Flow</option><option>Seedance / Dreamina</option><option>Kling</option><option>Công cụ khác</option></select></label><div class="setup-preview-grid"><label>Số lượng<select id="aiPreviewAmount"><option value="it">Ít</option><option value="vua">Vừa</option><option value="nhieu">Nhiều</option></select></label><label>Loại tư liệu<select id="aiPreviewType"><option value="video">Video</option><option value="image">Ảnh</option><option value="both">Cả hai</option></select></label></div><textarea class="note" id="aiPreviewNote" placeholder="Mô tả cảnh, sản phẩm, phong cách…"></textarea><p class="muted">Để tạo thật cần quyền thực thi và tài khoản công cụ tương ứng. Các lựa chọn này chỉ dùng xem trước, chưa gửi tạo ảnh/video.</p></div>`;
      $('#aiPreviewAmount').value=ai.amount;$('#aiPreviewType').value=ai.type;$('#aiPreviewNote').value=ai.note;
      $('#aiPreviewAmount').onchange=e=>{ai.amount=e.target.value;};$('#aiPreviewType').onchange=e=>{ai.type=e.target.value;};$('#aiPreviewNote').oninput=e=>{ai.note=e.target.value;};return; }
    if (!th.items.length) { aiBox.innerHTML = `<div class="ai-lock">Chưa kết nối công cụ nào. <a href="#" id="aiGo">Mở Tích hợp</a> để thêm tài khoản Google Flow / Seedance…, rồi quay lại bật.</div>`;
      $("#aiGo").onclick = (e) => { e.preventDefault(); $("#navTichHop").click(); }; return; }
    if (!th.items.some((x) => x.id === ai.integration)) ai.integration = th.items[0].id;
    aiBox.innerHTML = `
      <div class="row"><div class="lab"><small>Tài khoản</small><b>Tạo trên</b></div>
        <select id="aiAcc" class="ai-sel">${th.items.map((x) => `<option value="${esc(x.id)}" ${x.id === ai.integration ? "selected" : ""}>${esc((th.tools[x.tool]?.name || x.tool) + " — " + x.name + (x.account ? " · " + x.account : ""))}</option>`).join("")}</select></div>
      <div class="row"><div class="lab"><small>Số lượng cảnh trám</small><b id="aiAmtT">${AMT[ai.amount][0]} — ${est()}</b><p>${AMT[ai.amount][1]} video (sau khi cắt).</p></div>
        <div class="fxl" role="radiogroup" aria-label="Số lượng cảnh trám">${Object.entries(AMT).map(([k, [l]]) => `<label><input type="radio" name="aiAmt" value="${k}" ${k === ai.amount ? "checked" : ""}><span>${l}</span></label>`).join("")}</div></div>
      <div class="row"><div class="lab"><small>Loại</small><b>Cảnh trám là</b></div>
        <div class="fxl" role="radiogroup" aria-label="Loại cảnh trám">${[["video", "Video"], ["image", "Ảnh"], ["both", "Cả hai"]].map(([k, l]) => `<label><input type="radio" name="aiType" value="${k}" ${k === ai.type ? "checked" : ""}><span>${l}</span></label>`).join("")}</div></div>
      <div class="ai-refs"><div class="lab"><small>Ảnh tham chiếu (không bắt buộc)</small><p>Nhân vật, sản phẩm, bối cảnh hay phong cách muốn cảnh trám giống theo.</p></div>
        <div class="ai-rl">${ai.refs.map((r, i) => `<div class="ai-ref${r.err ? " err" : ""}"><img src="${r.url}" alt=""><span>${r.path ? "" : r.err ? "Lỗi" : (r.pct || 0) + "%"}</span>
          <input data-i="${i}" placeholder="VD: sản phẩm chính" value="${esc(r.note)}"><button type="button" data-x="${i}" aria-label="Bỏ ảnh">✕</button></div>`).join("")}
          <label class="ai-add"><input type="file" id="aiRef" accept="image/*" multiple hidden>＋<small>Thêm ảnh</small></label></div></div>
      <textarea class="note ai-note" id="aiNote" placeholder="Phong cách cảnh trám (không bắt buộc): VD điện ảnh, ánh sáng ấm, văn phòng hiện đại, người châu Á…">${esc(ai.note)}</textarea>`;
    $("#aiAcc").onchange = (e) => (ai.integration = e.target.value);
    aiBox.querySelectorAll("input[name=aiAmt]").forEach((r) => (r.onchange = () => { ai.amount = r.value; drawAi(); }));
    aiBox.querySelectorAll("input[name=aiType]").forEach((r) => (r.onchange = () => (ai.type = r.value)));
    $("#aiNote").oninput = (e) => (ai.note = e.target.value);
    aiBox.querySelectorAll(".ai-ref input").forEach((x) => (x.oninput = () => (ai.refs[x.dataset.i].note = x.value)));
    aiBox.querySelectorAll("[data-x]").forEach((b) => (b.onclick = () => { ai.refs.splice(Number(b.dataset.x), 1); drawAi(); sync(); }));
    $("#aiRef").onchange = (e) => {
      for (const f of e.target.files) {
        const r = { url: URL.createObjectURL(f), note: "", pct: 0 };
        ai.refs.push(r);
        sendFile(`/api/upload?dir=${encodeURIComponent(dir)}&name=${encodeURIComponent("tham-chieu-" + f.name)}`, f, (pc) => { r.pct = pc; })
          .then((x) => { r.path = x.path; drawAi(); sync(); }).catch((er) => { r.err = er.message; drawAi(); sync(); });
      }
      e.target.value = ""; drawAi(); sync();
    };
  };
  $("#aiOn").onchange = async (e) => {
    ai.on = e.target.checked; aiBox.hidden = !ai.on;
    if (ai.on && !th) { drawAi(); try { th = await api("/api/tich-hop"); } catch { th = { allowed: false, items: [] }; } }
    drawAi();
  };
  $("#trim").onchange = (e) => (st.trim = e.target.checked);
  // khung edit: lấy từ dự án (đã chọn / tự nhận khi tải video), đổi ở đây thì lưu ngay vào project.json
  const fmtLabel = (f) => (f === "16:9" ? "16:9 ngang — YouTube, Facebook ngang" : "9:16 dọc — TikTok, Reels, Shorts");
  const fmt0 = p.format === "16:9" ? "16:9" : "9:16";
  v.querySelector(`input[name=fmt2][value="${fmt0}"]`).checked = true;
  $("#fmtT").textContent = fmtLabel(fmt0);
  v.querySelectorAll("input[name=fmt2]").forEach((r) => (r.onchange = async () => {
    $("#fmtT").textContent = fmtLabel(r.value);
    const j = await post("/api/project-format", { dir, format: r.value });
    if (!j.ok) return toast(j.error, true);
    p.format = r.value;
  }));
  v.querySelectorAll("input[name=fxl]").forEach((r) => (r.onchange = () => {
    st.fx = r.value;
    $("#fxlT").textContent = st.fx === "nhieu" ? "Nhiều — chữ edit dày hơn" : "Vừa — đúng theo mẫu";
    $("#fxlP").textContent = st.fx === "nhieu" ? "Chữ nhấn, hiệu ứng, zoom xuất hiện thường xuyên hơn mẫu (cùng phong cách)." : "Số chữ nhấn / hiệu ứng như video mẫu.";
  }));
  const SFXL = { nhieu: ["Nhiều — kêu ở mọi hiệu ứng", "Chữ, chữ phụ, cảnh trám vào + ra, zoom, chuyển cảnh, từ khoá phụ đề."],
    vua: ["Vừa — kêu ở hiệu ứng chính", "Chữ, khối đồ hoạ, cảnh trám, chuyển cảnh."], tat: ["Tắt — chỉ tiếng mẫu gắn sẵn", "Chỉ phát âm thanh đã chọn riêng ở từng mục."] };
  const STK = { tat: ["Tắt — chỉ dùng tư liệu của bạn", "Bật để AI tự tìm video minh hoạ miễn phí bản quyền (Pexels) theo lời nói rồi chèn vào."],
    it: ["Ít — khoảng 1 cảnh / 20 giây", "Chỉ minh hoạ những ý quan trọng nhất."], vua: ["Vừa — khoảng 1 cảnh / 10 giây", "Minh hoạ đều các ý chính, xen kẽ với người nói."],
    nhieu: ["Nhiều — khoảng 1 cảnh / 6 giây", "Nhịp nhanh kiểu TikTok, gần như ý nào cũng có hình minh hoạ."] };
  // chỉ có giọng đọc: không có hình nào → mặc định tự tìm cảnh trám trên mạng (nếu tài khoản có quyền)
  if (voice) api("/api/tich-hop").then((t) => { th = t; const r = v.querySelector("input[name=stockl][value=nhieu]"); if (t?.allowed && r && st.stock === "tat") { r.checked = true; r.dispatchEvent(new Event("change")); } }).catch(() => {});
  v.querySelectorAll("input[name=stockl]").forEach((r) => (r.onchange = async () => {
    if (r.value !== "tat") { // gói Pro trở lên
      try { th = th || (await api("/api/tich-hop")); } catch { th = { allowed: false, items: [] }; }
      if (!th.allowed) {
        st.stock=r.value;$('#stkT').textContent=STK[st.stock][0];$('#stkP').textContent='Xem trước cấu hình · Tài khoản hiện tại chưa có quyền tìm và chèn stock. Chưa tải tư liệu.';return;
      }
    }
    st.stock = r.value;
    $("#stkT").textContent = STK[st.stock][0];
    $("#stkP").textContent = STK[st.stock][1];
  }));
  refreshSetupSfx=()=>{
    const override=st.automotiveOptions?.sfx,locked=!!override&&override!=='keep',level=locked?override:st.sfx;
    v.querySelectorAll('input[name=sfxl]').forEach(r=>{r.disabled=locked;r.checked=r.value===level;});
    $('#sfxT').textContent=locked&&level==='tat'?'Tắt toàn bộ SFX':SFXL[level][0];
    $('#sfxP').textContent=locked?'Đang áp dụng lựa chọn trong Tùy chọn dựng ngành xe. Chọn “Theo mức chung bên dưới” để chỉnh tại đây.':SFXL[level][1];
  };
  v.querySelectorAll("input[name=sfxl]").forEach((r) => (r.onchange = () => {
    if(r.disabled)return;
    st.sfx = r.value;refreshSetupSfx();
  }));
  refreshSetupSfx();
  // Phong cách Edit trên CapCut của bạn: skill phong-cach-chu-so-huu đã học (Kết nối → CapCut), lựa chọn nhớ cho lần sau.
  st.ownerStyle = false;
  const ownRadios = v.querySelectorAll("input[name=ownl]");
  const setOwn = (on) => { st.ownerStyle = on; ownRadios.forEach((r) => { r.checked = r.value === (on ? "bat" : "tat"); }); };
  ownRadios.forEach((r) => (r.onchange = () => { setOwn(r.value === "bat"); localStorage.setItem("cos.ownerStyle", r.value); }));
  fetch("/api/v1/capcut/projects").then((r) => r.json()).then((d) => {
    const learned = d?.learned;
    if (!learned?.profile) {
      ownRadios.forEach((r) => { r.disabled = true; });
      $("#ownT").textContent = "Chưa có — học từ CapCut trước";
      $("#ownP").replaceChildren("Vào Kết nối → CapCut · Học phong cách, chọn vài video đã hoàn thiện; phong cách được lưu thành skill để dùng lại mọi lần sau. ", Object.assign(document.createElement("a"), { href: "#connections/capcut", textContent: "Mở Kết nối CapCut" }));
      return;
    }
    $("#ownT").textContent = `Đã lưu · học từ ${learned.projects.join(", ")} (${new Date(learned.learnedAt).toLocaleDateString("vi-VN")})`;
    setOwn(localStorage.getItem("cos.ownerStyle") !== "tat");
  }).catch(() => { $("#ownT").textContent = "Không đọc được phong cách đã lưu"; });
  $("#skip").onclick = () => open(dir);
  go.onclick = async () => {
    if(st.surveyPending)return toast('Đợi tạo ảnh khảo sát xong rồi giao AI.');
    if (busy()) return;
    if (!tpl()?.installed) return pickTemplateModal(renderTpl);
    if(th&&!th.allowed&&(st.ai.on||st.stock!=='tat'))return toast('Cấu hình cảnh trám đang ở chế độ xem trước. Tắt hai mục này để dựng bằng tư liệu đã gửi; thực thi cần quyền tài khoản phù hợp.',true);
    if (st.ai.on && !st.ai.integration) return toast("Cảnh trám AI: kết nối tài khoản ở mục Tích hợp trước, hoặc tắt cảnh trám AI.", true);
    go.disabled = true;
    const j = await post("/api/ai-job", { dir, automotiveOptions:st.automotiveOptions, newsBriefId:st.newsBriefId, creativeBrief:st.creativeBrief, useWorkspaceBrand:st.useWorkspaceBrand, sourceSurvey:$('#setupSkipSurvey').checked?null:st.sourceSurvey, execution:st.execution,transcriptLanguage:$('#setupTranscriptLanguage').value,completionMode:st.completionMode, template: S.tpl, note: $("#note").value, trim: st.trim, fx: st.fx, sfxLevel: st.sfx, stockBroll: st.stock, ownerStyle: st.ownerStyle,
      assets: st.items.filter((x) => x.path).map((x) => ({ path: x.path, note: x.note.trim() })),
      drive: st.items.filter((x) => x.link).map((x) => ({ name: x.name, link: x.link, folder: !!x.folder, note: x.note.trim() })),
      aiBroll: st.ai.on ? { on: true, integration: st.ai.integration, amount: st.ai.amount, type: st.ai.type, note: st.ai.note.trim(),
        refs: st.ai.refs.filter((r) => r.path).map((r) => ({ path: r.path, note: r.note.trim() })) } : null });
    if (!j.ok) { go.disabled = false; return toast(j.error, true); }
    loadProjects();
    waitAi(dir);
  };
  render();
}

// ---------- Hộp chọn mẫu (đổi mẫu ở bước 2) ----------
const aim = $("#aim"), box = $("#aimBox");
let aiTimer = null;
let parDone = null; // hộp hỏi xếp hàng / song song đang mở
function closeAim() { aim.classList.remove("show"); clearInterval(aiTimer); mini.hidden = true; parDone?.(null); loadProjects(); }
// "Ẩn xuống": đóng hộp chờ nhưng vẫn theo dõi — nút nhỏ góc dưới phải hiện % / xong, bấm để mở lại
const mini = document.body.appendChild(Object.assign(document.createElement("button"), { className: "ai-mini", hidden: true, type: "button" }));
const hideAim = () => { aim.classList.remove("show"); mini.hidden = false; };
aim.addEventListener("click", (e) => { if (e.target === aim) closeAim(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && aim.classList.contains("show")) closeAim(); });
function pickTemplateModal(after) {
  box.innerHTML = `<h3 id="aimT">Chọn mẫu edit</h3><p class="sub">Mẫu quyết định font, màu, phụ đề, hiệu ứng, chuyển cảnh và âm thanh. AI dựng theo quy tắc của mẫu.</p>
    <div class="tgrid">${tplCards(S.tpls, S.tpl)}</div><div class="mfoot"><span></span><button class="ghost" id="mClose">Đóng</button></div>`;
  aim.classList.add("show");
  $("#mClose").onclick = () => aim.classList.remove("show");
  box.querySelector(".tgrid").onclick = async (e) => {
    const c = e.target.closest(".tcard");
    if (c && (await chooseTemplate(c.dataset.id))) { aim.classList.remove("show"); after?.(); }
  };
}

// Hỏi khi đã có video khác đang dựng: "queue" (cửa sổ AI làm xong video trước rồi làm tiếp) · "bg" (Claude / Codex chạy ngầm, song song) · null (huỷ)
function askParallel(n) {
  return new Promise((resolve) => {
    const done = (c) => { parDone = null; resolve(c); };
    parDone = done;
    aim.classList.add("show");
    box.innerHTML = `<h3 id="aimT">Đang có ${n} video khác chờ / đang dựng</h3>
      <p class="sub">Video này làm thế nào?</p>
      <div class="par">
        <button class="par-op" data-c="queue"><b>Làm sau (xếp hàng)</b><span>AI làm xong video trước rồi tự làm tiếp video này. Theo dõi được từng bước trong cửa sổ Claude / Codex. Nhẹ máy.</span></button>
        <button class="par-op" data-c="bg"><b>Làm song song (chạy ngầm)</b><span>Mở thêm 1 Claude / Codex chạy ẩn cho riêng video này — xong sớm hơn. Máy chạy nặng hơn, tốn lượt dùng AI nhanh hơn.</span></button>
      </div>
      <div class="mfoot"><button class="ghost" data-c="">Huỷ</button></div>`;
    box.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { aim.classList.remove("show"); done(b.dataset.c || null); }));
  });
}

// ---------- Màn chờ: AI nhận việc → đang dựng → xong thì mở dự án ----------
// giữ khớp EDIT_STEPS trong editor/tools/ai-inbox.mjs + editor/server.mjs
const EDIT_STEPS = ["Nhận việc", "Đọc lời nói", "Cắt vấp, khoảng lặng", "Chữ edit, hiệu ứng, zoom theo mẫu", "Phụ đề, tiếng hiệu ứng, nhạc nền", "Tách nền, kiểm tra", "Dựng bản xem trước"];
function waitAi(dir) {
  aim.classList.add("show");
  mini.hidden = true;
  mini.onclick = () => { mini.hidden = true; aim.classList.add("show"); };
  clearInterval(aiTimer);
  let shown = "";
  const tick = async () => {
    let r;
    try { r = await api(`/api/ai-job?dir=${encodeURIComponent(dir)}`); } catch { return; }
    const j = r.job;
    if (!j) return closeAim();
    if(j.execution?.agent&&j.execution.agent!=='auto'&&r.listener?.agent!==j.execution.agent)r.listener=null;
    const hidden = !aim.classList.contains("show") && !mini.hidden;
    if (j.status === "done") {
      clearInterval(aiTimer);
      if (j.kind === "clips") { // cắt clip xong → hộp danh sách clip (không mở editor)
        loadProjects();
        if (!hidden) return showClips(dir);
        mini.className = "ai-mini ok"; mini.textContent = "Đã cắt clip xong — Xem";
        mini.onclick = () => { mini.hidden = true; showClips(dir); };
        return;
      }
      if (!hidden) return open(j.openDir || dir);
      // đang ẩn: không tự chuyển màn hình — báo xong, bấm mới mở
      mini.className = "ai-mini ok"; mini.textContent = "Video đã dựng xong — Mở";
      mini.onclick = () => { mini.hidden = true; open(j.openDir || dir); };
      return loadProjects();
    }
    if (hidden) {
      mini.className = "ai-mini" + (j.status === "error" ? " err" : "");
      mini.textContent = j.status === "error" ? "AI báo lỗi — xem" : j.status === "working" ? `AI đang dựng… ${r.progress?.pct ?? ""}${r.progress?.pct != null ? "%" : ""}` : "Chưa bắt đầu edit video";
    }
    const selectedAgent=j.agent||j.execution?.agent;
    const who = selectedAgent === "codex" ? "Codex" : selectedAgent === "claude" ? "Claude" : selectedAgent === "antigravity" ? "Antigravity" : "AI";
    const state = j.status + (j.status === "waiting" ? (r.listener ? "-l" : r.runner ? "-r" : "-n") : "");
    // bước AI đang làm (tác vụ nền) — cập nhật mỗi lần hỏi, không vẽ lại cả hộp
    const step = j.apiProgress?.phase ? `Đang làm: ${j.apiProgress.phase}${Number.isFinite(j.apiProgress.pct)?' · '+j.apiProgress.pct+'%':''}` : r.progress?.detail ? `Đang làm: ${r.progress.detail}` : "";
    const pr = r.progress?.n ? r.progress : null;
    // thanh % + các bước (việc edit) — vẽ lại riêng, không vẽ lại cả hộp
    const drawProg = () => {
      const el = $("#aiProg");
      if (!el || !pr) return;
      el.innerHTML = `<div class="ap-top"><b>${pr.pct}%</b><span>Bước ${pr.n}/${pr.total}: ${esc(pr.step)}</span></div>
        <div class="ap-bar"><i style="width:${pr.pct}%"></i></div>
        <ol class="ap-steps">${(pr.steps || EDIT_STEPS).map((s, i) => `<li class="${i + 1 < pr.n ? "ok" : i + 1 === pr.n ? "on" : ""}"><i>${i + 1 < pr.n ? "✓" : i + 1}</i>${s}</li>`).join("")}</ol>`;
    };
    if (state === shown) { const el = $("#aiStep"); if (el && el.textContent !== step) el.textContent = step; drawProg(); return; }
    shown = state;
    const cancel = `<div class="mfoot"><button class="ghost" id="aiCancel">Huỷ việc</button><span class="btns"><button class="outline" id="aiHide" title="Thu nhỏ — AI vẫn làm tiếp, xong sẽ báo ở góc dưới">Ẩn xuống</button><button class="outline" id="aiOpen">Mở dự án luôn</button></span></div>`;
    if (j.status === "error") {
      const nl = j.needLogin, name = nl === "codex" ? "Codex" : nl === "antigravity" ? "Antigravity" : "Claude Code";
      box.innerHTML = `<div class="wait"><h3 id="aimT">${nl ? `Cần đăng nhập ${name}` : "AI chưa dựng được"}</h3><p class="sub err">${esc(j.error)}</p>
        <div class="btns" style="justify-content:center;margin-top:14px">${nl ? `<button class="primary" id="aiLogin">Đăng nhập ${name}</button>` : ""}<button class="outline" id="aiRetry">Thử lại</button></div></div>${cancel}`;
      if(j.errorCode==='CANDIDATE_CONFLICT'){
        $('#aiRetry').textContent='Đối chiếu bản AI';
        $('#aiRetry').onclick=async()=>{try{const {openCandidateReview}=await import('/ui/contentos-candidate.js');await openCandidateReview({dir,onResolved:()=>{closeAim();loadProjects();}});}catch(error){toast(error.message,true);}};
      }
      if (nl) $("#aiLogin").onclick = async () => { const r2 = await post("/api/ai-login", { agent: nl }); toast(r2.ok ? `Đã mở cửa sổ đăng nhập ${name} — đăng nhập xong bấm “Thử lại”.` : r2.error, !r2.ok); };
      if(j.errorCode!=='CANDIDATE_CONFLICT')$("#aiRetry").onclick = async () => { shown = ""; await fetch(`/api/ai-job?dir=${encodeURIComponent(dir)}`, { method: "PUT" }); tick(); };
    } else if (j.status === "working") {
      box.innerHTML = j.kind === "template"
        ? `<div class="wait"><div class="spin"></div><h3 id="aimT">${who} đang phân tích video mẫu…</h3>
          <p class="sub">Tạo mẫu <b>${esc(j.templateName)}</b>: đo từng khung → dựng lại → so với mẫu nhiều vòng tới khi khớp. Thường 30–90 phút.
          Xong sẽ tự mở ở đây — bạn có thể đóng cửa sổ này.</p></div>${cancel}`
        : `<div class="wait"><h3 id="aimT">${who} đang ${j.kind === "clips" ? "cắt clip ngắn" : "dựng video"}…</h3><div id="aiProg" class="ap"></div>
          <p class="sub">${j.kind === "clips" ? `Chọn đoạn hay nhất, cắt thành ${j.count === "auto" ? "nhiều" : j.count} clip, viết caption từng nền tảng${j.editEach ? ", rồi edit từng clip theo mẫu" : ""}.` : `Theo mẫu <b>${esc(j.templateName)}</b>.`} ${j.background
            ? `${who} chạy ngầm trên máy (không có cửa sổ).`
            : `<b>Mở cửa sổ ${who}</b> để theo dõi từng bước AI đang làm.`} Thường 3–10 phút; video dài / mẫu cần tách nền lâu hơn. Xong sẽ tự mở ở đây.</p><p class="sub" id="aiStep" style="opacity:.7;font-size:13px;min-height:1.3em">${esc(step)}</p></div>${cancel}`;
    } else if (r.listener) {
      box.innerHTML = `<div class="wait"><div class="spin"></div><h3 id="aimT">Chưa bắt đầu edit video</h3>
        <p class="sub">Đã gửi cho ${r.listener.agent === "codex" ? "Codex" : r.listener.agent === "antigravity" ? "Antigravity" : "Claude"} — đang chờ AI nhận việc… Mở cửa sổ ${r.listener.agent === "codex" ? "Codex" : r.listener.agent === "antigravity" ? "Antigravity" : "Claude"} để theo dõi AI làm từng bước.</p></div>${cancel}`;
    } else if (r.runner) {
      box.innerHTML = `<div class="wait"><div class="spin"></div><h3 id="aimT">Đang mở ${r.runner.agent === "codex" ? "Codex" : "Claude Code"} trên máy…</h3>
        <p class="sub">Phần mềm tự gửi việc cho AI, không cần mở cửa sổ chat. Vài giây nữa AI sẽ nhận việc.</p></div>${cancel}`;
    } else {
      const cmd = "edit video đang chờ trong phần mềm";
      box.innerHTML = `<div class="wait"><div class="spin"></div><h3 id="aimT">Chưa bắt đầu edit video</h3>
        <p class="sub">Chưa có cửa sổ ${selectedAgent === "antigravity" ? "Antigravity" : selectedAgent === "codex" ? "Codex" : selectedAgent === "claude" ? "Claude" : "Claude / Codex / Antigravity"} nào nhận việc. Copy câu này, dán vào cửa sổ ${selectedAgent === "antigravity" ? "Antigravity" : selectedAgent === "codex" ? "Codex" : selectedAgent === "claude" ? "Claude (tab Code)" : "Claude (tab Code), Codex hoặc Antigravity"} đang mở thư mục phần mềm rồi gửi — AI làm ngay trong cửa sổ đó, bạn theo dõi được từng bước:</p>
        <div class="cmd"><code>${cmd}</code><button class="primary" id="aiCopy">Copy</button></div>
        <ol class="steps"><li>Chưa mở? Mở app Claude → tab <b>Code</b> (hoặc Codex / Antigravity) → chọn thư mục phần mềm.</li>
        <li>Dán câu trên và gửi. Lần sau mở Claude trong thư mục này, Claude tự nhận việc khi bạn bấm AI edit.</li></ol>
        <div class="btns" style="justify-content:center;margin-top:10px"><button class="ghost" id="aiBg">Hoặc chạy ngầm (không cần mở chat, không xem được từng bước)</button></div></div>${cancel}`;
      $("#aiCopy").onclick = async () => { try { await navigator.clipboard.writeText(cmd); toast("Đã copy — dán vào Claude / Codex / Antigravity"); } catch { toast(cmd); } };
      $("#aiBg").onclick = async () => { shown = ""; await fetch(`/api/ai-job?dir=${encodeURIComponent(dir)}&bg=1`, { method: "PUT" }); tick(); };
    }
    const version=jobTemplateVersion(j);if(version)box.append(version);
    $("#aiCancel").onclick = async () => { await fetch(`/api/ai-job?dir=${encodeURIComponent(dir)}`, { method: "DELETE" }); closeAim(); };
    $("#aiOpen").onclick = () => open(dir);
    $("#aiHide").onclick = () => { hideAim(); shown = ""; tick(); };
    drawProg();
  };
  box.innerHTML = `<div class="wait"><div class="spin"></div><p class="sub">Đang gửi…</p></div>`;
  tick();
  aiTimer = setInterval(tick, 2000);
}

// ---------- [Admin] Tạo mẫu thư viện từ video mẫu ----------
async function initAdmin() {
  let st;
  try { st = await api("/api/admin/status"); } catch { return; }
  $("#navAdmin").hidden = false; // gói Free / bản chưa có công cụ: vẫn hiện để giới thiệu + nâng cấp
  $("#navAdmin").onclick = () => { show("vAdmin"); renderAdmin(st); };
}
async function renderAdmin(st) {
  if(!st.allowed||!st.tools){renderFeaturePreview($('#vAdmin'),'template');return;}
  const sec = $("#vAdmin");
  const intro = "Gửi 1 video mẫu bạn thích — AI đo từng khung (font, màu, chuyển động chữ, chuyển cảnh, tiếng hiệu ứng), dựng lại giống rồi lưu thành mẫu edit của bạn để dùng cho video sau.";
  if (st.allowed && !st.tools) {
    sec.innerHTML = `<div class="hero"><h1>Tạo mẫu từ video</h1><p>${intro}</p></div>
      <div class="kho-empty">Tài khoản của bạn đã có tính năng này. Tải lại phần mềm trên website (đăng nhập tài khoản gói ${esc(String(st.plan || "pro").toUpperCase())}) để nhận bản có công cụ Tạo mẫu từ video — dự án, mẫu và kho hiệu ứng của bạn vẫn giữ nguyên khi chép đè.</div>`;
    return;
  }
  if (!st.allowed && st.email) {
    sec.innerHTML = `<div class="hero"><h1>Tạo mẫu từ video</h1><p>${intro}</p></div>
      <div class="kho-empty">${LOCK_ICON}${esc(st.reason)}<br><br><button class="primary" id="admUp">Nâng cấp gói</button></div>`;
    $("#admUp").onclick = () => (window.__openUpgrade ? window.__openUpgrade() : toast("Nâng cấp gói trên website.", true));
    return;
  }
  if (!st.allowed) {
    sec.innerHTML = `<div class="hero"><h1>Tạo mẫu từ video</h1><p>${esc(st.reason || "Đăng nhập tài khoản gói Pro trở lên để dùng.")}</p></div>
      <div class="adm-box"><form class="adm-login" id="admLogin">
        <input type="email" id="admEmail" placeholder="Email admin" autocomplete="username" required>
        <input type="password" id="admPass" placeholder="Mật khẩu" autocomplete="current-password" required>
        <button class="primary" type="submit">Đăng nhập</button></form></div>`;
    $("#admLogin").onsubmit = async (e) => {
      e.preventDefault();
      const r = await post("/api/account/login", { email: $("#admEmail").value.trim(), password: $("#admPass").value }).catch(() => ({}));
      if (!r.ok) return toast(r.error || "Đăng nhập không được.", true);
      location.reload(); // mọi màn hình và danh sách mẫu đọc lại theo gói vừa đăng nhập
    };
    return;
  }
  // Gọn như tải video lên: thả video mẫu + đặt tên là xong. Mẫu lưu trong máy — không đưa lên website từ đây
  // (admin muốn đưa lên thư viện thì tự nhắn AI).
  sec.innerHTML = `<div class="hero"><h1>Tạo mẫu từ video</h1><p>${intro}</p></div>
    <div class="adm-box adm-simple">
      <label class="drop" id="admDrop"><input type="file" id="admRef" accept="video/*" hidden>
        <span class="ic"><svg viewBox="0 0 16 16" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 11V3M4.5 6.5L8 3l3.5 3.5M3 13h10"/></svg></span><b id="admFile">Thả video mẫu vào đây hoặc bấm để chọn</b><small>MP4 / MOV — video có kiểu edit bạn muốn làm theo</small></label>
      <div class="adm-row"><input type="text" id="admName" placeholder="Đặt tên mẫu, VD: Chữ neon xếp tầng">
        <button class="primary" id="admGo">Tạo mẫu</button></div>
      <span class="help" id="admProg"></span>
    </div>`;
  const drop = $("#admDrop"), inp = $("#admRef");
  const pick = (file) => {
    if (!file || !/^video\//.test(file.type)) return toast("Chọn 1 file video.", true);
    drop.file = file;
    $("#admFile").textContent = "✓ " + file.name;
    if (!$("#admName").value.trim()) $("#admName").value = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
    $("#admName").focus();
  };
  inp.onchange = () => pick(inp.files[0]);
  drop.ondragover = (e) => { e.preventDefault(); drop.classList.add("over"); };
  drop.ondragleave = () => drop.classList.remove("over");
  drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove("over"); pick(e.dataTransfer.files[0]); };
  $("#admName").onkeydown = (e) => { if (e.key === "Enter") $("#admGo").click(); };
  $("#admGo").onclick = async () => {
    const ref = drop.file, name = $("#admName").value.trim();
    if (!ref) return toast("Thả video mẫu vào trước.", true);
    if (!name) return toast("Đặt tên cho mẫu.", true);
    const btn = $("#admGo"), prog = $("#admProg");
    btn.disabled = true;
    try {
      const r = await sendFile(`/api/new-project?file=${encodeURIComponent(ref.name)}&name=${encodeURIComponent("mau-" + name)}&noasr=1`, ref, (p) => (prog.textContent = `Đang chép video mẫu… ${p}%`));
      prog.textContent = "";
      const j = await post("/api/ai-job", { kind: "template", dir: r.dir, name });
      if (!j.ok) throw new Error(j.error);
      loadProjects();
      waitAi(r.dir);
    } catch (e) { toast(e.message, true); prog.textContent = ""; }
    btn.disabled = false;
  };
}

// /home?pick=<dir> → mở thẳng bước thiết lập cho dự án đó
(async () => {
  await Promise.all([loadProjects(), loadTemplates()]);
  initAdmin();
  const q = new URLSearchParams(location.search);
  const d = q.get("pick");
  if (d) setupView(d);
  // Nút "Mở trong phần mềm" trên website: ?install=<id> → tải + cài mẫu bằng tài khoản đã đăng nhập
  const inst = q.get("install");
  if (inst) {
    history.replaceState(null, "", location.pathname);
    toast("Đang tải mẫu về phần mềm…");
    try {
      const r = await api(`/api/library/install?id=${encodeURIComponent(inst)}`, { method: "POST" });
      if (r.ok === false) throw new Error(r.error);
      await loadTemplates();
      const t = S.tpls.find((x) => x.id === inst);
      toast(`Đã cài mẫu “${t?.name || inst}” — chọn video rồi bấm AI edit.`);
    } catch (e) { toast(e.message || "Không cài được mẫu — đăng nhập tài khoản trong phần mềm rồi thử lại.", true); }
  }
  // Danh sách video bên trái: việc AI đang chờ / đang dựng → cập nhật trạng thái + % mỗi 5 giây
  setInterval(() => { if (!document.hidden && S.projects.some((p) => p.ai === "waiting" || p.ai === "working")) loadProjects(); }, 5000);
  // Tải mẫu (.zip) từ website → phần mềm tự cài từ thư mục Downloads; báo + làm mới danh sách
  let since = Date.now() - 5000;
  setInterval(async () => {
    if (document.hidden) return;
    let r; try { r = await api(`/api/auto-installed?since=${since}`); } catch { return; }
    since = r.now;
    if (!r.items?.length) return;
    await loadTemplates();
    toast(`Đã tự cài mẫu ${r.items.map((x) => `“${x.name}”`).join(", ")} từ file vừa tải.`);
  }, 4000);
})();

// ---------- Kho hiệu ứng của tôi (chữ / đồ hoạ / kiểu cảnh trám người dùng tự lưu từ trong phần mềm) ----------
const KHO_TABS = [["chu", "Văn bản"], ["dohoa", "Đồ hoạ"], ["brolls", "Cảnh trám"]];
const FRAME_NAME = { "": "Khung nổi", glow: "Khung phát sáng", tilt: "Thẻ nghiêng", phone: "Điện thoại", polaroid: "Polaroid" };
const MODE_NAME = { pip: "Khung nổi", split: "Chia đôi", full: "Toàn màn hình" };
const FX_NAME = { zoom: "Phóng ra", slide: "Trượt lên", fade: "Mờ dần", wipe: "Quét ngang", none: "Không hiệu ứng" };
S.kho = { tab: "chu", data: null };
async function loadKhoHome() {
  try { S.kho.data = await api("/api/kho"); } catch { S.kho.data = { items: [] }; }
  try { S.kho.links = (await api("/api/kho/links")).links || []; } catch { S.kho.links = []; }
  renderKho();
}
function renderKho() {
  const sec = $("#vKho"), d = S.kho.data;
const khoCat = (x) => (x.kind === "brolls" ? "brolls" : x.kind === "texts" || x.group === "chu" ? "chu" : "dohoa");
  const want = (x) => khoCat(x) === S.kho.tab;
  const items = (d?.items || []).filter(want);
  const count = (t) => (d?.items || []).filter((x) => khoCat(x) === t).length + (t === "brolls" ? (S.kho.links || []).length : 0);
  // Cảnh trám: link Google Drive người dùng lưu cảnh trám AI (nhiều link: tên + link)
  const links = S.kho.links || [];
  const linkBox = S.kho.tab !== "brolls" ? "" : `<div class="kho-links"><div class="kl-h"><b>📁 Link Drive cảnh trám</b><span>Lưu thư mục / file Google Drive chứa cảnh trám (video AI, ảnh…). Khi thêm cảnh trám trong video: chọn “Từ kho” là lấy được.</span></div>
      <form class="kl-add" id="klAdd"><input id="klName" placeholder="Tên, VD: Cảnh trám AI — văn phòng" maxlength="80"><input id="klLink" placeholder="https://drive.google.com/…" required><button class="primary" type="submit">＋ Lưu link</button></form>
      ${links.length ? `<div class="kl-list">${links.map((l) => `<div class="kl-row" data-id="${esc(l.id)}"><i>${l.folder ? "📁" : "🎞"}</i><div><b>${esc(l.name)}</b><a href="${esc(l.link)}" target="_blank" rel="noopener">${esc(l.link)}</a></div><button data-a="del" class="danger">Xoá</button></div>`).join("")}</div>` : ""}</div>`;
  sec.innerHTML = `<div class="hero kho-hero"><div><h1>Kho hiệu ứng của tôi</h1><p>Chọn hiệu ứng từ các mẫu edit đã tải và lưu vào đây — dùng lại ở mọi video (trong phần mềm: Chữ / Đồ hoạ / Cảnh trám → “Kho của tôi”).</p></div><div class="kho-btns"><button class="ghost-btn" id="khoMake">✦ Tạo mẫu từ kho</button><button class="primary" id="khoAdd">＋ Thêm từ mẫu edit</button></div></div>
    <div class="kho">
      <nav class="kho-menu">${KHO_TABS.map(([k, l]) => `<button data-k="${k}" class="${S.kho.tab === k ? "on" : ""}">${l}<i>${count(k)}</i></button>`).join("")}</nav>
      <div class="kho-body">${linkBox}${!d ? `<div class="kho-empty">Đang tải…</div>` : items.length ? `<div class="kho-grid">${items.map((it) => `
        <div class="kho-card" data-id="${esc(it.id)}">
          <div class="kho-thumb">${it.layer === "behind" || it.matte ? `<span class="matte-tag">Sau người · cần tách nền</span>` : ""}${it.kind !== "brolls" ? `<div class="kho-host"></div>` : `<div class="kho-br"><b class="${esc(it.mode)} fr-${esc(it.frame || "")}"></b></div>`}</div>
          <div class="kho-name">${esc(it.name)}</div>
          <div class="kho-desc">${it.kind === "brolls" ? esc(`${it.mode === "pip" ? FRAME_NAME[it.frame || ""] || "Khung nổi" : MODE_NAME[it.mode] || ""} · ${FX_NAME[it.tIn] || ""}`) : esc(it.from ? "Từ mẫu " + it.from : new Date(it.savedAt).toLocaleDateString("vi-VN"))}</div>
          <div class="kho-act"><button data-a="ren">Đổi tên</button><button data-a="del" class="danger">Xoá</button></div>
        </div>`).join("")}</div>`
        : `<div class="kho-empty">${S.kho.tab === "brolls" ? "Chưa lưu <b>kiểu hiển thị</b> cảnh trám nào." : `Chưa có ${KHO_TABS.find((x) => x[0] === S.kho.tab)[1].toLowerCase()} nào trong kho.`}<br>${S.kho.tab === "brolls" ? "Mở một video → chọn một cảnh trám, chỉnh kiểu rồi bấm <b>⭐ Lưu kiểu cảnh trám này vào kho</b>." : "Bấm <b>＋ Thêm từ mẫu edit</b> để tích các hiệu ứng trong mẫu, hoặc chỉnh trong video rồi bấm <b>⭐ Lưu vào kho</b>."}</div>`}</div>
    </div>`;
  sec.querySelectorAll(".kho-menu button").forEach((b) => (b.onclick = () => { S.kho.tab = b.dataset.k; renderKho(); }));
  const kla = $("#klAdd");
  if (kla) kla.onsubmit = async (e) => {
    e.preventDefault();
    const r = await post("/api/kho/links", { name: $("#klName").value, link: $("#klLink").value });
    if (!r.ok) return toast(r.error || "Không lưu được.", true);
    S.kho.links = r.links; renderKho(); toast("Đã lưu link vào kho cảnh trám.");
  };
  sec.querySelectorAll(".kl-row [data-a=del]").forEach((b) => (b.onclick = async () => {
    const id = b.closest(".kl-row").dataset.id;
    if (!confirm("Xoá link này khỏi kho?")) return;
    const r = await (await fetch(`/api/kho/links?id=${encodeURIComponent(id)}`, { method: "DELETE" })).json();
    S.kho.links = r.links || []; renderKho();
  }));
  $("#khoAdd").onclick = openPicker;
  $("#khoMake").onclick = openMake;
  // ảnh xem trước chữ / đồ hoạ: dựng bằng đúng CSS của mẫu (shadow DOM)
  let sheet = null;
  if (d?.style) { sheet = new CSSStyleSheet(); try { sheet.replaceSync(d.style); } catch {} }
  sec.querySelectorAll(".kho-card").forEach((card) => {
    const it = items.find((x) => x.id === card.dataset.id), host = card.querySelector(".kho-host");
    if (host && it?.body) {
      const root = host.attachShadow({ mode: "open" });
      if (sheet) root.adoptedStyleSheets = [sheet];
      root.innerHTML = it.body;
      requestAnimationFrame(() => fitKho(host, root, card.querySelector(".kho-thumb")));
    }
    card.querySelector('[data-a="del"]').onclick = async () => {
      if (!confirm(`Xoá “${it.name}” khỏi kho?`)) return;
      await fetch(`/api/kho?id=${encodeURIComponent(it.id)}`, { method: "DELETE" }); toast("Đã xoá khỏi kho."); loadKhoHome();
    };
    card.querySelector('[data-a="ren"]').onclick = async () => {
      const name = prompt("Tên mới:", it.name);
      if (!name?.trim()) return;
      await fetch(`/api/kho?id=${encodeURIComponent(it.id)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
      loadKhoHome();
    };
  });
}
// phóng vừa phần có nội dung của khối (khung gốc 1080×1920)
function fitKho(host, root, box) {
  const tw = box.clientWidth, th = box.clientHeight, base = host.getBoundingClientRect();
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const el of root.querySelectorAll(".blk-in *, .tx *")) {
    if (el.children.length && el.tagName !== "svg") continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    x0 = Math.min(x0, r.left - base.left); y0 = Math.min(y0, r.top - base.top); x1 = Math.max(x1, r.right - base.left); y1 = Math.max(y1, r.bottom - base.top);
  }
  if (x1 < x0) return;
  const pad = 60, k = Math.min(tw / (x1 - x0 + pad * 2), th / (y1 - y0 + pad * 2), 0.6);
  host.style.transform = `translate(${tw / 2 - ((x0 + x1) / 2) * k}px, ${th / 2 - ((y0 + y1) / 2) * k}px) scale(${k})`;
}
$("#navKho").onclick = () => openLibrary("effects");
if (location.hash === "#kho") openLibrary("effects"); // mở thẳng từ phần mềm: “Quản lý kho”

// ---------- Thêm vào kho: chọn mẫu edit đã tải → tích các thành phần (chữ / đồ hoạ) muốn lưu ----------
S.pick = null; // { tpls, tpl, data, ids:Set, cat }
const PICK_CATS = [["chu", "Chữ"], ["dohoa", "Hiệu ứng"], ["canhtram", "Cảnh trám"]];
async function openPicker() {
  S.pick = { tpls: null, tpl: null, data: null, ids: new Set(), cat: "chu" };
  renderPicker();
  try { S.pick.tpls = (await api("/api/kho/mau")).items || []; } catch { S.pick.tpls = []; }
  if (S.pick.tpls[0]) return pickTpl(S.pick.tpls[0].id);
  renderPicker();
}
async function pickTpl(id) {
  S.pick.tpl = id; S.pick.data = null; S.pick.ids = new Set();
  renderPicker();
  try { S.pick.data = await api(`/api/kho/mau?id=${encodeURIComponent(id)}`); } catch { S.pick.data = { items: [] }; }
  // mục đang xem trống ở mẫu này → nhảy sang mục đầu tiên có hiệu ứng
  const has = (c) => S.pick.data.items?.some((x) => x.group === c);
  if (!has(S.pick.cat)) S.pick.cat = PICK_CATS.map((c) => c[0]).find(has) || "chu";
  renderPicker();
}
function renderPicker() {
  const sec = $("#vKho"), p = S.pick, d = p.data, tplInfo = p.tpls?.find((t) => t.id === p.tpl);
  const list = (d?.items || []).filter((x) => x.group === p.cat);
  const all = list.length && list.every((x) => p.ids.has(x.id));
  sec.innerHTML = `<div class="hero"><h1>Thêm vào kho từ mẫu edit</h1><p>Chọn một mẫu edit trong máy → chọn mục Chữ / Hiệu ứng / Cảnh trám → tích các hiệu ứng muốn lưu.</p></div>
    <button class="ghost-btn" id="pkBack" style="margin-bottom:18px">‹ Quay lại kho</button>
    <div class="pick">
      <div class="pick-col"><div class="pick-lbl">Mẫu trong máy</div>
        ${p.tpls == null ? `<span class="muted">Đang tải…</span>` : p.tpls.length ? p.tpls.map((t) => `<button data-t="${esc(t.id)}" class="${p.tpl === t.id ? "on" : ""}"><b>${esc(t.name)}</b><small>${t.chu} chữ · ${t.dohoa} hiệu ứng · ${t.canhtram} cảnh trám</small></button>`).join("") : `<span class="muted">Chưa có mẫu edit nào. Tải mẫu ở Thư viện mẫu trước.</span>`}
      </div>
      <div class="pick-main">
        ${!p.tpl ? "" : `<div class="pick-cats">${PICK_CATS.map(([k, l]) => `<button data-c="${k}" class="${p.cat === k ? "on" : ""}">${l} <i>${tplInfo?.[k] ?? 0}</i></button>`).join("")}
          ${list.length ? `<button class="link-btn" id="pkAll">${all ? "Bỏ chọn tất cả" : "Chọn tất cả"}</button>` : ""}</div>
        ${!d ? `<div class="kho-empty">Đang tải hiệu ứng…</div>` : list.length ? `<div class="kho-grid">${list.map((x) => `<label class="kho-card pick ${p.ids.has(x.id) ? "on" : ""}" data-id="${esc(x.id)}">
          <input type="checkbox" ${p.ids.has(x.id) ? "checked" : ""}>
          <div class="kho-thumb">${x.layer === "behind" ? `<span class="matte-tag">Sau người · cần tách nền</span>` : ""}${x.kind === "brolls" ? `<div class="kho-br"><b class="${esc(x.mode)} fr-${esc(x.frame || "")}"></b></div>` : `<div class="kho-host"></div>`}</div>
          <div class="kho-name">${esc(x.name)}</div><div class="kho-desc">${esc(x.kind === "brolls" ? FX_NAME[x.tIn] || "" : x.desc || "")}</div></label>`).join("")}</div>`
          : `<div class="kho-empty">Mẫu này chưa có ${PICK_CATS.find((c) => c[0] === p.cat)[1].toLowerCase()} tách sẵn.</div>`}`}
      </div>
    </div>
    <div class="pick-foot"><span class="muted">${p.ids.size ? `Đã chọn ${p.ids.size} hiệu ứng` : "Chưa chọn hiệu ứng nào"}</span>
      <button class="primary" id="pkAdd" ${p.ids.size ? "" : "disabled"}>Thêm ${p.ids.size || ""} vào kho</button></div>`;
  $("#pkBack").onclick = () => { S.pick = null; loadKhoHome(); };
  sec.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => pickTpl(b.dataset.t)));
  sec.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { p.cat = b.dataset.c; renderPicker(); }));
  const allBtn = $("#pkAll");
  if (allBtn) allBtn.onclick = () => { list.forEach((x) => (all ? p.ids.delete(x.id) : p.ids.add(x.id))); renderPicker(); };
  let sheet = null;
  if (d?.style) { sheet = new CSSStyleSheet(); try { sheet.replaceSync(d.style); } catch {} }
  sec.querySelectorAll(".kho-card.pick").forEach((card) => {
    const it = d.items.find((x) => x.id === card.dataset.id), host = card.querySelector(".kho-host");
    if (host) {
      const root = host.attachShadow({ mode: "open" });
      if (sheet) root.adoptedStyleSheets = [sheet];
      root.innerHTML = it.body;
      requestAnimationFrame(() => fitKho(host, root, card.querySelector(".kho-thumb")));
    }
    card.querySelector("input").onchange = (e) => { e.target.checked ? p.ids.add(it.id) : p.ids.delete(it.id); renderPicker(); };
  });
  const add = $("#pkAdd");
  if (add) add.onclick = async () => {
    add.disabled = true;
    const r = await post("/api/kho?batch=1", { tpl: p.tpl, ids: [...p.ids] });
    if (!r.ok) { toast(r.error || "Không thêm được.", true); add.disabled = false; return; }
    toast(`Đã thêm ${r.added} hiệu ứng vào kho.`);
    S.pick = null; loadKhoHome();
  };
}

// ---------- Tạo mẫu edit từ kho: tích các hiệu ứng trong kho → đặt tên → lưu thành mẫu trên máy ----------
S.make = null; // { ids:Set }
function openMake() {
  const items = S.kho.data?.items || [];
  S.make = { ids: new Set(), cat: ["chu", "dohoa", "brolls"].find((c) => items.some((x) => khoCatOf(x) === c)) || "chu" };
  renderMake();
}
function renderMake() {
  const sec = $("#vKho"), d = S.kho.data, m = S.make, items = d?.items || [];
  const cats = [["chu", "Chữ"], ["dohoa", "Hiệu ứng"], ["brolls", "Cảnh trám"]];
  sec.innerHTML = `<div class="hero"><h1>Tạo mẫu edit từ kho</h1><p>Tích các chữ, hiệu ứng, cảnh trám muốn có trong mẫu → đặt tên → AI sẽ dựng video chỉ bằng các thành phần này (tự chọn cái hợp từng câu nói).</p></div>
    <button class="ghost-btn" id="mkBack" style="margin-bottom:18px">‹ Quay lại kho</button>
    <div class="pick-cats">${cats.map(([k, l]) => {
      const list = items.filter((x) => khoCatOf(x) === k), on = list.filter((x) => m.ids.has(x.id)).length;
      return `<button data-mc="${k}" class="${m.cat === k ? "on" : ""}">${l}<i>${on ? on + "/" : ""}${list.length}</i></button>`;
    }).join("")}${items.some((x) => khoCatOf(x) === m.cat) ? `<button class="link-btn" data-mall="${m.cat}">${items.filter((x) => khoCatOf(x) === m.cat).every((x) => m.ids.has(x.id)) ? "Bỏ chọn tất cả" : "Chọn tất cả"}</button>` : ""}</div>
    ${!items.length ? `<div class="kho-empty">Kho còn trống — thêm hiệu ứng vào kho trước.</div>` : cats.filter(([k]) => k === m.cat).map(([k, l]) => {
      const list = items.filter((x) => khoCatOf(x) === k);
      if (!list.length) return `<div class="kho-empty">Kho chưa có ${l.toLowerCase()} nào. Thêm ở “＋ Thêm từ mẫu edit” hoặc lưu từ video.</div>`;
      return `<div class="kho-grid">${list.map((x) => `<label class="kho-card pick ${m.ids.has(x.id) ? "on" : ""}" data-id="${esc(x.id)}"><input type="checkbox" ${m.ids.has(x.id) ? "checked" : ""}>
          <div class="kho-thumb">${x.layer === "behind" || x.matte ? `<span class="matte-tag">Sau người · cần tách nền</span>` : ""}${x.kind === "brolls" ? `<div class="kho-br"><b class="${esc(x.mode)} fr-${esc(x.frame || "")}"></b></div>` : `<div class="kho-host"></div>`}</div>
          <div class="kho-name">${esc(x.name)}</div><div class="kho-desc">${esc(x.from ? "Từ mẫu " + x.from : "")}</div></label>`).join("")}</div>`;
    }).join("")}
    <div class="pick-foot"><input id="mkName" class="mk-name" maxlength="60" placeholder="Tên mẫu (vd: Mẫu review của tôi)" value="${esc(m.name || "")}">
      <span class="muted">${m.ids.size ? `${m.ids.size} thành phần` : "Chưa chọn"}</span>
      <button class="primary" id="mkGo" ${m.ids.size ? "" : "disabled"}>Tạo mẫu</button></div>`;
  $("#mkBack").onclick = () => { S.make = null; renderKho(); };
  $("#mkName").oninput = (e) => (m.name = e.target.value);
  sec.querySelectorAll("[data-mc]").forEach((b) => (b.onclick = () => { m.cat = b.dataset.mc; renderMake(); }));
  sec.querySelectorAll("[data-mall]").forEach((b) => (b.onclick = () => {
    const list = items.filter((x) => khoCatOf(x) === b.dataset.mall), all = list.every((x) => m.ids.has(x.id));
    list.forEach((x) => (all ? m.ids.delete(x.id) : m.ids.add(x.id))); renderMake();
  }));
  let sheet = null;
  if (d?.style) { sheet = new CSSStyleSheet(); try { sheet.replaceSync(d.style); } catch {} }
  sec.querySelectorAll(".kho-card.pick").forEach((card) => {
    const it = items.find((x) => x.id === card.dataset.id), host = card.querySelector(".kho-host");
    if (host && it.body) {
      const root = host.attachShadow({ mode: "open" });
      if (sheet) root.adoptedStyleSheets = [sheet];
      root.innerHTML = it.body;
      requestAnimationFrame(() => fitKho(host, root, card.querySelector(".kho-thumb")));
    }
    card.querySelector("input").onchange = (e) => { e.target.checked ? m.ids.add(it.id) : m.ids.delete(it.id); renderMake(); };
  });
  const go = $("#mkGo");
  if (go) go.onclick = async () => {
    const name = $("#mkName").value.trim();
    if (!name) { $("#mkName").focus(); return toast("Đặt tên cho mẫu trước nhé.", true); }
    go.disabled = true;
    const r = await post("/api/kho/template", { name, ids: [...m.ids] });
    if (!r.ok) { go.disabled = false; return toast(r.error || "Không tạo được mẫu.", true); }
    toast(`Đã tạo mẫu “${r.name}” (${r.count} thành phần) — chọn mẫu này khi AI edit.`);
    S.make = null; S.tpl = r.id;
    try { localStorage.setItem("home.tpl", r.id); } catch {}
    await loadTemplates();
    $("#navHome").click();
  };
}
// loại của 1 mục kho: chu / dohoa / brolls
function khoCatOf(x) { return x.kind === "brolls" ? "brolls" : x.kind === "texts" || x.group === "chu" ? "chu" : "dohoa"; }

// Chọn "Kho hiệu ứng của tôi" khi AI edit: tạo / cập nhật mẫu từ toàn bộ kho rồi dùng như 1 mẫu thường
async function useWholeKho() {
  const r = await post("/api/kho/template", { id: "kho-cua-toi", name: "Kho hiệu ứng của tôi", all: true });
  if (!r.ok) { toast(r.error || "Kho còn trống — thêm hiệu ứng vào kho trước.", true); return false; }
  S.tpl = r.id;
  try { localStorage.setItem("home.tpl", r.id); } catch {}
  await loadTemplates();
  toast("AI sẽ tự chọn hiệu ứng trong kho của bạn để edit.");
  return true;
}

// ---------- Tải mẫu edit lên (.zip từ website) → giao cho AI (Claude / Codex đang mở) cài ----------
$("#upTpl").onclick = () => $("#upTplFile").click();
$("#upTplFile").onchange = async (e) => {
  const f = e.target.files[0];
  e.target.value = "";
  if (f) uploadTemplateZip(f);
};
async function uploadTemplateZip(file) {
  toast("Đang tải mẫu lên…");
  let r;
  try { r = await (await fetch(`/api/template-upload?name=${encodeURIComponent(file.name)}`, { method: "POST", body: file })).json(); }
  catch { r = { ok: false, error: "Không gửi được file." }; }
  if (!r.ok) return toast(r.error || "Không tải lên được.", true);
  installWait(r.job.dir, r.job.templateName, !!r.listener);
}
function installWait(dir, name, listening) {
  const box = $("#aimBox");
  aim.classList.add("show");
  let stop = false;
  const paint = (j) => {
    const st = j?.status || "waiting";
    box.innerHTML = `<h3 id="aimT">Cài mẫu “${esc(name)}”</h3>
      <p class="sub">Đã tải mẫu lên. AI (Claude / Codex) sẽ cài và kiểm tra mẫu — bạn theo dõi trong cửa sổ AI.</p>
      <div class="inst-step ok"><i>✓</i><span>Tải file mẫu lên phần mềm</span></div>
      <div class="inst-step ${st === "waiting" ? "on" : "ok"}"><i>${st === "waiting" ? "2" : "✓"}</i><span>${st === "waiting"
        ? (listening ? "Đang chờ AI nhận việc… (cửa sổ Claude / Codex đang mở sẽ tự nhận)" : "Mở Claude / Codex trong thư mục phần mềm và dán câu:<code class=\"inst-cmd\">cài mẫu đang chờ trong phần mềm</code>")
        : "AI đã nhận việc"}</span></div>
      <div class="inst-step ${st === "working" ? "on" : st === "done" ? "ok" : ""}"><i>${st === "done" ? "✓" : "3"}</i><span>${st === "working" ? "AI đang cài và kiểm tra mẫu…" : st === "done" ? "Đã cài xong — mẫu có trong danh sách chọn mẫu" : "AI cài và kiểm tra mẫu"}</span></div>
      ${st === "error" ? `<div class="help" style="color:#ff6b6b;margin-top:8px">Không cài được: ${esc(j.error || "")}</div>` : ""}
      <div class="mfoot"><span></span><button class="ghost" id="instClose">${st === "done" || st === "error" ? "Đóng" : "Ẩn (AI vẫn cài tiếp)"}</button></div>`;
    $("#instClose").onclick = () => { stop = true; aim.classList.remove("show"); };
  };
  paint(null);
  const tick = async () => {
    if (stop) return;
    let j = null;
    try { j = (await api(`/api/ai-job?dir=${encodeURIComponent(dir)}`)).job; } catch {}
    if (j) paint(j);
    if (j?.status === "done") { await loadTemplates(); toast(`Đã cài mẫu “${name}”.`); return; }
    if (j?.status === "error") return;
    setTimeout(tick, 2000);
  };
  setTimeout(tick, 1000);
}

// ---------- Mạng xã hội của tôi (gói Pro+): lưu kênh để AI viết content + đăng video tự động ----------
const PLATFORMS = [["tiktok", "TikTok"], ["facebook", "Facebook"], ["instagram", "Instagram"], ["youtube", "YouTube Shorts"], ["threads", "Threads"], ["linkedin", "LinkedIn"], ["x", "X (Twitter)"], ["zalo", "Zalo OA"]];
const PCOLOR = { tiktok: "#25F4EE", facebook: "#1877F2", instagram: "#E1306C", youtube: "#FF0033", threads: "#ffffff", linkedin: "#0A66C2", x: "#ffffff", zalo: "#0068FF" };
S.social = { data: null, edit: null, lich: [], week: 0, open: null };
async function loadSocial() {
  try { S.social.data = await api("/api/social"); } catch { S.social.data = { allowed: false, channels: [] }; }
  await loadLich(false);
  renderSocial();
}
async function loadLich(paint = true) {
  try { S.social.lich = (await api("/api/lich-dang")).items || []; } catch { S.social.lich = []; }
  if (paint && $("#lich")) renderLich();
}
// tự làm mới lịch khi đang mở màn hình Mạng xã hội (bài tới giờ → đang đăng → đã đăng)
setInterval(() => { if (!$("#vSocial").hidden && S.social.data?.allowed && !S.social.open) loadLich(); }, 30000);
const LICH_ST = { cho: ["Chờ đăng", "#d8ff3e"], dang: ["AI đang đăng", "#4aa8ff"], xong: ["Đã đăng", "#3ddc84"], loi: ["Lỗi", "#ff5d5d"] };
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const hhmm = (d) => d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
const toLocalInput = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60e3).toISOString().slice(0, 16);
const PLNAME = { tiktok: "TikTok", facebook: "Facebook", instagram: "Instagram", youtube: "YouTube", threads: "Threads", linkedin: "LinkedIn", x: "X", zalo: "Zalo" };
// link từng kênh của 1 bài: đã đăng (có link) · lỗi · đang chờ
const postLinks = (e) => e.channels.map((c) => {
  const r = (e.posted || []).find((x) => x.platform === c.platform && (!x.name || !c.name || x.name === c.name)) || (e.posted || []).find((x) => x.platform === c.platform);
  const st = r ? r.status : e.status === "xong" ? "ok" : e.status === "loi" ? "loi" : "cho";
  return { c, r, st };
});
const linkBtns = (e) => postLinks(e).map(({ c, r, st }) => r?.url
  ? `<a class="pl-l ok" href="${esc(r.url)}" target="_blank" rel="noopener" title="Mở bài trên ${esc(c.name || c.platform)}"><i style="background:${PCOLOR[c.platform] || "#888"}"></i>${esc(PLNAME[c.platform] || c.platform)} ↗</a>`
  : `<span class="pl-l ${st}" title="${esc(st === "loi" ? r?.note || e.error || "Chưa đăng được" : st === "ok" ? "Đã đăng (AI chưa ghi link)" : "Chưa đăng")}"><i style="background:${PCOLOR[c.platform] || "#888"}"></i>${esc(PLNAME[c.platform] || c.platform)}${st === "loi" ? " ✕" : st === "ok" ? " ✓" : ""}</span>`).join("");
function renderLich() {
  const box = $("#lich");
  if (!box) return;
  const items = S.social.lich, today = new Date(); today.setHours(0, 0, 0, 0);
  const mon = new Date(today); mon.setDate(today.getDate() - ((today.getDay() + 6) % 7) + S.social.week * 7);
  const days = [...Array(7)].map((_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
  const sun = days[6], fmt = (d) => d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  const upcoming = items.filter((e) => e.status === "cho").length, posting = items.filter((e) => e.status === "dang").length;
  const chip = (e) => {
    const t = new Date(e.at), [st, col] = LICH_ST[e.status] || ["", "#888"];
    return `<button class="lich-it st-${e.status}${e.poster ? " has-img" : ""}" data-id="${esc(e.id)}" title="${esc(st + (e.error ? " — " + e.error : ""))}">
      ${e.poster ? `<span class="li-img" style="background-image:url('${e.poster}')"></span>` : ""}<span class="lt">${hhmm(t)}</span><span class="ln">${esc(e.title || (e.video || "").split(/[\\/]/).pop() || "Video")}</span>
      <span class="lc">${e.channels.map((c) => `<i style="background:${PCOLOR[c.platform] || "#888"}" title="${esc(c.name || c.platform)}"></i>`).join("")}<em style="color:${col}">${st}</em></span></button>`;
  };
  box.innerHTML = `<div class="lich-head"><div><h2>Lịch đăng bài</h2>
      <p>${upcoming ? `<b>${upcoming}</b> bài chờ đăng` : "Chưa có bài chờ đăng"}${posting ? ` · ${posting} bài AI đang đăng` : ""} — hẹn giờ khi bấm <b>Xuất video</b> hoặc <b>Đăng tự động</b> trong editor.
      Tới giờ phần mềm tự giao việc đăng cho AI (cần mở phần mềm + Claude / Codex đang chờ việc, hoặc bật “Chạy ngầm”).</p></div>
      <div class="lich-nav"><button data-w="-1">‹</button><button data-w="0" class="${S.social.week ? "" : "on"}">Tuần này</button><button data-w="1">›</button>
      <span>${fmt(days[0])} – ${fmt(sun)}</span></div></div>
    <div class="lich-grid">${days.map((d) => {
      const list = items.filter((e) => dayKey(new Date(e.at)) === dayKey(d));
      return `<div class="lich-day${dayKey(d) === dayKey(today) ? " today" : ""}${d < today ? " past" : ""}">
        <div class="ld">${d.toLocaleDateString("vi-VN", { weekday: "short" })} <b>${d.getDate()}</b></div>${list.map(chip).join("") || `<div class="lich-empty">—</div>`}</div>`;
    }).join("")}</div>`;
  const done = items.filter((e) => e.status === "xong" || e.status === "loi" || e.status === "dang").sort((a, b) => Date.parse(b.postedAt || b.at) - Date.parse(a.postedAt || a.at));
  box.insertAdjacentHTML("beforeend", `<div class="lich-head" style="margin-top:28px"><div><h2>Bài đã đăng</h2><p>${done.length ? `${done.filter((e) => e.status === "xong").length} bài đã đăng` : "Chưa có bài nào"} — bấm tên kênh để mở bài trên mạng xã hội.</p></div></div>
    ${done.length ? `<div class="pd-grid">${done.map((e) => {
      const [st, col] = LICH_ST[e.status] || ["", "#888"];
      return `<div class="pd-card">
        <div class="pd-th" style="${e.poster ? `background-image:url('${e.poster}')` : ""}">${e.poster ? "" : "🎬"}<span class="pd-st" style="color:${col}">${st}</span></div>
        <div class="pd-b"><b>${esc(e.title || (e.video || "").split(/[\/]/).pop() || "Video")}</b>
          <small>${new Date(e.postedAt || e.at).toLocaleString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}${e.history ? " · đăng ngay" : " · theo lịch"}</small>
          <div class="pd-links">${linkBtns(e)}</div>${e.status === "loi" && e.error ? `<div class="pd-err">${esc(e.error)}</div>` : ""}
          ${e.project ? `<button class="link-btn pd-open" data-proj="${esc(e.project)}">Mở dự án</button>` : ""}</div></div>`;
    }).join("")}</div>` : `<div class="kho-empty">Xuất video xong bấm <b>Đăng tự động</b> (hoặc tích kênh khi Xuất video) — bài đã đăng hiện ở đây kèm link từng kênh.</div>`}`);
  box.querySelectorAll("[data-proj]").forEach((b) => (b.onclick = () => open(b.dataset.proj)));
  box.querySelectorAll("[data-w]").forEach((b) => (b.onclick = () => { const w = +b.dataset.w; S.social.week = w ? S.social.week + w : 0; renderLich(); }));
  box.querySelectorAll(".lich-it").forEach((b) => (b.onclick = () => lichPop(items.find((e) => e.id === b.dataset.id), b)));
}
// bấm 1 bài trong lịch: xem kênh, đổi giờ, đăng ngay, huỷ
function lichPop(e, anchor) {
  document.querySelector(".lich-pop")?.remove();
  if (!e) return;
  S.social.open = e.id;
  const t = new Date(e.at), [st, col] = LICH_ST[e.status] || ["", "#888"], can = !e.history && (e.status === "cho" || e.status === "loi");
  const pop = document.createElement("div");
  pop.className = "lich-pop";
  pop.innerHTML = `${e.poster ? `<div class="lp-img" style="background-image:url('${e.poster}')"></div>` : ""}<b>${esc(e.title || "Video")}</b>
    <div class="lp-st" style="color:${col}">${st}${e.status === "xong" && e.postedAt ? " · " + new Date(e.postedAt).toLocaleString("vi-VN") : ""}</div>
    ${e.error ? `<div class="lp-err">${esc(e.error)}</div>` : ""}
    <div class="lp-row">🕒 ${t.toLocaleString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</div>
    <div class="lp-row pd-links">${linkBtns(e)}</div>
    ${e.note ? `<div class="lp-note">📝 ${esc(e.note)}</div>` : ""}
    ${e.video ? `<div class="lp-file">🎬 ${esc(e.video.split(/[\\/]/).pop())}${e.scheduledMedia?.kind==='pinned'?' · đã gắn file và mã kiểm tra':''}</div>` : e.scheduledMedia?.kind==='awaiting-render'?`<div class="lp-file">🎬 Chờ đúng bản xuất đã hẹn · ${esc((e.scheduledMedia.revision||'').slice(0,12))}</div>`:`<div class="lp-file">🎬 Lấy bản xuất mới nhất của dự án ${esc(e.project || "")} (lịch cũ)</div>`}
    ${can ? `<label class="lp-row">Đổi giờ <input type="datetime-local" id="lpAt" value="${toLocalInput(t > new Date() ? t : new Date(Date.now() + 3600e3))}"></label>` : ""}
    <div class="lp-act">${can ? `<button id="lpDel" class="danger">Huỷ lịch</button><button id="lpSave">Lưu giờ</button>` : ""}
      ${e.status === "cho" ? `<button id="lpNow" class="primary">Đăng ngay</button>` : ""}<button id="lpClose">Đóng</button></div>`;
  document.body.append(pop);
  const r = anchor.getBoundingClientRect();
  pop.style.left = Math.min(innerWidth - pop.offsetWidth - 12, Math.max(12, r.left)) + "px";
  pop.style.top = Math.min(innerHeight - pop.offsetHeight - 12, r.bottom + 6) + "px";
  const close = () => { pop.remove(); S.social.open = null; };
  const act = async (fn) => { try { const res = await fn(); if (!res.ok) { toast(res.error || "Không làm được.", true); return false; } S.social.lich = res.items; close(); renderLich(); return true; } catch(error) { toast(error.message || "Không kết nối được phần mềm.", true); return false; } };
  pop.querySelector("#lpClose").onclick = close;
  pop.querySelector("#lpDel") && (pop.querySelector("#lpDel").onclick = () => confirm("Huỷ lịch đăng bài này?") &&
    act(async () => (await fetch(`/api/lich-dang?id=${encodeURIComponent(e.id)}`, { method: "DELETE" })).json()));
  pop.querySelector("#lpSave") && (pop.querySelector("#lpSave").onclick = () => {
    const v = new Date(pop.querySelector("#lpAt").value);
    if (isNaN(v) || v < Date.now() + 60e3) return toast("Giờ hẹn phải sau bây giờ ít nhất 1 phút.", true);
    act(() => post("/api/lich-dang", { id: e.id, at: v.toISOString() })).then(ok => { if(ok) toast("Đã đổi giờ đăng."); });
  });
  pop.querySelector("#lpNow") && (pop.querySelector("#lpNow").onclick = () => confirm("Đăng bài này ngay bây giờ?") &&
    act(() => post("/api/lich-dang", { id: e.id, now: true })).then(ok => { if(ok) toast("Đã xử lý yêu cầu đăng ngay. Kiểm tra trạng thái trong lịch."); }));
}
function renderSocial() {
  const sec = $("#vSocial"), d = S.social.data, ed = S.social.edit;
  if(d&&!d.allowed){renderFeaturePreview(sec,'social');return;}
  if (!d) { sec.innerHTML = `<div class="kho-empty">Đang tải…</div>`; return; }
  if (!d.allowed) {
    sec.innerHTML = `<div class="hero"><h1>Mạng xã hội</h1><p>Lưu các kênh của bạn — xuất video xong bấm <b>Đăng tự động</b>: AI viết content đúng tiêu chí từng kênh theo nội dung video và đăng giúp bạn.</p></div>
      <div class="kho-empty">${LOCK_ICON}Tính năng dành cho gói <b>Pro</b> trở lên${d.account?.email ? ` (tài khoản ${esc(d.account.email)} đang ở gói ${esc(({ none: "CHƯA KÍCH HOẠT", free: "BASIC" })[d.plan || "free"] || String(d.plan).toUpperCase())})` : " — đăng nhập tài khoản trong phần mềm"}.<br><br>
      <button class="primary" id="soUp">Nâng cấp gói</button></div>`;
    $("#soUp").onclick = () => (window.__openUpgrade ? window.__openUpgrade() : toast("Nâng cấp gói trên website.", true));
    return;
  }
  const form = (c) => `<div class="so-form">
      <div class="so-row"><label>Nền tảng<select id="soPlat">${PLATFORMS.map(([k, l]) => `<option value="${k}" ${c?.platform === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        <label>Tên kênh<input id="soName" value="${esc(c?.name || "")}" placeholder="VD: ContentOS Official"></label></div>
      <label>Link kênh<input id="soUrl" value="${esc(c?.url || "")}" placeholder="https://www.tiktok.com/@kenh-cua-ban"></label>
      <label>Khách hàng mục tiêu<input id="soAud" value="${esc(c?.audience || "")}" placeholder="VD: chủ shop online 25–40 tuổi, mới làm video"></label>
      <div class="so-row"><label>Giọng văn<input id="soTone" value="${esc(c?.tone || "")}" placeholder="VD: gần gũi, xưng mình – bạn, có emoji"></label>
        <label>Kêu gọi hành động<input id="soCta" value="${esc(c?.cta || "")}" placeholder="VD: Inbox để nhận mẫu miễn phí"></label></div>
      <label>Hashtag hay dùng<input id="soTags" value="${esc(c?.hashtags || "")}" placeholder="#edit video #AI #marketing"></label>
      <div class="so-act"><button class="ghost-btn" id="soCancel">Huỷ</button><button class="primary" id="soSave">${c?.id ? "Lưu thay đổi" : "Thêm kênh"}</button></div>
    </div>`;
  sec.innerHTML = `<div class="hero kho-hero"><div><h1>Mạng xã hội</h1><p>Các kênh của bạn (lưu trên máy). Xuất video xong bấm <b>Đăng tự động</b> → AI viết content đúng tiêu chí từng kênh theo nội dung video rồi đăng — trình duyệt cần đăng nhập sẵn các kênh.</p></div>
      ${ed ? "" : `<button class="primary" id="soAdd">＋ Thêm kênh</button>`}</div>
    ${ed ? form(ed.id ? ed : null) : ""}
    ${d.channels.length ? `<div class="so-grid">${d.channels.map((c) => `<div class="so-card" data-id="${esc(c.id)}">
        <div class="so-h"><i style="background:${PCOLOR[c.platform] || "#888"}"></i><b>${esc(PLATFORMS.find((p) => p[0] === c.platform)?.[1] || c.platform)}</b></div>
        <div class="so-name">${esc(c.name || c.url)}</div>
        ${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener" class="so-url">${esc(c.url)}</a>` : ""}
        <div class="so-meta">${[c.audience && "👥 " + c.audience, c.tone && "🗣 " + c.tone, c.hashtags && "# " + c.hashtags].filter(Boolean).map(esc).join("<br>") || "Chưa ghi phong cách content"}</div>
        <div class="kho-act"><button data-a="edit">Sửa</button><button data-a="del" class="danger">Xoá</button></div></div>`).join("")}</div>`
      : ed ? "" : `<div class="kho-empty">Chưa có kênh nào. Bấm <b>＋ Thêm kênh</b> — ghi khách hàng mục tiêu, giọng văn, hashtag để AI viết content đúng chất kênh.</div>`}
    <div class="lich" id="lich"></div>`;
  renderLich();
  $("#soAdd") && ($("#soAdd").onclick = () => { S.social.edit = {}; renderSocial(); });
  if (ed) {
    $("#soCancel").onclick = () => { S.social.edit = null; renderSocial(); };
    $("#soSave").onclick = async () => {
      const r = await post("/api/social", { id: ed.id, platform: $("#soPlat").value, name: $("#soName").value, url: $("#soUrl").value,
        audience: $("#soAud").value, tone: $("#soTone").value, cta: $("#soCta").value, hashtags: $("#soTags").value });
      if (!r.ok) return toast(r.error || "Không lưu được.", true);
      S.social.data.channels = r.channels; S.social.edit = null; renderSocial(); toast("Đã lưu kênh.");
    };
  }
  sec.querySelectorAll(".so-card").forEach((card) => {
    const c = d.channels.find((x) => x.id === card.dataset.id);
    card.querySelector('[data-a="edit"]').onclick = () => { S.social.edit = { ...c }; renderSocial(); scrollTo(0, 0); };
    card.querySelector('[data-a="del"]').onclick = async () => {
      if (!confirm(`Xoá kênh “${c.name || c.platform}”?`)) return;
      const r = await (await fetch(`/api/social?id=${encodeURIComponent(c.id)}`, { method: "DELETE" })).json();
      if (r.ok) { S.social.data.channels = r.channels; renderSocial(); }
    };
  });
}
$("#navSocial").onclick = () => { show("vSocial"); loadSocial(); };
if (location.hash === "#social") { show("vSocial"); loadSocial(); }
// Phân tích kênh (gói Pro+): editor/ui/phan-tich.js
window.__toast = toast;
const openPhanTich = async () => { show("vPhanTich"); const m = await import("/ui/phan-tich.js"); m.closeReport(); m.loadPhanTich(); };
$("#navPhanTich").onclick = openPhanTich;
if (location.hash === "#phan-tich") openPhanTich();
// Tích hợp (gói Pro+): tài khoản Google Flow / Seedance / Kling… cho cảnh trám AI — editor/ui/tich-hop.js
const openTichHop = async () => { show("vConnections"); await (await import("/ui/contentos-connection-hub.js")).loadConnectionHub("browser"); };
$("#navTichHop").onclick = openTichHop;
$("#navGiong").onclick = async () => { show("vGiong"); (await import("/ui/giong.js")).loadGiong(); };
// Kết nối AI: trạng thái đăng nhập Claude / Codex — editor/ui/ket-noi-ai.js. Chấm đỏ ở menu khi chưa có AI nào dùng được
const openKetNoi = async () => { show("vConnections"); await (await import("/ui/contentos-connection-hub.js")).loadConnectionHub(location.hash.startsWith("#connections/")?location.hash.split("/")[1]:"ai"); };
$("#navKetNoi").onclick = openKetNoi;
if (location.hash === "#ket-noi-ai") openKetNoi();
setTimeout(async () => { try { (await import("/ui/ket-noi-ai.js")).kiemNen(); } catch {} }, 1500);
if (location.hash === "#tich-hop") openTichHop();
// Dọn dung lượng: đồng hồ ổ đĩa góc dưới menu trái (đỏ khi < 5 GB) → màn hình dọn — editor/ui/dung-luong.js
const openDungLuong = async () => { show("vDungLuong"); (await import("/ui/dung-luong.js")).loadDungLuong(); };
window.__refreshDisk = async () => (await import("/ui/dung-luong.js")).diskMeter($("#disk"), openDungLuong);
window.__reloadProjects = () => loadProjects();
window.__refreshDisk();
setInterval(() => window.__refreshDisk(), 120000);
if (location.hash === "#dung-luong") openDungLuong();

// Luôn chạy nền (tự chạy khi bật máy) — người dùng tự bật / tắt
(async () => {
  const sw = $("#bgRun");
  if (!sw) return;
  try { sw.checked = (await api("/api/chay-nen")).on; } catch {}
  sw.onchange = async () => {
    sw.disabled = true;
    const r = await post("/api/chay-nen", { on: sw.checked }).catch(() => ({ ok: false, error: "Không đổi được." }));
    sw.disabled = false;
    if (!r.ok) { sw.checked = !sw.checked; return toast(r.error || "Không đổi được.", true); }
    sw.checked = r.on;
    toast(r.on ? "Đã bật: phần mềm tự chạy khi bật máy, tắt cửa sổ AI vẫn mở được http://127.0.0.1:5173" : "Đã tắt chạy nền.");
  };
})();

$("#navContentOS").onclick = async () => { show("vContentOS"); (await import("/ui/contentos.js")).loadContentOS(); };

$('#navActivity').onclick=async()=>{show('vActivity');await (await import('/ui/contentos-activity.js')).loadActivity({onOpen:async dir=>{const project=S.projects.find(p=>p.dir===dir);if(project&&['waiting','working','error'].includes(project.ai))return waitAi(dir);await open(dir);}});};
async function openLibrary(tab){show("vLibrary");
await (await import('/ui/contentos-library-hub.js')).loadLibraryHub(tab,{loadEffects:loadKhoHome});}
$("#navSourceLibrary").onclick=()=>openLibrary(location.hash.startsWith('#library/')?location.hash.split('/')[1]:'templates');
$('#homeOpenLibrary').onclick=()=>$('#navSourceLibrary').click();

$("#homeIntake").onclick=async()=>{const {openIntake}=await import('/ui/contentos-intake.js');await openIntake({source:location.hash==="#mobile"?'phone':'nas',onProjectCreated:async result=>{await loadProjects();setupView(result.dir,{note:$('#homeNote').value});}});};
if(["#mobile","#sources"].includes(location.hash))$("#homeIntake").click();

$('#homeNews').onclick=async()=>{const {openNewsDesk}=await import('/ui/contentos-news.js');await openNewsDesk();};

await (await import('/ui/contentos-library-hub.js')).loadLibraryHub('templates',{loadEffects:loadKhoHome});
$('#navSkills').onclick=async()=>{show('vSkills');await (await import('/ui/contentos-skills.js')).loadSkillLibrary();};
homeNavigation=await mountHomeNavigation({show,onProjects:()=>loadProjects().then(renderProjectGrid),toast});
$("#homeNews").onclick=()=>$("#navNews").click();

