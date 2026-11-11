import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {assertProjectRevision,projectRevision} from './project-revisions.mjs';import {resolveContained} from './storage.mjs';
import {resolvePublishCover} from './publish-covers.mjs';
const platforms=['youtube','facebook','tiktok','instagram','threads','linkedin','x','zalo'];
const fields=['platform','channelId','title','caption','hashtags','tags','comment'];
const entryKey=entry=>entry.platform+':'+entry.channelId;
const contentEqual=(a,b)=>!!a&&fields.every(field=>a[field]===b[field])&&JSON.stringify(a.cover||null)===JSON.stringify(b.cover||null);
export function refreshPublishDraftReview(snapshot,revision){
 if(!snapshot)return null;const result=structuredClone(snapshot);result.entries=result.entries.map(entry=>({...entry,stale:(entry.reviewedRevision||snapshot.projectRevision)!==revision}));result.stale=result.entries.some(entry=>entry.stale);return result;
}
export function snapshotPublishDrafts(root,workspaceId,dir,channels){
 const data=publishDrafts(root,workspaceId,dir).get(),chosen=new Map();
 for(const channel of channels){const entry=data.entries.find(item=>item.platform===channel.platform&&item.channelId===channel.id)||data.entries.find(item=>item.platform===channel.platform&&!item.channelId);if(entry)chosen.set(entryKey(entry),structuredClone(entry));}
 const entries=[...chosen.values()];return entries.length?{version:data.version,projectRevision:data.projectRevision,stale:entries.some(entry=>entry.stale),entries}:null;
}
export function publishDrafts(root,workspaceId,dir){
 const content=path.join(root,'workspace/content'),folder=resolveContained(content,path.relative(content,path.resolve(root,dir||''))).file;
 if(path.relative(content,folder).split(path.sep).length!==2)throw new Error('Sai dự án.');
 const projectFile=path.join(folder,'project.json'),project=JSON.parse(fs.readFileSync(projectFile,'utf8'));if((project.workspaceId||'default')!==workspaceId)throw new Error('Sai workspace của dự án.');
 const file=path.join(folder,'work/publish-drafts.json');
 const read=()=>{if(!fs.existsSync(file))return {version:null,entries:[],projectRevision:null};const data=fs.readFileSync(file);return {...JSON.parse(data),version:crypto.createHash('sha256').update(data).digest('hex')};};
 return {
  get(){const data=read(),revision=projectRevision(projectFile),entries=data.entries.map(entry=>{const reviewedRevision=entry.reviewedRevision||(data.schemaVersion!==2?data.projectRevision:null)||null;return {...entry,reviewedRevision,stale:reviewedRevision!==revision};});return {...data,entries,stale:entries.some(entry=>entry.stale)};},
  save({revision,expectedVersion,entries,reviewedEntries=[]}){
   assertProjectRevision(projectFile,revision);const current=read();if(current.version!==expectedVersion)throw Object.assign(new Error('Nội dung phát hành đã thay đổi. Đóng và mở lại trước khi lưu.'),{status:409});
   if(!Array.isArray(entries)||entries.length>50)throw new Error('Tối đa 50 bộ nội dung.');
   if(!Array.isArray(reviewedEntries)||reviewedEntries.length>50||reviewedEntries.some(entry=>!entry||!platforms.includes(entry.platform)||typeof entry.channelId!=='string'))throw new Error('Danh sách bộ nội dung kiểm tra không hợp lệ.');
   const text=(value,max)=>{if(typeof value!=='string'||value.length>max)throw new Error('Nội dung vượt giới hạn hoặc không hợp lệ.');return value;};
   const ids=new Set(),normalized=entries.map(entry=>{
    if(!entry||!platforms.includes(entry.platform)||typeof entry.channelId!=='string'||entry.channelId.length>160)throw new Error('Nền tảng/kênh không hợp lệ.');
    const id=entry.platform+':'+entry.channelId;if(ids.has(id))throw new Error('Trùng bộ nội dung kênh.');ids.add(id);
    const content={platform:entry.platform,channelId:entry.channelId,title:text(entry.title,300),caption:text(entry.caption,10000),hashtags:text(entry.hashtags,2000),tags:text(entry.tags,2000),comment:text(entry.comment,5000)};
    const previous=current.entries.find(old=>entryKey(old)===id);
    if(entry.cover!==undefined&&entry.cover!==null){
     const cover=resolvePublishCover(folder,workspaceId,entry.cover.name);if(entry.cover.sha256&&entry.cover.sha256!==cover.sha256)throw new Error('Ảnh bìa đã đổi so với bản chọn.');content.cover=cover;
    }
    const reviewed=reviewedEntries.some(item=>entryKey(item)===id)||!contentEqual(previous,content);
    return {...content,reviewedRevision:reviewed?revision:(previous?.reviewedRevision||(current.schemaVersion!==2?current.projectRevision:null)||null),reviewedAt:reviewed?new Date().toISOString():(previous?.reviewedAt||null)};
   });
   const result={schemaVersion:2,workspaceId,projectRevision:revision,updatedAt:new Date().toISOString(),entries:normalized};
   fs.mkdirSync(path.dirname(file),{recursive:true});const temp=file+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(temp,JSON.stringify(result,null,2)+'\n',{flag:'wx'});assertProjectRevision(projectFile,revision);fs.renameSync(temp,file);}finally{fs.rmSync(temp,{force:true});}
   return this.get();
  }
 };
}
