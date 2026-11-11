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





 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__requests=[];const originalFetch=window.fetch;window.fetch=(url,options={})=>{window.__requests.push({url:String(url),method:options.method||'GET'});return originalFetch(url,options);};`});
 const base='http://127.0.0.1:5180',results=[];
 for(const width of [1280,1920]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:720,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/home#connections/images'});
  for(let i=0;i<120;i++){if(await evaluate(`!!document.querySelector('[data-hub-configure="images"]')`))break;await delay(100);}
  assert.equal(await evaluate(`document.querySelector('#vConnections').hidden`),false);
  assert.equal(await evaluate(`document.querySelectorAll('[data-connection-tab]').length`),4);
  assert.equal(await evaluate(`document.querySelector('#vKetNoi').hidden`),true);
  await evaluate(`document.querySelector('[data-hub-configure="images"]').click()`);await delay(600);assert.equal(await evaluate(`!!document.querySelector('dialog[aria-label="Kết nối ảnh"][open]')`),true);
  await evaluate(`document.querySelector('dialog[open]').close();document.querySelector('[data-connection-tab="browser"]').click()`);await delay(600);assert.equal(await evaluate(`document.querySelector('#vTichHop').hidden`),false);assert.equal(await evaluate(`location.hash`),'#connections/browser');
  await evaluate(`history.back()`);await delay(600);assert.equal(await evaluate(`document.querySelector('[data-connection-panel="images"]').hidden`),false);
  await evaluate(`document.querySelector('[data-connection-tab="voice"]').click()`);await delay(600);await evaluate(`document.querySelector('[data-hub-configure="voice"]').click()`);await delay(600);assert.equal(await evaluate(`!!document.querySelector('dialog[aria-label="Giọng nói AI"][open]')`),true);
  await evaluate(`document.querySelector('dialog[open]').close();window.__voiceFetch=window.fetch;window.fetch=(url,options)=>String(url)==='/api/giong'?Promise.resolve(new Response(JSON.stringify({allowed:true,workspaceId:'fixture',ketNoi:{elevenlabs:'',vbee:''},kq:[]} ),{status:200,headers:{'Content-Type':'application/json'}})):window.__voiceFetch(url,options);document.querySelector('[data-hub-configure="voice"]').click()`);await delay(600);assert.equal(await evaluate(`!!document.querySelector('dialog[open] #f11 input[name="key"]')`),true);assert.equal(await evaluate(`!!document.querySelector('dialog[open] #fvb input[name="token"]')`),true);
  await evaluate(`window.fetch=window.__voiceFetch;document.querySelector('dialog[open]').close();document.querySelector('[data-connection-tab="ai"]').click()`);await delay(1400);assert.equal(await evaluate(`document.querySelector('#vKetNoi').hidden`),false);assert.equal(await evaluate(`document.querySelector('#vTichHop').hidden`),true);
  await evaluate(`document.querySelector('#kaApi').click()`);await delay(700);assert.equal(await evaluate(`!!document.querySelector('dialog[aria-label="Kết nối AI qua API"][open]')`),true);
  await evaluate(`document.querySelector('dialog[open]').close();document.querySelector('#navHome').click();document.querySelector('#navKetNoi').click()`);await delay(1000);assert.equal(await evaluate(`document.querySelectorAll('#vKetNoi').length`),1);
  const requests=await evaluate('window.__requests');assert.equal(requests.filter(r=>r.method!=="GET").length,0);assert.equal(requests.filter(r=>r.url.includes('/giong/voices')).length,0);
  await evaluate(`document.querySelector('[data-connection-tab="images"]').click()`);await delay(500);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/CONNECTION_HUB_'+width+'.png',Buffer.from(shot.data,'base64'));
  await send('Page.navigate',{url:base+'/home#tich-hop'});await delay(1700);assert.equal(await evaluate(`document.querySelector('#vTichHop').hidden`),false);assert.equal(await evaluate(`document.querySelector('#vConnections').hidden`),false);
  results.push({width,tabs:4,imageConfig:true,browser:true,back:true,voiceConfig:true,voiceAllowedFormFixture:true,llmConfig:true,legacyAlias:true,readOnlyRequests:requests.length,noVoiceDiscovery:true});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/CONNECTION_HUB_BROWSER_SMOKE.json',JSON.stringify({results,errors,readOnly:true},null,2));console.log({results,errors});await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
