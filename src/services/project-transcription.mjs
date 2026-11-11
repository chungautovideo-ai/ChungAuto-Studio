import fs from 'node:fs';import path from 'node:path';
import {resolveContained} from './storage.mjs';
import {probeMediaMetadata} from './media-metadata.mjs';
import {transcribe} from '../../editor/lib/whisper.mjs';
import {sourceTranscriptClock} from '../../editor/lib/source-transcript.js';
export function mapSourceTranscripts(project,transcripts){
 const segments=project.segments.slice().sort((a,b)=>a.in-b.in),words=[];
 for(const [i,s] of segments.entries()){
  if(!s.src||!Number.isFinite(s.in)||!Number.isFinite(s.out)||s.out<=s.in||!Number.isFinite(s.mediaStart)||s.mediaStart<0||i&&s.in<segments[i-1].out-1e-9)throw new Error('Timeline nhiều nguồn không hợp lệ để nhận giọng.');
  for(const w of transcripts[s.src]?.words??[]){
   if(typeof w.word!=='string'||!Number.isFinite(w.start)||!Number.isFinite(w.end)||w.end<=w.start)throw new Error('Từ nhận giọng không hợp lệ.');
   const a=Math.max(s.mediaStart,w.start),b=Math.min(s.mediaStart+s.out-s.in,w.end);if(b<=a)continue;
   words.push({word:w.word,start:s.in+a-s.mediaStart,end:s.in+b-s.mediaStart,source:{src:s.src,start:a,end:b}});
  }
 }
 return {engine:'whisper.cpp-multisource',timeline:'segments',sourceClock:sourceTranscriptClock(project),language:Object.values(transcripts)[0]?.language??'vi',createdAt:new Date().toISOString(),words};
}
export async function transcribeProject(root,dir,{language='vi',onProgress=()=>{},validate=()=>{},recognize=transcribe,probe=probeMediaMetadata,signal}={}){
 validate();signal?.throwIfAborted();const pjFile=path.join(dir,'project.json'),snapshot=fs.readFileSync(pjFile,'utf8'),project=JSON.parse(snapshot);
 const check=()=>{validate();signal?.throwIfAborted();if(fs.readFileSync(pjFile,'utf8')!==snapshot)throw new Error('Bản dựng đã đổi khi nhận giọng. Giữ kết quả cũ; nhận giọng lại với bản mới.');};
 if(project.source?.timeline!=='segments'){
  const source=resolveContained(dir,project.source.video).file,before=fs.statSync(source),work=path.join(dir,'work');fs.mkdirSync(work,{recursive:true});const tmp=fs.mkdtempSync(path.join(work,'asr-single-'));
  try{
   const data=await recognize(root,source,path.join(tmp,'transcript.json'),{language,onProgress,timeoutMs:900000,signal,validate:check});check();
   const current=resolveContained(dir,project.source.video).file,after=fs.statSync(current);if(current!==source||before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ino!==after.ino)throw new Error('File nguồn đã thay đổi khi nhận giọng.');
   fs.writeFileSync(path.join(tmp,'publish.json'),JSON.stringify(data,null,1));check();fs.renameSync(path.join(tmp,'publish.json'),path.join(work,'transcript.json'));return data;
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
 }
 const sources=[...new Set((project.segments??[]).map(s=>s.src))];if(!sources.length||sources.length>64||sources.some(s=>typeof s!=='string'))throw new Error('Nhận giọng tối đa64nguồn video.');
 // Validate virtual intervals before starting an expensive recognizer.
 mapSourceTranscripts(project,{});
 const work=path.join(dir,'work');fs.mkdirSync(work,{recursive:true});const tmp=fs.mkdtempSync(path.join(work,'asr-sources-')),results={},identities=[];
 try{
  for(const [i,src] of sources.entries()){
   check();const {file}=resolveContained(dir,src),before=fs.statSync(file),info=await probe(file);check();identities.push({src,file,before});
   if(info.kind!=='video'||info.duration>7200)throw new Error('Nhận giọng nhiều nguồn nhận video tối đa2giờ mỗi file.');
   const segments=project.segments.filter(s=>s.src===src);if(segments.some(s=>s.mediaStart+s.out-s.in>info.duration+.01))throw new Error('Điểm đọc nhận giọng vượt file nguồn.');
   if(info.hasAudio)results[src]=await recognize(root,file,path.join(tmp,i+'.json'),{language,timeoutMs:900000,signal,validate:check,onProgress:p=>onProgress({...p,pct:Math.round((i+(p.pct??0)/100)/sources.length*99),phase:`Nguồn ${i+1}/${sources.length}: ${p.phase}`})});
   else results[src]={language,words:[]};
   check();const current=resolveContained(dir,src).file,after=fs.statSync(current);if(current!==file||before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ino!==after.ino)throw new Error('File nguồn đã thay đổi khi nhận giọng.');
  }
  for(const {src,file,before} of identities){const current=resolveContained(dir,src).file,after=fs.statSync(current);if(current!==file||before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ino!==after.ino)throw new Error('File nguồn đã thay đổi khi nhận giọng.');}
  const data=mapSourceTranscripts(project,results);check();const staging=path.join(tmp,'transcript.json');fs.writeFileSync(staging,JSON.stringify(data,null,1));check();fs.renameSync(staging,path.join(work,'transcript.json'));onProgress({pct:100,phase:`Xong — ${data.words.length} từ`});return data;
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
}
