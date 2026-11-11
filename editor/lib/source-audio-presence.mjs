import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {resolveContained} from '../../src/services/storage.mjs';

// Cache only within one build: replacing a source must be visible on rebuild.
export function sourceAudioPresence(projectDir,{probe=file=>JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','a','-show_entries','stream=codec_type','-of','json',file],{encoding:'utf8',windowsHide:true,timeout:20000,maxBuffer:1048576}))}={}) {
  const cache=new Map();
  return (src,known)=>{
    if(typeof known==='boolean')return known;
    // Missing inputs retain their reference so normal asset validation reports
    // the missing file instead of silently turning the project into silence.
    if(!projectDir||!src)return true;
    const relative=path.relative(path.resolve(projectDir),path.resolve(projectDir,src));
    if(path.isAbsolute(src)||relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Nguồn âm thanh phải thuộc dự án.');
    let file;try{file=resolveContained(projectDir,src).file;}catch(error){if(['ENOENT','ENOTDIR'].includes(error.code))return true;throw error;}
    if(cache.has(file))return cache.get(file);
    let data;try{data=probe(file);}catch{throw new Error('Không kiểm tra được track âm thanh của nguồn: '+src);}
    if(!Array.isArray(data?.streams))throw new Error('Metadata track âm thanh không hợp lệ: '+src);
    const present=data.streams.some(s=>s.codec_type==='audio');cache.set(file,present);return present;
  };
}
