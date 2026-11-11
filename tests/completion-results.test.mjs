import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {updateCompletionExport} from '../src/services/completion-results.mjs';
test('late export completion cannot overwrite a new Home build or a terminal result',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-completion-result-')),file=path.join(root,'job.json');
 const owner={token:'first',pid:123,revision:'revision-1'},job={completionToken:'first',exportPid:123,appliedRevision:'revision-1',completionState:'export-started'};
 const save=value=>fs.writeFileSync(file,JSON.stringify(value));
 try{
  save(job);assert.equal(updateCompletionExport(file,owner,{completionState:'exported',exportOutput:'first.mp4'}),true);
  const terminal=fs.readFileSync(file,'utf8');assert.equal(updateCompletionExport(file,owner,{completionState:'export-error'}),false);assert.equal(fs.readFileSync(file,'utf8'),terminal);
  for(const next of [{...job,completionToken:'new-build'},{...job,exportPid:456},{...job,appliedRevision:'revision-2'},{status:'waiting',completionToken:'new-build'}]){
   save(next);const before=fs.readFileSync(file,'utf8');assert.equal(updateCompletionExport(file,owner,{completionState:'exported'}),false);assert.equal(fs.readFileSync(file,'utf8'),before);
  }
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
