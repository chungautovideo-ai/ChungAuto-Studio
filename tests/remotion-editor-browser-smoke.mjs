import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const proof=JSON.parse(fs.readFileSync('docs/REMOTION_API_SMOKE.json','utf8')),base='http://127.0.0.1:5201';const server=spawn(process.execPath,['editor/server.mjs','--home','--port','5201'],{windowsHide:true,stdio:'ignore'});
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







 const api=async(url,body)=>{const response=await fetch(base+url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const value=await response.json();assert.ok(response.ok,JSON.stringify(value));return value;};
 for(let i=0;i<80;i++){try{await api('/api/ping');break;}catch{await delay(100);}}
 const file=path.join(proof.project,'project.json'),fixtureOriginal=fs.readFileSync(file),working=JSON.parse(fixtureOriginal),activeWorkspace=(await api('/api/v1/workspaces')).activeId;working.workspaceId=activeWorkspace;if(working.contentos)working.contentos.workspaceId=activeWorkspace;fs.writeFileSync(file,JSON.stringify(working));await api('/api/open',{dir:proof.project});const originalProject=fs.readFileSync(file);const results=[];
 const waitFor=async expression=>{for(let i=0;i<450;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Timed out: '+expression+' '+await evaluate("document.querySelector('dialog')?.textContent"));};
 try{for(const width of [1280,1920]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await delay(500);await evaluate("document.querySelector('#btnStudio').click()");
  await waitFor("[...document.querySelectorAll('#tabs button')].some(b=>b.title==='Cảnh trám')");
  await evaluate("[...document.querySelectorAll('#tabs button')].find(b=>b.title==='Cảnh trám').click()");
  await waitFor("[...document.querySelectorAll('#list button')].some(b=>b.textContent.includes('Remotion')&&!b.disabled)");await evaluate("[...document.querySelectorAll('#list button')].find(b=>b.textContent.includes('Remotion')).click()");
  await waitFor("!!document.querySelector('dialog [data-title]')&&!document.querySelector('dialog form button').disabled");
  await evaluate("document.querySelector('dialog [data-title]').value='Cảnh chữ ContentOS';document.querySelector('dialog [data-subtitle]').value='Worker độc lập';document.querySelector('dialog [data-duration]').value='0.6';document.querySelector('dialog form').requestSubmit()");
  await waitFor("!!document.querySelector('dialog [data-add]')&&!document.querySelector('dialog [data-add]').hidden");await waitFor("document.querySelector('dialog [data-preview]').currentTime>0.1");assert.deepEqual(fs.readFileSync(file),originalProject);
  const screenshot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/REMOTION_EDITOR_'+width+'.png',Buffer.from(screenshot.data,'base64'));
  await evaluate("document.querySelector('dialog [data-add]').click()");await delay(300);await evaluate("document.querySelector('#toast').textContent='';document.querySelector('#btnSave').click()");await waitFor("document.querySelector('#toast').textContent.includes('Đã lưu')");
  const saved=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(saved.brolls.at(-1).remotion.composition,'ContentOSTitleCard');assert.equal(saved.brolls.at(-1).dur,0.6);assert.ok(fs.existsSync(path.join(proof.project,saved.brolls.at(-1).src)));
  const first=structuredClone(saved.brolls.at(-1));
  await evaluate("[...document.querySelectorAll('#list button')].find(b=>b.textContent.includes('Sửa nội dung cảnh')).click()");
  await waitFor("!!document.querySelector('dialog [data-title]')&&!document.querySelector('dialog form button').disabled");
  assert.equal(await evaluate("document.querySelector('dialog [data-title]').value"),first.remotion.props.title);
  await evaluate("document.querySelector('dialog [data-title]').value='Cảnh đã sửa ContentOS';document.querySelector('dialog [data-duration]').value='0.8';document.querySelector('dialog [data-accent]').value='#ff8800';document.querySelector('dialog form').requestSubmit()");
  await waitFor("!!document.querySelector('dialog [data-add]')&&!document.querySelector('dialog [data-add]').hidden");
  assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')).brolls.at(-1),first,'preview does not replace saved scene');
  await evaluate("document.querySelector('dialog [data-add]').click()");await delay(200);await evaluate("document.querySelector('#toast').textContent='';document.querySelector('#btnSave').click()");
  await waitFor("document.querySelector('#toast').textContent.includes('Đã lưu')");
  const edited=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(edited.brolls.length,saved.brolls.length);assert.equal(edited.brolls.at(-1).id,first.id);assert.equal(edited.brolls.at(-1).at,first.at);assert.equal(edited.brolls.at(-1).mode,first.mode);assert.equal(edited.brolls.at(-1).dur,0.8);assert.equal(edited.brolls.at(-1).remotion.props.title,'Cảnh đã sửa ContentOS');assert.notEqual(edited.brolls.at(-1).src,first.src);
  await evaluate("document.querySelector('#btnUndo').click()");await delay(250);await evaluate("document.querySelector('#toast').textContent='';document.querySelector('#btnSave').click()");await waitFor("document.querySelector('#toast').textContent.includes('Đã lưu')");
  assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')).brolls.at(-1),first,'Undo restores source, parameters, duration and placement');
  results.push({width,actualEntry:true,actualWorkerCache:true,preview:true,explicitAddAndSave:true,reeditParameters:true,replaceWithoutDuplicate:true,undoReplacement:true});fs.writeFileSync(file,originalProject);
 }}finally{fs.writeFileSync(file,fixtureOriginal);}
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/REMOTION_EDITOR_BROWSER_SMOKE.json',JSON.stringify({results,errors,fixtureProject:proof.project},null,2));console.log({results,errors});await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();server.kill();await delay(500);console.log('Browser fixture retained:',profile);}
