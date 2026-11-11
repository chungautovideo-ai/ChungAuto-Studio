import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {audioClipTiming} from '../editor/lib/audio-clips.js';import {makeTimemap} from '../editor/lib/timemap.js';import {buildHtml} from '../editor/lib/build.mjs';
test('narration uses source anchor, media trim and output bounds in actual HyperFrames build',()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-audio-clips-'));
 try{
  fs.mkdirSync(path.join(folder,'inputs'));execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','sine=frequency=440:duration=2',path.join(folder,'inputs/voice.wav')],{windowsHide:true});
  const p={source:{video:'inputs/source.mp4',duration:8,width:360,height:640},segments:[{id:'s1',in:0,out:2,keep:true},{id:'s2',in:4,out:8,keep:true}],audio:{autoSfx:false,clips:[{src:'inputs/voice.wav',at:5,from:0.5,dur:10,vol:0.7}]}};
  const tm=makeTimemap(p);assert.deepEqual(audioClipTiming(p.audio.clips[0],tm,2),{start:3,duration:1.5,from:0.5,volume:0.7});
  const html=buildHtml(p,folder);assert.match(html,/<audio id="aclip0" data-start="3" data-duration="1.5" data-media-start="0.5"[^>]+data-volume="0.7" src="inputs\/voice.wav"/);
  p.source.hasAudio=false;assert.doesNotMatch(buildHtml(p,folder),/<audio id="a0"/);assert.match(buildHtml(p,folder),/<audio id="aclip0"/);
  p.audio.clips[0].fadeIn=.2;p.audio.clips[0].fadeOut=.3;assert.match(buildHtml(p,folder),/data-fade-in="0.2" data-fade-out="0.3"/);
  const scaled=audioClipTiming({...p.audio.clips[0],fadeIn:2,fadeOut:1},tm,2);assert.equal(scaled.fadeIn,1);assert.equal(scaled.fadeOut,.5);
  assert.equal(audioClipTiming({...p.audio.clips[0],fadeIn:-1},tm,2),null);delete p.audio.clips[0].fadeIn;delete p.audio.clips[0].fadeOut;
  for(const changes of [{at:8},{from:3},{dur:-1},{vol:-1},{at:NaN},{hidden:true}])assert.equal(audioClipTiming({...p.audio.clips[0],...changes},tm,2),null);
  p.audio.music='inputs/voice.wav';p.audio.musicVolume=.4;p.audio.duckNarration=true;p.audio.duckLevel=.25;
  // 2s music < 6s output: adaptive crossfade passes stay inside the file (music-crossfade.test).
  const ducked=buildHtml(p,folder);assert.match(ducked,/<audio id="music-xf\d+" data-start="3.333" data-duration="0.667" data-media-start="0.667"[^>]+data-volume="0.1"/);
  p.audio.clips[0].hidden=true;assert.doesNotMatch(buildHtml(p,folder),/data-start="3.333"[^>]+data-volume="0.1"/);delete p.audio.clips[0].hidden;
  p.audio.clips[0].at=8;assert.doesNotMatch(buildHtml(p,folder),/id="aclip/);
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
});
