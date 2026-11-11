import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createStorageService} from '../src/services/storage.mjs';
import {createNewsService} from '../src/services/news.mjs';
import {attachVoiceResult} from '../src/services/voice-intake.mjs';
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
 async function api(url,body){const response=await fetch(base+url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:response.status,body:await response.json()};}
 previousWorkspace=(await api('/api/v1/workspaces')).body.activeId;
 const workspace=(await api('/api/v1/workspaces',{name:'ContentOS-Smoke-VoiceTimeline '+Date.now()})).body;
 const upload=await fetch(base+'/api/new-project?file=fixture.mp4&name=ContentOS-Smoke-VoiceTimeline&noasr=1',{method:'POST',body:fs.readFileSync('tests/fixture.mp4')});const project=await upload.json();assert.ok(upload.ok);
 const root=process.cwd();
 const projectFolder=path.join(root,project.dir);fs.copyFileSync('tests/fixture.mp4',path.join(projectFolder,'inputs/shot.mp4'));
 execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=blue:s=320x240','-frames:v','1',path.join(projectFolder,'inputs/blue.png')],{windowsHide:true});
 const evidence={project:project.dir,sizes:[],syntheticOnly:true,noProviderCalls:true};
 for(const width of [1280,1920]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/'});await delay(1000);
  await evaluate("document.querySelector('#btnStudio').click();[...document.querySelectorAll('#tabs button')].find(b=>b.textContent.includes('Cảnh trám')).click()");
  await evaluate("[...document.querySelectorAll('#list button')].find(b=>b.textContent==='Ráp cảnh trám theo thời lượng').click()");
  const dialog='dialog[aria-label="Ráp cảnh trám theo thời lượng"]';
  await evaluate(`(()=>{const d=document.querySelector('${dialog}');for(const input of d.querySelectorAll('[data-assembly-source]')){if(input.value.endsWith('/blue.png')||input.value.endsWith('/shot.mp4')){input.checked=true;input.dispatchEvent(new Event('input',{bubbles:true}));}}d.querySelector('input[aria-label="Số giây mỗi cảnh"]').value='1';[...d.querySelectorAll('button')].find(b=>b.textContent==='Xem cách ráp').click();})()`);
  for(let i=0;i<100;i++){if(await evaluate(`document.querySelector('${dialog} [role="status"]').textContent.includes('Chưa thay đổi')`))break;await delay(100);}
  assert.match(await evaluate(`document.querySelector('${dialog} [role="status"]').textContent`),/2 cảnh/);
  assert.equal((await api('/api/project')).body.project.brolls.length,0);
  await evaluate(`(()=>{const d=document.querySelector('${dialog}'),r=d.querySelector('input[aria-label="Lặp lại tư liệu"]');r.checked=true;r.dispatchEvent(new Event('input',{bubbles:true}));[...d.querySelectorAll('button')].find(b=>b.textContent==='Xem cách ráp').click();})()`);
  for(let i=0;i<100;i++){if(await evaluate(`document.querySelector('${dialog} [role="status"]').textContent.includes('thiếu 0.00')`))break;await delay(100);}
  assert.match(await evaluate(`document.querySelector('${dialog} [role="status"]').textContent`),/thiếu 0.00/);
  await evaluate(`(()=>{const d=document.querySelector('${dialog}');[...d.querySelectorAll('button')].find(b=>b.textContent==='Áp dụng vào timeline').click();document.querySelector('#btnSave').click();})()`);await delay(500);
  const saved=(await api('/api/project')).body.project;assert.ok(saved.brolls.length>=3);assert.ok(saved.brolls.every(c=>c.mode==='full'&&c.audioVol===0));
  await evaluate("[...document.querySelectorAll('#list button')].find(b=>b.textContent==='Ráp cảnh trám theo thời lượng').click()");
  await evaluate(`(()=>{const d=document.querySelector('${dialog}'),input=d.querySelector('[data-assembly-source]');input.checked=true;input.dispatchEvent(new Event('input',{bubbles:true}));[...d.querySelectorAll('button')].find(b=>b.textContent==='Xem cách ráp').click();})()`);
  for(let i=0;i<100;i++){if(await evaluate(`document.querySelector('${dialog} [role="status"]').textContent.includes('Đã có cảnh trám')`))break;await delay(100);}
  assert.match(await evaluate(`document.querySelector('${dialog} [role="status"]').textContent`),/Đã có cảnh trám/);
  assert.deepEqual((await api('/api/project')).body.project.brolls,saved.brolls);
  await evaluate(`document.querySelector('${dialog}').close()`);
  evidence.sizes.push({width,previewBeforeMutation:true,repeatCoversOutput:true,applyAndSave:true,existingClipsPreserved:true});
  // Reset only this synthetic project's generated clips for the second viewport.
  await evaluate("document.querySelector('#btnUndo').click();document.querySelector('#btnSave').click()");await delay(400);
  assert.equal((await api('/api/project')).body.project.brolls.length,0);
 }
 assert.deepEqual(errors,[]);evidence.pageErrors=errors;fs.writeFileSync('docs/BROLL_ASSEMBLY_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{if(previousWorkspace)await fetch('http://127.0.0.1:5180/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:previousWorkspace})});ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
