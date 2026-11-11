import test from 'node:test';import assert from 'node:assert/strict';
import {musicLoopParts,repeatMusicOptions} from '../editor/lib/music-loop.js';
import {convertAievProject} from '../src/services/aiev-project-adapter.mjs';
test('loop parts preserve phase and global overlapping envelope across repeated short media',()=>{
 for(const [fadeIn,fadeOut] of [[0,0],[.5,1],[2,2],[0,1],[1,0]]){
  const total=3,endOffset=1/30,parts=musicLoopParts(total,.6,{fadeIn,fadeOut,endOffset});
  for(let t=.013;t<total;t+=.017){
   const active=parts.filter(p=>t>=p.start&&t<p.start+p.duration);
   let gain=0;for(const p of active){const local=t-p.start;gain+=p.gain*(p.fadeIn?local/p.duration:p.fadeOut?1-local/p.duration:1);assert.ok(Math.abs((p.offset+local)-(t%.6))<1e-7);}
   const expected=Math.max(0,Math.min(1,fadeIn?t/fadeIn:1,fadeOut?(total-endOffset-t)/fadeOut:1));assert.ok(Math.abs(gain-expected)<1e-7,`${t}: ${gain} != ${expected}`);
  }
 }
 assert.throws(()=>musicLoopParts(3,0));assert.throws(()=>musicLoopParts(3000,.1));assert.throws(()=>musicLoopParts(3,1,{fadeIn:-1}));
});

test('repeat music derives clip windows only when auto duck is on and supports instant edges',()=>{
 const audio={musicSpeech:[[2,2.5]],musicSpeechLevel:.7,duckNarration:true,duckLevel:.2,duckFade:0};
 const options=repeatMusicOptions(audio,[{start:.5,duration:1}]);assert.deepEqual(options.speech,[[.5,1.5]]);assert.equal(options.duckLevel,.2);assert.equal(options.ramp,0);
 const parts=musicLoopParts(3,.6,options);
 const gain=t=>parts.filter(p=>t>=p.start&&t<p.start+p.duration).reduce((v,p)=>v+p.gain*(p.fadeIn?(t-p.start)/p.duration:p.fadeOut?1-(t-p.start)/p.duration:1),0);
 assert.ok(Math.abs(gain(.75)-.2)<1e-8);assert.ok(Math.abs(gain(1.6)-1)<1e-8);
 audio.duckNarration=false;const manual=repeatMusicOptions(audio,[]);assert.deepEqual(manual.speech,[[2,2.5]]);assert.equal(manual.duckLevel,.7);assert.equal(manual.ramp,.4);assert.deepEqual(audio.musicSpeech,[[2,2.5]]);
});
test('AIEV music metadata preserves no-speech loop gain fades and source-frame endpoint',()=>{
 const meta={width:1080,height:1920,fps:30,scenes:[{srcVideo:'raw.mp4',from:0,to:3}],audio:{music:{file:'music.wav'}}};
 const p=convertAievProject(meta);assert.equal(p.audio.music,'music.wav');assert.equal(p.audio.musicLoop,'repeat');assert.equal(p.audio.musicVolume,.35);assert.equal(p.audio.musicFadeIn,.5);assert.equal(p.audio.musicFadeOut,1);assert.equal(p.audio.musicFadeEndOffset,1/30);
 const ducked=convertAievProject({...meta,audio:{music:{...meta.audio.music,speech:[[.5,1.2]],duckVolume:.07}}});assert.deepEqual(ducked.audio.musicSpeech,[[.5,1.2]]);assert.ok(Math.abs(ducked.audio.musicSpeechLevel-.2)<1e-9);
 for(const patch of [{speech:[[1,0]]},{volume:2},{fadeInSec:-1},{unknown:1}])assert.throws(()=>convertAievProject({...meta,audio:{music:{...meta.audio.music,...patch}}}),/Nhạc AIEV/);
});

test('speech duck ramps and global fades preserve AIEV max/min envelope through overlaps and short speech',()=>{
 const speech=[[.2,.9],[.7,1.3],[1.7,1.8]],total=3,duckLevel=.3,fadeIn=.5,fadeOut=1,endOffset=1/30,parts=musicLoopParts(total,.6,{speech,duckLevel,fadeIn,fadeOut,endOffset});
 const clamp=n=>Math.max(0,Math.min(1,n));
 for(let t=.001;t<total;t+=.003){
  let amount=0;for(const [a,b] of speech)amount=Math.max(amount,Math.min(clamp((t-a+.2)/.4),clamp((b+.2-t)/.4)));
  const expected=Math.max(0,Math.min(1,t/fadeIn,(total-endOffset-t)/fadeOut))*(1+(duckLevel-1)*amount);
  const actual=parts.filter(p=>t>=p.start&&t<p.start+p.duration).reduce((sum,p)=>sum+p.gain*(p.fadeIn?(t-p.start)/p.duration:p.fadeOut?1-(t-p.start)/p.duration:1),0);
  assert.ok(Math.abs(actual-expected)<.001,`${t} ${actual} ${expected}`);
 }
 assert.throws(()=>musicLoopParts(3,1,{speech:[[1,0]]}));
});
