import {sourceColorEffects} from '/lib/source-color.js';
export async function openShotColor({kind,id,request,validate,onApply,onNormalize}){
 const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','Phân tích màu cảnh');dialog.style.cssText='width:min(800px,94vw);max-height:90dvh;overflow:auto;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:16px;padding:24px';
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 const heading=el('h2','Phân tích màu cảnh'),status=el('p','Đang đọc 3 khung hình nguồn…'),content=el('div'),buttons=el('div'),close=el('button','Đóng'),apply=el('button','Thay màu riêng bằng gợi ý');buttons.className='btns';apply.className='primary';apply.disabled=true;close.className='outline';buttons.append(close,apply);dialog.append(heading,status,content,buttons);document.body.append(dialog);dialog.showModal();
 const controller=new AbortController();close.onclick=()=>dialog.close();dialog.addEventListener('close',()=>{controller.abort();dialog.remove();});
 try{
  validate();const response=await request('/api/shot-color',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,id}),signal:controller.signal});const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error||'Không phân tích được.'),{code:data.code});validate();if(!dialog.isConnected)return;
  const result=data.result,fx=sourceColorEffects(result.color,'shot-color-suggestion');status.textContent='So sánh màu riêng của nguồn; chưa cộng màu chung hoặc màu riêng hiện có. Áp dụng sẽ thay màu riêng của đoạn đang chọn.';
  const defs=el('div');defs.innerHTML=fx.defs;content.append(defs);
  const tabs=el('div');tabs.className='chips';tabs.setAttribute('aria-label','Khung hình phân tích');const frames=el('div');content.append(tabs,frames);
  const show=index=>{frames.replaceChildren();for(const [i,button] of [...tabs.children].entries()){button.style.background=i===index?'var(--lime)':'var(--surface2)';button.style.color=i===index?'var(--bg)':'var(--ink)';button.setAttribute('aria-pressed',String(i===index));}
   const sample=result.samples[index],grid=el('div');grid.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0';
   for(const corrected of [false,true]){const figure=el('figure');figure.style.margin='0';const img=el('img');img.src=sample.image;img.alt=(corrected?'Gợi ý':'Nguồn')+' tại '+sample.at+' giây';img.style.cssText='width:100%;max-height:40vh;object-fit:contain;border-radius:8px;';if(corrected)img.style.filter=fx.filter;figure.append(img,el('figcaption',(corrected?'Gợi ý':'Nguồn')+' · '+sample.at+'s'));grid.append(figure);}frames.append(grid);
  };
  result.samples.forEach((sample,index)=>{const b=el('button',sample.at+'s');b.type='button';b.className='outline small';b.onclick=()=>show(index);tabs.append(b);});show(0);
  content.append(el('p',Object.keys(result.color).length?'Thông số: '+Object.entries(result.color).map(([k,v])=>k+' '+v).join(' · '):'Không có điều chỉnh rõ ràng để đề xuất.'));
  for(const warning of result.warnings){const p=el('p',warning);p.className='help';content.append(p);}
  apply.disabled=!Object.keys(result.color).length;apply.onclick=()=>{try{validate();onApply(result.color);dialog.close();}catch(error){status.textContent=error.message;apply.disabled=true;}};
 }catch(error){if(dialog.isConnected){status.textContent=error.message;status.className='err';
  // Only the explicit service code offers recovery; never guess from message text.
  if(error.code==='COLOR_NORMALIZATION_REQUIRED'&&onNormalize){const normalize=el('button','Chuẩn hóa màu nguồn…');normalize.type='button';normalize.className='outline';buttons.append(normalize);
   normalize.onclick=async()=>{try{validate();}catch(e){status.textContent=e.message;return;}dialog.close();await onNormalize();};}}}
}
