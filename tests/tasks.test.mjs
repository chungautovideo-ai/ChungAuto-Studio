import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createTaskStore} from '../src/services/tasks.mjs';

test('durable queue: immutable input, dedup, exclusive claim, checkpoint and restart recovery',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-task-'));let time=1000;
  try{
    let queue=createTaskStore(root,{now:()=>time});
    const input={workspaceId:'one',project:'project-a',revision:'r1',snapshot:{title:'original'},instruction:'Edit',idempotencyKey:'request-1'};
    const task=queue.enqueue(input);input.snapshot.title='changed';
    assert.equal(queue.get(task.id,'one').snapshot.title,'original');
    assert.throws(()=>queue.enqueue(input),/yêu cầu khác/);
    input.snapshot.title='original';assert.equal(queue.enqueue(input).id,task.id);
    assert.deepEqual(queue.list('two'),[]);assert.throws(()=>queue.get(task.id,'two'),/Không tìm/);
    const claim=queue.claim(task.id,'one','worker-1');
    assert.equal(claim.task.leaseToken,undefined);assert.throws(()=>queue.claim(task.id,'one','worker-2'));
    queue.heartbeat(task.id,'one',claim.leaseToken,{step:'analyzed'});
    queue=createTaskStore(root,{now:()=>time});assert.equal(queue.get(task.id,'one').status,'running');
    time+=61000;assert.equal(queue.get(task.id,'one').status,'interrupted');
    assert.throws(()=>queue.finish(task.id,'one',claim.leaseToken));
    assert.equal(queue.get(task.id,'one').checkpoint.step,'analyzed');
    queue.retry(task.id,'one');const fresh=queue.claim(task.id,'one','worker-2');
    assert.notEqual(fresh.leaseToken,claim.leaseToken);
    queue.cancel(task.id,'one');assert.throws(()=>queue.finish(task.id,'one',fresh.leaseToken));
    queue.retry(task.id,'one');const last=queue.claim(task.id,'one','worker-3');
    assert.equal(queue.finish(task.id,'one',last.leaseToken,{result:{artifact:'draft.json'}}).status,'succeeded');
    assert.throws(()=>queue.retry(task.id,'one'));assert.equal(queue.get(task.id,'one').attempt,3);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
