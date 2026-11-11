import test from 'node:test';import assert from 'node:assert/strict';
import {mergePersonPromptPoints} from '../editor/ui/contentos-person-prompt-points.js';
import fs from 'node:fs';import vm from 'node:vm';

test('automatic person prompts retain every manual head/hand/leg and negative point without input mutation',()=>{
 const manual=[[.4,.2,1],[.2,.4,1],[.6,.8,1],[.8,.4,0]],suggested=[[.405,.2,1],[.8,.405,1],[.5,.5,1],[.6,.9,1]],before=structuredClone([manual,suggested]);
 const result=mergePersonPromptPoints(manual,suggested);
 assert.deepEqual(result.points.slice(0,manual.length),manual);assert.equal(result.kept,4);assert.equal(result.added,2);assert.equal(result.skippedNear,2);assert.equal(result.omittedLimit,0);assert.deepEqual([manual,suggested],before);
 result.points[0][0]=0;assert.equal(manual[0][0],.4);
});
test('sixteen-point budget omits suggestions instead of dropping manual exclusion or positive prompts',()=>{
 const existing=Array.from({length:15},(_,i)=>[i/20,.1,i%2]);
 const result=mergePersonPromptPoints(existing,[[.2,.6,1],[.4,.6,1],[.6,.6,1],[.8,.6,1]]);
 assert.equal(result.points.length,16);assert.equal(result.added,1);assert.equal(result.omittedLimit,3);assert.deepEqual(result.points.slice(0,15),existing);
 const full=mergePersonPromptPoints(result.points,[[.9,.9,1]]);assert.equal(full.added,0);assert.equal(full.omittedLimit,1);assert.deepEqual(full.points,result.points);
});
test('invalid suggestions fail before merging; empty manual list accepts valid foreground prompts',()=>{
 assert.deepEqual(mergePersonPromptPoints([],[[.5,.5,1]]).points,[[.5,.5,1]]);
 for(const invalid of [null,[],[[1.1,.5,1]],[[.5,.5,0]],[[NaN,.5,1]],[[.5,.5,1,0]]])assert.throws(()=>mergePersonPromptPoints([[.5,.2,1]],invalid),/không hợp lệ/);
 assert.throws(()=>mergePersonPromptPoints(Array(17).fill([.5,.5,1]),[[.5,.5,1]]),/không hợp lệ/);
});

test('production suggestion callback retains hand and negative prompts; invalid response keeps all points',async()=>{
 const code=fs.readFileSync('editor/ui/contentos-person-selection.js','utf8'),start=code.indexOf("q('[data-suggest]').onclick="),end=code.indexOf("q('[data-track]').onclick=",start);
 assert.ok(start>0&&end>start);
 for(const invalid of [false,true]){
  const manual=[[.4,.2,1],[.2,.5,1],[.85,.4,0]],nodes=new Map([['[data-from]',{value:'0'}],['[data-suggest]',{}]]);let body,statusText='',draws=0;
  const context=vm.createContext({readOnly:false,busy:false,loaded:true,result:null,closed:false,src:'inputs/qa.mp4',points:structuredClone(manual),rememberPoints:()=>{},mergePersonPromptPoints,q:key=>nodes.get(key),controls:()=>{},validate:()=>{},seek:async()=>{},draw:()=>draws++,status:s=>statusText=s,request:async(url,options)=>{body=JSON.parse(options.body);return {ok:true,json:async()=>({result:{points:invalid?[[NaN,.4,1]]:[[.4,.2,1],[.5,.5,1]],warning:'Kiểm vùng người.'}})};}});
  vm.runInContext(code.slice(start,end),context);await nodes.get('[data-suggest]').onclick();
  const points=JSON.parse(JSON.stringify(context.points));assert.deepEqual(body.anchor,manual[0].slice(0,2));assert.deepEqual(points.slice(0,3),manual);assert.equal(context.busy,false);
  if(invalid){assert.deepEqual(points,manual);assert.equal(draws,0);assert.match(statusText,/không hợp lệ/);}else{assert.equal(points.length,4);assert.equal(draws,1);assert.match(statusText,/Giữ 3 điểm.*thêm 1/);}
 }
});
