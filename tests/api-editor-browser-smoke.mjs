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


 const proof=JSON.parse(fs.readFileSync('docs/API_EDITOR_API_SMOKE.json','utf8'));
 const base='http://127.0.0.1:5180';
 previousWorkspace=(await (await fetch(base+'/api/v1/workspaces')).json()).activeId;
 await fetch(base+'/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:proof.workspaceId})});
 assert.ok((await fetch(base+'/api/open',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dir:proof.project})})).ok);
 const evidence={project:proof.project,sizes:[],noProviderDispatched:true};
 for(const width of [1280,1920]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:base+'/'});
  for(let i=0;i<150;i++){if(await evaluate("!!document.querySelector('#btnSpace')"))break;await delay(100);}
  await delay(700);await evaluate("document.querySelector('#btnSpace').click()");
  await evaluate("(()=>{const s=document.querySelector('[aria-label=\"AI thực hiện\"]');s.value='api:gateway';s.dispatchEvent(new Event('change'));const c=document.querySelector('[aria-label=\"Sau khi AI dựng xong\"]');c.value='review';c.dispatchEvent(new Event('change'));})()");
  assert.equal(await evaluate("document.querySelector('[aria-label=\"AI thực hiện\"]').value"),'api:gateway');
  await evaluate(`(()=>{const input=document.querySelector('[aria-label="Model API"]');input.value='fixture-run-model';input.dispatchEvent(new Event('input'));})()`);
  await evaluate(`(()=>{const original=window.fetch.bind(window);window.fetch=(url,options)=>{if(String(url)==='/api/v1/connections/llm/models')return Promise.resolve(new Response(JSON.stringify({workspaceId:${JSON.stringify(proof.workspaceId)},models:[{id:'fixture-run-model'},{id:'other-model'}]}),{headers:{'Content-Type':'application/json'}}));return original(url,options);};document.querySelector('.cos-run-model-picker button').click();})()`);
  for(let i=0;i<50;i++){if(await evaluate(`document.querySelector('[aria-label="Chọn model API cho lượt này"]')?.options.length===3`))break;await delay(100);}
  assert.equal(await evaluate(`document.querySelector('[aria-label="Model API"]').value`),'fixture-run-model');
  await evaluate(`(()=>{const list=document.querySelector('[aria-label="Chọn model API cho lượt này"]');list.value='other-model';list.dispatchEvent(new Event('change'));})()`);assert.equal(await evaluate(`document.querySelector('[aria-label="Model API"]').value`),'other-model');
  await evaluate(`(()=>{const list=document.querySelector('[aria-label="Chọn model API cho lượt này"]');list.value='fixture-run-model';list.dispatchEvent(new Event('change'));})()`);
  await evaluate(`(()=>{const brand=document.querySelector('[aria-label="Dùng nhận diện workspace cho lượt AI"]');brand.checked=true;brand.dispatchEvent(new Event('change'));})()`);
  await evaluate(`(()=>{const original=window.fetch;window.fetch=(url,options)=>{if(url==='/api/ai-revise'&&options?.method==='POST'){window.__qaSubmitted=JSON.parse(options.body);return Promise.resolve(new Response(JSON.stringify({ok:false,error:'QA intercepted; no dispatch'}),{status:400,headers:{'Content-Type':'application/json'}}));}return original(url,options);};const t=document.querySelector('.ai-chat textarea');t.value='QA creative selection only';t.dispatchEvent(new Event('input'));t.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));})()`);
  for(let i=0;i<50;i++){if(await evaluate('!!window.__qaSubmitted'))break;await delay(100);}
  assert.deepEqual((await evaluate('window.__qaSubmitted')).execution,{mode:'api',agent:'gateway',model:'fixture-run-model'});assert.equal((await evaluate('window.__qaSubmitted')).completionMode,'review');
  assert.equal((await evaluate('window.__qaSubmitted')).useWorkspaceBrand,true);
  evidence.sizes.push({width,brandOptInPayload:true,apiSelection:true,reviewSelection:true,submissionPayload:true,modelDiscoveryFixture:true,noAutomaticModelChange:true,modelSelectedFromList:true});
  if(process.env.CONTENTOS_TEST_BRAND==='1'){
   await evaluate(`document.querySelector('#btnStudio').click();document.querySelector('#tabs [title="Thương hiệu"]').click()`);
   for(let i=0;i<50;i++){if(await evaluate(`document.querySelector('[aria-label="Nhận diện mặc định workspace"] button')?.disabled===false`))break;await delay(100);}
   await evaluate(`document.querySelector('[aria-label="Nhận diện mặc định workspace"] button').click()`);
   for(let i=0;i<50;i++){if(await evaluate(`document.querySelector('[aria-label="Nhận diện mặc định workspace"] [role=status]').textContent.startsWith('Đã lưu')`))break;await delay(100);}
   assert.match(await evaluate(`document.querySelector('[aria-label="Nhận diện mặc định workspace"] [role=status]').textContent`),/Đã lưu/);
   await evaluate(`document.querySelector('#tabs [title="Văn bản"]').click();document.querySelector('#tabs [title="Thương hiệu"]').click()`);await delay(250);
   await evaluate(`Array.from(document.querySelectorAll('[aria-label="Nhận diện mặc định workspace"] button')).find(b=>b.textContent==='Áp mặc định vào dự án').click()`);await delay(250);
   assert.ok(await evaluate(`document.querySelector('[aria-label="Nhận diện mặc định workspace"]').textContent.includes('phiên bản')`));evidence.sizes.at(-1).workspaceBrandSavedAndApplied=true;
  }
 }
 assert.deepEqual(errors,[]);evidence.pageErrors=errors;fs.writeFileSync('docs/API_EDITOR_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{if(previousWorkspace)await fetch('http://127.0.0.1:5180/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:previousWorkspace})});ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
