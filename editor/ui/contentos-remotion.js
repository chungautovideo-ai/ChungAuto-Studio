export function sceneFromRemotionProps(props){
 return {title:props.title,subtitle:props.subtitle??'',duration:props.durationInFrames/props.fps,background:props.background,color:props.color,accent:props.accent};
}
export async function openRemotionScene({request=fetch,validate=()=>{},onAdd,initialScene=null}={}){
 const dialog=document.createElement('dialog');dialog.style.cssText='width:min(680px,94vw);max-height:88vh;overflow:auto;background:#161616;color:white;border:1px solid #333;border-radius:18px;padding:24px';
 dialog.innerHTML='<h2>Cảnh chữ chuyển động</h2><p>Remotion · tạo cảnh React, xem trước rồi thêm vào dự án. Tham số được giữ cùng file để dựng lại. Đóng hộp này vẫn tiếp tục tạo cảnh; mở lại để theo dõi.</p><form><label>Tiêu đề<textarea data-title maxlength="300" required rows="2"></textarea></label><label>Dòng phụ<textarea data-subtitle maxlength="600" rows="2"></textarea></label><label>Thời lượng (giây)<input data-duration type="number" min="0.5" max="30" step="0.1" value="3" required></label><div style="display:flex;gap:16px"><label>Nền<input data-background type="color" value="#101014"></label><label>Chữ<input data-color type="color" value="#ffffff"></label><label>Nhấn<input data-accent type="color" value="#d3f53c"></label></div><button type="submit" class="primary">Tạo bản xem trước</button></form><p data-state role="status"></p><video data-preview controls playsinline hidden style="width:100%;max-height:38vh"></video><div style="display:flex;gap:12px;margin-top:16px"><button data-add class="primary" hidden>Thêm vào timeline</button><button data-cancel class="outline" hidden>Hủy tạo cảnh</button><button data-close class="outline">Đóng</button></div>';
 document.body.append(dialog);dialog.showModal();const get=s=>dialog.querySelector(s);let current=null,result=null,timer,closed=false;
 if(initialScene){
  for(const field of ['title','subtitle','duration','background','color','accent'])if(initialScene[field]!=null)get('[data-'+field+']').value=initialScene[field];
  get('h2').textContent='Sửa cảnh chữ chuyển động';get('[data-add]').textContent='Thay cảnh trên timeline';
 }
 get('[data-preview]').onloadedmetadata=()=>{const video=get('[data-preview]');video.currentTime=Math.min(0.5,video.duration/2);};
 for(const input of dialog.querySelectorAll('input[type=color]'))input.style.cssText='width:64px;height:36px;padding:2px';
 get('[data-add]').parentElement.style.cssText+=';position:sticky;bottom:0;background:#161616;padding:12px 0';
 const call=async(url,options)=>{const response=await request(url,options),value=await response.json();if(!response.ok)throw new Error(value.error||'Không thực hiện được.');return value;};
 const busy=value=>{for(const field of dialog.querySelectorAll('form textarea,form input,form button'))field.disabled=value;get('[data-cancel]').hidden=!value;};
 const show=state=>{get('[data-state]').textContent=state;};
 const invalidate=()=>{result=null;get('[data-add]').hidden=true;get('[data-preview]').hidden=true;};get('form').oninput=invalidate;
 const poll=async()=>{try{validate();const job=await call('/api/remotion-scenes/'+current.id);if(closed)return;current=job;show(job.phase||job.error||job.status);if(job.status==='succeeded'){busy(false);validate();result=job.result;get('[data-preview]').src='/p/'+result.path;get('[data-preview]').hidden=false;get('[data-add]').hidden=false;return;}if(['failed','cancelled','interrupted'].includes(job.status)){busy(false);show(job.error||'Đã hủy.');return;}timer=setTimeout(poll,800);}catch(error){if(!closed){busy(false);show(error.message);}}};
 get('form').onsubmit=async event=>{event.preventDefault();if(get('form button').disabled)return;try{validate();invalidate();busy(true);show('Đang giao worker tạo cảnh…');current=await call('/api/remotion-scenes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scene:{title:get('[data-title]').value,subtitle:get('[data-subtitle]').value,duration:Number(get('[data-duration]').value),background:get('[data-background]').value,color:get('[data-color]').value,accent:get('[data-accent]').value}})});if(!closed)poll();}catch(error){if(!closed){busy(false);show(error.message);}}};
 get('[data-cancel]').onclick=async()=>{try{current=await call('/api/remotion-scenes/'+current.id,{method:'DELETE'});show('Đang chờ worker xác nhận dừng…');}catch(error){show(error.message);}};
 get('[data-add]').onclick=()=>{try{validate();if(!result)return;onAdd?.(result);dialog.close();}catch(error){show(error.message);}};
 get('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{closed=true;clearTimeout(timer);get('[data-preview]').pause();dialog.remove();},{once:true});
 // Editing an existing scene must not attach an unrelated in-flight preview.
 // A conflicting project worker is reported by POST before rendering starts.
 if(initialScene)return;
 busy(true);
 try{validate();const state=await call('/api/remotion-scenes');if(!closed&&state.job&&['running','cancelling'].includes(state.job.status)){current=state.job;poll();}else if(!closed){busy(false);if(state.job?.status==='interrupted')show(state.job.error);}}catch(error){if(!closed){busy(false);show(error.message);}} 

}
