import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import test from 'node:test';import assert from 'node:assert/strict';
import {createTaskStore} from '../src/services/tasks.mjs';import {createNewsService} from '../src/services/news.mjs';import {createNewsTasks} from '../src/services/news-tasks.mjs';
test('news API task persists one request, cancels and reconciles saved draft after restart without replay',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-news-tasks-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const tasks=createTaskStore(root),news=createNewsService(root),connections={status:()=>({baseUrl:'https://example.com/v1',model:'fixture'})};
 const source=news.save('one',{title:'Tin',script:'Nháp',sources:[{url:'https://example.com/news',excerpt:'Nguồn.'}]});let release,calls=0;
 const worker=createNewsTasks({tasks,news,connections,draft:async(workspace,{taskId,signal,validate})=>{calls++;await new Promise(resolve=>release=resolve);signal.throwIfAborted();validate();return news.save(workspace,{...source.payload,parentId:source.id},{taskId});}});
 const body={id:source.id,instruction:'60 giây',idempotencyKey:'request-one'},task=worker.enqueue('one',body);
 assert.equal(worker.enqueue('one',body).id,task.id);await new Promise(resolve=>setImmediate(resolve));assert.equal(calls,1);
 assert.throws(()=>worker.enqueue('one',{...body,idempotencyKey:'other'}),/đang soạn/);
 release();for(let i=0;i<20&&tasks.get(task.id,'one').status==='running';i++)await new Promise(resolve=>setTimeout(resolve,5));assert.equal(tasks.get(task.id,'one').status,'succeeded');
 assert.equal(worker.enqueue('one',body).id,task.id);assert.equal(calls,1);
 const latest=news.list('one').entries.at(-1),cancelled=worker.enqueue('one',{...body,id:latest.id,idempotencyKey:'cancel'});await new Promise(resolve=>setImmediate(resolve));worker.cancel(cancelled.id,'one');release();await new Promise(resolve=>setImmediate(resolve));assert.equal(tasks.get(cancelled.id,'one').status,'cancelled');assert.equal(news.list('one').entries.length,2);
 const orphan=tasks.enqueue({workspaceId:'one',project:'news:source',revision:'hash',snapshot:{id:latest.id},instruction:'Draft',kind:'news-draft',idempotencyKey:'orphan'});tasks.claim(orphan.id,'one','old-process');
 createNewsTasks({tasks,news,connections,draft:()=>{throw new Error('must not replay');}});assert.equal(tasks.get(orphan.id,'one').status,'interrupted');
 const committed=tasks.enqueue({workspaceId:'one',project:'news:source',revision:'hash',snapshot:{id:latest.id},instruction:'Draft',kind:'news-draft',idempotencyKey:'committed'});tasks.claim(committed.id,'one','old-process');const saved=news.save('one',{...latest.payload,parentId:latest.id},{taskId:committed.id});
 createNewsTasks({tasks,news,connections,draft:()=>{throw new Error('must not replay');}});assert.equal(tasks.get(committed.id,'one').status,'succeeded');assert.equal(tasks.get(committed.id,'one').result.entryId,saved.id);
});
