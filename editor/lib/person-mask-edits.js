// Coordinates and times belong to the original source, not the composed frame.
export function normalizePersonMaskEdits(value) {
  if(value==null)return [];
  if(!Array.isArray(value)||value.length>256)throw new Error('Tối đa 256 nét sửa vùng người/da.');
  let count=0;
  return value.map(s=>{
    if(!s||typeof s.src!=='string'||s.src.length>1024||!s.src||!/^([a-f0-9]{64})$/.test(s.sha256||'')||!['skin','person','erase'].includes(s.mode)||!Number.isFinite(s.from)||s.from<0||!Number.isFinite(s.to)||s.to<=s.from||s.to>86400||!Number.isFinite(s.radius)||s.radius<.003||s.radius>.25||!Array.isArray(s.points)||!s.points.length||s.points.length>1024)throw new Error('Nét sửa vùng người/da không hợp lệ.');
    count+=s.points.length;if(count>16384)throw new Error('Nét sửa vượt 16.384 điểm.');
    const points=s.points.map(p=>{if(!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isFinite(n)||n<0||n>1))throw new Error('Điểm cọ phải nằm trong khung nguồn.');return [...p];});
    return {src:s.src,sha256:s.sha256,from:s.from,to:s.to,mode:s.mode,radius:s.radius,points};
  });
}

// Runs after automatic mask stabilization, so manual corrections take priority.
// Kept self-contained to embed the exact same function in final HTML snapshots.
export function applyPersonMaskEdits(pixels,w,h,edits,src,sha256,time) {
  for(const s of edits||[]){
    if(s.src!==src||s.sha256!==sha256||time<s.from||time>=s.to)continue;
    const radius=s.radius*Math.min(w,h),r2=radius*radius;
    for(let n=0;n<s.points.length;n++){
      const a=s.points[Math.max(0,n-1)],b=s.points[n],ax=a[0]*w,ay=a[1]*h,bx=b[0]*w,by=b[1]*h,dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy;
      const x0=Math.max(0,Math.floor(Math.min(ax,bx)-radius)),x1=Math.min(w-1,Math.ceil(Math.max(ax,bx)+radius)),y0=Math.max(0,Math.floor(Math.min(ay,by)-radius)),y1=Math.min(h-1,Math.ceil(Math.max(ay,by)+radius));
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
        const u=len?Math.max(0,Math.min(1,((x+.5-ax)*dx+(y+.5-ay)*dy)/len)):0;
        if((x+.5-ax-u*dx)**2+(y+.5-ay-u*dy)**2>r2)continue;
        const i=(y*w+x)*4;
        if(s.mode==='erase'){pixels[i]=0;pixels[i+1]=0;}
        else {pixels[i]=255;if(s.mode==='skin')pixels[i+1]=255;}
      }
    }
  }
  return pixels;
}
