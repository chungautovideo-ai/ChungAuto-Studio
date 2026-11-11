import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {liftSkinRgb,skinLiftCube,validateSkinLift} from '../src/services/skin-lift.mjs';
import {colorConversionPlan,normalizeColor,validateCube} from '../src/services/color-normalization.mjs';
import {applyColorNormalization,restoreColorNormalization} from '../editor/lib/color-management.js';
test('skin chroma lift preserves hue, neutrals and non-skin hues, protects highlights and validates bounded opt-in strength',()=>{
 const skin=[.48,.29,.21],lifted=liftSkinRgb(skin,.2);assert.ok(lifted[0]>skin[0]*1.1);assert.ok(Math.abs(lifted[0]/lifted[1]-skin[0]/skin[1])<1e-10);
 for(const rgb of [[.3,.3,.3],[.1,.2,.7],[.1,.6,.2],[.95,.9,.84]])assert.deepEqual(liftSkinRgb(rgb,.3),rgb);
 assert.deepEqual(liftSkinRgb(skin,0),skin);for(const invalid of [-.01,.31,NaN,'0.2',null])assert.throws(()=>validateSkinLift(invalid));
 assert.equal(validateCube(skinLiftCube(.2)).size,33);
 assert.equal(colorConversionPlan({},{profile:'rec709',skinLift:.2}).filters.at(-1),'lut3d=file=skin-lift.cube:interp=tetrahedral');
 assert.throws(()=>colorConversionPlan({},{profile:'rec709',skinLift:0}),/đã là/);
 assert.throws(()=>colorConversionPlan({},{profile:'applelog',skinLift:.2}),/LUT kỹ thuật/);
});
test('real FFmpeg selectively lifts skin-like patch while preserving blue/neutral patches, audio, source and undo',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'skin-lift-'));try{
  fs.mkdirSync(path.join(dir,'inputs'));const source='inputs/source.mp4',file=path.join(dir,source);
  execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=0x7a4a36:s=384x128:d=0.5,drawbox=x=128:y=0:w=128:h=128:c=0x444444:t=fill,drawbox=x=256:y=0:w=128:h=128:c=0x2040af:t=fill','-f','lavfi','-i','sine=frequency=440:duration=0.5','-c:v','libx264','-crf','10','-x264-params','colorprim=bt709:transfer=bt709:colormatrix=bt709','-c:a','aac','-shortest','-y',file],{windowsHide:true});
  const original=fs.readFileSync(file),project={source:{video:source},segments:[{id:'s',in:0,out:.5}],audio:{}};
  const result=await normalizeColor(dir,project,{kind:'segments',id:'s',skinLift:.25,encoder:'cpu'});
  const pixels=f=>execFileSync('ffmpeg',['-v','error','-i',f,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{windowsHide:true,maxBuffer:1024*1024});
  const before=pixels(file),after=pixels(path.join(dir,result.path)),at=(data,x)=>[...data.subarray((64*384+x)*3,(64*384+x)*3+3)];
  assert.ok(at(after,64)[0]-at(before,64)[0]>=15,JSON.stringify({before:at(before,64),after:at(after,64)}));
  for(const x of [192,320])for(let c=0;c<3;c++)assert.ok(Math.abs(at(after,x)[c]-at(before,x)[c])<=3);
  assert.equal(result.mediaInfo.hasAudio,true);assert.equal(result.provenance.skinLift.amount,.25);assert.equal(result.mediaInfo.colorMetadata.transfer,'bt709');assert.deepEqual(fs.readFileSync(file),original);
  const applied=applyColorNormalization(project,'segments','s',result);assert.equal(applied.segments[0].colorNormalization.skinLift.amount,.25);assert.equal(restoreColorNormalization(applied,'segments','s').segments[0].src,undefined);assert.equal(project.segments[0].src,undefined);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
