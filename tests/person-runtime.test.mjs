import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {personRuntimeCandidates,personRuntimeStatus} from '../src/services/person-runtime.mjs';
test('SAM2 readiness uses authoritative override, reports missing model and probes without downloading',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-sam2-runtime-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 assert.deepEqual(personRuntimeCandidates(root,{env:{CONTENTOS_SAM2_PYTHON:'chosen'},platform:'win32'}),[{command:'chosen',args:[],source:'override'}]);
 let calls=0;assert.equal((await personRuntimeStatus(root,{execute:async()=>{calls++;}})).ready,false);assert.equal(calls,0);
 fs.mkdirSync(path.join(root,'tools/models/sam2.1-hiera-tiny'),{recursive:true});fs.writeFileSync(path.join(root,'tools/models/sam2.1-hiera-tiny/model.safetensors'),'fixture');
 const ready=await personRuntimeStatus(root,{env:{CONTENTOS_SAM2_PYTHON:'chosen'},execute:async(command,args,options)=>{calls++;assert.equal(command,'chosen');assert.ok(args.includes('-X'));assert.equal(options.env.HF_HUB_OFFLINE,'1');assert.equal(options.timeout,25000);return {stdout:JSON.stringify({ready:true,device:'fixture GPU'})};}});assert.equal(ready.ready,true);assert.equal(calls,1);
 const failure=await personRuntimeStatus(root,{env:{CONTENTOS_SAM2_PYTHON:'chosen'},execute:async()=>{throw {stdout:JSON.stringify({ready:false,detail:'CUDA unavailable'})};}});assert.equal(failure.ready,false);assert.equal(failure.detail,'CUDA unavailable');assert.equal(failure.attempts.length,1);
});
