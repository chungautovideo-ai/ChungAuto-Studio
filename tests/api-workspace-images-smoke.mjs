import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import os from 'node:os';import assert from 'node:assert/strict';import {spawn,execFileSync} from 'node:child_process';
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'cos-workspace-image-api-'));const steps=[];let imageId,src;
const gateway=http.createServer(async(req,res)=>{
 try{
  let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw),replies=body.messages.filter(m=>m.role==='tool');if(replies.length)assert.equal(JSON.parse(replies.at(-1).content).error,undefined,replies.at(-1).content);
  let name,args;const step=replies.length;
  if(step===0){assert.ok(body.tools.some(t=>t.function.name==='list_workspace_images'));name='list_workspace_images';args={query:'Smoke red'};}
  else if(step===1){const image=JSON.parse(replies.at(-1).content).images[0];assert.equal(image.id,imageId);name='attach_workspace_image';args={id:image.id};}
  else if(step===2){src=JSON.parse(replies.at(-1).content).src;name='inspect_media';args={sources:[src]};}
  else if(step===3){name='set_edit_fields';args={fields:{brolls:[{id:'b-workspace',src,at:0,dur:1,mode:'full'}]}};}
  const message=name?{tool_calls:[{id:'step'+step,type:'function',function:{name,arguments:JSON.stringify(args)}}]}:{content:'Đã dùng ảnh workspace.'};if(name)steps.push(name);
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{finish_reason:name?'tool_calls':'stop',message}]}));
 }catch(error){res.writeHead(500);res.end(error.message);}
});await new Promise(r=>gateway.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:5196',server=spawn(process.execPath,['editor/server.mjs','--home','--port','5196'],{windowsHide:true,stdio:'ignore'}),delay=ms=>new Promise(r=>setTimeout(r,ms));
async function call(url,body,headers={}){const r=await fetch(base+url,body?{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)}:{headers});const data=await r.json();assert.ok(r.ok,JSON.stringify(data));return data;}
let previous,workspace;
try{
 for(let i=0;i<60;i++){try{await call('/api/ping');break;}catch{await delay(100);}}
 previous=(await call('/api/v1/workspaces')).activeId;await call('/api/v1/workspaces',{name:'ContentOS-Smoke-API-WorkspaceImage-'+Date.now()});workspace=(await call('/api/v1/connections/llm')).workspaceId;
 await call('/api/v1/connections/llm',{workspaceId:workspace,baseUrl:'http://127.0.0.1:'+gateway.address().port+'/v1',model:'fixture-images'});
 const png=path.join(fixture,'Smoke red.png');execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=red:s=320x180','-frames:v','1',png],{windowsHide:true});
 const imported=await fetch(base+'/api/v1/images/import',{method:'POST',headers:{'Content-Type':'application/octet-stream','X-ContentOS-Workspace':workspace,'X-ContentOS-Filename':encodeURIComponent('Smoke red.png')},body:fs.readFileSync(png)});assert.ok(imported.ok);imageId=(await imported.json()).id;
 const upload=await fetch(base+'/api/new-project?file=fixture.mp4&name=ContentOS-Smoke-API-WorkspaceImage&noasr=1',{method:'POST',body:fs.readFileSync('tests/fixture.mp4')});assert.ok(upload.ok);const created=await upload.json(),file=path.join(created.dir,'project.json'),project=JSON.parse(fs.readFileSync(file));project.texts=[];project.brolls=[];project.captions={enabled:false,lines:[]};project.audio={...project.audio,autoSfx:false,sfxLevel:'tat',music:'',sfx:[]};fs.writeFileSync(file,JSON.stringify(project));
 const context=await call('/api/project'),queued=await call('/api/ai-revise',{instruction:'Tìm ảnh Smoke red trong workspace rồi dùng làm cảnh trám đầu video1giây.',completionMode:'auto-export',execution:{mode:'api',agent:'gateway'}},{'X-ContentOS-Project':created.dir,'X-ContentOS-Revision':context.revision});
 let state;for(let i=0;i<240;i++){state=JSON.parse(fs.readFileSync(path.join(queued.job.dir,'work/ai-job.json')));if(['exported','export-error'].includes(state.completionState)||state.status==='error')break;await delay(500);}
 assert.equal(state.completionState,'exported',JSON.stringify(state));assert.deepEqual(steps,['list_workspace_images','attach_workspace_image','inspect_media','set_edit_fields']);const saved=JSON.parse(fs.readFileSync(file));assert.equal(saved.brolls[0].src,src);assert.deepEqual(saved.segments,project.segments);assert.deepEqual(fs.readFileSync(path.join(created.dir,src)),fs.readFileSync(png));
 const pixel=[...execFileSync('ffmpeg',['-v','error','-ss','0.5','-i',state.exportOutput,'-vf','format=rgb24,crop=1:1:540:960','-frames:v','1','-f','rawvideo','pipe:1'],{windowsHide:true})];assert.ok(pixel[0]>180&&pixel[1]<60&&pixel[2]<60,JSON.stringify(pixel));
 const proof={actualReviseEndpoint:true,syntheticGatewayOnly:true,steps,imageId,src,project:created.dir,output:state.exportOutput,pixel,autoExport:true,limits:'Local imported synthetic image and gateway; no paid model/image generation/browser chat submission. Imported file remains if later candidate fails.'};fs.writeFileSync('docs/API_WORKSPACE_IMAGES_SMOKE.json',JSON.stringify(proof,null,2)+'\n');console.log(proof);
}finally{if(workspace)await fetch(base+'/api/v1/connections/llm',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspaceId:workspace})}).catch(()=>{});if(previous)await call('/api/v1/workspaces/active',{id:previous});server.kill();gateway.closeAllConnections();await new Promise(r=>gateway.close(r));fs.rmSync(fixture,{recursive:true,force:true});}
