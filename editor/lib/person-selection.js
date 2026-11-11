// A reviewed selection limits the semantic person/skin mask; it never grows it.
export function normalizePersonSelections(value){
 if(value==null)return [];
 if(!Array.isArray(value)||value.length>120)throw new Error('Tối đa 120 khoảng chọn người.');
 const sources=new Map();let entries=0;
 return value.map(s=>{
  if(!s||typeof s.src!=='string'||!s.src||s.src.length>1024||! /^[a-f0-9]{64}$/.test(s.sha256||'')||s.method!=='sam2.1-tiny-point-prompt'||!Number.isFinite(s.from)||s.from<0||!Number.isFinite(s.fps)||s.fps<1||s.fps>15||!Number.isInteger(s.w)||!Number.isInteger(s.h)||s.w<2||s.h<2||s.w>256||s.h>256||!Array.isArray(s.f)||!s.f.length||s.f.length>120)throw new Error('Mặt nạ người được chọn không hợp lệ.');
  const sampleEnd=s.from+s.f.length/s.fps;
  // Optional exact end: after the last sample start, never past sample coverage.
  if(s.to!==undefined&&(!Number.isFinite(s.to)||s.to<=s.from+(s.f.length-1)/s.fps||s.to>sampleEnd+1e-9))throw new Error('Mốc cuối vùng người không hợp lệ.');
  const ranges=sources.get(s.src)||[],end=s.to??sampleEnd;
  if(ranges.some(r=>r.sha256!==s.sha256))throw new Error('Các khoảng cùng nguồn phải có cùng mã SHA256; quét và chọn lại nguồn đã đổi.');
  if(ranges.some(r=>s.from<r.end&&end>r.from))throw new Error('Các khoảng chọn người cùng nguồn không được chồng nhau.');
  ranges.push({from:s.from,end,sha256:s.sha256});sources.set(s.src,ranges);
  if(sources.size>40)throw new Error('Tối đa 40 nguồn chọn người.');
  const f=s.f.map(runs=>{if(!Array.isArray(runs)||!runs.length||runs.length%2||runs.length>s.w*s.h*2)throw new Error('Mã vùng chọn người không hợp lệ.');entries+=runs.length;if(entries>2000000)throw new Error('Vùng chọn người vượt giới hạn lưu.');let count=0;for(let i=0;i<runs.length;i+=2){if(!Number.isInteger(runs[i])||runs[i]<1||![0,1].includes(runs[i+1]))throw new Error('Nhãn vùng chọn người không hợp lệ.');count+=runs[i];}if(count!==s.w*s.h)throw new Error('Vùng chọn người thiếu điểm ảnh.');return [...runs];});
  let adjustments;
  if(s.adjustments!==undefined){adjustments={};for(const key of ['personLight','bodyWhite','bodySmooth']){if(!Number.isFinite(s.adjustments?.[key])||s.adjustments[key]<0||s.adjustments[key]>100)throw Error('Mức chỉnh khoảng người/da phải từ 0 đến 100.');adjustments[key]=s.adjustments[key];}}
  return {src:s.src,sha256:s.sha256,method:s.method,from:s.from,...(s.to!==undefined?{to:s.to}:{}),fps:s.fps,w:s.w,h:s.h,f,...(adjustments?{adjustments}:{})};
 });
}

// Add a reviewed range, or replace only that exact range. Other shots remain intact.
export function mergePersonSelection(value,selection){
 const incoming=normalizePersonSelections([selection])[0],end=incoming.from+incoming.f.length/incoming.fps;
 const all=normalizePersonSelections(value),same=all.find(s=>s.src===incoming.src&&s.sha256===incoming.sha256&&s.from===incoming.from&&s.from+s.f.length/s.fps===end);
 if(!incoming.adjustments&&same?.adjustments)incoming.adjustments={...same.adjustments};
 const existing=all.filter(s=>!(s.src===incoming.src&&s.from===incoming.from&&s.from+s.f.length/s.fps===end));
 return normalizePersonSelections([...existing,incoming]).sort((a,b)=>a.src.localeCompare(b.src)||a.from-b.from);
}

// Self-contained: embedded verbatim in final HTML, also used by live preview.
export function applyPersonSelection(pixels,w,h,selections,src,sha256,time){
 const sourceSelections=(selections||[]).filter(s=>s.src===src);
 if(!sourceSelections.length)return pixels;
 const selection=sourceSelections.find(s=>s.sha256===sha256&&time>=s.from&&time<s.from+s.f.length/s.fps);
 if(!selection){for(let i=0;i<pixels.length;i+=4){pixels[i]=0;pixels[i+1]=0;}return pixels;}
 const index=Math.floor((time-selection.from)*selection.fps),runs=selection.sha256===sha256&&time>=selection.from?selection.f[index]:null;
 if(!runs){for(let i=0;i<pixels.length;i+=4){pixels[i]=0;pixels[i+1]=0;}return pixels;}
 const mask=new Uint8Array(selection.w*selection.h);let at=0;
 for(let i=0;i<runs.length;i+=2){mask.fill(runs[i+1],at,at+runs[i]);at+=runs[i];}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const mx=Math.min(selection.w-1,Math.floor((x+.5)*selection.w/w)),my=Math.min(selection.h-1,Math.floor((y+.5)*selection.h/h));
  if(!mask[my*selection.w+mx]){const i=(y*w+x)*4;pixels[i]=0;pixels[i+1]=0;}
 }
 return pixels;
}

// Parse only known tracker messages. Suggestions never execute a task or edit a project.
export function personTrackingError(message,{from,duration,fps}={}){
 const text=String(message||''),cut=text.match(/Possible scene cut at source time\s*(\d+(?:\.\d+)?)/),lost=text.match(/(?:Object lost or ambiguous at source time|Mask changed abruptly \([^\r\n)]+\) at source time)\s*(\d+(?:\.\d+)?)/),match=cut||lost;
 if(!match)return {message:text,shorterDuration:null};
 const time=Number(match[1]);
 let shorterDuration=null;
 if([from,duration,fps,time].every(Number.isFinite)&&from>=0&&duration>=.2&&fps>=1&&fps<=15&&time>from&&time<from+duration){
  const value=Math.floor((time-from)*fps-1+1e-6)/fps;
  if(value>=.2&&value<duration)shorterDuration=Math.floor(value*1000)/1000;
 }
 return {message:`${cut?'Có thể đã chuyển cảnh':'Vùng người bị mất dấu hoặc thay đổi đột ngột'} tại ${time.toFixed(3)} giây nguồn. Chia khoảng và chọn lại người; chưa áp dụng kết quả của lượt này.`,shorterDuration};
}
