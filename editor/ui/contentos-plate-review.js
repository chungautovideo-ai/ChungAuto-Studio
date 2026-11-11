export async function openPlateReviewDialog({request=fetch,validate=()=>{},mediaUrl}={}){
 const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','Kiểm tra bản che biển số');
 dialog.style.cssText='width:min(760px,94vw);max-height:90dvh;overflow:auto;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:16px;padding:24px';
 dialog.innerHTML='<h2>Kiểm tra bản che biển số</h2><p>Xem hết từng đoạn bên dưới và kiểm vị trí che trong bản dựng. Xác nhận chỉ áp dụng cho phiên bản đang lưu; thay đổi bản dựng sẽ cần kiểm lại.</p><p>Danh sách chỉ gồm những đoạn đã dùng công cụ che, không tự phát hiện biển khác trong video.</p><p data-status role="status">Đang đọc bản dựng…</p><div data-items></div><label style="display:flex;gap:12px;align-items:flex-start;margin:16px 0"><input type="checkbox" data-confirm style="width:auto;flex-shrink:0">Tôi đã xem toàn bộ các đoạn che và kiểm tra chúng trong bố cục bản dựng này.</label><div style="display:flex;gap:12px;flex-wrap:wrap;position:sticky;bottom:-24px;background:var(--surface);padding:12px 0"><button class="primary" data-save disabled>Lưu xác nhận kiểm tra</button><button class="outline" data-close>Đóng</button></div>';
 document.body.append(dialog);dialog.showModal();const q=s=>dialog.querySelector(s),controller=new AbortController();let ready=false,busy=false;
 const sync=()=>q('[data-save]').disabled=!ready||busy||!q('[data-confirm]').checked;
 q('[data-confirm]').onchange=sync;q('[data-close]').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{controller.abort();for(const v of dialog.querySelectorAll('video')){v.pause();v.removeAttribute('src');v.load();}dialog.remove();});
 try{validate();const response=await request('/api/plate-review',{signal:controller.signal}),data=await response.json();if(!response.ok)throw new Error(data.error||'Không đọc được trạng thái kiểm tra.');validate();
  for(const item of data.items){
   const section=document.createElement('section'),title=document.createElement('p'),video=document.createElement('video'),replay=document.createElement('button');
   const from=Number(item.from),duration=Number(item.duration),end=from+duration,valid=Number.isFinite(from)&&from>=0&&Number.isFinite(duration)&&duration>0;
   title.textContent=(item.group==='segments'?'Video':'Cảnh trám')+' · '+item.id+' · '+(valid?`${from.toFixed(2)}–${end.toFixed(2)} giây nguồn · ${duration.toFixed(2)} giây`:'Khoảng nguồn không hợp lệ');
   video.controls=true;video.playsInline=true;video.preload='none';video.style.cssText='width:100%;max-height:34vh;background:var(--bg)';video.src=mediaUrl(item.src);
   replay.className='outline';replay.textContent='Xem lại đoạn này';replay.disabled=!valid;
   const fail=()=>{ready=false;sync();replay.disabled=true;q('[data-status]').textContent='Không phát được đúng khoảng bản che; chưa lưu xác nhận. Kiểm tra codec hoặc tạo lại.';};
   video.onloadedmetadata=()=>{if(!valid||!Number.isFinite(video.duration)||end>video.duration+.05){fail();return;}video.currentTime=from;};
   video.onplay=()=>{for(const other of dialog.querySelectorAll('video'))if(other!==video)other.pause();if(!valid){video.pause();fail();return;}if(video.currentTime<from||video.currentTime>=end)video.currentTime=from;};
   video.ontimeupdate=()=>{if(valid&&video.currentTime>=end){video.pause();if(video.currentTime>end+.05)video.currentTime=Math.min(end,video.duration);}};
   video.onerror=fail;
   replay.onclick=async()=>{try{validate();if(video.readyState<1){video.preload='metadata';video.load();}else video.currentTime=from;await video.play();}catch(error){if(!controller.signal.aborted&&!(error.name==='AbortError'&&video.paused))q('[data-status]').textContent='Không phát được đoạn: '+error.message;}};
   section.append(title,video,replay);q('[data-items]').append(section);
  }
  ready=data.required&&!data.items.some(item=>!item.sha256||!Number.isFinite(Number(item.from))||Number(item.from)<0||!Number.isFinite(Number(item.duration))||Number(item.duration)<=0);q('[data-status]').textContent=data.approved?'Phiên bản này đã có xác nhận kiểm tra.':data.reason||(data.required?'Chọn Xem lại đoạn này để kiểm từng khoảng trước khi xác nhận.':'Chưa có đoạn che cần kiểm tra.');sync();
 }catch(error){if(!controller.signal.aborted)q('[data-status]').textContent=error.message;}
 q('[data-save]').onclick=async()=>{if(!ready||busy||!q('[data-confirm]').checked)return;busy=true;sync();try{validate();const response=await request('/api/plate-review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({confirmed:true}),signal:controller.signal}),data=await response.json();if(!response.ok)throw new Error(data.error||'Không lưu được xác nhận.');validate();q('[data-status]').textContent='Đã lưu xác nhận cho phiên bản này. Lần tự xuất tiếp theo sẽ kiểm lại phiên bản và file che. Không tự xuất hoặc đăng bài từ thao tác này.';q('[data-confirm]').checked=false;}catch(error){if(!controller.signal.aborted)q('[data-status]').textContent=error.message;}finally{busy=false;if(dialog.isConnected)sync();}};
}
