import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-layout-'));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--no-first-run','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let ws;
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


 const api=async(url,body,method='POST')=>{const r=await fetch('http://127.0.0.1:5180'+url,body===undefined?{}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
 const originalWorkspace=(await api('/api/v1/workspaces')).body.activeId,sourceRoot=fs.mkdtempSync(path.join(os.tmpdir(),'cos-paths-browser-'));
 fs.copyFileSync('tests/fixture.mp4',path.join(sourceRoot,'video có dấu.mp4'));const selected=path.join(sourceRoot,'video có dấu.mp4'),text='Dựng quảng cáo 30 giây\nA-roll: "'+selected+'"\nB-roll: "'+sourceRoot+'"';
 const red=path.join(sourceRoot,'red.mp4'),green=path.join(sourceRoot,'green.mp4');
 for(const [file,color] of [[red,'red'],[green,'green']])execFileSync('ffmpeg',['-v','error','-f','lavfi','-i',`color=c=${color}:s=320x180:r=30:d=0.6`,'-c:v','libx264','-pix_fmt','yuv420p',file],{windowsHide:true});
 try{
  const workspace=(await api('/api/v1/workspaces',{name:'ContentOS-Smoke-PastedPaths '+Date.now(),brand:'QA'})).body;
  assert.equal((await api('/api/v1/sources/inspect-home',{workspaceId:'wrong',text})).status,409);
  assert.equal((await api('/api/v1/sources/media-info',{workspaceId:'wrong',text,selected})).status,409);
  assert.ok((await api('/api/v1/sources/media-info',{workspaceId:workspace.id,text,selected:path.join(sourceRoot,'absent.mp4')})).status>=400);
  assert.ok((await api('/api/v1/storage/new-project',{workspaceId:workspace.id,text,selected:path.join(sourceRoot,'absent.mp4')})).status>=400);
  const evidence={syntheticLocalPaths:true,noConfiguredNasRoot:true,staleWorkspaceRejected:true,outsideSelectionRejected:true,sizes:[],projects:[]};
  for(const width of [1280,1920]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'http://127.0.0.1:5180/home'});
   for(let i=0;i<100;i++){if(await evaluate("typeof document.querySelector('#homeInspectSources')?.onclick==='function'"))break;await delay(100);}
   await evaluate("(()=>{const t=document.querySelector('#homeNote');t.value="+JSON.stringify(text)+";t.dispatchEvent(new Event('input'));document.querySelector('#homeInspectSources').click();})()");
   for(let i=0;i<70;i++){if(await evaluate("document.querySelector('#homePrimarySource')?.hidden===false"))break;await delay(100);}
   assert.equal(await evaluate("document.querySelector('#homePrimarySource').hidden"),false);assert.equal(await evaluate("document.querySelector('#homeSourceVideo').value"),selected);
   await evaluate(`document.querySelector('#homeSourceVideo').value=${JSON.stringify(selected)};document.querySelector('#homeSourceVideo').dispatchEvent(new Event('change'));`);
   for(const file of [green,red])await evaluate(`(()=>{const input=[...document.querySelectorAll('#homeAdditionalVideoRows input')].find(i=>i.dataset.extraVideo===${JSON.stringify(file)});input.click();})()`);
   assert.match(await evaluate("document.querySelector('#homeAdditionalVideoOrder').textContent"),/green.*red/);
   await evaluate(`document.querySelector('#homeSourceVideo').value=${JSON.stringify(green)};document.querySelector('#homeSourceVideo').dispatchEvent(new Event('change'));`);
   assert.ok(await evaluate(`(()=>{const inputs=[...document.querySelectorAll('#homeAdditionalVideoRows input')];return inputs.find(i=>i.dataset.extraVideo===${JSON.stringify(green)}).disabled&&!inputs.find(i=>i.dataset.extraVideo===${JSON.stringify(selected)}).disabled;})()`));
   await evaluate(`document.querySelector('#homeSourceVideo').value=${JSON.stringify(selected)};document.querySelector('#homeSourceVideo').dispatchEvent(new Event('change'));`);
   await evaluate(`(()=>{const inputs=[...document.querySelectorAll('#homeAdditionalVideoRows input')];inputs.find(i=>i.dataset.extraVideo===${JSON.stringify(red)}).click();inputs.find(i=>i.dataset.extraVideo===${JSON.stringify(green)}).click();inputs.find(i=>i.dataset.extraVideo===${JSON.stringify(red)}).click();})()`);
   await evaluate("document.querySelector('#homeSourceInfo').click()");
   for(let i=0;i<60;i++){if(await evaluate("document.querySelector('#homeSourceInfoStatus').textContent.includes('giây')"))break;await delay(100);}
   assert.match(await evaluate("document.querySelector('#homeSourceInfoStatus').textContent"),/giây.*×.*âm thanh/);
   await evaluate("document.querySelector('#homeSourcePreview').click()");
   for(let i=0;i<100;i++){if(await evaluate("document.querySelectorAll('#homeSourcePreviewFrames img').length===6"))break;await delay(100);}
   assert.equal(await evaluate("document.querySelectorAll('#homeSourcePreviewFrames img').length"),6);
   for(let i=0;i<30;i++){if(await evaluate("[...document.querySelectorAll('#homeSourcePreviewFrames img')].every(img=>img.complete&&img.naturalWidth>0)"))break;await delay(100);}
   assert.ok(await evaluate("[...document.querySelectorAll('#homeSourcePreviewFrames img')].every(img=>img.complete&&img.naturalWidth>0)"));
   assert.match(await evaluate("document.querySelector('#homeSourcePreviewStatus').textContent"),/6 ảnh lấy mẫu/);
   const bounds=await evaluate("(()=>{const c=document.querySelector('#homeSourceVideo');c.scrollIntoView({block:'center'});const r=c.getBoundingClientRect();return {left:r.left,right:r.right}})()");assert.ok(bounds.left>=0&&bounds.right<=width);
   await evaluate("document.querySelector('#homeCreateFromSources').click()");
   for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('#setupExecution')"))break;await delay(100);}
   assert.equal(await evaluate("document.querySelector('#note').value"),text);
   const projects=(await api('/api/projects')).body.projects;assert.equal(projects.length,evidence.projects.length+1);const latest=projects.find(p=>!evidence.projects.includes(p.dir));evidence.projects.push(latest.dir);
   const request=JSON.parse(fs.readFileSync(path.join(latest.dir,'work/source-request.json')));assert.equal(request.text,text);assert.equal(request.sources.length,2);assert.equal(request.selected,selected);assert.deepEqual(request.additionalVideos,[green,red]);const pj=JSON.parse(fs.readFileSync(path.join(latest.dir,'project.json')));assert.equal(pj.segments.length,3);assert.equal(pj.source.timeline,'segments');assert.ok(pj.segments[1].src!==pj.segments[2].src);
   for(const [index,color] of [[1,'green'],[2,'red']]){const file=path.join(latest.dir,pj.segments[index].src),pixel=[...execFileSync('ffmpeg',['-v','error','-i',file,'-vf','format=rgb24,crop=1:1:100:100','-frames:v','1','-f','rawvideo','pipe:1'],{windowsHide:true})];assert.ok(color==='green'?pixel[1]>90&&pixel[0]<40:pixel[0]>180&&pixel[1]<40);}
   assert.equal(request.survey,'work/source-survey/preview.json');const survey=JSON.parse(fs.readFileSync(path.join(latest.dir,request.survey)));assert.equal(survey.frames.length,6);for(const frame of survey.frames)assert.ok(fs.existsSync(frame.path));
   await send('Page.navigate',{url:'http://127.0.0.1:5180/home?pick='+encodeURIComponent(latest.dir)});
   for(let i=0;i<150;i++){if(await evaluate("document.querySelector('#note')?.value==="+JSON.stringify(text)))break;await delay(100);}
   assert.equal(await evaluate("document.querySelector('#note').value"),text);
   evidence.sizes.push({width,pastedPathsToSetup:true,metadataVisible:true,sixPreviewFramesDecoded:true,projectLocalSurveyPreserved:true,requestRestoredOnReopen:true,requestAndSourceSnapshotPreserved:true,bounds});
  }
  const dir=evidence.projects[0],project=JSON.parse(fs.readFileSync(path.join(dir,'project.json')));
  const renderChild=spawn(process.execPath,['editor/tools/xuat-video.mjs',dir,'--quality','final'],{windowsHide:true,stdio:'ignore'});await new Promise((ok,no)=>{renderChild.on('error',no);renderChild.on('exit',code=>code===0?ok():no(new Error('Render exit '+code)));});
  const render=JSON.parse(fs.readFileSync(path.join(dir,'work/render.json')));assert.equal(render.ok,true);const duration=Number(render.probe.format.duration);assert.ok(Math.abs(duration-project.source.duration)<.12);
  const pixel=t=>[...execFileSync('ffmpeg',['-v','error','-ss',String(t),'-i',path.join(dir,render.output),'-vf','format=rgb24,crop=1:1:100:100','-frames:v','1','-f','rawvideo','pipe:1'],{windowsHide:true})];const greenPixel=pixel(project.segments[1].in+.2),redPixel=pixel(project.segments[2].in+.2);assert.ok(greenPixel[1]>90&&greenPixel[0]<50);assert.ok(redPixel[0]>180&&redPixel[1]<50);evidence.render={duration,greenPixel,redPixel};
  assert.deepEqual(errors,[]);evidence.pageErrors=errors;fs.writeFileSync('docs/HOME_MULTI_AROLL_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);
 }finally{await api('/api/v1/workspaces/active',{id:originalWorkspace});fs.rmSync(sourceRoot,{recursive:true,force:true});}
 await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
