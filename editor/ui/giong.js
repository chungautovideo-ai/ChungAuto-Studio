// Giọng nói AI (gói Premium): kết nối ElevenLabs / Vbee bằng khoá API của người dùng, không cài gì trên máy.
import {renderFeaturePreview} from './contentos-feature-preview.js';
let host=null,request=fetch,onAttached=null,workspaceId=null,newsBrief=null,allowNarrationProject=false;
const $ = (s, r = host || document) => r.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const api = async (url, opts) => { const r = await request(url, {...opts,headers:{...opts?.headers,...(workspaceId?{'X-ContentOS-Workspace':workspaceId}:{})}}); const j = await r.json().catch(() => ({})); if (!r.ok || j.ok === false) throw new Error(j.error || "Không kết nối được phần mềm."); return j; };
const post = (url, body) => api(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
const toast = (t, err) => (window.__toast ? window.__toast(t, err) : alert(t));
const TEN = { elevenlabs: "ElevenLabs", vbee: "Vbee" };
const S = { d: null, ncc: "", giong: [], ma: "", text: "", ban: false, tab: "tao" };

export async function loadGiong(options) {
  if(options){host=options.host||null;request=options.request||fetch;onAttached=options.onAttached||null;workspaceId=null;S.giong=[];S.ma='';newsBrief=options.newsBrief||null;allowNarrationProject=options.allowNarrationProject===true;if(options.initialTab==='noi')S.tab='noi';if(options.initialText!==undefined){S.text=String(options.initialText);S.tab='tao';}}
  try { S.d = await api("/api/giong"); } catch(error) {
    const section=host||$('#vGiong');if(section){section.replaceChildren();const message=document.createElement('p');message.setAttribute('role','status');message.textContent=error.message;section.append(message);}return;
  }
  workspaceId=S.d.workspaceId||workspaceId;
  if(newsBrief&&newsBrief.workspaceId!==workspaceId){const section=host||$('#vGiong');section.textContent='Workspace đã đổi. Mở lại bản tin trước khi tạo giọng.';return;}
  if (S.d.allowed) {
    const co = Object.keys(TEN).filter((k) => S.d.ketNoi[k]);
    if (!S.ncc || (!co.includes(S.ncc) && co.length)) { S.ncc = co[0] || "elevenlabs"; S.giong = []; }
    if (S.tab!=='noi' && co.includes(S.ncc) && !S.giong.length) await taiGiong();
  }
  render();
}
async function taiGiong() {
  try { S.giong = (await api(`/api/giong/voices?ncc=${S.ncc}`)).giong; S.ma = S.giong.some((g) => g.ma === S.ma) ? S.ma : S.giong[0]?.ma || ""; }
  catch (e) { S.giong = []; toast(e.message, true); }
}
const HERO = `<div class="hero"><h1>Giọng nói AI</h1><p>Kết nối ElevenLabs hoặc Vbee bằng tài khoản của bạn để đọc nội dung, sao chép giọng. Không cần cài thêm gì.</p></div>`;
const O = `style="display:block;width:100%;margin-top:6px;padding:10px;border-radius:10px;background:#141416;color:#f5f5f6;border:1px solid #333"`;

function formKetNoi(d) {
  return `<div style="display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
    <form id="f11" style="display:grid;gap:8px"><b>ElevenLabs</b>${d.ketNoi.elevenlabs ? `<span class="muted">Đã kết nối ${esc(d.ketNoi.elevenlabs)} · <a href="#" data-bo="elevenlabs">Bỏ kết nối</a></span>` : `<span class="muted" style="font-size:13px">Lấy khoá ở elevenlabs.io → Developers → API Keys.</span><input name="key" type="password" autocomplete="off" placeholder="Dán API key" ${O}><button class="primary">Kết nối</button>`}</form>
    <form id="fvb" style="display:grid;gap:8px"><b>Vbee</b>${d.ketNoi.vbee ? `<span class="muted">Đã kết nối ${esc(d.ketNoi.vbee)} · <a href="#" data-bo="vbee">Bỏ kết nối</a></span>` : `<span class="muted" style="font-size:13px">Lấy App ID và Token ở studio.vbee.vn/apps.</span><input name="appId" autocomplete="off" placeholder="App ID" ${O}><input name="token" type="password" autocomplete="off" placeholder="Token" ${O}><button class="primary">Kết nối</button>`}</form></div>`;
}

const TAB = [["tao", "Tạo audio"], ["sao", "Sao chép giọng"], ["noi", "Kết nối"]];

function moTao(d, co) {
  return `<div style="display:grid;gap:12px">
    <label><b>Chọn kết nối</b><select id="gNcc" ${O}>${Object.keys(TEN).map((k) => `<option value="${k}" ${k === S.ncc ? "selected" : ""}>${TEN[k]}${d.ketNoi[k] ? "" : " (chưa kết nối)"}</option>`).join("")}</select></label>
    ${S.ncc && d.ketNoi[S.ncc] ? `<label><b>Giọng đọc</b><select id="gMa" ${O}>${S.giong.map((g) => `<option value="${esc(g.ma)}" ${g.ma === S.ma ? "selected" : ""}>${g.rieng ? "Của tôi: " : ""}${esc(g.ten)}</option>`).join("")}</select></label>`
      : `<div class="muted" style="font-size:14px">Chưa kết nối ${esc(TEN[S.ncc] || "dịch vụ nào")}. <a href="#" id="gToiNoi">Kết nối ngay</a></div>`}
    <label><b>Văn bản</b><textarea id="gText" rows="6" maxlength="5000" ${O} placeholder="Nhập nội dung cần đọc…">${esc(S.text)}</textarea></label>
    <div><button class="primary" id="gTao" ${S.ban || !co.includes(S.ncc) ? "disabled" : ""}>${S.ban ? "Đang tạo audio…" : "Tạo audio"}</button> <span class="muted" style="font-size:13px">${co.includes(S.ncc) ? `Tính vào tài khoản ${esc(TEN[S.ncc])} của bạn.` : ""}</span></div>
    ${d.kq.length ? `<div><b>Audio đã tạo</b>${d.kq.map((k) => `<div style="margin-top:10px;font-size:14px"><div class="muted">${esc(TEN[k.ncc] || "")}</div><div>${esc(k.text)}</div><audio controls preload="none" src="/api/giong/file?id=${k.id}" style="width:100%;margin-top:6px"></audio><a class="link-btn" href="/api/giong/file?id=${k.id}" download="audio-${k.id}.mp3">Tải về</a></div>`).join("")}</div>` : ""}
  </div>`;
}
function moSao(d) {
  if (!d.ketNoi.elevenlabs) return `<div class="muted" style="font-size:14px">Sao chép giọng dùng ElevenLabs. <a href="#" id="gToiNoi">Kết nối ElevenLabs</a> trước. Vbee chưa có API sao chép giọng, bạn tạo trong Vbee Studio rồi chọn ở mục Tạo audio.</div>`;
  return `<div><div class="muted" style="font-size:13px;margin-bottom:8px">Dùng 1–3 phút giọng rõ, một người nói, không nhạc. Giọng mẫu được gửi lên ElevenLabs. Gói ElevenLabs của bạn cần có tính năng Instant Voice Cloning.</div>
    <input id="gTen" placeholder="Tên giọng, ví dụ: Giọng của tôi" ${O}>
    <label style="display:flex;gap:8px;margin:8px 0;font-size:14px"><input type="checkbox" id="gDongY"><span>Tôi xác nhận đây là giọng của tôi, hoặc tôi đã được chính người đó cho phép sao chép.</span></label>
    <label class="drop" id="gDrop"><input type="file" id="gFile" accept="audio/*,video/*" hidden><span class="ic">⬆</span><b>Chọn file giọng mẫu</b></label></div>`;
}

function render() {
  const sec = host || $("#vGiong"), d = S.d;
  if(!sec)return;
  if (!d.allowed) {
    renderFeaturePreview(sec,'voice');return;
    sec.innerHTML = `${HERO}<div class="kho-empty">🔒 Tính năng dành cho gói <b>Premium</b>${d.account?.email ? ` (tài khoản ${esc(d.account.email)})` : ""}.<br><br><button class="primary" id="gUp">Nâng cấp gói</button></div>`;
    $("#gUp").onclick = () => window.__openUpgrade?.();
    return;
  }
  const co = Object.keys(TEN).filter((k) => d.ketNoi[k]);
  S.ncc = S.ncc || co[0] || "elevenlabs";
  sec.innerHTML = `${HERO}<div style="display:flex;gap:8px;margin-bottom:12px">${TAB.map(([k, t]) => `<button class="${S.tab === k ? "primary" : "link-btn"}" data-tab="${k}">${t}</button>`).join("")}</div>
    <div class="adm-box">${S.tab === "tao" ? moTao(d, co) : S.tab === "sao" ? moSao(d) : formKetNoi(d)}</div>`;
  if(newsBrief){const note=document.createElement('p');note.dataset.newsVoice='';note.setAttribute('role','status');sec.querySelector('.adm-box').before(note);const update=()=>{note.textContent=S.text.trim()===newsBrief.payload.script.trim()?'Lời đọc từ '+newsBrief.payload.title+' · v'+newsBrief.version+' đã duyệt. Chỉ tạo khi bấm Tạo audio.':'Lời đọc đã sửa; audio sẽ không mang xác nhận khớp kịch bản đã duyệt.';};update();const field=$('#gText');if(field)field.addEventListener('input',()=>{S.text=field.value;update();});}
  sec.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => { S.tab = b.dataset.tab; render(); }));
  const toi = $("#gToiNoi");
  if (toi) toi.onclick = (e) => { e.preventDefault(); S.tab = "noi"; render(); };
  if (S.tab === "noi") {
    for (const [id, ncc, keys] of [["f11", "elevenlabs", ["key"]], ["fvb", "vbee", ["appId", "token"]]]) {
      const f = $("#" + id);
      f.onsubmit = async (e) => {
        e.preventDefault();
        const b = { ncc }; keys.forEach((k) => (b[k] = f[k]?.value));
        try { const r = await post("/api/giong/ket-noi", b); S.ncc = ncc; S.giong = r.giong; S.ma = ""; S.tab = "tao"; toast("Đã kết nối " + TEN[ncc]); } catch (x) { return toast(x.message, true); }
        loadGiong();
      };
    }
    sec.querySelectorAll("[data-bo]").forEach((a) => (a.onclick = async (e) => { e.preventDefault(); await api(`/api/giong/ket-noi?ncc=${a.dataset.bo}`, { method: "DELETE" }).catch(() => {}); S.giong = []; loadGiong(); }));
  }
  if (S.tab === "tao") {
    if(allowNarrationProject&&newsBrief)for(const result of d.kq){
      const audio=sec.querySelector(`audio[src="/api/giong/file?id=${result.id}"]`);if(!audio)continue;
      const controls=document.createElement('div'),format=document.createElement('select'),button=document.createElement('button'),status=document.createElement('p');
      format.setAttribute('aria-label','Tỷ lệ dự án từ voice');format.append(new Option('Dọc 9:16','9:16'),new Option('Ngang 16:9','16:9'));
      button.textContent='Tạo dự án từ voice này';button.className='outline small';status.setAttribute('role','status');
      button.disabled=result.narration?.scriptId!==newsBrief.id||result.narration?.scriptHash!==newsBrief.hash;
      status.textContent=button.disabled?'Audio khác bản kịch bản đã chọn.':'Tạo nền trống theo thời lượng voice; mở Studio để thêm cảnh trám. Không tự xuất hoặc đăng.';
      button.onclick=async()=>{button.disabled=true;format.disabled=true;status.textContent='Đang tạo dự án local theo lời đọc…';try{
        const created=await post('/api/giong/new-project',{workspaceId,newsBriefId:newsBrief.id,voiceId:result.id,format:format.value});
        const link=document.createElement('button');link.textContent='Mở dự án trong Studio';link.onclick=async()=>{try{await post('/api/open',{dir:created.dir});location.href='/';}catch(error){status.textContent=error.message;}};
        status.textContent='Đã tạo dự án. Cần thêm hình ảnh/cảnh trám trước khi xuất.';controls.append(link);button.textContent='Đã tạo dự án';
      }catch(error){status.textContent=error.message;button.disabled=false;format.disabled=false;}};
      controls.append(format,button,status);audio.after(controls);
    }
    if(onAttached)for(const result of d.kq){
      const audio=sec.querySelector(`audio[src="/api/giong/file?id=${result.id}"]`);if(!audio)continue;
      const button=document.createElement('button');button.className='outline small';button.textContent='Đưa vào tư liệu dự án';
      if(newsBrief&&(result.narration?.scriptId!==newsBrief.id||result.narration?.scriptHash!==newsBrief.hash)){button.disabled=true;button.textContent='Audio khác bản kịch bản đã chọn';}
      button.onclick=async()=>{button.disabled=true;try{const attached=await post('/api/giong/attach',{id:result.id,...(newsBrief?{expectedNewsId:newsBrief.id}:{})});await onAttached(attached.asset,attached.voice);button.textContent='Đã nhận vào dự án';}catch(error){toast(error.message,true);button.disabled=false;}};audio.after(button);
    }
    $("#gNcc").onchange = async (e) => { S.ncc = e.target.value; S.giong = []; if (S.d.ketNoi[S.ncc]) await taiGiong(); render(); };
    const m = $("#gMa");
    if (m) m.onchange = (e) => (S.ma = e.target.value);
    $("#gText").oninput = (e) => (S.text = e.target.value);
    $("#gTao").onclick = async () => {
      S.text = $("#gText").value;
      if (!S.text.trim()) return toast("Nhập văn bản trước.", true);
      if(S.text.trim().length>5000)return toast('Lời đọc vượt 5.000 ký tự; chia kịch bản trước khi tạo audio.',true);
      S.ma = $("#gMa")?.value || S.ma; S.ban = true; render();
      try { await post("/api/giong/tao", { ncc: S.ncc, ma: S.ma, text: S.text,...(newsBrief&&S.text.trim()===newsBrief.payload.script.trim()?{newsBriefId:newsBrief.id,newsBriefHash:newsBrief.hash}:{}) }); } catch (x) { toast(x.message, true); }
      S.ban = false; loadGiong();
    };
  }
  const file = $("#gFile");
  if (file) {
    file.onclick = (e) => { if (!$("#gDongY").checked) { e.preventDefault(); toast("Hãy tick xác nhận quyền dùng giọng trước.", true); } };
    file.onchange = async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      $("#gDrop b").textContent = "Đang gửi lên ElevenLabs…";
      try { const r = await api(`/api/giong/sao-chep?ten=${encodeURIComponent($("#gTen").value || f.name.replace(/\.[^.]+$/, ""))}&dongY=1`, { method: "POST", body: f }); S.ncc = "elevenlabs"; S.ma = r.ma; S.giong = []; S.tab = "tao"; toast("Đã tạo giọng của bạn"); } catch (x) { toast(x.message, true); }
      loadGiong();
    };
  }
}

export async function openVoiceTool(options={}){
 const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','Giọng nói AI');dialog.style.cssText='width:min(850px,94vw);max-height:88vh;overflow:auto;background:var(--surface,#131315);color:var(--ink,#fff);border:1px solid #444;border-radius:16px;padding:20px';
 const close=document.createElement('button');close.textContent='Đóng giọng nói AI';close.onclick=()=>dialog.close();
 const section=document.createElement('section');dialog.append(close,section);document.body.append(dialog);dialog.showModal();
 dialog.addEventListener('close',()=>{dialog.remove();if(host!==section)return;host=null;request=fetch;onAttached=null;workspaceId=null;newsBrief=null;allowNarrationProject=false;},{once:true});
 await loadGiong({...options,host:section});
}
