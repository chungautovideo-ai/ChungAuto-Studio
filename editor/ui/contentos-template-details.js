export function templateDetailsPanel(id,{request=(...args)=>fetch(...args)}={}){
 const host=document.createElement('details');host.className='cos-template-details';const title=document.createElement('summary');title.textContent='Quy tắc và khả năng của mẫu';host.append(title);let loaded=false;
 host.addEventListener('toggle',async()=>{
  if(!host.open||loaded)return;loaded=true;host.replaceChildren(title);const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Đang đọc mẫu đã cài…';host.append(status);
  try{const response=await request('/api/v1/templates/details?id='+encodeURIComponent(id));const data=await response.json();if(!response.ok)throw new Error(data.error);if(!host.isConnected)return;
   status.textContent=data.apiSupported+'/'+data.presetCount+' preset có adapter API · '+(data.rules?'Có SKILL.md':'Chưa có SKILL.md');
   const note=document.createElement('p');note.textContent=data.limitations;host.append(note);
   const version=document.createElement('small');version.textContent='SHA256 mẫu: '+data.templateHash+(data.skillHash?' · quy tắc: '+data.skillHash:'');version.style.overflowWrap='anywhere';const technical=document.createElement('details'),technicalTitle=document.createElement('summary');technicalTitle.textContent='Thông tin phiên bản';technical.append(technicalTitle,version);host.append(technical);
   const rules=document.createElement('pre');rules.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;max-height:240px;overflow:auto';rules.textContent=data.rules||'Mẫu chưa có file quy tắc riêng.';const main=document.createElement('details'),mainTitle=document.createElement('summary');mainTitle.textContent='Hướng dẫn chính';main.append(mainTitle,rules);host.append(main);
   if(data.references?.length){
    const names={'references/color.md':'Màu và chống rung','references/person.md':'Người và da toàn thân','references/plate.md':'Che biển số','references/finishing.md':'Âm thanh, logo và CTA'};
    for(const reference of data.references){
     const topic=document.createElement('details'),summary=document.createElement('summary'),content=document.createElement('pre'),retry=document.createElement('button');summary.textContent=names[reference.path]||reference.path;summary.title=reference.path;content.style.cssText=rules.style.cssText;content.setAttribute('role','status');retry.className='outline';retry.textContent='Thử lại';retry.hidden=true;topic.append(summary,content,retry);host.append(topic);let ready=false,busy=false;
     const load=async()=>{if(ready||busy)return;busy=true;retry.hidden=true;content.textContent='Đang đọc chuyên đề…';try{const response=await request('/api/v1/templates/reference?'+new URLSearchParams({id,path:reference.path})),value=await response.json();if(!response.ok)throw new Error(value.error||'Không đọc được chuyên đề.');if(!topic.isConnected)return;content.textContent=value.content;ready=true;}catch(error){content.textContent=error.message;retry.hidden=false;}finally{busy=false;}};
     topic.addEventListener('toggle',()=>{if(topic.open)load();});retry.onclick=load;
    }
   }
   const actions=document.createElement('div'),download=document.createElement('a');actions.className='btns';download.className='outline';download.textContent='Tải gói mẫu .zip';download.href='/api/v1/templates/package?id='+encodeURIComponent(id);download.download=id+'.zip';actions.append(download);host.append(actions);
   const portable=document.createElement('p');portable.className='help';portable.textContent='Gói gồm quy tắc, chuyên đề, preset và preview có sẵn. Không kèm phần mềm, model AI, font hoặc mọi tài nguyên ngoài của preset.';host.append(portable);
   for(const preset of data.presets){const row=document.createElement('p');row.textContent=(preset.name||preset.id)+' · '+(preset.supported?'API có adapter điền nội dung':'API chưa hỗ trợ')+(preset.requiresMatte?' · cần tách nền':'');host.append(row);}
  }catch(error){if(host.isConnected){status.textContent='Không đọc được mẫu: '+error.message;loaded=false;}}
 });return host;
}
