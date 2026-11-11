import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {resolveContained} from './storage.mjs';
import {assertProjectRevision,projectRevision} from './project-revisions.mjs';
import {renderLockStatus} from './render-lock.mjs';
import {verifyArtifact} from './artifact-integrity.mjs';

// Reuse the real export CLI, including snapshot, machine lock and artifact probing.
export function runBatchRender(root,item,{taskId,index,signal,onProgress}){
 return new Promise((resolve,reject)=>{
  signal.throwIfAborted();const directory=resolveContained(root,item.dir).file,statusFile=path.join(directory,'work/render.json');
  const worker=spawn(process.execPath,[path.join(root,'editor/tools/xuat-video.mjs'),item.dir,'--quality','final','--revision',item.revision,'--batch-id',taskId,'--batch-item',String(index)],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});let output='';
  const read=()=>{try{return JSON.parse(fs.readFileSync(statusFile,'utf8'));}catch{return null;}};
  const owned=state=>state?.batchTaskId===taskId&&state.batchItem===index&&state.pid===worker.pid;
  const cancel=()=>{const state=read();if(owned(state)&&state.running){state.cancel=true;fs.writeFileSync(statusFile,JSON.stringify(state,null,2));}else if(renderLockStatus(root)?.pid!==worker.pid){worker.kill();}};
  const timer=setInterval(()=>{if(signal.aborted)cancel();const state=read();if(owned(state))onProgress?.({progress:state.progress||0,snapshotId:state.snapshotId||null});},800);timer.unref?.();
  signal.addEventListener('abort',cancel,{once:true});for(const stream of [worker.stdout,worker.stderr])stream.on('data',chunk=>{output=(output+chunk).slice(-3000);});
  const cleanup=()=>{clearInterval(timer);signal.removeEventListener('abort',cancel);};
  worker.once('error',error=>{cleanup();reject(error);});worker.once('close',code=>{cleanup();const state=read();if(code!==0||!owned(state)||!state.ok||state.revision!==item.revision)return reject(new Error(state?.log||output||'Xuất video không hoàn tất.'));try{resolve({output:resolveContained(directory,state.output).file,saved:state.saved,snapshotId:state.snapshotId,revision:state.revision});}catch(error){reject(error);}});
 });
}

