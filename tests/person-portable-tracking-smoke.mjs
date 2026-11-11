// Opt-in CUDA inference on copied QA media; does not open or alter user projects.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {personRuntimeStatus} from '../src/services/person-runtime.mjs';
assert.ok(process.argv.includes('--run-local-gpu'),'Pass --run-local-gpu for actual local inference.');
const root=process.cwd(),run=promisify(execFile),python=path.join(root,'tools/sam2-python/python.exe'),runtime=await personRuntimeStatus(root,{refresh:true});
assert.equal(runtime.ready,true);assert.equal(runtime.source,'local');assert.equal(runtime.command,python);
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const dir=fs.mkdtempSync(path.join(root,'workspace/cache/person-portable-guard-')),cases=[];
for(const [name,request,expected] of [
 ['continuous','person-sam2-motion6-body-request.json',null],
 ['moving-cover','person-sam2-moving-occluder6-request.json',/Mask changed abruptly \(area-change\)/],
 ['hard-cut','person-sam2-cut-request.json',/Possible scene cut/],
]){
 const config=JSON.parse(fs.readFileSync(path.join(root,'workspace/cache',request))),before=hash(config.source);config.output=path.join(dir,name+'-result.json');
 const file=path.join(dir,name+'-request.json');fs.writeFileSync(file,JSON.stringify(config));console.log('Tracking '+name);
 let code=0,stdout='',stderr='';try{({stdout,stderr}=await run(python,['-X','utf8',path.join(root,'editor/tools/person-track.py'),file],{windowsHide:true,timeout:180000,maxBuffer:262144}));}catch(error){if(error.killed)throw error;code=error.code;stdout=error.stdout||'';stderr=error.stderr||'';}
 fs.writeFileSync(path.join(dir,name+'.log'),stdout+'\n'+stderr);assert.equal(hash(config.source),before);
 if(expected){assert.notEqual(code,0);assert.match(stderr,expected);assert.equal(fs.existsSync(config.output),false);cases.push({name,rejected:true,outputAbsent:true,error:stderr.trim().split('\n').at(-1),sourceUnchanged:true});}
 else{assert.equal(code,0,stderr);const report=JSON.parse(fs.readFileSync(config.output));assert.equal(report.f.length,48);assert.equal(report.sourceSha256,before);assert.equal(report.maskGuard.identityVerified,false);assert.equal(report.requiresVisualReview,true);cases.push({name,result:config.output,samples:report.f.length,elapsedSeconds:report.elapsedSeconds,gpuPeakBytes:report.gpuPeakBytes,sourceUnchanged:true,requiresVisualReview:true});}
}
const evidence={runtime:{command:runtime.command,source:runtime.source,info:runtime.info},cases,limits:'Real CUDA inference on one six-second speaker proxy and synthetic moving cover/hard cut. Not independently filmed crossing people, identity recovery, full-video, UI or final acceptance.'};
fs.writeFileSync('docs/PERSON_PORTABLE_TRACKING_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
