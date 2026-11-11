// Validate artifacts produced by local CUDA inference on the QA moving occluder.
// This fixture is not an independently filmed human occlusion/identity benchmark.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {mergePersonSelection,applyPersonSelection,personTrackingError} from '../editor/lib/person-selection.js';
const reports=['before','after'].map(n=>JSON.parse(fs.readFileSync(`workspace/cache/person-sam2-occlusion-${n}-result.json`)));
const error=fs.readFileSync('workspace/logs/person-moving-occluder-inference.log','utf8');
assert.match(error,/Mask changed abruptly \(area-change\) at source time 3.000/);
assert.equal(fs.existsSync('workspace/cache/person-sam2-moving-occluder6-result.json'),false);
assert.equal(fs.existsSync('workspace/cache/person-sam2-occluded6-result.json'),false);
assert.match(fs.readFileSync('workspace/logs/person-occlusion-inference.log','utf8'),/Possible scene cut at source time 2.500/);
let selections=[];
for(const r of reports){assert.equal(r.maskGuard.identityVerified,false);assert.equal(r.requiresVisualReview,true);selections=mergePersonSelection(selections,{src:'inputs/qa.mp4',sha256:r.sourceSha256,method:r.method,from:r.from,fps:r.fps,w:r.w,h:r.h,f:r.f});}
const selectedPixels=time=>{const pixels=new Uint8ClampedArray(144*256*4).fill(255);applyPersonSelection(pixels,144,256,selections,'inputs/qa.mp4',reports[0].sourceSha256,time);let count=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]||pixels[i+1])count++;return count;};
const times=[0,2.75,2.875,3,3.5,4.499,4.5,5.875,6],counts=times.map(selectedPixels);
assert.ok(counts[0]>100&&counts[1]>100&&counts[6]>100&&counts[7]>100);
for(const i of [2,3,4,5,8])assert.equal(counts[i],0,'No semantic correction in unselected gap or outside ranges.');
const proof={fixture:'Real six-second speaker proxy plus synthetic moving rectangle; not actual human occlusion.',actualCUDA:true,fullRangeRejected:true,failedOutputsAbsent:true,failures:['shot guard at2.500s with sudden cover','mask area-change at3.000s with moving cover'],shorterDuration:personTrackingError(error,{from:0,duration:6,fps:8}).shorterDuration,ranges:selections.map(s=>({from:s.from,end:s.from+s.f.length/s.fps,frames:s.f.length})),times,semanticSelectedPixelCounts:counts,elapsedSeconds:reports.map(r=>r.elapsedSeconds),requiresVisualReview:true,scope:'Artifact replay and shared mask helper; not new UI apply/Undo/Save/final or identity verification.'};
assert.equal(proof.shorterDuration,2.875);fs.writeFileSync('docs/PERSON_OCCLUSION_RECOVERY_SMOKE.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
