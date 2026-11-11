import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {transcribeProject} from '../src/services/project-transcription.mjs';import {probeMediaMetadata} from '../src/services/media-metadata.mjs';import {prepareTools} from '../editor/lib/system.mjs';import {makeTimemap} from '../editor/lib/timemap.js';
const root=process.cwd(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-real-asr-'));prepareTools(root);
try{
 const ps=path.join(dir,'speech.ps1');fs.writeFileSync(ps,`Add-Type -AssemblyName System.Speech
$voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice.Rate = -1
$voice.SetOutputToWaveFile('${path.join(dir,'a.wav').replaceAll("'","''")}')
$voice.Speak('Welcome to our video studio. We create great videos every day.')
$voice.SetOutputToNull()
$voice.SetOutputToWaveFile('${path.join(dir,'b.wav').replaceAll("'","''")}')
$voice.Speak('This is a new production. The camera is ready for action.')
$voice.Dispose()
`);
 execFileSync('powershell',['-NoProfile','-ExecutionPolicy','Bypass','-File',ps],{windowsHide:true});
 const metadata=[];for(const name of ['a','b']){execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=blue:s=160x90:r=30','-i',path.join(dir,name+'.wav'),'-shortest','-c:v','libx264','-c:a','aac',path.join(dir,name+'.mp4')],{windowsHide:true});metadata.push(await probeMediaMetadata(path.join(dir,name+'.mp4')));}
 const a=metadata[0].duration,b=metadata[1].duration,p={source:{timeline:'segments'},segments:[{id:'a',src:'a.mp4',in:0,out:a,mediaStart:0,speed:2},{id:'b',src:'b.mp4',in:a,out:a+b,mediaStart:0},{id:'repeat',src:'a.mp4',in:a+b,out:a+b+a,mediaStart:0,keep:false}]};fs.writeFileSync(path.join(dir,'project.json'),JSON.stringify(p));
 const data=await transcribeProject(root,dir,{language:'en',onProgress:p=>{if(p.pct===100)console.log(p.phase);}});
 const first=data.words.filter(w=>w.start<a),second=data.words.filter(w=>w.start>=a&&w.start<a+b),repeat=data.words.filter(w=>w.start>=a+b);assert.ok(first.length>4&&second.length>4);assert.equal(first.length,repeat.length);assert.ok(first.every(w=>w.source.src==='a.mp4'));assert.ok(second.every(w=>w.source.src==='b.mp4'));const tm=makeTimemap(p);assert.ok(Math.abs(tm.srcToOut(second[0].start)-(a/2+second[0].source.start))<1e-7);
 const evidence={syntheticSpeech:'Windows System.Speech en, local',engine:data.engine,language:data.language,first:first.map(w=>w.word).join(' '),second:second.map(w=>w.word).join(' '),words:data.words.length,repeatWords:repeat.length,sourceDurations:[a,b],outputDuration:tm.total,secondFirstOutput:tm.srcToOut(second[0].start),noPaidProvider:true,limits:'Local CLI/service with actual Whisper; no browser button/captions render or Vietnamese human transcription accuracy benchmark.'};fs.writeFileSync('docs/PROJECT_TRANSCRIPTION_REAL_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(evidence);
}finally{fs.rmSync(dir,{recursive:true,force:true});}
