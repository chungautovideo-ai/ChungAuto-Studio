import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import http from 'node:http';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';
const routes={'/ui/contentos-plate-review.js':'editor/ui/contentos-plate-review.js','/ui/contentos-batch-edit.js':'editor/ui/contentos-batch-edit.js','/ui/contentos-model-picker.js':'editor/ui/contentos-model-picker.js','/lib/person-selection.js':'editor/lib/person-selection.js','/app.css':'editor/ui/app.css','/navigation.css':'editor/ui/contentos-navigation.css','/sample.mp4':'workspace/cache/person-sam2-motion6.mp4'};
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


 await evaluate(`(async()=>{window.posts=0;const m=await import('/ui/contentos-plate-review.js');await m.openPlateReviewDialog({mediaUrl:()=>'/sample.mp4',request:async(url,options)=>{if(options?.method==='POST'){window.posts++;return {ok:true,json:async()=>({approved:true})};}return {ok:true,json:async()=>({required:true,approved:false,items:[{group:'segments',id:'source-a',src:'a',sha256:'fixture',from:1,duration:.5},{group:'brolls',id:'source-b',src:'b',sha256:'fixture',from:2,duration:.6}]})};}});})()`);
 assert.match(await evaluate('document.querySelector("dialog").textContent'),/1\.00–1\.50/);
 assert.equal(await evaluate('window.posts'),0);
 await evaluate('document.querySelectorAll("video").forEach(v=>v.muted=true);document.querySelectorAll("dialog .outline")[0].click()');
 await wait('document.querySelector("video").paused && document.querySelector("video").currentTime>=1.45');
 assert.ok(await evaluate('document.querySelector("video").currentTime<=1.55'));
 await evaluate('document.querySelectorAll("dialog .outline")[0].click()');
 await wait('!document.querySelector("video").paused');
 await evaluate('document.querySelectorAll("dialog .outline")[1].click()');
 await wait('!document.querySelectorAll("video")[1].paused');
 assert.equal(await evaluate('document.querySelector("video").paused'),true);
 await wait('document.querySelectorAll("video")[1].paused && document.querySelectorAll("video")[1].currentTime>=2.55');
 assert.doesNotMatch(await evaluate('document.querySelector("[data-status]").textContent'),/Không phát được/);
 for(const width of [1280,390]){await send('Emulation.setDeviceMetricsOverride',{width,height:850,deviceScaleFactor:1,mobile:false});await delay(100);assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`docs/PLATE_REVIEW_RANGE_${width}.png`,Buffer.from(shot.data,'base64'));}
 await evaluate('document.querySelector("[data-confirm]").click()');assert.equal(await evaluate('document.querySelector("[data-save]").disabled'),false);
 await evaluate('document.querySelector("video").dispatchEvent(new Event("error"))');assert.equal(await evaluate('document.querySelector("[data-save]").disabled'),true);
 assert.equal(await evaluate('window.posts'),0);
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/PLATE_REVIEW_RANGE_BROWSER_SMOKE.json',JSON.stringify({component:true,source:'real six-second QA video; review API fixture',rangeStop:true,replay:true,pauseOther:true,errorDisablesConfirmation:true,noAutomaticReceipt:true,widths:[1280,390],pageErrors:errors},null,2));console.log('Plate review range UI passed.');
}finally{ws?.close();chrome.kill();server.close();}
