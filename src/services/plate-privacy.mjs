import {requireVisionPython} from './vision-python.mjs';
import {plateGeometry} from '../../editor/lib/plate-regions.js';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {spawn,execFile} from 'node:child_process';import {promisify} from 'node:util';
import {resolveContained} from './storage.mjs';import {probeMediaMetadata} from './media-metadata.mjs';
import {makeTimemap} from '../../editor/lib/timemap.js';
import {primaryPrivacyRequest} from '../../editor/lib/primary-privacy.js';
const run=promisify(execFile);let active=false;
async function sha(file,{signal,validate=()=>{}}={}){const digest=crypto.createHash('sha256');for await(const bytes of fs.createReadStream(file)){validate();signal?.throwIfAborted();digest.update(bytes);}return digest.digest('hex');}
export function plateRegions(request){return plateGeometry(request).rois;}
export function plateRequest(project,{brollId,segmentId,roi,rois,quads}={}){
 plateGeometry({roi,rois,quads});
 if((typeof brollId!=='string')===(typeof segmentId!=='string'))throw new Error('Chọn đúng một đoạn Video hoặc cảnh trám.');
 if(segmentId!==undefined){const selected=primaryPrivacyRequest(project,segmentId);return {...selected,item:{...selected.item,src:selected.src},speed:1};}
 const item=project.brolls?.find(b=>b.id===brollId);if(!item||item.hidden||! /\.(mp4|mov|m4v|webm)$/i.test(item.src||''))throw new Error('Chọn cảnh trám video đang hiện.');
 if(item.platePrivacy)throw new Error('Cảnh đã có bản che; khôi phục nguồn trước khi đánh dấu lại.');
 if(!Number.isFinite(item.dur)||item.dur<.2||!Number.isFinite(item.at)||item.at<0)throw new Error('Thời gian cảnh trám không hợp lệ.');
 const speed=Number(item.speed??1),from=item.mediaStart??0,tm=makeTimemap(project),length=Math.min(item.dur,tm.contentTotal-tm.srcToOut(item.at))*speed;
 if(!Number.isFinite(speed)||speed<.25||speed>4||!Number.isFinite(from)||from<0||length<.2||length>15)throw new Error('Tracking hỗ trợ0.2–15giây nguồn liên tục; chia cảnh dài trước.');
 return {item,from,duration:length,speed};
}
async function track(root,configFile,{signal,timeout=180000}={}){
 signal?.throwIfAborted();
 await new Promise((resolve,reject)=>{
  const runtime=requireVisionPython(root);
  const child=spawn(runtime.command,[...runtime.args,'-X','utf8',path.join(root,'editor/tools/plate-track.py'),configFile],{windowsHide:true,stdio:['ignore','ignore','pipe']});let error='',forced=null;
  const kill=()=>{if(child.pid){if(process.platform==='win32')execFile('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true},()=>{});else child.kill('SIGKILL');}};
  const abort=()=>{forced=new Error('Đã hủy che biển số.');kill();};signal?.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(()=>{forced=new Error('Tracking quá3phút; chia cảnh và thử lại.');kill();},timeout);
  child.stderr.on('data',b=>{if(error.length<8000)error+=b.toString('utf8');});
  const done=(failure)=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);failure?reject(failure):resolve();};
  child.once('error',done);child.once('close',code=>done(forced||(code?new Error(error.trim()||'Không chạy được tracker local.'):null)));
  if(signal?.aborted)abort();
 });
}
export async function createPlatePrivacy(root,dir,project,request,{validate=()=>{},signal}={}){
 if(active)throw new Error('Đang tracking cảnh khác. Đợi hoặc hủy trước khi thử lại.');
 validate();signal?.throwIfAborted();const selected=plateRequest(project,request),geometry=plateGeometry(request),regions=geometry.rois,source=resolveContained(dir,selected.item.src).file;
 const folder=path.join(dir,'inputs','privacy',crypto.randomUUID()),scratch=path.join(dir,'work','privacy',crypto.randomUUID());
 active=true;let committed=false,madeScratch=false,madeFolder=false;
 try{
  const before=fs.statSync(source),metadata=await probeMediaMetadata(source,{validate});
  const width=metadata.displayWidth,height=metadata.displayHeight;
  if(metadata.kind!=='video'||!width||!height||width*height>3840*2160||width%2||height%2||Math.abs(metadata.rotation)%90!==0||selected.from+selected.duration>metadata.duration+.01)throw new Error('Nguồn phải là video chẵn kích thước tối đa4K và đủ khoảng đã chọn.');
  const sourceHash=await sha(source,{validate,signal});validate();signal?.throwIfAborted();
  const color=selected.item.colorNormalization;
  if(color&&(color.kind!=='color-normalization'||!/^inputs\/color\/[a-f0-9-]+\/normalized\.mp4$/.test(selected.item.src)||sourceHash!==color.sha256||!Number.isFinite(color.duration)||selected.from+selected.duration>color.duration+.01))throw new Error('Bản màu đã đổi hoặc khoảng che vượt phần màu đã xử lý; chuẩn hóa lại trước khi che.');
  for(const rel of ['work','work/privacy','inputs','inputs/privacy'])if(fs.existsSync(path.join(dir,rel)))resolveContained(dir,rel);
  fs.mkdirSync(scratch,{recursive:true});resolveContained(dir,path.relative(dir,scratch));madeScratch=true;fs.mkdirSync(folder,{recursive:true});resolveContained(dir,path.relative(dir,folder));madeFolder=true;
  const muted=path.join(scratch,'masked.mp4'),output=path.join(folder,'masked.mp4'),tracks=path.join(folder,'tracks.json'),config=path.join(scratch,'request.json');
  fs.writeFileSync(config,JSON.stringify({source,width,height,from:selected.from,duration:selected.duration,roi:regions[0],rois:regions,quads:geometry.quads,output:muted,tracks,colorProfile:color?'rec709':undefined}));
  await track(root,config,{signal});validate();signal?.throwIfAborted();
  await run('ffmpeg',['-nostdin','-v','error','-y','-i',muted,'-ss',String(selected.from),'-i',source,'-map','0:v:0','-map','1:a:0?','-t',String(selected.duration),'-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',output],{windowsHide:true,signal,timeout:60000,maxBuffer:1024*1024});
  const result=await probeMediaMetadata(output,{validate});validate();signal?.throwIfAborted();const after=fs.statSync(source);
  if(before.size!==after.size||before.mtimeMs!==after.mtimeMs||await sha(source,{validate,signal})!==sourceHash)throw new Error('Nguồn đã đổi khi tracking.');
  if(result.width!==width||result.height!==height||Math.abs(result.duration-selected.duration)>.12||metadata.hasAudio&&!result.hasAudio)throw new Error('Bản che thiếu hình, âm thanh hoặc thời lượng.');
  const evidence=JSON.parse(fs.readFileSync(tracks,'utf8'));if(evidence.frames?.length<2)throw new Error('Thiếu dữ liệu tracking.');
  const provenance={kind:'plate-privacy',method:'user-roi-optical-flow',source:selected.item.src,sourceSha256:sourceHash,from:selected.from,duration:selected.duration,roi:regions[0],rois:regions,quads:geometry.quads,sha256:await sha(output,{validate,signal}),frames:evidence.frames.length,requiresVisualReview:true};
  fs.writeFileSync(path.join(folder,'provenance.json'),JSON.stringify(provenance,null,2)+'\n');
  const mediaInfo=info=>({width:info.displayWidth,height:info.displayHeight,duration:info.duration,hasAudio:info.hasAudio,...(color?{colorMetadata:info.colorMetadata}:{})});
  committed=true;return {path:path.relative(dir,output).replaceAll('\\','/'),duration:result.duration,provenance,mediaInfo:mediaInfo(result),sourceMediaInfo:mediaInfo(metadata)};
 }finally{active=false;if(madeScratch)fs.rmSync(resolveContained(dir,path.relative(dir,scratch)).file,{recursive:true,force:true});if(!committed&&madeFolder)fs.rmSync(resolveContained(dir,path.relative(dir,folder)).file,{recursive:true,force:true});}
}
