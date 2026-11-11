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


 const fixture=JSON.parse(fs.readFileSync('docs/FIRST_BUILD_SOURCES_API_SMOKE.json','utf8')),dir=fixture.project;
 const evidence={syntheticProject:dir,sizes:[],submittedJobs:false};
 for(const width of [1280,1920]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://127.0.0.1:5180/home?pick='+encodeURIComponent(dir)});
  for(let i=0;i<150;i++){if(await evaluate("!!document.querySelector('#setupInspectSources')"))break;await delay(100);}
  assert.ok(await evaluate("!!document.querySelector('#setupInspectSources')"));
  await evaluate("(()=>{const t=document.querySelector('#note');t.value="+JSON.stringify(fixture.note)+";t.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#setupInspectSources').click();})()");
  for(let i=0;i<60;i++){if(await evaluate("document.querySelectorAll('#setupSourceCards .cos-source-card').length===2"))break;await delay(100);}
  assert.equal(await evaluate("document.querySelectorAll('#setupSourceCards .cos-source-card').length"),2);
  assert.match(await evaluate("document.querySelector('#setupSourceCards').textContent"),/B-roll/);
  assert.equal(await evaluate("document.querySelector('#setupSurveyControls').hidden"),false);
  await evaluate("document.querySelector('#setupSurveyPreview').click()");
  for(let i=0;i<100;i++){if(await evaluate("document.querySelectorAll('#setupSurveyFrames img').length===6"))break;await delay(100);}
  assert.equal(await evaluate("document.querySelectorAll('#setupSurveyFrames img').length"),6);
  for(let i=0;i<30;i++){if(await evaluate("[...document.querySelectorAll('#setupSurveyFrames img')].every(img=>img.complete&&img.naturalWidth>0)"))break;await delay(100);}
  assert.ok(await evaluate("[...document.querySelectorAll('#setupSurveyFrames img')].every(img=>img.complete&&img.naturalWidth>0)"));
  assert.match(await evaluate("document.querySelector('#setupSurveyStatus').textContent"),/chép riêng/);
  await evaluate("document.querySelector('#setupSkipSurvey').click()");assert.match(await evaluate("document.querySelector('#setupSurveyStatus').textContent"),/không đính kèm/);
  const bounds=await evaluate("(()=>{const c=document.querySelector('#setupSourceCards');c.scrollIntoView({block:'center'});const r=c.getBoundingClientRect();return {left:r.left,right:r.right}})()");assert.ok(bounds.left>=0&&bounds.right<=width);
  await evaluate("(()=>{const t=document.querySelector('#note');t.value='Changed request';t.dispatchEvent(new Event('input',{bubbles:true}));})()");assert.equal(await evaluate("document.querySelectorAll('#setupSourceCards .cos-source-card').length"),0);
  assert.equal(await evaluate("document.querySelectorAll('#setupSurveyFrames img').length"),0);assert.equal(await evaluate("document.querySelector('#setupSurveyControls').hidden"),true);
  evidence.sizes.push({width,arollBrollCards:true,setupSurveySixDecodedImages:true,skipSurveyExplicit:true,editingInvalidatesInspectionAndSurvey:true,bounds});
 }
 assert.deepEqual(errors,[]);evidence.pageErrors=errors;fs.writeFileSync('docs/FIRST_BUILD_SOURCES_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
