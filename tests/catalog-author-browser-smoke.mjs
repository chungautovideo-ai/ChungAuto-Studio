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
 const workspace=(await api('/api/v1/workspaces',{name:'ContentOS-Smoke-CatalogAuthor '+Date.now()})).body;
 assert.equal((await api('/api/v1/catalogs/local',{workspaceId:'wrong',kind:'prompt',name:'bad',content:'bad'})).status,409);
 const upload=await fetch(base+'/api/new-project?file=fixture.mp4&name=ContentOS-Smoke-CatalogAuthor&noasr=1',{method:'POST',body:fs.readFileSync('tests/fixture.mp4')});const project=await upload.json();assert.ok(upload.ok);
 const evidence={workspaceId:workspace.id,project:project.dir,sizes:[],noAgentDispatched:true};
 for(const width of [1280,1920]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/home'});
  for(let i=0;i<100;i++){if(await evaluate("typeof document.querySelector('#navSourceLibrary')?.onclick==='function'"))break;await delay(100);}
  await evaluate("document.querySelector('#navSourceLibrary').click()");
  for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('#cosCatalogForm')"))break;await delay(100);}
  const name='QA prompt '+width;
  await evaluate("(()=>{document.querySelector('#cosCatalogEditor').open=true;document.querySelector('#cosCatalogName').value="+JSON.stringify(name)+";document.querySelector('#cosCatalogContent').value='Original reference <script>never executed</script>';document.querySelector('#cosCatalogForm').requestSubmit();})()");
  for(let i=0;i<100;i++){if(await evaluate("document.querySelector('#cosCatalogSaveStatus').textContent.includes('Đã lưu')"))break;await delay(100);}
  assert.match(await evaluate("document.querySelector('#cosCatalogSaveStatus').textContent"),/Đã lưu phiên bản 1/);
  let entries=(await api('/api/v1/catalogs/local')).body.entries;const original=entries.find(e=>e.name===name);assert.ok(original);
  assert.equal((await api('/api/v1/catalogs/local',{workspaceId:workspace.id,kind:'prompt',name:'Empty',content:''})).status,400);
  await evaluate("(()=>{document.querySelector('#cosCatalogContent').value='Updated reference';document.querySelector('#cosCatalogForm').requestSubmit();})()");
  for(let i=0;i<100;i++){if(await evaluate("document.querySelector('#cosCatalogSaveStatus').textContent.includes('phiên bản 2')"))break;await delay(100);}
  assert.match(await evaluate("document.querySelector('#cosCatalogSaveStatus').textContent"),/phiên bản 2/);
  entries=(await api('/api/v1/catalogs/local')).body.entries;const updated=entries.find(e=>e.parentId===original.id);assert.equal(updated.version,2);assert.equal(entries.find(e=>e.id===original.id).payload.content,original.payload.content);
  const stale=await api('/api/v1/catalogs/local',{workspaceId:workspace.id,kind:'prompt',name:'Stale',content:'stale',parentId:original.id});assert.equal(stale.status,409);
  await evaluate("document.querySelector('#cosCatalogReset').click();document.querySelector('#cosCatalogKind').value='style';document.querySelector('#cosCatalogKind').dispatchEvent(new Event('change'));document.querySelector('#cosCatalogName').value='QA Style "+width+"';document.querySelector('#cosCatalogArt').value='Clean product visuals';document.querySelector('#cosCatalogPalette').value='Black and amber';document.querySelector('#cosCatalogForm').requestSubmit()");
  for(let i=0;i<100;i++){if(await evaluate("document.querySelector('#cosCatalogSaveStatus').textContent.includes('Đã lưu')"))break;await delay(100);}
  assert.match(await evaluate("document.querySelector('#cosCatalogSaveStatus').textContent"),/Đã lưu phiên bản 1/);
  await send('Page.navigate',{url:base+'/home?pick='+encodeURIComponent(project.dir)});
  for(let i=0;i<120;i++){if(await evaluate("!![...document.querySelectorAll('#setupCreativePrompt option')].find(o=>o.value==="+JSON.stringify(updated.id)+")"))break;await delay(100);}
  assert.ok(await evaluate("!![...document.querySelectorAll('#setupCreativePrompt option')].find(o=>o.value==="+JSON.stringify(updated.id)+")"));
  evidence.sizes.push({width,createPrompt:true,createVersion:true,preserveOld:true,createStyle:true,availableInSetup:true,staleRejected:true});
 }
 const custom=(await api('/api/v1/catalogs/local')).body.entries,chosenPrompt=custom.find(e=>e.kind==='prompt'&&e.version===2),chosenStyle=custom.find(e=>e.kind==='style');
 const template=(await api('/api/installed-templates')).body.items[0].id;
 const queued=await api('/api/ai-job',{dir:project.dir,template,completionMode:'review',execution:{mode:'session',agent:'codex'},creativeBrief:{styleId:chosenStyle.id,promptId:chosenPrompt.id}});assert.equal(queued.status,200,JSON.stringify(queued.body));assert.equal(queued.body.job.creativeBrief.entries[1].payload.content,'Updated reference');assert.equal(queued.body.job.creativeBrief.entries[0].source.app,'contentos');
 fs.writeFileSync(path.join(project.dir,'work/ai-job.json'),JSON.stringify({...queued.body.job,status:'cancelled'}));evidence.customVersionAttachedToJob=true;
 assert.deepEqual(errors,[]);evidence.pageErrors=errors;fs.writeFileSync('docs/CATALOG_AUTHOR_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{if(previousWorkspace)await fetch('http://127.0.0.1:5180/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:previousWorkspace})});ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
