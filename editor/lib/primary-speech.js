import {makeTimemap} from './timemap.js';
import {sourceTranscriptMatches} from './source-transcript.js';

// Transcript evidence, not waveform speech detection. Recompute after every edit.
export function primarySpeechWindows(project,transcript){
 if(!transcript||!Array.isArray(transcript.words)||!sourceTranscriptMatches(project,transcript))throw new Error('Hạ nhạc A-roll cần transcript đúng nguồn. Nhận giọng lại hoặc tắt lựa chọn này.');
 const tm=makeTimemap(project),ranges=[];
 if(project.source?.hasAudio===false||Number(project.audio?.voice??1)<=0)return [];
 for(const word of transcript.words){
  const start=Number(word.start),end=Number(word.end),text=String(word.word??word.text??'').trim();
  if(!text||!Number.isFinite(start)||!Number.isFinite(end)||end<=start)continue;
  for(const seg of tm.segs){
   if(seg.mediaInfo?.hasAudio===false||Number(seg.audioVolume??1)<=0)continue;
   const a=Math.max(start,seg.in),b=Math.min(end,seg.out);if(b<=a)continue;
   ranges.push([seg.outStart+(a-seg.in)/seg.rate,seg.outStart+(b-seg.in)/seg.rate]);
  }
 }
 ranges.sort((a,b)=>a[0]-b[0]);const merged=[];
 for(const [start,end] of ranges){const last=merged.at(-1);if(last&&start-last[1]<=.18)last[1]=Math.max(last[1],end);else merged.push([start,end]);}
 return merged.map(([start,end])=>({start,duration:end-start}));
}
