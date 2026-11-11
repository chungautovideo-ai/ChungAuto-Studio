import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {importLutDirectory,attachLibraryLut,readLutLibrary} from '../src/services/lut-library.mjs';
test('shared LUT catalog deduplicates files, preserves unknown input and rejects unsupported transforms and tampering',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'lut-library-'));try{
  const input=path.join(root,'nas'),project=path.join(root,'project');fs.mkdirSync(input);fs.mkdirSync(project);let text='TITLE "Test"\nLUT_3D_SIZE 2\n';for(let b=0;b<2;b++)for(let g=0;g<2;g++)for(let r=0;r<2;r++)text+=`${r} ${g} ${b}\n`;
  fs.writeFileSync(path.join(input,'custom.cube'),text);fs.writeFileSync(path.join(input,'duplicate.cube'),text);fs.writeFileSync(path.join(input,'linear.cube'),'LUT_1D_SIZE 2\n0 0 0\n1 1 1');const before=fs.readFileSync(path.join(input,'custom.cube'));
  const catalog=importLutDirectory(root,input);assert.equal(catalog.items.length,1);assert.equal(catalog.items[0].kind,'unclassified');assert.equal(catalog.items[0].sources.length,2);assert.equal(catalog.rejected.length,1);assert.deepEqual(fs.readFileSync(path.join(input,'custom.cube')),before);
  await assert.rejects(attachLibraryLut(root,project,catalog.items[0].id),/loại LUT/);const lut=await attachLibraryLut(root,project,catalog.items[0].id,{kind:'look',inputProfile:'rec709'});assert.equal(lut.inputProfile,'rec709');assert.equal(importLutDirectory(root,input).items.length,1);
  fs.appendFileSync(path.join(root,'workspace/contentos/lut-library',catalog.items[0].id+'.cube'),'tamper');await assert.rejects(attachLibraryLut(root,project,catalog.items[0].id,{kind:'look',inputProfile:'rec709'}),/đã đổi/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('duplicate LUT aliases preserve known input and conflicting declarations require explicit selection',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'lut-aliases-'));try{
  const input=path.join(root,'nas'),project=path.join(root,'project');fs.mkdirSync(input);fs.mkdirSync(project);let text='LUT_3D_SIZE 2\n';for(let b=0;b<2;b++)for(let g=0;g<2;g++)for(let r=0;r<2;r++)text+=`${r} ${g} ${b}\n`;
  fs.writeFileSync(path.join(input,'AppleLogToRec709.cube'),text);fs.writeFileSync(path.join(input,'zzz-custom.cube'),text);
  let item=importLutDirectory(root,input).items[0];assert.equal(item.inputProfile,'applelog');assert.equal(item.sources.length,2);
  item=importLutDirectory(root,input).items[0];assert.equal(item.inputProfile,'applelog');assert.equal(item.classificationCandidates.length,1);
  const catalogFile=path.join(root,'workspace/contentos/lut-library/catalog.json'),legacy=JSON.parse(fs.readFileSync(catalogFile));Object.assign(legacy.items[0],{kind:'unclassified',inputProfile:null,classification:'needs-user-profile'});delete legacy.items[0].classificationCandidates;fs.writeFileSync(catalogFile,JSON.stringify(legacy));const diskBefore=fs.readFileSync(catalogFile);assert.equal(readLutLibrary(root).items[0].inputProfile,'applelog');assert.deepEqual(fs.readFileSync(catalogFile),diskBefore,'read repair must not write catalog or scan NAS');
  fs.writeFileSync(path.join(input,'D-Log M to Rec.709.cube'),text);item=importLutDirectory(root,input).items[0];assert.equal(item.kind,'unclassified');assert.equal(item.inputProfile,null);assert.equal(item.classification,'conflicting-input-profiles');assert.deepEqual(item.classificationCandidates.map(c=>c.inputProfile),['applelog','dlog-m']);
  await assert.rejects(attachLibraryLut(root,project,item.id),/loại LUT/);
  assert.equal((await attachLibraryLut(root,project,item.id,{kind:'technical',inputProfile:'applelog'})).inputProfile,'applelog');
  item=importLutDirectory(root,input).items[0];assert.equal(item.classification,'conflicting-input-profiles');assert.equal(item.classificationCandidates.length,2);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
