import {installEmbeddedVision} from './vision-embedded.mjs';
import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';
import {visionPythonCandidates,visionPythonStatus} from '../src/services/vision-python.mjs';
const run=(cmd,args)=>new Promise((resolve,reject)=>{const p=spawn(cmd,args,{windowsHide:true,stdio:'inherit'});p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(Error('Vision setup exited '+code)));});
export async function installVisionPython(root){
 const status=visionPythonStatus(root);if(status.ready&&(status.standalone||process.platform!=='win32')&&status.localEnvironment&&status.info.opencv==='4.11.0'&&status.info.numpy==='2.2.6')return status;
 if(process.env.CONTENTOS_VISION_PYTHON)throw Error('CONTENTOS_VISION_PYTHON chưa là runtime local hợp lệ; giữ override, không cài đè.');
 if(process.platform==='win32'&&process.arch==='x64')return installEmbeddedVision(root);
 const destination=path.join(root,'tools','vision-python');
 if(!fs.existsSync(destination)){
  // Find CPython independently of optional cv2 availability.
  let python;
  for(const candidate of visionPythonCandidates(root).filter(c=>c.source==='system')){try{await run(candidate.command,[...candidate.args,'-c','import sys,venv; assert sys.version_info >= (3,10)']);python=candidate;break;}catch{}}
  if(!python)throw Error('Chưa tìm thấy CPython 3.10+ hỗ trợ venv. Cần bổ sung bootstrap Python trước khi cài trên máy sạch.');
  fs.mkdirSync(path.dirname(destination),{recursive:true});await run(python.command,[...python.args,'-m','venv',destination]);
 }
 const executable=visionPythonCandidates(root).find(c=>c.source==='local').command;
 await run(executable,['-m','pip','install','--disable-pip-version-check','--only-binary=:all:','--requirement',path.join(root,'installer','vision-requirements.txt')]);
 const verified=visionPythonStatus(root);if(!verified.ready||!verified.localEnvironment)throw Error('Runtime OpenCV local chưa vượt kiểm tra.');return verified;
}
