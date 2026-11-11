import test from 'node:test';import assert from 'node:assert/strict';
import {sourceTranscriptClock,sourceTranscriptMatches} from '../editor/lib/source-transcript.js';
test('transcript stays valid across split, hide, speed and trim-retained windows but rejects slip/replacement',()=>{
 const p={source:{timeline:'segments'},segments:[{src:'a',in:0,out:2,mediaStart:1},{src:'b',in:2,out:3,mediaStart:0}]},transcript={sourceClock:sourceTranscriptClock(p)};
 const split=structuredClone(p);split.segments.splice(0,1,{src:'a',in:0,out:1,mediaStart:1,speed:2,keep:false},{src:'a',in:1,out:2,mediaStart:2});assert.ok(sourceTranscriptMatches(split,transcript));
 split.segments[1].mediaStart=2.2;assert.equal(sourceTranscriptMatches(split,transcript),false);assert.equal(sourceTranscriptMatches(p,{words:[]}),false);
 assert.ok(sourceTranscriptMatches({source:{video:'legacy.mp4'}},{words:[]}));
});
