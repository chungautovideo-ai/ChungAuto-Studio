import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {resolveContained} from './storage.mjs';
import {probeMediaMetadata} from './media-metadata.mjs';
import {audioClipTiming} from '../../editor/lib/audio-clips.js';
import {crossfadeMusicParts,musicLoopParts,repeatMusicOptions} from '../../editor/lib/music-loop.js';

const kit=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../editor');
const builtins=new Set(['upbeat-light','ambient-pad','beat-bass']);
function sourceFile(dir,src){
 if(typeof src!=='string')throw Error('Nguồn âm thanh không hợp lệ.');
 if(!src.startsWith('kit:'))return resolveContained(dir,src).file;
 const name=src.slice(4);if(!builtins.has(name))throw Error('Mã nhạc kit không hợp lệ.');
 const relative='assets/music/'+name+'.wav';
 // Build preserves an already-copied kit file in the project.
 return fs.existsSync(path.join(dir,relative))?resolveContained(dir,relative).file:resolveContained(kit,relative).file;
}

// Read-only counterpart to build's audioClips/music path. Does not synthesize assets.
export async function checkAudioMediaRanges(dir,{p,tm},{probe=probeMediaMetadata,validate=()=>{}}={}){
 const errors=[],warnings=[],sources=[],clips=[],snapshots=[],uses=[];
 const audio=p.audio||{};
 for(const c of audio.clips||[]){
  if(c.hidden)continue;
  if(!c.src){errors.push({group:'audio.clips',id:c.id,code:'SOURCE_UNAVAILABLE',message:'Clip âm thanh thiếu file nguồn.'});continue;}
  uses.push({group:'audio.clips',id:c.id,src:c.src,clip:c});
 }
 if(audio.music)uses.push({group:'audio.music',src:audio.music});
 const paths=[...new Set(uses.map(u=>u.src))];
 if(paths.length>40)throw Error('Kiểm audio tối đa40nguồn đang dùng mỗi bản dựng.');
 for(const src of paths){
  validate();const items=uses.filter(u=>u.src===src);let file,before,metadata;
  try{
   if(typeof src==='string'&&src.startsWith('kit:')&&items.some(i=>i.group!=='audio.music'))throw Error();
   file=sourceFile(dir,src);
   before=fs.statSync(file);if(!before.isFile())throw Error();
  }catch{errors.push({src,code:'SOURCE_UNAVAILABLE',message:'Nguồn âm thanh thiếu, không hợp lệ hoặc nằm ngoài dự án; chưa tự tạo/tải file.'});continue;}
  try{metadata=await probe(file,{validate});}catch{validate();errors.push({src,code:'PROBE_FAILED',message:'Không đọc được nguồn âm thanh bằng FFprobe.'});continue;}
  validate();const after=fs.statSync(file);
  if(before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ino!==after.ino)throw Error('Media âm thanh thay đổi trong lúc kiểm.');
  snapshots.push({src,file,size:after.size,mtimeMs:after.mtimeMs,ino:after.ino});
  sources.push({src,duration:metadata.duration,hasAudio:metadata.hasAudio===true,uses:items.length});
  if(!metadata.hasAudio||!Number.isFinite(metadata.duration)||metadata.duration<=0){errors.push({src,code:'AUDIO_REQUIRED',message:'Nguồn không có audio stream với thời lượng hợp lệ.'});continue;}
  for(const item of items){
   if(item.group==='audio.music'){
    try{if(audio.musicLoop==='repeat')musicLoopParts(tm.total,metadata.duration,repeatMusicOptions(audio,[]));else crossfadeMusicParts(tm.total,metadata.duration);}catch(error){errors.push({group:item.group,src,code:'INVALID_MUSIC_LOOP',message:error.message});}
    continue;
   }
   const c=item.clip,from=Number(c.from??0),at=Number(c.at??0),requested=c.dur===undefined||c.dur===''?metadata.duration-from:Number(c.dur);
   const timing=audioClipTiming(c,{...tm,total:tm.contentTotal},metadata.duration);
   if(!timing){errors.push({group:item.group,id:item.id,src,code:'INVALID_AUDIO_RANGE',message:'Clip không phát được: kiểm mốc nguồn, thời lượng, fade và vị trí trong video.'});continue;}
   if(from+requested>metadata.duration+.01)errors.push({group:item.group,id:item.id,src,code:'AUDIO_RANGE_TRUNCATED',sourceStart:from,sourceEnd:from+requested,availableDuration:metadata.duration,message:'Clip yêu cầu vượt file; renderer sẽ rút ngắn. Chọn lại khoảng âm thanh.'});
   if(requested>tm.contentTotal-timing.start+.01)warnings.push({group:item.group,id:item.id,src,code:'CLIPPED_AT_VIDEO_END',message:'Clip dừng ở cuối nội dung video, không kéo sang outro.'});
   if(timing.volume===0)warnings.push({group:item.group,id:item.id,src,code:'MUTED_CLIP',message:'Clip đang tắt âm lượng.'});
   clips.push({id:item.id,src,projectAt:at,outputStart:timing.start,outputEnd:timing.start+timing.duration,sourceStart:timing.from,sourceEnd:timing.from+timing.duration,volume:timing.volume});
  }
 }
 validate();for(const previous of snapshots){const current=fs.statSync(previous.file);if(sourceFile(dir,previous.src)!==previous.file||current.size!==previous.size||current.mtimeMs!==previous.mtimeMs||current.ino!==previous.ino)throw Error('Media âm thanh thay đổi sau khi kiểm.');}
 return {ok:errors.length===0,scope:'audio-clips-and-background-music',sources,clips,errors,warnings,audioListened:false,limits:'Chỉ kiểm file/stream/khoảng phát nhạc và audio.clips; chưa nghe, đo loudness, kiểm SFX tự sinh, tiếng A-roll/B-roll, chất lượng mix hoặc quyền nhạc.'};
}
