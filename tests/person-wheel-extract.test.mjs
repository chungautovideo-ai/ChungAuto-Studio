import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {spawnSync} from 'node:child_process';import {zip} from '../editor/lib/zip.mjs';
test('embedded wheel extractor relocates library data and rejects traversal before writing outside target',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-wheel-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const target=path.join(root,'site'),wheel=path.join(root,'fixture.whl'),script=path.resolve('installer/person-extract-wheels.py');
 fs.writeFileSync(wheel,zip([{name:'demo/__init__.py',data:Buffer.from('value=1')},{name:'demo.data/purelib/extra.py',data:Buffer.from('value=2')},{name:'demo.data/scripts/unsafe.exe',data:Buffer.from('not installed')} ]));
 const python=fs.existsSync('tools/vision-embedded/python.exe')?path.resolve('tools/vision-embedded/python.exe'):'python';
 const result=spawnSync(python,[script,target,wheel],{encoding:'utf8',windowsHide:true});assert.equal(result.status,0,result.stderr);
 assert.equal(fs.readFileSync(path.join(target,'extra.py'),'utf8'),'value=2');assert.equal(fs.existsSync(path.join(target,'demo.data')),false);
 fs.writeFileSync(wheel,zip([{name:'../outside.py',data:Buffer.from('bad')}]));const bad=spawnSync(python,[script,target,wheel],{encoding:'utf8',windowsHide:true});assert.notEqual(bad.status,0);assert.equal(fs.existsSync(path.join(root,'outside.py')),false);
});
