import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
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


 const base='http://127.0.0.1:5180',configFile='config/sources.local.json',previousConfig=fs.readFileSync(configFile,'utf8');
 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'cos-aiev-browser-')),source=path.join(fixture,'video-projects/source');
 fs.mkdirSync(path.join(source,'inputs'),{recursive:true});execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=blue:s=360x640:r=30:d=3','-f','lavfi','-i','sine=frequency=880:duration=3','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac',path.join(source,'inputs/raw.mp4')],{windowsHide:true});
 const project={name:'ContentOS-Smoke-AIEV-Migration',width:1080,height:1920,fps:30,scenes:[{id:'one',srcVideo:'inputs/raw.mp4',from:.2,to:1,volume:1,fadeInSec:.3,fadeOutSec:.2},{id:'two',srcVideo:'inputs/raw.mp4',from:1.5,to:2.5,volume:1,fadeInSec:0,fadeOutSec:.3}],subtitles:[{from:6,durationInFrames:12,text:'Xin chào'},{from:21,durationInFrames:12,text:'Qua điểm cắt'},{from:36,durationInFrames:15,text:'Cảnh thứ hai'}],audio:{voice:null,sfx:[]}};
 fs.writeFileSync(path.join(source,'meta.json'),JSON.stringify(project));
 async function api(url,body){const r=await fetch(base+url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const value=await r.json();assert.ok(r.ok,JSON.stringify(value));return value;}
 const evidence={sizes:[],syntheticSource:true};
 try{
  fs.writeFileSync(configFile,JSON.stringify({...JSON.parse(previousConfig),aievRoot:fixture}));
  previousWorkspace=(await api('/api/v1/workspaces')).activeId;
  const workspace=await api('/api/v1/workspaces',{name:'ContentOS-Smoke Migration '+Date.now()});evidence.workspaceId=workspace.id;
  for(const width of [1280,1920]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/home'});
   for(let i=0;i<100;i++){if(await evaluate("typeof document.querySelector('#navContentOS')?.onclick==='function'"))break;await delay(100);}
   await evaluate("document.querySelector('#navContentOS').click()");
   for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('#cosMigrationScan')"))break;await delay(100);}
   await evaluate("document.querySelector('#cosMigrationScan').closest('details').open=true;document.querySelector('#cosMigrationScan').click()");
   for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('[data-import-project^=\"aiev:\"]')"))break;await delay(100);}
   await evaluate("document.querySelector('[data-import-project^=\"aiev:\"]').click()");
   for(let i=0;i<150;i++){if(await evaluate("!!document.querySelector('[data-import-result] a')"))break;await delay(100);}
   const href=await evaluate("document.querySelector('[data-import-result] a')?.href");assert.ok(href,await evaluate("document.querySelector('[data-import-result]').textContent"));
   const dir=new URL(href).searchParams.get('pick');const copied=JSON.parse(fs.readFileSync(path.join(dir,'project.json')));assert.equal(copied.workspaceId,workspace.id);assert.deepEqual(copied.segments.map(s=>[s.in,s.out]),[[.2,1],[1.5,2.5]]);assert.ok(fs.existsSync(path.join(dir,'index.html')));assert.equal(copied.texts.length,3);assert.deepEqual(copied.texts.map(t=>t.title),['Xin chào','Qua điểm cắt','Cảnh thứ hai']);
   assert.deepEqual(copied.segments.map(s=>[s.audioFadeIn,s.audioFadeOut]),[[.3,.2],[0,.3]]);assert.equal(copied.audio.voice,1);
   evidence.sizes.push({width,dir,importedFromSettings:true,editableProject:true});
  }
  const child=spawn(process.execPath,['editor/tools/xuat-video.mjs',evidence.sizes[0].dir,'--quality','final'],{windowsHide:true,stdio:'ignore'});await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error('Render exit '+code)));});
  const render=JSON.parse(fs.readFileSync(path.join(evidence.sizes[0].dir,'work/render.json')));assert.equal(render.ok,true);evidence.render=render;assert.ok(Math.abs(Number(render.probe.format.duration)-1.8)<.05);
  const pcm=execFileSync('ffmpeg',['-v','error','-i',path.join(evidence.sizes[0].dir,render.output),'-vn','-af','bandpass=f=880:w=40','-ac','1','-ar','8000','-f','f32le','pipe:1'],{windowsHide:true});const rms=(a,b)=>{let sum=0,n=0;for(let i=Math.floor(a*8000);i<Math.min(pcm.length/4,b*8000);i++){sum+=pcm.readFloatLE(i*4)**2;n++;}return Math.sqrt(sum/n);};const full=rms(.35,.5),attack=rms(.04,.08)/full,release=rms(1.72,1.76)/full;assert.ok(attack>.08&&attack<.4,JSON.stringify({attack}));assert.ok(release>.05&&release<.4,JSON.stringify({release}));evidence.segmentFade={full,attackRatio:attack,releaseRatio:release};
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(source,'meta.json'))),project);evidence.sourceUnchanged=true;assert.deepEqual(errors,[]);evidence.pageErrors=errors;fs.writeFileSync('docs/AIEV_SEGMENT_FADE_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log({sizes:evidence.sizes,renderOk:render.ok,sourceUnchanged:true});
 }finally{fs.writeFileSync(configFile,previousConfig);fs.rmSync(fixture,{recursive:true,force:true});}
 await send('Browser.close').catch(()=>{});
}finally{if(previousWorkspace)await fetch('http://127.0.0.1:5180/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:previousWorkspace})});ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
