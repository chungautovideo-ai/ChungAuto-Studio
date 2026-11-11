import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawn,execFileSync} from 'node:child_process';
import {selectedSemanticMask} from '../src/services/selected-person-exposure.mjs';import {verifyArtifact} from '../src/services/artifact-integrity.mjs';
const evidence=JSON.parse(fs.readFileSync('docs/SELECTED_PERSON_EXPOSURE_DARK_SMOKE.json')),source=evidence.project,base=JSON.parse(fs.readFileSync(path.join(source,'project.json'))),face=JSON.parse(fs.readFileSync(path.join(source,'work/face.json'))),track=face.tracks.find(t=>t.src===base.source.video),levels=base.camera.beauty.sourceAdjustments.find(a=>a.src===base.source.video),dirs=[],outputs=[];
assert.equal(levels.personLight,30);assert.equal(levels.bodySmooth,17);
async function render(dir){console.log('Rendering '+dir);await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['editor/tools/xuat-video.mjs',dir,'--quality','final'],{windowsHide:true,stdio:['ignore','pipe','pipe']});let log='';for(const stream of [child.stdout,child.stderr])stream.on('data',data=>{log=(log+data).slice(-12000);});child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error('Render exit'+code+' '+log)));});const result=JSON.parse(fs.readFileSync(path.join(dir,'work/render.json')));assert.equal(result.ok,true,result.log);verifyArtifact(result.saved,JSON.parse(fs.readFileSync(result.saved+'.json')));return result.saved;}
for(const [name,light] of [['baseline',0],['lift',30]]){
 let dir='workspace/content/2026-11-05/contentos-selected-final-'+name,index=1;while(fs.existsSync(dir))dir='workspace/content/2026-11-05/contentos-selected-final-'+name+'-'+(++index);
 fs.mkdirSync(path.join(dir,'inputs'),{recursive:true});fs.mkdirSync(path.join(dir,'work'));fs.copyFileSync(path.join(source,base.source.video),path.join(dir,base.source.video));
 const project=structuredClone(base);project.title='Selected person final QA '+name;project.camera.beauty.sourceAdjustments.find(a=>a.src===base.source.video).personLight=light;
 const bundle=structuredClone(face),stat=fs.statSync(path.join(dir,base.source.video)),copyTrack=bundle.tracks.find(t=>t.src===base.source.video);copyTrack.fingerprint.size=stat.size;copyTrack.fingerprint.mtimeMs=stat.mtimeMs;
 fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify(project,null,2));fs.writeFileSync(path.join(dir,'work/face.json'),JSON.stringify(bundle));dirs.push(dir);outputs.push(await render(dir));
}
const w=track.skin.w,h=track.skin.h,comparisons=[];
const frame=(file,time)=>execFileSync('ffmpeg',['-nostdin','-v','error','-ss',String(time),'-i',file,'-frames:v','1','-vf',`scale=${w}:${h}`,'-pix_fmt','rgb24','-f','rawvideo','pipe:1'],{windowsHide:true,maxBuffer:1024*1024});
for(const time of [.5,2,3.5,5]){
 const mask=selectedSemanticMask(track,base.camera.beauty.personSelections,time),labels=new Uint8Array(w*h);let pos=0;for(let i=0;i<mask.runs.length;i+=2){labels.fill(mask.runs[i+1],pos,pos+mask.runs[i]);pos+=mask.runs[i];}
 const a=frame(outputs[0],time),b=frame(outputs[1],time),stats={person:{count:0,lumaGain:0,absoluteDifference:0,changedOver8:0},background:{count:0,lumaGain:0,absoluteDifference:0,changedOver8:0}};
 for(let y=5;y<h-5;y++)for(let x=5;x<w-5;x++){
  let any=false,all=true;for(let yy=y-4;yy<=y+4;yy++)for(let xx=x-4;xx<=x+4;xx++){const inside=labels[yy*w+xx]>0;any||=inside;all&&=inside;}
  const region=all?stats.person:!any?stats.background:null;if(!region)continue;const i=(y*w+x)*3,delta=[b[i]-a[i],b[i+1]-a[i+1],b[i+2]-a[i+2]];region.count++;region.lumaGain+=.2126*delta[0]+.7152*delta[1]+.0722*delta[2];region.absoluteDifference+=delta.reduce((s,n)=>s+Math.abs(n),0)/3;if(delta.some(n=>Math.abs(n)>8))region.changedOver8++;
 }
 for(const region of Object.values(stats)){assert.ok(region.count>50);region.lumaGain/=region.count;region.absoluteDifference/=region.count;region.changedFraction=region.changedOver8/region.count;}
 comparisons.push({time,...stats});
}
const report={sourceQA:source,projects:dirs,outputs,actualFinalRender:true,seconds:6.006,personLightBaseline:0,personLightLift:30,bodySmoothBoth:17,comparisons,scope:'Four decoded H264 frames downscaled to mask resolution; safe interiors exclude 4-pixel mask boundary, slight cover crop/resampling and codec differences remain. Not all-frame identity/privacy/skin-tone or full production acceptance.'};
fs.writeFileSync('docs/SELECTED_PERSON_FINAL_SMOKE.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
assert.ok(comparisons.every(c=>c.person.lumaGain>0),'Selected person must become brighter at each sampled time.');
assert.ok(comparisons.every(c=>c.person.lumaGain>c.background.lumaGain),'Lift must concentrate on selected person at sampled times.');
// Contact sheet is a visual review aid, not an automatic quality verdict.
execFileSync('ffmpeg',['-nostdin','-v','error','-y','-i',outputs[0],'-i',outputs[1],'-filter_complex','[0:v]fps=1/1.5,scale=180:320,tile=4x1[a];[1:v]fps=1/1.5,scale=180:320,tile=4x1[b];[a][b]vstack','-frames:v','1','docs/SELECTED_PERSON_FINAL_CONTACT.png'],{windowsHide:true,maxBuffer:1024*1024});
