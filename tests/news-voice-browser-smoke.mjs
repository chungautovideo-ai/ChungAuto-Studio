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


 const base='http://127.0.0.1:5180',proof=JSON.parse(fs.readFileSync('docs/NEWS_BRIEF_BROWSER_SMOKE.json','utf8'));
 previousWorkspace=(await (await fetch(base+'/api/v1/workspaces')).json()).activeId;
 await fetch(base+'/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:proof.workspaceId})});
 const stories=(await (await fetch(base+'/api/v1/news')).json()).entries,approved=stories.find(e=>e.status==='approved');assert.ok(approved);
 const evidence={workspaceId:proof.workspaceId,sizes:[],browserProviderMockOnly:true,noPaidCalls:true};
 for(const width of [1280,1920]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:width===1280?720:1080,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/home'});
  for(let i=0;i<100;i++){if(await evaluate("typeof document.querySelector('#homeNews')?.onclick==='function'"))break;await delay(100);}
  await evaluate("document.querySelector('#homeNews').click()");
  for(let i=0;i<100;i++){if(await evaluate("document.querySelector('dialog [data-save]')?.disabled===false"))break;await delay(100);}
  await evaluate("(()=>{const select=document.querySelector('dialog [data-saved]');select.value="+JSON.stringify(approved.id)+";select.dispatchEvent(new Event('change'));})()");
  await evaluate(`(()=>{const original=window.fetch;window.fetch=(url,options)=>{if(url==='/api/giong')return Promise.resolve(new Response(JSON.stringify({ok:true,allowed:true,workspaceId:${JSON.stringify(proof.workspaceId)},ketNoi:{elevenlabs:'fixture'},kq:[{id:'333333333333',ncc:'elevenlabs',text:'QA matching narration',narration:{scriptId:${JSON.stringify(approved.id)},scriptHash:${JSON.stringify(approved.hash)}}},{id:'444444444444',ncc:'elevenlabs',text:'QA unrelated'}]})));if(url==='/api/giong/new-project'){window.__narrationRequest=JSON.parse(options.body);return Promise.resolve(new Response(JSON.stringify({ok:true,dir:'workspace/content/qa/fixture'})));}if(String(url).startsWith('/api/giong/voices'))return Promise.resolve(new Response(JSON.stringify({ok:true,giong:[{ma:'fixture',ten:'Fixture'}]})));if(url==='/api/giong/tao'){window.__voiceRequest=JSON.parse(options.body);return Promise.resolve(new Response(JSON.stringify({ok:false,error:'QA intercepted; no provider'}),{status:400}));}return original(url,options);};document.querySelector('dialog [data-voice]').click();})()`);
  for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('#gText')"))break;await delay(100);}
  assert.equal(await evaluate("document.querySelector('#gText').value"),approved.payload.script);
  assert.equal(await evaluate('window.__voiceRequest'),undefined);
  assert.equal(await evaluate('window.__narrationRequest'),undefined);
  assert.equal(await evaluate("[...document.querySelectorAll('dialog[aria-label=\"Giọng nói AI\"] button')].filter(b=>b.textContent==='Tạo dự án từ voice này'&&b.disabled).length"),1);
  await evaluate("(()=>{document.querySelector('select[aria-label=\"Tỷ lệ dự án từ voice\"]').value='16:9';[...document.querySelectorAll('dialog button')].find(b=>b.textContent==='Tạo dự án từ voice này'&&!b.disabled).click();})()");
  for(let i=0;i<50;i++){if(await evaluate('!!window.__narrationRequest'))break;await delay(100);}
  assert.deepEqual(await evaluate('window.__narrationRequest'),{workspaceId:proof.workspaceId,newsBriefId:approved.id,voiceId:'333333333333',format:'16:9'});
  assert.equal(await evaluate("[...document.querySelectorAll('dialog button')].some(b=>b.textContent==='Mở dự án trong Studio')"),true);

  assert.match(await evaluate("document.querySelector('[data-news-voice]').textContent"),/đã duyệt/);
  await evaluate("window.__toast=()=>{};document.querySelector('#gTao').click()");
  for(let i=0;i<50;i++){if(await evaluate('!!window.__voiceRequest'))break;await delay(100);}
  const captured=await evaluate('window.__voiceRequest');assert.equal(captured.newsBriefId,approved.id);assert.equal(captured.newsBriefHash,approved.hash);assert.equal(captured.text,approved.payload.script);
  await delay(200);await evaluate("(()=>{const t=document.querySelector('#gText');t.value+=' Lời mới';t.dispatchEvent(new Event('input'));})()");assert.match(await evaluate("document.querySelector('[data-news-voice]').textContent"),/đã sửa/);
  await evaluate("window.__voiceRequest=null;document.querySelector('#gTao').click()");
  for(let i=0;i<50;i++){if(await evaluate('!!window.__voiceRequest'))break;await delay(100);}
  assert.equal((await evaluate('window.__voiceRequest')).newsBriefId,undefined);
  await evaluate("[...document.querySelectorAll('dialog[aria-label=\"Giọng nói AI\"] button')].find(b=>b.textContent==='Đóng giọng nói AI').click()");
  evidence.sizes.push({width,exactScriptPrefill:true,noAutomaticGeneration:true,approvedProvenancePayload:true,editedTextDropsApprovedReference:true,narrationProjectPayload:true,unrelatedProjectVoiceDisabled:true});
 }
 const context=await (await fetch(base+'/api/v1/news/project?dir='+encodeURIComponent(proof.project))).json();
 const binding=await fetch(base+'/api/v1/news/project',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspaceId:proof.workspaceId,dir:proof.project,id:approved.id,expectedId:context.brief?.id||null,revision:context.revision})});assert.ok(binding.ok);
 await fetch(base+'/api/open',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dir:proof.project})});await send('Page.navigate',{url:base+'/'});await delay(1000);await evaluate("document.querySelector('#btnSpace').click()");
 for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('.cos-news-context button')"))break;await delay(100);}
 await evaluate(`(()=>{const original=window.fetch;window.fetch=(url,options)=>{if(url==='/api/giong')return Promise.resolve(new Response(JSON.stringify({ok:true,allowed:true,workspaceId:${JSON.stringify(proof.workspaceId)},ketNoi:{},kq:[{id:'111111111111',ncc:'elevenlabs',text:'Matching synthetic narration',narration:{scriptId:${JSON.stringify(approved.id)},scriptHash:${JSON.stringify(approved.hash)}}},{id:'222222222222',ncc:'elevenlabs',text:'Unrelated synthetic narration'}]})));if(url==='/api/giong/attach'){window.__attachRequest=JSON.parse(options.body);window.__attachHeaders=Object.fromEntries(new Headers(options.headers).entries());return Promise.resolve(new Response(JSON.stringify({asset:{id:'fixture',path:'inputs/fixture.mp3'},voice:{narration:{scriptId:${JSON.stringify(approved.id)}}}})));}return original(url,options);};document.querySelector('.cos-news-context button').click();})()`);
 for(let i=0;i<100;i++){if(await evaluate("[...document.querySelectorAll('dialog button')].some(b=>b.textContent==='Đưa vào tư liệu dự án')"))break;await delay(100);}
 assert.equal(await evaluate("[...document.querySelectorAll('dialog button')].find(b=>b.textContent==='Audio khác bản kịch bản đã chọn').disabled"),true);
 await evaluate("[...document.querySelectorAll('dialog button')].find(b=>b.textContent==='Đưa vào tư liệu dự án').click()");
 for(let i=0;i<50;i++){if(await evaluate('!!window.__attachRequest'))break;await delay(100);}
 assert.deepEqual(await evaluate('window.__attachRequest'),{id:'111111111111',expectedNewsId:approved.id});const attachHeaders=await evaluate('window.__attachHeaders');assert.equal(attachHeaders['x-contentos-project'],proof.project);assert.ok(attachHeaders['x-contentos-revision']);
 evidence.projectVoiceIntakePayload=true;evidence.unrelatedNarrationDisabled=true;evidence.projectRevisionHeaders=true;
 assert.deepEqual(errors,[]);evidence.pageErrors=errors;fs.writeFileSync('docs/NEWS_VOICE_BROWSER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);await send('Browser.close').catch(()=>{});
}finally{if(previousWorkspace)await fetch('http://127.0.0.1:5180/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:previousWorkspace})});ws?.close();chrome.kill();await delay(500);try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
