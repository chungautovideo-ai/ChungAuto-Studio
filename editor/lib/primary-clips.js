import {shiftSegmentZoom} from './source-zoom.js';
import {pinSourceAudioEnvelope,shiftSourceAudioEnvelope} from './source-audio.js';
import {speedOf} from './timemap.js';
import {reorderPrimaryClips} from './primary-sequence.js';
export function appendPrimaryClips(project,selected,assets,{beforeId,atSource}={}){
 if(atSource!==undefined&&(!Number.isFinite(atSource)||atSource<0||beforeId!==undefined))throw new Error('Chọn mốc nguồn hợp lệ hoặc đoạn đích, không chọn cả hai.');
 if(beforeId!==undefined&&(typeof beforeId!=='string'||!project.segments?.some(s=>s.id===beforeId)))throw new Error('Đoạn đích chèn không còn trong bản dựng.');
 if(!Array.isArray(selected)||!selected.length||selected.length>20)throw new Error('Chọn1–20video nguồn.');
 if(project.camera?.matte||project.audio?.clean||project.vfx?.some(v=>v.type==='freeze')||project.transitions?.cut==='dissolve'||project.segments?.some(s=>s.tIn==='dissolve'))throw new Error('Tắt matte/làm rõ giọng/freeze/dissolve trước khi thêm nguồn; các hiệu ứng này chưa hỗ trợ nhiều nguồn.');
 const next=structuredClone(project),metadata=new Map(assets.map(a=>[a.src,a]));
 const info=src=>{const a=metadata.get(src);if(!a||a.kind!=='video'||!Number.isFinite(a.duration)||a.duration<=0||!a.width||!a.height)throw new Error('Đọc metadata video trước khi thêm: '+src);return {width:a.width,height:a.height,duration:a.duration,hasAudio:a.hasAudio};};
 for(const s of next.segments){if(!s.src){s.src=next.source.video;s.mediaStart=s.in;}s.mediaInfo=info(s.src);if(s.mediaStart<0||s.mediaStart+s.out-s.in>s.mediaInfo.duration+.01)throw new Error('Đoạn cắt vượt file nguồn.');}
 if(atSource!==undefined){
  const ordered=next.segments.slice().sort((a,b)=>a.in-b.in),last=ordered.at(-1);
  const segment=ordered.find(s=>atSource>=s.in-1e-9&&atSource<s.out-1e-9);
  if(!segment){if(!last||Math.abs(atSource-last.out)>1e-9)throw new Error('Mốc chèn nằm ngoài đoạn nguồn.');}
  else if(Math.abs(atSource-segment.in)<1e-9)beforeId=segment.id;
  else{
   if(segment.keep===false)throw new Error('Chọn mốc trong đoạn đang giữ.');
   const rate=speedOf(next,segment),delta=atSource-segment.in;
   if(delta/rate<.05||(segment.out-atSource)/rate<.05)throw new Error('Mốc chèn quá sát mép đoạn; chọn điểm cắt hoặc cách mép tối thiểu0.05giây đầu ra.');
   pinSourceAudioEnvelope(segment,(segment.out-segment.in)/rate);
   const right=structuredClone(segment);right.id='s-'+crypto.randomUUID();right.in=atSource;right.mediaStart+=delta;delete right.tIn;
   shiftSegmentZoom(right,delta,next.speed);shiftSourceAudioEnvelope(right,delta/rate);segment.out=atSource;
   next.segments.splice(next.segments.indexOf(segment)+1,0,right);beforeId=right.id;
  }
 }
 let cursor=Math.max(Number(next.source.duration)||0,...next.segments.map(s=>s.out));const start=cursor;
 for(const choice of selected){
  const item=typeof choice==='string'?{src:choice}:choice;
  if(!item||typeof item!=='object'||Array.isArray(item)||Object.keys(item).some(k=>!['src','from','to','speed'].includes(k)))throw new Error('Lựa chọn cảnh nguồn không hợp lệ.');
  const src=item.src,mediaInfo=info(src),from=item.from??0,to=item.to??mediaInfo.duration,speed=item.speed??1;
  if(![from,to,speed].every(Number.isFinite)||from<0||to>mediaInfo.duration+.001||to-from<.05||speed<.25||speed>4||(to-from)/speed<.05)throw new Error('Điểm vào/ra hoặc tốc độ cảnh nguồn không hợp lệ.');
  const length=to-from,fade=Math.min(.02,length/speed/2);
  next.segments.push({id:'s-'+crypto.randomUUID(),src,mediaStart:from,mediaInfo,in:cursor,out:cursor+length,keep:true,text:'',speed,audioFadeIn:fade,audioFadeOut:fade});cursor+=length;
 }
 next.source={...next.source,timeline:'segments',duration:cursor,hasAudio:next.segments.some(s=>s.mediaInfo.hasAudio)};
 const addedIds=next.segments.slice(-selected.length).map(s=>s.id);
 if(beforeId!==undefined){const ids=next.segments.slice().sort((a,b)=>a.in-b.in).map(s=>s.id).filter(id=>!addedIds.includes(id));ids.splice(ids.indexOf(beforeId),0,...addedIds);const inserted=reorderPrimaryClips(next,ids);return {project:inserted,start:inserted.segments.find(s=>s.id===addedIds[0]).in,added:selected.length,addedIds};}
 return {project:next,start,added:selected.length,addedIds};
}
