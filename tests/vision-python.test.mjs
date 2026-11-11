import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {verifyVisionArtifact} from '../installer/vision-embedded.mjs';
import crypto from 'node:crypto';
import {visionPythonCandidates,visionPythonStatus,requireVisionPython} from '../src/services/vision-python.mjs';
const good={status:0,stdout:JSON.stringify({python:'3.12.10',executable:'fixture/python',opencv:'4.11.0',numpy:'2.2.6'})};
test('vision runtime prefers app venv and keeps explicit override authoritative',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-vision-'));try{
 const local=visionPythonCandidates(root,{platform:'win32',env:{}}).find(c=>c.source==='local');fs.mkdirSync(path.dirname(local.command),{recursive:true});fs.writeFileSync(local.command,'fixture only');
 const calls=[],result=visionPythonStatus(root,{platform:'win32',env:{},probe:(cmd,args)=>{calls.push({cmd,args});return good;}});assert.equal(result.command,local.command);assert.equal(result.localEnvironment,true);assert.equal(calls.length,1);assert.ok(calls[0].args.includes('-X'));
 const override=visionPythonStatus(root,{env:{CONTENTOS_VISION_PYTHON:'missing/custom'},probe:cmd=>({status:1,stderr:'not found'})});assert.equal(override.ready,false);assert.equal(override.attempts.length,1);assert.equal(override.attempts[0].source,'override');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('vision readiness checks imports and actual CV operation; fails with actionable setup guidance',()=>{
 const code=visionPythonCandidates('/fixture',{platform:'linux',env:{}});assert.ok(code[0].command.endsWith(path.join('bin','python')));
 let attempts=0;const result=visionPythonStatus('/fixture',{platform:'linux',env:{},probe:(cmd,args)=>{attempts++;assert.match(args.at(-1),/goodFeaturesToTrack/);return attempts===1?{status:1,stderr:'No module named cv2'}:good;}});assert.equal(result.ready,true);assert.equal(result.command,'python3');assert.equal(result.localEnvironment,false);
 assert.throws(()=>requireVisionPython('/fixture',{env:{CONTENTOS_VISION_PYTHON:'missing'},probe:()=>({status:1,stderr:'missing'})}),/setup.ps1/);
 const old=visionPythonStatus('/fixture',{env:{CONTENTOS_VISION_PYTHON:'old'},probe:()=>({...good,stdout:JSON.stringify({...JSON.parse(good.stdout),python:'3.9.0'})})});assert.equal(old.ready,false);
});

test('vision artifact verification rejects changed downloaded bytes',()=>{
 const bytes=Buffer.from('runtime-fixture'),hash=crypto.createHash('sha256').update(bytes).digest('hex');assert.deepEqual(verifyVisionArtifact(bytes,hash),bytes);assert.throws(()=>verifyVisionArtifact(Buffer.from('changed'),hash),/SHA256/);
});
