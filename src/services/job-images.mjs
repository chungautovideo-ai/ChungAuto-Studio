import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {resolveContained} from './storage.mjs';import {projectRevision} from './project-revisions.mjs';import {createEditorContext} from './editor-context.mjs';import {createEditorImages} from './editor-images.mjs';
const busy=new Set();
export async function useJobImages(root,workspaceStore,imageService,storageService,body={},options={}){
 const dir=resolveContained(path.join(root,'workspace/content'),path.relative(path.join(root,'workspace/content'),path.resolve(root,body.jobDir||''))).file;
 if(path.relative(path.join(root,'workspace/content'),dir).split(path.sep).length!==2)throw new Error('Sai thư mục việc.');
 if(!['list','attach'].includes(body.action))throw new Error('Chọn list hoặc attach.');
 if(busy.has(dir))throw new Error('Đang xử lý thư viện ảnh cho việc này.');busy.add(dir);
 try{
  const jobFile=resolveContained(dir,'work/ai-job.json').file,readJob=()=>JSON.parse(fs.readFileSync(jobFile,'utf8')),job=readJob();
  if(!job.candidate||!job.baseRevision||!['waiting','working'].includes(job.status)||job.execution?.mode==='api'||job.kind&&job.kind!=='revise')throw new Error('Việc phiên/CLI không sẵn sàng dùng ảnh workspace.');
  const target=job.kind==='revise'?resolveContained(root,job.project).file:dir;
  const targetRelative=path.relative(path.join(root,'workspace/content'),target);
  if(targetRelative.startsWith('..')||path.isAbsolute(targetRelative)||targetRelative.split(path.sep).length!==2)throw new Error('Sai dự án đích.');
  const expected=job.kind==='revise'?path.join(dir,'work/candidate-project.json'):path.join(dir,'work/build-candidates',String(job.completionToken),'work/candidate-project.json');
  if(resolveContained(root,job.candidate).file!==expected)throw new Error('Bản làm việc không khớp việc.');
  const projectFile=resolveContained(target,'project.json').file,project=JSON.parse(fs.readFileSync(projectFile,'utf8')),workspaceId=project.workspaceId||'default';
  const identity=j=>JSON.stringify([j.baseRevision,j.candidate,j.project,j.completionToken,j.kind,j.createdAt,j.execution]),pinned=identity(job);
  const validate=()=>{options.signal?.throwIfAborted();const current=readJob();if(identity(current)!==pinned||!['waiting','working'].includes(current.status)||workspaceStore.active().id!==workspaceId||projectRevision(projectFile)!==job.baseRevision)throw new Error('Việc, workspace hoặc bản dựng đã đổi. Nhận lại việc trước khi nhập ảnh.');};validate();
  const pinsFile=path.join(dir,'work/workspace-image-selection.json');let selection=new Map();
  if(fs.existsSync(pinsFile)){const file=resolveContained(dir,'work/workspace-image-selection.json').file;if(fs.statSync(file).size>256*1024)throw new Error('Danh sách ảnh của việc quá lớn.');const saved=JSON.parse(fs.readFileSync(file,'utf8'));if(saved.identity!==pinned||saved.workspaceId!==workspaceId)throw new Error('Danh sách ảnh thuộc phiên bản việc cũ.');if(!Array.isArray(saved.entries)||saved.entries.length>1000)throw new Error('Danh sách ảnh không hợp lệ.');selection=new Map(saved.entries);}
  const mediaContext=createEditorContext(target,{project,validate}),images=createEditorImages({workspaceId,workspaceStore,imageService,storageService,projectDir:target,root,mediaContext,validate,selection});
  if(body.action==='attach'){const result=await images.attach({id:body.id});validate();return {workspaceId,project:path.relative(root,target).replaceAll('\\','/'),...result};}
  const result=images.list({query:body.query,offset:body.offset,limit:body.limit});validate();if(selection.size>1000)throw new Error('Tối đa1000ảnh được tìm trong một việc.');
  const temp=pinsFile+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(temp,JSON.stringify({workspaceId,identity:pinned,entries:[...selection]}),{flag:'wx'});fs.renameSync(temp,pinsFile);}finally{fs.rmSync(temp,{force:true});}
  return {workspaceId,project:path.relative(root,target).replaceAll('\\','/'),...result};
 }finally{busy.delete(dir);}
}
