// Persistence on a new QA copy with an isolated positional server; no workspace switch.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
import {projectRevision} from '../src/services/project-revisions.mjs';
const prior=JSON.parse(fs.readFileSync('docs/PERSON_EXACT_END_FINAL_SMOKE.json')),source=prior.projects[1],base='http://127.0.0.1:5192';
try{await fetch(base+'/api/ping',{signal:AbortSignal.timeout(1000)});throw Error('QA port occupied');}catch(e){if(e.message==='QA port occupied'||e.name==='TimeoutError')throw e;}
const store='workspace/contentos/workspaces.json',storeBefore=fs.readFileSync(store),relative=fs.mkdtempSync('workspace/content/2026-11-05/contentos-exact-end-http-'),file=path.join(relative,'project.json'),project=JSON.parse(fs.readFileSync(path.join(source,'project.json')));
fs.mkdirSync(path.join(relative,'inputs'));fs.copyFileSync(path.join(source,project.source.video),path.join(relative,project.source.video));fs.writeFileSync(file,JSON.stringify(project,null,2));
const server=spawn(process.execPath,['editor/server.mjs',relative,'--port','5192'],{windowsHide:true,stdio:['ignore',fs.openSync(path.join(relative,'server.out.log'),'w'),fs.openSync(path.join(relative,'server.err.log'),'w')]}),delay=ms=>new Promise(r=>setTimeout(r,ms));
let inFlight=false;
async function call(method,body,revision=projectRevision(file)){
 inFlight=true;
 try{const response=await fetch(base+'/api/project',{method,headers:{Connection:'close','Content-Type':'application/json','X-ContentOS-Project':relative,'X-ContentOS-Revision':revision},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});const data=await response.json();inFlight=false;return {status:response.status,data};}
 catch(e){if(e.name!=='TimeoutError'&&e.name!=='AbortError')inFlight=false;throw e;}
}
try{
 let ready=false;for(let i=0;i<80;i++){if(server.exitCode!==null)throw Error('QA server exited');try{if((await fetch(base+'/api/ping',{signal:AbortSignal.timeout(1000)})).ok){ready=true;break;}}catch{}await delay(100);}assert.ok(ready);
 const originalRevision=projectRevision(file),changed=structuredClone(project);changed.camera.beauty.personSelections[0].to=.88;
 const saved=await call('PUT',changed);assert.equal(saved.status,200,JSON.stringify(saved.data));
 const reopened=await call('GET');assert.equal(reopened.status,200);assert.equal(reopened.data.project.camera.beauty.personSelections[0].to,.88);
 const stale=await call('PUT',project,originalRevision);assert.equal(stale.status,409);
 const invalid=structuredClone(changed);invalid.camera.beauty.personSelections[0].to=1.01;
 const rejected=await call('PUT',invalid);assert.equal(rejected.status,400,JSON.stringify(rejected.data));assert.equal(JSON.parse(fs.readFileSync(file)).camera.beauty.personSelections[0].to,.88);
 const restored=await call('PUT',project);assert.equal(restored.status,200);const final=await call('GET');assert.equal(final.data.project.camera.beauty.personSelections[0].to,.96);
 assert.deepEqual(fs.readFileSync(store),storeBefore);
 const report={project:relative,serverPid:server.pid,saveReopenEnd:.88,invalidEndRejected:true,staleRevisionRejected:true,restoredEnd:.96,workspaceUnchanged:true,browserVerified:false,scope:'Real HTTP PUT/GET and schema/build on isolated QA project; not native UI Undo/focus or new inference.'};fs.writeFileSync('docs/PERSON_EXACT_END_HTTP_SMOKE.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{if(inFlight)console.error('QA request state uncertain; preserve server PID '+server.pid);else{server.kill();if(server.exitCode===null)await new Promise(r=>server.once('exit',r));}}
