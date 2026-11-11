const labels={title:'Tên dự án',source:'Video gốc',segments:'Cắt cảnh',blocks:'Đồ họa',texts:'Chữ',captions:'Phụ đề',brolls:'Cảnh trám',audio:'Âm thanh',camera:'Camera / zoom',format:'Tỷ lệ',brand:'Thương hiệu'};
export async function openCandidateReview({dir,onResolved}={}){
 const response=await fetch('/api/v1/ai-candidate?dir='+encodeURIComponent(dir));const data=await response.json();if(!response.ok)throw new Error(data.error||'Không đọc được bản AI.');
 const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','Đối chiếu bản AI');dialog.style.cssText='width:min(850px,94vw);max-height:85vh;overflow:auto;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:14px;padding:22px';
 const node=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;return el;};
 dialog.append(node('h2','Đối chiếu bản AI'),node('p','Bản hiện tại và bản AI được giữ riêng. Áp bản AI sẽ thay toàn bộ dữ liệu dựng bằng bản AI; bản hiện tại được lưu trong Lịch sử bản lưu. Sau xử lý, bạn kiểm tra rồi xuất thủ công.'));
 const table=document.createElement('table');table.style.cssText='width:100%;text-align:left';const heading=document.createElement('tr');for(const title of ['Thành phần','Bạn đã đổi','AI đã đổi'])heading.append(node('th',title));table.append(heading);
 for(const change of data.changes){const row=document.createElement('tr');for(const value of [labels[change.field]||change.field,change.manualChanged?'Có':'—',change.aiChanged?'Có':'—'])row.append(node('td',value));table.append(row);}dialog.append(table);
 if(!data.changes.length)dialog.append(node('p','Không có khác biệt dữ liệu so với bản gốc.'));
 const details=node('details','');details.append(node('summary','Xem dữ liệu từng bản'));
 for(const [key,title]of [['base','Bản gốc lúc giao AI'],['current','Bản hiện tại'],['candidate','Bản AI']]){
  const section=node('details','');section.append(node('summary',title));const pre=node('pre',JSON.stringify(data[key],null,2));pre.style.cssText='max-height:260px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere';section.append(pre);details.append(section);
 }dialog.append(details);
 const status=node('p','');status.setAttribute('role','status');dialog.append(status);
 const controls=node('div','');controls.style.cssText='display:flex;gap:10px;flex-wrap:wrap;margin-top:16px';dialog.append(controls);
 const buttons=[];const button=(text,handler)=>{const b=node('button',text);b.className='outline';b.onclick=handler;controls.append(b);buttons.push(b);return b;};
 button('Tải bản AI (.json)',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(data.candidate,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='contentos-ai-candidate.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 async function resolve(action){
  for(const b of buttons)b.disabled=true;status.textContent='Đang lưu lựa chọn…';
  try{const r=await fetch('/api/v1/ai-candidate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dir,action,currentRevision:data.currentRevision,candidateRevision:data.candidateRevision})});const result=await r.json();if(!r.ok||!result.ok)throw new Error(result.error||'Chưa áp dụng được.');status.textContent=action==='keep-manual'?'Đã giữ bản hiện tại. Bản AI vẫn còn để đối chiếu.':'Đã áp bản AI và lưu lịch sử. Kiểm tra trước khi xuất.';if(onResolved)await onResolved(result);}
  catch(error){status.textContent=error.message+' Đóng và mở lại để đối chiếu phiên bản mới.';}
  finally{for(const b of buttons)b.disabled=false;}
 }
 if(data.status==='error'&&data.errorCode==='CANDIDATE_CONFLICT'){
  button('Giữ bản hiện tại',()=>resolve('keep-manual'));
  const consent=document.createElement('label'),checkbox=document.createElement('input');checkbox.type='checkbox';consent.append(checkbox,document.createTextNode('Tôi chọn thay bản dựng hiện tại bằng toàn bộ bản AI'));dialog.insertBefore(consent,controls);
  const apply=button('Áp bản AI và lưu lịch sử',()=>{if(checkbox.checked)resolve('apply-ai');});apply.disabled=true;checkbox.onchange=()=>{apply.disabled=!checkbox.checked;};
 }
 button('Đóng đối chiếu',()=>dialog.close());dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();
}
