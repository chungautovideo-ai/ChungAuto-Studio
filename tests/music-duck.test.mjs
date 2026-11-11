import test from 'node:test';import assert from 'node:assert/strict';import {musicDuckParts,smoothMusicDuckParts} from '../editor/lib/music-duck.js';
test('music duck merges narration output windows, clips loop bounds and preserves source offsets',()=>{
 const ranges=[{start:2,duration:2},{start:3,duration:2},{start:-1,duration:2},{start:20,duration:2},{start:NaN,duration:1}];
 assert.deepEqual(musicDuckParts(0,6,ranges,{enabled:true,level:.2}),[{start:0,duration:1,offset:0,gain:.2},{start:1,duration:1,offset:1,gain:1},{start:2,duration:3,offset:2,gain:.2},{start:5,duration:1,offset:5,gain:1}]);
 assert.deepEqual(musicDuckParts(4,4,ranges,{enabled:true,level:.2}),[{start:4,duration:1,offset:0,gain:.2},{start:5,duration:3,offset:1,gain:1}]);
 assert.deepEqual(musicDuckParts(0,6,ranges),[{start:0,duration:6,offset:0,gain:1}]);assert.equal(musicDuckParts(0,1,[{start:0,duration:1}],{enabled:true,level:-1})[0].gain,0);
});

test('smooth duck keeps phase-aligned low bed and bounded complementary fades across narrow gaps',()=>{
 const parts=smoothMusicDuckParts(0,8,[{start:3,duration:2}],{level:.25,fade:.4});
 assert.deepEqual(parts[0],{start:0,duration:8,offset:0,gain:.25,bed:true});
 assert.deepEqual(parts.slice(1).map(p=>[p.start,p.duration,p.offset,p.gain,p.fadeIn,p.fadeOut]),[[0,3,0,.75,0,.4],[5,3,5,.75,.4,0]]);
 const gaps=smoothMusicDuckParts(0,8,[{start:1,duration:2},{start:3.2,duration:1}],{level:0,fade:2});
 const middle=gaps.find(p=>p.overlay&&p.start===3);assert.ok(Math.abs(middle.fadeIn-.1)<1e-8);assert.ok(Math.abs(middle.fadeOut-.1)<1e-8);
 assert.deepEqual(smoothMusicDuckParts(0,8,[],{fade:.4}),[{start:0,duration:8,offset:0,gain:1}]);
 assert.deepEqual(smoothMusicDuckParts(0,8,[{start:0,duration:8}],{level:.25,fade:.4}),[{start:0,duration:8,offset:0,gain:.25,bed:true}]);
});
