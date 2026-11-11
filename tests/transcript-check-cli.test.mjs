import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {sourceTranscriptClock} from '../editor/lib/source-transcript.js';
test('session transcript check CLI accepts current clock and rejects missing/stale without invoking recognition',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-check-transcript-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));fs.mkdirSync(path.join(dir,'work'));
 const p={source:{timeline:'segments'},segments:[{src:'absent.mp4',in:0,out:1,mediaStart:0}]};fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify(p));
 const check=()=>spawnSync(process.execPath,['editor/tools/transcribe.mjs',dir,'--check-transcript'],{encoding:'utf8',windowsHide:true});let result=check();assert.equal(result.status,3);assert.equal(JSON.parse(result.stdout).ready,false);
 const file=path.join(dir,'work/transcript.json');fs.writeFileSync(file,JSON.stringify({sourceClock:sourceTranscriptClock(p),words:[]}));result=check();assert.equal(result.status,0);assert.equal(JSON.parse(result.stdout).ready,true);
 p.segments[0].mediaStart=.1;fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify(p));result=check();assert.equal(result.status,3);assert.match(JSON.parse(result.stdout).reason,/nhận giọng lại/);
});

test('session transcript language check rejects wrong or missing language without recognition',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-check-language-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));fs.mkdirSync(path.join(dir,'work'));fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify({source:{video:'absent.mp4'}}));
 const file=path.join(dir,'work/transcript.json'),check=lang=>spawnSync(process.execPath,['editor/tools/transcribe.mjs',dir,'--check-transcript','--lang',lang],{encoding:'utf8',windowsHide:true});
 for(const language of ['en',undefined]){fs.writeFileSync(file,JSON.stringify({language,words:[{word:'Hello',start:0,end:1}]}));const before=fs.readFileSync(file),result=check('vi');assert.equal(result.status,3);assert.match(JSON.parse(result.stdout).reason,/ngôn ngữ/);assert.deepEqual(fs.readFileSync(file),before);assert.equal(check('auto').status,0);}
 fs.writeFileSync(file,JSON.stringify({language:'vi',words:[]}));assert.equal(check('vi').status,0);assert.equal(check('en').status,3);assert.equal(check('bad').status,2);
});
