// Two new one-second QA exports; never modifies the source QA or user projects.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {selectedSemanticMask} from '../src/services/selected-person-exposure.mjs';
import {verifyArtifact,fingerprintArtifact} from '../src/services/artifact-integrity.mjs';
import {normalizePersonSelections} from '../editor/lib/person-selection.js';
assert.ok(process.argv.includes('--render-qa'),'Pass --render-qa for local QA exports.');
const evidence=JSON.parse(fs.readFileSync('docs/SELECTED_PERSON_FINAL_SMOKE.json')),source=evidence.projects[1],base=JSON.parse(fs.readFileSync(path.join(source,'project.json'))),face=JSON.parse(fs.readFileSync(path.join(source,'work/face.json'))),src=base.source.video;
const track=face.tracks.find(t=>t.src===src),before=fingerprintArtifact(path.join(source,src));
const selection=normalizePersonSelections([{...base.camera.beauty.personSelections[0],from:0,to:.96,f:base.camera.beauty.personSelections[0].f.slice(0,8)}])[0];
assert.equal(selection.fps,8);
const dirs=[],outputs=[];
for(const [name,light] of [['baseline',0],['lift',30]]){
 const dir=fs.mkdtempSync(path.join('workspace/content/2026-11-05','contentos-exact-end-'+name+'-'));
 fs.mkdirSync(path.join(dir,'inputs'));fs.mkdirSync(path.join(dir,'work'));fs.copyFileSync(path.join(source,src),path.join(dir,src));
 const project=structuredClone(base);project.title='Exact selected-person endpoint QA '+name;project.source.duration=1;project.segments=[{id:'s1',in:0,out:1,keep:true,text:''}];project.camera.beauty.personSelections=[selection];project.camera.beauty.sourceAdjustments.find(s=>s.src===src).personLight=light;
 const bundle=structuredClone(face),stat=fs.statSync(path.join(dir,src)),copyTrack=bundle.tracks.find(t=>t.src===src);copyTrack.fingerprint.size=stat.size;copyTrack.fingerprint.mtimeMs=stat.mtimeMs;
 fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify(project,null,2));fs.writeFileSync(path.join(dir,'work/face.json'),JSON.stringify(bundle));
 console.log('Rendering '+dir);
 await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['editor/tools/xuat-video.mjs',dir,'--quality','final'],{windowsHide:true,stdio:['ignore','pipe','pipe']});let log='';for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{log=(log+b).slice(-12000);});child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error('Render exit '+code+' '+log)));});
 const result=JSON.parse(fs.readFileSync(path.join(dir,'work/render.json')));assert.equal(result.ok,true);verifyArtifact(result.saved,JSON.parse(fs.readFileSync(result.saved+'.json')));outputs.push(result.saved);dirs.push(dir);
 const saved=JSON.parse(fs.readFileSync(path.join(dir,'project.json')));assert.equal(saved.camera.beauty.personSelections[0].to,.96);
 const html=fs.readFileSync(path.join(dir,'work/render-snapshots',result.snapshotId,'index.html'),'utf8');assert.ok(html.includes('s.to??'),'Final embeds exact-end helper');
}
assert.deepEqual(fingerprintArtifact(path.join(source,src)),before);
const {w,h}=track.skin;
const frame=(file,time)=>execFileSync('ffmpeg',['-nostdin','-v','error','-ss',String(time),'-i',file,'-frames:v','1','-vf',`scale=${w}:${h}`,'-pix_fmt','rgb24','-f','rawvideo','pipe:1'],{windowsHide:true,maxBuffer:1024*1024});
const comparisons=[];
for(const time of [0,.5,28/30,29/30]){
 const a=frame(outputs[0],time),b=frame(outputs[1],time);assert.equal(a.length,w*h*3);assert.equal(b.length,a.length);
 let sum=0,changed=0;for(let p=0;p<w*h;p++){let big=false;for(let c=0;c<3;c++){const d=Math.abs(b[p*3+c]-a[p*3+c]);sum+=d;if(d>8)big=true;}if(big)changed++;}
 const mask=selectedSemanticMask(track,[selection],time),activePixels=mask.runs.reduce((n,v,i)=>n+(i%2&&v>0?mask.runs[i-1]:0),0);
 comparisons.push({time,activePixels,meanAbsoluteDifference:sum/a.length,changedFraction:changed/(w*h)});
}
const report={projects:dirs,outputs,currentFinalRender:true,requestedEnd:.96,sampleCoverageEnd:1,comparisons,sourceUnchanged:true,limits:'One-second QA with saved real masks and artificially dark source. Measures rendered correction on/off near fractional endpoint, not newly inferred masks, skin-tone, native UI, occlusion, identity or full production quality.'};
fs.writeFileSync('docs/PERSON_EXACT_END_FINAL_SMOKE.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
for(const c of comparisons.slice(0,-1)){assert.ok(c.activePixels>0);assert.ok(c.changedFraction>.01);}
const last=comparisons.at(-1);assert.equal(last.activePixels,0);assert.ok(last.meanAbsoluteDifference<1);assert.ok(last.changedFraction<.001);
