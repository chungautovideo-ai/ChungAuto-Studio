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
 fs.mkdirSync(path.join(source,'inputs'),{recursive:true});execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=blue:s=640x360:r=30:d=3','-f','lavfi','-i','sine=frequency=880:duration=3','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac',path.join(source,'inputs/raw.mp4')],{windowsHide:true});
 fs.copyFileSync(path.join(source,'inputs/raw.mp4'),path.join(source,'inputs/second.mp4'));execFileSync('ffmpeg',['-v','error','-y','-f','lavfi','-i','color=c=red:s=640x360:r=30:d=3','-f','lavfi','-i','sine=frequency=440:duration=3','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac',path.join(source,'inputs/second.mp4')],{windowsHide:true});
 const project={name:'ContentOS-Smoke-AIEV-Migration',width:1080,height:1920,fps:30,scenes:[{id:'one',srcVideo:'inputs/raw.mp4',from:0,to:1,fit:'contain',volume:1},{id:'two',srcVideo:'inputs/second.mp4',from:1,to:2,fit:'cover',volume:1}],subtitles:[],audio:{voice:null,sfx:[]}};
 fs.writeFileSync(path.join(source,'meta.json'),JSON.stringify(project));
 async function api(url,body){const r=await fetch(base+url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const value=await r.json();assert.ok(r.ok,JSON.stringify(value));return value;}
 const evidence={sizes:[],syntheticSource:true};
 const waitFor=async expression=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Timed out: '+expression);};
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
   const dir=new URL(href).searchParams.get('pick');const copied=JSON.parse(fs.readFileSync(path.join(dir,'project.json')));assert.equal(copied.workspaceId,workspace.id);assert.deepEqual(copied.segments.map(s=>[s.in,s.out]),[[0,1],[1,2]]);assert.ok(fs.existsSync(path.join(dir,'index.html')));assert.deepEqual(copied.segments.map(s=>s.fit),['contain','cover']);
   assert.equal(copied.audio.voice,1);
   await api('/api/open',{dir:path.relative(process.cwd(),dir)});await send('Page.navigate',{url:base+'/'});
   await waitFor("!!document.querySelector('#btnStudio')");await delay(700);
   await evaluate("document.querySelector('#btnStudio').click()");
   await waitFor("document.querySelectorAll('.clip.video').length===2");
   await evaluate("document.querySelectorAll('.clip.video')[1].dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,pointerType:'mouse'}))");
   await waitFor("document.querySelector('#inspector').textContent.includes('Vào (timeline nguồn chung)')");
   await evaluate(`(()=>{const field=[...document.querySelectorAll('#inspector .field')].find(f=>f.querySelector('label')?.textContent==='Vào (timeline nguồn chung)');const input=field.querySelector('input');input.value='1.5';input.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#btnSave').click();})()`);
   await waitFor("document.querySelector('#toast').textContent.includes('Đã lưu')");
   const saved=JSON.parse(fs.readFileSync(path.join(dir,'project.json')));assert.equal(saved.segments.length,3);assert.equal(saved.segments[1].keep,false);assert.equal(saved.segments[2].in,1.5);assert.equal(saved.segments[2].mediaStart,1.5);assert.equal(saved.segments[1].src,saved.segments[2].src);
   await send('Page.reload');await delay(1000);await evaluate("document.querySelector('#btnStudio').click()");await waitFor("document.querySelectorAll('.clip.video').length===2");
   await waitFor("document.querySelectorAll('.clip.video .film').length===2 && document.querySelectorAll('.clip.voice canvas').length===2");
   const colors=await evaluate(`Promise.all([...document.querySelectorAll('.clip.video .film i:first-child')].map(async el=>{const url=el.style.backgroundImage.slice(5,-2);const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=54;canvas.height=96;const context=canvas.getContext('2d');context.drawImage(image,0,0);return [...context.getImageData(27,48,1,1).data].slice(0,3);}))`);
   assert.ok(colors[0][2]>150&&colors[0][0]<60,JSON.stringify(colors));assert.ok(colors[1][0]>150&&colors[1][2]<60,JSON.stringify(colors));
   evidence.sizes.push({width,perSourceFilmstripColors:colors,waveformCanvases:2});
   evidence.sizes.push({width,dir,importedFromSettings:true,inspectorTrimSaveReload:true,removedSourceRetained:true});
  }
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(source,'meta.json'))),project);evidence.sourceUnchanged=true;assert.deepEqual(errors,[]);evidence.pageErrors=errors;fs.writeFileSync('docs/MULTISOURCE_TIMELINE_CACHE_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log({sizes:evidence.sizes,sourceUnchanged:true});
 }finally{fs.writeFileSync(configFile,previousConfig);fs.rmSync(fixture,{recursive:true,force:true});}
 await send('Browser.close').catch(()=>{});
}finally{if(previousWorkspace)await fetch('http://127.0.0.1:5180/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:previousWorkspace})});ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
