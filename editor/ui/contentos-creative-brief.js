export function creativeBriefControls({selection={},disabled=false,onChange=()=>{}}={}){
 const host=document.createElement('details');host.className='cos-creative-brief';
 const summary=document.createElement('summary');summary.textContent='Phong cách / prompt bổ sung';host.append(summary);
 const explanation=document.createElement('p');explanation.textContent='Định hướng cho AI theo yêu cầu hiện tại; không tự áp hiệu ứng hoặc chạy như skill.';host.append(explanation);
 const selects={};
 for(const [key,title] of [['styleId','Phong cách'],['promptId','Prompt']]){
  const label=document.createElement('label');label.textContent=title;
  const select=document.createElement('select');select.setAttribute('aria-label',title+' cho AI sửa');select.style.maxWidth='100%';select.disabled=true;select.add(new Option('Không bổ sung',''));label.append(select);host.append(label);selects[key]=select;
 }
 const preview=document.createElement('pre');preview.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;max-height:180px;overflow:auto';host.append(preview);
 const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Đang đọc thư viện workspace…';host.append(status);
 let entries=[];
 function draw(){preview.textContent=entries.filter(e=>Object.values(selection).includes(e.id)).map(e=>e.name+'\n'+(e.payload.content||[e.payload.art,e.payload.palette,e.payload.motion,e.payload.avoid].filter(Boolean).join('\n'))).join('\n\n');}
 for(const select of Object.values(selects))select.onchange=()=>{selection={styleId:selects.styleId.value,promptId:selects.promptId.value};draw();onChange(selection);};
 fetch('/api/v1/catalogs/local').then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);return data;}).then(data=>{
  entries=data.entries||[];
  for(const [key,kind] of [['styleId','style'],['promptId','prompt']]){
   const select=selects[key];for(const entry of entries.filter(e=>e.kind===kind))select.add(new Option(entry.name+(entry.version?' · v'+entry.version:''),entry.id));
   if(selection[key]&&!entries.some(e=>e.id===selection[key]&&e.kind===kind)){select.add(new Option('Không tìm thấy lựa chọn đã lưu',selection[key]));}
   select.value=selection[key]||'';select.disabled=disabled;
  }
  status.textContent=entries.length?'Nội dung được chốt riêng khi giao việc.':'Chưa có catalog trong workspace. Nhập tại Thư viện → Phong cách & Prompt.';draw();
 }).catch(error=>{status.textContent='Không đọc được thư viện: '+error.message;});
 return host;
}
