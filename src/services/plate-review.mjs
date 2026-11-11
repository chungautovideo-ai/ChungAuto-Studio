import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {resolveContained} from './storage.mjs';
import {assertProjectRevision} from './project-revisions.mjs';

export function plateReviewItems(project){
 const items=[];
 for(const group of ['segments','brolls'])for(const item of project[group]||[]){
  if(group==='segments'?item.keep===false:item.hidden)continue;
  if(!item.platePrivacy&&!/^inputs\/privacy\//.test(item.src||''))continue;
  items.push({group,id:item.id,src:item.src,sha256:item.platePrivacy?.sha256||null,from:item.mediaStart??0,duration:group==='segments'?item.out-item.in:item.dur*(Number(item.speed)||1)});
 }
 return items;
}
function mediaHashes(dir,items){return items.map(item=>{
 if(!/^inputs\/privacy\/[a-f0-9-]+\/masked\.mp4$/.test(item.src||'')||!item.sha256)throw new Error('Thiếu nguồn gốc bản che. Tạo lại bản che trước khi duyệt.');
 const file=resolveContained(dir,item.src).file,sha256=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 if(sha256!==item.sha256)throw new Error('Bản che đã đổi. Tạo lại và kiểm tra trước khi tự xuất.');
 return {group:item.group,id:item.id,src:item.src,sha256};
});}
export function plateReviewStatus(dir,project,revision){
 assertProjectRevision(path.join(dir,'project.json'),revision);
 const items=plateReviewItems(project);if(!items.length)return {required:false,approved:true,items:[]};
 let hashes;try{hashes=mediaHashes(dir,items);}catch(error){return {required:true,approved:false,items,reason:error.message};}
 let receipt;try{receipt=JSON.parse(fs.readFileSync(resolveContained(dir,'work/plate-review.json').file,'utf8'));}catch{}
 const approved=receipt?.version===1&&receipt.revision===revision&&JSON.stringify(receipt.media)===JSON.stringify(hashes);
 return {required:true,approved,items,...(approved?{reviewedAt:receipt.at}:{reason:'Bản che biển số cần người dựng kiểm tra toàn đoạn trước khi tự xuất.'})};
}
export function approvePlateReview(dir,project,revision,{confirmed=false,validate=()=>{}}={}){
 if(confirmed!==true)throw new Error('Xác nhận đã xem toàn bộ các đoạn che trước khi lưu.');
 validate();assertProjectRevision(path.join(dir,'project.json'),revision);
 const items=plateReviewItems(project);if(!items.length)throw new Error('Bản dựng chưa có đoạn che để duyệt.');
 const media=mediaHashes(dir,items),receipt={version:1,revision,media,at:new Date().toISOString(),method:'user-declared-visual-review'};
 const work=path.join(dir,'work');if(fs.existsSync(work))resolveContained(dir,'work');fs.mkdirSync(work,{recursive:true});
 const file=path.join(work,'plate-review.json');if(fs.existsSync(file))resolveContained(dir,'work/plate-review.json');
 const temp=path.join(work,'.plate-review-'+crypto.randomUUID()+'.tmp');
 try{fs.writeFileSync(temp,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});validate();assertProjectRevision(path.join(dir,'project.json'),revision);mediaHashes(dir,items);fs.renameSync(temp,file);}finally{fs.rmSync(temp,{force:true});}
 return plateReviewStatus(dir,project,revision);
}
export function assertReviewedSnapshot(dir,project,revision,manifest){
 const status=plateReviewStatus(dir,project,revision);if(!status.approved)throw new Error(status.reason);
 for(const item of status.items){const asset=manifest.assets.find(a=>a.path===item.src);if(asset&&asset.sha256!==item.sha256)throw new Error('Bản che trong snapshot khác bản đã kiểm; chưa tự xuất.');}
}
