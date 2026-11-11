import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createImageService} from '../src/services/images.mjs';import {createEditorContext} from '../src/services/editor-context.mjs';import {createEditorImages} from '../src/services/editor-images.mjs';import {createStorageService} from '../src/services/storage.mjs';import {runApiEditor} from '../src/services/api-editor.mjs';
test('API editor finds and imports workspace image with source guards, then edits candidate using inspected media',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-editor-images-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const dir=path.join(root,'workspace/content/2026-11-04/one');fs.mkdirSync(path.join(dir,'inputs'),{recursive:true});fs.copyFileSync(new URL('./fixture.mp4',import.meta.url),path.join(dir,'inputs/raw.mp4'));
 const project={workspaceId:'one',source:{video:'inputs/raw.mp4',duration:3,width:320,height:180,hasAudio:true},segments:[{in:0,out:3,keep:true}],brolls:[],audio:{autoSfx:false}};fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify(project));
 let workspace='one';const store={active:()=>({id:workspace})},images=createImageService(root),storage=createStorageService(root,store);const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQ1EAAAAASUVORK5CYII=','base64'),image=await images.importImage('one',bytes,{prompt:'Sản phẩm xe'});
 const media=createEditorContext(dir,{project}),library=createEditorImages({workspaceId:'one',workspaceStore:store,imageService:images,storageService:storage,root,projectDir:dir,mediaContext:media});
 await assert.rejects(library.attach({id:image.id}),/Tìm ảnh/);assert.equal(library.list({query:'SẢN PHẨM'}).images[0].id,image.id);assert.throws(()=>library.list({limit:51}));assert.equal(library.list({query:'none'}).total,0);
 let step=0,src;
 const result=await runApiEditor({project,config:{baseUrl:'http://127.0.0.1:9999/v1',model:'fixture'},instruction:'Dùng ảnh sản phẩm xe trong workspace làm cảnh trám',mediaContext:media,imageContext:library,fetcher:async(url,options)=>{
  const body=JSON.parse(options.body);assert.ok(body.tools.some(t=>t.function.name==='attach_workspace_image'));const replies=body.messages.filter(m=>m.role==='tool');if(replies.length)assert.equal(JSON.parse(replies.at(-1).content).error,undefined);
  step++;let name,args;
  if(step===1){name='list_workspace_images';args={query:'xe'};}else if(step===2){name='attach_workspace_image';args={id:image.id};}else if(step===3){src=JSON.parse(replies.at(-1).content).src;name='inspect_media';args={sources:[src]};}else if(step===4){name='set_edit_fields';args={fields:{brolls:[{id:'b1',src,at:0,dur:1,mode:'full'}]}};}else return Response.json({choices:[{finish_reason:'stop',message:{content:'Đã chèn cảnh trám.'}}]});
  return Response.json({choices:[{finish_reason:'tool_calls',message:{tool_calls:[{id:'s'+step,function:{name,arguments:JSON.stringify(args)}}]}}]});
 }});
 assert.equal(result.project.brolls[0].src,src);assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir,'project.json'))),project);media.validate();assert.deepEqual(fs.readFileSync(path.join(dir,src)),bytes);assert.equal((await library.attach({id:image.id})).duplicate,true);
 fs.appendFileSync(images.assetFile('one',image.id).file,'tampered');await assert.rejects(library.attach({id:image.id}),/đã đổi/);workspace='two';assert.throws(()=>library.list(),/Workspace/);assert.equal(project.brolls.length,0);
});
