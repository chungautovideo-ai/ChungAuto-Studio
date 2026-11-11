import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {capcutAudioTags} from '../editor/lib/capcut-audio.mjs';import {verifyArtifact} from '../src/services/artifact-integrity.mjs';
export function verifyShortMusicArtifact(project,saved){
 const sidecar=JSON.parse(fs.readFileSync(saved+'.json'));verifyArtifact(saved,sidecar);
 const snapshot=path.join(project,'work/render-snapshots',sidecar.snapshotId),html=fs.readFileSync(path.join(snapshot,'index.html'),'utf8'),tags=capcutAudioTags(html,/id="music/,snapshot);assert.ok(tags.length>3);for(const tag of tags)assert.ok(tag.from+tag.dur<=1.002);
 const pcm=execFileSync('ffmpeg',['-nostdin','-v','error','-i',saved,'-ac','1','-ar','16000','-f','f32le','pipe:1'],{windowsHide:true,maxBuffer:4*1024*1024});
 const rms=(a,b)=>{let sum=0,n=0;for(let i=Math.floor(a*16000);i<b*16000;i++){sum+=pcm.readFloatLE(i*4)**2;n++;}return Math.sqrt(sum/n);};
 const measurements={afterFirstLoop:rms(1.7,1.8),duringOutro:rms(3.6,3.7),nearEnd:rms(4.9,4.97)};assert.ok(measurements.afterFirstLoop>.01);assert.ok(measurements.duringOutro>.005);assert.ok(measurements.nearEnd<measurements.duringOutro*.2);
 assert.equal(Number(sidecar.probe.format.duration),5);
 return {project,saved,actualFinalArtifact:true,quality:sidecar.quality,sourceMusicDuration:1,totalDuration:5,musicTags:tags.length,sourceBoundsValid:true,measurements,sha256:sidecar.sha256,bytes:sidecar.bytes,snapshotId:sidecar.snapshotId,audioLoudness:sidecar.audioLoudness,integrityVerified:true,noPaidProvider:true,limits:'Synthetic tone final artifact and sampled RMS from saved render snapshot; not listening acceptance, real music transition quality or every preview/CapCut editor behavior.'};
}
