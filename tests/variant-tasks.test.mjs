import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createTaskStore} from '../src/services/tasks.mjs';import {createVariantTasks} from '../src/services/variant-tasks.mjs';import {projectRevision} from '../src/services/project-revisions.mjs';
test('variant batch persists outputs, deduplicates submissions, cancels, resumes missing items and reconciles restart',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-variant-tasks-')),dir='workspace/content/2026-11-04/source',source=path.join(root,dir);fs.mkdirSync(path.join(source,'inputs'),{recursive:true});fs.writeFileSync(path.join(source,'inputs/source.mp4'),'fixture');
 const pj={workspaceId:'one',title:'Source',format:'9:16',source:{video:'inputs/source.mp4',duration:1,width:360,height:640,hasAudio:false},segments:[{id:'s',in:0,out:1,keep:true}],audio:{autoSfx:false,sfxLevel:'tat'},captions:{lines:[]}};fs.writeFileSync(path.join(source,'project.json'),JSON.stringify(pj));
 const store={active:()=>({id:'one'})},tasks=createTaskStore(root),worker=createVariantTasks({root,workspaceStore:store,tasks}),body={dir,revision:projectRevision(path.join(source,'project.json')),items:[{title:'Dọc',format:'9:16'},{title:'Ngang',format:'16:9'}],idempotencyKey:'batch-one'};
 const wait=async id=>{for(let i=0;i<150&&['running','queued'].includes(tasks.get(id,'one').status);i++)await new Promise(r=>setTimeout(r,10));return tasks.get(id,'one');};
 try{
  const task=worker.enqueue('one',body);assert.equal(worker.enqueue('one',body).id,task.id);assert.throws(()=>worker.enqueue('one',{...body,items:[body.items[0]]}),/Khóa/);
  const done=await wait(task.id);assert.equal(done.status,'succeeded');assert.equal(done.result.items.length,2);const first=done.result.items[0].dir;
  const interrupted=tasks.retry.bind(tasks); // terminal succeeded cannot be retried through public API
  assert.throws(()=>interrupted(task.id,'one'));
  const cancel=worker.enqueue('one',{...body,idempotencyKey:'cancel'});worker.cancel(cancel.id,'one');await new Promise(r=>setTimeout(r,30));assert.equal(tasks.get(cancel.id,'one').status,'cancelled');
  const resumed=worker.resume(cancel.id,'one');assert.equal((await wait(resumed.id)).status,'succeeded');
  // Reconstruct partial crash state using real committed first output; recovery must skip it.
  const queueFile=path.join(root,'workspace/contentos/tasks/queue.json'),data=JSON.parse(fs.readFileSync(queueFile));const stored=data.tasks.find(t=>t.id===task.id);stored.status='running';stored.leaseUntil=Date.now()+60000;stored.leaseToken='old';delete stored.result;fs.writeFileSync(queueFile,JSON.stringify(data));
  fs.rmSync(path.join(root,done.result.items[1].dir),{recursive:true,force:true});
  const fresh=createVariantTasks({root,workspaceStore:store,tasks:createTaskStore(root)});assert.equal(tasks.get(task.id,'one').status,'interrupted');fresh.resume(task.id,'one');const recovered=await wait(task.id);assert.equal(recovered.status,'succeeded');assert.equal(recovered.result.items[0].dir,first);assert.equal(recovered.result.items.length,2);
  // Fully committed results with missing task finish recover as succeeded without replay.
  const latest=JSON.parse(fs.readFileSync(queueFile));latest.tasks.find(t=>t.id===task.id).status='interrupted';fs.writeFileSync(queueFile,JSON.stringify(latest));createVariantTasks({root,workspaceStore:store,tasks:createTaskStore(root)});assert.equal(tasks.get(task.id,'one').status,'succeeded');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
