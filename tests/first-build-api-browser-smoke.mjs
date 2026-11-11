import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-layout-'));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--no-first-run','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try{
 let port;for(let i=0;i<100;i++){try{port=Number(fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]);break;}catch{await delay(100);}}
 assert.ok(port,'Chrome CDP started');
 const pages=await (await fetch(`http://127.0.0.1:${port}/json`)).json();
 ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;});
 let id=0;const pending=new Map(),errors=[];
 ws.onmessage=event=>{const msg=JSON.parse(event.data);if(msg.id){const p=pending.get(msg.id);if(p){pending.delete(msg.id);msg.error?p.reject(new Error(JSON.stringify(msg.error))):p.resolve(msg.result);}}else if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.text+': '+(msg.params.exceptionDetails.exception?.description||''));};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const requestId=++id;pending.set(requestId,{resolve,reject});ws.send(JSON.stringify({id:requestId,method,params}));setTimeout(()=>{if(pending.delete(requestId))reject(new Error('CDP timeout '+method));},10000).unref();});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});


 const proof=JSON.parse(fs.readFileSync('docs/API_EDITOR_API_SMOKE.json','utf8')),dir=proof.project;
 const evidence={syntheticProject:dir,sizes:[],submittedJobs:false};
 for(const width of [1280,1920]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://127.0.0.1:5180/home?pick='+encodeURIComponent(dir)});
  for(let i=0;i<150;i++){if(await evaluate("!!document.querySelector('#setupExecution')"))break;await delay(100);}
  assert.equal(await evaluate("document.querySelector('#setupExecution').value"),'session:auto');
  for(const agent of ['codex','claude']){
   await evaluate("(()=>{const s=document.querySelector('#setupExecution');s.value='cli:"+agent+"';s.dispatchEvent(new Event('change'));const m=document.querySelector('#setupModel');m.value='qa-model-override';m.dispatchEvent(new Event('input'));})()");
   assert.equal(await evaluate("document.querySelector('#setupModelLabel').hidden"),false);
   await evaluate("(()=>{const s=document.querySelector('#setupExecution');s.value='session:"+agent+"';s.dispatchEvent(new Event('change'));})()");
   assert.equal(await evaluate("document.querySelector('#setupModelLabel').hidden"),true);
  }
  const bounds=await evaluate("(()=>{const c=document.querySelector('#setupExecution');c.scrollIntoView({block:'center'});const r=c.getBoundingClientRect();return {left:r.left,right:r.right}})()");assert.ok(bounds.left>=0&&bounds.right<=width);
  assert.match(await evaluate("document.querySelector('#setupExecutionNote').textContent"),/phiên đang mở/);
  evidence.sizes.push({width,sessionDefault:true,bothCliBranchesAndModel:true,sessionHidesModel:true,bounds});
  await evaluate(`(()=>{const original=window.fetch.bind(window);window.fetch=(url,options)=>{if(String(url)==='/api/v1/connections/llm/models')return Promise.resolve(new Response(JSON.stringify({workspaceId:JSON.parse(options.body).workspaceId,models:[{id:'home-list-model'}]}),{headers:{'Content-Type':'application/json'}}));return original(url,options);};const execution=document.querySelector('#setupExecution');execution.value='api:gateway';execution.dispatchEvent(new Event('change'));document.querySelector('.cos-run-model-picker button').click();})()`);
  for(let i=0;i<50;i++){if(await evaluate(`document.querySelector('[aria-label="Chọn model API cho lượt này"]')?.options.length===2`))break;await delay(100);}
  assert.equal(await evaluate(`document.querySelector('#setupModel').value`),'');
  await evaluate(`(()=>{const select=document.querySelector('[aria-label="Chọn model API cho lượt này"]');select.value='home-list-model';select.dispatchEvent(new Event('change'));})()`);assert.equal(await evaluate(`document.querySelector('#setupModel').value`),'home-list-model');evidence.sizes.at(-1).homeModelListSelected=true;
 }
 const installed=await (await fetch('http://127.0.0.1:5180/api/installed-templates')).json();
 await evaluate('localStorage.setItem("home.tpl",'+JSON.stringify(installed.items[0].id)+')');
 await send('Page.reload');for(let i=0;i<150;i++){if(await evaluate("!!document.querySelector('#setupExecution')"))break;await delay(100);}await delay(700);
 await evaluate("document.querySelector('#tplBox .cos-template-details').open=true");
 for(let i=0;i<50;i++){if(await evaluate("document.querySelector('#tplBox .cos-template-details [role=status]').textContent.includes('preset có adapter API')"))break;await delay(100);}
 assert.match(await evaluate("document.querySelector('#tplBox .cos-template-details').textContent"),/SHA256 mẫu:/);evidence.templateDetailsFromSetup=true;
 await evaluate(`(()=>{const original=window.fetch;window.fetch=(url,options)=>{if(url==='/api/ai-job'&&options?.method==='POST'){window.__qaSubmitted=JSON.parse(options.body);return Promise.resolve(new Response(JSON.stringify({ok:false,error:'QA captured request; no agent dispatched'}),{headers:{'Content-Type':'application/json'}}));}return original(url,options);};const s=document.querySelector('#setupExecution');s.value='api:gateway';s.dispatchEvent(new Event('change'));const m=document.querySelector('#setupModel');m.value='qa-model-override';m.dispatchEvent(new Event('input'));document.querySelector('#setupTranscriptLanguage').value='en';const c=document.querySelector('#setupCompletion');c.value='review';c.dispatchEvent(new Event('change'));const brand=document.querySelector('[aria-label="Dùng nhận diện workspace cho lượt AI"]');brand.checked=true;brand.dispatchEvent(new Event('change'));document.querySelector('#go').click();})()`);
 for(let i=0;i<30;i++){if(await evaluate('!!window.__qaSubmitted'))break;await delay(100);}
 const captured=await evaluate('window.__qaSubmitted');assert.deepEqual(captured.execution,{mode:'api',agent:'gateway',model:'qa-model-override'});assert.equal(captured.completionMode,'review');assert.equal(captured.transcriptLanguage,'en');
 assert.equal(captured.useWorkspaceBrand,true);evidence.brandOptInPayload=true;
 evidence.apiSubmissionCapturedWithoutDispatch=true;
 assert.deepEqual(errors,[]);evidence.pageErrors=errors;fs.writeFileSync('docs/FIRST_BUILD_API_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
