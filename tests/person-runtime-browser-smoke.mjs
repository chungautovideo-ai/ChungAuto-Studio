import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-layout-'));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--no-first-run','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let ws;const base="http://127.0.0.1:5199",server=spawn(process.execPath,["editor/server.mjs","--home","--port","5199"],{windowsHide:true,stdio:"ignore"});let originalWorkspace;
try{
 let port;for(let i=0;i<100;i++){try{port=Number(fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]);break;}catch{await delay(100);}}
 assert.ok(port,'Chrome CDP started');
 const pages=await (await fetch(`http://127.0.0.1:${port}/json`)).json();
 ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;});
 let id=0;const pending=new Map(),errors=[];
 ws.onmessage=event=>{const msg=JSON.parse(event.data);if(msg.id){const p=pending.get(msg.id);if(p){pending.delete(msg.id);msg.error?p.reject(new Error(JSON.stringify(msg.error))):p.resolve(msg.result);}}else if(msg.method==='Runtime.exceptionThrown')(errors.push(msg.params.exceptionDetails.text+': '+(msg.params.exceptionDetails.exception?.description||'')),console.error(errors.at(-1)));};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const requestId=++id;pending.set(requestId,{resolve,reject});ws.send(JSON.stringify({id:requestId,method,params}));setTimeout(()=>{if(pending.delete(requestId))reject(new Error('CDP timeout '+method));},10000).unref();});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});




 const call=async(url,body)=>{const r=await fetch(base+url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const data=await r.json();assert.ok(r.ok,JSON.stringify(data));return data;};
 for(let i=0;i<80;i++){try{await call('/api/ping');break;}catch{await delay(100);}}

 originalWorkspace=(await call('/api/v1/workspaces')).activeId;await call('/api/v1/workspaces',{name:'SAM2 runtime UI QA '+Date.now()});
 const upload=await fetch(base+'/api/new-project?file=fixture.mp4&name=ContentOS-Smoke-Runtime&noasr=1',{method:'POST',body:fs.readFileSync('tests/fixture.mp4')});const created=await upload.json();assert.ok(upload.ok);const project=JSON.parse(fs.readFileSync(path.join(created.dir,'project.json')));
 const waitFor=async expression=>{for(let n=0;n<150;n++){if(await evaluate(expression))return;await delay(100);}throw Error('Timeout '+expression);};
 await send('Page.navigate',{url:base+'/home'});await waitFor('!!document.querySelector("#libraryTemplateDetails")');
 await evaluate(`(async()=>{const current=await(await fetch('/api/project')).json();window.runtimeChecks=0;window.runtimeReady=false;const {openPersonSelectionDialog}=await import('/ui/contentos-person-selection.js');window.openRuntimeQA=()=>openPersonSelectionDialog({src:'inputs/raw.mp4',mediaUrl:()=>'/api/primary-media-preview?'+new URLSearchParams({src:'inputs/raw.mp4',dir:${JSON.stringify(created.dir)},revision:current.revision,workspaceId:${JSON.stringify(project.workspaceId||'default')}}),request:async(url,options)=>{if(String(url).includes('/runtime')){window.runtimeChecks++;return Response.json(window.runtimeReady?{ready:true,info:{device:'Fixture GPU'}}:{ready:false,detail:'Thiếu Torch CUDA thử nghiệm',help:'Cấu hình môi trường rồi kiểm tra lại.'});}return fetch(url,options);}});await window.openRuntimeQA();})()`);
 await evaluate('document.querySelector("dialog [data-load]").click()');await waitFor('document.querySelector("dialog [data-runtime]").textContent.includes("Thiếu Torch")');assert.equal(await evaluate('document.querySelector("dialog [data-track]").disabled'),true);
 await evaluate('var c=document.querySelector("dialog canvas"),r=c.getBoundingClientRect();c.dispatchEvent(new PointerEvent("pointerdown",{clientX:r.left+r.width*.5,clientY:r.top+r.height*.5,bubbles:true}));');assert.equal(await evaluate('document.querySelector("dialog [data-track]").disabled'),true);
 for(const [width,height] of [[1280,720],[390,844]]){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(150);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/PERSON_RUNTIME_MISSING_'+width+'.png',Buffer.from(shot.data,'base64'));}
 await evaluate('window.runtimeReady=true;document.querySelector("dialog [data-runtime-check]").click()');await waitFor('!document.querySelector("dialog [data-track]").disabled');assert.equal(await evaluate('window.runtimeChecks'),2);await evaluate('document.querySelector("dialog [data-close]").click()');
 const after=fs.readFileSync(path.join(created.dir,'project.json'));assert.equal(JSON.parse(after).title,project.title);assert.deepEqual(errors,[]);fs.writeFileSync('docs/PERSON_RUNTIME_BROWSER_SMOKE.json',JSON.stringify({project:created.dir,realLocalMedia:true,syntheticReadinessFailures:true,missingRuntimeDisablesTrackingEvenWithPoints:true,recheckEnablesTracking:true,noTrackingDispatched:true,widths:[1280,390],pageErrors:errors},null,2)+'\n');console.log('SAM2 readiness error and retry dialog passed.');
}finally{if(originalWorkspace)await fetch(base+'/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:originalWorkspace})}).catch(()=>{});ws?.close();chrome.kill();server.kill();}
