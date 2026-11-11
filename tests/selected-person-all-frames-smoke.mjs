// Offline temporal audit of existing QA exports. No server/browser/render/model calls.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {selectedSemanticMask} from '../src/services/selected-person-exposure.mjs';
import {verifyArtifact} from '../src/services/artifact-integrity.mjs';

const prior=JSON.parse(fs.readFileSync('docs/SELECTED_PERSON_FINAL_SMOKE.json'));
const projects=prior.projects.map(dir=>JSON.parse(fs.readFileSync(path.join(dir,'project.json'))));
const [baseline,lift]=projects,src=baseline.source.video;
assert.deepEqual(baseline.segments,[{id:'s1',in:0,out:6.006,keep:true,text:''}], 'This audit requires the uncut QA source clock.');
assert.deepEqual(lift.segments,baseline.segments);
const normalized=structuredClone(lift);
normalized.title=baseline.title;
normalized.camera.beauty.sourceAdjustments.find(s=>s.src===src).personLight=0;
assert.deepEqual(normalized,baseline,'Only title and selected-person lift may differ.');
const faces=prior.projects.map(dir=>JSON.parse(fs.readFileSync(path.join(dir,'work/face.json'))));
const tracks=faces.map(f=>f.tracks.find(t=>t.src===src));
assert.deepEqual(tracks[0].skin,tracks[1].skin);
assert.equal(tracks[0].fingerprint.sha256,tracks[1].fingerprint.sha256);
const track=tracks[0],{w,h}=track.skin,bytes=w*h*3;
const fingerprints=prior.outputs.map(file=>verifyArtifact(file,JSON.parse(fs.readFileSync(file+'.json'))));
const probe=file=>JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',file],{windowsHide:true,maxBuffer:1024*1024})).frames.map(f=>Number(f.best_effort_timestamp_time));
const timestamps=prior.outputs.map(probe);
assert.deepEqual(timestamps[0],timestamps[1]);
assert.ok(timestamps[0].length>=180);
assert.ok(timestamps[0].every((t,i,a)=>Number.isFinite(t)&&(i===0||t>a[i-1])));
const decoded=prior.outputs.map(file=>execFileSync('ffmpeg',['-nostdin','-v','error','-i',file,'-map','0:v:0','-vf',`scale=${w}:${h}`,'-fps_mode','passthrough','-pix_fmt','rgb24','-f','rawvideo','pipe:1'],{windowsHide:true,maxBuffer:128*1024*1024}));
for(const buffer of decoded)assert.equal(buffer.length,timestamps[0].length*bytes);
const comparisons=[],inactive=[],unmeasured=[],stride=w+1,radius=4;
for(const [frame,time] of timestamps[0].entries()){
 const mask=selectedSemanticMask(track,baseline.camera.beauty.personSelections,time);
 if(!mask){unmeasured.push({frame,time,reason:'No semantic sample'});continue;}
 const selectionActive=baseline.camera.beauty.personSelections.some(s=>s.src===src&&s.sha256===track.fingerprint.sha256&&time>=s.from&&time<s.from+s.f.length/s.fps);
 if(!selectionActive){
  // An explicit gap must disable the correction, not borrow a previous mask.
  assert.ok(mask.runs.every((n,i)=>i%2===0||n===0),'Selection gap must have no semantic correction region.');
  let absoluteDifference=0,changedOver8=0;
  for(let p=0;p<w*h;p++){let changed=false;for(let c=0;c<3;c++){const d=Math.abs(decoded[1][frame*bytes+p*3+c]-decoded[0][frame*bytes+p*3+c]);absoluteDifference+=d;if(d>8)changed=true;}if(changed)changedOver8++;}
  inactive.push({frame,time,absoluteDifference:absoluteDifference/bytes,changedFraction:changedOver8/(w*h),expected:'Correction off outside saved selection; codec differences tolerated up to mean RGB 1 and 0.1% pixels over 8.'});
  continue;
 }
 const labels=new Uint8Array(w*h);let pos=0;
 for(let i=0;i<mask.runs.length;i+=2){labels.fill(mask.runs[i+1]>0?1:0,pos,pos+mask.runs[i]);pos+=mask.runs[i];}
 const integral=new Uint32Array((w+1)*(h+1));
 for(let y=0;y<h;y++){let row=0;for(let x=0;x<w;x++){row+=labels[y*w+x];integral[(y+1)*stride+x+1]=integral[y*stride+x+1]+row;}}
 const stats={person:{count:0,lumaGain:0,absoluteDifference:0,changedOver8:0},background:{count:0,lumaGain:0,absoluteDifference:0,changedOver8:0}};
 for(let y=radius+1;y<h-radius-1;y++)for(let x=radius+1;x<w-radius-1;x++){
  const x0=x-radius,y0=y-radius,x1=x+radius+1,y1=y+radius+1;
  const area=integral[y1*stride+x1]-integral[y0*stride+x1]-integral[y1*stride+x0]+integral[y0*stride+x0];
  const region=area===(2*radius+1)**2?stats.person:area===0?stats.background:null;
  if(!region)continue;
  const i=frame*bytes+(y*w+x)*3,delta=[0,1,2].map(c=>decoded[1][i+c]-decoded[0][i+c]);
  region.count++;region.lumaGain+=.2126*delta[0]+.7152*delta[1]+.0722*delta[2];
  region.absoluteDifference+=delta.reduce((s,n)=>s+Math.abs(n),0)/3;
  if(delta.some(n=>Math.abs(n)>8))region.changedOver8++;
 }
 if(Object.values(stats).some(s=>s.count<=50)){unmeasured.push({frame,time,reason:'Insufficient safe mask interiors',counts:Object.fromEntries(Object.entries(stats).map(([k,v])=>[k,v.count]))});continue;}
 for(const region of Object.values(stats)){region.lumaGain/=region.count;region.absoluteDifference/=region.count;region.changedFraction=region.changedOver8/region.count;}
 comparisons.push({frame,time,...stats});
}
const failures=comparisons.filter(c=>c.person.lumaGain<=0||c.person.lumaGain<=c.background.lumaGain);
const inactiveFailures=inactive.filter(c=>c.absoluteDifference>1||c.changedFraction>.001);
const report={outputs:prior.outputs,fingerprints,totalDecodedFrames:timestamps[0].length,measuredFrames:comparisons.length,inactive,unmeasured,failures,inactiveFailures,
 summary:comparisons.length?{minimumPersonLumaGain:Math.min(...comparisons.map(c=>c.person.lumaGain)),maximumBackgroundAbsoluteDifference:Math.max(...comparisons.map(c=>c.background.absoluteDifference)),maximumBackgroundChangedFraction:Math.max(...comparisons.map(c=>c.background.changedFraction)),worstBackgroundFrame:comparisons.reduce((a,b)=>a.background.absoluteDifference>b.background.absoluteDifference?a:b)}:null,
 comparisons,scope:'Every decoded frame of two existing six-second QA final exports, same masks and smoothing, personLight 0 vs 30. Measures safe interiors at semantic-mask resolution, excludes 4-pixel boundary. Not a new render of current code, skin-tone/identity/occlusion/preview parity or production acceptance.'};
fs.writeFileSync('docs/SELECTED_PERSON_ALL_FRAMES_SMOKE.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,comparisons:undefined}));
assert.equal(unmeasured.length,0,'Do not count skipped frames as accepted.');
assert.equal(failures.length,0,'Lift must concentrate on person at every measurable frame.');
assert.equal(inactiveFailures.length,0,'Correction must stop outside saved selections.');
assert.equal(comparisons.length+inactive.length,timestamps[0].length);
