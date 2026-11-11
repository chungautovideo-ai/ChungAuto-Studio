import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import crypto from 'node:crypto';
import {cachedPersonArtifact,installPersonRuntime,personRuntimeLock} from '../installer/person-runtime.mjs';
import {personRuntimeCandidates} from '../src/services/person-runtime.mjs';
const fixture=t=>{const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-person-install-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;};
test('SAM2 promotes only verified runtime and preserves mismatched existing model',async t=>{
 const root=fixture(t),bytes=Buffer.from('model fixture'),sha256=crypto.createHash('sha256').update(bytes).digest('hex'),cached=path.join(root,'cached');fs.writeFileSync(cached,bytes);
 const lock={pythonArtifact:{},wheels:[],model:{files:[{name:'config.json',sha256}]}},calls=[];
 const options={platform:'win32',arch:'x64',env:{},lock,log:()=>{},download:async()=>cached,run:async(command,args)=>{calls.push({command,args});return {stdout:JSON.stringify({ready:true,device:'fixture GPU'})};}};
 const result=await installPersonRuntime(root,options);assert.equal(result.source,'local');assert.ok(result.command.endsWith(path.join('sam2-python','python.exe')));assert.equal(calls.length,3);assert.ok(calls[2].args.includes(path.join(root,'editor/tools/person-runtime-check.py')));
 assert.ok(fs.existsSync(path.join(root,'tools/sam2-python/contentos-runtime.json')));assert.ok(!fs.existsSync(path.join(root,'tools/sam2-install.lock')));
 const root2=fixture(t),modelDir=path.join(root2,'tools/models/sam2.1-hiera-tiny');fs.mkdirSync(modelDir,{recursive:true});fs.writeFileSync(path.join(modelDir,'config.json'),'keep');
 await assert.rejects(installPersonRuntime(root2,options),/giữ nguyên/);assert.equal(fs.readFileSync(path.join(modelDir,'config.json'),'utf8'),'keep');assert.ok(!fs.existsSync(path.join(root2,'tools/sam2-python')));
});
test('SAM2 downloads verify streaming bytes, retain bad cache and remove partial failures',async t=>{
 const cache=fixture(t),bytes=Buffer.from('fixture'),sha256=crypto.createHash('sha256').update(bytes).digest('hex'),artifact={url:'https://files.pythonhosted.org/test.whl',sha256};let calls=0;
 const fetcher=async()=>{calls++;return new Response(bytes);};const file=await cachedPersonArtifact(artifact,cache,{fetcher});assert.deepEqual(fs.readFileSync(file),bytes);
 assert.equal(await cachedPersonArtifact(artifact,cache,{fetcher}),file);assert.equal(calls,1);
 fs.writeFileSync(file,'corrupt');await assert.rejects(cachedPersonArtifact(artifact,cache,{fetcher}),/Cache SAM2 sai/);assert.equal(fs.readFileSync(file,'utf8'),'corrupt');
 await assert.rejects(cachedPersonArtifact({...artifact,sha256:'0'.repeat(64)},cache,{fetcher}),/SHA256 mismatch/);assert.ok(fs.readdirSync(cache).every(n=>!n.endsWith('.partial')));
 await assert.rejects(cachedPersonArtifact({...artifact,url:'http://files.pythonhosted.org/x'},cache,{fetcher}),/không hợp lệ/);
});
test('SAM2 installer preserves overrides/existing runtime and cleans failed staging plus install lock',async t=>{
 const root=fixture(t),opts={platform:'win32',arch:'x64',env:{},log:()=>{}};
 await assert.rejects(installPersonRuntime(root,{...opts,env:{CONTENTOS_SAM2_PYTHON:'chosen'}}),/override/);
 fs.mkdirSync(path.join(root,'tools/sam2-python'),{recursive:true});fs.writeFileSync(path.join(root,'tools/sam2-python/python.exe'),'fixture');
 assert.equal(personRuntimeCandidates(root,{env:{},platform:'win32'})[0].source,'local');
 await assert.rejects(installPersonRuntime(root,{...opts,probe:async()=>({ready:false})}),/giữ nguyên/);assert.ok(fs.existsSync(path.join(root,'tools/sam2-python/python.exe')));
 const root2=fixture(t);await assert.rejects(installPersonRuntime(root2,{...opts,download:async()=>{throw Error('offline');}}),/offline/);
 assert.deepEqual(fs.readdirSync(path.join(root2,'tools')),[]);
 fs.writeFileSync(path.join(root2,'tools/sam2-install.lock'),'held');await assert.rejects(installPersonRuntime(root2,opts),/khóa/);assert.equal(fs.readFileSync(path.join(root2,'tools/sam2-install.lock'),'utf8'),'held');
 assert.equal(personRuntimeLock.wheels.length,37);assert.ok(personRuntimeLock.wheels.every(a=>/^[a-f0-9]{64}$/.test(a.sha256)));
});
