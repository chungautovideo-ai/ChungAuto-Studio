// Local synthetic media only; no provider, account or publication.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync,spawn} from 'node:child_process';
import {buildProject} from '../editor/lib/build.mjs';
const dir=path.resolve('workspace/content/2026-11-03/contentos-smoke-music-duck'+(process.env.CONTENTOS_SMOOTH_DUCK==='1'?'-smooth':'')+'-render');
fs.mkdirSync(path.join(dir,'inputs'),{recursive:true});fs.mkdirSync(path.join(dir,'renders'),{recursive:true});
const ff=(args)=>execFileSync('ffmpeg',['-nostdin','-v','error',...args],{windowsHide:true});
ff(['-y','-f','lavfi','-i','color=c=0x204060:s=360x640:r=30:d=8','-c:v','libx264','-pix_fmt','yuv420p',path.join(dir,'inputs/source.mp4')]);
ff(['-y','-f','lavfi','-i','sine=frequency=440:duration=2','-ar','48000',path.join(dir,'inputs/narration.wav')]);
ff(['-y','-f','lavfi','-i','sine=frequency=880:duration=8','-ar','48000',path.join(dir,'inputs/music.wav')]);
const project={version:1,title:'ContentOS-Smoke Narration Render',format:'9:16',source:{video:'inputs/source.mp4',duration:8,width:360,height:640,hasAudio:false},segments:[{id:'s1',in:0,out:8,keep:true}],audio:{voice:0,music:'inputs/music.wav',musicVolume:.4,duckNarration:true,duckLevel:.25,duckFade:process.env.CONTENTOS_SMOOTH_DUCK==='1'?.4:0,sfx:[],autoSfx:false,sfxLevel:'tat',clips:[{id:'qa-narration',src:'inputs/narration.wav',at:3,from:0,dur:2,vol:0.8}]},texts:[],blocks:[],brolls:[],zooms:[],scenes:[],captions:{lines:[]}};
fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify(project,null,2));buildProject(dir,project);
const invoke=async(args)=>{
 const child=spawn(process.platform==='win32'?'npx.cmd':'npx',['--offline','hyperframes@0.9.6',...args],{cwd:dir,windowsHide:true,shell:process.platform==='win32',env:{...process.env,FORCE_COLOR:'0'}});
 let log='';child.stdout.on('data',d=>{log+=d;process.stdout.write(d);});child.stderr.on('data',d=>{log+=d;process.stderr.write(d);});
 const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});fs.writeFileSync(path.join(dir,`qa-${args[0]}.log`),log);assert.equal(code,0,args[0]+' failed');return log;
};
await invoke(['lint']);await invoke(['inspect','--samples','3']);await invoke(['render','--quality','draft','--fps','30','--workers','1','--output','renders/music-duck-qa.mp4']);
const file=path.join(dir,'renders/music-duck-qa.mp4');
const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_type,width,height:format=duration','-of','json',file],{encoding:'utf8',windowsHide:true}));
assert.ok(probe.streams.some(s=>s.codec_type==='audio'));assert.ok(probe.streams.some(s=>s.codec_type==='video'));assert.ok(Math.abs(Number(probe.format.duration)-8)<0.15);

const pcm=ff(['-i',file,'-map','0:a:0','-af','bandpass=f=880:width_type=h:width=50','-ac','1','-ar','16000','-f','f32le','pipe:1']);
function rms(start,end){let sum=0,count=0;for(let i=Math.floor(start*16000);i<Math.min(pcm.length/4,end*16000);i++){sum+=pcm.readFloatLE(i*4)**2;count++;}return Math.sqrt(sum/count);}
const before=rms(2,2.6),during=rms(3.6,4.4),after=rms(5.3,5.8);assert.ok(before>.01&&after>.01);const ratio=during/before;assert.ok(ratio>.15&&ratio<.35,JSON.stringify({before,during,after,ratio}));assert.ok(after/before>.8&&after/before<1.2);
let ramp;
if(project.audio.duckFade){ramp={attack:rms(2.76,2.84)/before,release:rms(5.16,5.24)/before};assert.ok(ramp.attack>.4&&ramp.attack<.85,JSON.stringify(ramp));assert.ok(ramp.release>.4&&ramp.release<.85,JSON.stringify(ramp));}
const evidence={smoothFadeSeconds:project.audio.duckFade,ramp,syntheticOnly:true,engine:'HyperFrames 0.9.6',render:true,probe,beforeMusicRms:before,duringMusicRms:during,afterMusicRms:after,ratio,output:file,limits:'8-second draft, clip-based ducking only; no speech detection/listening/long-loop production benchmark.'};fs.writeFileSync(project.audio.duckFade?'docs/MUSIC_DUCK_SMOOTH_RENDER_SMOKE.json':'docs/MUSIC_DUCK_RENDER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);
