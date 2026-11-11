import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {createBatchEditDispatch} from '../src/services/batch-edit-dispatch.mjs';

function fixture(t,stage){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-edit-batch-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const items=[0,1].map(index=>({index,dir:'workspace/content/project-'+index}));
 for(const item of items){const dir=path.join(root,item.dir);fs.mkdirSync(path.join(dir,'work'),{recursive:true});fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify({workspaceId:'ws',contentos:{intakeBatch:{taskId:'intake',index:item.index}}}));}
 const workspace={id:'ws'},request={workspaceId:'ws',sourceTaskId:'intake',idempotencyKey:crypto.randomUUID(),template:'fixture',execution:{mode:'session',agent:'codex'},notes:['First brief','Second brief']};
 const options={root,workspaceStore:{active:()=>workspace},tasks:{get:()=>({kind:'intake-batch',status:'succeeded',result:{items}})},stage};
 return {root,items,workspace,request,service:createBatchEditDispatch(options),options};
}

test('batch dispatch preserves staged entries on partial failure and retries only missing jobs',async t=>{
 let fail=true;const calls=[];
 const f=fixture(t,async(dir,body)=>{calls.push({dir,body});if(dir.endsWith('project-1')&&fail)throw new Error('fixture unavailable');return {job:{dir}};});
 const first=await f.service.submit(f.request);assert.equal(first.entries.length,1);assert.equal(first.error,'fixture unavailable');
 fail=false;const second=await f.service.submit(f.request);assert.equal(second.entries.length,2);assert.equal(second.error,null);
 assert.equal(calls.filter(call=>call.dir.endsWith('project-0')).length,1);
 assert.equal(calls.at(-1).body.note,'Second brief');assert.equal(calls.at(-1).body.completionMode,'review');
 await f.service.submit(f.request);assert.equal(calls.length,3);
 await assert.rejects(f.service.submit({...f.request,notes:['Changed','Second brief']}),{status:409});
});

test('batch dispatch recovers staged job marker after missing journal checkpoint across service restart',async t=>{
 let calls=0;const f=fixture(t,async dir=>{calls++;return {job:{dir}};});
 const dir=path.join(f.root,f.items[0].dir);fs.writeFileSync(path.join(dir,'work/ai-job.json'),JSON.stringify({dir:f.items[0].dir,batchDispatch:{id:f.request.idempotencyKey,index:0}}));
 const result=await createBatchEditDispatch(f.options).submit(f.request);
 assert.equal(result.entries[0].recovered,true);assert.equal(calls,1);
 await createBatchEditDispatch(f.options).submit(f.request);assert.equal(calls,1);
});

test('batch dispatch rejects concurrent same-key submission and stops remaining jobs on workspace change',async t=>{
 let entered,release;const ready=new Promise(resolve=>entered=resolve),gate=new Promise(resolve=>release=resolve);
 const f=fixture(t,async dir=>{entered();await gate;return {job:{dir}};});
 const pending=f.service.submit(f.request);await ready;
 await assert.rejects(f.service.submit(f.request),{status:409});f.workspace.id='other';release();
 const result=await pending;assert.equal(result.entries.length,1);assert.match(result.error,/Workspace/);
});

test('batch dispatch refuses foreign workspace or mismatched intake origin without staging',async t=>{
 let calls=0;const f=fixture(t,async()=>{calls++;throw new Error('must not stage');});
 const file=path.join(f.root,f.items[0].dir,'project.json');
 for(const project of [{workspaceId:'foreign',contentos:{intakeBatch:{taskId:'intake',index:0}}},{workspaceId:'ws',contentos:{intakeBatch:{taskId:'other',index:0}}}]){
  fs.writeFileSync(file,JSON.stringify(project));const result=await f.service.submit({...f.request,idempotencyKey:crypto.randomUUID()});assert.equal(result.entries.length,0);assert.match(result.error,/khớp lô/);
 }
 assert.equal(calls,0);
});

test('batch dispatch validates model and execution before staging and forwards chosen API model to every job',async t=>{
 const calls=[];const f=fixture(t,async(dir,body)=>{calls.push(body.execution);return {job:{dir}};});
 for(const execution of [{mode:'api',agent:'gateway',model:'--unsafe'},{mode:'session',agent:'codex',model:'not-controlled-by-session'},{mode:'cli',agent:'auto'}]){
  await assert.rejects(f.service.submit({...f.request,execution}),{status:400});
 }
 assert.equal(calls.length,0);
 const result=await f.service.submit({...f.request,execution:{mode:'api',agent:'gateway',model:'provider/model-v2'}});
 assert.equal(result.error,null);assert.deepEqual(calls,[{mode:'api',agent:'gateway',model:'provider/model-v2'},{mode:'api',agent:'gateway',model:'provider/model-v2'}]);
});

test('latest dispatch restores exact settings after service restart, scopes workspace and retains partial progress',async t=>{
 let fail=true;const f=fixture(t,async dir=>{if(dir.endsWith('project-1')&&fail)throw new Error('temporary');return {job:{dir}};});
 assert.equal(f.service.latest('ws','intake'),null);
 await f.service.submit(f.request);const restarted=createBatchEditDispatch(f.options),saved=restarted.latest('ws','intake');
 assert.equal(saved.id,f.request.idempotencyKey);assert.deepEqual(saved.input.notes,f.request.notes);assert.equal(saved.entries.length,1);assert.equal(saved.error,'temporary');assert.equal(saved.dispatching,false);
 assert.throws(()=>restarted.latest('foreign','intake'),{status:409});assert.equal(restarted.latest('ws','other'),null);
 fail=false;await restarted.submit({...saved.input,idempotencyKey:saved.id});assert.equal(restarted.latest('ws','intake').entries.length,2);
});
