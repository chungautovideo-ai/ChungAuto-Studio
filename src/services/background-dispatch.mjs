import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function createBackgroundDispatch(root,{activeCount=()=>0,onError=()=>{},schedule=fn=>setTimeout(fn,1000)}={}){
 const file=path.join(root,'workspace/contentos/background-dispatch.json'),pending=new Map();
 const journalFile=path.join(root,'workspace/contentos/background-pending.json');
 const journal=fs.existsSync(journalFile)?JSON.parse(fs.readFileSync(journalFile,'utf8')):{entries:[]};
 const recovered=new Map(journal.entries.map(entry=>[entry.id,entry]));
 const records=new Map(journal.entries.map(entry=>[entry.id,entry]));
 const persist=()=>{fs.mkdirSync(path.dirname(journalFile),{recursive:true});const temp=journalFile+'.'+crypto.randomUUID()+'.tmp';const body=JSON.stringify({entries:[...records.values()]})+'\n';try{fs.writeFileSync(temp,body,{flag:'wx'});
   // Ổ mạng (SMB)/antivirus có thể khoá file đích tạm thời: rename báo EPERM/EBUSY/EACCES → thử lại, cuối cùng ghi đè trực tiếp.
   for(let i=0;;i++){try{fs.renameSync(temp,journalFile);break;}catch(error){
    if(!['EPERM','EBUSY','EACCES'].includes(error?.code))throw error;
    if(i>=5){fs.writeFileSync(journalFile,body);break;}
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100*(i+1));}}
  }finally{fs.rmSync(temp,{force:true});}};
 let settings=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{maxWorkers:2,paused:false};
 let timer=null,draining=false;
 const arm=()=>{if(pending.size&&!timer){timer=schedule(()=>{timer=null;drain();});timer?.unref?.();}};
 function drain(){
  if(draining)return;draining=true;
  try{
   if(settings.paused)return;
   for(const [id,entry] of pending){
    if(activeCount()>=settings.maxWorkers)break;
    try{
     const record=records.get(id);if(record){records.set(id,{...record,state:'dispatching'});persist();}
     const result=entry.start();
     if(result?.busy){entry.busy=true;if(record){records.set(id,record);persist();}continue;}
     pending.delete(id);entry.result=result;records.delete(id);persist();
    }
    catch(error){pending.delete(id);onError(id,error);}
   }
  }finally{draining=false;arm();}
 }
 return {
  enqueue(id,start,metadata){
   if(recovered.has(id))return {queued:true,running:false,recoveryRequired:true};
   if(!pending.has(id)){if(metadata){records.set(id,{id,state:'pending',metadata,queuedAt:new Date().toISOString()});persist();}pending.set(id,{start});}
   const entry=pending.get(id);drain();return pending.has(id)?{queued:true,running:false}:entry.result;
  },
  remove(id){pending.delete(id);recovered.delete(id);records.delete(id);persist();},
  recoverable(){return structuredClone([...recovered.values()]);},
  waitingReason(id){
   if(recovered.has(id))return 'recovery';
   const entry=pending.get(id);if(!entry)return null;
   if(settings.paused)return 'paused';
   if(entry.busy)return 'project-busy';
   return activeCount()>=settings.maxWorkers?'capacity':'dispatch';
  },
  releaseRecovered(id){const entry=recovered.get(id);if(!entry||entry.state!=='pending')throw Object.assign(new Error('Việc có thể đã bắt đầu; kiểm tra worker và đầu ra trước khi xử lý.'),{status:409});recovered.delete(id);records.delete(id);persist();return entry;},
  drain,
  status(){return {...settings,active:activeCount(),queued:pending.size,recoverable:recovered.size};},
  save(value){
   if(!Number.isInteger(value.maxWorkers)||value.maxWorkers<1||value.maxWorkers>8||typeof value.paused!=='boolean')throw Object.assign(new Error('Số worker từ 1 đến 8 và trạng thái nhận việc phải hợp lệ.'),{status:400});
   const next={maxWorkers:value.maxWorkers,paused:value.paused};fs.mkdirSync(path.dirname(file),{recursive:true});
   const temp=file+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(temp,JSON.stringify(next)+'\n',{flag:'wx'});fs.renameSync(temp,file);}finally{fs.rmSync(temp,{force:true});}settings=next;
   drain();return this.status();
  }
 };
}
