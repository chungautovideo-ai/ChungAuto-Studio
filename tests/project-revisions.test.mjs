import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {projectRevision,assertProjectRevision,commitProject} from '../src/services/project-revisions.mjs';

test('Competing editor and external AI saves cannot silently replace newer project content',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-revision-'));
  try{
    const file=path.join(root,'project.json');
    fs.writeFileSync(file,JSON.stringify({title:'Original',workspaceId:'brand',contentos:{brandSnapshot:'Brand'}}));
    const rev=projectRevision(file);
    const saved=commitProject(file,{title:'Editor A',workspaceId:'wrong'},rev);
    assert.notEqual(saved.revision,rev);assert.equal(saved.project.workspaceId,'brand');
    assert.equal(saved.project.contentos.brandSnapshot,'Brand');
    assert.throws(()=>commitProject(file,{title:'Stale editor B'},rev),{status:409});
    assert.equal(JSON.parse(fs.readFileSync(file)).title,'Editor A');
    fs.writeFileSync(file,JSON.stringify({...saved.project,title:'AI result'}));
    assert.throws(()=>assertProjectRevision(file,saved.revision),{status:409});
    assert.throws(()=>commitProject(file,{title:'Missing token'}),{status:409});
    const rows=fs.readdirSync(path.join(root,'.history'));assert.equal(rows.length,1);
    assert.equal(JSON.parse(fs.readFileSync(path.join(root,'.history',rows[0]))).title,'Original');
    assert.equal(fs.readdirSync(root).filter(f=>f.endsWith('.tmp')).length,0);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
