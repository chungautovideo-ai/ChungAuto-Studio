import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {resolveContained} from './storage.mjs';import {buildProject} from '../../editor/lib/build.mjs';
import {inspectChatSources} from './chat-sources.mjs';
import {copySourceSurvey} from './source-survey.mjs';
import {inspectPrimaryMedia} from './primary-media.mjs';
import {appendPrimaryClips} from '../../editor/lib/primary-clips.js';
const run=promisify(execFile);
export async function createNasProject(root,workspaceStore,storage,{relative,workspaceId,format,name,text,selected,additionalVideos=[],previewManifest,batch,validate:validateRequest=()=>{}}={}){
 validateRequest();
 const context=workspaceStore.active();if(context.id!==workspaceId)throw Object.assign(new Error('Workspace đã đổi. Mở lại kho nguồn.'),{status:409});
 if(!Array.isArray(additionalVideos)||additionalVideos.length>19||additionalVideos.some(v=>typeof v!=='string')||new Set(additionalVideos).size!==additionalVideos.length||additionalVideos.includes(selected))throw new Error('Chọn tối đa20video khác nhau, gồm video chính.');
 if(additionalVideos.length&&text===undefined)throw new Error('Nhiều A-roll cần danh sách đường dẫn đã kiểm tra.');
 let source,sources;
 if(text!==undefined){
  sources=await inspectChatSources(String(text).slice(0,10000));
  if(!sources.length||sources.some(s=>s.status!=='ready'))throw new Error('Nguồn chưa sẵn sàng. Kiểm tra đường dẫn trước khi tạo dự án.');
  const declared=sources.find(s=>s.files?.some(f=>f.path===selected));
  if(!declared)throw new Error('Video chính không có trong danh sách nguồn vừa kiểm tra.');
  source=declared.kind==='file'?resolveContained(path.dirname(declared.path),path.basename(declared.path)):resolveContained(declared.path,path.relative(declared.path,selected));
 }else{
  if(!context.nasRoot)throw new Error('Chưa cấu hình kho NAS / thư mục dùng chung.');
  source=resolveContained(context.nasRoot,relative);
 }
 const ext=path.extname(source.file).toLowerCase();
 if(!/^\.(mp4|mov|m4v|webm)$/.test(ext)||!fs.statSync(source.file).isFile())throw new Error('Chọn video MP4, MOV, M4V hoặc WebM làm nguồn chính.');
 if(fs.lstatSync(selected||path.resolve(context.nasRoot,relative)).isSymbolicLink())throw new Error('Chọn file nguồn gốc thay vì liên kết.');
 for(const choice of additionalVideos){
  const declared=sources.find(s=>s.files?.some(f=>f.path===choice));
  if(!declared)throw new Error('Video bổ sung không có trong danh sách nguồn vừa kiểm tra.');
  const entry=declared.kind==='file'?resolveContained(path.dirname(declared.path),path.basename(declared.path)):resolveContained(declared.path,path.relative(declared.path,choice));
  if(!/\.(mp4|mov|m4v|webm)$/i.test(entry.file)||fs.lstatSync(choice).isSymbolicLink()||!fs.statSync(entry.file).isFile())throw new Error('Video bổ sung không hợp lệ.');
 }
 const directory=path.join(root,'workspace/content/_intake',crypto.randomUUID());fs.mkdirSync(directory,{recursive:true});
 const validate=()=>{validateRequest();const current=workspaceStore.active();if(current.id!==workspaceId||current.nasRoot!==context.nasRoot)throw Object.assign(new Error('Workspace hoặc kho nguồn đã đổi trong khi tạo dự án.'),{status:409});};
 try{
  const stamp={workspaceId:context.id,contentos:{schemaVersion:1,workspaceId:context.id,brandSnapshot:context.brand,industrySnapshot:context.industry,pendingIntake:true}};
  if(batch)stamp.contentos.intakeBatch={taskId:batch.taskId,index:batch.index};
  fs.writeFileSync(path.join(directory,'project.json'),JSON.stringify(stamp));
  const imported=await storage.attachSelected(path.relative(root,directory),[{status:'ready',kind:'file',path:source.file,role:'aroll',files:[{path:source.file}]}],source.file,{workspaceId,validate});
  let survey=null;
  if(previewManifest){if(!sources)throw new Error('Ảnh khảo sát cần nguồn đã khai báo.');survey=copySourceSurvey(root,workspaceId,previewManifest,selected,sources,path.join(directory,'work/source-survey'));}
  if(sources)fs.writeFileSync(path.join(directory,'work','source-request.json'),JSON.stringify({text:String(text).slice(0,10000),selected,additionalVideos,sources,survey:survey?'work/source-survey/preview.json':null,createdAt:new Date().toISOString()},null,2)+'\n');
  const copied=path.join(directory,imported.asset.path);
  const {stdout}=await run('ffprobe',['-v','error','-show_entries','stream=codec_type,width,height:stream_tags=rotate:stream_side_data=rotation:format=duration','-of','json',copied],{windowsHide:true,timeout:30000,maxBuffer:1024*1024});
  const info=JSON.parse(stdout),video=info.streams?.find(s=>s.codec_type==='video'),duration=Math.round(Number(info.format?.duration)*1000)/1000;
  if(!video||!Number.isFinite(duration)||duration<=0||!(video.width>0&&video.height>0))throw new Error('Không đọc được video nguồn hợp lệ.');
  const rotated=Math.abs(Number(video.tags?.rotate||video.side_data_list?.find(d=>d.rotation!=null)?.rotation||0))%180===90;
  const landscape=rotated?video.height>video.width:video.width>video.height;
  const title=String(name||path.basename(source.file,ext)).trim().slice(0,100)||'Video NAS';
  let project={...stamp,version:1,title,format:['9:16','16:9'].includes(format)?format:landscape?'16:9':'9:16',source:{video:imported.asset.path,width:video.width,height:video.height,duration,hasAudio:info.streams.some(s=>s.codec_type==='audio')},camera:{scale:1,x:0,y:0,faceY:0.36},segments:[{id:'s1',in:0,out:duration,keep:true,text:''}],texts:[],zooms:[],scenes:[],brolls:[],audio:{voice:1,music:'',musicVolume:0.1,sfx:[],sfxVolume:0.5,autoSfx:true}};
  if(additionalVideos.length){
   const appended=[];for(const choice of additionalVideos){validate();const attached=await storage.attachSelected(path.relative(root,directory),sources,choice,{workspaceId,validate});appended.push(attached.asset.path);}
   const assets=await inspectPrimaryMedia(directory,project,appended,[project.source.video,...appended],{validate});
   project=appendPrimaryClips(project,appended,assets).project;
  }
  delete project.contentos.pendingIntake;validate();fs.writeFileSync(path.join(directory,'project.json'),JSON.stringify(project,null,2)+'\n');buildProject(directory,project);validate();
  const day=path.join(root,'workspace/content',new Date().toISOString().slice(0,10));fs.mkdirSync(day,{recursive:true});
  const destination=path.join(day,'nas-'+crypto.randomUUID());
  if(survey){survey.frames=survey.frames.map((frame,i)=>({...frame,path:path.relative(root,path.join(destination,'work/source-survey',`frame-${i+1}.jpg`)).replaceAll('\\','/')}));delete survey.manifestPath;fs.writeFileSync(path.join(directory,'work/source-survey/preview.json'),JSON.stringify(survey,null,2)+'\n');}
  fs.renameSync(directory,destination);
  return {ok:true,dir:path.relative(root,destination).replaceAll('\\','/'),project,asset:imported.asset};
 }catch(error){fs.rmSync(directory,{recursive:true,force:true});throw error;}
}
