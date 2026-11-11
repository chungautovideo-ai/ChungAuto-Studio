import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';import test from 'node:test';import assert from 'node:assert/strict';
import {createEditorContext} from '../src/services/editor-context.mjs';import {applyEditorFields,runApiEditor} from '../src/services/api-editor.mjs';
import {readEditItem,patchEditItem,resolveEditSelection} from '../src/services/editor-item-patch.mjs';
test('API inspects real local audio then adds bounded narration while preserving music and siblings',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-api-audio-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));fs.mkdirSync(path.join(root,'inputs'));const src='inputs/voice.wav';execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=880:duration=2',path.join(root,src)],{windowsHide:true});
 const context=createEditorContext(root);assert.equal(context.list().media[0].src,src);const inspected=await context.inspect([src]);assert.equal(inspected[0].kind,'audio');assert.equal(inspected[0].duration,2);
 const base={title:'keep',audio:{music:'keep.mp3',duckNarration:true,clips:[{id:'old',src:'existing.mp3',at:0}]}};
 const clip={id:'voice',src,at:.5,from:.2,dur:1,vol:.8},fields={audio:{...base.audio,clips:[...base.audio.clips,clip]}};
 assert.throws(()=>applyEditorFields(base,fields),/inspect_media|tư liệu/);assert.equal(applyEditorFields(base,fields,{media:inspected}).audio.music,'keep.mp3');
 const withVoice=applyEditorFields(base,fields,{media:inspected});const read=readEditItem(withVoice,{group:'audio.clips',id:'voice'});
 assert.equal(resolveEditSelection(withVoice,{selection:{group:'audio.clips',id:'voice'}}).supported,true);
 const patched=patchEditItem(withVoice,{group:'audio.clips',id:'voice',version:read.version,changes:{vol:.4}},(project,edit)=>applyEditorFields(project,edit,{media:inspected}));
 assert.equal(patched.project.audio.clips[1].vol,.4);assert.deepEqual(patched.project.audio.clips[0],base.audio.clips[0]);assert.equal(patched.project.audio.music,'keep.mp3');assert.equal(withVoice.audio.clips[1].vol,.8);
 assert.throws(()=>patchEditItem(withVoice,{group:'audio.clips',id:'voice',version:read.version,changes:{from:100}},(project,edit)=>applyEditorFields(project,edit,{media:inspected})));
 for(const changes of [{dur:10},{from:-1},{vol:3},{at:-1},{fadeIn:-1},{fadeOut:'1'}])assert.throws(()=>applyEditorFields(base,{audio:{...fields.audio,clips:[{...clip,...changes}]}},{media:inspected}));
 const faded=patchEditItem(withVoice,{group:'audio.clips',id:'voice',version:read.version,changes:{fadeIn:.2,fadeOut:.3}},(project,edit)=>applyEditorFields(project,edit,{media:inspected}));assert.equal(faded.project.audio.clips[1].fadeIn,.2);assert.equal(faded.project.audio.clips[1].fadeOut,.3);
 let calls=0;const result=await runApiEditor({config:{baseUrl:'https://example.com/v1',model:'fixture'},project:base,mediaContext:context,instruction:'Chèn voice',fetcher:async(_url,options)=>{calls++;const body=JSON.parse(options.body);let message;
  if(calls===1)message={tool_calls:[{id:'inspect',type:'function',function:{name:'inspect_media',arguments:JSON.stringify({sources:[src]})}}]};
  else if(calls===2){assert.equal(JSON.parse(body.messages.find(m=>m.tool_call_id==='inspect').content)[0].kind,'audio');message={tool_calls:[{id:'edit',type:'function',function:{name:'set_edit_fields',arguments:JSON.stringify({fields})}}]};}
  else message={content:'done'};return Response.json({choices:[{finish_reason:message.tool_calls?'tool_calls':'stop',message}]});
 }});assert.deepEqual(result.project.audio,fields.audio);assert.deepEqual(base.audio.clips,[{id:'old',src:'existing.mp3',at:0}]);
});
