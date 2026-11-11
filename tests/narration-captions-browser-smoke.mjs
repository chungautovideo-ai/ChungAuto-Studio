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

 const projectFile=path.join(root,project.dir,'project.json'),pj=JSON.parse(fs.readFileSync(projectFile,'utf8'));pj.audio.clips=[{id:'voice-caption-qa',src:imported.asset.path,at:0,from:0,dur:2,sourceDuration:8,vol:1}];fs.writeFileSync(projectFile,JSON.stringify(pj));
 await api('/api/open',{dir:project.dir});const evidence={project:project.dir,sizes:[],recognizerMockOnly:true,noPaidCalls:true};
 for(const width of [1280,1920]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/'});await delay(1000);
  await evaluate("document.querySelector('#btnStudio').click();[...document.querySelectorAll('#tabs button')].find(b=>b.textContent.includes('Văn bản')).click();[...document.querySelectorAll('#submenu button')].find(b=>b.textContent.includes('Phụ đề')).click()");
  await evaluate(`(()=>{const original=window.fetch;window.fetch=(url,options)=>{if(url==='/api/asr/narration'){window.__asrBody=JSON.parse(options.body);return Promise.resolve(new Response(JSON.stringify({ok:true,result:{engine:'fixture',words:[{word:'Xin',start:0.1,end:0.5},{word:'chào.',start:0.5,end:1},{word:'Bỏ',start:3,end:4}]}})));}return original(url,options);};[...document.querySelectorAll('#list button')].find(b=>b.textContent==='Nhận giọng từ voice').click();})()`);
  for(let i=0;i<100;i++){if(await evaluate("document.querySelector('#list').textContent.includes('Đã nhận 2 từ')"))break;await delay(100);}
  assert.match(await evaluate("document.querySelector('#list').textContent"),/Đã nhận 2 từ/);assert.deepEqual(await evaluate('window.__asrBody'),{clipId:'voice-caption-qa',language:'vi',stream:true});
  assert.equal(((await api('/api/project')).body.project.captions?.lines||[]).length,0);
  await evaluate("[...document.querySelectorAll('#list button')].find(b=>b.textContent==='Thay phụ đề bằng lời voice').click();document.querySelector('#btnSave').click()");await delay(400);
  const saved=(await api('/api/project')).body.project;assert.equal(saved.captions.lines.length,1);assert.equal(saved.captions.lines[0].words.map(w=>w.w).join(' '),'Xin chào.');assert.deepEqual(saved.segments,pj.segments);assert.deepEqual(saved.audio.clips,pj.audio.clips);
  await evaluate("document.querySelector('#btnUndo').click();document.querySelector('#btnSave').click()");await delay(400);assert.equal(((await api('/api/project')).body.project.captions?.lines||[]).length,0);
  await evaluate(`(()=>{const original=window.fetch;window.fetch=(url,options)=>url==='/api/asr/narration'?new Promise((resolve,reject)=>{window.__cancelSignal=options.signal;options.signal.addEventListener('abort',()=>reject(new DOMException('Cancelled','AbortError')),{once:true});}):original(url,options);[...document.querySelectorAll('#list button')].find(b=>b.textContent==='Nhận giọng từ voice').click();})()`);
  for(let i=0;i<50;i++){if(await evaluate('!!window.__cancelSignal'))break;await delay(100);}
  await evaluate("[...document.querySelectorAll('#list button')].find(b=>b.textContent==='Hủy nhận giọng').click()");
  for(let i=0;i<50;i++){if(await evaluate("document.querySelector('#list').textContent.includes('Đã yêu cầu hủy')"))break;await delay(100);}
  assert.equal(await evaluate('window.__cancelSignal.aborted'),true);assert.match(await evaluate("document.querySelector('#list').textContent"),/Đã yêu cầu hủy/);
  assert.equal(((await api('/api/project')).body.project.captions?.lines||[]).length,0);
  evidence.sizes.push({width,previewBeforeReplacement:true,trimExcludesUnusedWords:true,applySaveUndo:true,cutsAndAudioPreserved:true,cancelButtonAborts:true});
 }
 assert.deepEqual(errors,[]);evidence.pageErrors=errors;fs.writeFileSync('docs/NARRATION_CAPTIONS_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{if(previousWorkspace)await fetch('http://127.0.0.1:5180/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:previousWorkspace})});ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
