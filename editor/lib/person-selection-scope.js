import {makeTimemap,round3} from './timemap.js';
import {normalizePersonSelections} from './person-selection.js';

function union(ranges){
 const result=[];
 for(const r of ranges.filter(r=>Number.isFinite(r.from)&&Number.isFinite(r.to)&&r.to>r.from).sort((a,b)=>a.from-b.from)){
  const last=result.at(-1);if(last&&r.from<=last.to)last.to=Math.max(last.to,r.to);else result.push({...r});
 }
 return result;
}
function gaps(usage,coverage){
 const missing=[];
 for(const u of usage){let cursor=u.from;for(const c of coverage){if(c.to<=cursor||c.from>=u.to)continue;if(c.from>cursor)missing.push({from:cursor,to:Math.min(c.from,u.to)});cursor=Math.max(cursor,c.to);if(cursor>=u.to)break;}if(cursor<u.to)missing.push({from:cursor,to:u.to});}
 return missing;
}

// Source clock, not virtual timeline or output clock. Mirrors kept footage and
// B-roll playback windows; it does not claim the mask identified the right person.
export function usedPersonSourceRanges(project,src){
 const tm=makeTimemap(project),ranges=tm.segs.filter(s=>(s.src||project.source?.video)===src).map(s=>({from:s.mediaStart??s.in,to:(s.mediaStart??s.in)+(s.out-s.in)}));
 for(const b of project.brolls||[]){
  if(b.hidden||b.src!==src)continue;
  const start=round3(tm.srcToOut(b.at||0));if(start>=tm.contentTotal)continue;
  const duration=Math.min(tm.contentTotal-start,round3(Math.max(.2,Math.min(Number(b.dur)||2,tm.contentTotal-start)))),rate=Number(b.speed)>0?Math.max(.25,Math.min(4,Number(b.speed))):1,from=Number(b.mediaStart)||0;
  ranges.push({from,to:from+duration*rate});
 }
 return union(ranges);
}

export function personSelectionScope(project,src,sha256,hasPersonMask=true){
 const usedRanges=usedPersonSourceRanges(project,src);let selections;
 if(!hasPersonMask)return {mode:'unavailable',reason:'Nguồn chưa có mặt nạ người/da semantic; quét lại trước khi chỉnh toàn thân.',usedRanges,ranges:[],uncoveredUsedRanges:usedRanges};
 try{selections=normalizePersonSelections(project.camera?.beauty?.personSelections);}catch(error){return {mode:'unavailable',reason:error.message,usedRanges,ranges:[],uncoveredUsedRanges:usedRanges};}
 const selected=selections.filter(s=>s.src===src);
 if(!selected.length)return {mode:'all-people',usedRanges,ranges:[],uncoveredUsedRanges:[],outsideRanges:'Uses the semantic person/skin mask for this file; no selected-person restriction.'};
 if(selected.some(s=>s.sha256!==sha256))return {mode:'unavailable',reason:'Mã nguồn của vùng chọn không khớp; quét và chọn lại, không dùng toàn bộ người thay thế.',usedRanges,ranges:[],uncoveredUsedRanges:usedRanges};
 const ranges=selected.map(s=>({from:s.from,to:s.to??s.from+s.f.length/s.fps,fps:s.fps,samples:s.f.length,...(s.adjustments?{adjustments:{...s.adjustments}}:{})})).sort((a,b)=>a.from-b.from);
 return {mode:'selected-ranges',usedRanges,ranges,uncoveredUsedRanges:gaps(usedRanges,union(ranges.map(({from,to})=>({from,to})))),outsideRanges:'No personLight/bodyWhite/bodySmooth correction outside selected ranges. Face landmark effects are separate.',identityVerified:false};
}
