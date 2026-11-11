import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {exportImage,inspectImage} from './image-output.mjs';
const run=promisify(execFile);
async function decodeImage(file,{signal}={}){
 const dimensions=await inspectImage(file,{signal});
 await run('ffmpeg',['-nostdin','-v','error','-xerror','-i',file,'-frames:v','1','-f','null','-'],{windowsHide:true,timeout:30000,maxBuffer:1024*1024,signal});
 return dimensions;
}
const sizes={'1:1':'1024x1024','9:16':'1024x1536','16:9':'1536x1024'};
export function createImageService(root,{env=process.env,fetcher=fetch,connections}={}){
 const configFor=workspaceId=>connections?connections.get(workspaceId):{baseUrl:env.CONTENTOS_IMAGE_BASE_URL,model:env.CONTENTOS_IMAGE_MODEL,apiKey:env.CONTENTOS_IMAGE_API_KEY,supportsReferences:env.CONTENTOS_IMAGE_REFERENCES==='1'};
 const folderFor=workspaceId=>{
  if(!/^[a-zA-Z0-9-]+$/.test(workspaceId))throw new Error('Workspace không hợp lệ.');
  return path.join(root,'workspace/contentos/images',workspaceId);
 };
 const status=workspaceId=>{const config=connections?connections.status(workspaceId):configFor(workspaceId);return {configured:!!(config.baseUrl&&config.model),model:config.model||null,supportsReferences:config.supportsReferences===true,transport:'openai-compatible',hasKey:connections?config.hasKey:!!config.apiKey};};
 const assetFile=(workspaceId,id)=>{
  if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Ảnh không hợp lệ.');
  const meta=JSON.parse(fs.readFileSync(path.join(folderFor(workspaceId),id+'.json'),'utf8'));
  if(meta.workspaceId!==workspaceId||meta.id!==id||!['.png','.jpg'].includes(meta.extension))throw new Error('Ảnh không thuộc workspace hoặc metadata không hợp lệ.');
  return {meta,file:path.join(folderFor(workspaceId),id+meta.extension)};
 };
 const busy=new Set();
 return {
  status,assetFile,
  async importImage(workspaceId,bytes,{name='Ảnh tham chiếu',prompt,validate=()=>{},source=null}={}){
   validate();const folder=folderFor(workspaceId);
   if(!Buffer.isBuffer(bytes)||bytes.length<24||bytes.length>20*1024**2)throw new Error('Chọn ảnh PNG/JPEG tối đa 20 MiB.');
   const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
   if(!png&&!jpeg)throw new Error('Chỉ nhập ảnh PNG/JPEG hợp lệ.');
   if(busy.has(workspaceId))throw new Error('Workspace đang xử lý ảnh. Đợi hoàn tất rồi thử lại.');
   busy.add(workspaceId);
   const id=crypto.randomUUID(),extension=png?'.png':'.jpg',temp=path.join(folder,'.'+id+'.part'),file=path.join(folder,id+extension),metadata=path.join(folder,id+'.json');
   try{
    fs.mkdirSync(folder,{recursive:true});
    const disk=fs.statfsSync(folder);if(Number(disk.bavail)*Number(disk.bsize)<bytes.length+128*1024**2)throw new Error('Ổ local không đủ chỗ nhập ảnh.');
    fs.writeFileSync(temp,bytes,{flag:'wx'});const dimensions=await decodeImage(temp);validate();
    const sha256=crypto.createHash('sha256').update(bytes).digest('hex'),label=String(name).split(/[\\/]/).at(-1).replace(/[\x00-\x1f]/g,'').trim().slice(0,200)||'Ảnh tham chiếu';
    const meta={id,workspaceId,prompt:typeof prompt==='string'?prompt.slice(0,10000):label,originalName:label,operation:'import',origin:source?.app==='aiev-image'?'aiev-migration':source?'project-media':'user-upload',...(source?{source}:{}),aspect:dimensions.width===dimensions.height?'1:1':dimensions.width>dimensions.height?'16:9':'9:16',dimensions,extension,bytes:bytes.length,sha256,createdAt:new Date().toISOString()};
    fs.renameSync(temp,file);fs.writeFileSync(metadata,JSON.stringify(meta,null,2)+'\n',{flag:'wx'});return meta;
   }catch(error){fs.rmSync(file,{force:true});fs.rmSync(metadata,{force:true});throw error;}finally{busy.delete(workspaceId);fs.rmSync(temp,{force:true});}
  },
  async export(workspaceId,id,{aspect,fit='contain'}={}){
   const original=assetFile(workspaceId,id),folder=folderFor(workspaceId),nextId=crypto.randomUUID();
   const file=path.join(folder,nextId+'.png');
   try{
    const dimensions=await exportImage(original.file,file,{aspect,fit});const bytes=fs.readFileSync(file);
    const meta={...original.meta,id:nextId,extension:'.png',aspect,dimensions,derivedFrom:id,operation:'resize',bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),createdAt:new Date().toISOString()};
    fs.writeFileSync(path.join(folder,nextId+'.json'),JSON.stringify(meta,null,2)+'\n',{flag:'wx'});return meta;
   }catch(error){fs.rmSync(file,{force:true});throw error;}
  },
  list(workspaceId){const folder=folderFor(workspaceId);return fs.existsSync(folder)?fs.readdirSync(folder).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(path.join(folder,f),'utf8'))).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)):[];},
  async generate(workspaceId,{prompt,aspect='1:1',style=null,referenceIds=[],count=1,model,validate:validateContext=()=>{},signal}={}){
   const validate=()=>{signal?.throwIfAborted();validateContext();signal?.throwIfAborted();};
   validate();
   if(!Number.isInteger(count)||count<1||count>4)throw new Error('Chọn từ 1 đến 4 phương án ảnh.');
   if(!Array.isArray(referenceIds)||referenceIds.length>4||new Set(referenceIds).size!==referenceIds.length)throw new Error('Chọn tối đa 4 ảnh tham chiếu khác nhau.');
   prompt=String(prompt||'').trim();if(!prompt||prompt.length>10000||!sizes[aspect])throw new Error('Nhập prompt tối đa 10.000 ký tự và tỷ lệ hỗ trợ.');
   if(!status(workspaceId).configured)throw new Error('Chưa cấu hình gateway ảnh. Mở Kết nối ảnh để thiết lập.');
   if(model!==undefined&&(typeof model!=='string'||model.trim()&&!/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(model.trim())))throw new Error('Model ảnh cho lượt tạo không hợp lệ.');
   const savedConfig=configFor(workspaceId),config={...savedConfig,model:model?.trim()||savedConfig.model};
   if(referenceIds.length&&!config.supportsReferences)throw new Error('Kết nối chưa khai báo hỗ trợ ảnh tham chiếu qua /images/edits.');
   if(busy.has(workspaceId))throw Object.assign(new Error('Workspace đang tạo một ảnh; đợi kết quả trước khi gửi tiếp.'),{status:409});
   const endpoint=new URL(config.baseUrl);
   if(endpoint.username||endpoint.password||endpoint.search||endpoint.hash||!(endpoint.protocol==='https:'||endpoint.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(endpoint.hostname)))throw new Error('Gateway ảnh cần HTTPS hoặc HTTP loopback, không chứa thông tin đăng nhập/query.');
   const effectivePrompt=[prompt,style?.art?'Phong cách: '+style.art:'',style?.palette?'Bảng màu: '+style.palette:'',style?.avoid?'Tránh: '+style.avoid:''].filter(Boolean).join('\n');
   busy.add(workspaceId);
   try{
    const references=[];let referenceBytes=0,body,headers=config.apiKey?{Authorization:'Bearer '+config.apiKey}:{};
    if(referenceIds.length){
     body=new FormData();for(const [key,value] of Object.entries({model:config.model,prompt:effectivePrompt,n:String(count),size:sizes[aspect],response_format:'b64_json'}))body.set(key,value);
     for(const referenceId of referenceIds){
      const asset=assetFile(workspaceId,referenceId),stat=fs.statSync(asset.file);referenceBytes+=stat.size;if(referenceBytes>20*1024**2)throw new Error('Tổng ảnh tham chiếu tối đa 20 MiB.');
      const bytes=fs.readFileSync(asset.file),hash=crypto.createHash('sha256').update(bytes).digest('hex');if(hash!==asset.meta.sha256)throw new Error('Ảnh tham chiếu đã đổi. Chọn lại ảnh gốc.');
      const dimensions=await inspectImage(asset.file,{signal});validate();body.append(referenceIds.length===1?'image':'image[]',new Blob([bytes],{type:asset.meta.extension==='.png'?'image/png':'image/jpeg'}),referenceId+asset.meta.extension);references.push({id:referenceId,sha256:hash,dimensions});
     }
    }else{headers['Content-Type']='application/json';body=JSON.stringify({model:config.model,prompt:effectivePrompt,n:count,size:sizes[aspect],response_format:'b64_json'});}
    validate();const response=await fetcher(endpoint.href.replace(/\/$/,'')+(referenceIds.length?'/images/edits':'/images/generations'),{method:'POST',redirect:'error',signal:AbortSignal.any([AbortSignal.timeout(180000),...(signal?[signal]:[])]),headers,body});
    if(!response.ok)throw new Error('Gateway ảnh trả HTTP '+response.status+'. Kiểm tra kết nối, model và hạn mức.');
    const chunks=[];let total=0;
    for await(const chunk of response.body){validate();total+=chunk.length;if(total>40*1024**2)throw new Error('Phản hồi ảnh quá lớn.');chunks.push(chunk);}
    const content=Buffer.concat(chunks).toString('utf8');
    const result=JSON.parse(content);
    if(!Array.isArray(result.data)||result.data.length!==count)throw new Error('Gateway trả số ảnh khác yêu cầu; chưa lưu kết quả. Không tự gửi lại để tránh phát sinh phí.');
    const batchId=crypto.randomUUID(),folder=folderFor(workspaceId),outputs=[];
    for(const [index,item] of result.data.entries()){
    const encoded=item?.b64_json;
    if(typeof encoded!=='string'||!encoded||!/^[A-Za-z0-9+/=\r\n]+$/.test(encoded))throw new Error('Gateway chưa trả ảnh base64 được hỗ trợ.');
    const bytes=Buffer.from(encoded,'base64');
    const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const jpeg=bytes.length>4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
    if(bytes.length<24||(!png&&!jpeg))throw new Error('Kết quả không phải PNG/JPEG hợp lệ theo chữ ký file.');
    const id=crypto.randomUUID(),extension=png?'.png':'.jpg';
    const meta={id,workspaceId,prompt,effectivePrompt,aspect,requestedSize:sizes[aspect],model:config.model,styleId:style?.id||null,operation:references.length?'reference-generation':'text-generation',references,batchId,variantIndex:index+1,variantCount:count,extension,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),createdAt:new Date().toISOString()};
    outputs.push({meta,bytes});
    }
    validate();fs.mkdirSync(folder,{recursive:true});
    const disk=fs.statfsSync(folder),required=outputs.reduce((n,o)=>n+o.bytes.length,0)+128*1024**2;
    if(Number(disk.bavail)*Number(disk.bsize)<required)throw new Error('Ổ local không đủ chỗ lưu kết quả ảnh.');
    // Validate the entire batch before publishing any result metadata.
    const staged=[];
    try{for(const output of outputs){
     const temp=path.join(folder,'.'+output.meta.id+'.part');fs.writeFileSync(temp,output.bytes,{flag:'wx'});staged.push(temp);
     try{output.meta.dimensions=await decodeImage(temp,{signal});}catch{signal?.throwIfAborted();throw new Error('Gateway trả ảnh không giải mã được hoặc có kích thước không hợp lệ. Chưa lưu lô kết quả; không tự gửi lại.');}
     validate();
    }}finally{for(const temp of staged)fs.rmSync(temp,{force:true});}
    validate();const written=[];
    try{for(const {meta,bytes} of outputs){
     const file=path.join(folder,meta.id+meta.extension),metadata=path.join(folder,meta.id+'.json');
     fs.writeFileSync(file,bytes,{flag:'wx'});written.push(file);
     fs.writeFileSync(metadata,JSON.stringify(meta,null,2)+'\n',{flag:'wx'});written.push(metadata);
    }}catch(error){for(const file of written)fs.rmSync(file,{force:true});throw error;}
    return count===1?outputs[0].meta:{...outputs[0].meta,images:outputs.map(o=>o.meta)};
   }finally{busy.delete(workspaceId);}
  }
 };
}
