// Actual final exports of isolated QA copies: change only selected skin lift.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {spawn,execFileSync} from 'node:child_process';
import {selectedSemanticMask} from '../src/services/selected-person-exposure.mjs';
import {verifyArtifact} from '../src/services/artifact-integrity.mjs';
assert.ok(process.argv.includes('--render-local'),'Use --render-local for local QA final exports.');
const baseDir='workspace/content/2026-11-05/contentos-selected-final-baseline',projectFile=path.join(baseDir,'project.json'),faceFile=path.join(baseDir,'work/face.json');
const original=JSON.parse(fs.readFileSync(projectFile)),face=JSON.parse(fs.readFileSync(faceFile)),src=original.source.video;
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const before={project:hash(projectFile),face:hash(faceFile),source:hash(path.join(baseDir,src))};
const id=crypto.randomUUID().slice(0,8),projects=[],outputs=[],projectHashes=[];
for(const [name,bodyWhite] of [['base',0],['skin',30]]){
 const dir=`workspace/content/2026-11-05/qa-skin-${id}-${name}`;
 fs.mkdirSync(path.join(dir,'inputs'),{recursive:true});fs.mkdirSync(path.join(dir,'work'));
 fs.copyFileSync(path.join(baseDir,src),path.join(dir,src));
 const project=structuredClone(original);project.title='QA selected skin '+name;
 project.camera.beauty={personLight:0,bodyWhite:0,bodySmooth:0,personSelections:structuredClone(original.camera.beauty.personSelections),sourceAdjustments:[{src,sha256:before.source,personLight:0,bodyWhite,bodySmooth:0}]};
 for(const selection of project.camera.beauty.personSelections)delete selection.adjustments;
 const bundle=structuredClone(face),stat=fs.statSync(path.join(dir,src));
 const track=bundle.tracks.find(t=>t.src===src);assert.equal(track.fingerprint.sha256,before.source);track.fingerprint.size=stat.size;track.fingerprint.mtimeMs=stat.mtimeMs;
 fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify(project,null,2));fs.writeFileSync(path.join(dir,'work/face.json'),JSON.stringify(bundle));
 const unchanged=hash(path.join(dir,'project.json'));projectHashes.push(unchanged);
 console.log('Rendering '+dir);
 await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['editor/tools/xuat-video.mjs',dir,'--quality','final'],{windowsHide:true,stdio:['ignore','pipe','pipe']});let log='';
  for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{log=(log+chunk).slice(-6000);});
  child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error('Render exit'+code+' '+log)));
 });
 const result=JSON.parse(fs.readFileSync(path.join(dir,'work/render.json')));assert.equal(result.ok,true,result.log);
 verifyArtifact(result.saved,JSON.parse(fs.readFileSync(result.saved+'.json')));
 assert.equal(hash(path.join(dir,'project.json')),unchanged);assert.equal(hash(path.join(dir,src)),before.source);
 projects.push(dir);outputs.push(result.saved);
}
const track=face.tracks.find(t=>t.src===src),{w,h}=track.skin,bytes=w*h*3,options={windowsHide:true,maxBuffer:128*1048576};
const probe=file=>JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',file],options)).frames.map(f=>Number(f.best_effort_timestamp_time));
const times=outputs.map(probe);assert.deepEqual(times[0],times[1]);
const decoded=outputs.map(file=>execFileSync('ffmpeg',['-nostdin','-v','error','-i',file,'-map','0:v:0','-vf',`scale=${w}:${h}`,'-fps_mode','passthrough','-pix_fmt','rgb24','-f','rawvideo','pipe:1'],options));
for(const buffer of decoded)assert.equal(buffer.length,times[0].length*bytes);
const comparisons=[],unmeasured=[],inactive=[];
for(const [frame,time] of times[0].entries()){
 const mask=selectedSemanticMask(track,original.camera.beauty.personSelections,time);assert.ok(mask);
 const labels=new Uint8Array(w*h);let at=0;for(let i=0;i<mask.runs.length;i+=2){labels.fill(mask.runs[i+1],at,at+mask.runs[i]);at+=mask.runs[i];}
 const active=original.camera.beauty.personSelections.some(s=>time>=s.from&&time<(s.to??s.from+s.f.length/s.fps));
 if(!active){let sum=0;for(let i=0;i<bytes;i++)sum+=Math.abs(decoded[1][frame*bytes+i]-decoded[0][frame*bytes+i]);inactive.push({frame,time,meanAbsoluteDifference:sum/bytes});continue;}
 const regions={skin:{count:0,lumaGain:0,absoluteDifference:0},clothesAndHair:{count:0,lumaGain:0,absoluteDifference:0},background:{count:0,lumaGain:0,absoluteDifference:0}};
 for(let y=3;y<h-3;y++)for(let x=3;x<w-3;x++){
  const label=labels[y*w+x];let safe=true;
  for(let dy=-2;dy<=2&&safe;dy++)for(let dx=-2;dx<=2;dx++)if(labels[(y+dy)*w+x+dx]!==label){safe=false;break;}
  if(!safe)continue;
  const region=label===2?regions.skin:label===1?regions.clothesAndHair:regions.background,index=frame*bytes+(y*w+x)*3;
  const delta=[0,1,2].map(c=>decoded[1][index+c]-decoded[0][index+c]);region.count++;region.lumaGain+=.2126*delta[0]+.7152*delta[1]+.0722*delta[2];region.absoluteDifference+=delta.reduce((s,n)=>s+Math.abs(n),0)/3;
 }
 if(Object.values(regions).some(r=>r.count<15)){unmeasured.push({frame,time,counts:Object.fromEntries(Object.entries(regions).map(([k,v])=>[k,v.count]))});continue;}
 for(const region of Object.values(regions)){region.lumaGain/=region.count;region.absoluteDifference/=region.count;}
 comparisons.push({frame,time,...regions});
}
const failures=comparisons.filter(c=>c.skin.lumaGain<1||c.skin.lumaGain<=c.clothesAndHair.lumaGain||c.skin.lumaGain<=c.background.lumaGain||c.clothesAndHair.absoluteDifference>1||c.background.absoluteDifference>1);
const inactiveFailures=inactive.filter(f=>f.meanAbsoluteDifference>1);
const contact='docs/SKIN_ONLY_FINAL_CONTACT.png';
execFileSync('ffmpeg',['-nostdin','-v','error','-y','-i',outputs[0],'-i',outputs[1],'-filter_complex','[0:v]fps=1/1.5,scale=180:320,tile=4x1[a];[1:v]fps=1/1.5,scale=180:320,tile=4x1[b];[a][b]vstack','-frames:v','1',contact],options);
assert.equal(hash(projectFile),before.project);assert.equal(hash(faceFile),before.face);assert.equal(hash(path.join(baseDir,src)),before.source);
const report={sourceQA:baseDir,projects,outputs,projectHashes,sourceAndQAUnchanged:true,skinLift:{baseline:0,adjusted:30},otherBeautyLevels:0,actualFinalRender:true,totalFrames:times[0].length,measuredFrames:comparisons.length,unmeasured,inactive,failures,inactiveFailures,summary:{minimumSkinLumaGain:Math.min(...comparisons.map(c=>c.skin.lumaGain)),maximumClothesHairDifference:Math.max(...comparisons.map(c=>c.clothesAndHair.absoluteDifference)),maximumBackgroundDifference:Math.max(...comparisons.map(c=>c.background.absoluteDifference))},contact,comparisons,scope:'All decoded frames at144x256 mask resolution on darkened six-second real-person QA proxy with saved semantic and SAM2 masks. Safe interiors exclude2px boundary; encoded differences tolerated up to mean RGB1. This tests isolation relative to saved labels, not semantic correctness, natural skin tone, occlusion, UI or full production quality.'};
fs.writeFileSync('docs/SKIN_ONLY_FINAL_SMOKE.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,comparisons:undefined}));
assert.equal(unmeasured.length,0);assert.equal(failures.length,0);assert.equal(inactiveFailures.length,0);assert.equal(comparisons.length+inactive.length,times[0].length);
