import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {writeCompletionHandoff,consumeCompletionHandoff} from '../src/services/cli-completion-handoff.mjs';

function fixture(kind){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-handoff-'));
 const work=path.join(dir,'work');fs.mkdirSync(work);
 const candidate=path.join(work,kind==='revise'?'candidate-project.json':'build-candidates/token/work/candidate-project.json');
 fs.mkdirSync(path.dirname(candidate),{recursive:true});fs.writeFileSync(candidate,'{"texts":[]}');
 const job={kind,status:'working',execution:{mode:'cli'},claimedBy:{id:'claim'},candidate:'candidate',completionToken:'token'};
 const save=()=>fs.writeFileSync(path.join(work,'ai-job.json'),JSON.stringify(job));save();
 return {dir,work,candidate,job,save,env:{CONTENTOS_COMPLETION_JOB:dir,CONTENTOS_COMPLETION_NONCE:'nonce'},body:{claimId:'claim',token:'token',revision:'base'},clean:()=>fs.rmSync(dir,{recursive:true,force:true})};
}
test('build and revise handoff preserves candidate and job until server validates; consumes only once',async()=>{
 for(const kind of [undefined,'revise']){const f=fixture(kind);try{
  const before=fs.readFileSync(path.join(f.work,'ai-job.json'),'utf8');
  writeCompletionHandoff(f.dir,f.body,{env:f.env});
  assert.equal(fs.readFileSync(path.join(f.work,'ai-job.json'),'utf8'),before);
  let calls=0;const options={nonce:'nonce',complete:async(type,body)=>{calls++;assert.equal(type,kind||'build');assert.deepEqual(body,f.body);}};
  assert.equal(await consumeCompletionHandoff(f.dir,options),true);
  assert.equal(await consumeCompletionHandoff(f.dir,options),false);assert.equal(calls,1);
  assert.equal(fs.readFileSync(f.candidate,'utf8'),'{"texts":[]}');
 }finally{f.clean();}}
});
test('wrong owner, nonce, cancelled job and changed candidate never reach completion',async()=>{
 for(const change of ['owner','nonce','cancelled','candidate']){const f=fixture();try{
  writeCompletionHandoff(f.dir,f.body,{env:f.env});
  if(change==='owner')f.job.claimedBy.id='other';
  if(change==='cancelled')f.job.status='cancelled';f.save();
  if(change==='candidate')fs.writeFileSync(f.candidate,'{"texts":[1]}');
  let calls=0;await assert.rejects(consumeCompletionHandoff(f.dir,{nonce:change==='nonce'?'wrong':'nonce',complete:async()=>calls++}));assert.equal(calls,0);
 }finally{f.clean();}}
});
test('server rejection keeps request and candidate; unmanaged and missing-claim submissions rejected',async()=>{
 const f=fixture();try{
  assert.throws(()=>writeCompletionHandoff(f.dir,f.body,{env:{}}));
  assert.throws(()=>writeCompletionHandoff(f.dir,{}, {env:f.env}));
  writeCompletionHandoff(f.dir,f.body,{env:f.env});
  await assert.rejects(consumeCompletionHandoff(f.dir,{nonce:'nonce',complete:async()=>{throw Error('revision conflict');}}),/revision conflict/);
  assert.ok(fs.existsSync(path.join(f.work,'cli-completion-request.json')));assert.ok(fs.existsSync(f.candidate));
 }finally{f.clean();}
});
