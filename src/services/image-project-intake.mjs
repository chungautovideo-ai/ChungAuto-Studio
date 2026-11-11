import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {resolveContained} from './storage.mjs';
export async function importProjectImage(root,dir,src,allowed,workspaceId,imageService,validate=()=>{}){
 validate();if(typeof src!=='string'||!allowed.includes(src)||! /\.(png|jpe?g)$/i.test(src))throw new Error('Chọn ảnh PNG/JPEG trong tư liệu dự án.');
 const project=JSON.parse(fs.readFileSync(path.join(dir,'project.json'),'utf8'));if((project.workspaceId||'default')!==workspaceId)throw new Error('Dự án không thuộc workspace đang chọn.');
 const {file}=resolveContained(dir,src),before=fs.statSync(file);if(!before.isFile()||before.size>20*1024**2)throw new Error('Ảnh tối đa 20 MiB.');
 const bytes=await fs.promises.readFile(file);validate();const hash=crypto.createHash('sha256').update(bytes).digest('hex');
 const check=()=>{validate();const after=fs.statSync(file);if(before.size!==after.size||before.mtimeMs!==after.mtimeMs||crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==hash)throw new Error('Ảnh dự án đã đổi khi nhập. Chọn lại tư liệu.');};
 check();return imageService.importImage(workspaceId,bytes,{name:path.basename(src),validate:check,source:{kind:'project-media',projectDir:path.relative(root,dir).replaceAll('\\','/'),src,sha256:hash}});
}
