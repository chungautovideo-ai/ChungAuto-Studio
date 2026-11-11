import {readTemplateReferences,referenceCatalog} from './template-references.mjs';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {createApiPresets} from './api-presets.mjs';
export function templateDetails(root,id){
 if(!/^[a-zA-Z0-9_-]{1,128}$/.test(id||''))throw new Error('Mã mẫu không hợp lệ.');
 const base=fs.realpathSync(root),folder=fs.realpathSync(path.join(base,id));if(!folder.startsWith(base+path.sep))throw new Error('Mẫu nằm ngoài thư viện.');
 const read=(name,max,optional=false)=>{const file=path.join(folder,name);if(optional&&!fs.existsSync(file))return null;const real=fs.realpathSync(file);if(!real.startsWith(folder+path.sep)||!fs.statSync(real).isFile())throw new Error('File mẫu nằm ngoài thư viện.');if(fs.statSync(real).size>max)throw new Error('File mẫu quá lớn.');const bytes=fs.readFileSync(real);if(bytes.length>max)throw new Error('File mẫu quá lớn.');return bytes;};
 const bytes=read('template.json',2*1024**2),rules=read('SKILL.md',256*1024,true),template=JSON.parse(bytes.toString('utf8'));if(!template||Array.isArray(template)||typeof template!=='object')throw new Error('Thông số mẫu không hợp lệ.');
 const presets=createApiPresets(template)?.list().presets||[];
 const hash=value=>value?crypto.createHash('sha256').update(value).digest('hex'):null;
 return {references:referenceCatalog(readTemplateReferences(folder,template)),id,name:String(template.name||id),templateHash:hash(bytes),skillHash:hash(rules),rules:rules?.toString('utf8')||null,presets:presets.map(p=>({id:p.id,name:p.name,kind:p.kind,supported:p.supported===true,requiresMatte:p.requiresMatte===true,fields:p.fields})),apiSupported:presets.filter(p=>p.supported).length,presetCount:presets.length,limitations:'Đây là bản thư viện hiện tại; phiên bản được chốt lại khi giao việc. API hỗ trợ một phần preset, chưa thực thi mọi quy tắc/skill. Phiên hoặc CLI cần agent đọc và kiểm preview; chưa bảo đảm chất lượng dựng.'};
}

export function templateReference(root,id,name){
 if(!/^[a-zA-Z0-9_-]{1,128}$/.test(id||''))throw new Error('Mã mẫu không hợp lệ.');const base=fs.realpathSync(root),folder=fs.realpathSync(path.join(base,id));if(!folder.startsWith(base+path.sep))throw new Error('Mẫu nằm ngoài thư viện.');
 const file=fs.realpathSync(path.join(folder,'template.json'));if(!file.startsWith(folder+path.sep)||fs.statSync(file).size>2097152)throw new Error('Thông số mẫu không hợp lệ.');const template=JSON.parse(fs.readFileSync(file,'utf8')),refs=readTemplateReferences(folder,template);
 if(!Object.hasOwn(refs,name))throw new Error('Chuyên đề không có trong mẫu đã cài.');return {path:name,content:refs[name].toString('utf8'),sha256:referenceCatalog(refs).find(r=>r.path===name).sha256};
}
