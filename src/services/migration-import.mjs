import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {previewMigration} from './migration-preview.mjs';
import {resolveContained} from './storage.mjs';
import {projectRevision} from './project-revisions.mjs';
import {createProjectVariant} from './project-variants.mjs';
import {convertAievProject} from './aiev-project-adapter.mjs';
import {probeMediaMetadata} from './media-metadata.mjs';

export async function importVekProject(root,workspaceStore,body={},options={}){
 const workspaceId=workspaceStore.active().id;
 const conflict=message=>{throw Object.assign(new Error(message),{status:409});};
 if(body.workspaceId!==workspaceId)conflict('Workspace đã đổi. Khảo sát lại trước khi nhập.');
 const entry=previewMigration(root,workspaceId).sources.find(s=>s.app==='vek')?.entries.find(e=>e.id===body.id);
 if(!entry||entry.format!=='vek-project')conflict('Không tìm thấy dự án VEK hỗ trợ nhập.');
 if(entry.metadataHash!==body.metadataHash)conflict('Dự án nguồn đã đổi. Khảo sát lại trước khi nhập.');
 const configFile=path.join(root,'config/sources.local.json');
 const configText=fs.existsSync(configFile)?fs.readFileSync(configFile,'utf8'):'';
 const config=configText?JSON.parse(configText):{};
 const sourceRoot=resolveContained(config.vekRoot||path.join(path.dirname(root),'video-edit-kit'),'workspace/content').file;
 const source=resolveContained(sourceRoot,entry.relative).file;
 const project=JSON.parse(fs.readFileSync(path.join(source,'project.json'),'utf8'));
 const validate=()=>{
  options.signal?.throwIfAborted();
  if(workspaceStore.active().id!==workspaceId)conflict('Workspace đã đổi khi nhập dự án.');
  if((fs.existsSync(configFile)?fs.readFileSync(configFile,'utf8'):'')!==configText)conflict('Cấu hình nguồn đã đổi khi nhập dự án.');
  if(projectRevision(path.join(resolveContained(sourceRoot,entry.relative).file,'project.json'))!==body.metadataHash)conflict('Dự án nguồn đã đổi khi nhập.');
 };
 validate();
 return createProjectVariant(root,workspaceStore,{workspaceId,dir:entry.relative,revision:entry.metadataHash,format:project.format||'9:16',title:project.title||path.basename(source)},{signal:options.signal,validate,migrationSource:{root:sourceRoot,relative:entry.relative}});
}

