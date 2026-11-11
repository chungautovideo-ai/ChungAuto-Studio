import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createBackgroundDispatch} from '../src/services/background-dispatch.mjs';
test('background workers respect capacity, skip busy projects, and dispatch next without limiting sessions',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-dispatch-'));
 try{
  const running=new Set(),calls=[],errors=[];let tick;
  const q=createBackgroundDispatch(root,{activeCount:()=>running.size,schedule:fn=>{tick=fn;return {unref(){}};},onError:(id,e)=>errors.push([id,e.message])});
  const start=id=>()=>{calls.push(id);running.add(id);return {running:true};};
  assert.equal(q.enqueue('a',start('a')).running,true);q.enqueue('b',start('b'));assert.equal(q.enqueue('c',start('c')).queued,true);assert.deepEqual(calls,['a','b']);assert.equal(q.waitingReason('c'),'capacity');assert.equal(q.waitingReason('a'),null);
  q.enqueue('c',start('duplicate'));running.delete('a');tick();assert.deepEqual(calls,['a','b','c']);
  q.save({maxWorkers:1,paused:true});q.enqueue('d',start('d'));running.clear();tick();assert.equal(q.status().queued,1);assert.deepEqual(calls,['a','b','c']);assert.equal(q.waitingReason('d'),'paused');
  q.remove('d');let busy=true;q.enqueue('busy',()=>busy?{busy:true}:start('busy')());q.enqueue('free',start('free'));
  q.save({maxWorkers:1,paused:false});assert.deepEqual(calls,['a','b','c','free']);assert.equal(q.waitingReason('busy'),'project-busy');running.clear();busy=false;tick();assert.equal(running.has('busy'),true);assert.equal(q.waitingReason('busy'),null);
  running.clear();q.enqueue('error',()=>{throw new Error('fixture');});assert.deepEqual(errors,[['error','fixture']]);assert.equal(q.status().queued,0);
  assert.equal(createBackgroundDispatch(root).status().maxWorkers,1);assert.throws(()=>q.save({maxWorkers:0,paused:false}));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('pending metadata survives restart held for review; dispatched uncertainty never replays',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-dispatch-restart-'));
 try{
  const schedule=()=>({unref(){}});let count=2;
  const q=createBackgroundDispatch(root,{activeCount:()=>count,schedule});q.enqueue('waiting',()=>({running:true}),{dir:'project',hash:'hash'});
  const restarted=createBackgroundDispatch(root,{schedule});assert.equal(restarted.status().recoverable,1);assert.equal(restarted.waitingReason('waiting'),'recovery');let started=0;
  assert.equal(restarted.enqueue('waiting',()=>{started++;return {running:true};}).recoveryRequired,true);assert.equal(started,0);
  const entry=restarted.releaseRecovered('waiting');assert.equal(entry.metadata.hash,'hash');restarted.enqueue('waiting',()=>{started++;return {running:true};},entry.metadata);assert.equal(started,1);
  assert.equal(createBackgroundDispatch(root,{schedule}).status().recoverable,0);
  const uncertain=createBackgroundDispatch(root,{schedule,onError:()=>{}});uncertain.enqueue('uncertain',()=>{throw new Error('crash during dispatch');},{hash:'h'});
  const again=createBackgroundDispatch(root,{schedule});assert.equal(again.recoverable()[0].state,'dispatching');assert.throws(()=>again.releaseRecovered('uncertain'),/có thể đã bắt đầu/);
  assert.equal(again.enqueue('uncertain',()=>{throw new Error('must not launch');}).recoveryRequired,true);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
