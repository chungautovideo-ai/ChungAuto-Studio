import test from 'node:test';import assert from 'node:assert/strict';
import {personSelectionScope,usedPersonSourceRanges} from '../src/services/person-selection-scope.mjs';
const src='inputs/a.mp4',sha='a'.repeat(64),range=(from,to)=>({src,sha256:sha,method:'sam2.1-tiny-point-prompt',from,fps:1,w:2,h:2,f:Array.from({length:to-from},()=>[4,1])});
test('AI scope uses file clock, B-roll output trim and speed, excludes hidden/discarded footage, merges repeated file usage',()=>{
 const project={source:{video:src},segments:[{in:0,out:10,src,mediaStart:20,speed:2},{in:10,out:12,src:'inputs/other.mp4',keep:false},{in:12,out:14,src,mediaStart:25,keep:false}],brolls:[{src,at:8,dur:10,mediaStart:4,speed:2},{src,at:1,dur:1,mediaStart:99,hidden:true}],camera:{beauty:{personSelections:[range(20,22),range(24,30)]}}};
 const before=structuredClone(project),scope=personSelectionScope(project,src,sha);
 assert.deepEqual(scope.usedRanges,[{from:4,to:6},{from:20,to:30}]);assert.deepEqual(scope.uncoveredUsedRanges,[{from:4,to:6},{from:22,to:24}]);assert.equal(scope.mode,'selected-ranges');assert.equal(scope.identityVerified,false);assert.deepEqual(project,before);
 assert.deepEqual(scope.ranges,[{from:20,to:22,fps:1,samples:2},{from:24,to:30,fps:1,samples:6}]);assert.ok(!JSON.stringify(scope).includes('"f"'));
});
test('missing, stale and malformed selected-person state never reports all-people fallback; full coverage handles adjacent selections',()=>{
 const project={source:{video:src},segments:[{in:0,out:6}],camera:{beauty:{personSelections:[range(0,3),range(3,6)]}}};
 assert.deepEqual(personSelectionScope(project,src,sha).uncoveredUsedRanges,[]);
 assert.equal(personSelectionScope(project,src,sha,false).mode,'unavailable');
 const stale=personSelectionScope(project,src,'b'.repeat(64));assert.equal(stale.mode,'unavailable');assert.deepEqual(stale.uncoveredUsedRanges,[{from:0,to:6}]);
 project.camera.beauty.personSelections.push(range(2,4));assert.equal(personSelectionScope(project,src,sha).mode,'unavailable');
 project.camera.beauty.personSelections=[];assert.equal(personSelectionScope(project,src,sha).mode,'all-people');
 assert.deepEqual(usedPersonSourceRanges({source:{video:src},segments:[{in:0,out:2},{in:2,out:4},{in:4,out:6,keep:false}]},src),[{from:0,to:4}]);
});
