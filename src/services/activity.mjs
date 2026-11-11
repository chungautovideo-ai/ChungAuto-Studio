// Public projection only: no prompts, candidate contents, lease tokens or keys.
import {canCancelStagedJob,stagedJobVersion} from './staged-job-control.mjs';
import path from 'node:path';
export function projectResourceActivity({render,asr,projects=[],root}){
 const project=render?.projectDir?projects.find(item=>path.resolve(root,item.dir)===path.resolve(render.projectDir)):null;
 const state=owner=>!owner?'idle':owner.ownerAlive===true?'busy':'unverified';
 return {render:{state:state(render),projectTitle:project?String(project.title||'Dự án').slice(0,120):null},asr:{state:state(asr)}};
}
function executionOf(value,claim){
 const mode=claim?.mode||value?.mode;if(!['session','cli','api'].includes(mode))return null;
 return {mode,agent:['codex','claude','antigravity','gateway','auto'].includes(claim?.agent||value?.agent)?claim?.agent||value?.agent:null,model:typeof value?.model==='string'?value.model.slice(0,128):null,sessionId:typeof claim?.sessionId==='string'?claim.sessionId.slice(0,160):null};
}
export function projectActivity({workspaceId,tasks=[],jobs=[],renderRuns=[],renderOwner=null,isPidAlive=pid=>{try{process.kill(pid,0);return true;}catch{return false;}},isActive=()=>false,waitingReason=()=>null,exportWaiting=()=>false,now=Date.now(),limit=200}){
 const rows=[];
 for(const task of tasks){if(task.workspaceId!==workspaceId)continue;
  const active=isActive(task.kind,task.id)===true;
  const runtime=task.status==='running'?(active?'active':'unverified'):task.status==='queued'?'queued':'terminal';
  const completed=task.result?.items||task.checkpoint?.completed||[];
  rows.push({id:'task:'+task.id,taskId:task.id,source:'queue',kind:task.kind,status:task.status,runtime,...(task.kind==='remotion-scene'?{waitReason:task.status==='queued'?'remotion-render':null,phase:String(task.phase||'').slice(0,180)}:{}),
   title:({'native-still':'Tạo Poster / Thumbnail React','remotion-scene':'Tạo cảnh chữ Remotion','intake-batch':'Nhập nhiều video thành dự án','render-batch':'Xuất video theo lô','variant-batch':'Tạo phiên bản theo lô','news-draft':'Soạn kịch bản bằng AI',edit:'Dựng video',revise:'Sửa video'})[task.kind]||'Công việc',
   updatedAt:Number(task.updatedAt)||0,project:task.project?.startsWith('workspace/content/')?task.project:null,execution:executionOf(task.snapshot?.execution,task.claimedBy),
   progress:runtime==='active'&&task.kind!=='remotion-scene'?Math.max(0,Math.min(100,Number(task.checkpoint?.progress)||0)):null,
   total:Number(task.checkpoint?.total||task.snapshot?.items?.length)||null,completed:completed.length,
   error:typeof task.error==='string'?task.error.slice(0,600):null,
   outputs:completed.filter(item=>typeof item.dir==='string'&&item.dir.startsWith('workspace/content/')).map(item=>({index:item.index,dir:item.dir,title:task.snapshot?.items?.[item.index]?.title||item.format||'Bản đã tạo',download:task.kind==='render-batch'&&Number.isInteger(item.index)?`/api/v1/tasks/${encodeURIComponent(task.id)}/output?index=${item.index}`:null})),
   actions:['intake-batch','render-batch','variant-batch'].includes(task.kind)?['queued','running'].includes(task.status)?['cancel']:['failed','interrupted','cancelled'].includes(task.status)?['retry']:[]:[]});
 }
 for(const job of jobs){if(job.workspaceId!==workspaceId)continue;
  const exporting=job.status==='done'&&job.completionState==='export-started';
  const status=job.status==='done'&&['awaiting-review','export-started','exported','export-error'].includes(job.completionState)?job.completionState:job.status;
  const contact=job.status==='working'&&job.claimedBy?.mode==='session'?job.sessionContact:null;
  const runtime=exporting?(isActive('completion-export',job.dir)===true?(exportWaiting(job.dir)?'queued':'active'):'unverified'):job.status==='working'?(isActive('legacy',job.dir)===true?'active':contact?.state==='recent'?'reported':'unverified'):job.status==='waiting'?'queued':'terminal';
  const reason=job.status==='waiting'?waitingReason(job.dir):null;
  const phase=status==='awaiting-review'&&typeof job.completionReviewReason==='string'?job.completionReviewReason.slice(0,180):exporting&&runtime==='active'?'Đang xuất bản dựng theo chính sách tự xuất.':runtime==='active'&&typeof job.apiProgress?.phase==='string'?job.apiProgress.phase.slice(0,180):null;
  const waitReason=exporting&&runtime==='queued'?'render-capacity':['paused','project-busy','capacity','dispatch','recovery'].includes(reason)?reason:job.status==='waiting'&&job.execution?.mode==='session'?'session':null;
  const error=status==='export-error'?job.exportError:job.error;
  const outputs=status==='exported'&&/^[a-f0-9-]{36}$/i.test(job.exportSnapshotId||'')?[{dir:job.project||job.dir,title:'Bản xuất final',download:'/api/v1/activity/output?dir='+encodeURIComponent(job.dir)+'&snapshot='+encodeURIComponent(job.exportSnapshotId)}]:[];
  rows.push({id:'legacy:'+job.dir,source:'legacy',kind:job.kind||'edit',status,runtime,sessionContact:contact?{at:contact.at,state:contact.state}:null,waitReason,phase,title:job.title||'Dựng video',updatedAt:Math.max(Date.parse(job.doneAt||job.startedAt||job.createdAt)||0,contact?.at||0),project:job.project||job.dir,execution:executionOf(job.execution,job.claimedBy),progress:null,total:null,completed:0,error:typeof error==='string'?error.slice(0,600):null,outputs,actions:canCancelStagedJob(job)?['cancel-job']:[],...(canCancelStagedJob(job)?{jobDir:job.dir,actionVersion:job.actionVersion||stagedJobVersion(job)}:{})});
 }
 for(const run of renderRuns){if(run.workspaceId!==workspaceId)continue;
  const terminal=['succeeded','failed','interrupted','cancelled'].includes(run.status),alive=!terminal&&isPidAlive(run.pid),runtime=terminal?'terminal':!alive?'unverified':run.status==='queued'?'queued':renderOwner?.ownerAlive&&renderOwner.pid===run.pid?'active':'unverified';
  rows.push({id:'render-cli:'+run.id,source:'render-cli',kind:'render-cli',status:run.status,runtime,title:'Xuất CLI · '+String(run.title||'Dự án').slice(0,120),updatedAt:run.updatedAt,project:run.project,execution:null,waitReason:runtime==='queued'?'cli-render-capacity':null,phase:runtime==='active'?'Đang xuất và kiểm file trên máy.':null,progress:runtime==='active'&&Number.isFinite(run.progress)?Math.max(0,Math.min(99,run.progress)):null,total:null,completed:0,error:null,outputs:[],actions:[]});
 }
 rows.sort((a,b)=>b.updatedAt-a.updatedAt||a.id.localeCompare(b.id));
 return {workspaceId,observedAt:new Date(now).toISOString(),total:rows.length,truncated:rows.length>limit,entries:rows.slice(0,limit)};
}
