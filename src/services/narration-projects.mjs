import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {attachVoiceResult,voiceAssetContext} from './voice-intake.mjs';
import {buildProject} from '../../editor/lib/build.mjs';
const run=promisify(execFile);
const creating=new Set();

export async function createNarrationProject(root,workspaceStore,storage,news,{workspaceId,newsBriefId,voiceId,format}={}){
 const workspace=workspaceStore.active();
 const validate=()=>{if(workspaceStore.active().id!==workspaceId)throw Object.assign(new Error('Workspace đã đổi. Mở lại bản tin.'),{status:409});};
 validate();if(!['9:16','16:9'].includes(format))throw new Error('Chọn tỷ lệ 9:16 hoặc 16:9.');
 const brief=news.brief(workspaceId,newsBriefId);
 if(creating.has(root))throw Object.assign(new Error('Đang tạo một dự án từ voice. Đợi hoàn tất rồi thử lại.'),{status:409});
 const staging=path.join(root,'workspace/content/_intake',crypto.randomUUID());fs.mkdirSync(staging,{recursive:true});
 creating.add(root);
 try{
  const stamp={workspaceId,contentos:{schemaVersion:1,workspaceId,brandSnapshot:workspace.brand,industrySnapshot:workspace.industry,origin:'approved-news-narration',visualsPending:true}};
  fs.writeFileSync(path.join(staging,'project.json'),JSON.stringify(stamp));
  const relative=path.relative(root,staging).replaceAll('\\','/');
  news.bindProject(workspaceId,relative,brief.id,null);
  const imported=await attachVoiceResult(root,storage,news,{workspaceId,dir:relative,id:voiceId,expectedNewsId:brief.id,validate});
  const {stdout}=await run('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type','-of','json',path.join(staging,imported.asset.path)],{windowsHide:true,timeout:30000,maxBuffer:1024*1024});
  const probe=JSON.parse(stdout),voiceDuration=Number(probe.format?.duration);
  if(!probe.streams?.some(s=>s.codec_type==='audio')||!Number.isFinite(voiceDuration)||voiceDuration<=0||voiceDuration>1800)throw new Error('Cần audio hợp lệ dài tối đa 30 phút.');
  validate();const duration=Math.ceil(voiceDuration*30)/30,[width,height]=format==='16:9'?[1920,1080]:[1080,1920];
  const file='inputs/narration-background.mp4';
  await run('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i',`color=c=black:s=${width}x${height}:r=30`,'-t',String(duration),'-an','-c:v','libx264','-preset','ultrafast','-crf','35','-pix_fmt','yuv420p',path.join(staging,file)],{windowsHide:true,timeout:120000,maxBuffer:1024*1024});
  validate();const voiceSource=voiceAssetContext(staging,imported.asset.path,brief);
  const project={...stamp,version:1,title:brief.payload.title,format,source:{video:file,width,height,duration,hasAudio:false},camera:{scale:1,x:0,y:0,faceY:0.36},segments:[{id:'s1',in:0,out:duration,keep:true,text:''}],texts:[],zooms:[],scenes:[],brolls:[],audio:{voice:0,music:'',musicVolume:0.1,sfx:[],sfxVolume:0.5,clips:[{id:'voice-'+crypto.randomUUID(),src:imported.asset.path,at:0,from:0,vol:1,sourceDuration:voiceDuration,voiceSource}]}};
  fs.writeFileSync(path.join(staging,'project.json'),JSON.stringify(project,null,2)+'\n');
  fs.writeFileSync(path.join(staging,'work/narration-project.json'),JSON.stringify({schemaVersion:1,newsBriefId:brief.id,voiceResultId:voiceId,voiceDuration,visualsPending:true,note:'Nền đen tạm theo thời lượng voice; cần thêm cảnh trám. Chưa căn lời hoặc tạo phụ đề.'},null,2)+'\n');
  buildProject(staging,project);validate();const day=path.join(root,'workspace/content',new Date().toISOString().slice(0,10));fs.mkdirSync(day,{recursive:true});const target=path.join(day,'narration-'+crypto.randomUUID());fs.renameSync(staging,target);
  return {ok:true,dir:path.relative(root,target).replaceAll('\\','/'),project,visualsPending:true};
 }catch(error){fs.rmSync(staging,{recursive:true,force:true});throw error;}finally{creating.delete(root);}
}
