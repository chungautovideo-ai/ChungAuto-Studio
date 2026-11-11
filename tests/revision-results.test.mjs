import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {prepareRevisionResult,applyRevisionResult} from '../src/services/revision-results.mjs';
test('isolated AI candidates apply once and preserve newer manual edits on conflict',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-result-'));
 try{
  const project=path.join(root,'project'),job=path.join(root,'job');fs.mkdirSync(project);
  const file=path.join(project,'project.json'),original={source:{file:'inputs/test.mp4'},title:'original',workspaceId:'one'};
  fs.writeFileSync(file,JSON.stringify(original));
  const {baseRevision}=prepareRevisionResult(project,job);
  const candidate=path.join(job,'work','candidate-project.json');
  fs.writeFileSync(candidate,JSON.stringify({...original,title:'AI'}));
  assert.equal(JSON.parse(fs.readFileSync(file)).title,'original');
  assert.throws(()=>applyRevisionResult(project,job,baseRevision,{build:()=>{throw new Error('Invalid composition');}}),/Invalid composition/);
  assert.equal(JSON.parse(fs.readFileSync(file)).title,'original');
  fs.writeFileSync(file,JSON.stringify({...original,title:'manual'}));
  assert.throws(()=>applyRevisionResult(project,job,baseRevision),/thay đổi/);
  assert.equal(JSON.parse(fs.readFileSync(file)).title,'manual');
  assert.equal(JSON.parse(fs.readFileSync(candidate)).title,'AI');
  const fresh=prepareRevisionResult(project,path.join(root,'second'));
  const result=applyRevisionResult(project,path.join(root,'second'),fresh.baseRevision);
  assert.equal(result.project.title,'manual');
  assert.throws(()=>applyRevisionResult(project,path.join(root,'second'),fresh.baseRevision));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('AI candidate with captions enabled but no lines gets lines from transcript',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-result-'));
 try{
  const project=path.join(root,'project'),job=path.join(root,'job');fs.mkdirSync(path.join(project,'work'),{recursive:true});
  fs.writeFileSync(path.join(project,'project.json'),JSON.stringify({source:{video:'inputs/raw.mp4'}}));
  fs.writeFileSync(path.join(project,'work','transcript.json'),JSON.stringify({words:[{word:'Xin',start:0,end:0.3},{word:'chào.',start:0.3,end:0.6},{word:'Xe',start:0.7,end:1}]}));
  const {baseRevision}=prepareRevisionResult(project,job);
  fs.writeFileSync(path.join(job,'work','candidate-project.json'),JSON.stringify({source:{video:'inputs/raw.mp4'},captions:{enabled:true,maxWords:4}}));
  const result=applyRevisionResult(project,job,baseRevision);
  assert.deepEqual(result.project.captions.lines.map(l=>l.words.map(w=>w.w).join(' ')),['Xin chào.','Xe']);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
