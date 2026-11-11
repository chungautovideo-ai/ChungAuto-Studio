import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-layout-'));
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--no-first-run','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let ws;const base="http://127.0.0.1:5199",server=spawn(process.execPath,["editor/server.mjs","--home","--port","5199"],{windowsHide:true,stdio:"ignore"});let originalWorkspace;
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
 await call('/api/v1/workspaces',{name:'Face source QA '+Date.now()});

 const sample=path.resolve('workspace/cache/face-q2-sample.mp4');
 const up=await fetch(base+'/api/new-project?file=q2.mp4&name=ContentOS-Smoke-TemplateRevision&noasr=1',{method:'POST',body:fs.readFileSync(sample)}),created=await up.json();assert.ok(up.ok);const dir=path.resolve(created.dir),file=path.join(dir,'project.json'),project=JSON.parse(fs.readFileSync(file));
 project.template={id:'chungauto-factory-quang-cao-v50',name:'Creative v24',version:24};project.audio={music:'inputs/private.mp3',musicVolume:.04,duckLevel:.3,sfxLevel:'tat'};project.blocks=[];fs.writeFileSync(file,JSON.stringify(project));const before=fs.readFileSync(file);
 const parentFile='editor/templates/chungauto-factory-quang-cao-v50/template.json',parentBefore=fs.readFileSync(parentFile);
 const waitFor=async expr=>{for(let i=0;i<200;i++){if(await evaluate(expr))return;await delay(100);}throw Error('Timeout '+expr+' '+await evaluate('document.body.innerText.slice(-1000)'));};
 await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await delay(800);
 await evaluate("document.querySelector('#btnStudio').click();document.querySelector('#btnLibrary').click()");await waitFor("!![...document.querySelectorAll('#library button')].find(b=>b.textContent.includes('Lưu kiểu video'))");
 await evaluate("[...document.querySelectorAll('#library button')].find(b=>b.textContent.includes('Lưu kiểu video')).click()");await waitFor("!!document.querySelector('.lib-save')");
 assert.equal(await evaluate("document.querySelector('select[aria-label=\"Cách lưu mẫu\"]').value"),'revision');
 await evaluate("var mode=document.querySelector('select[aria-label=\"Cách lưu mẫu\"]');mode.value='new';mode.dispatchEvent(new Event('change',{bubbles:true}));");assert.ok(await evaluate("document.querySelector('[data-template-save-scope]').textContent.includes('Không tự sao chép')"));
 await evaluate("mode.value='revision';mode.dispatchEvent(new Event('change',{bubbles:true}));");assert.ok(await evaluate("document.querySelector('[data-template-save-scope]').textContent.includes('Giữ các preset')"));
 const name='QA quieter revision '+Date.now();await evaluate(`document.querySelector('.lib-save input[placeholder^="Tên mẫu"]').value=${JSON.stringify(name)}`);
 for(const width of [1280,390]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await delay(200);if(width===390){const rects=await evaluate("[...document.querySelector('.lib-save>.row').children].map(n=>({top:n.getBoundingClientRect().top,width:n.getBoundingClientRect().width}))");assert.ok(rects[1].top>rects[0].top+20);assert.ok(rects[0].width>200);}const c=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/TEMPLATE_REVISION_FORM_'+width+'.png',Buffer.from(c.data,'base64'));}
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});await evaluate("document.querySelector('.lib-save button.primary').click()");await waitFor("document.querySelector('#toast').textContent.includes('Đã lưu mẫu')");
 const catalog=await call('/api/library'),saved=catalog.find(t=>t.name===name);assert.ok(saved);const template=JSON.parse(fs.readFileSync(path.join('editor/templates',saved.id,'template.json')));
 assert.equal(template.presets.length,11);assert.equal(template.audio.musicVolume,.04);assert.equal(template.audio.music,undefined);assert.deepEqual(fs.readFileSync(parentFile),parentBefore);assert.deepEqual(fs.readFileSync(file),before,'saving revision must not edit active project');
 const rules=fs.readFileSync(path.join('editor/templates',saved.id,'SKILL.md'),'utf8');assert.match(rules,/Creative v24/);
 await evaluate(`var card=[...document.querySelectorAll('.lib-card')].find(c=>c.textContent.includes(${JSON.stringify(name)}));card.querySelector('button.primary').click()`);await delay(2000);
 await evaluate("document.querySelector('#btnSave').click()");await waitFor("document.querySelector('#toast').textContent.includes('Đã lưu')");assert.equal(JSON.parse(fs.readFileSync(file)).template.id,saved.id);
 const headers={'X-ContentOS-Project':created.dir,'X-ContentOS-Revision':(await call('/api/project')).revision};const r=await fetch(base+'/api/presets',{headers});const presets=await r.json();assert.equal(presets.items.length,11);
 await send('Page.navigate',{url:base+'/'});await waitFor("!!document.querySelector('#btnStudio')");await delay(500);assert.equal(JSON.parse(fs.readFileSync(file)).template.id,saved.id);assert.equal(JSON.parse(fs.readFileSync(file)).audio.musicVolume,.04);
 assert.deepEqual(errors,[]);const proof={project:created.dir,template:saved.id,presets:11,parentUnchanged:true,projectUnchangedUntilApply:true,defaultRevision:true,scopeHintChanges:true,audioMixSaved:.04,privateMusicNotCopied:true,parentRulesRetained:true,applySaveReopen:true,presetEndpointItems:presets.items.length,errors};fs.writeFileSync('docs/TEMPLATE_REVISION_PRESETS_BROWSER_SMOKE.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
}finally{if(originalWorkspace)await fetch(base+'/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:originalWorkspace})}).catch(()=>{});ws?.close();chrome.kill();server.kill();}
