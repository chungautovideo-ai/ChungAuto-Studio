import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);

// Align the decoded image to the presentation interval containing the mask
// clock. Accurate input seek alone instead selects the next frame.
export function createSelectedPersonFrameDecoder(file,{duration,signal,validate=()=>{}}={}) {
 const options={encoding:'buffer',windowsHide:true,timeout:15000,maxBuffer:4*1048576,signal};
 const check=()=>{validate();signal?.throwIfAborted();};
 const probe=async args=>{
  check();const result=await run('ffprobe',['-v','error',...args,'-of','json',file],options);check();
  return JSON.parse(result.stdout.toString('utf8'));
 };
 let origin,window;
 return async function decode(time,w,h) {
  check();
  if(!Number.isFinite(duration)||duration<=0||!Number.isFinite(time)||time<0||time>=duration)throw Error('Mốc đo nằm ngoài thời lượng nguồn.');
  if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>65536)throw Error('Kích thước khung đo không hợp lệ.');
  if(origin===undefined){
   const format=await probe(['-show_entries','format=start_time']);
   origin=Number(format.format?.start_time??0);
   if(!Number.isFinite(origin))throw Error('Không xác minh được mốc bắt đầu nguồn.');
  }
  const target=origin+time;
  if(!window||target<window.from||target>=window.to){
   const from=Math.max(origin,target-2),to=Math.min(origin+duration,target+2)+.001;
   const info=await probe(['-select_streams','v:0','-read_intervals',`${from}%${to}`,'-show_frames','-show_entries','frame=best_effort_timestamp_time']);
   const times=(info.frames||[]).map(f=>Number(f.best_effort_timestamp_time)).filter(Number.isFinite).sort((a,b)=>a-b);
   // Require either a following PTS or a probe reaching source end. Never
   // substitute an arbitrary earlier frame after an unverified seek.
   window={from,to:to>=origin+duration?origin+duration:times.at(-1),times,atEnd:to>=origin+duration};
  }
  const selected=window.times.findLast(t=>t<=target+1e-7);
  const following=window.times.find(t=>t>target+1e-7);
  if(selected===undefined||(!following&&!window.atEnd)||selected<origin-1e-7)throw Error('Chưa xác minh được khung đang hiển thị ở mốc đo.');
  const decodedFrameTime=Math.max(0,selected-origin);
  check();
  const result=await run('ffmpeg',['-nostdin','-v','error','-ss',String(Math.max(0,decodedFrameTime-.000001)),'-i',file,'-map','0:v:0','-frames:v','1','-vf',`scale=${w}:${h}`,'-pix_fmt','rgba','-f','rawvideo','pipe:1'],{...options,maxBuffer:1048576});
  check();
  if(result.stdout.length!==w*h*4)throw Error('Không đọc đủ khung hình nguồn tại PTS đã xác minh.');
  return {rgba:result.stdout,requestedTime:time,decodedFrameTime,tailFallback:!following};
 };
}

export async function decodeSelectedPersonFrame(file,time,w,h,options={}) {
 return createSelectedPersonFrameDecoder(file,options)(time,w,h);
}
