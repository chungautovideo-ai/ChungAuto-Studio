import test from 'node:test';
import assert from 'node:assert/strict';
import {sameSubmittedJob,ownsWorkingJob} from '../src/services/job-ownership.mjs';
test('late execution callbacks reject replacement, cancelled and differently claimed jobs',()=>{
 const job={createdAt:'2026-11-04',project:'project-a',baseRevision:'r1',candidate:'candidate-a',kind:'revise',execution:{mode:'api',agent:'gateway'},status:'working',claimedBy:{id:'claim-a'}};
 assert.equal(ownsWorkingJob({...job,apiProgress:{step:2}},job),true);
 for(const change of [{createdAt:'new'},{project:'b'},{baseRevision:'r2'},{candidate:'candidate-b'},{completionToken:'new'},{kind:'edit'},{execution:{mode:'cli',agent:'codex'}},{claimedBy:{id:'claim-b'}},{status:'cancelled'},{status:'done'},{status:'waiting'}])assert.equal(ownsWorkingJob({...job,...change},job),false,JSON.stringify(change));
 assert.equal(ownsWorkingJob({...job,claimedBy:null},{...job,claimedBy:null}),false);
 assert.equal(sameSubmittedJob(null,job),false);
 assert.equal(sameSubmittedJob({...job,status:'working',claimedBy:{id:'new'}},job),true);
});
