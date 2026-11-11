import {brollEntranceTiming} from '../../editor/lib/broll-transition.js';
import {brollSpeechOverlap} from './broll-speech-overlap.mjs';
import {resolveTimeline} from '../../editor/lib/build.mjs';
import {brollAnchorStatus} from '../../editor/ui/contentos-broll-anchor.js';

export function brollTimingReport(project) {
  const timeline=resolveTimeline(project),round=n=>Math.round(n*1000)/1000;
  const words=timeline.caps.flatMap(c=>c.words.map(w=>({captionId:c.id,text:w.w,outputStart:round(c.start+w.s),outputEnd:round(c.start+w.e)}))).sort((a,b)=>a.outputStart-b.outputStart||a.outputEnd-b.outputEnd);
  const all=timeline.brolls,items=all.slice(0,100).map(b=>{
    const entrance=brollEntranceTiming(b),anchor=brollAnchorStatus(timeline.tm,b),codes=brollEntranceAdvisories(b,entrance);
    if(anchor.anchorMoved)codes.push('ANCHOR_IN_REMOVED_FOOTAGE');
    if(anchor.anchorOutsideContent)codes.push('ANCHOR_OUTSIDE_CONTENT');
    return {id:b.id,src:b.src,...anchor,outputStart:b.start,outputEnd:round(b.start+b.dur),outputDuration:b.dur,mediaStart:Number(b.mediaStart)||0,entrance,speechOverlap:brollSpeechOverlap(words,b.start,round(b.start+b.dur)),advisories:codes};
  });
  return {clock:'output',items,total:all.length,truncated:all.length>100,advisoryOnly:true,applied:false,visualReviewed:false,audioListened:false,notes:'projectAt là at trước cắt; các mốc output/settled là giây sau cắt. settled chỉ là thời gian sau hiệu ứng vào, không chứng minh chi tiết dễ đọc hoặc hình đúng lời. SHORT_INSERT (<0,6s) và hiệu ứng chiếm hơn nửa cảnh là gợi ý xem lại, không bắt kéo dài hoặc đổi hiệu ứng; giữ lựa chọn đã chốt. Lời từ caption có thể thiếu/sai. Không kiểm nguồn media.'};
}

export function brollEntranceAdvisories(b,entrance=brollEntranceTiming(b)){
 const codes=[];
 if(entrance.entranceWithinShot>=b.dur-1e-6&&entrance.animationDuration>0)codes.push('ENTRANCE_COVERS_SHOT');
 else if(entrance.entranceWithinShot>b.dur*.5)codes.push('ENTRANCE_OVER_HALF_SHOT');
 if(b.dur<.6)codes.push('SHORT_INSERT');
 return codes;
}
