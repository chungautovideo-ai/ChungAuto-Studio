import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {measureSelectedPersonExposure} from '../src/services/selected-person-exposure.mjs';

test('real FFprobe rejects HLG/PQ selected-person measurements and allows SDR with no project/mask writes',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'person-hdr-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));fs.mkdirSync(path.join(dir,'inputs'));fs.mkdirSync(path.join(dir,'work'));
 for(const transfer of ['arib-std-b67','smpte2084','bt709']){
  const src=`inputs/${transfer}.mp4`,file=path.join(dir,src),hdr=transfer!=='bt709';
  execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','color=c=gray:s=32x32:r=30:d=1','-c:v','libx264','-x264-params',`colorprim=${hdr?'bt2020':'bt709'}:transfer=${transfer}:colormatrix=${hdr?'bt2020nc':'bt709'}`,'-pix_fmt','yuv420p','-color_trc',transfer,'-color_primaries',hdr?'bt2020':'bt709','-colorspace',hdr?'bt2020nc':'bt709',file],{windowsHide:true});
  const media=fs.readFileSync(file),stat=fs.statSync(file),sha256=crypto.createHash('sha256').update(media).digest('hex');
  const selection={src,sha256,method:'sam2.1-tiny-point-prompt',from:0,fps:4,w:8,h:8,f:Array.from({length:4},()=>[64,1])},project={source:{video:src},segments:[{in:0,out:1}],camera:{beauty:{personSelections:[selection]}}};
  const face={v:2,tracks:[{src,fingerprint:{size:stat.size,mtimeMs:stat.mtimeMs,sha256},fps:4,idx:[1],f:Array(4).fill(null),skin:{w:8,h:8,f:Array.from({length:4},()=>[64,2])}}]},faceFile=path.join(dir,'work/face.json');fs.writeFileSync(faceFile,JSON.stringify(face));const before=fs.readFileSync(faceFile),projectBefore=JSON.stringify(project);
  if(hdr)await assert.rejects(measureSelectedPersonExposure(dir,project,{src,sha256}),e=>e.code==='COLOR_NORMALIZATION_REQUIRED'&&e.status===422&&/quét\/chọn lại/.test(e.message));
  else {const result=await measureSelectedPersonExposure(dir,project,{src,sha256});assert.equal(result.readOnly,true);assert.equal(result.times.length,4);assert.ok(result.exposure.person.samples>0||result.exposure.person.median>0);}
  assert.deepEqual(fs.readFileSync(faceFile),before);assert.deepEqual(fs.readFileSync(file),media);assert.equal(JSON.stringify(project),projectBefore);
 }
});
