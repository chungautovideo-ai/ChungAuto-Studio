import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {fingerprintArtifact,verifyArtifact,verifyArtifactAsync} from '../src/services/artifact-integrity.mjs';
test('artifact identity rejects same-size replacement, truncated/missing bytes and legacy unverifiable metadata',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-integrity-')),file=path.join(root,'output.mp4');
 try{fs.writeFileSync(file,Buffer.alloc(2*1024*1024+17,1));const metadata=fingerprintArtifact(file);assert.equal(metadata.bytes,2*1024*1024+17);assert.deepEqual(verifyArtifact(file,metadata),metadata);
  fs.writeFileSync(file,Buffer.alloc(metadata.bytes,2));assert.throws(()=>verifyArtifact(file,metadata),/thay đổi/);assert.throws(()=>verifyArtifact(file,{}),/thiếu mã/);
  fs.writeFileSync(file,Buffer.alloc(10));assert.throws(()=>verifyArtifact(file,metadata));fs.unlinkSync(file);assert.throws(()=>verifyArtifact(file,metadata));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('async download verification yields, cancels and bounds concurrent scans with context revalidation',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-async-integrity-')),file=path.join(root,'large.mp4');
 try{
  fs.writeFileSync(file,Buffer.alloc(16*1024*1024,3));const metadata=fingerprintArtifact(file);let yielded=false;setTimeout(()=>yielded=true,0);
  const first=verifyArtifactAsync(file,metadata),second=verifyArtifactAsync(file,metadata);await assert.rejects(verifyArtifactAsync(file,metadata),/hai bản/);await Promise.all([first,second]);assert.equal(yielded,true);
  const controller=new AbortController();let checks=0;await assert.rejects(verifyArtifactAsync(file,metadata,{signal:controller.signal,validate:()=>{if(++checks===3)controller.abort();}}),/abort/i);
  await assert.rejects(verifyArtifactAsync(file,metadata,{validate:()=>{throw new Error('workspace changed');}}),/workspace changed/);
  assert.deepEqual(await verifyArtifactAsync(file,metadata),metadata);fs.writeFileSync(file,Buffer.alloc(metadata.bytes,4));await assert.rejects(verifyArtifactAsync(file,metadata),/thay đổi/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
