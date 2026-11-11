import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {personRuntimeStatus} from '../src/services/person-runtime.mjs';

const execute=promisify(execFile);
export const personRuntimeLock=JSON.parse(fs.readFileSync(new URL('./person-runtime-lock.json',import.meta.url),'utf8'));
const quote=s=>"'"+s.replaceAll("'","''")+"'";
export async function fileSha256(file){
 const hash=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(file))hash.update(chunk);return hash.digest('hex');
}
export async function cachedPersonArtifact(artifact,cache,{fetcher=fetch}={}){
 const url=new URL(artifact.url);
 if(url.protocol!=='https:'||!['www.python.org','files.pythonhosted.org','download.pytorch.org','download-r2.pytorch.org','huggingface.co'].includes(url.hostname)||!/^[a-f0-9]{64}$/.test(artifact.sha256))throw Error('Nguồn/SHA256 runtime không hợp lệ.');
 fs.mkdirSync(cache,{recursive:true});const file=path.join(cache,artifact.sha256);
 if(fs.existsSync(file)){if(await fileSha256(file)!==artifact.sha256)throw Error('Cache SAM2 sai SHA256; giữ file để kiểm tra.');return file;}
 const partial=file+'.'+crypto.randomUUID()+'.partial';
 try{
  const response=await fetcher(url,{signal:AbortSignal.timeout(30*60*1000)});if(!response.ok||!response.body)throw Error('Tải SAM2 HTTP '+response.status);
  await pipeline(Readable.fromWeb(response.body),fs.createWriteStream(partial,{flags:'wx'}));
  if(await fileSha256(partial)!==artifact.sha256)throw Error('SAM2 download SHA256 mismatch');
  if(fs.existsSync(file)){if(await fileSha256(file)!==artifact.sha256)throw Error('Cache SAM2 thay đổi trong lúc tải.');}else fs.renameSync(partial,file);
  return file;
 }finally{fs.rmSync(partial,{force:true});}
}

export async function installPersonRuntime(root,{run=execute,download=cachedPersonArtifact,probe=personRuntimeStatus,env=process.env,platform=process.platform,arch=process.arch,log=console.log,lock=personRuntimeLock}={}){
 root=path.resolve(root);
 if(platform!=='win32'||arch!=='x64')throw Error('Bộ cài SAM2 local hỗ trợ Windows x64.');
 if(env.CONTENTOS_SAM2_PYTHON)throw Error('CONTENTOS_SAM2_PYTHON đang được cấu hình; giữ override, không cài đè.');
 const tools=path.join(root,'tools'),destination=path.join(tools,'sam2-python'),python=path.join(destination,'python.exe');
 fs.mkdirSync(tools,{recursive:true});
 if(fs.existsSync(destination)){
  const status=await probe(root,{env:{...env,CONTENTOS_SAM2_PYTHON:python},refresh:true});
  if(status.ready)return {...status,source:'local'};
  throw Error('tools/sam2-python đã tồn tại nhưng chưa dùng được; giữ nguyên để kiểm tra.');
 }
 const lockFile=path.join(tools,'sam2-install.lock');let handle;
 try{handle=fs.openSync(lockFile,'wx');}catch(error){if(error.code==='EEXIST')throw Error('Có khóa cài SAM2; kiểm tiến trình trước khi thử lại.');throw error;}
 fs.writeFileSync(handle,JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}));
 let stage;
 try{
  stage=fs.mkdtempSync(path.join(tools,'sam2-stage-'));const runtime=path.join(stage,'runtime');fs.mkdirSync(runtime);
  const cache=path.join(root,'workspace/cache/sam2-downloads');
  log('SAM2: Python embedded 3.12.10');const archive=await download(lock.pythonArtifact,cache);
  const powershell=path.join(env.SystemRoot||'C:\\Windows','System32/WindowsPowerShell/v1.0/powershell.exe');
  await run(powershell,['-NoProfile','-NonInteractive','-Command',`Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::ExtractToDirectory(${quote(archive)},${quote(runtime)})`],{windowsHide:true,timeout:60000});
  fs.writeFileSync(path.join(runtime,'python312._pth'),'python312.zip\n.\nLib/site-packages\nimport site\n');
  const wheels=[];for(const item of lock.wheels){log('SAM2: '+item.name+' '+item.version);wheels.push(await download(item,cache));}
  await run(path.join(runtime,'python.exe'),['-X','utf8',path.join(root,'installer/person-extract-wheels.py'),path.join(runtime,'Lib/site-packages'),...wheels],{windowsHide:true,timeout:10*60*1000,maxBuffer:65536});
  const modelDir=path.join(tools,'models/sam2.1-hiera-tiny');fs.mkdirSync(modelDir,{recursive:true});
  for(const item of lock.model.files){const target=path.join(modelDir,item.name);if(fs.existsSync(target)){if(await fileSha256(target)!==item.sha256)throw Error('Model/config SAM2 đang có sai SHA256; giữ nguyên.');}else fs.copyFileSync(await download(item,cache),target,fs.constants.COPYFILE_EXCL);}
  let status;
  try{const result=await run(path.join(runtime,'python.exe'),['-X','utf8',path.join(root,'editor/tools/person-runtime-check.py'),modelDir],{windowsHide:true,timeout:120000,maxBuffer:65536,env:{...env,HF_HUB_OFFLINE:'1',TRANSFORMERS_OFFLINE:'1'}});const info=JSON.parse(result.stdout.trim());status={ready:info.ready,info};}
  catch(error){let detail;try{detail=JSON.parse(error.stdout?.trim()).detail;}catch{}throw Error(detail||error.stderr?.trim().slice(-1800)||error.message);}
  if(!status.ready)throw Error(status.detail||'SAM2 chưa vượt kiểm CUDA/model.');
  fs.writeFileSync(path.join(runtime,'contentos-runtime.json'),JSON.stringify(lock,null,2));
  if(fs.existsSync(destination))throw Error('Đích SAM2 đã thay đổi; chưa ghi đè.');fs.renameSync(runtime,destination);
  return {...status,command:python,source:'local'};
 }finally{
  if(stage){if(!path.resolve(stage).startsWith(tools+path.sep))throw Error('Đường staging SAM2 không hợp lệ.');fs.rmSync(stage,{recursive:true,force:true});}
  fs.closeSync(handle);fs.rmSync(lockFile,{force:true});
 }
}
