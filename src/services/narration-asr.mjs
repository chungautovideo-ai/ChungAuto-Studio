import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {resolveContained} from './storage.mjs';import {voiceAssetContext} from './voice-intake.mjs';import {transcribe} from '../../editor/lib/whisper.mjs';
let running=false;
export async function recognizeNarration(root,dir,clipId,{validate=()=>{},brief=null,recognizer=transcribe,language='vi',signal,onProgress=()=>{}}={}){
 signal?.throwIfAborted();
 if(!['vi','en','auto'].includes(language))throw new Error('Chọn ngôn ngữ nhận giọng được hỗ trợ.');
 if(running)throw new Error('Đang nhận giọng một clip khác. Đợi hoàn tất.');
 validate();const project=JSON.parse(fs.readFileSync(path.join(dir,'project.json'),'utf8')),clip=project.audio?.clips?.find(c=>c.id===clipId&&!c.hidden);
 if(!clip)throw new Error('Lưu dự án và chọn clip voice đang dùng trước khi nhận giọng.');
 if(!/\.(mp3|wav|m4a|aac)$/i.test(clip.src))throw new Error('Chọn file audio của dự án.');
 const {file}=resolveContained(dir,clip.src),before=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 const voice=voiceAssetContext(dir,clip.src,brief);if(voice?.status==='different-script')throw new Error('Voice không khớp bản tin đang gắn. Kiểm tra lời đọc trước.');
 const id=crypto.randomUUID(),folder=path.join(dir,'work/narration-asr',id);fs.mkdirSync(folder,{recursive:true});running=true;
 try{
  const data=await recognizer(root,file,path.join(folder,'transcript.json'),{language,timeoutMs:15*60*1000,signal,onProgress});signal?.throwIfAborted();validate();
  if(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==before)throw new Error('Audio đã đổi khi nhận giọng. Thử lại với file mới.');
  const result={id,clipId,src:clip.src,audioSha256:before,voice,language,engine:data.engine,model:data.model,words:data.words};fs.writeFileSync(path.join(folder,'result.json'),JSON.stringify(result,null,2)+'\n');return result;
 }catch(error){fs.rmSync(folder,{recursive:true,force:true});throw error;}finally{running=false;}
}
