import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import test from 'node:test';import {execFileSync} from 'node:child_process';
import {createPlatePrivacy} from '../src/services/plate-privacy.mjs';import {requireVisionPython} from '../src/services/vision-python.mjs';
const options={windowsHide:true,maxBuffer:16*1048576};
test('plate output begins with the held low-FPS source frame at ROI clock, then advances without shifting source',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-plate-clock-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));fs.mkdirSync(path.join(dir,'inputs'));
 const source=path.join(dir,'inputs/a.mp4');
 const fixture=`import cv2,numpy as np,sys
out=cv2.VideoWriter(sys.argv[1],cv2.VideoWriter_fourcc(*'mp4v'),4,(320,180))
patch=np.random.default_rng(42).integers(70,255,(40,80,3),dtype=np.uint8)
for n in range(8):
 frame=np.full((180,320,3),40+n*15,np.uint8);frame[70:110,40+n*2:120+n*2]=patch;out.write(frame)
out.release()
`;
 {const py=requireVisionPython(process.cwd());execFileSync(py.command,[...py.args,'-c',fixture,source],options);};const before=fs.readFileSync(source),project={source:{video:'inputs/a.mp4'},segments:[{in:0,out:2}],brolls:[{id:'b',src:'inputs/a.mp4',at:0,dur:.25,mediaStart:.74}]},projectBefore=structuredClone(project);
 const result=await createPlatePrivacy(process.cwd(),dir,project,{brollId:'b',roi:[44/320,70/180,80/320,40/180]});
 const tracks=JSON.parse(fs.readFileSync(path.join(dir,path.dirname(result.path),'tracks.json')));
 assert.equal(tracks.sampling.method,'presentation-held-v1');assert.equal(tracks.sampling.firstSourceFrameTime,.5);assert.equal(tracks.frames.length,8);
 const raw=execFileSync('ffmpeg',['-nostdin','-v','error','-i',path.join(dir,result.path),'-pix_fmt','rgb24','-f','rawvideo','pipe:1'],options),bytes=320*180*3;
 assert.equal(raw.length,8*bytes);
 // Far from the masked patch, the first output is frame0.5 (~70 grey),
 // and every later tick in this range displays frame0.75 (~85 grey).
 const first=raw[0],next=raw[bytes];assert.ok(next-first>10,JSON.stringify({first,next}));
 for(let n=0;n<8;n++){
  const at=n*bytes+((85*320)+80)*3;assert.ok(raw[at]<30&&raw[at+1]<30&&raw[at+2]<30,'Known textured region remains solid-covered');
 }
 assert.deepEqual(fs.readFileSync(source),before);assert.deepEqual(project,projectBefore);assert.equal(result.provenance.requiresVisualReview,true);
});
