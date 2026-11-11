import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {createSourcePreview} from '../src/services/source-preview.mjs';
test('source survey extracts six actual JPEG frames with timestamps and unchanged source',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-survey-'));try{
  const selected=path.join(root,'video có dấu.mp4'),bytes=fs.readFileSync(new URL('./fixture.mp4',import.meta.url));fs.writeFileSync(selected,bytes);const text='A-roll: "'+selected+'"';
  const result=await createSourcePreview(root,'one',text,selected);assert.equal(result.frames.length,6);assert.ok(fs.existsSync(path.join(root,result.manifestPath)));
  for(const frame of result.frames){assert.ok(frame.time>0&&frame.time<result.media.duration);const jpeg=fs.readFileSync(path.join(root,frame.path));assert.equal(jpeg[0],255);assert.equal(jpeg[1],216);assert.equal(frame.sha256,crypto.createHash('sha256').update(jpeg).digest('hex'));assert.ok(frame.dataUrl.startsWith('data:image/jpeg;base64,'));}
  assert.deepEqual(fs.readFileSync(selected),bytes);await assert.rejects(createSourcePreview(root,'one',text,path.join(root,'other.mp4')));
  await assert.rejects(createSourcePreview(root,'one',text,selected,{validate:()=>{throw new Error('Workspace changed');}}),/Workspace changed/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
