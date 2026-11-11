import {shiftSegmentZoom} from './source-zoom.js';
import {pinSourceAudioEnvelope,shiftSourceAudioEnvelope} from './source-audio.js';
// Virtual timeline edits must retain each clip's independent source clock.
export function trimSourceSegment(segments, id, side, requested, newId, projectSpeed=1) {
  const sorted = segments.slice().sort((a,b)=>a.in-b.in);
  const index = sorted.findIndex(s=>s.id===id), s=sorted[index];
  if (!s?.src || !Number.isFinite(requested) || !['l','r'].includes(side)) throw new Error('Điểm cắt nguồn không hợp lệ.');
  const rate=Math.max(.25,Math.min(4,Number(s.speed)||Number(projectSpeed)||1));
  pinSourceAudioEnvelope(s,(s.out-s.in)/rate);
  const before=structuredClone(s), start=s.mediaStart??0;
  const previous=sorted[index-1], next=sorted[index+1];
  // Do not consume another source, even when that neighbouring clip is hidden.
  const lower=Math.max(0,s.in-start,previous?.out??0);
  const upper=Math.min(next?.in??Infinity,s.in+(s.mediaInfo?.duration??(start+s.out-s.in))-start);
  const round=v=>Math.round(v*1000)/1000;
  const t=round(side==='l'?Math.max(lower,Math.min(s.out-.2,requested)):Math.min(upper,Math.max(s.in+.2,requested)));
  if(side==='l') {s.in=t;s.mediaStart=round(start+t-before.in);shiftSegmentZoom(s,t-before.in,projectSpeed);shiftSourceAudioEnvelope(s,(t-before.in)/rate);}
  else s.out=t;
  // Retain removed footage as an independently restorable clip, with real metadata.
  if((side==='l'&&t>before.in)||(side==='r'&&t<before.out)) {
    const cut=structuredClone(before);cut.id=newId;cut.keep=false;cut.text='';
    if(side==='l')cut.out=t;
    else {cut.in=t;cut.mediaStart=round(start+t-before.in);delete cut.tIn;shiftSegmentZoom(cut,t-before.in,projectSpeed);shiftSourceAudioEnvelope(cut,(t-before.in)/rate);}
    segments.splice(segments.indexOf(s)+(side==='r'?1:0),0,cut);
  }
  return s;
}
