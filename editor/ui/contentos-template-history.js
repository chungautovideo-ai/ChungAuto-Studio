// Catalog-backed version review; applying a version uses the existing editor action.
export async function openTemplateHistory({id,request=fetch,onApply,onImprove}){
 const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','Phiên bản và skill mẫu');dialog.className='cos-template-history';
 dialog.innerHTML='<h2>Phiên bản và skill</h2><label>Phiên bản <select data-versions></select></label><p data-info></p><p data-error role="status"></p><h3>Thay đổi so với bản gốc</h3><div data-diff></div><details><summary>Quy tắc dựng cho AI</summary><pre data-skill></pre></details><p>Áp dụng đổi phong cách theo công cụ mẫu hiện có; kiểm tra rồi Lưu dự án. Nội dung và đoạn cắt được giữ. Cải tiến tạo mẫu riêng, không thay bản đang được job sử dụng.</p><div data-actions><button data-apply>Áp dụng phiên bản này</button> <button data-improve>Cải tiến từ phiên bản này…</button> <button data-close>Đóng</button></div>';
 document.body.append(dialog);dialog.showModal();const get=s=>dialog.querySelector(s);let entries=[],selected=null,epoch=0;
 const call=async url=>{const response=await request(url),value=await response.json();if(!response.ok||value.ok===false)throw new Error(value.error||'Không đọc được mẫu.');return value;};
 const setButtons=disabled=>{get('[data-apply]').disabled=disabled;get('[data-improve]').disabled=disabled;};setButtons(true);
 get('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{epoch++;dialog.remove();});
 async function load(){const current=++epoch;selected=null;setButtons(true);get('[data-error]').textContent='Đang đọc phiên bản…';
  try{const detail=await call('/api/templates?id='+encodeURIComponent(get('[data-versions]').value));let parent=null;
   if(detail.template.parentId)parent=await call('/api/templates?id='+encodeURIComponent(detail.template.parentId));
   if(!dialog.isConnected||current!==epoch)return;
   selected=detail;get('[data-error]').textContent='';get('[data-info]').textContent=detail.template.name+' · v'+(detail.template.version||1)+(detail.template.createdAt?' · '+new Date(detail.template.createdAt).toLocaleString('vi-VN'):'')+(detail.template.changeNote?' · '+detail.template.changeNote:'');
   get('[data-skill]').textContent=detail.skill||'Chưa có quy tắc.';const diff=get('[data-diff]');diff.replaceChildren();
   const fields={brand:'Thương hiệu',captions:'Phụ đề',transitions:'Chuyển cảnh',camera:'Khung hình / màu',audio:'Âm thanh',texts:'Chữ',brolls:'Cảnh trám',scenes:'Minh họa'};
   for(const [key,label] of Object.entries(fields))if(!parent||JSON.stringify(parent.template[key])!==JSON.stringify(detail.template[key])){
    const block=document.createElement('details'),summary=document.createElement('summary');summary.textContent=label;block.append(summary);
    for(const [title,value] of parent?[['Trước',parent.template[key]],['Phiên bản này',detail.template[key]]]:[['Phiên bản này',detail.template[key]]]){const heading=document.createElement('b'),text=document.createElement('pre');heading.textContent=title;text.textContent=JSON.stringify(value??null,null,2);block.append(heading,text);}diff.append(block);
   }
   if(parent&&parent.skill!==detail.skill){const note=document.createElement('p');note.textContent='Quy tắc AI đã thay đổi so với bản gốc.';diff.append(note);}
   if(!diff.children.length)diff.textContent='Thông số và quy tắc giữ nguyên so với bản gốc.';
   if(!parent){const note=document.createElement('p');note.textContent='Phiên bản gốc; chưa có bản cha để so sánh.';diff.prepend(note);}setButtons(false);
  }catch(error){if(dialog.isConnected&&current===epoch)get('[data-error]').textContent=error.message;}
 }
 get('[data-versions]').onchange=load;
 get('[data-apply]').onclick=async()=>{if(!selected)return;setButtons(true);try{const item=entries.find(entry=>entry.id===get('[data-versions]').value);if(await onApply(item)===false)throw new Error('Không áp dụng được phiên bản. Giữ bản dựng hiện tại.');dialog.close();}catch(error){get('[data-error]').textContent=error.message;setButtons(false);}};
 get('[data-improve]').onclick=()=>{if(!selected)return;onImprove({parentId:get('[data-versions]').value,name:selected.template.name,description:selected.template.description||'',skill:selected.skill||'',industries:selected.template.industries||[]});dialog.close();};
 try{const response=await call('/api/library?local=1');entries=(Array.isArray(response)?response:response.items||[]).filter(item=>item.installed);
  const byId=new Map(entries.map(item=>[item.id,item]));let root=id;const seen=new Set();while(byId.get(root)?.parentId&&!seen.has(root)){seen.add(root);root=byId.get(root).parentId;}
  const related=new Set([root,id]);for(let i=0;i<entries.length;i++){let added=false;for(const item of entries)if(related.has(item.parentId)&&!related.has(item.id)){related.add(item.id);added=true;}if(!added)break;}
  const versions=entries.filter(item=>related.has(item.id)).sort((a,b)=>(a.version||1)-(b.version||1)||String(a.createdAt||'').localeCompare(b.createdAt||''));
  for(const item of versions)get('[data-versions]').append(new Option(item.name+' · v'+(item.version||1),item.id,false,item.id===id));
  if(!versions.some(item=>item.id===id))throw new Error('Mẫu chưa cài hoặc đã bị gỡ.');await load();
 }catch(error){get('[data-error]').textContent=error.message;}
}
