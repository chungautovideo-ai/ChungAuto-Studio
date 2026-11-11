import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {createEditorContext} from '../src/services/editor-context.mjs';import {runApiEditor} from '../src/services/api-editor.mjs';import {makeTimemap} from '../editor/lib/timemap.js';
test('API primary append uses actual source probes, preserves siblings and refuses old transcript after source changes',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-api-primary-'));try{
  fs.mkdirSync(path.join(dir,'inputs'));for(const [name,color,sound] of [['a','blue',true],['b','red',false]]){const args=['-v','error','-f','lavfi','-i',`color=c=${color}:s=160x90:r=30:d=1`];if(sound)args.push('-f','lavfi','-i','sine=frequency=440:duration=1');args.push('-c:v','libx264',path.join(dir,'inputs',name+'.mp4'));execFileSync('ffmpeg',args,{windowsHide:true});}
  const p={source:{video:'inputs/a.mp4',duration:1},segments:[{id:'a',in:0,out:1}],texts:[{id:'keep',title:'Keep'}],audio:{music:'old.mp3'}},context=createEditorContext(dir);let step=0;
  const result=await runApiEditor({config:{baseUrl:'https://fixture.example/v1',model:'test'},project:p,mediaContext:context,instruction:'Nối b',fetcher:async(url,options)=>{
   const body=JSON.parse(options.body);step++;let message;
   if(step===1){assert.ok(body.tools.some(t=>t.function.name==='append_primary_clips'));message={tool_calls:[{id:'append',type:'function',function:{name:'append_primary_clips',arguments:JSON.stringify({sources:['inputs/b.mp4']})}}]};}
   else if(step===2){assert.equal(JSON.parse(body.messages.find(m=>m.tool_call_id==='append').content).added,1);message={tool_calls:[{id:'transcript',type:'function',function:{name:'read_transcript',arguments:'{}'}}]};}
   else{assert.match(JSON.parse(body.messages.find(m=>m.tool_call_id==='transcript').content).error,/đã đổi/);message={content:'Đã nối'};}
   return Response.json({choices:[{finish_reason:message.tool_calls?'tool_calls':'stop',message}]});
  }});
  assert.equal(result.project.segments[1].mediaInfo.hasAudio,false);assert.equal(result.project.segments[0].mediaInfo.hasAudio,true);assert.equal(makeTimemap(result.project).total,2);assert.deepEqual(result.project.texts,p.texts);assert.deepEqual(result.project.audio,p.audio);assert.equal(p.segments.length,1);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