export async function importAievProject(root,workspaceStore,body={},options={}){
 const workspaceId=workspaceStore.active().id,fail=message=>{throw Object.assign(new Error(message),{status:409});};
 if(body.workspaceId!==workspaceId)fail('Workspace đã đổi. Khảo sát lại.');
 const entry=previewMigration(root,workspaceId).sources.find(s=>s.app==='aiev')?.entries.find(e=>e.id===body.id);
 if(!entry||entry.metadataHash!==body.metadataHash)fail('Dự án AIEV đã đổi hoặc không tìm thấy. Khảo sát lại.');
 const configFile=path.join(root,'config/sources.local.json'),configText=fs.existsSync(configFile)?fs.readFileSync(configFile,'utf8'):'',config=configText?JSON.parse(configText):{};
 const sourceRoot=resolveContained(config.aievRoot||path.join(path.dirname(root),'AIEVv2'),'video-projects').file;
 const source=resolveContained(sourceRoot,entry.relative).file,metadataFile=path.join(source,'meta.json');
 const project=convertAievProject(JSON.parse(fs.readFileSync(metadataFile,'utf8')));
 const validate=()=>{
  options.signal?.throwIfAborted();
  if(workspaceStore.active().id!==workspaceId||(fs.existsSync(configFile)?fs.readFileSync(configFile,'utf8'):'')!==configText)fail('Workspace hoặc cấu hình nguồn đã đổi.');
  if(projectRevision(path.join(resolveContained(sourceRoot,entry.relative).file,'meta.json'))!==body.metadataHash)fail('Dự án AIEV đã đổi khi nhập.');
 };
 validate();
 if(project.source.timeline==='segments'){
  const cache=new Map();for(const segment of project.segments){if(!cache.has(segment.src))cache.set(segment.src,await probeMediaMetadata(resolveContained(source,segment.src).file,{validate}));const m=cache.get(segment.src);if(m.kind!=='video'||segment.mediaStart+segment.out-segment.in>m.duration+.01)throw new Error('Khoảng cắt vượt thời lượng nguồn '+segment.src);segment.mediaInfo={width:m.width,height:m.height,duration:m.duration,hasAudio:m.hasAudio};}
  const first=project.segments[0].mediaInfo;project.source={...project.source,width:first.width,height:first.height,duration:project.segments.at(-1).out,hasAudio:project.segments.some(s=>s.mediaInfo.hasAudio)};
 }else{
 const media=await probeMediaMetadata(resolveContained(source,project.source.video).file,{validate});
 if(media.kind!=='video'||project.segments.some(s=>s.out>media.duration+.01))throw new Error('Khoảng cắt vượt thời lượng video nguồn.');
 project.source={...project.source,width:media.width,height:media.height,duration:media.duration,hasAudio:media.hasAudio};
 }
 if(project.watermark){const logo=await probeMediaMetadata(resolveContained(source,project.watermark.file).file,{validate});if(logo.kind!=='image')throw new Error('Watermark AIEV cần file ảnh hợp lệ.');}
 if(project.audio.music){const music=await probeMediaMetadata(resolveContained(source,project.audio.music).file,{validate});if(music.kind!=='audio'||!music.hasAudio)throw new Error('Nhạc AIEV cần file audio hợp lệ.');}
 for(const clip of project.audio.clips||[]){
  const audio=await probeMediaMetadata(resolveContained(source,clip.src).file,{validate});
  if(audio.kind!=='audio'||!audio.hasAudio)throw new Error('Track AIEV cần file audio hợp lệ.');
  if(clip.from>=audio.duration)throw new Error('Điểm bỏ đầu audio AIEV vượt thời lượng file.');
  if(clip.fadeOut&&audio.duration-clip.from>clip.dur+.001)throw new Error('Fade ra SFX vượt timeline; chưa chuyển chính xác trường hợp này.');
  clip.dur=Math.min(clip.dur,audio.duration-clip.from);
  if((clip.fadeIn||0)+(clip.fadeOut||0)>clip.dur+.001)throw new Error('Fade SFX chồng nhau hoặc vượt độ dài; chưa chuyển chính xác trường hợp này.');
 }
 return createProjectVariant(root,workspaceStore,{workspaceId,revision:body.metadataHash,format:project.format,title:project.title},{signal:options.signal,validate,migrationSource:{root:sourceRoot,relative:entry.relative,app:'aiev',metadataFile:'meta.json',projectOverride:project}});
}

export async function importStudioProject(root,workspaceStore,body={},options={}){
 const workspaceId=workspaceStore.active().id,fail=message=>{throw Object.assign(new Error(message),{status:409});};
 if(body.workspaceId!==workspaceId)fail('Workspace đã đổi. Khảo sát lại.');
 const entry=previewMigration(root,workspaceId).sources.find(s=>s.app==='studio')?.entries.find(e=>e.id===body.id);
 if(!entry||entry.format!=='studio-composition'||body.metadataHash!==entry.metadataHash||body.projectHash!==entry.projectHash)fail('Job hoặc composition Studio đã đổi. Khảo sát lại.');
 const configFile=path.join(root,'config/sources.local.json'),configText=fs.existsSync(configFile)?fs.readFileSync(configFile,'utf8'):'',config=configText?JSON.parse(configText):{};
 const jobsRoot=fs.realpathSync(config.studioJobsRoot||path.join(os.homedir(),'ChungAutoVideoFactory/jobs'));
 const relative=path.join(entry.relative,'05_plan/studio/composition'),source=resolveContained(jobsRoot,relative).file;
 const project=JSON.parse(fs.readFileSync(path.join(source,'project.json'),'utf8').replace(/^\uFEFF/,''));
 const validate=()=>{
  options.signal?.throwIfAborted();
  if(workspaceStore.active().id!==workspaceId||(fs.existsSync(configFile)?fs.readFileSync(configFile,'utf8'):'')!==configText)fail('Workspace hoặc cấu hình nguồn đã đổi.');
  if(projectRevision(resolveContained(jobsRoot,path.join(entry.relative,'job.json')).file)!==body.metadataHash||projectRevision(resolveContained(jobsRoot,path.join(relative,'project.json')).file)!==body.projectHash)fail('Job hoặc composition Studio đã đổi khi nhập.');
 };
 validate();
 return createProjectVariant(root,workspaceStore,{workspaceId,revision:body.projectHash,format:project.format||'9:16',title:project.title||entry.title},{signal:options.signal,validate,migrationSource:{root:jobsRoot,relative,app:'studio',projectOverride:project}});
}
