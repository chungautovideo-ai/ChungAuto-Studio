import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeExecution,acceptsJob,cliModelArgs} from '../src/services/ai-execution.mjs';
test('execution selection pins agent, separates active session and background CLI',()=>{
 assert.deepEqual(normalizeExecution(),{mode:'session',agent:'auto'});
 assert.throws(()=>normalizeExecution({mode:'api',agent:'codex'}));
 assert.throws(()=>normalizeExecution({mode:'cli',agent:'auto'}));
 assert.deepEqual(normalizeExecution({mode:'cli',agent:'claude'}),{mode:'cli',agent:'claude'});
 assert.deepEqual(normalizeExecution({mode:'session',agent:'antigravity'}),{mode:'session',agent:'antigravity'});
 assert.throws(()=>normalizeExecution({mode:'cli',agent:'antigravity'}));
 const job={status:'waiting',execution:{mode:'session',agent:'codex'}};
 assert.equal(acceptsJob(job,'claude'),false);assert.equal(acceptsJob(job,'antigravity'),false);assert.equal(acceptsJob(job,'codex'),true);
 const agyJob={status:'waiting',execution:{mode:'session',agent:'antigravity'}};
 assert.equal(acceptsJob(agyJob,'antigravity'),true);assert.equal(acceptsJob(agyJob,'codex'),false);assert.equal(acceptsJob(agyJob,'claude'),false);
 assert.equal(acceptsJob({status:'waiting',execution:{mode:'session',agent:'auto'}},'antigravity'),true);
 assert.equal(acceptsJob({...job,background:true},'codex'),false);
 assert.equal(acceptsJob({...job,background:true},'codex',{explicit:true}),true);
 assert.equal(acceptsJob({...job,status:'working'},'codex',{explicit:true}),false);
 assert.equal(acceptsJob({status:'waiting'},'claude'),true);
});
test('CLI model override is validated, kept verbatim, and gated on installed CLI help',()=>{
 const execution={mode:'cli',agent:'codex',model:'custom-model/v1:fast'};
 assert.deepEqual(normalizeExecution(execution),execution);
 assert.deepEqual(cliModelArgs(execution,' -m, --model <MODEL>'),['--model','custom-model/v1:fast']);
 assert.throws(()=>cliModelArgs(execution,'--models list'),/không xác nhận/);
 for(const model of ['--help','x;start','a b','$(command)','`code`'])assert.throws(()=>normalizeExecution({...execution,model}));
 assert.throws(()=>normalizeExecution({...execution,mode:'session'}));
 assert.deepEqual(cliModelArgs({mode:'cli',agent:'claude'},''),[]);
});
test('API run pins optional model without granting a session override or implicit routing',()=>{
 const execution={mode:'api',agent:'gateway',model:'vendor/model:fast'};assert.deepEqual(normalizeExecution(execution,{allowApi:true}),execution);assert.deepEqual(normalizeExecution({...execution,model:''},{allowApi:true}),{mode:'api',agent:'gateway'});assert.throws(()=>normalizeExecution(execution));for(const model of ['--help','a b','x;run'])assert.throws(()=>normalizeExecution({...execution,model},{allowApi:true}));
});
