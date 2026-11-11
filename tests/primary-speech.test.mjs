import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {primarySpeechWindows} from '../editor/lib/primary-speech.js';
import {sourceTranscriptClock} from '../editor/lib/source-transcript.js';
import {repeatMusicOptions} from '../editor/lib/music-loop.js';
import {buildHtml} from '../editor/lib/build.mjs';
import {applyEditorFields} from '../src/services/api-editor.mjs';

test('primary speech maps word intersections through cuts/speed, ignores muted sources and ends before outro',()=>{
 const p={source:{video:'inputs/raw.mp4',duration:9},segments:[{id:'a',in:1,out:3,speed:2},{id:'b',in:5,out:6,audioVolume:0},{id:'c',in:7,out:9,mediaInfo:{hasAudio:false}}],audio:{voice:1},endCard:{enabled:true,duration:3,title:'End'}};
 const t={words:[{word:'cut',start:0,end:.5},{word:'across',start:.5,end:1.5},{text:'fast',start:2,end:4},{word:'mute',start:5,end:6},{word:'silent',start:7,end:8}]};
 assert.deepEqual(primarySpeechWindows(p,t),[{start:0,duration:.25},{start:.5,duration:.5}]);
 assert.deepEqual(primarySpeechWindows({...p,audio:{voice:0}},t),[]);
 assert.throws(()=>primarySpeechWindows(p,null),/transcript/);
 const multi={...p,source:{...p.source,timeline:'segments'}};
 assert.throws(()=>primarySpeechWindows(multi,t),/đúng nguồn/);
 assert.equal(primarySpeechWindows(multi,{...t,sourceClock:sourceTranscriptClock(multi)}).length,2);
 const opts=repeatMusicOptions({duckSourceSpeech:true,duckLevel:.2},primarySpeechWindows(p,t));assert.deepEqual(opts.speech,[[0,.25],[.5,1]]);assert.equal(opts.duckLevel,.2);
 assert.throws(()=>applyEditorFields(p,{audio:{duckSourceSpeech:'yes'}}),/hạ nhạc/);
});

test('build uses source speech for both music modes and refuses missing evidence',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'source-speech-'));
 try{
  fs.mkdirSync(path.join(dir,'work'));fs.writeFileSync(path.join(dir,'work/transcript.json'),JSON.stringify({words:[{word:'hello',start:1,end:2}]}));
  const p={source:{video:'inputs/raw.mp4',duration:3},segments:[{id:'s',in:0,out:3}],audio:{music:'kit:ambient-pad',musicVolume:.1,duckSourceSpeech:true,duckLevel:.2,sfxLevel:'tat'},endCard:{enabled:true,duration:2,title:'End'}};
  for(const musicLoop of ['crossfade','repeat']){const html=buildHtml({...p,audio:{...p.audio,musicLoop}},dir);assert.match(html,/data-volume="0.02"/);assert.match(html,/id="root"[^>]+data-duration="5"/);}
  fs.unlinkSync(path.join(dir,'work/transcript.json'));assert.throws(()=>buildHtml(p,dir),/transcript/);
  assert.doesNotThrow(()=>buildHtml({...p,audio:{...p.audio,duckSourceSpeech:false}},dir));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
