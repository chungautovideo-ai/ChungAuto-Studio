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



 const base='http://127.0.0.1:5180';const before=await (await fetch(base+'/api/project')).json();
 const created=await (await fetch(base+'/api/new-project?file=fixture.mp4&name=ca-paint&noasr=1',{method:'POST',body:fs.readFileSync('tests/fixture.mp4')})).json();const dir=created.dir,file=path.join(dir,'project.json'),p=JSON.parse(fs.readFileSync(file));p.texts=[{id:'title-test',title:'CHỮ KIỂM THỬ',label:'NHÃN',sub:'Chữ phụ',at:0,dur:2}];p.audio={...p.audio,music:'',sfxLevel:'tat',autoSfx:false};fs.writeFileSync(file,JSON.stringify(p));
 try{
  const results=[];
  for(const width of [1280,1920]){
   await fetch(base+'/api/open',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dir})});await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/'});
   for(let i=0;i<120;i++){if(await evaluate('!!document.querySelector(".clip.text")'))break;await delay(100);}
   await evaluate('document.querySelector("#btnStudio")?.click()');await delay(300);await evaluate('document.querySelector(".clip.text").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,button:0,pointerType:"mouse"}));window.dispatchEvent(new PointerEvent("pointerup",{bubbles:true}))');await delay(300);
   for(let i=0;i<120;i++){if(await evaluate('!!document.querySelector("#player")?.shadowRoot?.querySelector("iframe")?.contentDocument?.querySelector(".tx-title")'))break;await delay(100);}await delay(800);
   await evaluate('document.querySelector(".text-appearance").open=true;document.querySelector(\'[aria-label="Mẫu chữ Hoàng hôn"]\').click()');
   const live=await evaluate('(()=>{const frame=document.querySelector("#player").shadowRoot.querySelector("iframe");window.__paintFrame=frame;const el=frame.contentDocument.querySelector(".tx-title .gold"),css=getComputedStyle(el);return {gradient:css.backgroundImage,stroke:css.webkitTextStrokeWidth};})()');assert.match(live.gradient,/linear-gradient/);
   await delay(850);
   await evaluate('(()=>{const input=document.querySelector(\'[aria-label="Góc gradient (°)"]\');input.value="75";input.dispatchEvent(new Event("input",{bubbles:true}));const hex=document.querySelector(\'[aria-label="Màu 1 HEX"]\');hex.value="#12eeaa";hex.dispatchEvent(new Event("change",{bubbles:true}));const stroke=document.querySelector(\'[aria-label="Độ dày viền (px)"]\');stroke.value="3";stroke.dispatchEvent(new Event("input",{bubbles:true}));})()');
   await delay(1000);assert.equal(await evaluate('window.__paintFrame===document.querySelector("#player").shadowRoot.querySelector("iframe")'),true);
   const css=await evaluate('(()=>{const el=window.__paintFrame.contentDocument.querySelector(".tx-title .gold"),s=getComputedStyle(el);return {background:s.backgroundImage,stroke:s.webkitTextStrokeWidth,shadow:s.filter};})()');assert.match(css.background,/75deg/);assert.match(css.background,/18, 238, 170/);assert.equal(css.stroke,'3px');
   await evaluate(`document.querySelectorAll('.text-appearance details').forEach(d=>d.open=true);document.querySelector('.text-appearance').scrollIntoView({block:'center'})`);
   const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('docs/TEXT_APPEARANCE_'+width+'.png',Buffer.from(shot.data,'base64'));
   await evaluate('document.querySelector("#btnSave").click()');await delay(800);let saved=JSON.parse(fs.readFileSync(file));assert.equal(saved.texts[0].appearance.angle,75);assert.equal(saved.texts[0].appearance.stops[0].color,'#12eeaa');
   await delay(750);await evaluate('document.querySelector(\'[aria-label="Mẫu chữ Neon hồng"]\').click()');await delay(900);await evaluate('document.querySelector("#btnUndo").click()');await delay(900);await evaluate('document.querySelector("#btnSave").click()');await delay(800);assert.equal(JSON.parse(fs.readFileSync(file)).texts[0].appearance.mode,'gradient');
   await send('Page.navigate',{url:base+'/'});await delay(2200);
   const loaded=await evaluate('(()=>{const doc=document.querySelector("#player")?.shadowRoot?.querySelector("iframe")?.contentDocument;const el=doc?.querySelector(".tx-title .gold");return el?getComputedStyle(el).backgroundImage:"";})()');assert.match(loaded,/75deg/);
   results.push({width,live,css,save:true,undo:true,reload:true});

  }
  assert.deepEqual(errors,[]);fs.writeFileSync('docs/TEXT_APPEARANCE_BROWSER_SMOKE.json',JSON.stringify({results,errors,syntheticProject:dir},null,2));console.log({cases:results.length,errors});
 }finally{if(before.dir)await fetch(base+'/api/open',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dir:before.dir})});}
 await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
