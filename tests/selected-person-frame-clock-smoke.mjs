// Offline clock audit on a previously copied real speaker proxy. No project,
// render, GPU, browser, provider or workspace-store mutations.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createSelectedPersonFrameDecoder} from '../src/services/selected-person-frame.mjs';
import {probeMediaMetadata} from '../src/services/media-metadata.mjs';

const request=JSON.parse(fs.readFileSync('workspace/cache/person-sam2-motion6-body-request.json'));
const file=request.source,hash=()=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),before=hash();
const options={windowsHide:true,maxBuffer:32*1048576};
const metadata=await probeMediaMetadata(file),w=72,h=128,bytes=w*h*4;
const frames=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',file],options)).frames;
const times=frames.map(f=>Number(f.best_effort_timestamp_time));
assert.ok(times.every((time,i)=>Number.isFinite(time)&&(i===0||time>times[i-1])));
assert.equal(times[0],0,'Fixture source must have zero presentation origin.');
const sequential=execFileSync('ffmpeg',['-nostdin','-v','error','-i',file,'-map','0:v:0','-vf',`scale=${w}:${h}`,'-fps_mode','passthrough','-pix_fmt','rgba','-f','rawvideo','pipe:1'],options);
assert.equal(sequential.length,times.length*bytes);
const decode=createSelectedPersonFrameDecoder(file,{duration:metadata.duration}),samples=[];
for(const requestedTime of [.031,.25,.74,1.123,2.05,3.79,5.95,.12]){
 const index=times.findLastIndex(time=>time<=requestedTime+1e-7);
 assert.ok(index>=0);
 const frame=await decode(requestedTime,w,h),reference=sequential.subarray(index*bytes,(index+1)*bytes);
 assert.equal(frame.decodedFrameTime,times[index]);assert.deepEqual(frame.rgba,reference);
 const old=execFileSync('ffmpeg',['-nostdin','-v','error','-ss',String(requestedTime),'-i',file,'-map','0:v:0','-frames:v','1','-vf',`scale=${w}:${h}`,'-pix_fmt','rgba','-f','rawvideo','pipe:1'],options);
 samples.push({requestedTime,decodedFrameTime:frame.decodedFrameTime,sequentialFrame:index,bytesEqual:true,legacyNextSeekDiffers:!old.equals(reference)});
}
assert.equal(hash(),before);
assert.ok(samples.some(s=>s.legacyNextSeekDiffers),'Real fixture should expose the original next-frame mismatch.');
const evidence={source:file,sha256:before,sourceUnchanged:true,sequentialFrames:times.length,comparisonResolution:{w,h},samples,scope:'Exact decoded RGBA comparison against sequential FFmpeg on one six-second real speaker proxy; includes backward query and near end. Not mask quality, identity, skin color, camera HDR, UI, or final render acceptance.'};
fs.writeFileSync('docs/SELECTED_PERSON_FRAME_CLOCK_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify(evidence));
