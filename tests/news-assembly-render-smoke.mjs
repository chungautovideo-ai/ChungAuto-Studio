// Real local render of synthetic fixtures; no provider, credentials or publishing.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync,spawn} from 'node:child_process';
import {createNewsService} from '../src/services/news.mjs';import {createStorageService} from '../src/services/storage.mjs';import {createNarrationProject} from '../src/services/narration-projects.mjs';
import {inspectBrollMedia} from '../src/services/broll-media.mjs';import {planBrollAssembly} from '../editor/lib/broll-assembly.js';import {buildProject} from '../editor/lib/build.mjs';
import {createRenderSnapshot} from '../src/services/render-snapshots.mjs';import {finalizeRenderArtifact} from '../src/services/render-artifacts.mjs';import {acquireRenderLock} from '../src/services/render-lock.mjs';
const root=process.cwd(),workspaceId='qa-assembly-'+crypto.randomUUID(),workspace={id:workspaceId,brand:'QA',industry:'test'},store={active:()=>workspace},news=createNewsService(root),storage=createStorageService(root,store);
const ff=args=>execFileSync('ffmpeg',['-nostdin','-v','error',...args],{windowsHide:true});
const story=news.save(workspaceId,{title:'ContentOS-Smoke News Assembly Render',script:'Nội dung thử nghiệm tổng hợp.',sources:[{url:'https://example.com',excerpt:'Nguồn tổng hợp.'}],approved:true});
const voiceId='cccccccccccc',folder=path.join(root,'workspace/contentos/voice',workspaceId,'ket-qua');fs.mkdirSync(folder,{recursive:true});const voiceFile=path.join(folder,voiceId+'.mp3');ff(['-f','lavfi','-i','sine=frequency=440:duration=3','-ar','48000',voiceFile]);
const textHash=crypto.createHash('sha256').update(story.payload.script).digest('hex');fs.writeFileSync(path.join(folder,voiceId+'.json'),JSON.stringify({id:voiceId,workspaceId,sha256:crypto.createHash('sha256').update(fs.readFileSync(voiceFile)).digest('hex'),textHash,narration:{workspaceId,scriptId:story.id,scriptHash:story.hash,version:story.version,textHash}}));
const created=await createNarrationProject(root,store,storage,news,{workspaceId,newsBriefId:story.id,voiceId,format:'9:16'}),dir=path.join(root,created.dir),project=created.project;
ff(['-f','lavfi','-i','color=c=blue:s=360x640','-frames:v','1',path.join(dir,'inputs/blue.png')]);
ff(['-f','lavfi','-i','color=c=red:s=360x640:r=30:d=2','-f','lavfi','-i','sine=frequency=880:duration=2','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-shortest',path.join(dir,'inputs/red.mp4')]);
const assets=await inspectBrollMedia(dir,['inputs/blue.png','inputs/red.mp4'],['inputs/blue.png','inputs/red.mp4']);
const plan=planBrollAssembly(project,assets,{shotSeconds:1.5,repeat:true});assert.equal(plan.uncovered,0);
project.brolls=plan.clips.map(({outputStart,...clip})=>({...clip,id:'b-'+crypto.randomUUID()}));project.audio.sfxLevel='tat';project.audio.autoSfx=false;
fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify(project,null,2)+'\n');buildProject(dir,project);
const lock=acquireRenderLock(root,{projectDir:dir,kind:'synthetic-news-assembly-qa'});
try{
 const snapshot=await createRenderSnapshot(dir,{quality:'draft'});
 const invoke=async args=>{
  const child=spawn(process.platform==='win32'?'npx.cmd':'npx',['--offline','hyperframes@0.9.6',...args],{cwd:snapshot.directory,windowsHide:true,shell:process.platform==='win32',env:{...process.env,FORCE_COLOR:'0'}});lock.child(child.pid);
  let log='';child.stdout.on('data',d=>{log+=d;process.stdout.write(d);});child.stderr.on('data',d=>{log+=d;process.stderr.write(d);});
  const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});fs.writeFileSync(path.join(dir,'qa-'+args[0]+'.log'),log);assert.equal(code,0,args[0]+' failed');
 };
 await invoke(['lint']);await invoke(['inspect','--samples','3']);const output='renders/news-assembly-qa.mp4';await invoke(['render','--quality','draft','--fps','30','--workers','1','--output',output]);
 fs.mkdirSync(path.join(dir,'renders'),{recursive:true});const finalized=finalizeRenderArtifact({snapshot,projectDir:dir,output,quality:'draft'}),file=finalized.saved;
 const pixels=[];
 for(const [time,expected] of [[0.75,'blue'],[2.25,'red']]){
  const rgb=ff(['-ss',String(time),'-i',file,'-frames:v','1','-vf','crop=100:100:490:910,scale=1:1','-pix_fmt','rgb24','-f','rawvideo','pipe:1']);
  const [r,g,b]=rgb;assert.ok(expected==='blue'?b>r+100&&b>g+100:r>b+100&&r>g+100,JSON.stringify({time,expected,r,g,b}));pixels.push({time,expected,r,g,b});
 }
 const pcm=ff(['-i',file,'-map','0:a:0','-ac','1','-ar','16000','-f','f32le','pipe:1']);let crossings=0,sum=0,count=0;
 for(let i=16001;i<40000;i++){const current=pcm.readFloatLE(i*4);if(pcm.readFloatLE((i-1)*4)<=0&&current>0)crossings++;sum+=current**2;count++;}
 const frequency=crossings/(count/16000),rms=Math.sqrt(sum/count);assert.ok(Math.abs(frequency-440)<8);assert.ok(rms>0.01);
 function amplitude(hz){let re=0,im=0,n=0;for(let i=28000;i<40000;i++){const value=pcm.readFloatLE(i*4),angle=2*Math.PI*hz*i/16000;re+=value*Math.cos(angle);im+=value*Math.sin(angle);n++;}return 2*Math.hypot(re,im)/n;}
 const narrationAmplitude=amplitude(440),brollAmplitude=amplitude(880);assert.ok(brollAmplitude<narrationAmplitude*0.03,'B-roll audio should be muted');
 const contactSheet=path.join(dir,'renders/news-assembly-frames.png');ff(['-i',file,'-vf','select=eq(n\\,22)+eq(n\\,67),scale=270:480,tile=2x1','-frames:v','1',contactSheet]);
 const evidence={syntheticOnly:true,noProviderCalls:true,project:created.dir,output:file,contactSheet,engine:'HyperFrames 0.9.6',lint:true,inspect:true,snapshotId:snapshot.manifest.id,probe:finalized.probe,pixels,narrationFrequency:frequency,narrationRms:rms,narrationAmplitude,brollAmplitude,brollSourceTone:880,brollMuted:true,limits:'3-second synthetic draft. No real speech, semantic scene selection, entitled HTTP/provider transaction or production throughput validation.'};
 fs.writeFileSync('docs/NEWS_ASSEMBLY_RENDER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);
}finally{lock.release();}
