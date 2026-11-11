// Local QA copy only. Never applies a mask to the user's open project or
// creates a privacy review receipt. Output requires visual inspection.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {createPlatePrivacy} from '../src/services/plate-privacy.mjs';
assert.ok(process.argv.includes('--run-local'),'Use --run-local for actual local plate processing.');
const ocr=JSON.parse(fs.readFileSync('docs/PLATE_FRAME_CLOCK_OCR_SMOKE.json'));
const original=path.join(ocr.sourceQA,'inputs/raw.mp4'),hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),before=hash(original);
const dir=fs.mkdtempSync(path.resolve('workspace/cache/plate-frame-clock-'));fs.mkdirSync(path.join(dir,'inputs'));fs.copyFileSync(original,path.join(dir,'inputs/raw.mp4'));
const project={source:{video:'inputs/raw.mp4'},segments:[{in:0,out:2}],brolls:[{id:'qa',src:'inputs/raw.mp4',at:0,dur:1,mediaStart:.74}]},projectBefore=structuredClone(project);
const result=await createPlatePrivacy(process.cwd(),dir,project,{brollId:'qa',roi:ocr.result.proposals[0].roi});
const tracks=JSON.parse(fs.readFileSync(path.join(dir,path.dirname(result.path),'tracks.json')));
assert.equal(tracks.frames.length,30);assert.equal(tracks.sampling.firstSourceFrameTime,ocr.result.sampling.firstSourceFrameTime);assert.equal(result.provenance.requiresVisualReview,true);
assert.equal(hash(original),before);assert.equal(hash(path.join(dir,'inputs/raw.mp4')),before);assert.deepEqual(project,projectBefore);
assert.equal(fs.existsSync(path.join(dir,'work/plate-review.json')),false);
const output=path.join(dir,result.path),contact='docs/PLATE_FRAME_CLOCK_REAL_CONTACT.jpg';
execFileSync('ffmpeg',['-nostdin','-v','error','-y','-i',output,'-vf','fps=4,scale=180:320,tile=4x1','-frames:v','1',contact],{windowsHide:true,maxBuffer:1048576});
const evidence={scratch:dir,output,result,sampling:tracks.sampling,frames:tracks.frames.length,sourceUnchanged:true,projectUnchanged:true,privacyReviewReceipt:false,contact,scope:'Real car QA copy, one second at unaligned0.74; OCR ROI is broad and needs manual correction. No full-clip privacy, all-plate coverage, final-render or UI acceptance.'};
fs.writeFileSync('docs/PLATE_FRAME_CLOCK_REAL_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify({scratch:dir,frames:tracks.frames.length,sampling:tracks.sampling,sourceUnchanged:true,privacyReviewReceipt:false}));
