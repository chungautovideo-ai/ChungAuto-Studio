import {applyPrimaryPrivacy,applyBrollPrivacy} from '../../editor/lib/primary-privacy.js';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createPlatePrivacy,plateRequest} from './plate-privacy.mjs';
import {suggestPlateRegions} from './plate-suggestions.mjs';
import {resolveContained} from './storage.mjs';

// Per API run: trusted local processing, never model-supplied paths or code.
export function createApiPlatePrivacy(root,dir,{validate=()=>{},signal}={}){
 const outputs=[];
 const guard=()=>{validate();signal?.throwIfAborted();for(const result of outputs){const file=resolveContained(dir,result.path).file;const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');if(hash!==result.provenance.sha256)throw new Error('Bản che biển đã đổi trong lượt dựng API.');}};
 return {validate:guard,async suggest(project,request){guard();const result=await suggestPlateRegions(root,dir,project,request,{validate:guard,signal});guard();return {...result,readOnly:true,note:'Vùng gợi ý trên một khung nguồn; cần xem ảnh trước khi dùng, không xác nhận hết biển hoặc tự che.'};},async apply(project,request){
  guard();const selected=plateRequest(project,request);
  if(selected.item.platePrivacy)throw new Error('Cảnh đã có bản che; khôi phục nguồn hoặc chọn cảnh khác trước.');
  const result=await createPlatePrivacy(root,dir,project,request,{validate:guard,signal});
  outputs.push(result);guard();
  if(request.segmentId!==undefined)return {project:applyPrimaryPrivacy(project,request.segmentId,result),result};
  return {project:applyBrollPrivacy(project,request.brollId,result),result};
 }};
}
