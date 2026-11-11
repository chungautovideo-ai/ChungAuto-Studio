import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {snapshotTemplate,readTemplateSnapshot} from '../src/services/template-snapshots.mjs';
test('job template retains selected rules and preset data after catalog changes, detects tampering and never overwrites',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-template-snapshot-')),templates=path.join(root,'templates'),source=path.join(templates,'fixture'),destination=path.join(root,'job/work/template-snapshot');
 try{
  fs.mkdirSync(source,{recursive:true});const template={id:'fixture',name:'Mẫu thử',presets:[{id:'title',kind:'texts',text:{title:'original'}}]};
  fs.writeFileSync(path.join(source,'template.json'),JSON.stringify(template));fs.writeFileSync(path.join(source,'SKILL.md'),'# Quy tắc\nGiữ phong cách được chọn.');
  const selected=snapshotTemplate(templates,'fixture',destination);
  fs.writeFileSync(path.join(source,'template.json'),JSON.stringify({...template,name:'new version'}));fs.writeFileSync(path.join(source,'SKILL.md'),'new rules');
  const pinned=readTemplateSnapshot(destination,selected);assert.deepEqual(pinned.template,template);assert.match(pinned.skill,/Giữ phong cách/);
  assert.throws(()=>snapshotTemplate(templates,'fixture',destination),/EEXIST/);assert.deepEqual(readTemplateSnapshot(destination,selected).template,template);
  assert.throws(()=>snapshotTemplate(templates,'../escape',path.join(root,'other')),/không hợp lệ/);
  assert.throws(()=>readTemplateSnapshot(destination,{...selected,templateHash:'changed'}),/thay đổi/);
  fs.writeFileSync(path.join(destination,'SKILL.md'),'tampered');assert.throws(()=>readTemplateSnapshot(destination,selected),/thay đổi/);
  fs.unlinkSync(path.join(source,'SKILL.md'));const noSkill=snapshotTemplate(templates,'fixture',path.join(root,'no-skill'));assert.equal(readTemplateSnapshot(path.join(root,'no-skill'),noSkill).skill,null);
  fs.writeFileSync(path.join(source,'template.json'),'[]');assert.throws(()=>snapshotTemplate(templates,'fixture',path.join(root,'invalid')),/không hợp lệ/);
 }finally{await fs.promises.rm(root,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});
