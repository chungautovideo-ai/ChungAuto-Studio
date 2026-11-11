import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {validateBrollEntrance} from '../../editor/lib/broll-transition.js';

export class ProjectConflict extends Error {
  constructor(message,code='PROJECT_REVISION_CONFLICT'){super(message);this.status=409;this.code=code;}
}
export function projectRevision(file){
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
export function assertProjectRevision(file,expected){
  const actual=projectRevision(file);
  if(!expected||expected!==actual)throw new ProjectConflict('Bản dựng đã thay đổi hoặc thiếu phiên bản gốc. Giữ lại chỉnh sửa đang có và tải bản mới trước khi lưu.');
  return actual;
}
// Synchronous compare + atomic replace keeps competing saves in this process ordered.
// Hashing file bytes also detects writers outside this process, including AI tools.
export function commitProject(file,project,expected){
  assertProjectRevision(file,expected);
  for(const b of Array.isArray(project?.brolls)?project.brolls:[])validateBrollEntrance(b); // trước khi ghi .history
  const stored=JSON.parse(fs.readFileSync(file,'utf8'));
  const next={...project,workspaceId:stored.workspaceId||'default',contentos:stored.contentos||{schemaVersion:1,workspaceId:stored.workspaceId||'default'}};
  const folder=path.dirname(file),history=path.join(folder,'.history');
  fs.mkdirSync(history,{recursive:true});
  const stamp=`${Date.now()}${crypto.randomInt(1000,10000)}`;
  fs.copyFileSync(file,path.join(history,`project-${stamp}.json`));
  const temp=path.join(folder,`.project-${crypto.randomUUID()}.tmp`);
  try{
    fs.writeFileSync(temp,JSON.stringify(next,null,2)+'\n',{flag:'wx'});
    assertProjectRevision(file,expected);
    fs.renameSync(temp,file);
  }finally{fs.rmSync(temp,{force:true});}
  const old=fs.readdirSync(history).filter(f=>/^project-\d+\.json$/.test(f)).sort();
  for(const f of old.slice(0,Math.max(0,old.length-30)))fs.rmSync(path.join(history,f));
  return {project:next,revision:projectRevision(file)};
}
