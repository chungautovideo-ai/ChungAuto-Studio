import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';import {finalizeRenderArtifact} from '../src/services/render-artifacts.mjs';
import {resolveScheduledVideo} from '../src/services/scheduled-media.mjs';
import {verifyArtifact} from '../src/services/artifact-integrity.mjs';
test('render finalization verifies snapshot dimensions/duration and preserves previous output',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-artifact-'));
 try{
  const directory=path.join(root,'snapshot'),projectDir=path.join(root,'project');for(const dir of [directory,projectDir])fs.mkdirSync(path.join(dir,'renders'),{recursive:true});
  const project={format:'9:16',segments:[{in:0,out:0.5,keep:true}]};fs.writeFileSync(path.join(directory,'project.json'),JSON.stringify(project));
  const output='renders/qa.mp4',file=path.join(directory,output);
  execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','color=s=1080x1920:d=0.5:r=30','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p',file],{windowsHide:true});
  const snapshot={directory,manifest:{id:'fixture',revision:'revision'}};
  const result=finalizeRenderArtifact({snapshot,projectDir,output,quality:'final',renderJobDir:'work/job-a'});assert.equal(result.saved,path.join(projectDir,output));assert.equal(result.probe.streams[0].width,1080);
  const metadata=JSON.parse(fs.readFileSync(result.saved+'.json','utf8'));assert.equal(metadata.snapshotId,'fixture');assert.equal(metadata.revision,'revision');
  assert.equal(metadata.bytes,fs.statSync(result.saved).size);assert.match(metadata.sha256,/^[a-f0-9]{64}$/);
  assert.deepEqual(verifyArtifact(result.saved,metadata),{bytes:metadata.bytes,sha256:metadata.sha256});
  assert.equal(metadata.renderJobDir,'work/job-a');
  assert.equal(result.bytes,metadata.bytes);assert.equal(result.sha256,metadata.sha256);assert.equal(result.loudnorm,false);assert.match(result.warnings[0],/không có track/);assert.deepEqual(result.warnings,metadata.warnings);
  const scheduled={project:'project',scheduledMedia:{kind:'awaiting-render',renderJobDir:'work/job-a',revision:'revision'}};assert.equal(await resolveScheduledVideo(root,scheduled),result.saved);assert.equal(scheduled.scheduledMedia.kind,'pinned');assert.equal(scheduled.scheduledMedia.sha256.length,64);
  const bytes=fs.readFileSync(result.saved);assert.throws(()=>finalizeRenderArtifact({snapshot,projectDir,output,quality:'draft'}));assert.deepEqual(fs.readFileSync(result.saved),bytes);
  fs.writeFileSync(path.join(directory,'project.json'),JSON.stringify({...project,format:'16:9'}));assert.throws(()=>finalizeRenderArtifact({snapshot,projectDir,output:'renders/qa.mp4',quality:'draft'}),/kích thước/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('render with audio retains successful loudnorm and artifact integrity',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-artifact-audio-'));try{
  const directory=path.join(root,'snapshot'),projectDir=path.join(root,'project');for(const dir of [directory,projectDir])fs.mkdirSync(path.join(dir,'renders'),{recursive:true});
  fs.writeFileSync(path.join(directory,'project.json'),JSON.stringify({format:'9:16',segments:[{in:0,out:1,keep:true}]}));
  execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','color=s=1080x1920:d=1:r=30','-f','lavfi','-i','sine=frequency=440:duration=1','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','aac','-shortest',path.join(directory,'renders/audio.mp4')],{windowsHide:true});
  const result=finalizeRenderArtifact({snapshot:{directory,manifest:{id:'audio',revision:'r'}},projectDir,output:'renders/audio.mp4',quality:'final'});assert.equal(result.loudnorm,true);assert.deepEqual(result.warnings,[]);assert.equal(result.audioLoudness.listened,false);assert.equal(result.audioLoudness.silent,false);assert.ok(Number.isFinite(result.audioLoudness.integratedLufs));assert.deepEqual(JSON.parse(fs.readFileSync(result.saved+'.json')).audioLoudness,result.audioLoudness);assert.ok(result.probe.streams.some(s=>s.codec_type==='audio'));assert.deepEqual(verifyArtifact(result.saved,JSON.parse(fs.readFileSync(result.saved+'.json'))),{bytes:result.bytes,sha256:result.sha256});
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
