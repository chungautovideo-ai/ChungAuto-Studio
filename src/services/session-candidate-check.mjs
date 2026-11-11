import fs from 'node:fs';import path from 'node:path';
import {candidateReview} from './candidate-review.mjs';
import {assertClaimOwner} from './session-job-claims.mjs';
import {resolveContained} from './storage.mjs';
import {assertProjectRevision} from './project-revisions.mjs';
import {resolveTimeline} from '../../editor/lib/build.mjs';
import {kiemDoHoa} from '../../editor/tools/kiem-do-hoa.mjs';
import {captionPhraseSearch,validateCaptionPhrase} from './caption-phrase-search.mjs';

// Structural check only. Never starts a browser, exports, or applies a candidate.
export function checkSessionCandidate(root,jobPath,{claimId,window,find}={}){
 if(window&&(!Number.isFinite(window.from)||!Number.isFinite(window.to)||window.from<0||window.to<=window.from||window.to-window.from>30))throw Error('Khoảng xem lời cần 0 ≤ from < to, tối đa 30 giây output.');
 if(find!==undefined)validateCaptionPhrase(find);
 const dir=resolveContained(root,jobPath).file,jobFile=path.join(dir,'work/ai-job.json'),bytes=fs.readFileSync(jobFile),job=JSON.parse(bytes);
 if(!claimId||!job.claimedBy?.id)throw Error('Cần claim của việc đã nhận.');assertClaimOwner(job,claimId);if(job.status!=='working'||job.kind&&job.kind!=='revise')throw Error('Cần việc dựng/sửa đang làm và đúng claim.');
 const target=job.kind==='revise'?resolveContained(root,job.project).file:dir;
 const current=JSON.parse(fs.readFileSync(path.join(target,'project.json'))),review=candidateReview(root,jobPath,current.workspaceId||'default');
 assertProjectRevision(path.join(target,'project.json'),job.baseRevision);
 const timeline=resolveTimeline(review.candidate),graphics=kiemDoHoa(target,{project:review.candidate});
 if(!Number.isFinite(timeline.tm.total)||timeline.tm.total<=0)throw Error('Bản dựng không có thời lượng hợp lệ.');
 let timing,phraseSearch;
 if(window||find!==undefined){
  if(window&&window.from>=timeline.tm.total)throw Error('Khoảng xem lời nằm ngoài timeline output.');
  const from=window?.from??0,to=Math.min(window?.to??Infinity,timeline.tm.total),round=n=>Math.round(n*1000)/1000;
  const overlaps=(a,b)=>a<to&&b>from;
  // Preserve exact project-clock anchors. Inverting output time is ambiguous at cuts.
  const anchors=new Map(),key=(id,text,start,end)=>JSON.stringify([id??null,text,start,end]);
  for(const line of timeline.p.captions.lines||[]){
   const words=(line.words||[]).filter(w=>timeline.tm.isKept((w.s+w.e)/2));if(!words.length)continue;
   const captionStart=round(timeline.tm.srcToOut(words[0].s));
   for(const w of words){
    // Match the renderer's relative-word rounding, including sub-millisecond source times.
    const start=round(captionStart+round(timeline.tm.srcToOut(w.s)-captionStart)),end=round(captionStart+round(timeline.tm.srcToOut(w.e)-captionStart)),k=key(line.id,w.w,start,end);
    if(!anchors.has(k))anchors.set(k,[]);anchors.get(k).push({projectStart:w.s,projectEnd:w.e});
   }
  }
  const captionWords=timeline.caps.flatMap(c=>c.words.map(w=>{
   const outputStart=round(c.start+w.s),outputEnd=round(c.start+w.e),anchor=anchors.get(key(c.id,w.w,outputStart,outputEnd))?.shift();
   return {captionId:c.id,text:w.w,...anchor,outputStart,outputEnd};
  }));
  if(find!==undefined)phraseSearch=captionPhraseSearch(captionWords,timeline.brolls,find);
  const allWords=captionWords.filter(w=>overlaps(w.outputStart,w.outputEnd));
  const allBrolls=timeline.brolls.filter(b=>overlaps(b.start,b.start+b.dur));
  const allSegments=timeline.tm.segs.filter(s=>overlaps(s.outStart,s.outEnd));
  if(window)timing={clock:'output',from,to,words:allWords.slice(0,200),wordsTruncated:allWords.length>200,
   brolls:allBrolls.slice(0,100).map(b=>({id:b.id,src:b.src,projectAt:b.at||0,outputStart:b.start,outputEnd:round(b.start+b.dur),outputDuration:b.dur,mediaStart:Number(b.mediaStart)||0,speed:Math.max(.25,Math.min(4,Number(b.speed)||1))})),brollsTruncated:allBrolls.length>100,
   segments:allSegments.slice(0,100).map(s=>({id:s.id,projectIn:s.in,projectOut:s.out,outputStart:round(s.outStart),outputEnd:round(s.outEnd),rate:s.rate,src:s.src||review.candidate.source?.video,mediaStart:s.mediaStart??s.in})),segmentsTruncated:allSegments.length>100,
   notes:'projectStart/projectEnd là mốc gốc của từ trên timeline dự án trước cắt; có thể dùng projectStart làm at, không dùng outputStart. outputStart/outputEnd là mốc sau cắt/tốc độ; dur là giây phát đầu ra. mediaStart là clock riêng trong file B-roll. Lời lấy từ caption candidate, có thể sai/thiếu; không phải transcript đã duyệt hoặc kiểm hình khớp nghĩa.'};
 }
 assertProjectRevision(resolveContained(root,job.candidate).file,review.candidateRevision);assertProjectRevision(path.join(target,'project.json'),job.baseRevision);
 if(!fs.readFileSync(jobFile).equals(bytes))throw Error('Việc đã đổi khi kiểm bản dựng.');
 return {...(timing?{timing}:{}),...(phraseSearch?{phraseSearch}:{}),ok:graphics.loi.length===0,candidateRevision:review.candidateRevision,duration:timeline.tm.total,counts:{segments:timeline.tm.segs.length,texts:timeline.texts.length,blocks:timeline.blocks.length,brolls:timeline.brolls.length,captions:timeline.caps.length},errors:graphics.loi,warnings:graphics.canh,timelineResolved:true,htmlBuilt:false,applied:false,rendered:false,visualReviewed:false,audioListened:false,limits:'Chỉ kiểm cấu trúc timeline/đồ họa theo lời; không chạy build HTML. Không xác minh media, hình khớp nội dung, chính tả ASR, bố cục, chuyển động, mix hoặc quyền tư liệu. Xem/nghe preview trước kết luận chất lượng.'};
}
