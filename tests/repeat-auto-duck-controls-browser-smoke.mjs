import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createStorageService} from '../src/services/storage.mjs';
import {createNewsService} from '../src/services/news.mjs';
import {attachVoiceResult} from '../src/services/voice-intake.mjs';
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


 const base='http://127.0.0.1:5180';
 async function api(url,body){const response=await fetch(base+url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:response.status,body:await response.json()};}
 previousWorkspace=(await api('/api/v1/workspaces')).body.activeId;
 const workspace=(await api('/api/v1/workspaces',{name:'ContentOS-Smoke-VoiceTimeline '+Date.now()})).body;
 const upload=await fetch(base+'/api/new-project?file=fixture.mp4&name=ContentOS-Smoke-VoiceTimeline&noasr=1',{method:'POST',body:fs.readFileSync('tests/fixture.mp4')});const project=await upload.json();assert.ok(upload.ok);
 const story=(await api('/api/v1/news',{workspaceId:workspace.id,title:'QA narration',script:'Nội dung thử nghiệm.',sources:[{url:'https://example.com',excerpt:'Nội dung thử nghiệm.'}],approved:true})).body.entry;
 let context=(await api('/api/v1/news/project?dir='+encodeURIComponent(project.dir))).body;
 assert.equal((await api('/api/v1/news/project',{workspaceId:workspace.id,dir:project.dir,id:story.id,expectedId:null,revision:context.revision})).status,200);
 const root=process.cwd(),voiceFolder=path.join(root,'workspace/contentos/voice',workspace.id,'ket-qua');fs.mkdirSync(voiceFolder,{recursive:true});const voiceId='aaaaaaaaaaaa',audio=path.join(voiceFolder,voiceId+'.mp3');
 execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','sine=frequency=440:duration=8',audio],{windowsHide:true});
 const textHash=crypto.createHash('sha256').update(story.payload.script).digest('hex');fs.writeFileSync(path.join(voiceFolder,voiceId+'.json'),JSON.stringify({id:voiceId,workspaceId:workspace.id,sha256:crypto.createHash('sha256').update(fs.readFileSync(audio)).digest('hex'),duration:8,textHash,narration:{workspaceId:workspace.id,scriptId:story.id,scriptHash:story.hash,version:story.version,textHash}}));
 const imported=await attachVoiceResult(root,createStorageService(root,{active:()=>workspace}),createNewsService(root),{workspaceId:workspace.id,dir:project.dir,id:voiceId,expectedNewsId:story.id});
 const evidence={project:project.dir,syntheticTone:true,sizes:[],noProviderCalls:true};
 for(const width of [1280,1920]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/'});await delay(1000);
  await evaluate("document.querySelector('#btnStudio').click();[...document.querySelectorAll('#tabs button')].find(b=>b.textContent.includes('Âm thanh')).click()");
  for(let i=0;i<100;i++){if(await evaluate("document.querySelector('#list').textContent.includes('Khớp kịch bản')"))break;await delay(100);}
  assert.match(await evaluate("document.querySelector('#list').textContent"),/Khớp kịch bản/);assert.match(await evaluate("document.querySelector('#list').textContent"),/dài hơn phần video/);
  await evaluate("[...document.querySelectorAll('#list button')].find(b=>b.textContent==='Thêm audio tại playhead').click()");
  for(let i=0;i<60;i++){if(await evaluate("document.querySelector('#list').textContent.includes('Voice từ kịch bản')"))break;await delay(100);}
  assert.match(await evaluate("document.querySelector('#list').textContent"),/Voice từ kịch bản v1/);
  for(let i=0;i<60;i++){if(await evaluate("[...document.querySelectorAll('[data-voice-clip-status]')].every(e=>e.textContent.includes('Khớp kịch bản'))"))break;await delay(100);}
  assert.equal(await evaluate("document.querySelectorAll('[data-voice-clip-status]').length>0&&[...document.querySelectorAll('[data-voice-clip-status]')].every(e=>e.textContent.includes('Khớp kịch bản'))"),true);
  await evaluate("document.querySelector('#btnSave').click()");await delay(500);
  const saved=(await api('/api/project')).body.project.audio.clips;assert.equal(saved.at(-1).src,imported.asset.path);assert.equal(saved.at(-1).voiceSource.narration.scriptId,story.id);
  await evaluate(`(()=>{const input=document.querySelector('[aria-label="Hạ nhạc theo clip thuyết minh"]');input.checked=true;input.dispatchEvent(new Event('change'));document.querySelector('#btnSave').click();})()`);await delay(400);
  assert.equal((await api('/api/project')).body.project.audio.duckNarration,true);
  await evaluate(`(()=>{const field=[...document.querySelectorAll('#list .field')].find(e=>e.querySelector('label')?.textContent==='Thời gian hạ/nâng nhạc');const input=field.querySelector('input[type=number]');input.value='.4';input.dispatchEvent(new Event('input'));document.querySelector('#btnSave').click();})()`);await delay(400);assert.equal((await api('/api/project')).body.project.audio.duckFade,.4);

  await evaluate(`(()=>{for(const [label,value] of [['Fade vào audio (giây)',.4],['Fade ra audio (giây)',.5]]){const field=[...document.querySelectorAll('#list .field')].find(e=>e.querySelector('label')?.textContent===label);const input=field.querySelector('input[type=number]');input.value=value;input.dispatchEvent(new Event('input'));}document.querySelector('#btnSave').click();})()`);await delay(500);
  const faded=(await api('/api/project')).body.project.audio.clips[0];assert.equal(faded.fadeIn,.4);assert.equal(faded.fadeOut,.5);
  await evaluate(`(()=>{const field=[...document.querySelectorAll('#list .field')].find(e=>e.querySelector('label')?.textContent==='Cách lặp nhạc');const select=field.querySelector('select');select.value='repeat';select.dispatchEvent(new Event('input'));})()`);
  await evaluate(`(()=>{const duck=document.querySelector('[aria-label="Hạ nhạc theo clip thuyết minh"]');duck.checked=false;duck.dispatchEvent(new Event('change'));for(const [label,value] of [['Fade vào nhạc (giây)',.3],['Fade ra nhạc (giây)',.4]]){const field=[...document.querySelectorAll('#list .field')].find(e=>e.querySelector('label')?.textContent===label);const input=field.querySelector('input');input.value=value;input.dispatchEvent(new Event('input'));}document.querySelector('#btnSave').click();})()`);await delay(500);
  const looped=(await api('/api/project')).body.project.audio;assert.equal(looped.musicLoop,'repeat');assert.equal(looped.musicFadeIn,.3);assert.equal(looped.musicFadeOut,.4);
  await evaluate(`(()=>{const field=[...document.querySelectorAll('#list .field')].find(e=>e.querySelector('label')?.textContent==='Mức nhạc trong vùng lời nói');const input=field.querySelector('input');input.value='.2';input.dispatchEvent(new Event('input'));document.querySelector('[aria-label="Vùng lời nói nhạc nền"]').value='[[0.5,1.1]]';[...document.querySelectorAll('#list button')].find(b=>b.textContent==='Áp dụng vùng lời nói').click();document.querySelector('#btnSave').click();})()`);await delay(500);
  const speechAudio=(await api('/api/project')).body.project.audio;assert.deepEqual(speechAudio.musicSpeech,[[.5,1.1]]);assert.equal(speechAudio.musicSpeechLevel,.2);
  await evaluate(`(()=>{const input=document.querySelector('[aria-label="Hạ nhạc theo clip thuyết minh"]');input.checked=true;input.dispatchEvent(new Event('change'));document.querySelector('#btnSave').click();})()`);await delay(500);const autoAudio=(await api('/api/project')).body.project.audio;assert.equal(autoAudio.duckNarration,true);assert.equal(autoAudio.musicLoop,'repeat');assert.deepEqual(autoAudio.musicSpeech,[[.5,1.1]]);
  evidence.sizes.push({width,repeatAutoDuckSave:true,speechControlsAndSave:true,fadeInputsAndSave:true,musicLoopControlsAndSave:true,matchingScriptShown:true,duckControlAndSave:true,smoothDuckControlAndSave:true,overflowWarning:true,insertAndSaveProvenance:true});
 }
 const changed=(await api('/api/v1/news',{workspaceId:workspace.id,parentId:story.id,title:'QA changed',script:'Lời đọc khác.',sources:[{url:'https://example.com',excerpt:'Lời đọc khác.'}],approved:true})).body.entry;
 context=(await api('/api/v1/news/project?dir='+encodeURIComponent(project.dir))).body;await api('/api/v1/news/project',{workspaceId:workspace.id,dir:project.dir,id:changed.id,expectedId:story.id,revision:context.revision});
 const count=(await api('/api/project')).body.project.audio.clips.length;
 await evaluate("[...document.querySelectorAll('#list button')].find(b=>b.textContent==='Kiểm tra lại liên kết lời đọc').click()");
 for(let i=0;i<100;i++){if(await evaluate("[...document.querySelectorAll('[data-voice-clip-status]')].every(e=>e.textContent.includes('kịch bản cũ'))"))break;await delay(100);}
 assert.equal(await evaluate("document.querySelectorAll('[data-voice-clip-status]').length>0&&[...document.querySelectorAll('[data-voice-clip-status]')].every(e=>e.textContent.includes('kịch bản cũ'))"),true);
 assert.equal((await api('/api/project')).body.project.audio.clips.length,count);
 evidence.existingClipMismatchOnRefresh=true;
 await send('Page.reload');await delay(1200);await evaluate("document.querySelector('#btnStudio').click();[...document.querySelectorAll('#tabs button')].find(b=>b.textContent.includes('Âm thanh')).click()");
 for(let i=0;i<100;i++){if(await evaluate("document.querySelector('#list').textContent.includes('Audio thuộc kịch bản khác')"))break;await delay(100);}
 assert.match(await evaluate("document.querySelector('#list').textContent"),/Audio thuộc kịch bản khác/);await evaluate("[...document.querySelectorAll('#list button')].find(b=>b.textContent==='Thêm audio tại playhead').click()");await delay(500);assert.match(await evaluate("document.querySelector('#toast').textContent"),/khác kịch bản/);await evaluate("document.querySelector('#btnSave').click()");await delay(300);assert.equal((await api('/api/project')).body.project.audio.clips.length,count);
 assert.equal(await evaluate("[...document.querySelectorAll('[data-voice-clip-status]')].every(e=>e.textContent.includes('kịch bản cũ'))"),true);
 evidence.existingClipMismatchAfterReload=true;
 evidence.mismatchedScriptInsertionRejected=true;assert.deepEqual(errors,[]);evidence.pageErrors=errors;fs.writeFileSync('docs/REPEAT_AUTO_DUCK_CONTROLS_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{if(previousWorkspace)await fetch('http://127.0.0.1:5180/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:previousWorkspace})});ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
