import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {execFileSync} from 'node:child_process';
import {crossfadeMusicParts,crossfadeMusicMixParts} from '../editor/lib/music-loop.js';
import {buildHtml} from '../editor/lib/build.mjs';
import {capcutAudioTags,capcutAudioMix} from '../editor/lib/capcut-audio.mjs';

test('adaptive crossfade covers short/long sources through exact video end without source overread',()=>{
 for(const [total,source] of [[4,1],[8,2],[17,6],[24,8],[3,10],[1,1],[.3,.1],[6.00001,6]]){
  const parts=crossfadeMusicParts(total,source);assert.equal(parts[0].start,0);assert.ok(Math.abs(parts.at(-1).start+parts.at(-1).duration-total)<1e-8);
  for(const [i,p] of parts.entries()){
   assert.ok(p.duration>0&&p.duration<=source+1e-8);assert.equal(p.offset,0);assert.ok(p.fadeIn+p.fadeOut<=p.duration+1e-8);assert.equal(p.track,i%2);
   if(i)assert.ok(p.start<parts[i-1].start+parts[i-1].duration);
  }
  for(let t=.001;t<total-.001;t+=.019){const active=parts.filter(p=>t>=p.start&&t<p.start+p.duration);assert.ok(active.length>=1&&active.length<=2);}
 }
 assert.throws(()=>crossfadeMusicParts(3,0));assert.throws(()=>crossfadeMusicParts(Infinity,1));assert.throws(()=>crossfadeMusicParts(3000,.1),/2000/);
});

test('composed short-loop gain preserves global fades and speech even when fade/duck/loop edges intersect',()=>{
 for(const [total,source] of [[8,2],[3,.6],[3,10],[8,6]])for(const fade of [0,.4]){
  const windows=[{start:.8,duration:.6},{start:1.3,duration:.6}],parts=crossfadeMusicMixParts(total,source,windows,{enabled:true,level:.25,fade});
  const clamp=n=>Math.max(0,Math.min(1,n));
  for(let t=.001;t<total;t+=.011){
   let duck=0;for(const w of windows)duck=Math.max(duck,fade?Math.min(clamp((t-w.start+fade)/fade),clamp((w.start+w.duration+fade-t)/fade)):Number(t>=w.start&&t<w.start+w.duration));
   const expected=Math.max(0,Math.min(1,t/Math.min(1.2,total/2),(total-t)/Math.min(2,total/2)))*(1-.75*duck);
   const gain=parts.filter(p=>t>=p.start&&t<p.start+p.duration).reduce((sum,p)=>sum+p.gain*(p.fadeIn?(t-p.start)/p.duration:p.fadeOut?1-(t-p.start)/p.duration:1),0);
   assert.ok(Math.abs(gain-expected)<.002,`${total}/${source}/${fade} at ${t}: ${gain} vs ${expected}`);
  }
  for(const p of parts)assert.ok(p.offset+p.duration<=source+1e-8);
 }
});

test('build and CapCut stem keep real short-music signal beyond first loop, through outro and speech ducking',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-short-music-'));
 try{
  const ff=args=>execFileSync('ffmpeg',['-nostdin','-v','error',...args],{cwd:dir,windowsHide:true,maxBuffer:4*1024*1024});
  ff(['-f','lavfi','-i','sine=frequency=660:duration=2','music.wav']);ff(['-f','lavfi','-i','sine=frequency=330:duration=1','voice.wav']);
  const project={source:{video:'source.mp4',duration:6,width:360,height:640,hasAudio:false},segments:[{id:'s',in:0,out:6}],endCard:{enabled:true,duration:2,title:'QA'},audio:{music:'music.wav',musicVolume:.3,musicLoop:'crossfade',sfxLevel:'tat',duckNarration:true,duckLevel:.25,duckFade:0,clips:[{id:'v',src:'voice.wav',at:3,dur:1,vol:1}]}};
  const tags=capcutAudioTags(buildHtml(project,dir),/id="music/,dir);assert.ok(tags.length>=5);
  for(const tag of tags)assert.ok(tag.from+tag.dur<=2.002,'source bounds');
  const mix=capcutAudioMix(tags,8);fs.writeFileSync(path.join(dir,'mix.txt'),mix.script);ff([...mix.inputs,'-/filter_complex','mix.txt','-map','[out]','-ar','16000','mix.wav']);
  const pcm=ff(['-i','mix.wav','-ac','1','-ar','16000','-f','f32le','pipe:1']);
  const rms=(a,b)=>{let sum=0,n=0;for(let i=Math.floor(a*16000);i<b*16000;i++){sum+=pcm.readFloatLE(i*4)**2;n++;}return Math.sqrt(sum/n);};
  assert.ok(rms(2.5,2.6)>.01,'music after source end');assert.ok(rms(6.5,6.6)>.005,'music during outro');
  assert.ok(rms(3.4,3.5)<rms(2.5,2.6)*.5,'duck during narration');assert.ok(rms(7.9,7.98)<rms(6.5,6.6)*.4,'fade at final end');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
