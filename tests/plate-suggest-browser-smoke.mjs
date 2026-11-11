import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import http from 'node:http';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';
const routes={'/ui/contentos-plate-privacy.js':'editor/ui/contentos-plate-privacy.js','/lib/plate-regions.js':'editor/lib/plate-regions.js','/ui/contentos-batch-edit.js':'editor/ui/contentos-batch-edit.js','/ui/contentos-model-picker.js':'editor/ui/contentos-model-picker.js','/lib/person-selection.js':'editor/lib/person-selection.js','/app.css':'editor/ui/app.css','/navigation.css':'editor/ui/contentos-navigation.css','/sample.mp4':'workspace/content/2026-11-05/contentos-smoke-real-car-plate/inputs/raw.mp4'};
const server=http.createServer((req,res)=>{const file=routes[req.url];if(file&&file.endsWith('.mp4')&&req.headers.range){const bytes=fs.readFileSync(file),match=/bytes=(\d+)-(\d*)/.exec(req.headers.range),start=Number(match[1]),end=match[2]?Number(match[2]):bytes.length-1;res.writeHead(206,{'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Content-Length':end-start+1});res.end(bytes.subarray(start,end+1));return;}if(file){res.setHeader('Content-Type',file.endsWith('.mp4')?'video/mp4':file.endsWith('.css')?'text/css':'text/javascript');res.end(fs.readFileSync(file));}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><link rel="stylesheet" href="/app.css"><link rel="stylesheet" href="/navigation.css"><body style="padding:16px"></body>');}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'cos-track-error-')),chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--remote-debugging-port=0','--no-first-run','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'}),delay=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try{
 let port;for(let n=0;n<100;n++){try{port=Number(fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]);break;}catch{await delay(100);}}assert.ok(port);
 const tabs=await(await fetch(`http://127.0.0.1:${port}/json`)).json();ws=new WebSocket(tabs.find(x=>x.type==='page').webSocketDebuggerUrl);await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;});let id=0;const pending=new Map(),errors=[];
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const k=++id;pending.set(k,{resolve,reject});ws.send(JSON.stringify({id:k,method,params}));setTimeout(()=>{if(pending.delete(k))reject(Error('CDP timeout'));},15000).unref();});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const wait=async expr=>{for(let n=0;n<200;n++){if(await evaluate(expr))return;await delay(50);}throw Error('Wait failed: '+expr);};
 await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});await wait('document.readyState==="complete"');



 await evaluate(`(async()=>{window.calls=[];window.applied=0;window.fail=false;const m=await import('/ui/contentos-plate-privacy.js');await m.openPlatePrivacy({item:{id:'a',mediaStart:0},sourceUrl:'/sample.mp4',resultUrl:()=>'/sample.mp4',onReplace:()=>window.applied++,request:async(url)=>{window.calls.push(url);return {ok:!window.fail,json:async()=>window.fail?{error:'OCR unavailable fixture'}:{result:{proposals:[{roi:[.1,.7,.8,.15],confidence:.99,touchesFrame:true}]}}};}});})()`);
 await wait('!document.querySelector("[data-create]").disabled');
 const fields='[...document.querySelectorAll("[data-fields] input")].map(x=>x.value)';const before=await evaluate(fields);
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Gợi ý vùng biển")).click()');
 await wait('[...document.querySelectorAll("button")].some(b=>b.textContent==="Dùng các vùng gợi ý"&&!b.hidden)');
 assert.deepEqual(await evaluate(fields),before);assert.match(await evaluate('document.querySelector("[data-state]").textContent'),/sát mép khung/);
 await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Dùng các vùng gợi ý").click()');
 assert.deepEqual(await evaluate(fields),['0.1000','0.7000','0.8000','0.1500']);
 assert.match(await evaluate('document.querySelector("[data-state]").textContent'),/sát mép khung/);assert.equal(await evaluate('window.applied'),0);assert.deepEqual(await evaluate('window.calls'),['/api/plate-privacy/suggest']);
 for(const width of [1280,390]){await send('Emulation.setDeviceMetricsOverride',{width,height:850,deviceScaleFactor:1,mobile:false});await delay(100);assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`docs/PLATE_SUGGEST_${width}.png`,Buffer.from(shot.data,'base64'));}
 await evaluate('window.fail=true;[...document.querySelectorAll("button")].find(b=>b.textContent.includes("Gợi ý vùng biển")).click()');
 await wait('document.querySelector("[data-state]").textContent.includes("OCR unavailable")');
 assert.equal(await evaluate('document.querySelector("[data-create]").disabled'),false);
 assert.deepEqual(await evaluate(fields),['0.1000','0.7000','0.8000','0.1500']);
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/PLATE_SUGGEST_BROWSER_SMOKE.json',JSON.stringify({component:true,response:'fixture',realSourceFrame:true,noAutomaticRegionChange:true,explicitUse:true,noApplyOrMaskRequest:true,errorKeepsManual:true,widths:[1280,390],pageErrors:errors},null,2));console.log('Plate suggestion UI passed.');
}finally{ws?.close();chrome.kill();server.close();}
