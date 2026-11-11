import test from 'node:test';import assert from 'node:assert/strict';import {plateGeometry} from '../editor/lib/plate-regions.js';
test('plate polygons preserve tilted vertices and legacy rectangle dimensions',()=>{
 const q=[[.1,.3],[.8,.2],[.82,.4],[.12,.5]],result=plateGeometry({quads:[q]});assert.deepEqual(result.quads,[q]);result.quads[0][0][0]=.5;assert.equal(q[0][0],.1);
 assert.deepEqual(plateGeometry({roi:[.1,.2,.3,.4]}).rois,[[.1,.2,.3,.4]]);
 assert.deepEqual(plateGeometry({roi:[.1,.2,.3,.4]}).quads[0],[[.1,.2],[.4,.2],[.4,.6000000000000001],[.1,.6000000000000001]]);
});
test('plate polygons reject crossed, concave, duplicate, tiny, outside and ambiguous geometry',()=>{
 const square=[[.1,.1],[.3,.1],[.3,.3],[.1,.3]];
 for(const q of [[[.1,.1],[.3,.3],[.3,.1],[.1,.3]],[[.1,.1],[.3,.1],[.15,.15],[.1,.3]],[[.1,.1],[.1,.1],[.3,.3],[.1,.3]],[[0,0],[.001,0],[.001,.001],[0,.001]],[[0,0],[1.1,0],[1,.2],[0,.2]]])assert.throws(()=>plateGeometry({quads:[q]}));
 for(const request of [{quads:[]},{quads:Array(9).fill(square)},{quads:[square],roi:[.1,.1,.2,.2]},{quads:[square],rois:[[.1,.1,.2,.2]]}])assert.throws(()=>plateGeometry(request));
});
