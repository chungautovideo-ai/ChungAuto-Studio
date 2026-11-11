import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

function dpapi(operation,value){
 if(process.platform!=='win32')throw new Error('Kho khóa hệ điều hành hiện chỉ hỗ trợ Windows. Dùng biến môi trường trên máy này.');
 const script=operation==='protect'?`$v=[Console]::In.ReadToEnd();$s=ConvertTo-SecureString -String $v -AsPlainText -Force;ConvertFrom-SecureString -SecureString $s`:`$v=[Console]::In.ReadToEnd();$s=ConvertTo-SecureString -String $v;$p=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s);try{[Runtime.InteropServices.Marshal]::PtrToStringBSTR($p)}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p)}`;
 const childEnv={...process.env};for(const key of Object.keys(childEnv))if(key.toLowerCase()==='psmodulepath')delete childEnv[key];
 try{return execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{env:childEnv,input:value,encoding:'utf8',windowsHide:true,timeout:10000,stdio:['pipe','pipe','ignore']}).trim();}
 catch{throw new Error('Không truy cập được kho khóa Windows của tài khoản hiện tại. Không lưu khóa; kiểm tra PowerShell/DPAPI.');}
}
export function validateImageConnection(body){
 const baseUrl=String(body.baseUrl||'').trim(),model=String(body.model||'').trim();
 const url=new URL(baseUrl);
 if(url.username||url.password||url.search||url.hash||!(url.protocol==='https:'||url.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(url.hostname)))throw new Error('Gateway cần HTTPS hoặc HTTP loopback; không chứa thông tin đăng nhập/query.');
 if(!/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(model))throw new Error('Model ID không hợp lệ.');
 return {baseUrl:url.href.replace(/\/$/,''),model,supportsReferences:body.supportsReferences===true,supportsVision:body.supportsVision===true};
}
// Token bot Telegram (kênh nhận video khách): mã hoá DPAPI theo máy/tài khoản, không bao giờ trả về trình duyệt.
export function createTelegramStore(root,{env=process.env,secretDir,protect=v=>dpapi('protect',v),unprotect=v=>dpapi('unprotect',v),request=fetch}={}){
 const scope=crypto.createHash('sha256').update(path.resolve(root)).digest('hex').slice(0,24);
 const folder=path.join(secretDir||path.join(env.LOCALAPPDATA||path.join(os.homedir(),'.local/share'),'ContentOS','connections',scope),'telegram');
 const fileFor=id=>{if(!/^[a-zA-Z0-9-]+$/.test(id))throw new Error('Workspace không hợp lệ.');return path.join(folder,id+'.json');};
 const read=id=>{const f=fileFor(id);return fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):null;};
 const check=async token=>{
  if(!/^\d{5,15}:[A-Za-z0-9_-]{30,64}$/.test(token))throw new Error('Token không đúng dạng của BotFather (số:chuỗi).');
  let data;try{const r=await request(`https://api.telegram.org/bot${token}/getMe`,{signal:AbortSignal.timeout(10000)});data=await r.json();}catch{throw new Error('Không gọi được Telegram để kiểm tra token (mạng/tường lửa).');}
  if(!data?.ok)throw new Error('Telegram từ chối token này (sai hoặc đã /revoke).');
  return {id:data.result.id,username:data.result.username,name:data.result.first_name};
 };
 return {
  status(id){const s=read(id);return {hasToken:!!s?.encryptedToken,bot:s?.bot||null,updatedAt:s?.updatedAt||null,secretProtection:process.platform==='win32'?'Windows DPAPI (máy + tài khoản này)':'không hỗ trợ'};},
  token(id){const s=read(id);return s?.encryptedToken?unprotect(s.encryptedToken):'';},
  async save(id,body){
   const token=String(body.token||'').trim();if(!token)throw new Error('Dán token của bot.');
   const bot=await check(token);fs.mkdirSync(folder,{recursive:true});
   const f=fileFor(id),temp=f+'.'+crypto.randomUUID()+'.tmp';
   try{fs.writeFileSync(temp,JSON.stringify({encryptedToken:protect(token),bot,updatedAt:new Date().toISOString()},null,2)+'\n',{flag:'wx',mode:0o600});fs.renameSync(temp,f);}finally{fs.rmSync(temp,{force:true});}
   return this.status(id);
  },
  remove(id){fs.rmSync(fileFor(id),{force:true});return this.status(id);}
 };
}
export function createConnectionStore(root,{env=process.env,secretDir,kind='image',protect=v=>dpapi('protect',v),unprotect=v=>dpapi('unprotect',v)}={}){
 if(!['image','llm'].includes(kind))throw new Error('Loại kết nối không hợp lệ.');
 const scope=crypto.createHash('sha256').update(path.resolve(root)).digest('hex').slice(0,24);
 const baseFolder=secretDir||path.join(env.LOCALAPPDATA||path.join(os.homedir(),'.local/share'),'ContentOS','connections',scope);
 const folder=kind==='image'?baseFolder:path.join(baseFolder,kind);
 const fileFor=workspaceId=>{if(!/^[a-zA-Z0-9-]+$/.test(workspaceId))throw new Error('Workspace không hợp lệ.');return path.join(folder,workspaceId+'.json');};
 function read(workspaceId){const file=fileFor(workspaceId);return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;}
 function write(workspaceId,value){fs.mkdirSync(folder,{recursive:true});const file=fileFor(workspaceId),temp=file+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(temp,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});fs.renameSync(temp,file);}finally{fs.rmSync(temp,{force:true});}}
 const prefix=kind==='llm'?'CONTENTOS_LLM_':'CONTENTOS_IMAGE_';
 const environment=()=>({baseUrl:env[prefix+'BASE_URL']||'',model:env[prefix+'MODEL']||'',apiKey:env[prefix+'API_KEY']||'',supportsReferences:kind==='image'&&env.CONTENTOS_IMAGE_REFERENCES==='1',supportsVision:kind==='llm'&&env.CONTENTOS_LLM_VISION==='1'});
 const voiceFile=workspaceId=>path.join(folder,'voice',path.basename(fileFor(workspaceId)));
 return {
  voiceConfig(workspaceId){
   const file=voiceFile(workspaceId);
   return {
    read(){if(!fs.existsSync(file))return {};const saved=JSON.parse(fs.readFileSync(file,'utf8'));return JSON.parse(unprotect(saved.encryptedConfig));},
    write(config){
     const encryptedConfig=protect(JSON.stringify(config)),temp=file+'.'+crypto.randomUUID()+'.tmp';fs.mkdirSync(path.dirname(file),{recursive:true});
     try{fs.writeFileSync(temp,JSON.stringify({encryptedConfig,updatedAt:new Date().toISOString()})+'\n',{flag:'wx',mode:0o600});fs.renameSync(temp,file);}finally{fs.rmSync(temp,{force:true});}
    }
   };
  },
  get(workspaceId){const saved=read(workspaceId);return saved?{baseUrl:saved.baseUrl,model:saved.model,supportsReferences:saved.supportsReferences===true,supportsVision:kind==='llm'&&saved.supportsVision===true,apiKey:saved.encryptedKey?unprotect(saved.encryptedKey):''}:environment();},
  status(workspaceId){const saved=read(workspaceId),value=saved||environment();return {baseUrl:value.baseUrl||'',model:value.model||'',supportsReferences:value.supportsReferences===true,supportsVision:kind==='llm'&&value.supportsVision===true,hasKey:saved?!!saved.encryptedKey:!!value.apiKey,source:saved?'workspace':'environment',secretProtection:process.platform==='win32'?'Windows DPAPI (current user)':'environment only'};},
  save(workspaceId,body){
   const config=validateImageConnection(body),previous=read(workspaceId);
   const key=body.apiKey===undefined?undefined:String(body.apiKey);
   if(key&&(key.length>8192||/[\r\n\0]/.test(key)))throw new Error('Khóa không hợp lệ.');
   // Keeping an old key is permitted only on the same endpoint, preventing an
   // accidentally retained credential from being sent to a newly entered host.
   let encryptedKey='';
   if(key&&!body.clearKey)encryptedKey=protect(key);
   else if(!body.clearKey&&key===undefined&&previous?.baseUrl===config.baseUrl)encryptedKey=previous.encryptedKey||'';
   write(workspaceId,{...config,encryptedKey,updatedAt:new Date().toISOString()});return this.status(workspaceId);
  },
  remove(workspaceId){fs.rmSync(fileFor(workspaceId),{force:true});return this.status(workspaceId);}
 };
}
