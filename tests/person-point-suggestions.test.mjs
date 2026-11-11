import test from 'node:test';import assert from 'node:assert/strict';import {suggestPersonPoints} from '../src/services/person-point-suggestions.mjs';
const encode=values=>{const runs=[];let previous=values[0],count=0;for(const v of values){if(v===previous)count++;else{runs.push(count,previous);count=1;previous=v;}}runs.push(count,previous);return runs;};
test('suggested foreground points stay inside one connected body and avoid ambiguous disconnected people',()=>{
 const w=64,h=64,pixels=Array(w*h).fill(0);for(let y=4;y<60;y++)for(let x=22;x<42;x++)pixels[y*w+x]=y<12?2:1;
 const result=suggestPersonPoints({w,h,runs:encode(pixels)});assert.equal(result.points.length,4);assert.equal(result.requiresVisualReview,true);for(const [x,y,positive] of result.points){assert.equal(positive,1);assert.ok(pixels[Math.floor(y*h)*w+Math.floor(x*w)]>0);}assert.ok(result.points[0][1]<result.points[1][1]);assert.ok(result.points[2][1]>result.points[1][1]);
 for(let y=4;y<60;y++)for(let x=2;x<15;x++)pixels[y*w+x]=1;assert.throws(()=>suggestPersonPoints({w,h,runs:encode(pixels)}),/nhiều vùng/);assert.throws(()=>suggestPersonPoints({w,h,runs:[w*h,0]}),/quá nhỏ/);assert.throws(()=>suggestPersonPoints({w,h,runs:[1,1]}),/thiếu/);
});

test('anchor chooses requested connected person, rejects background/outside instead of falling back',()=>{
 const w=64,h=64,pixels=Array(w*h).fill(0);for(let y=4;y<60;y++){for(let x=4;x<18;x++)pixels[y*w+x]=1;for(let x=38;x<58;x++)pixels[y*w+x]=2;}
 for(const [anchor,left] of [[[.15,.4],true],[[.75,.4],false]]){const result=suggestPersonPoints({w,h,runs:encode(pixels)},anchor);assert.equal(result.anchored,true);assert.ok(result.points.every(p=>left?p[0]<.4:p[0]>.5));}
 assert.throws(()=>suggestPersonPoints({w,h,runs:encode(pixels)},[.5,.4]),/không nằm/);for(const anchor of [[1,.5],[-1,.5],[NaN,.5],[.5]])assert.throws(()=>suggestPersonPoints({w,h,runs:encode(pixels)},anchor),/khung nguồn/);
});
