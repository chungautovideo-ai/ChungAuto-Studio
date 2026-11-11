export function pointerGeometry(input={}){
  const ranges={px:[0,100,30],py:[0,100,45],lx:[0,63,53],ly:[0,85,32]};
  const out={};for(const [key,[lo,hi,def]]of Object.entries(ranges)){const n=input[key]===undefined?def:Number(input[key]);if(!Number.isFinite(n)||n<lo||n>hi)throw new Error('Vị trí chỉ chi tiết ngoài khung.');out[key]=n;}
  out.accent=input.accent||'#FFD21E';if(!/^#[0-9a-f]{6}$/i.test(out.accent))throw new Error('Màu chỉ chi tiết không hợp lệ.');return out;
}

export function featurePointerControls({item,onChange}){
  const parse=()=>new DOMParser().parseFromString(item.html||'','text/html');
  const doc=parse(),marker=doc.querySelector('.ca-detail-pointer[data-feature-pointer="1"]');if(!marker)return null;
  const read=()=>{const el=parse().querySelector('.ca-detail-pointer');return pointerGeometry(Object.fromEntries(['px','py','lx','ly','accent'].map(k=>[k,el.style.getPropertyValue('--'+k).trim().replace(/%$/,'')||undefined])));};
  const root=document.createElement('details');root.className='adv';root.dataset.featurePointerControls='';
  const summary=document.createElement('summary');summary.textContent='Bố cục chỉ chi tiết';root.append(summary);
  const help=document.createElement('div');help.className='help';help.textContent='Tọa độ theo % khung video. Điểm chỉ phải nằm đúng chi tiết; mẫu này chưa tự bám vật chuyển động.';root.append(help);
  for(const [key,label,max]of [['px','Điểm chỉ · ngang (%)',100],['py','Điểm chỉ · dọc (%)',100],['lx','Nhãn · ngang (%)',63],['ly','Nhãn · dọc (%)',85],['accent','Màu chấm, đường & tiêu đề']]){
    const field=document.createElement('div');field.className='field';const title=document.createElement('label');title.textContent=label;const input=document.createElement('input');input.type=key==='accent'?'color':'number';input.setAttribute('aria-label',label);input.value=read()[key];if(key!=='accent'){input.min=0;input.max=max;input.step=.5;}
    input.onchange=()=>{try{
      const value=pointerGeometry({...read(),[key]:input.value}),documentValue=parse(),el=documentValue.querySelector('.ca-detail-pointer'),line=el.querySelector('.ca-pointer-line');
      for(const k of ['px','py','lx','ly'])el.style.setProperty('--'+k,value[k]+'%');el.style.setProperty('--accent',value.accent);
      for(const [k,v]of Object.entries({x1:value.px,y1:value.py,x2:value.lx+18,y2:value.ly+8}))line.setAttribute(k,v);
      onChange(documentValue.body.innerHTML);input.setCustomValidity('');
    }catch(e){input.setCustomValidity(e.message);input.reportValidity();}};
    field.append(title,input);root.append(field);
  }
  return root;
}
