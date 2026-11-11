import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawn,execFileSync} from 'node:child_process';
import {verifyShortMusicArtifact} from './verify-short-music-artifact.mjs';
const base='http://127.0.0.1:5193',delay=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['editor/server.mjs','--home','--port','5193'],{windowsHide:true,stdio:'ignore'});let original,created,result;
async function call(route,body,headers={}){const r=await fetch(base+route,body===undefined?{headers:{Connection:'close',...headers}}:{method:'POST',headers:{Connection:'close','Content-Type':'application/json',...headers},body:JSON.stringify(body)}),j=await r.json();assert.ok(r.ok,JSON.stringify(j));return j;}
const ff=(args,options={})=>execFileSync('ffmpeg',['-nostdin','-v','error',...args],{windowsHide:true,maxBuffer:4*1024*1024,...options});
try{
 for(let n=0;n<80;n++){try{await call('/api/ping');break;}catch{await delay(100);}}
 original=(await call('/api/v1/workspaces')).activeId;await call('/api/v1/workspaces',{name:'Short music final QA '+Date.now()});
 const scratch=fs.mkdtempSync(path.resolve('workspace/cache/short-music-final-')),source=path.join(scratch,'raw.mp4');ff(['-f','lavfi','-i','color=c=navy:s=180x320:r=30:d=3','-c:v','libx264','-pix_fmt','yuv420p',source]);
 const upload=await fetch(base+'/api/new-project?file=qa.mp4&name=ContentOS-QA-Short-Music-Final&noasr=1',{method:'POST',headers:{Connection:'close'},body:fs.readFileSync(source)});created=await upload.json();assert.ok(upload.ok);
 const file=path.join(created.dir,'project.json'),p=JSON.parse(fs.readFileSync(file));ff(['-f','lavfi','-i','sine=frequency=660:duration=1',path.join(created.dir,'inputs/music.wav')]);
 p.endCard={enabled:true,duration:2,title:'QA MUSIC',subtitle:'Synthetic test'};p.audio={voice:0,music:'inputs/music.wav',musicVolume:.2,musicLoop:'crossfade',sfxLevel:'tat',autoSfx:false,sfx:[],clips:[]};fs.writeFileSync(file,JSON.stringify(p));
 const current=await call('/api/project');await call('/api/render',{quality:'final'},{'X-ContentOS-Project':created.dir,'X-ContentOS-Revision':current.revision});
 for(let n=0;n<1800;n++){result=await call('/api/render');if(!result.running)break;await delay(100);}
 assert.equal(result.running,false,'Render still running: preserve server');assert.equal(result.ok,true,result.log);
 const evidence={...verifyShortMusicArtifact(created.dir,result.saved),actualHTTPFinalRender:true};fs.writeFileSync('docs/SHORT_MUSIC_FINAL_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
}finally{
 if(result&&!result.running||!created){if(original)await call('/api/v1/workspaces/active',{id:original}).catch(()=>{});server.kill();}
 else{let latest;try{latest=await call('/api/render');}catch{}if(latest&&!latest.running){if(original)await call('/api/v1/workspaces/active',{id:original}).catch(()=>{});server.kill();}else console.error('Preserved live QA server/render: '+created?.dir);}
}
