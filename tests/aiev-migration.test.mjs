import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {convertAievProject} from '../src/services/aiev-project-adapter.mjs';
import {importAievProject} from '../src/services/migration-import.mjs';
import {previewMigration} from '../src/services/migration-preview.mjs';
import {resolveTimeline} from '../editor/lib/build.mjs';
import {audioClipTiming} from '../editor/lib/audio-clips.js';
const meta=()=>({name:'ContentOS-Smoke-AIEV',width:1080,height:1920,fps:30,scenes:[{id:'one',srcVideo:'assets/raw.mp4',from:.2,to:1},{id:'two',srcVideo:'assets/raw.mp4',from:1.5,to:2.5}],audio:{voice:null,sfx:[]}});
test('AIEV subtitle output frames become editable source anchors across removed footage',()=>{
 const value=meta();value.subtitles=[{from:6,durationInFrames:12,text:'Xin chào'},{from:21,durationInFrames:12,text:'Qua điểm cắt'},{from:36,durationInFrames:15,text:'Cảnh thứ hai'}];
 const project=convertAievProject(value);project.source.duration=3;project.source.width=360;project.source.height=640;
 const timeline=resolveTimeline(project);assert.deepEqual(timeline.texts.map(t=>[t.start,t.dur,t.title]),[[.2,.4,'Xin chào'],[.7,.4,'Qua điểm cắt'],[1.2,.5,'Cảnh thứ hai']]);
 assert.ok(Math.abs(project.texts[2].at-1.9)<1e-9);assert.equal(project.captions.enabled,false);
 for(const subtitles of [[{from:0,durationInFrames:3,text:'short'}],[{from:0,durationInFrames:90,text:'long'}],[{from:0,durationInFrames:12,text:'transform',transform:{x:.1}}],[{from:0,durationInFrames:15,text:'one'},{from:10,durationInFrames:10,text:'overlap'}]])assert.throws(()=>convertAievProject({...value,subtitles}),/Phụ đề/);
 assert.throws(()=>convertAievProject({...value,subtitleStyle:{fontSizePx:20}}),/subtitleStyle/);
 const repeated=structuredClone(value);repeated.scenes[1].from=.5;assert.throws(()=>convertAievProject(repeated),/đảo thứ tự/);
});
test('AIEV cut adapter preserves source times and refuses unconverted composition tracks',()=>{
 const result=convertAievProject(meta());assert.deepEqual(result.segments.map(s=>[s.in,s.out]),[[.2,1],[1.5,2.5]]);assert.equal(result.audio.autoSfx,false);
 for(const patch of [{scenes:[]},{layers:[{id:'overlay'}]},{captions:[{text:'keep me'}]},{audio:{voice:{src:'voice.wav'}}},{audio:{music:'music.wav'}},{audio:{sfx:{file:'effect.wav'}}},{audio:[]},{audio:42},{width:720}])assert.throws(()=>convertAievProject({...meta(),...patch}));
 for(const patch of [{customEffect:'unsupported'},{render:'render.mp4'},{src:'compositions/one.html'},{speed:0},{zoom:{}},{volume:3},{to:0},{transitionOverlap:5}]){const value=meta();Object.assign(value.scenes[0],patch);assert.throws(()=>convertAievProject(value));}
});
test('AIEV voice starts at output zero across cuts and retains explicit source volume',()=>{
 const value=meta();value.audio.voice='assets/voice.wav';
 for(const [settings,expected] of [[{},1],[{muted:true},0],[{volume:.35},.35]]){
  value.scenes.forEach(s=>Object.assign(s,settings));
  const p=convertAievProject(value);assert.equal(p.audio.voice,expected);
  const clip=p.audio.clips[0];assert.equal(clip.at,.2);assert.equal(clip.from,0);assert.ok(Math.abs(clip.dur-1.8)<1e-9);assert.equal(clip.vol,1);
  // The source anchor must resolve to output zero, even with a discarded opening.
  const timing=audioClipTiming(clip,{srcToOut:at=>at-.2,total:1.8},.6);assert.equal(timing.start,0);assert.equal(timing.duration,.6);
  value.scenes.forEach(s=>{delete s.muted;delete s.volume;});
 }
 value.scenes[1].volume=.5;const mixed=convertAievProject(value);assert.equal(mixed.audio.voice,1);assert.deepEqual(mixed.segments.map(s=>s.audioVolume),[1,.5]);
});
test('AIEV SFX frame positions map through cuts with default gain and frame-rounded media start',()=>{
 const value=meta();value.audio.sfx=[{file:'assets/fx.wav',atFrame:21,mediaStart:.117},{file:'assets/fx.wav',atFrame:36,volume:.7}];
 const clips=convertAievProject(value).audio.clips;
 assert.ok(Math.abs(clips[0].at-.9)<1e-9);assert.equal(clips[0].from,4/30);assert.equal(clips[0].vol,.3);assert.ok(Math.abs(clips[0].dur-1.1)<1e-9);
 assert.ok(Math.abs(clips[1].at-1.9)<1e-9);assert.equal(clips[1].vol,.7);
 for(const patch of [{atFrame:90},{atFrame:-1},{volume:2},{mediaStart:-1},{fadeInSec:11},{fadeOutSec:-.2},{file:''},{unknown:1}]){value.audio.sfx=[{file:'fx.wav',atFrame:0,...patch}];assert.throws(()=>convertAievProject(value),/SFX/);}
 value.audio.sfx=[{file:'fx.wav',atFrame:0}];value.scenes[1].from=.5;assert.throws(()=>convertAievProject(value),/đảo thứ tự/);
});

