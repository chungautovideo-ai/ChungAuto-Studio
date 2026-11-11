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


 const base='http://127.0.0.1:5180';
 async function api(url,body){const r=await fetch(base+url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const value=await r.json();assert.ok(r.ok,JSON.stringify(value));return value;}
 previousWorkspace=(await api('/api/v1/workspaces')).activeId;const workspace=await api('/api/v1/workspaces',{name:'ContentOS-Smoke Routing '+Date.now()});
 const evidence={workspaceId:workspace.id,sizes:[],directDialogEntry:true,noProviderCalls:true};
 for(const width of [1280,1920]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/home'});await delay(500);
  await evaluate("(async()=>{await (await import('/ui/contentos-connections.js')).openImageConnection({kind:'llm'});})()");
  await evaluate("document.querySelector('[data-routing-load]').click()");await delay(150);
  await evaluate("document.querySelector('[data-routing-enabled]').checked=true;document.querySelector('[data-routing-build]').value='qa-build';document.querySelector('[data-routing-revise]').value='qa-edit';document.querySelector('[data-routing-news]').value='qa-news';document.querySelector('[data-routing-publish]').value='qa-publish';document.querySelector('[data-routing-save]').click()");
  for(let i=0;i<50;i++){if(await evaluate("document.querySelector('[data-routing-state]').textContent.includes('Đã lưu')"))break;await delay(100);}
  const saved=await api('/api/v1/model-routing');assert.equal(saved.models.revise,'qa-edit');assert.equal(saved.models['first-build'],'qa-build');assert.equal(saved.enabled,true);assert.equal(saved.models['news-draft'],'qa-news');assert.equal(saved.models['publish-draft'],'qa-publish');
  await evaluate("document.querySelector('[data-routing-revise]').value='not saved';document.querySelector('[data-routing-load]').click()");await delay(150);
  assert.equal(await evaluate("document.querySelector('[data-routing-revise]').value"),'qa-edit');assert.equal(await evaluate("document.querySelector('[data-routing-news]').value"),'qa-news');assert.equal(await evaluate("document.querySelector('[data-routing-publish]').value"),'qa-publish');await evaluate("document.querySelector('[data-close]').click()");evidence.sizes.push({width,saved:true,reloaded:true});
 }
 assert.deepEqual(errors,[]);evidence.pageErrors=errors;fs.writeFileSync('docs/DRAFT_ROUTING_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{if(previousWorkspace)await fetch('http://127.0.0.1:5180/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:previousWorkspace})});ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
