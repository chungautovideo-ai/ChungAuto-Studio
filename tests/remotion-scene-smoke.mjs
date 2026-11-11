import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {renderRemotionScene} from '../src/services/remotion-scenes.mjs';import {projectRevision} from '../src/services/project-revisions.mjs';import {renderLockStatus} from '../src/services/render-lock.mjs';
import {createRenderSnapshot} from '../src/services/render-snapshots.mjs';import {execFileSync} from 'node:child_process';
const root=process.cwd(),projectDir=path.join(root,'workspace/cache/remotion-smoke-'+crypto.randomUUID());fs.mkdirSync(projectDir,{recursive:true});fs.writeFileSync(path.join(projectDir,'project.json'),JSON.stringify({format:'9:16',title:'ContentOS-Smoke-Remotion'}));
const revision=projectRevision(path.join(projectDir,'project.json')),scene={format:'9:16',duration:0.6,title:'ContentOS',subtitle:'Cảnh React · có thể sửa tham số'};
try{
 const first=await renderRemotionScene({root,projectDir,revision,scene,onProgress:p=>console.log(p.phase)});assert.equal(first.cached,false);assert.equal(first.engine,'remotion');
 const repeated=await renderRemotionScene({root,projectDir,revision,scene});assert.equal(repeated.cached,true);assert.equal(repeated.sha256,first.sha256);
 execFileSync('ffmpeg',['-v','error','-y','-i',path.join(projectDir,first.path),'-ss','0.5','-frames:v','1',path.join(root,'docs/REMOTION_NATIVE_TITLE.jpg')],{windowsHide:true});
 fs.copyFileSync(new URL('./fixture.mp4',import.meta.url),path.join(projectDir,'source.mp4'));
 const mixed={title:'ContentOS-Smoke-Mixed',format:'9:16',source:{video:'source.mp4',duration:1,width:360,height:640,hasAudio:false},segments:[{id:'s',in:0,out:1,keep:true}],brolls:[{id:'remotion-scene',src:first.path,at:0,dur:0.6,mode:'full'}],audio:{autoSfx:false,sfxLevel:'tat'},captions:{lines:[]}};
 fs.writeFileSync(path.join(projectDir,'project.json'),JSON.stringify(mixed));await assert.rejects(renderRemotionScene({root,projectDir,revision,scene}),/thay đổi/);assert.equal(renderLockStatus(root),null);
 const snapshot=await createRenderSnapshot(projectDir);assert.ok(snapshot.manifest.assets.some(asset=>asset.path===first.path));
 execFileSync(process.execPath,['editor/tools/xuat-video.mjs',path.relative(root,projectDir),'--quality','final'],{cwd:root,windowsHide:true,stdio:'pipe',timeout:180000});
 const status=JSON.parse(fs.readFileSync(path.join(projectDir,'work/render.json')));assert.equal(status.ok,true);assert.equal(renderLockStatus(root),null);
 fs.writeFileSync('docs/REMOTION_SCENE_SMOKE.json',JSON.stringify({nativeReactRender:true,version:first.runtime,composition:first.composition,probe:first.probe,bytes:first.bytes,sha256:first.sha256,parameterCache:true,staleRevisionRejected:true,sharedLockReleased:true,mixedHyperFramesSnapshot:true,mixedFinalMp4:true,project:projectDir,final:status.output,limits:'Built-in title card only; no project UI, full AIEV composition migration or audio acceptance yet. Runtime locally reuses installed AIEV node_modules; clean installation not verified.'},null,2));console.log('PASS native Remotion scene/cache/revision and mixed HyperFrames final');
}finally{console.log('Fixture retained for visual review:',projectDir);}
