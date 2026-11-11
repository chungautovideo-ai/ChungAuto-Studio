import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {visionPythonCandidates} from './vision-python.mjs';
import {plateRequest} from './plate-privacy.mjs';import {plateSuggestionGeometry} from '../../editor/lib/plate-regions.js';
import {resolveContained} from './storage.mjs';
const run=promisify(execFile);let active=false;
export async function suggestPlateRegions(root,dir,project,request,{validate=()=>{},signal}={}){
 if(active)throw new Error('Đang gợi ý biển cho cảnh khác. Đợi hoặc đóng tác vụ trước.');
 validate();signal?.throwIfAborted();
 const selected=plateRequest(project,{...request,roi:[.1,.1,.2,.1]}),source=resolveContained(dir,selected.item.src).file;
 active=true;let folder;
 try{
  let runtime;
  for(const candidate of visionPythonCandidates(root)){
   validate();signal?.throwIfAborted();
   try{await run(candidate.command,[...candidate.args,'-X','utf8','-c',"import cv2,numpy,rapidocr_onnxruntime;from pathlib import Path;p=Path(rapidocr_onnxruntime.__file__).parent/'models';assert all((p/n).is_file() for n in ['ch_PP-OCRv4_det_infer.onnx','ch_PP-OCRv4_rec_infer.onnx','ch_ppocr_mobile_v2.0_cls_infer.onnx'])"],{windowsHide:true,signal,timeout:10000,maxBuffer:32768});runtime=candidate;break;}catch(error){if(signal?.aborted)throw error;}
  }
  if(!runtime)throw new Error('Chưa có RapidOCR và model local. Vẫn có thể khoanh vùng thủ công; không tải tự động.');
  const relative='work/plate-suggestions/'+crypto.randomUUID();
  for(const rel of ['work','work/plate-suggestions']){if(fs.existsSync(path.join(dir,rel)))resolveContained(dir,rel);fs.mkdirSync(path.join(dir,rel),{recursive:true});resolveContained(dir,rel);}
  folder=path.join(dir,relative);fs.mkdirSync(folder,{recursive:true});resolveContained(dir,relative);
  const config=path.join(folder,'request.json');fs.writeFileSync(config,JSON.stringify({source,at:selected.from}));
  const {stdout}=await run(runtime.command,[...runtime.args,'-X','utf8',path.join(root,'editor/tools/plate-suggest.py'),config],{windowsHide:true,signal,timeout:60000,maxBuffer:262144});
  validate();signal?.throwIfAborted();const result=JSON.parse(stdout);
  if(result.at!==selected.from||!Array.isArray(result.proposals)||result.proposals.length>8||! /^[a-f0-9]{64}$/.test(result.sourceSha256))throw new Error('Kết quả gợi ý không hợp lệ. Khoanh vùng thủ công hoặc thử lại.');
  plateSuggestionGeometry(result.proposals);for(const proposal of result.proposals){if(!Number.isFinite(proposal.confidence)||proposal.confidence<0||proposal.confidence>1)throw new Error('Độ tin cậy gợi ý không hợp lệ.');}
  return {...result,src:selected.item.src};
 }finally{active=false;if(folder)fs.rmSync(resolveContained(dir,path.relative(dir,folder)).file,{recursive:true,force:true});}
}
