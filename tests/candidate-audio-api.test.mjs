import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {execFileSync} from 'node:child_process';
import {resolveTimeline} from '../editor/lib/build.mjs';
import {checkAudioMediaRanges} from '../src/services/candidate-audio-check.mjs';
import {createEditorContext} from '../src/services/editor-context.mjs';
import {runApiEditor} from '../src/services/api-editor.mjs';
import {checkSessionCandidateMedia} from '../src/services/candidate-media-check.mjs';
import {projectRevision} from '../src/services/project-revisions.mjs';
function setup(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-audio-check-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));fs.mkdirSync(path.join(dir,'inputs'));for(const f of ['voice.wav','music.wav','silent.mp4'])fs.writeFileSync(path.join(dir,'inputs',f),f);return dir;}
const project=()=>({source:{video:'inputs/raw.mp4',duration:10},segments:[{id:'a',in:0,out:2,speed:2},{id:'b',in:4,out:8}],audio:{music:'inputs/music.wav',musicLoop:'repeat',clips:[{id:'voice',src:'inputs/voice.wav',at:4,from:1,dur:2},{id:'hidden',hidden:true,src:'inputs/missing.wav'}]}});
const probe=async file=>({hasAudio:!file.endsWith('.mp4'),duration:3});
test('real FFprobe and API audio tool check current candidate, repair missing music without editing live project',async t=>{
 const dir=setup(t);execFileSync('ffmpeg',['-y','-v','error','-f','lavfi','-i','sine=frequency=440:duration=2',path.join(dir,'inputs/music.wav')],{windowsHide:true});
 const p=project();p.audio={music:'inputs/missing.wav',musicLoop:'repeat',clips:[]};const file=path.join(dir,'project.json');fs.writeFileSync(file,JSON.stringify(p));const before=fs.readFileSync(file),context=createEditorContext(dir,{project:p});let round=0;
 const tool=(name,args)=>({id:name,function:{name,arguments:JSON.stringify(args)}});
 const result=await runApiEditor({config:{baseUrl:'https://example.com/v1',model:'fixture'},project:p,instruction:'Sửa nhạc bị thiếu, giữ các trường khác',mediaContext:context,fetcher:async(_url,options)=>{
  const body=JSON.parse(options.body);round++;let calls;assert.ok(body.tools.some(t=>t.function.name==='check_audio_media_ranges'));
  if(round===1)calls=[tool('check_audio_media_ranges',{})];
  if(round===2){assert.equal(JSON.parse(body.messages.at(-1).content).errors[0].code,'SOURCE_UNAVAILABLE');calls=[tool('inspect_media',{sources:['inputs/music.wav']})];}
  if(round===3)calls=[tool('set_edit_fields',{fields:{audio:{...p.audio,music:'inputs/music.wav'}}})];
  if(round===4)calls=[tool('check_audio_media_ranges',{})];
  if(round===5){const report=JSON.parse(body.messages.findLast(m=>m.role==='tool'&&m.tool_call_id==='check_audio_media_ranges').content);assert.equal(report.ok,true);assert.equal(report.sources[0].hasAudio,true);assert.equal(report.sources[0].duration,2);assert.equal(report.audioListened,false);}
  return Response.json({choices:[calls?{finish_reason:'tool_calls',message:{tool_calls:calls}}:{finish_reason:'stop',message:{content:'Đã sửa file nhạc; chưa nghe.'}}]});
 }});assert.equal(round,5);assert.equal(result.project.audio.music,'inputs/music.wav');assert.deepEqual(fs.readFileSync(file),before);assert.deepEqual(result.project.segments,p.segments);
});

