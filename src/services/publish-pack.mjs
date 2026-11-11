import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {publishDrafts} from './publish-drafts.mjs';
import {resolveContained} from './storage.mjs';
import {projectRevision,assertProjectRevision} from './project-revisions.mjs';
import {resolvePublishCover} from './publish-covers.mjs';
import {writeStoredZip} from './stored-zip.mjs';

function context(root,workspaceId,dir){const drafts=publishDrafts(root,workspaceId,dir),folder=resolveContained(root,dir).file;return {drafts,folder,revision:projectRevision(path.join(folder,'project.json'))};}
function finalVideo(folder,name,revision){
 if(typeof name!=='string'||!/^renders\/[a-zA-Z0-9_.-]+\.mp4$/.test(name))throw new Error('Chọn bản final đã xuất trong dự án.');
 const file=resolveContained(folder,name).file,sidecar=resolveContained(folder,name+'.json').file;
 const metadata=JSON.parse(fs.readFileSync(sidecar,'utf8'));
 if(!metadata.ok||metadata.quality!=='final'||metadata.revision!==revision||!/^[a-f0-9-]{36}$/i.test(metadata.snapshotId||''))throw new Error('Bản final không khớp revision hiện tại. Xuất lại video.');
 const result=JSON.parse(fs.readFileSync(resolveContained(folder,'work/render-snapshots/'+metadata.snapshotId+'/result.json').file,'utf8'));
 if(!result.ok||result.quality!=='final'||result.revision!==revision||result.snapshotId!==metadata.snapshotId||result.sha256!==metadata.sha256||result.bytes!==metadata.bytes)throw new Error('Bản final không khớp bản chụp render.');
 return {file,metadata};
}
export function listPublishFinals(root,workspaceId,dir){
 const {folder,revision}=context(root,workspaceId,dir),renders=path.join(folder,'renders');if(!fs.existsSync(renders))return [];
 const names=fs.readdirSync(renders).filter(n=>n.endsWith('.mp4'));if(names.length>500)throw new Error('Quá nhiều bản xuất. Cần dọn dự án trước.');
 return names.sort().flatMap(name=>{try{const {metadata}=finalVideo(folder,'renders/'+name,revision);return [{path:'renders/'+name,bytes:metadata.bytes,snapshotId:metadata.snapshotId}];}catch{return [];}});
}
const active=new Set();
export async function createPublishPack(root,workspaceId,{dir,revision,expectedVersion,video,channels},{validate=()=>{},signal}={}){
 const {folder,drafts}=context(root,workspaceId,dir),key=folder;
 if(active.has(key))throw new Error('Dự án đang đóng gói phát hành.');active.add(key);
 let temporary;
 try{
  const check=()=>{signal?.throwIfAborted();validate();assertProjectRevision(path.join(folder,'project.json'),revision);if(drafts.get().version!==expectedVersion)throw new Error('Bộ nội dung đã thay đổi. Mở lại trước khi đóng gói.');};check();
  const current=drafts.get();if(!expectedVersion||!Array.isArray(channels)||!channels.length||channels.length>50)throw new Error('Chọn từ 1 đến 50 bộ nội dung đã lưu.');
  const keys=new Set(),entries=channels.map(channel=>{const key=channel.platform+':'+channel.channelId;if(keys.has(key))throw new Error('Trùng bộ nội dung.');keys.add(key);const entry=current.entries.find(e=>e.platform===channel.platform&&e.channelId===channel.channelId);if(!entry||entry.stale)throw new Error('Bộ nội dung chưa lưu hoặc cần kiểm tra lại revision.');return entry;});
  const final=finalVideo(folder,video,revision),files=[{name:'video.mp4',file:final.file,bytes:final.metadata.bytes,sha256:final.metadata.sha256}];
  const packed=entries.map((entry,index)=>{
   const prefix='channels/'+String(index+1).padStart(2,'0')+'-'+entry.platform;
   const record=Object.fromEntries(['platform','channelId','title','caption','hashtags','tags','comment','reviewedRevision','reviewedAt'].map(key=>[key,entry[key]]));
   if(entry.cover){const cover=resolvePublishCover(folder,workspaceId,entry.cover.name);if(cover.sha256!==entry.cover.sha256||cover.projectRevision!==revision)throw new Error('Ảnh bìa đã đổi hoặc không khớp revision. Kiểm tra và lưu lại ảnh bìa.');record.cover=prefix+'/cover.jpg';files.push({name:record.cover,file:resolveContained(folder,cover.path).file,bytes:cover.bytes,sha256:cover.sha256});}
   files.push({name:prefix+'/content.json',data:Buffer.from(JSON.stringify(record,null,2)+'\n')});
   for(const field of ['title','caption','hashtags','tags','comment'])files.push({name:prefix+'/'+field+'.txt',data:Buffer.from(entry[field]+'\n')});
   return record;
  });
  const manifest={schemaVersion:1,workspaceId,project:dir,revision,draftVersion:expectedVersion,createdAt:new Date().toISOString(),video:{path:'video.mp4',sha256:final.metadata.sha256,bytes:final.metadata.bytes,snapshotId:final.metadata.snapshotId},channels:packed,files:files.map(item=>({path:item.name,bytes:item.data?.length??item.bytes,sha256:item.data?crypto.createHash('sha256').update(item.data).digest('hex'):item.sha256}))};
  files.push({name:'manifest.json',data:Buffer.from(JSON.stringify(manifest,null,2)+'\n')},{name:'README.txt',data:Buffer.from('ContentOS — Gói phát hành\nvideo.mp4: bản final đã chọn.\nchannels/: nội dung và ảnh bìa riêng từng kênh.\ncomment.txt chỉ là nháp bình luận. Gói này chưa đăng bài hoặc bình luận.\nmanifest.json: revision, bản chụp và mã SHA256.\n')});
  const folderOut=path.join(folder,'renders/publish-packs');fs.mkdirSync(folderOut,{recursive:true});resolveContained(folder,'renders/publish-packs');
  const expectedBytes=files.reduce((sum,item)=>sum+(item.data?.length??item.bytes),0)+1024*1024;
  if(!Number.isSafeInteger(expectedBytes)||expectedBytes>3*1024**3)throw new Error('Gói phát hành vượt 3 GB.');
  const disk=fs.statfsSync(folderOut);if(Number(disk.bavail)*Number(disk.bsize)<expectedBytes+128*1024**2)throw new Error('Không đủ dung lượng local để tạo gói và phần dự phòng.');
  const id=crypto.randomUUID(),destination=path.join(folderOut,id+'.zip');temporary=destination+'.tmp';
  const integrity=await writeStoredZip(temporary,files,{validate:check,signal});check();
  const metadata=destination+'.json';fs.writeFileSync(metadata,JSON.stringify({schemaVersion:1,id,workspaceId,project:dir,revision,...integrity})+'\n',{flag:'wx'});
  try{fs.renameSync(temporary,destination);}catch(error){fs.rmSync(metadata,{force:true});throw error;}
  return {id,path:path.relative(root,destination).replace(/\\/g,'/'),channels:entries.length};
 }finally{active.delete(key);if(temporary)fs.rmSync(temporary,{force:true});}
}
export function resolvePublishPack(root,workspaceId,dir,id){
 if(typeof id!=='string'||!/^[a-f0-9-]{36}$/i.test(id))throw new Error('Sai mã gói phát hành.');
 const {folder}=context(root,workspaceId,dir),output=resolveContained(folder,'renders/publish-packs/'+id+'.zip').file;
 const metadata=JSON.parse(fs.readFileSync(resolveContained(folder,'renders/publish-packs/'+id+'.zip.json').file,'utf8'));
 if(metadata.id!==id||metadata.workspaceId!==workspaceId||metadata.project!==dir)throw new Error('Gói không thuộc dự án/workspace hiện tại.');
 return {output,metadata};
}
export function listPublishPacks(root,workspaceId,dir){
 const {folder}=context(root,workspaceId,dir),directory=path.join(folder,'renders/publish-packs');if(!fs.existsSync(directory))return [];
 const files=fs.readdirSync(directory).filter(name=>/^[a-f0-9-]{36}\.zip\.json$/i.test(name));if(files.length>500)throw new Error('Quá nhiều gói phát hành; cần dọn dự án trước.');
 return files.flatMap(name=>{try{const id=name.slice(0,-9),{metadata}=resolvePublishPack(root,workspaceId,dir,id);return [{id,bytes:metadata.bytes,revision:metadata.revision}];}catch{return [];}}).reverse();
}
