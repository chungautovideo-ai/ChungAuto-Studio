import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {listReviseJobs,activeReviseJob} from '../src/services/revise-jobs.mjs';
test('recover revise history from disk, scoped to project and without treating old errors as active',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-recover-'));
 try{
  const write=(id,job)=>{const dir=path.join(root,'workspace/content/_sua-video',id,'work');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'ai-job.json'),JSON.stringify(job));};
  write('one',{kind:'revise',project:'A',status:'error',createdAt:'2026-01-01'});
  write('two',{kind:'revise',project:'A',status:'working',createdAt:'2026-02-01'});
  write('three',{kind:'revise',project:'B',status:'waiting',createdAt:'2026-03-01'});
  const jobs=listReviseJobs(root,'A');assert.equal(jobs.length,2);assert.equal(jobs[0].status,'working');assert.equal(activeReviseJob(jobs).project,'A');
  assert.equal(activeReviseJob(listReviseJobs(root,'missing')),undefined);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
