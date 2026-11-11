import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {resolveContained} from './storage.mjs';import {probeMediaMetadata} from './media-metadata.mjs';import {shotColorRequest} from './shot-color.mjs';import {detectInputColor,INPUT_COLOR_PROFILES} from '../../editor/lib/color-management.js';
import {validateSkinLift,skinLiftCube} from './skin-lift.mjs';
const run=promisify(execFile);let busy=false,nvencReady;
async function encoderMode(mode){if(!['auto','cpu','gpu'].includes(mode))throw new Error('Chế độ CPU/GPU không hợp lệ.');if(mode==='cpu')return 'libx264';if(nvencReady===undefined){try{await run('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','color=s=320x180:d=0.2','-c:v','h264_nvenc','-f','null','-'],{windowsHide:true,timeout:15000});nvencReady=true;}catch{nvencReady=false;}}if(mode==='gpu'&&!nvencReady)throw new Error('NVENC chưa dùng được; chọn CPU hoặc Tự động.');return nvencReady?'h264_nvenc':'libx264';}
async function hash(file){const h=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(file))h.update(chunk);return h.digest('hex');}
export function validateCube(text){
 if(typeof text!=='string'||Buffer.byteLength(text)>16*1024*1024)throw new Error('LUT .cube tối đa16MB.');let size=0,count=0;
 for(const raw of text.split(/\r?\n/)){const line=raw.replace(/#.*/,'').trim();if(!line)continue;
  if(/^TITLE(?:\s+[^\r\n]*)?$/.test(line))continue;
  if(/^LUT_3D_SIZE\s+(\d+)$/.test(line)){if(size)throw new Error('LUT có nhiều bảng.');size=Number(line.split(/\s+/)[1]);if(size<2||size>65)throw new Error('LUT3D cần2–65điểm mỗi chiều.');continue;}
  if(/^LUT_3D_INPUT_RANGE\s+0(?:\.0+)?\s+1(?:\.0+)?$/.test(line))continue;
  if(/^DOMAIN_MIN\s+0(?:\.0+)?\s+0(?:\.0+)?\s+0(?:\.0+)?$/.test(line)||/^DOMAIN_MAX\s+1(?:\.0+)?\s+1(?:\.0+)?\s+1(?:\.0+)?$/.test(line))continue;
  const values=line.split(/\s+/).map(Number);if(!size||values.length!==3||values.some(x=>!Number.isFinite(x)||x< -16||x>16))throw new Error('LUT chỉ nhận bảng3D2–65, domain0–1, không script/1D.');count++;
 }if(count!==size**3||!size)throw new Error('LUT thiếu số điểm màu.');return {size};
}
export function colorConversionPlan(meta,{profile='auto',technicalLut,lookLut,allowIdentity=false,skinLift=0}={}){
 validateSkinLift(skinLift);
 if(!Object.hasOwn(INPUT_COLOR_PROFILES,profile))throw new Error('Profile nguồn chưa hỗ trợ.');const detected=detectInputColor(meta),input=profile==='auto'?detected.profile:profile,warnings=[...detected.warnings];
 if(input==='unknown')throw new Error('Không xác định được màu nguồn; chọn profile trước khi chuyển.');
 if(!['rec709','hlg','pq'].includes(input)&&(!technicalLut||technicalLut.inputProfile!==input||technicalLut.kind!=='technical'))throw new Error('Nguồn Log cần LUT kỹ thuật đúng profile vào và Rec.709 đầu ra.');
 if(['rec709','hlg','pq'].includes(input)&&technicalLut)throw new Error('Không áp LUT Log lên nguồn SDR/HDR đã nhận diện.');
 if(lookLut&&(lookLut.kind!=='look'||lookLut.inputProfile!=='rec709'))throw new Error('LUT phong cách phải nhận Rec.709 sau chuẩn hóa.');
 const filters=[];
 if(['hlg','pq'].includes(input)){const range=meta.colorMetadata?.range==='pc'?'full':'limited';filters.push(`zscale=pin=bt2020:tin=${input==='hlg'?'arib-std-b67':'smpte2084'}:min=bt2020nc:rin=${range}:t=linear:npl=100`,'format=gbrpf32le','zscale=p=bt709','tonemap=tonemap=mobius:desat=2','zscale=t=bt709:m=bt709:r=limited','format=yuv420p');}
 if(technicalLut)filters.push('lut3d=file=technical.cube:interp=tetrahedral');if(lookLut)filters.push('lut3d=file=look.cube:interp=tetrahedral');
 if(skinLift>0){filters.push('lut3d=file=skin-lift.cube:interp=tetrahedral');warnings.push('Nâng sáng theo sắc màu gần da; không nhận diện mặt. Ghế da, nội thất và sơn cùng màu có thể bị ảnh hưởng; cần xem toàn đoạn.');}
 if(!filters.length&&!allowIdentity)throw new Error('Nguồn đã là Rec.709; không cần tạo bản chuẩn hóa nếu chưa chọn LUT phong cách.');
 return {input,output:'rec709',filters,warnings};
}
export async function importColorLut(dir,text,{kind,inputProfile,name}={}){
 validateCube(text);if(!['technical','look'].includes(kind)||!Object.hasOwn(INPUT_COLOR_PROFILES,inputProfile)||['auto','hlg','pq'].includes(inputProfile)||kind==='look'&&inputProfile!=='rec709'||kind==='technical'&&inputProfile==='rec709')throw new Error('Chọn loại LUT và profile đầu vào đúng.');
 const folder=path.join(dir,'assets','luts');fs.mkdirSync(folder,{recursive:true});resolveContained(dir,'assets/luts');const id=crypto.randomUUID(),relative=`assets/luts/${id}.cube`,file=path.join(dir,relative);fs.writeFileSync(file,text,{flag:'wx'});
 const info={path:relative,kind,inputProfile,outputProfile:'rec709',name:String(name||'LUT').slice(0,120),sha256:await hash(file)};fs.writeFileSync(file+'.json',JSON.stringify(info));return info;
}
export function listColorLuts(dir){const folder=path.join(dir,'assets','luts');if(!fs.existsSync(folder))return [];resolveContained(dir,'assets/luts');return fs.readdirSync(folder).filter(x=>/^[\w-]+\.cube\.json$/.test(x)).map(name=>{try{return JSON.parse(fs.readFileSync(resolveContained(dir,'assets/luts/'+name).file,'utf8'));}catch{return null;}}).filter(Boolean).slice(0,100);}
export async function normalizeColor(dir,project,request,{validate=()=>{},signal}={}){
 dir=path.resolve(dir);
 if(busy)throw new Error('Đang chuẩn hóa cảnh khác.');validate();signal?.throwIfAborted();const {kind,id,profile='auto',technicalLut:technicalPath,lookLut:lookPath}=request,item=project[kind]?.find(s=>s.id===id);
 if(item?.platePrivacy||item?.colorNormalization)throw new Error('Đoạn đã có bản che/chuẩn hóa; khôi phục nguồn trước.');
 if(kind==='segments'&&(project.camera?.matte||project.audio?.clean||project.vfx?.some(x=>x.type==='freeze')||project.transitions?.cut==='dissolve'||project.segments?.some(x=>x.tIn==='dissolve')))throw new Error('Tắt matte/lọc giọng/freeze/dissolve trước khi thay nguồn A-roll.');
 const selected=shotColorRequest(project,request),source=resolveContained(dir,selected.src).file,folder=path.join(dir,'inputs','color',crypto.randomUUID());busy=true;let created=false,committed=false;
 try{
  const meta=await probeMediaMetadata(source,{validate});if(meta.kind!=='video'||selected.from+selected.duration>meta.duration+.01)throw new Error('Nguồn thiếu thời lượng.');
  const luts=listColorLuts(dir),technicalLut=technicalPath?luts.find(l=>l.path===technicalPath):null,lookLut=lookPath?luts.find(l=>l.path===lookPath):null;if(technicalPath&&!technicalLut||lookPath&&!lookLut)throw new Error('LUT không có trong dự án.');
  const skinLift=validateSkinLift(request.skinLift??0),plan=colorConversionPlan(meta,{profile,technicalLut,lookLut,skinLift,allowIdentity:['smooth','lock','fast'].includes(request.stabilize)}),sourceHash=await hash(source),encoder=await encoderMode(request.encoder||'auto'),stabilize=request.stabilize||'off';if(!['off','smooth','lock','fast'].includes(stabilize))throw new Error('Chế độ chống rung không hợp lệ.');validate();signal?.throwIfAborted();
  fs.mkdirSync(folder,{recursive:true});resolveContained(dir,path.relative(dir,folder));created=true;
  for(const [name,lut] of [['technical',technicalLut],['look',lookLut]])if(lut){const file=resolveContained(dir,lut.path).file,text=fs.readFileSync(file,'utf8');validateCube(text);if(await hash(file)!==lut.sha256)throw new Error('LUT đã đổi sau nhập.');fs.writeFileSync(path.join(folder,name+'.cube'),text,{flag:'wx'});}
  if(skinLift>0)fs.writeFileSync(path.join(folder,'skin-lift.cube'),skinLiftCube(skinLift),{flag:'wx'});
  if(['smooth','lock'].includes(stabilize)){await run('ffmpeg',['-nostdin','-v','error','-y','-ss',String(selected.from),'-i',source,'-t',String(selected.duration),'-vf','vidstabdetect=shakiness=5:accuracy=15:result=transforms.trf','-an','-f','null','-'],{cwd:folder,windowsHide:true,signal,timeout:600000,maxBuffer:2*1024*1024});plan.filters.unshift('vidstabtransform=input=transforms.trf:smoothing=15:optzoom=1'+(stabilize==='lock'?':tripod=1':''));}
  if(stabilize==='fast')plan.filters.unshift('deshake');
  plan.filters.push('setparams=range=limited:color_primaries=bt709:color_trc=bt709:colorspace=bt709');
  const encodeArgs=encoder==='h264_nvenc'?['-c:v','h264_nvenc','-preset','p5','-rc','vbr','-cq','18','-b:v','0']:['-c:v','libx264','-x264-params','colorprim=bt709:transfer=bt709:colormatrix=bt709','-preset','fast','-crf','18'];
  const output=path.join(folder,'normalized.mp4');await run('ffmpeg',['-nostdin','-v','error','-y','-ss',String(selected.from),'-i',source,'-t',String(selected.duration),'-map','0:v:0','-map','0:a:0?','-vf',plan.filters.join(','),...encodeArgs,'-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-color_range','tv','-c:a','aac','-b:a','192k','-map_metadata','-1','-movflags','+faststart',output],{cwd:folder,windowsHide:true,signal,timeout:600000,maxBuffer:2*1024*1024});
  validate();if(await hash(source)!==sourceHash)throw new Error('Nguồn thay đổi khi chuyển màu.');const info=await probeMediaMetadata(output,{validate});if(Math.abs(info.duration-selected.duration)>.15||meta.hasAudio&&!info.hasAudio||info.colorMetadata.transfer!=='bt709')throw new Error('Bản chuẩn hóa thiếu thời lượng/âm thanh/tag màu.');
  const provenance={kind:'color-normalization',source:selected.src,sourceSha256:sourceHash,from:selected.from,duration:selected.duration,input:plan.input,output:'rec709',encoder,stabilize,skinLift:skinLift>0?{amount:skinLift,algorithm:'soft-ycbcr-lut33-v1',lutSha256:await hash(path.join(folder,'skin-lift.cube'))}:null,technicalLut:technicalLut?.sha256||null,lookLut:lookLut?.sha256||null,sha256:await hash(output)};fs.writeFileSync(path.join(folder,'provenance.json'),JSON.stringify(provenance,null,2));committed=true;
  return {path:path.relative(dir,output).replaceAll('\\','/'),duration:info.duration,provenance,mediaInfo:{width:info.displayWidth,height:info.displayHeight,duration:info.duration,hasAudio:info.hasAudio,colorMetadata:info.colorMetadata},warnings:plan.warnings,encoder,stabilize};
 }finally{busy=false;if(created&&!committed)fs.rmSync(resolveContained(dir,path.relative(dir,folder)).file,{recursive:true,force:true});}
}
export async function normalizeColorBatch(dir,project,request,options={}){
 const selected=shotColorRequest(project,request),items=[...(project.segments||[]).filter(x=>x.keep!==false).map(x=>({kind:'segments',id:x.id})),...(project.brolls||[]).filter(x=>!x.hidden&&/\.(mp4|mov|m4v|webm)$/i.test(x.src||'')).map(x=>({kind:'brolls',id:x.id}))];
 if(items.length>40)throw new Error('Mỗi lượt tối đa40đoạn; chia dự án/lượt xử lý trước.');const results=[],skipped=[];
 for(const item of items){options.validate?.();options.signal?.throwIfAborted();try{
  const source=shotColorRequest(project,item);if(request.profile&&request.profile!=='auto'&&source.src!==selected.src){skipped.push({...item,reason:'Profile chọn tay chỉ áp các đoạn cùng file nguồn; nguồn khác cần nhận diện riêng.'});continue;}
  results.push({...item,result:await normalizeColor(dir,project,{...request,...item},options)});
 }catch(error){if(options.signal?.aborted)throw error;options.validate?.();skipped.push({...item,reason:error.message});}}
 return {results,skipped};
}
