import {sourceTranscriptClock} from '../editor/lib/source-transcript.js';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import test from 'node:test';
import {createEditorContext} from '../src/services/editor-context.mjs';import {applyEditorFields,runApiEditor} from '../src/services/api-editor.mjs';
test('API editor reads contained media/transcript with source guards and inserts only inspected footage',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-editor-context-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));fs.mkdirSync(path.join(root,'inputs'));fs.mkdirSync(path.join(root,'work'));
 fs.copyFileSync(new URL('./fixture.mp4',import.meta.url),path.join(root,'inputs/shot.mp4'));const transcript=path.join(root,'work/transcript.json');fs.writeFileSync(transcript,JSON.stringify({words:[{word:'Xin',start:0,end:.2},{word:'chào',start:.2,end:.5}]}));
 const context=createEditorContext(root);assert.equal(context.list().media[0].src,'inputs/shot.mp4');assert.equal(context.transcript({offset:1,limit:1}).words[0].word,'chào');assert.throws(()=>context.transcript({limit:1001}));
 const sampled=await context.sample('inputs/shot.mp4',[0,.2]);assert.equal(sampled.frames.length,2);assert.ok(sampled.frames.every(f=>f.dataUrl.startsWith('data:image/jpeg;base64,')&&f.sha256.length===64));
 await assert.rejects(context.sample('inputs/shot.mp4',[999]));await assert.rejects(context.sample('../outside.mp4',[0]));
 const aborted=new AbortController();aborted.abort();await assert.rejects(context.sample('inputs/shot.mp4',[0],{signal:aborted.signal}));
 await assert.rejects(context.inspect(['../outside.mp4']));const media=await context.inspect(['inputs/shot.mp4']);assert.equal(media[0].kind,'video');
 const base={source:{video:'inputs/original.mp4'},brolls:[]},fields={brolls:[{id:'b-test',src:'inputs/shot.mp4',at:0,dur:.5,mediaStart:0,mode:'full',audioVol:0}]};assert.throws(()=>applyEditorFields(base,fields),/tư liệu|Cảnh trám/);assert.equal(applyEditorFields(base,fields,{media}).brolls.length,1);assert.throws(()=>applyEditorFields(base,{brolls:[{...fields.brolls[0],dur:100}]},{media}),/thời lượng/);
 let step=0;const tool=(name,args)=>({id:'tool-'+step,type:'function',function:{name,arguments:JSON.stringify(args)}});
 const result=await runApiEditor({config:{baseUrl:'https://example.com/v1',model:'fixture'},project:base,instruction:'Chèn cảnh trám',mediaContext:context,fetcher:async(url,options)=>{step++;const body=JSON.parse(options.body);assert.equal(body.tools.length,15);assert.ok(body.tools.some(t=>t.function.name==='append_primary_clips'));assert.ok(body.tools.some(t=>t.function.name==='reorder_primary_clips'));const calls=step===1?[tool('list_media',{}),tool('read_transcript',{limit:100})]:step===2?[tool('inspect_media',{sources:['inputs/shot.mp4']})]:step===3?[tool('set_edit_fields',{fields})]:null;return Response.json({choices:[calls?{finish_reason:'tool_calls',message:{tool_calls:calls}}:{finish_reason:'stop',message:{content:'Đã chèn.'}}]});}});assert.equal(result.project.brolls[0].src,'inputs/shot.mp4');assert.equal(step,4);
 fs.appendFileSync(transcript,' ');assert.throws(()=>context.transcript(),/Transcript đã đổi/);
 const fresh=createEditorContext(root);fs.appendFileSync(path.join(root,'inputs/shot.mp4'),'changed');assert.throws(()=>fresh.list(),/Tư liệu đã đổi/);
});

