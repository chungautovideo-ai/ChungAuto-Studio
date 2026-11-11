import fs from 'node:fs';
import crypto from 'node:crypto';
export function canCancelStagedJob(job){
 return !!job?.baseRevision&&!!job.candidate&&(job.kind==='revise'||!job.kind&&!!job.completionToken)&&['waiting','working'].includes(job.status);
}
export function stagedJobVersion(job){
 return crypto.createHash('sha256').update(JSON.stringify([job.createdAt,job.kind,job.project,job.candidate,job.baseRevision,job.completionToken,job.execution,job.claimedBy?.id,job.status])).digest('hex');
}
export function cancelStagedJob(file,version){
 let handle;const gate=file+'.claim.lock';
 try{handle=fs.openSync(gate,'wx');}catch(error){if(error.code==='EEXIST')throw Object.assign(new Error('Việc đang được nhận; làm mới rồi thử lại.'),{status:409});throw error;}
 try{
  const job=JSON.parse(fs.readFileSync(file,'utf8'));
  if(!canCancelStagedJob(job)||stagedJobVersion(job)!==version)throw Object.assign(new Error('Việc đã đổi hoặc đã kết thúc; làm mới trước khi hủy.'),{status:409});
  const next={...job,status:'cancelled',doneAt:new Date().toISOString(),cancelReason:'user-request'};
  const temp=file+'.'+crypto.randomUUID()+'.tmp';
  try{fs.writeFileSync(temp,JSON.stringify(next,null,2)+'\n',{flag:'wx'});fs.renameSync(temp,file);}finally{fs.rmSync(temp,{force:true});}
  return next;
 }finally{fs.closeSync(handle);fs.rmSync(gate,{force:true});}
}
