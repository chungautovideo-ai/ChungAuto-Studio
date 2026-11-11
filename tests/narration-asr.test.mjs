import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {narrationCaptionWords} from '../editor/lib/narration-captions.js';import {recognizeNarration} from '../src/services/narration-asr.mjs';
test('voice words respect trim, output placement/cuts/speed and never replace project cuts',()=>{
 const project={segments:[{in:0,out:2},{in:8,out:16,speed:2}]},clip={id:'v1',src:'inputs/voice.mp3',at:1,from:1,dur:2,sourceDuration:5};
 const before=JSON.stringify(project),words=narrationCaptionWords(project,clip,[{word:'Bỏ',start:0,end:0.5},{word:'Một',start:1,end:1.5},{word:'Hai',start:2,end:2.5},{word:'Cắt',start:3,end:4}]);
 assert.deepEqual(words,[{w:'Một',s:1,e:1.5},{w:'Hai',s:2,e:9}]);assert.equal(JSON.stringify(project),before);
 assert.throws(()=>narrationCaptionWords(project,{...clip,hidden:true},[]));assert.throws(()=>narrationCaptionWords(project,clip,[{word:'x',start:1,end:0}]));assert.throws(()=>narrationCaptionWords(project,{...clip,sourceDuration:NaN},[]));
});
test('voice ASR uses project audio in isolated artifacts, validates context/audio and preserves project/transcript',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-voice-asr-'));try{
  fs.mkdirSync(path.join(dir,'inputs'));fs.mkdirSync(path.join(dir,'work'));const audio=path.join(dir,'inputs/voice.mp3');fs.writeFileSync(audio,'synthetic placeholder');
  const project={audio:{clips:[{id:'v1',src:'inputs/voice.mp3'}]}},pj=JSON.stringify(project);fs.writeFileSync(path.join(dir,'project.json'),pj);fs.writeFileSync(path.join(dir,'work/transcript.json'),'original transcript');
  const recognizer=async(root,file,out,options)=>{assert.equal(file,audio);assert.equal(options.language,'vi');assert.ok(options.timeoutMs>0);return {engine:'fixture',words:[{word:'Xin',start:0,end:1}]};};
  const result=await recognizeNarration(dir,dir,'v1',{recognizer});assert.equal(result.words[0].word,'Xin');assert.ok(fs.existsSync(path.join(dir,'work/narration-asr',result.id,'result.json')));assert.equal(fs.readFileSync(path.join(dir,'project.json'),'utf8'),pj);assert.equal(fs.readFileSync(path.join(dir,'work/transcript.json'),'utf8'),'original transcript');
  let checks=0;await assert.rejects(recognizeNarration(dir,dir,'v1',{recognizer,validate:()=>{if(++checks>1)throw new Error('stale');}}),/stale/);
  await assert.rejects(recognizeNarration(dir,dir,'v1',{recognizer:async()=>{fs.appendFileSync(audio,'changed');return {words:[]};}}),/đổi/);
  assert.equal(fs.readdirSync(path.join(dir,'work/narration-asr')).length,1);await assert.rejects(recognizeNarration(dir,dir,'unknown',{recognizer}));
  const controller=new AbortController();
  await assert.rejects(recognizeNarration(dir,dir,'v1',{signal:controller.signal,recognizer:async(root,file,out,options)=>{options.onProgress({pct:5,phase:'fixture'});controller.abort();return {words:[]};}}),/abort/i);
  assert.equal(fs.readdirSync(path.join(dir,'work/narration-asr')).length,1);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
