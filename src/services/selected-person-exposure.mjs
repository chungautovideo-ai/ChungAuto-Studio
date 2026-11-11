import fs from 'node:fs';
import {resolveContained} from './storage.mjs';
import {probeMediaMetadata} from './media-metadata.mjs';
import {requireSdrInput} from './shot-color.mjs';
import {createSelectedPersonFrameDecoder} from './selected-person-frame.mjs';
import {readFaceTracks} from './face-tracks.mjs';
import {personSelectionScope} from './person-selection-scope.mjs';
import {normalizePersonSelections,applyPersonSelection} from '../../editor/lib/person-selection.js';
import {measurePersonExposure,summarizePersonExposure,suggestPersonExposure} from '../../editor/lib/person-exposure.js';
let active=0;

export function selectedSemanticMask(track,selections,time){
 const {w,h}=track.skin,runs=track.skin.f[Math.floor(time*track.fps)];
 if(!runs)return null;
 const pixels=new Uint8Array(w*h*4);let index=0;
 for(let r=0;r<runs.length;r+=2){for(let end=index+runs[r];index<end;index++){if(index>=w*h)throw Error('Mặt nạ semantic không hợp lệ.');pixels[index*4]=runs[r+1]?255:0;pixels[index*4+1]=runs[r+1]===2?255:0;}}
 if(index!==w*h)throw Error('Mặt nạ semantic thiếu điểm ảnh.');
 applyPersonSelection(pixels,w,h,selections,track.src,track.fingerprint.sha256,time);
 const encoded=[];let previous=-1,count=0;
 for(let i=0;i<w*h;i++){const label=pixels[i*4+1]?2:pixels[i*4]?1:0;if(label===previous)count++;else{if(count)encoded.push(count,previous);previous=label;count=1;}}
 if(count)encoded.push(count,previous);return {w,h,runs:encoded};
}

export async function measureSelectedPersonExposure(dir,project,{src,sha256},{validate=()=>{},signal,decode}={}){
 validate();signal?.throwIfAborted();if(active>=1)throw Error('Đang đo sáng người được chọn; thử lại sau.');
 if(typeof src!=='string'||! /^[a-f0-9]{64}$/.test(sha256||''))throw Error('Chọn nguồn và SHA256 hợp lệ.');
 const selections=normalizePersonSelections(project.camera?.beauty?.personSelections),track=readFaceTracks(dir,project).tracks.find(t=>t.src===src&&t.fingerprint.sha256===sha256&&t.skin);
 if(!track)throw Error('Nguồn chưa có mặt nạ người/da khớp; quét lại.');
 const scope=personSelectionScope(project,src,sha256,true);if(scope.mode!=='selected-ranges')throw Error('Chọn và theo dõi người trước khi đo riêng.');
 const ranges=[];for(const used of scope.usedRanges)for(const selection of scope.ranges){const from=Math.max(used.from,selection.from),to=Math.min(used.to,selection.to,track.skin.f.length/track.fps);if(to>from)ranges.push({from,to});}
 const duration=ranges.reduce((sum,r)=>sum+r.to-r.from,0);if(!duration)throw Error('Không có vùng chọn trong phần nguồn đang dùng.');
 const times=Array.from({length:12},(_,i)=>{let offset=(i+.5)*duration/12;for(const range of ranges){if(offset<range.to-range.from)return range.from+offset;offset-=range.to-range.from;}return ranges.at(-1).to-1e-6;});
 const seen=new Set(),uniqueTimes=times.filter(time=>{const selection=selections.find(s=>s.src===src&&time>=s.from&&time<s.from+s.f.length/s.fps),key=Math.floor(time*track.fps)+':'+selection?.from+':'+Math.floor((time-(selection?.from||0))*(selection?.fps||1));if(seen.has(key))return false;seen.add(key);return true;});
 const file=resolveContained(dir,src).file,before=fs.statSync(file),faceFile=resolveContained(dir,'work/face.json').file,faceBefore=fs.statSync(faceFile),samples=[];active++;
 const tailFrames=[];let inputColor,decodeFrame=decode&&((time,w,h)=>decode(file,time,w,h));
 try{
  // Injected decode is a test/session seam; production probes color and aligns frames to the mask clock.
  if(!decodeFrame){const meta=await probeMediaMetadata(file,{validate});inputColor=requireSdrInput(meta,'Nguồn HDR (HLG/PQ): chọn đoạn → Chuẩn hóa màu nguồn sang Rec.709, xem/thay rồi quét/chọn lại người trước khi đo.');decodeFrame=createSelectedPersonFrameDecoder(file,{duration:meta.duration,signal,validate});}
  for(const time of uniqueTimes){
   validate();signal?.throwIfAborted();const mask=selectedSemanticMask(track,selections,time);if(!mask)continue;
   const frame=await decodeFrame(time,mask.w,mask.h),rgba=frame.rgba||frame;
   if(rgba.length!==mask.w*mask.h*4)throw Error('Không đọc đủ khung hình nguồn.');if(frame.tailFallback)tailFrames.push({requestedTime:time,decodedFrameTime:frame.decodedFrameTime});samples.push({time,measurement:measurePersonExposure(rgba,mask.w,mask.h,mask)});
  }
  validate();signal?.throwIfAborted();const after=fs.statSync(file);if(before.size!==after.size||before.mtimeMs!==after.mtimeMs)throw Error('Nguồn đã đổi trong khi đo.');
  const faceAfter=fs.statSync(faceFile);if(faceBefore.size!==faceAfter.size||faceBefore.mtimeMs!==faceAfter.mtimeMs||faceBefore.ino!==faceAfter.ino)throw Error('Mặt nạ quét đã đổi trong khi đo; đo lại.');
  const exposure=summarizePersonExposure(samples.map(s=>s.measurement));
  return {readOnly:true,src,sha256,measurementScope:'Semantic person/skin intersected with saved SAM2 selection over used source ranges; before brush/stability/color effects.',exposure,suggestion:suggestPersonExposure(exposure),times:samples.map(s=>s.time),tailFrames,...(inputColor?{inputColor}:{}),selectionScope:scope,limits:'Display luma samples, not skin tone, identity verification or HDR/Log normalization. Review preview before applying.'};
 }finally{active--;}
}
