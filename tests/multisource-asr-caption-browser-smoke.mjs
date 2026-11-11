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
 ws.onmessage=event=>{const msg=JSON.parse(event.data);if(msg.id){const p=pending.get(msg.id);if(p){pending.delete(msg.id);msg.error?p.reject(new Error(JSON.stringify(msg.error))):p.resolve(msg.result);}}else if(msg.method==='Page.javascriptDialogOpening'){send('Page.handleJavaScriptDialog',{accept:true}).catch(()=>{});}else if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.text+': '+(msg.params.exceptionDetails.exception?.description||''));};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const requestId=++id;pending.set(requestId,{resolve,reject});ws.send(JSON.stringify({id:requestId,method,params}));setTimeout(()=>{if(pending.delete(requestId))reject(new Error('CDP timeout '+method));},10000).unref();});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});




 const base='http://127.0.0.1:5180';
 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'cos-asr-ui-'));
 const {probeMediaMetadata}=await import('../src/services/media-metadata.mjs');
 const {prepareTools}=await import('../editor/lib/system.mjs');prepareTools(process.cwd());
 try{
 const ps=path.join(fixture,'speech.ps1');fs.writeFileSync(ps,`Add-Type -AssemblyName System.Speech
$voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice.Rate = -1
$voice.SetOutputToWaveFile('${path.join(fixture,'a.wav').replaceAll("'","''")}')
$voice.Speak('Welcome to our video studio. We create great videos every day.')
$voice.SetOutputToNull()
$voice.SetOutputToWaveFile('${path.join(fixture,'b.wav').replaceAll("'","''")}')
$voice.Speak('This is a new production. The camera is ready for action.')
$voice.Dispose()
`);
 execFileSync('powershell',['-NoProfile','-ExecutionPolicy','Bypass','-File',ps],{windowsHide:true});
 const metadata=[];for(const name of ['a','b']){execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=blue:s=160x90:r=30','-i',path.join(fixture,name+'.wav'),'-shortest','-c:v','libx264','-c:a','aac',path.join(fixture,name+'.mp4')],{windowsHide:true});metadata.push(await probeMediaMetadata(path.join(fixture,name+'.mp4')));}

 async function api(url,body){const r=await fetch(base+url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();assert.ok(r.ok,JSON.stringify(data));return data;}
 async function waitFor(expression){for(let i=0;i<600;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Timed out: '+expression);}
 previousWorkspace=(await api('/api/v1/workspaces')).activeId;
 const workspace=await api('/api/v1/workspaces',{name:'ContentOS-Smoke-ASR-'+Date.now()});
 const response=await fetch(base+'/api/new-project?file=source.mp4&name=ContentOS-Smoke-ASR&noasr=1',{method:'POST',body:fs.readFileSync(path.join(fixture,'a.mp4'))});assert.ok(response.ok);const created=await response.json(),dir=created.dir;
 const p=JSON.parse(fs.readFileSync(path.join(dir,'project.json'))),a=metadata[0].duration,b=metadata[1].duration;
 fs.copyFileSync(path.join(fixture,'a.mp4'),path.join(dir,'inputs/a.mp4'));fs.copyFileSync(path.join(fixture,'b.mp4'),path.join(dir,'inputs/b.mp4'));
 p.source={video:'inputs/a.mp4',timeline:'segments',duration:a+b,width:160,height:90,hasAudio:true};p.segments=[{id:'a',src:'inputs/a.mp4',in:0,out:a,mediaStart:0,speed:2,mediaInfo:metadata[0]},{id:'b',src:'inputs/b.mp4',in:a,out:a+b,mediaStart:0,mediaInfo:metadata[1]}];p.captions={enabled:false,lines:[]};p.texts=[];p.audio.autoSfx=false;
 fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify(p));execFileSync(process.execPath,['editor/lib/build.mjs',dir],{windowsHide:true});
 await api('/api/open',{dir});await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await delay(800);await evaluate("document.querySelector('#btnStudio').click()");await waitFor("!!document.querySelector('.clip.video')");
 await evaluate("[...document.querySelectorAll('#tabs button')].find(b=>b.textContent.includes('Văn bản')).click();[...document.querySelectorAll('#submenu button')].find(b=>b.textContent.includes('Phụ đề')).click()");await waitFor(`!!document.querySelector('[aria-label="Ngôn ngữ nhận giọng nguồn"]')`);
 await evaluate(`(()=>{const select=document.querySelector('[aria-label="Ngôn ngữ nhận giọng nguồn"]');select.value='en';select.dispatchEvent(new Event('change'));[...document.querySelectorAll('.asr-box button')].find(b=>b.textContent==='Nhận giọng nói').click();})()`);
 await waitFor("document.querySelector('#toast').textContent.includes('Đã nhận giọng:')");
 const transcript=JSON.parse(fs.readFileSync(path.join(dir,'work/transcript.json')));assert.ok(transcript.words.some(w=>w.source.src==='inputs/a.mp4'));assert.ok(transcript.words.some(w=>w.source.src==='inputs/b.mp4'));assert.equal(transcript.language,'en');
 const evidence={project:dir,words:transcript.words.length,sizes:[],actualLocalWhisper:true};
 for(const width of [1280,1920]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});
 await evaluate("[...document.querySelectorAll('#list button')].find(b=>b.textContent.includes('Tạo phụ đề từ lời nói')||b.textContent==='Tạo lại từ lời nói').click();document.querySelector('#btnSave').click()");await waitFor("document.querySelector('#toast').textContent.includes('Đã lưu')");
 const saved=JSON.parse(fs.readFileSync(path.join(dir,'project.json')));assert.ok(saved.captions.lines.length>2);assert.ok(saved.captions.y<1080);const text=saved.captions.lines.flatMap(l=>l.words.map(w=>w.w)).join(' ');assert.match(text,/studio/i);assert.match(text,/camera/i);
 await send('Page.reload');await delay(900);await evaluate("document.querySelector('#btnStudio').click()");await waitFor("!!document.querySelector('.clip.video')");await evaluate("[...document.querySelectorAll('#tabs button')].find(b=>b.textContent.includes('Văn bản')).click();[...document.querySelectorAll('#submenu button')].find(b=>b.textContent.includes('Phụ đề')).click()");await waitFor("[...document.querySelectorAll('#list input,#list textarea')].some(el=>el.value.toLowerCase().includes('studio')) || document.querySelector('#list').textContent.toLowerCase().includes('studio')");evidence.sizes.push({width,captionLines:saved.captions.lines.length,saveReload:true});
 }
 const child=spawn(process.execPath,['editor/tools/xuat-video.mjs',dir,'--quality','final'],{windowsHide:true,stdio:'ignore'});await new Promise((ok,no)=>{child.on('error',no);child.on('exit',code=>code===0?ok():no(new Error('Render '+code)));});
 const render=JSON.parse(fs.readFileSync(path.join(dir,'work/render.json')));assert.equal(render.ok,true);evidence.render=render;assert.ok(Math.abs(Number(render.probe.format.duration)-(a/2+b))<.08);
 assert.deepEqual(errors,[]);evidence.pageErrors=errors;evidence.limits='Actual browser ASR/caption/save/reload and final render; synthetic English only, no all-word visual timing proof or Vietnamese footage benchmark.';fs.writeFileSync('docs/MULTISOURCE_ASR_CAPTION_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log({words:evidence.words,sizes:evidence.sizes,renderOk:render.ok});
 }finally{fs.rmSync(fixture,{recursive:true,force:true});}
 await send('Browser.close').catch(()=>{});
}finally{if(previousWorkspace)await fetch('http://127.0.0.1:5180/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:previousWorkspace})});ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
