import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {execFileSync,spawn} from 'node:child_process';
import {verifyArtifact} from '../src/services/artifact-integrity.mjs';
const longName=process.argv.includes('--long-name');
const relative='workspace/content/2026-11-05/'+(longName?'contentos-qa-broll-entrance-'+crypto.randomUUID():'qa-in-'+crypto.randomBytes(3).toString('hex')),dir=path.resolve(relative);fs.mkdirSync(path.join(dir,'inputs'),{recursive:true});
const videoOnly=process.argv.includes('--video-only');
for(const [name,color] of [['aroll','red'],['broll','blue']])execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i',`color=c=${color}:s=180x320:r=30:d=2`,...(videoOnly?[]:['-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-t','2','-c:a','aac']),'-c:v','libx264','-pix_fmt','yuv420p',path.join(dir,'inputs',name+'.mp4')],{windowsHide:true});
const project={title:'QA thời lượng cảnh trám',source:{video:'inputs/aroll.mp4'},segments:[{id:'s',in:0,out:2,keep:true}],audio:{sfx:'tat'},captions:{enabled:false},brolls:[{id:'b',src:'inputs/broll.mp4',at:.4,dur:.75,mode:'full',tIn:'fade',tInDuration:.1,mediaStart:0}]};
if(videoOnly)project.brolls[0].audioVol=1;
const file=path.join(dir,'project.json');fs.writeFileSync(file,JSON.stringify(project,null,2));const before=fs.readFileSync(file);
const child=spawn(process.execPath,['editor/tools/xuat-video.mjs',relative,'--quality','final'],{windowsHide:true,stdio:['ignore','pipe','pipe']});const log=fs.createWriteStream(path.join(dir,'render.log'));child.stdout.pipe(log);child.stderr.pipe(log);console.log('Rendering QA '+relative+' PID '+child.pid);
await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error('Render exit '+code+'; '+dir+'/render.log')));});
const status=JSON.parse(fs.readFileSync(path.join(dir,'work/render.json'))),output=status.saved||path.join(dir,status.output),integrity=verifyArtifact(output,status);assert.ok(integrity.sha256);assert.deepEqual(fs.readFileSync(file),before);
const times=[.3,.433333,.533333,1.1,1.2],frames=[];
for(const time of times){const pixels=execFileSync('ffmpeg',['-nostdin','-v','error','-ss',String(time),'-i',output,'-frames:v','1','-vf','scale=1:1','-pix_fmt','rgb24','-f','rawvideo','pipe:1'],{windowsHide:true});assert.equal(pixels.length,3);frames.push({time,r:pixels[0],g:pixels[1],b:pixels[2]});}
assert.ok(frames[0].r>200&&frames[0].b<30);assert.ok(frames[1].b>10&&frames[1].r>10);for(const i of [2,3])assert.ok(frames[i].b>200&&frames[i].r<30);assert.ok(frames[4].r>200&&frames[4].b<30);
const contact=path.join(dir,'contact.jpg');execFileSync('ffmpeg',['-nostdin','-v','error','-i',output,'-vf',"select='eq(n,9)+eq(n,13)+eq(n,16)+eq(n,33)+eq(n,36)',scale=180:320,tile=5x1",'-frames:v','1',contact],{windowsHide:true});
const streams=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_type','-of','json',output],{encoding:'utf8',windowsHide:true})).streams;
if(videoOnly)assert.equal(streams.some(s=>s.codec_type==='audio'),false);
const evidence={project:relative,output,contact,frames,integrity,longName,videoOnly,sourcesLackAudioMetadata:true,brollAudioVol:project.brolls[0].audioVol??0,outputAudio:streams.some(s=>s.codec_type==='audio'),projectUnchanged:true,browserVerified:false,scope:'Synthetic red/blue final validates transition timing and end visibility only; not real product readability, full editor UI or audio quality.'};fs.writeFileSync(longName?'docs/RENDER_LONG_NAME_CLI_SMOKE.json':videoOnly?'docs/SOURCE_AUDIO_PRESENCE_FINAL_SMOKE.json':'docs/BROLL_ENTRANCE_FINAL_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
