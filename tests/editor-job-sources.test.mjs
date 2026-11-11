import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {createEditorJobSources} from '../src/services/editor-job-sources.mjs';import {createEditorContext} from '../src/services/editor-context.mjs';import {createStorageService} from '../src/services/storage.mjs';
test('API imports only declared source index and adopts media/provenance without NAS paths in catalog',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'api-job-sources-'));try{
  const projectDir=path.join(root,'workspace/content/day/project'),nas=path.join(root,'nas');for(const d of [projectDir,nas])fs.mkdirSync(d,{recursive:true});fs.writeFileSync(path.join(projectDir,'project.json'),JSON.stringify({workspaceId:'qa'}));
  const file=path.join(nas,'proof.mp4');execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','color=s=64x64:d=0.5','-c:v','libx264',file],{windowsHide:true});
  let active='qa',cancelled=false;const workspaceStore={active:()=>({id:active})},sources=[{path:nas,status:'ready',kind:'directory',role:'broll',files:[{name:'proof.mp4',path:file}],truncated:true}],mediaContext=createEditorContext(projectDir),context=createEditorJobSources({root,projectDir,sources,workspaceId:'qa',workspaceStore,storageService:createStorageService(root,workspaceStore),mediaContext,validate:()=>{if(cancelled)throw Error('cancelled');}});
  const list=context.list();assert.equal(list.files[0].index,0);assert.equal(list.sources[0].truncated,true);assert.equal(JSON.stringify(list).includes(nas),false);assert.throws(()=>context.list({offset:-1}));await assert.rejects(context.attach({index:1}),/index/);
  const attached=await context.attach({index:0});assert.match(attached.src,/^inputs\/library\/.*\.mp4$/);assert.equal(mediaContext.list().media[0].src,attached.src);assert.equal((await mediaContext.inspect([attached.src]))[0].kind,'video');assert.equal((await context.attach({index:0})).duplicate,true);mediaContext.validate();
  assert.equal(mediaContext.provenance([attached.src]).entries[0].role,'broll');active='other';await assert.rejects(context.attach({index:0}),/Workspace/);active='qa';cancelled=true;await assert.rejects(context.attach({index:0}),/cancelled/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('source filtering keeps original attach indices across pagination, roles and Unicode filename search',async()=>{
 let selected;const sources=[{status:'ready',role:'aroll',files:[{name:'A.mp4',path:'a'}]},{status:'ready',role:'broll',files:[{name:'Ghế da.mp4'.normalize('NFD'),path:'seat'},{name:'ĐÈN XE.mp4',path:'lamp'},{name:'Đèn trước.mp4',path:'lamp2'}],truncated:true}];
 const context=createEditorJobSources({root:'/',projectDir:'/project',sources,workspaceId:'qa',workspaceStore:{active:()=>({id:'qa'})},mediaContext:{validate(){},adoptSource:async asset=>({src:asset.path})},storageService:{attachSelected:async(dir,declared,file)=>{selected=file;return {asset:{path:'inputs/library/fixture.mp4'}};}}});
 const first=context.list({role:'broll',query:'đèn',limit:1});assert.equal(first.catalogTotal,4);assert.equal(first.total,2);assert.equal(first.files[0].index,2);assert.equal(first.nextOffset,1);
 const second=context.list({role:'broll',query:'đèn',limit:1,offset:1});assert.equal(second.files[0].index,3);assert.equal(second.nextOffset,null);await context.attach({index:second.files[0].index});assert.equal(selected,'lamp2');
 assert.equal(context.list({query:'GHẾ',sourceIndex:1}).files[0].index,1);assert.equal(context.list({role:'aroll',query:'đèn'}).total,0);assert.equal(context.list({query:'missing'}).files.length,0);
 for(const args of [{query:12},{query:'a'.repeat(201)},{role:'video'},{sourceIndex:-1},{sourceIndex:2}])assert.throws(()=>context.list(args),/Bộ lọc/);
});
