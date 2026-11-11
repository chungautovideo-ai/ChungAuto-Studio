import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
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
 const workspace=(await api('/api/v1/workspaces',{name:'ContentOS-Smoke-News '+Date.now()})).body;
 assert.equal((await api('/api/v1/news',{workspaceId:'wrong'})).status,409);
 const upload=await fetch(base+'/api/new-project?file=fixture.mp4&name=ContentOS-Smoke-News&noasr=1',{method:'POST',body:fs.readFileSync('tests/fixture.mp4')});const project=await upload.json();assert.ok(upload.ok);
 const evidence={workspaceId:workspace.id,project:project.dir,sizes:[],noAgentDispatched:true};let approvedId,draftId;
 for(const width of [1280,1920]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/home'});
  for(let i=0;i<100;i++){if(await evaluate("typeof document.querySelector('#homeNews')?.onclick==='function'"))break;await delay(100);}
  await evaluate("document.querySelector('#homeNews').click()");
  for(let i=0;i<100;i++){if(await evaluate("document.querySelector('dialog [data-save]')?.disabled===false"))break;await delay(100);}
  await evaluate("(()=>{const d=document.querySelector('dialog');d.querySelector('[data-url]').value='https://example.com/news';const dt=new DataTransfer();dt.items.add(new File(["+JSON.stringify('<!doctype html><html lang="vi"><head><title>Tin thử nghiệm</title></head><body><article><h1>Tin thử nghiệm tổng hợp</h1><p>Sản phẩm minh họa có 20 mẫu được kiểm tra trong tháng này. Đây là nguồn tổng hợp để kiểm tra dẫn chiếu nguồn.</p><p>Người biên tập cần kiểm tra thông tin trước khi duyệt kịch bản. Mọi con số trong ví dụ đều là dữ liệu giả lập phục vụ kiểm tra phần mềm. Bài minh họa không nói về sản phẩm thực tế và không dùng để đăng công khai.</p></article></body></html>')+"],'source.html',{type:'text/html'}));const f=d.querySelector('[data-html]');f.files=dt.files;f.dispatchEvent(new Event('change'));})()");
  for(let i=0;i<100;i++){if(await evaluate("document.querySelector('dialog [data-read-status]').textContent.includes('Đã trích')"))break;await delay(100);}
  assert.match(await evaluate("document.querySelector('dialog [data-read-status]').textContent"),/Đã trích/);assert.ok(await evaluate("document.querySelectorAll('dialog [data-facts] p').length>0"));
  await evaluate("(()=>{const d=document.querySelector('dialog[aria-label=\"Nguồn tin và kịch bản\"]');d.querySelector('[data-title]').value='QA News "+width+"';d.querySelector('[data-script]').value='Kịch bản đã kiểm tra nguồn.';d.querySelector('[data-url]').value='https://example.com/news';d.querySelector('form').requestSubmit();})()");
  for(let i=0;i<100;i++){if(await evaluate("document.querySelector('dialog [data-status]').textContent.includes('Đã lưu v1')"))break;await delay(100);}
  assert.match(await evaluate("document.querySelector('dialog [data-status]').textContent"),/bản nháp/);
  const drafts=(await api('/api/v1/news')).body.entries;draftId=drafts.at(-1).id;
  await evaluate("document.querySelector('dialog [data-approved]').click();document.querySelector('dialog form').requestSubmit()");
  for(let i=0;i<100;i++){if(await evaluate("document.querySelector('dialog [data-status]').textContent.includes('Đã lưu v2')"))break;await delay(100);}
  assert.match(await evaluate("document.querySelector('dialog [data-status]').textContent"),/đã duyệt/);
  approvedId=(await api('/api/v1/news')).body.entries.at(-1).id;
  await evaluate("(()=>{const t=document.querySelector('dialog [data-script]');t.value+=' Sửa mới';t.dispatchEvent(new Event('input',{bubbles:true}));})()");assert.equal(await evaluate("document.querySelector('dialog [data-approved]').checked"),false);
  await evaluate("document.querySelector('dialog [data-close]').click()");
  await send('Page.navigate',{url:base+'/home?pick='+encodeURIComponent(project.dir)});
  for(let i=0;i<100;i++){if(await evaluate("!![...document.querySelectorAll('#setupNews option')].find(o=>o.value==="+JSON.stringify(approvedId)+")"))break;await delay(100);}
  assert.equal(await evaluate("!![...document.querySelectorAll('#setupNews option')].find(o=>o.value==="+JSON.stringify(draftId)+")"),false);
  await evaluate("(()=>{const s=document.querySelector('#setupNews');s.value="+JSON.stringify(approvedId)+";s.dispatchEvent(new Event('change'));})()");assert.match(await evaluate("document.querySelector('#setupNewsText').textContent"),/example.com/);
  await evaluate("document.querySelector('#setupBindNews').click()");
  for(let i=0;i<80;i++){if(await evaluate("document.querySelector('#setupNewsStatus').textContent.includes('Đã lưu bản kịch bản')"))break;await delay(100);}
  assert.match(await evaluate("document.querySelector('#setupNewsStatus').textContent"),/Đã lưu bản kịch bản/);
  await send('Page.reload');
  for(let i=0;i<100;i++){if(await evaluate("document.querySelector('#setupNews')?.value==="+JSON.stringify(approvedId)))break;await delay(100);}
  assert.equal(await evaluate("document.querySelector('#setupNews').value"),approvedId);
  evidence.sizes.push({width,projectBindingRestored:true,createDraft:true,approveNewVersion:true,editingClearsApproval:true,onlyApprovedInSetup:true,scriptAndSourcesVisible:true,htmlFileToCitedSentences:true});
 }
 const template=(await api('/api/installed-templates')).body.items[0].id;
 assert.equal((await api('/api/ai-job',{dir:project.dir,template,completionMode:'review',newsBriefId:draftId})).status,400);
 const queued=await api('/api/ai-job',{dir:project.dir,template,completionMode:'review',execution:{mode:'session',agent:'codex'}});assert.equal(queued.status,200,JSON.stringify(queued.body));assert.equal(queued.body.job.newsBrief.id,approvedId);assert.equal(queued.body.job.newsBrief.verification,'human-review-only');assert.ok(queued.body.job.newsBrief.payload.sources[0].evidence.facts.count>0);evidence.importedArticleFactsRetained=true;
 const inbox=execFileSync(process.execPath,['editor/tools/ai-inbox.mjs','--next','--dir',project.dir,'--agent','codex'],{encoding:'utf8',windowsHide:true});assert.match(inbox,/KỊCH BẢN TIN ĐÃ ĐƯỢC NGƯỜI DÙNG DUYỆT/);assert.ok(inbox.includes(queued.body.job.newsBrief.hash));evidence.inboxContainsApprovedSnapshot=true;
 fs.writeFileSync(path.join(project.dir,'work/ai-job.json'),JSON.stringify({...queued.body.job,status:'cancelled'}));evidence.approvedSnapshotInJob=true;evidence.draftEnqueueRejected=true;
 const context=(await api('/api/v1/news/project?dir='+encodeURIComponent(project.dir))).body;
 assert.equal((await api('/api/v1/news/project',{workspaceId:workspace.id,dir:project.dir,id:'',expectedId:null,revision:context.revision})).status,409);
 assert.equal((await api('/api/v1/news/project',{workspaceId:workspace.id,dir:project.dir,id:'',expectedId:approvedId,revision:'stale'})).status,409);
 const current=(await api('/api/project')).body;
 const reviseResponse=await fetch(base+'/api/ai-revise',{method:'POST',headers:{'Content-Type':'application/json','X-ContentOS-Project':project.dir,'X-ContentOS-Revision':current.revision},body:JSON.stringify({instruction:'QA preserve approved script',execution:{mode:'session',agent:'codex'},completionMode:'review'})}),revised=await reviseResponse.json();assert.equal(reviseResponse.status,200,JSON.stringify(revised));assert.equal(revised.job.newsBrief.id,approvedId);
 const reviseInbox=execFileSync(process.execPath,['editor/tools/ai-inbox.mjs','--next','--dir',revised.job.dir,'--agent','codex'],{encoding:'utf8',windowsHide:true});assert.match(reviseInbox,/KỊCH BẢN TIN ĐÃ DUYỆT CỦA LƯỢT SỬA/);
 await send('Page.navigate',{url:base+'/'});await delay(1000);await evaluate("document.querySelector('#btnSpace').click()");
 for(let i=0;i<80;i++){if(await evaluate("document.querySelector('.cos-news-context pre')?.textContent.includes('example.com')"))break;await delay(100);}
 assert.match(await evaluate("document.querySelector('.cos-news-context pre').textContent"),/example.com/);
 assert.equal((await api('/api/v1/news/project',{workspaceId:workspace.id,dir:project.dir,id:'',expectedId:approvedId,revision:current.revision})).status,200);
 assert.equal(JSON.parse(fs.readFileSync(path.join(revised.job.dir,'work/ai-job.json'))).newsBrief.id,approvedId);
 fs.writeFileSync(path.join(revised.job.dir,'work/ai-job.json'),JSON.stringify({...revised.job,status:'cancelled'}));
 evidence.projectBindingDefaultFirstBuild=true;evidence.bindingRevisionAndConflictGuards=true;evidence.reviseSnapshotAndInbox=true;evidence.spaceShowsScript=true;evidence.unbindDoesNotMutateQueuedJob=true;

 assert.deepEqual(errors,[]);evidence.pageErrors=errors;fs.writeFileSync('docs/NEWS_BRIEF_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{if(previousWorkspace)await fetch('http://127.0.0.1:5180/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:previousWorkspace})});ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
