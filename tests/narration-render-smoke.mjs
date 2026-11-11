// Local synthetic media only; no provider, account or publication.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync,spawn} from 'node:child_process';
import {buildProject} from '../editor/lib/build.mjs';
const dir=path.resolve('workspace/content/2026-11-03/contentos-smoke-narration-render');
fs.mkdirSync(path.join(dir,'inputs'),{recursive:true});fs.mkdirSync(path.join(dir,'renders'),{recursive:true});
const ff=(args)=>execFileSync('ffmpeg',['-nostdin','-v','error',...args],{windowsHide:true});
ff(['-y','-f','lavfi','-i','color=c=0x204060:s=360x640:r=30:d=3','-c:v','libx264','-pix_fmt','yuv420p',path.join(dir,'inputs/source.mp4')]);
ff(['-y','-f','lavfi','-i','sine=frequency=440:duration=1','-ar','48000',path.join(dir,'inputs/narration.wav')]);
const project={version:1,title:'ContentOS-Smoke Narration Render',format:'9:16',source:{video:'inputs/source.mp4',duration:3,width:360,height:640,hasAudio:false},segments:[{id:'s1',in:0,out:3,keep:true}],audio:{voice:0,music:'',sfx:[],autoSfx:false,sfxLevel:'tat',clips:[{id:'qa-narration',src:'inputs/narration.wav',at:0.75,from:0,dur:1,vol:0.8}]},texts:[],blocks:[],brolls:[],zooms:[],scenes:[],captions:{lines:[]}};
fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify(project,null,2));buildProject(dir,project);
const invoke=async(args)=>{
 const child=spawn(process.platform==='win32'?'npx.cmd':'npx',['--offline','hyperframes@0.9.6',...args],{cwd:dir,windowsHide:true,shell:process.platform==='win32',env:{...process.env,FORCE_COLOR:'0'}});
 let log='';child.stdout.on('data',d=>{log+=d;process.stdout.write(d);});child.stderr.on('data',d=>{log+=d;process.stderr.write(d);});
 const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});fs.writeFileSync(path.join(dir,`qa-${args[0]}.log`),log);assert.equal(code,0,args[0]+' failed');return log;
};
await invoke(['lint']);await invoke(['inspect','--samples','3']);await invoke(['render','--quality','draft','--fps','30','--workers','1','--output','renders/narration-qa.mp4']);
const file=path.join(dir,'renders/narration-qa.mp4');
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_type,width,height:format=duration','-of','json',file],{encoding:'utf8',windowsHide:true}));
assert.ok(probe.streams.some(s=>s.codec_type==='audio'));assert.ok(probe.streams.some(s=>s.codec_type==='video'));assert.ok(Math.abs(Number(probe.format.duration)-3)<0.15);
const pcm=ff(['-i',file,'-map','0:a:0','-ac','1','-ar','16000','-f','f32le','pipe:1']);
const sample=i=>pcm.readFloatLE(i*4),rate=16000;
function rms(start,end){let sum=0,count=0;for(let i=Math.floor(start*rate);i<Math.min(pcm.length/4,end*rate);i++){sum+=sample(i)**2;count++;}return Math.sqrt(sum/count);}
const before=rms(0.1,0.5),during=rms(0.9,1.5),after=rms(2,2.5);assert.ok(during>0.01&&during>before*10&&during>after*10,JSON.stringify({before,during,after}));
let crossings=0;for(let i=16001;i<24000;i++)if(sample(i-1)<=0&&sample(i)>0)crossings++;
const frequency=crossings/0.5;assert.ok(Math.abs(frequency-440)<8,'Narration tone frequency '+frequency);
const evidence={syntheticOnly:true,engine:'HyperFrames 0.9.6',lint:true,inspect:true,render:true,probe,beforeRms:before,duringRms:during,afterRms:after,measuredFrequency:frequency,output:file,limits:'3-second draft verifies synthetic tone placement and media tracks; no human speech listening or production benchmark.'};
fs.writeFileSync(new URL('../docs/NARRATION_RENDER_SMOKE.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');console.log(evidence);
