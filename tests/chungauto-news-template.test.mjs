import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {applyTemplate} from '../editor/lib/template.js';
import {createApiPresets} from '../src/services/api-presets.mjs';
import {snapshotTemplate,readTemplateSnapshot} from '../src/services/template-snapshots.mjs';
import {packageTemplate,parseTemplatePackage} from '../src/services/template-package.mjs';
import {kiemDoHoa} from '../editor/tools/kiem-do-hoa.mjs';
import {buildHtml} from '../editor/lib/build.mjs';
const root=path.resolve('editor/templates'),id='chungauto-news-v1',tpl=JSON.parse(fs.readFileSync(path.join(root,id,'template.json')));
test('News style preserves transcript, existing content and user off choices',()=>{
 const base={captions:{enabled:true,lines:[{text:'ô tô',start:0,end:1}]},texts:[{id:'old',title:'Keep'}],automotiveOptions:{music:'off',cta:'off',watermark:'off',sfx:'tat'},audio:{music:'private.mp3'},endCard:{enabled:true},watermark:{file:'logo.png'}};
 const next=applyTemplate(base,tpl);assert.equal(next.captions.enabled,false);assert.deepEqual(next.captions.lines,base.captions.lines);assert.equal(next.texts[0].title,'Keep');assert.equal(next.audio.autoSfx,false);assert.equal(next.audio.music,'');assert.equal(next.watermark.hidden,true);assert.equal(next.endCard.enabled,false);assert.equal(base.captions.enabled,true);
});
test('News presets fill fields, build and allow only declared fixed media while retaining text checks',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'news-qc-'));try{
 fs.mkdirSync(path.join(dir,'work'));fs.writeFileSync(path.join(dir,'work/transcript.json'),JSON.stringify({words:[{word:'ô tô',start:0,end:8}]}));
 const api=createApiPresets(tpl);assert.ok(api.list().presets.every(p=>p.supported));
 let p={template:{id},source:{video:'inputs/source.mp4',duration:8},segments:[{in:0,out:8}],brand:tpl.brand,captions:{enabled:false,lines:[]}};
 p=await api.insert(p,{presetId:'news-opening',at:0,dur:4,values:{0:'THỊ TRƯỜNG Ô TÔ',1:'GIẢM GIÁ',2:''},minhHoa:'ô tô'});
 p=await api.insert(p,{presetId:'news-header',at:0,dur:8,values:{0:'Nguồn: Tư liệu ô tô'},minhHoa:'ô tô'});
 assert.deepEqual(kiemDoHoa(dir,{project:p}).loi,[]);assert.match(buildHtml(p,dir),/data:image\/png;base64/);
 const wrong=structuredClone(p);wrong.blocks[0].preset='unrelated';assert.ok(kiemDoHoa(dir,{project:wrong}).loi.some(s=>s.includes('ảnh của mẫu')));
 const unchanged=structuredClone(p);unchanged.blocks[0].html=tpl.presets[0].html;assert.ok(kiemDoHoa(dir,{project:unchanged}).loi.some(s=>s.includes('chữ mẫu')));
 const missing=structuredClone(p);missing.blocks[0].minhHoa='không có lời này';assert.ok(kiemDoHoa(dir,{project:missing}).loi.some(s=>s.includes('không có trong lời')));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('News snapshot and ZIP preserve embedded media and conditional skill references',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'news-pack-'));try{
 const manifest=snapshotTemplate(root,id,path.join(dir,'snapshot')),loaded=readTemplateSnapshot(path.join(dir,'snapshot'),manifest);assert.deepEqual(loaded.template,tpl);assert.equal(Object.keys(loaded.references).length,4);assert.ok(['references/tim-canh-tren-mang.md','references/canh-tram-chuan.md'].every(f=>Object.hasOwn(loaded.references,f)));
 const pack=packageTemplate(root,id),[parsed]=parseTemplatePackage(pack.buffer);assert.deepEqual(parsed.template,tpl);assert.ok(parsed.files.has('poster.jpg'));assert.ok(parsed.files.has('preview.mp4'));assert.ok(parsed.files.has('references/finishing.md'));assert.ok(pack.buffer.length<2*1024*1024);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
