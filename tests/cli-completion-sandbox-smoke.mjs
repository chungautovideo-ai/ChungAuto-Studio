import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {spawn,execFile} from 'node:child_process';import {promisify} from 'node:util';
import {claimSessionJob} from '../src/services/session-job-claims.mjs';
import {consumeCompletionHandoff} from '../src/services/cli-completion-handoff.mjs';
const root=process.cwd(),base='http://127.0.0.1:5196',run=promisify(execFile);
const server=spawn(process.execPath,['editor/server.mjs','--home','--port','5196'],{windowsHide:true,stdio:'ignore'});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let original,dir;
async function call(route,body){const r=await fetch(base+route,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const v=await r.json();assert.ok(r.ok,JSON.stringify(v));return v;}
try{
 for(let n=0;n<80;n++){try{await call('/api/ping');break;}catch{await pause(100);}}
 original=(await call('/api/v1/workspaces')).activeId;await call('/api/v1/workspaces',{name:'CLI sandbox handoff QA '+Date.now()});
 const upload=await fetch(base+'/api/new-project?file=fixture.mp4&name=ContentOS-QA-Sandbox-Handoff&noasr=1',{method:'POST',body:fs.readFileSync('tests/fixture.mp4')});assert.ok(upload.ok);dir=(await upload.json()).dir;
 const template=(await call('/api/installed-templates')).items[0].id;
 await call('/api/ai-job',{dir,template,execution:{mode:'session',agent:'codex'},completionMode:'review',background:false,sfxLevel:'tat'});
 const file=path.join(dir,'work/ai-job.json'),job=JSON.parse(fs.readFileSync(file));job.execution.mode='cli';fs.writeFileSync(file,JSON.stringify(job));
 const claimed=claimSessionJob(file,{root,agent:'codex',sessionId:'sandbox-handoff-qa',explicit:true});assert.ok(claimed);
 const candidate=path.resolve(claimed.candidate),project=JSON.parse(fs.readFileSync(candidate));project.title='Sandbox handoff verified';fs.writeFileSync(candidate,JSON.stringify(project));
 const before=fs.readFileSync(path.join(dir,'project.json'),'utf8');
 const helper=path.join(root,'workspace/cache/cli-handoff-qa.cjs');fs.mkdirSync(path.dirname(helper),{recursive:true});
 fs.writeFileSync(helper,`const {execFileSync}=require('node:child_process');execFileSync(process.execPath,['editor/tools/ai-inbox.mjs','--done',${JSON.stringify(dir)},'--claim',${JSON.stringify(claimed.claimedBy.id)},'--tom-tat','QA sandbox handoff'],{stdio:'inherit',env:{...process.env,CONTENTOS_COMPLETION_JOB:${JSON.stringify(path.resolve(dir))},CONTENTOS_COMPLETION_NONCE:'qa-nonce',EDITOR_PORT:'5196'}});`);
 const bin='C:/Users/Admin/AppData/Local/OpenAI/Codex/bin/22cfb1d302613eae/codex.exe';
 const result=await run(bin,['-c','windows.sandbox="mxc"','sandbox','--include-managed-config','--permission-profile',':workspace','--','node',helper],{cwd:root,windowsHide:true,timeout:60000,maxBuffer:65536});
 assert.match(result.stdout,/server/);assert.equal(fs.readFileSync(path.join(dir,'project.json'),'utf8'),before);
 assert.equal(JSON.parse(fs.readFileSync(file)).status,'working');
 await consumeCompletionHandoff(path.resolve(dir),{nonce:'qa-nonce',complete:(kind,body)=>call('/api/ai-'+kind+'/complete',{...body,dir})});
 const finished=JSON.parse(fs.readFileSync(file));assert.equal(finished.status,'done');assert.equal(finished.completionState,'awaiting-review');assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'project.json'))).title,'Sandbox handoff verified');
 assert.equal(fs.existsSync(path.join(dir,'work/render.json')),false);
 const evidence={dir,status:finished.status,completionState:finished.completionState,actualMxc:true,noModel:true,liveUnchangedBeforeServer:true,serverValidatedCandidate:true,noRender:true,scope:'Synthetic fixture title edit via actual MXC CLI and normal HTTP completion validation; not full video quality or real model acceptance.'};
 fs.writeFileSync('docs/CLI_COMPLETION_SANDBOX_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
}finally{if(original)await call('/api/v1/workspaces/active',{id:original}).catch(()=>{});server.kill();}
