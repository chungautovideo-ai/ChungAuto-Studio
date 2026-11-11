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
 async function api(url,body){const r=await fetch(base+url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};}
 previousWorkspace=(await api('/api/v1/workspaces')).body.activeId;
 const evidence={sizes:[],sourceUnchanged:true};
 for(const width of [1280,1920]){
  const workspace=(await api('/api/v1/workspaces',{name:'ContentOS-Smoke-CatalogImport '+width+' '+Date.now()})).body;
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/home'});
  for(let i=0;i<100;i++){if(await evaluate("typeof document.querySelector('#navSourceLibrary')?.onclick==='function'"))break;await delay(100);}
  await evaluate("document.querySelector('#navSourceLibrary').click()");
  for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('#cosScan')"))break;await delay(100);}
  await evaluate("document.querySelector('#cosScan').click()");
  for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('#cosSelectNone')"))break;await delay(100);}
  const plan=(await api('/api/v1/catalogs/preview')).body;assert.ok(plan.entries.length>1);
  assert.equal((await api('/api/v1/catalogs/import',{workspaceId:'wrong',fingerprint:plan.fingerprint,ids:[plan.entries[0].id]})).status,409);
  assert.equal((await api('/api/v1/catalogs/import',{workspaceId:workspace.id,fingerprint:'stale',ids:[plan.entries[0].id]})).status,409);
  await evaluate("document.querySelector('#cosSelectNone').click()");assert.equal(await evaluate("document.querySelector('#cosImport').disabled"),true);
  await evaluate("(()=>{const input=document.querySelector('[data-import-id]');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#cosImport').click();})()");
  for(let i=0;i<100;i++){if(await evaluate("document.querySelector('#cosImportStatus').textContent.includes('Đã nhập 1')"))break;await delay(100);}
  assert.match(await evaluate("document.querySelector('#cosImportStatus').textContent"),/Đã nhập 1/);
  assert.equal((await api('/api/v1/catalogs/local')).body.entries.length,1);
  await evaluate("document.querySelector('#cosScan').click()");
  for(let i=0;i<100;i++){if(await evaluate("document.querySelector('#cosSourcePreview').textContent.includes('1 bản đã có')"))break;await delay(100);}
  assert.equal(await evaluate("document.querySelectorAll('[data-import-id]:checked').length"),plan.entries.length-1);
  const after=(await api('/api/v1/catalogs/preview')).body;assert.equal(after.fingerprint,plan.fingerprint);
  evidence.sizes.push({width,workspaceId:workspace.id,selectedOnly:true,duplicatesExcluded:true,wrongWorkspaceRejected:true,stalePreviewRejected:true});
 }
 assert.deepEqual(errors,[]);evidence.pageErrors=errors;fs.writeFileSync('docs/CATALOG_IMPORT_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{if(previousWorkspace)await fetch('http://127.0.0.1:5180/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:previousWorkspace})});ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
