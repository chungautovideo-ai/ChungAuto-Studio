import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolveContained} from './storage.mjs';
import {probeMediaMetadata} from './media-metadata.mjs';
const run=promisify(execFile),pending=new Map();let active=0;
export async function timelineSourceCache(projectDir,project,src,{validate=()=>{}}={}) {
 validate();
 if(typeof src!=='string'||!project.segments?.some(s=>s.src===src)&&project.source?.video!==src)throw new Error('Nguồn không thuộc timeline dự án.');
 const {file}=resolveContained(projectDir,src),before=fs.statSync(file);
 const identity=()=>{validate();const current=resolveContained(projectDir,src).file,after=fs.statSync(current);if(current!==file||before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ino!==after.ino)throw new Error('Nguồn đã thay đổi khi tạo timeline.');};
 const key=crypto.createHash('sha256').update(JSON.stringify([file,before.size,before.mtimeMs,before.ino,'v1'])).digest('hex');
 if(!pending.has(key)) {
  if(active>=2)throw new Error('Đang tạo timeline cho hai nguồn. Thử lại sau.');
  active++;
  const task=(async()=>{
   const info=await probeMediaMetadata(file);identity();
   if(info.kind!=='video'||info.duration>21600)throw new Error('Timeline nhận video tối đa6giờ.');
   const dir=path.join(projectDir,'.editor-cache');fs.mkdirSync(dir,{recursive:true});
   const destination=path.join(dir,'source-'+key+'.jpg'),staging=destination+'.'+crypto.randomUUID()+'.jpg';
   const fps=Math.min(2,400/Math.max(info.duration,1)),cols=20,rows=Math.ceil((Math.ceil(info.duration*fps)+1)/cols),tw=54,th=96;
   try {
    if(!fs.existsSync(destination)) {
     await run('ffmpeg',['-v','error','-y','-i',file,'-vf',`fps=${fps},scale=${tw}:${th}:force_original_aspect_ratio=increase,crop=${tw}:${th},tile=${cols}x${rows}`,'-frames:v','1','-q:v','4',staging],{windowsHide:true,timeout:120000,maxBuffer:1024*1024});
     identity();fs.renameSync(staging,destination);
    }
    let peaks=[];const rate=1000,per=20;
    if(info.hasAudio){const {stdout:pcm}=await run('ffmpeg',['-v','error','-i',file,'-vn','-ac','1','-ar',String(rate),'-f','s16le','pipe:1'],{encoding:'buffer',windowsHide:true,timeout:120000,maxBuffer:48*1024*1024});identity();
     for(let i=0;i<pcm.length/2;i+=rate/per){let peak=0;for(let j=i;j<Math.min(pcm.length/2,i+rate/per);j++)peak=Math.max(peak,Math.abs(pcm.readInt16LE(j*2)));peaks.push(Math.round(peak/32768*100)/100);}
    }
    identity();return {src,duration:info.duration,strip:{url:'data:image/jpeg;base64,'+fs.readFileSync(destination).toString('base64'),fps,cols,rows,tw,th},wave:{per,peaks,hasAudio:info.hasAudio}};
   }finally{fs.rmSync(staging,{force:true});}
  })().finally(()=>{active--;pending.delete(key);});
  pending.set(key,task);
 }
 const result=await pending.get(key);identity();return result;
}
