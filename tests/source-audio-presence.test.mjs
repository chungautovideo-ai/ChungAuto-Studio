import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {sourceAudioPresence} from '../editor/lib/source-audio-presence.mjs';import {buildHtml} from '../editor/lib/build.mjs';

test('audio presence caches within build, respects explicit metadata, rejects probe errors and foreign paths',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-presence-'));try{
 fs.writeFileSync(path.join(dir,'a.mp4'),'fixture');let calls=0;
 const read=sourceAudioPresence(dir,{probe:()=>{calls++;return {streams:[]};}});assert.equal(read('a.mp4'),false);assert.equal(read('a.mp4'),false);assert.equal(calls,1);assert.equal(read('a.mp4',true),true);assert.equal(read('missing.mp4'),true);
 assert.equal(sourceAudioPresence(dir,{probe:()=>({streams:[{codec_type:'audio'}]})})('a.mp4'),true);
 assert.throws(()=>sourceAudioPresence(dir,{probe:()=>{throw Error('failure');}})('a.mp4'),/Không kiểm tra/);
 assert.throws(()=>read('../outside.mp4',undefined));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('actual video-only and audio sources build correct primary and B-roll audio without changing files',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-presence-real-'));try{
 for(const audio of [false,true])execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','color=red:s=32x32:r=30:d=1',...(audio?['-f','lavfi','-i','sine=frequency=440:duration=1','-c:a','aac']:[]),'-c:v','libx264','-pix_fmt','yuv420p',path.join(dir,audio?'tone.mp4':'silent.mp4')],{windowsHide:true});
 const base={source:{video:'silent.mp4'},segments:[{id:'s',in:0,out:1}],audio:{sfx:'tat'},captions:{enabled:false},brolls:[{id:'b',src:'silent.mp4',at:0,dur:.5,mode:'full',audioVol:1}]},before=structuredClone(base);
 let html=buildHtml(base,dir);assert.doesNotMatch(html,/<audio id="a0"/);assert.doesNotMatch(html,/<audio id="b-a"/);assert.deepEqual(base,before);
 html=buildHtml({...base,source:{video:'tone.mp4'},brolls:[{...base.brolls[0],src:'tone.mp4'}]},dir);assert.match(html,/<audio id="a0"/);assert.match(html,/<audio id="b-a"/);
 // A silent first source must not mute a later clip with audio, even without metadata.
 html=buildHtml({...base,source:{video:'silent.mp4',hasAudio:false,timeline:'segments'},segments:[{id:'s',src:'silent.mp4',mediaStart:0,mediaInfo:{duration:1},in:0,out:1},{id:'t',src:'tone.mp4',mediaStart:0,mediaInfo:{duration:1},in:1,out:2}],brolls:[]},dir);
 assert.match(html,/<audio[^>]+src="tone.mp4"/);assert.doesNotMatch(html,/<audio[^>]+src="silent.mp4"/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
