import test from 'node:test';
import assert from 'node:assert/strict';
import { searchFace, sourceLandmarks, SEARCH_REGIONS } from '../editor/ui/face-search.js';

test('small-face coordinates map back to the original frame',()=>{
  const [p]=sourceLandmarks([{x:.2,y:.4,z:.1}],{x:.25,y:.1,w:.5,h:.6});
  assert.ok(Math.abs(p.x-.35)<1e-10&&Math.abs(p.y-.34)<1e-10);assert.equal(p.z,.1);
});
test('full-frame face avoids crop work',async()=>{
  const points=[{x:.2,y:.4}];
  const result=await searchFace({detect:()=>points,draw:()=>assert.fail('unneeded crop')});
  assert.equal(result.points,points);assert.equal(result.region,null);
});
test('fallback tries previous region and returns source-space points',async()=>{
  const previous={x:.1,y:.2,w:.5,h:.5},drawn=[];
  const result=await searchFace({previous,draw:r=>drawn.push(r),detect:r=>r?[{x:.5,y:.5}]:null});
  assert.deepEqual(drawn,[previous]);assert.deepEqual(result.points,[{x:.35,y:.45}]);
});
test('missing face stays missing and cancellation stops search',async()=>{
  let calls=0;
  assert.equal((await searchFace({draw:()=>{},detect:()=>{calls++;return null;}})).points,null);
  assert.equal(calls,1+SEARCH_REGIONS.length);
  const controller=new AbortController();
  await assert.rejects(searchFace({signal:controller.signal,draw:()=>assert.fail(),detect:()=>{controller.abort();return null;}}),/huỷ/);
});
