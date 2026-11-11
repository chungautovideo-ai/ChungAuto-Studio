import test from 'node:test';import assert from 'node:assert/strict';
import {normalizePersonSelections,mergePersonSelection} from '../editor/lib/person-selection.js';
import {resolvePersonSourceAdjustment} from '../editor/lib/person-source-adjustments.js';
const src='inputs/raw.mp4',sha256='a'.repeat(64),base={src,sha256,method:'sam2.1-tiny-point-prompt',from:0,fps:1,w:2,h:2,f:[[4,1]]};
test('range adjustments use source clock, explicit zero, source/hash and fallback precedence',()=>{
 const common={personLight:10,bodyWhite:15,bodySmooth:0},source=[{src,sha256,personLight:20,bodyWhite:25,bodySmooth:0}];
 const adjustments={personLight:0,bodyWhite:40,bodySmooth:3},ranges=normalizePersonSelections([{...base,adjustments}]);
 assert.deepEqual(resolvePersonSourceAdjustment(source,src,sha256,common,ranges,0),adjustments);
 assert.deepEqual(resolvePersonSourceAdjustment(source,src,sha256,common,ranges,.999),adjustments);
 assert.equal(resolvePersonSourceAdjustment(source,src,sha256,common,ranges,1),source[0]);
 assert.equal(resolvePersonSourceAdjustment(source,src,'b'.repeat(64),common,ranges,0),common);
 assert.equal(resolvePersonSourceAdjustment(source,'other',sha256,common,ranges,0),common);
 assert.equal(resolvePersonSourceAdjustment(source,src,sha256,common,[],0),source[0]);
 adjustments.bodyWhite=99;assert.equal(ranges[0].adjustments.bodyWhite,40);
});
test('range schema rejects incomplete values and reselecting exact reviewed interval retains adjustments',()=>{
 for(const adjustments of [{},{personLight:0,bodyWhite:101,bodySmooth:0},{personLight:0,bodyWhite:5,bodySmooth:NaN}])assert.throws(()=>normalizePersonSelections([{...base,adjustments}]));
 const first={...base,adjustments:{personLight:0,bodyWhite:35,bodySmooth:4}},second={...base,from:2};
 const result=mergePersonSelection([first,second],base);assert.equal(result.length,2);assert.deepEqual(result[0].adjustments,first.adjustments);assert.equal(result[1].adjustments,undefined);
});
