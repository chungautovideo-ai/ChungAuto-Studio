import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {normalizeWatermark} from './watermark.js';

// Match the builder's CSS geometry while keeping the original image editable.
export function capcutWatermarkPlacement(value,frame,source,duration){
 const w=normalizeWatermark(value);if(!w||w.hidden)return null;
 if(![frame.width,frame.height,source.width,source.height,duration].every(n=>Number.isFinite(n)&&n>0))throw new Error('Kích thước/thời lượng logo không hợp lệ.');
 const margin=Math.round(w.marginPercent/100*frame.width),height=Math.round(w.heightPercent/100*frame.height),width=height*source.width/source.height;
 return {schemaVersion:1,start:0,duration,frame,source,width,height,x:w.position.endsWith('left')?margin:frame.width-margin-width,y:w.position.startsWith('top')?margin:frame.height-margin-height,opacity:w.opacity,position:w.position};
}

export function packageCapcutWatermark(project,projectDir,outputDir,frame,duration){
 const w=normalizeWatermark(project.watermark);if(!w||w.hidden)return null;
 const root=fs.realpathSync(projectDir),file=fs.realpathSync(path.resolve(root,w.file)),relative=path.relative(root,file);
 if(!relative||relative.startsWith('..'+path.sep)||relative==='..'||path.isAbsolute(relative)||!fs.statSync(file).isFile())throw new Error('Ảnh logo phải nằm trong dự án.');
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',file],{encoding:'utf8',windowsHide:true}));
 const placement=capcutWatermarkPlacement(w,frame,probe.streams?.[0]||{},duration);
 const folder=path.join(outputDir,'6-logo');fs.mkdirSync(folder,{recursive:true});
 const name='logo'+path.extname(w.file).toLowerCase();fs.copyFileSync(file,path.join(folder,name));
 const manifest={...placement,file:'6-logo/'+name};
 fs.writeFileSync(path.join(folder,'vi-tri-logo.json'),JSON.stringify(manifest,null,2)+'\n');
 return {manifest,instruction:`- Logo: thêm ${manifest.file} làm lớp ảnh trên cùng từ 00:00, dài ${duration}s; khung ${frame.width}×${frame.height}, cỡ ${placement.width}×${placement.height}px, góc trái trên của ảnh tại x=${placement.x}, y=${placement.y}px, độ đậm ${w.opacity*100}%. Tọa độ tính từ góc trái trên khung; giữ tỷ lệ ảnh. Chi tiết: 6-logo/vi-tri-logo.json. Video nền và lớp đồ họa chưa chứa logo.`};
}
