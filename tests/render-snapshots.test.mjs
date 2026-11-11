import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createRenderSnapshot} from '../src/services/render-snapshots.mjs';
test('render snapshots copy referenced media independently, pin revision, record remote dependencies and reject escapes/missing assets',async()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-snapshot-'));
 try{
  fs.mkdirSync(path.join(folder,'inputs'));fs.writeFileSync(path.join(folder,'inputs/source.mp4'),'synthetic bytes');fs.writeFileSync(path.join(folder,'inputs/unused.mp4'),'unused');
  const project={source:{video:'inputs/source.mp4',duration:1,width:360,height:640,hasAudio:false},segments:[{id:'s',in:0,out:1,keep:true}],audio:{autoSfx:false,sfxLevel:'tat'},captions:{lines:[]}};
  const file=path.join(folder,'project.json');fs.writeFileSync(file,JSON.stringify(project));
  const snapshot=await createRenderSnapshot(folder);assert.equal(snapshot.manifest.assets.length,1);assert.ok(snapshot.manifest.remoteDependencies.some(url=>url.includes('gsap')));
  fs.writeFileSync(path.join(folder,'inputs/source.mp4'),'changed');fs.writeFileSync(file,JSON.stringify({...project,title:'new'}));
  assert.equal(fs.readFileSync(path.join(snapshot.directory,'inputs/source.mp4'),'utf8'),'synthetic bytes');assert.equal(JSON.parse(fs.readFileSync(path.join(snapshot.directory,'project.json'),'utf8')).title,undefined);
  assert.equal(fs.existsSync(path.join(snapshot.directory,'inputs/unused.mp4')),false);
  await assert.rejects(createRenderSnapshot(folder,{revision:snapshot.manifest.revision}),/thay đổi/);
  fs.writeFileSync(file,JSON.stringify({...project,source:{...project.source,video:'../outside.mp4'}}));await assert.rejects(createRenderSnapshot(folder));
  fs.writeFileSync(file,JSON.stringify({...project,source:{...project.source,video:'inputs/missing.mp4'}}));await assert.rejects(createRenderSnapshot(folder));
  assert.equal(fs.readdirSync(path.join(folder,'work/render-snapshots')).length,1);
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
});
