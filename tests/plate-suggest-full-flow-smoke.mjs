import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-layout-'));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--no-first-run','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let ws;const base="http://127.0.0.1:5197",server=spawn(process.execPath,["editor/server.mjs","--home","--port","5197"],{windowsHide:true,stdio:"ignore"});let originalWorkspace;
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

 const workspace=(await call('/api/v1/workspaces')).activeId;
 const dir=fs.mkdtempSync(path.resolve('workspace/content/2026-11-05/contentos-ocr-flow-qa-'));fs.mkdirSync(path.join(dir,'inputs'));fs.mkdirSync(path.join(dir,'work'));
 fs.copyFileSync('workspace/content/2026-11-05/contentos-smoke-real-car-plate/inputs/raw.mp4',path.join(dir,'inputs/raw.mp4'));
 const project=JSON.parse(fs.readFileSync('workspace/content/2026-11-05/contentos-smoke-real-car-plate/project.json'));project.title='QA OCR to saved plate mask';project.workspaceId=workspace;project.segments=[{id:'qa',in:0,out:2,keep:true}];
 const file=path.join(dir,'project.json');fs.writeFileSync(file,JSON.stringify(project));const original=fs.readFileSync(file),relative=path.relative(process.cwd(),dir).replaceAll('\\','/');
 await call('/api/open',{dir:relative});
 const waitFor=async expression=>{for(let i=0;i<600;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Timeout '+expression+' '+await evaluate('document.body.innerText.slice(-2500)'));};
 const save=async()=>{await evaluate("document.querySelector('#toast').textContent='';document.querySelector('#btnSave').click()");await waitFor("document.querySelector('#toast').textContent.includes('Đã lưu')");};
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await delay(800);await evaluate("document.querySelector('#btnStudio').click()");await waitFor("[...document.querySelectorAll('#tabs button')].some(b=>b.title==='Văn bản')");await evaluate("[...document.querySelectorAll('#tabs button')].find(b=>b.title==='Văn bản').click();[...document.querySelectorAll('#submenu button')].find(b=>b.textContent.includes('Cắt')).click()");await waitFor("!!document.querySelector('#list .seg')");await evaluate("document.querySelector('#list .seg').click()");await waitFor("!!document.querySelector('[data-primary-plate-privacy]')");await evaluate("document.querySelector('[data-primary-plate-privacy]').click()");await waitFor("!!document.querySelector('dialog [data-create]')&&!document.querySelector('dialog [data-create]').disabled");
 const fields='[...document.querySelectorAll("dialog [data-fields] input")].map(x=>x.value)',prior=await evaluate(fields);
 await evaluate('[...document.querySelectorAll("dialog button")].find(b=>b.textContent.includes("Gợi ý vùng biển")).click()');
 await waitFor('[...document.querySelectorAll("dialog button")].some(b=>b.textContent==="Dùng các vùng gợi ý"&&!b.hidden)');assert.deepEqual(await evaluate(fields),prior);assert.ok(fs.readFileSync(file).equals(original));
 await evaluate('[...document.querySelectorAll("dialog button")].find(b=>b.textContent==="Dùng các vùng gợi ý").click()');const proposed=await evaluate(fields);assert.notDeepEqual(proposed,prior);
 // OCR padding touches the frame. Correct the inclined plate on the actual first frame,
 // using the independently recorded manual seed from PLATE_REAL_QUAD_SMOKE.
 await evaluate(`(()=>{const points=[[.041666666666666664,.7515625],[.9583333333333334,.715625],[.9638888888888889,.81875],[.05,.8578125]].flat();const inputs=[...document.querySelectorAll('dialog details input')];inputs.forEach((el,i)=>{el.value=points[i];el.dispatchEvent(new Event('input'));});})()`);
 await evaluate('document.querySelector("dialog [data-create]").click()');await waitFor('!document.querySelector("dialog [data-apply]").hidden');await waitFor('document.querySelector("dialog [data-result]").readyState>=2');assert.ok(fs.readFileSync(file).equals(original));
 for(const width of [1280,390]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await delay(150);assert.equal(await evaluate('(()=>{const d=document.querySelector("dialog");return d.scrollWidth<=d.clientWidth+1;})()'),true);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`docs/PLATE_SUGGEST_FULL_FLOW_${width}.png`,Buffer.from(shot.data,'base64'));}
 await evaluate('document.querySelector("dialog [data-apply]").click()');await save();const replaced=JSON.parse(fs.readFileSync(file));assert.match(replaced.segments[0].src,/^inputs\/privacy\//);assert.equal(replaced.segments[0].platePrivacy.requiresVisualReview,true);assert.equal(replaced.segments[0].platePrivacy.frames,60);assert.equal(fs.existsSync(path.join(dir,'work/plate-review.json')),false);
 await evaluate('document.querySelector("#btnUndo").click()');await save();assert.deepEqual(JSON.parse(fs.readFileSync(file)).segments,project.segments);
 await evaluate('document.querySelector("#btnRedo").click()');await save();assert.deepEqual(JSON.parse(fs.readFileSync(file)).segments,replaced.segments);
 await send('Page.navigate',{url:base+'/'});await waitFor('!!document.querySelector("#btnStudio")');assert.deepEqual((await call('/api/project')).project.segments,replaced.segments);
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/PLATE_SUGGEST_FULL_FLOW_SMOKE.json',JSON.stringify({project:relative,source:'real car footage copied to independent QA project',duration:2,proposed,manualQuadCorrection:true,actualHttpOcr:true,actualHttpTracking:true,frames:60,noLiveWriteBeforeApply:true,applySaveUndoRedoReopen:true,noReviewReceipt:true,widths:[1280,390],pageErrors:errors,scope:'Full shell OCR to tracker to saved/reopened project. Two seconds only; no full-clip privacy or final-render acceptance.'},null,2));console.log('Real OCR-to-editor flow passed: '+relative);
}finally{ws?.close();chrome.kill();server.kill();}
