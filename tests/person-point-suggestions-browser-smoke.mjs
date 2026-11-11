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
 const sample=path.resolve('workspace/cache/person-sam2-motion6.mp4');
 const up=await fetch(base+'/api/new-project?file=q2.mp4&name=ContentOS-Smoke-Person-Ranges&noasr=1',{method:'POST',body:fs.readFileSync(sample)}),created=await up.json();assert.ok(up.ok);const dir=path.resolve(created.dir),file=path.join(dir,'project.json'),project=JSON.parse(fs.readFileSync(file));
 execFileSync('ffmpeg',['-v','error','-i',sample,'-vf','hflip','-c:v','libx264','-an','-y',path.join(dir,'inputs/second.mp4')],{windowsHide:true});
 project.segments=[{id:'one',in:0,out:6,keep:true},{id:'two',in:1,out:2,keep:true,src:'inputs/second.mp4',mediaStart:0,mediaInfo:{width:360,height:480,duration:1,hasAudio:false}}];project.segments=project.segments.slice(0,1);project.brolls=[{id:"b-person",src:"inputs/second.mp4",at:0,dur:6,mode:"pip",mediaStart:0}];project.camera={scale:1,x:0,y:0,faceY:.36};project.audio={voice:1,music:'',sfxLevel:'tat'};fs.writeFileSync(file,JSON.stringify(project));
 const waitFor=async expression=>{for(let n=0;n<600;n++){if(await evaluate(expression))return;await delay(100);}throw new Error('Timeout '+expression+' '+await evaluate('document.body.innerText.slice(-2200)'));};
 await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await delay(1000);
 await evaluate("document.querySelector('#btnStudio').click();[...document.querySelectorAll('#tabs button')].find(b=>b.title==='Bộ lọc').click();[...document.querySelectorAll('#submenu button')].find(b=>b.textContent.includes('Làm đẹp')).click()");
 await waitFor("[...document.querySelectorAll('#list button')].some(b=>b.textContent.includes('Quét khuôn mặt các nguồn'))");
 await evaluate("var quality=document.querySelector('select[aria-label=\"Chất lượng quét người và da\"]');if(quality.value!=='15')throw Error('default fps');quality.value='30';quality.dispatchEvent(new Event('change',{bubbles:true}));[...document.querySelectorAll('#list button')].find(b=>b.textContent.includes('Quét khuôn mặt các nguồn')).click()");
 await waitFor("document.body.textContent.includes('Đã quét 2 nguồn A-roll/B-roll')");
 const face=JSON.parse(fs.readFileSync(path.join(dir,'work/face.json')));assert.equal(face.v,2);assert.equal(face.tracks.length,2);assert.ok(face.tracks.every(t=>t.fps===30&&t.f.length===181&&t.skin.f.length===181));assert.ok(face.tracks.every(t=>t.skin?.f.length===t.f.length));assert.ok(face.tracks.every(t=>t.f.some(Boolean)));assert.ok(face.tracks.every(t=>t.fingerprint.sha256));
 assert.equal(JSON.parse(fs.readFileSync(file)).camera.beauty?.smooth||0,0,'scanning must not enable an unsolicited beauty preset');

 const saved=JSON.parse(fs.readFileSync(file));saved.format='16:9';saved.camera.beauty={bodyWhite:45,personLight:0,bodySmooth:0};saved.brolls=[];
 fs.writeFileSync(file,JSON.stringify(saved,null,2));execFileSync(process.execPath,['editor/lib/build.mjs',dir],{windowsHide:true});
 await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await delay(800);
 await evaluate("document.querySelector('#btnStudio').click();[...document.querySelectorAll('#tabs button')].find(b=>b.title==='Bộ lọc').click();[...document.querySelectorAll('#submenu button')].find(b=>b.textContent.includes('Làm đẹp')).click()");
 await waitFor('!!document.querySelector(`select[aria-label="Phạm vi chỉnh người và da"]`)');await evaluate('var s=document.querySelector(`select[aria-label="Phạm vi chỉnh người và da"]`);s.value="inputs/raw.mp4";s.dispatchEvent(new Event("change",{bubbles:true}))');

 async function trackRange(from,duration,points){
  await evaluate('[...document.querySelectorAll("#list button")].find(b=>b.textContent.includes("Chọn và theo dõi người")).click()');
  await evaluate(`document.querySelector('dialog [data-from]').value=${from};document.querySelector('dialog [data-duration]').value=${duration};document.querySelector('dialog [data-load]').click()`);
  await waitFor('!document.querySelector("dialog [data-load]").disabled && document.querySelector("dialog canvas").width>0');
  const before=fs.readFileSync(file);
  await evaluate('document.querySelector("dialog [data-suggest]").click()');
  await waitFor('!document.querySelector("dialog [data-suggest]").disabled && document.querySelector("dialog [data-points]").textContent.includes("4: giữ")');
  assert.deepEqual(fs.readFileSync(file),before);
  await evaluate('document.querySelector("dialog [data-track]").click()');
  await waitFor('!document.querySelector("dialog [data-apply]").disabled');
  await evaluate('document.querySelector("dialog [data-apply]").click();document.querySelector("#toast").textContent="";document.querySelector("#btnSave").click()');
  await waitFor('document.querySelector("#toast").textContent.includes("Đã lưu")');
 }
 await trackRange(0,2,[[.45,.32,1],[.44,.48,1],[.39,.68,1],[.55,.69,1],[.8,.55,0]]);
 const first=JSON.parse(fs.readFileSync(file)).camera.beauty.personSelections[0];
 await trackRange(3,2,[[.50,.27,1],[.5,.43,1],[.4,.68,1],[.54,.70,1],[.84,.52,0]]);
 const savedRanges=JSON.parse(fs.readFileSync(file)).camera.beauty.personSelections;assert.equal(savedRanges.length,2);assert.deepEqual(savedRanges[0],first);assert.equal(savedRanges[1].from,3);

 await evaluate('[...document.querySelectorAll("#list summary")].find(s=>s.textContent.includes("2 khoảng")).click()');
 const beforeProject=fs.readFileSync(file),beforeFace=fs.readFileSync(path.join(dir,'work/face.json'));
 await evaluate("window.reviewPosts=0;window.originalFetch=window.fetch;window.fetch=(url,opts)=>{if(String(url).includes('/api/person-tracking')&&opts?.method==='POST')window.reviewPosts++;return window.originalFetch(url,opts)}");
 for(let index=0;index<2;index++){
  await evaluate(`[...document.querySelectorAll('#list button')].filter(b=>b.textContent==='Xem vùng')[${index}].click()`);
  await waitFor('!!document.querySelector("dialog [data-frame]") && !document.querySelector("dialog [data-frame]").disabled');
  assert.equal(await evaluate('document.querySelector("dialog h2").textContent'),'Xem vùng người đã lưu');
  assert.equal(await evaluate('getComputedStyle(document.querySelector("dialog [data-apply]")).display'),'none');
  assert.equal(await evaluate('getComputedStyle(document.querySelector("dialog [data-track]")).display'),'none');
  const overlay=await evaluate('document.querySelector("dialog canvas").toDataURL()');
  await evaluate('document.querySelector("dialog [data-mask]").click()');
  assert.notEqual(await evaluate('document.querySelector("dialog canvas").toDataURL()'),overlay);
  await evaluate('document.querySelector("dialog [data-mask]").click();var slider=document.querySelector("dialog [data-frame]");slider.value=slider.max;slider.dispatchEvent(new Event("input",{bubbles:true}))');
  await waitFor('!document.querySelector("dialog [data-frame]").disabled');
  assert.ok(await evaluate(`document.querySelector('dialog [data-time]').textContent.includes('${index?"4.875":"1.875"}')`));
  for(const [width,height] of [[1280,720],[390,844]]){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(200);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/PERSON_POINT_SUGGESTIONS_'+index+'_'+width+'.png',Buffer.from(shot.data,'base64'));}
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await waitFor('!document.querySelector("dialog")');
 }
 assert.equal(await evaluate('window.reviewPosts'),0);assert.deepEqual(fs.readFileSync(file),beforeProject);assert.deepEqual(fs.readFileSync(path.join(dir,'work/face.json')),beforeFace);
 await evaluate(`(async()=>{window.reviewStale=false;const current=await (await fetch('/api/project')).json();const {openPersonSelectionDialog}=await import('/ui/contentos-person-selection.js');await openPersonSelectionDialog({src:${JSON.stringify(savedRanges[0].src)},savedSelection:${JSON.stringify(savedRanges[0])},mediaUrl:()=>'/api/primary-media-preview?'+new URLSearchParams({src:${JSON.stringify(savedRanges[0].src)},dir:${JSON.stringify(created.dir)},revision:current.revision,workspaceId:${JSON.stringify(saved.workspaceId||'default')}}),checkSource:async()=>{if(window.reviewStale)throw Error('Nguồn đã đổi thử nghiệm')}});})()`);
 await waitFor('!document.querySelector("dialog [data-frame]").disabled');
 await evaluate('window.reviewStale=true;document.querySelector("dialog [data-load]").click()');
 await waitFor('document.querySelector("dialog [data-status]").textContent.includes("Nguồn đã đổi")');
 assert.equal(await evaluate('document.querySelector("dialog [data-frame]").disabled'),true);
 assert.equal(await evaluate('(()=>{const c=document.querySelector("dialog canvas");return c.getContext("2d").getImageData(0,0,c.width,c.height).data.every(n=>n===0)})()'),true);
 await evaluate('document.querySelector("dialog [data-close]").click()');
 fs.writeFileSync('docs/PERSON_POINT_SUGGESTIONS_BROWSER_SMOKE.json',JSON.stringify({project:created.dir,realMediaPipe:true,realSAM2:true,suggestedPointsUsedForRealSAM2:true,suggestionDoesNotWriteProject:true,reviewTwoRanges:true,toggleChangesCanvas:true,seekLastSample:true,noTrackingPosts:true,projectFaceBytesUnchanged:true,escapeCloses:true,sourceErrorDisablesReview:true,staleReloadClearsCanvas:true,widths:[1280,390],scope:'Two saved 2-second ranges on one 6-second speaker; not multiple people or occlusion'},null,2));
 assert.deepEqual(errors,[]);
 console.log(created.dir);
}finally{if(originalWorkspace)await fetch(base+'/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:originalWorkspace})}).catch(()=>{});ws?.close();chrome.kill();server.kill();}
