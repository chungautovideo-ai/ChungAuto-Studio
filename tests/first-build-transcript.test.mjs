import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {prepareFirstBuildTranscript} from '../src/services/first-build-transcript.mjs';import {sourceTranscriptClock} from '../editor/lib/source-transcript.js';
test('first-build preparation reuses valid source mapping, repairs stale mapping and respects cancellation/missing runtime',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-first-asr-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));fs.mkdirSync(path.join(dir,'work'));
 const project={source:{timeline:'segments'},segments:[{src:'a.mp4',in:0,out:1,mediaStart:0}]},file=path.join(dir,'work/transcript.json'),current={language:'vi',sourceClock:sourceTranscriptClock(project),words:[{word:'Xin',start:0,end:.2}]};
 fs.writeFileSync(file,JSON.stringify(current));assert.equal((await prepareFirstBuildTranscript('',dir,{project,ready:false})).state,'reused');
 fs.writeFileSync(file,JSON.stringify({...current,sourceClock:'stale'}));await assert.rejects(prepareFirstBuildTranscript('',dir,{project,ready:false}),/công cụ/);
 let count=0;const result=await prepareFirstBuildTranscript('',dir,{project,ready:true,recognizeProject:async()=>{count++;return current;}});assert.equal(result.state,'recognized');assert.equal(count,1);
 const abort=new AbortController();abort.abort();await assert.rejects(prepareFirstBuildTranscript('',dir,{project,ready:true,signal:abort.signal}));assert.equal(count,1);
 await assert.rejects(prepareFirstBuildTranscript('',dir,{project,ready:true,recognizeProject:async()=>({...current,sourceClock:'bad'})}),/không khớp/);
 assert.equal((await prepareFirstBuildTranscript('',dir,{project:{source:{hasAudio:false}},ready:false})).state,'reused');fs.rmSync(file);assert.equal((await prepareFirstBuildTranscript('',dir,{project:{source:{hasAudio:false}},ready:false})).state,'silent');
});
