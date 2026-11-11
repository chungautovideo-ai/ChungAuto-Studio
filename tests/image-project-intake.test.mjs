import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createImageService} from '../src/services/images.mjs';import {importProjectImage} from '../src/services/image-project-intake.mjs';
test('project reference intake uses declared contained photos, preserves source and records checksum provenance',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-ref-project-'));try{
  const dir=path.join(root,'workspace/content/qa/project');fs.mkdirSync(path.join(dir,'inputs'),{recursive:true});fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify({workspaceId:'one'}));
  const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQ1EAAAAASUVORK5CYII=','base64'),src='inputs/product.png',file=path.join(dir,src);fs.writeFileSync(file,bytes);const service=createImageService(root,{env:{}});
  const result=await importProjectImage(root,dir,src,[src],'one',service);assert.equal(result.origin,'project-media');assert.equal(result.source.projectDir,'workspace/content/qa/project');assert.equal(result.source.sha256,result.sha256);assert.deepEqual(fs.readFileSync(file),bytes);assert.deepEqual(fs.readFileSync(service.assetFile('one',result.id).file),bytes);
  await assert.rejects(importProjectImage(root,dir,src,[],'one',service));await assert.rejects(importProjectImage(root,dir,'../outside.png',['../outside.png'],'one',service));await assert.rejects(importProjectImage(root,dir,src,[src],'two',service));
  let calls=0;await assert.rejects(importProjectImage(root,dir,src,[src],'one',service,()=>{if(++calls===4)fs.appendFileSync(file,'changed');}),/đổi/);assert.equal(service.list('one').length,1);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
