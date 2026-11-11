import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-layout-'));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--no-first-run','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let ws,previousWorkspace;
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


 const proof=JSON.parse(fs.readFileSync('docs/CREATIVE_BRIEF_API_SMOKE.json','utf8'));
 const base='http://127.0.0.1:5180';
 previousWorkspace=(await (await fetch(base+'/api/v1/workspaces')).json()).activeId;
 await fetch(base+'/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:proof.workspaceId})});
 assert.ok((await fetch(base+'/api/open',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dir:proof.project})})).ok);
 const evidence={project:proof.project,sizes:[],noAgentDispatched:true};
 for(const width of [1280,1920]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:base+'/'});
  for(let i=0;i<150;i++){if(await evaluate("!!document.querySelector('#btnSpace')"))break;await delay(100);}
  await delay(700);await evaluate("document.querySelector('#btnSpace').click()");
  for(let i=0;i<100;i++){if(await evaluate("document.querySelector('[aria-label=\"Phong cách cho AI sửa\"]')?.options.length>1"))break;await delay(100);}
  await evaluate("(()=>{const s=document.querySelector('[aria-label=\"Phong cách cho AI sửa\"]');s.closest('details').open=true;s.value="+JSON.stringify(proof.styleId)+";s.dispatchEvent(new Event('change'));const p=document.querySelector('[aria-label=\"Prompt cho AI sửa\"]');p.value="+JSON.stringify(proof.promptId)+";p.dispatchEvent(new Event('change'));})()");
  assert.ok(await evaluate("document.querySelector('.cos-creative-brief pre').textContent.length>0"));
  await evaluate("document.querySelector('#btnStudio').click();document.querySelector('.ai-fab').click()");
  for(let i=0;i<100;i++){if(await evaluate("document.querySelector('[aria-label=\"Phong cách cho AI sửa\"]')?.value==="+JSON.stringify(proof.styleId)))break;await delay(100);}
  assert.equal(await evaluate("document.querySelector('[aria-label=\"Phong cách cho AI sửa\"]').value"),proof.styleId);
  await send('Page.reload');await delay(1200);await evaluate("document.querySelector('#btnSpace').click()");
  for(let i=0;i<100;i++){if(await evaluate("document.querySelector('[aria-label=\"Prompt cho AI sửa\"]')?.value==="+JSON.stringify(proof.promptId)))break;await delay(100);}
  assert.equal(await evaluate("document.querySelector('[aria-label=\"Prompt cho AI sửa\"]').value"),proof.promptId);
  await evaluate(`Array.from(document.querySelectorAll('.ai-chat button')).find(b=>b.textContent==='Xem công việc AI của dự án').click()`);
  for(let i=0;i<100;i++){if(await evaluate(`!!document.querySelector('dialog[aria-label="Công việc AI của dự án"] .cos-template-version')`))break;await delay(100);}
  const templateVersion=await evaluate(`(()=>{const d=document.querySelector('dialog[aria-label="Công việc AI của dự án"]'),v=d.querySelector('.cos-template-version');v.open=true;const b=d.getBoundingClientRect();return {text:v.textContent,fits:b.left>=0&&b.right<=innerWidth,hash:!!v.querySelector('details')};})()`);
  assert.match(templateVersion.text,/Mẫu đã chốt/);assert.match(templateVersion.text,/Thông số: [a-f0-9]{64}/);assert.equal(templateVersion.fits,true);assert.equal(templateVersion.hash,true);
  await evaluate(`Array.from(document.querySelectorAll('dialog button')).find(b=>b.textContent==='Đóng lịch sử AI').click()`);
  await evaluate(`(()=>{const original=window.fetch;window.fetch=(url,options)=>{if(url==='/api/ai-revise'&&options?.method==='POST'){window.__qaSubmitted=JSON.parse(options.body);return Promise.resolve(new Response(JSON.stringify({ok:false,error:'QA intercepted; no dispatch'}),{status:400,headers:{'Content-Type':'application/json'}}));}return original(url,options);};const t=document.querySelector('.ai-chat textarea');t.value='QA creative selection only';t.dispatchEvent(new Event('input'));t.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));})()`);
  for(let i=0;i<50;i++){if(await evaluate('!!window.__qaSubmitted'))break;await delay(100);}
  assert.deepEqual((await evaluate('window.__qaSubmitted')).creativeBrief,{styleId:proof.styleId,promptId:proof.promptId});
  evidence.sizes.push({width,selectionPreview:true,spaceStudioRetention:true,reloadRetention:true,submissionPayload:true,realHistoryTemplateSnapshot:true,historyFits:true});
 }
 assert.deepEqual(errors,[]);evidence.pageErrors=errors;fs.writeFileSync('docs/CREATIVE_BRIEF_REVISE_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{if(previousWorkspace)await fetch('http://127.0.0.1:5180/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:previousWorkspace})});ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
