#!/usr/bin/env node
// Staged first-build only. Never writes live project.json or exports a video.
import {applyPrimaryPrivacy,applyBrollPrivacy} from '../lib/primary-privacy.js';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
import {createPlatePrivacy} from '../../src/services/plate-privacy.mjs';import {resolveContained} from '../../src/services/storage.mjs';
import {suggestPlateRegions} from '../../src/services/plate-suggestions.mjs';
import {assertClaimOwner} from '../../src/services/session-job-claims.mjs';import {assertProjectRevision} from '../../src/services/project-revisions.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),args=process.argv.slice(2),arg=key=>args[args.indexOf(key)+1];
const suggestionOnly=args.includes('--suggest'),regionCount=['--roi','--rois-json','--quads-json'].filter(key=>args.includes(key)).length;
if(!args[0]||args.includes('--broll')===args.includes('--segment')||(suggestionOnly?(regionCount!==0||args.includes('--apply')):regionCount!==1)||!args.includes('--claim'))throw new Error('Dùng: node editor/tools/che-bien-so.mjs <dự án> --claim <ID> (--broll <ID> hoặc --segment <ID>) (--suggest để chỉ đọc gợi ý; hoặc --roi x,y,w,h / --rois-json JSON / --quads-json JSON [--apply]). Không kết hợp --suggest với --apply/vùng che.');
const regions=suggestionOnly?{}:args.includes('--quads-json')?{quads:JSON.parse(arg('--quads-json'))}:args.includes('--rois-json')?{rois:JSON.parse(arg('--rois-json'))}:{roi:arg('--roi').split(',').map(Number)};
const dir=resolveContained(root,args[0]).file,jobFile=resolveContained(dir,'work/ai-job.json').file,read=file=>JSON.parse(fs.readFileSync(file,'utf8')),job=read(jobFile);
if(job.kind||!job.candidate||!job.completionToken||!job.baseRevision)throw new Error('Cần việc dựng mới có candidate; không sửa project trực tiếp.');
const file=resolveContained(root,job.candidate).file,expected=path.join(dir,'work/build-candidates',job.completionToken,'work/candidate-project.json');if(file!==expected)throw new Error('Sai candidate.');
const original=fs.readFileSync(file);let project=JSON.parse(original);const signature=JSON.stringify(job),controller=new AbortController();
process.once('SIGINT',()=>controller.abort());process.once('SIGTERM',()=>controller.abort());
const validate=()=>{const current=read(jobFile);assertClaimOwner(current,arg('--claim'));if(current.status!=='working'||JSON.stringify(current)!==signature)throw new Error('Việc dựng đã đổi; chưa áp bản che.');assertProjectRevision(path.join(dir,'project.json'),job.baseRevision);if(!fs.readFileSync(file).equals(original))throw new Error('Candidate đã đổi; chạy lại trên bản mới.');};
validate();const request={...(args.includes('--segment')?{segmentId:arg('--segment')}:{brollId:arg('--broll')}),...regions};
if(suggestionOnly){const result=await suggestPlateRegions(root,dir,project,request,{validate,signal:controller.signal});validate();console.log(JSON.stringify({ok:true,readOnly:true,appliedToCandidate:false,result,review:'Gợi ý chỉ một khung đầu; xem ảnh và chỉnh vùng trước khi che, không xác nhận đã hết biển.'},null,2));process.exit(0);}
const result=await createPlatePrivacy(root,dir,project,request,{validate,signal:controller.signal});
if(args.includes('--apply')){
 validate();if(args.includes('--segment'))project=applyPrimaryPrivacy(project,arg('--segment'),result);else project=applyBrollPrivacy(project,arg('--broll'),result);
 const temp=file+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(temp,JSON.stringify(project,null,2)+'\n',{flag:'wx'});validate();fs.renameSync(temp,file);}finally{fs.rmSync(temp,{force:true});}
}
console.log(JSON.stringify({ok:true,appliedToCandidate:args.includes('--apply'),result,review:'Kiểm toàn bộ đoạn che trước khi nhận final; chưa kiểm các cảnh/biển khác.'},null,2));
