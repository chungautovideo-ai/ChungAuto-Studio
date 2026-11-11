// Requires locally generated Windows speech fixture and installed local Whisper.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {readNarrationResponse} from '../editor/ui/contentos-narration-stream.js';
import {narrationCaptionWords} from '../editor/lib/narration-captions.js';
const base='http://127.0.0.1:5180';
async function api(url,body,headers={}){const r=await fetch(base+url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw new Error(JSON.stringify(data));return data;}
const previous=(await api('/api/v1/workspaces')).activeId;
try{
 const workspace=await api('/api/v1/workspaces',{name:'ContentOS-Smoke-RealASR '+Date.now()});
 const upload=await fetch(base+'/api/new-project?file=fixture.mp4&name=ContentOS-Smoke-RealASR&noasr=1',{method:'POST',body:fs.readFileSync('tests/fixture.mp4')}),created=await upload.json();assert.ok(upload.ok);
 const dir=path.resolve(created.dir),file=path.join(dir,'project.json'),project=JSON.parse(fs.readFileSync(file,'utf8'));
 fs.copyFileSync('workspace/contentos/qa-speech/synthetic-en.wav',path.join(dir,'inputs/voice-en.wav'));
 project.audio.clips=[{id:'voice-qa',src:'inputs/voice-en.wav',at:0,from:0,sourceDuration:20,vol:1}];fs.writeFileSync(file,JSON.stringify(project));
 await api('/api/open',{dir:created.dir});const before=fs.readFileSync(file,'utf8'),context=await api('/api/project');
 const headers={'X-ContentOS-Project':created.dir,'X-ContentOS-Revision':context.revision};
 const cancelled=new AbortController();let cancelProgress=false;
 const abortResponse=await fetch(base+'/api/asr/narration',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({clipId:'voice-qa',language:'en',stream:true}),signal:cancelled.signal});
 await assert.rejects(readNarrationResponse(abortResponse,p=>{if(p.pct>=5){cancelProgress=true;cancelled.abort();}}));assert.equal(cancelProgress,true);
 const started=Date.now(),progress=[];let result;
 for(let attempt=0;attempt<50;attempt++){
  await new Promise(resolve=>setTimeout(resolve,100));
  const response=await fetch(base+'/api/asr/narration',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({clipId:'voice-qa',language:'en',stream:true})});
  try{({result}=await readNarrationResponse(response,p=>progress.push(p)));break;}catch(error){if(!error.message.includes('Đang nhận giọng'))throw error;}
 }
 assert.ok(result);assert.ok(progress.some(p=>p.pct===100));
 assert.equal(fs.readdirSync(path.join(dir,'work/narration-asr')).length,1);

 const text=result.words.map(w=>w.word).join(' ').toLowerCase();assert.ok(result.words.length>10);assert.match(text,/speech/);assert.match(text,/videos/);assert.equal(fs.readFileSync(file,'utf8'),before);
 const mapped=narrationCaptionWords(project,project.audio.clips[0],result.words);assert.ok(mapped.length>0);assert.ok(mapped.every(w=>w.e<=project.source.duration));
 const evidence={workspaceId:workspace.id,project:created.dir,syntheticSpeech:'Windows System.Speech, English',actualHttpEndpoint:true,streamedProgress:true,cancelledThenRetried:true,cancelArtifactsCleaned:true,progressEvents:progress.length,engine:result.engine,model:result.model,language:result.language,wordCount:result.words.length,text,elapsedMs:Date.now()-started,projectPreserved:true,mappedToOutputWords:mapped.length,noProviderCalls:true,limits:'Local English synthetic speech only. Does not validate Vietnamese accuracy, long audio, real voice provider or caption render.'};
 fs.writeFileSync('docs/NARRATION_ASR_RUNTIME_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);
}finally{await api('/api/v1/workspaces/active',{id:previous});}
