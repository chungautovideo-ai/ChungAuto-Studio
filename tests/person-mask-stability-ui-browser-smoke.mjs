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
 const up=await fetch(base+'/api/new-project?file=q2.mp4&name=ContentOS-Smoke-Stability&noasr=1',{method:'POST',body:fs.readFileSync(sample)}),created=await up.json();assert.ok(up.ok);const dir=path.resolve(created.dir),file=path.join(dir,'project.json'),project=JSON.parse(fs.readFileSync(file));
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
 // Cached tracks reload with source match; enable only white using the existing slider.
 await evaluate("document.querySelector('#btnSave').click()");await waitFor("document.querySelector('#toast').textContent.includes('Đã lưu')");
 await evaluate("var range=[...document.querySelectorAll('#list .field')].find(f=>f.textContent.includes('Trắng da')).querySelector('input');range.dispatchEvent(new Event('pointerdown'));range.value='20';range.dispatchEvent(new Event('input',{bubbles:true}))");
 await evaluate("document.querySelector('#btnSave').click()");await waitFor("document.querySelector('#toast').textContent.includes('Đã lưu')");await delay(300);
 assert.equal(JSON.parse(fs.readFileSync(file)).camera.beauty.white,20);
 await evaluate("var field=[...document.querySelectorAll('#list .field')].find(f=>f.textContent.includes('Sáng da mặt, cổ & tay'));var range=field.querySelector('input');if(range.disabled)throw Error('body control disabled after scan');range.dispatchEvent(new Event('pointerdown'));range.value='25';range.dispatchEvent(new Event('input',{bubbles:true}))");
 await evaluate("document.querySelector('#btnSave').click()");await waitFor("document.querySelector('#toast').textContent.includes('Đã lưu')");await delay(300);
 assert.equal(JSON.parse(fs.readFileSync(file)).camera.beauty.bodyWhite,25);
 await waitFor("!!document.querySelector('hyperframes-player')?.shadowRoot?.querySelector('iframe')?.contentWindow?.__beautyMask");

 await evaluate("var edge=document.querySelector('input[aria-label=\"Thu viền vùng người/da\"]');edge.closest('details').open=true;edge.dispatchEvent(new Event('pointerdown'));edge.value='35';edge.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#toast').textContent='';document.querySelector('#btnSave').click()");
 await waitFor("document.querySelector('#toast').textContent.includes('Đã lưu')");await delay(300);assert.equal(JSON.parse(fs.readFileSync(file)).camera.beauty.maskShrink,35);

 await delay(800);await evaluate("var edge=document.querySelector('input[aria-label=\"Thu viền vùng người/da\"]');edge.value='50';edge.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#btnUndo').click()");
 await waitFor("!!document.querySelector('input[aria-label^=Thu]')");assert.equal(await evaluate("document.querySelector('input[aria-label^=Thu]').value"),'35');
 await evaluate("var edge=document.querySelector('input[aria-label=\"Thu viền vùng người/da\"]');edge.value='40';edge.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#btnSave').click()");await delay(500);assert.equal(JSON.parse(fs.readFileSync(file)).camera.beauty.maskShrink,40);
 await evaluate("var stable=document.querySelector('input[aria-label=\"Ổn định vùng người/da\"]');stable.closest('details').open=true;stable.value='60';stable.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#btnSave').click()");await delay(700);assert.equal(JSON.parse(fs.readFileSync(file)).camera.beauty.maskStability,60);
 assert.ok(fs.readFileSync(path.join(dir,'index.html'),'utf8').includes('"maskStability":0.6'),'build embeds same normalized value as live preview');
 const savedBeforeMask=fs.readFileSync(file,'utf8');
 await evaluate("var mask=document.querySelector('select[aria-label=\"Xem vùng AI nhận diện\"]');mask.value='2';mask.dispatchEvent(new Event('change',{bubbles:true}))");await delay(250);
 await delay(1000);
 const maskCheck=await evaluate(`(()=>{const w=document.querySelector('#player').shadowRoot.querySelector('iframe').contentWindow;const c=w.document.querySelector('.beautyCv');if(!c)throw Error('no beauty canvas');const gl=c.getContext('webgl'),p=new Uint8Array(c.width*c.height*4);gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,p);let green=0;for(let i=0;i<p.length;i+=4)if(p[i+1]>p[i]+30&&p[i+1]>p[i+2]+30)green++;return {green,w:c.width,h:c.height,visibility:c.style.visibility,time:w.__timelines?.main?.time(),pv:w.__pv&&{time:w.__pv.currentTime,ready:w.__pv.readyState,src:w.__pv.src},videos:[...w.document.querySelectorAll('video')].map(v=>({start:v.dataset.start,duration:v.dataset.duration,ready:v.readyState,src:v.src}))};})()`);assert.ok(maskCheck.green>100,'mask preview should visibly mark skin green '+JSON.stringify(maskCheck));
 const maskCapture=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/PERSON_MASK_STABILITY_UI_MASK_PREVIEW.png',Buffer.from(maskCapture.data,'base64'));assert.equal(fs.readFileSync(file,'utf8'),savedBeforeMask);
 const broll=await evaluate(`(()=>{const w=document.querySelector('#player').shadowRoot.querySelector('iframe').contentWindow;w.__timelines.main.pause().time(.5);w.__beautySet({bodyWhite:.25});const v=w.document.querySelector('video.broll'),c=v.nextElementSibling?.classList.contains('beautyCv')?v.nextElementSibling:v.nextElementSibling?.nextElementSibling;return {covered:v.hasAttribute('data-beauty-covered'),canvas:c?.classList.contains('beautyCv'),width:c?.style.width,zIndex:c?.style.zIndex,opacity:c?.style.opacity,source:v.dataset.faceSource};})()`);assert.equal(broll.covered,true);assert.equal(broll.canvas,true);assert.equal(broll.source,'inputs/second.mp4');assert.equal(broll.zIndex,'30');

 await evaluate("var mask=document.querySelector('select[aria-label=\"Xem vùng AI nhận diện\"]');mask.value='0';mask.dispatchEvent(new Event('change',{bubbles:true}))");
 await evaluate(`var control=document.querySelector('input[aria-label="Ổn định vùng người/da"]');control.closest('details').open=true;control.scrollIntoView({block:'center'})`);
 for(const [width,height] of [[1280,720],[390,844]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(250);
  const capture=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/PERSON_MASK_STABILITY_UI_UI_'+width+'.png',Buffer.from(capture.data,'base64'));
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await delay(800);
 await evaluate("document.querySelector('#btnStudio').click();[...document.querySelectorAll('#tabs button')].find(b=>b.title==='Bộ lọc').click();[...document.querySelectorAll('#submenu button')].find(b=>b.textContent.includes('Làm đẹp')).click()");await waitFor("document.querySelector('#list').textContent.includes('Tìm thấy mặt')");
 assert.equal(await evaluate("[...document.querySelectorAll('#list .field')].find(f=>f.textContent.includes('Sáng da mặt, cổ & tay')).querySelector('input').value"),'25');assert.ok(fs.readFileSync(path.join(dir,'index.html'),'utf8').includes('window.__FACE = {"v":2'));
 assert.equal(await evaluate("document.querySelector('input[aria-label^=Thu]').value"),'40');assert.ok(await evaluate("document.querySelector('#list').textContent.includes('Dữ liệu đang dùng: 30 fps')"));
 assert.equal(await evaluate("document.querySelector('input[aria-label=\"Ổn định vùng người/da\"]').value"),'60');
 assert.deepEqual(errors,[]);const evidence={project:created.dir,detector:'Real MediaPipe on Q2 cropped720x960 source12–13s scaled360x480 and flipped copy',tracks:face.tracks.map(t=>({src:t.src,fps:t.fps,samples:t.f.length,found:t.f.filter(Boolean).length,sha256:t.fingerprint.sha256})),broll:true,sourceBound:true,scanDoesNotEnablePreset:true,whiteSaved:true,bodyMaskSaved:true,bodyWhiteSaved:25,maskPreviewWithoutProjectMutation:true,reopen:true,pageErrors:errors,scope:'Two real cropped Q2 sources, A-roll and flipped B-roll pip,1s each; not multi-person/full production benchmark.'};fs.writeFileSync('docs/PERSON_MASK_STABILITY_UI_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
}finally{if(originalWorkspace)await fetch(base+'/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:originalWorkspace})}).catch(()=>{});ws?.close();chrome.kill();server.kill();}
