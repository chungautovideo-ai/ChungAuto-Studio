import fs from 'node:fs';import path from 'node:path';
import {resolveContained} from './storage.mjs';
import {candidateReview} from './candidate-review.mjs';
import {assertClaimOwner} from './session-job-claims.mjs';
import {assertProjectRevision} from './project-revisions.mjs';
import {createEditorContext} from './editor-context.mjs';

// Reuse API media inspection/decoding for local session/CLI workers. Never edits
// the candidate or source; images remain local and binary payloads stay out of chat.
export async function sampleSessionMedia(root,jobPath,{claimId,src,times,signal}={}){
 const dir=resolveContained(root,jobPath).file,jobFile=resolveContained(dir,'work/ai-job.json').file,bytes=fs.readFileSync(jobFile),job=JSON.parse(bytes);
 if(!claimId||!job.claimedBy?.id)throw Error('Cần claim của việc đã nhận.');
 assertClaimOwner(job,claimId);
 if(job.status!=='working'||job.kind&&job.kind!=='revise')throw Error('Cần việc dựng/sửa đang làm.');
 const target=job.kind==='revise'?resolveContained(root,job.project).file:dir;
 const current=JSON.parse(fs.readFileSync(path.join(target,'project.json'))),review=candidateReview(root,jobPath,current.workspaceId||'default'),candidateFile=resolveContained(root,job.candidate).file;
 const validate=()=>{signal?.throwIfAborted();if(!fs.readFileSync(jobFile).equals(bytes))throw Error('Việc đã đổi hoặc bị hủy khi khảo sát.');assertProjectRevision(path.join(target,'project.json'),job.baseRevision);assertProjectRevision(candidateFile,review.candidateRevision);};
 validate();
 // A sampler can only create a fresh child under the already resolved candidate
 // directory, not an operator-selected arbitrary filesystem destination.
 const parent=path.dirname(candidateFile),scratch=fs.mkdtempSync(path.join(parent,'media-sample-'));
 try{
  const context=createEditorContext(target,{project:review.candidate,validate,artifactDir:scratch});
  const result=await context.sample(src,times,{signal});validate();
  const frames=result.frames.map(({dataUrl,id,...frame})=>({...frame,path:path.relative(root,path.join(scratch,id+'.jpg')).replaceAll('\\','/')}));
  return {ok:true,media:result.media,frames,candidateRevision:review.candidateRevision,applied:false,rendered:false,method:result.method,note:'Mở từng ảnh bằng công cụ xem ảnh. Chỉ các mốc đã chọn; không xác nhận đã xem hành động liên tục hoặc nghe âm thanh. Không suy sản phẩm từ tên file.'};
 }catch(error){fs.rmSync(scratch,{recursive:true,force:true});throw error;}
}
