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



 const proof=JSON.parse(fs.readFileSync('docs/ITEM_PATCH_API_SMOKE.json','utf8')),base='http://127.0.0.1:5180';
 previousWorkspace=(await (await fetch(base+'/api/v1/workspaces')).json()).activeId;
 await fetch(base+'/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:proof.workspaceId})});
 assert.ok((await fetch(base+'/api/open',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dir:proof.project})})).ok);
 const evidence={project:proof.project,sizes:[],noProviderDispatched:true};
 for(const width of [1280,1920]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:base+'/'});
 for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('#btnStudio')"))break;await delay(100);}
 await delay(600);
 await evaluate("document.querySelector('#btnStudio').click();document.querySelector('#tabs [title=\"Văn bản\"]').click()");
 await evaluate("[...document.querySelectorAll('#list .card')].find(e=>e.textContent.includes('PATCH VERIFIED')).click();document.querySelector('.ai-fab').click()");
 assert.equal(await evaluate("!!document.querySelector('[aria-label=\"Gửi thành phần đang chọn cho AI\"]')"),true);
 await evaluate("(()=>{const s=document.querySelector('[aria-label=\"AI thực hiện\"]');s.value='api:gateway';s.dispatchEvent(new Event('change'));})()");
 await evaluate("(()=>{const original=window.fetch.bind(window);window.__qaRequests=[];window.fetch=(url,options)=>{if(url==='/api/ai-revise'&&options?.method==='POST'){window.__qaRequests.push(JSON.parse(options.body));return Promise.resolve(new Response(JSON.stringify({error:'QA intercepted'}),{status:400,headers:{'Content-Type':'application/json'}}));}return original(url,options);};})()");
 const submit=async()=>{await evaluate("(()=>{const t=document.querySelector('.ai-chat textarea');t.value='QA sửa câu đang chọn';t.dispatchEvent(new Event('input'));t.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));})()");await delay(300);};
 await submit();assert.deepEqual((await evaluate('window.__qaRequests[0]')).context,{selection:{group:'texts',id:'target'}});
 await evaluate("(()=>{const c=document.querySelector('[aria-label=\"Gửi thành phần đang chọn cho AI\"]');c.click();})()");
 await submit();assert.equal((await evaluate('window.__qaRequests[1]')).context,null);
 await evaluate("document.querySelector('#btnSpace').click()");
 assert.equal(await evaluate("document.querySelector('[aria-label=\"Gửi thành phần đang chọn cho AI\"]').checked"),false);
 await evaluate("document.querySelector('[aria-label=\"Gửi thành phần đang chọn cho AI\"]').click()");
 await submit();assert.deepEqual((await evaluate('window.__qaRequests[2]')).context,{selection:{group:'texts',id:'target'}});
 const fits=await evaluate("(()=>{const r=document.querySelector('.ac-head').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})()");assert.equal(fits,true);
 evidence.sizes.push({width,studioSelectedPayload:true,omitSelection:true,spaceSelectionRetention:true,chatHeaderFits:true});
 }
 assert.deepEqual(errors,[]);evidence.pageErrors=errors;fs.writeFileSync('docs/SELECTED_ITEM_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{if(previousWorkspace)await fetch('http://127.0.0.1:5180/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:previousWorkspace})});ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
