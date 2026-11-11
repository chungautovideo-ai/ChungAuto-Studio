import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {pinScheduledVideo,resolveScheduledVideo} from '../src/services/scheduled-media.mjs';
test('scheduled media pins bytes, rejects replacement/missing file and binds pending schedule only to exact render job/revision',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-schedule-media-')),project='workspace/content/2026-11-04/test',folder=path.join(root,project,'renders');fs.mkdirSync(folder,{recursive:true});
 try{
  const file=path.join(folder,'first.mp4');fs.writeFileSync(file,Buffer.alloc(64,1));const pinned=await pinScheduledVideo(file),entry={project,scheduledMedia:pinned};assert.equal(await resolveScheduledVideo(root,entry),file);
  fs.writeFileSync(path.join(folder,'latest.mp4'),Buffer.alloc(64,9));assert.equal(await resolveScheduledVideo(root,entry),file);fs.writeFileSync(file,Buffer.alloc(64,2));await assert.rejects(resolveScheduledVideo(root,entry),/thay đổi/);fs.unlinkSync(file);await assert.rejects(resolveScheduledVideo(root,entry));
  const pending={project,scheduledMedia:{kind:'awaiting-render',renderJobDir:'work/job-a',revision:'rev-a'}};assert.equal(await resolveScheduledVideo(root,pending),null);
  const wrong=path.join(folder,'latest.mp4');fs.writeFileSync(wrong+'.json',JSON.stringify({ok:true,quality:'final',renderJobDir:'work/job-b',revision:'rev-a'}));assert.equal(await resolveScheduledVideo(root,pending),null);
  fs.writeFileSync(file,Buffer.alloc(64,3));fs.writeFileSync(file+'.json',JSON.stringify({ok:true,quality:'final',renderJobDir:'work/job-a',revision:'rev-old'}));assert.equal(await resolveScheduledVideo(root,pending),null);
  fs.writeFileSync(file+'.json',JSON.stringify({ok:true,quality:'final',renderJobDir:'work/job-a',revision:'rev-a',snapshotId:'snapshot-a'}));assert.equal(await resolveScheduledVideo(root,pending),file);assert.equal(pending.scheduledMedia.kind,'pinned');assert.equal(pending.scheduledMedia.snapshotId,'snapshot-a');
  fs.writeFileSync(wrong,Buffer.alloc(128,4));assert.equal(await resolveScheduledVideo(root,pending),file);
  const duplicate=path.join(folder,'copy.mp4');fs.writeFileSync(duplicate,Buffer.alloc(64,3));fs.copyFileSync(file+'.json',duplicate+'.json');await assert.rejects(resolveScheduledVideo(root,{project,scheduledMedia:{kind:'awaiting-render',renderJobDir:'work/job-a',revision:'rev-a'}}),/nhiều bản/);
 }finally{await fs.promises.rm(root,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});
