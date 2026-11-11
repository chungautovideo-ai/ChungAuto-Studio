import fs from 'node:fs';
import {NasError} from './nas-check.mjs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import {probeMediaMetadata} from './media-metadata.mjs';
import {createSourceAnnotations,validateAnnotationFilter,matchesAnnotationFilter} from './source-annotations.mjs';
import {readProjectSourceHistory} from './project-source-history.mjs';
import {verifyArtifactAsync} from './artifact-integrity.mjs';
const MEDIA=/\.(mp4|mov|m4v|webm|png|jpe?g|webp|gif|wav|mp3|m4a|aac)$/i;
async function matchesStoredAsset(project,asset,bytes,sha256,validate){
  try{
    const known=resolveContained(project,asset.path);
    const before=await fs.promises.stat(known.file);
    if(!before.isFile()||before.size!==bytes)return false;
    const digest=crypto.createHash('sha256');
    for await(const chunk of fs.createReadStream(known.file)){validate();digest.update(chunk);}
    validate();const after=await fs.promises.stat(known.file);
    return after.size===before.size&&after.mtimeMs===before.mtimeMs&&after.ino===before.ino&&digest.digest('hex')===sha256;
  }catch(error){validate();return false;}
}
export function resolveContained(base,relative='') {
  if(typeof relative!=='string'||path.isAbsolute(relative))throw new Error('Đường dẫn tương đối không hợp lệ.');
  const root=fs.realpathSync(base), file=fs.realpathSync(path.resolve(root,relative));
  const rel=path.relative(root,file);
  if(rel.startsWith('..')||path.isAbsolute(rel))throw new Error('Đường dẫn ngoài kho đã cấu hình.');
  return {root,file,relative:rel.replace(/\\/g,'/')};
}
export function createStorageService(root,workspaceStore){
  const annotations=createSourceAnnotations(root);
  const importing=new Set();
  function source(relative=''){
    const w=workspaceStore.active();if(!w.nasRoot)throw new Error('Chưa cấu hình kho NAS / thư mục dùng chung ở Không gian làm việc.');
    try{fs.realpathSync(w.nasRoot);}catch(e){throw new NasError(e,w.nasRoot);} // không vào được kho: nói rõ nguyên nhân + cách sửa
    try{return {...resolveContained(w.nasRoot,relative),workspace:w};}catch(e){if(e.code==='ENOENT'||e.code==='ENOTDIR')throw new Error('Không thấy file/thư mục này trong kho NAS (có thể đã bị đổi tên hoặc xoá). Bấm Tải lại.');throw e;}
  }
  async function attachFile(dir,s,validate=()=>{}){
      validate();
      if(!MEDIA.test(s.file)||!fs.statSync(s.file).isFile())throw new Error('Chỉ đưa file media vào dự án.');
      const project=resolveContained(path.join(root,'workspace/content'),path.relative(path.join(root,'workspace/content'),path.resolve(root,dir)));
      if(project.relative.split('/').length!==2)throw new Error('Không phải thư mục dự án.');
      const p=JSON.parse(fs.readFileSync(path.join(project.file,'project.json'),'utf8'));
      if((p.workspaceId||'default')!==s.workspace.id)throw new Error('Dự án không thuộc workspace đang dùng.');
      const folder=path.join(project.file,'inputs','library');fs.mkdirSync(folder,{recursive:true});resolveContained(project.file,'inputs/library');
      const sourceStat=fs.statSync(s.file);const disk=fs.statfsSync(folder);if(Number(disk.bavail)*Number(disk.bsize)<sourceStat.size+128*1024**2)throw new Error('Ổ local không đủ chỗ cho file và phần dung lượng dự phòng.');
      const id=crypto.randomUUID(),ext=path.extname(s.file).toLowerCase(),temp=path.join(folder,'.'+id+'.part'),dest=path.join(folder,id+ext);
      if(importing.has(project.file))throw new Error('Dự án đang nhập một file khác. Hãy đợi hoàn tất.');
      importing.add(project.file);
      const hash=crypto.createHash('sha256');let bytes=0;
      try{
        await pipeline(fs.createReadStream(s.file),new Transform({transform(chunk,enc,done){bytes+=chunk.length;hash.update(chunk);done(null,chunk);}}),fs.createWriteStream(temp,{flags:'wx'}));
        const after=fs.statSync(s.file);if(after.size!==sourceStat.size||after.mtimeMs!==sourceStat.mtimeMs)throw new Error('File nguồn thay đổi trong khi sao chép. Hãy thử lại sau khi nguồn ổn định.');
        validate();
        const manifestFile=path.join(project.file,'work','source-assets.json');const manifest=fs.existsSync(manifestFile)?JSON.parse(fs.readFileSync(manifestFile,'utf8')):{schemaVersion:1,assets:[]};
        const sha256=hash.digest('hex');let old;
        for(const asset of manifest.assets.filter(a=>a.sha256===sha256)){
          if(await matchesStoredAsset(project.file,asset,bytes,sha256,validate)){old=asset;break;}
        }
        validate();
        if(old){fs.unlinkSync(temp);return {duplicate:true,asset:old};}
        const annotationSnapshot=annotations.read(s.workspace.id,s.file);
        fs.renameSync(temp,dest);
        const asset={id,name:path.basename(s.file),path:'inputs/library/'+path.basename(dest),bytes,sha256,source:{root:s.root,relative:s.relative,mtimeMs:sourceStat.mtimeMs,...(s.role?{role:s.role}:{})},...(s.provenance?{provenance:s.provenance}:{}),annotations:annotationSnapshot,workspaceId:s.workspace.id,importedAt:new Date().toISOString()};

        try{
          manifest.assets.push(asset);fs.mkdirSync(path.dirname(manifestFile),{recursive:true});
          const pending=manifestFile+'.'+id+'.tmp';fs.writeFileSync(pending,JSON.stringify(manifest,null,2));fs.renameSync(pending,manifestFile);
        }catch(e){fs.rmSync(dest,{force:true});throw e;}
        return {duplicate:false,asset};
      }finally{importing.delete(project.file);fs.rmSync(temp,{force:true});}
  }
  return {
    async verifyProjectSource(dir,assetPath,{workspaceId=workspaceStore.active().id,signal,validate=()=>{}}={}){
      const check=()=>{signal?.throwIfAborted();validate();if(workspaceStore.active().id!==workspaceId)throw new Error('Workspace đã đổi.');};check();
      const project=resolveContained(path.join(root,'workspace/content'),path.relative(path.join(root,'workspace/content'),path.resolve(root,dir)));
      if(project.relative.split('/').length!==2)throw new Error('Không phải thư mục dự án.');
      const validateProject=()=>{check();const data=JSON.parse(fs.readFileSync(resolveContained(project.file,'project.json').file,'utf8'));if((data.workspaceId||'default')!==workspaceId)throw new Error('Dự án không thuộc workspace.');};validateProject();
      const record=readProjectSourceHistory(project.file).find(asset=>asset.path===assetPath);
      if(!record)throw new Error('File không có trong lịch sử nguồn.');
      if(!Number.isSafeInteger(record.bytes)||record.bytes<32||!/^[a-f0-9]{64}$/.test(record.sha256||''))throw new Error('Nguồn thiếu thông tin kiểm tra SHA256/dung lượng.');
      const file=resolveContained(project.file,record.path).file,fingerprint=JSON.stringify(record);
      try{await verifyArtifactAsync(file,record,{signal,validate:check});}
      catch(error){check();if(error.message==='Nội dung file xuất đã thay đổi.')throw new Error('Nội dung tư liệu đã thay đổi so với lúc nhập.');throw error;}
      validateProject();const current=readProjectSourceHistory(project.file).find(asset=>asset.path===assetPath);
      if(JSON.stringify(current)!==fingerprint||resolveContained(project.file,record.path).file!==file)throw new Error('Thông tin tư liệu đã đổi trong lúc kiểm tra.');
      return {workspaceId,path:record.path,sha256:record.sha256,bytes:record.bytes,verifiedAt:new Date().toISOString(),matches:true};
    },
    projectSources(dir,{workspaceId=workspaceStore.active().id,offset=0}={}){
      if(workspaceStore.active().id!==workspaceId)throw new Error('Workspace đã đổi.');
      const project=resolveContained(path.join(root,'workspace/content'),path.relative(path.join(root,'workspace/content'),path.resolve(root,dir)));
      if(project.relative.split('/').length!==2)throw new Error('Không phải thư mục dự án.');
      const data=JSON.parse(fs.readFileSync(resolveContained(project.file,'project.json').file,'utf8'));
      if((data.workspaceId||'default')!==workspaceId)throw new Error('Dự án không thuộc workspace.');
      const assets=readProjectSourceHistory(project.file);
      offset=Math.max(0,Math.floor(Number(offset)||0));
      const entries=assets.slice(offset,offset+100).map(asset=>{
        let localState='missing';try{const file=resolveContained(project.file,asset.path);const stat=fs.statSync(file.file);localState=!stat.isFile()?'invalid':!Number.isSafeInteger(asset.bytes)?'size-unknown':stat.size!==asset.bytes?'size-changed':'present';}catch(error){if(error.code!=='ENOENT'&&error.code!=='ENOTDIR')localState='invalid';}
        return {id:asset.id,name:asset.name,path:asset.path,bytes:asset.bytes,sha256:asset.sha256,source:asset.source,sourceKinds:asset.sourceKinds,provenance:asset.provenance,voiceVersions:asset.voiceVersions,annotations:asset.annotations||null,importedAt:asset.importedAt,localState};
      });
      return {workspaceId,dir,total:assets.length,entries,nextOffset:offset+100<assets.length?offset+100:null,integrity:'presence-and-size-only'};
    },
    annotations(relative,workspaceId,body){
      if(workspaceId!==workspaceStore.active().id)throw new Error('Workspace đã đổi.');
      const selected=source(relative);if(!MEDIA.test(selected.file)||!fs.statSync(selected.file).isFile())throw new Error('Chọn file media.');
      return body?annotations.save(workspaceId,selected.file,body):annotations.read(workspaceId,selected.file);
    },
    previewSource(relative,workspaceId){
      if(workspaceId!==workspaceStore.active().id)throw new Error('Workspace đã đổi.');
      const selected=source(relative);
      if(!MEDIA.test(selected.file)||!fs.statSync(selected.file).isFile())throw new Error('Chọn file media trong kho.');
      return selected.file;
    },
    async mediaInfo(relative,{workspaceId=workspaceStore.active().id}={}){
      const selected=source(relative);
      const validate=()=>{if(workspaceStore.active().id!==workspaceId||selected.workspace.id!==workspaceId)throw new Error('Workspace đã đổi.');const current=source(relative);if(current.file!==selected.file||!MEDIA.test(current.file))throw new Error('Nguồn đã đổi hoặc không phải media.');};
      return {workspaceId,relative:selected.relative,...await probeMediaMetadata(selected.file,{validate})};
    },
    async attachSelected(dir,sources,selected,{workspaceId=workspaceStore.active().id,validate=()=>{},provenance}={}){
      const declared=sources.find(s=>s.status==='ready'&&s.files?.some(f=>f.path===selected));
      if(!declared)throw new Error('File chưa có trong danh sách nguồn được giao. Kiểm kê lại nguồn trước.');
      const allowed=declared.kind==='file'?resolveContained(path.dirname(declared.path),path.basename(declared.path)):resolveContained(declared.path,path.relative(declared.path,selected));
      if(fs.lstatSync(selected).isSymbolicLink())throw new Error('Không nhập file liên kết.');
      return attachFile(dir,{...allowed,role:declared.role,provenance,workspace:{id:workspaceId}},validate);
    },
    browse(relative='',offset=0,{query='',kind='all',tag='',rights='all'}={}){
      const annotationFilter=validateAnnotationFilter({tag,rights});
      if(typeof query!=='string'||query.length>200||!['all','video','image','audio'].includes(kind))throw new Error('Bộ lọc kho nguồn không hợp lệ.');
      const search=query.normalize('NFC').toLocaleLowerCase('vi');
      const extensions={video:/\.(mp4|mov|m4v|webm)$/i,image:/\.(png|jpe?g|webp|gif)$/i,audio:/\.(wav|mp3|m4a|aac)$/i};
      const s=source(relative);if(!fs.statSync(s.file).isDirectory())throw new Error('Không phải thư mục.');
      const all=fs.readdirSync(s.file,{withFileTypes:true}).filter(e=>!e.isSymbolicLink()&&(e.isDirectory()||e.isFile()&&MEDIA.test(e.name)&&(!search||e.name.normalize('NFC').toLocaleLowerCase('vi').includes(search))&&(kind==='all'||extensions[kind].test(e.name))&&(!(annotationFilter.tag||rights!=='all')||matchesAnnotationFilter(annotations.read(s.workspace.id,path.join(s.file,e.name)),annotationFilter)))).sort((a,b)=>Number(b.isDirectory())-Number(a.isDirectory())||a.name.localeCompare(b.name));
      offset=Math.max(0,Math.floor(Number(offset)||0));
      return {workspaceId:s.workspace.id,relative:s.relative,filter:{query,kind,tag,rights,scope:'current-folder'},parent:s.relative?path.posix.dirname(s.relative)==='.'?'':path.posix.dirname(s.relative):null,total:all.length,nextOffset:offset+100<all.length?offset+100:null,entries:all.slice(offset,offset+100).map(e=>({name:e.name,relative:[s.relative,e.name].filter(Boolean).join('/'),directory:e.isDirectory(),bytes:e.isFile()?fs.statSync(path.join(s.file,e.name)).size:null}))};
    },
    async attach(dir,relative,{workspaceId=workspaceStore.active().id}={}){
      const selected=source(relative);
      const validate=()=>{if(workspaceStore.active().id!==workspaceId||selected.workspace.id!==workspaceId)throw new Error('Workspace đã đổi. Chọn lại nguồn trước khi nhập.');};
      return attachFile(dir,selected,validate);
    },
  };
}
