import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {spawn,execFileSync} from 'node:child_process';
const base='http://127.0.0.1:5194',server=spawn(process.execPath,['editor/server.mjs','--home','--port','5194'],{windowsHide:true,stdio:'ignore'}),delay=ms=>new Promise(r=>setTimeout(r,ms));
const api=async(url,body)=>{const response=await fetch(base+url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}),data=await response.json();assert.ok(response.ok,JSON.stringify(data));return data;};
try{
 for(let i=0;i<100;i++){try{await api('/api/ping');break;}catch{await delay(100);}}
 const workspaceId=(await api('/api/v1/workspaces')).activeId,bytes=execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','color=c=blue:s=640x360','-frames:v','1','-f','image2pipe','-c:v','png','-'],{windowsHide:true});
 const response=await fetch(base+'/api/v1/images/import',{method:'POST',headers:{'X-ContentOS-Workspace':workspaceId,'X-ContentOS-Filename':'fixture.png','Content-Type':'application/octet-stream'},body:bytes}),image=await response.json();assert.ok(response.ok,JSON.stringify(image));
 const results=[];
 for(const kind of ['poster','thumbnail']){
  const input={kind,aspect:kind==='poster'?'4:5':'16:9',title:'Nâng tầm trải nghiệm',brandName:'ContentOS',backgroundId:image.id,...(kind==='poster'?{subtitle:'Dựng bằng React native',cta:'Tìm hiểu ngay',stats:[{label:'Bảo hành',value:'24 tháng'}],position:'bottom-left'}:{frameId:image.id})};
  const body={workspaceId,input,idempotencyKey:crypto.randomUUID()},task=await api('/api/v1/images/compose',body);assert.equal((await api('/api/v1/images/compose',body)).id,task.id);let current;
  for(let i=0;i<400;i++){current=await api('/api/v1/tasks/'+task.id);if(!['running','queued'].includes(current.status))break;await delay(250);}assert.equal(current.status,'succeeded',JSON.stringify(current));
  const catalog=await api('/api/v1/images'),result=catalog.images.find(item=>item.id===current.result.imageId);assert.ok(result);assert.equal(result.source.input.kind,kind);const file=await fetch(base+'/api/v1/images/'+result.id+'/file');assert.equal(file.status,200);const data=Buffer.from(await file.arrayBuffer());assert.equal(crypto.createHash('sha256').update(data).digest('hex'),result.sha256);fs.writeFileSync('docs/NATIVE_'+kind.toUpperCase()+'.png',data);results.push({kind,imageId:result.id,dimensions:result.dimensions,sourceInputPreserved:true,idempotency:true});
 }
 fs.writeFileSync('docs/NATIVE_STILL_API_SMOKE.json',JSON.stringify({workspaceId,sourceImage:image.id,results},null,2));console.log('PASS',results);
}finally{server.kill();}
