import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile),root=process.cwd(),day='ContentOS-Smoke-Claims-'+crypto.randomUUID(),folder=path.join(root,'workspace/content',day);
const relative=file=>path.relative(root,file).replace(/\\/g,'/');
const read=file=>JSON.parse(fs.readFileSync(file));
const inbox=async args=>{try{return {...await run(process.execPath,['editor/tools/ai-inbox.mjs',...args],{cwd:root,windowsHide:true}),code:0};}catch(e){return {stdout:e.stdout,stderr:e.stderr,code:e.code};}};
try{
 const make=name=>{const dir=path.join(folder,name);fs.mkdirSync(path.join(dir,'work'),{recursive:true});return dir;};
 const first=make('first'),second=make('second');
 for(const dir of [first,second])fs.writeFileSync(path.join(dir,'work/ai-job.json'),JSON.stringify({status:'waiting',kind:'install',dir:relative(dir),project:relative(first),zip:'fixture-not-executed.zip',execution:{mode:'session',agent:'codex'}}));
 const a=await inbox(['--next','--dir',relative(first),'--agent','codex','--session','fixture-chat-A']);assert.equal(a.code,0);assert.match(a.stdout,/--claim /);
 const file=path.join(first,'work/ai-job.json'),job=read(file);assert.equal(job.claimedBy.sessionId,'fixture-chat-A');assert.equal(job.status,'working');
 const blocked=await inbox(['--next','--dir',relative(second),'--agent','codex','--session','fixture-chat-B']);assert.equal(blocked.code,0);assert.equal(read(path.join(second,'work/ai-job.json')).status,'waiting');
 const bad=await inbox(['--claim','wrong','--fail',relative(first),'fixture failure']);assert.notEqual(bad.code,0);assert.deepEqual(read(file),job);
 const step=await inbox(['--claim',job.claimedBy.id,'--buoc',relative(first),'2']);assert.equal(step.code,0);assert.equal(read(path.join(first,'work/ai-progress.json')).n,2);
 const done=await inbox(['--claim',job.claimedBy.id,'--done',relative(first)]);assert.equal(done.code,0);assert.equal(read(file).status,'done');
 const b=await inbox(['--next','--dir',relative(second),'--agent','codex','--session','fixture-chat-B']);assert.equal(b.code,0);assert.equal(read(path.join(second,'work/ai-job.json')).claimedBy.sessionId,'fixture-chat-B');
 const secondFile=path.join(second,'work/ai-job.json'),secondJob=read(secondFile),cancelled={...secondJob,status:'cancelled'};fs.writeFileSync(secondFile,JSON.stringify(cancelled));
 for(const action of ['--done','--fail','--buoc']){const denied=await inbox(['--claim',secondJob.claimedBy.id,action,relative(second),'2']);assert.notEqual(denied.code,0);assert.match(denied.stderr,/đã bị hủy/);assert.deepEqual(read(secondFile),cancelled);}
 const build=make('build'),buildFile=path.join(build,'work/ai-job.json');const buildJob={status:'working',completionToken:'fixture-completion',baseRevision:'base',claimedBy:{id:'fixture-owner'}};fs.writeFileSync(buildFile,JSON.stringify(buildJob));
 const response=await fetch('http://127.0.0.1:5180/api/ai-build/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dir:relative(build),token:buildJob.completionToken,claimId:'wrong',revision:'base'})});assert.equal(response.status,409);assert.match((await response.json()).error,/phiên khác/);assert.deepEqual(read(buildFile),buildJob);
 const evidence={actualInbox:true,distinctSessionIdentity:true,projectGate:true,wrongFailRejected:true,ownedProgress:true,ownedCompletion:true,terminalReclaim:true,cancelledSessionWritesRejected:true,httpWrongBuildOwnerRejected:true,syntheticOnly:true,providerCalls:0};
 fs.writeFileSync(path.join(root,'docs/SESSION_INBOX_CLAIMS_SMOKE.json'),JSON.stringify(evidence,null,2));console.log(evidence);
}finally{fs.rmSync(folder,{recursive:true,force:true});}
