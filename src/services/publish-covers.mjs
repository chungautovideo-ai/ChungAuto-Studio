import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {resolveContained} from './storage.mjs';
export function resolvePublishCover(folder,workspaceId,name){
 if(typeof name!=='string'||!/^anh-bia-\d+\.jpg$/.test(name))throw new Error('Chọn ảnh bìa đã lưu của dự án.');
 const file=resolveContained(folder,'renders/'+name).file,sidecar=resolveContained(folder,'renders/'+name.replace(/\.jpg$/,'.json')).file,metadata=JSON.parse(fs.readFileSync(sidecar,'utf8')),stat=fs.statSync(file);
 if(metadata.workspaceId!==workspaceId||stat.size>12*1024**2||stat.size!==metadata.bytes||!stat.isFile())throw new Error('Ảnh bìa không khớp dự án hoặc dữ liệu.');
 const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');if(hash!==metadata.sha256)throw new Error('Ảnh bìa đã thay đổi. Tạo ảnh mới hoặc chọn lại.');
 return {name,path:'renders/'+name,sha256:hash,bytes:stat.size,projectRevision:metadata.projectRevision,width:metadata.width,height:metadata.height};
}
export function listPublishCovers(folder,workspaceId){
 const directory=path.join(folder,'renders');if(!fs.existsSync(directory))return [];const names=fs.readdirSync(directory).filter(name=>/^anh-bia-\d+\.jpg$/.test(name));if(names.length>500)throw new Error('Có quá nhiều ảnh bìa; cần dọn dự án trước.');
 return names.sort((a,b)=>Number(b.match(/\d+/)[0])-Number(a.match(/\d+/)[0])).map(name=>{try{return resolvePublishCover(folder,workspaceId,name);}catch(error){return {name,error:error.message};}});
}
export function verifyPublishCovers(folder,workspaceId,snapshot){
 for(const entry of snapshot?.entries||[]){if(!entry.cover)continue;const actual=resolvePublishCover(folder,workspaceId,entry.cover.name);if(actual.sha256!==entry.cover.sha256)throw new Error('Ảnh bìa không khớp bản đã chọn cho kênh.');}
}
