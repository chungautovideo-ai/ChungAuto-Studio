import {makeTimemap,round3} from './timemap.js';

// Deterministic placement only. Asset semantics and rights stay with the user.
export function planBrollAssembly(project,assets,{shotSeconds=4,repeat=false}={}){
 if(!Number.isFinite(shotSeconds)||shotSeconds<1||shotSeconds>30)throw new Error('Mỗi cảnh cần dài từ 1 đến 30 giây.');
 if(!Array.isArray(assets)||!assets.length||assets.length>100)throw new Error('Chọn từ 1 đến 100 tư liệu.');
 if((project.brolls||[]).some(b=>!b.hidden))throw new Error('Đã có cảnh trám trên timeline. Giữ nguyên bản dựng; ẩn hoặc xóa các cảnh cũ trước khi ráp toàn bộ.');
 const seen=new Set();
 for(const asset of assets){if(!asset||typeof asset.src!=='string'||seen.has(asset.src)||!['image','video'].includes(asset.kind)||asset.kind==='video'&&(!Number.isFinite(asset.duration)||asset.duration<0.2))throw new Error('Tư liệu không hợp lệ hoặc bị lặp trong danh sách.');seen.add(asset.src);}
 const tm=makeTimemap(project);if(!Number.isFinite(tm.total)||tm.total<0.2||tm.total>1800)throw new Error('Bản dựng cần dài từ 0,2 giây đến 30 phút.');
 const clips=[];let cursor=0,index=0;
 while(cursor<tm.total-0.0005&&(repeat||index<assets.length)){
  if(clips.length>=2000)throw new Error('Quá nhiều cảnh. Tăng độ dài mỗi cảnh.');
  const asset=assets[index%assets.length],remaining=tm.total-cursor,dur=round3(Math.min(shotSeconds,asset.kind==='video'?asset.duration:shotSeconds,remaining));
  if(dur<=0)throw new Error('Không xác định được độ dài cảnh.');
  // The build runtime enforces a 0.2s clip minimum. Absorb a tiny tail
  // into a preceding image/long-enough video rather than overlap output.
  if(dur<0.2){const last=clips.at(-1),previous=assets[(index-1)%assets.length];if(last&&(previous.kind==='image'||last.dur+dur<=previous.duration)){last.dur=round3(last.dur+dur);cursor=tm.total;}break;}
  clips.push({src:asset.src,at:round3(tm.outToSrc(cursor)),dur,mediaStart:0,mode:'full',tIn:'none',audioVol:0,outputStart:round3(cursor)});
  cursor=round3(cursor+dur);index++;
 }
 return {clips,total:round3(tm.total),covered:round3(cursor),uncovered:round3(Math.max(0,tm.total-cursor)),reused:Math.max(0,index-assets.length),selectionOnly:true};
}
