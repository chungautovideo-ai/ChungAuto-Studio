export function normalizePersonSourceAdjustments(value){
 if(value==null)return [];
 if(!Array.isArray(value)||value.length>40)throw new Error('Tối đa 40 nguồn chỉnh người/da.');
 const seen=new Set();return value.map(v=>{
  if(!v||typeof v.src!=='string'||!v.src||v.src.length>1024||! /^[a-f0-9]{64}$/.test(v.sha256||'')||seen.has(v.src))throw new Error('Nguồn chỉnh người/da không hợp lệ hoặc trùng.');
  seen.add(v.src);const out={src:v.src,sha256:v.sha256};
  for(const key of ['personLight','bodyWhite','bodySmooth']){if(!Number.isFinite(v[key])||v[key]<0||v[key]>100)throw new Error('Mức chỉnh người/da phải từ 0 đến 100.');out[key]=v[key];}
  return out;
 });
}

// Self-contained so preview and final HTML embed the same source/hash decision.
export function resolvePersonSourceAdjustment(values,src,sha256,defaults,selections,time){
 const range=(selections||[]).find(s=>s.src===src&&s.sha256===sha256&&time>=s.from&&time<s.from+s.f.length/s.fps);
 if(range?.adjustments)return range.adjustments;
 const value=(values||[]).find(v=>v.src===src&&v.sha256===sha256);
 return value||defaults;
}
