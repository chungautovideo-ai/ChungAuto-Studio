// Explicit narration-clip ducking, in output seconds. No speech detection.
export function musicDuckParts(start,duration,windows,{enabled=false,level=.25}={}){
 const end=start+duration;if(!Number.isFinite(start)||!Number.isFinite(duration)||duration<=0)return [];
 if(!enabled)return [{start,duration,offset:0,gain:1}];
 const gain=Number.isFinite(Number(level))?Math.max(0,Math.min(1,Number(level))):.25;
 const ranges=windows.filter(w=>Number.isFinite(w.start)&&Number.isFinite(w.duration)&&w.duration>0).map(w=>[Math.max(start,w.start),Math.min(end,w.start+w.duration)]).filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0]);
 const merged=[];for(const r of ranges){const last=merged.at(-1);if(last&&r[0]<=last[1])last[1]=Math.max(last[1],r[1]);else merged.push(r);}
 const parts=[];let cursor=start;const add=(a,b,g)=>{if(b>a)parts.push({start:a,duration:b-a,offset:a-start,gain:g});};
 for(const [a,b] of merged){add(cursor,a,1);add(a,b,gain);cursor=b;}add(cursor,end,1);return parts;
}

// Additive, phase-aligned music layers: low bed plus faded unducked regions.
export function smoothMusicDuckParts(start,duration,windows,{level=.25,fade=.2}={}){
 const parts=musicDuckParts(start,duration,windows,{enabled:true,level});
 if(!parts.some(p=>p.gain<1))return parts;
 const low=Math.max(0,Math.min(1,Number.isFinite(Number(level))?Number(level):.25));
 const seconds=Math.max(0,Math.min(2,Number(fade)||0));
 if(!seconds)return parts;
 const result=[{start,duration,offset:0,gain:low,bed:true}];
 for(const part of parts.filter(p=>p.gain===1)){
  const left=part.start>start+1e-6,right=part.start+part.duration<start+duration-1e-6;
  const available=part.duration/(left&&right?2:1);
  result.push({...part,gain:1-low,overlay:true,fadeIn:left?Math.min(seconds,available):0,fadeOut:right?Math.min(seconds,available):0});
 }
 return result;
}
