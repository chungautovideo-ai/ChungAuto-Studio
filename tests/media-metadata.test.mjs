import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {probeMediaMetadata} from '../src/services/media-metadata.mjs';
test('metadata reads real image and audio and rejects invalid or expired source',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-media-probe-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const image=path.join(root,'ảnh.png'),audio=path.join(root,'lời.wav');
 execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=red:s=64x48','-frames:v','1',image],{windowsHide:true});
 execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=440:duration=1','-ar','24000',audio],{windowsHide:true});
 const photo=await probeMediaMetadata(image);assert.equal(photo.kind,'image');assert.equal(photo.width,64);assert.equal(photo.height,48);
 const voice=await probeMediaMetadata(audio);assert.equal(voice.kind,'audio');assert.equal(voice.sampleRate,24000);assert.equal(voice.channels,1);assert.equal(voice.hasAudio,true);assert.ok(voice.duration>=1);
 let checks=0;await assert.rejects(probeMediaMetadata(audio,{validate:()=>{if(++checks>1)throw new Error('expired');}}),/expired/);
 const bad=path.join(root,'bad.mp4');fs.writeFileSync(bad,'invalid');await assert.rejects(probeMediaMetadata(bad));
});
