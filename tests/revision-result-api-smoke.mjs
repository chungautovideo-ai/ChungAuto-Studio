import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const base='http://127.0.0.1:5180';
async function call(url,body,headers={}){
 const res=await fetch(base+url,body===undefined?{headers}:{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
 return {status:res.status,body:await res.json()};
}
const original=(await call('/api/v1/workspaces')).body;const evidence={};
const file=relative=>new URL('../'+relative,import.meta.url);
let pending;
try{
 await call('/api/v1/workspaces',{name:'Revision result QA '+Date.now(),brand:'ContentOS QA'});
 const res=await fetch(base+'/api/new-project?file=fixture.mp4&name=ContentOS-Smoke-Revision&noasr=1',{method:'POST',body:fs.readFileSync(new URL('./fixture.mp4',import.meta.url))});
 assert.ok(res.ok);const created=await res.json();
 const enqueue=async()=>{
  const p=(await call('/api/project')).body;
  const headers={'X-ContentOS-Project':created.dir,'X-ContentOS-Revision':p.revision};
  const instruction='QA staged candidate only\nB-roll: "'+fileURLToPath(new URL('./',import.meta.url)).replace(/[\\/]$/,'')+'"';
  const inspected=await call('/api/v1/sources/inspect',{text:instruction},headers);
  assert.equal(inspected.status,200);assert.equal(inspected.body.sources[0].status,'ready');
  assert.ok(inspected.body.sources[0].files.some(f=>f.name==='fixture.mp4'));
  const invalid=await call('/api/ai-revise',{instruction,completionMode:'review',execution:{mode:'api',agent:'codex'}},headers);assert.equal(invalid.status,400);
  const r=await call('/api/ai-revise',{instruction,completionMode:'review',execution:{mode:'session',agent:'codex'},project:p.project},headers);
  assert.deepEqual(r.body.job.execution,{mode:'session',agent:'codex'});evidence.executionPinned=true;
  assert.equal(r.body.job.sources[0].role,'broll');assert.ok(r.body.job.sources[0].files.some(f=>f.name==='fixture.mp4'));
  evidence.chatSourceSnapshot=true;
  assert.equal(r.status,200);assert.equal(r.body.job.background,false);pending=r.body.job;
  const latest=(await call('/api/project')).body;
  const currentHeaders={'X-ContentOS-Project':created.dir,'X-ContentOS-Revision':latest.revision};
  const history=await call('/api/ai-revise/history',undefined,currentHeaders);assert.equal(history.status,200);assert.equal(history.body.active.dir,pending.dir);
  const duplicate=await call('/api/ai-revise',{instruction:'duplicate QA',execution:{mode:'session',agent:'codex'}},currentHeaders);assert.equal(duplicate.status,409);assert.equal(duplicate.body.code,'AI_JOB_ACTIVE');
  evidence.historyAndDuplicateGuard=true;
  const skipped=execFileSync(process.execPath,['editor/tools/ai-inbox.mjs','--next','--dir',pending.dir,'--agent','claude'],{encoding:'utf8',windowsHide:true});
  assert.match(skipped,/Không có việc/);assert.equal(JSON.parse(fs.readFileSync(file(pending.dir+'/work/ai-job.json'),'utf8')).status,'waiting');
  evidence.otherAgentSkipped=true;
  const files=pending.sources.flatMap(s=>s.files),index=files.findIndex(f=>f.name==='fixture.mp4');
  const imported=JSON.parse(execFileSync(process.execPath,['editor/tools/nhap-nguon-chat.mjs',pending.dir,String(index)],{encoding:'utf8',windowsHide:true}));
  assert.equal(imported.asset.sha256.length,64);assert.ok(fs.existsSync(file(created.dir+'/'+imported.asset.path)));
  const repeated=await call('/api/v1/sources/attach-job',{jobDir:pending.dir,path:files[index].path});assert.equal(repeated.body.duplicate,true);
  const outside=await call('/api/v1/sources/attach-job',{jobDir:pending.dir,path:fileURLToPath(new URL('../package.json',import.meta.url))});assert.equal(outside.status,400);
  evidence.selectedImportCliAndDedup=true;
  return pending;
 };
 const job=await enqueue();const candidate=JSON.parse(fs.readFileSync(file(job.candidate),'utf8'));
 candidate.title='ContentOS QA candidate applied';fs.writeFileSync(file(job.candidate),JSON.stringify(candidate));
 const output=execFileSync(process.execPath,['editor/tools/ai-inbox.mjs','--done',job.dir,'--tom-tat','QA applied candidate'],{encoding:'utf8',windowsHide:true});
 assert.match(output,/Đã áp bản sửa/);pending=null;
 assert.equal((await call('/api/project')).body.project.title,candidate.title);evidence.cliCompletion=true;
 assert.equal((await call('/api/ai-revise/complete',{dir:job.dir})).status,409);evidence.duplicateRejected=true;
 const second=await enqueue();const pf=file(created.dir+'/project.json');
 const manual=JSON.parse(fs.readFileSync(pf,'utf8'));manual.title='ContentOS QA manual newer';fs.writeFileSync(pf,JSON.stringify(manual));
 const rejected=await call('/api/ai-revise/complete',{dir:second.dir});assert.equal(rejected.status,409);
 assert.equal(JSON.parse(fs.readFileSync(pf,'utf8')).title,manual.title);assert.ok(fs.existsSync(file(second.candidate)));
 evidence.conflictPreservesManualAndCandidate=true;
}finally{
 if(pending){const f=file(pending.dir+'/work/ai-job.json');const j=JSON.parse(fs.readFileSync(f,'utf8'));fs.writeFileSync(f,JSON.stringify({...j,status:'error',error:'QA finished; conflict preserved intentionally.'},null,2));}
 await call('/api/v1/workspaces/active',{id:original.activeId});
}
fs.writeFileSync(new URL('../docs/REVISION_RESULT_API_SMOKE.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');console.log(evidence);
