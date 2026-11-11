import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawn,execFileSync} from 'node:child_process';
const base='http://127.0.0.1:5196',server=spawn(process.execPath,['editor/server.mjs','--home','--port','5196'],{windowsHide:true,stdio:'ignore'}),delay=ms=>new Promise(r=>setTimeout(r,ms));
async function api(url,body,headers={}){const r=await fetch(base+url,body===undefined?{headers}:{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});const data=await r.json();return {status:r.status,data};}
let previous,workspace;try{
 for(let i=0;i<80;i++){try{if((await api('/api/ping')).status===200)break;}catch{}await delay(100);}
 previous=(await api('/api/v1/workspaces')).data.activeId;workspace=(await api('/api/v1/workspaces',{name:'ContentOS-Smoke-BrandLogo-'+Date.now()})).data.id;
 const create=async name=>{const r=await fetch(base+'/api/new-project?file=fixture.mp4&name='+name+'&noasr=1',{method:'POST',body:fs.readFileSync('tests/fixture.mp4')});assert.ok(r.ok);return r.json();};
 const one=await create('ContentOS-Smoke-BrandLogo-A'),pj=JSON.parse(fs.readFileSync(path.join(one.dir,'project.json')));
 execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=red:s=160x80','-frames:v','1',path.join(one.dir,'inputs/logo.png')],{windowsHide:true});
 const {BRAND_DEFAULT}=await import('../editor/lib/brand.js');let ctx=(await api('/api/project')).data;let headers={'X-ContentOS-Project':one.dir,'X-ContentOS-Revision':ctx.revision};
 const saved=await api('/api/v1/brand-default',{workspaceId:workspace,version:0,brand:BRAND_DEFAULT,watermark:{file:'inputs/logo.png',position:'bottom-right'}},headers);assert.equal(saved.status,200,JSON.stringify(saved));assert.ok(saved.data.logo.sha256);
 fs.unlinkSync(path.join(one.dir,'inputs/logo.png'));
 const two=await create('ContentOS-Smoke-BrandLogo-B');ctx=(await api('/api/project')).data;headers={'X-ContentOS-Project':two.dir,'X-ContentOS-Revision':ctx.revision};const before=fs.readFileSync(path.join(two.dir,'project.json'),'utf8');
 assert.equal((await api('/api/v1/brand-default/apply',{workspaceId:workspace,version:0},headers)).status,409);
 const applied=await api('/api/v1/brand-default/apply',{workspaceId:workspace,version:1},headers);assert.equal(applied.status,200,JSON.stringify(applied));assert.equal(applied.data.watermark.position,'bottom-right');assert.ok(fs.existsSync(path.join(two.dir,applied.data.watermark.file)));assert.equal(fs.readFileSync(path.join(two.dir,'project.json'),'utf8'),before);
 assert.equal((await api('/api/v1/brand-default/apply',{workspaceId:workspace,version:1},{...headers,'X-ContentOS-Revision':'stale'})).status,409);
 const evidence={workspace,source:one.dir,destination:two.dir,storedLogo:saved.data.logo,appliedWatermark:applied.data.watermark,sourceLogoRemovedBeforeApply:true,projectRequiresExplicitSave:true,staleVersionAndRevisionRejected:true,limits:'Real HTTP with synthetic local assets; no browser button path, AI job/render or production visual evidence.'};fs.writeFileSync('docs/BRAND_LOGO_API_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);
}finally{if(previous)await api('/api/v1/workspaces/active',{id:previous});server.kill();}
