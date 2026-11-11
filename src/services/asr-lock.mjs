import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
export function asrLockStatus(root){
 const folder=path.join(root,'workspace/contentos/asr-lock');if(!fs.existsSync(folder))return null;
 let owner;try{owner=JSON.parse(fs.readFileSync(path.join(folder,'owner.json'),'utf8'));}catch{return {initializing:true};}
 let ownerAlive=false;if(Number.isInteger(owner.pid)&&owner.pid>0)try{process.kill(owner.pid,0);ownerAlive=true;}catch(error){ownerAlive=error.code==='EPERM';}
 return {...owner,ownerAlive};
}
export async function waitForAsrLock(root,{signal,validate=()=>{},onWait=()=>{},pollMs=500,timeoutMs=30*60*1000}={}){
 const folder=path.join(root,'workspace/contentos/asr-lock'),file=path.join(folder,'owner.json'),started=Date.now();let notified=false;
 fs.mkdirSync(path.dirname(folder),{recursive:true});
 while(true){
  signal?.throwIfAborted();validate();
  try{fs.mkdirSync(folder);}catch(error){
   if(error.code!=='EEXIST')throw error;
   const owner=asrLockStatus(root);
   if(owner&&!owner.initializing&&!owner.ownerAlive)throw Object.assign(new Error('Lượt nhận giọng trước đã mất tiến trình chủ. Kiểm tra Whisper trước khi khôi phục; không tự xóa khóa.'),{code:'ASR_OWNER_UNVERIFIED'});
   if(Date.now()-started>=timeoutMs)throw Object.assign(new Error('Hết thời gian chờ nhận giọng trên máy.'),{code:'ASR_WAIT_TIMEOUT'});
   if(!notified){notified=true;onWait();}
   await new Promise((resolve,reject)=>{const stop=()=>{clearTimeout(timer);signal?.removeEventListener('abort',stop);reject(signal.reason||new Error('Đã hủy chờ nhận giọng.'));};const timer=setTimeout(()=>{signal?.removeEventListener('abort',stop);resolve();},pollMs);signal?.addEventListener('abort',stop,{once:true});});continue;
  }
  const owner={id:crypto.randomUUID(),pid:process.pid,createdAt:new Date().toISOString()};
  try{fs.writeFileSync(file,JSON.stringify(owner)+'\n',{flag:'wx'});}catch(error){fs.rmSync(folder,{recursive:true,force:true});throw error;}
  let released=false;return {release(){if(released)return;let current;try{current=JSON.parse(fs.readFileSync(file,'utf8'));}catch{return;}if(current.id!==owner.id)return;fs.rmSync(folder,{recursive:true,force:true});released=true;}};
 }
}
