import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import test from 'node:test';import assert from 'node:assert/strict';
import {createEditorContext} from '../src/services/editor-context.mjs';import {runApiEditor} from '../src/services/api-editor.mjs';
test('API worker reads bounded provenance from shared history without exposing absolute NAS roots',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-worker-provenance-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));fs.mkdirSync(path.join(root,'inputs'));fs.mkdirSync(path.join(root,'work'));fs.copyFileSync(new URL('./fixture.mp4',import.meta.url),path.join(root,'inputs/shot.mp4'));
 const manifest=path.join(root,'work/source-assets.json');fs.writeFileSync(manifest,JSON.stringify({assets:[{id:'shot',path:'inputs/shot.mp4',source:{root:'private-NAS-root',role:'broll'},annotations:{tags:['product'],rights:'licensed',version:'v1',notes:'x'.repeat(2000)}}]}));
 const context=createEditorContext(root),read=context.provenance(['inputs/shot.mp4']);assert.equal(read.entries[0].declaredRights,'licensed');assert.deepEqual(read.entries[0].tags,['product']);assert.equal(read.entries[0].notes,undefined);assert.ok(!JSON.stringify(read).includes('private-NAS-root'));assert.equal(context.provenance(['inputs/shot.mp4'],{includeNotes:true}).entries[0].notes.length,1000);
 assert.throws(()=>context.provenance(['../outside']));assert.throws(()=>context.provenance(['inputs/shot.mp4','inputs/shot.mp4']));
 let calls=0;const result=await runApiEditor({config:{baseUrl:'https://example.com/v1',model:'fixture'},project:{title:'before'},instruction:'Read metadata',mediaContext:context,fetcher:async(_url,options)=>{
  const body=JSON.parse(options.body);calls++;let message;
  if(calls===1){assert.ok(body.tools.some(t=>t.function.name==='read_media_provenance'));message={tool_calls:[{id:'provenance',type:'function',function:{name:'read_media_provenance',arguments:JSON.stringify({sources:['inputs/shot.mp4']})}}]};}
  else if(calls===2){const delivered=JSON.parse(body.messages.find(m=>m.tool_call_id==='provenance').content);assert.equal(delivered.entries[0].annotationVersion,'v1');message={tool_calls:[{id:'edit',type:'function',function:{name:'set_edit_fields',arguments:JSON.stringify({fields:{title:'after'}})}}]};}
  else message={content:'done'};return Response.json({choices:[{finish_reason:message.tool_calls?'tool_calls':'stop',message}]});
 }});assert.equal(result.project.title,'after');
 fs.appendFileSync(manifest,' '); // Whitespace changes do not change semantic snapshot.
 assert.equal(context.provenance(['inputs/shot.mp4']).entries[0].recorded,true);
 fs.writeFileSync(manifest,JSON.stringify({assets:[]}));assert.throws(()=>context.provenance(['inputs/shot.mp4']),/Lịch sử tư liệu đã đổi/);
});
