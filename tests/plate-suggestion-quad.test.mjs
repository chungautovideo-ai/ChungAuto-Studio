import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
import {plateSuggestionGeometry} from '../editor/lib/plate-regions.js';
const quad=[[.2,.4],[.7,.3],[.72,.45],[.22,.55]],roi=[.2,.3,.52,.25];
test('suggestion geometry preserves tilted corners, clones inputs and supports old rectangles',()=>{
 const proposals=[{roi,quad},{roi:[.1,.1,.2,.1]}],before=structuredClone(proposals),result=plateSuggestionGeometry(proposals);
 assert.deepEqual(result[0].quad,quad);assert.equal(result[1].quad,undefined);
 result[0].quad[0][0]=0;result[1].roi[0]=0;assert.deepEqual(proposals,before);
 for(const invalid of [null,Array(9).fill({roi}),[{roi,quad:[quad[0],quad[2],quad[1],quad[3]]}],[{roi:[0,0,.001,.001],quad}],[null]])assert.throws(()=>plateSuggestionGeometry(invalid));
});
test('production Use callback keeps manual selection on invalid batch, and installs corners only on explicit Use',()=>{
 const code=fs.readFileSync('editor/ui/contentos-plate-privacy.js','utf8'),start=code.indexOf('useSuggestion.onclick='),end=code.indexOf('regionSelect.onchange=',start);assert.ok(start>0&&end>start);
 for(const invalid of [false,true]){
  const original=[.1,.2,.3,.1],regions=[original],quadMap=new Map([[original,[[.1,.2],[.4,.2],[.4,.3],[.1,.3]]]]),before=structuredClone([...quadMap.values()]);let calls=0;
  const context=vm.createContext({validate:()=>{},busy:false,suggestions:invalid?[{roi,quad},{roi,quad:[[0,0],[1,1],[1,0],[0,1]]}]:[{roi,quad}],regions,quadMap,roi:original,plateSuggestionGeometry,sync:()=>calls++,refreshRegions:()=>calls++,useSuggestion:{hidden:false},state:{textContent:''}});
  vm.runInContext(code.slice(start,end),context);assert.equal(regions[0],original);assert.deepEqual([...quadMap.values()],before);
  context.useSuggestion.onclick();
  if(invalid){assert.equal(regions[0],original);assert.deepEqual([...quadMap.values()],before);assert.equal(calls,0);assert.match(context.state.textContent,/4 góc/);}
  else{assert.deepEqual(quadMap.get(regions[0]),quad);assert.equal(calls,2);assert.equal(context.useSuggestion.hidden,true);assert.match(context.state.textContent,/chỉnh viền/);}
 }
});
