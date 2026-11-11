import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {FONTS,CAPTION_STYLES} from '../../editor/lib/brand.js';
import {saveBrandLogo,applyBrandLogo} from './brand-logo.mjs';
export function normalizeBrandDefault(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Bộ nhận diện không hợp lệ.');
 const brand={name:String(input.name||'Nhận diện workspace').trim().slice(0,100)};
 for(const key of ['fontTitle','fontSub','fontLabel']){if(!Object.hasOwn(FONTS,input[key]))throw new Error('Font nhận diện chưa được hỗ trợ.');brand[key]=input[key];}
 for(const key of ['c1','c2','c3','sub']){if(!/^#[a-fA-F0-9]{6}$/.test(input[key]||''))throw new Error('Màu nhận diện cần dạng #RRGGBB.');brand[key]=input[key];}
 if(input.caption){const c=input.caption;if(!CAPTION_STYLES.some(([id])=>id===c.style)||!Number.isFinite(c.size)||c.size<10||c.size>200||!/^#[a-fA-F0-9]{6}$/.test(c.color||'')||!/^#[a-fA-F0-9]{6}$/.test(c.active||''))throw new Error('Kiểu phụ đề nhận diện không hợp lệ.');brand.caption={style:c.style,size:c.size,color:c.color,active:c.active,uppercase:c.uppercase===true};}
 return brand;
}
export function createBrandDefaults(root){
 const file=id=>{if(!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw new Error('Workspace không hợp lệ.');return path.join(root,'workspace/contentos/brand-defaults',id+'.json');};
 const read=id=>{const f=file(id);return fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):{workspaceId:id,version:0,brand:null};};
 return {get:read,save(id,{brand,version,watermark},options){const current=read(id);if(version!==current.version)throw Object.assign(new Error('Mặc định thương hiệu vừa đổi. Tải lại trước khi lưu.'),{status:409});const result={workspaceId:id,version:current.version+1,brand:normalizeBrandDefault(brand),logo:watermark?saveBrandLogo(root,options?.projectDir,watermark):null,updatedAt:new Date().toISOString()};const f=file(id);fs.mkdirSync(path.dirname(f),{recursive:true});const temp=f+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(temp,JSON.stringify(result,null,2)+'\n',{flag:'wx'});fs.renameSync(temp,f);}finally{fs.rmSync(temp,{force:true});}return result;}};
}

// Pin only an explicitly requested default; never inherit implicitly.
export function pinJobBrand(store,workspaceId,requested){
 if(requested===undefined||requested===false)return null;
 if(requested!==true)throw new Error('Lựa chọn nhận diện không hợp lệ.');
 const saved=store.get(workspaceId);
 if(!saved.brand)throw new Error('Chưa có nhận diện mặc định. Lưu tại Studio → Thương hiệu trước khi chọn.');
 return {...saved,brand:normalizeBrandDefault(saved.brand)};
}
export function applyJobBrand(project,snapshot,options){
 if(!snapshot)return project;
 if(snapshot.logo&&!options?.projectDir)throw new Error('Cần dự án đích để áp logo nhận diện.');
 return {...project,brand:{...(project.brand||{}),...structuredClone(snapshot.brand)},...(snapshot.logo?{watermark:applyBrandLogo(options.root,options.projectDir,snapshot.logo)}:{})};
}
