import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {spawn,execFileSync} from 'node:child_process';
import {createWorkspaceStore} from '../src/services/workspaces.mjs';import {convertAievProject} from '../src/services/aiev-project-adapter.mjs';import {projectRevision} from '../src/services/project-revisions.mjs';
import {applyColorNormalization,restoreColorNormalization} from '../editor/lib/color-management.js';
import {probeMediaMetadata} from '../src/services/media-metadata.mjs';

const root=process.cwd(),relative='workspace/content/2026-11-05/contentos-qa-hdr-analysis-'+crypto.randomUUID(),dir=path.join(root,relative),base='http://127.0.0.1:5192';
const delay=ms=>new Promise(r=>setTimeout(r,ms)),hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const workspaceFile=path.join(root,'workspace/contentos/workspaces.json'),workspaceBefore=fs.readFileSync(workspaceFile),workspaceId=createWorkspaceStore(root).active().id;
// Never ask the upstream launcher to replace an existing listener.
try{await fetch(base+'/api/ping',{signal:AbortSignal.timeout(1000)});throw Error('Port5192 already occupied');}catch(error){if(error.message==='Port5192 already occupied')throw error;if(error.name==='TimeoutError')throw Error('Port5192 response uncertain; choose another port');}
fs.mkdirSync(path.join(dir,'inputs'),{recursive:true});const originals=[];
for(const [profile,transfer] of [['hlg','arib-std-b67'],['pq','smpte2084']]){
 const src='inputs/'+profile+'.mp4',file=path.join(dir,src);
 execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','testsrc2=s=160x96:d=0.5','-c:v','libx264','-x264-params','colorprim=bt2020:transfer='+transfer+':colormatrix=bt2020nc','-pix_fmt','yuv420p','-color_range','tv','-y',file],{windowsHide:true});originals.push({src,profile,transfer,sha256:hash(file)});
}
const project=convertAievProject({width:1080,height:1920,scenes:originals.map(v=>({srcVideo:v.src,from:0,to:.5}))});project.workspaceId=workspaceId;project.title='ContentOS QA HDR analysis';
for(const segment of project.segments){const meta=await probeMediaMetadata(path.join(dir,segment.src));segment.mediaInfo={width:meta.displayWidth,height:meta.displayHeight,duration:meta.duration,hasAudio:meta.hasAudio,colorMetadata:meta.colorMetadata};}
const file=path.join(dir,'project.json');fs.writeFileSync(file,JSON.stringify(project,null,2));
const server=spawn(process.execPath,['editor/server.mjs',relative,'--port','5192'],{windowsHide:true,stdio:['ignore',fs.openSync(path.join(dir,'server.out.log'),'w'),fs.openSync(path.join(dir,'server.err.log'),'w')]});
let inFlight=false;
async function call(route,body,{method='POST',revision=projectRevision(file)}={}){
 inFlight=true;let response;
 try{response=await fetch(base+route,{method,headers:{Connection:'close','Content-Type':'application/json','X-ContentOS-Project':relative,'X-ContentOS-Revision':revision},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(60000)});const data=await response.json();inFlight=false;return {status:response.status,data};}
 catch(error){if(error.name!=='TimeoutError'&&error.name!=='AbortError')inFlight=false;throw error;}
}
try{
 let ready=false;for(let i=0;i<80;i++){if(server.exitCode!==null)throw Error('QA server exited');try{const p=await fetch(base+'/api/ping',{signal:AbortSignal.timeout(1000)});if(p.ok){ready=true;break;}}catch{}await delay(100);}assert.ok(ready);
 const results=[];let applied=structuredClone(project);const initialRevision=projectRevision(file);
 for(const [i,source] of originals.entries()){
  const request={kind:'segments',id:project.segments[i].id},before=fs.readFileSync(file);
  const info=await call('/api/color-normalization/info',request);assert.equal(info.status,200);assert.equal(info.data.metadata.colorMetadata.transfer,source.transfer);
  const rejected=await call('/api/shot-color',request);assert.equal(rejected.status,422);assert.equal(rejected.data.code,'COLOR_NORMALIZATION_REQUIRED');assert.match(rejected.data.error,/HDR.*Rec\.709/);assert.deepEqual(fs.readFileSync(file),before);
  const normalized=await call('/api/color-normalization',{...request,encoder:'cpu'});assert.equal(normalized.status,200,JSON.stringify(normalized.data));assert.equal(normalized.data.result.provenance.input,source.profile);assert.deepEqual(fs.readFileSync(file),before);
  applied=applyColorNormalization(applied,'segments',request.id,normalized.data.result);const saved=await call('/api/project',applied,{method:'PUT'});assert.equal(saved.status,200,JSON.stringify(saved.data));
  const good=await call('/api/shot-color',request);assert.equal(good.status,200,JSON.stringify(good.data));assert.equal(good.data.result.inputColor.profile,'rec709');assert.equal(good.data.result.samples.length,3);
  const conflict=await call('/api/shot-color',request,{revision:initialRevision});assert.equal(conflict.status,409);
  results.push({profile:source.profile,hdrRejected:true,noMutationBeforeApply:true,appliedViaHttp:true,normalizedProfile:good.data.result.inputColor.profile,samples:3,staleRevisionRejected:true,derived:normalized.data.result.path});
 }
 for(const segment of project.segments)applied=restoreColorNormalization(applied,'segments',segment.id);
 const restored=await call('/api/project',applied,{method:'PUT'});assert.equal(restored.status,200,JSON.stringify(restored.data));
 const reopened=await call('/api/project',undefined,{method:'GET'});assert.equal(reopened.status,200);for(const [i,s] of originals.entries()){assert.equal(reopened.data.project.segments[i].src,project.segments[i].src);assert.equal(hash(path.join(dir,s.src)),s.sha256);}
 assert.deepEqual(fs.readFileSync(workspaceFile),workspaceBefore);
 const evidence={project:relative,serverPid:server.pid,results,restoreAndReopenHttp:true,originalSourcesPreserved:true,workspaceUnchanged:true,noPaidProvider:true,noExport:true,browserVerified:false,limits:'HTTP and synthetic tagged HLG/PQ media only; not native UI Undo/focus, real camera HDR/Log, color quality or final render.'};
 fs.writeFileSync('docs/SHOT_COLOR_INPUT_HTTP_SMOKE.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
}finally{
 if(inFlight)console.error('QA request may still be active; server preserved at PID '+server.pid);
 else{server.kill();await new Promise(resolve=>{if(server.exitCode!==null)return resolve();server.once('exit',resolve);});}
}
