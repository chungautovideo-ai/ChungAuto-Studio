import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const identity=id=>{if(typeof id!=='string'||! /^[a-zA-Z0-9-]{1,80}$/.test(id))throw new Error('Mã lịch không hợp lệ.');return id;};
export function scheduleDispatch(root,id){
 const scheduleId=identity(id),relative=`workspace/content/_dang-bai/schedule-${scheduleId}`,directory=path.join(root,relative),file=path.join(directory,'work/ai-job.json');
 return {
  read(){if(!fs.existsSync(file))return null;const job=JSON.parse(fs.readFileSync(file,'utf8'));if(job.scheduleId!==scheduleId||job.kind!=='post'||job.dir!==relative)throw new Error('Việc đăng đã tồn tại nhưng không khớp lịch. Không tự ghi đè.');return job;},
  commit(payload){
   const existing=this.read();if(existing)return {job:existing,created:false};
   const job={...payload,kind:'post',scheduleId,dir:relative};fs.mkdirSync(path.dirname(file),{recursive:true});const temp=file+'.'+crypto.randomUUID()+'.tmp';
   try{
    fs.writeFileSync(temp,JSON.stringify(job,null,2)+'\n',{flag:'wx'});
    // Link publishes the complete file without replacing an existing job. Same local volume.
    try{fs.linkSync(temp,file);}catch(error){if(error.code!=='EEXIST')throw error;return {job:this.read(),created:false};}
   }finally{fs.rmSync(temp,{force:true});}
   return {job,created:true};
  }
 };
}
export function scheduleJobState(job){
 if(job.status==='done')return {status:'xong',jobDir:job.dir,postedAt:job.doneAt||job.createdAt};
 if(['error','cancelled'].includes(job.status))return {status:'loi',jobDir:job.dir,error:job.error||'Việc đăng đã dừng. Kiểm tra kết quả từng kênh trước khi tạo lượt mới.'};
 if(['waiting','working'].includes(job.status))return {status:'dang',jobDir:job.dir,startedAt:job.startedAt||job.createdAt};
 throw new Error('Trạng thái việc đăng không xác định; không tự giao lại.');
}
