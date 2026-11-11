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



 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'cos-setup-broll-'));
 try{
  const folder=path.join(fixture,'Combo'),nested=path.join(folder,'Nội thất');fs.mkdirSync(nested,{recursive:true});fs.writeFileSync(path.join(nested,'broll.mp4'),'synthetic');
  const {projects}=await (await fetch('http://127.0.0.1:5180/api/projects')).json();const project=projects.find(p=>p.dir.includes('smoke'))||projects[0];assert.ok(project);
  const results=[];
  for(const width of [1280,1920]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'http://127.0.0.1:5180/home?pick='+encodeURIComponent(project.dir)});
   for(let i=0;i<100;i++){if(await evaluate('!!document.querySelector("#setupBrollSources")'))break;await delay(100);}await delay(1000);
   await evaluate('(()=>{const n=document.querySelector("#note");n.value='+JSON.stringify('Dựng quảng cáo\nB-roll: "'+folder+'"')+';n.dispatchEvent(new Event("input",{bubbles:true}));})()');
   let text;for(let i=0;i<100;i++){text=await evaluate('document.querySelector("#setupBrollSources").textContent');if(text.includes('1 media'))break;await delay(100);}
   assert.match(text,/B-roll.*Combo/);assert.match(text,/1 media tìm thấy trong thư mục con/);assert.match(text,/chưa sao chép/);
   await evaluate('document.querySelector("#aiOn").click()');
   for(let i=0;i<100;i++){if(await evaluate('!!document.querySelector("#aiPreviewTool")||!!document.querySelector("#aiAcc")'))break;await delay(100);}
   const preview=await evaluate('!!document.querySelector("#aiPreviewTool")');
   if(preview){await evaluate('document.querySelector("#aiPreviewNote").value="Phong cách điện ảnh";document.querySelector("#aiPreviewNote").dispatchEvent(new Event("input"));');assert.equal(await evaluate('document.querySelector("#aiPreviewNote").value'),'Phong cách điện ảnh');}
   assert.equal(await evaluate('document.querySelector(".setup-options").open'),false);
   await evaluate('document.querySelector("#aiOn").scrollIntoView({block:"center"})');
   const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/SETUP_LAYOUT_'+width+'.png',Buffer.from(shot.data,'base64'));
   results.push({width,text,preview,templateExtrasCollapsed:true});
  }
  assert.deepEqual(errors,[]);fs.writeFileSync('docs/SETUP_LAYOUT_BROWSER_SMOKE.json',JSON.stringify({results,errors,synthetic:true,readOnlyProject:project.dir,noDispatch:true},null,2));console.log({cases:results.length,errors});
 }finally{fs.rmSync(fixture,{recursive:true,force:true});}
 await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
