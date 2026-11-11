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
 await call('/api/v1/workspaces',{name:'Shot color QA '+Date.now()});
 const up=await fetch(base+'/api/new-project?file=source.mp4&name=ContentOS-Smoke-ShotColor&noasr=1',{method:'POST',body:fs.readFileSync('tests/fixture.mp4')});const created=await up.json();assert.ok(up.ok);const file=path.join(created.dir,'project.json'),original=fs.readFileSync(file),results=[];
 const waitFor=async expression=>{for(let i=0;i<200;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Timeout '+expression+' '+await evaluate("document.body.innerText.slice(-3000)"));};
 const save=async()=>{await evaluate("document.querySelector('#toast').textContent='';document.querySelector('#btnSave').click()");await waitFor("document.querySelector('#toast').textContent.includes('Đã lưu')");};
 const initial=JSON.parse(original);initial.segments=[{id:'color-test',in:0,out:1,keep:true}];initial.audio={...initial.audio,music:'',sfxLevel:'tat'};const baseline=JSON.stringify(initial);
 execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=0x303030:s=320x180:d=1','-pix_fmt','yuv420p','-y',path.join(created.dir,initial.source.video)]);
 for(const width of [1280,1920,390]){
  fs.writeFileSync(file,baseline);await send('Emulation.setDeviceMetricsOverride',{width,height:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await delay(800);await evaluate("document.querySelector('#btnStudio').click();[...document.querySelectorAll('#tabs button')].find(b=>b.title==='Văn bản').click();[...document.querySelectorAll('#submenu button')].find(b=>b.textContent.includes('Cắt')).click();document.querySelector('#list .seg').click()");await waitFor("!!document.querySelector('[data-shot-color=segments]')");
  await evaluate("document.querySelector('[data-shot-color=segments]').click()");await waitFor("[...document.querySelectorAll('dialog button')].some(b=>b.textContent==='Thay màu riêng bằng gợi ý'&&!b.disabled)");
  assert.equal(await evaluate("[...document.querySelectorAll('dialog img')].length"),2);assert.equal(JSON.parse(fs.readFileSync(file)).segments[0].color,undefined);
  for(let i=0;i<3;i++){await evaluate("document.querySelectorAll('dialog .chips button')["+i+"].click()");await waitFor("[...document.querySelectorAll('dialog img')].every(i=>i.complete&&i.naturalWidth>0)");}
const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/SHOT_COLOR_UI_'+width+'.png',Buffer.from(shot.data,'base64'));
  await evaluate("[...document.querySelectorAll('dialog button')].find(b=>b.textContent==='Thay màu riêng bằng gợi ý').click()");await save();assert.equal(JSON.parse(fs.readFileSync(file)).segments[0].color.brightness,.18);
  await evaluate("document.querySelector('#btnUndo').click()");await delay(200);await save();assert.equal(JSON.parse(fs.readFileSync(file)).segments[0].color,undefined);
  await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await delay(700);await evaluate("document.querySelector('#btnStudio').click();[...document.querySelectorAll('#tabs button')].find(b=>b.title==='Văn bản').click();[...document.querySelectorAll('#submenu button')].find(b=>b.textContent.includes('Cắt')).click();document.querySelector('#list .seg').click()");await waitFor("!!document.querySelector('[data-shot-color=segments]')");await evaluate("document.querySelector('[data-shot-color=segments]').click()");await waitFor("[...document.querySelectorAll('dialog button')].some(b=>b.textContent==='Thay màu riêng bằng gợi ý'&&!b.disabled)");await evaluate("[...document.querySelectorAll('dialog button')].find(b=>b.textContent==='Thay màu riêng bằng gợi ý').click()");await save();await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");assert.equal(JSON.parse(fs.readFileSync(file)).segments[0].color.brightness,.18);
  results.push({width,previewThreeFrames:true,noMutationBeforeApply:true,save:true,undo:true,reopen:true});
 }
 assert.deepEqual(errors,[]);const proof={dir:created.dir,results,errors};fs.writeFileSync('docs/SHOT_COLOR_BROWSER_SMOKE.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
}finally{if(originalWorkspace)await fetch(base+'/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:originalWorkspace})}).catch(()=>{});ws?.close();chrome.kill();server.kill();}
