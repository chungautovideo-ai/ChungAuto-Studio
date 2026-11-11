import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {assertClaimOwner} from './session-job-claims.mjs';

// A session report is evidence of recent contact, never proof a process is alive.
export function reportSessionContact(file,claimId,{now=Date.now()}={}){
 const gate=file+'.claim.lock',fd=fs.openSync(gate,'wx');
 try{
  const job=JSON.parse(fs.readFileSync(file,'utf8'));assertClaimOwner(job,claimId);
  if(job.status!=='working'||job.claimedBy?.mode!=='session'||!job.claimedBy?.id)throw new Error('Chỉ phiên chat đang nhận việc mới báo liên lạc.');
  const target=path.join(path.dirname(file),'session-contact.json'),temp=target+'.'+crypto.randomUUID()+'.tmp';
  try{fs.writeFileSync(temp,JSON.stringify({claimId:job.claimedBy.id,at:now}),{flag:'wx'});fs.renameSync(temp,target);}finally{fs.rmSync(temp,{force:true});}
  return {at:now};
 }finally{fs.closeSync(fd);fs.rmSync(gate,{force:true});}
}
export function readSessionContact(file,job,{now=Date.now(),maxAgeMs=5*60*1000}={}){
 if(job.status!=='working'||job.claimedBy?.mode!=='session')return null;
 try{
  const value=JSON.parse(fs.readFileSync(path.join(path.dirname(file),'session-contact.json'),'utf8'));
  if(value.claimId!==job.claimedBy.id||!Number.isFinite(value.at)||value.at>now)return null;
  return {at:value.at,state:now-value.at<=maxAgeMs?'recent':'stale'};
 }catch{return null;}
}
