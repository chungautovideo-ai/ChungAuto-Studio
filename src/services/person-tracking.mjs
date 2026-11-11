import {personRuntimeStatus} from './person-runtime.mjs';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawn,execFile} from 'node:child_process';
import {resolveContained} from './storage.mjs';import {readFaceTracks} from './face-tracks.mjs';import {probeMediaMetadata} from './media-metadata.mjs';
import {normalizePersonSelections} from '../../editor/lib/person-selection.js';
export function personTrackingStatus(root){
 try{const data=JSON.parse(fs.readFileSync(path.join(root,'workspace/logs/person-tracking.lock'),'utf8'));if(!Number.isInteger(data.pid)||data.pid<1)return {state:'needs-attention'};let alive=false;try{process.kill(data.pid,0);alive=true;}catch{}return {state:alive?'running':'needs-attention',pid:data.pid,source:data.src,startedAt:data.startedAt};}catch(e){return {state:e.code==='ENOENT'?'idle':'needs-attention'};}
}
export async function trackPersonSelection(root,dir,project,request,{validate=()=>{},signal}={}){
 validate();signal?.throwIfAborted();
 const {src,from,duration,fps=8,points}=request||{};
 if(typeof src!=='string'||![from,duration,fps].every(Number.isFinite)||from<0||duration<.2||duration>15||fps<1||fps>15||duration*fps>120||!Array.isArray(points)||!points.length||points.length>16||points.some(p=>!Array.isArray(p)||p.length!==3||p.some(n=>!Number.isFinite(n))||p[0]<0||p[0]>1||p[1]<0||p[1]>1||![0,1].includes(p[2]))||!points.some(p=>p[2]===1))throw new Error('Khoảng0.2–15giây,1–15fps/tối đa120mẫu và1–16điểm chọn hợp lệ.');
 const track=readFaceTracks(dir,project).tracks.find(t=>t.src===src&&t.skin);if(!track)throw new Error('Quét lại người/da của nguồn trước khi chọn đối tượng.');
 const source=resolveContained(dir,src).file,metadata=await probeMediaMetadata(source,{validate});if(from+duration>metadata.duration+.01)throw new Error('Khoảng theo dõi vượt nguồn.');
 const modelDir=path.join(root,'tools/models/sam2.1-hiera-tiny');if(!fs.existsSync(path.join(modelDir,'model.safetensors')))throw new Error('Thiếu modelSAM2local; cần cấu hình model trước khi theo dõi.');
 const readiness=await personRuntimeStatus(root);validate();signal?.throwIfAborted();if(!readiness.ready)throw new Error(readiness.detail);
 const logs=resolveContained(root,'workspace/logs').file,cache=resolveContained(root,'workspace/cache').file,lock=path.join(logs,'person-tracking.lock');let handle;
 try{handle=fs.openSync(lock,'wx');}catch(e){if(e.code==='EEXIST')throw new Error('Đang có tác vụ theo dõi hoặc lock cần kiểm tra; không khởi chạy trùng.');throw e;}
 let scratch;
 try{
  fs.writeFileSync(handle,JSON.stringify({pid:process.pid,src,startedAt:new Date().toISOString()}));scratch=fs.mkdtempSync(path.join(cache,'person-tracking-'));const config=path.join(scratch,'request.json'),output=path.join(scratch,'result.json');fs.writeFileSync(config,JSON.stringify({source,from,duration,fps,points,modelDir,output}));
  await new Promise((resolve,reject)=>{
   const runtime=readiness.command,child=spawn(runtime,[...readiness.args,'-X','utf8',path.join(root,'editor/tools/person-track.py'),config],{windowsHide:true,stdio:['ignore','ignore','pipe'],env:{...process.env,HF_HUB_OFFLINE:'1',TRANSFORMERS_OFFLINE:'1'}});let forced,error='',settled=false;
   const kill=()=>{if(child.pid){if(process.platform==='win32')execFile('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true},()=>{});else child.kill('SIGKILL');}};
   const abort=()=>{forced=new Error('Đã hủy theo dõi người.');kill();};
   const timer=setTimeout(()=>{forced=new Error('Theo dõi quá3phút; chia đoạn rồi thử lại.');kill();},180000);
   const watch=setInterval(()=>{try{validate();signal?.throwIfAborted();}catch(e){forced=e;kill();}},1000);
   const done=e=>{if(settled)return;settled=true;clearTimeout(timer);clearInterval(watch);signal?.removeEventListener('abort',abort);e?reject(e):resolve();};
   signal?.addEventListener('abort',abort,{once:true});child.stderr.on('data',b=>{error=(error+b.toString()).slice(-6000);});child.once('error',e=>done(new Error('Không chạy được PythonSAM2local: '+e.message)));child.once('close',code=>done(forced||(code?new Error(error.trim()||'Theo dõi người thất bại.'):null)));if(signal?.aborted)abort();
  });
  validate();signal?.throwIfAborted();const result=JSON.parse(fs.readFileSync(output,'utf8'));
  const current=readFaceTracks(dir,project).tracks.find(t=>t.src===src&&t.skin);if(!current||current.fingerprint.sha256!==track.fingerprint.sha256||result.sourceSha256!==track.fingerprint.sha256)throw new Error('Nguồn đã đổi khi theo dõi; chưa áp dụng.');
  const selection=normalizePersonSelections([{src,sha256:result.sourceSha256,method:result.method,from:result.from,fps:result.fps,w:result.w,h:result.h,f:result.f}])[0];
  if(selection.from!==from||selection.fps!==fps||selection.f.length<Math.max(2,Math.floor(duration*fps)-1)||result.modelSha256!=='48c14467e5cf9e51870511feb72c89688e82dd74523142c0538b663e193ac2a7')throw new Error('Kết quả theo dõi không khớp yêu cầu.');
  return {selection,elapsedSeconds:result.elapsedSeconds,requiresVisualReview:true};
 }finally{if(scratch)fs.rmSync(resolveContained(root,path.relative(root,scratch)).file,{recursive:true,force:true});fs.closeSync(handle);fs.rmSync(lock,{force:true});}
}
