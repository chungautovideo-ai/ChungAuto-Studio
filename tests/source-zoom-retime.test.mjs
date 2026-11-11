import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {shiftSegmentZoom,normalizeSourceZoom} from '../editor/lib/source-zoom.js';
import {trimSourceSegment} from '../editor/lib/segment-trim.js';
const scaleAt=(ease,t)=>ease==='linear'?t:ease==='out'?1-(1-t)**3:t<.5?4*t**3:1-(-2*t+2)**3/2;
test('trimmed zoom preserves original cubic easing at every sampled output time and holds after last key',()=>{
 const runtime=fs.readFileSync('editor/lib/runtime.js','utf8');const block=runtime.slice(runtime.indexOf('  (E.sourceZooms||[])'),runtime.indexOf('  // ---------- Chữ nhấn'));
 for(const ease of ['linear','out','inOut'])for(const offset of [.25,.8,1.8,3]){
  const calls=[],el={};let initial;
  vm.runInNewContext(block,{E:{sourceZooms:[{id:'x',start:0,zoom:{timeOffset:offset,keys:[{time:0,scale:1,ease},{time:2,scale:2}]}}]},document:{getElementById:()=>el},tl:{set:(e,p)=>{initial=p.scale;},fromTo:(e,a,b,at)=>calls.push({a,b,at})}});
  for(const time of [0,.1,.3,.7,1,2]){
   let actual=initial;for(const c of calls)if(time>=c.at)actual=c.a.scale+(c.b.scale-c.a.scale)*c.b.ease(Math.min(1,(time-c.at)/c.b.duration));
   const expected=1+scaleAt(ease,Math.min(1,(offset+time)/2));assert.ok(Math.abs(actual-expected)<1e-9,`${ease}/${offset}/${time}: ${actual} != ${expected}`);
  }
 }
});
test('trim and split zoom offsets accumulate in output seconds at clip speed',()=>{
 const s={id:'a',src:'a.mp4',in:0,out:4,mediaStart:1,mediaInfo:{duration:8},speed:2,motionZoom:{keys:[{time:0,scale:1},{time:2,scale:2}]}};
 const segs=[s];trimSourceSegment(segs,'a','l',1,'removed');assert.equal(s.motionZoom.timeOffset,.5);assert.equal(segs[0].motionZoom.timeOffset,undefined);
 const right=structuredClone(s);shiftSegmentZoom(right,1);assert.equal(right.motionZoom.timeOffset,1);assert.equal(s.motionZoom.timeOffset,.5);
 assert.throws(()=>normalizeSourceZoom({...s.motionZoom,timeOffset:Infinity}));
});
