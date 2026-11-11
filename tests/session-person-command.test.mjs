import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';
import {sessionPersonCommand,sessionSelectedPersonMeasurement} from '../src/services/session-person-command.mjs';import {projectRevision} from '../src/services/project-revisions.mjs';
test('CLI selected measurement validates claim and immutable candidate throughout asynchronous decoding',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'session-person-measure-'));
 try{
  const target=path.join(root,'project'),dir=path.join(root,'revise');for(const folder of [path.join(target,'inputs'),path.join(target,'work'),path.join(dir,'work')])fs.mkdirSync(folder,{recursive:true});
  const source=path.join(target,'inputs/a.mp4');fs.writeFileSync(source,'fixture');const stat=fs.statSync(source),sha256=crypto.createHash('sha256').update('fixture').digest('hex');
  const selection={src:'inputs/a.mp4',sha256,method:'sam2.1-tiny-point-prompt',from:0,fps:8,w:8,h:8,f:Array.from({length:8},()=>[64,1])};
  const project={source:{video:'inputs/a.mp4'},segments:[{in:0,out:1,keep:true}],camera:{beauty:{personSelections:[selection]}}};
  const live=path.join(target,'project.json'),candidate=path.join(dir,'work/candidate-project.json'),jobFile=path.join(dir,'work/ai-job.json');fs.writeFileSync(live,JSON.stringify(project));fs.writeFileSync(candidate,JSON.stringify(project));
  fs.writeFileSync(path.join(target,'work/face.json'),JSON.stringify({v:2,tracks:[{src:'inputs/a.mp4',fingerprint:{size:stat.size,mtimeMs:stat.mtimeMs,sha256},fps:8,f:Array(8).fill(null),skin:{w:8,h:8,f:Array.from({length:8},()=>[64,2])}}]}));
  const job={kind:'revise',project:'project',candidate:'revise/work/candidate-project.json',status:'working',baseRevision:projectRevision(live),claimedBy:{id:'claim'}};fs.writeFileSync(jobFile,JSON.stringify(job));const before=fs.readFileSync(candidate),request={src:'inputs/a.mp4',sha256},decode=async()=>new Uint8Array(8*8*4).fill(30);
  const result=await sessionSelectedPersonMeasurement(root,'revise',{claimId:'claim',request,decode});assert.equal(result.readOnly,true);assert.equal(result.appliedToCandidate,false);assert.equal(result.measurement.suggestion.personLight,30);assert.deepEqual(fs.readFileSync(candidate),before);
  await assert.rejects(sessionSelectedPersonMeasurement(root,'revise',{claimId:'wrong',request,decode}),/phiên khác/);
  await assert.rejects(sessionSelectedPersonMeasurement(root,'revise',{claimId:'claim',request:{...request,levels:{}},decode}),/không nhận/);
  await assert.rejects(sessionSelectedPersonMeasurement(root,'revise',{claimId:'claim',request,decode:async()=>{fs.appendFileSync(candidate,' ');return decode();}}),/Candidate đã đổi/);fs.writeFileSync(candidate,before);
  await assert.rejects(sessionSelectedPersonMeasurement(root,'revise',{claimId:'claim',request,decode:async()=>{fs.writeFileSync(jobFile,JSON.stringify({...job,status:'cancelled'}));return decode();}}),/hủy/);assert.deepEqual(fs.readFileSync(candidate),before);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('claimed revise adjusts candidate only and rejects owner, revision, source and policy conflicts',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'session-person-'));
 try{
  const target=path.join(root,'project'),dir=path.join(root,'revise');for(const folder of [path.join(target,'inputs'),path.join(target,'work'),path.join(dir,'work')])fs.mkdirSync(folder,{recursive:true});
  const source=path.join(target,'inputs/a.mp4');fs.writeFileSync(source,'fixture');const stat=fs.statSync(source),sha256=crypto.createHash('sha256').update('fixture').digest('hex');
  const face=JSON.stringify({v:2,tracks:[{src:'inputs/a.mp4',fingerprint:{size:stat.size,mtimeMs:stat.mtimeMs,sha256},fps:8,skin:{w:2,h:2,f:[[4,2]]},f:[null]}]});fs.writeFileSync(path.join(target,'work/face.json'),face);
  const project={title:'live',source:{video:'inputs/a.mp4'},segments:[{in:0,out:1,keep:true}],camera:{beauty:{bodySmooth:7,lip:12}}};
  const live=path.join(target,'project.json'),candidate=path.join(dir,'work/candidate-project.json'),jobFile=path.join(dir,'work/ai-job.json');fs.writeFileSync(live,JSON.stringify(project));fs.writeFileSync(candidate,JSON.stringify({...project,title:'candidate'}));
  const job={kind:'revise',project:'project',candidate:'revise/work/candidate-project.json',status:'working',baseRevision:projectRevision(live),claimedBy:{id:'claim'}};fs.writeFileSync(jobFile,JSON.stringify(job));
  const options={claimId:'claim',request:{src:'inputs/a.mp4',sha256,levels:{bodyWhite:20}}},before=fs.readFileSync(live),candidateBefore=fs.readFileSync(candidate);
  assert.equal(sessionPersonCommand(root,'revise',{claimId:'claim'}).report.sources[0].hasPersonMask,true);
  assert.equal(sessionPersonCommand(root,'revise',options).appliedToCandidate,false);assert.deepEqual(fs.readFileSync(candidate),candidateBefore);
  assert.throws(()=>sessionPersonCommand(root,'revise',{...options,claimId:'other',apply:true}),/phiên khác/);
  sessionPersonCommand(root,'revise',{...options,apply:true});const after=JSON.parse(fs.readFileSync(candidate));assert.equal(after.title,'candidate');assert.equal(after.camera.beauty.sourceAdjustments[0].bodyWhite,20);assert.equal(after.camera.beauty.sourceAdjustments[0].bodySmooth,7);assert.equal(after.camera.beauty.lip,12);assert.deepEqual(fs.readFileSync(live),before);assert.equal(fs.readFileSync(path.join(target,'work/face.json'),'utf8'),face);
  fs.writeFileSync(candidate,JSON.stringify({...after,automotiveOptions:{beauty:'off'}}));assert.throws(()=>sessionPersonCommand(root,'revise',{...options,apply:true}),/đang tắt/);fs.writeFileSync(candidate,JSON.stringify(after));
  fs.writeFileSync(jobFile,JSON.stringify({...job,status:'cancelled'}));assert.throws(()=>sessionPersonCommand(root,'revise',options),/hủy/);fs.writeFileSync(jobFile,JSON.stringify({...job,candidate:'project/project.json'}));assert.throws(()=>sessionPersonCommand(root,'revise',options),/Sai candidate/);fs.writeFileSync(jobFile,JSON.stringify(job));
  fs.appendFileSync(live,' ');assert.throws(()=>sessionPersonCommand(root,'revise',options),/thay đổi/);fs.writeFileSync(live,before);
  fs.writeFileSync(source,'changed');assert.throws(()=>sessionPersonCommand(root,'revise',{...options,apply:true}),/thiếu mask/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
