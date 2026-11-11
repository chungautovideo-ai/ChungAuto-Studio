import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {capcutWatermarkPlacement,packageCapcutWatermark} from '../editor/lib/capcut-watermark.mjs';
test('CapCut logo geometry matches portrait and landscape builder margins, aspect and opacity',()=>{
 const w={file:'logo.png',position:'bottom-right',heightPercent:5,marginPercent:4,opacity:.7};
 for(const frame of [{width:1080,height:1920},{width:1920,height:1080}]){
 const p=capcutWatermarkPlacement(w,frame,{width:160,height:80},3),m=Math.round(frame.width*.04),h=Math.round(frame.height*.05);
 assert.equal(p.height,h);assert.equal(p.width,h*2);assert.equal(p.x,frame.width-m-h*2);assert.equal(p.y,frame.height-m-h);assert.equal(p.opacity,.7);assert.equal(p.duration,3);
 }
 assert.equal(capcutWatermarkPlacement(null,{}, {},3),null);assert.equal(capcutWatermarkPlacement({...w,hidden:true},{},{},3),null);
 assert.throws(()=>capcutWatermarkPlacement(w,{width:1080,height:1920},{width:0,height:80},3));
});
test('CapCut package copies original logo bytes and rejects escaping paths before writing',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-logo-'));try{
 const out=path.join(root,'out');execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=red:s=160x80','-frames:v','1',path.join(root,'logo.png')],{windowsHide:true});
 const p=packageCapcutWatermark({watermark:{file:'logo.png'}},root,out,{width:1080,height:1920},2);
 assert.deepEqual(fs.readFileSync(path.join(out,p.manifest.file)),fs.readFileSync(path.join(root,'logo.png')));assert.deepEqual(JSON.parse(fs.readFileSync(path.join(out,'6-logo/vi-tri-logo.json'))),p.manifest);assert.match(p.instruction,/chưa chứa logo/);
 assert.throws(()=>packageCapcutWatermark({watermark:{file:'../logo.png'}},root,out,{width:1080,height:1920},2));
 const hidden=path.join(root,'hidden');assert.equal(packageCapcutWatermark({watermark:{file:'missing.png',hidden:true}},root,hidden,{},2),null);assert.equal(fs.existsSync(hidden),false);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
