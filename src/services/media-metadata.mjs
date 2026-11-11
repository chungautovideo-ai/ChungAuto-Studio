import fs from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);let active=0;
export async function probeMediaMetadata(file,{validate=()=>{}}={}){
 validate();if(active>=2)throw new Error('Đang đọc hai file media. Thử lại sau.');
 active++;
 try{
  const before=fs.statSync(file);if(!before.isFile())throw new Error('Chọn một file media.');
  const {stdout}=await run('ffprobe',['-v','error','-show_entries','stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels,pix_fmt,color_space,color_transfer,color_primaries,color_range:stream_tags=rotate,make,model,com.apple.quicktime.make,com.apple.quicktime.model:stream_side_data:format=duration:format_tags=make,model,com.apple.quicktime.make,com.apple.quicktime.model','-of','json',file],{windowsHide:true,timeout:15000,maxBuffer:1024*1024});
  validate();const after=fs.statSync(file);
  if(before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ino!==after.ino)throw new Error('File đang thay đổi. Kiểm tra lại sau.');
  const info=JSON.parse(stdout),video=info.streams?.find(s=>s.codec_type==='video'),audio=info.streams?.find(s=>s.codec_type==='audio');
  const kind=/\.(png|jpe?g|webp|gif)$/i.test(file)?'image':video?'video':'audio',duration=Number(info.format?.duration);
  if(!video&&!audio||kind==='image'&&!video||kind!=='image'&&(!Number.isFinite(duration)||duration<=0))throw new Error('Không đọc được media hợp lệ.');
  const rotation=Number(video?.tags?.rotate||video?.side_data_list?.find(d=>d.rotation!=null)?.rotation||0),rotated=Math.abs(rotation)%180===90;
  const tags={...info.format?.tags,...video?.tags};
  const colorMetadata=video?{primaries:video.color_primaries||'unknown',transfer:video.color_transfer||'unknown',matrix:video.color_space||'unknown',range:video.color_range||'unknown',pixelFormat:video.pix_fmt||'unknown',make:String(tags.make||tags['com.apple.quicktime.make']||'').slice(0,100),model:String(tags.model||tags['com.apple.quicktime.model']||'').slice(0,100),dolbyVision:(video.side_data_list||[]).some(s=>/DOVI|Dolby Vision/i.test(s.side_data_type||''))}:undefined;
  return {name:path.basename(file),kind,bytes:before.size,mtimeMs:before.mtimeMs,duration:Number.isFinite(duration)&&duration>0?duration:null,width:video?.width,height:video?.height,displayWidth:rotated?video?.height:video?.width,displayHeight:rotated?video?.width:video?.height,rotation,codec:video?.codec_name||audio?.codec_name,fps:video?.r_frame_rate,hasAudio:!!audio,sampleRate:audio?.sample_rate?Number(audio.sample_rate):undefined,channels:audio?.channels,...(colorMetadata?{colorMetadata}:{})};
 }finally{active--;}
}
