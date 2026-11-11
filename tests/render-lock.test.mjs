import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';import {acquireRenderLock,renderLockStatus} from '../src/services/render-lock.mjs';
import {waitForRenderLock} from '../src/services/render-lock.mjs';
import {renderEnvironment} from '../src/services/render-environment.mjs';
test('render lock excludes another process across projects and keeps uncertain/orphaned ownership blocked',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-render-lock-'));
 try{
  const lock=acquireRenderLock(root,{projectDir:root,kind:'test'});assert.equal(renderLockStatus(root).ownerAlive,true);lock.child(process.pid);assert.equal(renderLockStatus(root).childPid,process.pid);
  const moduleUrl=new URL('../src/services/render-lock.mjs',import.meta.url).href;
  const child=spawnSync(process.execPath,['--input-type=module','-e',`import {acquireRenderLock} from ${JSON.stringify(moduleUrl)};try{acquireRenderLock(process.argv[1],{projectDir:process.argv[1],kind:'other'});process.exit(2);}catch(error){process.exit(error.code==='RENDER_BUSY'?0:3);}`,root],{windowsHide:true});assert.equal(child.status,0);
  lock.release();lock.release();assert.equal(renderLockStatus(root),null);
  const orphanDir=path.join(root,'workspace/contentos/render-lock');fs.mkdirSync(orphanDir);assert.throws(()=>acquireRenderLock(root,{projectDir:root,kind:'test'}),{code:'RENDER_BUSY'});
  fs.writeFileSync(path.join(orphanDir,'owner.json'),JSON.stringify({id:'orphan',pid:2147483647}));assert.equal(renderLockStatus(root).ownerAlive,false);assert.throws(()=>acquireRenderLock(root,{projectDir:root,kind:'test'}),{code:'RENDER_BUSY'});
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('shared render wait admits next owner, validates revision while waiting and never steals dead locks',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-render-wait-'));
 try{
  const first=acquireRenderLock(root,{projectDir:root,kind:'fixture'});let notified=0,acquired=false;
  const waiting=waitForRenderLock(root,{projectDir:root,kind:'next'},{pollMs:10,onWait:()=>notified++}).then(lock=>{acquired=true;return lock;});
  await new Promise(r=>setTimeout(r,25));assert.equal(acquired,false);assert.equal(notified,1);first.release();const next=await waiting;assert.equal(renderLockStatus(root).kind,'next');
  const controller=new AbortController();const aborted=waitForRenderLock(root,{projectDir:root,kind:'abort'},{pollMs:10,signal:controller.signal});controller.abort();await assert.rejects(aborted);
  let valid=true;const stale=waitForRenderLock(root,{projectDir:root,kind:'stale'},{pollMs:10,validate:()=>{if(!valid)throw new Error('revision changed');}});valid=false;await assert.rejects(stale,/revision changed/);
  await assert.rejects(waitForRenderLock(root,{projectDir:root,kind:'timeout'},{pollMs:10,timeoutMs:15}),{code:'RENDER_WAIT_TIMEOUT'});next.release();
  const folder=path.join(root,'workspace/contentos/render-lock');fs.mkdirSync(folder);fs.writeFileSync(path.join(folder,'owner.json'),JSON.stringify({id:'dead',pid:2147483647}));await assert.rejects(waitForRenderLock(root,{projectDir:root,kind:'blocked'}),{code:'RENDER_OWNER_UNVERIFIED'});assert.equal(renderLockStatus(root).id,'dead');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('render subprocess scratch stays on installation disk without mutating parent environment',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-render-env-'));try{const original={TEMP:'system',PATH:'tools'},env=renderEnvironment(root,original);assert.equal(env.TEMP,path.join(root,'workspace/cache/render-temp'));assert.equal(env.TMP,env.TEMP);assert.equal(env.TMPDIR,env.TEMP);assert.equal(env.PATH,'tools');assert.equal(original.TEMP,'system');assert.ok(fs.statSync(env.TEMP).isDirectory());}finally{fs.rmSync(root,{recursive:true,force:true});}
});
