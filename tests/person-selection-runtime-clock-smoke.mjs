import fs from 'node:fs';import {hyperframesCommand} from '../src/services/hyperframes-command.mjs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'beauty-mask-')),chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--remote-debugging-port=0','--no-first-run','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'}),delay=ms=>new Promise(r=>setTimeout(r,ms));const qa=JSON.parse(fs.readFileSync('docs/PERSON_SELECTION_RANGES_UI_SMOKE.json')).project,qaDir=path.resolve(qa);let ws;
try{
 let port;for(let n=0;n<100;n++){try{port=Number(fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]);break;}catch{await delay(100);}}assert.ok(port);
 const tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json();ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((ok,bad)=>{ws.onopen=ok;ws.onerror=bad;});let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));setTimeout(()=>{if(pending.delete(key))reject(new Error('CDP timeout'));},15000).unref();});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:800,height:500,deviceScaleFactor:1,mobile:false});

 const vendor=path.resolve(path.dirname(hyperframesCommand(process.cwd(),[]).args[0]),'../dist/vendor/npm'),gsapVersion=fs.readdirSync(vendor).find(v=>v.startsWith('gsap@')),gsap=fs.readFileSync(path.join(vendor,gsapVersion,'dist/gsap.min.js'),'utf8');
 await send('Page.setDocumentContent',{frameId:(await send('Page.getFrameTree')).frameTree.frame.id,html:'<html><body><div id="camFrame"></div></body></html>'});
 await evaluate(gsap+';true');
 const html=fs.readFileSync(path.join(qaDir,'index.html'),'utf8'),data=JSON.parse(html.match(/window\.__EDIT__ = (.+?);<\/script>/)[1]);
 await evaluate('window.__EDIT__='+JSON.stringify({...data,beauty:undefined}));
 await evaluate(fs.readFileSync('editor/lib/runtime.js','utf8'));
 const duration=await evaluate('window.__timelines.main.duration()');assert.equal(duration,6,'timeline covers full footage despite no graphics');
 const times=[];for(const time of [.5,2.5,3.5,5.5]){const actual=await evaluate(`window.__timelines.main.seek(${time});window.__timelines.main.time()`);assert.equal(actual,time);times.push(actual);}
 const old=await evaluate('window.__timelines.main.duration()');await evaluate('window.__timelines.main.seek(.5);true');
 fs.writeFileSync('docs/PERSON_SELECTION_REAL_RUNTIME_CLOCK_SMOKE.json',JSON.stringify({actualGSAP:true,gsapVersion:await evaluate('gsap.version'),runtimeFile:'editor/lib/runtime.js',project:qa,noGraphicBlocks:true,duration,times,scope:'Runtime with built project data and installed HF bundled GSAP3.15; final renderer separately checked'},null,2));
 await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();}
