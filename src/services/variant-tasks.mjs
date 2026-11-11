import fs from 'node:fs';
import path from 'node:path';
import {createProjectVariant} from './project-variants.mjs';
import {resolveContained} from './storage.mjs';
import {assertProjectRevision} from './project-revisions.mjs';
import {normalizeVariables,applyBatchVariables} from '../../editor/lib/batch-data.mjs';

export function createVariantTasks({root,workspaceStore,tasks,create=createProjectVariant}){
 const running=new Map();
 function outputs(task){
  const found=new Map(),content=path.join(root,'workspace/content');
  if(!fs.existsSync(content))return found;
  for(const day of fs.readdirSync(content,{withFileTypes:true}).filter(x=>x.isDirectory()&&/^\d{4}-\d{2}-\d{2}$/.test(x.name))){
   for(const entry of fs.readdirSync(path.join(content,day.name),{withFileTypes:true}).filter(x=>x.isDirectory()&&x.name.startsWith('variant-'))){
    try{
     const dir=`workspace/content/${day.name}/${entry.name}`,folder=resolveContained(root,dir).file;
     const project=JSON.parse(fs.readFileSync(path.join(folder,'project.json'),'utf8')),origin=JSON.parse(fs.readFileSync(path.join(folder,'work/variant-origin.json'),'utf8')),v=project.contentos?.variant;
     if(v?.batchTaskId!==task.id||origin.batchTaskId!==task.id||v.sourceRevision!==task.revision||(project.workspaceId||'default')!==task.workspaceId)continue;
     const item=task.snapshot.items[v.batchItem];if(!item||item.format!==project.format||origin.batchItem!==v.batchItem)continue;
     if(found.has(v.batchItem))throw new Error('Nhiều kết quả cùng mục phiên bản.');
     found.set(v.batchItem,{dir,format:project.format,files:origin.assets.length,bytes:origin.bytes,layoutNeedsReview:true});
    }catch(error){if(error.message==='Nhiều kết quả cùng mục phiên bản.')throw error;}
   }
  }return found;
 }
 tasks.reconcileKind('variant-batch',task=>{const found=outputs(task);return found.size===task.snapshot.items.length?{items:[...found.entries()].sort((a,b)=>a[0]-b[0]).map(([index,result])=>({index,...result}))}:null;},{interruptedMessage:'Ứng dụng đã khởi động lại. Chọn Tiếp tục để tạo các bản còn thiếu; các bản hoàn thành được giữ lại.'});
 function check(workspaceId,request){
  if(workspaceStore.active().id!==workspaceId)throw Object.assign(new Error('Workspace đã đổi.'),{status:409});
  const source=resolveContained(path.join(root,'workspace/content'),path.relative(path.join(root,'workspace/content'),path.resolve(root,request.dir||''))).file;
  if(path.relative(path.join(root,'workspace/content'),source).split(path.sep).length!==2)throw new Error('Sai dự án nguồn.');
  assertProjectRevision(path.join(source,'project.json'),request.revision);
  if((JSON.parse(fs.readFileSync(path.join(source,'project.json'),'utf8')).workspaceId||'default')!==workspaceId)throw new Error('Sai workspace của dự án.');
 }
 function start(task){
  if(running.size)throw Object.assign(new Error('Đang tạo một lô phiên bản. Đợi hoàn tất hoặc hủy.'),{status:409});
  check(task.workspaceId,{dir:task.project,revision:task.revision});
  const {leaseToken}=tasks.claim(task.id,task.workspaceId,'variant-local'),controller=new AbortController();running.set(task.id,controller);
  const validate=()=>{controller.signal.throwIfAborted();if(tasks.get(task.id,task.workspaceId).status!=='running')throw new Error('Lô đã dừng.');check(task.workspaceId,{dir:task.project,revision:task.revision});};
  const heartbeat=setInterval(()=>{try{tasks.heartbeat(task.id,task.workspaceId,leaseToken);}catch{controller.abort();}},15000);heartbeat.unref?.();
  Promise.resolve().then(async()=>{
   const found=outputs(task),completed=[...found.entries()].map(([index,result])=>({index,...result}));
   for(let index=0;index<task.snapshot.items.length;index++){
    validate();if(found.has(index))continue;
    tasks.heartbeat(task.id,task.workspaceId,leaseToken,{completed,activeIndex:index,total:task.snapshot.items.length});
    const result=await create(root,workspaceStore,{workspaceId:task.workspaceId,dir:task.project,revision:task.revision,...task.snapshot.items[index]},{signal:controller.signal,validate,batch:{taskId:task.id,item:index}});
    completed.push({index,...result});tasks.heartbeat(task.id,task.workspaceId,leaseToken,{completed,activeIndex:null,total:task.snapshot.items.length});
   }
   validate();tasks.finish(task.id,task.workspaceId,leaseToken,{result:{items:completed.sort((a,b)=>a.index-b.index)}});
  }).catch(error=>{try{if(tasks.get(task.id,task.workspaceId).status==='running')tasks.finish(task.id,task.workspaceId,leaseToken,{error:error.message});}catch{}}).finally(()=>{clearInterval(heartbeat);running.delete(task.id);});
  return tasks.get(task.id,task.workspaceId);
 }
 return {
  isRunning(id){return running.has(id);},
  enqueue(workspaceId,{dir,revision,items,idempotencyKey}){
   if(!Array.isArray(items)||!items.length||items.length>20||items.some(i=>!i||!['9:16','16:9'].includes(i.format)||typeof i.title!=='string'||!i.title.trim()||i.title.trim().length>160))throw new Error('Chọn 1–20 phiên bản, mỗi bản có tên và tỷ lệ hợp lệ.');
   const normalized=items.map(i=>({format:i.format,title:i.title.trim(),...(i.variables!==undefined?{variables:normalizeVariables(i.variables)}:{})}));
   const old=tasks.list(workspaceId).find(t=>t.idempotencyKey===idempotencyKey);
   if(old){if(old.kind!=='variant-batch'||old.project!==dir||old.revision!==revision||JSON.stringify(old.snapshot.items)!==JSON.stringify(normalized))throw Object.assign(new Error('Khóa chống lặp đã dùng cho yêu cầu khác.'),{status:409});return old;}
   if(running.size)throw Object.assign(new Error('Đang tạo một lô phiên bản.'),{status:409});check(workspaceId,{dir,revision});
   const project=JSON.parse(fs.readFileSync(path.join(root,dir,'project.json'),'utf8'));for(const item of normalized)applyBatchVariables(project,item.variables);
   return start(tasks.enqueue({workspaceId,project:dir,revision,snapshot:{items:normalized},instruction:'Tạo phiên bản độc lập; chờ kiểm tra bố cục.',kind:'variant-batch',idempotencyKey}));
  },
  cancel(id,workspaceId){if(tasks.get(id,workspaceId).kind!=='variant-batch')throw new Error('Sai loại công việc.');const result=tasks.cancel(id,workspaceId);running.get(id)?.abort();return result;},
  resume(id,workspaceId){const task=tasks.get(id,workspaceId);if(task.kind!=='variant-batch')throw new Error('Sai loại công việc.');if(running.size)throw Object.assign(new Error('Worker chưa dừng. Đợi rồi thử lại.'),{status:409});check(workspaceId,{dir:task.project,revision:task.revision});return start(tasks.retry(id,workspaceId));}
 };
}
