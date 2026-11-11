import path from 'node:path';import crypto from 'node:crypto';import {fork} from 'node:child_process';
import {normalizeRemotionScene,remotionRuntime} from './remotion-scenes.mjs';import {assertProjectRevision} from './project-revisions.mjs';import {renderEnvironment} from './render-environment.mjs';
import {remotionHistory} from './remotion-history.mjs';
export function createRemotionJobs({root,launch=fork,runtimeCheck=remotionRuntime}){
 const jobs=new Map(),history=remotionHistory(root);let historyError=null;
 try{for(const job of history.read())jobs.set(job.id,job);}catch(error){historyError=error.message;}
 const persist=job=>{try{history.save(job);}catch(error){historyError='Không lưu được lịch sử Remotion: '+error.message;}};
 const view=job=>({id:job.id,project:job.project,revision:job.revision,status:!job.child&&['running','cancelling'].includes(job.status)?'interrupted':job.status,phase:job.phase,error:historyError||(!job.child&&['running','cancelling'].includes(job.status)?'Ứng dụng đã mở lại; chưa xác minh worker. Kiểm tra tiến trình và khóa render, không tự giao lại.':job.error)||null,result:job.status==='succeeded'?job.result:null});
 const lookup=(id,workspaceId,project)=>{const job=jobs.get(id);if(!job||job.workspaceId!==workspaceId||job.project!==project)throw new Error('Không thấy lượt tạo cảnh trong dự án này.');return job;};
 return {
  start({workspaceId,project,revision,scene}){
   if(historyError)throw new Error(historyError);
   normalizeRemotionScene(scene);runtimeCheck(root);const projectDir=path.resolve(root,project);assertProjectRevision(path.join(projectDir,'project.json'),revision);
   if([...jobs.values()].some(job=>job.project===project&&['running','cancelling'].includes(job.status)))throw new Error('Dự án đang có lượt tạo cảnh Remotion.');
   if([...jobs.values()].filter(job=>['running','cancelling'].includes(job.status)).length>=8)throw new Error('Đã có 8 lượt tạo cảnh. Đợi hoàn tất.');
   const job={id:crypto.randomUUID(),workspaceId,project,revision,status:'running',createdAt:Date.now(),updatedAt:Date.now(),phase:'Đang chuẩn bị worker Remotion…'};history.save(job);jobs.set(job.id,job);
   let child;try{child=launch(path.join(root,'editor/tools/remotion-worker.mjs'),[],{windowsHide:true,env:renderEnvironment(root),stdio:['ignore','ignore','pipe','ipc']});}catch(error){job.status='failed';job.error=error.message;persist(job);throw error;}job.child=child;
   child.stderr?.on('data',()=>{});
   let result,error;const timer=setTimeout(()=>{error='Tạo cảnh vượt 5 phút. Đã yêu cầu dừng; kiểm tra khóa render nếu worker mất liên lạc.';job.status='cancelling';persist(job);child.send?.({type:'cancel'});},300000);timer.unref?.();
   child.on('message',message=>{if(message.type==='progress'){const phase=String(message.progress?.phase||'Đang tạo cảnh…').slice(0,180);if(phase!==job.phase){job.phase=phase;job.updatedAt=Date.now();persist(job);}}if(message.type==='result')result=message.result;if(message.type==='error')error=String(message.error).slice(0,600);});
   child.on('error',failure=>{error=failure.message;});child.on('close',code=>{clearTimeout(timer);job.updatedAt=Date.now();job.child=null;if(job.status==='cancelling'){job.status='cancelled';job.error=error||'Đã hủy.';persist(job);return;}try{if(error||code!==0||!result)throw new Error(error||'Worker Remotion kết thúc mà chưa có kết quả.');assertProjectRevision(path.join(projectDir,'project.json'),revision);job.result={path:result.path,props:result.props,cached:result.cached,sha256:result.sha256};job.status='succeeded';job.phase='Cảnh đã sẵn sàng để xem và thêm vào timeline.';}catch(failure){job.status='failed';job.error=failure.message;}persist(job);});
   child.send({type:'render',options:{root,projectDir,revision,scene}});return view(job);
  },get(id,workspaceId,project){return view(lookup(id,workspaceId,project));},
  latest(workspaceId,project){const job=[...jobs.values()].filter(job=>job.workspaceId===workspaceId&&job.project===project).at(-1);return job?view(job):null;},
  list(workspaceId){return [...jobs.values()].filter(job=>job.workspaceId===workspaceId).map(job=>({id:job.id,workspaceId,kind:'remotion-scene',status:job.status==='running'&&job.child&&job.phase.includes('chờ lượt render')?'queued':view(job).status==='interrupted'?'interrupted':job.status==='cancelling'?'running':job.status,phase:job.phase,project:job.project,updatedAt:job.updatedAt||Date.now(),error:view(job).error,result:job.status==='succeeded'?{items:[{index:0,dir:job.project}]}:null}));},
  isRunning(id){return !!jobs.get(id)?.child;},
  cancel(id,workspaceId,project){const job=lookup(id,workspaceId,project);if(['running','cancelling'].includes(job.status)&&!job.child)throw new Error('Chưa xác minh worker sau khi mở lại. Không thể xác nhận hủy.');if(job.status==='running'){job.status='cancelling';persist(job);job.child?.send({type:'cancel'});}return view(job);},
  active(){return [...jobs.values()].filter(job=>job.child).length;}
 };
}
