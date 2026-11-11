// Isolated synthetic QA, never a user project or external destination.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {verifyArtifact} from '../src/services/artifact-integrity.mjs';
assert.ok(process.argv.includes('--render-local'),'Pass --render-local for isolated SFX export QA.');
assert.equal(fs.existsSync('workspace/settings.json'),false,'External export settings require separate QA isolation.');
const dir=path.resolve('workspace/content/2026-11-05/qa-sfx-tail-'+crypto.randomUUID().slice(0,8));
fs.mkdirSync(path.join(dir,'inputs'),{recursive:true});fs.mkdirSync(path.join(dir,'work'));
const input=path.join(dir,'inputs/source.mp4');
execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','color=c=0x222222:s=320x568:r=30:d=3','-c:v','libx264','-pix_fmt','yuv420p',input],{windowsHide:true});
const project={title:'SFX tail QA',source:{video:'inputs/source.mp4',hasAudio:false},segments:[{id:'a',in:0,out:3}],captions:{enabled:false},audio:{autoSfx:false,music:'',sfxVolume:.5,sfx:[{kind:'pop',at:0},{kind:'pop',at:1.5},{kind:'pop',at:2.85}]}};
const projectFile=path.join(dir,'project.json');fs.writeFileSync(projectFile,JSON.stringify(project,null,2));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sourceHash=hash(input),projectHash=hash(projectFile);
const logFile=path.join(dir,'work/sfx-export.log'),logStream=fs.createWriteStream(logFile);let log='';
console.log(JSON.stringify({dir,state:'rendering'}));
const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['editor/tools/xuat-video.mjs',dir,'--quality','draft'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
 for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{log+=chunk.toString();logStream.write(chunk);});child.once('error',reject);child.once('close',resolve);});
await new Promise(resolve=>logStream.end(resolve));
const state=JSON.parse(fs.readFileSync(path.join(dir,'work/render.json'))),evidence={project:dir,exitCode:code,renderOk:state.ok,log:logFile,sourceUnchanged:hash(input)===sourceHash,projectUnchanged:hash(projectFile)===projectHash,slotWarnings:log.split(/\r?\n/).filter(line=>/slot shortened|shorter than|but.*data-duration/i.test(line)),audioListened:false};
if(code===0&&state.ok){
 const sidecar=JSON.parse(fs.readFileSync(state.saved+'.json'));verifyArtifact(state.saved,sidecar);
 evidence.output=state.saved;evidence.integrityVerified=true;evidence.audioLoudness=sidecar.audioLoudness;
 const raw=execFileSync('ffmpeg',['-nostdin','-v','error','-i',state.saved,'-vn','-ac','1','-ar','48000','-f','f32le','pipe:1'],{windowsHide:true,maxBuffer:4*1024*1024});
 function rms(from,to){let sum=0,n=0;for(let i=Math.floor(from*48000);i<Math.min(Math.floor(to*48000),raw.length/4);i++){const v=raw.readFloatLE(i*4);sum+=v*v;n++;}return Math.sqrt(sum/n);}
 evidence.cues=[[0,.3],[1.5,1.8],[2.85,3]].map(([from,to])=>({from,to,rms:rms(from,to)}));
 evidence.quiet=[[.6,1],[2,2.4]].map(([from,to])=>({from,to,rms:rms(from,to)}));
 assert.ok(evidence.cues.every(item=>item.rms>1e-5),'All three encoded cues must be audible in waveform');
 assert.ok(evidence.quiet.every(item=>item.rms<Math.min(...evidence.cues.map(c=>c.rms))*.01),'No sound leaked into quiet windows');
}
fs.writeFileSync('docs/SFX_TAIL_RENDER_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
assert.equal(code,0);assert.equal(state.ok,true);assert.deepEqual(evidence.slotWarnings,[]);assert.equal(evidence.sourceUnchanged,true);assert.equal(evidence.projectUnchanged,true);