export function createRenderTasks({root,workspaceStore,tasks,render=runBatchRender}){
 const running=new Map();
 function project(item,workspaceId,{revision=true}={}){
  const content=path.join(root,'workspace/content'),dir=resolveContained(content,path.relative(content,path.resolve(root,item.dir||''))).file;
  if(path.relative(content,dir).split(path.sep).length!==2)throw new Error('Sai dự án xuất.');
  const file=path.join(dir,'project.json'),pj=JSON.parse(fs.readFileSync(file,'utf8'));
  if((pj.workspaceId||'default')!==workspaceId)throw new Error('Dự án không thuộc workspace.');
  if(revision)assertProjectRevision(file,item.revision);return {dir,file,pj};
 }
 function completed(task){
  const results=[];
  for(const [index,item] of task.snapshot.items.entries()){
   const {dir}=project(item,task.workspaceId,{revision:false}),folder=path.join(dir,'renders');if(!fs.existsSync(folder))continue;
   const matches=[];
   for(const name of fs.readdirSync(folder).filter(n=>n.endsWith('.mp4.json'))){
    try{const data=JSON.parse(fs.readFileSync(resolveContained(folder,name).file,'utf8'));if(data.batchTaskId!==task.id||data.batchItem!==index||data.revision!==item.revision||!data.ok||data.quality!=='final')continue;
     const artifact=resolveContained(folder,name.slice(0,-5)).file;verifyArtifact(artifact,data);
     matches.push({index,dir:item.dir,revision:item.revision,output:artifact,saved:artifact,snapshotId:data.snapshotId});
    }catch{}
   }
   if(matches.length>1)throw new Error('Có nhiều file xuất cho cùng mục. Kiểm tra trước khi tiếp tục.');if(matches.length)results.push(matches[0]);
  }return results;
 }
 tasks.reconcileKind('render-batch',task=>{try{const items=completed(task);return items.length===task.snapshot.items.length?{items}:null;}catch{return null;}},{interruptedMessage:'Lô xuất bị gián đoạn. Kiểm tra render đang chạy rồi chọn Tiếp tục; bản xuất hoàn thành được giữ lại.'});
 function available(workspaceId){if(workspaceStore.active().id!==workspaceId)throw new Error('Workspace đã đổi.');if(running.size||renderLockStatus(root))throw Object.assign(new Error('Máy đang xuất hoặc còn khóa render. Kiểm tra lượt đang chạy trước khi tiếp tục.'),{status:409});}
 function start(task){
  available(task.workspaceId);const existing=completed(task),done=new Set(existing.map(i=>i.index));for(const [index,item] of task.snapshot.items.entries())if(!done.has(index))project(item,task.workspaceId);
  const {leaseToken}=tasks.claim(task.id,task.workspaceId,'render-local'),controller=new AbortController();running.set(task.id,controller);
  let checkpoint={completed:existing,total:task.snapshot.items.length,activeIndex:null,progress:0};
  const validate=()=>{controller.signal.throwIfAborted();if(tasks.get(task.id,task.workspaceId).status!=='running'||workspaceStore.active().id!==task.workspaceId)throw new Error('Lô xuất hoặc workspace đã đổi.');};
  const heartbeat=setInterval(()=>{try{validate();tasks.heartbeat(task.id,task.workspaceId,leaseToken,checkpoint);}catch{controller.abort();}},5000);heartbeat.unref?.();
  Promise.resolve().then(async()=>{
   for(const [index,item] of task.snapshot.items.entries()){
    validate();if(done.has(index))continue;project(item,task.workspaceId);checkpoint={...checkpoint,activeIndex:index,progress:0};tasks.heartbeat(task.id,task.workspaceId,leaseToken,checkpoint);
    const result=await render(root,item,{taskId:task.id,index,signal:controller.signal,onProgress:state=>{checkpoint={...checkpoint,...state};}});
    // CLI commits a probed sidecar before close. Retain it even if cancellation arrives here.
    checkpoint.completed.push({index,dir:item.dir,...result});validate();tasks.heartbeat(task.id,task.workspaceId,leaseToken,checkpoint);
   }
   validate();tasks.finish(task.id,task.workspaceId,leaseToken,{result:{items:checkpoint.completed.sort((a,b)=>a.index-b.index)}});
  }).catch(error=>{try{if(tasks.get(task.id,task.workspaceId).status==='running')tasks.finish(task.id,task.workspaceId,leaseToken,{error:error.message});}catch{}}).finally(()=>{clearInterval(heartbeat);running.delete(task.id);});
  return tasks.get(task.id,task.workspaceId);
 }
 return {
  isRunning(id){return running.has(id);},
  enqueue(workspaceId,{sourceBatchId,idempotencyKey}){
   const old=tasks.list(workspaceId).find(t=>t.idempotencyKey===idempotencyKey);if(old){if(old.kind!=='render-batch'||old.snapshot.sourceBatchId!==sourceBatchId)throw Object.assign(new Error('Khóa yêu cầu đã dùng cho lô khác.'),{status:409});return old;}
   available(workspaceId);const source=tasks.get(sourceBatchId,workspaceId);if(source.kind!=='variant-batch'||source.status!=='succeeded')throw new Error('Chọn lô phiên bản đã tạo xong.');
   const items=source.result.items.map(item=>{const current=project({dir:item.dir},workspaceId,{revision:false});return {dir:item.dir,revision:projectRevision(current.file),title:current.pj.title||path.basename(current.dir)};});
   if(!items.length||items.length>20)throw new Error('Lô cần từ 1–20 dự án.');
   return start(tasks.enqueue({workspaceId,project:source.project,revision:source.revision,snapshot:{sourceBatchId,items},instruction:'Xuất final các phiên bản đã lưu; không đăng bài.',kind:'render-batch',idempotencyKey}));
  },
  cancel(id,workspaceId){if(tasks.get(id,workspaceId).kind!=='render-batch')throw new Error('Sai loại công việc.');const result=tasks.cancel(id,workspaceId);running.get(id)?.abort();return result;},
  resume(id,workspaceId){const task=tasks.get(id,workspaceId);if(task.kind!=='render-batch')throw new Error('Sai loại công việc.');available(workspaceId);const done=new Set(completed(task).map(i=>i.index));for(const [index,item] of task.snapshot.items.entries())if(!done.has(index))project(item,workspaceId);return start(tasks.retry(id,workspaceId));}
 };
}
