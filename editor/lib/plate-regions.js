// Normalized source coordinates, clockwise in image space (y grows downward).
export function plateGeometry({roi,rois,quads}={}){
 const supplied=[roi,rois,quads].filter(v=>v!==undefined).length;
 if(supplied!==1)throw new Error('Chỉ gửi một trong roi, rois hoặc quads.');
 let rectangles=rois??(roi===undefined?null:[roi]);
 if(quads===undefined){
  if(!Array.isArray(rectangles)||rectangles.length<1||rectangles.length>8||rectangles.some(r=>!Array.isArray(r)||r.length!==4||r.some(v=>!Number.isFinite(v)||v<0||v>1)||r[2]<.005||r[3]<.005||r[0]+r[2]>1||r[1]+r[3]>1))throw new Error('Đánh dấu 1–8 vùng biển hợp lệ trong khung nguồn.');
  quads=rectangles.map(([x,y,w,h])=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);
 }
 if(!Array.isArray(quads)||quads.length<1||quads.length>8)throw new Error('Cần 1–8 vùng có 4 góc.');
 for(const q of quads){
  if(!Array.isArray(q)||q.length!==4||q.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)||v<0||v>1)))throw new Error('Mỗi vùng cần 4 góc X/Y trong 0–1.');
  let area=0;
  for(let i=0;i<4;i++){
   const a=q[i],b=q[(i+1)%4],c=q[(i+2)%4];
   if((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0])<=1e-8)throw new Error('4 góc cần theo thứ tự quanh biển, không tự cắt hoặc lõm.');
   area+=a[0]*b[1]-b[0]*a[1];
  }
  if(area/2<.000025)throw new Error('Vùng biển quá nhỏ.');
 }
 const cloned=quads.map(q=>q.map(p=>[...p]));
 return {quads:cloned,rois:rectangles?rectangles.map(r=>[...r]):cloned.map(q=>{const xs=q.map(p=>p[0]),ys=q.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys);return [x,y,Math.max(...xs)-x,Math.max(...ys)-y];})};
}

// Validate a whole suggestion batch before any UI replaces manual regions.
// A valid tilted quad decides the bounds; old proposals keep their rectangle.
export function plateSuggestionGeometry(proposals){
 if(!Array.isArray(proposals)||proposals.length>8)throw new Error('Kết quả gợi ý không hợp lệ.');
 return proposals.map(p=>{
  if(!p||typeof p!=='object')throw new Error('Kết quả gợi ý không hợp lệ.');
  const rect=plateGeometry({roi:p.roi}).rois[0];
  if(p.quad===undefined)return {...p,roi:rect};
  const geometry=plateGeometry({quads:[p.quad]});
  return {...p,roi:geometry.rois[0],quad:geometry.quads[0]};
 });
}
