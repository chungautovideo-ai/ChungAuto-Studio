import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import test from 'node:test';import assert from 'node:assert/strict';
import {sourceMediaInfo} from '../src/services/source-media-info.mjs';
test('source media metadata probes selected video without copying or accepting undeclared paths',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-source-info-'));try{
  const file=path.join(root,'video có dấu.mp4'),bytes=fs.readFileSync(new URL('./fixture.mp4',import.meta.url));fs.writeFileSync(file,bytes);const text='A-roll: "'+file+'"';
  const info=await sourceMediaInfo(text,file);assert.equal(info.role,'aroll');assert.ok(info.duration>0&&info.displayWidth>0&&info.displayHeight>0);assert.equal(info.bytes,bytes.length);assert.equal(typeof info.hasAudio,'boolean');assert.ok(info.codec);assert.deepEqual(fs.readFileSync(file),bytes);assert.deepEqual(fs.readdirSync(root),['video có dấu.mp4']);
  await assert.rejects(sourceMediaInfo(text,path.join(root,'outside.mp4')),/không nằm/);const bad=path.join(root,'bad.mp4');fs.writeFileSync(bad,'invalid');await assert.rejects(sourceMediaInfo('A-roll: "'+bad+'"',bad));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
