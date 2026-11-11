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



 const evidence={sizes:[],fixtureOnly:true};
 for(const width of [1280,1920]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'http://127.0.0.1:5180/home'});await delay(700);
 await evaluate(`(async()=>{window.__calls=[];const request=async(url,options)=>{window.__calls.push({url,method:options.method,body:options.body?JSON.parse(options.body):null});return Response.json(url==='/api/v1/api-usage'?{workspaceId:'qa-models',day:'2026-11-04',calls:12,tokens:{total_tokens:123},unknownUsage:2,policy:{dailyCalls:50}}:url.endsWith('/models')?{models:[{id:'fixture-chat'},{id:'fixture-vision'}]}:{workspaceId:'qa-models',baseUrl:'https://example.test/v1',model:'fixture-chat',hasKey:true,source:'workspace',secretProtection:'fixture'});};await (await import('/ui/contentos-connections.js')).openImageConnection({kind:'llm',request});})()`);
 assert.equal(await evaluate('window.__calls.length'),1);
 assert.equal(await evaluate("document.querySelector('[data-references]').closest('label').hidden"),true);
 await evaluate("document.querySelector('[data-discover]').click()");await delay(150);
 assert.deepEqual(await evaluate('window.__calls[1]'),{url:'/api/v1/connections/llm/models',method:'POST',body:{workspaceId:'qa-models'}});
 await evaluate("document.querySelector('[data-models]').value='fixture-vision';document.querySelector('[data-models]').dispatchEvent(new Event('change'))");
 assert.equal(await evaluate("document.querySelector('[data-model]').value"),'fixture-vision');
 await evaluate("document.querySelector('[data-vision]').checked=true;document.querySelector('[data-save]').click()");await delay(150);
 assert.equal((await evaluate('window.__calls[2]')).body.model,'fixture-vision');assert.equal((await evaluate('window.__calls[2]')).body.supportsVision,true);
 assert.equal((await evaluate('window.__calls[2]')).body.apiKey,undefined);
 await evaluate("document.querySelector('[data-usage-refresh]').click()");await delay(100);assert.match(await evaluate("document.querySelector('[data-usage-state]').textContent"),/12 lượt/);await evaluate("document.querySelector('[data-daily-calls]').value='20';document.querySelector('[data-usage-save]').click()");await delay(100);const last=await evaluate('window.__calls.at(-1)');assert.equal(last.url,'/api/v1/api-usage');assert.deepEqual(last.body,{workspaceId:'qa-models',dailyCalls:20});await evaluate("document.querySelector('[data-close]').click()");evidence.sizes.push({width,noAutoModelFetch:true,explicitDiscoveryPayload:true,selectedModelSave:true,explicitVisionPermission:true,usageAndDailyPolicy:true,noSecretEcho:true});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/MODEL_CONNECTION_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
