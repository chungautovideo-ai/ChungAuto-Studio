import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {pipeline} from 'node:stream/promises';import {Transform} from 'node:stream';
import {buildHtml} from '../../editor/lib/build.mjs';import {projectRevision,assertProjectRevision} from './project-revisions.mjs';import {resolveContained} from './storage.mjs';
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
export async function createRenderSnapshot(projectDir,{revision=projectRevision(path.join(projectDir,'project.json')),quality='draft'}={}){
 const file=path.join(projectDir,'project.json');assertProjectRevision(file,revision);
 const project=JSON.parse(fs.readFileSync(file,'utf8')),html=buildHtml(project,projectDir),references=new Set(),remote=new Set();
 for(const match of html.matchAll(/\b(?:src|href)\s*=\s*"([^"]+)"|url\(\s*["']?([^\s)'";]+)["']?\s*\)/gi)){
  const raw=decode(match[1]||match[2]);if(/^(data:|blob:|#)/i.test(raw)||decodeURIComponent(raw).startsWith('#'))continue;
  if(/^(https?:)?\/\//i.test(raw)){remote.add(raw);continue;}
  if(/^[a-z]+:/i.test(raw)||path.isAbsolute(raw)||raw.includes('?')||raw.includes('#'))throw new Error('Tư liệu render cần là đường dẫn file tương đối: '+raw);
  references.add(decodeURIComponent(raw));
 }
 if(references.size>5000)throw new Error('Bản dựng có quá nhiều file tham chiếu.');
 const id=crypto.randomUUID(),directory=path.join(projectDir,'work','render-snapshots',id),assets=[];
 fs.mkdirSync(directory,{recursive:true});
 try{
  const files=[...references].map(relative=>({...resolveContained(projectDir,relative),relative}));
  const bytes=files.reduce((sum,item)=>{const stat=fs.statSync(item.file);if(!stat.isFile())throw new Error('Tư liệu không phải file.');return sum+stat.size;},0),disk=fs.statfsSync(directory);
  if(Number(disk.bavail)*Number(disk.bsize)<bytes+256*1024**2)throw new Error('Không đủ dung lượng tạo bản chụp render.');
  for(const item of files){
   const before=fs.statSync(item.file),destination=path.resolve(directory,item.relative),relative=path.relative(directory,destination);
   if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Tư liệu ngoài bản chụp render.');
   fs.mkdirSync(path.dirname(destination),{recursive:true});const hash=crypto.createHash('sha256');
   await pipeline(fs.createReadStream(item.file),new Transform({transform(chunk,encoding,done){hash.update(chunk);done(null,chunk);}}),fs.createWriteStream(destination,{flags:'wx'}));
   const after=fs.statSync(item.file);if(before.size!==after.size||before.mtimeMs!==after.mtimeMs)throw new Error('Tư liệu thay đổi khi chụp render: '+item.relative);
   assets.push({path:item.relative,bytes:before.size,sha256:hash.digest('hex')});
  }
  assertProjectRevision(file,revision);
  fs.writeFileSync(path.join(directory,'project.json'),JSON.stringify(project,null,2)+'\n',{flag:'wx'});fs.writeFileSync(path.join(directory,'index.html'),html,{flag:'wx'});
  fs.mkdirSync(path.join(directory,'renders'));
  const manifest={schemaVersion:1,id,projectDir,revision,quality,createdAt:new Date().toISOString(),assets,bytes,remoteDependencies:[...remote]};
  fs.writeFileSync(path.join(directory,'snapshot.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
  return {directory,manifest};
 }catch(error){fs.rmSync(directory,{recursive:true,force:true});throw error;}
}
