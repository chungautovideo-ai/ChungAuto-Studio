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
 for(const width of [1280,1920,390]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'http://127.0.0.1:5180/home?templateQA='+width});await delay(900);
  await evaluate(`(async()=>{
   const {openTemplateHistory}=await import('/ui/contentos-template-history.js');
   const entries=[{id:'qa-parent',name:'QA Style',installed:true,version:1,audio:{musicVolume:.1}},{id:'qa-child',parentId:'qa-parent',name:'QA Style improved',installed:true,version:2,changeNote:'Softer music',audio:{musicVolume:.08}}];
   window.qaImproved=null;window.qaApplied=null;
   await openTemplateHistory({id:'qa-child',request:async url=>Response.json(url.startsWith('/api/library')?entries:{template:entries.find(t=>t.id===new URL(url,location.origin).searchParams.get('id')),skill:new URL(url,location.origin).searchParams.get('id')==='qa-parent'?'Original rules':'Improved rules'}),onApply:async item=>{window.qaApplied=item.id;},onImprove:draft=>{window.qaImproved=draft;}});
  })()`);
  assert.equal(await evaluate(`document.querySelector('[data-versions]').options.length`),2);
  assert.match(await evaluate(`document.querySelector('[data-diff]').textContent`),/0.08/);
  assert.match(await evaluate(`document.querySelector('[data-diff]').textContent`),/0.1/);
  await evaluate(`document.querySelector('[data-improve]').click()`);await delay(100);
  assert.equal(await evaluate(`window.qaImproved.parentId`),'qa-child');assert.equal(await evaluate(`window.qaImproved.skill`),'Improved rules');
  await evaluate(`(async()=>{const {openTemplateHistory}=await import('/ui/contentos-template-history.js');await openTemplateHistory({id:'a',request:async url=>Response.json(url.startsWith('/api/library')?[{id:'a',name:'Original',installed:true,version:1}]:{template:{id:'a',name:'Original',version:1},skill:'Rules'}),onApply:async item=>{window.qaApplied=item.id;},onImprove:()=>{}});})()`);
  await evaluate(`document.querySelector('[data-apply]').click()`);await delay(100);
  assert.equal(await evaluate(`window.qaApplied`),'a');assert.equal(await evaluate(`document.querySelectorAll('.cos-template-history').length`),0);
  results.push({width,parentDiff:true,improvePrefillsRules:true,applySelected:true});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/TEMPLATE_HISTORY_BROWSER_SMOKE.json',JSON.stringify({results,errors,readOnly:true},null,2));console.log({results,errors});await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();await delay(500);/* Retain QA profile on D. */}
