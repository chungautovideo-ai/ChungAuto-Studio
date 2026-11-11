import fs from 'node:fs';import path from 'node:path';
const types={'.mp4':'video/mp4','.m4v':'video/mp4','.mov':'video/quicktime','.webm':'video/webm','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.mp3':'audio/mpeg','.wav':'audio/wav','.m4a':'audio/mp4','.aac':'audio/aac'};
export function mediaRange(value,size){
 if(!value)return null;
 const match=/^bytes=(\d*)-(\d*)$/.exec(value);if(!match||!size||!match[1]&&!match[2])throw new Error('Invalid range');
 let start,end;
 if(!match[1]){const suffix=Number(match[2]);if(!Number.isSafeInteger(suffix)||suffix<=0)throw new Error('Invalid range');start=Math.max(0,size-suffix);end=size-1;}
 else{start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),size-1):size-1;}
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size)throw new Error('Invalid range');
 return {start,end};
}
export async function streamMedia(req,res,file,{validate=()=>{}}={}){
 validate();const handle=await fs.promises.open(file,'r');
 try{
  validate();const stat=await handle.stat();if(!stat.isFile())throw new Error('Không phải file media.');
  let range;try{range=mediaRange(req.headers.range,stat.size);}catch{await handle.close();res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});res.end();return;}
  const headers={'Content-Type':types[path.extname(file).toLowerCase()]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Length':range?range.end-range.start+1:stat.size};
  if(range)headers['Content-Range']=`bytes ${range.start}-${range.end}/${stat.size}`;
  res.writeHead(range?206:200,headers);
  if(req.method==='HEAD'){await handle.close();res.end();return;}
  const stream=handle.createReadStream(range?{start:range.start,end:range.end}:{});
  res.once('close',()=>stream.destroy());stream.once('error',()=>res.destroy());stream.pipe(res);
 }catch(error){await handle.close().catch(()=>{});throw error;}
}
