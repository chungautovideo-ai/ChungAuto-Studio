import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {exportImage,inspectImage} from '../src/services/image-output.mjs';
test('actual image export decodes and verifies exact dimensions, retaining original bytes',async()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-image-export-'));
 try{
  const original=path.join(folder,'source.png');execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','color=c=blue:s=320x240','-frames:v','1',original],{windowsHide:true});const before=fs.readFileSync(original);
  for(const [aspect,fit,width,height] of [['9:16','contain',1080,1920],['16:9','cover',1920,1080]]){
   const output=path.join(folder,fit+'.png'),result=await exportImage(original,output,{aspect,fit});assert.equal(result.width,width);assert.equal(result.height,height);assert.deepEqual(await inspectImage(output),{width,height});
  }
  assert.deepEqual(fs.readFileSync(original),before);await assert.rejects(exportImage(original,path.join(folder,'wrong.png'),{aspect:'3:2'}));
  const invalid=path.join(folder,'invalid.png');fs.writeFileSync(invalid,'not image');await assert.rejects(exportImage(invalid,path.join(folder,'invalid-output.png'),{aspect:'1:1'}));
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
});
