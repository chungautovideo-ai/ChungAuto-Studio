// Full QA render from an isolated copy. Does not export the live user project.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {spawn,execFileSync} from 'node:child_process';
import {verifyArtifact} from '../src/services/artifact-integrity.mjs';import {resolveTimeline} from '../editor/lib/build.mjs';
assert.ok(process.argv.includes('--render-local'),'Pass --render-local for local full QA preview.');
assert.equal(fs.existsSync('workspace/settings.json'),false,'Do not copy QA output to a configured external export destination.');
const sourceFlag=process.argv.indexOf('--source-qa'),source=sourceFlag<0?'workspace/content/2026-11-05/contentos-qa-real-codex-q2-7':process.argv[sourceFlag+1];
assert.ok(source?.startsWith('workspace/content/')&&!source.split(/[\\/]/).includes('..')&&path.basename(source).includes('qa-'),'Use a local QA project copy.');
const evidenceFlag=process.argv.indexOf('--evidence'),evidenceFile=evidenceFlag<0?'docs/Q2_CURRENT_PREVIEW_SMOKE.json':process.argv[evidenceFlag+1];
assert.ok(evidenceFile?.startsWith('docs/')&&evidenceFile.endsWith('.json')&&!evidenceFile.includes('..'));
if(evidenceFlag>=0)assert.equal(fs.existsSync(evidenceFile),false,'Preserve previous evidence.');
const original=path.join(source,'project.json'),hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),before=hash(original);
const project=JSON.parse(fs.readFileSync(original)),timeline=resolveTimeline(project),sources=[...new Set([project.source.video,...project.brolls.map(b=>b.src)])],sourceHashes=sources.map(src=>({src,sha256:hash(path.join(source,src))}));
const dir='workspace/content/2026-11-05/qa-current-preview-'+crypto.randomUUID().slice(0,8);fs.mkdirSync(dir,{recursive:true});
for(const src of sources){assert.ok(src.startsWith('inputs/')&&!src.includes('..'));fs.mkdirSync(path.dirname(path.join(dir,src)),{recursive:true});fs.copyFileSync(path.join(source,src),path.join(dir,src));}
fs.mkdirSync(path.join(dir,'work'),{recursive:true});fs.copyFileSync(path.join(source,'work/transcript.json'),path.join(dir,'work/transcript.json'));
fs.writeFileSync(path.join(dir,'project.json'),fs.readFileSync(original));const qaBefore=hash(path.join(dir,'project.json'));
console.log(JSON.stringify({dir,state:'rendering',duration:timeline.tm.total}));
await new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,['editor/tools/xuat-video.mjs',dir,'--quality','draft'],{windowsHide:true,stdio:['ignore','pipe','pipe']});let log='',last=0;
 for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{log=(log+chunk).slice(-7000);if(Date.now()-last>20000){last=Date.now();console.log(JSON.stringify({dir,childPID:child.pid,state:'render-process-output',tail:chunk.toString().replace(/\x1b\[[0-9;?]*[A-Za-z]/g,'').slice(-220)}));}});
 child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error('QA render exit'+code+' '+log)));
});
const state=JSON.parse(fs.readFileSync(path.join(dir,'work/render.json')));assert.equal(state.ok,true);const file=state.saved,sidecar=JSON.parse(fs.readFileSync(file+'.json')),integrity=verifyArtifact(file,sidecar);
assert.equal(hash(original),before);assert.equal(hash(path.join(dir,'project.json')),qaBefore);
for(const item of sourceHashes)assert.equal(hash(path.join(source,item.src)),item.sha256);
const folder=fs.mkdtempSync(path.join(dir,'work/preview-audit-')),times=[.5,4,8.9,9.3,10.5,11.9,13.9,14.3,15.2,15.5,16,17.5,18.2,19,19.2,35,55,80,100,103.8],frames=[];
for(const [index,time] of times.entries()){const target=path.join(folder,String(index).padStart(2,'0')+'.jpg');execFileSync('ffmpeg',['-nostdin','-v','error','-ss',String(time),'-i',file,'-frames:v','1','-vf','scale=216:384','-q:v','3',target],{windowsHide:true});frames.push({time,path:target,brolls:timeline.brolls.filter(b=>time>=b.start&&time<b.start+b.dur).map(b=>b.id)});}
const contact=evidenceFlag<0?'docs/Q2_CURRENT_PREVIEW_CONTACT.jpg':evidenceFile.replace(/\.json$/,'_CONTACT.jpg');execFileSync('ffmpeg',['-nostdin','-v','error','-y','-framerate','1','-i',path.join(folder,'%02d.jpg'),'-vf',"drawtext=text='sample %{n}':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.8,tile=5x4:padding=4:margin=4",'-frames:v','1','-q:v','2',contact],{windowsHide:true});
const evidence={project:dir,workerProject:source,workerProjectUnchanged:true,sourceHashes,qaProjectUnchanged:true,output:file,integrity,duration:sidecar.probe.format.duration,audioLoudness:sidecar.audioLoudness,warnings:sidecar.warnings,contact,frames,visualReviewed:false,audioListened:false,scope:'Complete draft render of isolated QA copy; sparse frame audit and output audio metrics do not establish continuous audiovisual quality, semantic correctness, privacy or production throughput.'};
fs.writeFileSync(evidenceFile,JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify({dir,output:file,contact,audioLoudness:evidence.audioLoudness,sourceAndWorkerProjectUnchanged:true}));
