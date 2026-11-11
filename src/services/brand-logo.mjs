import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {normalizeWatermark} from '../../editor/lib/watermark.js';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const blob=(root,logo)=>{if(!/^[a-f0-9]{64}$/.test(logo.sha256)||!/^\.(png|jpg|jpeg|webp)$/.test(logo.extension)||!Number.isInteger(logo.bytes)||logo.bytes<1||logo.bytes>2*1024*1024)throw new Error('Logo nhận diện không hợp lệ.');return path.join(root,'workspace/contentos/brand-assets',logo.sha256+logo.extension);};
export function saveBrandLogo(root,projectDir,value){
 const watermark=normalizeWatermark(value);if(!watermark)return null;
 const realRoot=fs.realpathSync(projectDir),source=fs.realpathSync(path.resolve(realRoot,watermark.file)),rel=path.relative(realRoot,source);
 if(!rel||rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel)||!fs.statSync(source).isFile())throw new Error('Logo phải nằm trong dự án.');
 const size=fs.statSync(source).size;if(size>2*1024*1024)throw new Error('Logo mặc định tối đa 2 MB.');
 const bytes=fs.readFileSync(source);const info=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',source],{encoding:'utf8',windowsHide:true}));if(!info.streams?.[0]?.width||!info.streams[0].height)throw new Error('Không đọc được ảnh logo.');
 const logo={watermark,sha256:hash(bytes),bytes:bytes.length,extension:path.extname(watermark.file).toLowerCase()},target=blob(root,logo);fs.mkdirSync(path.dirname(target),{recursive:true});
 try{fs.writeFileSync(target,bytes,{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;if(hash(fs.readFileSync(target))!==logo.sha256)throw new Error('Kho logo đã thay đổi nội dung.');}
 return logo;
}
export function applyBrandLogo(root,projectDir,logo){
 const watermark=normalizeWatermark(logo.watermark),bytes=fs.readFileSync(blob(root,logo));if(!watermark||bytes.length!==logo.bytes||hash(bytes)!==logo.sha256)throw new Error('Logo mặc định bị thiếu hoặc đổi nội dung.');
 const realRoot=fs.realpathSync(projectDir),folder=path.join(realRoot,'inputs');fs.mkdirSync(folder,{recursive:true});const realFolder=fs.realpathSync(folder),rel=path.relative(realRoot,realFolder);if(!rel||rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel))throw new Error('Thư mục nhận logo không nằm trong dự án.');
 const name='brand-'+logo.sha256+logo.extension,target=path.join(realFolder,name);
 try{fs.writeFileSync(target,bytes,{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;const real=fs.realpathSync(target);if(path.dirname(real)!==realFolder||hash(fs.readFileSync(real))!==logo.sha256)throw new Error('Logo dự án đã đổi nội dung.');}
 return {...watermark,file:'inputs/'+name};
}
