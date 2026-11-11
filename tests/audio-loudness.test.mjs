import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {parseLoudnessOutput,measureAudioLoudness} from '../src/services/audio-loudness.mjs';
test('loudness parser uses input measurements and represents silence explicitly',()=>{
 const report={input_i:'-14.75',input_tp:'-1.27',input_lra:'5.00',input_thresh:'-24.96',output_i:'-13.98'};
 assert.equal(parseLoudnessOutput('log\n'+JSON.stringify(report)).integratedLufs,-14.75);
 assert.equal(parseLoudnessOutput(JSON.stringify({...report,input_i:'-inf',input_tp:'-inf',input_thresh:'-inf'})).silent,true);
 for(const value of ['',JSON.stringify({...report,input_i:'oops'}),JSON.stringify({...report,input_i:''}),JSON.stringify({...report,input_i:'-inf'})])assert.throws(()=>parseLoudnessOutput(value));
});
test('actual FFmpeg measures tone and silence without changing media and rejects absent audio',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'audio-loudness-'));
 try{
  for(const [name,filter] of [['tone','sine=frequency=440:duration=3'],['silence','anullsrc=r=48000:cl=mono:d=3']]){
   const file=path.join(root,name+'.wav');execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i',filter,file],{windowsHide:true});const before=fs.readFileSync(file),result=await measureAudioLoudness(file);assert.equal(result.readOnly,true);assert.equal(result.listened,false);assert.equal(result.silent,name==='silence');if(name==='tone'){assert.ok(result.integratedLufs<0);assert.ok(result.truePeakDbtp<0);}assert.deepEqual(fs.readFileSync(file),before);
  }
  const file=path.join(root,'no-audio.mp4');execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','color=s=64x64:d=0.2','-c:v','libx264',file],{windowsHide:true});await assert.rejects(measureAudioLoudness(file));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
