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
 async function api(url,body){const r=await fetch(base+url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();assert.ok(r.ok,JSON.stringify(data));return data;}
 previousWorkspace=(await api('/api/v1/workspaces')).activeId;
 const workspace=await api('/api/v1/workspaces',{name:'ContentOS-Smoke-BrandUI-'+Date.now()});
 async function create(name){const r=await fetch(base+'/api/new-project?file=fixture.mp4&name='+name+'&noasr=1',{method:'POST',body:fs.readFileSync('tests/fixture.mp4')});assert.ok(r.ok);return r.json();}
 async function waitFor(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Timed out: '+expression+'; toast='+await evaluate("document.querySelector('#toast').textContent"));}
 const open=async()=>{await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await evaluate("document.querySelector('#btnStudio').click()");await waitFor("[...document.querySelectorAll('#tabs button')].some(b=>b.textContent.includes('Thương hiệu'))");await evaluate("[...document.querySelectorAll('#tabs button')].find(b=>b.textContent.includes('Thương hiệu')).click()");await waitFor("(()=>{const b=[...document.querySelectorAll('#list button')].find(b=>b.textContent==='Lưu bộ đang chỉnh làm mặc định');return b&&!b.disabled})()");};

 const evidence={sizes:[],syntheticSource:true};
 for(const width of [1280,1920]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});
 const created=await create('ContentOS-Smoke-Reorder-'+width+'-'+Date.now()),dir=created.dir;
 execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=red:s=320x180:r=30:d=1','-c:v','libx264','-pix_fmt','yuv420p',path.join(dir,'inputs/red.mp4')],{windowsHide:true});
 const file=path.join(dir,'project.json'),p=JSON.parse(fs.readFileSync(file));p.source.timeline='segments';p.source.duration=2;p.segments=[{id:'a',src:p.source.video,in:0,out:1,mediaStart:0,keep:true,mediaInfo:{width:p.source.width,height:p.source.height,duration:3,hasAudio:true}},{id:'b',src:'inputs/red.mp4',in:1,out:2,mediaStart:0,keep:true,mediaInfo:{width:320,height:180,duration:1,hasAudio:false}}];p.texts=[{id:'red-title',title:'RED',at:1.1,dur:.4,x:0,y:900,size:80,fx:'none'}];p.captions={enabled:false,lines:[{id:'c',words:[{w:'One',s:.2,e:.4},{w:'Two',s:1.2,e:1.4}]}]};p.audio={...p.audio,autoSfx:false,sfxLevel:'tat',music:'',sfx:[]};fs.writeFileSync(file,JSON.stringify(p));
 await api('/api/open',{dir});await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await evaluate("document.querySelector('#btnStudio').click()");await waitFor("document.querySelectorAll('.clip.video').length===2");
 await evaluate("document.querySelectorAll('.clip.video')[1].dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,pointerType:'mouse'}))");await waitFor("[...document.querySelectorAll('#inspector button')].some(b=>b.textContent==='Đưa đoạn lên trước')");
 await evaluate("[...document.querySelectorAll('#inspector button')].find(b=>b.textContent==='Đưa đoạn lên trước').click();document.querySelector('#btnUndo').click();document.querySelector('#btnSave').click()");await delay(800);assert.ok(!String(await evaluate("document.querySelector('#toast').textContent")).includes('Lỗi lưu'),'save failure');assert.equal(JSON.parse(fs.readFileSync(file)).segments[0].id,'a');
 await evaluate("document.querySelectorAll('.clip.video')[1].dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,pointerType:'mouse'}))");await waitFor("[...document.querySelectorAll('#inspector button')].some(b=>b.textContent==='Đưa đoạn lên trước')");await evaluate("[...document.querySelectorAll('#inspector button')].find(b=>b.textContent==='Đưa đoạn lên trước').click();document.querySelector('#btnSave').click()");await delay(800);assert.ok(!String(await evaluate("document.querySelector('#toast').textContent")).includes('Lỗi lưu'),'save failure');
 const saved=JSON.parse(fs.readFileSync(file));assert.deepEqual(saved.segments.map(s=>s.id),['b','a']);assert.ok(Math.abs(saved.texts[0].at-.1)<1e-8);assert.equal(saved.captions.lines[0].words[0].w,'Two');
 await send('Page.reload');await delay(900);await evaluate("document.querySelector('#btnStudio').click()");await waitFor("document.querySelectorAll('.clip.video').length===2");evidence.sizes.push({width,project:dir,reorderedSaveReload:true,undoVerified:true,anchorsMoved:true});
 }
 const dir=evidence.sizes[0].project,child=spawn(process.execPath,['editor/tools/xuat-video.mjs',dir,'--quality','final'],{windowsHide:true,stdio:'ignore'});await new Promise((ok,no)=>{child.on('error',no);child.on('exit',code=>code===0?ok():no(new Error('render '+code)));});const render=JSON.parse(fs.readFileSync(path.join(dir,'work/render.json')));assert.equal(render.ok,true);assert.ok(Math.abs(Number(render.probe.format.duration)-2)<.1);
 const output=path.join(dir,render.output),pixel=t=>[...execFileSync('ffmpeg',['-v','error','-ss',String(t),'-i',output,'-vf','format=rgb24,crop=1:1:100:100','-frames:v','1','-f','rawvideo','pipe:1'],{windowsHide:true})];const first=pixel(.7);assert.ok(first[0]>180&&first[1]<40);evidence.render={duration:render.probe.format.duration,firstRedPixel:first};
 assert.deepEqual(errors,[]);evidence.pageErrors=errors;evidence.limits='Actual reorder/undo/save/reload and final first red-source pixel; no physical NAS/long composition/provider benchmark. Cross-cut overlays retain output duration and need editorial review.';fs.writeFileSync('docs/PRIMARY_SEQUENCE_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{if(previousWorkspace)await fetch('http://127.0.0.1:5180/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:previousWorkspace})});ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
