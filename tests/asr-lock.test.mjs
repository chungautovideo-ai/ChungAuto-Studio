import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawn} from 'node:child_process';
import {waitForAsrLock,asrLockStatus} from '../src/services/asr-lock.mjs';
import {acquireRenderLock} from '../src/services/render-lock.mjs';
test('ASR serializes real processes independently of render, supports abort/revision guard and refuses dead owners',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-asr-lock-'));let child;
 try{
 const lock=await waitForAsrLock(root);assert.equal(asrLockStatus(root).ownerAlive,true);
 const render=acquireRenderLock(root,{projectDir:root,kind:'fixture'});render.release();
 const controller=new AbortController(),cancelled=waitForAsrLock(root,{signal:controller.signal,pollMs:5});controller.abort();await assert.rejects(cancelled);
 let valid=true;const stale=waitForAsrLock(root,{pollMs:5,validate:()=>{if(!valid)throw new Error('changed');}});valid=false;await assert.rejects(stale,/changed/);
 await assert.rejects(waitForAsrLock(root,{pollMs:5,timeoutMs:10}),{code:'ASR_WAIT_TIMEOUT'});
 const url=new URL('../src/services/asr-lock.mjs',import.meta.url).href;
 child=spawn(process.execPath,['--input-type=module','-e',`import fs from 'node:fs';import {waitForAsrLock} from ${JSON.stringify(url)};const root=process.argv[1];const lock=await waitForAsrLock(root,{pollMs:10,onWait:()=>fs.writeFileSync(root+'/waiting','yes')});fs.writeFileSync(root+'/acquired','yes');lock.release();`,root],{windowsHide:true,stdio:'pipe'});
 const completion=new Promise((ok,no)=>{child.once('error',no);child.once('close',code=>code===0?ok():no(new Error('child exit '+code)));});
 for(let i=0;i<100&&!fs.existsSync(path.join(root,'waiting'));i++)await new Promise(r=>setTimeout(r,10));
 assert.ok(fs.existsSync(path.join(root,'waiting')));assert.equal(fs.existsSync(path.join(root,'acquired')),false);lock.release();await completion;assert.ok(fs.existsSync(path.join(root,'acquired')));assert.equal(asrLockStatus(root),null);
 const folder=path.join(root,'workspace/contentos/asr-lock');fs.mkdirSync(folder);fs.writeFileSync(path.join(folder,'owner.json'),JSON.stringify({id:'dead',pid:2147483647}));await assert.rejects(waitForAsrLock(root),{code:'ASR_OWNER_UNVERIFIED'});assert.equal(asrLockStatus(root).id,'dead');
 }finally{child?.kill();fs.rmSync(root,{recursive:true,force:true});}
});
