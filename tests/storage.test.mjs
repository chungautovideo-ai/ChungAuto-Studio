import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createWorkspaceStore} from '../src/services/workspaces.mjs';import {createStorageService,resolveContained} from '../src/services/storage.mjs';
test('Storage contains browsing/copies, tracks provenance and deduplicates without modifying source',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-storage-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const shared=path.join(root,'shared');fs.mkdirSync(shared);fs.writeFileSync(path.join(shared,'clip.mp4'),'synthetic media');fs.writeFileSync(path.join(shared,'secret.txt'),'excluded');
 const dir='workspace/content/day/project';fs.mkdirSync(path.join(root,dir),{recursive:true});fs.writeFileSync(path.join(root,dir,'project.json'),JSON.stringify({workspaceId:'default'}));
 const store=createWorkspaceStore(root);store.update('default',{nasRoot:shared});const storage=createStorageService(root,store);
 assert.equal(storage.browse().entries.length,1);assert.throws(()=>resolveContained(shared,'../config'));assert.throws(()=>storage.browse('..'));
 const first=await storage.attach(dir,'clip.mp4');assert.equal(first.duplicate,false);assert.equal(fs.readFileSync(path.join(root,dir,first.asset.path),'utf8'),'synthetic media');assert.equal(fs.readFileSync(path.join(shared,'clip.mp4'),'utf8'),'synthetic media');
 assert.equal((await storage.attach(dir,'clip.mp4')).duplicate,true);await assert.rejects(storage.attach(dir,'secret.txt'));
 // Same-size replacement must not be reused merely because the manifest hash matches.
 fs.writeFileSync(path.join(root,dir,first.asset.path),'tampered! media');
 const repaired=await storage.attach(dir,'clip.mp4');assert.equal(repaired.duplicate,false);
 assert.notEqual(repaired.asset.path,first.asset.path);
 assert.equal(fs.readFileSync(path.join(root,dir,repaired.asset.path),'utf8'),'synthetic media');
 assert.equal(fs.readFileSync(path.join(root,dir,first.asset.path),'utf8'),'tampered! media');
 await assert.rejects(storage.attach(dir,'clip.mp4',{workspaceId:'wrong'}),/Workspace/);
 store.create({name:'Other'});await assert.rejects(storage.attach(dir,'clip.mp4'));
});
test('chat-selected files use shared importer, enforce snapshot membership and clean copies on expired job',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-selected-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const shared=path.join(root,'nguồn có dấu');fs.mkdirSync(shared);const selected=path.join(shared,'cảnh trám.mp4');fs.writeFileSync(selected,'selected media');
 const dir='workspace/content/day/project';fs.mkdirSync(path.join(root,dir),{recursive:true});fs.writeFileSync(path.join(root,dir,'project.json'),JSON.stringify({workspaceId:'default'}));
 const storage=createStorageService(root,createWorkspaceStore(root));
 const sources=[{path:shared,kind:'directory',role:'broll',status:'ready',files:[{path:selected}]}];
 await assert.rejects(storage.attachSelected(dir,sources,path.join(shared,'other.mp4')),/danh sách/);
 let checks=0;await assert.rejects(storage.attachSelected(dir,sources,selected,{validate:()=>{if(++checks===2)throw new Error('expired');}}),/expired/);
 assert.deepEqual(fs.readdirSync(path.join(root,dir,'inputs/library')),[]);
 const first=await storage.attachSelected(dir,sources,selected);assert.equal(first.asset.source.role,'broll');assert.equal(first.asset.sha256.length,64);
 assert.equal(first.asset.source.root,fs.realpathSync(shared));assert.equal(first.asset.source.relative,'cảnh trám.mp4');
 assert.equal((await storage.attachSelected(dir,sources,selected)).duplicate,true);
 assert.equal(fs.readFileSync(selected,'utf8'),'selected media');
 assert.equal(fs.readdirSync(path.join(root,dir,'inputs/library')).length,1);
 await assert.rejects(storage.attachSelected(dir,sources,selected,{workspaceId:'other'}),/workspace/);
});

test('source filters preserve folder navigation and paginate only matching media',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-filter-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const shared=path.join(root,'shared');fs.mkdirSync(shared);fs.mkdirSync(path.join(shared,'Other folder'));
 for(let i=0;i<105;i++)fs.writeFileSync(path.join(shared,'Cảnh '+i+'.mp4'),'video');
 fs.writeFileSync(path.join(shared,'Cảnh ảnh.png'),'image');fs.writeFileSync(path.join(shared,'Cảnh lời.wav'),'audio');
 const store=createWorkspaceStore(root);store.update('default',{nasRoot:shared});const storage=createStorageService(root,store);
 const first=storage.browse('',0,{query:'CẢNH'.normalize('NFD'),kind:'video'});
 assert.equal(first.total,106);assert.equal(first.entries[0].directory,true);assert.equal(first.entries.length,100);assert.equal(first.nextOffset,100);
 assert.equal(storage.browse('',100,{query:'cảnh',kind:'video'}).entries.length,6);
 const image=storage.browse('',0,{query:'ảnh',kind:'image'});assert.equal(image.entries.length,2);assert.equal(image.entries[1].name,'Cảnh ảnh.png');
 assert.equal(storage.browse('',0,{query:'missing',kind:'audio'}).entries.length,1);
 assert.throws(()=>storage.browse('',0,{kind:'invalid'}));assert.throws(()=>storage.browse('',0,{query:'a'.repeat(201)}));
});

test('source metadata inspects selected file without copying and enforces workspace',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-metadata-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const shared=path.join(root,'shared');fs.mkdirSync(shared);fs.copyFileSync(new URL('./fixture.mp4',import.meta.url),path.join(shared,'video.mp4'));
 const store=createWorkspaceStore(root);store.update('default',{nasRoot:shared});const storage=createStorageService(root,store);
 const info=await storage.mediaInfo('video.mp4',{workspaceId:'default'});assert.equal(info.kind,'video');assert.ok(info.duration>0&&info.displayWidth>0);assert.equal(info.relative,'video.mp4');
 await assert.rejects(storage.mediaInfo('video.mp4',{workspaceId:'wrong'}),/Workspace/);await assert.rejects(storage.mediaInfo('../outside.mp4'));
 assert.deepEqual(fs.readdirSync(shared),['video.mp4']);
});
