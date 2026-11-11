import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const base='http://127.0.0.1:5195',delay=ms=>new Promise(r=>setTimeout(r,ms));let requests=0,server,original,settings,workspace,job;
const gateway=http.createServer(async(req,res)=>{let text='';for await(const c of req)text+=c;const b=JSON.parse(text);requests++;const edited=b.messages.some(m=>m.role==='tool'&&m.tool_call_id==='edit');res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[edited?{finish_reason:'stop',message:{content:'Fixture complete'}}:{finish_reason:'tool_calls',message:{tool_calls:[{id:'edit',type:'function',function:{name:'set_edit_fields',arguments:JSON.stringify({fields:{title:'Recovered fixture'}})}}]}}]}));});
await new Promise(resolve=>gateway.listen(0,'127.0.0.1',resolve));
async function call(url,body,headers={}){const r=await fetch(base+url,body===undefined?{headers}:{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});const v=await r.json();assert.ok(r.ok,JSON.stringify(v));return v;}
async function until(check){for(let i=0;i<100;i++){if(await check())return;await delay(100);}throw new Error('Fixture timeout');}
async function start(){server=spawn(process.execPath,['editor/server.mjs','--home','--port','5195'],{windowsHide:true,stdio:'ignore'});await until(async()=>{if(server.exitCode!==null)throw new Error('Fixture server exited '+server.exitCode);try{await call('/api/ping');return true;}catch{return false;}});}
async function stop(){if(!server)return;const child=server;server=null;if(child.exitCode!==null)return;const ended=new Promise(resolve=>child.once('exit',resolve));child.kill();await ended;}
try{
 await start();original=await call('/api/v1/workspaces');settings=await call('/api/v1/background-dispatch');
 await call('/api/v1/workspaces',{name:'ContentOS-Smoke-Recovery-'+Date.now(),brand:'Fixture'});workspace=(await call('/api/v1/connections/llm')).workspaceId;
 await call('/api/v1/connections/llm',{workspaceId:workspace,baseUrl:'http://127.0.0.1:'+gateway.address().port+'/v1',model:'fixture-only',apiKey:'fixture-only'});
 await call('/api/v1/background-dispatch',{workspaceId:workspace,maxWorkers:2,paused:true});
 const uploaded=await fetch(base+'/api/new-project?file=fixture.mp4&name=ContentOS-Smoke-Recovery&noasr=1',{method:'POST',body:fs.readFileSync(new URL('./fixture.mp4',import.meta.url))});assert.ok(uploaded.ok);const project=await uploaded.json(),context=await call('/api/project');
 const response=await call('/api/ai-revise',{instruction:'Synthetic restart recovery',execution:{mode:'api',agent:'gateway'},completionMode:'review'},{'X-ContentOS-Project':project.dir,'X-ContentOS-Revision':context.revision});job=response.job;
 const file=path.join(job.dir,'work/ai-job.json'),before=fs.readFileSync(file,'utf8');assert.equal(requests,0);assert.equal((await call('/api/v1/background-dispatch')).queued,1);
 await stop();await start();assert.equal(fs.readFileSync(file,'utf8'),before);assert.equal(requests,0);
 const recovery=await call('/api/v1/background-dispatch/recovery');const entry=recovery.entries.find(e=>e.dir===job.dir);assert.ok(entry?.canResume);assert.equal((await call('/api/v1/background-dispatch')).recoverable,1);
 await call('/api/v1/background-dispatch',{workspaceId:workspace,maxWorkers:2,paused:false});await delay(1200);assert.equal(requests,0,'unpausing must not release recovered items');
 await call('/api/v1/background-dispatch/recovery',{workspaceId:workspace,dir:job.dir});
 await until(()=>JSON.parse(fs.readFileSync(file)).status==='done');assert.equal(JSON.parse(fs.readFileSync(path.join(project.dir,'project.json'))).title,'Recovered fixture');assert.equal(requests,2);
 const duplicate=await fetch(base+'/api/v1/background-dispatch/recovery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspaceId:workspace,dir:job.dir})});assert.equal(duplicate.status,409);assert.equal(requests,2);
 fs.writeFileSync('docs/BACKGROUND_RECOVERY_API_SMOKE.json',JSON.stringify({actualServerRestart:true,waitingJobBytesPreserved:true,noProviderRequestBeforeExplicitResume:true,unpauseDoesNotReplay:true,explicitResumeAppliesToCorrectProject:true,duplicateResumeRejected:true,syntheticGatewayOnly:true,requests},null,2));console.log('PASS: pending survives real server restart; explicit resume only; duplicate rejected.');
}finally{
 if(server){if(workspace){if(settings)await call('/api/v1/background-dispatch',{workspaceId:workspace,maxWorkers:settings.maxWorkers,paused:settings.paused}).catch(()=>{});await fetch(base+'/api/v1/connections/llm',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspaceId:workspace})}).catch(()=>{});}if(original)await call('/api/v1/workspaces/active',{id:original.activeId}).catch(()=>{});}
 await stop();gateway.closeAllConnections();await new Promise(resolve=>gateway.close(resolve));
}
