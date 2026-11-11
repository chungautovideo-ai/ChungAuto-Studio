import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {visionPythonStatus} from '../src/services/vision-python.mjs';
const exec=promisify(execFile),lock=JSON.parse(fs.readFileSync(new URL('./vision-embedded-lock.json',import.meta.url),'utf8').replace(/^\uFEFF/,''));
export function verifyVisionArtifact(bytes,expected){if(crypto.createHash('sha256').update(bytes).digest('hex')!==expected)throw Error('Vision download SHA256 mismatch');return bytes;}
const quote=s=>"'"+s.replaceAll("'","''")+"'";
export async function installEmbeddedVision(root){
 if(process.platform!=='win32'||process.arch!=='x64')throw Error('Embedded vision Python hiện hỗ trợ Windows x64.');
 const destination=path.resolve(root,'tools/vision-embedded'),existing=visionPythonStatus(root);
 if(existing.ready&&existing.command===path.join(destination,'python.exe'))return existing;
 if(fs.existsSync(destination))throw Error('tools/vision-embedded đã tồn tại nhưng không chạy được; giữ nguyên để kiểm tra trước khi cài lại.');
 const tools=path.resolve(root,'tools');fs.mkdirSync(tools,{recursive:true});const stage=fs.mkdtempSync(path.join(tools,'vision-stage-')),runtime=path.join(stage,'runtime');fs.mkdirSync(runtime);
 try{
  const cache=path.resolve(root,'workspace/cache/vision-downloads');fs.mkdirSync(cache,{recursive:true});
  for(const artifact of lock.artifacts){
   const archive=path.join(cache,artifact.name+'.zip');let bytes;
   if(fs.existsSync(archive))bytes=verifyVisionArtifact(fs.readFileSync(archive),artifact.sha256);
   else{console.log('Vision download: '+artifact.name);const response=await fetch(artifact.url,{signal:AbortSignal.timeout(120000)});if(!response.ok)throw Error('Vision download HTTP '+response.status);bytes=verifyVisionArtifact(Buffer.from(await response.arrayBuffer()),artifact.sha256);fs.writeFileSync(archive,bytes,{flag:'wx'});}
   const target=path.resolve(runtime,artifact.target);if(target!==runtime&&!target.startsWith(runtime+path.sep))throw Error('Invalid vision extraction path');fs.mkdirSync(target,{recursive:true});
   const powershell=path.join(process.env.SystemRoot||'C:\\Windows','System32/WindowsPowerShell/v1.0/powershell.exe');
   await exec(powershell,['-NoProfile','-NonInteractive','-Command',`Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::ExtractToDirectory(${quote(archive)},${quote(target)})`],{windowsHide:true,timeout:60000});
  }
  fs.writeFileSync(path.join(runtime,'python312._pth'),'python312.zip\n.\nLib/site-packages\nimport site\n');fs.writeFileSync(path.join(runtime,'contentos-runtime.json'),JSON.stringify(lock,null,2));
  const probe=visionPythonStatus(root,{env:{...process.env,CONTENTOS_VISION_PYTHON:path.join(runtime,'python.exe')}});if(!probe.ready||probe.info.opencv!==lock.opencv||probe.info.numpy!==lock.numpy)throw Error('Embedded runtime failed CV verification');
  fs.renameSync(runtime,destination);return visionPythonStatus(root);
 }finally{const resolved=path.resolve(stage);if(!resolved.startsWith(tools+path.sep))throw Error('Invalid vision staging cleanup');fs.rmSync(resolved,{recursive:true,force:true});}
}
