import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-layout-'));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--no-first-run','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let ws;const base="http://127.0.0.1:5199",server=spawn(process.execPath,["editor/server.mjs","--home","--port","5199"],{windowsHide:true,stdio:"ignore"});let originalWorkspace;
try{
 let port;for(let i=0;i<100;i++){try{port=Number(fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]);break;}catch{await delay(100);}}
 assert.ok(port,'Chrome CDP started');
 const pages=await (await fetch(`http://127.0.0.1:${port}/json`)).json();
 ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;});
 let id=0;const pending=new Map(),errors=[];
 ws.onmessage=event=>{const msg=JSON.parse(event.data);if(msg.id){const p=pending.get(msg.id);if(p){pending.delete(msg.id);msg.error?p.reject(new Error(JSON.stringify(msg.error))):p.resolve(msg.result);}}else if(msg.method==='Runtime.exceptionThrown')(errors.push(msg.params.exceptionDetails.text+': '+(msg.params.exceptionDetails.exception?.description||'')),console.error(errors.at(-1)));};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const requestId=++id;pending.set(requestId,{resolve,reject});ws.send(JSON.stringify({id:requestId,method,params}));setTimeout(()=>{if(pending.delete(requestId))reject(new Error('CDP timeout '+method));},10000).unref();});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});




 const call=async(url,body)=>{const r=await fetch(base+url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const data=await r.json();assert.ok(r.ok,JSON.stringify(data));return data;};
 for(let i=0;i<80;i++){try{await call('/api/ping');break;}catch{await delay(100);}}
 originalWorkspace=(await call('/api/v1/workspaces')).activeId;
 await call('/api/v1/workspaces',{name:'Face source QA '+Date.now()});


 const sample=path.resolve('workspace/cache/face-q2-sample.mp4');const up=await fetch(base+'/api/new-project?file=q2.mp4&name=ContentOS-Smoke-AudioUndo&noasr=1',{method:'POST',body:fs.readFileSync(sample)}),created=await up.json();assert.ok(up.ok);const dir=path.resolve(created.dir),file=path.join(dir,'project.json'),project=JSON.parse(fs.readFileSync(file));project.audio={music:'kit:ambient-pad',musicVolume:.1,voice:1,sfxVolume:.25,duckFade:.2,duckLevel:.3};fs.writeFileSync(file,JSON.stringify(project));
 const waitFor=async expr=>{for(let i=0;i<200;i++){if(await evaluate(expr))return;await delay(100);}throw Error('Timeout '+expr);};const save=async()=>{await evaluate("document.querySelector('#toast').textContent='';document.querySelector('#btnSave').click()");await waitFor("document.querySelector('#toast').textContent.includes('Đã lưu')");await delay(150);};
 await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await delay(700);await evaluate("document.querySelector('#btnStudio').click();[...document.querySelectorAll('#tabs button')].find(b=>b.title==='Âm thanh').click();document.querySelector('[data-audio-group=\"mix\"]').click()");
 const set=async(label,value)=>evaluate(`var input=[...document.querySelectorAll('.cos-audio-panel .field')].find(f=>f.querySelector(':scope>label')?.textContent===${JSON.stringify(label)}).querySelector('input[type=number]');input.value=${JSON.stringify(String(value))};input.dispatchEvent(new Event('input',{bubbles:true}))`);
 await set('Âm lượng nhạc',.2);await save();assert.equal(JSON.parse(fs.readFileSync(file)).audio.musicVolume,.2);await evaluate("document.querySelector('#btnUndo').click()");await save();assert.equal(JSON.parse(fs.readFileSync(file)).audio.musicVolume,.1);
 await set('Âm lượng nhạc',.3);await save();assert.equal(JSON.parse(fs.readFileSync(file)).audio.musicVolume,.3,'editing after Undo must target current audio');
 await evaluate("document.querySelector('#btnUndo').click();document.querySelector('#btnRedo').click()");await set('Âm lượng hiệu ứng',.4);await save();assert.equal(JSON.parse(fs.readFileSync(file)).audio.sfxVolume,.4,'editing after Redo must target current audio');
 await delay(800);await evaluate("var n=document.querySelector('input[aria-label=\"Hạ nhạc theo clip thuyết minh\"]');n.checked=true;n.dispatchEvent(new Event('change',{bubbles:true}))");await save();assert.equal(JSON.parse(fs.readFileSync(file)).audio.duckNarration,true);await evaluate("document.querySelector('#btnUndo').click()");await save();assert.notEqual(JSON.parse(fs.readFileSync(file)).audio.duckNarration,true);await evaluate("var n=document.querySelector('input[aria-label=\"Hạ nhạc theo clip thuyết minh\"]');n.checked=true;n.dispatchEvent(new Event('change',{bubbles:true}))");await save();assert.equal(JSON.parse(fs.readFileSync(file)).audio.duckNarration,true);
 for(const width of [1280,390]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await delay(150);const c=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/AUDIO_UNDO_UI_'+width+'.png',Buffer.from(c.data,'base64'));}
 await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await delay(500);const saved=JSON.parse(fs.readFileSync(file));assert.equal(saved.audio.musicVolume,.3);assert.equal(saved.audio.sfxVolume,.4);assert.equal(saved.audio.duckNarration,true);assert.deepEqual(errors,[]);const proof={project:created.dir,undoRestores:true,editingAfterUndo:true,editingAfterRedo:true,narrationToggleAfterUndo:true,reopen:true,audio:saved.audio,pageErrors:errors};fs.writeFileSync('docs/AUDIO_UNDO_BROWSER_SMOKE.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
}finally{if(originalWorkspace)await fetch(base+'/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:originalWorkspace})}).catch(()=>{});ws?.close();chrome.kill();server.kill();}
