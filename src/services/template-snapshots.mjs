import {readTemplateReferences,referenceCatalog,writeTemplateReferences} from './template-references.mjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export function snapshotTemplate(templateRoot,id,destination){
 if(!id)return null;
 if(!/^[a-zA-Z0-9_-]{1,128}$/.test(id))throw new Error('Mã mẫu không hợp lệ.');
 const base=fs.realpathSync(templateRoot),folder=fs.realpathSync(path.join(base,id));
 if(!folder.startsWith(base+path.sep))throw new Error('Mẫu nằm ngoài thư viện.');
 const read=(name,max,optional=false)=>{
  const file=path.join(folder,name);if(optional&&!fs.existsSync(file))return null;
  const real=fs.realpathSync(file);if(!real.startsWith(folder+path.sep))throw new Error('File mẫu nằm ngoài thư mục mẫu.');
  if(fs.statSync(real).size>max)throw new Error('File mẫu quá lớn.');const bytes=fs.readFileSync(real);if(bytes.length>max)throw new Error('File mẫu quá lớn.');return bytes;
 };
 const json=read('template.json',2*1024*1024),skill=read('SKILL.md',256*1024,true),template=JSON.parse(json.toString('utf8'));
 if(!template||Array.isArray(template)||typeof template!=='object')throw new Error('Thông số mẫu không hợp lệ.');
 const references=readTemplateReferences(folder,template);
 const manifest={schema:1,id,name:template.name||id,createdAt:new Date().toISOString(),templateHash:digest(json),skillHash:skill?digest(skill):null};
 if(Object.keys(references).length)manifest.references=referenceCatalog(references);
 fs.mkdirSync(destination,{recursive:true});
 // The job-specific directory is new; never replace a previously selected version.
 for(const [name,bytes] of [['template.json',json],...(skill?[['SKILL.md',skill]]:[]),['manifest.json',JSON.stringify(manifest,null,2)+'\n']])fs.writeFileSync(path.join(destination,name),bytes,{flag:'wx'});
 writeTemplateReferences(destination,references);
 return manifest;
}
export function readTemplateSnapshot(destination,expected){
 const manifest=JSON.parse(fs.readFileSync(path.join(destination,'manifest.json'),'utf8'));
 if(manifest.schema!==1||manifest.id!==expected.id||manifest.templateHash!==expected.templateHash||manifest.skillHash!==expected.skillHash)throw new Error('Bản mẫu của việc đã thay đổi.');
 const bytes=fs.readFileSync(path.join(destination,'template.json')),skill=manifest.skillHash?fs.readFileSync(path.join(destination,'SKILL.md')):null;
 if(digest(bytes)!==manifest.templateHash||(skill&&digest(skill)!==manifest.skillHash))throw new Error('Nội dung bản mẫu của việc đã thay đổi.');
 const template=JSON.parse(bytes.toString('utf8')),references=readTemplateReferences(destination,template),catalog=referenceCatalog(references);
 if(JSON.stringify(catalog)!==JSON.stringify(expected.references||[])||JSON.stringify(catalog)!==JSON.stringify(manifest.references||[]))throw new Error('Tham chiếu bản mẫu của việc đã thay đổi.');
 return {manifest,template,skill:skill?.toString('utf8')||null,references:Object.fromEntries(Object.entries(references).map(([name,value])=>[name,value.toString('utf8')]))};
}
