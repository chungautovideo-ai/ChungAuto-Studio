import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
export function visionPythonCandidates(root,{platform=process.platform,env=process.env}={}){
 if(env.CONTENTOS_VISION_PYTHON)return [{command:env.CONTENTOS_VISION_PYTHON,args:[],source:'override'}];
 const executable=platform==='win32'?path.join(root,'tools','vision-python','Scripts','python.exe'):path.join(root,'tools','vision-python','bin','python');
 return [...(platform==='win32'?[{command:path.join(root,'tools','vision-embedded','python.exe'),args:[],source:'embedded'}]:[]),{command:executable,args:[],source:'local'},...(platform==='win32'?[{command:'py',args:['-3'],source:'system'}]:[]),{command:'python',args:[],source:'system'},{command:'python3',args:[],source:'system'}];
}
const checkCode='import sys,json,cv2,numpy as np; a=np.zeros((16,16),np.uint8); cv2.goodFeaturesToTrack(a,4,0.01,2); print(json.dumps({"python":sys.version.split()[0],"executable":sys.executable,"opencv":cv2.__version__,"numpy":np.__version__}))';
export function visionPythonStatus(root,{env=process.env,probe=spawnSync,platform=process.platform}={}){
 const attempts=[];
 for(const candidate of visionPythonCandidates(root,{env,platform})){
  if(['local','embedded'].includes(candidate.source)&&!fs.existsSync(candidate.command))continue;
  const result=probe(candidate.command,[...candidate.args,'-X','utf8','-c',checkCode],{encoding:'utf8',windowsHide:true,timeout:10000,maxBuffer:32768,env});
  try{if(result.status===0){const info=JSON.parse(result.stdout.trim());if(!/^3\.(1[0-9]|[2-9][0-9])\./.test(info.python))throw Error('Python 3.10+ required');return {ready:true,...candidate,info,localEnvironment:['local','embedded'].includes(candidate.source),standalone:candidate.source==='embedded',attempts};}}catch{}
  attempts.push({source:candidate.source,command:candidate.command,error:(result.error?.message||result.stderr||'Runtime check failed').trim().slice(0,500)});
 }
 return {ready:false,localEnvironment:false,attempts,detail:'Thiếu Python 3.10+ với OpenCV/NumPy. Chạy installer/setup.ps1 để chuẩn bị môi trường che biển local.'};
}
export function requireVisionPython(root,options){const result=visionPythonStatus(root,options);if(!result.ready)throw Error(result.detail);return result;}
