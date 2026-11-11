import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {finalizeRenderArtifactAsync} from '../src/services/render-finalization-async.mjs';import {verifyArtifact} from '../src/services/artifact-integrity.mjs';
test('finalizer worker leaves event loop responsive during real FFmpeg and preserves audio/hash/errors',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-final-async-'));try{
  const directory=path.join(root,'snapshot'),projectDir=path.join(root,'project');for(const d of [directory,projectDir])fs.mkdirSync(path.join(d,'renders'),{recursive:true});
  fs.writeFileSync(path.join(directory,'project.json'),JSON.stringify({format:'9:16',segments:[{in:0,out:2,keep:true}]}));
  execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','color=s=1080x1920:d=2:r=30','-f','lavfi','-i','sine=frequency=440:duration=2','-c:v','libx264','-preset','ultrafast','-c:a','aac','-shortest',path.join(directory,'renders/qa.mp4')],{windowsHide:true});
  let beats=0;const timer=setInterval(()=>beats++,5);let result;try{result=await finalizeRenderArtifactAsync({snapshot:{directory,manifest:{id:'async',revision:'r'}},projectDir,output:'renders/qa.mp4',quality:'final'});}finally{clearInterval(timer);}
  assert.ok(beats>2,'HTTP/event-loop tasks run while worker waits for FFmpeg');assert.equal(result.audioLoudness.listened,false);assert.equal(result.loudnorm,true);const meta=JSON.parse(fs.readFileSync(result.saved+'.json'));assert.deepEqual(verifyArtifact(result.saved,meta),{bytes:result.bytes,sha256:result.sha256});assert.deepEqual(meta.audioLoudness,result.audioLoudness);
  await assert.rejects(finalizeRenderArtifactAsync({snapshot:{directory,manifest:{id:'missing',revision:'r'}},projectDir,output:'renders/missing.mp4'}),/Không có file/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
