import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {commitProject,projectRevision} from './project-revisions.mjs';

// File dự án (.cosproj, JSON) chứa toàn bộ trạng thái chỉnh sửa + liên kết tới thư mục dự án và media gốc.
// Liên kết lưu cả đường dẫn tương đối (tính từ thư mục chứa file .cosproj, ưu tiên khi mở) và tuyệt đối.
export const PROJECT_FILE_EXT='.cosproj';
const FORMAT='contentos-project',MEDIA=/\.(mp4|mov|webm|m4v|mkv|png|jpe?g|webp|gif|mp3|wav|m4a|aac|ogg|flac)$/i,AREAS=/^(inputs|assets|work)\//;
const slash=p=>p.replace(/\\/g,'/');
const sameRoot=(a,b)=>path.parse(path.resolve(a)).root.toLowerCase()===path.parse(path.resolve(b)).root.toLowerCase();

// Mọi chuỗi trong project.json trỏ tới media nằm trong thư mục dự án (inputs/, assets/, work/).
export function mediaRefs(project){
 const refs=new Set();
 (function walk(v){if(typeof v==='string'){if(AREAS.test(v)&&MEDIA.test(v)&&!v.split('/').includes('..'))refs.add(v);}else if(v&&typeof v==='object')for(const x of Object.values(v))walk(x);})(project);
 return [...refs].sort();
}
export function linkPath(fromDir,target){
 const abs=path.resolve(target);
 return {rel:sameRoot(fromDir,abs)?slash(path.relative(fromDir,abs))||'.':null,abs};
}
// Thứ tự: tương đối (mang cả thư mục sang máy khác vẫn đúng) → tuyệt đối.
export function resolveLink(fromDir,link,exists=fs.existsSync){
 for(const c of [link?.rel!=null?path.resolve(fromDir,link.rel):null,link?.abs||null])if(c&&exists(c))return c;
 return null;
}
export function readProjectFile(file){
 let doc;
 try{doc=JSON.parse(fs.readFileSync(file,'utf8'));}catch(error){throw new Error('Không đọc được file dự án: '+error.message);}
 if(doc?.format!==FORMAT||doc.schemaVersion!==1||!doc.project||typeof doc.project!=='object'||!Array.isArray(doc.project.segments))throw new Error('File không phải dự án ContentOS hợp lệ.');
 return doc;
}
export function writeProjectFile(file,{projectDir,project,revision}){
 const dir=path.dirname(path.resolve(file));
 const doc={format:FORMAT,schemaVersion:1,savedAt:new Date().toISOString(),name:path.basename(file,PROJECT_FILE_EXT),
  projectFolder:linkPath(dir,projectDir),revision,project,
  media:mediaRefs(project).map(ref=>({ref,...linkPath(dir,path.join(projectDir,ref))}))};
 fs.mkdirSync(dir,{recursive:true});
 const temp=path.join(dir,`.${path.basename(file)}.${crypto.randomUUID()}.tmp`);
 try{fs.writeFileSync(temp,JSON.stringify(doc,null,2)+'\n',{flag:'wx'});fs.renameSync(temp,file);}finally{fs.rmSync(temp,{force:true});}
 return doc;
}
// Thư mục dự án dùng được: tìm thấy và nằm trong kho dự án của app (ngoài kho thì nhập bản sao vào kho).
function projectFolder(file,doc,workspaceRoot){
 const found=resolveLink(path.dirname(path.resolve(file)),doc.projectFolder);
 const rel=found&&path.relative(path.resolve(workspaceRoot),found); // khác gốc (X: vs \\máy\...) → relative trả về đường dẫn tuyệt đối
 const inside=!!rel&&!rel.startsWith('..')&&!path.isAbsolute(rel)&&fs.existsSync(path.join(found,'project.json'));
 return {found,usable:inside?found:null};
}
// Kế hoạch mở: tìm từng media, liệt kê cái thiếu để người dùng chọn lại.
export function inspectProjectFile(file,{workspaceRoot,relinks={}}){
 const doc=readProjectFile(file),base=path.dirname(path.resolve(file)),{found,usable}=projectFolder(file,doc,workspaceRoot);
 const links=new Map((doc.media||[]).map(m=>[m.ref,m]));
 const media=mediaRefs(doc.project).map(ref=>{
  if(usable&&fs.existsSync(path.join(usable,ref)))return {ref,source:path.join(usable,ref),inPlace:true};
  const relink=relinks[ref]&&fs.existsSync(relinks[ref])?path.resolve(relinks[ref]):null;
  const source=relink||(found&&fs.existsSync(path.join(found,ref))?path.join(found,ref):null)||resolveLink(base,links.get(ref))
   ||[path.join(base,path.basename(ref)),path.join(base,ref)].find(c=>fs.existsSync(c))||null;
  return {ref,source,expected:links.get(ref)?.abs||ref,relinked:!!relink};
 });
 let newerOnDisk=false;
 if(usable){const disk=JSON.parse(fs.readFileSync(path.join(usable,'project.json'),'utf8'));const strip=({workspaceId,contentos,...rest})=>JSON.stringify(rest);
  newerOnDisk=strip(disk)!==strip(doc.project)&&fs.statSync(path.join(usable,'project.json')).mtimeMs>Date.parse(doc.savedAt||0);}
 return {doc,projectDir:usable,media,missing:media.filter(m=>!m.source).map(m=>({ref:m.ref,expected:m.expected})),newerOnDisk};
}
// Mở: chép media thiếu vào thư mục dự án (hoặc thư mục mới trong kho), ghi trạng thái từ file dự án qua commitProject (giữ .history).
export function restoreProjectFile(file,{workspaceRoot,newDir,workspaceId,relinks={},keepDisk=false}){
 const plan=inspectProjectFile(file,{workspaceRoot,relinks});
 if(plan.missing.length){const e=new Error('Thiếu '+plan.missing.length+' file media. Chọn lại đường dẫn rồi mở lại.');e.status=409;e.code='MEDIA_MISSING';e.missing=plan.missing;throw e;}
 const dir=plan.projectDir||newDir();
 for(const m of plan.media){
  if(m.inPlace)continue;
  const dest=path.join(dir,m.ref);fs.mkdirSync(path.dirname(dest),{recursive:true});
  if(fs.existsSync(dest))fs.rmSync(dest); // file cũ trong thư mục dự án hỏng/khác — thay bằng file người dùng chọn
  try{fs.linkSync(m.source,dest);}catch{fs.copyFileSync(m.source,dest);} // cùng ổ: hard link, không tốn dung lượng
 }
 const pj=path.join(dir,'project.json');
 if(fs.existsSync(pj)){if(!keepDisk)commitProject(pj,plan.doc.project,projectRevision(pj));}
 else{fs.mkdirSync(path.join(dir,'work'),{recursive:true});fs.writeFileSync(pj,JSON.stringify({...plan.doc.project,workspaceId,contentos:{...(plan.doc.project.contentos||{}),schemaVersion:1,workspaceId}},null,2)+'\n',{flag:'wx'});}
 return {dir,imported:!plan.projectDir,copied:plan.media.filter(m=>!m.inPlace).length};
}
// Liên kết dự án ↔ file .cosproj đang dùng (để "Lưu" cập nhật luôn file dự án).
const linkFile=dir=>path.join(dir,'work','project-file.json');
export function linkedProjectFile(dir){try{return JSON.parse(fs.readFileSync(linkFile(dir),'utf8')).file||'';}catch{return '';}}
export function setLinkedProjectFile(dir,file){fs.mkdirSync(path.join(dir,'work'),{recursive:true});fs.writeFileSync(linkFile(dir),JSON.stringify({file:path.resolve(file)},null,2)+'\n');}
// Bản khôi phục tự lưu (chỉnh sửa chưa lưu), xoá khi lưu thành công.
const recoveryFile=dir=>path.join(dir,'work','recovery.json');
export function writeRecovery(dir,project,baseRevision){
 fs.mkdirSync(path.join(dir,'work'),{recursive:true});const file=recoveryFile(dir),temp=file+'.'+crypto.randomUUID()+'.tmp';
 fs.writeFileSync(temp,JSON.stringify({savedAt:new Date().toISOString(),baseRevision:baseRevision||'',project})+'\n');fs.renameSync(temp,file);
}
export function readRecovery(dir){try{const r=JSON.parse(fs.readFileSync(recoveryFile(dir),'utf8'));return r?.project&&Array.isArray(r.project.segments)?r:null;}catch{return null;}}
export function clearRecovery(dir){fs.rmSync(recoveryFile(dir),{force:true});}
// Tên file xuất: chỉ tên (không đường dẫn), bỏ ký tự Windows cấm, luôn .mp4.
export function exportFileName(name,fallback='video'){
 let n=String(name||'').trim().replace(/^["']+|["']+$/g,'').split(/[\\/]/).pop().replace(/[<>:"|?*\x00-\x1f]/g,'').trim().replace(/[. ]+$/,'').replace(/\.(?:mp4\.)?json$/i,'');
 if(!n||/^\.+$/.test(n))n=fallback;
 if(!/\.mp4$/i.test(n))n+='.mp4';
 return n.slice(0,200);
}
