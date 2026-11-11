import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {ensureEncodedAudioHeadroom} from '../src/services/encoded-audio-headroom.mjs';
test('only measured AAC overshoot triggers attenuation and records actual final measurement',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'headroom-')),file=path.join(dir,'video.mp4');fs.writeFileSync(file,'before');
 try{
  let encodes=0;
  const result=ensureEncodedAudioHeadroom(file,{silent:false,truePeakDbtp:-1.29},{encode:(_bin,args)=>{encodes++;assert.equal(args[args.indexOf('-af')+1],'volume=-0.4100dB');fs.writeFileSync(args.at(-1),'after');},measure:()=>({silent:false,truePeakDbtp:-1.68,warnings:[],listened:false})});
  assert.equal(encodes,1);assert.equal(result.measurement.truePeakDbtp,-1.68);assert.equal(result.correction.attempts.length,1);assert.equal(fs.readFileSync(file,'utf8'),'after');
  for(const measurement of [{silent:true,truePeakDbtp:null},{silent:false,truePeakDbtp:-1.5},{silent:false,truePeakDbtp:-3}])ensureEncodedAudioHeadroom(file,measurement,{encode:()=>assert.fail('unexpected encode')});
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('failed measurement never replaces prior bytes and correction is bounded',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'headroom-')),file=path.join(dir,'video.mp4');fs.writeFileSync(file,'keep');
 try{
  assert.throws(()=>ensureEncodedAudioHeadroom(file,{truePeakDbtp:-1},{encode:(_b,args)=>fs.writeFileSync(args.at(-1),'bad'),measure:()=>{throw Error('measurement failed');}}),/measurement failed/);
  assert.equal(fs.readFileSync(file,'utf8'),'keep');assert.equal(fs.existsSync(file+'.headroom.mp4'),false);
  let count=0;const result=ensureEncodedAudioHeadroom(file,{truePeakDbtp:0},{encode:(_b,args)=>fs.writeFileSync(args.at(-1),'test'),measure:()=>({truePeakDbtp:-.1*++count})});
  assert.equal(count,2);assert.equal(result.correction.attempts.length,2);assert.equal(result.measurement.truePeakDbtp,-.2);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
