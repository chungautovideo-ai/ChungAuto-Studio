import fs from 'node:fs';import path from 'node:path';
import {sourceTranscriptMatches} from '../../editor/lib/source-transcript.js';
import {transcribeProject} from './project-transcription.mjs';
export async function prepareFirstBuildTranscript(root,dir,{project,ready,language='vi',validate=()=>{},signal,onProgress=()=>{},recognizeProject=transcribeProject}={}){
 if(!['vi','en','auto'].includes(language))throw new Error('Ngôn ngữ nhận giọng không hợp lệ.');
 validate();signal?.throwIfAborted();
 const read=()=>{try{const file=path.join(dir,'work/transcript.json');if(fs.statSync(file).size>8*1024**2)return null;return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return null;}};
 const current=read();if(Array.isArray(current?.words)&&sourceTranscriptMatches(project,current)&&(language==='auto'||current.language===language))return {state:'reused',words:current.words.length};
 if(project.source?.hasAudio===false&&(project.source?.timeline!=='segments'||project.segments?.length&&project.segments.every(s=>s.mediaInfo?.hasAudio===false)))return {state:'silent',words:0};
 if(!ready)throw new Error('Chưa có công cụ nhận giọng local để chuẩn bị lời thoại. Kiểm tra cài đặt hoặc nhận giọng trước khi giao AI dựng.');
 const data=await recognizeProject(root,dir,{validate,signal,onProgress,language});validate();signal?.throwIfAborted();
 if(!Array.isArray(data?.words)||!sourceTranscriptMatches(project,data))throw new Error('Kết quả nhận giọng không khớp bản dựng đang giao.');
 return {state:'recognized',words:data.words.length};
}
