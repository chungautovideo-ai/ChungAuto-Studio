import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {acceptsJob} from './ai-execution.mjs';

// Short cross-process exclusion, never stolen on a timeout: a crashed owner
// must be investigated before a possibly executing job can be reassigned.
export function assertClaimOwner(job,claimId){
  if(job?.status==='cancelled')throw Object.assign(new Error('Việc đã bị hủy. Dừng xử lý, không áp dụng kết quả.'),{status:409});
  if(job.claimedBy?.id&&claimId!==job.claimedBy.id)throw Object.assign(new Error('Việc đã được nhận bởi phiên khác hoặc thiếu mã nhận việc.'),{status:409});
}

// Retire only this terminal job's guard before its job file is replaced by a
// new first-build. Otherwise the new waiting record hides the terminal owner.
export function retireTerminalProjectJob(root,file){
 const base=fs.realpathSync(root),jobFile=fs.realpathSync(file),target=path.dirname(path.dirname(jobFile));
 const rel=path.relative(base,target);if(!rel||rel.startsWith('..')||path.isAbsolute(rel))throw new Error('Sai dự án.');
 const guard=path.join(target,'work/.ai-execution.lock'),gate=guard+'.inspect';let fd;
 try{fd=fs.openSync(gate,'wx');}catch(error){if(error.code==='EEXIST')return false;throw error;}
 try{
  let owner;try{owner=JSON.parse(fs.readFileSync(guard,'utf8'));}catch(error){if(error.code==='ENOENT')return true;throw error;}
  if(path.resolve(base,owner.jobFile)!==jobFile)return false;
  const state=JSON.parse(fs.readFileSync(jobFile,'utf8'));
  if(state.claimedBy?.id!==owner.id||!['done','error','cancelled'].includes(state.status))return false;
  fs.rmSync(guard);return true;
 }finally{fs.closeSync(fd);fs.rmSync(gate,{force:true});}
}

export function projectJobAvailable(root,file,job){
 const base=fs.realpathSync(root),target=fs.realpathSync(job.project?path.resolve(base,job.project):path.dirname(path.dirname(file))),relative=path.relative(base,target);
 if(!relative||relative.startsWith('..')||path.isAbsolute(relative))return false;
 const guard=path.join(target,'work/.ai-execution.lock');
 try{const owner=JSON.parse(fs.readFileSync(guard,'utf8')),ownerFile=fs.realpathSync(path.resolve(base,owner.jobFile)),rel=path.relative(base,ownerFile);if(rel.startsWith('..')||path.isAbsolute(rel))return false;const state=JSON.parse(fs.readFileSync(ownerFile,'utf8'));return state.claimedBy?.id===owner.id&&['done','error','cancelled'].includes(state.status);}catch(error){return error.code==='ENOENT'&&!fs.existsSync(guard);}
}

export function reserveProjectJob(root,file,job,claim){
  const base=fs.realpathSync(root),target=fs.realpathSync(job.project?path.resolve(base,job.project):path.dirname(path.dirname(file)));
  const relative=path.relative(base,target);
  if(!relative||relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Sai dự án nhận việc.');
  const work=path.join(target,'work');fs.mkdirSync(work,{recursive:true});
  const guard=path.join(work,'.ai-execution.lock');let fd;
  try{fd=fs.openSync(guard,'wx');}catch(error){if(error.code!=='EEXIST')throw error;
    // Terminal owner can be released only while serialized by this project gate.
    const gate=guard+'.inspect';let gateFd;
    try{gateFd=fs.openSync(gate,'wx');}catch(e){if(e.code==='EEXIST')return false;throw e;}
    try{
      let owner,state;
      try{owner=JSON.parse(fs.readFileSync(guard,'utf8'));const ownerFile=path.resolve(base,owner.jobFile);const rel=path.relative(base,fs.realpathSync(ownerFile));if(rel.startsWith('..')||path.isAbsolute(rel))return false;state=JSON.parse(fs.readFileSync(ownerFile,'utf8'));}catch{return false;}
      if(state.claimedBy?.id!==owner.id||!['done','error','cancelled'].includes(state.status))return false;
      fs.rmSync(guard);try{fd=fs.openSync(guard,'wx');}catch(e){if(e.code==='EEXIST')return false;throw e;}
    }finally{fs.closeSync(gateFd);fs.rmSync(gate,{force:true});}
  }
  try{fs.writeFileSync(fd,JSON.stringify({...claim,jobFile:path.relative(base,file).replace(/\\/g,'/')}));}finally{fs.closeSync(fd);}
  return true;
}

export function claimSessionJob(file,{root,agent,sessionId,explicit=false,now=()=>new Date().toISOString()}={}){
  const lock=file+'.claim.lock';let handle;
  try{handle=fs.openSync(lock,'wx');}catch(error){if(error.code==='EEXIST')return null;throw error;}
  try{
    fs.writeFileSync(handle,JSON.stringify({pid:process.pid,agent,sessionId:String(sessionId||'').slice(0,160),createdAt:now()}));
    const job=JSON.parse(fs.readFileSync(file,'utf8'));
    if(!acceptsJob(job,agent,{explicit}))return null;
    const startedAt=now();
    const claimed={...job,status:'working',agent,startedAt,claimedBy:{id:crypto.randomUUID(),mode:job.execution?.mode==='cli'?'cli':'session',agent,sessionId:String(sessionId||crypto.randomUUID()).slice(0,160),claimedAt:startedAt}};
    if(root&&!reserveProjectJob(root,file,job,claimed.claimedBy))return null;
    const temp=file+'.'+crypto.randomUUID()+'.tmp';
    try{fs.writeFileSync(temp,JSON.stringify(claimed,null,2)+'\n',{flag:'wx'});fs.renameSync(temp,file);}finally{fs.rmSync(temp,{force:true});}
    return claimed;
  }finally{fs.closeSync(handle);fs.rmSync(lock,{force:true});}
}
