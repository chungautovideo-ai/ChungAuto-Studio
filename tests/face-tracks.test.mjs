import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import test from 'node:test';
import {faceSourceManifest,saveFaceTracks,readFaceTracks,faceSources} from '../src/services/face-tracks.mjs';import {buildHtml} from '../editor/lib/build.mjs';
test('face scans bind exact A-roll sources and bytes; stale, legacy, foreign and malformed scans cannot be rendered',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'face-tracks-'));try{
  fs.mkdirSync(path.join(dir,'inputs'));for(const name of ['a','b'])fs.writeFileSync(path.join(dir,'inputs/'+name+'.mp4'),name);
  const p={source:{video:'inputs/a.mp4'},segments:[{id:'a',in:0,out:1},{id:'b',src:'inputs/b.mp4',mediaStart:0,mediaInfo:{width:320,height:180,duration:1},in:1,out:2}],camera:{beauty:{white:20}}};
  const manifest=faceSourceManifest(dir,p),idx=Array.from({length:478},(_,n)=>n),frame=idx.flatMap(()=>[5000,5000]),tracks=manifest.map(s=>({...s,fps:15,w:320,h:180,idx,f:[frame,null]}));
  let status=saveFaceTracks(dir,p,{v:2,tracks});assert.equal(status.tracks.length,2);assert.equal(status.missing.length,0);assert.equal(status.found,2);assert.ok(buildHtml(p,dir).includes('data-face-source="inputs/b.mp4"'));
  const html=buildHtml(p,dir);assert.ok(html.includes('window.__FACE = {"v":2,"tracks":'));assert.ok(html.includes('beautyCv'));
  const body={...tracks[0],skin:{w:2,h:2,f:[[1,0,1,1,2,2],[4,0]]}};
  assert.equal(saveFaceTracks(dir,p,{v:2,tracks:[body]}).bodySources,1);
  assert.throws(()=>saveFaceTracks(dir,p,{v:2,tracks:[{...body,skin:{...body.skin,f:[[3,2],[4,0]]}}]}),/thiếu điểm/);
  assert.throws(()=>saveFaceTracks(dir,p,{v:2,tracks:[{...body,skin:{...body.skin,f:[[4,7],[4,0]]}}]}),/Nhãn/);
  assert.throws(()=>saveFaceTracks(dir,p,{v:2,tracks:[{...body,skin:{...body.skin,w:999}}]}),/Kích thước/);
  saveFaceTracks(dir,p,{v:2,tracks});
  fs.appendFileSync(path.join(dir,'inputs/b.mp4'),'changed');status=readFaceTracks(dir,p);assert.equal(status.tracks.length,1);assert.deepEqual(status.missing,['inputs/b.mp4']);assert.throws(()=>saveFaceTracks(dir,p,{v:2,tracks}),/đã đổi/);
  assert.throws(()=>saveFaceTracks(dir,p,{v:2,tracks:[{...tracks[0],src:'inputs/foreign.mp4'}]}),/không thuộc/);
  assert.throws(()=>saveFaceTracks(dir,p,{v:2,tracks:[{...tracks[0],f:[[NaN]]}]}),/Tọa độ/);
  assert.throws(()=>saveFaceTracks(dir,p,{v:2,tracks:[{...tracks[0],idx:idx.slice(0,90)}]}),/Thiếu điểm/);
  fs.writeFileSync(path.join(dir,'work/face.json'),JSON.stringify({v:1,idx,f:[frame],fps:15}));assert.equal(readFaceTracks(dir,p).legacy,true);assert.equal(readFaceTracks(dir,p).tracks.length,0);assert.ok(!buildHtml(p,dir).includes('window.__FACE ='));
  assert.throws(()=>saveFaceTracks(dir,p,{v:2,tracks:[tracks[0]]},{validate:()=>{throw new Error('changed project');}}),/changed project/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('face sources include visible B-roll videos once and omit images and hidden clips',()=>{
 const p={source:{video:'inputs/a.mp4'},segments:[{in:0,out:1},{src:'inputs/skip.mp4',keep:false}],brolls:[{id:'b',src:'inputs/b.MOV'},{src:'inputs/a.mp4'},{src:'inputs/still.png'},{src:'inputs/hidden.mp4',hidden:true}]};
 assert.deepEqual(faceSources(p),['inputs/a.mp4','inputs/b.MOV']);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'face-broll-'));try{
 fs.mkdirSync(path.join(dir,'inputs'));fs.writeFileSync(path.join(dir,'inputs/a.mp4'),'a');fs.writeFileSync(path.join(dir,'inputs/b.MOV'),'b');p.brolls=p.brolls.slice(0,1).map(b=>({...b,at:0,dur:1}));
 const manifest=faceSourceManifest(dir,p),idx=Array.from({length:478},(_,i)=>i),tracks=manifest.map(s=>({...s,fps:15,w:320,h:180,idx,f:[null],skin:{w:2,h:2,f:[[4,2]]}}));
  tracks[1].fps=30;
  const saved=saveFaceTracks(dir,p,{v:2,tracks});assert.equal(saved.bodySources,2);assert.deepEqual(saved.scanRates,[15,30]);p.camera={beauty:{bodyWhite:20}};const html=buildHtml(p,dir);assert.match(html,/class="broll [^"]*" data-face-source="inputs\/b.MOV"/);
 fs.appendFileSync(path.join(dir,'inputs/b.MOV'),'changed');assert.deepEqual(readFaceTracks(dir,p).missing,['inputs/b.MOV']);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
