import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fork} from 'node:child_process';
import {normalizePosterInput,posterProps} from './poster-input.mjs';import {remotionRuntime} from './remotion-scenes.mjs';import {renderEnvironment} from './render-environment.mjs';import {verifyArtifact} from './artifact-integrity.mjs';import {resolveContained} from './storage.mjs';import {projectRevision} from './project-revisions.mjs';
export function createPosterTasks({root,tasks,images,workspaceStore,launch=fork}){
 const running=new Map();
 // No replay after restart. Only a committed library record reconciles success.
 tasks.reconcileKind('native-still',task=>{const image=images.list(task.workspaceId).find(item=>item.source?.taskId===task.id&&item.source?.app==='contentos-remotion');return image?{imageId:image.id}:null;});
 const assetsFor=(workspaceId,input)=>['background','frame','logo'].flatMap(role=>{const id=input[role+'Id'];if(!id)return [];const asset=images.assetFile(workspaceId,id);verifyArtifact(asset.file,asset.meta);return [{role,id,name:role+asset.meta.extension,sha256:asset.meta.sha256,bytes:asset.meta.bytes}];});
 return {isRunning:id=>running.has(id),
  enqueue(workspaceId,{input:value,idempotencyKey}){
   if(workspaceStore.active().id!==workspaceId)throw new Error('Workspace đã đổi.');
   const input=normalizePosterInput(value),assets=assetsFor(workspaceId,input),snapshot={input,assets};remotionRuntime(root);
   const old=tasks.list(workspaceId).find(task=>task.kind==='native-still'&&task.idempotencyKey===idempotencyKey);if(old){if(JSON.stringify(old.snapshot)!==JSON.stringify(snapshot))throw new Error('Khóa giao việc đã dùng cho cấu hình khác.');return old;}
   if(running.size>=2)throw new Error('Đang tạo hai ảnh native. Đợi hoàn tất.');
   if(tasks.list(workspaceId).some(task=>task.kind==='native-still'&&['queued','running','interrupted'].includes(task.status)))throw new Error('Workspace có lượt ảnh chưa hoàn tất hoặc cần kiểm tra.');
   const task=tasks.enqueue({workspaceId,project:'images:'+workspaceId,revision:crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'),kind:'native-still',snapshot,instruction:'Render composition React '+input.kind+' vào kho ảnh local.',idempotencyKey});
   const {leaseToken}=tasks.claim(task.id,workspaceId,'remotion-still');let child,phase='Đang chuẩn bị composition React…',result,failure;
   const folder=path.join(root,'workspace/cache/poster-jobs',task.id);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'project.json'),JSON.stringify({workspaceId,taskId:task.id}));
   const validate=()=>{if(workspaceStore.active().id!==workspaceId||tasks.get(task.id,workspaceId).status!=='running')throw new Error('Lượt tạo ảnh hoặc workspace đã đổi.');};
   try{
    child=launch(path.join(root,'editor/tools/remotion-worker.mjs'),[],{windowsHide:true,env:renderEnvironment(root),stdio:['ignore','ignore','pipe','ipc']});running.set(task.id,child);child.stderr?.on('data',()=>{});
    const heartbeat=setInterval(()=>{try{validate();tasks.heartbeat(task.id,workspaceId,leaseToken,{phase});}catch{if(child.connected)child.send({type:'cancel'},()=>{});}},5000);heartbeat.unref?.();
    child.on('message',message=>{if(message?.type==='progress')phase=String(message.progress?.phase||phase).slice(0,180);if(message?.type==='result')result=message.result;if(message?.type==='error')failure=String(message.error).slice(0,600);});child.on('error',error=>failure=error.message);
    child.on('close',async code=>{
     try{validate();if(code!==0||failure||!result)throw new Error(failure||'Worker không trả ảnh hoàn tất.');const file=resolveContained(folder,result.path).file;verifyArtifact(file,result);validate();
      const image=await images.importImage(workspaceId,fs.readFileSync(file),{name:input.kind+'.png',prompt:input.title||input.brandName||'Composition '+input.kind,validate,source:{app:'contentos-remotion',taskId:task.id,composition:result.composition,input,assets,sha256:result.sha256}});validate();tasks.finish(task.id,workspaceId,leaseToken,{result:{imageId:image.id}});
     }catch(error){try{if(tasks.get(task.id,workspaceId).status==='running')tasks.finish(task.id,workspaceId,leaseToken,{error:error.message});}catch{}}
     finally{clearInterval(heartbeat);running.delete(task.id);}
    });
    const staged=assets.map(asset=>({...asset,file:images.assetFile(workspaceId,asset.id).file}));
    child.send({type:'render',options:{root,projectDir:folder,revision:projectRevision(path.join(folder,'project.json')),still:{kind:input.kind,props:posterProps(input,Object.fromEntries(assets.map(a=>[a.role,a.name]))),assets:staged}}});
   }catch(error){try{tasks.finish(task.id,workspaceId,leaseToken,{error:error.message});}catch{}running.delete(task.id);throw error;}
   return tasks.get(task.id,workspaceId);
  },
  cancel(id,workspaceId){const task=tasks.get(id,workspaceId);if(task.kind!=='native-still')throw new Error('Sai loại công việc.');if(!running.has(id)&&['running','interrupted'].includes(task.status))throw new Error('Chưa xác minh worker cũ; không tự giải phóng lượt ảnh.');const state=tasks.cancel(id,workspaceId),child=running.get(id);if(child?.connected)child.send({type:'cancel'},()=>{});return state;}
 };
}
