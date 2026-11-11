import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {resolveContained} from './storage.mjs';
import {candidateReview} from './candidate-review.mjs';
import {assertClaimOwner} from './session-job-claims.mjs';
import {assertProjectRevision,projectRevision} from './project-revisions.mjs';
import {readTemplateSnapshot} from './template-snapshots.mjs';
import {createApiPresets} from './api-presets.mjs';

// Same preset adapter as API workers; only writes the claimed candidate.
export async function sessionPresets(root,jobPath,{claimId,request,expectedRevision,apply=false}={}){
 const dir=resolveContained(root,jobPath).file,jobFile=path.join(dir,'work/ai-job.json'),bytes=fs.readFileSync(jobFile),job=JSON.parse(bytes);
 if(!claimId||!job.claimedBy?.id)throw Error('Cần claim của việc đang làm.');
 const target=job.kind==='revise'?resolveContained(root,job.project).file:dir;
 const live=path.join(target,'project.json'),current=JSON.parse(fs.readFileSync(live));
 const review=candidateReview(root,jobPath,current.workspaceId||'default'),file=resolveContained(root,job.candidate).file;
 const snapshotDir=resolveContained(root,job.templateSnapshot?.directory||'').file;
 if(!job.templateSnapshot||snapshotDir!==path.join(path.dirname(file),'template-snapshot'))throw Error('Cần mẫu snapshot đúng candidate của việc.');
 const validate=()=>{
  const now=JSON.parse(fs.readFileSync(jobFile));assertClaimOwner(now,claimId);
  if(now.status!=='working'||now.kind&&now.kind!=='revise'||!fs.readFileSync(jobFile).equals(bytes))throw Error('Việc đã đổi hoặc không còn làm; chưa chèn preset.');
  assertProjectRevision(live,job.baseRevision);assertProjectRevision(file,review.candidateRevision);
  return readTemplateSnapshot(snapshotDir,job.templateSnapshot);
 };
 const pinned=validate(),presets=createApiPresets(pinned.template);
 if(!presets)throw Error('Mẫu không có preset dùng được.');
 if(!request){if(apply)throw Error('Thiếu yêu cầu chèn preset.');return {ok:true,candidateRevision:review.candidateRevision,readOnly:true,...presets.list(),clock:'at là timeline dự án trước cắt; dur là giây output. Không chép outputStart vào at.'};}
 if(!expectedRevision||expectedRevision!==review.candidateRevision)throw Error('Đọc lại danh mục và dùng candidateRevision mới trước khi chèn.');
 const batch=Object.hasOwn(request,'items');
 if(batch&&(Object.keys(request).length!==1||!Array.isArray(request.items)||request.items.length<1||request.items.length>20))throw Error('Lô preset chỉ gồm items từ 1 đến 20 yêu cầu.');
 const requests=batch?request.items:[request],inserted=[];
 let next=review.candidate;
 for(const entry of requests){
  if(!entry||typeof entry!=='object'||Array.isArray(entry)||Object.keys(entry).some(k=>!['presetId','at','dur','values','minhHoa'].includes(k)))throw Error('Yêu cầu chỉ gồm presetId, at, dur, values và minhHoa.');
  const previous=next;next=await presets.insert(previous,entry);validate();
  const group=(next.texts?.length||0)>(previous.texts?.length||0)?'texts':'blocks',added=next[group].at(-1);
  inserted.push({group,item:{id:added.id,presetId:entry.presetId,at:added.at,dur:added.dur}});
 }
 if(apply){
  const temp=file+'.'+crypto.randomUUID()+'.tmp';
  try{fs.writeFileSync(temp,JSON.stringify(next,null,2)+'\n',{flag:'wx'});validate();fs.renameSync(temp,file);}finally{fs.rmSync(temp,{force:true});}
 }
 return {ok:true,appliedToCandidateOnly:apply,candidateRevision:apply?projectRevision(file):review.candidateRevision,...(batch?{count:inserted.length,items:inserted}:inserted[0]),rendered:false,published:false,limits:'Điền preset không xác minh lời/hình hoặc bố cục; xem preview và kiểm cấu trúc trước hoàn tất.'};
}
