import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {plateReviewStatus,approvePlateReview,assertReviewedSnapshot} from '../src/services/plate-review.mjs';import {projectRevision} from '../src/services/project-revisions.mjs';
test('plate visual review pins human declaration to saved revision and media; unreviewed auto CLI never renders',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-review-')),folder=path.join(dir,'inputs/privacy',crypto.randomUUID());fs.mkdirSync(folder,{recursive:true});
 const media=path.join(folder,'masked.mp4');fs.writeFileSync(media,'fixture-media-no-render');const src=path.relative(dir,media).replaceAll('\\','/'),sha256=crypto.createHash('sha256').update(fs.readFileSync(media)).digest('hex');
 const project={source:{video:'inputs/raw.mp4'},segments:[{id:'s',in:0,out:1,src,mediaStart:0,platePrivacy:{kind:'plate-privacy',sha256}}]},file=path.join(dir,'project.json');fs.writeFileSync(file,JSON.stringify(project));let revision=projectRevision(file);
 try{
  assert.equal(plateReviewStatus(dir,project,revision).approved,false);assert.throws(()=>approvePlateReview(dir,project,revision),/Xác nhận/);
  assert.throws(()=>execFileSync(process.execPath,['editor/tools/xuat-video.mjs',dir,'--auto-export','--revision',revision],{windowsHide:true,stdio:'pipe'}));assert.equal(fs.existsSync(path.join(dir,'renders')),false,'blocked before render/snapshot');assert.match(JSON.parse(fs.readFileSync(path.join(dir,'work/render.json'))).log,/kiểm tra/);
  assert.equal(approvePlateReview(dir,project,revision,{confirmed:true}).approved,true);assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'work/plate-review.json'))).method,'user-declared-visual-review');
  assertReviewedSnapshot(dir,project,revision,{assets:[{path:src,sha256}]});assert.throws(()=>assertReviewedSnapshot(dir,project,revision,{assets:[{path:src,sha256:'changed'}]}),/snapshot khác/);
  const changed={...project,title:'new'};fs.writeFileSync(file,JSON.stringify(changed));assert.throws(()=>plateReviewStatus(dir,changed,revision),/thay đổi/);revision=projectRevision(file);assert.equal(plateReviewStatus(dir,changed,revision).approved,false);
  assert.equal(approvePlateReview(dir,changed,revision,{confirmed:true}).approved,true);fs.appendFileSync(media,'changed');assert.match(plateReviewStatus(dir,changed,revision).reason,/đã đổi/);assert.throws(()=>approvePlateReview(dir,changed,revision,{confirmed:true}),/đã đổi/);
  const noProof=structuredClone(changed);delete noProof.segments[0].platePrivacy;fs.writeFileSync(file,JSON.stringify(noProof));assert.equal(plateReviewStatus(dir,noProof,projectRevision(file)).approved,false,'privacy path cannot bypass by deleting project proof');
  noProof.segments[0].keep=false;fs.writeFileSync(file,JSON.stringify(noProof));assert.equal(plateReviewStatus(dir,noProof,projectRevision(file)).required,false,'removed segment is not published');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
