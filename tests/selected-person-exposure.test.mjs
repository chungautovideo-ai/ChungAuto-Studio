import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import test from 'node:test';import assert from 'node:assert/strict';
import {measureSelectedPersonExposure,selectedSemanticMask} from '../src/services/selected-person-exposure.mjs';
test('selected-person measurement excludes the brighter unselected half, unused ranges and gaps without writes',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'selected-exposure-'));
 try{
  fs.mkdirSync(path.join(dir,'inputs'));fs.mkdirSync(path.join(dir,'work'));const file=path.join(dir,'inputs/a.mp4');fs.writeFileSync(file,'fixture');const stat=fs.statSync(file),sha=crypto.createHash('sha256').update('fixture').digest('hex');
  const runs=[];for(let y=0;y<8;y++)runs.push(4,1,4,0);
  const selection={src:'inputs/a.mp4',sha256:sha,method:'sam2.1-tiny-point-prompt',from:1,fps:8,w:8,h:8,f:Array.from({length:16},()=>runs)};
  const project={source:{video:'inputs/a.mp4'},segments:[{id:'a',in:1,out:2,keep:true}],camera:{beauty:{personSelections:[selection]}}};
  const track={src:'inputs/a.mp4',fingerprint:{size:stat.size,mtimeMs:stat.mtimeMs,sha256:sha},fps:8,idx:[1],f:Array(32).fill(null),skin:{w:8,h:8,f:Array.from({length:32},()=>[64,2])}};
  fs.writeFileSync(path.join(dir,'work/face.json'),JSON.stringify({v:2,tracks:[track]}));const before=fs.readFileSync(path.join(dir,'work/face.json')),projectBefore=JSON.stringify(project),times=[];
  const decode=async(_file,time,w,h)=>{times.push(time);const rgba=new Uint8Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;rgba[i]=rgba[i+1]=rgba[i+2]=x<4?30:230;rgba[i+3]=255;}return rgba;};
  const result=await measureSelectedPersonExposure(dir,project,{src:track.src,sha256:sha},{decode});assert.ok(result.exposure.person.median<.13);assert.equal(result.suggestion.personLight,30);assert.ok(times.every(t=>t>=1&&t<2));assert.ok(times.length>=3&&times.length<=8);assert.equal(new Set(times.map(t=>Math.floor(t*8))).size,times.length);assert.equal(JSON.stringify(project),projectBefore);assert.deepEqual(fs.readFileSync(path.join(dir,'work/face.json')),before);
  const empty=selectedSemanticMask(track,[selection],0);assert.deepEqual(empty.runs,[64,0]);
  await assert.rejects(measureSelectedPersonExposure(dir,project,{src:track.src,sha256:'b'.repeat(64)},{decode}),/khớp/);
  const controller=new AbortController();controller.abort();await assert.rejects(measureSelectedPersonExposure(dir,project,{src:track.src,sha256:sha},{decode,signal:controller.signal}),{name:'AbortError'});
  const short=structuredClone(project);short.segments=[{id:'short',in:1,out:1.01,keep:true}];const few=await measureSelectedPersonExposure(dir,short,{src:track.src,sha256:sha},{decode});assert.equal(few.times.length,1);assert.equal(few.suggestion.available,false);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
