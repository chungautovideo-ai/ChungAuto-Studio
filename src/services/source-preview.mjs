import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {sourceMediaInfo} from './source-media-info.mjs';
const run=promisify(execFile);
let active=0;
export async function createSourcePreview(root,workspaceId,text,selected,{validate=()=>{}}={}){
 if(active>=2)throw Object.assign(new Error('Đang tạo ảnh khảo sát cho hai video. Đợi hoàn tất rồi thử lại.'),{status:409});
 active++;
 try{
 if(!/^[a-zA-Z0-9-]+$/.test(workspaceId))throw new Error('Workspace không hợp lệ.');
 validate();const media=await sourceMediaInfo(text,selected);validate();
 const id=crypto.randomUUID(),directory=path.join(root,'workspace/contentos/source-previews',workspaceId,id),frames=[];
 fs.mkdirSync(directory,{recursive:true});
 try{
  const disk=fs.statfsSync(directory);if(Number(disk.bavail)*Number(disk.bsize)<128*1024**2)throw new Error('Không đủ dung lượng tạo ảnh khảo sát.');
  for(let i=0;i<6;i++){
   validate();const time=media.duration*(i+.5)/6,file=path.join(directory,`frame-${i+1}.jpg`);
   await run('ffmpeg',['-v','error','-ss',String(time),'-i',selected,'-frames:v','1','-vf','scale=480:480:force_original_aspect_ratio=decrease','-q:v','4','-an',file],{windowsHide:true,timeout:20000,maxBuffer:1024*1024});
   const bytes=fs.readFileSync(file);if(bytes.length>2*1024**2||bytes[0]!==255||bytes[1]!==216)throw new Error('Ảnh khảo sát không hợp lệ.');
   frames.push({time,path:path.relative(root,file).replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),dataUrl:'data:image/jpeg;base64,'+bytes.toString('base64')});
  }
  const after=fs.statSync(selected);if(after.size!==media.bytes||after.mtimeMs!==media.mtimeMs)throw new Error('Nguồn thay đổi trong khi lấy ảnh. Kiểm tra lại nguồn.');validate();
  const manifest={id,workspaceId,media,createdAt:new Date().toISOString(),method:'six evenly spaced frame samples',frames:frames.map(({dataUrl,...frame})=>frame)};
  fs.writeFileSync(path.join(directory,'preview.json'),JSON.stringify(manifest,null,2)+'\n');return {...manifest,manifestPath:path.relative(root,path.join(directory,'preview.json')).replaceAll('\\','/'),frames};
 }catch(error){fs.rmSync(directory,{recursive:true,force:true});throw error;}
 }finally{active--;}
}
