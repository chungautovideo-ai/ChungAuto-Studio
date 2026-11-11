import fs from 'node:fs';import path from 'node:path';
import {resolveContained} from './storage.mjs';
import {validateAnnotationFilter,matchesAnnotationFilter} from './source-annotations.mjs';
const types={all:/\.(mp4|mov|m4v|webm|png|jpe?g|webp|gif|wav|mp3|m4a|aac)$/i,video:/\.(mp4|mov|m4v|webm)$/i,image:/\.(png|jpe?g|webp|gif)$/i,audio:/\.(wav|mp3|m4a|aac)$/i};
let active=0;
export async function searchSourceTree(root,relative,{query='',kind='all',tag='',rights='all',readAnnotation,validate=()=>{},signal,limits={}}={}){
 const annotationFilter=validateAnnotationFilter({tag,rights}),filterByAnnotation=!!annotationFilter.tag||rights!=='all';
 if(typeof query!=='string'||query.trim().length<2&&!filterByAnnotation||query.length>200||!types[kind])throw new Error('Nhập ít nhất 2 ký tự tên hoặc chọn nhãn/quyền dùng để tìm.');
 if(filterByAnnotation&&typeof readAnnotation!=='function')throw new Error('Thiếu kho thông tin tư liệu.');
 if(active>=2)throw new Error('Đang tìm trong hai kho nguồn. Thử lại sau.');
 const maxEntries=Math.min(limits.entries||5000,5000),maxFolders=Math.min(limits.folders||200,200),maxResults=Math.min(limits.results||100,100),maxDepth=Math.min(limits.depth??8,8),deadline=Date.now()+15000;
 const base=resolveContained(root,relative);if(!fs.statSync(base.file).isDirectory())throw new Error('Chọn thư mục để tìm.');
 const check=()=>{signal?.throwIfAborted();validate();};check();active++;
 try{
  const queue=[{relative:base.relative,depth:0}],entries=[];let scanned=0,folders=0,unreadable=0,truncated=false,reason=null;
  const needle=query.normalize('NFC').toLocaleLowerCase('vi');
  outer:while(queue.length){
   check();if(folders>=maxFolders||scanned>=maxEntries||Date.now()>deadline){truncated=true;reason='scan-limit';break;}
   const current=queue.shift();let dir;
   try{const resolved=resolveContained(root,current.relative);dir=await fs.promises.opendir(resolved.file);folders++;}
   catch{check();unreadable++;continue;}
   try{
    for await(const entry of dir){
     check();if(scanned>=maxEntries||Date.now()>deadline){truncated=true;reason='scan-limit';break outer;}scanned++;
     if(entry.isSymbolicLink())continue;
     const child=[current.relative,entry.name].filter(Boolean).join('/');
     if(entry.isDirectory()){if(current.depth<maxDepth)queue.push({relative:child,depth:current.depth+1});else{truncated=true;reason='depth-limit';}continue;}
     if(!entry.isFile()||!types[kind].test(entry.name)||!entry.name.normalize('NFC').toLocaleLowerCase('vi').includes(needle))continue;
     try{const contained=resolveContained(root,child),stat=await fs.promises.stat(contained.file);if(stat.isFile()&&(!filterByAnnotation||matchesAnnotationFilter(await readAnnotation(contained.file),annotationFilter)))entries.push({name:entry.name,relative:contained.relative,directory:false,bytes:stat.size});}catch{unreadable++;}
     if(entries.length>=maxResults){truncated=true;reason='result-limit';break outer;}
    }
   }finally{await dir.close().catch(()=>{});}
  }
  check();return {relative:base.relative,entries,total:entries.length,nextOffset:null,parent:base.relative?path.posix.dirname(base.relative)==='.'?'':path.posix.dirname(base.relative):null,filter:{query,kind,tag,rights,scope:'subfolders'},scan:{entries:scanned,folders,unreadable,truncated,reason,limits:{entries:maxEntries,folders:maxFolders,results:maxResults,depth:maxDepth}}};
 }finally{active--;}
}
