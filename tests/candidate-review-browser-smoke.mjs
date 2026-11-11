import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-layout-'));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--no-first-run','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let ws;
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


 const fixture=JSON.parse(fs.readFileSync('docs/CANDIDATE_REVIEW_API_SMOKE.json','utf8')),dir=fixture.browserFixture;
 const evidence={syntheticProject:dir,sizes:[]};
 for(const width of [1280,1920]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://127.0.0.1:5180/home'});
  for(let i=0;i<100;i++){if(await evaluate("typeof document.querySelector('#plist')?.onclick==='function'||!!document.querySelector('#plist .pitem')"))break;await delay(100);}
  await delay(500);
  await evaluate("(()=>{const item=[...document.querySelectorAll('#plist .pitem')].find(e=>e.dataset.dir==="+JSON.stringify(dir)+");if(!item)throw Error('Missing QA project');item.click();})()");
  for(let i=0;i<50;i++){if(await evaluate("document.querySelector('#aiRetry')?.textContent==='Đối chiếu bản AI'"))break;await delay(100);}
  assert.equal(await evaluate("document.querySelector('#aiRetry')?.textContent"),'Đối chiếu bản AI');
  await evaluate("document.querySelector('#aiRetry').click()");
  for(let i=0;i<50;i++){if(await evaluate("!!document.querySelector('dialog[aria-label=\"Đối chiếu bản AI\"]')"))break;await delay(100);}
  const bounds=await evaluate("(()=>{const d=document.querySelector('dialog[aria-label=\"Đối chiếu bản AI\"]'),r=d.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,text:d.textContent}})()");assert.ok(bounds.left>=0&&bounds.right<=width);assert.match(bounds.text,/Tên dự án/);
  assert.equal(await evaluate("[...document.querySelectorAll('dialog[aria-label=\"Đối chiếu bản AI\"] button')].find(b=>b.textContent==='Áp bản AI và lưu lịch sử').disabled"),true);
  await evaluate("document.querySelector('dialog[aria-label=\"Đối chiếu bản AI\"] input').click()");
  assert.equal(await evaluate("[...document.querySelectorAll('dialog[aria-label=\"Đối chiếu bản AI\"] button')].find(b=>b.textContent==='Áp bản AI và lưu lịch sử').disabled"),false);
  await evaluate("[...document.querySelectorAll('dialog[aria-label=\"Đối chiếu bản AI\"] button')].find(b=>b.textContent==='Đóng đối chiếu').click()");
  evidence.sizes.push({width,comparisonVisible:true,applyRequiresSelection:true,bounds:{left:bounds.left,right:bounds.right}});
 }
 await evaluate("document.querySelector('#aiRetry').click()");await delay(250);
 await evaluate("[...document.querySelectorAll('dialog[aria-label=\"Đối chiếu bản AI\"] button')].find(b=>b.textContent==='Giữ bản hiện tại').click()");
 for(let i=0;i<50;i++){if(await evaluate("document.querySelector('dialog[aria-label=\"Đối chiếu bản AI\"] [role=status]')?.textContent.includes('Đã giữ')"))break;await delay(100);}
 assert.ok(await evaluate("document.querySelector('dialog[aria-label=\"Đối chiếu bản AI\"] [role=status]').textContent.includes('Đã giữ')"));
 assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'work/ai-job.json'))).resolution,'kept-manual');
 assert.deepEqual(errors,[]);evidence.keepManualPersisted=true;evidence.pageErrors=errors;
 fs.writeFileSync('docs/CANDIDATE_REVIEW_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);
 await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
