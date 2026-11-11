import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import test from 'node:test';import assert from 'node:assert/strict';
import {readProjectSourceHistory} from '../src/services/project-source-history.mjs';import {createStorageService} from '../src/services/storage.mjs';import {createWorkspaceStore} from '../src/services/workspaces.mjs';
import crypto from 'node:crypto';
test('source verification catches equal-size tampering and rejects undeclared or stale context',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-source-verify-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const dir='workspace/content/day/project',project=path.join(root,dir);fs.mkdirSync(path.join(project,'work'),{recursive:true});fs.mkdirSync(path.join(project,'inputs'));fs.writeFileSync(path.join(project,'project.json'),'{}');
 const file=path.join(project,'inputs/clip.mp4'),bytes=Buffer.alloc(4096,3);fs.writeFileSync(file,bytes);
 fs.writeFileSync(path.join(project,'work/source-assets.json'),JSON.stringify({assets:[{id:'a',path:'inputs/clip.mp4',bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')}]}));
 const storage=createStorageService(root,createWorkspaceStore(root));assert.equal((await storage.verifyProjectSource(dir,'inputs/clip.mp4')).matches,true);
 await assert.rejects(storage.verifyProjectSource(dir,'inputs/other.mp4'),/lịch sử/);await assert.rejects(storage.verifyProjectSource(dir,'inputs/clip.mp4',{workspaceId:'other'}),/Workspace/);
 fs.writeFileSync(file,Buffer.alloc(bytes.length,4));assert.equal(storage.projectSources(dir).entries[0].localState,'present');await assert.rejects(storage.verifyProjectSource(dir,'inputs/clip.mp4'),/đã thay đổi/);
 const controller=new AbortController();controller.abort();await assert.rejects(storage.verifyProjectSource(dir,'inputs/clip.mp4',{signal:controller.signal}));
});
test('history merges phone and voice into shared sources without duplicating paths or rewriting manifests',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-history-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const dir='workspace/content/day/project',project=path.join(root,dir);fs.mkdirSync(path.join(project,'work'),{recursive:true});fs.mkdirSync(path.join(project,'inputs'));fs.writeFileSync(path.join(project,'project.json'),'{}');
 const write=(name,data)=>fs.writeFileSync(path.join(project,'work',name),JSON.stringify(data));
 write('source-assets.json',{assets:[{id:'a',path:'inputs/voice.mp3',name:'voice',bytes:3,source:{role:'voice'}},{id:'i',path:'inputs/image.png',name:'picture',bytes:3,provenance:{kind:'image',resultId:'img',origin:'generated'}}]});
 write('phone-assets.json',{assets:[{id:'p',path:'inputs/phone.mp4',name:'phone',bytes:3,receivedAt:'now'}]});
 write('voice-assets.json',{entries:[{assetId:'a',path:'inputs/voice.mp3',voiceResultId:'v1',narration:{scriptId:'story'}},{assetId:'a',path:'inputs/voice.mp3',voiceResultId:'v2'}]});
 for(const file of ['voice.mp3','image.png','phone.mp4'])fs.writeFileSync(path.join(project,'inputs',file),'123');
 const before=fs.readFileSync(path.join(project,'work/source-assets.json'),'utf8'),history=readProjectSourceHistory(project);assert.equal(history.length,3);assert.equal(history[0].voiceVersions.length,2);assert.deepEqual(history[0].sourceKinds,['voice']);assert.deepEqual(history[1].sourceKinds,['image']);assert.deepEqual(history[2].sourceKinds,['phone']);
 const service=createStorageService(root,createWorkspaceStore(root));assert.equal(service.projectSources(dir).total,3);assert.ok(service.projectSources(dir).entries.every(e=>e.localState==='present'));
 assert.equal(fs.readFileSync(path.join(project,'work/source-assets.json'),'utf8'),before);
 write('voice-assets.json',{entries:[{path:'inputs/legacy.mp3',voiceResultId:'legacy'}]});fs.writeFileSync(path.join(project,'inputs/legacy.mp3'),'123');assert.equal(service.projectSources(dir).entries.at(-1).localState,'size-unknown');
 write('phone-assets.json',{assets:'invalid'});assert.throws(()=>readProjectSourceHistory(project),/không hợp lệ/);
});
