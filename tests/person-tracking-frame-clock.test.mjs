import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import test from 'node:test';import {execFileSync} from 'node:child_process';
const options={windowsHide:true,maxBuffer:8*1048576},python=path.resolve('tools/sam2-python/python.exe');
const ff=args=>execFileSync('ffmpeg',['-nostdin','-v','error',...args],options);
function sample(file,start,duration=.25,fps=8){
 const script="import sys,json;sys.path.insert(0,'editor/tools');from person_tracking_frames import tracking_decode_command;print(json.dumps(tracking_decode_command(sys.argv[1],float(sys.argv[2]),float(sys.argv[3]),float(sys.argv[4]))))";
 const [command,sampling]=JSON.parse(execFileSync(python,['-X','utf8','-c',script,file,String(start),String(duration),String(fps)],options));
 const vf=command.indexOf('-vf');command[vf+1]=command[vf+1].replace('scale=640:640:force_original_aspect_ratio=decrease','scale=8:8');
 const index=command.indexOf('-f');command.splice(index,command.length-index,'-pix_fmt','rgb24','-f','rawvideo','pipe:1');
 return {buffer:execFileSync(command[0],command.slice(1),options),sampling};
}
test('tracker samples the presented frame at unaligned start and following ticks, including offset and tail',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-track-clock-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 for(const offset of [0,5]){
  const file=path.join(dir,`offset-${offset}.mkv`);ff(['-f','lavfi','-i',"nullsrc=s=32x32:r=4:d=2,geq=lum='40+N*20':cb=128:cr=128",'-c:v','libx264','-pix_fmt','yuv420p','-output_ts_offset',String(offset),file]);
  const actual=sample(file,.74);assert.equal(actual.sampling.firstSourceFrameTime,.5);assert.equal(actual.buffer.length,2*192);
  const expected=[.5,.75].map(at=>ff(['-ss',String(at),'-i',file,'-frames:v','1','-vf','scale=8:8','-pix_fmt','rgb24','-f','rawvideo','pipe:1']));
  assert.deepEqual(actual.buffer,Buffer.concat(expected));
  const tail=sample(file,1.8,.2);assert.equal(tail.buffer.length,2*192);assert.equal(tail.sampling.firstSourceFrameTime,1.75);
  const fractional=sample(file,.74,.2);assert.equal(fractional.buffer.length,2*192);
 }
});
