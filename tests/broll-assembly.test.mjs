import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {planBrollAssembly} from '../editor/lib/broll-assembly.js';import {inspectBrollMedia} from '../src/services/broll-media.mjs';import {resolveTimeline} from '../editor/lib/build.mjs';
test('B-roll placement covers output with explicit order/repeat, bounds video length and preserves existing edits',()=>{
 const project={segments:[{in:0,out:4},{in:8,out:16,speed:2}],brolls:[]},assets=[{src:'inputs/a.mp4',kind:'video',duration:2},{src:'inputs/b.png',kind:'image'}];
 const plan=planBrollAssembly(project,assets,{shotSeconds:3,repeat:true});assert.equal(plan.total,8);assert.equal(plan.uncovered,0);assert.deepEqual(plan.clips.map(c=>c.src),['inputs/a.mp4','inputs/b.png','inputs/a.mp4','inputs/b.png']);assert.equal(plan.clips[2].at,10);assert.equal(plan.clips[0].dur,2);assert.ok(plan.clips.every(c=>c.audioVol===0&&c.mode==='full'));assert.deepEqual(project.brolls,[]);
 const partial=planBrollAssembly(project,assets,{shotSeconds:3});assert.equal(partial.covered,5);assert.equal(partial.uncovered,3);
 assert.throws(()=>planBrollAssembly({...project,brolls:[{src:'existing'}]},assets),/Đã có/);assert.throws(()=>planBrollAssembly(project,[assets[0],assets[0]]),/lặp/);assert.throws(()=>planBrollAssembly(project,assets,{shotSeconds:0}),/1 đến 30/);
 const built=resolveTimeline({...project,source:{video:'inputs/base.mp4',duration:16},brolls:plan.clips});assert.equal(built.brolls[2].start,5);assert.equal(built.brolls.at(-1).start+built.brolls.at(-1).dur,8);
});
test('B-roll inspection uses only declared contained project media and probes actual duration',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-broll-'));try{
  fs.mkdirSync(path.join(root,'inputs'));fs.copyFileSync(new URL('./fixture.mp4',import.meta.url),path.join(root,'inputs/shot.mp4'));
  const [asset]=await inspectBrollMedia(root,['inputs/shot.mp4'],['inputs/shot.mp4']);assert.equal(asset.kind,'video');assert.ok(asset.duration>0);assert.ok(asset.width>0);
  await assert.rejects(inspectBrollMedia(root,['../outside.mp4'],['../outside.mp4']));await assert.rejects(inspectBrollMedia(root,['inputs/shot.mp4'],[]));
  let checks=0;await assert.rejects(inspectBrollMedia(root,['inputs/shot.mp4'],['inputs/shot.mp4'],{validate:()=>{if(++checks>2)throw new Error('changed');}}),/changed/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
