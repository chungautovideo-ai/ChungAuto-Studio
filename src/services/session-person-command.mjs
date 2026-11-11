import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {resolveContained} from './storage.mjs';
import {assertClaimOwner} from './session-job-claims.mjs';
import {assertProjectRevision} from './project-revisions.mjs';
import {personExposureReport} from './person-exposure-report.mjs';
import {applyPersonAdjustment} from './person-adjustments.mjs';
import {measureSelectedPersonExposure} from './selected-person-exposure.mjs';

// Takes the revise job directory, not the original project. Never writes live JSON.
function sessionPersonContext(root,jobPath,claimId){
 const dir=resolveContained(root,jobPath).file;
 const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
 const jobFile=resolveContained(dir,'work/ai-job.json').file,job=read(jobFile);
 if(job.kind!=='revise'||!job.project||!job.candidate||!job.baseRevision||!job.claimedBy?.id||!claimId)throw Error('Cần việc sửa video đã nhận bằng claim và có candidate.');
 const target=resolveContained(root,job.project).file,file=resolveContained(root,job.candidate).file;
 if(file!==path.join(dir,'work/candidate-project.json')||target===dir)throw Error('Sai candidate sửa người/da.');
 const original=fs.readFileSync(file),signature=JSON.stringify(job),project=JSON.parse(original);
 const validate=()=>{
  const current=read(jobFile);assertClaimOwner(current,claimId);
  if(current.status!=='working'||JSON.stringify(current)!==signature)throw Error('Việc sửa đã đổi; chưa áp chỉnh người/da.');
  assertProjectRevision(path.join(target,'project.json'),job.baseRevision);
  if(!fs.readFileSync(file).equals(original))throw Error('Candidate đã đổi; đọc lại trước khi chỉnh.');
 };
 validate();return {target,file,original,project,validate};
}

export function sessionPersonCommand(root,jobPath,{claimId,request,apply=false}={}){
 const {target,file,project,validate}=sessionPersonContext(root,jobPath,claimId);
 if(!request){if(apply)throw Error('Thiếu mức chỉnh người/da.');return {ok:true,report:personExposureReport(target,project),appliedToCandidate:false};}
 const adjusted=applyPersonAdjustment(target,project,request);validate();
 if(apply){
  const temp=file+'.'+crypto.randomUUID()+'.tmp';
  try{fs.writeFileSync(temp,JSON.stringify(adjusted.project,null,2)+'\n',{flag:'wx'});validate();fs.renameSync(temp,file);}finally{fs.rmSync(temp,{force:true});}
 }
 return {...adjusted.result,appliedToCandidateOnly:apply,appliedToCandidate:apply};
}

export async function sessionSelectedPersonMeasurement(root,jobPath,{claimId,request,signal,decode}={}){
 const {target,project,validate}=sessionPersonContext(root,jobPath,claimId);
 if(!request||Object.keys(request).some(key=>!['src','sha256'].includes(key)))throw Error('Đo riêng cần src và SHA256, không nhận mức chỉnh hoặc apply.');
 const measurement=await measureSelectedPersonExposure(target,project,request,{validate,signal,decode});
 validate();return {ok:true,measurement,appliedToCandidate:false,readOnly:true};
}
