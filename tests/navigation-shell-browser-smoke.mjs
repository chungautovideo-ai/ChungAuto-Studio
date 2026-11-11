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




 const base='http://127.0.0.1:5180',results=[];
 for(const width of [1280,1920]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:720,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/home#projects'});
  for(let i=0;i<100;i++){if(await evaluate(`!!document.querySelector('.cos-shell-workspace option') && !document.querySelector('#vProjects').hidden`))break;await delay(100);}
  assert.equal(await evaluate(`document.querySelector('#vProjects').hidden`),false);
  assert.equal(await evaluate(`document.querySelectorAll('.cos-nav-group').length`),6);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('#side')).overflowY`),'auto');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('#projectsGrid')).display`),'grid');
  assert.equal(await evaluate(`document.querySelectorAll('[id=navSourceLibrary]').length`),1);
  await evaluate(`document.querySelector('#navSourceLibrary').click()`);await delay(900);assert.equal(await evaluate(`document.querySelector('#vLibrary').hidden`),false);assert.equal(await evaluate(`location.hash`),'#library');
  await evaluate(`history.back()`);await delay(700);assert.equal(await evaluate(`document.querySelector('#vProjects').hidden`),false);
  await evaluate(`document.querySelector('#navImages').click()`);await delay(1000);assert.equal(await evaluate(`!!document.querySelector('dialog[aria-label="Tạo ảnh AI"][open]')`),true);
  await evaluate(`document.querySelector('dialog[open]').close();document.querySelector('#navNews').click()`);await delay(800);assert.equal(await evaluate(`document.querySelectorAll('dialog[open]').length`),1);
  await evaluate(`history.back()`);await delay(700);assert.equal(await evaluate(`!!document.querySelector('dialog[aria-label="Tạo ảnh AI"][open]')`),true);
  await evaluate(`document.querySelector('dialog[open]').close();document.querySelector('#navContentOS').click()`);await delay(900);assert.equal(await evaluate(`document.querySelector('#vContentOS').hidden`),false);
  await send('Page.navigate',{url:base+'/home#settings'});await delay(1800);assert.equal(await evaluate(`document.querySelector('#vContentOS').hidden`),false);
  await evaluate(`document.querySelector('#side').scrollTop=0`);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/NAVIGATION_SHELL_'+width+'.png',Buffer.from(shot.data,'base64'));
  results.push({width,groups:6,projectDeepLink:true,library:true,imageTool:true,newsTool:true,back:true,settingsRefresh:true});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/NAVIGATION_SHELL_BROWSER_SMOKE.json',JSON.stringify({results,errors,readOnly:true},null,2));console.log({results,errors});await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
