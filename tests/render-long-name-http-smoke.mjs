import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
import {createWorkspaceStore} from '../src/services/workspaces.mjs';import {verifyArtifact} from '../src/services/artifact-integrity.mjs';
const base='http://127.0.0.1:5194',root=process.cwd(),wait=ms=>new Promise(r=>setTimeout(r,ms));
try{await fetch(base+'/api/ping',{signal:AbortSignal.timeout(1000)});throw Error('QA port occupied');}catch(error){if(error.message==='QA port occupied'||error.name==='TimeoutError')throw error;}
const prior=JSON.parse(fs.readFileSync('docs/RENDER_LONG_NAME_CLI_SMOKE.json')),relative='workspace/content/2026-11-05/contentos-qa-broll-entrance-'+crypto.randomUUID(),dir=path.resolve(relative),workspaceFile=path.join(root,'workspace/contentos/workspaces.json'),workspaceBefore=fs.readFileSync(workspaceFile);
fs.mkdirSync(path.join(dir,'inputs'),{recursive:true});for(const name of ['aroll','broll'])fs.copyFileSync(path.join(prior.project,'inputs',name+'.mp4'),path.join(dir,'inputs',name+'.mp4'));
const project=JSON.parse(fs.readFileSync(path.join(prior.project,'project.json')));project.workspaceId=createWorkspaceStore(root).active().id;const file=path.join(dir,'project.json');fs.writeFileSync(file,JSON.stringify(project,null,2));const before=fs.readFileSync(file);
const server=spawn(process.execPath,['editor/server.mjs',relative,'--port','5194'],{windowsHide:true,stdio:'ignore'});let terminal=true;
async function get(url,options={}){const response=await fetch(base+url,options),data=await response.json();assert.ok(response.ok,JSON.stringify(data));return data;}
try{
 let ready=false;for(let n=0;n<100;n++){if(server.exitCode!==null)throw Error('QA server exited');try{await get('/api/ping');ready=true;break;}catch{}await wait(100);}assert.ok(ready);
 const headers={'X-ContentOS-Project':relative},current=await get('/api/project',{headers});
 terminal=false;await get('/api/render',{method:'POST',headers:{...headers,'Content-Type':'application/json','X-ContentOS-Revision':current.revision},body:JSON.stringify({quality:'final'})});let result;
 for(let n=0;n<1800;n++){result=await get('/api/render',{headers});if(!result.running){terminal=true;break;}await wait(100);}
 assert.equal(terminal,true,'Preserve live render server after observation timeout');assert.equal(result.ok,true,result.log);assert.equal(path.basename(result.saved),path.basename(dir)+'-final.mp4');assert.equal(result.metadataError,undefined);
 const sidecar=JSON.parse(fs.readFileSync(result.saved+'.json')),integrity=verifyArtifact(result.saved,sidecar);assert.equal(integrity.sha256,result.sha256);assert.equal(sidecar.snapshotId,result.snapshotId);assert.equal(sidecar.revision,current.revision);assert.deepEqual(fs.readFileSync(file),before);assert.deepEqual(fs.readFileSync(workspaceFile),workspaceBefore);
 const temporary=path.join(dir,'work/render-snapshots',result.snapshotId,'renders/render.mp4');assert.ok(fs.existsSync(temporary));
 const evidence={project:relative,output:result.saved,temporary,integrity,actualHTTPFinal:true,projectAndWorkspaceUnchanged:true,snapshotId:result.snapshotId,revision:current.revision,metadataError:null,browserVerified:false,scope:'Synthetic2s HTTP final validates shorter transaction path, user filename and sidecar/hash; not arbitrary path lengths, NAS or editor UX.'};fs.writeFileSync('docs/RENDER_LONG_NAME_HTTP_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
}finally{if(terminal){server.kill();await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));}else console.error('Preserve live QA server PID '+server.pid);}
