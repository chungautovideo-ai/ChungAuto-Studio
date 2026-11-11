import test from 'node:test';import assert from 'node:assert/strict';
import {normalizePersonSourceAdjustments,resolvePersonSourceAdjustment} from '../editor/lib/person-source-adjustments.js';
test('per-source person adjustments preserve explicit zero and isolate file/hash and caller data',()=>{
 const input=[{src:'inputs/a.mp4',sha256:'a'.repeat(64),personLight:0,bodyWhite:25,bodySmooth:0}],values=normalizePersonSourceAdjustments(input),defaults={personLight:50,bodyWhite:60,bodySmooth:70};
 assert.equal(resolvePersonSourceAdjustment(values,input[0].src,input[0].sha256,defaults).personLight,0);
 assert.equal(resolvePersonSourceAdjustment(values,'inputs/b.mp4',input[0].sha256,defaults),defaults);
 assert.equal(resolvePersonSourceAdjustment(values,input[0].src,'b'.repeat(64),defaults),defaults);
 assert.deepEqual(normalizePersonSourceAdjustments(),[]);values[0].bodyWhite=99;assert.equal(input[0].bodyWhite,25);
 for(const extra of [{bodyWhite:101},{bodySmooth:NaN},{sha256:'bad'},{src:''},{personLight:undefined}])assert.throws(()=>normalizePersonSourceAdjustments([{...input[0],...extra}]));
 assert.throws(()=>normalizePersonSourceAdjustments([input[0],input[0]]));
 assert.throws(()=>normalizePersonSourceAdjustments(Array(41).fill(input[0])));
});