test('AIEV voice import probes duration, copies bytes and refuses missing, invalid or escaping audio',async t=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'cos-aiev-voice-'));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
 const root=path.join(base,'contentos'),source=path.join(base,'AIEVv2/video-projects/demo');fs.mkdirSync(root);fs.mkdirSync(path.join(source,'assets'),{recursive:true});
 fs.copyFileSync(new URL('./fixture.mp4',import.meta.url),path.join(source,'assets/raw.mp4'));
 const wav=Buffer.alloc(44+16000);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(16000,24);wav.writeUInt32LE(32000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(16000,40);
 for(let i=0;i<8000;i++)wav.writeInt16LE(Math.round(8000*Math.sin(i*2*Math.PI*440/16000)),44+i*2);
 fs.writeFileSync(path.join(source,'assets/voice.wav'),wav);
 const value=meta();value.audio.voice='assets/voice.wav';value.scenes.forEach(s=>s.muted=true);
 const file=path.join(source,'meta.json'),workspace={active:()=>({id:'new'})};
 const run=async()=>{fs.writeFileSync(file,JSON.stringify(value));const e=previewMigration(root,'new').sources[1].entries[0];return importAievProject(root,workspace,{workspaceId:'new',id:e.id,metadataHash:e.metadataHash});};
 const imported=await run(),p=JSON.parse(fs.readFileSync(path.join(root,imported.dir,'project.json')));
 assert.equal(p.audio.voice,0);assert.equal(p.audio.clips[0].dur,.5);assert.deepEqual(fs.readFileSync(path.join(root,imported.dir,p.audio.clips[0].src)),wav);assert.deepEqual(JSON.parse(fs.readFileSync(file)),value);
 value.audio.music={file:'assets/voice.wav',speech:[]};const musicImport=await run(),musicProject=JSON.parse(fs.readFileSync(path.join(root,musicImport.dir,'project.json')));assert.equal(musicProject.audio.musicLoop,'repeat');assert.deepEqual(fs.readFileSync(path.join(root,musicImport.dir,musicProject.audio.music)),wav);
 value.audio.music.file='assets/raw.mp4';await assert.rejects(run(),/Nhạc AIEV/);value.audio.music.file='../escape.wav';await assert.rejects(run());delete value.audio.music;
 value.audio.sfx=[{file:'assets/voice.wav',atFrame:36,mediaStart:.1,volume:.7}];
 const withSfx=await run(),sfxProject=JSON.parse(fs.readFileSync(path.join(root,withSfx.dir,'project.json')));assert.equal(sfxProject.audio.clips.length,2);assert.equal(sfxProject.audio.clips[1].dur,.4);assert.equal(sfxProject.audio.clips[1].from,.1);
 value.audio.sfx[0].fadeInSec=.1;value.audio.sfx[0].fadeOutSec=.1;
 const faded=await run(),fadedProject=JSON.parse(fs.readFileSync(path.join(root,faded.dir,'project.json')));assert.equal(fadedProject.audio.clips[1].fadeIn,.1);assert.equal(fadedProject.audio.clips[1].fadeOut,.1);
 value.audio.sfx[0].fadeInSec=.4;await assert.rejects(run(),/Fade SFX/);value.audio.sfx[0].fadeInSec=.1;
 value.audio.sfx[0].atFrame=51;await assert.rejects(run(),/Fade ra/);value.audio.sfx[0].atFrame=36;
 value.audio.sfx[0].mediaStart=1;await assert.rejects(run(),/bỏ đầu/);value.audio.sfx=[];
 value.audio.voice='assets/raw.mp4';await assert.rejects(run(),/audio/);
 value.audio.voice='assets/missing.wav';await assert.rejects(run());
 value.audio.voice='../escape.wav';await assert.rejects(run());
});
test('AIEV importer probes media, copies independently and rejects stale source and out of range cuts',async t=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'cos-aiev-import-'));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
 const root=path.join(base,'contentos'),source=path.join(base,'AIEVv2/video-projects/demo');fs.mkdirSync(root);fs.mkdirSync(path.join(source,'assets'),{recursive:true});
 fs.copyFileSync(new URL('./fixture.mp4',import.meta.url),path.join(source,'assets/raw.mp4'));
 const file=path.join(source,'meta.json'),value=meta();fs.writeFileSync(file,JSON.stringify(value));
 const workspace={active:()=>({id:'new'})},entry=previewMigration(root,'new').sources[1].entries[0];assert.equal(entry.canImport,true);
 const request={workspaceId:'new',id:entry.id,metadataHash:entry.metadataHash};
 await assert.rejects(importAievProject(root,workspace,{...request,metadataHash:'stale'}),/đã đổi/);
 const imported=await importAievProject(root,workspace,request),project=JSON.parse(fs.readFileSync(path.join(root,imported.dir,'project.json')));
 assert.equal(project.workspaceId,'new');assert.equal(project.contentos.migration.app,'aiev');assert.deepEqual(project.segments.map(s=>[s.in,s.out]),[[.2,1],[1.5,2.5]]);assert.equal(project.source.duration,3);assert.ok(fs.existsSync(path.join(root,imported.dir,'index.html')));
 assert.deepEqual(JSON.parse(fs.readFileSync(file)),value);assert.deepEqual(fs.readFileSync(path.join(root,imported.dir,'assets/raw.mp4')),fs.readFileSync(path.join(source,'assets/raw.mp4')));
 value.scenes[1].to=10;fs.writeFileSync(file,JSON.stringify(value));const changed=previewMigration(root,'new').sources[1].entries[0];await assert.rejects(importAievProject(root,workspace,{...request,metadataHash:changed.metadataHash}),/vượt thời lượng/);
});

