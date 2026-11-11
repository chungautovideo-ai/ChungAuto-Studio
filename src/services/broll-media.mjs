import fs from 'node:fs';import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {resolveContained} from './storage.mjs';
const run=promisify(execFile);
let active=0;
export async function inspectBrollMedia(projectDir,selected,allowed,options={}){
 if(active>=2)throw new Error('Đang kiểm tra tư liệu khác. Đợi hoàn tất rồi thử lại.');
 active++;try{return await inspect(projectDir,selected,allowed,options);}finally{active--;}
}
async function inspect(projectDir,selected,allowed,{validate=()=>{}}={}){
 validate();if(!Array.isArray(selected)||!selected.length||selected.length>100||new Set(selected).size!==selected.length)throw new Error('Chọn từ 1 đến 100 tư liệu khác nhau.');
 const output=[],deadline=Date.now()+60000;
 for(const src of selected){
  validate();if(typeof src!=='string'||!allowed.includes(src)||!/^.*\.(mp4|mov|m4v|webm|png|jpe?g|webp)$/i.test(src))throw new Error('Chọn ảnh/video trong tư liệu dự án.');
  const {file}=resolveContained(projectDir,src),before=fs.statSync(file);
  const remaining=deadline-Date.now();if(remaining<=0)throw new Error('Khảo sát quá 60 giây. Chọn ít tư liệu hơn rồi thử lại.');
  const {stdout}=await run('ffprobe',['-v','error','-show_entries','stream=codec_type,width,height:format=duration','-of','json',file],{windowsHide:true,timeout:Math.min(15000,remaining),maxBuffer:1024*1024});
  validate();const after=fs.statSync(file);if(before.size!==after.size||before.mtimeMs!==after.mtimeMs)throw new Error('Tư liệu đã đổi khi đọc. Kiểm tra lại.');
  const info=JSON.parse(stdout),video=info.streams?.find(s=>s.codec_type==='video');if(!video||!video.width||!video.height)throw new Error('Không đọc được hình ảnh/video: '+src);
  const image=/\.(png|jpe?g|webp)$/i.test(src),duration=Number(info.format?.duration);if(!image&&(!Number.isFinite(duration)||duration<0.2))throw new Error('Video quá ngắn hoặc không có thời lượng: '+src);
  output.push({src,kind:image?'image':'video',...(image?{}:{duration,hasAudio:info.streams.some(s=>s.codec_type==='audio')}),width:video.width,height:video.height});
 }
 return output;
}
