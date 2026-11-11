import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
// Đã bỏ "Tự xuất": giá trị 'auto-export' cũ (cài đặt đã lưu, job cũ, client cũ) vẫn nhận nhưng quy về 'review'.
export function normalizeCompletion(value){
 if(!['auto-export','review'].includes(value)){const error=new Error('Giá trị hoàn tất dựng không hợp lệ.');error.status=400;throw error;}
 return {mode:'review',quality:'final',publish:false};
}
export function createCompletionPolicyStore(root){
 const folder=path.join(root,'workspace/contentos/completion-policies');
 const file=id=>{if(!/^[a-zA-Z0-9-]+$/.test(id))throw new Error('Workspace không hợp lệ.');return path.join(folder,id+'.json');};
 return {
  get(id){const target=file(id);return fs.existsSync(target)?normalizeCompletion(JSON.parse(fs.readFileSync(target,'utf8')).mode):normalizeCompletion('review');},
  save(id,value){const target=file(id),policy=normalizeCompletion(value);fs.mkdirSync(folder,{recursive:true});const temp=target+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(temp,JSON.stringify(policy)+'\n',{flag:'wx'});fs.renameSync(temp,target);}finally{fs.rmSync(temp,{force:true});}return policy;},
  resolve(id,{project,run}={}){return run!==undefined?normalizeCompletion(run):project?.contentos?.completionMode?normalizeCompletion(project.contentos.completionMode):this.get(id);}
 };
}