test('AIEV inventory and importer refuse source reordering, repetition and unmapped logos before source mutation',async t=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'cos-aiev-order-'));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));const root=path.join(base,'contentos'),source=path.join(base,'AIEVv2/video-projects/demo');fs.mkdirSync(root);fs.mkdirSync(path.join(source,'assets'),{recursive:true});fs.copyFileSync(new URL('./fixture.mp4',import.meta.url),path.join(source,'assets/raw.mp4'));
 const workspace={active:()=>({id:'new'})},file=path.join(source,'meta.json');
 for(const kind of ['reversed','repeated','overlap','watermark']){
  const value=meta();if(kind==='reversed')value.scenes.reverse();if(kind==='repeated')value.scenes[1]={...value.scenes[0],id:'two'};if(kind==='overlap')value.scenes[1].from=.5;if(kind==='watermark')value.watermark={file:'assets/logo.png',unsupportedEffect:true};
  const before=JSON.stringify(value);fs.writeFileSync(file,before);const entry=previewMigration(root,'new').sources[1].entries[0];assert.equal(entry.canImport,false);assert.match(entry.message,kind==='watermark'?/Watermark/:/cảnh 2/);
  await assert.rejects(importAievProject(root,workspace,{workspaceId:'new',id:entry.id,metadataHash:entry.metadataHash}),kind==='watermark'?/Watermark/:/đảo thứ tự/);assert.equal(fs.readFileSync(file,'utf8'),before);assert.equal(fs.existsSync(path.join(root,'workspace/content')),false);
 }
});
