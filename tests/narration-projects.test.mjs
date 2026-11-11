import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {createWorkspaceStore} from '../src/services/workspaces.mjs';import {createStorageService} from '../src/services/storage.mjs';import {createNewsService} from '../src/services/news.mjs';import {createNarrationProject} from '../src/services/narration-projects.mjs';
test('approved narration creates an editable voice-length VEK project without original footage, with guarded script/audio and clean failures',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-narration-'));try{
  const store=createWorkspaceStore(root),workspaceId=store.active().id,storage=createStorageService(root,store),news=createNewsService(root);
  const story=news.save(workspaceId,{title:'Tin thử nghiệm',script:'Lời đọc đã duyệt.',sources:[{url:'https://example.com',excerpt:'Nguồn thử.'}],approved:true});
  const voiceId='bbbbbbbbbbbb',folder=path.join(root,'workspace/contentos/voice',workspaceId,'ket-qua');fs.mkdirSync(folder,{recursive:true});const audio=path.join(folder,voiceId+'.mp3');execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=440:duration=0.8',audio],{windowsHide:true});
  const bytes=fs.readFileSync(audio),textHash=crypto.createHash('sha256').update(story.payload.script).digest('hex');const metadata={id:voiceId,workspaceId,duration:999,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),textHash,narration:{workspaceId,scriptId:story.id,scriptHash:story.hash,version:story.version,textHash}};
  const metaFile=path.join(folder,voiceId+'.json');fs.writeFileSync(metaFile,JSON.stringify(metadata));
  for(const format of ['9:16','16:9']){
   const result=await createNarrationProject(root,store,storage,news,{workspaceId,newsBriefId:story.id,voiceId,format}),dir=path.join(root,result.dir),project=JSON.parse(fs.readFileSync(path.join(dir,'project.json')));
   assert.ok(project.source.duration<1);assert.equal(project.source.hasAudio,false);assert.equal(project.format,format);assert.equal(project.audio.clips[0].voiceSource.status,'match');assert.equal(project.audio.clips[0].at,0);assert.equal(project.contentos.visualsPending,true);assert.equal(news.projectBrief(workspaceId,result.dir).id,story.id);assert.ok(fs.existsSync(path.join(dir,'index.html')));assert.deepEqual(fs.readFileSync(path.join(dir,project.audio.clips[0].src)),bytes);
   const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',path.join(dir,project.source.video)],{encoding:'utf8',windowsHide:true}));assert.equal(probe.streams[0].width,format==='16:9'?1920:1080);assert.ok(Math.abs(Number(probe.format.duration)-project.source.duration)<0.04);assert.ok(project.source.duration>=project.audio.clips[0].sourceDuration);
  }
  for(const overrides of [{workspaceId:'other'},{format:'square'},{newsBriefId:'unknown'}])await assert.rejects(createNarrationProject(root,store,storage,news,{workspaceId,newsBriefId:story.id,voiceId,format:'9:16',...overrides}));
  const next=news.save(workspaceId,{parentId:story.id,title:'Khác',script:'Lời khác.',sources:story.payload.sources,approved:true});await assert.rejects(createNarrationProject(root,store,storage,news,{workspaceId,newsBriefId:next.id,voiceId,format:'9:16'}),/khớp/);
  fs.appendFileSync(audio,'changed');await assert.rejects(createNarrationProject(root,store,storage,news,{workspaceId,newsBriefId:story.id,voiceId,format:'9:16'}),/đổi/);assert.deepEqual(fs.readdirSync(path.join(root,'workspace/content/_intake')),[]);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
