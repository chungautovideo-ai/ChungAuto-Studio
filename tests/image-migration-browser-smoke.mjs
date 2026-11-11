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


 const base='http://127.0.0.1:5180',configFile='config/sources.local.json',previousConfig=fs.readFileSync(configFile,'utf8');
 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'cos-image-import-ui-')),source=path.join(fixture,'image-projects/product');fs.mkdirSync(source,{recursive:true});
 const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQ1EAAAAASUVORK5CYII=','base64'),meta={name:'ContentOS-Smoke-ImageMigration',prompt:'Sản phẩm trong studio',background:'background.png',final:'final.png',model:'fixture-image',apiKey:'DO-NOT-COPY'};
 for(const name of ['background.png','final.png'])fs.writeFileSync(path.join(source,name),bytes);fs.writeFileSync(path.join(source,'meta.json'),JSON.stringify(meta));
 for(let i=0;i<102;i++){const dir=path.join(fixture,'image-projects','z'+String(i).padStart(3,'0'));fs.mkdirSync(dir);fs.writeFileSync(path.join(dir,'image.png'),bytes);fs.writeFileSync(path.join(dir,'meta.json'),JSON.stringify({name:'Paged image '+i,background:'image.png',final:'image.png'}));}
 async function api(url,body){const r=await fetch(base+url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),v=await r.json();assert.ok(r.ok,JSON.stringify(v));return v;}
 async function waitFor(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Timeout '+expression);}
 const evidence={sizes:[],syntheticSource:true};
 try{
  fs.writeFileSync(configFile,JSON.stringify({...JSON.parse(previousConfig),aievRoot:fixture}));previousWorkspace=(await api('/api/v1/workspaces')).activeId;const workspace=await api('/api/v1/workspaces',{name:'ContentOS-Smoke Image Migration '+Date.now()});
  for(const width of [1280,1920]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/home'});await waitFor("typeof document.querySelector('#navContentOS')?.onclick==='function'");await evaluate("document.querySelector('#navContentOS').click()");await waitFor("!!document.querySelector('#cosMigrationScan')");await evaluate("document.querySelector('#cosMigrationScan').closest('details').open=true;document.querySelector('#cosMigrationScan').click()");await waitFor("!!document.querySelector('[data-import-project^=\"aiev-image:\"]')");
   await evaluate("document.querySelector('[data-import-project^=\"aiev-image:\"]').click()");await waitFor("[...document.querySelectorAll('[data-import-result] button')].some(b=>b.textContent==='Mở thư viện ảnh')");await evaluate("[...document.querySelectorAll('[data-import-result] button')].find(b=>b.textContent==='Mở thư viện ảnh').click()");await waitFor("!!document.querySelector('[data-results] img')");assert.match(await evaluate("document.querySelector('[data-results]').textContent"),/Sản phẩm trong studio/);
   const list=await api('/api/v1/images');assert.equal(list.images.length,width===1280?1:2);const image=list.images.find(i=>i.source.id==='aiev-image:product/background');assert.equal(image.origin,'aiev-migration');assert.ok(!JSON.stringify(image).includes('DO-NOT-COPY'));assert.deepEqual(fs.readFileSync(path.join('workspace/contentos/images',workspace.id,image.id+image.extension)),bytes);await evaluate("document.querySelector('[data-close]').click()");
   assert.equal(await evaluate('document.querySelectorAll(\'[data-import-project^="aiev-image:"]\').length'),200);await evaluate("[...document.querySelectorAll('#cosMigrationPreview button')].find(b=>b.textContent==='Xem thêm ảnh AIEV').click()");await waitFor('document.querySelectorAll(\'[data-import-project^="aiev-image:"]\').length===206');assert.ok(await evaluate("[...document.querySelectorAll('[data-import-result] button')].some(b=>b.textContent==='Mở thư viện ảnh')"),'Previous import result retained');
   await evaluate("document.querySelector('[data-import-project=\"aiev-image:z101/final\"]').click()");await waitFor("document.querySelector('[data-import-project=\"aiev-image:z101/final\"]').parentElement.querySelector('[data-import-result] button')!==null");const afterPage=await api('/api/v1/images');assert.equal(afterPage.images.length,2);assert.ok(afterPage.images.some(i=>i.source.id==='aiev-image:z101/final'));evidence.sizes.push({width,settingsImport:true,sharedLibrary:true,reused:width===1920,pagedImages:206,latePageImport:true,previousResultRetained:true});
  }
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(source,'meta.json'))),meta);assert.deepEqual(fs.readFileSync(path.join(source,'background.png')),bytes);assert.deepEqual(errors,[]);evidence.sourceUnchanged=true;evidence.pageErrors=errors;fs.writeFileSync('docs/IMAGE_MIGRATION_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);
 }finally{fs.writeFileSync(configFile,previousConfig);fs.rmSync(fixture,{recursive:true,force:true});}
 await send('Browser.close').catch(()=>{});
}finally{if(previousWorkspace)await fetch('http://127.0.0.1:5180/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:previousWorkspace})});ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
