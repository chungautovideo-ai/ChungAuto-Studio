import fs from 'node:fs';
import path from 'node:path';
export function listReviseJobs(root,project){
 const folder=path.join(root,'workspace/content/_sua-video');if(!fs.existsSync(folder))return [];
 const result=[];
 for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
  if(!entry.isDirectory()||entry.isSymbolicLink())continue;
  try{
   const job=JSON.parse(fs.readFileSync(path.join(folder,entry.name,'work/ai-job.json'),'utf8'));
   if(job.kind==='revise'&&job.project===project)result.push(job);
  }catch{}
 }
 return result.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
}
export const activeReviseJob=jobs=>jobs.find(job=>['waiting','working'].includes(job.status));
