import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pipeline} from 'node:stream/promises';
import {Transform} from 'node:stream';
import {resolveContained} from './storage.mjs';
import {projectRevision,assertProjectRevision} from './project-revisions.mjs';
import {buildProject,buildHtml} from '../../editor/lib/build.mjs';
import {resolvePublishCover} from './publish-covers.mjs';
import {applyBatchVariables} from '../../editor/lib/batch-data.mjs';

const busy=new Set();
const metadata=['transcript.json','news-brief.json','voice-assets.json','source-assets.json','phone-assets.json','narration-project.json','publish-drafts.json'];
const media=/\.(mp4|mov|m4v|webm|wav|mp3|m4a|aac|png|jpe?g|webp|gif|svg|woff2?|ttf|otf)$/i;
// Independent editable projects, never hardlinks to media or copies of execution history.
export async function createProjectVariant(root,workspaceStore,{workspaceId,dir,revision,format,title,variables}={}, {signal,validate:validateRun=()=>{},batch,migrationSource}={}){
 const content=path.join(root,'workspace/content');
 const source=migrationSource?resolveContained(migrationSource.root,migrationSource.relative).file:resolveContained(content,path.relative(content,path.resolve(root,dir||''))).file;
 if(!migrationSource&&path.relative(content,source).split(path.sep).length!==2)throw new Error('Chọn một dự án trong danh sách.');
 if(!['9:16','16:9'].includes(format))throw new Error('Chọn tỷ lệ 9:16 hoặc 16:9.');
 if(title!==undefined&&(typeof title!=='string'||title.trim().length>160))throw new Error('Tên phiên bản tối đa 160 ký tự.');
 const file=path.join(source,migrationSource?.metadataFile||'project.json');assertProjectRevision(file,revision);
 const original=migrationSource?.projectOverride||JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'')),project=applyBatchVariables(original,variables);
 const validate=()=>{signal?.throwIfAborted();validateRun();if(workspaceStore.active().id!==workspaceId||(!migrationSource&&(project.workspaceId||'default')!==workspaceId))throw Object.assign(new Error('Workspace đã đổi hoặc không đúng dự án.'),{status:409});assertProjectRevision(file,revision);};
 validate();if(busy.has(root))throw Object.assign(new Error('Đang tạo phiên bản khác. Đợi hoàn tất rồi thử lại.'),{status:409});
 const staging=path.join(content,'_intake',crypto.randomUUID()),files=new Set();
 busy.add(root);fs.mkdirSync(staging,{recursive:true});
 try{
  const add=relative=>{if(files.size>=5000)throw new Error('Dự án vượt giới hạn 5000 file.');resolveContained(source,relative);files.add(relative.replaceAll('\\','/'));};
  let visited=0;const scan=(relative,depth=0)=>{
   if(depth>12)throw new Error('Thư mục tư liệu quá sâu.');
   for(const entry of fs.readdirSync(resolveContained(source,relative).file,{withFileTypes:true})){
    if(++visited>10000)throw new Error('Kho tư liệu vượt giới hạn kiểm kê.');
    if(entry.isSymbolicLink())throw new Error('Không sao chép tư liệu liên kết: '+entry.name);
    const next=path.join(relative,entry.name);if(entry.isDirectory())scan(next,depth+1);else if(entry.isFile()&&media.test(entry.name))add(next);
   }
  };
  for(const folder of ['inputs','assets'])if(fs.existsSync(path.join(source,folder)))scan(folder);
  for(const name of migrationSource?['transcript.json','source-assets.json','phone-assets.json','voice-assets.json']:metadata)if(fs.existsSync(path.join(source,'work',name)))add('work/'+name);
  const draftsFile=path.join(source,'work/publish-drafts.json');if(!migrationSource&&fs.existsSync(draftsFile)){
   const drafts=JSON.parse(fs.readFileSync(resolveContained(source,'work/publish-drafts.json').file,'utf8'));
   for(const entry of drafts.entries||[]){if(!entry.cover)continue;const cover=resolvePublishCover(source,workspaceId,entry.cover.name);if(cover.sha256!==entry.cover.sha256)throw new Error('Ảnh bìa đã thay đổi trước khi tạo phiên bản.');add(cover.path);add(cover.path.replace(/\.jpg$/,'.json'));}
  }
  const next=structuredClone(project);next.format=format;next.title=title?.trim()||`${project.title||path.basename(source)} · ${format}`;
  if(migrationSource){next.workspaceId=workspaceId;next.contentos={schemaVersion:1,workspaceId,migration:{app:migrationSource.app||'vek',sourceId:migrationSource.relative,sourceRevision:revision,importedAt:new Date().toISOString(),requiresReview:true}};}
  if(!migrationSource)next.contentos={...next.contentos,variant:{schemaVersion:1,sourceDir:dir,sourceRevision:revision,sourceFormat:project.format||'9:16',createdAt:new Date().toISOString(),layoutNeedsReview:true,...(variables?{variables}:{}),...(batch?{batchTaskId:batch.taskId,batchItem:batch.item}:{})}};
  // Include used work media (clean voice/matte/overlays) that build emits, but not jobs/logs/renders.
  const html=buildHtml(next,source);
  for(const match of html.matchAll(/\b(?:src|href)\s*=\s*"([^"]+)"|url\(\s*["']?([^\s)'";]+)["']?\s*\)/gi)){
   const raw=(match[1]||match[2]).replaceAll('&amp;','&');if(/^(https?:|data:|blob:|#|\/\/)/i.test(raw))continue;
   const relative=decodeURIComponent(raw);if(relative.startsWith('#'))continue;if(path.isAbsolute(relative)||/^[a-z]+:/i.test(relative)||relative.includes('?')||relative.includes('#'))throw new Error('Tham chiếu tư liệu không hỗ trợ: '+relative);
   if(!media.test(relative))throw new Error('Chỉ sao chép file tư liệu được hỗ trợ.');
   add(relative);
  }
  const entries=[...files].map(relative=>{const resolved=resolveContained(source,relative),stat=fs.statSync(resolved.file);if(!stat.isFile())throw new Error('Tư liệu không phải file.');return {relative,file:resolved.file,size:stat.size,mtimeMs:stat.mtimeMs};});
  const bytes=entries.reduce((n,x)=>n+x.size,0),disk=fs.statfsSync(staging);if(Number(disk.bavail)*Number(disk.bsize)<bytes+256*1024**2)throw new Error('Không đủ dung lượng tạo phiên bản.');
  const assets=[];
  for(const item of entries){
   validate();const target=path.resolve(staging,item.relative),rel=path.relative(staging,target);if(rel.startsWith('..')||path.isAbsolute(rel))throw new Error('Tư liệu ngoài phiên bản.');
   fs.mkdirSync(path.dirname(target),{recursive:true});const hash=crypto.createHash('sha256');
   await pipeline(fs.createReadStream(item.file),new Transform({transform(chunk,encoding,done){hash.update(chunk);done(null,chunk);}}),fs.createWriteStream(target,{flags:'wx'}),{signal});
   const after=fs.statSync(resolveContained(source,item.relative).file);if(after.size!==item.size||after.mtimeMs!==item.mtimeMs)throw new Error('Tư liệu thay đổi khi sao chép.');
   assets.push({path:item.relative,bytes:item.size,sha256:hash.digest('hex')});
  }
  for(const item of entries){const stat=fs.statSync(resolveContained(source,item.relative).file);if(stat.size!==item.size||stat.mtimeMs!==item.mtimeMs)throw new Error('Tư liệu thay đổi khi tạo phiên bản.');}
  validate();fs.mkdirSync(path.join(staging,'work'),{recursive:true});fs.mkdirSync(path.join(staging,'renders'),{recursive:true});
  fs.writeFileSync(path.join(staging,'project.json'),JSON.stringify(next,null,2)+'\n');
  fs.writeFileSync(path.join(staging,migrationSource?'work/migration-origin.json':'work/variant-origin.json'),JSON.stringify({...(migrationSource?next.contentos.migration:next.contentos.variant),assets,bytes},null,2)+'\n');
  buildProject(staging,next);validate();const day=path.join(content,new Date().toISOString().slice(0,10));fs.mkdirSync(day,{recursive:true});const target=path.join(day,(migrationSource?'import-'+(migrationSource.app||'vek')+'-':'variant-')+(migrationSource?crypto.randomBytes(8).toString('hex'):crypto.randomUUID()));fs.renameSync(staging,target);
  return {ok:true,dir:path.relative(root,target).replaceAll('\\','/'),revision:projectRevision(path.join(target,'project.json')),format,bytes,files:assets.length,layoutNeedsReview:true};
 }catch(error){fs.rmSync(staging,{recursive:true,force:true});throw error;}finally{busy.delete(root);}
}
