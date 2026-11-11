import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {measureAudioLoudnessSync} from './audio-loudness.mjs';

// AAC may overshoot the preceding loudnorm true-peak target. Attenuate only
// an observed overshoot, with a small margin and at most two re-encodes.
export function ensureEncodedAudioHeadroom(file,measurement,{measure=measureAudioLoudnessSync,encode=execFileSync}={}){
 let current=measurement;const attempts=[];
 for(let n=0;n<2;n++){
  if(current.silent||!Number.isFinite(current.truePeakDbtp)||current.truePeakDbtp<=-1.5)break;
  const gainDb=Math.min(0,-1.5-current.truePeakDbtp-.2),temp=file+'.headroom.mp4';
  try{
   encode('ffmpeg',['-nostdin','-v','error','-y','-i',file,'-map','0:v:0','-map','0:a:0','-c:v','copy','-af',`volume=${gainDb.toFixed(4)}dB`,'-ar','48000','-c:a','aac','-b:a','192k','-movflags','+faststart',temp],{windowsHide:true,stdio:'ignore',timeout:300000});
   const next=measure(temp);
   if(next.silent||!Number.isFinite(next.truePeakDbtp)||next.truePeakDbtp>=current.truePeakDbtp)throw Error('Không xác nhận được giảm đỉnh AAC.');
   fs.renameSync(temp,file);attempts.push({gainDb,beforeDbtp:current.truePeakDbtp,afterDbtp:next.truePeakDbtp});current=next;
  }finally{fs.rmSync(temp,{force:true});}
 }
 return {measurement:current,correction:{method:'measured AAC gain attenuation',attempts,targetDbtp:-1.5,marginDb:.2}};
}
