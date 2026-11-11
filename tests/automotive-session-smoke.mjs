import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {claimSessionJob} from '../src/services/session-job-claims.mjs';
const base=process.env.CONTENTOS_QA_URL||'http://127.0.0.1:5180',root=process.cwd();
async function call(url,body){const r=await fetch(base+url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const value=await r.json();assert.ok(r.ok,JSON.stringify(value));return value;}
const original=await call('/api/v1/workspaces');let dir;
try{
 await call('/api/v1/workspaces',{name:'Automotive session QA '+Date.now()});
 const r=await fetch(base+'/api/new-project?file=fixture.mp4&name=ContentOS-Smoke-AutomotiveSession&noasr=1',{method:'POST',body:fs.readFileSync('tests/fixture.mp4')});assert.ok(r.ok);dir=(await r.json()).dir;
 const staged=await call('/api/ai-job',{dir,template:'chungauto-factory-quang-cao-v5',execution:{mode:'session',agent:'codex'},completionMode:'review',sfxLevel:'nhieu',automotiveOptions:{color:'natural',beauty:'off',watermark:'off',cta:'off',music:'off',sfx:'tat'}});
 const jobFile=path.join(root,dir,'work/ai-job.json'),claimed=claimSessionJob(jobFile,{root,agent:'codex',sessionId:'synthetic-policy-check'});assert.ok(claimed);
 const file=path.join(root,claimed.candidate),candidate=JSON.parse(fs.readFileSync(file));candidate.camera={...(candidate.camera||{}),beauty:{bodyWhite:80,personLight:60}};candidate.audio={...candidate.audio,music:'kit:ambient-pad',sfxVolume:1,sfxLevel:'nhieu'};candidate.watermark={file:'inputs/missing-logo.png',hidden:false};candidate.texts=[{id:'cta',title:'CALL NOW',at:0,dur:1,role:'cta'}];candidate.brolls=[{id:'b',src:'inputs/raw.mp4',at:0,dur:.5,mediaStart:0,color:{saturation:-1}}];fs.writeFileSync(file,JSON.stringify(candidate));
 await call('/api/ai-build/complete',{dir,claimId:claimed.claimedBy.id,token:claimed.completionToken,revision:claimed.baseRevision,summary:'Synthetic candidate; no model.'});
 const saved=JSON.parse(fs.readFileSync(path.join(root,dir,'project.json')));assert.equal(saved.audio.music,'');assert.equal(saved.camera.beauty,undefined);assert.equal(saved.automotiveOptions.beauty,'off');assert.equal(saved.audio.sfxVolume,0);assert.equal(saved.watermark.hidden,true);assert.equal(saved.texts.length,0);assert.equal(saved.brolls[0].color.preset,'tu-nhien');assert.equal(saved.automotiveOptions.cta,'off');
 const again=await call('/api/ai-job',{dir,template:'chungauto-factory-quang-cao-v5',execution:{mode:'session',agent:'codex'},completionMode:'review'});const second=claimSessionJob(jobFile,{root,agent:'codex',sessionId:'synthetic-second-job'});assert.ok(second,'repeat first-build no longer blocked by previous terminal guard');
 await fetch(base+'/api/ai-job?dir='+encodeURIComponent(dir),{method:'DELETE'});
 const evidence={project:dir,syntheticCandidate:true,noModelCalls:true,actualClaimAndCompletion:true,offOverridesCandidate:true,beautyOffEnforced:true,brollGradeApplied:true,templateVersion:5,repeatJobCanClaim:true};fs.writeFileSync('docs/AUTOMOTIVE_SESSION_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);
}finally{await call('/api/v1/workspaces/active',{id:original.activeId});}
