import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {execFileSync} from 'node:child_process';
import {createEditorContext} from '../src/services/editor-context.mjs';import {runApiEditor,applyEditorFields} from '../src/services/api-editor.mjs';
const call=(name,args)=>({id:name,function:{name,arguments:JSON.stringify(args)}});
test('API tools check actual candidate ranges, fix overrun and recheck without writing live project',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-api-ranges-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));fs.mkdirSync(path.join(dir,'inputs'));fs.mkdirSync(path.join(dir,'work'));
 execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=gray:s=64x64:r=10:d=2','-c:v','libx264','-pix_fmt','yuv420p',path.join(dir,'inputs/raw.mp4')],{windowsHide:true});
 const project={title:'QA',source:{video:'inputs/raw.mp4',duration:2,width:64,height:64},segments:[{id:'a',in:0,out:2,keep:true}],brolls:[{id:'b',src:'inputs/raw.mp4',at:0,dur:.4,mediaStart:1.8}]};
 const file=path.join(dir,'project.json');fs.writeFileSync(file,JSON.stringify(project));const bytes=fs.readFileSync(file),context=createEditorContext(dir,{project});let round=0;
 const result=await runApiEditor({config:{baseUrl:'https://example.com/v1',model:'fixture'},project,instruction:'Sửa cảnh trám vượt cuối nguồn',mediaContext:context,fetcher:async(url,options)=>{
  round++;const body=JSON.parse(options.body);assert.ok(body.tools.some(t=>t.function.name==='check_video_media_ranges'));let calls;
  if(round===1)calls=[call('check_video_media_ranges',{})];
  if(round===2){const report=JSON.parse(body.messages.at(-1).content);assert.equal(report.ok,false);assert.equal(report.errors[0].id,'b');assert.equal(report.errors[0].code,'SOURCE_RANGE_EXCEEDED');calls=[call('set_edit_fields',{fields:{brolls:[{...project.brolls[0],mediaStart:1}]}})];}
  if(round===3)calls=[call('check_video_media_ranges',{})];
  if(round===4){const report=JSON.parse(body.messages.at(-1).content);assert.equal(report.ok,true);assert.equal(report.sources.length,1);assert.equal(report.framesViewed,false);}
  return Response.json({choices:[calls?{finish_reason:'tool_calls',message:{tool_calls:calls}}:{finish_reason:'stop',message:{content:'Đã rút khoảng về đúng nguồn; chưa xem/nghe.'}}]});
 }});assert.equal(round,4);assert.equal(result.project.brolls[0].mediaStart,1);assert.deepEqual(fs.readFileSync(file),bytes);assert.equal(project.brolls[0].mediaStart,1.8);
});
test('API range tool checks cancellation after await and source bounds account for B-roll playback rate',async()=>{
 const base={source:{video:'inputs/a.mp4'},brolls:[]},asset={src:'inputs/a.mp4',kind:'video',duration:2};
 assert.throws(()=>applyEditorFields(base,{brolls:[{id:'b',src:asset.src,at:0,dur:1,mediaStart:.5,speed:2}]},{media:[asset]}),/vượt/);
 assert.equal(applyEditorFields(base,{brolls:[{id:'b',src:asset.src,at:0,dur:2,mediaStart:1,speed:.5}]},{media:[asset]}).brolls[0].speed,.5);
 const controller=new AbortController();let checks=0;
 await assert.rejects(runApiEditor({config:{baseUrl:'https://example.com/v1',model:'fixture'},project:base,instruction:'Check',signal:controller.signal,mediaContext:{validate(){},async checkRanges(){checks++;controller.abort();return {ok:true};}},fetcher:async()=>Response.json({choices:[{finish_reason:'tool_calls',message:{tool_calls:[call('check_video_media_ranges',{})]}}]})}),/abort/i);assert.equal(checks,1);
});
