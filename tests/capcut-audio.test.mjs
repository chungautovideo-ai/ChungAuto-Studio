import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {capcutAudioTags,capcutAudioMix,capcutAudioGroups} from '../editor/lib/capcut-audio.mjs';import {buildHtml} from '../editor/lib/build.mjs';
test('CapCut audio preserves decoded names, source offsets, fades and playback rate with bounded timing',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-capcut-'));try{
 fs.writeFileSync(path.join(dir,'âm & nhạc.wav'),'fixture');
 const tags=capcutAudioTags('<audio id="music" src="âm &amp; nhạc.wav" data-start="1" data-duration="2" data-media-start=".5" data-volume=".4" data-fade-in="2" data-fade-out="2" data-playback-rate="4"></audio><audio id="music-x" src="../outside.wav" data-duration="2"></audio>',/id="music/g,dir);
 assert.equal(tags.length,1);assert.equal(tags[0].src,'âm & nhạc.wav');const mixed=capcutAudioMix(tags,4);assert.match(mixed.script,/atrim=start=0.5:duration=8/);assert.match(mixed.script,/atempo=2,atempo=2/);assert.match(mixed.script,/afade=t=in:st=0:d=1,afade=t=out:st=1:d=1/);assert.match(mixed.script,/adelay=1000\|1000/);
 assert.throws(()=>capcutAudioMix([{...tags[0],dur:NaN}],4));assert.throws(()=>capcutAudioMix(tags,-1));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('CapCut mixer actual encoded audio retains smooth ducking from built HyperFrames tracks',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-capcut-duck-'));try{
 const ff=args=>execFileSync('ffmpeg',['-nostdin','-v','error',...args],{cwd:dir,windowsHide:true});
 ff(['-f','lavfi','-i','sine=frequency=880:duration=8','music.wav']);ff(['-f','lavfi','-i','sine=frequency=440:duration=2','voice.wav']);
 const project={source:{video:'source.mp4',duration:8,width:360,height:640,hasAudio:false},segments:[{id:'s',in:0,out:8,keep:true}],audio:{music:'music.wav',musicVolume:.4,duckNarration:true,duckLevel:.25,duckFade:.4,autoSfx:false,sfxLevel:'tat',clips:[{src:'voice.wav',at:3,dur:2,vol:.8}]}};
 const tags=capcutAudioTags(buildHtml(project,dir),/id="(music|aclip)/,dir);assert.equal(tags.length,4);
 const {inputs,script}=capcutAudioMix(tags,8);fs.writeFileSync(path.join(dir,'mix.txt'),script);ff([...inputs,'-/filter_complex','mix.txt','-map','[out]','-ar','48000','-c:a','aac','-b:a','192k','mix.m4a']);
 const pcm=ff(['-i','mix.m4a','-af','bandpass=f=880:width_type=h:width=50','-ac','1','-ar','16000','-f','f32le','pipe:1']);
 function rms(a,b){let sum=0,n=0;for(let i=Math.floor(a*16000);i<b*16000;i++){sum+=pcm.readFloatLE(i*4)**2;n++;}return Math.sqrt(sum/n);}
 const before=rms(2,2.6),during=rms(3.6,4.4),attack=rms(2.76,2.84)/before,release=rms(5.16,5.24)/before;
 assert.ok(during/before>.15&&during/before<.35);assert.ok(attack>.4&&attack<.85);assert.ok(release>.4&&release<.85);assert.ok(rms(5.6,5.9)/before>.8);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('CapCut groups preserve independent music/narration/SFX/B-roll and exclude source speech already in base video',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-capcut-stems-'));try{
 fs.writeFileSync(path.join(dir,'audio.wav'),'fixture');
 const html=['music','music-duck1','aclip0','sfx0','b-example-a','a0'].map(id=>`<audio id="${id}" src="audio.wav" data-duration="2"></audio>`).join('');
 const groups=capcutAudioGroups(html,dir);assert.deepEqual(groups.map(g=>g.kind),['music','narration','sfx','broll']);assert.deepEqual(groups.map(g=>g.tags.length),[2,1,1,1]);assert.equal(groups.flatMap(g=>g.tags).some(t=>t.id==='a0'),false);assert.equal(new Set(groups.map(g=>g.file)).size,4);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('CapCut narration stem retains actual clip fades emitted by shared builder',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-clip-fade-'));try{
 const ff=args=>execFileSync('ffmpeg',['-nostdin','-v','error',...args],{cwd:dir,windowsHide:true});
 ff(['-f','lavfi','-i','sine=frequency=880:duration=2','voice.wav']);
 const project={source:{video:'source.mp4',duration:3,width:360,height:640,hasAudio:false},segments:[{id:'s',in:0,out:3,keep:true}],audio:{autoSfx:false,sfxLevel:'tat',clips:[{id:'voice',src:'voice.wav',at:.5,dur:2,vol:.8,fadeIn:.5,fadeOut:.5}]}};
 const tags=capcutAudioTags(buildHtml(project,dir),/id="aclip/,dir);assert.equal(tags[0].fadeIn,.5);assert.equal(tags[0].fadeOut,.5);
 const {inputs,script}=capcutAudioMix(tags,3);fs.writeFileSync(path.join(dir,'mix.txt'),script);ff([...inputs,'-/filter_complex','mix.txt','-map','[out]','-ar','16000','mix.wav']);
 const pcm=ff(['-i','mix.wav','-ac','1','-ar','16000','-f','f32le','pipe:1']);const rms=(a,b)=>{let sum=0,n=0;for(let i=Math.floor(a*16000);i<b*16000;i++){sum+=pcm.readFloatLE(i*4)**2;n++;}return Math.sqrt(sum/n);};const full=rms(1.2,1.5);assert.ok(rms(.55,.6)<full*.3);assert.ok(rms(2.4,2.45)<full*.3);assert.ok(full>.01);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('CapCut music stem retains repeating AIEV speech ducking across source loops',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-repeat-duck-'));try{
 const ff=args=>execFileSync('ffmpeg',['-nostdin','-v','error',...args],{cwd:dir,windowsHide:true});ff(['-f','lavfi','-i','sine=frequency=880:duration=0.6','music.wav']);
 const project={source:{video:'source.mp4',duration:3,width:360,height:640,hasAudio:false},segments:[{id:'s',in:0,out:3,keep:true}],audio:{music:'music.wav',musicVolume:.4,musicLoop:'repeat',musicFadeIn:.1,musicFadeOut:.2,musicSpeech:[[1,2]],musicSpeechLevel:.2,autoSfx:false,sfxLevel:'tat'}};
 const tags=capcutAudioTags(buildHtml(project,dir),/id="music/,dir);const {inputs,script}=capcutAudioMix(tags,3);fs.writeFileSync(path.join(dir,'mix.txt'),script);ff([...inputs,'-/filter_complex','mix.txt','-map','[out]','-ar','16000','mix.wav']);
 const pcm=ff(['-i','mix.wav','-ac','1','-ar','16000','-f','f32le','pipe:1']);const rms=(a,b)=>{let sum=0,n=0;for(let i=Math.floor(a*16000);i<b*16000;i++){sum+=pcm.readFloatLE(i*4)**2;n++;}return Math.sqrt(sum/n);};const full=rms(.4,.5),low=rms(1.4,1.5),restored=rms(2.4,2.5);assert.ok(low/full>.18&&low/full<.22);assert.ok(restored/full>.95&&restored/full<1.05);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('repeat auto duck uses visible audible source-anchored audio clips and preserves manual ranges',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-auto-loop-'));try{
 const ff=args=>execFileSync('ffmpeg',['-nostdin','-v','error',...args],{cwd:dir,windowsHide:true});ff(['-f','lavfi','-i','sine=frequency=880:duration=0.6','music.wav']);ff(['-f','lavfi','-i','sine=frequency=440:duration=1','voice.wav']);
 const project={source:{video:'source.mp4',duration:4,width:360,height:640,hasAudio:false},segments:[{id:'one',in:0,out:1,keep:true},{id:'two',in:2,out:4,keep:true}],audio:{music:'music.wav',musicVolume:.4,musicLoop:'repeat',musicFadeIn:0,musicFadeOut:0,musicSpeech:[[.1,.5]],musicSpeechLevel:.8,duckNarration:true,duckLevel:.2,duckFade:0,autoSfx:false,sfxLevel:'tat',clips:[{id:'voice',src:'voice.wav',at:2,from:0,dur:1,vol:1},{id:'hidden',src:'voice.wav',at:0,dur:1,hidden:true},{id:'silent',src:'voice.wav',at:0,dur:1,vol:0}]}};
 const tags=capcutAudioTags(buildHtml(project,dir),/id="music/,dir);const {inputs,script}=capcutAudioMix(tags,3);fs.writeFileSync(path.join(dir,'mix.txt'),script);ff([...inputs,'-/filter_complex','mix.txt','-map','[out]','-ar','16000','mix.wav']);
 const pcm=ff(['-i','mix.wav','-ac','1','-ar','16000','-f','f32le','pipe:1']);const rms=(a,b)=>{let sum=0,n=0;for(let i=Math.floor(a*16000);i<b*16000;i++){sum+=pcm.readFloatLE(i*4)**2;n++;}return Math.sqrt(sum/n);};const full=rms(.4,.5),low=rms(1.4,1.5),after=rms(2.4,2.5);assert.ok(low/full>.18&&low/full<.22);assert.ok(after/full>.95&&after/full<1.05);assert.deepEqual(project.audio.musicSpeech,[[.1,.5]]);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
