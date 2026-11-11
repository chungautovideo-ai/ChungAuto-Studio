import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createCompletionPolicyStore,normalizeCompletion} from '../src/services/completion-policy.mjs';
test('auto-export is removed: defaults, saved policies, projects and runs all resolve to review, never publish',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-policy-'));
 try{
  const store=createCompletionPolicyStore(root);assert.deepEqual(store.get('one'),{mode:'review',quality:'final',publish:false});
  store.save('one','auto-export');assert.equal(createCompletionPolicyStore(root).get('one').mode,'review');
  const project={contentos:{completionMode:'auto-export'}};assert.equal(store.resolve('one',{project}).mode,'review');assert.equal(store.resolve('one',{project,run:'auto-export'}).mode,'review');
  assert.equal(normalizeCompletion('auto-export').publish,false);assert.throws(()=>normalizeCompletion('publish'));assert.throws(()=>store.get('../bad'));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
