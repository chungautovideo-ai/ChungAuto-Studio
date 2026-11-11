import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createWorkspaceStore} from '../src/services/workspaces.mjs';import {createStorageService} from '../src/services/storage.mjs';import {createTaskStore} from '../src/services/tasks.mjs';import {createIntakeTasks} from '../src/services/intake-tasks.mjs';
const until=async check=>{for(let i=0;i<300;i++){if(check())return;await new Promise(r=>setTimeout(r,10));}throw new Error('Timed out');};
test('intake batch creates separate real editable projects, deduplicates, resumes missing and retains completed after failure',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-intake-batch-'));
 try{
 const nas=path.join(root,'sources');fs.mkdirSync(nas);const bytes=fs.readFileSync(new URL('./fixture.mp4',import.meta.url));const files=['one.mp4','two.mp4'].map(name=>path.join(nas,name));fs.writeFileSync(files[0],bytes);fs.writeFileSync(files[1],'invalid');
 const store=createWorkspaceStore(root),workspaceId=store.active().id,storage=createStorageService(root,store),tasks=createTaskStore(root),intake=createIntakeTasks({root,workspaceStore:store,storage,tasks});
 const request={items:files.map((file,index)=>({path:file,title:'Video '+index})),text:'A-roll: "'+nas+'"',format:'9:16',idempotencyKey:'intake-fixture'};
 const job=intake.enqueue(workspaceId,request);assert.equal(intake.enqueue(workspaceId,request).id,job.id);assert.throws(()=>intake.enqueue(workspaceId,{...request,format:'16:9'}),/chống lặp/);
 await until(()=>!intake.isRunning(job.id));const failed=tasks.get(job.id,workspaceId);assert.equal(failed.status,'failed');assert.equal(failed.checkpoint.completed.length,1);const first=failed.checkpoint.completed[0].dir;
 fs.writeFileSync(files[1],bytes);intake.resume(job.id,workspaceId);await until(()=>!intake.isRunning(job.id));const done=tasks.get(job.id,workspaceId);assert.equal(done.status,'succeeded');assert.equal(done.result.items.length,2);assert.equal(done.result.items[0].dir,first);assert.notEqual(done.result.items[0].dir,done.result.items[1].dir);
 for(const item of done.result.items){const project=JSON.parse(fs.readFileSync(path.join(root,item.dir,'project.json')));assert.equal(project.contentos.intakeBatch.taskId,job.id);assert.equal(project.segments.length,1);assert.ok(fs.existsSync(path.join(root,item.dir,'index.html')));assert.deepEqual(fs.readFileSync(path.join(root,item.dir,project.source.video)),bytes);}
 assert.throws(()=>intake.enqueue('foreign',request),/Workspace/);assert.throws(()=>intake.enqueue(workspaceId,{...request,idempotencyKey:'duplicate',items:[request.items[0],request.items[0]]}),/khác nhau/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('intake cancellation blocks publication and leaves current item outside completed results',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-intake-cancel-'));
 try{const store=createWorkspaceStore(root),workspaceId=store.active().id,tasks=createTaskStore(root);let release,entered=false;
 const intake=createIntakeTasks({root,workspaceStore:store,tasks,create:async(_root,_store,_storage,options)=>{entered=true;await new Promise(r=>release=r);options.validate();throw new Error('must not publish');}});
 const job=intake.enqueue(workspaceId,{items:[{path:'fixture.mp4',title:'Video'}],text:'fixture',format:'9:16',idempotencyKey:'cancel'});await until(()=>entered);intake.cancel(job.id,workspaceId);release();await until(()=>!intake.isRunning(job.id));assert.equal(tasks.get(job.id,workspaceId).status,'cancelled');assert.deepEqual(tasks.get(job.id,workspaceId).checkpoint,null);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
