import fs from 'node:fs';import path from 'node:path';
import {resolveContained} from './storage.mjs';
import {projectRevision} from './project-revisions.mjs';
export function candidateReview(root,jobDir,workspaceId){
 const directory=resolveContained(root,jobDir).file;
 const job=JSON.parse(fs.readFileSync(path.join(directory,'work/ai-job.json'),'utf8'));
 if(!job.candidate||!job.baseRevision)throw new Error('Việc không có bản dựng AI riêng.');
 const target=job.kind==='revise'?resolveContained(root,job.project).file:directory;
 const relative=path.relative(path.join(root,'workspace/content'),target);
 if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).length!==2)throw new Error('Sai dự án.');
 const currentFile=path.join(target,'project.json'),current=JSON.parse(fs.readFileSync(currentFile,'utf8'));
 if((current.workspaceId||'default')!==workspaceId){const error=new Error('Chọn đúng workspace của dự án.');error.status=409;throw error;}
 const candidateFile=resolveContained(root,job.candidate).file;
 const expected=job.kind==='revise'?path.join(directory,'work/candidate-project.json'):path.join(directory,'work/build-candidates',job.completionToken,'work/candidate-project.json');
 if(candidateFile!==expected)throw new Error('Sai bản làm việc AI.');
 const candidate=JSON.parse(fs.readFileSync(candidateFile,'utf8')),base=JSON.parse(fs.readFileSync(path.join(path.dirname(candidateFile),'base-project.json'),'utf8'));
 const fields=[...new Set([...Object.keys(base),...Object.keys(current),...Object.keys(candidate)])].sort();
 const changes=fields.filter(key=>JSON.stringify(base[key])!==JSON.stringify(current[key])||JSON.stringify(base[key])!==JSON.stringify(candidate[key])).map(key=>({field:key,manualChanged:JSON.stringify(base[key])!==JSON.stringify(current[key]),aiChanged:JSON.stringify(base[key])!==JSON.stringify(candidate[key])}));
 return {jobDir,project:path.relative(root,target).replaceAll('\\','/'),status:job.status,errorCode:job.errorCode,baseRevision:job.baseRevision,currentRevision:projectRevision(currentFile),candidateRevision:projectRevision(candidateFile),base,current,candidate,changes};
}
export function markCandidateConflict(file,job,error){
 if(error?.code!=='PROJECT_REVISION_CONFLICT'||!job.candidate)return;
 fs.writeFileSync(file,JSON.stringify({...job,status:'error',errorCode:'CANDIDATE_CONFLICT',error:'Dự án đã có chỉnh sửa mới. Bản AI được giữ riêng để đối chiếu; chưa áp dụng hoặc tự xuất.',doneAt:new Date().toISOString()},null,2)+'\n');
}
