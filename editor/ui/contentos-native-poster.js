// Local React compositions; opening the dialog never starts a render.
export async function openNativePoster({request=(...args)=>fetch(...args),initial={},onSaved=()=>{}}={}){
 const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','Poster / Thumbnail');
 dialog.style.cssText='width:min(760px,94vw);max-height:88vh;overflow:auto;background:var(--surface,#161619);color:var(--ink,#fff);border:1px solid #444;border-radius:16px;padding:24px';
 dialog.innerHTML=`<h2>Poster / Thumbnail</h2><p>Dựng bằng composition React trên máy, lưu vào Thư viện ảnh. Bản cũ được giữ khi sửa. Không gọi AI tạo ảnh.</p>
 <form style="display:grid;gap:12px"><label>Loại <select name="kind"><option value="poster">Poster</option><option value="thumbnail">Thumbnail</option></select></label>
 <label>Tỷ lệ <select name="aspect">${['9:16','16:9','1:1','4:5'].map(v=>`<option>${v}</option>`).join('')}</select></label>
 <label>Tiêu đề <textarea name="title" maxlength="300" rows="2"></textarea></label><label>Thương hiệu <input name="brandName" maxlength="100"></label>
 <label>Ảnh nền <select name="backgroundId"></select></label><label data-frame>Khung ảnh riêng <select name="frameId"></select></label><label>Logo <select name="logoId"></select></label>
 <fieldset data-poster><legend>Nội dung Poster</legend><label>Phụ đề <textarea name="subtitle" maxlength="600"></textarea></label><label>Lời kêu gọi <input name="cta" maxlength="200"></label>
 <label>Vị trí chữ <select name="position"><option value="auto">Tự động</option>${['top','middle','bottom'].flatMap((y,i)=>['left','center','right'].map((x,j)=>`<option value="${y}-${x}">${['Trên','Giữa','Dưới'][i]} · ${['Trái','Giữa','Phải'][j]}</option>`)).join('')}</select></label>
 <label>Chỉ số (mỗi dòng: nhãn | giá trị, tối đa 12 dòng)<textarea name="stats" rows="3" placeholder="Bảo hành | 24 tháng"></textarea></label></fieldset>
 <details><summary>Màu sắc và hiệu ứng</summary><div data-colors style="display:flex;flex-wrap:wrap;gap:14px"></div><label><input name="gradient" type="checkbox" checked> Màu chuyển sắc</label><label><input name="liquidGlass" type="checkbox" checked> Hiệu ứng kính</label></details>
 <p data-state role="status"></p><img data-preview hidden alt="Ảnh vừa dựng" style="max-width:100%;max-height:340px;object-fit:contain">
 <div><button type="submit">Tạo ảnh vào thư viện</button> <button type="button" data-cancel hidden>Hủy tạo ảnh</button> <button type="button" data-check hidden>Kiểm tra lại</button> <button type="button" data-close>Đóng</button></div></form>`;
 document.body.append(dialog);dialog.showModal();const form=dialog.querySelector('form'),field=name=>form.elements.namedItem(name),state=dialog.querySelector('[data-state]');let workspaceId,task=null,timer=null,busy=false,frozen=null;
 const call=async(url,body)=>{const response=await request(url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}),result=await response.json();if(!response.ok)throw new Error(result.error||'Không thực hiện được.');return result;};
 const colors={primary:['Màu chính','#d3f53c'],secondary:['Màu phụ','#ffffff'],background:['Nền','#101014'],text:['Chữ','#ffffff'],accent:['Nhấn','#d3f53c']};
 for(const [key,[label,value]] of Object.entries(colors)){const wrap=document.createElement('label');wrap.textContent=label+' ';const input=document.createElement('input');input.type='color';input.name=key;input.value=initial.colors?.[key]||value;wrap.append(input);dialog.querySelector('[data-colors]').append(wrap);}
 for(const key of ['kind','aspect','title','brandName','subtitle','cta','position'])if(initial[key]!=null)field(key).value=initial[key];
 field('stats').value=(initial.stats||[]).map(s=>s.label+' | '+s.value).join('\n');for(const key of ['gradient','liquidGlass'])field(key).checked=initial[key]!==false;
 const mode=()=>{const poster=field('kind').value==='poster';dialog.querySelector('[data-poster]').hidden=!poster;dialog.querySelector('[data-frame]').hidden=poster;};field('kind').onchange=mode;mode();
 function lock(value){busy=value;for(const element of form.elements)if(!element.matches('[data-close],[data-cancel],[data-check]'))element.disabled=value;dialog.querySelector('[data-cancel]').hidden=!value||!task||!['queued','running'].includes(task.status);}
 async function inspect(){
  clearTimeout(timer);if(!dialog.isConnected||!task)return;
  try{const result=await call('/api/v1/tasks');if(result.workspaceId!==workspaceId)throw new Error('Workspace đã đổi. Mở lại thư viện.');task=result.tasks.find(t=>t.id===task.id);if(!task)throw new Error('Không tìm thấy lượt tạo ảnh.');
   if(task.status==='succeeded'){state.textContent='Đã lưu ảnh. Bạn có thể dùng ảnh từ thư viện.';const preview=dialog.querySelector('[data-preview]');preview.src='/api/v1/images/'+task.result.imageId+'/file';preview.hidden=false;frozen=null;lock(false);await onSaved();}
   else if(['failed','cancelled'].includes(task.status)){state.textContent=task.error||'Đã hủy lượt tạo ảnh.';frozen=null;lock(false);}
   else if(task.status==='interrupted'){state.textContent='Lượt cũ bị gián đoạn; chưa xác minh worker. Kiểm tra trong Hoạt động trước khi tạo lượt mới.';lock(true);}
   else{state.textContent=task.checkpoint?.phase||'Đang chuẩn bị hoặc chờ tài nguyên render…';lock(true);timer=setTimeout(inspect,1500);}
   dialog.querySelector('[data-check]').hidden=true;
  }catch(error){state.textContent=error.message+' Chưa gửi lại yêu cầu tạo ảnh.';dialog.querySelector('[data-check]').hidden=false;}
 }
 dialog.querySelector('[data-check]').onclick=()=>task?inspect():submit();
 dialog.querySelector('[data-cancel]').onclick=async()=>{try{await call('/api/v1/tasks/'+task.id+'/cancel',{});await inspect();}catch(error){state.textContent=error.message;}};
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{clearTimeout(timer);dialog.remove();});
 async function submit(){
  if(busy&&!frozen)return;
  try{
   if(!frozen){const poster=field('kind').value==='poster';const stats=poster?field('stats').value.split('\n').filter(s=>s.trim()).map(line=>{const index=line.indexOf('|');if(index<0)throw new Error('Chỉ số cần dạng nhãn | giá trị.');return {label:line.slice(0,index).trim(),value:line.slice(index+1).trim()};}):[];
    const input={kind:field('kind').value,aspect:field('aspect').value,title:field('title').value,brandName:field('brandName').value,backgroundId:field('backgroundId').value||null,logoId:field('logoId').value||null,frameId:poster?null:field('frameId').value||null,subtitle:poster?field('subtitle').value:'',cta:poster?field('cta').value:'',stats,position:poster?field('position').value:'auto',gradient:field('gradient').checked,liquidGlass:field('liquidGlass').checked,colors:Object.fromEntries(Object.keys(colors).map(k=>[k,field(k).value]))};
    frozen={workspaceId,input,idempotencyKey:crypto.randomUUID()};
   }
   lock(true);state.textContent='Đang gửi lượt tạo ảnh…';const result=await call('/api/v1/images/compose',frozen);task=result.task||result;await inspect();
  }catch(error){state.textContent=error.message+' Kiểm tra lại dùng cùng yêu cầu, không tạo lượt trùng.';dialog.querySelector('[data-check]').hidden=false;}
 }
 form.onsubmit=event=>{event.preventDefault();if(!busy)submit();};
 try{const catalog=await call('/api/v1/images');workspaceId=catalog.workspaceId;
  for(const name of ['backgroundId','frameId','logoId']){const select=field(name);select.append(new Option('Không chọn',''));for(const image of catalog.images)select.append(new Option(image.prompt.slice(0,90),image.id));select.value=initial[name]||'';}
  const list=await call('/api/v1/tasks');if(list.workspaceId!==workspaceId)throw new Error('Workspace đã đổi.');task=list.tasks.find(t=>t.kind==='native-still'&&['queued','running','interrupted'].includes(t.status));if(task)await inspect();
 }catch(error){lock(true);state.textContent=error.message;}
}
