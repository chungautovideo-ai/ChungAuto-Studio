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



 const base='http://127.0.0.1:5180',evidence={sizes:[],syntheticFixtureOnly:true,noProviderCalls:true};
 for(const width of [1280,1920]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/home'});await delay(700);
  await evaluate(`(async()=>{window.__imageCalls=[];window.__uploadedImage=null;window.__supportsRefs=true;const ids=Array.from({length:5},(_,i)=>'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa'+i);window.fetch=async(url,options)=>{if(url==='/api/v1/images/project-media')return new Response(JSON.stringify({workspaceId:'qa-images',media:['inputs/product.png']}));if(url==='/api/v1/images/import-project'){window.__projectImport=JSON.parse(options.body);window.__uploadedImage={id:'cccccccc-cccc-cccc-cccc-cccccccccccc',prompt:'product.png',extension:'.png',aspect:'1:1'};return new Response(JSON.stringify(window.__uploadedImage),{status:201});}if(url==='/api/v1/images/import'){window.__uploadHeaders=options.headers;window.__uploadSize=options.body.size;window.__uploadedImage={id:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',prompt:'Ảnh thử.png',extension:'.png',aspect:'1:1'};return new Response(JSON.stringify(window.__uploadedImage),{status:201});}if(url==='/api/v1/catalogs/local')return new Response(JSON.stringify({entries:[]}));if(url==='/api/v1/images'){if(options?.method==='POST'){window.__imageCalls.push(JSON.parse(options.body));return new Response(JSON.stringify({id:ids[0]}));}return new Response(JSON.stringify({workspaceId:'qa-images',configured:true,model:'fixture',supportsReferences:window.__supportsRefs,images:[...ids.map((id,i)=>({id,prompt:'Fixture '+i,extension:'.png',aspect:'1:1'})),...(window.__uploadedImage?[window.__uploadedImage]:[])]}));}throw new Error('Unexpected request '+url);};const module=await import('/ui/contentos-images.js');await module.openImageTool({projectMedia:true});})()`);
  assert.equal(await evaluate('window.__imageCalls.length'),0);
  await evaluate(`(()=>{const input=document.querySelector('[data-reference-upload]'),dt=new DataTransfer();dt.items.add(new File([new Uint8Array([137,80,78,71])],'Ảnh thử.png',{type:'image/png'}));input.files=dt.files;input.dispatchEvent(new Event('change'));})()`);
  for(let i=0;i<50;i++){if(await evaluate("document.querySelector('[data-error]').textContent.includes('Đã nhập ảnh')"))break;await delay(100);}
  assert.equal(await evaluate('window.__uploadSize'),4);assert.equal((await evaluate('window.__uploadHeaders'))['X-ContentOS-Workspace'],'qa-images');assert.equal(await evaluate('window.__imageCalls.length'),0);
  assert.equal(await evaluate("[...document.querySelector('[data-references]').selectedOptions].some(o=>o.value==='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')"),true);
  await evaluate("for(const o of document.querySelector('[data-references]').options)o.selected=false");
  await evaluate("document.querySelector('[data-project-reference]').value='inputs/product.png';document.querySelector('[data-import-project]').click()");
  for(let i=0;i<50;i++){if(await evaluate("document.querySelector('[data-project-state]').textContent.includes('Đã nhập ảnh dự án')"))break;await delay(100);}
  assert.deepEqual(await evaluate('window.__projectImport'),{workspaceId:'qa-images',src:'inputs/product.png'});assert.equal(await evaluate('window.__imageCalls.length'),0);
  assert.equal(await evaluate("[...document.querySelector('[data-references]').selectedOptions].some(o=>o.value==='cccccccc-cccc-cccc-cccc-cccccccccccc')"),true);
  await evaluate("for(const o of document.querySelector('[data-references]').options)o.selected=false");


  await evaluate("(()=>{const d=document.querySelector('dialog[aria-label=\"Tạo ảnh AI\"]');d.querySelector('[data-count]').value='3';d.querySelector('[data-count]').dispatchEvent(new Event('change'));if(d.querySelector('[data-generate]').textContent!=='Tạo 3 ảnh')throw new Error('Variant label');d.querySelector('[data-prompt]').value='Reference request';d.querySelector('[data-references]').options[0].selected=true;d.querySelector('[data-generate]').click();})()");await delay(200);
  const payload=await evaluate('window.__imageCalls[0]');assert.equal(payload.count,3);assert.equal(payload.workspaceId,'qa-images');assert.equal(payload.referenceIds.length,1);assert.equal(payload.prompt,'Reference request');
  await evaluate("(()=>{const d=document.querySelector('dialog');for(const o of d.querySelector('[data-references]').options)o.selected=true;d.querySelector('[data-generate]').click();})()");assert.equal(await evaluate('window.__imageCalls.length'),1);assert.match(await evaluate("document.querySelector('[data-error]').textContent"),/tối đa 4/);
  await evaluate(`(()=>{window.__cancelObserved=false;const original=window.fetch;window.fetch=(url,options)=>{if(url==='/api/v1/images'&&options?.method==='POST')return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>{window.__cancelObserved=true;reject(new DOMException('Cancelled','AbortError'));},{once:true}));return original(url,options);};for(const o of document.querySelector('[data-references]').options)o.selected=false;document.querySelector('[data-generate]').click();})()`);
  assert.equal(await evaluate("document.querySelector('[data-cancel]').hidden"),false);
  await evaluate("document.querySelector('[data-cancel]').click()");
  for(let i=0;i<50;i++){if(await evaluate('window.__cancelObserved'))break;await delay(50);}
  assert.equal(await evaluate('window.__cancelObserved'),true);await delay(100);
  assert.match(await evaluate("document.querySelector('[data-error]').textContent"),/Đã hủy chờ/);assert.equal(await evaluate("document.querySelector('[data-generate]').disabled"),false);
  await evaluate("window.__supportsRefs=false;document.querySelector('[data-refresh]').click()");await delay(100);assert.equal(await evaluate("document.querySelector('[data-references]').disabled"),true);
  await evaluate("window.__supportsRefs=true;document.querySelector('[data-refresh]').click()");await delay(100);
  await evaluate("window.__cancelObserved=false;document.querySelector('[data-generate]').click();document.querySelector('[data-close]').click()");await delay(100);assert.equal(await evaluate('window.__cancelObserved'),true);assert.equal(await evaluate("!!document.querySelector('dialog[aria-label=\"Tạo ảnh AI\"]')"),false);
  evidence.sizes.push({width,closeAbortsFetch:true,cancelAbortsFetchAndAllowsNextRun:true,projectPhotoImportPayloadAndSelection:true,localImportPayloadAndSelection:true,noAutoGeneration:true,selectedReferencePayload:true,multiVariantSelectionAndPayload:true,maxFourEnforced:true,unsupportedDisabled:true});
 }
 assert.deepEqual(errors,[]);evidence.pageErrors=errors;fs.writeFileSync('docs/IMAGE_REFERENCE_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
