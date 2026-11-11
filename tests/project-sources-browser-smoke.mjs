import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
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
 const originalWorkspace=(await api('/api/v1/workspaces')).body.activeId;
 const sourceRoot=fs.mkdtempSync(path.join(os.tmpdir(),'cos-nas-browser-'));fs.copyFileSync('tests/fixture.mp4',path.join(sourceRoot,'video có dấu.mp4'));fs.writeFileSync(path.join(sourceRoot,'bad.mp4'),'invalid');fs.copyFileSync('tests/fixture.mp4',path.join(sourceRoot,'extra.mp4'));fs.appendFileSync(path.join(sourceRoot,'extra.mp4'),Buffer.from('distinct'));fs.mkdirSync(path.join(sourceRoot,'sub'));fs.copyFileSync('tests/fixture.mp4',path.join(sourceRoot,'sub','other.mp4'));fs.appendFileSync(path.join(sourceRoot,'sub','other.mp4'),Buffer.from('other'));
 try{
  const workspace=(await api('/api/v1/workspaces',{name:'ContentOS-Smoke-NAS '+Date.now(),brand:'QA NAS'})).body;
  await api('/api/v1/workspaces/'+workspace.id,{nasRoot:sourceRoot},'PATCH');
  assert.equal((await api('/api/v1/storage/new-project',{relative:'video có dấu.mp4',workspaceId:'wrong'})).status,409);
  assert.ok((await api('/api/v1/storage/new-project',{relative:'../outside.mp4',workspaceId:workspace.id})).status>=400);
  assert.ok((await api('/api/v1/storage/new-project',{relative:'bad.mp4',workspaceId:workspace.id})).status>=400);
  const before=(await api('/api/projects')).body.projects.length;assert.equal(before,0);
  const evidence={syntheticLocalShare:true,staleWorkspaceRejected:true,pathEscapeRejected:true,invalidVideoRejected:true,projects:[],sizes:[]};
  for(const width of [1280,1920]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});
   await send('Page.navigate',{url:'http://127.0.0.1:5180/home'});
   for(let i=0;i<100;i++){if(await evaluate("typeof document.querySelector('#homeIntake')?.onclick==='function'"))break;await delay(100);}
   await evaluate("document.querySelector('#homeIntake').click()");
   for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('#sourceRows button[data-path=\"video có dấu.mp4\"]')"))break;await delay(100);}
   assert.equal(await evaluate("document.querySelector('#sourceProject').value"),'__new__');
   await evaluate("document.querySelector('#sourceRows button[data-path=\"video có dấu.mp4\"]').click()");
   for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('#setupExecution')&&!document.querySelector('#contentosIntake')"))break;await delay(100);}
   assert.ok(await evaluate("!!document.querySelector('#setupExecution')&&!document.querySelector('#contentosIntake')"));
   assert.match(await evaluate("document.querySelector('#vSetup').textContent"),/Thiết lập trước khi AI edit/);
   const projects=(await api('/api/projects')).body.projects;assert.equal(projects.length,evidence.projects.length+1);const latest=projects.find(p=>!evidence.projects.includes(p.dir));assert.ok(latest);evidence.projects.push(latest.dir);
   const p=JSON.parse(fs.readFileSync(path.join(latest.dir,'project.json')));assert.equal(p.workspaceId,workspace.id);assert.ok(p.source.duration>0);assert.ok(fs.existsSync(path.join(latest.dir,'index.html')));
   const manifest=JSON.parse(fs.readFileSync(path.join(latest.dir,'work/source-assets.json')));assert.equal(manifest.assets[0].source.role,'aroll');assert.equal(manifest.assets[0].sha256.length,64);

   await evaluate("document.querySelector('#setupIntake').click()");
   for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('#sourceRows input[data-select]')"))break;await delay(50);}

   await evaluate(`document.querySelector('#sourceRows button[data-annotations="extra.mp4"]').click()`);
   for(let i=0;i<100;i++){if(await evaluate(`!!document.querySelector('form[aria-label="Nhãn và quyền dùng tư liệu"]')`))break;await delay(50);}
   await evaluate(`(()=>{document.querySelector('[aria-label="Nhãn (phân cách bằng dấu phẩy)"]').value='demo, sản phẩm';document.querySelector('[aria-label="Ghi chú tư liệu"]').value='QA local';document.querySelector('[aria-label="Căn cứ quyền sử dụng"]').value='Synthetic fixture';document.querySelector('[aria-label="Quyền sử dụng tư liệu"]').value='owned';document.querySelector('form[aria-label="Nhãn và quyền dùng tư liệu"]').requestSubmit();})()`);
   for(let i=0;i<100;i++){if(await evaluate("document.querySelector('#sourceAnnotations [role=status]').textContent.includes('Đã lưu')"))break;await delay(50);}
   assert.match(await evaluate("document.querySelector('#sourceAnnotations [role=status]').textContent"),/Đã lưu/);
   await evaluate(`document.querySelector('input[data-select="extra.mp4"]').click();document.querySelector('#sourceRows button[data-path="sub"]').click()`);
   for(let i=0;i<100;i++){if(await evaluate(`!!document.querySelector('input[data-select="sub/other.mp4"]')`))break;await delay(50);}
   await evaluate(`document.querySelector('input[data-select="sub/other.mp4"]').click();document.querySelector('#sourceBatch').click()`);
   for(let i=0;i<100;i++){if(await evaluate("document.querySelectorAll('#sourceBatchResults li').length===2&&document.querySelector('#sourceBatchStop').hidden"))break;await delay(100);}
   assert.equal(await evaluate("document.querySelectorAll('#sourceBatchResults li').length"),2);
   assert.equal(await evaluate("[...document.querySelectorAll('#sourceBatchResults li')].every(e=>e.textContent.includes('Đã nhập'))"),true);
   const imported=JSON.parse(fs.readFileSync(path.join(latest.dir,'work/source-assets.json')));assert.equal(imported.assets.length,3);
   for(const a of imported.assets)assert.ok(fs.existsSync(path.join(latest.dir,a.path)));const labelled=imported.assets.find(a=>a.name==='extra.mp4');assert.equal(labelled.annotations.rights,'owned');assert.deepEqual(labelled.annotations.tags,['demo','sản phẩm']);
   assert.match(await evaluate("document.querySelector('#sourceBatch').textContent"),/\(0\)/);

   await evaluate("document.querySelector('#sourceImported').click()");
   for(let i=0;i<100;i++){if(await evaluate("document.querySelectorAll('#sourceImportedList article').length===3"))break;await delay(50);}
   assert.equal(await evaluate("document.querySelectorAll('#sourceImportedList article').length"),3);
   const importedText=await evaluate("document.querySelector('#sourceImportedList').textContent");assert.match(importedText,/Tự sở hữu/);assert.match(importedText,/sản phẩm/);assert.match(importedText,/SHA256 khi nhập/);assert.match(importedText,/khớp dung lượng/);
   await evaluate("document.querySelector('#contentosIntake [data-close]').click()");
   evidence.sizes.push({width,newProjectToSetup:true,importedSourceHistory:true,retainedRightsVisible:true,sourceAnnotationSaved:true,importedRightsSnapshot:true,multiFolderSelection:true,twoRealImports:true,perFileResults:true,selectionClearedAfterSuccess:true});

  }
  assert.deepEqual(fs.readFileSync(path.join(sourceRoot,'video có dấu.mp4')),fs.readFileSync('tests/fixture.mp4'));
  assert.deepEqual(errors,[]);evidence.pageErrors=errors;evidence.originalSourceUnchanged=true;
  fs.writeFileSync('docs/PROJECT_SOURCES_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);
 }finally{await api('/api/v1/workspaces/active',{id:originalWorkspace});fs.rmSync(sourceRoot,{recursive:true,force:true});}
 await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
