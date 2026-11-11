import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {timelineSourceCache} from '../src/services/timeline-source-cache.mjs';
test('timeline caches distinguish same-time sources, extract actual pictures/audio, reject foreign files and stale context',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-source-cache-'));
 try{
  for(const [name,color,audio] of [['a','blue',true],['b','red',false]]){const args=['-v','error','-f','lavfi','-i',`color=c=${color}:s=160x90:r=30:d=1`];if(audio)args.push('-f','lavfi','-i','sine=frequency=220:duration=1');args.push('-c:v','libx264','-pix_fmt','yuv420p',path.join(dir,name+'.mp4'));execFileSync('ffmpeg',args,{windowsHide:true});fs.utimesSync(path.join(dir,name+'.mp4'),new Date(100000),new Date(100000));}
  const p={segments:[{src:'a.mp4'},{src:'b.mp4'}]};
  const a=await timelineSourceCache(dir,p,'a.mp4'),b=await timelineSourceCache(dir,p,'b.mp4');
  assert.notEqual(a.strip.url,b.strip.url);assert.ok(a.wave.peaks.some(x=>x>0));assert.equal(b.wave.hasAudio,false);assert.deepEqual(b.wave.peaks,[]);assert.equal(a.strip.tw,54);assert.ok(a.duration>.9);
  await assert.rejects(timelineSourceCache(dir,p,'unknown.mp4'));
  await assert.rejects(timelineSourceCache(dir,{segments:[{src:'../escape.mp4'}]},'../escape.mp4'));
  await assert.rejects(timelineSourceCache(dir,p,'a.mp4',{validate:()=>{throw new Error('stale');}}),/stale/);
  const files=fs.readdirSync(path.join(dir,'.editor-cache'));assert.equal(files.length,2);assert.ok(files.every(f=>f.endsWith('.jpg')));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
