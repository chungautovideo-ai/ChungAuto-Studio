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
 await evaluate(`(async()=>{window.__draftCalls=[];const entry={id:'base',version:1,status:'draft',payload:{title:'Tin thử',script:'Nháp',sources:[{url:'https://example.com/news',excerpt:'Tin nguồn.'}]}};window.fetch=async(url,options)=>{if(url==='/api/v1/tasks')return Response.json({workspaceId:'qa-news',tasks:window.__draftCalls.length?[{id:'task-one',kind:'news-draft',status:'succeeded',result:{entryId:'generated'}}]:[]});if(url==='/api/v1/news')return Response.json({workspaceId:'qa-news',entries:[entry,...(window.__draftCalls.length?[{...entry,id:'generated',version:2,payload:{...entry.payload,script:'AI soạn [1].'},aiGeneration:{model:'fixture-chat',usage:{total_tokens:42}}}]:[])]});if(url==='/api/v1/news/draft-tasks'){window.__draftCalls.push(JSON.parse(options.body));return Response.json({id:'task-one',kind:'news-draft',status:'running'});}throw new Error('unexpected '+url);};await (await import('/ui/contentos-news.js')).openNewsDesk();})()`);
 assert.equal(await evaluate('window.__draftCalls.length'),0);
 await evaluate("document.querySelector('[data-saved]').value='base';document.querySelector('[data-saved]').dispatchEvent(new Event('change'));document.querySelector('[data-script]').value='Unsaved';document.querySelector('[data-ai-draft]').click()");await delay(100);
 assert.equal(await evaluate('window.__draftCalls.length'),0);
 await evaluate("document.querySelector('[data-script]').value='Nháp';document.querySelector('[data-ai-instruction]').value='60 giây';document.querySelector('[data-ai-draft]').click()");await delay(200);
 const payload=await evaluate('window.__draftCalls[0]');assert.equal(payload.workspaceId,'qa-news');assert.equal(payload.id,'base');assert.equal(payload.instruction,'60 giây');assert.equal(typeof payload.idempotencyKey,'string');
 assert.equal(await evaluate("document.querySelector('[data-script]').value"),'AI soạn [1].');
 assert.equal(await evaluate("document.querySelector('[data-approved]').checked"),false);
 assert.equal(await evaluate("document.querySelector('[data-saved]').value"),'generated');
 assert.match(await evaluate("document.querySelector('[data-status]').textContent"),/42 token/);
 await evaluate("document.querySelector('[data-close]').click()");await evaluate("(async()=>{await (await import('/ui/contentos-news.js')).openNewsDesk();})()");assert.match(await evaluate("document.querySelector('[data-ai-history]').textContent"),/succeeded/);assert.equal(await evaluate('window.__draftCalls.length'),1);await evaluate("document.querySelector('[data-close]').click()");evidence.sizes.push({width,noAutomaticCall:true,unsavedChangesBlocked:true,explicitApiDraft:true,draftRequiresApproval:true,usageVisible:true,reopenHistoryWithoutReplay:true});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/NEWS_DRAFT_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
