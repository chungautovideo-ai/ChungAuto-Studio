import fs from 'node:fs';
import {previewAievImages} from './image-migration.mjs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import {resolveContained} from './storage.mjs';
import {convertAievProject} from './aiev-project-adapter.mjs';

// Metadata only; never evaluate compositions or mutate original apps.
export function previewMigration(root,workspaceId,imageOptions={}){
 if(!/^[a-zA-Z0-9-]+$/.test(workspaceId))throw new Error('Workspace không hợp lệ.');
 const configFile=path.join(root,'config/sources.local.json');
 const config=fs.existsSync(configFile)?JSON.parse(fs.readFileSync(configFile,'utf8')):{};
 const parent=path.dirname(root),specs=[
  {app:'vek',root:config.vekRoot||path.join(parent,'video-edit-kit'),folder:'workspace/content',file:'project.json',depth:2},
  {app:'aiev',root:config.aievRoot||path.join(parent,'AIEVv2'),folder:'video-projects',file:'meta.json',depth:1},
  {app:'studio',root:config.studioJobsRoot||path.join(os.homedir(),'ChungAutoVideoFactory/jobs'),folder:'.',file:'job.json',depth:1},
 ];
 const sources=[];
 for(const spec of specs){
  const result={app:spec.app,entries:[],issues:[],visited:0,truncated:false};sources.push(result);
  try{
   const sourceRoot=path.resolve(spec.root);if(sourceRoot===path.resolve(root))throw new Error('Nguồn không được là ContentOS hiện tại.');
   const folder=resolveContained(sourceRoot,spec.folder).file;
   if(!fs.existsSync(folder)){result.issues.push('Chưa tìm thấy thư mục dự án chuẩn; kiểm tra cấu hình nguồn.');continue;}
   const walk=(dir,depth)=>{
    if(result.truncated)return;
    if(++result.visited>2000||result.entries.length>=200){result.truncated=true;return;}
    const relative=path.relative(folder,dir),safe=resolveContained(folder,relative).file,file=path.join(safe,spec.file);
    if(fs.existsSync(file)){
     try{
      resolveContained(folder,path.relative(folder,file));const stat=fs.statSync(file);
      if(!stat.isFile()||stat.size>4*1024**2)throw new Error('Metadata không phải file hoặc vượt 4MiB.');
      const bytes=fs.readFileSync(file),data=JSON.parse(bytes.toString('utf8'));
      if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Metadata sai cấu trúc.');
      const format=spec.app==='vek'?(data.source?.video&&Array.isArray(data.segments)?'vek-project':'unknown-project'):spec.app==='aiev'?'aiev-composition':'studio-job';
      result.entries.push({id:spec.app+':'+relative.replaceAll('\\','/'),relative:relative.replaceAll('\\','/'),title:String(data.title||data.name||data.id||path.basename(dir)).slice(0,180),metadataHash:crypto.createHash('sha256').update(bytes).digest('hex'),metadataBytes:stat.size,format,canImport:format==='vek-project',needsAdapter:format==='vek-project'?null:'composition-to-project',message:format==='vek-project'?'Có thể sao chép; tư liệu phụ thuộc được kiểm tra khi nhập.':'Cần chuyển composition/job và ánh xạ tài nguyên.'});
      if(spec.app==='aiev'){
       const entry=result.entries.at(-1);
       try{const project=convertAievProject(data);entry.canImport=true;entry.needsAdapter=null;entry.message=(project.source.timeline==='segments'?'Nhiều video nguồn: giữ file và điểm cắt riêng từng clip. ':'')+'Chuyển các đoạn cắt footage sang timeline ContentOS; kiểm video khi nhập.'+(project.texts.length?' Phụ đề chuyển thành lớp chữ chỉnh được, dùng kiểu chữ ContentOS.':'')+(project.audio.clips.length?' Voice-over/SFX chuyển thành clip audio chỉnh được.':'')+(project.audio.music?' Nhạc giữ lặp, fade và các vùng lời nói đã khai báo.':'')+(project.watermark?' Logo góc chuyển vào Thương hiệu.':'')+(project.segments.some(s=>(s.speed??1)!==1)?' Giữ tốc độ từng cảnh; phụ đề/audio dùng timeline đã đổi tốc độ.':'');}
       catch(error){entry.message='Chưa chuyển được: '+error.message;}
      }
      if(spec.app==='studio'){
       const nativeRelative=path.join(relative,'05_plan/studio/composition/project.json');
       if(fs.existsSync(path.join(folder,nativeRelative))){
        try{
         const nativeFile=resolveContained(folder,nativeRelative).file,stat=fs.statSync(nativeFile);
         if(!stat.isFile()||stat.size>4*1024**2)throw new Error('Composition vượt giới hạn metadata.');
         const nativeBytes=fs.readFileSync(nativeFile),project=JSON.parse(nativeBytes.toString('utf8').replace(/^\uFEFF/,''));
         if(!project.source?.video||!Array.isArray(project.segments)||!project.segments.length)throw new Error('Composition thiếu nguồn hoặc segments.');
         Object.assign(result.entries.at(-1),{format:'studio-composition',canImport:true,needsAdapter:null,projectHash:crypto.createHash('sha256').update(nativeBytes).digest('hex'),message:'Composition dùng cùng định dạng editor; kiểm tư liệu khi sao chép.'});
        }catch(error){result.entries.at(-1).message='Chưa chuyển được composition: '+error.message;}
       }
      }
     }catch(error){result.issues.push(relative+': '+error.message);}
     return;
    }
    if(depth>=spec.depth)return;
    for(const entry of fs.readdirSync(safe,{withFileTypes:true})){
     if(result.truncated)break;
     if(entry.name.startsWith('.')||entry.name.startsWith('_'))continue;
     if(entry.isSymbolicLink()){result.issues.push('Bỏ qua liên kết: '+entry.name);continue;}
     if(entry.isDirectory())walk(path.join(safe,entry.name),depth+1);
    }
   };
   walk(folder,0);
  }catch(error){result.issues.push(error.message);}
 }
 return {workspaceId,imageProjects:previewAievImages(root,imageOptions),checkedAt:new Date().toISOString(),sources,readOnly:true,limitations:['Chỉ kiểm kê metadata, chưa kiểm media hoặc chuyển dự án.','Không nhập khóa, tài khoản, log thực thi hoặc lịch đăng.','Studio dùng mặc định ChungAutoVideoFactory/jobs; nếu khác, đặt studioJobsRoot trong config/sources.local.json. Không tự đọc YAML hoặc biến môi trường của app cũ.']};
}
