import {resolveContained} from './storage.mjs';import {probeMediaMetadata} from './media-metadata.mjs';
export async function inspectPrimaryMedia(dir,project,selected,allowed,{validate=()=>{}}={}){
 if(!Array.isArray(selected)||!selected.length||selected.length>20||selected.some(src=>typeof src!=='string'||!allowed.includes(src)))throw new Error('Chọn1–20video trong tư liệu dự án.');
 const sources=[...new Set([project.source.video,...project.segments.map(s=>s.src).filter(Boolean),...selected])];if(sources.length>64)throw new Error('Dự án tối đa64nguồn.');
 const result=[];for(const src of sources){validate();if(!/\.(mp4|mov|m4v|webm)$/i.test(src))throw new Error('Chỉ thêm video vào track Video.');const {file}=resolveContained(dir,src),info=await probeMediaMetadata(file,{validate});if(info.kind!=='video'||info.duration<.2)throw new Error('Nguồn video không hợp lệ.');result.push({src,...info});}validate();return result;
}
