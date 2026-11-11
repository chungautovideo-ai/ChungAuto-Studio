import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-layout-'));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--no-first-run','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let ws;const base="http://127.0.0.1:5197",server=spawn(process.execPath,["editor/server.mjs","--home","--port","5197"],{windowsHide:true,stdio:"ignore"});let originalWorkspace;
try{
 let port;for(let i=0;i<100;i++){try{port=Number(fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]);break;}catch{await delay(100);}}
 assert.ok(port,'Chrome CDP started');
 const pages=await (await fetch(`http://127.0.0.1:${port}/json`)).json();
 ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;});
 let id=0;const pending=new Map(),errors=[];
 ws.onmessage=event=>{const msg=JSON.parse(event.data);if(msg.id){const p=pending.get(msg.id);if(p){pending.delete(msg.id);msg.error?p.reject(new Error(JSON.stringify(msg.error))):p.resolve(msg.result);}}else if(msg.method==='Runtime.exceptionThrown')(errors.push(msg.params.exceptionDetails.text+': '+(msg.params.exceptionDetails.exception?.description||'')),console.error(errors.at(-1)));};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const requestId=++id;pending.set(requestId,{resolve,reject});ws.send(JSON.stringify({id:requestId,method,params}));setTimeout(()=>{if(pending.delete(requestId))reject(new Error('CDP timeout '+method));},10000).unref();});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});




 const call=async(url,body)=>{const r=await fetch(base+url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const data=await r.json();assert.ok(r.ok,JSON.stringify(data));return data;};
 for(let i=0;i<80;i++){try{await call('/api/ping');break;}catch{await delay(100);}}
 originalWorkspace=(await call('/api/v1/workspaces')).activeId;
 await call('/api/v1/workspaces',{name:'Plate privacy QA '+Date.now()});
 const fixture=path.resolve('workspace/cache/primary-plate-browser-source.mp4');fs.mkdirSync(path.dirname(fixture),{recursive:true});
 execFileSync('python',['-c',`import cv2,numpy as np,sys
out=cv2.VideoWriter(sys.argv[1],cv2.VideoWriter_fourcc(*'mp4v'),30,(320,180))
rng=np.random.default_rng(42);patch=rng.integers(80,255,(40,80,3),dtype=np.uint8)
cv2.putText(patch,'51F-123',(2,25),cv2.FONT_HERSHEY_SIMPLEX,.4,(0,0,0),1)
for i in range(90):
 f=np.full((180,320,3),60,np.uint8);f[70:110,40+i:120+i]=patch;f[125:165,220-i:300-i]=patch;out.write(f)
out.release()`.replaceAll('\n+','\n').replaceAll('\n','\n'),fixture],{windowsHide:true});
 execFileSync('ffmpeg',['-nostdin','-v','error','-y','-i',fixture,'-f','lavfi','-i','sine=frequency=440:duration=3','-shortest','-c:a','aac','-c:v','libx264','-pix_fmt','yuv420p',fixture+'.h264.mp4'],{windowsHide:true});fs.copyFileSync(fixture+'.h264.mp4',fixture);
 const up=await fetch(base+'/api/new-project?file=source.mp4&name=ContentOS-Smoke-QuadPlatePrivacy&noasr=1',{method:'POST',body:fs.readFileSync(fixture)});const created=await up.json();assert.ok(up.ok);
 const context=await call('/api/project');context.project.brolls=[];context.project.segments=[{id:'primary-test',in:.4,out:1.4,speed:2,keep:true,text:'Primary source',color:{saturation:.1}}];context.project.captions={...(context.project.captions||{}),enabled:false};
 const update=await fetch(base+'/api/project',{method:'PUT',headers:{'Content-Type':'application/json','X-ContentOS-Project':created.dir,'X-ContentOS-Revision':context.revision},body:JSON.stringify(context.project)});assert.ok(update.ok,await update.text());
 const file=path.join(created.dir,'project.json'),original=fs.readFileSync(file),results=[];
 const waitFor=async expression=>{for(let i=0;i<180;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Timeout '+expression+' '+await evaluate("document.body.innerText.slice(-6000)"));};
 const save=async()=>{await evaluate("document.querySelector('#toast').textContent='';document.querySelector('#btnSave').click()");await waitFor("document.querySelector('#toast').textContent.includes('Đã lưu')");};
 for(const width of [1280,1920,390]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?900:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await delay(800);await evaluate("document.querySelector('#btnStudio').click()");await waitFor("[...document.querySelectorAll('#tabs button')].some(b=>b.title==='Văn bản')");await evaluate("[...document.querySelectorAll('#tabs button')].find(b=>b.title==='Văn bản').click();[...document.querySelectorAll('#submenu button')].find(b=>b.textContent.includes('Cắt')).click()");
  await waitFor("!!document.querySelector('#list .seg')");await evaluate("document.querySelector('#list .seg').click()");await waitFor("!!document.querySelector('[data-primary-plate-privacy]')");await evaluate("document.querySelector('[data-primary-plate-privacy]').click()");await waitFor("!!document.querySelector('dialog')");await waitFor("!!document.querySelector('dialog [data-create]')&&!document.querySelector('dialog [data-create]').disabled");
  await evaluate(`(()=>{const values=[${52/320},${70/180},${80/320},${40/180}];[...document.querySelectorAll('dialog [data-fields] input')].forEach((el,i)=>{el.value=values[i];el.dispatchEvent(new Event('input'));});document.querySelector('[data-add-plate-region]').click();const second=[208/320,125/180,80/320,40/180];[...document.querySelectorAll('dialog [data-fields] input')].forEach((el,i)=>{el.value=second[i];el.dispatchEvent(new Event('input'));});document.querySelector('[data-add-plate-region]').click();document.querySelector('[data-remove-plate-region]').click();if(document.querySelector('select[aria-label="Vùng biển đang chọn"]').options.length!==2)throw Error('region add/remove');document.querySelector('dialog details').open=true;const corner=document.querySelector('input[aria-label="Góc 1 Y"]');corner.value=74/180;corner.dispatchEvent(new Event('input'));document.querySelector('dialog [data-create]').click();})()`);
  await waitFor("!document.querySelector('dialog [data-apply]').hidden");await waitFor("document.querySelector('dialog [data-result]').readyState>=2");assert.deepEqual(fs.readFileSync(file),original,'preview does not save or replace');
  assert.equal(await evaluate(`(()=>{const dialog=document.querySelector('dialog'),r=dialog.getBoundingClientRect();return r.left>=0&&r.right<=window.innerWidth&&dialog.scrollWidth<=dialog.clientWidth+1;})()`),true);
  const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/PLATE_QUAD_'+width+'.png',Buffer.from(shot.data,'base64'));
  await evaluate("document.querySelector('dialog [data-apply]').click()");await delay(200);await save();
  const replaced=JSON.parse(fs.readFileSync(file));assert.equal(replaced.segments[0].platePrivacy.quads.length,2);assert.equal(replaced.segments[0].platePrivacy.quads[0][0][1],74/180);assert.match(replaced.segments[0].src,/^inputs\/privacy\//);assert.equal(replaced.segments[0].mediaStart,0);assert.equal(replaced.segments[0].color.saturation,.1);assert.equal(replaced.segments[0].platePrivacy.requiresVisualReview,true);
  await evaluate("document.querySelector('[data-review-plate]').click()");await waitFor("!!document.querySelector('dialog [data-confirm]')&&document.querySelector('dialog video')?.readyState>=2");
  assert.equal(await evaluate("document.querySelector('dialog [data-save]').disabled"),true);
  await evaluate("document.querySelector('dialog [data-confirm]').click();document.querySelector('dialog [data-save]').click()");await waitFor("document.querySelector('dialog [data-status]').textContent.includes('Đã lưu xác nhận')");
  const receipt=JSON.parse(fs.readFileSync(path.join(created.dir,'work/plate-review.json')));assert.equal(receipt.method,'user-declared-visual-review');assert.equal(receipt.media.length,1);
  const reviewImage=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/PLATE_QUAD_REVIEW_'+width+'.png',Buffer.from(reviewImage.data,'base64'));
  await evaluate("document.querySelector('dialog [data-close]').click()");
  await evaluate("document.querySelector('#btnUndo').click()");await delay(200);await save();assert.deepEqual(JSON.parse(fs.readFileSync(file)).segments,context.project.segments);
  // Reopen the saved replacement and restore its source using the actual inspector.
  fs.writeFileSync(file,JSON.stringify(replaced,null,2)+'\n');await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await delay(600);await evaluate("document.querySelector('#btnStudio').click();[...document.querySelectorAll('#tabs button')].find(b=>b.title==='Văn bản').click();[...document.querySelectorAll('#submenu button')].find(b=>b.textContent.includes('Cắt')).click();document.querySelector('#list .seg').click()");await waitFor("!!document.querySelector('[data-restore-primary-privacy]')");await evaluate("document.querySelector('[data-restore-primary-privacy]').click()");await delay(200);await save();assert.deepEqual(JSON.parse(fs.readFileSync(file)).segments,context.project.segments);
  results.push({width,actualHttpTracking:true,sourceFrame:true,resultPreview:true,explicitReplacement:true,saveAndUndo:true,reviewReceipt:true,primaryClock:true,speed:2});
  // Keep first verified derived media for final render without another tracker run.
  if(width===1280)fs.writeFileSync(path.join(created.dir,'work/qa-primary-replaced.json'),JSON.stringify(replaced));
  fs.writeFileSync(file,original);
 }
 assert.deepEqual(errors,[]);
 const evidence={project:created.dir,syntheticMovingPlate:true,results,pageErrors:errors,noProviderCalls:true};fs.writeFileSync('docs/PLATE_QUAD_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{if(originalWorkspace)await fetch(base+'/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:originalWorkspace})}).catch(()=>{});ws?.close();chrome.kill();server.kill();}
