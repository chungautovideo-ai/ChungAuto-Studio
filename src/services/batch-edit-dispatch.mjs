import {normalizeAutomotiveOptions} from '../../editor/lib/automotive-options.js';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {resolveContained} from './storage.mjs';
import {normalizeExecution} from './ai-execution.mjs';
export function createBatchEditDispatch({root,workspaceStore,tasks,stage}){
 const active=new Set(),folder=path.join(root,'workspace/contentos/edit-batches');
 const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
 return {latest(workspaceId,sourceTaskId){
  if(workspaceStore.active().id!==workspaceId)throw Object.assign(new Error('Workspace đã đổi.'),{status:409});
  const source=tasks.get(sourceTaskId,workspaceId);if(source.kind!=='intake-batch')throw new Error('Không phải lô nhập video.');
  if(!fs.existsSync(folder))return null;
  const records=fs.readdirSync(folder).filter(name=>/^[a-f0-9-]{36}\.json$/i.test(name)).map(name=>{try{return read(path.join(folder,name));}catch{return null;}}).filter(record=>record?.workspaceId===workspaceId&&record.sourceTaskId===sourceTaskId&&record.input);
  records.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  const record=records[0];return record?{id:record.id,input:record.input,entries:record.entries,total:source.result?.items?.length||0,error:record.error||null,dispatching:active.has(record.id)}:null;
 },async submit({workspaceId,sourceTaskId,idempotencyKey,template,execution,completionMode='review',transcriptLanguage='vi',notes=[],automotiveOptions}){
  if(!/^[a-f0-9-]{36}$/i.test(idempotencyKey||'')||typeof template!=='string'||!template||!['review','auto-export'].includes(completionMode)||!['vi','en','auto'].includes(transcriptLanguage)||!Array.isArray(notes)||notes.length>20||notes.some(note=>typeof note!=='string'||note.length>10000))throw new Error('Thiết lập giao lô không hợp lệ.');
  execution=normalizeExecution(execution,{allowApi:true});
  automotiveOptions=normalizeAutomotiveOptions(automotiveOptions);
  const validate=()=>{if(workspaceStore.active().id!==workspaceId)throw Object.assign(new Error('Workspace đã đổi; dừng giao việc còn lại.'),{status:409});};validate();
  const source=tasks.get(sourceTaskId,workspaceId);if(source.kind!=='intake-batch'||source.status!=='succeeded')throw new Error('Chọn lô đã nhập xong.');
  const items=source.result?.items;if(!items?.length||items.length>20||notes.length&&notes.length!==items.length)throw new Error('Brief không khớp số dự án.');
  const input={workspaceId,sourceTaskId,template,execution,completionMode,transcriptLanguage,notes,...(automotiveOptions?{automotiveOptions}:{})},hash=crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
  fs.mkdirSync(folder,{recursive:true});const file=path.join(folder,idempotencyKey+'.json');let record=fs.existsSync(file)?read(file):{id:idempotencyKey,hash,workspaceId,sourceTaskId,input,createdAt:Date.now(),entries:[]};
  if(record.hash!==hash)throw Object.assign(new Error('Khóa giao lô đã dùng cho thiết lập khác.'),{status:409});
  if(active.has(idempotencyKey))throw Object.assign(new Error('Lô đang được giao. Đợi kết quả trước khi thử lại.'),{status:409});active.add(idempotencyKey);
  const save=()=>{const tmp=file+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(tmp,JSON.stringify(record,null,2)+'\n',{flag:'wx'});fs.renameSync(tmp,file);}finally{fs.rmSync(tmp,{force:true});}};
  try{
   save();
   for(const [index,item] of items.entries()){
    validate();if(record.entries.some(entry=>entry.index===index))continue;
    const directory=resolveContained(root,item.dir).file,project=read(path.join(directory,'project.json'));
    if(project.workspaceId!==workspaceId||project.contentos?.intakeBatch?.taskId!==sourceTaskId||project.contentos.intakeBatch.index!==item.index)throw new Error('Dự án không còn khớp lô nhập.');
    const jobFile=path.join(directory,'work/ai-job.json'),job=fs.existsSync(jobFile)?read(jobFile):null;
    if(job?.batchDispatch?.id===idempotencyKey&&job.batchDispatch.index===index){record.entries.push({index,dir:item.dir,jobDir:job.dir,recovered:true});save();continue;}
    const result=await stage(directory,{template,execution,completionMode,transcriptLanguage,note:notes[index]||'',sfxLevel:'vua',sourceSurvey:null,automotiveOptions},{validate,batchDispatch:{id:idempotencyKey,index}});
    record.entries.push({index,dir:item.dir,jobDir:result.job.dir});save();
   }
   record.error=null;save();return {...record,total:items.length};
  }catch(error){record.error=error.message;save();return {...record,total:items.length};}finally{active.delete(idempotencyKey);}
 }};
}
