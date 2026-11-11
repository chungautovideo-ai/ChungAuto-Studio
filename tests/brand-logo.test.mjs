import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {createBrandDefaults,pinJobBrand,applyJobBrand} from '../src/services/brand-defaults.mjs';import {BRAND_DEFAULT} from '../editor/lib/brand.js';
test('workspace logo travels independently between projects and pinned jobs preserve version and bytes',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-brand-logo-'));try{
 const one=path.join(root,'one'),two=path.join(root,'two');fs.mkdirSync(one);fs.mkdirSync(two);
 const image=path.join(one,'logo.png');execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=red:s=160x80','-frames:v','1',image],{windowsHide:true});const original=fs.readFileSync(image),store=createBrandDefaults(root);
 const watermark={file:'logo.png',position:'bottom-right',opacity:.6,heightPercent:5};store.save('one',{brand:BRAND_DEFAULT,version:0,watermark},{projectDir:one});const snapshot=pinJobBrand(store,'one',true);assert.equal(snapshot.logo.watermark.position,'bottom-right');assert.equal(store.get('two').brand,null);
 fs.unlinkSync(image);store.save('one',{brand:BRAND_DEFAULT,version:1});assert.equal(store.get('one').logo,null);
 const base={brand:{css:'.keep{}'},watermark:{file:'old.png'},texts:[{title:'keep'}]},applied=applyJobBrand(base,snapshot,{root,projectDir:two});assert.equal(applied.watermark.position,'bottom-right');assert.equal(applied.watermark.opacity,.6);assert.deepEqual(fs.readFileSync(path.join(two,applied.watermark.file)),original);assert.equal(applied.brand.css,'.keep{}');assert.equal(base.watermark.file,'old.png');assert.deepEqual(applied.texts,base.texts);
 assert.deepEqual(applyJobBrand(base,snapshot,{root,projectDir:two}),applied);assert.throws(()=>applyJobBrand(base,snapshot),/dự án đích/);
 fs.writeFileSync(path.join(two,applied.watermark.file),'tampered');assert.throws(()=>applyJobBrand(base,snapshot,{root,projectDir:two}),/đổi nội dung/);
 const blob=path.join(root,'workspace/contentos/brand-assets',snapshot.logo.sha256+snapshot.logo.extension);fs.writeFileSync(blob,'tampered');assert.throws(()=>applyJobBrand(base,snapshot,{root,projectDir:two}),/đổi nội dung/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('workspace logo refuses escape and oversized/invalid image without updating saved default',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-brand-reject-'));try{
 const store=createBrandDefaults(root),one=path.join(root,'one');fs.mkdirSync(one);fs.writeFileSync(path.join(one,'bad.png'),'bad');fs.writeFileSync(path.join(one,'large.png'),Buffer.alloc(2*1024*1024+1));
 for(const file of ['../bad.png','bad.png','large.png'])assert.throws(()=>store.save('one',{brand:BRAND_DEFAULT,version:0,watermark:{file}},{projectDir:one}));assert.equal(store.get('one').version,0);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
