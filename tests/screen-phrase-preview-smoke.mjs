import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync,spawn} from 'node:child_process';
import {resolveTimeline} from '../editor/lib/build.mjs';import {verifyArtifact} from '../src/services/artifact-integrity.mjs';
assert.ok(process.argv.includes('--render-local'),'Pass --render-local for isolated QA.');assert.equal(fs.existsSync('workspace/settings.json'),false);
const source='workspace/content/2026-11-05/qa-codex-screen-85251d',bytes=fs.readFileSync(path.join(source,'project.json')),p=JSON.parse(bytes),dir='workspace/content/2026-11-05/qa-screen-phrase-preview-'+crypto.randomBytes(3).toString('hex');
const from=15.5,to=17.5;
// Clip overlays explicitly: the normal full build assumes at is inside kept
// footage; simply dropping earlier A-roll would clamp old overlays to zero.
assert.ok(p.segments.every(s=>!s.src&&(s.mediaStart==null||s.mediaStart===s.in)&&(!s.speed||s.speed===1)));
for(const key of ['texts','blocks','zooms','scenes','vfx'])p[key]=(p[key]||[]).filter(item=>item.at>=from&&item.at<to);
p.brolls=p.brolls.filter(item=>item.at<to&&item.at+item.dur>from).map(item=>{const start=Math.max(from,item.at),end=Math.min(to,item.at+item.dur);return {...item,at:start,dur:end-start,mediaStart:(item.mediaStart||0)+(start-item.at)*(item.speed||1)};});
for(const src of new Set([p.source.video,...p.brolls.map(b=>b.src)])){assert.ok(src.startsWith('inputs/')&&!src.includes('..'));fs.mkdirSync(path.dirname(path.join(dir,src)),{recursive:true});fs.copyFileSync(path.join(source,src),path.join(dir,src));}
fs.mkdirSync(path.join(dir,'work'));fs.copyFileSync(path.join(source,'work/transcript.json'),path.join(dir,'work/transcript.json'));
// All segments in this QA use the primary source with natural in/out timing.
p.segments=p.segments.filter(s=>s.keep!==false&&s.out>from&&s.in<to).map(s=>({...s,in:Math.max(s.in,from),out:Math.min(s.out,to)}));
const snapshot=JSON.stringify(p,null,2);fs.writeFileSync(path.join(dir,'project.json'),snapshot);const timing=resolveTimeline(p).brolls.find(b=>b.id==='b-screen');assert.ok(timing);assert.ok(timing.start>=0&&timing.start+timing.dur<=2);
let log='';const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['editor/tools/xuat-video.mjs',dir,'--quality','draft'],{windowsHide:true,stdio:['ignore','pipe','pipe']});for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>log+=chunk);child.once('error',reject);child.once('close',resolve);});
fs.writeFileSync(path.join(dir,'work/qa-export.log'),log);const state=JSON.parse(fs.readFileSync(path.join(dir,'work/render.json')));assert.equal(code,0);assert.equal(state.ok,true);verifyArtifact(state.saved,JSON.parse(fs.readFileSync(state.saved+'.json')));
const frames=[{name:'before',time:timing.start-.06},{name:'screen-start',time:timing.start+.06},{name:'screen-end',time:timing.start+timing.dur-.06},{name:'next-topic',time:timing.start+timing.dur+.06}];
for(const [i,frame] of frames.entries()){frame.path=path.join(dir,'work',String(i)+'.jpg');execFileSync('ffmpeg',['-nostdin','-v','error','-ss',String(frame.time),'-i',state.saved,'-frames:v','1','-vf','scale=270:480',frame.path],{windowsHide:true});}
const contact='docs/SCREEN_PHRASE_PREVIEW_CONTACT.jpg';execFileSync('ffmpeg',['-nostdin','-v','error','-y','-framerate','1','-i',path.join(dir,'work/%d.jpg'),'-vf','tile=4x1','-frames:v','1',contact],{windowsHide:true});
assert.deepEqual(fs.readFileSync(path.join(source,'project.json')),bytes);assert.equal(fs.readFileSync(path.join(dir,'project.json'),'utf8'),snapshot);
const evidence={project:dir,sourceQA:source,sourceProjectUnchanged:true,output:state.saved,contact,frames,screenTiming:timing,integrityVerified:true,visualReviewed:false,audioListened:false,scope:'Two-second QA excerpt from project15.5–17.5 with prior B-roll tail clipped and earlier graphic cues omitted. Worker screen choice/timing intact; sparse transition frames only, not continuous readability or fullvideo quality.'};fs.writeFileSync('docs/SCREEN_PHRASE_PREVIEW_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify({project:dir,output:state.saved,contact,frames}));
