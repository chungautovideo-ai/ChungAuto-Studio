import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {resolveContained} from './storage.mjs';
export function registerRenderRun(projectDir,{quality,managed=false}){
 const directory=path.join(projectDir,'work/render-runs');fs.mkdirSync(directory,{recursive:true});
 const record={id:crypto.randomUUID(),pid:process.pid,status:'queued',quality,managed,updatedAt:Date.now()},file=path.join(directory,record.id+'.json');
 function update(patch){Object.assign(record,patch,{updatedAt:Date.now()});const temp=file+'.tmp';fs.writeFileSync(temp,JSON.stringify(record));
  // Ổ mạng (SMB): đổi tên có thể bị EPERM/EBUSY khi server đang đọc đúng file này → thử lại ngắn thay vì làm sập lượt xuất.
  for(let i=0;;i++){try{fs.renameSync(temp,file);return;}catch(error){if(i>=40||!['EPERM','EBUSY','EACCES'].includes(error.code))throw error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,50);}}}
 update({});return {update};
}
export function readRenderRuns(root,projects){
 const records=[];
 for(const project of projects){let directory,files;try{directory=resolveContained(root,path.join(project.dir,'work/render-runs')).file;if(!fs.existsSync(directory))continue;
  files=fs.readdirSync(directory,{withFileTypes:true}).filter(e=>e.isFile()&&!e.isSymbolicLink()&&/^[a-f0-9-]{36}\.json$/.test(e.name)).flatMap(e=>{try{return [{name:e.name,mtime:fs.statSync(path.join(directory,e.name)).mtimeMs}];}catch{return [];}}).sort((a,b)=>b.mtime-a.mtime).slice(0,20);
 }catch{continue;}
  for(const {name} of files)try{const r=JSON.parse(fs.readFileSync(path.join(directory,name),'utf8'));if(r.managed||!['queued','running','succeeded','failed','interrupted','cancelled'].includes(r.status)||!Number.isInteger(r.pid)||r.pid<1||name!==r.id+'.json')continue;records.push({...r,project:project.dir,title:project.title,workspaceId:project.workspaceId});}catch{}
 }return records;
}
