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


 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-auto-source-'));
 try{
  const a=path.join(fixture,'A roll có dấu'),b=path.join(fixture,'B roll mẫu');fs.mkdirSync(a);fs.mkdirSync(b);fs.writeFileSync(path.join(a,'main.mp4'),'synthetic');fs.writeFileSync(path.join(b,'cutaway.mp4'),'synthetic');
  const results=[];
  for(const width of [1280,1920]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'http://127.0.0.1:5180/home'});
   for(let i=0;i<100;i++){if(await evaluate('!!document.querySelector("#homeNote")'))break;await delay(100);}
   await delay(2000);const prompt='A-roll: '+a+' dựng cho tôi video này broll ở đây '+b;
   await evaluate('(()=>{const n=document.querySelector("#homeNote");n.value='+JSON.stringify(prompt)+';n.dispatchEvent(new Event("input",{bubbles:true}));})()');
   let state;for(let i=0;i<150;i++){state=await evaluate('({cards:document.querySelector("#homeSourceCards").textContent,hidden:document.querySelector("#homePrimarySource").hidden,status:document.querySelector("#homeSourceStatus").textContent,options:document.querySelector("#homeSourceVideo").options.length})');if(!state.hidden&&state.options===2)break;await delay(100);}
   assert.equal(state.hidden,false);assert.equal(state.options,2);assert.ok(state.cards.includes(a));assert.ok(state.cards.includes(b));assert.match(state.cards,/A-roll/);assert.match(state.cards,/B-roll/);const collapsed=await evaluate('!document.querySelector("#homeSourceDetails").open');assert.equal(collapsed,true);assert.equal(await evaluate('document.querySelector("#homeSourceVideo").selectedOptions[0].textContent.includes("main.mp4")'),true);
   await evaluate('document.querySelector("#homeSourceDetails").open=true');assert.equal(await evaluate('document.querySelector("#homeSourceVideo").getBoundingClientRect().height>0'),true);
   await evaluate('document.querySelector("#homeSourceDetails").open=false');
   await evaluate('window.__originalFetch=window.fetch;window.fetch=(url,options)=>{if(url==="/api/v1/storage/new-project"){window.__sourcePayload=JSON.parse(options.body);return Promise.resolve(new Response(JSON.stringify({error:"Browser smoke: no project created"}),{status:400,headers:{"Content-Type":"application/json"}}));}return window.__originalFetch(url,options);};document.querySelector("#homeGo").click()');await delay(200);assert.equal(await evaluate('window.__sourcePayload.selected'),path.join(a,'main.mp4'));await evaluate('window.fetch=window.__originalFetch');
   results.push({width,...state,collapsed,mainActionUsesSelection:true});
   await evaluate('(()=>{const n=document.querySelector("#homeNote");n.value="Chỉ sửa chữ";n.dispatchEvent(new Event("input",{bubbles:true}));})()');await delay(1100);assert.equal(await evaluate('document.querySelector("#homePrimarySource").hidden'),true);
  }
  assert.deepEqual(errors,[]);fs.writeFileSync('docs/INLINE_SOURCES_BROWSER_SMOKE.json',JSON.stringify({results,errors,synthetic:true,createdProject:false,dispatchedAI:false},null,2));console.log({cases:results.length,errors});
 }finally{fs.rmSync(fixture,{recursive:true,force:true});}
 await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}

