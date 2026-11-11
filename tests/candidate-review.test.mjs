import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {candidateReview,markCandidateConflict} from '../src/services/candidate-review.mjs';
import {prepareRevisionResult,applyRevisionResult} from '../src/services/revision-results.mjs';
test('candidate comparison preserves base/manual/AI data, scopes workspace and keeps conflicted results',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-review-'));try{
  const project=path.join(root,'workspace/content/2026-11-04/qa'),work=path.join(project,'work'),candidateDir=path.join(work,'build-candidates/token');fs.mkdirSync(work,{recursive:true});const live=path.join(project,'project.json'),original={source:{file:'inputs/test.mp4'},workspaceId:'one',title:'base'};fs.writeFileSync(live,JSON.stringify(original));
  const staged=prepareRevisionResult(project,candidateDir),candidate=path.join(candidateDir,'work/candidate-project.json'),jobFile=path.join(work,'ai-job.json');const job={completionToken:'token',candidate:path.relative(root,candidate),baseRevision:staged.baseRevision,status:'working'};fs.writeFileSync(jobFile,JSON.stringify(job));
  fs.writeFileSync(candidate,JSON.stringify({...original,title:'AI'}));fs.writeFileSync(live,JSON.stringify({...original,title:'manual'}));
  try{applyRevisionResult(project,candidateDir,staged.baseRevision);}catch(error){markCandidateConflict(jobFile,job,error);}
  const review=candidateReview(root,path.relative(root,project),'one');assert.equal(review.status,'error');assert.deepEqual(review.changes,[{field:'title',manualChanged:true,aiChanged:true}]);assert.equal(review.current.title,'manual');assert.equal(review.candidate.title,'AI');assert.equal(review.base.title,'base');
  assert.throws(()=>candidateReview(root,path.relative(root,project),'two'),/workspace/);
  fs.writeFileSync(jobFile,JSON.stringify({...job,candidate:'../outside.json'}));assert.throws(()=>candidateReview(root,path.relative(root,project),'one'));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
