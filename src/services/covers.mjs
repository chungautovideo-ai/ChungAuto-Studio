import fs from 'node:fs';
import {normalizeCoverComposition} from '../../editor/lib/cover-composition.js';
import {resolvePublishCover} from './publish-covers.mjs';
import {resolveContained} from './storage.mjs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {inspectImage} from './image-output.mjs';
const run=promisify(execFile);
function verifiedImage(resolveImage,workspaceId,id){
 const asset=resolveImage(workspaceId,id),stat=fs.statSync(asset.file);
 if(!stat.isFile()||stat.size>20*1024**2)throw new Error('Ảnh nền vượt giới hạn.');
 const sha256=crypto.createHash('sha256').update(fs.readFileSync(asset.file)).digest('hex');
 if(sha256!==asset.meta.sha256)throw new Error('Ảnh nền đã đổi. Chọn nền mới.');
 return asset;
}

export function readCoverComposition({projectDir,workspaceId,name,resolveImage}){
 const cover=resolvePublishCover(projectDir,workspaceId,name),file=resolveContained(projectDir,'renders/'+name.replace(/\.jpg$/,'.json')).file;
 if(fs.statSync(file).size>64*1024)throw new Error('Thông tin ảnh bìa vượt giới hạn.');
 const record=JSON.parse(fs.readFileSync(file,'utf8')),composition=normalizeCoverComposition(record.composition),project=JSON.parse(fs.readFileSync(path.join(projectDir,'project.json'),'utf8'));
 if((project.workspaceId||'default')!==workspaceId)throw new Error('Workspace không khớp dự án.');
 if(cover.width!==(project.format==='16:9'?1920:1080)||cover.height!==(project.format==='16:9'?1080:1920))throw new Error('Tỷ lệ dự án đã đổi. Tạo ảnh bìa mới.');
 let source;
 if(record.source?.kind==='image'){
  const asset=verifiedImage(resolveImage,workspaceId,record.source.id);
  if(record.source.workspaceId!==workspaceId||asset.meta.sha256!==record.source.sha256)throw new Error('Ảnh nền đã đổi hoặc không còn khớp. Chọn nền mới.');
  source={kind:'image',id:asset.meta.id};
 }else if(record.source?.kind==='video-frame'){
  if(record.source.video!==project.source?.video||!Number.isFinite(record.source.time)||record.source.time<0)throw new Error('Video nguồn đã đổi. Chọn khung mới.');
  resolveContained(projectDir,record.source.video);source={kind:'video-frame',video:record.source.video,time:record.source.time};
 }else throw new Error('Ảnh bìa cũ thiếu nguồn chỉnh sửa.');
 return {name,composition,source,projectRevision:record.projectRevision};
}

// The caller pins project/revision and resolves image IDs within the project workspace.
export async function saveCover({projectDir,stream,metadata,validate,resolveImage,revision}){
 const source=metadata?.source;
 if(!source||!['image','video-frame'].includes(source.kind))throw new Error('Thiếu nguồn ảnh bìa.');
 const project=JSON.parse(fs.readFileSync(path.join(projectDir,'project.json'),'utf8'));
 const workspaceId=project.workspaceId||'default';
 let provenance;
 if(source.kind==='image'){
  const asset=verifiedImage(resolveImage,workspaceId,source.id);
  provenance={kind:'image',id:asset.meta.id,workspaceId,sha256:asset.meta.sha256};
 }else{
  if(typeof source.video!=='string'||source.video!==project.source?.video||!Number.isFinite(source.time)||source.time<0)throw new Error('Nguồn khung video không hợp lệ.');
  provenance={kind:'video-frame',video:source.video,time:source.time};
 }
 const composition=normalizeCoverComposition(metadata.composition);
 validate();
 const dir=path.join(projectDir,'renders');fs.mkdirSync(dir,{recursive:true});
 const temp=path.join(dir,`.cover-${crypto.randomUUID()}.jpg`);
 let out,sidecar;
 try{
  const chunks=[];let bytes=0;
  for await(const chunk of stream){bytes+=chunk.length;if(bytes>12*1024**2)throw new Error('Ảnh bìa vượt 12 MB.');chunks.push(chunk);}
  const data=Buffer.concat(chunks);
  if(data.length<24||data[0]!==255||data[1]!==216||data[2]!==255)throw new Error('Ảnh bìa cần là JPEG.');
  fs.writeFileSync(temp,data,{flag:'wx'});
  const dimensions=await inspectImage(temp);
  const expected=project.format==='16:9'?[1920,1080]:[1080,1920];
  if(dimensions.width!==expected[0]||dimensions.height!==expected[1])throw new Error('Kích thước ảnh bìa không khớp dự án.');
  await run('ffmpeg',['-nostdin','-v','error','-xerror','-i',temp,'-frames:v','1','-f','null','-'],{windowsHide:true,timeout:20000,maxBuffer:1024*1024});
  validate();
  if(source.kind==='image'&&verifiedImage(resolveImage,workspaceId,source.id).meta.sha256!==provenance.sha256)throw new Error('Ảnh nền đã đổi trong lúc lưu.');
  let n=1;while(fs.existsSync(path.join(dir,`anh-bia-${n}.jpg`))||fs.existsSync(path.join(dir,`anh-bia-${n}.json`)))n++;
  out=path.join(dir,`anh-bia-${n}.jpg`);sidecar=path.join(dir,`anh-bia-${n}.json`);
  const record={schemaVersion:1,workspaceId,projectRevision:revision||null,createdAt:new Date().toISOString(),source:provenance,composition,...dimensions,bytes,sha256:crypto.createHash('sha256').update(data).digest('hex')};
  fs.writeFileSync(sidecar,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
  try{fs.renameSync(temp,out);}catch(error){fs.rmSync(sidecar,{force:true});throw error;}
  return {file:out,name:path.basename(out),metadata:record};
 }finally{fs.rmSync(temp,{force:true});}
}
