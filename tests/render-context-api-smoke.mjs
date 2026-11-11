import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
const base='http://127.0.0.1:5191',delay=ms=>new Promise(r=>setTimeout(r,ms));
const a='workspace/content/2026-11-03/contentos-smoke-narration-render',b='workspace/content/2026-11-03/contentos-smoke-3';
const settings=fs.existsSync('workspace/settings.json')?JSON.parse(fs.readFileSync('workspace/settings.json','utf8')):{};assert.ok(!settings.exportDir,'QA must not copy outputs into user export folder');
const server=spawn(process.execPath,['editor/server.mjs','--home','--port','5191'],{windowsHide:true,stdio:'ignore'});
let originalHtml;
async function call(url,body,headers={}){const response=await fetch(base+url,body===undefined?{headers}:{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});const data=await response.json();assert.ok(response.ok,JSON.stringify(data));return data;}
const headers=p=>({'X-ContentOS-Project':p.dir,'X-ContentOS-Revision':p.revision});
try{
 for(let i=0;i<50;i++){try{await call('/api/ping');break;}catch{await delay(100);}}
 await call('/api/open',{dir:a});const projectA=await call('/api/project');
 const started=await call('/api/render',{quality:'draft'},headers(projectA));assert.equal(started.projectDir,path.resolve(a));
 const beforeCliStatus=fs.existsSync(path.join(a,'work/render.json'))?fs.readFileSync(path.join(a,'work/render.json'),'utf8'):null;
 const competing=spawn(process.execPath,['editor/tools/xuat-video.mjs',a,'--quality','draft'],{windowsHide:true,stdio:'ignore'});
 const competingCode=await new Promise((resolve,reject)=>{competing.on('error',reject);competing.on('close',resolve);});assert.equal(competingCode,1);
 assert.equal(fs.existsSync(path.join(a,'work/render.json'))?fs.readFileSync(path.join(a,'work/render.json'),'utf8'):null,beforeCliStatus);
 assert.ok(started.snapshotId);const snapshotDir=path.join(a,'work/render-snapshots',started.snapshotId);const snapshot=JSON.parse(fs.readFileSync(path.join(snapshotDir,'snapshot.json'),'utf8'));assert.equal(snapshot.revision,projectA.revision);
 originalHtml=fs.readFileSync(path.join(a,'index.html'));fs.writeFileSync(path.join(a,'index.html'),'Deliberately invalid current editor composition during synthetic render');
 await call('/api/open',{dir:b});const projectB=await call('/api/project');assert.equal((await call('/api/render')).running,false);
 const busy=await fetch(base+'/api/render',{method:'POST',headers:{...headers(projectB),'Content-Type':'application/json'},body:'{"quality":"draft"}'});assert.equal(busy.status,409);assert.equal((await busy.json()).code,'RENDER_BUSY');
 const cancelOther=await fetch(base+'/api/render-ai',{method:'DELETE',headers:headers(projectB)});assert.ok(cancelOther.ok);
 await call('/api/open',{dir:a});let result;
 for(let i=0;i<180;i++){result=await call('/api/render');if(!result.running)break;await delay(1000);}
 assert.equal(result.running,false,'render terminal');assert.equal(result.ok,true,result.log);assert.ok(result.saved.startsWith(path.resolve(a)+path.sep));assert.ok(fs.existsSync(result.saved));assert.equal(result.revision,projectA.revision);
 assert.ok(result.probe.streams.some(s=>s.codec_name==='aac'));assert.ok(Math.abs(Number(result.probe.format.duration)-3)<0.15);
 const lineage=JSON.parse(fs.readFileSync(result.saved+'.json','utf8'));assert.equal(lineage.snapshotId,started.snapshotId);assert.equal(lineage.revision,projectA.revision);assert.equal(lineage.ok,true);
 const evidence={syntheticOnly:true,competingCliRejectedWithoutStatusChange:true,renderPinnedAcrossProjectSwitch:true,snapshotRevision:result.revision,snapshotId:started.snapshotId,liveCompositionChangeDidNotAffectRender:true,otherProjectStatusHidden:true,otherProjectRenderBusy:true,otherProjectCancelDidNotStopOriginal:true,output:result.saved,probe:result.probe,limits:'Direct in-memory render using copied local assets; remote script/font dependencies remain external, durable restart recovery incomplete.'};fs.writeFileSync('docs/RENDER_CONTEXT_API_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);
}finally{if(originalHtml)fs.writeFileSync(path.join(a,'index.html'),originalHtml);server.kill();}
