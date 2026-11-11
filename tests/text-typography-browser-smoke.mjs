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
 const created=await (await fetch(base+'/api/new-project?file=fixture.mp4&name=ca-font-ui&noasr=1',{method:'POST',body:fs.readFileSync('tests/fixture.mp4')})).json();const dir=created.dir,file=path.join(dir,'project.json'),p=JSON.parse(fs.readFileSync(file));p.texts=[{id:'title-test',title:'CHỮ KIỂM THỬ',label:'NHÃN',sub:'Chữ phụ',at:0,dur:2}];p.audio={...p.audio,music:'',sfxLevel:'tat',autoSfx:false};fs.writeFileSync(file,JSON.stringify(p));
 try{
  const results=[];
  for(const width of [1280,1920]){
   await fetch(base+'/api/open',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dir})});await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/'});
   for(let i=0;i<120;i++){if(await evaluate('!!document.querySelector(".clip.text")'))break;await delay(100);}
   await evaluate('document.querySelector("#btnStudio")?.click()');await delay(300);await evaluate('document.querySelector(".clip.text").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,button:0,pointerType:"mouse"}));window.dispatchEvent(new PointerEvent("pointerup",{bubbles:true}))');await delay(300);
   const picker='[...document.querySelectorAll("#inspector .field")].find(e=>e.querySelector("label")?.textContent==="Font tiêu đề").querySelector("select")';
   for(let i=0;i<120;i++){if(await evaluate('!!document.querySelector("#player")?.shadowRoot?.querySelector("iframe")?.contentDocument?.querySelector(".tx-title")'))break;await delay(100);}await delay(800);
   const options=await evaluate('('+picker+').innerText');assert.match(options,/iCiel Panton/);assert.match(options,/UTM Bebas/);assert.match(options,/Montserrat/);
   await evaluate('(()=>{const s='+picker+';s.value="Montserrat";s.dispatchEvent(new Event("input",{bubbles:true}));})()');await delay(900);await evaluate('(()=>{const s=document.querySelector("select[aria-label~=Kiểu]");s.value="900-italic";s.dispatchEvent(new Event("input",{bubbles:true}));})()');await delay(900);await evaluate('document.querySelector("#btnSave").click()');await delay(600);assert.equal(JSON.parse(fs.readFileSync(file)).texts[0].fontTitle,'Montserrat');assert.equal(JSON.parse(fs.readFileSync(file)).texts[0].fontTitleVariant,'900-italic');
   await evaluate('document.querySelector("#btnUndo").click()');await delay(800);await evaluate('document.querySelector("#btnSave").click()');await delay(600);assert.notEqual(JSON.parse(fs.readFileSync(file)).texts[0].fontTitleVariant,'900-italic');
   const live=await evaluate('(()=>{const player=document.querySelector("#player"),iframe=player.shadowRoot.querySelector("iframe");window.__fontFrame=iframe;const input=document.querySelector("input[aria-label^=Cỡ]");const started=performance.now();input.value="96";input.dispatchEvent(new Event("input",{bubbles:true}));const el=iframe.contentDocument.querySelector(".tx-title");return {elapsed:performance.now()-started,size:el.style.getPropertyValue("--fs")};})()');assert.equal(live.size,'96px');await delay(1000);assert.equal(await evaluate('window.__fontFrame===document.querySelector("#player").shadowRoot.querySelector("iframe")'),true);
   await evaluate('(()=>{const inputs=[...document.querySelectorAll("#inspector input[aria-label]")];const spacing=inputs.find(i=>i.getAttribute("aria-label")==="Giãn chữ font tiêu đề (px)"),height=inputs.find(i=>i.getAttribute("aria-label")==="Giãn dòng font tiêu đề");spacing.value="2.5";spacing.dispatchEvent(new Event("input",{bubbles:true}));height.value="1.3";height.dispatchEvent(new Event("input",{bubbles:true}));})()');
   await evaluate('document.querySelector("#btnSave").click()');await delay(500);const saved=JSON.parse(fs.readFileSync(file));assert.equal(saved.texts[0].size,96);assert.equal(saved.texts[0].letterSpacing,2.5);assert.equal(saved.texts[0].lineHeight,1.3);
   results.push({width,options,save:true,undo:true,live});
  }
  assert.deepEqual(errors,[]);fs.writeFileSync('docs/TEXT_TYPOGRAPHY_BROWSER_SMOKE.json',JSON.stringify({results,errors,syntheticProject:dir},null,2));console.log({cases:results.length,errors});
 }finally{if(before.dir)await fetch(base+'/api/open',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dir:before.dir})});}
 await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
