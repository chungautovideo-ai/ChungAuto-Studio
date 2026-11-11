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

 const results=[];const templateId='chungauto-factory-quang-cao';
 for(const width of [1280,1920]){await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'http://127.0.0.1:5180/home'});let ready=false;for(let i=0;i<100;i++){ready=await evaluate(`!!document.querySelector('.tcard[data-id="${templateId}"] video')`);if(ready)break;await delay(100);}assert.ok(ready,'Installed template with preview visible');await delay(2500);await evaluate(`document.querySelector('.tcard[data-id="${templateId}"]').click()`);await delay(300);const selected=await evaluate(`document.querySelector('.tcard[data-id="${templateId}"]').getAttribute('aria-pressed')`);assert.equal(selected,'true');await evaluate(`document.querySelector('.tcard[data-id="${templateId}"] video').play()`);await delay(1200);const media=await evaluate(`(()=>{const c=document.querySelector('.tcard[data-id="${templateId}"]'),v=c.querySelector('video');return {time:v.currentTime,width:v.videoWidth,height:v.videoHeight,duration:v.duration,description:c.textContent};})()`);assert.ok(media.time>0);assert.equal(media.width,360);assert.equal(media.height,640);assert.equal(media.duration,30);assert.match(media.description,/preview trích/i);results.push({width,...media});}
 const library=await (await fetch('http://127.0.0.1:5180/api/library?local=1')).json();const item=(Array.isArray(library)?library:library.items).find(t=>t.id===templateId);assert.ok(item.installed);assert.ok(item.preview);assert.equal(item.compatibility.factoryEngine,false);const hidden=await fetch('http://127.0.0.1:5180/templates-media/'+templateId+'/SKILL.md');assert.equal(hidden.status,404);assert.deepEqual(errors,[]);
 fs.writeFileSync('docs/CHUNGAUTO_FACTORY_TEMPLATE_BROWSER_SMOKE.json',JSON.stringify({results,installed:true,previewPlays:true,previewOrigin:'user reference excerpt; not newly rendered template output',privateSkillRouteBlocked:true,errors},null,2)+'\n');console.log({cases:results.length,previewPlays:true,errors});await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}


