import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {verifyArtifact} from '../src/services/artifact-integrity.mjs';import {resolveTimeline} from '../editor/lib/build.mjs';import {projectRevision} from '../src/services/project-revisions.mjs';
const dir='workspace/content/2026-11-05/contentos-qa-broll-overlap-2',reportFile='docs/Q2_REVISED_FINAL_AUDIT.json';assert.ok(!fs.existsSync(reportFile),'Preserve existing evidence');
const state=JSON.parse(fs.readFileSync(path.join(dir,'work/render.json')));assert.equal(state.running,false);assert.equal(state.ok,true);const file=state.saved,sidecar=JSON.parse(fs.readFileSync(file+'.json'));const integrity=verifyArtifact(file,sidecar);assert.equal(sidecar.revision,projectRevision(path.join(dir,'project.json')));
const timeline=resolveTimeline(JSON.parse(fs.readFileSync(path.join(dir,'project.json')))),folder=fs.mkdtempSync(path.join(dir,'work/final-audit-')),frames=[];
// Deliberately sample both sides of each boundary as well as inside each shot.
const times=[0.5,3,13.9,14.5,15.45,15.6,15.95,16.2,16.35,18.2,19.3,20.05,20.5,21.1,21.3,40,70,100,105.8];
for(const [index,time] of times.entries()){
 const out=path.join(folder,String(index).padStart(2,'0')+'.jpg');execFileSync('ffmpeg',['-nostdin','-v','error','-ss',String(time),'-i',file,'-frames:v','1','-vf','scale=216:384','-q:v','3',out],{windowsHide:true});
 frames.push({time,path:out,brolls:timeline.brolls.filter(b=>time>=b.start&&time<b.start+b.dur).map(b=>b.id)});
}
const contact='docs/Q2_REVISED_FINAL_CONTACT.jpg';assert.ok(!fs.existsSync(contact));execFileSync('ffmpeg',['-nostdin','-v','error','-framerate','1','-i',path.join(folder,'%02d.jpg'),'-vf',"drawtext=text='sample %{n}':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.8,tile=5x4:padding=4:margin=4",'-frames:v','1','-q:v','2',contact],{windowsHide:true});
const report={project:dir,output:file,integrity,snapshotId:sidecar.snapshotId,revision:sidecar.revision,duration:sidecar.probe.format.duration,audioLoudness:sidecar.audioLoudness,audioHeadroom:sidecar.audioHeadroom,warnings:sidecar.warnings,contact,frames,brolls:timeline.brolls.map(b=>({id:b.id,start:b.start,end:b.start+b.dur,mediaStart:b.mediaStart})),visualReviewed:false,listened:false,limits:'Full final render integrity plus sparse decoded frames. No continuous visual/audio review, color/person/plate acceptance or production throughput proof.'};fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
