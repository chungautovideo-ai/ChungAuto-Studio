import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawn,execFile} from 'node:child_process';import {promisify} from 'node:util';import {fileURLToPath} from 'node:url';
import {BRAND_DEFAULT} from '../editor/lib/brand.js';
import {readTemplateSnapshot} from '../src/services/template-snapshots.mjs';
const run=promisify(execFile),base='http://127.0.0.1:5195',delay=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['editor/server.mjs','--home','--port','5195'],{windowsHide:true,stdio:'ignore'});
async function call(url,body,method='POST'){const r=await fetch(base+url,body===undefined?{}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};}
let originalWorkspace;
try{
 for(let i=0;i<60;i++){try{await call('/api/ping');break;}catch{await delay(100);}}
 originalWorkspace=(await call('/api/v1/workspaces')).body.activeId;
 const workspace=(await call('/api/v1/workspaces',{name:'ContentOS-Smoke-Creative '+Date.now()})).body;
 assert.equal((await call('/api/v1/catalogs/import',{})).status,200);
 const entries=(await call('/api/v1/catalogs/local')).body.entries,style=entries.find(e=>e.kind==='style'),prompt=entries.find(e=>e.kind==='prompt');assert.ok(style&&prompt);
 const source=fileURLToPath(new URL('./fixture.mp4',import.meta.url));
 const upload=await fetch(base+'/api/new-project?file=fixture.mp4&name=ContentOS-Smoke-Creative&noasr=1',{method:'POST',body:fs.readFileSync(source)});const project=await upload.json();assert.ok(upload.ok);
 const template=(await call('/api/installed-templates')).body.items[0].id;
 assert.equal((await call('/api/ai-job',{dir:project.dir,template,completionMode:'review',creativeBrief:{styleId:'missing'}})).status,400);
 assert.equal((await call('/api/ai-job',{dir:project.dir,template,useWorkspaceBrand:true})).status,400);
 const savedBrand=(await call('/api/v1/brand-default',{workspaceId:workspace.id,version:0,brand:{...BRAND_DEFAULT,c1:'#123456'}})).body;
 assert.equal(savedBrand.version,1);
 const queued=await call('/api/ai-job',{dir:project.dir,template,useWorkspaceBrand:true,execution:{mode:'session',agent:'codex'},completionMode:'review',creativeBrief:{styleId:style.id,promptId:prompt.id}});assert.equal(queued.status,200,JSON.stringify(queued.body));
 assert.equal(queued.body.job.brandSnapshot.brand.c1,'#123456');
 assert.equal(JSON.parse(fs.readFileSync(queued.body.job.candidate,'utf8')).brand.c1,'#123456');
 await call('/api/v1/brand-default',{workspaceId:workspace.id,version:1,brand:{...BRAND_DEFAULT,c1:'#654321'}});
 assert.equal(JSON.parse(fs.readFileSync(path.join(project.dir,'work/ai-job.json'),'utf8')).brandSnapshot.brand.c1,'#123456');
 assert.equal(queued.body.job.creativeBrief.entries.length,2);assert.deepEqual(queued.body.job.creativeBrief.entries[0].payload,style.payload);
 const selected=queued.body.job.templateSnapshot;assert.equal(selected.id,template);const pinned=readTemplateSnapshot(path.resolve(selected.directory),selected);assert.ok(pinned.template);assert.equal(typeof selected.templateHash,'string');
 const inbox=await run(process.execPath,['editor/tools/ai-inbox.mjs','--next','--dir',project.dir,'--agent','codex'],{env:{...process.env,EDITOR_PORT:'5195'},windowsHide:true});assert.match(inbox.stdout,/ĐỊNH HƯỚNG SÁNG TẠO/);assert.ok(inbox.stdout.includes(style.hash));assert.ok(inbox.stdout.includes('#123456'));
 assert.ok(inbox.stdout.replaceAll('\\','/').includes(selected.directory.replaceAll('\\','/')));
 fs.writeFileSync(path.join(project.dir,'work/ai-job.json'),JSON.stringify({...queued.body.job,status:'cancelled'}));
 const fixtureFile=path.join(project.dir,'project.json'),fixtureProject=JSON.parse(fs.readFileSync(fixtureFile,'utf8'));fixtureProject.template={id:template};fs.writeFileSync(fixtureFile,JSON.stringify(fixtureProject,null,2)+'\n');
 const current=(await call('/api/project')).body;
 const headers={'Content-Type':'application/json','X-ContentOS-Project':project.dir,'X-ContentOS-Revision':current.revision};
 async function revise(creativeBrief){const response=await fetch(base+'/api/ai-revise',{method:'POST',headers,body:JSON.stringify({instruction:'QA reference only',useWorkspaceBrand:true,completionMode:'review',execution:{mode:'session',agent:'codex'},creativeBrief})});return {status:response.status,body:await response.json()};}
 assert.equal((await revise({styleId:'missing'})).status,400);
 const revised=await revise({styleId:style.id,promptId:prompt.id});assert.equal(revised.status,200,JSON.stringify(revised.body));assert.deepEqual(revised.body.job.creativeBrief,queued.body.job.creativeBrief);assert.equal(revised.body.job.completion.mode,'review');assert.deepEqual(revised.body.job.execution,{mode:'session',agent:'codex'});
 assert.equal(revised.body.job.brandSnapshot.brand.c1,'#654321');assert.equal(JSON.parse(fs.readFileSync(revised.body.job.candidate,'utf8')).brand.c1,'#654321');
 const reviseSelected=revised.body.job.templateSnapshot;assert.equal(reviseSelected.id,template);assert.equal(readTemplateSnapshot(path.resolve(reviseSelected.directory),reviseSelected).manifest.templateHash,selected.templateHash);
 const reviseInbox=await run(process.execPath,['editor/tools/ai-inbox.mjs','--next','--dir',revised.body.job.dir,'--agent','codex'],{env:{...process.env,EDITOR_PORT:'5195'},windowsHide:true});assert.match(reviseInbox.stdout,/ĐỊNH HƯỚNG SÁNG TẠO/);assert.ok(reviseInbox.stdout.includes(prompt.hash));
 assert.ok(reviseInbox.stdout.replaceAll('\\','/').includes(reviseSelected.directory.replaceAll('\\','/')));
 fs.writeFileSync(path.join(revised.body.job.dir,'work/ai-job.json'),JSON.stringify({...revised.body.job,status:'cancelled'}));
 fs.writeFileSync('docs/CREATIVE_BRIEF_API_SMOKE.json',JSON.stringify({workspaceId:workspace.id,project:project.dir,unknownSelectionRejected:true,styleId:style.id,promptId:prompt.id,snapshotMatchesCatalog:true,brandSnapshotStableAfterDefaultChange:true,brandCandidateFirstBuildAndRevise:true,brandInSessionInbox:true,firstBuildTemplateSnapshot:true,reviseTemplateSnapshot:true,inboxUsesPinnedRules:true,inboxIncludesSnapshot:true,reviseSnapshotAndInbox:true,executionAndCompletionUnchanged:true,noAgentDispatched:true,notTimelineEffectVerification:true},null,2)+'\n');
 console.log('Workspace catalog selection to AI job/inbox passed; no agent dispatched.');
}finally{if(originalWorkspace)await call('/api/v1/workspaces/active',{id:originalWorkspace});server.kill();}
