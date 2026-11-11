import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {decodeSelectedPersonFrame,createSelectedPersonFrameDecoder} from '../src/services/selected-person-frame.mjs';import {measureSelectedPersonExposure} from '../src/services/selected-person-exposure.mjs';import {probeMediaMetadata} from '../src/services/media-metadata.mjs';
const ffmpeg=args=>execFileSync('ffmpeg',['-nostdin','-v','error',...args],{windowsHide:true});
test('low-FPS tail uses verified held final frame while measurement retains requested mask clock and files',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-person-fps-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));fs.mkdirSync(path.join(dir,'inputs'));fs.mkdirSync(path.join(dir,'work'));
 const src='inputs/a.mp4',file=path.join(dir,src);ffmpeg(['-f','lavfi','-i',"nullsrc=s=32x32:r=4:d=1,geq=lum='if(eq(N,3),200,40)':cb=128:cr=128",'-c:v','libx264','-pix_fmt','yuv420p',file]);
 const empty=ffmpeg(['-ss','0.9','-i',file,'-frames:v','1','-pix_fmt','rgba','-f','rawvideo','pipe:1']);assert.equal(empty.length,0,'reproduce EOF seek on video-only4fps');
 const metadata=await probeMediaMetadata(file),frame=await decodeSelectedPersonFrame(file,.9,8,8,{duration:metadata.duration}),reference=ffmpeg(['-ss','0.75','-i',file,'-frames:v','1','-vf','scale=8:8','-pix_fmt','rgba','-f','rawvideo','pipe:1']);assert.equal(frame.tailFallback,true);assert.equal(frame.decodedFrameTime,.75);assert.equal(frame.requestedTime,.9);assert.deepEqual(frame.rgba,reference);
 const first=await decodeSelectedPersonFrame(file,.25,8,8,{duration:metadata.duration});assert.equal(first.tailFallback,false);assert.ok(frame.rgba[0]>first.rgba[0]+100);
 const between=await decodeSelectedPersonFrame(file,.74,8,8,{duration:metadata.duration});assert.equal(between.decodedFrameTime,.5);assert.equal(between.tailFallback,false);assert.deepEqual(between.rgba,first.rgba,'Do not select the brighter upcoming frame at0.75 for mask time0.74');
 const bytes=fs.readFileSync(file),stat=fs.statSync(file),sha256=crypto.createHash('sha256').update(bytes).digest('hex'),selection={src,sha256,method:'sam2.1-tiny-point-prompt',from:0,fps:4,w:8,h:8,f:Array.from({length:4},()=>[64,1])},project={source:{video:src},segments:[{in:0,out:1}],camera:{beauty:{personSelections:[selection]}}};
 const faceFile=path.join(dir,'work/face.json');fs.writeFileSync(faceFile,JSON.stringify({v:2,tracks:[{src,fingerprint:{size:stat.size,mtimeMs:stat.mtimeMs,sha256},fps:4,idx:[1],f:Array(4).fill(null),skin:{w:8,h:8,f:Array.from({length:4},()=>[64,2])}}]}));const faceBefore=fs.readFileSync(faceFile),projectBefore=structuredClone(project);
 const result=await measureSelectedPersonExposure(dir,project,{src,sha256});assert.equal(result.times.length,4);assert.equal(result.tailFrames.length,1);assert.ok(result.tailFrames[0].requestedTime>.75);assert.equal(result.tailFrames[0].decodedFrameTime,.75);assert.deepEqual(fs.readFileSync(faceFile),faceBefore);assert.deepEqual(fs.readFileSync(file),bytes);assert.deepEqual(project,projectBefore);
 await assert.rejects(decodeSelectedPersonFrame(file,1.1,8,8,{duration:1}),/ngoài/);
 const controller=new AbortController();controller.abort();await assert.rejects(decodeSelectedPersonFrame(file,.9,8,8,{duration:1,signal:controller.signal}),{name:'AbortError'});
});

test('tail timestamp verification supports a nonzero source start without changing requested clock',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-person-offset-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'a.mkv');ffmpeg(['-f','lavfi','-i','color=gray:s=32x32:r=4:d=1','-c:v','libx264','-output_ts_offset','5',file]);
 const frame=await decodeSelectedPersonFrame(file,.9,8,8,{duration:1});assert.equal(frame.tailFallback,true);assert.equal(frame.decodedFrameTime,.75);assert.equal(frame.requestedTime,.9);
});

test('presentation-frame lookup handles VFR, exact boundaries and backward queries without borrowing future images',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-person-vfr-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'vfr.mkv');
 ffmpeg(['-f','lavfi','-i',"nullsrc=s=32x32:r=8:d=0.5,geq=lum='40+N*45':cb=128:cr=128,setpts='if(eq(N,0),0,if(eq(N,1),1,if(eq(N,2),5,10)))'",'-fps_mode','vfr','-c:v','libx264','-pix_fmt','yuv420p',file]);
 const metadata=await probeMediaMetadata(file),decode=createSelectedPersonFrameDecoder(file,{duration:metadata.duration});
 const reference=[];for(const at of [0,.125,.625,1.25])reference.push(await decode(at,8,8));
 for(const [time,index] of [[.12,0],[.6,1],[1.24,2],[1.26,3],[.125,1],[.02,0]]){
  const frame=await decode(time,8,8);assert.equal(frame.decodedFrameTime,[0,.125,.625,1.25][index]);assert.deepEqual(frame.rgba,reference[index].rgba);assert.equal(frame.requestedTime,time);
 }
 await assert.rejects(decode(NaN,8,8),/ngoài/);await assert.rejects(decode(.1,0,8),/Kích thước/);
});
