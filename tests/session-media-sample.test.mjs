import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {execFileSync} from 'node:child_process';
import {sampleSessionMedia} from '../src/services/session-media-sample.mjs';import {projectRevision} from '../src/services/project-revisions.mjs';
test('claimed media sampler reuses local decoding, keeps payloads out of report, and rejects invalid jobs/ranges',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'session-media-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const relative='workspace/content/qa/video',dir=path.join(root,relative),work=path.join(dir,'work'),candidateDir=path.join(work,'build-candidates/token/work');fs.mkdirSync(path.join(dir,'inputs'),{recursive:true});fs.mkdirSync(candidateDir,{recursive:true});
 const source=path.join(dir,'inputs/a.mp4');execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','testsrc2=s=96x160:d=1','-c:v','libx264','-pix_fmt','yuv420p',source],{windowsHide:true});
 const p={source:{video:'inputs/a.mp4',duration:1},segments:[{in:0,out:1}]},live=path.join(dir,'project.json'),candidate=path.join(candidateDir,'candidate-project.json'),jobFile=path.join(work,'ai-job.json');
 fs.writeFileSync(live,JSON.stringify(p));fs.writeFileSync(candidate,JSON.stringify(p));fs.writeFileSync(path.join(candidateDir,'base-project.json'),JSON.stringify(p));
 const job={status:'working',completionToken:'token',candidate:relative+'/work/build-candidates/token/work/candidate-project.json',baseRevision:projectRevision(live),claimedBy:{id:'claim'}};fs.writeFileSync(jobFile,JSON.stringify(job));
 const before={source:fs.readFileSync(source),candidate:fs.readFileSync(candidate),live:fs.readFileSync(live)},options={claimId:'claim',src:'inputs/a.mp4',times:[0,.5,.9]};
 const result=await sampleSessionMedia(root,relative,options);assert.equal(result.frames.length,3);assert.equal(result.applied,false);assert.ok(!JSON.stringify(result).includes('data:image'));
 for(const f of result.frames){const bytes=fs.readFileSync(path.join(root,f.path));assert.equal(bytes[0],255);assert.equal(bytes[1],216);assert.equal(bytes.length,f.bytes);assert.ok(f.path.startsWith(path.relative(root,candidateDir).replaceAll('\\','/')+'/media-sample-'));}
 for(const [file,bytes] of [[source,before.source],[candidate,before.candidate],[live,before.live]])assert.deepEqual(fs.readFileSync(file),bytes);
 for(const change of [{claimId:'wrong'},{times:[1]},{times:[0,0]},{times:[0,.1,.2,.3]},{src:'../a.mp4'},{times:[NaN]}])await assert.rejects(sampleSessionMedia(root,relative,{...options,...change}));
 const controller=new AbortController();controller.abort();await assert.rejects(sampleSessionMedia(root,relative,{...options,signal:controller.signal}),/abort/i);
 assert.equal(fs.readdirSync(candidateDir).filter(n=>n.startsWith('media-sample-')).length,1,'Failed attempts clean their scratch folders');
 fs.writeFileSync(jobFile,JSON.stringify({...job,status:'cancelled'}));await assert.rejects(sampleSessionMedia(root,relative,options),/hủy/);
 fs.writeFileSync(jobFile,JSON.stringify(job));fs.appendFileSync(live,' ');await assert.rejects(sampleSessionMedia(root,relative,options),/thay đổi/);
 fs.writeFileSync(live,before.live);
 const revise='workspace/content/_sua-video/qa',reviseWork=path.join(root,revise,'work');fs.mkdirSync(reviseWork,{recursive:true});
 fs.writeFileSync(path.join(reviseWork,'candidate-project.json'),before.candidate);fs.writeFileSync(path.join(reviseWork,'base-project.json'),before.live);
 const reviseJob={kind:'revise',project:relative,status:'working',candidate:revise+'/work/candidate-project.json',baseRevision:projectRevision(live),claimedBy:{id:'revise-claim'}};fs.writeFileSync(path.join(reviseWork,'ai-job.json'),JSON.stringify(reviseJob));
 const revised=await sampleSessionMedia(root,revise,{...options,claimId:'revise-claim',times:[.5]});assert.equal(revised.frames.length,1);assert.ok(revised.frames[0].path.startsWith(revise+'/work/media-sample-'));assert.deepEqual(fs.readFileSync(live),before.live);
});
