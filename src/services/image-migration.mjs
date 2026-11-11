import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {resolveContained} from './storage.mjs';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function config(root){const file=path.join(root,'config/sources.local.json'),text=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';return {file,text,source:path.resolve((text?JSON.parse(text):{}).aievRoot||path.join(path.dirname(root),'AIEVv2'))};}
function read(folder,relative){
 const file=resolveContained(folder,path.join(relative,'meta.json')).file;
 if(fs.statSync(file).size>4*1024**2)throw new Error('Metadata ảnh vượt 4 MiB.');
 const bytes=fs.readFileSync(file),data=JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''));
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Metadata ảnh sai cấu trúc.');
 return {data,metadataHash:hash(bytes)};
}
function imageFile(folder,relative,data,role){
 const name=data[role];
 if(typeof name!=='string'||name!==path.basename(name)||/[\\/:\0]/.test(name)||name.startsWith('.')||!/^.+\.(png|jpe?g)$/i.test(name))throw new Error('File ảnh cần tên PNG/JPEG trong dự án nguồn.');
 const file=resolveContained(folder,path.join(relative,name)).file,stat=fs.statSync(file);
 if(!stat.isFile()||stat.size<24||stat.size>20*1024**2)throw new Error('Ảnh nhập cần PNG/JPEG tối đa 20 MiB.');
 return {file,name,bytes:stat.size,sha256:hash(fs.readFileSync(file))};
}
export function previewAievImages(root,{cursor,limit=200}={}){
 if(!Number.isSafeInteger(limit)||limit<1||limit>200)throw new Error('Giới hạn trang ảnh phải từ1đến200.');
 const result={entries:[],issues:[],truncated:false,nextCursor:null};
 try{
  const c=config(root);if(c.source===path.resolve(root))throw new Error('Nguồn không được là ContentOS.');
  if(!fs.existsSync(path.join(c.source,'image-projects')))return result;
  const folder=resolveContained(c.source,'image-projects').file,dirs=fs.readdirSync(folder,{withFileTypes:true}).filter(d=>d.isDirectory()&&!d.isSymbolicLink()&&!d.name.startsWith('.')).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0),catalogHash=hash(Buffer.from(JSON.stringify([c.source,dirs.map(d=>d.name)])));
  let offset=0,visited=0,totalBytes=0;
  if(cursor){if(typeof cursor!=='string'||cursor.length>1024)throw new Error('Trang ảnh không hợp lệ.');const decoded=JSON.parse(Buffer.from(cursor,'base64url').toString());if(decoded.catalogHash!==catalogHash)throw new Error('Danh mục nguồn đã đổi. Khảo sát lại từ trang đầu.');if(!Number.isSafeInteger(decoded.offset)||decoded.offset<0||decoded.offset>dirs.length*2)throw new Error('Trang ảnh không hợp lệ.');offset=decoded.offset;}
  let position=offset;
  for(;position<dirs.length*2;){
   if(visited>=4000||result.entries.length>=limit||totalBytes>=64*1024**2)break;
   const dir=dirs[Math.floor(position/2)],role=['background','final'][position%2];position++;visited++;
   try{
    const {data,metadataHash}=read(folder,dir.name);
     if(!data[role])continue;
     try{const image=imageFile(folder,dir.name,data,role);totalBytes+=image.bytes;result.entries.push({id:'aiev-image:'+dir.name+'/'+role,relative:dir.name,role,title:String(data.name||dir.name).slice(0,180)+(role==='final'?' · Ảnh hoàn thiện':' · Ảnh nền'),format:'aiev-image',canImport:true,metadataHash,imageHash:image.sha256,imageBytes:image.bytes,message:'Sao chép ảnh/prompt vào thư viện workspace. Ảnh hoàn thiện là ảnh phẳng; chưa chuyển lớp chữ Remotion.'});}catch(error){result.issues.push(dir.name+'/'+role+': '+error.message);}
   }catch(error){result.issues.push(dir.name+': '+error.message);}
  }
  if(position<dirs.length*2){result.truncated=true;result.nextCursor=Buffer.from(JSON.stringify({offset:position,catalogHash})).toString('base64url');}
 }catch(error){result.issues.push(error.message);}
 return result;
}
const importing=new Set();
export async function importAievImage(root,workspaceStore,imageService,body={},options={}){
 const workspaceId=workspaceStore.active().id,fail=message=>{throw Object.assign(new Error(message),{status:409});};
 if(body.workspaceId!==workspaceId)fail('Workspace đã đổi. Khảo sát lại ảnh.');
 const lock=path.resolve(root)+':'+workspaceId;if(importing.has(lock))fail('Đang nhập ảnh vào workspace. Đợi hoàn tất.');importing.add(lock);
 try{
  const match=typeof body.id==='string'&&/^aiev-image:([^\\/:\0]+)\/(background|final)$/.exec(body.id);
  if(!match||match[1].startsWith('.'))fail('Ảnh hoặc metadata nguồn đã đổi. Khảo sát lại.');
  const c=config(root);if(c.source===path.resolve(root))fail('Nguồn không được là ContentOS.');
  const folder=resolveContained(c.source,'image-projects').file,{data,metadataHash}=read(folder,match[1]);
  if(metadataHash!==body.metadataHash)fail('Ảnh hoặc metadata nguồn đã đổi. Khảo sát lại.');
  const image=imageFile(folder,match[1],data,match[2]);if(image.sha256!==body.imageHash)fail('Ảnh hoặc metadata nguồn đã đổi. Khảo sát lại.');
  const entry={id:body.id,relative:match[1],role:match[2],metadataHash,imageHash:image.sha256,title:String(data.name||match[1]).slice(0,180)};
  const validate=()=>{options.signal?.throwIfAborted();if(workspaceStore.active().id!==workspaceId||(fs.existsSync(c.file)?fs.readFileSync(c.file,'utf8'):'')!==c.text)fail('Workspace hoặc cấu hình nguồn đã đổi.');const current=read(folder,entry.relative);if(current.metadataHash!==entry.metadataHash||imageFile(folder,entry.relative,current.data,entry.role).sha256!==entry.imageHash)fail('Ảnh nguồn đã đổi trong lúc nhập.');};
  validate();
  for(const known of imageService.list(workspaceId)){const s=known.source;if(s?.app!=='aiev-image'||s.id!==entry.id||s.metadataHash!==entry.metadataHash||s.sha256!==entry.imageHash)continue;const asset=imageService.assetFile(workspaceId,known.id);if(fs.existsSync(asset.file)&&hash(fs.readFileSync(asset.file))===entry.imageHash)return {image:known,reused:true};}
  const text=v=>typeof v==='string'?v.slice(0,10000):null,overlay=data.overlay&&typeof data.overlay==='object'?data.overlay:{};
  const source={app:'aiev-image',id:entry.id,relative:entry.relative,role:entry.role,metadataHash:entry.metadataHash,sha256:entry.imageHash,model:text(data.model),styleId:text(data.styleId),kind:text(data.kind),overlay:{title:text(overlay.title),subtitle:text(overlay.subtitle),cta:text(overlay.cta),position:text(overlay.position),showLogo:overlay.showLogo===true,stats:Array.isArray(overlay.stats)?overlay.stats.slice(0,50).map(s=>({label:text(s?.label),value:text(s?.value)})):[]}};
  const imported=await imageService.importImage(workspaceId,fs.readFileSync(image.file),{name:image.name,prompt:text(data.prompt)||entry.title,source,validate});return {image:imported,reused:false};
 }finally{importing.delete(lock);}
}
