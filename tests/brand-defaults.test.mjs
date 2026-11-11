import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createBrandDefaults,pinJobBrand,applyJobBrand} from '../src/services/brand-defaults.mjs';import {BRAND_DEFAULT} from '../editor/lib/brand.js';
test('workspace brand defaults isolate clients, reject stale writes and strip executable/template fields',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-brand-'));try{const store=createBrandDefaults(root);assert.equal(store.get('one').brand,null);const saved=store.save('one',{version:0,brand:{...BRAND_DEFAULT,name:'Khách hàng A',css:'unsafe',id:'external'}});assert.equal(saved.version,1);assert.equal(saved.brand.css,undefined);assert.equal(saved.brand.id,undefined);assert.equal(store.get('two').brand,null);assert.deepEqual(createBrandDefaults(root).get('one'),saved);assert.throws(()=>store.save('one',{version:0,brand:BRAND_DEFAULT}),/vừa đổi/);assert.throws(()=>store.save('two',{version:0,brand:{...BRAND_DEFAULT,c1:'url(x)'}}),/Màu/);assert.throws(()=>store.get('../outside'));assert.equal(store.get('one').brand.name,'Khách hàng A');}finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('AI brand opt-in pins version and preserves template CSS without modifying base',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-brand-job-'));try{
 const store=createBrandDefaults(root);
 assert.equal(pinJobBrand(store,'one',false),null);
 assert.equal(pinJobBrand(store,'one',undefined),null);
 assert.throws(()=>pinJobBrand(store,'one',true),/Chưa có/);
 assert.throws(()=>pinJobBrand(store,'one','true'),/không hợp lệ/);
 store.save('one',{version:0,brand:{...BRAND_DEFAULT,c1:'#123456'}});
 const pinned=pinJobBrand(store,'one',true);
 store.save('one',{version:1,brand:{...BRAND_DEFAULT,c1:'#654321'}});
 assert.equal(pinned.version,1);assert.equal(pinned.brand.c1,'#123456');
 const base={brand:{...BRAND_DEFAULT,c1:'#abcdef',css:'.template{}'},texts:[{title:'hello'}]};
 const candidate=applyJobBrand(base,pinned);
 assert.equal(candidate.brand.c1,'#123456');assert.equal(candidate.brand.css,'.template{}');assert.equal(base.brand.c1,'#abcdef');
 candidate.brand.caption.size=100;assert.notEqual(pinned.brand.caption.size,100);
 assert.equal(applyJobBrand(base,null),base);
 assert.equal(store.get('two').brand,null);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
