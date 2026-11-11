const TABS=[['ai','AI dựng'],['capcut','CapCut · Học phong cách'],['images','Ảnh AI'],['voice','Giọng nói'],['telegram','Telegram'],['browser','Công cụ trình duyệt']];
// Bot Telegram nhận video khách: nhập token ở đây (mã hoá trên máy này, không hiện lại)
async function loadTelegram(section,token){
 section.replaceChildren();section.innerHTML='<h2>Bot Telegram · nhận video khách</h2><p>Khách gửi video gốc cho bot → ContentOS dựng theo mẫu → tự gửi bản xong lại cho khách. Token lấy từ @BotFather; lưu mã hoá trên máy + tài khoản Windows này (máy chạy bot), không gửi về trình duyệt, không ghi vào code.</p><p data-tg-status role="status">Đang đọc trạng thái…</p><label>Token bot<input data-tg-token type="password" autocomplete="new-password" spellcheck="false" placeholder="123456789:ABC…"></label><p><button class="primary" data-tg-save type="button">Lưu và kiểm tra token</button> <button class="outline" data-tg-delete type="button">Xóa token</button></p><p class="help">Token lộ ra ngoài (dán vào chat, gửi tin nhắn) thì vào @BotFather gõ /revoke để lấy token mới rồi nhập lại ở đây.</p>';
 const $=s=>section.querySelector(s),status=$('[data-tg-status]');let workspaceId;
 const show=d=>{workspaceId=d.workspaceId;status.textContent=d.hasToken?`Đã kết nối bot @${d.bot?.username||'?'} (${d.bot?.name||''}) · ${d.secretProtection} · lưu lúc ${new Date(d.updatedAt).toLocaleString('vi-VN')}`:`Chưa có token. ${d.secretProtection}`;};
 const call=async(method,body)=>{const r=await fetch('/api/v1/connections/telegram',{method,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Không lưu được.');return d;};
 $('[data-tg-save]').onclick=async()=>{const b=$('[data-tg-save]');b.disabled=true;status.textContent='Đang hỏi Telegram kiểm tra token…';try{show(await call('POST',{workspaceId,token:$('[data-tg-token]').value}));$('[data-tg-token]').value='';}catch(e){status.textContent=e.message;}finally{b.disabled=false;}};
 $('[data-tg-delete]').onclick=async()=>{if(!confirm('Xóa token bot Telegram trên máy này? Bot sẽ ngừng nhận video.'))return;try{show(await call('DELETE',{workspaceId}));}catch(e){status.textContent=e.message;}};
 try{const d=await call('GET');if(token===epoch)show(d);}catch(e){status.textContent=e.message;}
}
let epoch=0;
export async function loadConnectionHub(tab='ai'){
 const host=document.getElementById('vConnections');if(!TABS.some(([id])=>id===tab))tab='ai';
 const token=++epoch;
 if(!host.querySelector('[data-connection-tabs]')){
  const oldAi=document.getElementById('vKetNoi'),oldBrowser=document.getElementById('vTichHop');
  host.innerHTML='<h1>Kết nối</h1><p>Quản lý kết nối dùng chung cho Home, Space và Studio. Gateway ảnh/API theo workspace; đăng nhập CLI theo máy.</p><nav data-connection-tabs aria-label="Loại kết nối"></nav><div data-connection-content></div>';
  const tabs=host.querySelector('[data-connection-tabs]');
  for(const [id,name] of TABS){const button=document.createElement('button');button.type='button';button.dataset.connectionTab=id;button.textContent=name;button.onclick=()=>{if(location.hash!=='#connections/'+id)history.pushState(null,'','#connections/'+id);loadConnectionHub(id);};tabs.append(button);}
  const content=host.querySelector('[data-connection-content]');content.append(oldAi,oldBrowser);
  for(const id of ['capcut','images','voice','telegram']){const section=document.createElement('section');section.dataset.connectionPanel=id;content.append(section);}
 }
 for(const button of host.querySelectorAll('[data-connection-tab]')){button.classList.toggle('primary',button.dataset.connectionTab===tab);button.setAttribute('aria-pressed',String(button.dataset.connectionTab===tab));}
 const ai=document.getElementById('vKetNoi'),browser=document.getElementById('vTichHop');ai.hidden=tab!=='ai';browser.hidden=tab!=='browser';
 for(const section of host.querySelectorAll('[data-connection-panel]'))section.hidden=section.dataset.connectionPanel!==tab;
 if(tab==='ai'){const module=await import('/ui/ket-noi-ai.js');if(token===epoch)await module.loadKetNoi();return;}
 if(tab==='browser'){const module=await import('/ui/tich-hop.js');if(token===epoch)await module.loadTichHop();return;}
 if(tab==='capcut'){const module=await import('/ui/contentos-capcut-style.js');if(token===epoch)await module.loadCapcutStyle(host.querySelector('[data-connection-panel="capcut"]'));return;}
 if(tab==='telegram')return loadTelegram(host.querySelector('[data-connection-panel="telegram"]'),token);
 const section=host.querySelector(`[data-connection-panel="${tab}"]`);section.replaceChildren();
 const title=document.createElement('h2');title.textContent=tab==='images'?'Gateway tạo ảnh':'ElevenLabs / Vbee';
 const text=document.createElement('p');text.textContent=tab==='images'?'Chung kết nối với Tạo ảnh AI, cảnh trám và ảnh bìa. Mở cấu hình không tạo ảnh.':'Dùng kết nối giọng nói hiện có. Mở cấu hình không tạo audio; khả dụng được kiểm tra bởi dịch vụ giọng nói.';
 const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Đang đọc trạng thái…';
 const button=document.createElement('button');button.className='outline';button.textContent='Mở cấu hình '+(tab==='images'?'ảnh AI':'giọng nói');button.dataset.hubConfigure=tab;
 button.onclick=async()=>{try{if(tab==='images'){const m=await import('/ui/contentos-connections.js');await m.openImageConnection({onSaved:()=>{if(!host.hidden)loadConnectionHub(tab);}});}else{const m=await import('/ui/giong.js');await m.openVoiceTool({initialTab:'noi'});}}catch(e){status.textContent=e.message;}};
 section.append(title,text,status,button);
 try{const response=await fetch(tab==='images'?'/api/v1/connections/image':'/api/giong');const data=await response.json();if(!response.ok)throw new Error(data.error||'Không đọc được trạng thái');if(token!==epoch)return;
  status.textContent=tab==='images'?`${data.hasKey?'Đã lưu khóa':'Chưa có khóa'} · Model: ${data.model||'chưa chọn'}. Trạng thái lưu cấu hình chưa xác minh provider hoạt động.`:data.allowed?`ElevenLabs: ${data.ketNoi?.elevenlabs?'đã kết nối':'chưa kết nối'} · Vbee: ${data.ketNoi?.vbee?'đã kết nối':'chưa kết nối'}`:'Module giọng nói hiện chưa có quyền thực thi; mở cấu hình sẽ hiển thị trạng thái khả dụng hiện tại.';
 }catch(e){if(token===epoch)status.textContent=e.message;}
}
