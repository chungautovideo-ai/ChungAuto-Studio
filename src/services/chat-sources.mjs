import fs from 'node:fs/promises';
import path from 'node:path';
const media=/\.(mp4|mov|m4v|webm|png|jpe?g|webp|gif|wav|mp3|m4a|aac)$/i;

// Paths may appear inside prose. Filesystem inspection resolves trailing prose
// only within the final component; never fall back to a parent folder.
export function parseChatSources(text,{platform=process.platform}={}){
 const result=[];
 for(const raw of String(text||'').split(/\r?\n/)){
  const starts=[...raw.matchAll(platform==='win32'?/(?<![\w/\\])(?:[a-z]:[\\/]|\\\\(?=[^\\\s]+\\))/gi:/(?<![\w/:])\/(?=[^/\s])/g)];
  for(let i=0;i<starts.length;i++){
   const start=starts[i].index,next=starts[i+1]?.index??raw.length;
   const context=raw.slice(i?starts[i-1].index:start===0?0:Math.max(0,start-80),start);
   const labels=[...context.matchAll(/\b(a[\s-]?roll|b[\s-]?roll|nguồn|source)\b/gi)];
   const label=labels.at(-1)?.[1],role=label?/^a/i.test(label)?'aroll':/^b/i.test(label)?'broll':'source':'source';
   const quote=raw[start-1];let value=raw.slice(start,next).trim();
   if(['"',"'",'`'].includes(quote)){const end=value.indexOf(quote);if(end<0)continue;value=value.slice(0,end);}
   else value=value.replace(/\s+(?:và\s+)?(?:a[\s-]?roll|b[\s-]?roll|nguồn|source)(?:\s+(?:ở|tại)\s+đây)?\s*[:=]?\s*["'`]?$/i,'').trim();
   if(!value||value.includes('\0'))continue;
   if(!result.some(s=>s.path===value&&s.role===role))result.push({path:value,role});
   if(result.length===12)return result;
  }
 }
 return result;
}

async function resolveSource(source,text,deadline){
 try{return {source,stat:await fs.lstat(source.path)};}catch(error){
  if(!['ENOENT','ENOTDIR','EINVAL'].includes(error.code))throw error;
  if(['"',"'",'`'].some(q=>String(text).includes(q+source.path+q)))throw error;
  const separator=Math.max(source.path.lastIndexOf('\\'),source.path.lastIndexOf('/'));
  const boundaries=[...source.path.matchAll(/\s+/g)].map(m=>m.index).filter(i=>i>separator).reverse().slice(0,24);
  for(const boundary of boundaries){
   if(Date.now()>=deadline)throw new Error('Kiểm tra nguồn quá thời gian; kiểm tra mạng/NAS rồi thử lại.');
   const candidate=source.path.slice(0,boundary).replace(/[;,]+$/,'');
   try{return {source:{...source,path:candidate,detectedFrom:source.path},stat:await fs.lstat(candidate)};}catch(next){if(!['ENOENT','ENOTDIR','EINVAL'].includes(next.code))throw next;}
  }
  throw error;
 }
}

export async function inspectChatSources(text,{platform=process.platform,timeoutMs=6000,maxEntries=200}={}){
 const sources=parseChatSources(text,{platform});
 return Promise.all(sources.map(async source=>{
  let timer;
  const deadline=Date.now()+timeoutMs;
  const inspect=async()=>{
   const resolved=await resolveSource(source,text,deadline);source=resolved.source;const stat=resolved.stat;
   if(stat.isSymbolicLink())throw new Error('Đường dẫn liên kết cần chọn thư mục/file gốc.');
   if(stat.isFile()){
    if(!media.test(source.path))throw new Error('Không phải file media hỗ trợ.');
    return {...source,status:'ready',kind:'file',files:[{name:path.basename(source.path),path:source.path,bytes:stat.size}],truncated:false,recursive:false};
   }
   if(!stat.isDirectory())throw new Error('Không phải thư mục hoặc file.');
   const files=[],queue=[{folder:source.path,depth:0}];let examined=0,subdirectories=0,truncated=false,visitedNested=false;
   while(queue.length){
    const {folder,depth}=queue.shift();if(Date.now()>=deadline)throw new Error('Kiểm tra nguồn quá thời gian; kiểm tra mạng/NAS rồi thử lại.');
    const dir=await fs.opendir(folder);if(depth)visitedNested=true;
    for await(const entry of dir){
     if(Date.now()>=deadline)throw new Error('Kiểm tra nguồn quá thời gian; kiểm tra mạng/NAS rồi thử lại.');
     if(++examined>maxEntries){truncated=true;break;}
     if(entry.isDirectory()){subdirectories++;if(source.role==='broll'){if(depth<3)queue.push({folder:path.join(folder,entry.name),depth:depth+1});else truncated=true;}}
     else if(entry.isFile()&&media.test(entry.name))files.push({name:entry.name,path:path.join(folder,entry.name)});
    }
    if(examined>maxEntries)break;
   }
   return {...source,status:'ready',kind:'directory',files,examinedEntries:Math.min(examined,maxEntries),subdirectories,truncated,recursive:visitedNested};
  };
  try{return await Promise.race([inspect(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Kiểm tra nguồn quá thời gian; kiểm tra mạng/NAS rồi thử lại.')),timeoutMs);})]);}
  catch(error){return {...source,status:'error',error:error.code==='ENOENT'?'Không tìm thấy đường dẫn.':error.code==='EACCES'||error.code==='EPERM'?'Máy hiện tại không có quyền đọc nguồn.':error.message};}
  finally{clearTimeout(timer);}
 }));
}
