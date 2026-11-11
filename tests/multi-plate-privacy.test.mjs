import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {plateRegions,createPlatePrivacy} from '../src/services/plate-privacy.mjs';
import {requireVisionPython} from '../src/services/vision-python.mjs';

test('plate regions reject ambiguous, empty, oversized and out-of-frame selections',()=>{
 const roi=[.1,.2,.2,.1];
 for(const request of [{},{rois:[]},{roi,rois:[roi]},{rois:Array(9).fill(roi)},{rois:[[.95,0,.1,.1]]},{rois:[[0,0,.1,NaN]]}])assert.throws(()=>plateRegions(request));
 const result=plateRegions({rois:[roi,roi]});result[0][0]=.5;assert.equal(roi[0],.1);assert.equal(result[1][0],.1);
});

test('two independently moving plates are masked together; one lost region fails without publishing',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-multiplate-'));fs.mkdirSync(path.join(dir,'inputs'));
 const runtime=requireVisionPython(process.cwd());
 try{
  const source=path.join(dir,'inputs/raw.mp4');
  execFileSync(runtime.command,[...runtime.args,'-c',`import cv2,numpy as np,sys
out=cv2.VideoWriter(sys.argv[1],cv2.VideoWriter_fourcc(*'mp4v'),30,(400,240))
rng=np.random.default_rng(92);a=rng.integers(80,255,(40,70,3),dtype=np.uint8);b=rng.integers(80,255,(40,70,3),dtype=np.uint8)
for i in range(30):
 f=np.full((240,400,3),65,np.uint8);f[40:80,30+i:100+i]=a;f[150:190,280-i:350-i]=b;out.write(f)
out.release()
`,source],{windowsHide:true});
  const before=fs.readFileSync(source),project={source:{video:'inputs/raw.mp4'},segments:[{id:'s',in:0,out:1}],brolls:[{id:'b',src:'inputs/raw.mp4',at:0,dur:1}]};
  const rois=[[30/400,40/240,70/400,40/240],[280/400,150/240,70/400,40/240]];
  const result=await createPlatePrivacy(process.cwd(),dir,project,{brollId:'b',rois});
  assert.deepEqual(result.provenance.rois,rois);assert.deepEqual(result.provenance.roi,rois[0]);assert.deepEqual(fs.readFileSync(source),before);
  const tracks=JSON.parse(fs.readFileSync(path.join(dir,path.dirname(result.path),'tracks.json'))).frames;
  assert.equal(tracks.length,30);assert.ok(tracks.every(f=>f.regions.length===2));assert.deepEqual(tracks[0].quad,tracks[0].regions[0].quad);
  assert.ok(tracks.at(-1).regions[0].quad[0][0]-tracks[0].regions[0].quad[0][0]>25);
  assert.ok(tracks.at(-1).regions[1].quad[0][0]-tracks[0].regions[1].quad[0][0]<-25);
  const pixels=execFileSync('ffmpeg',['-v','error','-i',path.join(dir,result.path),'-f','rawvideo','-pix_fmt','rgb24','-'],{windowsHide:true,maxBuffer:12*1024**2});
  for(let i=0;i<30;i++){
   for(const [x,y] of [[65+i,60],[315-i,170]]){const p=(i*400*240+y*400+x)*3;assert.ok(pixels.subarray(p,p+3).every(v=>v<25),'both moving regions covered');}
   const p=(i*400*240+110*400+200)*3;assert.ok(pixels[p]>50&&pixels[p]<80,'outside preserved');
  }
  const count=fs.readdirSync(path.join(dir,'inputs/privacy')).length;
  await assert.rejects(()=>createPlatePrivacy(process.cwd(),dir,project,{brollId:'b',rois:[rois[0],[.5,.4,.1,.1]]}),/Vùng 2|thiếu chi tiết|điểm bám/);
  assert.equal(fs.readdirSync(path.join(dir,'inputs/privacy')).length,count);
  assert.equal(fs.readdirSync(path.join(dir,'work/privacy')).length,0);
  const quads=[[[35/400,48/240],[95/400,43/240],[95/400,72/240],[35/400,77/240]]];
  const tilted=await createPlatePrivacy(process.cwd(),dir,project,{brollId:'b',quads});
  assert.deepEqual(tilted.provenance.quads,quads);
  const tiltedTracks=JSON.parse(fs.readFileSync(path.join(dir,path.dirname(tilted.path),'tracks.json'))).frames;
  assert.deepEqual(tiltedTracks[0].quad,[[35,48],[95,43],[95,72],[35,77]],'polygon does not become bounding rectangle');
  assert.ok(tiltedTracks.at(-1).quad[0][0]-tiltedTracks[0].quad[0][0]>25);
  const polygonPixels=execFileSync('ffmpeg',['-v','error','-i',path.join(dir,tilted.path),'-f','rawvideo','-pix_fmt','rgb24','-'],{windowsHide:true,maxBuffer:12*1024**2});
  for(let i=0;i<30;i++){const p=(i*400*240+60*400+65+i)*3;assert.ok(polygonPixels.subarray(p,p+3).every(v=>v<25));}
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
