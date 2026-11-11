import {makeTimemap,round3} from '../lib/timemap.js';
import {brollEntranceTiming} from '../lib/broll-transition.js';
import {captionPhraseSearch} from './contentos-caption-phrase-search.js';
import {brollAnchorStatus} from './contentos-broll-anchor.js';
export function brollEditorPhraseSearch(project,phrase){
 const tm=makeTimemap(project),round=round3;
 const words=project.captions?.enabled===false?[]:(project.captions?.lines||[]).flatMap(line=>{
  const kept=(line.words||[]).filter(w=>tm.isKept((w.s+w.e)/2));if(!kept.length)return [];
  const start=round(tm.srcToOut(kept[0].s));
  return kept.map(w=>({captionId:line.id,text:w.w,projectStart:w.s,projectEnd:w.e,outputStart:round(start+round(tm.srcToOut(w.s)-start)),outputEnd:round(start+round(tm.srcToOut(w.e)-start))}));
 }).sort((a,b)=>a.outputStart-b.outputStart||a.outputEnd-b.outputEnd);
 return {...captionPhraseSearch(words,[],phrase),captionDisabled:project.captions?.enabled===false};
}
export function brollEditorTiming(project,item){
 const tm=makeTimemap(project),start=round3(tm.srcToOut(item.at||0));
 if(item.hidden||!Number.isFinite(start)||start>=tm.contentTotal)return {available:false,reason:item.hidden?'Cảnh đang ẩn.':'Cảnh nằm ngoài phần video đang giữ.'};
 const duration=round3(Math.max(.2,Math.min(Number(item.dur)||2,tm.contentTotal-start))),end=round3(start+duration);
 const words=project.captions?.enabled===false?[]:(project.captions?.lines||[]).flatMap(line=>(line.words||[]).filter(w=>tm.isKept((w.s+w.e)/2)).map(w=>({text:w.w,outputStart:round3(tm.srcToOut(w.s)),outputEnd:round3(tm.srcToOut(w.e))}))).sort((a,b)=>a.outputStart-b.outputStart||a.outputEnd-b.outputEnd);
 const matching=words.filter(w=>w.outputStart<end&&w.outputEnd>start),next=words.find(w=>w.outputStart>=end);
 return {available:true,...brollAnchorStatus(tm,item),start,end,duration,entrance:brollEntranceTiming({...item,start,dur:duration}),words:matching.slice(0,32),truncated:matching.length>32,nextWord:next,captionDisabled:project.captions?.enabled===false,startsInsideWord:matching.some(w=>w.outputStart<start&&w.outputEnd>start),endsInsideWord:matching.some(w=>w.outputStart<end&&w.outputEnd>end)};
}
