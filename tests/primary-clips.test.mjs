import test from 'node:test';import assert from 'node:assert/strict';
import {appendPrimaryClips} from '../editor/lib/primary-clips.js';import {makeTimemap} from '../editor/lib/timemap.js';import {sourceTranscriptClock} from '../editor/lib/source-transcript.js';
const assets=[{src:'a.mp4',kind:'video',duration:3,width:640,height:360,hasAudio:true},{src:'b.mp4',kind:'video',duration:2,width:360,height:640,hasAudio:false}];
test('append primary footage promotes legacy cuts without moving overlays or source offsets',()=>{
 const p={source:{video:'a.mp4',duration:3},segments:[{id:'a',in:0,out:1},{id:'b',in:1,out:2,keep:false},{id:'c',in:2,out:3}],texts:[{id:'t',at:2,title:'Keep'}],audio:{voice:1}};
 const result=appendPrimaryClips(p,['b.mp4','a.mp4'],assets),next=result.project;
 assert.equal(p.source.timeline,undefined);assert.equal(p.segments[0].src,undefined);assert.equal(next.source.timeline,'segments');assert.deepEqual(next.texts,p.texts);assert.deepEqual(next.segments.slice(0,3).map(s=>s.mediaStart),[0,1,2]);assert.deepEqual(next.segments.slice(3).map(s=>[s.src,s.in,s.out]),[['b.mp4',3,5],['a.mp4',5,8]]);assert.equal(makeTimemap(next).total,7);assert.equal(next.segments[3].speed,1);assert.ok(next.source.hasAudio);assert.ok(sourceTranscriptClock(next));
 assert.throws(()=>appendPrimaryClips({...p,camera:{matte:'m.webm'}},['b.mp4'],assets));assert.throws(()=>appendPrimaryClips(p,['missing.mp4'],assets));
});
test('source selection bounds media clock and speed independently from virtual timeline',()=>{
 const p={source:{video:'a.mp4',duration:3},segments:[{id:'a',in:0,out:3}],audio:{}};
 const result=appendPrimaryClips(p,[{src:'b.mp4',from:.5,to:1.5,speed:2},{src:'b.mp4',from:1,to:2,speed:.5}],assets);
 assert.deepEqual(result.project.segments.slice(1).map(s=>[s.in,s.out,s.mediaStart,s.speed]),[[3,4,.5,2],[4,5,1,.5]]);assert.equal(makeTimemap(result.project).total,5.5);
 for(const item of [{src:'b.mp4',from:-1},{src:'b.mp4',to:3},{src:'b.mp4',from:1,to:.5},{src:'b.mp4',speed:5},{src:'b.mp4',from:NaN},{src:'b.mp4',shell:'x'}])assert.throws(()=>appendPrimaryClips(p,[item],assets));
});


test('insert primary ranges before a selected clip through shared reorder anchors without mutating input',()=>{
 const p={source:{video:'a.mp4',duration:3},segments:[{id:'a',in:0,out:1},{id:'b',in:1,out:3}],texts:[{id:'t',at:1.2,dur:.3}],audio:{clips:[{id:'v',src:'voice.wav',at:1.3,dur:.2}],musicSpeech:[[0,.5]]},captions:{lines:[{id:'c',words:[{w:'B',s:1.2,e:1.4}]}]}};
 const before=JSON.stringify(p),result=appendPrimaryClips(p,[{src:'b.mp4',from:.5,to:1.5,speed:2}],assets,{beforeId:'b'}),next=result.project;
 assert.equal(JSON.stringify(p),before);assert.deepEqual(next.segments.map(s=>s.id),['a',...result.addedIds,'b']);assert.equal(result.start,1);assert.equal(next.segments[1].mediaStart,.5);assert.equal(next.segments[1].speed,2);assert.equal(next.segments[2].mediaStart,1);assert.equal(next.source.duration,4);assert.equal(makeTimemap(next).total,3.5);assert.equal(next.texts[0].at,2.2);assert.equal(next.audio.clips[0].at,2.3);assert.equal(next.captions.lines[0].words[0].s,2.2);assert.deepEqual(next.audio.musicSpeech,[[0,.5]]);
 assert.throws(()=>appendPrimaryClips(p,['b.mp4'],assets,{beforeId:'missing'}),/đích/);assert.throws(()=>appendPrimaryClips(p,['b.mp4'],assets,{beforeId:null}),/đích/);
});


test('playhead insertion splits source/media/audio/zoom clocks then shifts later anchors',()=>{
 const p={source:{video:'a.mp4',duration:3},segments:[{id:'a',in:0,out:3,speed:2,motionZoom:{keys:[{time:0,scale:1},{time:2,scale:2}]},audioFadeIn:.4,audioFadeOut:.4}],texts:[{id:'t',at:2,dur:.2}],audio:{}};
 const original=JSON.stringify(p),r=appendPrimaryClips(p,[{src:'b.mp4',from:.25,to:1.25,speed:.5}],assets,{atSource:1}),clips=r.project.segments;
 assert.equal(JSON.stringify(p),original);assert.equal(clips.length,3);assert.deepEqual(clips.map(s=>[s.in,s.out,s.mediaStart,s.speed]),[[0,1,0,2],[1,2,.25,.5],[2,4,1,2]]);assert.equal(r.start,1);assert.equal(clips[2].motionZoom.timeOffset,.5);assert.equal(clips[2].audioEnvelope.offset,.5);assert.equal(clips[0].audioEnvelope.duration,1.5);assert.equal(r.project.texts[0].at,3);assert.equal(makeTimemap(r.project).total,3.5);
 for(const options of [{atSource:-1},{atSource:4},{atSource:.01},{atSource:NaN},{atSource:1,beforeId:'a'}])assert.throws(()=>appendPrimaryClips(p,['b.mp4'],assets,options));
 assert.equal(appendPrimaryClips(p,['b.mp4'],assets,{atSource:0}).project.segments[0].src,'b.mp4');assert.equal(appendPrimaryClips(p,['b.mp4'],assets,{atSource:3}).project.segments.at(-1).src,'b.mp4');
});
