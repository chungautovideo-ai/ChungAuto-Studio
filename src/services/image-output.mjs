import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
export const imageDimensions={'1:1':[1080,1080],'9:16':[1080,1920],'16:9':[1920,1080]};
export async function inspectImage(file,{signal}={}){
 const {stdout}=await run('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',file],{windowsHide:true,timeout:20000,maxBuffer:1024*1024,signal});
 const stream=JSON.parse(stdout).streams?.[0];
 if(!stream||!Number.isInteger(stream.width)||!Number.isInteger(stream.height)||stream.width<1||stream.height<1||stream.width*stream.height>64000000)throw new Error('Ảnh không có kích thước hợp lệ hoặc quá 64 megapixel.');
 return {width:stream.width,height:stream.height};
}
export async function exportImage(source,destination,{aspect,fit='contain'}={}){
 const size=imageDimensions[aspect];if(!size||!['contain','cover'].includes(fit))throw new Error('Chọn tỷ lệ và cách khớp ảnh hợp lệ.');
 const original=await inspectImage(source);const [width,height]=size;
 const filter=fit==='cover'?`scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1`:`scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1`;
 await run('ffmpeg',['-nostdin','-v','error','-xerror','-i',source,'-vf',filter,'-frames:v','1','-update','1','-n',destination],{windowsHide:true,timeout:45000,maxBuffer:1024*1024});
 const actual=await inspectImage(destination);if(actual.width!==width||actual.height!==height)throw new Error('Ảnh xuất không đúng kích thước đích.');
 return {...actual,original,fit,aspect};
}
