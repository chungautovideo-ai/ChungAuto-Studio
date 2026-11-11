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
 const sample=path.resolve('workspace/cache/face-q2-sample.mp4');execFileSync('ffmpeg',['-v','error','-ss','12','-i','D:/Edit tự động/source/DJI_0061_D.MP4','-t','1','-vf','crop=720:960:180:180,scale=360:480','-c:v','libx264','-crf','16','-an','-y',sample],{windowsHide:true});
 const up=await fetch(base+'/api/new-project?file=q2.mp4&name=ContentOS-Smoke-Source-Adjustments&noasr=1',{method:'POST',body:fs.readFileSync(sample)}),created=await up.json();assert.ok(up.ok);const dir=path.resolve(created.dir),file=path.join(dir,'project.json'),project=JSON.parse(fs.readFileSync(file));
 execFileSync('ffmpeg',['-v','error','-i',sample,'-vf','hflip','-c:v','libx264','-an','-y',path.join(dir,'inputs/second.mp4')],{windowsHide:true});
 project.segments=[{id:'one',in:0,out:1,keep:true},{id:'two',in:1,out:2,keep:true,src:'inputs/second.mp4',mediaStart:0,mediaInfo:{width:360,height:480,duration:1,hasAudio:false}}];project.segments=project.segments.slice(0,1);project.brolls=[{id:"b-person",src:"inputs/second.mp4",at:0,dur:1,mode:"pip",mediaStart:0}];project.camera={scale:1,x:0,y:0,faceY:.36};project.audio={voice:1,music:'',sfxLevel:'tat'};fs.writeFileSync(file,JSON.stringify(project));
 const waitFor=async expression=>{for(let n=0;n<600;n++){if(await evaluate(expression))return;await delay(100);}throw new Error('Timeout '+expression+' '+await evaluate('document.body.innerText.slice(-2200)'));};
 await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await delay(1000);
 await evaluate("document.querySelector('#btnStudio').click();[...document.querySelectorAll('#tabs button')].find(b=>b.title==='Bộ lọc').click();[...document.querySelectorAll('#submenu button')].find(b=>b.textContent.includes('Làm đẹp')).click()");
 await waitFor("[...document.querySelectorAll('#list button')].some(b=>b.textContent.includes('Quét khuôn mặt các nguồn'))");
 await evaluate("var quality=document.querySelector('select[aria-label=\"Chất lượng quét người và da\"]');if(quality.value!=='15')throw Error('default fps');quality.value='30';quality.dispatchEvent(new Event('change',{bubbles:true}));[...document.querySelectorAll('#list button')].find(b=>b.textContent.includes('Quét khuôn mặt các nguồn')).click()");
 await waitFor("document.body.textContent.includes('Đã quét 2 nguồn A-roll/B-roll')");
 const face=JSON.parse(fs.readFileSync(path.join(dir,'work/face.json')));assert.equal(face.v,2);assert.equal(face.tracks.length,2);assert.ok(face.tracks.every(t=>t.fps===30&&t.f.length===31&&t.skin.f.length===31));assert.ok(face.tracks.every(t=>t.skin?.f.length===t.f.length));assert.ok(face.tracks.every(t=>t.f.some(Boolean)));assert.ok(face.tracks.every(t=>t.fingerprint.sha256));
 assert.equal(JSON.parse(fs.readFileSync(file)).camera.beauty?.smooth||0,0,'scanning must not enable an unsolicited beauty preset');

 const save=async()=>{await evaluate("document.querySelector('#toast').textContent='';document.querySelector('#btnSave').click()");await waitFor("document.querySelector('#toast').textContent.includes('Đã lưu')");await delay(300);};
 await save();
 const pick=async src=>{await evaluate('var s=document.querySelector(`select[aria-label="Phạm vi chỉnh người và da"]`);s.value='+JSON.stringify(src)+';s.dispatchEvent(new Event("change",{bubbles:true}))');};
 const set=async n=>{await waitFor('!!document.querySelector(`input[aria-label="Sáng da mặt, cổ & tay"]`)');await evaluate('var r=document.querySelector(`input[aria-label="Sáng da mặt, cổ & tay"]`);r.value='+n+';r.dispatchEvent(new Event("input",{bubbles:true}))');};
 await waitFor('!!document.querySelector(`select[aria-label="Phạm vi chỉnh người và da"]`)');
 await set(15);await save();
 const beforeSelect=fs.readFileSync(file,'utf8');await pick('inputs/second.mp4');assert.equal(fs.readFileSync(file,'utf8'),beforeSelect);
 await set(35);await save();
 let b=JSON.parse(fs.readFileSync(file)).camera.beauty;assert.equal(b.bodyWhite,15);assert.equal(b.sourceAdjustments[0].bodyWhite,35);assert.equal(b.sourceAdjustments[0].src,'inputs/second.mp4');
 await delay(800);await set(45);await evaluate("document.querySelector('#btnUndo').click()");
 await waitFor('document.querySelector(`input[aria-label="Sáng da mặt, cổ & tay"]`)?.value==="35"');
 await evaluate("document.querySelector('#btnRedo').click()");await waitFor('document.querySelector(`input[aria-label="Sáng da mặt, cổ & tay"]`)?.value==="45"');await save();
 await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await delay(800);
 await evaluate("document.querySelector('#btnStudio').click();[...document.querySelectorAll('#tabs button')].find(b=>b.title==='Bộ lọc').click();[...document.querySelectorAll('#submenu button')].find(b=>b.textContent.includes('Làm đẹp')).click()");
 await waitFor('!!document.querySelector(`select[aria-label="Phạm vi chỉnh người và da"]`)');await pick('inputs/second.mp4');assert.equal(await evaluate('document.querySelector(`input[aria-label="Sáng da mặt, cổ & tay"]`).value'),'45');
 for(const [width,height] of [[1280,720],[390,844]]){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await evaluate('document.querySelector(`select[aria-label="Phạm vi chỉnh người và da"]`).scrollIntoView({block:"center"})');await delay(250);const capture=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/PERSON_SOURCE_ADJUSTMENTS_UI_'+width+'.png',Buffer.from(capture.data,'base64'));}
 await evaluate("[...document.querySelectorAll('#list button')].find(b=>b.textContent==='Dùng mức chung cho nguồn này').click()");await save();b=JSON.parse(fs.readFileSync(file)).camera.beauty;assert.equal(b.sourceAdjustments.length,0);assert.equal(b.bodyWhite,15);
 assert.deepEqual(errors,[]);const evidence={project:created.dir,realMediaPipe:true,twoSources:true,global:15,source:45,selectionNoMutation:true,undoRedo:true,reopen:true,resetToGlobal:true,pageErrors:errors,scope:'Two1s Q2 crop/flip sources; no full video or individual person tracking acceptance'};fs.writeFileSync('docs/PERSON_SOURCE_ADJUSTMENTS_UI_SMOKE.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
}finally{if(originalWorkspace)await fetch(base+'/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:originalWorkspace})}).catch(()=>{});ws?.close();chrome.kill();server.kill();}
