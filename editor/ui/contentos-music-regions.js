// Context-owned control for the existing Audio tool; all writes use editor undo/save.
export function musicRegionControls({getRanges,applyRanges,total,time,seek,onError}){
 const root=document.createElement('div');root.dataset.musicRegions='';
 const original=JSON.stringify(getRanges()??[]),ranges=JSON.parse(original);
 const el=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
 const commit=value=>{
  if(!root.isConnected)return;
  if(JSON.stringify(getRanges()??[])!==original){onError('Vùng lời nói đã đổi. Mở lại công cụ trước khi sửa.');return;}
  if(value.length>1000||value.some(r=>!Array.isArray(r)||r.length!==2||!r.every(Number.isFinite)||r[0]<0||r[1]<=r[0])){onError('Thời gian kết thúc phải lớn hơn bắt đầu; dùng số giây không âm.');return;}
  applyRanges(value);
 };
 const note=el('p',ranges.length?'Thời gian tính trên bản dựng sau khi cắt.':'Chưa có vùng lời nói. Thêm vùng tại vị trí đang xem.');note.className='help';root.append(note);
 ranges.forEach((range,index)=>{
  const row=el('div');row.dataset.musicRegion=String(index);row.style.cssText='display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0';
  const inputs=range.map((value,column)=>{
   const label=el('label',column?'Kết thúc (giây)':'Bắt đầu (giây)'),input=el('input');input.type='number';input.min='0';input.step='.01';input.value=String(value);input.style.width='100px';input.setAttribute('aria-label',`${column?'Kết thúc':'Bắt đầu'} vùng lời nói ${index+1}`);label.append(input);row.append(label);return input;
  });
  const apply=el('button','Áp dụng vùng');apply.type='button';apply.onclick=()=>{
   const next=structuredClone(ranges);next[index]=inputs.map(input=>input.value.trim()===''?NaN:Number(input.value));commit(next);
  };
  const jump=el('button','Xem vị trí');jump.type='button';jump.onclick=()=>{if(root.isConnected)seek(Math.max(0,Math.min(total,range[0])));};
  const remove=el('button','Xóa vùng');remove.type='button';remove.onclick=()=>commit(ranges.filter((_,i)=>i!==index));row.append(apply,jump,remove);root.append(row);
 });
 const add=el('button','Thêm vùng tại playhead');add.type='button';add.disabled=!(total>0)||ranges.length>=1000;add.onclick=()=>{const start=Math.max(0,Math.min(Math.max(0,total-.01),time));commit([...ranges,[Number(start.toFixed(3)),Number(Math.min(total,start+1).toFixed(3))]]);};root.append(add);
 return root;
}
