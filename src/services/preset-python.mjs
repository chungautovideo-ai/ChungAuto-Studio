import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
export function presetPythonStatus(root,{env=process.env,platform=process.platform,probe=spawnSync}={}){
 const embedded=path.join(root,'tools/vision-embedded/python.exe'),site=path.join(root,'tools/preset-fields');
 const candidates=env.CONTENTOS_PRESET_PYTHON?[{command:env.CONTENTOS_PRESET_PYTHON,args:[],source:'override'}]:[
  ...(platform==='win32'&&fs.existsSync(embedded)?[{command:embedded,args:[],source:'embedded'}]:[]),
  ...(platform==='win32'?[{command:'py',args:['-3'],source:'system'}]:[]),{command:'python',args:[],source:'system'},{command:'python3',args:[],source:'system'}];
 const code='import sys,json; sys.path.insert(0,sys.argv[1]); import lxml; from lxml import html; r=html.fragment_fromstring("<b>test</b>"); assert r.text=="test"; print(json.dumps({"python":sys.version.split()[0],"lxml":lxml.__version__,"executable":sys.executable}))',attempts=[];
 for(const candidate of candidates){
  const result=probe(candidate.command,[...candidate.args,'-X','utf8','-c',code,site],{encoding:'utf8',windowsHide:true,timeout:10000,maxBuffer:16384,env});
  try{const info=JSON.parse(result.stdout);if(result.status===0&&info.lxml)return {ready:true,...candidate,info,localEnvironment:candidate.source==='embedded',attempts};}catch{}
  attempts.push({source:candidate.source,detail:'Python/lxml chưa chạy được phép phân tích HTML.'});
 }
 return {ready:false,attempts,detail:'Chưa có Python/lxml để điền mẫu đồ họa. Chạy installer/setup.ps1; CONTENTOS_PRESET_PYTHON chọn Python riêng.'};
}
