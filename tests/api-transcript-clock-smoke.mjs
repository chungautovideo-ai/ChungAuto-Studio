import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
import {sourceTranscriptClock} from '../editor/lib/source-transcript.js';
let expected='current';const observations=[];let gatewayError;
const gateway=http.createServer(async(req,res)=>{try{
 let raw='';for await(const c of req)raw+=c;const body=JSON.parse(raw),read=body.messages.find(m=>m.tool_call_id==='words'),edit=body.messages.find(m=>m.tool_call_id==='edit');let message;
 if(!read)message={tool_calls:[{id:'words',type:'function',function:{name:'read_transcript',arguments:'{}'}}]};
 else if(!edit){const data=JSON.parse(read.content);if(expected==='current'){assert.equal(data.sourceClockMatched,true);assert.equal(data.words[0].word,'Fixture');assert.deepEqual(data.words[0].source,{src:'inputs/raw.mp4',start:.1,end:.3});}else{assert.match(data.error,/nhận giọng lại/);assert.equal(data.words,undefined);}observations.push({expected,result:data});message={tool_calls:[{id:'edit',type:'function',function:{name:'set_edit_fields',arguments:JSON.stringify({fields:{title:'ContentOS-Smoke-Clock-'+expected}})}}]};}
 else {assert.equal(JSON.parse(edit.content).ok,true);message={content:'Đã kiểm tra lời thoại và sửa tiêu đề.'};}
 res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{finish_reason:message.tool_calls?'tool_calls':'stop',message}]}));
 }catch(error){gatewayError=error;res.statusCode=500;res.end(JSON.stringify({error:'fixture assertion failed'}));}});await new Promise(ok=>gateway.listen(0,'127.0.0.1',ok));
const server=spawn(process.execPath,['editor/server.mjs','--home','--port','5196'],{windowsHide:true,stdio:'ignore'}),base='http://127.0.0.1:5196',delay=ms=>new Promise(ok=>setTimeout(ok,ms));let previous,workspace;
async function api(url,body,headers={}){const response=await fetch(base+url,body?{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)}:{}),result=await response.json();assert.ok(response.ok,JSON.stringify(result));return result;}
try{
 for(let i=0;i<80;i++){try{await api('/api/ping');break;}catch{await delay(100);}}
 previous=(await api('/api/v1/workspaces')).activeId;workspace=(await api('/api/v1/workspaces',{name:'ContentOS-Smoke-TranscriptClock-'+Date.now()})).id;
 await api('/api/v1/connections/llm',{workspaceId:workspace,baseUrl:'http://127.0.0.1:'+gateway.address().port+'/v1',model:'fixture-clock'});
 const response=await fetch(base+'/api/new-project?file=raw.mp4&name=ContentOS-Smoke-Clock&noasr=1',{method:'POST',body:fs.readFileSync('tests/fixture.mp4')});assert.ok(response.ok);const created=await response.json(),file=path.join(created.dir,'project.json');
 const project=JSON.parse(fs.readFileSync(file));project.source.timeline='segments';project.segments=[{id:'a',src:project.source.video,in:0,out:1,mediaStart:0,keep:true,mediaInfo:{width:project.source.width,height:project.source.height,duration:project.source.duration,hasAudio:project.source.hasAudio}}];project.source.duration=1;fs.writeFileSync(file,JSON.stringify(project));
 fs.writeFileSync(path.join(created.dir,'work/transcript.json'),JSON.stringify({sourceClock:sourceTranscriptClock(project),words:[{word:'Fixture',start:.1,end:.3,source:{src:project.source.video,start:.1,end:.3}}]}));
 for(expected of ['current','stale']){
  if(expected==='stale'){const changed=JSON.parse(fs.readFileSync(file));changed.segments[0].mediaStart=.1;fs.writeFileSync(file,JSON.stringify(changed));}
  const context=await api('/api/project'),queued=await api('/api/ai-revise',{instruction:'Kiểm tra lời thoại và sửa tiêu đề '+expected,completionMode:'review',execution:{mode:'api',agent:'gateway'}},{'X-ContentOS-Project':created.dir,'X-ContentOS-Revision':context.revision});
  let state;for(let i=0;i<100;i++){state=JSON.parse(fs.readFileSync(path.join(queued.job.dir,'work/ai-job.json')));if(['done','error'].includes(state.status))break;await delay(200);}if(gatewayError)throw gatewayError;assert.equal(state.status,'done',JSON.stringify(state));assert.equal(state.completionState,'awaiting-review');assert.equal(fs.existsSync(path.join(queued.job.dir,'work/render.json')),false);
 }
 assert.equal(observations.length,2);const evidence={project:created.dir,actualHttpRevise:true,syntheticGateway:true,noAutomaticRender:true,observations,limits:'Saved transcript source-clock/provenance guard, no source-byte checksum or actual paid model acceptance.'};fs.writeFileSync('docs/API_TRANSCRIPT_CLOCK_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);
}finally{if(workspace)await fetch(base+'/api/v1/connections/llm',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspaceId:workspace})}).catch(()=>{});if(previous)await api('/api/v1/workspaces/active',{id:previous});server.kill();gateway.closeAllConnections();await new Promise(ok=>gateway.close(ok));}
