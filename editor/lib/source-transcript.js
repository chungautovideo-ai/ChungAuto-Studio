// Kept/hidden state and playback speed do not change the virtual source clock.
export function sourceTranscriptClock(project){
 if(project.source?.timeline!=='segments')return null;
 const windows=[];
 for(const s of (project.segments??[]).slice().sort((a,b)=>a.in-b.in)){
  const privacy=s.platePrivacy,normalized=s.colorNormalization||privacy?.originalColorNormalization,src=normalized?.kind==='color-normalization'?normalized.source:privacy?.kind==='plate-privacy'?privacy.source:s.src;
  const offset=(s.mediaStart??0)+(privacy?.kind==='plate-privacy'?privacy.from:0)+(normalized?.kind==='color-normalization'?normalized.from:0)-s.in,last=windows.at(-1);
  if(last&&last.src===src&&Math.abs(last.out-s.in)<1e-6&&Math.abs(last.offset-offset)<1e-6)last.out=s.out;
  else windows.push({src,in:s.in,out:s.out,offset});
 }
 return JSON.stringify(windows);
}
export function sourceTranscriptMatches(project,transcript){
 return project.source?.timeline!=='segments'||transcript?.sourceClock===sourceTranscriptClock(project);
}
