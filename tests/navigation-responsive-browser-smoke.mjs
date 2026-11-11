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
 for(const width of [1920,1280,820,600,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/home?responsive='+width+'#home'});await delay(700);
  for(let i=0;i<100;i++){if(await evaluate(`!!document.querySelector('.cos-nav-icon') && !!document.querySelector('.cos-shell-workspace option')`))break;await delay(100);}
  assert.equal(await evaluate(`Array.from(document.querySelectorAll('.cos-nav-group button')).every(b=>b.querySelectorAll(':scope > svg.cos-nav-icon').length===1)`),true);
  const homeMetrics=await evaluate(`({viewport:innerWidth,page:document.documentElement.scrollWidth,main:document.querySelector('.main').clientWidth,scroll:document.querySelector('.main').scrollWidth})`);assert.ok(homeMetrics.scroll<=homeMetrics.main+1,JSON.stringify(homeMetrics));
  if(width<761){
   assert.equal(await evaluate(`document.body.classList.contains('side-off')`),true);
   await evaluate(`document.querySelector('#sideOn').click()`);await delay(250);
   assert.equal(await evaluate(`document.querySelector('#side').inert`),false);
   assert.equal(await evaluate(`getComputedStyle(document.querySelector('.cos-nav-backdrop')).display`),'block');
   await evaluate(`document.querySelector('#navProjects').click()`);await delay(400);
   assert.equal(await evaluate(`document.body.classList.contains('side-off')`),true);
   await evaluate(`document.querySelector('#sideOn').click();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`);
   assert.equal(await evaluate(`document.querySelector('#side').inert`),true);
  }
  const metrics=await evaluate(`({viewport:innerWidth,page:document.documentElement.scrollWidth,main:document.querySelector('.main').clientWidth,scroll:document.querySelector('.main').scrollWidth})`);
  assert.ok(metrics.page<=width+1,JSON.stringify(metrics));assert.ok(metrics.scroll<=metrics.main+1,JSON.stringify(metrics));
  if(width<761)await evaluate(`document.querySelector('#sideOn').click()`);
  await evaluate(`document.querySelector('#side').scrollTop=0`);await delay(250);
  const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/NAVIGATION_RESPONSIVE_'+width+'.png',Buffer.from(shot.data,'base64'));
  results.push({width,icons:true,mobile:width<761,metrics});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/NAVIGATION_RESPONSIVE_BROWSER_SMOKE.json',JSON.stringify({results,errors,readOnly:true},null,2));console.log({results,errors});await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
