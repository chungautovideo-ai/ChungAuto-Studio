import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// One local server owns live callbacks. Disk records never establish worker liveness.
export function remotionHistory(root){
 const folder=path.join(root,'workspace/contentos/remotion-jobs');
 const valid=job=>job?.schemaVersion===1&&/^[a-f0-9-]{36}$/i.test(job.id||'')&&typeof job.workspaceId==='string'&&typeof job.revision==='string'&&typeof job.project==='string'&&job.project.startsWith('workspace/content/')&&!job.project.split(/[\\/]/).includes('..')&&['running','cancelling','succeeded','failed','cancelled'].includes(job.status)&&Number.isFinite(job.updatedAt);
 return {
  read(){
   if(!fs.existsSync(folder))return [];
   const files=fs.readdirSync(folder).filter(file=>file.endsWith('.json'));
   if(files.length>10000)throw new Error('Lịch sử Remotion quá lớn; cần kiểm tra trước khi nhận việc mới.');
   return files.map(name=>{const file=path.join(folder,name);if(fs.statSync(file).size>128*1024)throw new Error('Bản ghi Remotion quá lớn.');const job=JSON.parse(fs.readFileSync(file,'utf8'));if(!valid(job)||name!==job.id+'.json')throw new Error('Lịch sử Remotion không hợp lệ; cần kiểm tra trước khi nhận việc mới.');return job;}).sort((a,b)=>a.createdAt-b.createdAt||a.id.localeCompare(b.id));
  },
  save(job){
   const {id,workspaceId,project,revision,status,phase,error,result,createdAt,updatedAt}=job;
   const value={schemaVersion:1,id,workspaceId,project,revision,status,phase,error,result,createdAt,updatedAt};
   if(!valid(value))throw new Error('Không lưu được bản ghi Remotion không hợp lệ.');
   fs.mkdirSync(folder,{recursive:true});const file=path.join(folder,id+'.json'),temporary=file+'.'+crypto.randomUUID()+'.tmp';
   try{fs.writeFileSync(temporary,JSON.stringify(value)+'\n',{flag:'wx'});fs.renameSync(temporary,file);}finally{fs.rmSync(temporary,{force:true});}
  }
 };
}
