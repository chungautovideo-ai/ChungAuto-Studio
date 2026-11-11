import test from 'node:test';import assert from 'node:assert/strict';
import {normalizePersonSelections,applyPersonSelection,mergePersonSelection} from '../editor/lib/person-selection.js';
const sha='a'.repeat(64),src='inputs/a.mp4',selection=()=>({src,sha256:sha,method:'sam2.1-tiny-point-prompt',from:1,fps:8,w:4,h:2,f:[[2,1,2,0,2,1,2,0],[2,0,2,1,2,0,2,1]]});
const pixels=()=>new Uint8Array(8*4*4).fill(255);
test('selected object intersects both person/skin without growth and respects source/hash/source-clock',()=>{
 const s=normalizePersonSelections([selection()]),p=applyPersonSelection(pixels(),8,4,s,src,sha,1);assert.equal(p[0],255);assert.equal(p[0+1],255);assert.equal(p[7*4],0);assert.equal(p[7*4+1],0);
 const later=applyPersonSelection(pixels(),8,4,s,src,sha,1.125);assert.equal(later[0],0);assert.equal(later[7*4],255);
 for(const time of [.99,1.25]){const blank=applyPersonSelection(pixels(),8,4,s,src,sha,time);assert.equal(blank[0],0);assert.equal(blank[7*4],0);}
 assert.equal(applyPersonSelection(pixels(),8,4,s,src,'b'.repeat(64),1)[0],0);
 assert.deepEqual(applyPersonSelection(pixels(),8,4,s,'inputs/b.mp4',sha,1),pixels());
 const empty=new Uint8Array(8*4*4);assert.deepEqual(applyPersonSelection(empty,8,4,s,src,sha,1),empty);
});
test('multiple reviewed shots keep gaps blank, support adjacent ranges and reject overlaps or mixed fingerprints',()=>{
 const first=selection(),second={...selection(),from:2,f:[[2,0,2,1,2,0,2,1],[2,0,2,1,2,0,2,1]]};
 const ranges=mergePersonSelection([first],second);assert.equal(ranges.length,2);
 assert.equal(applyPersonSelection(pixels(),8,4,ranges,src,sha,1)[0],255);
 assert.equal(applyPersonSelection(pixels(),8,4,ranges,src,sha,2)[0],0);
 assert.equal(applyPersonSelection(pixels(),8,4,ranges,src,sha,2)[7*4],255);
 assert.equal(applyPersonSelection(pixels(),8,4,ranges,src,sha,1.5)[7*4],0);
 const adjacent=mergePersonSelection([first],{...second,from:1.25});assert.equal(adjacent.length,2);
 assert.equal(applyPersonSelection(pixels(),8,4,adjacent,src,sha,1.25)[7*4],255);
 assert.equal(mergePersonSelection(ranges,{...second,f:first.f}).length,2,'exact range replacement retains first shot');
 assert.deepEqual(ranges[0],first,'merging must not mutate original range');
 assert.throws(()=>mergePersonSelection(ranges,{...second,from:1.1}),/chồng/);
 assert.throws(()=>mergePersonSelection(ranges,{...second,sha256:'b'.repeat(64),from:3}),/SHA256/);
 assert.throws(()=>normalizePersonSelections(Array.from({length:121},(_,i)=>({...first,from:i}))),/120/);
});
test('selection schema rejects invalid or oversized RLE and clones source data',()=>{
 assert.deepEqual(normalizePersonSelections(),[]);
 for(const v of [{sha256:'bad'},{fps:0},{w:300},{f:[[8,2]]},{f:[[7,1]]},{f:[[0,1,8,0]]},{from:-1}])assert.throws(()=>normalizePersonSelections([{...selection(),...v}]));
 assert.throws(()=>normalizePersonSelections([selection(),selection()]));
 const source=selection(),copy=normalizePersonSelections([source]);copy[0].f[0][0]=99;assert.equal(source.f[0][0],2);
});
