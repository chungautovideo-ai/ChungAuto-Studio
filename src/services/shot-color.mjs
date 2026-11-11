import fs from 'node:fs';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {resolveContained} from './storage.mjs';import {probeMediaMetadata} from './media-metadata.mjs';
import {makeTimemap} from '../../editor/lib/timemap.js';import {detectInputColor} from '../../editor/lib/color-management.js';
const run=promisify(execFile);let active=0;
// SDR luma thresholds are wrong for HLG/PQ; callers recover via normalize_source_color / Chuẩn hóa màu nguồn.
export function requireSdrInput(meta,message){
 const inputColor=detectInputColor(meta),transfer=meta.colorMetadata?.transfer;
 if(['hlg','pq'].includes(inputColor.profile)||['arib-std-b67','smpte2084'].includes(transfer))throw Object.assign(new Error(message),{code:'COLOR_NORMALIZATION_REQUIRED',status:422});
 return inputColor;
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),round=v=>Math.round(v*1000)/1000;
export function analyzeRgb(rgb){
 if(!rgb.length||rgb.length%3)throw new Error('Thiếu pixel RGB.');
 const luma=[],neutral=[0,0,0];let clipped=0,black=0,saturation=0,neutralCount=0;
 for(let i=0;i<rgb.length;i+=3){const r=rgb[i]/255,g=rgb[i+1]/255,b=rgb[i+2]/255,max=Math.max(r,g,b),min=Math.min(r,g,b),y=.2126*r+.7152*g+.0722*b;
  luma.push(y);if(max>=.985)clipped++;if(y<=.025)black++;saturation+=max?(max-min)/max:0;
  if(y>.15&&y<.85&&max-min<.09){neutral[0]+=r;neutral[1]+=g;neutral[2]+=b;neutralCount++;}
 }
 luma.sort((a,b)=>a-b);const n=luma.length,q=p=>luma[Math.floor((n-1)*p)];
 return {median:round(q(.5)),p10:round(q(.1)),p90:round(q(.9)),highlightFraction:round(clipped/n),blackFraction:round(black/n),meanSaturation:round(saturation/n),neutralFraction:round(neutralCount/n),neutralRgb:neutralCount?neutral.map(x=>round(x/neutralCount)):null};
}
export function suggestShotColor(stats){
 const med=stats.map(s=>s.median).sort((a,b)=>a-b)[Math.floor(stats.length/2)],spread=Math.max(...stats.map(s=>s.median))-Math.min(...stats.map(s=>s.median));
 const color={},warnings=['Phân tích ảnh nguồn SDR; chưa nhận diện Log/HDR, da người hoặc màu sơn chuẩn.'];
 if(spread>.2)warnings.push('Độ sáng thay đổi mạnh hoặc có đổi cảnh; chia đoạn và kiểm từng cảnh trước khi áp dụng.');
 const highlights=Math.max(...stats.map(s=>s.highlightFraction));
 if(highlights>.03)warnings.push('Có vùng gần cháy sáng; giảm sáng không phục hồi chi tiết đã mất.');
 if(med<.33&&highlights<.03)color.brightness=round(clamp(.33/Math.max(.1,med)-1,0,.18));
 else if(med>.65)color.brightness=round(clamp(.65/med-1,-.12,0));
 const width=stats.reduce((s,x)=>s+x.p90-x.p10,0)/stats.length;
 if(width<.35&&med>.2&&med<.7&&highlights<.02)color.contrast=.04;
 const gray=stats.filter(s=>s.neutralFraction>=.08&&s.neutralRgb);
 if(gray.length===stats.length){const average=[0,1,2].map(i=>gray.reduce((sum,s)=>sum+s.neutralRgb[i],0)/gray.length),[r,g,b]=average;
  const temperature=clamp((b-r)/Math.max(.1,r+b)/.3,-.12,.12),tint=clamp((g-(r+b)/2)/Math.max(.1,g)/.17,-.1,.1);
  if(Math.abs(temperature)>.02)color.temperature=round(temperature);if(Math.abs(tint)>.02)color.tint=round(tint);
  warnings.push('Cân trắng chỉ là gợi ý từ pixel gần trung tính; cần đối chiếu vật trắng/xám thật.');
 }else warnings.push('Không đủ vùng trung tính nhất quán; giữ nhiệt độ và tint.');
 return {color,warnings,brightnessVariation:round(spread),method:'three-source-frame-histograms-v1'};
}
export function shotColorRequest(project,{kind,id}={}){
 if(!['segments','brolls'].includes(kind)||typeof id!=='string')throw new Error('Chọn đoạn Video hoặc cảnh trám.');
 const item=project[kind]?.find(s=>s.id===id);if(!item||item.keep===false||item.hidden)throw new Error('Đoạn không còn đang dùng.');
 const tm=makeTimemap(project);let src,from,duration;
 if(kind==='segments'){const seg=tm.segs.find(s=>s.id===id);if(!seg)throw new Error('Đoạn Video không hợp lệ.');src=item.src||project.source?.video;from=item.src?(item.mediaStart??0):item.in;duration=item.out-item.in;}
 else{src=item.src;from=item.mediaStart??0;duration=Math.min(item.dur,tm.contentTotal-tm.srcToOut(item.at))*(Number(item.speed)||1);}
 if(!src||!Number.isFinite(from)||from<0||!Number.isFinite(duration)||duration<.1||duration>600)throw new Error('Phân tích hỗ trợ đoạn nguồn0.1–600giây.');
 return {src,from,duration};
}
function bmp(rgb,w,h){const stride=Math.ceil(w*3/4)*4,b=Buffer.alloc(54+stride*h);b.write('BM');b.writeUInt32LE(b.length,2);b.writeUInt32LE(54,10);b.writeUInt32LE(40,14);b.writeInt32LE(w,18);b.writeInt32LE(h,22);b.writeUInt16LE(1,26);b.writeUInt16LE(24,28);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*3,j=54+(h-y-1)*stride+x*3;b[j]=rgb[i+2];b[j+1]=rgb[i+1];b[j+2]=rgb[i];}return 'data:image/bmp;base64,'+b.toString('base64');}
export async function analyzeShotColor(dir,project,request,{validate=()=>{},signal}={}){
 validate();signal?.throwIfAborted();if(active>=2)throw new Error('Đang phân tích hai cảnh; thử lại sau.');active++;
 try{
  const selected=shotColorRequest(project,request),file=resolveContained(dir,selected.src).file,before=fs.statSync(file),meta=await probeMediaMetadata(file,{validate});
  if(meta.kind!=='video'||selected.from+selected.duration>meta.duration+.01)throw new Error('Chọn video đủ thời lượng nguồn.');
  const inputColor=requireSdrInput(meta,'Nguồn HDR (HLG/PQ): chuẩn hóa màu nguồn sang Rec.709 trước khi phân tích màu.');
  const ratio=Math.min(320/meta.displayWidth,320/meta.displayHeight),width=Math.max(1,Math.round(meta.displayWidth*ratio)),height=Math.max(1,Math.round(meta.displayHeight*ratio)),samples=[];
  for(const fraction of [.1,.5,.9]){validate();signal?.throwIfAborted();const at=selected.from+selected.duration*fraction;
   const {stdout}=await run('ffmpeg',['-nostdin','-v','error','-ss',String(at),'-i',file,'-frames:v','1','-vf',`scale=${width}:${height}`,'-pix_fmt','rgb24','-f','rawvideo','pipe:1'],{encoding:'buffer',windowsHide:true,timeout:20000,maxBuffer:1024*1024,signal});
   if(stdout.length!==width*height*3)throw new Error('Không đọc đủ khung hình.');samples.push({at:round(at),stats:analyzeRgb(stdout),image:bmp(stdout,width,height)});
  }
  validate();const after=fs.statSync(file);if(before.size!==after.size||before.mtimeMs!==after.mtimeMs)throw new Error('Nguồn đã đổi; phân tích lại.');
  return {...suggestShotColor(samples.map(s=>s.stats)),samples,source:selected,inputColor};
 }finally{active--;}
}
