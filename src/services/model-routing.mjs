import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const validModel=value=>typeof value==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(value);
export const MODEL_TASKS=['first-build','revise','news-draft','publish-draft'];
export function createModelRoutingStore(root){
 const fileFor=id=>{if(!/^[a-zA-Z0-9-]+$/.test(id))throw new Error('Workspace không hợp lệ.');return path.join(root,'workspace/contentos/model-routing',id+'.json');};
 const read=id=>{const saved=fs.existsSync(fileFor(id))?JSON.parse(fs.readFileSync(fileFor(id),'utf8')):{schemaVersion:1,enabled:false,models:{}};return {...saved,models:{...Object.fromEntries(MODEL_TASKS.map(task=>[task,''])),...saved.models}};};
 return {
  status:read,
  save(id,body){
   if(typeof body.enabled!=='boolean'||!body.models||typeof body.models!=='object')throw Object.assign(new Error('Quy tắc model không hợp lệ.'),{status:400});
   const models={};for(const task of MODEL_TASKS){const model=body.models[task]??'';if(model!==''&&!validModel(model))throw Object.assign(new Error('Model ID không hợp lệ.'),{status:400});models[task]=model;}
   const value={schemaVersion:1,enabled:body.enabled,models,updatedAt:new Date().toISOString()},file=fileFor(id);fs.mkdirSync(path.dirname(file),{recursive:true});const temp=file+'.'+crypto.randomUUID()+'.tmp';
   try{fs.writeFileSync(temp,JSON.stringify(value,null,2)+'\n',{flag:'wx'});fs.renameSync(temp,file);}finally{fs.rmSync(temp,{force:true});}return value;
  },
  resolve(id,execution,task,defaultModel){
   if(execution.mode!=='api')return execution;
   if(!MODEL_TASKS.includes(task))throw new Error('Tác vụ model không hợp lệ.');
   const policy=read(id),rule=policy.enabled?policy.models?.[task]:'';
   const model=execution.model||rule||defaultModel;
   if(!validModel(model))throw Object.assign(new Error('Chưa có model API hợp lệ cho tác vụ.'),{status:400});
   return {...execution,model,routing:{task,source:execution.model?'manual':rule?'workspace-rule':'connection-default',policyUpdatedAt:policy.updatedAt||null,selectedAt:new Date().toISOString()}};
  }
 };
}
