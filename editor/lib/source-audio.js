export function normalizeSourceAudioEnvelope(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['duration','offset','fadeIn','fadeOut'].includes(k))||!['duration','offset','fadeIn','fadeOut'].every(k=>Number.isFinite(value[k]))||value.duration<=0||value.duration>86400||Math.abs(value.offset)>86400||value.fadeIn<0||value.fadeOut<0||value.fadeIn>10||value.fadeOut>10||value.fadeIn+value.fadeOut>value.duration+1e-9)throw new Error('Đường âm lượng nguồn không hợp lệ.');
 return {...value};
}
export function pinSourceAudioEnvelope(segment,duration){
 if(segment.audioEnvelope)return;
 const fadeIn=segment.audioFadeIn??.02,fadeOut=segment.audioFadeOut??.02;
 segment.audioEnvelope=normalizeSourceAudioEnvelope({duration,offset:0,fadeIn,fadeOut});
}
export function shiftSourceAudioEnvelope(segment,delta){
 if(segment.audioEnvelope)segment.audioEnvelope=normalizeSourceAudioEnvelope({...segment.audioEnvelope,offset:segment.audioEnvelope.offset+delta});
}
export function sourceAudioParts(envelope,length){
 const e=normalizeSourceAudioEnvelope(envelope),gain=t=>Math.max(0,Math.min(1,e.fadeIn?t/e.fadeIn:1,e.fadeOut?(e.duration-t)/e.fadeOut:1));
 const cuts=[0,length,...[0,e.fadeIn,e.duration-e.fadeOut,e.duration].map(t=>t-e.offset).filter(t=>t>0&&t<length)].sort((a,b)=>a-b),parts=[];
 for(let i=1;i<cuts.length;i++){
  const from=cuts[i-1],duration=cuts[i]-from;if(duration<1e-9)continue;
  const a=gain(e.offset+from),b=gain(e.offset+cuts[i]),bed=Math.min(a,b),difference=Math.abs(b-a);
  if(bed>1e-9)parts.push({from,duration,gain:bed,fadeIn:0,fadeOut:0});
  if(difference>1e-9)parts.push({from,duration,gain:difference,fadeIn:b>a?duration:0,fadeOut:b<a?duration:0});
 }
 return parts;
}
