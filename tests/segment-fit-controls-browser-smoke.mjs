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
 async function api(url,body){const r=await fetch(base+url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();assert.ok(r.ok,JSON.stringify(data));return data;}
 previousWorkspace=(await api('/api/v1/workspaces')).activeId;
 const workspace=await api('/api/v1/workspaces',{name:'ContentOS-Smoke-BrandUI-'+Date.now()});
 async function create(name){const r=await fetch(base+'/api/new-project?file=fixture.mp4&name='+name+'&noasr=1',{method:'POST',body:fs.readFileSync('tests/fixture.mp4')});assert.ok(r.ok);return r.json();}
 async function waitFor(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Timed out: '+expression);}
 const open=async()=>{await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await evaluate("document.querySelector('#btnStudio').click()");await waitFor("[...document.querySelectorAll('#tabs button')].some(b=>b.textContent.includes('Thương hiệu'))");await evaluate("[...document.querySelectorAll('#tabs button')].find(b=>b.textContent.includes('Thương hiệu')).click()");await waitFor("(()=>{const b=[...document.querySelectorAll('#list button')].find(b=>b.textContent==='Lưu bộ đang chỉnh làm mặc định');return b&&!b.disabled})()");};

 const evidence={sizes:[],syntheticSource:true};
 for(const width of [1280,1920]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});
 const project=await create('ContentOS-Smoke-SegFit-'+width+'-'+Date.now());await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await evaluate("document.querySelector('#btnStudio').click()");await waitFor("!!document.querySelector('.clip.video')");await evaluate("document.querySelector('.clip.video').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,pointerType:'mouse'}))");await waitFor("document.querySelector('#inspector').textContent.includes('Fade vào tiếng đoạn')");

 await evaluate(`(()=>{const field=[...document.querySelectorAll('#inspector .field')].find(e=>e.querySelector('label')?.textContent==='Đặt video vào khung');const select=field.querySelector('select');select.value='contain';select.dispatchEvent(new Event('input'));document.querySelector('#btnSave').click();})()`);await waitFor("document.querySelector('#toast').textContent.includes('Đã lưu')");assert.equal((await api('/api/project')).project.segments[0].fit,'contain');
 await send('Page.reload');await delay(700);await evaluate("document.querySelector('#btnStudio').click()");await waitFor("!!document.querySelector('.clip.video')");await evaluate("document.querySelector('.clip.video').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,pointerType:'mouse'}))");await waitFor("document.querySelector('#inspector').textContent.includes('Fade vào tiếng đoạn')");assert.equal(await evaluate("[...document.querySelectorAll('#inspector .field')].find(e=>e.querySelector('label')?.textContent==='Đặt video vào khung').querySelector('select').value"),'contain');evidence.sizes.push({width,project:project.dir,inspectorEditSaveReload:true});
 }
 assert.deepEqual(errors,[]);evidence.pageErrors=errors;evidence.limits='Actual clip inspector edit/save/reload at two viewports; no direct audio preview listening or production benchmark.';fs.writeFileSync('docs/SEGMENT_FIT_CONTROLS_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{if(previousWorkspace)await fetch('http://127.0.0.1:5180/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:previousWorkspace})});ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
