import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {cancelStagedJob,stagedJobVersion,canCancelStagedJob} from '../src/services/staged-job-control.mjs';
import {assertClaimOwner} from '../src/services/session-job-claims.mjs';
test('staged cancellation checks current version, refuses claim races and blocks later session completion',()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-cancel-')),file=path.join(folder,'ai-job.json');
 try{
 const job={kind:'revise',status:'working',project:'p',baseRevision:'r',candidate:'c',claimedBy:{id:'owner'},createdAt:'today'};
 fs.writeFileSync(file,JSON.stringify(job));const bytes=fs.readFileSync(file,'utf8');
 assert.equal(canCancelStagedJob(job),true);assert.equal(canCancelStagedJob({...job,candidate:null}),false);assert.equal(canCancelStagedJob({...job,kind:'post'}),false);
 assert.throws(()=>cancelStagedJob(file,'stale'),/đã đổi/);assert.equal(fs.readFileSync(file,'utf8'),bytes);
 fs.writeFileSync(file+'.claim.lock','fixture');assert.throws(()=>cancelStagedJob(file,stagedJobVersion(job)),/đang được nhận/);fs.rmSync(file+'.claim.lock');
 const cancelled=cancelStagedJob(file,stagedJobVersion(job));assert.equal(cancelled.status,'cancelled');assert.equal(cancelled.candidate,'c');assert.throws(()=>assertClaimOwner(cancelled,'owner'),/đã bị hủy/);assert.throws(()=>cancelStagedJob(file,stagedJobVersion(cancelled)),/đã đổi/);
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
});
