import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {personTrackingStatus,trackPersonSelection} from '../src/services/person-tracking.mjs';
test('tracker lock status distinguishes idle, live and malformed ownership without deleting locks',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'person-status-'));const logs=path.join(root,'workspace/logs');fs.mkdirSync(logs,{recursive:true});const lock=path.join(logs,'person-tracking.lock');
 try{assert.equal(personTrackingStatus(root).state,'idle');fs.writeFileSync(lock,'bad');assert.equal(personTrackingStatus(root).state,'needs-attention');assert.ok(fs.existsSync(lock));fs.writeFileSync(lock,JSON.stringify({pid:process.pid,src:'inputs/test.mp4'}));assert.equal(personTrackingStatus(root).state,'running');fs.writeFileSync(lock,JSON.stringify({pid:0}));assert.equal(personTrackingStatus(root).state,'needs-attention');}finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('tracker rejects stale revision, abort and invalid ranges before reading media or acquiring resources',async()=>{
 await assert.rejects(trackPersonSelection('missing','missing',{}, {},{validate:()=>{throw new Error('stale revision');}}),/stale revision/);
 const controller=new AbortController();controller.abort();await assert.rejects(trackPersonSelection('missing','missing',{}, {},{signal:controller.signal}),/abort/i);
 const valid={src:'inputs/test.mp4',from:0,duration:1,fps:8,points:[[.5,.5,1]]};
 for(const change of [{duration:16},{fps:0},{duration:15,fps:15},{points:[[.5,.5,0]]},{points:[[2,.5,1]]},{from:-1}])await assert.rejects(trackPersonSelection('missing','missing',{}, {...valid,...change}),/hợp lệ/);
});
