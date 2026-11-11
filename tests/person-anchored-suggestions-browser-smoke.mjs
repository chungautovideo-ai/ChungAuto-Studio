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
 const sample=path.resolve('workspace/cache/person-sam2-two.mp4');
 const up=await fetch(base+'/api/new-project?file=q2.mp4&name=ContentOS-Smoke-Person-Dialog&noasr=1',{method:'POST',body:fs.readFileSync(sample)}),created=await up.json();assert.ok(up.ok);const dir=path.resolve(created.dir),file=path.join(dir,'project.json'),project=JSON.parse(fs.readFileSync(file));
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

 const saved=JSON.parse(fs.readFileSync(file));saved.format='16:9';saved.camera.beauty={bodyWhite:45,personLight:0,bodySmooth:0};saved.brolls=[];
 fs.writeFileSync(file,JSON.stringify(saved,null,2));execFileSync(process.execPath,['editor/lib/build.mjs',dir],{windowsHide:true});
 await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await delay(800);
 await evaluate("document.querySelector('#btnStudio').click();[...document.querySelectorAll('#tabs button')].find(b=>b.title==='Bộ lọc').click();[...document.querySelectorAll('#submenu button')].find(b=>b.textContent.includes('Làm đẹp')).click()");
 await waitFor('!!document.querySelector(`select[aria-label="Phạm vi chỉnh người và da"]`)');await evaluate('var s=document.querySelector(`select[aria-label="Phạm vi chỉnh người và da"]`);s.value="inputs/raw.mp4";s.dispatchEvent(new Event("change",{bubbles:true}))');
 await evaluate('[...document.querySelectorAll("#list button")].find(b=>b.textContent.includes("Chọn và theo dõi người")).click()');
 await waitFor('!!document.querySelector("dialog [data-load]")');
 await evaluate('document.querySelector("dialog [data-load]").click()');
 await waitFor('!document.querySelector("dialog [data-load]").disabled && document.querySelector("dialog [data-canvas]").width>0');
 const initialCanvas=await evaluate('document.querySelector("dialog canvas").toDataURL()');
 await evaluate('document.querySelector("dialog [data-suggest]").click()');await waitFor('!document.querySelector("dialog [data-suggest]").disabled');
 assert.ok(await evaluate('document.querySelector("dialog [data-status]").textContent.includes("nhiều vùng")'));
 await evaluate('var c=document.querySelector("dialog canvas"),r=c.getBoundingClientRect();c.dispatchEvent(new PointerEvent("pointerdown",{clientX:r.left+r.width*.25,clientY:r.top+r.height*.5,bubbles:true}));document.querySelector("dialog [data-mode]").value="0";c.dispatchEvent(new PointerEvent("pointerdown",{clientX:r.left+r.width*.75,clientY:r.top+r.height*.5,bubbles:true}));document.querySelector("dialog [data-suggest]").click()');
 await waitFor('!document.querySelector("dialog [data-suggest]").disabled && document.querySelector("dialog [data-points]").textContent.includes("5: loại")');
 assert.ok(!JSON.parse(fs.readFileSync(file)).camera.beauty.personSelections);
 await evaluate('document.querySelector("dialog [data-track]").click()');
 await waitFor('!document.querySelector("dialog [data-apply]").disabled');
 assert.ok(!JSON.parse(fs.readFileSync(file)).camera.beauty.personSelections,'tracking does not write live project');
 for(const [width,height] of [[1280,720],[390,844]]){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(250);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/PERSON_ANCHORED_SUGGESTIONS_'+width+'.png',Buffer.from(shot.data,'base64'));}
 await evaluate('document.querySelector("dialog [data-frame]").value="7";document.querySelector("dialog [data-frame]").dispatchEvent(new Event("input"))');
 await waitFor('!document.querySelector("dialog [data-apply]").disabled');
 await evaluate('document.querySelector("dialog [data-clear]").click()');
 await waitFor('!document.querySelector("dialog [data-clear]").disabled');
 assert.equal(await evaluate('document.querySelector("dialog [data-apply]").disabled'),true);
 assert.equal(await evaluate('document.querySelector("dialog canvas").toDataURL()'),initialCanvas,'clear after seek must restore exact first-frame canvas before reprompting');
 await evaluate('var c=document.querySelector("dialog canvas"),r=c.getBoundingClientRect();document.querySelector("dialog [data-mode]").value="1";c.dispatchEvent(new PointerEvent("pointerdown",{clientX:r.left+r.width*.25,clientY:r.top+r.height*.5,bubbles:true}));document.querySelector("dialog [data-mode]").value="0";c.dispatchEvent(new PointerEvent("pointerdown",{clientX:r.left+r.width*.75,clientY:r.top+r.height*.5,bubbles:true}));document.querySelector("dialog [data-track]").click()');
 await waitFor('!document.querySelector("dialog [data-apply]").disabled');
 await evaluate('document.querySelector("dialog [data-apply]").click();document.querySelector("#toast").textContent="";document.querySelector("#btnSave").click()');
 await waitFor('document.querySelector("#toast").textContent.includes("Đã lưu")');
 const selection=JSON.parse(fs.readFileSync(file)).camera.beauty.personSelections[0];let left=0,right=0;for(const runs of selection.f){let at=0;for(let n=0;n<runs.length;n+=2){for(let p=0;p<runs[n];p++,at++)if(runs[n+1]){if(at%selection.w<selection.w/2)left++;else right++;}}}assert.ok(left>20);assert.ok(right<left*.05);assert.equal(selection.f.length,8);assert.equal(selection.src,'inputs/raw.mp4');assert.equal(selection.sha256,face.tracks[0].fingerprint.sha256);
 await evaluate('document.querySelector("#btnUndo").click();document.querySelector("#toast").textContent="";document.querySelector("#btnSave").click()');await waitFor('document.querySelector("#toast").textContent.includes("Đã lưu")');assert.equal(JSON.parse(fs.readFileSync(file)).camera.beauty.personSelections?.length||0,0);
 await evaluate('document.querySelector("#btnRedo").click();document.querySelector("#toast").textContent="";document.querySelector("#btnSave").click()');await waitFor('document.querySelector("#toast").textContent.includes("Đã lưu")');assert.equal(JSON.parse(fs.readFileSync(file)).camera.beauty.personSelections.length,1);
 const beforeCancel=fs.readFileSync(file,'utf8');
 await evaluate('[...document.querySelectorAll("#list button")].find(b=>b.textContent.includes("Chọn và theo dõi người")).click();document.querySelector("dialog [data-from]").value="0";document.querySelector("dialog [data-load]").click()');
 await waitFor('!document.querySelector("dialog [data-load]").disabled && document.querySelector("dialog [data-canvas]").width>0');
 await evaluate('var c=document.querySelector("dialog canvas"),r=c.getBoundingClientRect();c.dispatchEvent(new PointerEvent("pointerdown",{clientX:r.left+r.width*.25,clientY:r.top+r.height*.5,bubbles:true}));document.querySelector("dialog [data-track]").click()');
 for(let n=0;n<100;n++){if((await call('/api/person-tracking')).state==='running')break;await delay(50);}
 assert.equal((await call('/api/person-tracking')).state,'running');
 await evaluate('document.querySelector("dialog [data-stop]").click()');
 await waitFor('document.querySelector("dialog [data-status]").textContent.includes("Đã hủy")');
 for(let n=0;n<100;n++){if((await call('/api/person-tracking')).state==='idle')break;await delay(100);}
 assert.equal((await call('/api/person-tracking')).state,'idle');assert.equal(fs.readFileSync(file,'utf8'),beforeCancel);
 await evaluate('document.querySelector("dialog [data-close]").click()');
 await send('Page.navigate',{url:base+'/'});await waitFor('!!document.querySelector("#btnStudio")');assert.equal(JSON.parse(fs.readFileSync(file)).camera.beauty.personSelections.length,1);
 assert.deepEqual(errors,[]);
 fs.writeFileSync('docs/PERSON_ANCHORED_SUGGESTIONS_SMOKE.json',JSON.stringify({project:created.dir,realMediaPipe:true,realSAM2:true,anchoredSuggestions:true,ambiguousAutoRejected:true,negativePointPreserved:true,suggestionNoWrite:true,uiTrackApplyUndoRedoSave:true,clearAfterSeekRetracks:true,cancelRunningTaskNoWrite:true,reopen:true,selectionSamples:selection.f.length,foregroundLeft:left,foregroundRight:right,pageErrors:errors,scope:'1s duplicated person; not independent people or occlusion benchmark'},null,2));console.log(created.dir);
}finally{if(originalWorkspace)await fetch(base+'/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:originalWorkspace})}).catch(()=>{});ws?.close();chrome.kill();server.kill();}