test('API transcript selection bounds output by source time/query and paginates the filtered set',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-transcript-window-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));fs.mkdirSync(path.join(root,'work'));
 const words=Array.from({length:2000},(_,i)=>({word:i%2?'Khuyến mãi':'Review',start:i*.5,end:i*.5+.4}));fs.writeFileSync(path.join(root,'work/transcript.json'),JSON.stringify({words}));const context=createEditorContext(root);
 const first=context.transcript({start:10,end:12,limit:2});assert.equal(first.total,4);assert.equal(first.totalWords,2000);assert.equal(first.nextOffset,2);assert.equal(first.words[0].start,10);
 const last=context.transcript({start:10,end:12,offset:first.nextOffset,limit:2});assert.equal(last.nextOffset,null);assert.equal(last.words.at(-1).start,11.5);
 const search=context.transcript({start:10,end:12,query:'KHUYẾN'.normalize('NFD')});assert.equal(search.words.length,2);assert.ok(search.words.every(w=>w.word==='Khuyến mãi'));
 assert.ok(JSON.stringify(first).length<JSON.stringify(context.transcript()).length/10);
 assert.equal(context.transcript({start:10.4,end:10.5}).words.length,0);
 for(const bad of [{start:-1},{start:2,end:1},{start:'1'},{end:NaN},{query:2},{query:''},{query:'x'.repeat(201)}])assert.throws(()=>context.transcript(bad));
 fs.appendFileSync(path.join(root,'work/transcript.json'),' ');assert.throws(()=>context.transcript({start:10,end:12}),/Transcript đã đổi/);
});

test('API worker exposes transcript window schema and sends only selected words to model',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-transcript-worker-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));fs.mkdirSync(path.join(root,'work'));fs.writeFileSync(path.join(root,'work/transcript.json'),JSON.stringify({words:[{word:'ngoài vùng',start:0,end:1},{word:'khuyến mãi',start:10,end:11},{word:'ngoài vùng cuối',start:20,end:21}]}));
 const context=createEditorContext(root);let calls=0;
 const result=await runApiEditor({config:{baseUrl:'https://example.com/v1',model:'fixture'},project:{title:'before'},instruction:'Sửa đoạn10–12giây',mediaContext:context,fetcher:async(_url,options)=>{
 const body=JSON.parse(options.body);calls++;const schema=body.tools.find(t=>t.function.name==='read_transcript').function.parameters;assert.ok(schema.properties.start&&schema.properties.end&&schema.properties.query);
 if(calls===1)return Response.json({choices:[{finish_reason:'tool_calls',message:{tool_calls:[{id:'window',type:'function',function:{name:'read_transcript',arguments:JSON.stringify({start:10,end:12,query:'khuyến'})}}]}}]});
 const selected=JSON.parse(body.messages.find(m=>m.tool_call_id==='window').content);assert.equal(selected.words.length,1);assert.equal(selected.words[0].word,'khuyến mãi');assert.equal(selected.totalWords,3);assert.equal(selected.nextOffset,null);
 if(calls===2)return Response.json({choices:[{finish_reason:'tool_calls',message:{tool_calls:[{id:'edit',type:'function',function:{name:'set_edit_fields',arguments:JSON.stringify({fields:{title:'after'}})}}]}}]});
 return Response.json({choices:[{finish_reason:'stop',message:{content:'Đã sửa'}}]});
 }});assert.equal(result.project.title,'after');assert.equal(calls,3);
});


test('AI transcript respects pinned multi-source clock, retains source provenance and blocks stale saved words',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-ai-source-clock-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));fs.mkdirSync(path.join(root,'work'));
 const project={source:{timeline:'segments'},segments:[{id:'a',src:'inputs/a.mp4',in:0,out:2,mediaStart:1}]};
 const transcript={sourceClock:sourceTranscriptClock(project),words:[{word:'Xin',start:0,end:.3,source:{src:'inputs/a.mp4',start:1,end:1.3}}]};
 fs.writeFileSync(path.join(root,'project.json'),JSON.stringify(project));fs.writeFileSync(path.join(root,'work/transcript.json'),JSON.stringify(transcript));
 const valid=createEditorContext(root).transcript();assert.equal(valid.sourceClockMatched,true);assert.deepEqual(valid.words[0].source,transcript.words[0].source);assert.match(valid.timing,/ảo/);
 const edited=structuredClone(project);edited.segments[0].mediaStart=1.1;
 const stale=createEditorContext(root,{project:edited});assert.throws(()=>stale.transcript(),/nhận giọng lại/);assert.deepEqual(stale.list().media,[]);
 const unchanged=structuredClone(project);unchanged.segments[0].speed=2;unchanged.segments[0].keep=false;assert.equal(createEditorContext(root,{project:unchanged}).transcript().words.length,1);
 fs.writeFileSync(path.join(root,'project.json'),JSON.stringify(edited));assert.throws(()=>createEditorContext(root).transcript(),/nhận giọng lại/);
});

