import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {mediaRefs,linkPath,resolveLink,writeProjectFile,readProjectFile,inspectProjectFile,restoreProjectFile,linkedProjectFile,setLinkedProjectFile,writeRecovery,readRecovery,clearRecovery,exportFileName} from '../src/services/project-file.mjs';
import {projectRevision} from '../src/services/project-revisions.mjs';
import {finalizeRenderArtifact} from '../src/services/render-artifacts.mjs';

const tmp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'contentos-projfile-'));
const project=()=>({workspaceId:'w1',contentos:{schemaVersion:1,workspaceId:'w1'},version:1,title:'Xe mới',format:'9:16',
 source:{video:'inputs/raw.mp4',duration:3},segments:[{id:'s1',in:0,out:3,keep:true}],texts:[{id:'t1',text:'Chào'}],captions:[],scenes:[],
 brolls:[{id:'b1',src:'assets/b roll.mov'}],zooms:[{id:'z1',at:1}],audio:{music:'inputs/music.wav',sfx:[{src:'kit:whoosh'}]},transitions:[],camera:{scale:1},brand:{logo:'inputs/logo.png'},blocks:[]});
function makeProject(ws,name='2026-11-07/xe-moi'){
 const dir=path.join(ws,name),p=project();
 for(const ref of mediaRefs(p)){fs.mkdirSync(path.dirname(path.join(dir,ref)),{recursive:true});fs.writeFileSync(path.join(dir,ref),'media:'+ref);}
 fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify(p,null,2)+'\n');return {dir,p};
}

test('mediaRefs collects every in-project media path and skips kit refs and traversal',()=>{
 assert.deepEqual(mediaRefs({...project(),x:'../inputs/evil.mp4',y:'inputs/../../evil.mp4',z:'inputs/notes.txt'}),['assets/b roll.mov','inputs/logo.png','inputs/music.wav','inputs/raw.mp4']);
});

test('linkPath prefers a relative path from the project file folder and falls back to absolute across drives',()=>{
 const base=path.resolve('/projects/client');
 assert.deepEqual(linkPath(base,path.join(base,'media','a.mp4')),{rel:'media/a.mp4',abs:path.join(base,'media','a.mp4')});
 assert.equal(linkPath(base,path.resolve('/other/a.mp4')).rel,'../../other/a.mp4');
 if(process.platform==='win32')assert.equal(linkPath('C:\\p','D:\\m\\a.mp4').rel,null);
 // relative wins over absolute; absolute used when relative target is gone
 const seen=new Set([path.resolve(base,'media/a.mp4'),'/abs/a.mp4']);
 assert.equal(resolveLink(base,{rel:'media/a.mp4',abs:'/abs/a.mp4'},f=>seen.has(f)),path.resolve(base,'media/a.mp4'));
 assert.equal(resolveLink(base,{rel:'gone/a.mp4',abs:'/abs/a.mp4'},f=>seen.has(f)),'/abs/a.mp4');
 assert.equal(resolveLink(base,{rel:'gone/a.mp4',abs:'/gone.mp4'},f=>seen.has(f)),null);
});

