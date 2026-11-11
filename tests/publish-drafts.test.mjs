import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {publishDrafts} from '../src/services/publish-drafts.mjs';import {projectRevision} from '../src/services/project-revisions.mjs';
import {snapshotPublishDrafts,refreshPublishDraftReview} from '../src/services/publish-drafts.mjs';
test('publish drafts persist per channel with optimistic version, project revision, workspace and stale protection',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-publish-')),dir='workspace/content/2026-11-04/test',folder=path.join(root,dir);fs.mkdirSync(folder,{recursive:true});const file=path.join(folder,'project.json');fs.writeFileSync(file,JSON.stringify({workspaceId:'one',title:'Video'}));
 try{const service=publishDrafts(root,'one',dir),revision=projectRevision(file),entry={platform:'youtube',channelId:'channel-one',title:'Tiêu đề',caption:'Mô tả',hashtags:'#video',tags:'review',comment:'Bình luận nháp'};
  assert.equal(service.get().version,null);const saved=service.save({revision,expectedVersion:null,entries:[entry]});assert.equal(saved.entries[0].title,'Tiêu đề');assert.equal(saved.stale,false);assert.equal(publishDrafts(root,'one',dir).get().version,saved.version);
  assert.throws(()=>service.save({revision,expectedVersion:null,entries:[]}),/thay đổi/);assert.throws(()=>service.save({revision,expectedVersion:saved.version,entries:[entry,entry]}),/Trùng/);assert.throws(()=>publishDrafts(root,'two',dir),/workspace/);
  fs.writeFileSync(file,JSON.stringify({workspaceId:'one',title:'Changed'}));assert.equal(service.get().stale,true);assert.throws(()=>service.save({revision,expectedVersion:saved.version,entries:[]}),/thay đổi/);assert.equal(service.get().entries.length,1);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('reviewing one channel cannot refresh unchanged drafts on other channels; legacy bundles migrate lazily',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-publish-review-')),dir='workspace/content/2026-11-04/test',folder=path.join(root,dir);fs.mkdirSync(path.join(folder,'work'),{recursive:true});const file=path.join(folder,'project.json');fs.writeFileSync(file,JSON.stringify({workspaceId:'one',title:'Old'}));
 try{
  const oldRevision=projectRevision(file),entry=id=>({platform:'youtube',channelId:id,title:'Title',caption:'Caption',hashtags:'',tags:'',comment:''}),service=publishDrafts(root,'one',dir);
  fs.writeFileSync(path.join(folder,'work/publish-drafts.json'),JSON.stringify({schemaVersion:1,workspaceId:'one',projectRevision:oldRevision,entries:[entry('a'),entry('b')]}));assert.equal(service.get().entries[0].stale,false);
  fs.writeFileSync(file,JSON.stringify({workspaceId:'one',title:'New'}));const revision=projectRevision(file),before=service.get();assert.ok(before.entries.every(e=>e.stale));
  const saved=service.save({revision,expectedVersion:before.version,entries:before.entries,reviewedEntries:[{platform:'youtube',channelId:'a'}]});assert.equal(saved.entries[0].stale,false);assert.equal(saved.entries[1].stale,true);assert.equal(saved.entries[1].reviewedRevision,oldRevision);assert.equal(saved.stale,true);
  const tampered=service.save({revision,expectedVersion:saved.version,entries:saved.entries.map(e=>({...e,reviewedRevision:revision,stale:false}))});assert.equal(tampered.entries[1].stale,true);
  const reviewed=service.save({revision,expectedVersion:tampered.version,entries:tampered.entries,reviewedEntries:[{platform:'youtube',channelId:'b'}]});assert.equal(reviewed.stale,false);
  const withCommon=service.save({revision,expectedVersion:reviewed.version,entries:[...reviewed.entries,entry('')]});
  const snapshot=snapshotPublishDrafts(root,'one',dir,[{platform:'youtube',id:'a'}]);assert.equal(snapshot.entries.length,1);assert.equal(snapshot.entries[0].channelId,'a');assert.equal(snapshot.stale,false);
  const fallback=snapshotPublishDrafts(root,'one',dir,[{platform:'youtube',id:'new'}]);assert.equal(fallback.entries[0].channelId,'');
  service.save({revision,expectedVersion:withCommon.version,entries:withCommon.entries.map(e=>e.channelId==='a'?{...e,title:'Changed later'}:e)});assert.equal(snapshot.entries[0].title,'Title');
  const refreshed=refreshPublishDraftReview(snapshot,'later-video-revision');assert.equal(refreshed.stale,true);assert.equal(snapshot.stale,false);assert.equal(refreshed.entries[0].title,'Title');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
