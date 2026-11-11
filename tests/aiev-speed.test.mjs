import test from 'node:test';import assert from 'node:assert/strict';import {convertAievProject} from '../src/services/aiev-project-adapter.mjs';import {makeTimemap} from '../editor/lib/timemap.js';
const meta={fps:30,width:1080,height:1920,scenes:[{srcVideo:'source.mp4',from:0,to:2,speed:2,durationInFrames:30,fadeInSec:.2},{srcVideo:'source.mp4',from:3,to:4,speed:.5,durationInFrames:60}],subtitles:[{from:15,durationInFrames:12,text:'Fast'},{from:45,durationInFrames:12,text:'Slow'}],audio:{voice:'voice.wav',sfx:[{file:'sfx.wav',atFrame:15},{file:'sfx.wav',atFrame:45}]}};
test('AIEV per-scene speed maps subtitles and SFX into source anchors while voice stays output-time',()=>{
 const p=convertAievProject(meta),tm=makeTimemap(p);assert.equal(tm.total,3);assert.deepEqual(p.segments.map(s=>s.speed),[2,.5]);assert.deepEqual(p.texts.map(t=>t.at),[1,3.25]);assert.deepEqual(p.texts.map(t=>tm.srcToOut(t.at)),[.5,1.5]);assert.deepEqual(p.audio.clips.map(c=>[tm.srcToOut(c.at),c.dur]),[[0,3],[.5,2.5],[1.5,1.5]]);assert.equal(p.segments[0].audioFadeIn,.2);
 const inferred=convertAievProject({...meta,scenes:[{srcVideo:'source.mp4',from:0,speed:2,durationInFrames:30}],subtitles:[],audio:{}});assert.equal(inferred.segments[0].out,2);assert.equal(makeTimemap(inferred).total,1);
});
test('AIEV speed refuses invalid rates, mismatched frame duration, rounding loss and fades beyond output length',()=>{
 for(const change of [{speed:0},{speed:'2'},{speed:5},{speed:2.1},{from:.01},{durationInFrames:31},{fadeInSec:.8,fadeOutSec:.4}])assert.throws(()=>convertAievProject({...meta,scenes:[{...meta.scenes[0],...change}],subtitles:[],audio:{}}));
});
