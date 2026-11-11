import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawn,execFile} from 'node:child_process';import {promisify} from 'node:util';
import {readTemplateSnapshot} from '../src/services/template-snapshots.mjs';
const run=promisify(execFile),base='http://127.0.0.1:5195',delay=ms=>new Promise(r=>setTimeout(r,ms));const server=spawn(process.execPath,['editor/server.mjs','--home','--port','5195'],{windowsHide:true,stdio:'ignore'});let originalWorkspace,queued,qaDir;
async function call(url,body){const r=await fetch(base+url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const value=await r.json();assert.ok(r.ok,JSON.stringify(value));return value;}
try{
 for(let n=0;n<60;n++){try{await call('/api/ping');break;}catch{await delay(100);}}
 originalWorkspace=(await call('/api/v1/workspaces')).activeId;await call('/api/v1/workspaces',{name:'ContentOS reference snapshot QA '+Date.now()});
 const upload=await fetch(base+'/api/new-project?file=fixture.mp4&name=ContentOS-Smoke-References&noasr=1',{method:'POST',body:fs.readFileSync('tests/fixture.mp4')});const project=await upload.json();assert.ok(upload.ok,JSON.stringify(project));qaDir=project.dir;
 queued=await call('/api/ai-job',{dir:project.dir,template:'chungauto-factory-quang-cao-v50',execution:{mode:'session',agent:'codex'},completionMode:'review',note:'QA snapshot only; no media edit or agent dispatch.'});
 const selected=queued.job.templateSnapshot,pinned=readTemplateSnapshot(path.resolve(selected.directory),selected);assert.equal(selected.references.length,4);assert.equal(pinned.template.presets.length,11);assert.match(pinned.references['references/person.md'],/Xem lại vùng đã lưu/);
 const inbox=await run(process.execPath,['editor/tools/ai-inbox.mjs','--next','--dir',project.dir,'--agent','codex'],{env:{...process.env,EDITOR_PORT:'5195'},windowsHide:true});assert.ok(inbox.stdout.replaceAll('\\','/').includes(selected.directory.replaceAll('\\','/')));
 assert.ok(fs.existsSync(path.join(selected.directory,'references/person.md')));fs.writeFileSync('docs/SKILL_REFERENCES_SESSION_SMOKE.json',JSON.stringify({project:project.dir,template:selected.id,referenceCount:4,presets:11,pinnedPersonReviewGuide:true,inboxUsesPinnedSkill:true,noAgentDispatched:true,noUserProjectModified:true},null,2)+'\n');console.log('Session inbox and pinned reference snapshot passed.');
}finally{
 if(queued&&qaDir){const target=path.join(qaDir,'work/ai-job.json');if(fs.existsSync(target)){const job=JSON.parse(fs.readFileSync(target));fs.writeFileSync(target,JSON.stringify({...job,status:'cancelled',error:'QA complete; no agent dispatched.'}));}}
 if(originalWorkspace)await call('/api/v1/workspaces/active',{id:originalWorkspace});server.kill();
}
