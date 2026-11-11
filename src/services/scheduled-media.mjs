import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {resolveContained} from './storage.mjs';
async function fingerprint(file){const before=fs.statSync(file);if(!before.isFile()||before.size<32)throw new Error('File video không hợp lệ.');const hash=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(file))hash.update(chunk);const after=fs.statSync(file);if(before.size!==after.size||before.mtimeMs!==after.mtimeMs)throw new Error('Video thay đổi khi kiểm tra.');return {bytes:after.size,sha256:hash.digest('hex')};}
export async function pinScheduledVideo(file){
 if(typeof file!=='string'||!path.isAbsolute(file)||! /\.(mp4|mov)$/i.test(file))throw new Error('Cần đường dẫn video đã xuất.');
 const absolute=fs.realpathSync(file),stamp=await fingerprint(absolute);let sidecar=null;try{sidecar=JSON.parse(fs.readFileSync(absolute+'.json','utf8'));}catch{}
 return {schemaVersion:1,kind:'pinned',file:absolute,...stamp,revision:sidecar?.ok?sidecar.revision||null:null,snapshotId:sidecar?.ok?sidecar.snapshotId||null:null,pinnedAt:new Date().toISOString()};
}
export async function resolveScheduledVideo(root,entry){
 const media=entry.scheduledMedia;if(!media)return null;
 if(media.kind==='awaiting-render'){
  const folder=resolveContained(root,entry.project).file,renders=path.join(folder,'renders');if(!fs.existsSync(renders))return null;
  const matches=[];for(const name of fs.readdirSync(renders).filter(name=>name.endsWith('.mp4.json'))){
   try{const metadata=JSON.parse(fs.readFileSync(resolveContained(renders,name).file,'utf8'));if(metadata.ok&&metadata.quality==='final'&&metadata.renderJobDir===media.renderJobDir&&metadata.revision===media.revision)matches.push(resolveContained(renders,name.slice(0,-5)).file);}catch{}
  }
  if(matches.length>1)throw new Error('Có nhiều bản xuất cho lịch này. Kiểm tra và tạo lại lịch với file cụ thể.');
  if(!matches.length)return null;entry.scheduledMedia=await pinScheduledVideo(matches[0]);return entry.scheduledMedia.file;
 }
 if(media.kind!=='pinned')throw new Error('Liên kết video của lịch không hợp lệ.');
 const current=await pinScheduledVideo(media.file);if(current.bytes!==media.bytes||current.sha256!==media.sha256)throw new Error('Video của lịch đã bị thay đổi. Chọn lại file và tạo lịch mới.');return media.file;
}
