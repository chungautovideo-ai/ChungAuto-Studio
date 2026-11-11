import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const base='http://127.0.0.1:5194',delay=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['editor/server.mjs','--home','--port','5194'],{windowsHide:true,stdio:'ignore'});
async function call(url,body){const response=await fetch(base+url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:response.status,body:await response.json()};}
try{
 for(let i=0;i<60;i++){try{await call('/api/ping');break;}catch{await delay(100);}}
 const upload=await fetch(base+'/api/new-project?file=fixture.mp4&name=ContentOS-Smoke-CandidateReview&noasr=1',{method:'POST',body:fs.readFileSync(new URL('./fixture.mp4',import.meta.url))});assert.ok(upload.ok);const project=await upload.json(),live=path.join(project.dir,'project.json');
 const template=(await call('/api/installed-templates')).body.items[0].id;
 async function conflict(){
  const queued=await call('/api/ai-job',{dir:project.dir,template,completionMode:'auto-export',sfxLevel:'tat',background:false});assert.equal(queued.status,200);const job=queued.body.job;
  const candidateFile=path.resolve(job.candidate),candidate=JSON.parse(fs.readFileSync(candidateFile));candidate.title='AI isolated title '+job.completionToken;fs.writeFileSync(candidateFile,JSON.stringify(candidate,null,2)+'\n');
  const manual=JSON.parse(fs.readFileSync(live));manual.title='Manual edit '+job.completionToken;fs.writeFileSync(live,JSON.stringify(manual,null,2)+'\n');
  assert.equal((await call('/api/ai-build/complete',{dir:project.dir,token:job.completionToken,revision:job.baseRevision})).status,409);
  const stored=JSON.parse(fs.readFileSync(path.join(project.dir,'work/ai-job.json')));assert.equal(stored.errorCode,'CANDIDATE_CONFLICT');assert.equal(stored.status,'error');
  const review=await call('/api/v1/ai-candidate?dir='+encodeURIComponent(project.dir));assert.equal(review.status,200,JSON.stringify(review.body));assert.ok(review.body.changes.some(c=>c.field==='title'&&c.manualChanged&&c.aiChanged));return review.body;
 }
 const first=await conflict();const common={dir:project.dir,currentRevision:first.currentRevision,candidateRevision:first.candidateRevision,action:'apply-ai'};
 assert.equal((await call('/api/v1/ai-candidate',{...common,currentRevision:'stale'})).status,409);
 assert.equal((await call('/api/v1/ai-candidate',{...common,candidateRevision:'stale'})).status,409);
 assert.equal((await call('/api/v1/ai-candidate',common)).status,200);
 assert.match(JSON.parse(fs.readFileSync(live)).title,/^AI isolated title /);assert.ok(fs.readdirSync(path.join(project.dir,'.history')).length);
 assert.equal(JSON.parse(fs.readFileSync(path.join(project.dir,'work/ai-job.json'))).completionState,'awaiting-review');assert.equal(fs.existsSync(path.join(project.dir,'work/render.json')),false);
 assert.equal((await call('/api/v1/ai-candidate',common)).status,409);
 const second=await conflict(),manualBytes=fs.readFileSync(live,'utf8');
 assert.equal((await call('/api/v1/ai-candidate',{dir:project.dir,currentRevision:second.currentRevision,candidateRevision:second.candidateRevision,action:'keep-manual'})).status,200);assert.equal(fs.readFileSync(live,'utf8'),manualBytes);
 const third=await conflict();
 fs.writeFileSync('docs/CANDIDATE_REVIEW_API_SMOKE.json',JSON.stringify({syntheticOnly:true,project:project.dir,conflictStatus:true,manualAndAiChanges:true,staleRevisionRejected:true,staleCandidateRejected:true,explicitApplyWithHistory:true,duplicateRejected:true,keepManualUnchanged:true,noAutomaticRender:true,browserFixture:third.jobDir},null,2)+'\n');
 console.log('Candidate conflict review, explicit apply/history and keep-manual passed.');
}finally{server.kill();}
