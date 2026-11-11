import fs from 'node:fs';
import {execFile,spawnSync} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
export function parseLoudnessOutput(stderr){
 const objects=String(stderr).match(/\{[^{}]*"input_i"[^{}]*\}/g)||[];
 if(objects.length!==1)throw Error('Không đọc được số đo loudness từ FFmpeg.');
 const value=JSON.parse(objects[0]),fields={integratedLufs:'input_i',truePeakDbtp:'input_tp',loudnessRangeLu:'input_lra',thresholdLufs:'input_thresh'},result={};
 for(const [name,key] of Object.entries(fields)){
  const raw=value[key];if(typeof raw!=='string'||raw.trim()==='')throw Error('Số đo loudness thiếu hoặc sai định dạng.');
  const n=Number(raw);if(!Number.isFinite(n)&&raw!=='-inf')throw Error('Số đo loudness không hợp lệ.');result[name]=Number.isFinite(n)?n:null;
 }
 if(result.integratedLufs===null&&result.truePeakDbtp!==null)throw Error('Số đo loudness không nhất quán.');
 return {...result,silent:result.integratedLufs===null};
}
function loudnessReport(stderr){
 const measured=parseLoudnessOutput(stderr),warnings=[];
 if(measured.silent)warnings.push('Không đo được loudness hữu hạn; kiểm file im lặng hoặc tín hiệu quá nhỏ.');
 else{
  if(measured.integratedLufs< -16||measured.integratedLufs> -12)warnings.push('Loudness nằm ngoài khoảng tham khảo -16 đến -12 LUFS; nghe và chọn mức theo kênh.');
  if(measured.truePeakDbtp> -1.5)warnings.push('True peak vượt mức tham khảo -1.5 dBTP; AAC có thể tạo đỉnh cao hơn sau mã hóa, cần kiểm bản xuất.');
 }
 return {readOnly:true,stream:'first-audio-stream',method:'FFmpeg loudnorm input measurements',...measured,reference:{integratedLufs:-14,truePeakDbtp:-1.5},warnings,listened:false,limits:'Không xác nhận chất lượng nhạc/SFX, độ rõ lời, sync, điểm cắt, quyền nhạc hoặc mọi audio stream. Không thay file nguồn.'};
}
const measurementArgs=file=>['-hide_banner','-nostdin','-nostats','-i',file,'-map','0:a:0','-vn','-af','loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json','-f','null','-'];
export function measureAudioLoudnessSync(file){
 const before=fs.statSync(file);if(!before.isFile())throw Error('Chọn file media đã xuất.');
 // FFmpeg prints input measurements on stderr. Route it through a bounded spawn.
 const result=spawnMeasurement(file);
 const after=fs.statSync(file);if(before.size!==after.size||before.mtimeMs!==after.mtimeMs)throw Error('File thay đổi trong lúc đo; kiểm lại bản xuất.');
 return loudnessReport(result);
}
function spawnMeasurement(file){
 // execFileSync cannot return stderr on success; FFmpeg can send its log to a
 // temporary pipe using spawnSync, without rewriting or remuxing the media.
 const result=spawnSync('ffmpeg',measurementArgs(file),{encoding:'utf8',windowsHide:true,timeout:300000,maxBuffer:4*1024*1024});
 if(result.error)throw result.error;if(result.status!==0)throw Error('Không đo được âm lượng bản xuất.');return result.stderr;
}
export async function measureAudioLoudness(file,{signal}={}){
 if(!fs.statSync(file).isFile())throw Error('Chọn file media đã xuất.');
 const before=fs.statSync(file);
 const {stderr}=await run('ffmpeg',measurementArgs(file),{encoding:'utf8',windowsHide:true,timeout:300000,maxBuffer:4*1024*1024,signal});
 const after=fs.statSync(file);if(before.size!==after.size||before.mtimeMs!==after.mtimeMs)throw Error('File thay đổi trong lúc đo; kiểm lại bản xuất.');
 return loudnessReport(stderr);
}
