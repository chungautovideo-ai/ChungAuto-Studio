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



 const base=process.env.CONTENTOS_QA_URL||'http://127.0.0.1:5194';
 const dir=process.env.CONTENTOS_QA_PROJECT||'workspace/content/2026-11-04/contentos-smoke-apieditor-4';
 const evidence={syntheticProject:dir,sizes:[],submittedJobs:false};
 for(const width of [1280,1920,820,600,390]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:base+'/home?pick='+encodeURIComponent(dir)});
  for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('[data-automotive-options]')"))break;await delay(100);}
  assert.equal(await evaluate("document.querySelectorAll('[data-automotive-options]').length"),1);
  await evaluate(`(()=>{const box=document.querySelector('[data-automotive-options]');box.open=true;const t=box.querySelector('input');t.checked=true;t.dispatchEvent(new Event('change'));for(const s of box.querySelectorAll('select')){s.value=s.dataset.automotiveField==='color'?'natural':s.dataset.automotiveField==='sfx'?'tat':'off';s.dispatchEvent(new Event('change'));}box.scrollIntoView({block:'start'});})()`);
  assert.deepEqual(await evaluate("[...document.querySelectorAll('input[name=sfxl]')].map(r=>({value:r.value,disabled:r.disabled,checked:r.checked}))"),[{value:'nhieu',disabled:true,checked:false},{value:'vua',disabled:true,checked:false},{value:'tat',disabled:true,checked:true}]);
  assert.equal(await evaluate("document.querySelector('#sfxT').textContent"),'Tắt toàn bộ SFX');
  await evaluate("var s=document.querySelector('[data-automotive-field=sfx]');s.value='keep';s.dispatchEvent(new Event('change'))");
  assert.equal(await evaluate("document.querySelector('input[name=sfxl]:checked').value"),'nhieu');
  assert.equal(await evaluate("[...document.querySelectorAll('input[name=sfxl]')].some(r=>r.disabled)"),false);
  await evaluate("var s=document.querySelector('[data-automotive-field=sfx]');s.value='tat';s.dispatchEvent(new Event('change'))");
  const bounds=await evaluate(`(()=>{const box=document.querySelector('[data-automotive-options]');return [...box.querySelectorAll('select')].map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}})})()`);

  assert.ok(bounds.every(r=>r.left>=-1&&r.right<=width+1&&r.width>100),JSON.stringify({width,bounds}));
  const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/AUTOMOTIVE_SETUP_'+width+'.png',Buffer.from(shot.data,'base64'));
  evidence.sizes.push({width,bounds,collapsedByDefault:true,oneControl:true});
 }
 await evaluate(`(()=>{const original=window.fetch.bind(window);window.fetch=(url,options)=>{if(url==='/api/ai-job'&&options?.method==='POST'){window.__qaSubmitted=JSON.parse(options.body);return Promise.resolve(new Response(JSON.stringify({ok:false,error:'QA captured request; no agent dispatched'}),{headers:{'Content-Type':'application/json'}}));}return original(url,options);};document.querySelector('#go').click();})()`);
 for(let i=0;i<50;i++){if(await evaluate('!!window.__qaSubmitted'))break;await delay(100);}
 const captured=await evaluate('window.__qaSubmitted');assert.deepEqual(captured.automotiveOptions,{color:'natural',beauty:'off',watermark:'off',cta:'off',music:'off',sfx:'tat'});
 await evaluate(`(()=>{const t=document.querySelector('[data-automotive-options] input');t.checked=false;t.dispatchEvent(new Event('change'));window.__qaSubmitted=null;document.querySelector('#go').click();})()`);
 for(let i=0;i<50;i++){if(await evaluate('!!window.__qaSubmitted'))break;await delay(100);}
 assert.equal((await evaluate('window.__qaSubmitted')).automotiveOptions,null);assert.equal(await evaluate("document.querySelector('input[name=sfxl]:checked').value"),'nhieu');assert.equal(await evaluate("[...document.querySelectorAll('input[name=sfxl]')].some(r=>r.disabled)"),false);
 assert.deepEqual(errors,[]);evidence.payloadChecked=true;evidence.optOutNull=true;evidence.sfxOverrideVisible=true;evidence.sfxKeepRestoresBase=true;evidence.pageErrors=errors;
 fs.writeFileSync('docs/AUTOMOTIVE_SETUP_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();}
