import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {validateCube,importColorLut} from './color-normalization.mjs';import {resolveContained} from './storage.mjs';
export function classifyLut(relative,header){
 const s=(relative+'\n'+header).toLowerCase();
 if(/applelogtorec709/.test(s))return {kind:'technical',inputProfile:'applelog',classification:'filename-and-header'};
 if(/sgamut3cine|sgamut3\.cine/.test(s)&&/to[_ -]?lc[_ .-]?709/.test(s))return {kind:'technical',inputProfile:'slog3-sgamut3cine',classification:'filename-and-header'};
 if(/from_slog2sgumut_to_lc.?709/.test(s))return {kind:'technical',inputProfile:'slog2-sgamut',classification:'filename-and-header'};
 if(/d-log m to rec\.?709/.test(s))return {kind:'technical',inputProfile:'dlog-m',classification:'filename-and-header'};
 if(/d-log to rec\.?709/.test(s))return {kind:'technical',inputProfile:'dlog-dgamut',classification:'filename-and-header'};
 return {kind:'unclassified',inputProfile:null,classification:'needs-user-profile'};
}
export function readLutLibrary(root){
 const folder=path.join(root,'workspace/contentos/lut-library');if(!fs.existsSync(path.join(folder,'catalog.json')))return {schema:1,items:[],rejected:[]};
 const catalog=JSON.parse(fs.readFileSync(path.join(folder,'catalog.json'),'utf8'));
 for(const item of catalog.items){
  mergeClassification(item,classifyLut(item.relative||item.name||'',item.header||''));
  for(const source of item.sources||[])mergeClassification(item,classifyLut(path.posix.basename(path.win32.basename(source)),item.header||''));
 }
 return catalog;
}
// Duplicate bytes may carry several filenames. Never let traversal order choose
// an input color space, or an unclassified alias erase a known declaration.
function mergeClassification(item,next){
 const candidates=[...(item.classificationCandidates||[]),...(!item.classificationCandidates&&item.kind==='technical'?[{kind:item.kind,inputProfile:item.inputProfile}]:[]),...(next.kind==='technical'?[{kind:next.kind,inputProfile:next.inputProfile}]:[])];
 const unique=[...new Map(candidates.map(c=>[c.kind+':'+c.inputProfile,{kind:c.kind,inputProfile:c.inputProfile}])).values()].sort((a,b)=>a.inputProfile.localeCompare(b.inputProfile));
 item.classificationCandidates=unique;
 if(unique.length===1)Object.assign(item,unique[0],{classification:'filename-and-header'});
 else Object.assign(item,{kind:'unclassified',inputProfile:null,classification:unique.length?'conflicting-input-profiles':'needs-user-profile'});
}
export function importLutDirectory(root,source){
 const base=fs.realpathSync(source),folder=path.join(root,'workspace/contentos/lut-library');fs.mkdirSync(folder,{recursive:true});const existing=readLutLibrary(root),byHash=new Map(existing.items.map(x=>[x.id,x])),rejected=[];let examined=0;
 const walk=(dir,depth=0)=>{if(depth>12)throw new Error('Kho LUT lồng quá sâu.');for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(entry.isSymbolicLink())continue;const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file,depth+1);else if(entry.isFile()&&/\.cube$/i.test(entry.name)){
  examined++;const relative=path.relative(base,file).replaceAll('\\','/');try{if(fs.statSync(file).size>16*1024*1024)throw new Error('Quá16MB.');const bytes=fs.readFileSync(file),text=bytes.toString('utf8').replace(/^\uFEFF/,''),info=validateCube(text),id=crypto.createHash('sha256').update(text).digest('hex'),prior=byHash.get(id);
   if(prior){const header=text.split(/\r?\n/).slice(0,12).join('\n');prior.header=header;mergeClassification(prior,classifyLut(relative,header));if(!prior.sources.includes(file))prior.sources.push(file);continue;}
   fs.writeFileSync(path.join(folder,id+'.cube'),text,{flag:'wx'});const header=text.split(/\r?\n/).slice(0,12).join('\n'),item={id,name:entry.name,relative,sources:[file],size:info.size,bytes:Buffer.byteLength(text),header};mergeClassification(item,classifyLut(relative,header));byHash.set(id,item);
  }catch(error){rejected.push({relative,error:error.message});}
 }}};walk(base);const catalog={schema:1,updatedAt:new Date().toISOString(),source:base,examined,items:[...byHash.values()],rejected};const temp=path.join(folder,crypto.randomUUID()+'.json');fs.writeFileSync(temp,JSON.stringify(catalog,null,2));fs.renameSync(temp,path.join(folder,'catalog.json'));return catalog;
}
export async function attachLibraryLut(root,dir,id,selection={}){
 if(!/^[a-f0-9]{64}$/.test(id||''))throw new Error('Mã LUT không hợp lệ.');const item=readLutLibrary(root).items.find(x=>x.id===id);if(!item)throw new Error('Không có LUT trong thư viện.');
 const file=resolveContained(path.join(root,'workspace/contentos/lut-library'),id+'.cube').file,text=fs.readFileSync(file,'utf8');if(crypto.createHash('sha256').update(text).digest('hex')!==id)throw new Error('LUT thư viện đã đổi.');
 if(/Display:\s*DCI-P3|Input:\s*Cineon/i.test(item.header||''))throw new Error('LUT Cineon/DCI-P3 chưa dùng trong pipeline Rec.709; cần chuyển input/output đúng trước.');
 const kind=selection.kind||item.kind,inputProfile=selection.inputProfile||item.inputProfile;return importColorLut(dir,text,{kind,inputProfile,name:item.name});
}
