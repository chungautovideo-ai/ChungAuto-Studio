import crypto from 'node:crypto';
export function createNewsTasks({tasks,news,connections,draft,routing}){
 const running=new Map();
 tasks.reconcileKind('news-draft',task=>{
  const entry=news.list(task.workspaceId).entries.find(e=>e.aiGeneration?.taskId===task.id&&e.parentId===task.snapshot.id&&crypto.createHash('sha256').update(JSON.stringify(e.payload)).digest('hex')===e.hash);
  return entry?{entryId:entry.id}:null;
 });
 function enqueue(workspaceId,{id,instruction='',idempotencyKey}){
  if(typeof instruction!=='string'||instruction.length>2000)throw new Error('Yêu cầu tối đa 2.000 ký tự.');
  const previous=tasks.list(workspaceId).find(t=>t.kind==='news-draft'&&t.idempotencyKey===idempotencyKey);
  if(previous){if(previous.snapshot.id!==id||previous.instruction!==(instruction.trim()||'Soạn kịch bản từ nguồn đã lưu.'))throw Object.assign(new Error('Khóa chống lặp đã dùng cho yêu cầu khác.'),{status:409});return previous;}
  if(tasks.list(workspaceId).some(t=>t.kind==='news-draft'&&['queued','running'].includes(t.status)))throw Object.assign(new Error('Workspace đang soạn kịch bản.'),{status:409});
  const source=news.list(workspaceId).entries.find(e=>e.id===id);
  if(!source||news.list(workspaceId).entries.some(e=>e.parentId===id))throw new Error('Chọn bản nguồn mới nhất đã lưu.');
  if(typeof instruction!=='string'||instruction.length>2000)throw new Error('Yêu cầu tối đa 2.000 ký tự.');
  const config=connections.status(workspaceId);if(!config.baseUrl||!config.model)throw new Error('Cấu hình kết nối LLM trước khi soạn.');
  const modelSelection=routing?.resolve(workspaceId,{mode:'api',agent:'gateway'},'news-draft',config.model);
  const task=tasks.enqueue({workspaceId,project:'news:'+id,revision:source.hash,snapshot:{id,hash:source.hash,baseUrl:config.baseUrl,model:config.model,...(modelSelection?{modelSelection}:{})},instruction:instruction.trim()||'Soạn kịch bản từ nguồn đã lưu.',kind:'news-draft',idempotencyKey});
  const {leaseToken}=tasks.claim(task.id,workspaceId,'news-api'),controller=new AbortController();running.set(task.id,controller);
  const heartbeat=setInterval(()=>{try{tasks.heartbeat(task.id,workspaceId,leaseToken,{step:'awaiting-provider'});}catch{controller.abort();}},15000);heartbeat.unref?.();
  const validate=()=>{const state=tasks.get(task.id,workspaceId),config=connections.status(workspaceId),source=news.list(workspaceId).entries.find(e=>e.id===id);if(state.status!=='running'||config.baseUrl!==task.snapshot.baseUrl||config.model!==task.snapshot.model||source?.hash!==task.snapshot.hash)throw new Error('Công việc, nguồn hoặc kết nối đã đổi.');};
  Promise.resolve().then(()=>draft(workspaceId,{id,instruction:task.instruction,taskId:task.id,signal:controller.signal,validate,modelSelection:task.snapshot.modelSelection})).then(entry=>{
   tasks.finish(task.id,workspaceId,leaseToken,{result:{entryId:entry.id}});
  }).catch(error=>{try{if(tasks.get(task.id,workspaceId).status==='running')tasks.finish(task.id,workspaceId,leaseToken,{error:error.message});}catch{}}).finally(()=>{clearInterval(heartbeat);running.delete(task.id);});
  return tasks.get(task.id,workspaceId);
 }
 return {
  isRunning(id){return running.has(id);},enqueue,cancel(id,workspaceId){const task=tasks.get(id,workspaceId);if(task.kind!=='news-draft')throw new Error('Sai loại công việc.');const cancelled=tasks.cancel(id,workspaceId);running.get(id)?.abort();return cancelled;}};
}
