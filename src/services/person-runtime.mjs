import fs from 'node:fs';import path from 'node:path';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
const run=promisify(execFile);
export function personRuntimeCandidates(root,{env=process.env,platform=process.platform}={}){
 if(env.CONTENTOS_SAM2_PYTHON)return [{command:env.CONTENTOS_SAM2_PYTHON,args:[],source:'override'}];
 const local=platform==='win32'?path.join(root,'tools/sam2-python/python.exe'):path.join(root,'tools/sam2-python/bin/python');
 return [...(fs.existsSync(local)?[{command:local,args:[],source:'local'}]:[]),...(platform==='win32'?[{command:'py',args:['-3'],source:'system'}]:[]),{command:'python',args:[],source:'system'},{command:'python3',args:[],source:'system'}];
}
async function inspectPersonRuntime(root,{env=process.env,platform=process.platform,execute=run}={}){
 const modelDir=path.join(root,'tools/models/sam2.1-hiera-tiny');if(!fs.existsSync(path.join(modelDir,'model.safetensors')))return {ready:false,detail:'Thiếu model SAM2 local. Cần cấu hình model trước khi theo dõi; không tải tự động.',attempts:[]};
 const attempts=[];
 for(const candidate of personRuntimeCandidates(root,{env,platform})){
  try{const {stdout}=await execute(candidate.command,[...candidate.args,'-X','utf8',path.join(root,'editor/tools/person-runtime-check.py'),modelDir],{windowsHide:true,timeout:25000,maxBuffer:32768,env:{...env,HF_HUB_OFFLINE:'1',TRANSFORMERS_OFFLINE:'1'}});const info=JSON.parse(stdout.trim());if(info.ready===true)return {ready:true,...candidate,info};throw Error(info.detail||'Kiểm runtime không thành công.');}
  catch(error){let detail;try{detail=JSON.parse(error.stdout?.trim()).detail;}catch{}attempts.push({source:candidate.source,detail:detail||'Không chạy được Python với Torch CUDA và Transformers SAM2.'});}
 }
 return {ready:false,detail:attempts[0]?.detail||'Chưa có runtime SAM2 CUDA phù hợp.',attempts,help:'Cần Python 3.10+, Torch CUDA, Transformers có SAM2, NumPy/Pillow và model local. Đặt CONTENTOS_SAM2_PYTHON nếu dùng môi trường riêng. Chưa tự cài hoặc chuyển sang CPU.'};
}

const readinessCache=new Map();
export async function personRuntimeStatus(root,options={}){
 if(options.execute)return inspectPersonRuntime(root,options);
 const env=options.env||process.env,key=path.resolve(root)+'|'+(env.CONTENTOS_SAM2_PYTHON||'')+'|'+(env.PATH||'');let stamp='';
 for(const name of ['model.safetensors','config.json','preprocessor_config.json','video_preprocessor_config.json','processor_config.json']){try{const stat=fs.statSync(path.join(root,'tools/models/sam2.1-hiera-tiny',name));stamp+=name+':'+stat.size+':'+stat.mtimeMs+';';}catch{stamp+='missing:'+name+';';}}
 const previous=readinessCache.get(key);if(previous?.stamp===stamp&&(previous.pending||!options.refresh&&previous.expires>Date.now()))return previous.pending||previous.result;
 const entry={stamp,pending:null};entry.pending=inspectPersonRuntime(root,options).then(result=>{entry.result=result;entry.expires=Date.now()+60000;entry.pending=null;return result;},error=>{readinessCache.delete(key);throw error;});readinessCache.set(key,entry);return entry.pending;
}
