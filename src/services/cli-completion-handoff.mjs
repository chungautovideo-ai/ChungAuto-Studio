import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export function writeCompletionHandoff(dir,body,{env=process.env}={}){
 const job=JSON.parse(fs.readFileSync(path.join(dir,'work/ai-job.json'),'utf8'));
 if(env.CONTENTOS_COMPLETION_JOB!==path.resolve(dir)||!env.CONTENTOS_COMPLETION_NONCE)throw Error('Không có kênh bàn giao worker cho việc này.');
 if(job.execution?.mode!=='cli'||job.status!=='working'||!body.claimId||job.claimedBy?.id!==body.claimId)throw Error('Phiên worker không còn sở hữu việc.');
 if(!job.candidate)throw Error('Việc không có candidate để bàn giao.');
 const candidate=path.resolve(dir,job.kind==='revise'?'work/candidate-project.json':`work/build-candidates/${job.completionToken}/work/candidate-project.json`);
 const file=path.join(dir,'work/cli-completion-request.json'),temp=file+'.'+crypto.randomUUID()+'.tmp';
 const request={nonce:env.CONTENTOS_COMPLETION_NONCE,kind:job.kind==='revise'?'revise':'build',body,candidateSha256:digest(candidate)};
 try{fs.writeFileSync(temp,JSON.stringify(request)+'\n',{flag:'wx'});fs.renameSync(temp,file);}finally{fs.rmSync(temp,{force:true});}
 return request;
}

export async function consumeCompletionHandoff(dir,{nonce,complete}={}){
 const file=path.join(dir,'work/cli-completion-request.json');
 if(!fs.existsSync(file))return false;
 if(fs.lstatSync(file).isSymbolicLink()||fs.statSync(file).size>16384)throw Error('Tệp bàn giao worker không hợp lệ.');
 const request=JSON.parse(fs.readFileSync(file,'utf8')),job=JSON.parse(fs.readFileSync(path.join(dir,'work/ai-job.json'),'utf8'));
 if(request.nonce!==nonce||!nonce||job.execution?.mode!=='cli'||job.status!=='working'||!request.body?.claimId||request.body.claimId!==job.claimedBy?.id)throw Error('Bàn giao worker sai phiên hoặc việc đã kết thúc.');
 const kind=job.kind==='revise'?'revise':!job.kind?'build':null;
 if(!kind||request.kind!==kind)throw Error('Sai loại bàn giao worker.');
 const candidate=path.join(dir,kind==='revise'?'work/candidate-project.json':`work/build-candidates/${job.completionToken}/work/candidate-project.json`);
 if(request.candidateSha256!==digest(candidate))throw Error('Candidate đã đổi sau khi bàn giao.');
 // Caller supplies the job directory and route; never forward arbitrary URLs,
 // paths, methods or commands from the worker-written request.
 await complete(kind,request.body);
 fs.renameSync(file,path.join(dir,'work/cli-completion-applied.json'));
 return true;
}
