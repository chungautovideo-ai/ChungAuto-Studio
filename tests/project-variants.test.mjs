import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createProjectVariant} from '../src/services/project-variants.mjs';import {projectRevision} from '../src/services/project-revisions.mjs';
test('variants retain editable media and provenance independently, exclude jobs/secrets, reject stale revision/workspace/format/escapes',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-variants-')),dir='workspace/content/2026-11-04/source',source=path.join(root,dir);let active='default';const store={active:()=>({id:active})};
 try{
  fs.mkdirSync(path.join(source,'inputs'),{recursive:true});fs.mkdirSync(path.join(source,'work'));
  fs.writeFileSync(path.join(source,'inputs/source.mp4'),'synthetic');fs.writeFileSync(path.join(source,'inputs/unused.png'),'unused');fs.writeFileSync(path.join(source,'inputs/secret.env'),'never copy');fs.writeFileSync(path.join(source,'work/ai-job.json'),'{}');fs.writeFileSync(path.join(source,'work/transcript.json'),'{"words":[]}');
  fs.writeFileSync(path.join(source,'work/phone-assets.json'),JSON.stringify({assets:[{id:'phone',path:'inputs/unused.png'}]}));
  const pj={workspaceId:'default',title:'Bản gốc',format:'9:16',source:{video:'inputs/source.mp4',duration:1,width:360,height:640,hasAudio:false},segments:[{id:'s',in:0,out:1,keep:true}],audio:{autoSfx:false,sfxLevel:'tat'},captions:{lines:[]}};
  const file=path.join(source,'project.json');fs.writeFileSync(file,JSON.stringify(pj));const revision=projectRevision(file),request={workspaceId:'default',dir,revision,format:'16:9'};
  const result=await createProjectVariant(root,store,request),target=path.join(root,result.dir),copy=JSON.parse(fs.readFileSync(path.join(target,'project.json')));
  assert.equal(copy.format,'16:9');assert.equal(copy.contentos.variant.sourceRevision,revision);assert.equal(projectRevision(file),revision);assert.ok(fs.existsSync(path.join(target,'index.html')));assert.ok(fs.existsSync(path.join(target,'inputs/unused.png')));assert.ok(fs.existsSync(path.join(target,'work/transcript.json')));assert.equal(fs.existsSync(path.join(target,'work/ai-job.json')),false);assert.equal(fs.existsSync(path.join(target,'inputs/secret.env')),false);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(target,'work/phone-assets.json'))),{assets:[{id:'phone',path:'inputs/unused.png'}]});
  fs.writeFileSync(path.join(target,'inputs/source.mp4'),'edited');assert.equal(fs.readFileSync(path.join(source,'inputs/source.mp4'),'utf8'),'synthetic');
  const dataProject={...pj,texts:[{id:'product',title:'{{product}}',at:0,dur:1}]};fs.writeFileSync(file,JSON.stringify(dataProject));
  const dataRevision=projectRevision(file),dataResult=await createProjectVariant(root,store,{...request,revision:dataRevision,variables:{product:'Sản phẩm A'}}),dataCopy=JSON.parse(fs.readFileSync(path.join(root,dataResult.dir,'project.json'),'utf8'));
  assert.equal(dataCopy.texts[0].title,'Sản phẩm A');assert.equal(dataCopy.contentos.variant.variables.product,'Sản phẩm A');assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).texts[0].title,'{{product}}');
  await assert.rejects(createProjectVariant(root,store,{...request,revision:dataRevision,variables:{unknown:'wrong'}}),/Thiếu biến|Không tìm thấy/);fs.writeFileSync(file,JSON.stringify(pj));
  await assert.rejects(createProjectVariant(root,store,{...request,revision:'stale'}),/thay đổi/);await assert.rejects(createProjectVariant(root,store,{...request,format:'1:1'}),/tỷ lệ/);
  active='other';await assert.rejects(createProjectVariant(root,store,request),/Workspace/);active='default';
  fs.writeFileSync(file,JSON.stringify({...pj,source:{...pj.source,video:'../../../../outside.mp4'}}));await assert.rejects(createProjectVariant(root,store,{...request,revision:projectRevision(file)}));
  assert.equal(fs.readdirSync(path.join(root,'workspace/content/_intake')).length,0);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
