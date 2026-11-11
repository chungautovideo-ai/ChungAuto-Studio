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


 const base='http://127.0.0.1:5180',configFile='config/sources.local.json',previousConfig=fs.readFileSync(configFile,'utf8');
 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'cos-studio-browser-')),source=path.join(fixture,'demo/05_plan/studio/composition');
 fs.mkdirSync(path.join(source,'inputs'),{recursive:true});fs.writeFileSync(path.join(fixture,'demo/job.json'),JSON.stringify({title:'Synthetic Studio job'}));fs.copyFileSync('tests/fixture.mp4',path.join(source,'inputs/raw.mp4'));
 const project={title:'ContentOS-Smoke-Studio-Migration',format:'9:16',source:{video:'inputs/raw.mp4',duration:3,width:360,height:640,hasAudio:false},segments:[{id:'s',in:0,out:3,keep:true}],texts:[{id:'title',title:'STUDIO IMPORT',at:0,dur:1,size:70}],audio:{autoSfx:false,sfxLevel:'tat'},captions:{lines:[]}};
 fs.writeFileSync(path.join(source,'project.json'),JSON.stringify(project));
 async function api(url,body){const r=await fetch(base+url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const value=await r.json();assert.ok(r.ok,JSON.stringify(value));return value;}
 const evidence={sizes:[],syntheticSource:true};
 try{
  fs.writeFileSync(configFile,JSON.stringify({...JSON.parse(previousConfig),studioJobsRoot:fixture}));
  previousWorkspace=(await api('/api/v1/workspaces')).activeId;
  const workspace=await api('/api/v1/workspaces',{name:'ContentOS-Smoke Migration '+Date.now()});evidence.workspaceId=workspace.id;
  for(const width of [1280,1920]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/home'});
   for(let i=0;i<100;i++){if(await evaluate("typeof document.querySelector('#navContentOS')?.onclick==='function'"))break;await delay(100);}
   await evaluate("document.querySelector('#navContentOS').click()");
   for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('#cosMigrationScan')"))break;await delay(100);}
   await evaluate("document.querySelector('#cosMigrationScan').closest('details').open=true;document.querySelector('#cosMigrationScan').click()");
   for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('[data-import-project^=\"studio:\"]')"))break;await delay(100);}
   await evaluate("document.querySelector('[data-import-project^=\"studio:\"]').click()");
   for(let i=0;i<150;i++){if(await evaluate("!!document.querySelector('[data-import-result] a')"))break;await delay(100);}
   const href=await evaluate("document.querySelector('[data-import-result] a')?.href");assert.ok(href,await evaluate("document.querySelector('[data-import-result]').textContent"));
   const dir=new URL(href).searchParams.get('pick');const copied=JSON.parse(fs.readFileSync(path.join(dir,'project.json')));assert.equal(copied.workspaceId,workspace.id);assert.deepEqual(copied.segments,project.segments);assert.ok(fs.existsSync(path.join(dir,'index.html')));
   evidence.sizes.push({width,dir,importedFromSettings:true,editableProject:true});
  }
  const child=spawn(process.execPath,['editor/tools/xuat-video.mjs',evidence.sizes[0].dir,'--quality','final'],{windowsHide:true,stdio:'ignore'});await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error('Render exit '+code)));});
  const render=JSON.parse(fs.readFileSync(path.join(evidence.sizes[0].dir,'work/render.json')));assert.equal(render.ok,true);evidence.render=render;
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(source,'project.json'))),project);evidence.sourceUnchanged=true;assert.deepEqual(errors,[]);evidence.pageErrors=errors;fs.writeFileSync('docs/STUDIO_MIGRATION_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log({sizes:evidence.sizes,renderOk:render.ok,sourceUnchanged:true});
 }finally{fs.writeFileSync(configFile,previousConfig);fs.rmSync(fixture,{recursive:true,force:true});}
 await send('Browser.close').catch(()=>{});
}finally{if(previousWorkspace)await fetch('http://127.0.0.1:5180/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:previousWorkspace})});ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
