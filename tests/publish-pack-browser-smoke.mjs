import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {unzip} from '../editor/lib/zip.mjs';
const proof=JSON.parse(fs.readFileSync('docs/PUBLISH_PACK_API_SMOKE.json','utf8')),base='http://127.0.0.1:5195',server=spawn(process.execPath,['editor/server.mjs','--home','--port','5195'],{windowsHide:true,stdio:'ignore'});
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








 const api=async url=>{const response=await fetch(base+url);assert.ok(response.ok);return response.json();};for(let i=0;i<100;i++){try{await api('/api/ping');break;}catch{await delay(100);}}
 const waitFor=async expression=>{for(let i=0;i<200;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Timeout '+expression+' '+await evaluate('document.body.innerText.slice(-1000)'));};const results=[];
 for(const width of [1280,1920]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/home'});await waitFor("!!document.querySelector('#navContentOS')");
  await evaluate(`import('/ui/contentos-publish-drafts.js').then(m=>m.openPublishDrafts({dir:${JSON.stringify(proof.dir)},revision:${JSON.stringify(proof.revision)}}))`);
  await waitFor("!!document.querySelector('[data-publish-pack]')");await evaluate("document.querySelector('[data-publish-pack]').open=true;document.querySelector('[data-publish-pack] button').click()");
  await waitFor("!document.querySelector('[data-publish-pack] button:nth-of-type(2)').disabled");
  const checks=await evaluate("document.querySelectorAll('[data-publish-pack] input[type=checkbox]').length");assert.equal(checks,2);
  await evaluate("document.querySelector('[data-publish-pack] input[data-platform=facebook]').checked=false;document.querySelector('[data-publish-pack] button:nth-of-type(2)').click()");
  await waitFor("!!document.querySelector('[data-publish-pack] a[href]')&&!document.querySelector('[data-publish-pack] a').hidden");
  const href=await evaluate("document.querySelector('[data-publish-pack] a').getAttribute('href')");const response=await fetch(base+href);assert.equal(response.status,200);const files=unzip(Buffer.from(await response.arrayBuffer()));const manifest=JSON.parse(files.find(file=>file.name==='manifest.json').data);assert.equal(manifest.channels.length,1);assert.equal(manifest.channels[0].platform,'youtube');assert.ok(files.some(file=>file.name.endsWith('cover.jpg')));
  await evaluate("document.querySelector('[data-publish-pack]').scrollIntoView({block:'start'})");
  const screenshot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/PUBLISH_PACK_'+width+'.png',Buffer.from(screenshot.data,'base64'));
  await evaluate("const field=document.querySelector('[data-fields] textarea');field.value+=' chưa lưu';field.dispatchEvent(new Event('input'));document.querySelector('[data-publish-pack] button:nth-of-type(2)').click()");await waitFor("document.querySelector('[data-publish-pack]').textContent.includes('Có thay đổi chưa lưu')");
  results.push({width,realDialog:true,savedFinalAndDrafts:true,selectedChannelOnly:true,zipDownload:true,coverIncluded:true,unsavedGuard:true});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/PUBLISH_PACK_BROWSER_SMOKE.json',JSON.stringify({results,errors},null,2));console.log({results,errors});await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();server.kill();await delay(300);console.log('QA profile retained:',profile);}
