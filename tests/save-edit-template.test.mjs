import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {saveEditTemplate} from '../src/services/save-edit-template.mjs';
import {createApiPresets} from '../src/services/api-presets.mjs';
test('same name creates distinct entries and improvements retain parent/rules without changing original',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-edit-template-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const input={name:'Review',project:{audio:{music:'inputs/private.mp3',musicLoop:'repeat',duckLevel:.3}},skill:'# Review\nÍt SFX.'};
 const first=saveEditTemplate(root,input),before=fs.readFileSync(path.join(first.folder,'template.json'));
 const second=saveEditTemplate(root,input);assert.notEqual(first.id,second.id);assert.equal(first.template.version,1);
 const improved=saveEditTemplate(root,{...input,skill:'',parentId:first.id,changeNote:'Nhạc nhẹ hơn'});
 assert.equal(improved.template.version,2);assert.equal(improved.template.parentId,first.id);assert.equal(improved.template.changeNote,'Nhạc nhẹ hơn');assert.equal(improved.template.audio.music,undefined);
 assert.match(fs.readFileSync(path.join(improved.folder,'SKILL.md'),'utf8'),/Ít SFX/);assert.deepEqual(fs.readFileSync(path.join(first.folder,'template.json')),before);
 assert.throws(()=>saveEditTemplate(root,{...input,parentId:'../outside'}),/Mã mẫu/);assert.throws(()=>saveEditTemplate(root,{...input,name:''}),/Đặt tên/);
 assert.equal(fs.readdirSync(root).filter(n=>n.startsWith('.saving')).length,0);
});

test('improving automotive audio retains installed presets and fresh mix without copying project media or blocks',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-presets-revision-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const folder=path.join(root,'automotive');fs.mkdirSync(folder);
 const parent=JSON.parse(fs.readFileSync('editor/templates/chungauto-factory-quang-cao-v50/template.json','utf8'));parent.id='automotive';
 fs.writeFileSync(path.join(folder,'template.json'),JSON.stringify(parent));fs.writeFileSync(path.join(folder,'SKILL.md'),'# Original rules');fs.cpSync('editor/templates/chungauto-factory-quang-cao-v50/references',path.join(folder,'references'),{recursive:true});
 const before=fs.readFileSync(path.join(folder,'template.json'));
 const project={blocks:[{id:'private',html:'customer media',at:18}],source:{video:'inputs/customer.mp4'},audio:{music:'inputs/private.mp3',musicVolume:.04,duckSourceSpeech:true,sfxLevel:'tat',sfx:[{at:8,kind:'pop'}],clips:[{src:'inputs/voice.wav'}]},texts:[]};
 const result=saveEditTemplate(root,{name:'Review quieter',parentId:'automotive',project});
 assert.equal(result.template.presets.length,11);assert.deepEqual(result.template.presets,parent.presets);assert.deepEqual(result.template.texts,parent.texts);assert.deepEqual(result.template.brolls,parent.brolls);
 assert.equal(result.template.audio.musicVolume,.04);assert.equal(result.template.audio.duckSourceSpeech,true);assert.equal(result.template.audio.music,undefined);assert.equal(result.template.blocks,undefined);assert.equal(result.template.source,'custom');assert.ok(!JSON.stringify(result.template).includes('inputs/customer.mp4'));assert.equal(result.template.audio.sfx,undefined);assert.equal(result.template.audio.clips,undefined);
 const adapter=createApiPresets(result.template),inserted=await adapter.insert({blocks:[]},{presetId:'ca-callout',at:1,dur:2,values:{'0':'GHẾ DA','1':'Theo đúng cảnh nguồn'},minhHoa:'ghế da'});
 assert.match(inserted.blocks[0].html,/GHẾ DA/);assert.ok(inserted.blocks[0].anim.length);assert.equal(inserted.blocks[0].apiPreset.templateId,result.id);
 result.template.presets[0].name='changed';assert.equal(JSON.parse(fs.readFileSync(path.join(folder,'template.json'))).presets[0].name,parent.presets[0].name);assert.deepEqual(fs.readFileSync(path.join(folder,'template.json')),before);
 const independent=saveEditTemplate(root,{name:'New style',project});assert.equal(independent.template.presets,undefined);
});
