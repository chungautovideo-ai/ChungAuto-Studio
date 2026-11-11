import test from 'node:test';import assert from 'node:assert/strict';
import {prepareCodexWorkerRuntime,supportsMxcProbe} from '../src/services/codex-worker-runtime.mjs';
const failure={checked:true,ready:false,errorCode:'CLI_EXEC_UNAVAILABLE',message:'Sandbox startup failed'};
test('working configured runtime remains selected without alternate probes',async()=>{
 let versions=0;const result=await prepareCodexWorkerRuntime('configured',{fallbackBins:['desktop'],probe:async()=>({checked:true,ready:true}),version:async()=>versions++});assert.equal(versions,0);assert.equal(result.bin,'configured');assert.deepEqual(result.configArgs,[]);
});
test('known Windows startup failure can use verified explicit MXC with an installed compatible CLI',async()=>{
 const calls=[];const result=await prepareCodexWorkerRuntime('npm',{cwd:'workspace',env:{TEST:'kept'},fallbackBins:['desktop'],version:async file=>file==='npm'?'codex-cli 0.161.0':'codex-cli 0.166.0-alpha.5.1',probe:async(file,options)=>{calls.push([file,options.implementation]);assert.equal(options.cwd,'workspace');assert.equal(options.env.TEST,'kept');return options.implementation==='mxc'?{checked:true,ready:true}:failure;}});
 assert.deepEqual(calls,[['npm',undefined],['desktop','mxc']]);assert.equal(result.bin,'desktop');assert.equal(result.implementation,'mxc');assert.deepEqual(result.configArgs,['-c','windows.sandbox="mxc"']);
});
test('failed MXC and unrelated errors never downgrade sandbox or hide original error',async()=>{
 await assert.rejects(prepareCodexWorkerRuntime('npm',{fallbackBins:['desktop'],version:async()=> 'codex-cli 0.166.0',probe:async()=>failure}),e=>e.errorCode==='CLI_EXEC_UNAVAILABLE');let versions=0;
 await assert.rejects(prepareCodexWorkerRuntime('npm',{version:async()=>versions++,probe:async()=>({...failure,errorCode:'CLI_SANDBOX_PROBE_FAILED'})}),e=>e.errorCode==='CLI_SANDBOX_PROBE_FAILED');assert.equal(versions,0);
 for(const v of ['unknown','codex-cli 0.161.0'])assert.equal(supportsMxcProbe(v),false);assert.equal(supportsMxcProbe('codex-cli 0.162.0'),true);
});
