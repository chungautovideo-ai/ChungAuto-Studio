import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {mapSourceTranscripts,transcribeProject} from '../src/services/project-transcription.mjs';
test('per-source words map to virtual source clock across speed, repeats, cuts and silent sources',()=>{
 const p={segments:[{src:'a',in:0,out:1,mediaStart:2,speed:2},{src:'b',in:1,out:2,mediaStart:0},{src:'a',in:2,out:3,mediaStart:2,keep:false}]};
 const result=mapSourceTranscripts(p,{a:{words:[{word:'Xe',start:1.9,end:2.3},{word:'đẹp',start:2.4,end:2.8}]},b:{words:[]}});
 assert.deepEqual(result.words.map(w=>[w.word,+w.start.toFixed(3),+w.end.toFixed(3)]),[['Xe',0,.3],['đẹp',.4,.8],['Xe',2,2.3],['đẹp',2.4,2.8]]);
 assert.equal(result.words[0].source.start,2);assert.equal(result.timeline,'segments');
 assert.throws(()=>mapSourceTranscripts({segments:[...p.segments,{src:'a',in:2.5,out:3.5,mediaStart:0}]},{}));
});
test('project ASR recognizes unique sources once, publishes atomically and retains old result on revision change',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-project-asr-'));try{
  fs.mkdirSync(path.join(dir,'work'));fs.writeFileSync(path.join(dir,'a.mp4'),'fixture');fs.writeFileSync(path.join(dir,'silent.mp4'),'fixture');
  const pj={source:{timeline:'segments'},segments:[{src:'a.mp4',in:0,out:1,mediaStart:0},{src:'silent.mp4',in:1,out:2,mediaStart:0},{src:'a.mp4',in:2,out:3,mediaStart:0}]},file=path.join(dir,'project.json');fs.writeFileSync(file,JSON.stringify(pj));let count=0;
  const probe=async file=>({kind:'video',duration:1,hasAudio:!file.endsWith('silent.mp4')});const recognize=async()=>{count++;return {language:'vi',words:[{word:'Xin',start:.1,end:.5}]};};
  const data=await transcribeProject('',dir,{probe,recognize});assert.equal(count,1);assert.equal(data.words.length,2);const original=fs.readFileSync(path.join(dir,'work/transcript.json'),'utf8');
  await assert.rejects(transcribeProject('',dir,{probe,recognize:async()=>{fs.writeFileSync(file,JSON.stringify({...pj,title:'changed'}));return {words:[]};}}),/đã đổi/);
  assert.equal(fs.readFileSync(path.join(dir,'work/transcript.json'),'utf8'),original);assert.deepEqual(fs.readdirSync(path.join(dir,'work')),['transcript.json']);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});


test('single-source ASR stages publication and preserves old transcript when source/project changes',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-single-asr-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));fs.mkdirSync(path.join(dir,'work'));const file=path.join(dir,'project.json');fs.writeFileSync(file,JSON.stringify({source:{video:'a.mp4'}}));fs.writeFileSync(path.join(dir,'a.mp4'),'fixture');const transcript=path.join(dir,'work/transcript.json');fs.writeFileSync(transcript,'old');
 await assert.rejects(transcribeProject('',dir,{recognize:async()=>{fs.appendFileSync(file,' ');return {words:[]};}}),/đã đổi/);assert.equal(fs.readFileSync(transcript,'utf8'),'old');assert.deepEqual(fs.readdirSync(path.join(dir,'work')),['transcript.json']);
 await assert.rejects(transcribeProject('',dir,{recognize:async()=>{fs.appendFileSync(path.join(dir,'a.mp4'),'changed');return {words:[]};}}),/nguồn đã thay đổi/);assert.equal(fs.readFileSync(transcript,'utf8'),'old');
});
