import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
export function validateAnnotationFilter({tag='',rights='all'}={}){
 if(typeof tag!=='string'||tag.length>60||!['all','unknown','owned','licensed','restricted'].includes(rights))throw new Error('Bộ lọc nhãn/quyền dùng không hợp lệ.');
 return {tag:tag.trim().normalize('NFC').toLocaleLowerCase('vi'),rights};
}
export function matchesAnnotationFilter(annotation,filter){
 const effectiveRights=annotation.sourceChanged?'unknown':annotation.rights;
 return (filter.rights==='all'||filter.rights===effectiveRights)&&(!filter.tag||annotation.tags.some(tag=>tag.normalize('NFC').toLocaleLowerCase('vi').includes(filter.tag)));
}
export function createSourceAnnotations(root){
 function location(workspaceId,file){
  if(typeof workspaceId!=='string'||!/^[a-zA-Z0-9-]+$/.test(workspaceId))throw new Error('Workspace không hợp lệ.');
  const id=crypto.createHash('sha256').update(path.resolve(file).toLocaleLowerCase()).digest('hex');
  return path.join(root,'workspace/contentos/source-annotations',workspaceId,id+'.json');
 }
 function read(workspaceId,file){
  const target=location(workspaceId,file),stat=fs.statSync(file);
  const value=fs.existsSync(target)?JSON.parse(fs.readFileSync(target,'utf8')):null;
  return {version:value?.version||null,tags:value?.tags||[],notes:value?.notes||'',rights:value?.rights||'unknown',evidence:value?.evidence||'',updatedAt:value?.updatedAt||null,sourceChanged:!!value&&(value.bytes!==stat.size||value.mtimeMs!==stat.mtimeMs)};
 }
 return {read,save(workspaceId,file,body){
  const current=read(workspaceId,file);if(body.expectedVersion!==current.version)throw new Error('Thông tin tư liệu đã đổi. Đọc lại trước khi lưu.');
  if(!Array.isArray(body.tags)||body.tags.length>30||body.tags.some(v=>typeof v!=='string'||!v.trim()||v.length>60)||typeof body.notes!=='string'||body.notes.length>4000||typeof body.evidence!=='string'||body.evidence.length>2000||!['unknown','owned','licensed','restricted'].includes(body.rights))throw new Error('Nhãn/ghi chú/quyền sử dụng không hợp lệ.');
  const stat=fs.statSync(file),value={schemaVersion:1,version:crypto.randomUUID(),tags:[...new Set(body.tags.map(t=>t.trim().normalize('NFC')))],notes:body.notes,rights:body.rights,evidence:body.evidence,bytes:stat.size,mtimeMs:stat.mtimeMs,updatedAt:new Date().toISOString()};
  const target=location(workspaceId,file);fs.mkdirSync(path.dirname(target),{recursive:true});const temp=target+'.'+crypto.randomUUID()+'.tmp';fs.writeFileSync(temp,JSON.stringify(value,null,2),{flag:'wx'});fs.renameSync(temp,target);return read(workspaceId,file);
 }};
}
