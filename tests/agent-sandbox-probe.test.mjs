import test from 'node:test';import assert from 'node:assert/strict';
import {probeCodexSandbox} from '../src/services/agent-sandbox-probe.mjs';
test('Codex sandbox preflight tests local Node without model and preserves explicit workspace sandbox',async()=>{
 const execute=(file,args,options,done)=>{
  assert.equal(file,'codex.cmd');assert.deepEqual(args,['sandbox','-c','sandbox_mode="workspace-write"','node','--version']);assert.equal(options.timeout,20000);assert.equal(options.cwd,'project');assert.equal(options.env.TEST,'kept');done(null,'v24.14.1\n','');
 };
 assert.deepEqual(await probeCodexSandbox('codex.cmd',{cwd:'project',env:{TEST:'kept'},execute}),{checked:true,ready:true});
 const fixture=(error,stdout,stderr)=>(_f,_a,_o,done)=>done(error,stdout,stderr);
 const setup=await probeCodexSandbox('codex.exe',{execute:fixture(Error('exit1'),'','windows sandbox failed: helper_unknown_error: setup refresh had errors')});assert.equal(setup.ready,false);assert.equal(setup.errorCode,'CLI_EXEC_UNAVAILABLE');
 const timeout=await probeCodexSandbox('codex.exe',{execute:fixture(Object.assign(Error('timeout'),{killed:true}),'','')});assert.equal(timeout.ready,false);
 assert.deepEqual(await probeCodexSandbox('codex.exe',{execute:fixture(Error('exit1'),'',"error: unrecognized subcommand 'sandbox'")}),{checked:false,ready:null,reason:'unsupported'});
 assert.equal((await probeCodexSandbox('codex.exe',{execute:fixture(null,'unknown','') })).ready,false);
});
test('explicit MXC probe keeps managed requirements and workspace permissions',async()=>{
 const result=await probeCodexSandbox('desktop.exe',{implementation:'mxc',execute:(file,args,options,done)=>{assert.deepEqual(args,['-c','windows.sandbox="mxc"','sandbox','--include-managed-config','--permission-profile',':workspace','--','node','--version']);done(null,'v24.14.1\n','');}});assert.equal(result.ready,true);
});
