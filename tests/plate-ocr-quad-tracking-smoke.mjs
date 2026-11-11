// Local QA only; never modifies the user's project or confirms privacy review.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {createPlatePrivacy} from '../src/services/plate-privacy.mjs';
assert.ok(process.argv.includes('--run-local'),'Use --run-local for actual QA tracking.');
const ocr=JSON.parse(fs.readFileSync('docs/PLATE_OCR_QUAD_SMOKE.json')),prior=JSON.parse(fs.readFileSync('docs/PLATE_FRAME_CLOCK_OCR_SMOKE.json'));
const original=path.join(prior.sourceQA,'inputs/raw.mp4'),projectFile=path.join(prior.sourceQA,'project.json'),hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),before=[hash(original),hash(projectFile)];
const manual=JSON.parse(fs.readFileSync(projectFile)).segments[0].platePrivacy.quads;
const cases=[];
for(const [name,from,duration,quads] of [['raw-ocr',.74,1,[ocr.result.proposals[0].quad]],['previously-reviewed-manual',0,2,manual]]){
 const dir=fs.mkdtempSync(path.resolve('workspace/cache/plate-quad-track-'));fs.mkdirSync(path.join(dir,'inputs'));fs.copyFileSync(original,path.join(dir,'inputs/raw.mp4'));
 const project={source:{video:'inputs/raw.mp4'},segments:[{in:0,out:3}],brolls:[{id:'qa',src:'inputs/raw.mp4',at:0,dur:duration,mediaStart:from}]},snapshot=structuredClone(project);
 const record={name,dir,from,duration,quads};
 try{
  const result=await createPlatePrivacy(process.cwd(),dir,project,{brollId:'qa',quads});const tracks=JSON.parse(fs.readFileSync(path.join(dir,path.dirname(result.path),'tracks.json')));
  assert.deepEqual(result.provenance.quads,quads);assert.equal(result.provenance.requiresVisualReview,true);assert.equal(tracks.frames.length,duration*30);
  record.result=result;record.frames=tracks.frames.length;record.sampling=tracks.sampling;
  const contact=`docs/PLATE_QUAD_TRACK_${name.toUpperCase().replaceAll('-','_')}.jpg`;
  execFileSync('ffmpeg',['-nostdin','-v','error','-y','-i',path.join(dir,result.path),'-vf',`fps=${4/duration},scale=180:320,tile=4x1`,'-frames:v','1',contact],{windowsHide:true});record.contact=contact;
 }catch(error){record.error=error.message;if(name!=='raw-ocr')throw error;assert.equal(fs.readdirSync(path.join(dir,'inputs/privacy')).length,0);}
 assert.deepEqual(project,snapshot);assert.equal(fs.existsSync(path.join(dir,'work/plate-review.json')),false);assert.equal(hash(path.join(dir,'inputs/raw.mp4')),before[0]);cases.push(record);
}
assert.deepEqual([hash(original),hash(projectFile)],before);
const evidence={cases,sourceAndProjectUnchanged:true,noReviewReceipt:true,scope:'Real local optical flow on QA copies: raw OCR and previously manually corrected quad. No automatic correction, full clip/privacy/final/UI acceptance.'};
fs.writeFileSync('docs/PLATE_OCR_QUAD_TRACKING_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
