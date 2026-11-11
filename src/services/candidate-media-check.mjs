import fs from 'node:fs';import path from 'node:path';
import {resolveContained} from './storage.mjs';
import {probeMediaMetadata} from './media-metadata.mjs';
import {checkSessionCandidate} from './session-candidate-check.mjs';
import {assertProjectRevision} from './project-revisions.mjs';
import {resolveTimeline} from '../../editor/lib/build.mjs';
import {checkAudioMediaRanges} from './candidate-audio-check.mjs';

// Checks only active A-roll/B-roll file ranges. No frames, render or edits.
export async function checkVideoMediaRanges(dir,timeline,{probe=probeMediaMetadata,validate=()=>{}}={}){
 const uses=[...timeline.tm.segs.map(s=>({group:'segments',id:s.id,src:s.src||timeline.p.source.video,from:s.mediaStart??s.in,length:s.out-s.in,outputStart:s.outStart,outputEnd:s.outEnd})),
  ...timeline.brolls.map(b=>({group:'brolls',id:b.id,src:b.src,from:Number(b.mediaStart)||0,length:b.dur*(Number(b.speed)>0?Math.max(.25,Math.min(4,Number(b.speed))):1),outputStart:b.start,outputEnd:b.start+b.dur}))];
 const paths=[...new Set(uses.map(u=>u.src))];if(paths.length>40)throw Error('Kiểm media tối đa40nguồn đang dùng mỗi bản dựng.');
 const sources=[],errors=[],snapshots=[];
 for(const src of paths){
  validate();const items=uses.filter(u=>u.src===src);let file,before,metadata;
  try{file=resolveContained(dir,src).file;before=fs.statSync(file);}catch{errors.push({src,code:'SOURCE_UNAVAILABLE',message:'Nguồn không có hoặc nằm ngoài dự án.'});continue;}
  try{metadata=await probe(file,{validate});}catch(error){validate();errors.push({src,code:'PROBE_FAILED',message:'Không đọc được metadata media. Kiểm file hoặc FFprobe.'});continue;}
  validate();const after=fs.statSync(file);if(before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ino!==after.ino)throw Error('Media thay đổi trong lúc kiểm; chạy lại sau khi nguồn ổn định.');
  snapshots.push({src,file,size:after.size,mtimeMs:after.mtimeMs,ino:after.ino});
  sources.push({src,kind:metadata.kind,duration:metadata.duration,uses:items.length,...(metadata.colorMetadata?{colorMetadata:metadata.colorMetadata}:{})});
  for(const item of items){
   if(!Number.isFinite(item.from)||!Number.isFinite(item.length)||item.from<0||item.length<=0){errors.push({group:item.group,id:item.id,src,code:'INVALID_RANGE',message:'Mốc nguồn hoặc thời lượng không hợp lệ.'});continue;}
   if(metadata.kind==='image'&&item.group==='brolls')continue;
   if(metadata.kind!=='video'){errors.push({group:item.group,id:item.id,src,code:'VIDEO_REQUIRED',message:'Đoạn video đang dùng nguồn không phải video.'});continue;}
   const end=item.from+item.length;
   if(!Number.isFinite(metadata.duration)||end>metadata.duration+.01)errors.push({group:item.group,id:item.id,src,code:'SOURCE_RANGE_EXCEEDED',sourceStart:item.from,sourceEnd:end,availableDuration:metadata.duration,message:'Khoảng phát vượt file nguồn; rút ngắn hoặc chọn lại đoạn, không kéo đứng hình.'});
  }
 }
 validate();for(const previous of snapshots){const current=fs.statSync(resolveContained(dir,previous.src).file);if(current.size!==previous.size||current.mtimeMs!==previous.mtimeMs||current.ino!==previous.ino)throw Error('Media thay đổi sau khi kiểm; chạy lại sau khi nguồn ổn định.');}
 return {ok:errors.length===0,scope:'active-segments-and-brolls',sources,activeItems:uses.length,errors,framesViewed:false,audioListened:false,limits:'Chỉ kiểm file và thời lượng A-roll/B-roll đang dùng theo metadata thật; không kiểm nội dung hình, audio/music/SFX, font/asset HTML hoặc quyền tư liệu.'};
}

export async function checkSessionCandidateMedia(root,jobPath,{claimId,window,probe,includeVideo=true,includeAudio=false}={}){
 const dir=resolveContained(root,jobPath).file,jobFile=path.join(dir,'work/ai-job.json'),jobBytes=fs.readFileSync(jobFile),job=JSON.parse(jobBytes);
 const report=checkSessionCandidate(root,jobPath,{claimId,window}),target=job.kind==='revise'?resolveContained(root,job.project).file:dir;
 const candidateFile=resolveContained(root,job.candidate).file;
 const validate=()=>{if(!fs.readFileSync(jobFile).equals(jobBytes))throw Error('Việc đã đổi khi kiểm media.');assertProjectRevision(path.join(target,'project.json'),job.baseRevision);assertProjectRevision(candidateFile,report.candidateRevision);};
 validate();const timeline=resolveTimeline(JSON.parse(fs.readFileSync(candidateFile)));
 const media=includeVideo?await checkVideoMediaRanges(target,timeline,{probe,validate}):undefined;
 const audioMedia=includeAudio?await checkAudioMediaRanges(target,timeline,{probe,validate}):undefined;validate();
 return {...report,ok:report.ok&&(media?.ok??true)&&(audioMedia?.ok??true),...(media?{media}:{}),...(audioMedia?{audioMedia}:{}),limits:report.limits+' Có kiểm file theo phạm vi media/audioMedia được trả về; chưa xem/nghe.'};
}
