import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import os from 'node:os';import {spawn,execFileSync} from 'node:child_process';
import {sourceTranscriptClock} from '../editor/lib/source-transcript.js';
import {waitForAsrLock} from '../src/services/asr-lock.mjs';
let expected='current';const observations=[];let gatewayError,heldAsr;
const gateway=http.createServer(async(req,res)=>{try{
 let raw='';for await(const c of req)raw+=c;const body=JSON.parse(raw),read=body.messages.find(m=>m.tool_call_id==='words'),edit=body.messages.find(m=>m.tool_call_id==='edit');let message;
 if(!read)message={tool_calls:[{id:'words',type:'function',function:{name:'read_transcript',arguments:'{}'}}]};
 else if(!edit){const data=JSON.parse(read.content);if(expected==='current'){assert.equal(data.sourceClockMatched,true);assert.ok(data.words.length>2,JSON.stringify(data));assert.match(data.words.map(w=>w.word).join(' '),/video.*studio/i);}else{assert.match(data.error,/nhận giọng lại/);assert.equal(data.words,undefined);}observations.push({expected,result:data});message={tool_calls:[{id:'edit',type:'function',function:{name:'set_edit_fields',arguments:JSON.stringify({fields:{title:'ContentOS-Smoke-Clock-'+expected}})}}]};}
 else {assert.equal(JSON.parse(edit.content).ok,true);message={content:'Đã kiểm tra lời thoại và sửa tiêu đề.'};}
 res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{finish_reason:message.tool_calls?'tool_calls':'stop',message}]}));
 }catch(error){gatewayError=error;res.statusCode=500;res.end(JSON.stringify({error:'fixture assertion failed'}));}});await new Promise(ok=>gateway.listen(0,'127.0.0.1',ok));
const server=spawn(process.execPath,['editor/server.mjs','--home','--port','5196'],{windowsHide:true,stdio:'ignore'}),base='http://127.0.0.1:5196',delay=ms=>new Promise(ok=>setTimeout(ok,ms));let previous,workspace;
async function api(url,body,headers={}){const response=await fetch(base+url,body?{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)}:{}),result=await response.json();assert.ok(response.ok,JSON.stringify(result));return result;}
try{
 for(let i=0;i<80;i++){try{await api('/api/ping');break;}catch{await delay(100);}}
 previous=(await api('/api/v1/workspaces')).activeId;workspace=(await api('/api/v1/workspaces',{name:'ContentOS-Smoke-TranscriptClock-'+Date.now()})).id;
 await api('/api/v1/connections/llm',{workspaceId:workspace,baseUrl:'http://127.0.0.1:'+gateway.address().port+'/v1',model:'fixture-clock'});
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'cos-first-asr-'));let created;
 try{
 const wav=path.join(temp,'speech.wav'),ps=path.join(temp,'speech.ps1');fs.writeFileSync(ps,`﻿Add-Type -AssemblyName System.Speech
$v=New-Object System.Speech.Synthesis.SpeechSynthesizer
$v.SetOutputToWaveFile('${wav.replaceAll("'","''")}')
$v.Speak('Welcome to the video studio. The camera is ready for action.')
$v.Dispose()`);execFileSync('powershell',['-NoProfile','-ExecutionPolicy','Bypass','-File',ps],{windowsHide:true});
 const video=path.join(temp,'speech.mp4');execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=blue:s=160x90:r=30','-i',wav,'-shortest','-c:v','libx264','-c:a','aac',video],{windowsHide:true});
 const response=await fetch(base+'/api/new-project?file=speech.mp4&name=ContentOS-Smoke-FirstASR&noasr=1',{method:'POST',body:fs.readFileSync(video)});assert.ok(response.ok);created=await response.json();
 const template=(await api('/api/installed-templates')).items[0].id;
 heldAsr=await waitForAsrLock(process.cwd());
 const queued=await api('/api/ai-job',{dir:created.dir,template,transcriptLanguage:'en',sfxLevel:'tat',completionMode:'review',execution:{mode:'api',agent:'gateway'},note:'Dựng từ lời thoại nguồn.'});
 let waiting;for(let i=0;i<60;i++){waiting=JSON.parse(fs.readFileSync(path.join(created.dir,'work/ai-job.json')));if(waiting.apiProgress?.waitingResource)break;await delay(100);}
 assert.equal(waiting.apiProgress.waitingResource,true);assert.match(waiting.apiProgress.phase,/chờ lượt nhận giọng/);const activity=await api('/api/v1/activity');assert.match(activity.entries.find(row=>row.id==='legacy:'+created.dir).phase,/chờ lượt nhận giọng/);assert.equal(observations.length,0);assert.equal(fs.existsSync(path.join(created.dir,'work/transcript.json')),false);heldAsr.release();heldAsr=null;
 let state;for(let i=0;i<300;i++){state=JSON.parse(fs.readFileSync(path.join(created.dir,'work/ai-job.json')));if(['done','error'].includes(state.status))break;await delay(200);}if(gatewayError)throw gatewayError;assert.equal(state.status,'done',JSON.stringify(state));assert.equal(state.completionState,'awaiting-review');assert.equal(state.transcriptPreparation.state,'recognized');assert.ok(state.transcriptPreparation.words>2);assert.equal(observations.length,1);
 const evidence={project:created.dir,sharedAsrWait:true,noTranscriptBeforeResource:true,actualFirstBuildEndpoint:true,actualLocalWhisper:true,syntheticEnglishSpeech:true,syntheticGateway:true,noAutomaticRender:true,preparation:state.transcriptPreparation,wordsSeenByModel:observations[0].result.words.map(w=>w.word),limits:'Explicit en recognition of synthetic English only; no Vietnamese quality or actual paid model acceptance.'};fs.writeFileSync('docs/FIRST_BUILD_ASR_API_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);
 }finally{heldAsr?.release();fs.rmSync(temp,{recursive:true,force:true});}
}finally{if(workspace)await fetch(base+'/api/v1/connections/llm',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspaceId:workspace})}).catch(()=>{});if(previous)await api('/api/v1/workspaces/active',{id:previous});server.kill();gateway.closeAllConnections();await new Promise(ok=>gateway.close(ok));}
