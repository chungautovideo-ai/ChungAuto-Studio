import fs from 'node:fs';import path from 'node:path';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {verifyVisionArtifact} from './vision-embedded.mjs';import {presetPythonStatus} from '../src/services/preset-python.mjs';
const execute=promisify(execFile),quote=s=>"'"+s.replaceAll("'","''")+"'";
const artifact={version:'6.0.2',url:'https://files.pythonhosted.org/packages/f7/d7/0cdfb6c3e30893463fb3d1e52bc5f5f99684a03c29a0b6b605cfae879cd5/lxml-6.0.2-cp312-cp312-win_amd64.whl',sha256:'72c87e5ee4e58a8354fb9c7c84cbf95a1c8236c127a5d1b7683f04bed8361e1f'};
export async function installPresetPython(root){
 let status=presetPythonStatus(root);if(status.ready&&(status.localEnvironment||process.platform!=='win32'))return status;
 if(process.env.CONTENTOS_PRESET_PYTHON){if(status.ready)return status;throw Error(status.detail+' Giữ nguyên override, không cài đè.');}
 if(process.platform!=='win32'||process.arch!=='x64')throw Error('Bộ cài lxml local hiện hỗ trợ Windows x64; cấu hình CONTENTOS_PRESET_PYTHON với lxml trên hệ khác.');
 if(!fs.existsSync(path.join(root,'tools/vision-embedded/python.exe')))throw Error('Cần cài Python vision local trước khi cài mẫu đồ họa.');
 const tools=path.resolve(root,'tools'),destination=path.join(tools,'preset-fields');if(fs.existsSync(destination))throw Error('tools/preset-fields đã tồn tại nhưng chưa chạy được; giữ nguyên để kiểm tra.');
 const stage=fs.mkdtempSync(path.join(tools,'preset-stage-')),runtime=path.join(stage,'runtime');fs.mkdirSync(runtime);
 try{
  const response=await fetch(artifact.url,{signal:AbortSignal.timeout(120000)});if(!response.ok)throw Error('Tải lxml HTTP '+response.status);
  const bytes=verifyVisionArtifact(Buffer.from(await response.arrayBuffer()),artifact.sha256),archive=path.join(stage,'lxml.zip');fs.writeFileSync(archive,bytes);
  await execute(path.join(process.env.SystemRoot||'C:\\Windows','System32/WindowsPowerShell/v1.0/powershell.exe'),['-NoProfile','-NonInteractive','-Command',`Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::ExtractToDirectory(${quote(archive)},${quote(runtime)})`],{windowsHide:true,timeout:60000});
  const python=path.join(root,'tools/vision-embedded/python.exe');await execute(python,['-X','utf8','-c','import sys; sys.path.insert(0,sys.argv[1]); from lxml import html; assert html.fragment_fromstring("<b>test</b>").text=="test"',runtime],{windowsHide:true,timeout:10000});
  fs.writeFileSync(path.join(runtime,'contentos-runtime.json'),JSON.stringify(artifact,null,2));fs.renameSync(runtime,destination);
  status=presetPythonStatus(root);if(!status.ready||!status.localEnvironment)throw Error('lxml local chưa vượt kiểm tra.');return status;
 }finally{if(!path.resolve(stage).startsWith(tools+path.sep))throw Error('Đường staging không hợp lệ.');fs.rmSync(stage,{recursive:true,force:true});}
}
