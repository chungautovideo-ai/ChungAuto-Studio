import {readFaceTracks} from './face-tracks.mjs';
export function suggestPersonPoints(mask,anchor){
 if(!mask||!Number.isInteger(mask.w)||!Number.isInteger(mask.h)||mask.w<2||mask.h<2||mask.w>256||mask.h>256||!Array.isArray(mask.runs)||mask.runs.length>mask.w*mask.h*2||mask.runs.length%2)throw Error('Mặt nạ gợi ý không hợp lệ.');
 const {w,h,runs}=mask,pixels=new Uint8Array(w*h);let at=0;
 for(let i=0;i<runs.length;i+=2){const count=runs[i],label=runs[i+1];if(!Number.isInteger(count)||count<1||![0,1,2].includes(label)||at+count>pixels.length)throw Error('Mặt nạ gợi ý không hợp lệ.');if(label)pixels.fill(1,at,at+count);at+=count;}if(at!==pixels.length)throw Error('Mặt nạ gợi ý thiếu điểm ảnh.');
 const seen=new Uint8Array(pixels.length),components=[];
 for(let index=0;index<pixels.length;index++){if(!pixels[index]||seen[index])continue;const queue=[index];seen[index]=1;for(let n=0;n<queue.length;n++){const p=queue[n],x=p%w,y=Math.floor(p/w);for(const q of [x>0?p-1:-1,x+1<w?p+1:-1,y>0?p-w:-1,y+1<h?p+w:-1])if(q>=0&&pixels[q]&&!seen[q]){seen[q]=1;queue.push(q);}}components.push(queue);}
 if(anchor!==undefined&&(!Array.isArray(anchor)||anchor.length!==2||anchor.some(n=>!Number.isFinite(n)||n<0||n>=1)))throw Error('Điểm chọn người phải nằm trong khung nguồn.');
 components.sort((a,b)=>b.length-a.length);const anchorIndex=anchor?Math.floor(anchor[1]*h)*w+Math.floor(anchor[0]*w):null;
 const body=anchor?components.find(c=>c.includes(anchorIndex)):components[0];
 if(!body||body.length<Math.max(32,w*h*.015))throw Error(anchor?'Điểm chọn không nằm trong vùng người rõ; chạm lại trên người.':'Vùng người quá nhỏ hoặc chưa rõ; chọn điểm bằng tay.');
 if(!anchor&&components[1]?.length>Math.max(24,body.length*.15))throw Error('Có nhiều vùng người đáng kể; chạm một điểm giữ trên người muốn chỉnh rồi bấm Gợi ý.');

 const bodySet=new Uint8Array(w*h),distance=new Uint16Array(w*h);let minX=w,minY=h,maxX=0,maxY=0;for(const p of body){bodySet[p]=1;const x=p%w,y=Math.floor(p/w);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);distance[p]=1000;}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=y*w+x;if(bodySet[p])distance[p]=Math.min(distance[p],x?distance[p-1]+1:1,y?distance[p-w]+1:1);}
 for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const p=y*w+x;if(bodySet[p])distance[p]=Math.min(distance[p],x+1<w?distance[p+1]+1:1,y+1<h?distance[p+w]+1:1);}
 const bw=maxX-minX+1,bh=maxY-minY+1;if(bh<8||bw<4)throw Error('Vùng người quá hẹp; chọn điểm bằng tay.');const chosen=[];
 for(const [tx,ty,low,high] of [[.5,.14,.04,.25],[.5,.43,.28,.58],[.3,.82,.65,.98],[.7,.82,.65,.98]]){let best=-1,score=Infinity;for(const p of body){const x=(p%w-minX)/bw,y=(Math.floor(p/w)-minY)/bh;if(y<low||y>high||chosen.includes(p))continue;const cost=(x-tx)**2+(y-ty)**2-.001*Math.min(distance[p],5);if(cost<score){score=cost;best=p;}}if(best<0)throw Error('Không đủ vùng để gợi ý; chọn điểm bằng tay.');chosen.push(best);}
 return {points:chosen.map(p=>[((p%w)+.5)/w,(Math.floor(p/w)+.5)/h,1]),componentPixels:body.length,anchored:!!anchor,requiresVisualReview:true,warning:'Điểm gợi ý từ vùng người, không phải landmark cơ thể. Kiểm đầu, thân và hai chân; sửa điểm nếu lẫn người hoặc nền.'};
}
export function personPointSuggestions(dir,project,{src,from,anchor}={}){
 if(typeof src!=='string'||!Number.isFinite(from)||from<0)throw Error('Chọn nguồn và mốc giây hợp lệ.');const track=readFaceTracks(dir,project).tracks.find(t=>t.src===src&&t.skin);if(!track)throw Error('Nguồn thiếu hoặc đã đổi; quét lại người và da trước.');const frame=Math.floor(from*track.fps),runs=track.skin.f[frame];if(!runs)throw Error('Mốc nguồn nằm ngoài dữ liệu đã quét.');return {...suggestPersonPoints({w:track.skin.w,h:track.skin.h,runs},anchor),src,sha256:track.fingerprint.sha256,from,sampledAt:frame/track.fps,readOnly:true};
}
