import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {templateDetails} from '../src/services/template-details.mjs';
test('template details show actual rule hashes and supported preset adapters without executing rules',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-template-details-'));try{
 const dir=path.join(root,'fixture');fs.mkdirSync(dir);fs.writeFileSync(path.join(dir,'template.json'),JSON.stringify({name:'Mẫu',presets:[{id:'title',kind:'texts'},{id:'unsupported',html:'<b>text</b>'},{id:'matte',layer:'behind',html:'<b class="t">text</b>',fields:[{sel:'.t',label:'Title'}]}]}));fs.writeFileSync(path.join(dir,'SKILL.md'),'# Quy tắc <script>not executed</script>');
 const detail=templateDetails(root,'fixture');assert.equal(detail.presetCount,3);assert.equal(detail.apiSupported,2);assert.equal(detail.presets[2].requiresMatte,true);assert.equal(detail.skillHash.length,64);assert.match(detail.rules,/<script>/);assert.equal(detail.templateHash.length,64);
 fs.writeFileSync(path.join(dir,'SKILL.md'),'changed');assert.notEqual(templateDetails(root,'fixture').skillHash,detail.skillHash);assert.throws(()=>templateDetails(root,'../escape'));
 fs.unlinkSync(path.join(dir,'SKILL.md'));assert.equal(templateDetails(root,'fixture').rules,null);
 fs.writeFileSync(path.join(dir,'template.json'),'[]');assert.throws(()=>templateDetails(root,'fixture'),/không hợp lệ/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
