import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {zip,unzip} from '../editor/lib/zip.mjs';import {packageTemplate,parseTemplatePackage,installTemplatePackage} from '../src/services/template-package.mjs';import {snapshotTemplate,readTemplateSnapshot} from '../src/services/template-snapshots.mjs';
test('portable automotive template retains refs, eleven presets and preview then pins imported version',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-package-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const id='chungauto-factory-quang-cao-v50',packed=packageTemplate('editor/templates',id);const installed=installTemplatePackage(root,packed.buffer);assert.equal(installed[0].referenceCount,5);assert.equal(installed[0].template.presets.length,11);
 for(const name of ['SKILL.md','references/person.md','references/color.md','references/plate.md','references/finishing.md','preview.mp4'])assert.deepEqual(fs.readFileSync(path.join(root,id,name)),fs.readFileSync(path.join('editor/templates',id,name)));
 const destination=path.join(root,'job'),selected=snapshotTemplate(root,id,destination);assert.equal(Object.keys(readTemplateSnapshot(destination,selected).references).length,5);
 const entries=unzip(packed.buffer),before=fs.readFileSync(path.join(root,id,'template.json'));assert.throws(()=>installTemplatePackage(root,zip(entries.filter(e=>!e.name.endsWith('/references/person.md')))),/Thiếu tham chiếu/);assert.deepEqual(fs.readFileSync(path.join(root,id,'template.json')),before);
 assert.throws(()=>parseTemplatePackage(zip([...entries,entries[0]])),/trùng/);assert.throws(()=>parseTemplatePackage(zip([...entries,{name:'../secret',data:Buffer.from('x')}])) ,/Đường dẫn/);
 assert.throws(()=>installTemplatePackage(root,packed.buffer,{check:()=>{throw Error('minApp')}}),/minApp/);assert.deepEqual(fs.readFileSync(path.join(root,id,'template.json')),before);
 const legacy=zip([{name:'legacy/template.json',data:Buffer.from('{"name":"Legacy"}')},{name:'legacy/SKILL.md',data:Buffer.from('Rules')}]);assert.equal(installTemplatePackage(root,legacy)[0].referenceCount,0);
 assert.throws(()=>unzip(zip([{name:'oversize',data:Buffer.alloc(1024)}]),{maxFileBytes:100,maxOutputBytes:100}),/quá lớn/);
});
