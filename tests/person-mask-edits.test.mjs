import test from 'node:test';import assert from 'node:assert/strict';
import {normalizePersonMaskEdits,applyPersonMaskEdits} from '../editor/lib/person-mask-edits.js';
const sha='a'.repeat(64),src='inputs/a.mp4';
const stroke=(mode,extra={})=>({src,sha256:sha,from:1,to:2,mode,radius:.1,points:[[.2,.5],[.8,.5]],...extra});
const empty=()=>new Uint8Array(20*10*4);
const at=(p,x,y)=>[p[(y*20+x)*4],p[(y*20+x)*4+1]];
test('source-bound brush draws continuous skin/person/erase paths only inside source-time range',()=>{
 const edits=normalizePersonMaskEdits([stroke('skin')]);let p=applyPersonMaskEdits(empty(),20,10,edits,src,sha,1.5);
 assert.deepEqual(at(p,10,5),[255,255]);assert.deepEqual(at(p,0,0),[0,0]);
 for(const [s,h,t] of [['inputs/b.mp4',sha,1.5],[src,'b'.repeat(64),1.5],[src,sha,.99],[src,sha,2]])assert.deepEqual(applyPersonMaskEdits(empty(),20,10,edits,s,h,t),empty());
 p=applyPersonMaskEdits(empty(),20,10,[stroke('person')],src,sha,1.5);assert.deepEqual(at(p,10,5),[255,0]);
 p=applyPersonMaskEdits(p,20,10,[stroke('erase')],src,sha,1.5);assert.deepEqual(p,empty());
 const q=applyPersonMaskEdits(empty(),20,10,[stroke('skin'),stroke('erase',{points:[[.5,.5]]})],src,sha,1.5);assert.deepEqual(at(q,10,5),[0,0]);assert.deepEqual(at(q,5,5),[255,255]);
 assert.deepEqual(applyPersonMaskEdits(empty(),20,10,edits,src,sha,1.5),applyPersonMaskEdits(empty(),20,10,edits,src,sha,1.5));
});
test('mask brush limits reject invalid inputs and clone accepted coordinates',()=>{
 assert.deepEqual(normalizePersonMaskEdits(),[]);
 for(const e of [{radius:0},{radius:.3},{points:[[NaN,0]]},{points:[[2,0]]},{points:[]},{from:2,to:1},{sha256:'wrong'},{mode:'unknown'},{points:Array.from({length:1025},()=>[0,0])}])assert.throws(()=>normalizePersonMaskEdits([stroke('skin',e)]));
 assert.throws(()=>normalizePersonMaskEdits(Array.from({length:257},()=>stroke('skin'))));
 assert.throws(()=>normalizePersonMaskEdits(Array.from({length:17},()=>stroke('skin',{points:Array.from({length:1024},()=>[0,0])}))));
 const original=[stroke('skin')],copy=normalizePersonMaskEdits(original);copy[0].points[0][0]=1;assert.equal(original[0].points[0][0],.2);
});
