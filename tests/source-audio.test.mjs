import test from 'node:test';import assert from 'node:assert/strict';
import {sourceAudioParts,normalizeSourceAudioEnvelope} from '../editor/lib/source-audio.js';
import {trimSourceSegment} from '../editor/lib/segment-trim.js';
test('audio envelope composes exact original linear gain across trimmed attack/plateau/release',()=>{
 for(const offset of [0,.2,.7,1.4,1.9]){
  const parts=sourceAudioParts({duration:2,offset,fadeIn:.8,fadeOut:.6},2-offset);
  for(let t=.001;t<2-offset;t+=.017){const gain=parts.reduce((sum,p)=>{if(t<p.from||t>=p.from+p.duration)return sum;const x=(t-p.from)/p.duration;return sum+p.gain*(p.fadeIn?x:p.fadeOut?1-x:1);},0),expected=Math.max(0,Math.min(1,(t+offset)/.8,(2-t-offset)/.6));assert.ok(Math.abs(gain-expected)<1e-9);}
 }
 assert.throws(()=>normalizeSourceAudioEnvelope({duration:1,offset:0,fadeIn:1,fadeOut:1}));
});
test('source trims retain original audio clock and avoid fades exceeding newly shortened clip',()=>{
 const s={id:'x',src:'x.mp4',in:0,out:4,speed:2,mediaStart:0,mediaInfo:{duration:4},audioFadeIn:1,audioFadeOut:1};
 const segs=[s];trimSourceSegment(segs,'x','l',1,'removed');assert.deepEqual(s.audioEnvelope,{duration:2,offset:.5,fadeIn:1,fadeOut:1});assert.equal(segs[0].audioEnvelope.offset,0);
 trimSourceSegment(segs,'x','r',2,'tail');assert.equal(segs.at(-1).audioEnvelope.offset,1);assert.ok(sourceAudioParts(s.audioEnvelope,.5).length);
});
