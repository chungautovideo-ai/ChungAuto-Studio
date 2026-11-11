import fs from 'node:fs';import path from 'node:path';
import {zip,unzip} from '../../editor/lib/zip.mjs';
import {referencePaths,readTemplateReferences,referenceCatalog} from './template-references.mjs';
const FILES=['template.json','SKILL.md','poster.jpg','preview.mp4','vi-du.mjs'];
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,128}$/.test(id);
function readFile(folder,name,max){const base=fs.realpathSync(folder),real=fs.realpathSync(path.join(base,name));if(!real.startsWith(base+path.sep)||!fs.statSync(real).isFile())throw new Error('File mẫu nằm ngoài thư mục.');if(fs.statSync(real).size>max)throw new Error('File mẫu quá lớn.');return fs.readFileSync(real);}
export function packageTemplate(root,id){
 if(!validId(id))throw new Error('Mã mẫu không hợp lệ.');const base=fs.realpathSync(root),folder=fs.realpathSync(path.join(base,id));if(!folder.startsWith(base+path.sep))throw new Error('Mẫu nằm ngoài thư viện.');
 const templateBytes=readFile(folder,'template.json',2097152),template=JSON.parse(templateBytes.toString('utf8')),refs=readTemplateReferences(folder,template),files=[{name:id+'/template.json',data:templateBytes}];
 for(const name of FILES.slice(1))if(fs.existsSync(path.join(folder,name)))files.push({name:id+'/'+name,data:readFile(folder,name,name==='preview.mp4'?20971520:1048576)});
 for(const [name,data] of Object.entries(refs))files.push({name:id+'/'+name,data});
 return {buffer:zip(files),manifest:{id,references:referenceCatalog(refs),files:files.map(f=>({path:f.name,bytes:f.data.length})),externalPresetAssetsBundled:false}};
}
export function parseTemplatePackage(buffer){
 if(buffer.length>33554432)throw new Error('Gói mẫu vượt 32MB.');const entries=unzip(buffer,{maxOutputBytes:67108864,maxFileBytes:20971520}),map=new Map();let total=0;
 for(const entry of entries){const name=entry.name.replaceAll('\\','/');if(name.endsWith('/'))continue;if(name.startsWith('/')||name.split('/').some(p=>p==='..'||p==='.'||!p)||name.includes(':'))throw new Error('Đường dẫn trong gói mẫu không hợp lệ.');if(map.has(name))throw new Error('File trùng trong gói mẫu.');total+=entry.data.length;if(total>67108864)throw new Error('Gói mẫu giải nén quá lớn.');map.set(name,entry.data);}
 const groups=[];
 for(const [name,bytes] of map){if(!name.endsWith('/template.json'))continue;const prefix=name.slice(0,-'template.json'.length),id=prefix.split('/').filter(Boolean).at(-1);if(!validId(id)||groups.some(g=>g.id===id))throw new Error('Mã mẫu trùng hoặc không hợp lệ.');if(bytes.length>2097152)throw new Error('Thông số mẫu quá lớn.');const template=JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''));if(!template||Array.isArray(template)||typeof template!=='object'||typeof template.name!=='string'||!template.name.trim())throw new Error('Thông số mẫu thiếu tên.');const refs=referencePaths(template.skillReferences),files=new Map([['template.json',Buffer.from(JSON.stringify(template,null,2)+'\n')]]);let refBytes=0;
 for(const rel of [...FILES.slice(1),...refs]){const data=map.get(prefix+rel);if(!data){if(refs.includes(rel))throw new Error('Thiếu tham chiếu skill: '+rel);continue;}const max=refs.includes(rel)?65536:rel==='preview.mp4'?20971520:1048576;if(data.length>max)throw new Error('File mẫu quá lớn: '+rel);if(refs.includes(rel))refBytes+=data.length;files.set(rel,data);}if(refBytes>262144)throw new Error('Tham chiếu skill quá lớn.');groups.push({id,template,files});
 }
 if(!groups.length)throw new Error('Gói không chứa thư mục mẫu/template.json.');return groups;
}
export function installTemplatePackage(root,buffer,{check=()=>{}}={}){
 const groups=parseTemplatePackage(buffer);for(const group of groups)check(group.template);
 fs.mkdirSync(root,{recursive:true});const base=fs.realpathSync(root);
 // Validate every destination before writing any package file.
 for(const group of groups){const folder=path.join(base,group.id);if(fs.existsSync(folder)&&fs.realpathSync(folder)!==folder)throw new Error('Thư mục mẫu là liên kết không hợp lệ.');for(const name of group.files.keys()){const target=path.join(folder,name);for(let current=target;current!==base;current=path.dirname(current)){if(fs.existsSync(current)&&fs.realpathSync(current)!==current)throw new Error('Nơi ghi mẫu là liên kết không hợp lệ.');}}}
 for(const group of groups){const folder=path.join(base,group.id);fs.mkdirSync(folder,{recursive:true});for(const [name,data] of [...group.files].sort(([a],[b])=>(a==='template.json')-(b==='template.json'))){const target=path.join(folder,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data);}}
 return groups.map(({id,template,files})=>({id,template,referenceCount:referencePaths(template.skillReferences).length,hasSkill:files.has('SKILL.md')}));
}
