import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
export function renderLockStatus(root){
 const directory=path.join(root,'workspace','contentos','render-lock');if(!fs.existsSync(directory))return null;
 let owner;try{owner=JSON.parse(fs.readFileSync(path.join(directory,'owner.json'),'utf8'));}catch{return {initializing:true};}
 let alive=false;try{process.kill(owner.pid,0);alive=true;}catch(error){if(error.code==='EPERM')alive=true;}
 return {...owner,ownerAlive:alive};
}
export function acquireRenderLock(root,{projectDir,kind}){
 const directory=path.join(root,'workspace','contentos','render-lock');fs.mkdirSync(path.dirname(directory),{recursive:true});
 try{fs.mkdirSync(directory);}catch(error){
  if(error.code!=='EEXIST')throw error;
  const owner=renderLockStatus(root),busy=new Error(owner?.ownerAlive||owner?.initializing?'Máy đang có lượt xuất video. Đợi hoàn tất hoặc hủy lượt hiện tại.':'Khóa render cũ còn tồn tại. Cần kiểm tra tiến trình render trước khi khôi phục.');busy.status=409;busy.code='RENDER_BUSY';throw busy;
 }
 const owner={id:crypto.randomUUID(),pid:process.pid,projectDir:path.resolve(projectDir),kind,createdAt:new Date().toISOString(),childPid:null};
 const file=path.join(directory,'owner.json');
 try{fs.writeFileSync(file,JSON.stringify(owner,null,2)+'\n',{flag:'wx'});}catch(error){fs.rmSync(directory,{recursive:true,force:true});throw error;}
 let released=false;
 return {
  id:owner.id,
  child(pid){if(released||!Number.isInteger(pid)||pid<1)return;owner.childPid=pid;const current=JSON.parse(fs.readFileSync(file,'utf8'));if(current.id!==owner.id)throw new Error('Chủ khóa render đã thay đổi.');const temp=file+'.tmp';fs.writeFileSync(temp,JSON.stringify(owner,null,2)+'\n');fs.renameSync(temp,file);},
  release(){if(released)return;let current;try{current=JSON.parse(fs.readFileSync(file,'utf8'));}catch{return;}if(current.id!==owner.id)return;fs.rmSync(directory,{recursive:true,force:true});released=true;}
 };
}

// Share the existing cross-process lock; never remove an uncertain owner.
export async function waitForRenderLock(root,options,{signal,validate=()=>{},onWait=()=>{},pollMs=500,timeoutMs=30*60*1000}={}){
 const started=Date.now();let notified=false;
 while(true){
  signal?.throwIfAborted();validate();
  try{return acquireRenderLock(root,options);}catch(error){
   if(error.code!=='RENDER_BUSY')throw error;
   const owner=renderLockStatus(root);
   if(owner&&!owner.ownerAlive&&!owner.initializing)throw Object.assign(new Error('Lượt render trước đã mất tiến trình chủ. Kiểm tra worker và đầu ra trước khi khôi phục; không tự xóa khóa.'),{code:'RENDER_OWNER_UNVERIFIED',status:409});
   if(Date.now()-started>=timeoutMs)throw Object.assign(new Error('Hết thời gian chờ lượt render; dự án được giữ nguyên.'),{code:'RENDER_WAIT_TIMEOUT',status:409});
   if(!notified){onWait();notified=true;}
   await new Promise((resolve,reject)=>{
    const stop=()=>{clearTimeout(timer);signal?.removeEventListener('abort',stop);reject(signal.reason||new Error('Đã hủy chờ render.'));};
    const timer=setTimeout(()=>{signal?.removeEventListener('abort',stop);resolve();},pollMs);
    signal?.addEventListener('abort',stop,{once:true});
   });
  }
 }
}
