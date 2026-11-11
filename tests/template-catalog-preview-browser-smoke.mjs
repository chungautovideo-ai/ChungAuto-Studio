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

 const results=[];
 for(const width of [1280,1920]){await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'http://127.0.0.1:5180/home'});let ready=false;for(let i=0;i<100;i++){ready=await evaluate("!!document.querySelector('.tcard[data-id=\"chu-dong-bat-dong-san\"]')");if(ready)break;await delay(100);}assert.ok(ready);const before=await evaluate("document.querySelector('#styleName').textContent");for(const id of ['chu-dong-bat-dong-san','thu-vien-hieu-ung-premium']){await evaluate(`document.querySelector('.tcard[data-id="${id}"]').click()`);await delay(200);const value=await evaluate("(()=>{const d=document.querySelector('dialog[open]');return d?{title:d.querySelector('h2').textContent,video:!!d.querySelector('video[controls]'),disabled:d.querySelector('button').disabled,note:d.querySelector('[role=status]').textContent}:null})()");assert.ok(value);assert.ok(value.video&&value.disabled);assert.match(value.note,/Chưa cài/);await evaluate("document.querySelector('dialog[open]').close()");assert.equal(await evaluate("document.querySelector('#styleName').textContent"),before);results.push({width,id,...value});}}assert.deepEqual(errors,[]);fs.writeFileSync('docs/TEMPLATE_CATALOG_PREVIEW_BROWSER_SMOKE.json',JSON.stringify({results,errors,entitlementUnchanged:true},null,2)+'\n');console.log({cases:results.length,errors});await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
