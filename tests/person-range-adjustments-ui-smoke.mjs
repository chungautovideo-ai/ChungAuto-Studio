import {faceSourceManifest} from '../src/services/face-tracks.mjs';
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

 const original='workspace/content/2026-11-04/contentos-smoke-person-ranges-2';
 const originalProject=JSON.parse(fs.readFileSync(path.join(original,'project.json')));
 const up=await fetch(base+'/api/new-project?file=q2.mp4&name=ContentOS-QA-Range-Adjustments&noasr=1',{method:'POST',body:fs.readFileSync(path.join(original,originalProject.source.video))});const created=await up.json();assert.ok(up.ok);
 const dir=path.resolve(created.dir),file=path.join(dir,'project.json'),project=JSON.parse(fs.readFileSync(file));
 const beauty=structuredClone(originalProject.camera.beauty);assert.equal(beauty.personSelections.length,2);beauty.bodyWhite=10;beauty.personLight=0;beauty.bodySmooth=0;beauty.sourceAdjustments=[];
 for(const r of beauty.personSelections)delete r.adjustments;
 project.camera={scale:1,x:0,y:0,beauty};project.audio={voice:0,music:'',sfxLevel:'tat'};fs.writeFileSync(file,JSON.stringify(project));const faces=JSON.parse(fs.readFileSync(path.join(original,'work/face.json')));for(const entry of faceSourceManifest(dir,project)){const track=faces.tracks.find(t=>t.src===entry.src);assert.equal(track.fingerprint.sha256,entry.fingerprint.sha256);track.fingerprint=entry.fingerprint;}fs.writeFileSync(path.join(dir,'work/face.json'),JSON.stringify(faces));
 const waitFor=async expression=>{for(let n=0;n<200;n++){if(await evaluate(expression))return;await delay(100);}throw Error('Timeout '+expression);};
 const open=async()=>{await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await delay(800);await evaluate("document.querySelector('#btnStudio').click();[...document.querySelectorAll('#tabs button')].find(b=>b.title==='Bộ lọc').click();[...document.querySelectorAll('#submenu button')].find(b=>b.textContent.includes('Làm đẹp')).click()");await waitFor('!!document.querySelector(`select[aria-label="Phạm vi chỉnh người và da"]`)');await evaluate('var s=document.querySelector(`select[aria-label="Phạm vi chỉnh người và da"]`);s.value="inputs/raw.mp4";s.dispatchEvent(new Event("change",{bubbles:true}))');};
 const save=async()=>{await evaluate("document.querySelector('#toast').textContent='';document.querySelector('#btnSave').click()");await waitFor("document.querySelector('#toast').textContent.includes('Đã lưu')");await delay(300);};
 const choose=async index=>evaluate('var s=document.querySelector(`select[aria-label="Khoảng chỉnh người và da"]`);s.selectedIndex='+index+';s.dispatchEvent(new Event("change",{bubbles:true}))');
 const set=async n=>evaluate('var r=document.querySelector(`input[aria-label="Sáng da mặt, cổ & tay"]`);r.value='+n+';r.dispatchEvent(new Event("input",{bubbles:true}))');
 await open();const before=fs.readFileSync(file,'utf8');await choose(1);assert.equal(fs.readFileSync(file,'utf8'),before);await set(35);await save();
 let b=JSON.parse(fs.readFileSync(file)).camera.beauty;assert.equal(b.bodyWhite,10);assert.equal(b.sourceAdjustments.length,0);assert.equal(b.personSelections[0].adjustments.bodyWhite,35);assert.equal(b.personSelections[1].adjustments,undefined);
 await delay(800);await set(45);await evaluate("document.querySelector('#btnUndo').click()");await waitFor('document.querySelector(`input[aria-label="Sáng da mặt, cổ & tay"]`)?.value==="35"');await evaluate("document.querySelector('#btnRedo').click()");await waitFor('document.querySelector(`input[aria-label="Sáng da mặt, cổ & tay"]`)?.value==="45"');await save();
 await open();await choose(1);assert.equal(await evaluate('document.querySelector(`input[aria-label="Sáng da mặt, cổ & tay"]`).value'),'45');
 for(const [width,height] of [[1280,720],[390,844]]){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await evaluate('document.querySelector(`select[aria-label="Khoảng chỉnh người và da"]`).scrollIntoView({block:"center"})');await delay(250);const capture=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/PERSON_RANGE_ADJUSTMENTS_UI_'+width+'.png',Buffer.from(capture.data,'base64'));}
 await evaluate("[...document.querySelectorAll('#list button')].find(b=>b.textContent==='Dùng mức nguồn cho khoảng này').click()");await save();b=JSON.parse(fs.readFileSync(file)).camera.beauty;assert.equal(b.personSelections[0].adjustments,undefined);assert.equal(b.personSelections.length,2);
 await open();await choose(2);await set(0);await save();b=JSON.parse(fs.readFileSync(file)).camera.beauty;assert.equal(b.personSelections[1].adjustments.bodyWhite,0);assert.deepEqual(errors,[]);
 const evidence={project:created.dir,previousRealMasks:true,noNewInference:true,twoRanges:true,globalUnchanged:true,selectionReadOnly:true,range45UndoRedoSaveReopen:true,resetKeepsMasks:true,explicitZero:true,pageErrors:errors,scope:'Copied6s QA source and prior MediaPipe/SAM2 masks, same speaker; no new inference or multi-person acceptance'};fs.writeFileSync('docs/PERSON_RANGE_ADJUSTMENTS_UI_SMOKE.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
}finally{if(originalWorkspace)await fetch(base+'/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:originalWorkspace})}).catch(()=>{});ws?.close();chrome.kill();server.kill();}
