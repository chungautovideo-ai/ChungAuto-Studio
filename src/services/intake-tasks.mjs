import fs from 'node:fs';import path from 'node:path';
import {createNasProject} from './nas-projects.mjs';
export function createIntakeTasks({root,workspaceStore,storage,tasks,create=createNasProject}){
 const running=new Map();
 function outputs(task){
  const items=[],content=path.join(root,'workspace/content');if(!fs.existsSync(content))return items;
  for(const day of fs.readdirSync(content,{withFileTypes:true}).filter(d=>d.isDirectory()&&!d.isSymbolicLink()&&/^\d{4}-\d{2}-\d{2}$/.test(d.name)))for(const entry of fs.readdirSync(path.join(content,day.name),{withFileTypes:true}).filter(d=>d.isDirectory()&&!d.isSymbolicLink()&&d.name.startsWith('nas-'))){
   const dir=`workspace/content/${day.name}/${entry.name}`;let project;try{project=JSON.parse(fs.readFileSync(path.join(root,dir,'project.json'),'utf8'));}catch{continue;}
   const origin=project.contentos?.intakeBatch;if(origin?.taskId!==task.id||project.workspaceId!==task.workspaceId)continue;
   if(!Number.isInteger(origin.index)||!task.snapshot.items[origin.index]||items.some(item=>item.index===origin.index))throw new Error('Kết quả lô nhập trùng hoặc sai mục; cần kiểm tra.');
   items.push({index:origin.index,dir,title:project.title});
  }return items.sort((a,b)=>a.index-b.index);
 }
 tasks.reconcileKind('intake-batch',task=>{const items=outputs(task);return items.length===task.snapshot.items.length?{items}:null;},{interruptedMessage:'Lô nhập bị gián đoạn. Tiếp tục chỉ nhập các video còn thiếu; dự án đã tạo được giữ lại.'});
 function start(task){
  if(running.size)throw Object.assign(new Error('Đang nhập một lô video. Đợi lô hiện tại dừng.'),{status:409});
  const existing=outputs(task),done=new Set(existing.map(item=>item.index)),{leaseToken}=tasks.claim(task.id,task.workspaceId,'intake-local'),controller=new AbortController();running.set(task.id,controller);
  let checkpoint={completed:existing,total:task.snapshot.items.length,progress:0};
  const validate=()=>{controller.signal.throwIfAborted();if(workspaceStore.active().id!==task.workspaceId||tasks.get(task.id,task.workspaceId).status!=='running')throw new Error('Lô nhập hoặc workspace đã đổi.');};
  const heartbeat=setInterval(()=>{try{validate();tasks.heartbeat(task.id,task.workspaceId,leaseToken,checkpoint);}catch{controller.abort();}},5000);heartbeat.unref?.();
  Promise.resolve().then(async()=>{
   for(const [index,item] of task.snapshot.items.entries()){
    validate();if(done.has(index))continue;
    const result=await create(root,workspaceStore,storage,{workspaceId:task.workspaceId,text:task.snapshot.text,selected:item.path,name:item.title,format:task.snapshot.format,batch:{taskId:task.id,index},validate});
    checkpoint.completed.push({index,dir:result.dir,title:result.project.title});checkpoint.progress=Math.round(checkpoint.completed.length/task.snapshot.items.length*100);validate();tasks.heartbeat(task.id,task.workspaceId,leaseToken,checkpoint);
   }validate();tasks.finish(task.id,task.workspaceId,leaseToken,{result:{items:checkpoint.completed.sort((a,b)=>a.index-b.index)}});
  }).catch(error=>{try{if(tasks.get(task.id,task.workspaceId).status==='running')tasks.finish(task.id,task.workspaceId,leaseToken,{error:error.message});}catch{}}).finally(()=>{clearInterval(heartbeat);running.delete(task.id);});
  return tasks.get(task.id,task.workspaceId);
 }
 return {isRunning:id=>running.has(id),
  enqueue(workspaceId,{items,text,format,idempotencyKey}){
   if(workspaceStore.active().id!==workspaceId)throw Object.assign(new Error('Workspace đã đổi.'),{status:409});
   if(typeof text!=='string'||!text.trim()||text.length>10000||!Array.isArray(items)||!items.length||items.length>20||new Set(items.map(i=>i?.path)).size!==items.length||items.some(i=>typeof i?.path!=='string'||!i.path||typeof i.title!=='string'||!i.title.trim()||i.title.length>100)||!['9:16','16:9'].includes(format))throw new Error('Chọn 1–20 video khác nhau, tiêu đề và tỷ lệ hợp lệ.');
   const snapshot={items:items.map(i=>({path:i.path,title:i.title.trim()})),text,format};
   const old=tasks.list(workspaceId).find(t=>t.idempotencyKey===idempotencyKey);if(old){if(old.kind!=='intake-batch'||JSON.stringify(old.snapshot)!==JSON.stringify(snapshot))throw Object.assign(new Error('Yêu cầu chống lặp đã dùng cho lô khác.'),{status:409});return old;}
   if(running.size)throw Object.assign(new Error('Đang nhập một lô video.'),{status:409});
   return start(tasks.enqueue({workspaceId,kind:'intake-batch',project:'intake:'+workspaceId,revision:'intake-v1',snapshot,idempotencyKey,instruction:'Mỗi video một dự án; chưa giao AI hoặc xuất video.'}));
  },
  cancel(id,workspaceId){if(tasks.get(id,workspaceId).kind!=='intake-batch')throw new Error('Sai lô nhập.');const result=tasks.cancel(id,workspaceId);running.get(id)?.abort();return result;},
  resume(id,workspaceId){if(workspaceStore.active().id!==workspaceId||running.size)throw Object.assign(new Error('Workspace đã đổi hoặc worker chưa dừng.'),{status:409});const task=tasks.get(id,workspaceId);if(task.kind!=='intake-batch')throw new Error('Sai lô nhập.');return start(tasks.retry(id,workspaceId));}
 };
}
