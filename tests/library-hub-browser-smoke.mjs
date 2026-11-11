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
  await send('Emulation.setDeviceMetricsOverride',{width,height:720,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/home#library/templates'});
  for(let i=0;i<120;i++){if(await evaluate(`!!document.querySelector('#vLibrary #tgrid .tcard')`))break;await delay(100);}
  assert.equal(await evaluate(`document.querySelector('#vLibrary').hidden`),false);assert.equal(await evaluate(`document.querySelectorAll('[data-library-tab]').length`),4);
  assert.equal(await evaluate(`document.querySelectorAll('#tgrid').length`),1);
  const cards=await evaluate(`document.querySelectorAll('#vLibrary #tgrid .tcard').length`);assert.ok(cards>1);
  const selected=await evaluate(`(async()=>{const response=await fetch('/api/library?local=1'),data=await response.json(),items=Array.isArray(data)?data:data.items||[],template=items.find(t=>t.id==='chungauto-factory-quang-cao')||items.find(t=>t.id!=='kho-cua-toi');if(!template)throw new Error('No installed template');document.querySelector('#tgrid [data-id="'+CSS.escape(template.id)+'"]').click();return template.name;})()`);await delay(500);assert.equal(await evaluate(`document.querySelector('#styleName').textContent`),selected);
  await evaluate(`document.querySelector('#libraryTemplateDetails details').open=true`);await delay(500);assert.match(await evaluate(`document.querySelector('#libraryTemplateDetails').textContent`),/SKILL.md/);

  await evaluate(`document.querySelector('#tSearch').value='__missing_fixture__';document.querySelector('#tSearch').dispatchEvent(new Event('input',{bubbles:true}))`);assert.match(await evaluate(`document.querySelector('#tgrid').textContent`),/Không có mẫu/);
  await evaluate(`document.querySelector('#tSearch').value='';document.querySelector('#tSearch').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-library-tab="references"]').click()`);await delay(700);assert.equal(await evaluate(`document.querySelector('#vSourceLibrary').hidden`),false);assert.equal(await evaluate(`location.hash`),'#library/references');
  await evaluate(`history.back()`);await delay(700);assert.equal(await evaluate(`document.querySelector('#homeTemplateShelf').hidden`),false);
  await evaluate(`document.querySelector('[data-library-tab="effects"]').click()`);await delay(700);assert.equal(await evaluate(`document.querySelector('#vKho').hidden`),false);
  await evaluate(`document.querySelector('[data-library-tab="media"]').click();document.querySelector('[data-library-intake]').click()`);await delay(600);assert.equal(await evaluate(`document.querySelectorAll('dialog[open]').length`),1);
  await evaluate(`document.querySelector('dialog[open]').dispatchEvent(new Event('intake-close'));document.querySelector('#navHome').click();document.querySelector('#styleBtn').click()`);await delay(600);assert.equal(await evaluate(`document.querySelector('#vHome').hidden`),false);assert.equal(await evaluate(`document.querySelector('#homeTemplateShelf').hidden`),false);
  await evaluate(`document.querySelector('#navSourceLibrary').click()`);await delay(300);
  await evaluate(`document.querySelector('#side').scrollTop=0`);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/LIBRARY_HUB_'+width+'.png',Buffer.from(shot.data,'base64'));
  await send('Page.navigate',{url:base+'/home#kho'});await delay(1500);assert.equal(await evaluate(`document.querySelector('#vLibrary').hidden`),false);assert.equal(await evaluate(`document.querySelector('#vKho').hidden`),false);
  results.push({width,tabs:4,cards,search:true,references:true,effects:true,nasIntake:true,homeStyleEntry:true,back:true,legacyAlias:true});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/LIBRARY_HUB_BROWSER_SMOKE.json',JSON.stringify({results,errors,readOnly:true},null,2));console.log({results,errors});await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
