import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const base='http://127.0.0.1:5194',delay=ms=>new Promise(r=>setTimeout(r,ms)),holds=[];let requests=0,block=true;
const gateway=http.createServer(async(req,res)=>{let text='';for await(const chunk of req)text+=chunk;const body=JSON.parse(text);requests++;
 const edited=body.messages.some(m=>m.role==='tool'&&m.tool_call_id==='edit');
 if(block&&!edited)await new Promise(resolve=>holds.push(resolve));
 res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[edited?{finish_reason:'stop',message:{content:'Fixture completed'}}:{finish_reason:'tool_calls',message:{tool_calls:[{id:'edit',type:'function',function:{name:'set_edit_fields',arguments:JSON.stringify({fields:{title:'Parallel fixture'}})}}]}}]}));
});
await new Promise(resolve=>gateway.listen(0,'127.0.0.1',resolve));
const server=spawn(process.execPath,['editor/server.mjs','--home','--port','5194'],{windowsHide:true,stdio:'ignore'});let original,workspace,settings;const projects=[],jobs=[];
async function call(url,body,headers={}){const response=await fetch(base+url,body===undefined?{headers}:{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});const value=await response.json();assert.ok(response.ok,JSON.stringify(value));return value;}
async function until(check){for(let i=0;i<160;i++){if(await check())return;await delay(100);}throw new Error('Timed out waiting for fixture worker');}
try{
 await until(async()=>{try{await call('/api/ping');return true;}catch{return false;}});
 original=await call('/api/v1/workspaces');settings=await call('/api/v1/background-dispatch');
 await call('/api/v1/workspaces',{name:'ContentOS-Smoke-Dispatch-'+Date.now(),brand:'Fixture'});workspace=(await call('/api/v1/connections/llm')).workspaceId;
 await call('/api/v1/connections/llm',{workspaceId:workspace,baseUrl:'http://127.0.0.1:'+gateway.address().port+'/v1',model:'fixture-only',apiKey:'fixture-only'});
 await call('/api/v1/background-dispatch',{workspaceId:workspace,maxWorkers:2,paused:false});
 for(let i=0;i<3;i++){
  const response=await fetch(base+'/api/new-project?file=fixture.mp4&name=ContentOS-Smoke-Dispatch-'+i+'&noasr=1',{method:'POST',body:fs.readFileSync(new URL('./fixture.mp4',import.meta.url))});assert.ok(response.ok);const project=await response.json();projects.push(project.dir);
  const context=await call('/api/project');const result=await call('/api/ai-revise',{instruction:'Set title for synthetic scheduling test',execution:{mode:'api',agent:'gateway'},completionMode:'review'},{'X-ContentOS-Project':project.dir,'X-ContentOS-Revision':context.revision});jobs.push(result.job);
 }
 await until(()=>holds.length===2);
 const queued=await call('/api/v1/background-dispatch');assert.equal(queued.active,2);assert.equal(queued.queued,1);assert.equal(requests,2);
 const activity=await call('/api/v1/activity');const queuedRow=activity.entries.find(row=>row.id==='legacy:'+jobs[2].dir.replace(/\\/g,'/'));assert.equal(queuedRow?.waitReason,'capacity');
 const jobFile=j=>path.join(j.dir,'work/ai-job.json');const read=j=>JSON.parse(fs.readFileSync(jobFile(j)));
 assert.equal(read(jobs[2]).status,'waiting');
 holds.shift()();await until(()=>holds.length===2);assert.equal(read(jobs[2]).status,'working');
 await call('/api/v1/background-dispatch',{workspaceId:workspace,maxWorkers:2,paused:true});
 block=false;for(const release of holds.splice(0))release();
 await until(()=>jobs.every(j=>['done','error'].includes(read(j).status)));
 for(const job of jobs){assert.equal(read(job).status,'done',JSON.stringify(read(job)));assert.equal(read(job).completionState,'awaiting-review');}
 assert.equal((await call('/api/v1/background-dispatch')).active,0);
 for(const project of projects){assert.equal(JSON.parse(fs.readFileSync(path.join(project,'project.json'))).title,'Parallel fixture');assert.equal(fs.existsSync(path.join(project,'work/render.json')),false);}
 // A late response from an obsolete claimant must not mark the replacement as failed.
 await call('/api/v1/background-dispatch',{workspaceId:workspace,maxWorkers:2,paused:false});
 block=true;const originalProject=projects[2],context=await call('/api/project');
 const late=await call('/api/ai-revise',{instruction:'Synthetic late-response ownership check',execution:{mode:'api',agent:'gateway'},completionMode:'review'},{'X-ContentOS-Project':originalProject,'X-ContentOS-Revision':context.revision});
 await until(()=>holds.length===1);
 const originalJob=read(late.job),replacement={...originalJob,status:'waiting',claimedBy:{...originalJob.claimedBy,id:'fixture-replacement-claim'}};
 const replacementBytes=JSON.stringify(replacement,null,2)+'\n',projectBytes=fs.readFileSync(path.join(originalProject,'project.json'),'utf8');
 fs.writeFileSync(jobFile(late.job),replacementBytes);block=false;holds.shift()();
 await until(async()=>(await call('/api/v1/background-dispatch')).active===0);
 assert.equal(fs.readFileSync(jobFile(late.job),'utf8'),replacementBytes,'obsolete API catch must preserve replacement bytes');
 assert.equal(fs.readFileSync(path.join(originalProject,'project.json'),'utf8'),projectBytes,'obsolete result must not apply');
 // Leave only this synthetic fixture terminal; never touch user jobs.
 fs.writeFileSync(jobFile(late.job),JSON.stringify({...originalJob,status:'cancelled',doneAt:new Date().toISOString()},null,2)+'\n');
 block=true;const cancelContext=await call('/api/project');
 const cancellable=await call('/api/ai-revise',{instruction:'Synthetic cancellation check',execution:{mode:'api',agent:'gateway'},completionMode:'review'},{'X-ContentOS-Project':originalProject,'X-ContentOS-Revision':cancelContext.revision});
 await until(()=>holds.length===1);
 const cancelRows=await call('/api/v1/activity'),cancelRow=cancelRows.entries.find(row=>row.id==='legacy:'+cancellable.job.dir);
 assert.ok(cancelRow.actions.includes('cancel-job'));
 const stale=await fetch(base+'/api/v1/activity/cancel-job',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspaceId:workspace,dir:cancelRow.jobDir,version:'stale'})});assert.equal(stale.status,409);assert.equal(read(cancellable.job).status,'working');
 const cancelled=await call('/api/v1/activity/cancel-job',{workspaceId:workspace,dir:cancelRow.jobDir,version:cancelRow.actionVersion});assert.equal(cancelled.status,'cancelled');
 const cancelBytes=fs.readFileSync(jobFile(cancellable.job),'utf8');block=false;holds.shift()();
 await until(async()=>(await call('/api/v1/background-dispatch')).active===0);
 assert.equal(fs.readFileSync(jobFile(cancellable.job),'utf8'),cancelBytes);
 assert.equal(fs.readFileSync(path.join(originalProject,'project.json'),'utf8'),projectBytes);
 fs.writeFileSync('docs/BACKGROUND_DISPATCH_API_SMOKE.json',JSON.stringify({syntheticGatewayOnly:true,threeDistinctProjects:true,twoRunningOneQueued:true,activityCapacityReason:true,thirdAutoDispatched:true,pauseDoesNotStopRunning:true,correctProjectOutputs:true,manualReviewNoRender:true,lateObsoleteClaimPreservesReplacement:true,lateResponseDoesNotApplyProject:true,activityCancel:true,staleCancelRejected:true,cancelLateResponsePreservesProject:true,requests},null,2));console.log('PASS: queue dispatch, ownership and Activity cancellation preserve project/job outputs.');
}finally{
 block=false;for(const release of holds.splice(0))release();
 if(workspace){if(settings)await call('/api/v1/background-dispatch',{workspaceId:workspace,maxWorkers:settings.maxWorkers,paused:settings.paused}).catch(()=>{});await fetch(base+'/api/v1/connections/llm',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspaceId:workspace})}).catch(()=>{});}
 if(original)await call('/api/v1/workspaces/active',{id:original.activeId}).catch(()=>{});
 server.kill();gateway.closeAllConnections();await new Promise(resolve=>gateway.close(resolve));
}
