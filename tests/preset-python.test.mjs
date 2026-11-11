import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {presetPythonStatus} from '../src/services/preset-python.mjs';
const good={status:0,stdout:JSON.stringify({python:'3.12.10',lxml:'6.0.2',executable:'fixture'})};
test('preset runtime prefers embedded Python and probes actual HTML parsing with local library path',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-preset-runtime-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const exe=path.join(root,'tools/vision-embedded/python.exe');fs.mkdirSync(path.dirname(exe),{recursive:true});fs.writeFileSync(exe,'fixture');
 const calls=[];const result=presetPythonStatus(root,{platform:'win32',env:{},probe:(cmd,args)=>{calls.push({cmd,args});return good;}});assert.equal(result.command,exe);assert.equal(result.localEnvironment,true);assert.equal(calls.length,1);assert.match(calls[0].args.at(-2),/fragment_fromstring/);assert.equal(calls[0].args.at(-1),path.join(root,'tools/preset-fields'));
});
test('preset runtime respects explicit override and never falls back after it fails',()=>{
 const calls=[];const failed=presetPythonStatus('/fixture',{env:{CONTENTOS_PRESET_PYTHON:'missing'},probe:cmd=>{calls.push(cmd);return {status:1,stdout:'',stderr:'missing'};}});assert.equal(failed.ready,false);assert.deepEqual(calls,['missing']);assert.match(failed.detail,/setup.ps1/);
 const success=presetPythonStatus('/fixture',{env:{CONTENTOS_PRESET_PYTHON:'custom'},probe:()=>good});assert.equal(success.source,'override');assert.equal(success.localEnvironment,false);
 const malformed=presetPythonStatus('/fixture',{env:{CONTENTOS_PRESET_PYTHON:'bad'},probe:()=>({status:0,stdout:'not-json'})});assert.equal(malformed.ready,false);
});
