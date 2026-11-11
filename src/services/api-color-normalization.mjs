import {normalizeColor,listColorLuts} from './color-normalization.mjs';import {applyColorNormalization} from '../../editor/lib/color-management.js';
export function createApiColorNormalization(dir,options={}){
 return {list:()=>listColorLuts(dir),apply:async(project,request)=>{const result=await normalizeColor(dir,project,request,options);return {project:applyColorNormalization(project,request.kind,request.id,result),result};}};
}
