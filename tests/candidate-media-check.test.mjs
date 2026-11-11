import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {resolveTimeline} from '../editor/lib/build.mjs';import {checkVideoMediaRanges,checkSessionCandidateMedia} from '../src/services/candidate-media-check.mjs';import {projectRevision} from '../src/services/project-revisions.mjs';
function setup(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-media-check-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const dir=path.join(root,'workspace/content/day/qa');fs.mkdirSync(path.join(dir,'inputs'),{recursive:true});for(const n of ['a.mp4','b.mp4','still.png','audio.mp3'])fs.writeFileSync(path.join(dir,'inputs',n),n);return {root,dir};}
const project=()=>({source:{video:'inputs/a.mp4',duration:10,width:1080,height:1920},segments:[{id:'a',in:1,out:5,speed:2,keep:true},{id:'cut',in:5,out:7,keep:false,src:'inputs/missing.mp4'},{id:'b',in:7,out:9,src:'inputs/b.mp4',mediaStart:3,mediaInfo:{duration:10},keep:true}],brolls:[{id:'detail',at:1,dur:1,speed:2,mediaStart:4,src:'inputs/b.mp4'},{id:'still',at:2,dur:1,src:'inputs/still.png'},{id:'hidden',at:1,dur:2,hidden:true,src:'inputs/missing.mp4'}]});
test('media range checks source clocks/rate, probes unique active files and rejects overrun/missing/type',async t=>{
 const {dir}=setup(t),calls=[],probe=async file=>{calls.push(path.basename(file));return file.endsWith('.png')?{kind:'image',duration:null}:{kind:'video',duration:file.endsWith('b.mp4')?6:10};};
 const result=await checkVideoMediaRanges(dir,resolveTimeline(project()),{probe});assert.equal(result.ok,true);assert.equal(result.activeItems,4);assert.deepEqual(calls,['a.mp4','b.mp4','still.png']);assert.equal(result.framesViewed,false);
 const p=project();p.brolls[0].mediaStart=4.1;p.brolls.push({id:'bad',src:'inputs/missing.mp4',at:1,dur:1},{id:'audio',src:'inputs/audio.mp3',at:1,dur:1});
 const bad=await checkVideoMediaRanges(dir,resolveTimeline(p),{probe:async file=>file.endsWith('.mp3')?{kind:'audio',duration:10}:probe(file)});
 assert.equal(bad.ok,false);assert.deepEqual(bad.errors.map(e=>e.code),['SOURCE_RANGE_EXCEEDED','SOURCE_UNAVAILABLE','VIDEO_REQUIRED']);assert.equal(bad.errors[0].sourceEnd,6.1);
 const legacy=project();legacy.brolls[0].speed=-1;legacy.brolls[0].mediaStart=5.1;const fallback=await checkVideoMediaRanges(dir,resolveTimeline(legacy),{probe});assert.ok(fallback.errors.some(e=>e.id==='detail'&&e.code==='SOURCE_RANGE_EXCEEDED'));
 await assert.rejects(checkVideoMediaRanges(dir,resolveTimeline(project()),{probe:async file=>{fs.appendFileSync(file,'changed');return {kind:'video',duration:10};}}),/Media thay đổi/);
});
test('media inventory refuses oversized source sets and outside paths without probing them',async t=>{
 const {root,dir}=setup(t);fs.writeFileSync(path.join(root,'outside.mp4'),'fixture');let calls=0;
 const many=project();many.brolls=Array.from({length:41},(_,i)=>({id:'b'+i,at:0,dur:1,src:'inputs/'+i+'.mp4'}));
 await assert.rejects(checkVideoMediaRanges(dir,resolveTimeline(many),{probe:async()=>{calls++;}}),/40/);assert.equal(calls,0);
 const outside=project();outside.segments=[];outside.brolls=[{id:'outside',src:'../../../../outside.mp4',at:0,dur:1}];
 const report=await checkVideoMediaRanges(dir,resolveTimeline(outside),{probe:async()=>{calls++;}});assert.equal(report.ok,false);assert.equal(report.errors[0].code,'SOURCE_UNAVAILABLE');assert.equal(calls,0);
});
test('claimed media check is read-only and rejects job/candidate/base changes during async probe',async t=>{
 const {root,dir}=setup(t),work=path.join(dir,'work'),candidate=path.join(work,'build-candidates/token/work/candidate-project.json');fs.mkdirSync(path.dirname(candidate),{recursive:true});const p=project(),live=path.join(dir,'project.json'),base=path.join(path.dirname(candidate),'base-project.json'),jf=path.join(work,'ai-job.json');
 fs.writeFileSync(live,JSON.stringify(p));fs.writeFileSync(base,JSON.stringify(p));fs.writeFileSync(candidate,JSON.stringify(p));const job={status:'working',claimedBy:{id:'owner'},candidate:path.relative(root,candidate),baseRevision:projectRevision(live),completionToken:'token'};fs.writeFileSync(jf,JSON.stringify(job));const files=[live,candidate,jf],before=files.map(f=>fs.readFileSync(f));
 const opts={claimId:'owner',probe:async file=>({kind:file.endsWith('.png')?'image':'video',duration:10})};const report=await checkSessionCandidateMedia(root,path.relative(root,dir),opts);assert.equal(report.ok,true);assert.equal(report.media.ok,true);for(const [i,f] of files.entries())assert.deepEqual(fs.readFileSync(f),before[i]);
 await assert.rejects(checkSessionCandidateMedia(root,path.relative(root,dir),{...opts,claimId:'wrong'}));
 for(const change of [jf,candidate,live]){await assert.rejects(checkSessionCandidateMedia(root,path.relative(root,dir),{...opts,probe:async()=>{fs.appendFileSync(change,' ');return {kind:'video',duration:10};}}),/đổi|revision|thay đổi|bản/i);for(const [i,f] of files.entries())fs.writeFileSync(f,before[i]);}
});
