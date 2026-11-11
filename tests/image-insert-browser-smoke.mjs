import http from 'node:http';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
let gateway;
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
 const open=async()=>{await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await evaluate("document.querySelector('#btnStudio').click()");await waitFor("[...document.querySelectorAll('#tabs button')].some(b=>b.textContent.includes('Thương hiệu'))");await evaluate("[...document.querySelectorAll('#tabs button')].find(b=>b.textContent.includes('Thương hiệu')).click()");await waitFor("(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent==='Lưu bộ đang chỉnh làm mặc định');return b&&!b.disabled})()");};

 const evidence={sizes:[],syntheticSource:true};
 const png=path.join(profile,'red.png');execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=red:s=320x180','-frames:v','1',png],{windowsHide:true});let generated=0;const requestedModels=[];let modelLists=0;
 gateway=http.createServer(async(req,res)=>{if(req.url==="/v1/models"){modelLists++;res.setHeader("Content-Type","application/json");res.end(JSON.stringify({data:[{id:"fixture-run-image"},{id:"fixture-red"}]}));return;}let raw="";for await(const chunk of req){raw+=chunk;}requestedModels.push(JSON.parse(raw).model);generated++;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({data:[{b64_json:fs.readFileSync(png).toString('base64')}]}));});await new Promise(ok=>gateway.listen(0,'127.0.0.1',ok));
 await api('/api/v1/connections/image',{workspaceId:workspace.id,baseUrl:'http://127.0.0.1:'+gateway.address().port+'/v1',model:'fixture-red'});
 for(const width of [1280,1920]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});const created=await create('ContentOS-Smoke-ImageInsert-'+width+'-'+Date.now()),dir=created.dir,file=path.join(dir,'project.json'),p=JSON.parse(fs.readFileSync(file));p.texts=[];p.brolls=[];p.captions={enabled:false,lines:[]};p.audio={...p.audio,autoSfx:false,sfxLevel:'tat',music:'',sfx:[]};fs.writeFileSync(file,JSON.stringify(p));
 await api('/api/open',{dir});await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await evaluate("document.querySelector('#btnStudio').click()");await waitFor("!!document.querySelector('.clip.video')");
 await evaluate("[...document.querySelectorAll('#tabs button')].find(b=>b.textContent.includes('Cảnh trám')).click()");await waitFor("[...document.querySelectorAll('button')].some(b=>b.textContent==='Tạo ảnh AI')");
 await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='Tạo ảnh AI').click()");await waitFor("!!document.querySelector('[data-prompt]')");await evaluate("document.querySelector('[data-run-model]').value='typed-model';document.querySelector('.cos-run-model-picker button').click()");await waitFor("!document.querySelector('.cos-run-model-picker select').hidden");assert.equal(await evaluate("document.querySelector('[data-run-model]').value"),'typed-model');assert.equal(generated,width===1280?0:1);await evaluate("const select=document.querySelector('.cos-run-model-picker select');select.value='fixture-run-image';select.dispatchEvent(new Event('change'))");assert.equal(await evaluate("document.querySelector('[data-run-model]').value"),'fixture-run-image');await evaluate("document.querySelector('[data-prompt]').value='Synthetic red source';document.querySelector('[data-generate]').click()");await waitFor("[...document.querySelectorAll('[data-results] button')].some(b=>b.textContent==='Chèn vào bản dựng tại playhead')");
 await evaluate("[...document.querySelectorAll('[data-results] button')].find(b=>b.textContent==='Chèn vào bản dựng tại playhead').click()");await waitFor("!document.querySelector('dialog[aria-label=\"Tạo ảnh AI\"]')");await evaluate("document.querySelector('#btnSave').click()");await delay(900);let saved=JSON.parse(fs.readFileSync(file));assert.equal(saved.brolls.length,1);assert.ok(fs.existsSync(path.join(dir,saved.brolls[0].src)));assert.equal(saved.brolls[0].mode,'pip');
 await evaluate("document.querySelector('#btnUndo').click();document.querySelector('#btnSave').click()");await delay(900);assert.equal(JSON.parse(fs.readFileSync(file)).brolls.length,0);await evaluate("document.querySelector('#btnRedo').click();document.querySelector('#btnSave').click()");await delay(900);assert.equal(JSON.parse(fs.readFileSync(file)).brolls.length,1);
 await send('Page.reload');await delay(1000);await waitFor("!!document.querySelector('#btnStudio')");await evaluate("document.querySelector('#btnStudio').click()");evidence.sizes.push({width,project:dir,generatedThenDirectInsert:true,undoRedoSaved:true});
 }
 assert.equal(generated,2);assert.equal(modelLists,2);evidence.modelLists=modelLists;assert.deepEqual(requestedModels,['fixture-run-image','fixture-run-image']);assert.equal((await api('/api/v1/connections/image')).model,'fixture-red');evidence.syntheticGatewayRequests=generated;evidence.perRunModels=requestedModels;evidence.savedModelUnchanged=true;
 const dir=evidence.sizes[0].project,child=spawn(process.execPath,['editor/tools/xuat-video.mjs',dir,'--quality','final'],{windowsHide:true,stdio:'ignore'});await new Promise((ok,no)=>{child.on('error',no);child.on('exit',code=>code===0?ok():no(new Error('render '+code)));});const render=JSON.parse(fs.readFileSync(path.join(dir,'work/render.json')));assert.equal(render.ok,true);
 const pixel=[...execFileSync('ffmpeg',['-v','error','-ss','1','-i',path.join(dir,render.output),'-vf','format=rgb24,crop=1:1:540:500','-frames:v','1','-f','rawvideo','pipe:1'],{windowsHide:true})];assert.ok(pixel[0]>180&&pixel[1]<60&&pixel[2]<60,JSON.stringify(pixel));evidence.render={ok:true,imageRedPixel:pixel,sample:{time:1,x:540,y:500},output:path.join(dir,render.output)};
 assert.deepEqual(errors,[]);evidence.pageErrors=errors;evidence.limits='Synthetic image gateway only; actual UI generation/import/direct B-roll insertion/undo/save/reload/render, no paid provider or source product fidelity acceptance.';fs.writeFileSync('docs/IMAGE_INSERT_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{gateway?.closeAllConnections();if(gateway)await new Promise(ok=>gateway.close(ok));if(previousWorkspace)await fetch('http://127.0.0.1:5180/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:previousWorkspace})});ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
