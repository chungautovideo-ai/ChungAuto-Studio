import test from 'node:test';
import assert from 'node:assert/strict';
import {trimSourceSegment} from '../editor/lib/segment-trim.js';
import {makeTimemap} from '../editor/lib/timemap.js';
import {buildHtml} from '../editor/lib/build.mjs';
import {applyEditorFields} from '../src/services/api-editor.mjs';
const fixture=()=>[{id:'a',src:'a.mp4',in:0,out:2,mediaStart:1,mediaInfo:{width:640,height:360,duration:5,hasAudio:true},speed:2},{id:'b',src:'b.mp4',in:2,out:4,mediaStart:0,mediaInfo:{width:640,height:360,duration:2,hasAudio:true}}];
test('trim source end retains playable removed footage and never touches next source',()=>{
 const segs=fixture();trimSourceSegment(segs,'a','r',1,'cut');
 assert.deepEqual(segs.map(s=>[s.id,s.in,s.out,s.mediaStart,s.keep]),[['a',0,1,1,undefined],['cut',1,2,2,false],['b',2,4,0,undefined]]);
 assert.notEqual(segs[0].mediaInfo,segs[1].mediaInfo);
 assert.equal(makeTimemap({segments:segs}).total,2.5);
 trimSourceSegment(segs,'b','r',10,'unused');assert.equal(segs.at(-1).out,4);
});
test('trim source head advances media clock while virtual anchors and compiled audio remain correct',()=>{
 const segs=fixture();trimSourceSegment(segs,'b','l',2.5,'cut');
 assert.equal(segs.at(-1).mediaStart,.5);assert.equal(segs.at(-2).mediaStart,0);
 const p={source:{video:'a.mp4',timeline:'segments',duration:4,width:640,height:360,hasAudio:true},segments:segs,format:{width:1080,height:1920,fps:30},audio:{},texts:[],zooms:[],scenes:[],brolls:[],vfx:[],captions:{},camera:{},transitions:{}};
 const html=buildHtml(p,process.cwd());assert.match(html,/<video id="v1"[^>]*data-media-start="0.5"/);assert.match(html,/<audio id="a1-env0"[^>]*data-media-start="0.5"/);
 assert.equal(makeTimemap(p).total,2.5);
});
test('last source right trim works without a next clip, source expansion is bounded',()=>{
 const segs=fixture();trimSourceSegment(segs,'b','r',3,'cut');assert.equal(segs[1].out,3);assert.equal(segs[2].mediaStart,1);
 const one=[{...fixture()[0],in:2,out:3}];trimSourceSegment(one,'a','l',0,'unused');assert.equal(one[0].in,1);assert.equal(one[0].mediaStart,0);
 assert.throws(()=>trimSourceSegment(one,'a','l',NaN,'x'));
});
test('AI can retain split/trim descendants only from pinned sources with matching metadata',()=>{
 const base={source:{timeline:'segments'},segments:fixture()};const edited=structuredClone(base.segments);
 trimSourceSegment(edited,'b','l',2.5,'new-cut');
 assert.equal(applyEditorFields(base,{segments:edited}).segments.length,3);
 edited[1].mediaInfo.duration=20;assert.throws(()=>applyEditorFields(base,{segments:edited}));edited[1].mediaInfo.duration=2;
 edited[1].id='a';assert.throws(()=>applyEditorFields(base,{segments:edited}));edited[1].id='new-cut';
 edited[2].in=2.4;assert.throws(()=>applyEditorFields(base,{segments:edited}));
});
