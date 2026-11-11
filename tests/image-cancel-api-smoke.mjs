import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const delay=ms=>new Promise(r=>setTimeout(r,ms));let arrived,disconnected;const ready=new Promise(r=>arrived=r),closed=new Promise(r=>disconnected=r);
const gateway=http.createServer(async(req,res)=>{for await(const _chunk of req){}arrived();res.on('close',disconnected);});await new Promise(r=>gateway.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:5197',server=spawn(process.execPath,['editor/server.mjs','--home','--port','5197'],{windowsHide:true,stdio:'ignore',env:{...process.env,CONTENTOS_IMAGE_BASE_URL:'http://127.0.0.1:'+gateway.address().port+'/v1',CONTENTOS_IMAGE_MODEL:'cancel-fixture'}});
async function call(url,body){const r=await fetch(base+url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const data=await r.json();assert.ok(r.ok,JSON.stringify(data));return data;}
let previous,workspace;
try{
 for(let i=0;i<60;i++){try{await call('/api/ping');break;}catch{await delay(100);}}
 previous=(await call('/api/v1/workspaces')).activeId;workspace=(await call('/api/v1/workspaces',{name:'ContentOS-Smoke-ImageCancel '+Date.now()})).id;
 const controller=new AbortController(),pending=fetch(base+'/api/v1/images',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspaceId:workspace,prompt:'Cancellation fixture'}),signal:controller.signal}).catch(e=>e);
 await Promise.race([ready,delay(10000).then(()=>{throw new Error('Gateway not reached');})]);controller.abort();assert.equal((await pending).name,'AbortError');
 await Promise.race([closed,delay(10000).then(()=>{throw new Error('Gateway connection not closed');})]);await delay(300);
 assert.deepEqual((await call('/api/v1/images')).images,[]);const folder=path.join('workspace/contentos/images',workspace);assert.ok(!fs.existsSync(folder)||fs.readdirSync(folder).length===0);
 fs.writeFileSync('docs/IMAGE_CANCEL_API_SMOKE.json',JSON.stringify({workspaceId:workspace,actualHttpClientDisconnect:true,gatewayConnectionClosed:true,noPublishedOrStagedImages:true,syntheticGatewayOnly:true},null,2)+'\n');console.log('Actual client disconnect closed gateway request, no image artifacts.');
}finally{if(previous)await call('/api/v1/workspaces/active',{id:previous});server.kill();gateway.closeAllConnections();await new Promise(r=>gateway.close(r));}
