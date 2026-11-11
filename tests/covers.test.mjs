import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Readable} from 'node:stream';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
import {saveCover,readCoverComposition} from '../src/services/covers.mjs';

test('cover stores decoded output and provenance; rejects stale revisions and invalid input without final artifacts',async()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-cover-'));
 try{
  fs.writeFileSync(path.join(folder,'project.json'),JSON.stringify({workspaceId:'qa',format:'16:9',source:{video:'inputs/source.mp4'}}));
  const fixture=path.join(folder,'fixture.jpg');
  execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','color=c=blue:s=1920x1080','-frames:v','1',fixture],{windowsHide:true});
  const data=fs.readFileSync(fixture),metadata={source:{kind:'image',id:'fixture'},composition:{title:'Ảnh kiểm thử',subtitle:'Phụ đề',cta:'Xem ngay',size:140,pos:'top',look:'mau',align:'right',stats:[{value:'24 tháng',label:'Bảo hành'}]}};
  let checks=0;
  const hash=crypto.createHash('sha256').update(data).digest('hex');
  const options={projectDir:folder,metadata,validate:()=>{checks++;},resolveImage:(workspace,id)=>{assert.equal(workspace,'qa');assert.equal(id,'fixture');return {file:fixture,meta:{id,sha256:hash}};}};
  const saved=await saveCover({...options,stream:Readable.from([data])});
  assert.equal(checks,2);assert.deepEqual(fs.readFileSync(saved.file),data);
  const record=JSON.parse(fs.readFileSync(saved.file.replace(/\.jpg$/,'.json'),'utf8'));
  assert.equal(record.source.id,'fixture');assert.equal(record.source.workspaceId,'qa');assert.equal(record.width,1920);assert.equal(record.composition.title,'Ảnh kiểm thử');
  assert.equal(record.composition.subtitle,'Phụ đề');assert.equal(record.composition.cta,'Xem ngay');
  const reopened=readCoverComposition({...options,workspaceId:'qa',name:saved.name});assert.deepEqual(reopened.composition,metadata.composition);assert.equal(reopened.source.id,'fixture');
  fs.appendFileSync(fixture,'tamper');assert.throws(()=>readCoverComposition({...options,workspaceId:'qa',name:saved.name}),/đã đổi/);fs.writeFileSync(fixture,data);
  await assert.rejects(saveCover({...options,stream:Readable.from([data]),resolveImage:()=>({file:fixture,meta:{id:'fixture',sha256:'wrong-hash'}})}),/đã đổi/);
  assert.throws(()=>readCoverComposition({...options,workspaceId:'other',name:saved.name}));
  const files=()=>fs.readdirSync(path.join(folder,'renders')).sort();const before=files();
  let staleChecks=0;
  await assert.rejects(saveCover({...options,stream:Readable.from([data]),validate:()=>{if(++staleChecks===2)throw new Error('stale revision');}}),/stale revision/);
  assert.deepEqual(files(),before);
  await assert.rejects(saveCover({...options,stream:Readable.from([Buffer.from('invalid')])}),/JPEG/);
  await assert.rejects(saveCover({...options,stream:Readable.from([Buffer.alloc(13*1024**2)])}),/12 MB/);
  await assert.rejects(saveCover({...options,metadata:{...metadata,source:{kind:'video-frame',video:'other.mp4',time:1}},stream:Readable.from([data])}),/khung video/);
  assert.deepEqual(files(),before);
  const frame=await saveCover({...options,metadata:{...metadata,source:{kind:'video-frame',video:'inputs/source.mp4',time:1.5}},stream:Readable.from([data])});
  assert.equal(frame.metadata.source.kind,'video-frame');assert.equal(frame.name,'anh-bia-2.jpg');
  fs.mkdirSync(path.join(folder,'inputs'));fs.writeFileSync(path.join(folder,'inputs/source.mp4'),'fixture video');
  assert.equal(readCoverComposition({...options,workspaceId:'qa',name:frame.name}).source.time,1.5);
  fs.writeFileSync(path.join(folder,'project.json'),JSON.stringify({workspaceId:'qa',format:'9:16',source:{video:'inputs/source.mp4'}}));assert.throws(()=>readCoverComposition({...options,workspaceId:'qa',name:frame.name}),/Tỷ lệ/);
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
});
