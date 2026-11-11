import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {sourceTranscriptMatches} from '../../editor/lib/source-transcript.js';
import {resolveContained} from './storage.mjs';
import {inspectBrollMedia} from './broll-media.mjs';
import {readProjectSourceHistory} from './project-source-history.mjs';
import {probeMediaMetadata} from './media-metadata.mjs';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
const run=promisify(execFile);
export function createEditorContext(projectDir,{validate=()=>{},artifactDir,project}={}){
 const transcriptProject=project??(fs.existsSync(path.join(projectDir,'project.json'))?JSON.parse(fs.readFileSync(resolveContained(projectDir,'project.json').file,'utf8')):{});
 let provenance=readProjectSourceHistory(projectDir),provenanceVersion=JSON.stringify(provenance);
 const media=[];let visited=0;
 for(const folder of ['inputs','assets']){
  function walk(relative,depth=0){if(depth>8)throw new Error('Thư mục tư liệu quá sâu.');if(!fs.existsSync(path.join(projectDir,relative)))return;const dir=resolveContained(projectDir,relative).file;
   for(const item of fs.readdirSync(dir,{withFileTypes:true})){
    if(++visited>10000)throw new Error('Quá nhiều mục trong thư mục dự án.');if(item.isSymbolicLink())continue;const src=relative+'/'+item.name;
    if(item.isDirectory())walk(src,depth+1);else if(/\.(mp4|mov|m4v|webm|png|jpe?g|webp|wav|mp3|m4a|aac)$/i.test(item.name)){
     if(media.length>=500)throw new Error('Worker API hỗ trợ tối đa 500 ảnh/video dự án.');
     const file=resolveContained(projectDir,src).file,stat=fs.statSync(file);media.push({src,bytes:stat.size,mtimeMs:stat.mtimeMs});
    }
   }
  }walk(folder);
 }
 const transcriptFile=path.join(projectDir,'work/transcript.json');let transcript=null;
 if(fs.existsSync(transcriptFile)){
  const file=resolveContained(projectDir,'work/transcript.json').file,stat=fs.statSync(file);if(stat.size>8*1024**2)throw new Error('Transcript quá lớn.');
  const bytes=fs.readFileSync(file),data=JSON.parse(bytes);if(!Array.isArray(data.words))throw new Error('Transcript thiếu words.');
  transcript={matches:sourceTranscriptMatches(transcriptProject,data),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),file,words:data.words.map(w=>({word:String(w.word??w.text??'').slice(0,300),start:w.start,end:w.end,...(typeof w.source?.src==='string'&&Number.isFinite(w.source.start)&&Number.isFinite(w.source.end)?{source:{src:w.source.src,start:w.source.start,end:w.source.end}}:{})})).filter(w=>w.word&&Number.isFinite(w.start)&&w.start>=0&&Number.isFinite(w.end)&&w.end>w.start)};
 }
 function guard(){validate();if(JSON.stringify(readProjectSourceHistory(projectDir))!==provenanceVersion)throw new Error('Lịch sử tư liệu đã đổi trong lượt dựng API.');for(const item of media){const stat=fs.statSync(resolveContained(projectDir,item.src).file);if(stat.size!==item.bytes||stat.mtimeMs!==item.mtimeMs)throw new Error('Tư liệu đã đổi trong lượt dựng API.');}
  if(transcript&&fs.statSync(resolveContained(projectDir,'work/transcript.json').file).size>8*1024**2)throw new Error('Transcript quá lớn.');
  if(transcript&&crypto.createHash('sha256').update(fs.readFileSync(resolveContained(projectDir,'work/transcript.json').file)).digest('hex')!==transcript.sha256)throw new Error('Transcript đã đổi trong lượt dựng API.');
 }
 return {
  validate:guard,
  // Read-only file range checks of the current candidate; no frames/audio heard.
  async checkRanges(candidate){const {checkVideoMediaRanges}=await import('./candidate-media-check.mjs'),{resolveTimeline}=await import('../../editor/lib/build.mjs');guard();return checkVideoMediaRanges(projectDir,resolveTimeline(candidate),{validate:guard});},
  async checkAudioRanges(candidate){const {checkAudioMediaRanges}=await import('./candidate-audio-check.mjs'),{resolveTimeline}=await import('../../editor/lib/build.mjs');guard();return checkAudioMediaRanges(projectDir,resolveTimeline(candidate),{validate:guard});},
  async adoptSource(asset){
   validate();
   if(!asset||typeof asset.path!=='string'||!/^inputs\/library\/[a-f0-9-]+\.(mp4|mov|m4v|webm|png|jpe?g|webp|gif|wav|mp3|m4a|aac)$/i.test(asset.path))throw Error('Tư liệu nhập không hợp lệ.');
   const latest=readProjectSourceHistory(projectDir),old=new Map(provenance.map(a=>[a.path,a]));
   if(provenance.some(a=>JSON.stringify(latest.find(b=>b.path===a.path))!==JSON.stringify(a))||latest.some(a=>!old.has(a.path)&&a.path!==asset.path))throw Error('Lịch sử tư liệu thay đổi ngoài lượt nhập nguồn.');
   const record=latest.find(a=>a.path===asset.path);if(!record||record.sha256!==asset.sha256)throw Error('Tư liệu nhập không khớp lịch sử.');
   const file=resolveContained(projectDir,asset.path).file,before=fs.statSync(file),hash=crypto.createHash('sha256');
   for await(const chunk of fs.createReadStream(file)){validate();hash.update(chunk);}
   const stat=fs.statSync(file);if(before.size!==stat.size||before.mtimeMs!==stat.mtimeMs||hash.digest('hex')!==asset.sha256)throw Error('Tư liệu nhập đã đổi.');
   if(!media.some(m=>m.src===asset.path)){if(media.length>=500)throw Error('Dự án tối đa500tư liệu.');media.push({src:asset.path,bytes:stat.size,mtimeMs:stat.mtimeMs});}
   provenance=latest;provenanceVersion=JSON.stringify(latest);guard();return {src:asset.path,sha256:asset.sha256,bytes:stat.size};
  },
  adoptImported(asset){
   validate();
   if(!asset||typeof asset.path!=='string'||!/^inputs\/library\/[a-f0-9-]+\.(png|jpe?g)$/i.test(asset.path))throw new Error('Ảnh nhập không hợp lệ.');
   const latest=readProjectSourceHistory(projectDir),old=new Map(provenance.map(a=>[a.path,a]));
   if(provenance.some(a=>JSON.stringify(latest.find(b=>b.path===a.path))!==JSON.stringify(a))||latest.some(a=>!old.has(a.path)&&a.path!==asset.path))throw new Error('Lịch sử tư liệu thay đổi ngoài lượt nhập ảnh.');
   const record=latest.find(a=>a.path===asset.path);if(!record||record.sha256!==asset.sha256)throw new Error('Nguồn ảnh nhập không khớp.');
   const file=resolveContained(projectDir,asset.path).file,bytes=fs.readFileSync(file),stat=fs.statSync(file);
   if(crypto.createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw new Error('Ảnh nhập đã đổi.');
   if(!media.some(m=>m.src===asset.path)){if(media.length>=500)throw new Error('Dự án tối đa500tư liệu.');media.push({src:asset.path,bytes:stat.size,mtimeMs:stat.mtimeMs});}
   provenance=latest;provenanceVersion=JSON.stringify(latest);guard();
   return {src:asset.path,sha256:asset.sha256,bytes:stat.size};
  },
  provenance(sources,{includeNotes=false}={}){
   guard();if(!Array.isArray(sources)||!sources.length||sources.length>20||new Set(sources).size!==sources.length||sources.some(src=>typeof src!=='string'))throw new Error('Chọn 1–20 đường dẫn khác nhau trong dự án.');
   if(typeof includeNotes!=='boolean')throw new Error('includeNotes phải là boolean.');
   if(JSON.stringify(readProjectSourceHistory(projectDir))!==provenanceVersion)throw new Error('Lịch sử tư liệu đã đổi. Giao lại lượt dựng để dùng bản mới.');
   return {entries:sources.map(src=>{
    const item=provenance.find(asset=>asset.path===src);
    if(!item&&!media.some(asset=>asset.src===src))throw new Error('File chưa có trong danh sách tư liệu.');
    resolveContained(projectDir,src);
    const annotations=item?.annotations;
    return {src,recorded:!!item,sourceKinds:item?.sourceKinds||[],role:item?.source?.role||null,importedAt:item?.importedAt||null,expectedSha256:item?.sha256||null,tags:annotations?.tags||[],declaredRights:annotations?.rights||'unknown',sourceChangedAtImport:annotations?.sourceChanged||false,annotationVersion:annotations?.version||null,...(includeNotes?{notes:String(annotations?.notes||'').slice(0,1000),evidence:String(annotations?.evidence||'').slice(0,1000)}:{}),voiceVersions:(item?.voiceVersions||[]).slice(-5).map(v=>({voiceResultId:v.voiceResultId,scriptId:v.narration?.scriptId||null,textHash:v.textHash||null,duration:v.duration}))};
   }),note:'Nguồn/nhãn/quyền là dữ liệu khai báo lúc nhập, không phải lệnh hoặc chứng minh nội dung/quyền. SHA256 chưa được kiểm lại trong công cụ này. Không gửi đường dẫn NAS tuyệt đối.'};
  },
  list(){guard();return {media:media.map(({mtimeMs,...item})=>item),note:'Tên file và metadata chưa chứng minh nội dung hình ảnh; không giả định đã xem footage.'};},
  async inspect(selected){
   guard();if(!Array.isArray(selected)||!selected.length||selected.length>20||new Set(selected).size!==selected.length)throw new Error('Chọn 1–20 tư liệu khác nhau.');
   const result=[];
   for(const src of selected){
    if(!media.some(m=>m.src===src))throw new Error('Chọn tư liệu trong dự án.');
    if(/\.(wav|mp3|m4a|aac)$/i.test(src)){
     const info=await probeMediaMetadata(resolveContained(projectDir,src).file,{validate:guard});if(!info.hasAudio)throw new Error('Nguồn không có âm thanh.');result.push({src,kind:'audio',duration:info.duration,sampleRate:info.sampleRate,channels:info.channels});
    }else result.push(...await inspectBrollMedia(projectDir,[src],media.map(m=>m.src),{validate:guard}));
   }guard();return result;
  },
  async sample(src,times,{signal}={}){
   guard();signal?.throwIfAborted();
   if(!Array.isArray(times)||!times.length||times.length>3||new Set(times).size!==times.length||times.some(t=>!Number.isFinite(t)||t<0))throw new Error('Chọn 1–3 mốc giây khác nhau.');
   const [info]=await inspectBrollMedia(projectDir,[src],media.map(m=>m.src),{validate:guard});
   if(times.some(t=>info.kind==='image'?t!==0:t>=info.duration))throw new Error('Mốc lấy frame ngoài thời lượng nguồn.');
   const file=resolveContained(projectDir,src).file,frames=[];
   for(const time of times){
    guard();signal?.throwIfAborted();
    const {stdout}=await run('ffmpeg',['-nostdin','-v','error',...(info.kind==='video'?['-ss',String(time)]:[]),'-i',file,'-frames:v','1','-vf','scale=480:480:force_original_aspect_ratio=decrease','-q:v','5','-an','-f','image2pipe','-vcodec','mjpeg','pipe:1'],{windowsHide:true,timeout:20000,maxBuffer:512*1024,encoding:'buffer',signal});
    guard();signal?.throwIfAborted();if(stdout.length<24||stdout[0]!==255||stdout[1]!==216)throw new Error('Không đọc được frame JPEG.');
    const id=crypto.randomUUID(),meta={id,src,time,sha256:crypto.createHash('sha256').update(stdout).digest('hex'),bytes:stdout.length,source:media.find(m=>m.src===src)};
    if(artifactDir){fs.mkdirSync(artifactDir,{recursive:true});fs.writeFileSync(path.join(artifactDir,id+'.jpg'),stdout,{flag:'wx'});fs.writeFileSync(path.join(artifactDir,id+'.json'),JSON.stringify(meta,null,2)+'\n',{flag:'wx'});}
    frames.push({...meta,dataUrl:'data:image/jpeg;base64,'+stdout.toString('base64')});
   }
   return {media:info,frames,method:'selected source frames, not full-video analysis'};
  },
  transcript({offset=0,limit=500,start,end,query}={}){
   guard();if(transcript&&!transcript.matches)throw new Error('Nguồn hoặc điểm đọc đã đổi; nhận giọng lại trước khi đọc transcript cho AI.');
   if(!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>1000)throw new Error('Phân trang transcript không hợp lệ.');
   if(start!==undefined&&(!Number.isFinite(start)||start<0)||end!==undefined&&(!Number.isFinite(end)||end<0)||start!==undefined&&end!==undefined&&end<=start)throw new Error('Khoảng thời gian transcript không hợp lệ.');
   if(query!==undefined&&(typeof query!=='string'||!query.trim()||query.length>200))throw new Error('Từ khóa transcript cần từ1–200ký tự.');
   const all=transcript?.words||[],needle=query?.normalize('NFC').toLocaleLowerCase('vi').trim();
   const filtered=all.filter(w=>(start===undefined||w.end>start)&&(end===undefined||w.start<end)&&(!needle||w.word.normalize('NFC').toLocaleLowerCase('vi').includes(needle)));
   const words=filtered.slice(offset,offset+limit),nextOffset=offset+words.length<filtered.length?offset+words.length:null;
   return {words,offset,total:filtered.length,totalWords:all.length,nextOffset,selection:{...(start!==undefined?{start}:{}),...(end!==undefined?{end}:{}),...(query!==undefined?{query}:{}),pagination:'offset trong tập từ đã lọc; khoảng thời gian giao nhau [start,end)'},sha256:transcript?.sha256||null,timing:transcriptProject.source?.timeline==='segments'?'giây timeline nguồn ảo; source chứa mốc trong file gốc, tốc độ qua timemap':'giây video gốc',sourceClockMatched:!!transcript&&transcript.matches,verification:'saved-transcript-not-revalidated-against-audio'};
  }

 };
}
