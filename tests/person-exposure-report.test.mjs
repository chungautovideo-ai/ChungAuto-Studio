import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {personExposureReport} from '../src/services/person-exposure-report.mjs';
test('compact exposure report excludes masks, binds source hash, preserves all files and omits stale scans',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'person-report-'));
 try{
  fs.mkdirSync(path.join(dir,'inputs'));fs.mkdirSync(path.join(dir,'work'));const file=path.join(dir,'inputs/a.mp4');fs.writeFileSync(file,'fixture');const stat=fs.statSync(file),sha=crypto.createHash('sha256').update('fixture').digest('hex');
  const project={automotiveOptions:{beauty:'off'},segments:[{id:'a',src:'inputs/a.mp4',in:0,out:1}],camera:{beauty:{bodyWhite:10,sourceAdjustments:[{src:'inputs/a.mp4',sha256:sha,personLight:0,bodyWhite:0,bodySmooth:0}]}}};
  const track={src:'inputs/a.mp4',fingerprint:{size:stat.size,mtimeMs:stat.mtimeMs,sha256:sha},fps:15,idx:[1],f:[[1,2]],skin:{w:2,h:2,f:[[4,2]]},exposure:{version:1,method:'display-luma-semantic-mask',person:{samples:10,median:.2,spread:.1,highlight:.5},skin:null}};const face=path.join(dir,'work/face.json');fs.writeFileSync(face,JSON.stringify({v:2,tracks:[track]}));const original=fs.readFileSync(face);
  const report=personExposureReport(dir,project);assert.equal(report.readOnly,true);assert.equal(report.policy.beauty,'off');assert.equal(report.sources[0].current.bodyWhite,0);assert.equal(report.sources[0].suggestion.personLight,30);assert.equal(report.sources[0].ownAdjustment,true);assert.ok(!JSON.stringify(report).includes('"idx"'));assert.ok(!JSON.stringify(report).includes('"runs"'));assert.ok(!('skin' in report.sources[0]));assert.deepEqual(fs.readFileSync(face),original);assert.equal(fs.readFileSync(file,'utf8'),'fixture');
  project.camera.beauty.personSelections=[{src:'inputs/a.mp4',sha256:sha,method:'sam2.1-tiny-point-prompt',from:.25,fps:8,w:2,h:2,f:[[4,1],[4,1]]}];
  const scoped=personExposureReport(dir,project),source=scoped.sources[0];assert.equal(source.selectionScope.mode,'selected-ranges');assert.deepEqual(source.selectionScope.ranges,[{from:.25,to:.5,fps:8,samples:2}]);assert.deepEqual(source.selectionScope.uncoveredUsedRanges,[{from:0,to:.25},{from:.5,to:1}]);assert.match(source.measurementScope,/all people/);assert.equal(scoped.policy.beauty,'off');assert.ok(!JSON.stringify(scoped).includes('"f"'));assert.deepEqual(fs.readFileSync(face),original);
  assert.equal(source.suggestion.available,false);assert.match(source.suggestion.reason,/tất cả người/);
  fs.writeFileSync(file,'changed');const stale=personExposureReport(dir,project);assert.equal(stale.sources.length,0);assert.deepEqual(stale.missing,['inputs/a.mp4']);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
