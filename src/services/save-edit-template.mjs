import {readTemplateReferences,writeTemplateReferences} from './template-references.mjs';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {extractTemplate} from '../../editor/lib/template.js';
// Every save is a new immutable catalog entry; active jobs retain their snapshots.
export function saveEditTemplate(root,input){
 const text=(value,max)=>{if(typeof value!=='string'||value.length>max)throw new Error('Thông tin mẫu không hợp lệ.');return value.trim();};
 const name=text(input.name,160);if(!name)throw new Error('Đặt tên cho mẫu.');
 const description=text(input.description??'',3000),skill=text(input.skill??'',64000),note=text(input.changeNote??'',3000);
 if(!input.project||typeof input.project!=='object'||Array.isArray(input.project))throw new Error('Thiếu bản dựng để lưu phong cách.');
 const industries=input.industries??[];if(!Array.isArray(industries)||industries.length>40||industries.some(s=>typeof s!=='string'||s.length>100))throw new Error('Danh mục ngành không hợp lệ.');
 fs.mkdirSync(root,{recursive:true});const base=fs.realpathSync(root);let parent=null,parentRules='',parentReferences={};
 if(input.parentId){
  if(!/^[a-zA-Z0-9_-]{1,128}$/.test(input.parentId))throw new Error('Mã mẫu gốc không hợp lệ.');
  const folder=fs.realpathSync(path.join(base,input.parentId));if(!folder.startsWith(base+path.sep))throw new Error('Mẫu gốc nằm ngoài thư viện.');
  const file=fs.realpathSync(path.join(folder,'template.json'));if(!file.startsWith(folder+path.sep)||fs.statSync(file).size>2*1024*1024)throw new Error('Mẫu gốc không hợp lệ.');
  parent=JSON.parse(fs.readFileSync(file,'utf8'));
  if(!parent||typeof parent!=='object'||Array.isArray(parent))throw new Error('Mẫu gốc không hợp lệ.');
  const skillPath=path.join(folder,'SKILL.md');if(fs.existsSync(skillPath)){const real=fs.realpathSync(skillPath);if(!real.startsWith(folder+path.sep)||fs.statSync(real).size>256*1024)throw new Error('Skill gốc không hợp lệ.');parentRules=fs.readFileSync(real,'utf8');}parentReferences=readTemplateReferences(folder,parent);
 }
 const id='custom-'+crypto.randomUUID(),folder=path.join(base,id),temp=path.join(base,'.saving-'+crypto.randomUUID());
 const template=extractTemplate(input.project,{id,name,description,industries});
 if(parent){
  if(parent.skillReferences)template.skillReferences=structuredClone(parent.skillReferences);
  // An improvement keeps the installed building blocks, not the project's
  // private blocks/timing/media. Extracted style wins over parent defaults.
  if(Array.isArray(parent.presets))template.presets=structuredClone(parent.presets);
  for(const key of ['texts','scenes','brolls']){
   if(parent[key]&&typeof parent[key]==='object'&&!Array.isArray(parent[key]))template[key]={...structuredClone(parent[key]),...(template[key]||{})};
  }
  if(typeof parent.engine==='string')template.engine=parent.engine;
 }
 template.source='custom';template.version=parent?Math.max(1,Number.isSafeInteger(parent.version)?parent.version:1)+1:1;
 template.createdAt=new Date().toISOString();template.changeNote=note;if(parent)template.parentId=input.parentId;
 const rules=skill||parentRules||`# ${name}\n\n${description||'Phong cách từ bản dựng đã chỉnh.'}\n\n- Giữ font, màu và kiểu phụ đề của mẫu.\n- Áp dụng cấu hình nhạc/SFX đã lưu; chỉ dùng tư liệu đã được cung cấp.\n`;
 try{fs.mkdirSync(temp);fs.writeFileSync(path.join(temp,'template.json'),JSON.stringify(template,null,2)+'\n',{flag:'wx'});fs.writeFileSync(path.join(temp,'SKILL.md'),rules+'\n',{flag:'wx'});writeTemplateReferences(temp,parentReferences);fs.renameSync(temp,folder);}catch(error){for(const name of Object.keys(parentReferences))try{fs.unlinkSync(path.join(temp,name));}catch{}try{fs.rmdirSync(path.join(temp,'references'));}catch{}for(const name of ['template.json','SKILL.md'])try{fs.unlinkSync(path.join(temp,name));}catch{}try{fs.rmdirSync(temp);}catch{}throw error;}
 return {id,template,folder};
}
