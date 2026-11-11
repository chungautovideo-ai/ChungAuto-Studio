import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {resolveContained} from './storage.mjs';
import {normalizePersonExposureSummary} from '../../editor/lib/person-exposure.js';
export function faceSources(project){return [...new Set([...(project.segments||[]).filter(s=>s.keep!==false).map(s=>s.src||project.source?.video),...(project.brolls||[]).filter(b=>!b.hidden&&/\.(mp4|mov|m4v|webm)$/i.test(b.src||'')).map(b=>b.src)].filter(Boolean))];}
const sameFingerprint=(a,b)=>a&&b&&a.size===b.size&&a.mtimeMs===b.mtimeMs&&a.sha256===b.sha256;
function fingerprint(file){
 const before=fs.statSync(file),hash=crypto.createHash('sha256'),buffer=Buffer.allocUnsafe(1024*1024),fd=fs.openSync(file,'r');
 try{let count;while((count=fs.readSync(fd,buffer,0,buffer.length,null)))hash.update(buffer.subarray(0,count));}finally{fs.closeSync(fd);}
 const after=fs.statSync(file);if(before.size!==after.size||before.mtimeMs!==after.mtimeMs)throw new Error('Nguồn đổi trong lúc kiểm dữ liệu mặt.');
 return {size:after.size,mtimeMs:after.mtimeMs,sha256:hash.digest('hex')};
}
export function faceSourceManifest(dir,project){return faceSources(project).map(src=>({src,fingerprint:fingerprint(resolveContained(dir,src).file)}));}
export function saveFaceTracks(dir,project,bundle,{validate=()=>{}}={}){
 validate();if(bundle?.v!==2||!Array.isArray(bundle.tracks)||!bundle.tracks.length||bundle.tracks.length>40)throw new Error('Dữ liệu mặt cần1–40nguồn đã quét.');
 const sources=faceSourceManifest(dir,project),seen=new Set();let signature;
 for(const track of bundle.tracks){
  if(track.exposure!==undefined)track.exposure=normalizePersonExposureSummary(track.exposure);
  const source=sources.find(s=>s.src===track.src);
  if(!source||seen.has(track.src)||!sameFingerprint(track.fingerprint,source.fingerprint))throw new Error('Nguồn quét mặt đã đổi hoặc không thuộc A-roll/B-roll đang dùng.');seen.add(track.src);
  if(!Number.isFinite(track.fps)||track.fps<1||track.fps>30||!Number.isInteger(track.w)||!Number.isInteger(track.h)||track.w<2||track.h<2||!Array.isArray(track.idx)||track.idx.length<80||track.idx.length>478||track.idx.some(n=>!Number.isInteger(n)||n<0||n>477)||new Set(track.idx).size!==track.idx.length||!Array.isArray(track.f)||!track.f.length||track.f.length>18000)throw new Error('Thông số quét mặt không hợp lệ.');
  const required=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109,61,146,91,181,84,17,314,405,321,375,291,409,270,269,267,0,37,39,40,185,78,95,88,178,87,14,317,402,318,324,308,415,310,311,312,13,82,81,80,191,33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246,263,249,390,373,374,380,381,382,362,398,384,385,386,387,388,466,70,63,105,66,107,55,65,52,53,46,300,293,334,296,336,285,295,282,283,276,1,4,5,6,48,278,98,327,168,468,473];
  if(required.some(n=>!track.idx.includes(n)))throw new Error('Thiếu điểm mặt cần cho renderer.');
  const current=JSON.stringify(track.idx);if(signature&&signature!==current)throw new Error('Các nguồn cần cùng schema điểm mặt.');signature=current;
  if(track.f.some(frame=>frame!==null&&(!Array.isArray(frame)||frame.length!==track.idx.length*2||frame.some(n=>!Number.isInteger(n)||n< -10000||n>20000))))throw new Error('Tọa độ mặt không hợp lệ.');
  if(track.skin){
   const mask=track.skin;let size=0;
   if(!Number.isInteger(mask.w)||!Number.isInteger(mask.h)||mask.w<2||mask.h<2||mask.w>256||mask.h>256||!Array.isArray(mask.f)||mask.f.length!==track.f.length)throw new Error('Kích thước mặt nạ người không hợp lệ.');
   for(const runs of mask.f){
    if(!Array.isArray(runs)||runs.length%2||runs.length>mask.w*mask.h*2)throw new Error('Mã mặt nạ người không hợp lệ.');
    size+=runs.length;if(size>4000000)throw new Error('Mặt nạ người vượt giới hạn lưu.');
    let pixels=0;for(let i=0;i<runs.length;i+=2){if(!Number.isInteger(runs[i])||runs[i]<1||!Number.isInteger(runs[i+1])||runs[i+1]<0||runs[i+1]>2)throw new Error('Nhãn mặt nạ người không hợp lệ.');pixels+=runs[i];}
    if(pixels!==mask.w*mask.h)throw new Error('Mặt nạ người thiếu điểm ảnh.');
   }
  }
 }
 validate();const work=path.join(dir,'work');fs.mkdirSync(work,{recursive:true});resolveContained(dir,'work');const file=path.join(work,'face.json'),temp=file+'.'+crypto.randomUUID()+'.tmp';
 const result={v:2,tracks:bundle.tracks,at:new Date().toISOString()};try{fs.writeFileSync(temp,JSON.stringify(result),{flag:'wx'});validate();fs.renameSync(temp,file);}finally{fs.rmSync(temp,{force:true});}return readFaceTracks(dir,project);
}
export function readFaceTracks(dir,project){
 const sources=faceSources(project);let bundle;try{bundle=JSON.parse(fs.readFileSync(resolveContained(dir,'work/face.json').file,'utf8'));}catch{return {scanned:false,tracks:[],sources,missing:sources,frames:0,found:0};}
 const tracks=[],missing=[];
 for(const src of sources){const track=bundle.v===2&&bundle.tracks?.find(t=>t.src===src);try{if(!track||!sameFingerprint(track.fingerprint,fingerprint(resolveContained(dir,src).file)))throw new Error('stale');tracks.push(track);}catch{missing.push(src);}}
 return {scanned:tracks.length>0,tracks,sources,missing,scanRates:[...new Set(tracks.map(t=>t.fps))].sort((a,b)=>a-b),bodySources:tracks.filter(t=>t.skin).length,legacy:bundle.v!==2,frames:tracks.reduce((n,t)=>n+t.f.length,0),found:tracks.reduce((n,t)=>n+t.f.filter(Boolean).length,0)};
}
