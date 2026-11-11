import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {normalizeColor} from '../src/services/color-normalization.mjs';import {applyColorNormalization,restoreColorNormalization} from '../editor/lib/color-management.js';
import {createPlatePrivacy} from '../src/services/plate-privacy.mjs';import {requireVisionPython} from '../src/services/vision-python.mjs';import {applyPrimaryPrivacy,restorePrimaryPrivacy,applyBrollPrivacy,restoreBrollPrivacy} from '../editor/lib/primary-privacy.js';
import {sourceTranscriptClock} from '../editor/lib/source-transcript.js';import {buildHtml} from '../editor/lib/build.mjs';
import {plateReviewStatus,approvePlateReview} from '../src/services/plate-review.mjs';import {projectRevision} from '../src/services/project-revisions.mjs';
test('real normalization then plate tracking preserves A/B-roll chain, source clock, trim, two-stage restore and review/hash guards',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'color-plate-'));fs.mkdirSync(path.join(dir,'inputs'));
 try{
  const code=`import cv2,numpy as np,sys
out=cv2.VideoWriter(sys.argv[1],cv2.VideoWriter_fourcc(*'mp4v'),30,(320,180))
rng=np.random.default_rng(42);patch=rng.integers(80,255,(40,80,3),dtype=np.uint8)
cv2.putText(patch,'51F-123',(2,25),cv2.FONT_HERSHEY_SIMPLEX,.4,(0,0,0),1)
for i in range(60):
 f=np.full((180,320,3),60,np.uint8);f[70:110,40+i:120+i]=patch;out.write(f)
out.release()`;
  execFileSync(requireVisionPython(process.cwd()).command,['-c',code,path.join(dir,'inputs/silent.mp4')],{windowsHide:true});
  execFileSync('ffmpeg',['-v','error','-y','-i',path.join(dir,'inputs/silent.mp4'),'-f','lavfi','-i','sine=frequency=440:duration=2','-c:v','libx264','-x264-params','colorprim=bt709:transfer=bt709:colormatrix=bt709','-c:a','aac','-shortest',path.join(dir,'inputs/raw.mp4')],{windowsHide:true});
  const original=fs.readFileSync(path.join(dir,'inputs/raw.mp4')),base={source:{video:'inputs/raw.mp4',timeline:'segments',width:320,height:180,duration:2,hasAudio:true},segments:[{id:'s',src:'inputs/raw.mp4',mediaStart:.4,mediaInfo:{width:320,height:180,duration:2,hasAudio:true},in:10,out:11,speed:2}],brolls:[{id:'b',src:'inputs/raw.mp4',at:10,dur:.5,speed:2,mediaStart:.4}],audio:{voice:1,music:'',sfxLevel:'tat'}};
  for(const kind of ['segments','brolls']){
   const id=kind==='segments'?'s':'b',converted=await normalizeColor(dir,base,{kind,id,skinLift:.1,encoder:'cpu'}),colored=applyColorNormalization(base,kind,id,converted);
   // Trim source by0.1s before masking, ROI on frame at0.5s of original.
   colored[kind][0].mediaStart=.1;if(kind==='segments')colored[kind][0].in=10.1;else colored[kind][0].dur=.45;
   const request={...(kind==='segments'?{segmentId:id}:{brollId:id}),roi:[55/320,70/180,80/320,40/180]},result=await createPlatePrivacy(process.cwd(),dir,colored,request);
   const applied=kind==='segments'?applyPrimaryPrivacy(colored,id,result):applyBrollPrivacy(colored,id,result),item=applied[kind][0];
   assert.equal(result.mediaInfo.colorMetadata.transfer,'bt709');assert.equal(result.mediaInfo.colorMetadata.matrix,'bt709');assert.equal(result.mediaInfo.hasAudio,true);
   assert.equal(item.colorNormalization,undefined);assert.equal(item.platePrivacy.originalColorNormalization.sha256,converted.provenance.sha256);assert.equal(item.platePrivacy.from,.1);assert.equal(sourceTranscriptClock(applied),sourceTranscriptClock(colored));
   assert.ok(buildHtml(applied,dir).includes(result.path));assert.throws(()=>restoreColorNormalization(applied,kind,id),/Khôi phục bản che/);
   const restored=kind==='segments'?restorePrimaryPrivacy(applied,id):restoreBrollPrivacy(applied,id);assert.equal(restored[kind][0].src,colored[kind][0].src);assert.equal(restored[kind][0].mediaStart,.1);assert.equal(restored[kind][0].colorNormalization.sha256,converted.provenance.sha256);
   const raw=restoreColorNormalization(restored,kind,id);assert.equal(raw[kind][0].src,'inputs/raw.mp4');assert.equal(raw[kind][0].mediaStart,.5);
   const later=structuredClone(applied);later[kind][0].mediaStart=.1;if(kind==='segments')later[kind][0].in+=.1;else later[kind][0].dur-=.05;const undo=kind==='segments'?restorePrimaryPrivacy(later,id):restoreBrollPrivacy(later,id);assert.equal(undo[kind][0].mediaStart,.2);
   const exceeded=structuredClone(applied);exceeded[kind][0].mediaStart=2;assert.throws(()=>buildHtml(exceeded,dir),/vượt/);
   fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify(applied));const revision=projectRevision(path.join(dir,'project.json'));assert.equal(plateReviewStatus(dir,applied,revision).approved,false);assert.equal(approvePlateReview(dir,applied,revision,{confirmed:true}).approved,true);
   const shifted=structuredClone(applied);shifted[kind][0].platePrivacy.from=10;assert.throws(()=>buildHtml(shifted,dir),/Chuỗi màu/);
   const colorFile=path.join(dir,converted.path),bytes=fs.readFileSync(colorFile);fs.appendFileSync(colorFile,'changed');assert.throws(()=>buildHtml(applied,dir),/Bản màu trước/);fs.writeFileSync(colorFile,bytes);
   fs.appendFileSync(path.join(dir,result.path),'changed');assert.throws(()=>buildHtml(applied,dir),/Bản che biển/);assert.equal(plateReviewStatus(dir,applied,revision).approved,false);
  }
  assert.deepEqual(fs.readFileSync(path.join(dir,'inputs/raw.mp4')),original);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
