import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync,spawn} from 'node:child_process';
import {verifyArtifact} from '../src/services/artifact-integrity.mjs';

// No browser automation: actual app CLI render and decoded output audio.
const relative='workspace/content/2026-11-05/qa-audio-'+crypto.randomBytes(3).toString('hex'),dir=path.resolve(relative),digest=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.mkdirSync(path.join(dir,'inputs'),{recursive:true});
for(const [name,tone] of [['silent',0],['voice440',440],['voice660',660],['broll880',880]]){
 execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','color=c=gray:s=180x320:r=30:d=1',...(tone?['-f','lavfi','-i',`sine=frequency=${tone}:sample_rate=48000:duration=1`,'-c:a','aac']:[]),'-c:v','libx264','-pix_fmt','yuv420p',path.join(dir,'inputs',name+'.mp4')],{windowsHide:true});
}
const src=name=>'inputs/'+name+'.mp4',names=['silent','voice440','silent','voice660'];
const project={title:'QA tiếng từng nguồn',source:{video:src('silent'),hasAudio:false,timeline:'segments'},segments:names.map((name,i)=>({id:'s'+i,src:src(name),mediaStart:0,mediaInfo:{width:180,height:320,duration:1},in:i,out:i+1,keep:true})),captions:{enabled:false},audio:{sfx:'tat'},brolls:[{id:'b',src:src('broll880'),at:1.6,dur:1,mode:'full',tIn:'none',mediaStart:0,audioVol:.5}]};
const file=path.join(dir,'project.json');fs.writeFileSync(file,JSON.stringify(project,null,2));const before=fs.readFileSync(file),sources=Object.fromEntries([...new Set([...names,'broll880'])].map(name=>[src(name),digest(fs.readFileSync(path.join(dir,src(name))))]));
const log=fs.createWriteStream(path.join(dir,'render.log')),child=spawn(process.execPath,['editor/tools/xuat-video.mjs',relative,'--quality','final'],{windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(log);child.stderr.pipe(log);console.log('Rendering '+relative+' PID '+child.pid);
await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error('Render exit '+code+' '+dir+'/render.log')));});
const status=JSON.parse(fs.readFileSync(path.join(dir,'work/render.json'))),output=status.saved||path.join(dir,status.output),integrity=verifyArtifact(output,status);
assert.deepEqual(fs.readFileSync(file),before);for(const [name,hash] of Object.entries(sources))assert.equal(digest(fs.readFileSync(path.join(dir,name))),hash);
const raw=execFileSync('ffmpeg',['-nostdin','-v','error','-i',output,'-vn','-ac','1','-ar','48000','-f','f32le','pipe:1'],{windowsHide:true,maxBuffer:8*1024*1024});
function measure(from,to){const start=Math.round(from*48000),end=Math.round(to*48000);let sum=0;const amplitudes={};for(let i=start;i<end;i++){const value=raw.readFloatLE(i*4);sum+=value*value;}for(const hz of [440,660,880]){let re=0,im=0;for(let i=start;i<end;i++){const value=raw.readFloatLE(i*4),angle=2*Math.PI*hz*i/48000;re+=value*Math.cos(angle);im+=value*Math.sin(angle);}amplitudes[hz]=2*Math.hypot(re,im)/(end-start);}return {from,to,rms:Math.sqrt(sum/(end-start)),amplitudes};}
const windows=[measure(.25,.75),measure(1.2,1.5),measure(1.7,1.9),measure(2.2,2.4),measure(2.75,2.95),measure(3.25,3.75)];
assert.ok(windows[0].rms<.001,'first source remains silent');assert.ok(windows[4].rms<.001,'B-roll audio ends at declared boundary');
for(const [index,hz] of [[1,440],[2,440],[2,880],[3,880],[5,660]])assert.ok(windows[index].amplitudes[hz]>.01,JSON.stringify({index,hz,window:windows[index]}));
for(const [index,hz] of [[1,660],[1,880],[3,440],[3,660],[5,440],[5,880]])assert.ok(windows[index].amplitudes[hz]<.003,JSON.stringify({unexpected:index,hz,window:windows[index]}));
// The B-roll volume is half the source gain; common final normalization must preserve it.
const ratio=windows[2].amplitudes[880]/windows[2].amplitudes[440];assert.ok(ratio>.4&&ratio<.6,'B-roll gain ratio '+ratio);
const evidence={project:relative,output,integrity,seconds:Number(status.probe.format.duration),windows,brollToVoiceRatio:ratio,projectAndSourcesUnchanged:true,loudness:status.audioLoudness||null,listened:false,browserVerified:false,scope:'Synthetic tones prove source retention, silence, overlap gain and timing in final AAC; not voice intelligibility, music/SFX quality, real-product editorial quality or human listening acceptance.'};fs.writeFileSync('docs/MULTISOURCE_AUDIO_FINAL_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
