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
test('audio check uses source at/output duration, probes unique sources and reports truncation instead of silent drop',async t=>{
 const dir=setup(t),p=project(),calls=[];let r=await checkAudioMediaRanges(dir,resolveTimeline(p),{probe:async f=>{calls.push(f);return probe(f);}});
 assert.equal(r.ok,true);assert.equal(calls.length,2);assert.equal(r.clips[0].outputStart,1);assert.equal(r.clips[0].sourceEnd,3);assert.equal(r.audioListened,false);
 p.audio.clips.push({id:'overrun',src:'inputs/voice.wav',at:4,from:2,dur:2},{id:'noaudio',src:'inputs/silent.mp4',at:0,dur:1},{id:'missing',src:'inputs/missing.wav',at:0,dur:1},{id:'beyond',src:'inputs/voice.wav',at:20,dur:1});
 r=await checkAudioMediaRanges(dir,resolveTimeline(p),{probe});assert.equal(r.ok,false);assert.ok(r.errors.some(e=>e.id==='overrun'&&e.code==='AUDIO_RANGE_TRUNCATED'));assert.ok(r.errors.some(e=>e.id==='beyond'&&e.code==='INVALID_AUDIO_RANGE'));assert.ok(r.errors.some(e=>e.code==='AUDIO_REQUIRED'));assert.ok(r.errors.some(e=>e.code==='SOURCE_UNAVAILABLE'));
});
test('audio check distinguishes repeat/crossfade, warns on muted/end-trim clips and rejects outside/changed sources',async t=>{
 const dir=setup(t),p=project();p.endCard={enabled:true,duration:2};p.audio.musicLoop='crossfade';p.audio.clips=[{id:'end',src:'inputs/voice.wav',at:7,dur:3,vol:0}];
 let r=await checkAudioMediaRanges(dir,resolveTimeline(p),{probe});assert.equal(r.ok,true);assert.equal(r.errors.some(e=>e.code==='MUSIC_COVERAGE_GAP'),false);assert.deepEqual(r.warnings.map(w=>w.code),['CLIPPED_AT_VIDEO_END','MUTED_CLIP']);assert.equal(r.clips[0].outputEnd,5);
 p.audio.musicLoop='repeat';assert.equal((await checkAudioMediaRanges(dir,resolveTimeline(p),{probe})).ok,true);
 p.audio.music='../../outside.wav';let calls=0;r=await checkAudioMediaRanges(dir,resolveTimeline(p),{probe:async f=>{calls++;return probe(f);}});assert.ok(r.errors.some(e=>e.src==='../../outside.wav'&&e.code==='SOURCE_UNAVAILABLE'));assert.equal(calls,1);
 p.audio.music='kit:../../outside';r=await checkAudioMediaRanges(dir,resolveTimeline(p),{probe});assert.ok(r.errors.some(e=>e.src===p.audio.music&&e.code==='SOURCE_UNAVAILABLE'));
 await assert.rejects(checkAudioMediaRanges(dir,resolveTimeline(project()),{probe:async f=>{fs.appendFileSync(f,'changed');return probe(f);}}),/thay đổi/);
});
test('audio candidate check preserves claim/revision guards and API checks abort after async probe',async t=>{
 const root=setup(t),dir=path.join(root,'workspace/content/day/qa');fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(path.join(dir,'inputs'));for(const name of ['voice.wav','music.wav','silent.mp4'])fs.writeFileSync(path.join(dir,'inputs',name),name);const candidate=path.join(dir,'work/build-candidates/token/work/candidate-project.json');fs.mkdirSync(path.dirname(candidate),{recursive:true});const p=project(),live=path.join(dir,'project.json'),jf=path.join(dir,'work/ai-job.json');fs.writeFileSync(live,JSON.stringify(p));fs.writeFileSync(candidate,JSON.stringify(p));fs.writeFileSync(path.join(path.dirname(candidate),'base-project.json'),JSON.stringify(p));fs.writeFileSync(jf,JSON.stringify({status:'working',claimedBy:{id:'owner'},candidate:path.relative(root,candidate),baseRevision:projectRevision(live),completionToken:'token'}));
 const before=fs.readFileSync(candidate);let report=await checkSessionCandidateMedia(root,path.relative(root,dir),{claimId:'owner',probe,includeVideo:false,includeAudio:true});assert.equal(report.audioMedia.ok,true);assert.equal(report.media,undefined);assert.deepEqual(fs.readFileSync(candidate),before);
 await assert.rejects(checkSessionCandidateMedia(root,path.relative(root,dir),{claimId:'wrong',probe,includeVideo:false,includeAudio:true}));
 await assert.rejects(checkSessionCandidateMedia(root,path.relative(root,dir),{claimId:'owner',includeVideo:false,includeAudio:true,probe:async f=>{fs.appendFileSync(candidate,' ');return probe(f);}}),/đổi|revision|thay đổi|bản/i);
 const controller=new AbortController();await assert.rejects(runApiEditor({config:{baseUrl:'https://example.com/v1',model:'fixture'},project:p,instruction:'Kiểm audio',signal:controller.signal,mediaContext:{validate(){},async checkAudioRanges(){controller.abort();return {ok:true};}},fetcher:async()=>Response.json({choices:[{finish_reason:'tool_calls',message:{tool_calls:[{id:'abort',function:{name:'check_audio_media_ranges',arguments:'{}'}}]}}]})}),/abort/i);
});

test('audio check probes the kit copy actually used by build and caps inventory before reading files',async t=>{
 const dir=setup(t),p=project();p.audio.clips=[];p.audio.music='kit:ambient-pad';fs.mkdirSync(path.join(dir,'assets/music'),{recursive:true});fs.writeFileSync(path.join(dir,'assets/music/ambient-pad.wav'),'project-copy');let probed;
 const r=await checkAudioMediaRanges(dir,resolveTimeline(p),{probe:async f=>{probed=f;return {hasAudio:true,duration:7};}});assert.equal(r.ok,true);assert.equal(probed,path.join(dir,'assets/music/ambient-pad.wav'));
 p.audio.music='';p.audio.clips=Array.from({length:41},(_,i)=>({id:'c'+i,src:'inputs/'+i+'.wav',at:0,dur:1}));let calls=0;await assert.rejects(checkAudioMediaRanges(dir,resolveTimeline(p),{probe:async()=>{calls++;}}),/40/);assert.equal(calls,0);
});
