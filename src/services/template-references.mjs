import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const referenceDigest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export function referencePaths(value){
 if(value==null)return [];
 if(!Array.isArray(value)||value.length>16||new Set(value).size!==value.length||value.some(p=>typeof p!=='string'||!/^references\/[a-zA-Z0-9_-]{1,80}\.md$/.test(p)))throw new Error('Danh sách tham chiếu skill không hợp lệ.');
 return value;
}
export function readTemplateReferences(folder,template){
 const base=fs.realpathSync(folder),refs={};let total=0;
 for(const name of referencePaths(template.skillReferences)){
  const real=fs.realpathSync(path.join(base,name));if(!real.startsWith(base+path.sep)||!fs.statSync(real).isFile())throw new Error('Tham chiếu nằm ngoài mẫu.');
  if(fs.statSync(real).size>65536)throw new Error('Tham chiếu skill quá lớn.');
  const bytes=fs.readFileSync(real);total+=bytes.length;if(bytes.length>65536||total>262144)throw new Error('Tham chiếu skill quá lớn.');refs[name]=bytes;
 }
 return refs;
}
export function referenceCatalog(refs){return Object.entries(refs).map(([name,bytes])=>({path:name,sha256:referenceDigest(bytes),bytes:bytes.length}));}
export function writeTemplateReferences(folder,refs){
 for(const [name,bytes] of Object.entries(refs)){referencePaths([name]);fs.mkdirSync(path.dirname(path.join(folder,name)),{recursive:true});fs.writeFileSync(path.join(folder,name),bytes,{flag:'wx'});}
}
