import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {resolveContained} from './storage.mjs';
export function createNewsService(root){
 const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
 const fileFor=workspaceId=>{if(!/^[a-zA-Z0-9-]+$/.test(workspaceId))fail('Workspace không hợp lệ.');return path.join(root,'workspace/contentos/news',workspaceId+'.json');};
 function list(workspaceId){const file=fileFor(workspaceId);return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{schemaVersion:1,entries:[]};}
 function save(workspaceId,body={},aiGeneration=null){
  const text=(value,max,label)=>{if(typeof value!=='string'||value.length>max)fail(label+' không hợp lệ hoặc quá dài.');return value.trim();};
  const title=text(body.title,200,'Tiêu đề'),script=text(body.script,30000,'Kịch bản');if(!title||!script)fail('Nhập tiêu đề và kịch bản.');
  if(!Array.isArray(body.sources)||!body.sources.length||body.sources.length>20)fail('Cần từ 1 đến 20 nguồn tin.');
  const sources=body.sources.map(source=>{
   const url=text(source.url,2000,'URL nguồn');let parsed;try{parsed=new URL(url);}catch{fail('URL nguồn không hợp lệ.');}
   if(!['http:','https:'].includes(parsed.protocol)||parsed.username||parsed.password)fail('Nguồn cần URL HTTP(S) không chứa thông tin đăng nhập.');
   const excerpt=text(source.excerpt,20000,'Trích đoạn');if(!excerpt)fail('Nhập trích đoạn nguồn đã đọc.');
   let evidence;
   if(source.articleId){
    if(typeof source.articleId!=='string'||!/^[-a-f0-9]{36}$/.test(source.articleId))fail('Sai bản nguồn đã đọc.');
    const file=path.join(root,'workspace/contentos/news-articles',workspaceId,source.articleId+'.json');
    if(!fs.existsSync(file))fail('Không tìm thấy bài đã đọc trong workspace.');const saved=JSON.parse(fs.readFileSync(file,'utf8'));
    if(saved.workspaceId!==workspaceId||![saved.article.url,saved.article.final_url].includes(parsed.href))fail('Bài đã đọc không khớp nguồn.');
    if(!saved.article.text.includes(excerpt))fail('Trích đoạn đã đổi. Đọc lại nguồn hoặc bỏ liên kết bài đã đọc.');
    evidence={articleId:source.articleId,title:saved.article.title,articleHash:crypto.createHash('sha256').update(saved.article.text).digest('hex'),facts:saved.facts,fetch:saved.article.fetch||null,warnings:saved.article.warnings||[]};
   }
   return {url:parsed.href,excerpt,...(evidence?{evidence}:{})};
  });
  const current=list(workspaceId),parent=body.parentId?current.entries.find(e=>e.id===body.parentId):null;
  if(body.parentId&&!parent)fail('Không tìm thấy bản tin trong workspace.',409);
  if(parent&&current.entries.some(e=>e.parentId===parent.id))fail('Bản tin đã có phiên bản mới hơn. Tải lại trước khi sửa.',409);
  const payload={title,script,sources},hash=crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const entry={id:crypto.randomUUID(),storyId:parent?.storyId||crypto.randomUUID(),parentId:parent?.id||null,version:(parent?.version||0)+1,payload,hash,status:body.approved===true?'approved':'draft',approvedAt:body.approved===true?new Date().toISOString():null,createdAt:new Date().toISOString(),verification:'human-review-only'};
  if(aiGeneration||parent?.aiGeneration)entry.aiGeneration=aiGeneration||parent.aiGeneration;
  current.entries.push(entry);const file=fileFor(workspaceId);fs.mkdirSync(path.dirname(file),{recursive:true});const temp=file+'.'+entry.id+'.tmp';fs.writeFileSync(temp,JSON.stringify(current,null,2)+'\n',{flag:'wx'});fs.renameSync(temp,file);return entry;
 }
 function brief(workspaceId,id){
  if(typeof id!=='string')fail('Sai mã bản tin.');const entry=list(workspaceId).entries.find(e=>e.id===id);
  if(!entry)fail('Không tìm thấy bản tin trong workspace.');if(entry.status!=='approved')fail('Duyệt kịch bản trước khi giao dựng.');
  if(crypto.createHash('sha256').update(JSON.stringify(entry.payload)).digest('hex')!==entry.hash)fail('Nội dung bản tin đã đổi ngoài luồng lưu.');
  return JSON.parse(JSON.stringify({...entry,workspaceId}));
 }
 function projectFolder(workspaceId,dir){
  const content=path.join(root,'workspace/content'),target=resolveContained(content,path.relative(content,path.resolve(root,dir)));
  if(target.relative.split('/').length!==2)fail('Sai dự án.');
  const project=JSON.parse(fs.readFileSync(path.join(target.file,'project.json'),'utf8'));if((project.workspaceId||'default')!==workspaceId)fail('Chọn đúng workspace của dự án.',409);
  return target.file;
 }
 function projectBrief(workspaceId,dir){
  const folder=projectFolder(workspaceId,dir),file=path.join(folder,'work/news-brief.json');if(!fs.existsSync(file))return null;
  const saved=JSON.parse(fs.readFileSync(file,'utf8'));
  if(saved.workspaceId!==workspaceId||saved.status!=='approved'||crypto.createHash('sha256').update(JSON.stringify(saved.payload)).digest('hex')!==saved.hash)fail('Bản tin trong dự án không hợp lệ.');
  return saved;
 }
 function bindProject(workspaceId,dir,id,expectedId){
  if(typeof id!=='string'||!(expectedId===null||typeof expectedId==='string'))fail('Chọn kịch bản và phiên bản gắn hiện tại trước khi lưu.');
  const folder=projectFolder(workspaceId,dir),current=projectBrief(workspaceId,dir);
  if((current?.id||null)!==expectedId)fail('Kịch bản gắn với dự án đã đổi. Tải lại trước khi lưu.',409);
  const selected=id?brief(workspaceId,id):null,file=path.join(folder,'work/news-brief.json');
  if(!selected){fs.rmSync(file,{force:true});return null;}
  fs.mkdirSync(path.dirname(file),{recursive:true});const temp=file+'.'+crypto.randomUUID()+'.tmp';fs.writeFileSync(temp,JSON.stringify(selected,null,2)+'\n',{flag:'wx'});fs.renameSync(temp,file);return selected;
 }
 return {list,save,brief,projectBrief,bindProject};
}