test('save then open restores the full editing state into the same project and keeps revision history',()=>{
 const root=tmp();
 try{
  const ws=path.join(root,'content'),{dir,p}=makeProject(ws),file=path.join(root,'saved','Xe mới.cosproj');
  const edited={...p,texts:[{id:'t1',text:'Đã sửa'}],zooms:[]};
  writeProjectFile(file,{projectDir:dir,project:edited,revision:projectRevision(path.join(dir,'project.json'))});
  const doc=readProjectFile(file);
  assert.equal(doc.projectFolder.rel,'../content/2026-11-07/xe-moi');
  assert.deepEqual(doc.media.map(m=>[m.ref,m.rel]),[['assets/b roll.mov','../content/2026-11-07/xe-moi/assets/b roll.mov'],['inputs/logo.png','../content/2026-11-07/xe-moi/inputs/logo.png'],['inputs/music.wav','../content/2026-11-07/xe-moi/inputs/music.wav'],['inputs/raw.mp4','../content/2026-11-07/xe-moi/inputs/raw.mp4']]);
  const r=restoreProjectFile(file,{workspaceRoot:ws,newDir:()=>assert.fail('must reuse folder'),workspaceId:'w1'});
  assert.deepEqual(r,{dir,imported:false,copied:0});
  const reopened=JSON.parse(fs.readFileSync(path.join(dir,'project.json'),'utf8'));
  assert.deepEqual(reopened.texts,[{id:'t1',text:'Đã sửa'}]);assert.deepEqual(reopened.zooms,[]);assert.equal(reopened.workspaceId,'w1');
  assert.equal(fs.readdirSync(path.join(dir,'.history')).length,1);
  assert.throws(()=>readProjectFile(path.join(dir,'project.json')),/không phải dự án/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('opening on another machine imports via relative paths, reports missing media, and accepts relinks',()=>{
 const root=tmp();
 try{
  const ws=path.join(root,'old-machine','content'),{dir,p}=makeProject(ws),file=path.join(root,'old-machine','handoff','du-an.cosproj');
  writeProjectFile(file,{projectDir:dir,project:p,revision:'r1'});
  // mang cả thư mục sang "máy khác": đổi tên thư mục gốc → đường dẫn tuyệt đối cũ không còn
  const moved=path.join(root,'new-machine');fs.renameSync(path.join(root,'old-machine'),moved);
  const movedFile=path.join(moved,'handoff','du-an.cosproj'),newWs=path.join(root,'app','content');
  fs.rmSync(path.join(moved,'content','2026-11-07','xe-moi','inputs','music.wav')); // một file media bị xoá
  const plan=inspectProjectFile(movedFile,{workspaceRoot:newWs});
  assert.equal(plan.projectDir,null);assert.deepEqual(plan.missing.map(m=>m.ref),['inputs/music.wav']);
  let made;const newDir=()=>{made=path.join(newWs,'2026-11-08','du-an');fs.mkdirSync(made,{recursive:true});return made;};
  assert.throws(()=>restoreProjectFile(movedFile,{workspaceRoot:newWs,newDir,workspaceId:'w2'}),e=>e.code==='MEDIA_MISSING'&&e.missing[0].ref==='inputs/music.wav');
  assert.equal(made,undefined);
  const replacement=path.join(root,'picked.wav');fs.writeFileSync(replacement,'new music');
  const r=restoreProjectFile(movedFile,{workspaceRoot:newWs,newDir,workspaceId:'w2',relinks:{'inputs/music.wav':replacement}});
  assert.equal(r.dir,made);assert.equal(r.imported,true);assert.equal(r.copied,4);
  assert.equal(fs.readFileSync(path.join(made,'inputs/music.wav'),'utf8'),'new music');
  assert.equal(fs.readFileSync(path.join(made,'assets/b roll.mov'),'utf8'),'media:assets/b roll.mov');
  const restored=JSON.parse(fs.readFileSync(path.join(made,'project.json'),'utf8'));
  assert.equal(restored.workspaceId,'w2');assert.equal(restored.contentos.workspaceId,'w2');assert.deepEqual(restored.brolls,p.brolls);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('a project folder on another root (UNC vs mapped drive) is imported, not opened in place',{skip:process.platform!=='win32'},()=>{
 const root=tmp();
 try{
  const {dir,p}=makeProject(path.join(root,'content')),file=path.join(root,'x.cosproj');
  writeProjectFile(file,{projectDir:dir,project:p,revision:'r'});
  const doc=readProjectFile(file);doc.projectFolder={rel:null,abs:dir};fs.writeFileSync(file,JSON.stringify(doc));
  // kho của app ở ổ khác với thư mục dự án → không coi là "trong kho"
  assert.equal(inspectProjectFile(file,{workspaceRoot:'Z:\\kho'}).projectDir,null);
  assert.equal(inspectProjectFile(file,{workspaceRoot:path.join(root,'content')}).projectDir,dir);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('newer edits on disk are detected and can be kept instead of the file state',()=>{
 const root=tmp();
 try{
  const ws=path.join(root,'content'),{dir,p}=makeProject(ws),file=path.join(root,'a.cosproj'),pj=path.join(dir,'project.json');
  writeProjectFile(file,{projectDir:dir,project:p,revision:'r'});
  const doc=readProjectFile(file);doc.savedAt=new Date(Date.now()-60000).toISOString();fs.writeFileSync(file,JSON.stringify(doc));
  fs.writeFileSync(pj,JSON.stringify({...p,title:'AI sửa sau'}));
  assert.equal(inspectProjectFile(file,{workspaceRoot:ws}).newerOnDisk,true);
  restoreProjectFile(file,{workspaceRoot:ws,newDir:()=>assert.fail(),workspaceId:'w1',keepDisk:true});
  assert.equal(JSON.parse(fs.readFileSync(pj,'utf8')).title,'AI sửa sau');
  restoreProjectFile(file,{workspaceRoot:ws,newDir:()=>assert.fail(),workspaceId:'w1'});
  assert.equal(JSON.parse(fs.readFileSync(pj,'utf8')).title,'Xe mới');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('linked project file, recovery autosave and export file names',()=>{
 const root=tmp();
 try{
  assert.equal(linkedProjectFile(root),'');setLinkedProjectFile(root,path.join(root,'x.cosproj'));assert.equal(linkedProjectFile(root),path.join(root,'x.cosproj'));
  assert.equal(readRecovery(root),null);writeRecovery(root,project(),'rev');
  const rec=readRecovery(root);assert.equal(rec.baseRevision,'rev');assert.equal(rec.project.title,'Xe mới');assert.ok(Date.parse(rec.savedAt));
  clearRecovery(root);assert.equal(readRecovery(root),null);
  assert.equal(exportFileName('..\\..\\evil'),'evil.mp4');assert.equal(exportFileName('a:b*?.mp4'),'ab.mp4');assert.equal(exportFileName('  ','du-an'),'du-an.mp4');assert.equal(exportFileName('Bản cuối.MP4'),'Bản cuối.MP4');
  assert.equal(exportFileName('"\\\\ChungAuto\\Quay Dựng\\full combo độ vf3.mp4.json"'),'full combo độ vf3.mp4');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('render finalization writes the chosen file name and overwrites only when confirmed',()=>{
 const root=tmp();
 try{
  const directory=path.join(root,'snapshot'),projectDir=path.join(root,'project'),dest=path.join(root,'Xuất');for(const d of [directory,projectDir])fs.mkdirSync(path.join(d,'renders'),{recursive:true});
  fs.writeFileSync(path.join(directory,'project.json'),JSON.stringify({format:'9:16',segments:[{in:0,out:0.5,keep:true}]}));
  const output='renders/clip.mp4',make=()=>execFileSync('ffmpeg',['-nostdin','-y','-v','error','-f','lavfi','-i','color=s=1080x1920:d=0.5:r=30','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p',path.join(directory,output)],{windowsHide:true});
  const snapshot={directory,manifest:{id:'f',revision:'r'}};
  make();const first=finalizeRenderArtifact({snapshot,projectDir,output,destination:dest,destName:'Ten dep.mp4',quality:'final'});
  assert.equal(first.saved,path.join(dest,'Ten dep.mp4'));
  fs.rmSync(path.join(projectDir,output));fs.rmSync(path.join(projectDir,output)+'.json');make();
  const second=finalizeRenderArtifact({snapshot,projectDir,output,destination:dest,destName:'Ten dep.mp4',quality:'final'});
  assert.equal(second.saved,path.join(dest,'Ten dep-2.mp4')); // chưa đồng ý ghi đè → tên mới
  // Nếu trong thư mục đích còn sót mỗi file .mp4.json mồ côi (không có .mp4) → vẫn lưu đúng tên file người dùng chọn
  fs.rmSync(path.join(dest,'Ten dep.mp4'));
  fs.rmSync(path.join(projectDir,output));fs.rmSync(path.join(projectDir,output)+'.json');make();
  const orphanSidecar=finalizeRenderArtifact({snapshot,projectDir,output,destination:dest,destName:'Ten dep.mp4',quality:'final'});
  assert.equal(orphanSidecar.saved,path.join(dest,'Ten dep.mp4'));
  fs.rmSync(path.join(projectDir,output));fs.rmSync(path.join(projectDir,output)+'.json');make();
  const third=finalizeRenderArtifact({snapshot,projectDir,output,destination:dest,destName:'Ten dep.mp4',overwrite:true,quality:'final'});
  assert.equal(third.saved,path.join(dest,'Ten dep.mp4'));assert.equal(JSON.parse(fs.readFileSync(third.saved+'.json','utf8')).sha256,third.sha256);
  assert.deepEqual(fs.readdirSync(dest).filter(f=>f.endsWith('.tmp')),[]);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
