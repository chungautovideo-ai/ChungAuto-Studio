import test from 'node:test';import assert from 'node:assert/strict';
import {importSourceSelection} from '../editor/ui/contentos-source-batch.js';
test('multi-source intake serializes existing imports, preserves per-file failure and stops uncertain replay',async()=>{
 const calls=[],reported=[];let inFlight=0;
 const result=await importSourceSelection({paths:['a','bad','duplicate'],dir:'project',workspaceId:'scope',request:async(_url,options)=>{
  assert.equal(++inFlight,1);const body=JSON.parse(options.body);calls.push(body);await new Promise(r=>setTimeout(r,5));inFlight--;
  return body.relative==='bad'?Response.json({error:'missing'},{status:400}):Response.json({duplicate:body.relative==='duplicate',asset:{path:body.relative}});
 },onResult:r=>reported.push(r.status)});
 assert.deepEqual(reported,['imported','error','duplicate']);assert.deepEqual(result.pending,[]);assert.ok(calls.every(c=>c.workspaceId==='scope'&&c.dir==='project'));
 const uncertain=await importSourceSelection({paths:['a','b'],dir:'project',request:async()=>{throw new Error('lost');}});
 assert.equal(uncertain.results[0].status,'uncertain');assert.deepEqual(uncertain.pending,['b']);
 let stop=false;const cancelled=await importSourceSelection({paths:['a','b'],dir:'project',request:async()=>Response.json({asset:{}}),onResult:()=>{stop=true;},shouldStop:()=>stop});assert.deepEqual(cancelled.pending,['b']);
 await assert.rejects(importSourceSelection({paths:['a','a'],dir:'p'}));await assert.rejects(importSourceSelection({paths:['a'],dir:'__new__'}));
});
