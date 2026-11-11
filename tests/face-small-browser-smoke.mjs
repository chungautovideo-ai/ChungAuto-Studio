import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {spawn,execFileSync} from 'node:child_process';
const delay=ms=>new Promise(r=>setTimeout(r,ms)),base='http://127.0.0.1:5197';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'face-small-'));
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port=0','--no-first-run','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const server=spawn(process.execPath,['editor/server.mjs','--home','--port','5197'],{windowsHide:true,stdio:'ignore'});let ws,original;
try{
 let port;for(let i=0;i<100;i++){try{port=Number(fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]);break;}catch{await delay(100);}}assert.ok(port);
 const pages=await(await fetch(`http://127.0.0.1:${port}/json`)).json();ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise((ok,bad)=>{ws.onopen=ok;ws.onerror=bad;});let id=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));setTimeout(()=>{if(pending.delete(key))reject(new Error('timeout '+method));},120000).unref();});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const call=async(url,body)=>{const r=await fetch(base+url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});assert.ok(r.ok);return r.json();};
 for(let i=0;i<100;i++){try{await call('/api/ping');break;}catch{await delay(100);}}
 original=(await call('/api/v1/workspaces')).activeId;await call('/api/v1/workspaces',{name:'Small face benchmark '+Date.now()});
 const sample=path.resolve('workspace/cache/face-small-fullframe.mp4');execFileSync('ffmpeg',['-v','error','-ss','12','-i','D:/Edit tự động/source/DJI_0061_D.MP4','-t','2','-vf','scale=540:960','-c:v','libx264','-crf','16','-an','-y',sample],{windowsHide:true});
 const response=await fetch(base+'/api/new-project?file=q2.mp4&name=ContentOS-Smoke-SmallFace&noasr=1',{method:'POST',body:fs.readFileSync(sample)}),created=await response.json();assert.ok(response.ok);
 await send('Page.enable');await send('Page.navigate',{url:base+'/'});await delay(1500);
 const result=[];
 for(const enabled of [false,true]){
  await send('Page.navigate',{url:base+'/?scan='+enabled});await delay(1000);
  result.push(await evaluate(`(async()=>{const {scanFace}=await import('/ui/face-scan.js');const at=performance.now();const t=await scanFace('/p/inputs/raw.mp4',{sourceId:'inputs/raw.mp4',smallFaceSearch:${enabled},personSkin:${enabled}});return {enabled:${enabled},ms:Math.round(performance.now()-at),found:t.f.filter(Boolean).length,samples:t.f.length,search:t.search,bodyMask:!!t.skin,track:t};})()`));
 }

 const project=JSON.parse(fs.readFileSync(path.join(created.dir,'project.json'))),src=project.source.video;
 // This fixture uploads as q2.mp4; enforce that the measured URL is that source.
 assert.equal(src,'inputs/raw.mp4');assert.ok(result[1].found>result[0].found,'fallback should recover additional Q2 frames');assert.ok(result[1].search.recovered>0);
 assert.ok(result[1].track.f.every(f=>!f||f.every(n=>n>=-10000&&n<=20000)));
 fs.mkdirSync(path.join(created.dir,'work'),{recursive:true});fs.writeFileSync(path.join(created.dir,'work/small-face-comparison.json'),JSON.stringify(result));
 const png=await evaluate(`(async()=>{const v=document.createElement('video');v.muted=true;v.src='/p/inputs/raw.mp4';await new Promise((r,j)=>{v.onloadeddata=r;v.onerror=j;});v.currentTime=.5;await new Promise(r=>v.onseeked=r);const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const x=c.getContext('2d');x.drawImage(v,0,0);x.fillStyle='#d8ff3e';const f=${JSON.stringify(result[1].track.f[8])};for(let i=0;i<f.length;i+=2){x.beginPath();x.arc(f[i]/10000*c.width,f[i+1]/10000*c.height,1.5,0,Math.PI*2);x.fill();}return c.toDataURL('image/png').split(',')[1];})()`);
 fs.writeFileSync('docs/SMALL_FACE_Q2_LANDMARKS.png',Buffer.from(png,'base64'));
 const skin=result[1].track.skin;assert.ok(skin?.f.length===31);
 const maskPng=await evaluate(`(()=>{const s=${JSON.stringify(skin)},r=s.f[8],c=document.createElement('canvas');c.width=s.w;c.height=s.h;const x=c.getContext('2d'),im=x.createImageData(s.w,s.h);let at=0;for(let i=0;i<r.length;i+=2)for(let n=0;n<r[i];n++){const k=r[i+1];im.data[at++]=k===2?255:0;im.data[at++]=k===1?180:0;im.data[at++]=0;im.data[at++]=255;}x.putImageData(im,0,0);return c.toDataURL('image/png').split(',')[1];})()`);
 fs.writeFileSync('docs/PERSON_SKIN_Q2_MASK.png',Buffer.from(maskPng,'base64'));
 

 const evidence={source:'D:/Edit tự động/source/DJI_0061_D.MP4',range:[12,14],processing:'full source field of view, scale540x960, no crop, silent proxy',project:created.dir,runs:result.map(({track,...rest})=>rest),scope:'Single person, two seconds only; no full-video/person segmentation/quality claim.'};fs.writeFileSync('docs/SMALL_FACE_Q2_SMOKE.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
}finally{if(original)await fetch(base+'/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:original})}).catch(()=>{});ws?.close();chrome.kill();server.kill();}

