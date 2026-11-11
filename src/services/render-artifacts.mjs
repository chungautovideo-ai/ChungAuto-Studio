import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {makeTimemap} from '../../editor/lib/timemap.js';
import {fingerprintArtifact,verifyArtifact} from './artifact-integrity.mjs';
import {measureAudioLoudnessSync} from './audio-loudness.mjs';
import {ensureEncodedAudioHeadroom} from './encoded-audio-headroom.mjs';
// Ghi đè an toàn: chép ra file tạm cạnh đích rồi đổi tên (bản cũ còn nguyên nếu chép lỗi).
function placeFile(source,target,overwrite){
 if(!overwrite)return fs.copyFileSync(source,target,fs.constants.COPYFILE_EXCL);
 const temp=target+'.'+process.pid+'-'+Date.now()+'.tmp';
 try{fs.copyFileSync(source,temp,fs.constants.COPYFILE_EXCL);fs.renameSync(temp,target);}finally{fs.rmSync(temp,{force:true});}
}
// destName/overwrite: tên file người dùng đặt trong hộp Xuất (đã xác nhận ghi đè nếu trùng).
export function finalizeRenderArtifact({snapshot,projectDir,output,destination='',destName='',overwrite=false,quality,batch,renderJobDir}){
 const source=path.join(snapshot.directory,output),project=JSON.parse(fs.readFileSync(path.join(snapshot.directory,'project.json'),'utf8'));
 if(!fs.existsSync(source)||fs.statSync(source).size<32)throw new Error('Không có file render hợp lệ.');
 let loudnorm=false;const warnings=[],temp=source.replace(/\.mp4$/,'.loud.mp4');
 try{
  execFileSync('ffmpeg',['-nostdin','-v','error','-y','-i',source,'-c:v','copy','-af','loudnorm=I=-14:TP=-1.5:LRA=11','-ar','48000','-c:a','aac','-b:a','192k','-movflags','+faststart',temp],{windowsHide:true,stdio:'ignore',timeout:300000});
  fs.renameSync(temp,source);loudnorm=true;
 }catch{warnings.push('Chưa chuẩn hóa được âm lượng; bản xuất giữ âm thanh trước bước chuẩn hóa. Kiểm tra hoặc đo lại âm lượng trước khi sử dụng.');}finally{fs.rmSync(temp,{force:true});}
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type,codec_name,width,height,r_frame_rate','-of','json',source],{windowsHide:true,encoding:'utf8',timeout:20000}));
 const video=probe.streams?.find(s=>s.codec_type==='video'),expected=project.format==='16:9'?[1920,1080]:[1080,1920],duration=Number(probe.format?.duration),total=makeTimemap(project).total;
 if(!video||video.width!==expected[0]||video.height!==expected[1]||!Number.isFinite(duration)||duration<=0||Math.abs(duration-total)>Math.max(0.2,total*0.002))throw new Error('File render không khớp kích thước hoặc thời lượng bản chụp.');
 let audioLoudness,audioHeadroom;
 if(probe.streams?.some(s=>s.codec_type==='audio')){
  try{
   audioLoudness=measureAudioLoudnessSync(source);
   if(loudnorm&&audioLoudness.truePeakDbtp> -1.5){
    try{const corrected=ensureEncodedAudioHeadroom(source,audioLoudness);audioLoudness=corrected.measurement;audioHeadroom=corrected.correction;}
    catch{warnings.push('Chưa xác nhận được giảm đỉnh AAC; giữ bản âm thanh đã đo, cần kiểm trước khi sử dụng.');audioLoudness=measureAudioLoudnessSync(source);}
   }
   warnings.push(...audioLoudness.warnings);
  }catch{warnings.push('Chưa đo được âm lượng bản mã hóa cuối; cần đo hoặc nghe kiểm trước khi sử dụng.');}
 }
 const file=path.join(projectDir,output);placeFile(source,file,overwrite);
 const integrity=fingerprintArtifact(file);
 if(!probe.streams?.some(s=>s.codec_type==='audio')){loudnorm=false;warnings.length=0;warnings.push('Bản xuất không có track âm thanh; kiểm tra đây có phải video chủ đích không tiếng.');}
 const result={...integrity,snapshotId:snapshot.manifest.id,revision:snapshot.manifest.revision,projectDir,quality,ok:true,output:file,probe,loudnorm,warnings,...(audioLoudness?{audioLoudness}:{}),...(audioHeadroom?{audioHeadroom}:{}),finishedAt:new Date().toISOString(),...(batch?{batchTaskId:batch.taskId,batchItem:batch.item}:{}),...(renderJobDir?{renderJobDir}:{})};
 fs.writeFileSync(file+'.json',JSON.stringify(result,null,2)+'\n',{flag:'w'});fs.writeFileSync(path.join(snapshot.directory,'result.json'),JSON.stringify(result,null,2)+'\n');
 let saved=file,saveError;
 if(destination&&path.resolve(destination)!==path.resolve(projectDir,'renders')){
  try{
   fs.mkdirSync(destination,{recursive:true});const stem=path.basename(destName||output,'.mp4');let target=path.join(destination,stem+'.mp4');
   const replace=overwrite&&!!destName;
   if(!replace)for(let n=2;fs.existsSync(target);n++)target=path.join(destination,stem+'-'+n+'.mp4');
   placeFile(file,target,replace);verifyArtifact(target,result);fs.writeFileSync(target+'.json',JSON.stringify({...result,output:target,originalOutput:file},null,2)+'\n',{flag:'w'});saved=target;
  }catch(error){saveError='Không chép được sang thư mục đã chọn: '+error.message;}
 }
 return {...integrity,saved,probe,loudnorm,warnings,...(audioLoudness?{audioLoudness}:{}),...(audioHeadroom?{audioHeadroom}:{}),...(saveError?{saveError}:{})};
}
