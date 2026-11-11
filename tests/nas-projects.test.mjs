import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import test from 'node:test';import assert from 'node:assert/strict';
import {createWorkspaceStore} from '../src/services/workspaces.mjs';import {createStorageService} from '../src/services/storage.mjs';import {createNasProject} from '../src/services/nas-projects.mjs';
import {createSourcePreview} from '../src/services/source-preview.mjs';
import {copySourceSurvey} from '../src/services/source-survey.mjs';
test('NAS primary video creates a local editable project with provenance; bad input cleans staging',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-nas-project-'));try{
  const nas=path.join(root,'nas source có dấu');fs.mkdirSync(nas);const fixture=fs.readFileSync(new URL('./fixture.mp4',import.meta.url));fs.writeFileSync(path.join(nas,'video có dấu.mp4'),fixture);fs.writeFileSync(path.join(nas,'bad.mp4'),'invalid');fs.writeFileSync(path.join(nas,'photo.png'),'invalid');
  const store=createWorkspaceStore(root),id=store.active().id;store.update(id,{nasRoot:nas,brand:'QA'});const storage=createStorageService(root,store);
  const created=await createNasProject(root,store,storage,{workspaceId:id,relative:'video có dấu.mp4'});const dir=path.join(root,created.dir),project=JSON.parse(fs.readFileSync(path.join(dir,'project.json')));
  assert.equal(project.workspaceId,id);assert.ok(project.source.duration>0);assert.equal(project.contentos.pendingIntake,undefined);assert.equal(project.contentos.brandSnapshot,'QA');assert.ok(fs.existsSync(path.join(dir,'index.html')));assert.deepEqual(fs.readFileSync(path.join(dir,project.source.video)),fixture);assert.equal(created.asset.source.role,'aroll');assert.equal(created.asset.sha256.length,64);assert.deepEqual(fs.readFileSync(path.join(nas,'video có dấu.mp4')),fixture);
  for(const options of [{workspaceId:'wrong',relative:'video có dấu.mp4'},{workspaceId:id,relative:'../escape.mp4'},{workspaceId:id,relative:'photo.png'},{workspaceId:id,relative:'bad.mp4'}])await assert.rejects(createNasProject(root,store,storage,options));
  assert.deepEqual(fs.readdirSync(path.join(root,'workspace/content/_intake')),[]);
  store.update(id,{nasRoot:''});
  const selected=path.join(nas,'video có dấu.mp4'),text='A-roll: "'+selected+'"\nB-roll: "'+nas+'"';
  const preview=await createSourcePreview(root,id,text,selected);
  const fromPaths=await createNasProject(root,store,storage,{workspaceId:id,text,selected,previewManifest:preview.manifestPath});assert.ok(fromPaths.project.source.duration>0);
  const request=JSON.parse(fs.readFileSync(path.join(root,fromPaths.dir,'work/source-request.json')));assert.equal(request.text,text);assert.equal(request.sources.length,2);assert.equal(request.selected,selected);
  const projectManifest=path.join(fromPaths.dir,request.survey),survey=JSON.parse(fs.readFileSync(path.join(root,projectManifest)));
  assert.equal(survey.frames.length,6);for(const frame of survey.frames)assert.ok(fs.existsSync(path.join(root,frame.path)));
  fs.rmSync(path.dirname(path.join(root,preview.manifestPath)),{recursive:true});
  const jobFolder=path.join(root,fromPaths.dir,'work/build-candidates/test/work/source-survey');
  const jobSurvey=copySourceSurvey(root,id,projectManifest,selected,request.sources,jobFolder,{expectedManifest:projectManifest});
  assert.equal(jobSurvey.frames.length,6);for(let i=0;i<6;i++)assert.deepEqual(fs.readFileSync(path.join(root,jobSurvey.frames[i].path)),fs.readFileSync(path.join(root,survey.frames[i].path)));
  const copy=()=>copySourceSurvey(root,id,projectManifest,selected,request.sources,path.join(root,'rejected'),{expectedManifest:projectManifest});
  assert.throws(()=>copySourceSurvey(root,'other',projectManifest,selected,request.sources,path.join(root,'rejected'),{expectedManifest:projectManifest}),/workspace/);
  assert.throws(()=>copySourceSurvey(root,id,projectManifest,selected,[],path.join(root,'rejected'),{expectedManifest:projectManifest}),/yêu cầu/);
  assert.throws(()=>copySourceSurvey(root,id,projectManifest,selected,request.sources,path.join(root,'rejected')),/ENOENT|kho ảnh/);
  const framePath=path.join(root,survey.frames[0].path),frameBytes=fs.readFileSync(framePath);fs.appendFileSync(framePath,'changed');assert.throws(copy,/hỏng/);fs.writeFileSync(framePath,frameBytes);
  fs.appendFileSync(selected,'changed');assert.throws(copy,/Nguồn đã đổi/);fs.writeFileSync(selected,fixture);
  assert.equal(fs.existsSync(path.join(root,'rejected')),false);
  await assert.rejects(createNasProject(root,store,storage,{workspaceId:id,text,selected:path.join(root,'outside.mp4')}),/danh sách/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});


test('Home multi A-roll intake preserves selection order, provenance and cleans failed staging',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-multi-intake-'));
 try{
  const nas=path.join(root,'source có dấu');fs.mkdirSync(nas);const fixture=fs.readFileSync(new URL('./fixture.mp4',import.meta.url));
  const files=['first.mp4','second.mp4','third.mp4'].map(name=>path.join(nas,name));for(const file of files)fs.writeFileSync(file,fixture);fs.writeFileSync(path.join(nas,'bad.mp4'),'invalid');
  const store=createWorkspaceStore(root),workspaceId=store.active().id,storage=createStorageService(root,store),text='A-roll: "'+nas+'"';
  const result=await createNasProject(root,store,storage,{workspaceId,text,selected:files[0],additionalVideos:[files[2],files[1]]});
  const project=result.project,dir=path.join(root,result.dir);assert.equal(project.source.timeline,'segments');assert.equal(project.segments.length,3);
  assert.ok(Math.abs(project.source.duration-project.segments[0].mediaInfo.duration*3)<.01);
  const request=JSON.parse(fs.readFileSync(path.join(dir,'work/source-request.json')));assert.deepEqual(request.additionalVideos,[files[2],files[1]]);
  for(let i=0;i<3;i++){const segment=project.segments[i];assert.equal(segment.mediaStart,0);assert.equal(segment.src,i===0?project.source.video:project.segments[0].src);assert.deepEqual(fs.readFileSync(path.join(dir,segment.src)),fixture);}
  // Byte-identical media may share content-addressed local storage; all original selections remain in request provenance.
  assert.ok(fs.existsSync(path.join(dir,'index.html')));for(const file of files)assert.deepEqual(fs.readFileSync(file),fixture);
  for(const additionalVideos of [[files[0]],[files[1],files[1]],[path.join(root,'outside.mp4')],[path.join(nas,'bad.mp4')]])await assert.rejects(createNasProject(root,store,storage,{workspaceId,text,selected:files[0],additionalVideos}));
  assert.deepEqual(fs.readdirSync(path.join(root,'workspace/content/_intake')),[]);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
