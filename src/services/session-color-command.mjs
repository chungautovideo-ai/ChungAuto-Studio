import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {resolveContained} from './storage.mjs';
import {assertClaimOwner} from './session-job-claims.mjs';
import {assertProjectRevision} from './project-revisions.mjs';
import {createApiColorNormalization} from './api-color-normalization.mjs';

export async function sessionColorCommand(root,projectPath,{claimId,request,list=false,apply=false,signal}={},options={}){
 const dir=resolveContained(root,projectPath).file,read=file=>JSON.parse(fs.readFileSync(file,'utf8')),jobFile=resolveContained(dir,'work/ai-job.json').file,job=read(jobFile);
 if(job.kind||!job.candidate||!job.completionToken||!job.baseRevision||!job.claimedBy?.id||!claimId)throw new Error('Cần việc dựng mới đã nhận bằng claim và có candidate.');
 const file=resolveContained(root,job.candidate).file,expected=path.join(dir,'work/build-candidates',job.completionToken,'work/candidate-project.json');
 if(file!==expected)throw new Error('Sai candidate chuẩn hóa màu.');
 const original=fs.readFileSync(file),signature=JSON.stringify(job),project=JSON.parse(original);
 const validate=()=>{signal?.throwIfAborted();const current=read(jobFile);assertClaimOwner(current,claimId);if(current.status!=='working'||JSON.stringify(current)!==signature)throw new Error('Việc dựng đã đổi; chưa áp màu.');assertProjectRevision(path.join(dir,'project.json'),job.baseRevision);if(!fs.readFileSync(file).equals(original))throw new Error('Candidate đã đổi; chạy lại trên bản mới.');};
 validate();
 const context=(options.createContext||createApiColorNormalization)(dir,{validate,signal});
 if(list)return {ok:true,luts:context.list(),appliedToCandidate:false};
 const lock=file+'.color-command.lock';let handle;
 try{handle=fs.openSync(lock,'wx');}catch(error){if(error.code==='EEXIST')throw new Error('Candidate đang có lượt chuẩn hóa màu; chờ lượt đó kết thúc.');throw error;}
 try{
  fs.writeFileSync(handle,JSON.stringify({pid:process.pid,createdAt:new Date().toISOString()}));validate();
  const result=await context.apply(project,request);validate();
  if(apply){const temp=file+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(temp,JSON.stringify(result.project,null,2)+'\n',{flag:'wx'});validate();fs.renameSync(temp,file);}finally{fs.rmSync(temp,{force:true});}}
  return {ok:true,appliedToCandidate:apply,result:result.result,review:'Xem bản màu/chống rung trước khi hoàn tất; cần quét lại mask nếu thay nguồn.'};
 }finally{fs.closeSync(handle);fs.rmSync(lock,{force:true});}
}
