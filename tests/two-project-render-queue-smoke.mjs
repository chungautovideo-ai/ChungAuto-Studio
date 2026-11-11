import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawn,execFileSync} from 'node:child_process';
import {renderLockStatus} from '../src/services/render-lock.mjs';import {verifyArtifact} from '../src/services/artifact-integrity.mjs';
const root=process.cwd(),source='workspace/content/2026-11-04/contentos-smoke-render-audio-status-4',base=JSON.parse(fs.readFileSync(path.join(source,'project.json'))),delay=ms=>new Promise(r=>setTimeout(r,ms));
assert.equal(renderLockStatus(root),null,'Do not overlap an existing render.');
assert.ok(!fs.existsSync('workspace/settings.json')||!JSON.parse(fs.readFileSync('workspace/settings.json')).exportDir,'QA must not copy to user export folder.');
const registryCheck=process.argv.includes('--activity');let qaServer,originalWorkspace;
const qaBase='http://127.0.0.1:5193';
if(registryCheck){qaServer=spawn(process.execPath,['editor/server.mjs','--home','--port','5193'],{windowsHide:true,stdio:'ignore'});for(let n=0;n<100;n++){try{const r=await fetch(qaBase+'/api/ping');if(r.ok)break;}catch{}await delay(100);}originalWorkspace=(await(await fetch(qaBase+'/api/v1/workspaces')).json()).activeId;await fetch(qaBase+'/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:base.workspaceId})});}
const dirs=[];
for(const name of ['a','b']){const dir=fs.mkdtempSync(path.resolve(`workspace/content/2026-11-05/contentos-queue-qa-${name}-`));fs.mkdirSync(path.join(dir,'inputs'));fs.mkdirSync(path.join(dir,'work'));fs.copyFileSync(path.join(source,base.source.video),path.join(dir,base.source.video));const project=structuredClone(base);project.title='Render queue QA '+name;fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify(project));dirs.push(dir);}
function launch(dir){const child=spawn(process.execPath,['editor/tools/xuat-video.mjs',dir,'--quality','draft'],{windowsHide:true,stdio:['ignore','pipe','pipe']});const item={child,log:'',exit:null,closed:false};for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{item.log=(item.log+b).slice(-20000);});child.on('error',e=>{item.error=e.message;});child.on('close',code=>{item.closed=true;item.exit=code;fs.writeFileSync(path.join(dir,'work/queue-qa.log'),item.log);});return item;}
const a=launch(dirs[0]);
for(let n=0;n<200;n++){if(renderLockStatus(root)?.pid===a.child.pid)break;assert.equal(a.closed,false,a.log);await delay(50);}
assert.equal(renderLockStatus(root)?.pid,a.child.pid);
const b=launch(dirs[1]);let waitingObserved=false,statusUntouchedWhileWaiting=false,pingResponsive=true;let activityQueued=false,activityRunning=false,activityProgress=false;const owners=[],started=Date.now();
while(!a.closed||!b.closed){
 const owner=renderLockStatus(root);if(owner?.pid&&!owners.includes(owner.pid))owners.push(owner.pid);
 if(registryCheck){const activity=await(await fetch(qaBase+'/api/v1/activity')).json();const rows=activity.entries.filter(r=>r.source==='render-cli'&&dirs.some(d=>path.resolve(root,r.project)===d));activityQueued ||= rows.some(r=>r.runtime==='queued');activityRunning ||= rows.some(r=>r.runtime==='active');activityProgress ||= rows.some(r=>r.runtime==='active'&&Number.isFinite(r.progress));}
 if(b.log.includes('Đang chờ lượt render')){waitingObserved=true;if(owner?.pid===a.child.pid&&!fs.existsSync(path.join(dirs[1],'work/render.json')))statusUntouchedWhileWaiting=true;}
 try{const r=await fetch('http://127.0.0.1:5180/api/ping',{signal:AbortSignal.timeout(2000)});pingResponsive&&=r.ok;}catch{pingResponsive=false;}
 if(Date.now()-started>180000){console.log(JSON.stringify({dirs,pids:[a.child.pid,b.child.pid],live:[!a.closed,!b.closed]}));throw Error('Observation limit; do not stop live render workers. Inspect these PIDs.');}
 await delay(100);
}
if(registryCheck){const activity=await(await fetch(qaBase+'/api/v1/activity')).json();const rows=activity.entries.filter(r=>r.source==='render-cli'&&dirs.some(d=>path.resolve(root,r.project)===d));await fetch(qaBase+'/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:originalWorkspace})});qaServer.kill();assert.equal(rows.length,2);assert.ok(rows.every(r=>r.status==='succeeded'&&r.runtime==='terminal'));assert.equal(activityQueued,true);assert.equal(activityRunning,true);assert.equal(activityProgress,true);}
assert.equal(a.exit,0,a.log);assert.equal(b.exit,0,b.log);assert.equal(waitingObserved,true);assert.equal(statusUntouchedWhileWaiting,true);assert.equal(renderLockStatus(root),null);
const results=dirs.map(dir=>JSON.parse(fs.readFileSync(path.join(dir,'work/render.json'))));
assert.notEqual(results[0].snapshotId,results[1].snapshotId);
for(let i=0;i<2;i++){const r=results[i];assert.equal(r.ok,true);assert.equal(r.running,false);assert.ok(path.resolve(r.saved).startsWith(dirs[i]+path.sep));verifyArtifact(r.saved,JSON.parse(fs.readFileSync(r.saved+'.json')));assert.equal(r.audioLoudness.listened,false);const decoded=execFileSync('ffmpeg',['-v','error','-i',r.saved,'-frames:v','1','-vf','scale=1:1','-f','rawvideo','-pix_fmt','rgb24','-'],{windowsHide:true});assert.equal(decoded.length,3);}
const evidence={projects:dirs,pids:[a.child.pid,b.child.pid],exitCodes:[a.exit,b.exit],observedLockOwners:owners,waitingObserved,statusUntouchedWhileWaiting,pingResponsive,...(registryCheck?{activityQueued,activityRunning,activityProgress,activityTerminal:true}:{}),distinctSnapshots:true,outputs:results.map(r=>r.saved),integrityVerified:true,audioMeasured:true,scope:'Two short QA CLI exports launched concurrently, serialized by real cross-process lock. Imported synthetic source; not concurrent autonomous AI edits, queue fairness, crash recovery or production throughput.'};
fs.writeFileSync(registryCheck?'docs/CLI_RENDER_ACTIVITY_HTTP_SMOKE.json':'docs/TWO_PROJECT_RENDER_QUEUE_SMOKE.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
