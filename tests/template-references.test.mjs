import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {snapshotTemplate,readTemplateSnapshot} from '../src/services/template-snapshots.mjs';
import {referencePaths,readTemplateReferences} from '../src/services/template-references.mjs';
import {saveEditTemplate} from '../src/services/save-edit-template.mjs';
import {runApiEditor} from '../src/services/api-editor.mjs';
test('reference snapshot pins topic bytes, detects tampering and improvement retains topics',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-reference-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const library=path.join(root,'templates');fs.mkdirSync(library);fs.mkdirSync(path.join(library,'qa/references'),{recursive:true});for(const name of ['template.json','SKILL.md','references/color.md','references/person.md','references/plate.md','references/finishing.md','references/editorial.md'])fs.copyFileSync(path.join('editor/templates/chungauto-factory-quang-cao-v50',name),path.join(library,'qa',name));
 const destination=path.join(root,'snapshot'),selected=snapshotTemplate(library,'qa',destination),pinned=readTemplateSnapshot(destination,selected);assert.equal(selected.references.length,5);assert.equal(pinned.template.presets.length,11);assert.match(pinned.references['references/person.md'],/Xem vùng đã lưu/);
 fs.writeFileSync(path.join(library,'qa/references/person.md'),'library changed');assert.match(readTemplateSnapshot(destination,selected).references['references/person.md'],/Xem vùng/);
 assert.throws(()=>readTemplateSnapshot(destination,{...selected,references:[]}),/thay đổi/);
 fs.appendFileSync(path.join(destination,'references/person.md'),'tamper');assert.throws(()=>readTemplateSnapshot(destination,selected),/thay đổi/);
 const improved=saveEditTemplate(library,{name:'Improvement',parentId:'qa',project:{audio:{}}});assert.deepEqual(improved.template.skillReferences,pinned.template.skillReferences);assert.equal(fs.readFileSync(path.join(improved.folder,'references/person.md'),'utf8'),'library changed');assert.deepEqual(improved.template.presets,pinned.template.presets);
 for(const value of [['../secret'],['references/../../secret.md'],['references/a.md','references/a.md'],['references/a.txt']])assert.throws(()=>referencePaths(value),/không hợp lệ/);
 fs.writeFileSync(path.join(library,'qa/references/person.md'),'x'.repeat(65537));assert.throws(()=>readTemplateReferences(path.join(library,'qa'),pinned.template),/quá lớn/);
 fs.unlinkSync(path.join(library,'qa/references/person.md'));assert.throws(()=>snapshotTemplate(library,'qa',path.join(root,'missing')),/ENOENT/);
});
test('API reads just requested pinned reference and keeps beauty unchanged',async()=>{
 let calls=0;const project={title:'Before',segments:[],camera:{beauty:{bodyWhite:0}}};const context={template:{references:[{path:'references/person.md'},{path:'references/plate.md'}]}};
 const result=await runApiEditor({config:{baseUrl:'https://example.test/v1',model:'fixture',apiKey:'fixture'},project,context,instruction:'Read person guide and rename',templateReferenceContext:name=>{assert.equal(name,'references/person.md');return {path:name,content:'PERSON_TOPIC_ONLY',readOnly:true};},fetcher:async(url,opts)=>{
 const body=JSON.parse(opts.body);assert.ok(body.tools.some(t=>t.function.name==='read_template_reference'));calls++;if(calls===1)assert.ok(!JSON.stringify(body.messages).includes('PERSON_TOPIC_ONLY'));if(calls===2){assert.ok(JSON.stringify(body.messages).includes('PERSON_TOPIC_ONLY'));assert.ok(!JSON.stringify(body.messages).includes('PLATE_TOPIC_ONLY'));}
 const message=calls===1?{tool_calls:[{id:'ref',type:'function',function:{name:'read_template_reference',arguments:'{"path":"references/person.md"}'}}]}:calls===2?{tool_calls:[{id:'edit',type:'function',function:{name:'set_edit_fields',arguments:'{"fields":{"title":"After"}}'}}]}:{content:'Done'};return Response.json({choices:[{finish_reason:calls<3?'tool_calls':'stop',message}]});
 }});assert.equal(result.project.title,'After');assert.deepEqual(result.project.camera,project.camera);
});
