const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let current=null,timer=null,generation=0;
async function api(path,body,method='POST'){
  const r=await fetch('/api/v1/mobile/'+path,body===undefined?{method:'GET'}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw new Error(j.error);return j;
}
export async function leaveMobile(){generation++;clearInterval(timer);timer=null;if(current){const id=current;current=null;try{await api('sessions/'+id,{},'DELETE');}catch{}}}
export async function loadMobile({host=document.querySelector('#vMobile'),dir,onReceived}={}){
  await leaveMobile();const loadGeneration=generation;
  host.innerHTML='<h1>Gửi tư liệu từ điện thoại</h1><p>Đang đọc dự án…</p>';
  try{
    const r=await fetch('/api/projects');const j=await r.json();if(loadGeneration!==generation||!host.isConnected)return;
    host.innerHTML=`<h1>Gửi tư liệu từ điện thoại</h1><p>Cùng WiFi/LAN với máy dựng. Mỗi QR chỉ gửi vào một dự án trong workspace này.</p><label>Dự án nhận source<select id="mobileProject">${j.projects.map(p=>`<option value="${esc(p.dir)}" ${p.current?'selected':''}>${esc(p.title)}</option>`).join('')}</select></label><p>Chưa có dự án: thêm video ở Trang chủ trước. Upload nhận thêm footage/ảnh/âm thanh cho dự án đó.</p><button class="primary" id="mobileCreate" ${j.projects.length?'':'disabled'}>Tạo QR kết nối điện thoại</button> <button id="mobileRevoke" hidden>Ngắt kết nối / thu hồi link</button><p id="mobileStatus" role="status"></p><div id="mobileQR"></div><ul id="mobileFiles"></ul><p>100% tải lên chưa có nghĩa file đã dùng được: máy sẽ kiểm media trước khi báo nhận. Tối đa 2 GiB/file; chưa có resume khi mạng ngắt. Link chỉ nhận upload, không điều khiển AI/editor. Internet/tunnel chưa tích hợp.</p>`;
    const picker=host.querySelector('#mobileProject');
    if(dir){if(!j.projects.some(p=>p.dir===dir)){host.textContent='Dự án không thuộc workspace đang dùng. Hãy chọn đúng workspace trước.';return;}picker.value=dir;picker.disabled=true;}
    const seen=new Set();
    const status=host.querySelector('#mobileStatus');const files=host.querySelector('#mobileFiles');const qr=host.querySelector('#mobileQR');const revoke=host.querySelector('#mobileRevoke');
    const history=document.createElement('section');history.innerHTML='<h3>Tư liệu điện thoại đã nhận</h3><p>Trạng thái tồn tại/dung lượng; chưa xác minh lại toàn bộ nội dung file.</p><button data-refresh>Làm mới lịch sử nhận</button><ul data-files></ul>';host.append(history);
    let historyGeneration=0;
    const refreshHistory=async()=>{const request=++historyGeneration,selected=picker.value;try{const result=await api('history?dir='+encodeURIComponent(selected));if(!host.isConnected||request!==historyGeneration||picker.value!==selected)return;const list=history.querySelector('[data-files]');list.replaceChildren();for(const file of result.files){const row=document.createElement('li');row.textContent=`${file.name} · ${Math.ceil(file.bytes/1024)} KiB · ${{present:'có trong dự án',missing:'không tìm thấy file',changed:'file hoặc dung lượng đã thay đổi'}[file.state]||'chưa kiểm tra'} · ${file.receivedAt||''}`;const verify=document.createElement('button');verify.textContent='Kiểm tra nội dung';verify.disabled=file.state!=='present';verify.onclick=async()=>{verify.disabled=true;const note=document.createElement('span');note.textContent=' · Đang đọc và kiểm mã source…';row.append(note);try{await api('verify',{dir:selected,id:file.id});if(history.isConnected&&request===historyGeneration&&picker.value===selected)note.textContent=' · Nội dung khớp mã lúc nhận';}catch(error){if(history.isConnected)note.textContent=' · '+error.message;}finally{if(history.isConnected)verify.disabled=false;}};row.append(verify);list.append(row);}if(!result.files.length)list.textContent='Chưa nhận tư liệu từ điện thoại.';}catch(error){if(request===historyGeneration)history.querySelector('[data-files]').textContent=error.message;}};
    history.querySelector('[data-refresh]').onclick=refreshHistory;picker.onchange=async()=>{await leaveMobile();qr.replaceChildren();files.replaceChildren();revoke.hidden=true;await refreshHistory();};await refreshHistory();
    revoke.onclick=async()=>{await leaveMobile();qr.replaceChildren();files.replaceChildren();revoke.hidden=true;status.textContent='Đã thu hồi phiên. Điện thoại cần QR mới để gửi tiếp.';};
    host.querySelector('#mobileCreate').onclick=async()=>{
      try{
        await leaveMobile();const requestGeneration=generation;const s=await api('sessions',{dir:host.querySelector('#mobileProject').value});
        if(requestGeneration!==generation){await api('sessions/'+s.id,{},'DELETE');return;}current=s.id;
        qr.innerHTML=`<img alt="QR gửi tư liệu vào dự án" src="${s.qr}" width="280" height="280"><p>Hết hạn: ${esc(new Date(s.expiresAt).toLocaleString())}</p>${s.links.map(l=>`<p><a href="${esc(l.url)}" target="_blank" rel="noreferrer">Mở trang gửi tư liệu · ${esc(l.address)}</a></p>`).join('')}`;
        status.textContent=s.lanAvailable?'Quét QR bằng điện thoại cùng WiFi. Nếu không kết nối được, kiểm tra mạng và tường lửa cho cổng 5181.':'Không tìm thấy IP LAN; hiện chỉ có thể kiểm tra trên máy này.';
        revoke.hidden=false;
        let polling=false;const poll=async()=>{const id=current;if(!id||polling)return;polling=true;try{const state=await api('sessions/'+id);if(current!==id)return;let received=false;for(const file of state.files){if(!seen.has(file.id)){if(onReceived)await onReceived(file);seen.add(file.id);received=true;}}files.innerHTML=state.files.map(f=>`<li>${esc(f.name)} · ${Math.ceil(f.bytes/1024)} KiB · đã nhận</li>`).join('');if(received)await refreshHistory();}catch(e){if(current===id){clearInterval(timer);timer=null;current=null;qr.replaceChildren();status.textContent=e.message;}}finally{polling=false;}};
        timer=setInterval(poll,2000);await poll();
      }catch(e){status.textContent=e.message;}
    };
  }catch(e){host.textContent='Không mở được kết nối điện thoại: '+e.message;}
}
window.addEventListener('pagehide',()=>{clearInterval(timer);if(current)fetch('/api/v1/mobile/sessions/'+current,{method:'DELETE',keepalive:true}).catch(()=>{});});
