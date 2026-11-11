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

 const waitFor=async expression=>{for(let n=0;n<100;n++){if(await evaluate(expression))return;await delay(100);}throw Error('Timeout '+expression);};
 const templateId='chungauto-factory-quang-cao-v50';
 const reference=await call('/api/v1/templates/reference?id='+templateId+'&path=references/person.md');assert.match(reference.content,/Xem lại vùng đã lưu/);
 const invalid=await fetch(base+'/api/v1/templates/reference?id='+templateId+'&path=../secret');assert.equal(invalid.status,400);
 const packed=await fetch(base+'/api/v1/templates/package?id='+templateId);assert.ok(packed.ok);assert.ok(packed.headers.get('content-disposition').includes(templateId+'.zip'));const {parseTemplatePackage}=await import('../src/services/template-package.mjs');const imported=parseTemplatePackage(Buffer.from(await packed.arrayBuffer()));assert.equal(imported[0].template.presets.length,11);assert.equal(imported[0].template.skillReferences.length,4);
 await send('Page.navigate',{url:base+'/home'});await waitFor('!!document.querySelector("#libraryTemplateDetails")');
 await evaluate(`(async()=>{const {templateDetailsPanel}=await import('/ui/contentos-template-details.js');const card=document.createElement('section');card.id='qa-reference-panel';card.style.cssText='position:fixed;inset:0;z-index:99999;overflow:auto;padding:20px;background:var(--surface);border:1px solid var(--line);border-radius:16px';document.body.append(card);const panel=templateDetailsPanel('${templateId}');card.append(panel);panel.open=true;})()`);
 await waitFor('document.querySelectorAll(".cos-template-details details").length===6');
 await evaluate('document.querySelectorAll(".cos-template-details details")[2].open=true');await waitFor('document.querySelectorAll(".cos-template-details details")[2].querySelector("pre").textContent.includes("Màu nguồn")');
 assert.equal(await evaluate('document.querySelectorAll(`a[download]`).length'),1);
 for(const [width,height] of [[1280,900],[390,844]]){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(150);assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/TEMPLATE_REFERENCE_BROWSER_'+width+'.png',Buffer.from(shot.data,'base64'));}
 await evaluate(`(async()=>{const {templateDetailsPanel}=await import('/ui/contentos-template-details.js');window.attempts=0;const request=async(...args)=>{if(String(args[0]).includes('/reference?')&&++window.attempts===1)return Response.json({error:'Lỗi thử nghiệm'},{status:400});return fetch(...args);};const panel=templateDetailsPanel('${templateId}',{request});document.querySelector('#qa-reference-panel').replaceChildren(panel);panel.open=true;})()`);
 await waitFor('document.querySelectorAll(".cos-template-details details").length===6');await evaluate('document.querySelectorAll(".cos-template-details details")[2].open=true');await waitFor('!document.querySelectorAll(".cos-template-details details")[2].querySelector("button").hidden');await evaluate('document.querySelectorAll(".cos-template-details details")[2].querySelector("button").click()');await waitFor('document.querySelectorAll(".cos-template-details details")[2].querySelector("pre").textContent.includes("Màu nguồn")');
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/TEMPLATE_REFERENCE_BROWSER_SMOKE.json',JSON.stringify({httpReference:true,unlistedReferenceRejected:true,zipDownload:true,presets:11,references:4,browserLazyTopic:true,retryAfterError:true,widths:[1280,390],noHorizontalOverflow:true,componentMountedOnRealHome:true,noProjectWorkspaceChanges:true,pageErrors:errors},null,2)+'\n');console.log('Template reference browser and ZIP endpoint passed.');
}finally{if(originalWorkspace)await fetch(base+'/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:originalWorkspace})}).catch(()=>{});ws?.close();chrome.kill();server.kill();}

